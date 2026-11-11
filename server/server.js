import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { query } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.includes('replace-with')) {
  throw new Error('JWT_SECRET phải được cấu hình và có ít nhất 32 ký tự.')
}

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(origin => origin.trim()).filter(Boolean)
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Origin chưa được cho phép bởi cấu hình CORS.'))
  }
}))
app.use(express.json({ limit: '10mb' }))

// Helper map Product row to Frontend format
const mapProductRow = (row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  category: row.category_id,
  bassSize: row.bass_size,
  powerRMS: row.power_rms,
  powerPeak: row.power_peak,
  price: Number(row.price),
  originalPrice: Number(row.original_price),
  roomSize: row.room_size,
  badge: row.badge,
  inStock: row.in_stock,
  rating: Number(row.rating),
  reviewsCount: row.reviews_count,
  image: row.image_url,
  videoUrl: row.video_url,
  videoTitle: row.video_title,
  matchingAmplifier: row.matching_amplifier,
  shortDesc: row.short_desc,
  specs: row.specs || {},
  gifts: row.gifts || []
})

// Helper map Lead row to Frontend format
const mapLeadRow = (row) => ({
  id: row.id,
  createdAt: row.created_at ? new Date(row.created_at).toISOString().slice(0, 16).replace('T', ' ') : '',
  name: row.name,
  phone: row.phone,
  address: row.address,
  interest: row.interest,
  roomInfo: row.room_info || '',
  status: row.status,
  appointmentDate: row.appointment_date ? new Date(row.appointment_date).toISOString().slice(0, 16) : '',
  deposit: Number(row.deposit || 0),
  dealValue: Number(row.deal_value || 0),
  note: row.notes || ''
})

// Middleware xác thực Admin JWT
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập quản trị viên' })
  }
  const token = authHeader.split(' ')[1]
  let decoded
  try {
    decoded = jwt.verify(token, JWT_SECRET)
  } catch {
    return res.status(401).json({ success: false, message: 'Phiên làm việc hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.' })
  }
  try {
    const result = await query('SELECT id, username, full_name, role, is_active, COALESCE(auth_version, 0) AS auth_version FROM admins WHERE id = $1', [decoded.id])
    const admin = result.rows[0]
    if (!admin || !admin.is_active) {
      return res.status(401).json({ success: false, message: 'Tài khoản đã bị khóa hoặc không còn tồn tại.' })
    }
    if (Number(admin.auth_version ?? 0) !== Number(decoded.authVersion ?? 0)) {
      return res.status(401).json({ success: false, message: 'Tài khoản đã thay đổi. Vui lòng đăng nhập lại.' })
    }
    req.admin = { id: admin.id, username: admin.username, role: admin.role, name: admin.full_name }
    next()
  } catch (err) {
    console.error('[authenticateAdmin] DB error:', err.message)
    return res.status(500).json({ success: false, message: 'Không thể xác thực tài khoản lúc này.' })
  }
}

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.admin?.role)) {
    return res.status(403).json({ success: false, message: 'Tài khoản không có quyền thực hiện thao tác này.' })
  }
  next()
}

const validPhone = (phone) => /^\+?[0-9][0-9\s().-]{7,19}$/.test(String(phone || '').trim())
const validMoney = (value) => (typeof value === 'number' || typeof value === 'string' && value.trim() !== '') && Number.isSafeInteger(Number(value)) && Number(value) >= 0
const validOptionalText = (value, maxLength) => value === undefined || value === null || typeof value === 'string' && value.length <= maxLength
const validRoles = new Set(['SUPER_ADMIN', 'SALES', 'INVENTORY'])
const validCategories = new Set(['loa-full', 'loa-sub', 'cuc-day', 'vang-so-micro', 'loa-di-dong'])

const loginAttempts = new Map()
const loginRateLimit = (req, res, next) => {
  const now = Date.now()
  for (const [ip, attempt] of loginAttempts) if (attempt.expiresAt <= now) loginAttempts.delete(ip)
  const key = req.ip
  const current = loginAttempts.get(key)
  if (!current || current.expiresAt <= now) {
    loginAttempts.set(key, { count: 1, expiresAt: now + 15 * 60 * 1000 })
    return next()
  }
  if (current.count >= 10) {
    return res.status(429).json({ success: false, message: 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau 15 phút.' })
  }
  current.count += 1
  next()
}

// ==========================================
// 0. HEALTH CHECK
// ==========================================
app.get('/api/v1/health', async (req, res) => {
  try {
    const dbCheck = await query('SELECT NOW() as server_time')
    res.json({
      success: true,
      status: 'OK',
      database: 'Aiven PostgreSQL Connected',
      time: dbCheck.rows[0].server_time
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ==========================================
// 1. PUBLIC APIS (DÀNH CHO KHÁCH HÀNG)
// ==========================================

// Lấy danh sách sản phẩm
app.get('/api/v1/products', async (req, res) => {
  try {
    const { category, search } = req.query
    let sql = 'SELECT * FROM products WHERE 1=1'
    const params = []

    if (category && category !== 'all') {
      params.push(category)
      sql += ` AND category_id = $${params.length}`
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`)
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(short_desc) LIKE $${params.length})`
    }

    sql += ' ORDER BY created_at DESC'
    const result = await query(sql, params)

    res.json({
      success: true,
      data: result.rows.map(mapProductRow)
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Lấy chi tiết 1 sản phẩm
app.get('/api/v1/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await query('SELECT * FROM products WHERE id = $1 OR slug = $1', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' })
    }
    res.json({
      success: true,
      data: mapProductRow(result.rows[0])
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Lấy danh sách gói dàn trọn bộ
app.get('/api/v1/combos', async (req, res) => {
  try {
    const combosResult = await query('SELECT * FROM combos ORDER BY price DESC')
    const combos = []

    for (const row of combosResult.rows) {
      const compResult = await query(
        'SELECT item_name as item, role_description as role FROM combo_components WHERE combo_id = $1 ORDER BY sort_order',
        [row.id]
      )
      const giftResult = await query(
        'SELECT gift_description as gift FROM combo_gifts WHERE combo_id = $1 ORDER BY sort_order',
        [row.id]
      )

      combos.push({
        id: row.id,
        name: row.name,
        tagline: row.tagline,
        price: Number(row.price),
        fastActionPrice: Number(row.fast_action_price),
        totalRealValue: Number(row.total_real_value),
        listPrice: Number(row.list_price),
        savedAmount: Number(row.saved_amount),
        roomSize: row.room_size,
        isFeatured: row.is_featured,
        badge: row.badge,
        videoUrl: row.video_url,
        videoTitle: row.video_title,
        components: compResult.rows,
        gifts: giftResult.rows.map(g => g.gift)
      })
    }

    res.json({ success: true, data: combos })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Khách gửi yêu cầu tư vấn / thử dàn tại nhà
app.post('/api/v1/leads', async (req, res) => {
  try {
    const { name, phone, address, interest, roomInfo, note } = req.body
    if (typeof name !== 'string' || !name.trim() || name.length > 100 || !validPhone(phone) || !validOptionalText(address, 500) || !validOptionalText(interest, 200) || !validOptionalText(roomInfo, 500) || !validOptionalText(note, 2000)) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp họ tên và số điện thoại' })
    }

    const leadId = 'LD-' + randomUUID()
    const sql = `
      INSERT INTO leads (id, name, phone, address, interest, room_info, status, deal_value, notes)
      VALUES ($1, $2, $3, $4, $5, $6, 'MOI', $7, $8)
      RETURNING *
    `
    const result = await query(sql, [
      leadId,
      name.trim(),
      phone.trim(),
      address || '',
      interest || 'Tư vấn âm thanh',
      roomInfo || '',
      0,
      note || ''
    ])

    res.status(201).json({
      success: true,
      message: 'Đã tiếp nhận yêu cầu. Kỹ sư Tú Audio sẽ liên hệ lại trong 15 phút.',
      data: mapLeadRow(result.rows[0])
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Khách gửi yêu cầu Thu Cũ Đổi Mới (kèm ảnh thiết bị cũ)
app.post('/api/v1/trade-ins', async (req, res) => {
  try {
    const { customerName, customerPhone, customerAddress, oldDeviceName, oldDeviceImages, conditionNote, upgradeToItem } = req.body
    if (typeof customerName !== 'string' || !customerName.trim() || !validPhone(customerPhone) || typeof oldDeviceName !== 'string' || !oldDeviceName.trim() || oldDeviceName.length > 200 || !validOptionalText(customerAddress, 500) || !validOptionalText(oldDeviceImages, 8_000_000) || !validOptionalText(conditionNote, 2000) || !validOptionalText(upgradeToItem, 200)) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp họ tên, SĐT và tên thiết bị cũ' })
    }

    // Tự động tạo lead để ghi nhận vào phễu CRM
    const leadId = 'LD-' + randomUUID()
    await query(
      `INSERT INTO leads (id, name, phone, address, interest, status, notes)
       VALUES ($1, $2, $3, $4, $5, 'MOI', $6)`,
      [
        leadId, customerName, customerPhone, customerAddress || '',
        `Thu cũ đổi mới: ${oldDeviceName} -> ${upgradeToItem || 'Lên đời dàn'}`,
        conditionNote || ''
      ]
    )

    const sql = `
      INSERT INTO trade_ins (
        lead_id, customer_name, customer_phone, customer_address,
        old_device_name, old_device_images, condition_note, upgrade_to_item, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CHO_DINH_GIA')
      RETURNING *
    `
    const result = await query(sql, [
      leadId, customerName, customerPhone, customerAddress || '',
      oldDeviceName, oldDeviceImages || '', conditionNote || '', upgradeToItem || 'Dàn Karaoke 29 Triệu'
    ])

    res.status(201).json({
      success: true,
      message: 'Đã gửi ảnh thiết bị cũ thành công! Kỹ sư Tú Audio sẽ thẩm định và báo giá đổi các qua Zalo.',
      data: result.rows[0]
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Khách đặt mua lẻ từ Giỏ Hàng (Orders)
app.post('/api/v1/orders', async (req, res) => {
  try {
    const { customerName, customerPhone, shippingAddress, items, paymentMethod, note } = req.body
    if (typeof customerName !== 'string' || !customerName.trim() || customerName.length > 100 || !validPhone(customerPhone) || typeof shippingAddress !== 'string' || !shippingAddress.trim() || shippingAddress.length > 500 || !validOptionalText(note, 2000) || !Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đủ thông tin nhận hàng và giỏ hàng không được trống' })
    }

    const productIds = [...new Set(items.map(item => item?.id))]
    if (productIds.some(id => typeof id !== 'string' || !id) || items.some(item => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
      return res.status(400).json({ success: false, message: 'Sản phẩm hoặc số lượng trong giỏ hàng không hợp lệ.' })
    }
    const productResult = await query('SELECT id, name, price, image_url FROM products WHERE id = ANY($1::text[]) AND in_stock = TRUE', [productIds])
    const productsById = new Map(productResult.rows.map(product => [product.id, product]))
    if (items.some(item => !productsById.has(item.id))) {
      return res.status(400).json({ success: false, message: 'Một hoặc nhiều sản phẩm không còn hàng.' })
    }
    const trustedItems = items.map(item => {
      const product = productsById.get(item.id)
      return { id: product.id, name: product.name, price: Number(product.price), image: product.image_url, quantity: item.quantity }
    })
    const trustedTotal = trustedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    if (!Number.isSafeInteger(trustedTotal)) {
      return res.status(400).json({ success: false, message: 'Tổng giá trị đơn hàng vượt giới hạn.' })
    }

    const orderId = 'ORD-' + randomUUID()
    const cleanPayMethod = ['COD', 'BANK'].includes(paymentMethod) ? paymentMethod : 'COD'
    const sql = `
      INSERT INTO orders (id, customer_name, customer_phone, shipping_address, items, total_amount, payment_method, status, note)
      VALUES ($1, $2, $3, $4, $5::json, $6, $7, 'MOI', $8)
      RETURNING *
    `
    const result = await query(sql, [
      orderId, customerName.trim(), customerPhone.trim(), shippingAddress.trim(),
      JSON.stringify(trustedItems), trustedTotal, cleanPayMethod, note || ''
    ])

    // Tự động ghi nhận vào phễu CRM (leads) để đội ngũ tư vấn xác nhận cài sẵn thông số & chăm sóc nâng cấp
    const itemSummary = trustedItems.map(i => `${i.quantity}x ${i.name}`).join(', ')
    const payLabel = cleanPayMethod === 'BANK' ? 'Chuyển khoản' : 'COD'
    await query(
      `INSERT INTO leads (id, name, phone, address, interest, status, deal_value, notes)
       VALUES ($1, $2, $3, $4, $5, 'MOI', $6, $7)`,
      [
        'LD-' + randomUUID(),
        customerName.trim(),
        customerPhone.trim(),
        shippingAddress.trim(),
        `Đặt mua giỏ hàng: ${itemSummary}`.slice(0, 250),
        0,
        `[Mã đơn ${orderId} - ${payLabel} - ${trustedTotal.toLocaleString('vi-VN')}đ] ${note || 'Khách đặt thiết bị lẻ từ giỏ hàng.'}`.slice(0, 2000)
      ]
    )

    res.status(201).json({
      success: true,
      message: `Đặt hàng thành công mã đơn ${orderId}!`,
      data: result.rows[0]
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ==========================================
// 2. ADMIN APIS (QUẢN TRỊ BẢO MẬT BẰNG JWT)
// ==========================================

// Đăng nhập Admin (Kiểm tra trực tiếp từ bảng admins trên Aiven PostgreSQL)
app.post('/api/v1/admin/auth/login', loginRateLimit, async (req, res) => {
  try {
    const { username, password } = req.body
    const cleanUser = username?.trim().toLowerCase()

    if (!cleanUser || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu' })
    }

    const result = await query('SELECT * FROM admins WHERE LOWER(username) = $1 AND is_active = TRUE', [cleanUser])
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Tài khoản quản trị không tồn tại hoặc đã bị khóa' })
    }

    const admin = result.rows[0]
    const isMatch = await bcrypt.compare(password, admin.password_hash)

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác' })
    }
    loginAttempts.delete(req.ip)

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role, name: admin.full_name, authVersion: Number(admin.auth_version ?? 0) },
      JWT_SECRET,
      { expiresIn: '8h' }
    )
    return res.json({
      success: true,
      token,
      user: { id: admin.id, username: admin.username, full_name: admin.full_name, role: admin.role }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Quản lý tài khoản nhân viên: chỉ SUPER_ADMIN được phép
app.get('/api/v1/admin/users', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const result = await query('SELECT id, username, full_name, phone, role, is_active, created_at FROM admins ORDER BY created_at DESC')
    res.json({ success: true, data: result.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.post('/api/v1/admin/users', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { username, password, fullName, phone, role } = req.body
    const cleanUsername = typeof username === 'string' ? username.trim().toLowerCase() : ''
    if (!/^[a-z0-9._-]{3,50}$/.test(cleanUsername)) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập chỉ gồm chữ không dấu, số, dấu chấm hoặc gạch nối (3–50 ký tự, viết liền không khoảng trắng).' })
    }
    if (typeof fullName !== 'string' || !fullName.trim() || fullName.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Họ tên không được để trống và tối đa 100 ký tự.' })
    }
    const cleanPhone = String(phone || '').trim()
    if (!validPhone(cleanPhone) || cleanPhone.length > 20) {
      return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ (từ 8 đến 15 chữ số).' })
    }
    if (!validRoles.has(role) || (role === 'SUPER_ADMIN' && req.admin.role !== 'SUPER_ADMIN')) {
      return res.status(400).json({ success: false, message: 'Vai trò được chọn không hợp lệ.' })
    }
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Mật khẩu nhân viên cần dài từ 12 đến 128 ký tự.' })
    }
    const existing = await query('SELECT id FROM admins WHERE LOWER(username) = $1', [cleanUsername])
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: `Tên đăng nhập "${cleanUsername}" đã tồn tại.` })
    }
    const passwordHash = await bcrypt.hash(password, 12)
    const result = await query(
      'INSERT INTO admins (id, username, password_hash, full_name, phone, role, is_active, auth_version) VALUES ($1, $2, $3, $4, $5, $6, TRUE, 0) RETURNING id, username, full_name, phone, role, is_active, created_at',
      [randomUUID(), cleanUsername, passwordHash, fullName.trim(), cleanPhone, role]
    )
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Tên đăng nhập đã được sử dụng.' })
    res.status(500).json({ success: false, message: err.message })
  }
})

app.patch('/api/v1/admin/users/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const { role, isActive, fullName, phone, password } = req.body
    if (id === req.admin.id && isActive === false) {
      return res.status(400).json({ success: false, message: 'Không thể tự khóa tài khoản đang đăng nhập.' })
    }
    if (role !== undefined && !validRoles.has(role)) return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' })
    if (fullName !== undefined && (typeof fullName !== 'string' || !fullName.trim() || fullName.length > 100)) return res.status(400).json({ success: false, message: 'Họ tên không hợp lệ.' })
    if (phone !== undefined && (!validPhone(phone) || String(phone).trim().length > 20)) return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ.' })
    if (password !== undefined && (typeof password !== 'string' || password.length < 12 || password.length > 128)) return res.status(400).json({ success: false, message: 'Mật khẩu cần dài từ 12 đến 128 ký tự.' })
    if (isActive === false || role && role !== 'SUPER_ADMIN') {
      const superCount = await query("SELECT COUNT(*)::int AS count FROM admins WHERE role = 'SUPER_ADMIN' AND is_active = TRUE AND id <> $1", [id])
      const target = await query('SELECT role, is_active FROM admins WHERE id = $1', [id])
      if (target.rows[0]?.role === 'SUPER_ADMIN' && target.rows[0]?.is_active && superCount.rows[0].count === 0) {
        return res.status(400).json({ success: false, message: 'Cần giữ lại ít nhất một quản trị viên cấp cao đang hoạt động.' })
      }
    }
    const passwordHash = password ? await bcrypt.hash(password, 12) : null
    const result = await query(
      `UPDATE admins SET role = COALESCE($1, role), is_active = COALESCE($2, is_active),
        full_name = COALESCE($3, full_name), phone = COALESCE($4, phone),
        password_hash = COALESCE($5, password_hash), auth_version = COALESCE(auth_version, 0) + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING id, username, full_name, phone, role, is_active, auth_version, created_at`,
      [role ?? null, isActive ?? null, fullName?.trim() ?? null, phone?.trim() ?? null, passwordHash, id]
    )
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' })
    const updatedRow = result.rows[0]
    let refreshedToken = null
    if (id === req.admin.id && updatedRow.is_active) {
      refreshedToken = jwt.sign(
        { id: updatedRow.id, username: updatedRow.username, role: updatedRow.role, name: updatedRow.full_name, authVersion: Number(updatedRow.auth_version ?? 0) },
        JWT_SECRET,
        { expiresIn: '8h' }
      )
    }
    const { auth_version: _av, ...publicAdmin } = updatedRow
    res.json({ success: true, data: publicAdmin, ...(refreshedToken ? { newToken: refreshedToken } : {}) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Thống kê Dashboard
app.get('/api/v1/admin/dashboard/stats', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const totalRev = await query("SELECT COALESCE(SUM(deal_value), 0) as total FROM leads WHERE status = 'DA_CHOT'")
    const orderRev = await query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'HOAN_THANH'")
    const trials = await query("SELECT COUNT(*) as count FROM leads WHERE status = 'HEN_THU_TAI_NHA'")
    const newLeads = await query("SELECT COUNT(*) as count FROM leads WHERE status = 'MOI'")
    const prodCount = await query("SELECT COUNT(*) as count FROM products")
    const closedCount = await query("SELECT COUNT(*) as count FROM leads WHERE status = 'DA_CHOT'")
    const completedOrders = await query("SELECT COUNT(*) as count FROM orders WHERE status = 'HOAN_THANH'")

    res.json({
      success: true,
      data: {
        totalRevenueClosed: Number(totalRev.rows[0].total) + Number(orderRev.rows[0].total),
        activeTrialAppointments: Number(trials.rows[0].count),
        newPendingLeads: Number(newLeads.rows[0].count),
        totalProductsInStock: Number(prodCount.rows[0].count),
        closedDealsCount: Number(closedCount.rows[0].count),
        completedOrdersCount: Number(completedOrders.rows[0].count)
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Lấy danh sách khách hàng (Leads)
app.get('/api/v1/admin/leads', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const { status, keyword } = req.query
    let sql = 'SELECT * FROM leads WHERE 1=1'
    const params = []

    if (status && status !== 'ALL') {
      params.push(status)
      sql += ` AND status = $${params.length}`
    }

    if (keyword) {
      params.push(`%${keyword.toLowerCase()}%`)
      sql += ` AND (LOWER(name) LIKE $${params.length} OR phone LIKE $${params.length} OR LOWER(address) LIKE $${params.length})`
    }

    sql += ' ORDER BY created_at DESC'
    const result = await query(sql, params)
    res.json({ success: true, data: result.rows.map(mapLeadRow) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Cập nhật trạng thái / chi tiết khách hàng
app.patch('/api/v1/admin/leads/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const { id } = req.params
    const { name, phone, address, roomInfo, status, appointmentDate, note, dealValue } = req.body
    if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.length > 100)) return res.status(400).json({ success: false, message: 'Họ tên không hợp lệ.' })
    if (phone !== undefined && !validPhone(phone)) return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ.' })
    if (status !== undefined && !['MOI', 'DA_GOI', 'HEN_THU_TAI_NHA', 'DA_CHOT', 'HUY'].includes(status)) return res.status(400).json({ success: false, message: 'Trạng thái lead không hợp lệ.' })
    if (dealValue !== undefined && !validMoney(dealValue)) return res.status(400).json({ success: false, message: 'Giá trị chốt không hợp lệ.' })

    const sql = `
      UPDATE leads
      SET 
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        address = COALESCE($3, address),
        room_info = COALESCE($4, room_info),
        status = COALESCE($5, status),
        appointment_date = CASE WHEN $6::text IS NOT NULL AND $6::text != '' THEN $6::timestamp ELSE appointment_date END,
        notes = COALESCE($7, notes),
        deal_value = COALESCE($8, deal_value),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `
    const result = await query(sql, [
      name ?? null,
      phone ?? null,
      address ?? null,
      roomInfo ?? null,
      status ?? null,
      appointmentDate ?? null,
      note ?? null,
      dealValue ?? null,
      id
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' })
    }
    res.json({ success: true, data: mapLeadRow(result.rows[0]) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Xóa khách hàng (Chỉ SUPER_ADMIN được xóa vĩnh viễn dữ liệu CRM)
app.delete('/api/v1/admin/leads/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    await query('DELETE FROM leads WHERE id = $1', [id])
    res.json({ success: true, message: 'Đã xóa yêu cầu' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

const slugifyVi = (text) => String(text || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[đĐ]/g, 'd')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'thiet-bi'

const validProductImage = (img) => {
  if (typeof img !== 'string' || !img.trim()) return false
  if (/^https?:\/\//i.test(img)) return img.length <= 2048
  if (/^data:image\/(png|jpe?g|webp);base64,/i.test(img)) return img.length <= 2000000
  return false
}

// Thêm sản phẩm mới (đồng bộ đầy đủ với thẻ 2 cột Mobile & trang Chi tiết)
app.post('/api/v1/admin/products', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'INVENTORY'), async (req, res) => {
  try {
    const p = req.body
    if (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 200 || !validCategories.has(p.category || 'loa-full') || !validMoney(p.price) || p.originalPrice !== undefined && !validMoney(p.originalPrice)) {
      return res.status(400).json({ success: false, message: 'Tên hoặc giá sản phẩm không hợp lệ.' })
    }
    if (!validProductImage(p.image)) {
      return res.status(400).json({ success: false, message: 'Ảnh sản phẩm phải là link HTTP/HTTPS hoặc ảnh tải lên hợp lệ (JPG/PNG/WebP).' })
    }
    const cleanRating = p.rating !== undefined ? Math.min(5, Math.max(1, Number(p.rating) || 5)) : 5.0
    const cleanReviews = p.reviewsCount !== undefined ? Math.max(0, Math.round(Number(p.reviewsCount) || 0)) : 18
    const cleanPowerRMS = Math.max(0, Math.round(Number(p.powerRMS) || 0))
    const cleanPowerPeak = Math.max(0, Math.round(Number(p.powerPeak) || 0))
    const cleanInStock = p.inStock === undefined ? true : Boolean(p.inStock)

    const id = p.id || `sp-${slugifyVi(p.name).slice(0, 32)}-${Date.now().toString().slice(-4)}`
    const slug = `${slugifyVi(p.slug || p.name)}-${Date.now().toString().slice(-4)}`

    const sql = `
      INSERT INTO products (
        id, name, slug, category_id, bass_size, power_rms, power_peak, price, original_price,
        room_size, badge, in_stock, rating, reviews_count,
        image_url, video_url, video_title, matching_amplifier, short_desc, specs, gifts
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20::json, $21::json
      )
      RETURNING *
    `
    const result = await query(sql, [
      id, p.name.trim(), slug, p.category || 'loa-full', p.bassSize || '-', cleanPowerRMS, cleanPowerPeak,
      Number(p.price), Number(p.originalPrice || 0), p.roomSize || '20 - 35m²', p.badge || '',
      cleanInStock, cleanRating, cleanReviews,
      p.image.trim(), p.videoUrl || '', p.videoTitle || '', p.matchingAmplifier || '', p.shortDesc || '',
      JSON.stringify(p.specs || { "Đường kính Bass": p.bassSize || "-", "Công suất RMS": `${cleanPowerRMS} W` }),
      JSON.stringify(Array.isArray(p.gifts) ? p.gifts : [])
    ])

    res.status(201).json({ success: true, data: mapProductRow(result.rows[0]) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Cập nhật sản phẩm
app.put('/api/v1/admin/products/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'INVENTORY'), async (req, res) => {
  try {
    const { id } = req.params
    const p = req.body
    if (p.name !== undefined && (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 200) || p.category !== undefined && !validCategories.has(p.category) || p.price !== undefined && !validMoney(p.price) || p.originalPrice !== undefined && !validMoney(p.originalPrice)) {
      return res.status(400).json({ success: false, message: 'Tên hoặc giá sản phẩm không hợp lệ.' })
    }
    if (p.image !== undefined && !validProductImage(p.image)) {
      return res.status(400).json({ success: false, message: 'Ảnh sản phẩm phải là link HTTP/HTTPS hoặc ảnh tải lên hợp lệ (JPG/PNG/WebP).' })
    }
    const cleanRating = p.rating !== undefined ? Math.min(5, Math.max(1, Number(p.rating) || 5)) : null
    const cleanReviews = p.reviewsCount !== undefined ? Math.max(0, Math.round(Number(p.reviewsCount) || 0)) : null
    const cleanPowerRMS = p.powerRMS !== undefined ? Math.max(0, Math.round(Number(p.powerRMS) || 0)) : null
    const cleanPowerPeak = p.powerPeak !== undefined ? Math.max(0, Math.round(Number(p.powerPeak) || 0)) : null
    const cleanInStock = p.inStock !== undefined ? Boolean(p.inStock) : null

    const sql = `
      UPDATE products
      SET
        name = COALESCE($1, name),
        category_id = COALESCE($2, category_id),
        bass_size = COALESCE($3, bass_size),
        power_rms = COALESCE($4, power_rms),
        power_peak = COALESCE($5, power_peak),
        price = COALESCE($6, price),
        original_price = COALESCE($7, original_price),
        room_size = COALESCE($8, room_size),
        badge = COALESCE($9, badge),
        in_stock = COALESCE($10, in_stock),
        rating = COALESCE($11, rating),
        reviews_count = COALESCE($12, reviews_count),
        image_url = COALESCE($13, image_url),
        video_url = COALESCE($14, video_url),
        video_title = COALESCE($15, video_title),
        matching_amplifier = COALESCE($16, matching_amplifier),
        short_desc = COALESCE($17, short_desc),
        specs = COALESCE($18::json, specs),
        gifts = COALESCE($19::json, gifts),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $20
      RETURNING *
    `
    const result = await query(sql, [
      p.name ? p.name.trim() : null, p.category ?? null, p.bassSize ?? null, cleanPowerRMS, cleanPowerPeak,
      p.price ?? null, p.originalPrice ?? null, p.roomSize ?? null, p.badge ?? null,
      cleanInStock, cleanRating, cleanReviews,
      p.image ? p.image.trim() : null, p.videoUrl ?? null, p.videoTitle ?? null, p.matchingAmplifier ?? null,
      p.shortDesc ?? null,
      p.specs ? JSON.stringify(p.specs) : null,
      p.gifts ? JSON.stringify(p.gifts) : null,
      id
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' })
    }
    res.json({ success: true, data: mapProductRow(result.rows[0]) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Xóa sản phẩm
app.delete('/api/v1/admin/products/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'INVENTORY'), async (req, res) => {
  try {
    const { id } = req.params
    await query('DELETE FROM products WHERE id = $1', [id])
    res.json({ success: true, message: 'Đã xóa sản phẩm' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Cập nhật gói dàn karaoke (Combos) & tự tính lại số tiền tiết kiệm thật (total_real_value - price)
app.put('/api/v1/admin/combos/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'INVENTORY'), async (req, res) => {
  try {
    const { id } = req.params
    const c = req.body
    for (const field of ['price', 'fastActionPrice', 'listPrice', 'totalRealValue']) {
      if (c[field] !== undefined && !validMoney(c[field])) {
        return res.status(400).json({ success: false, message: `Giá trị ${field} không hợp lệ.` })
      }
    }
    if (!validOptionalText(c.name, 200) || !validOptionalText(c.tagline, 255) || !validOptionalText(c.roomSize, 100) || !validOptionalText(c.badge, 100) || !validOptionalText(c.videoUrl, 2048) || !validOptionalText(c.videoTitle, 255)) {
      return res.status(400).json({ success: false, message: 'Thông tin văn bản của gói dàn vượt giới hạn cho phép.' })
    }

    const sql = `
      UPDATE combos
      SET
        price = COALESCE($1, price),
        fast_action_price = COALESCE($2, fast_action_price),
        list_price = COALESCE($3, list_price),
        total_real_value = COALESCE($4, total_real_value),
        saved_amount = GREATEST(0, COALESCE($4, total_real_value, list_price) - COALESCE($1, price)),
        video_url = COALESCE($5, video_url),
        video_title = COALESCE($6, video_title),
        name = COALESCE($7, name),
        tagline = COALESCE($8, tagline),
        room_size = COALESCE($9, room_size),
        badge = COALESCE($10, badge),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `
    const result = await query(sql, [
      c.price ?? null,
      c.fastActionPrice ?? null,
      c.listPrice ?? null,
      c.totalRealValue ?? null,
      c.videoUrl ?? null,
      c.videoTitle ?? null,
      c.name?.trim() || null,
      c.tagline?.trim() ?? null,
      c.roomSize?.trim() || null,
      c.badge?.trim() ?? null,
      id
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy gói dàn' })
    }

    if (Array.isArray(c.components)) {
      const cleanComps = c.components
        .filter(item => item && typeof item.item === 'string' && item.item.trim())
        .slice(0, 30)
      await query('DELETE FROM combo_components WHERE combo_id = $1', [id])
      for (let idx = 0; idx < cleanComps.length; idx += 1) {
        await query(
          'INSERT INTO combo_components (combo_id, item_name, role_description, sort_order) VALUES ($1, $2, $3, $4)',
          [id, cleanComps[idx].item.trim().slice(0, 255), String(cleanComps[idx].role || '').trim().slice(0, 255), idx + 1]
        )
      }
    }

    if (Array.isArray(c.gifts)) {
      const cleanGifts = c.gifts
        .map(g => String(g || '').trim())
        .filter(Boolean)
        .slice(0, 30)
      await query('DELETE FROM combo_gifts WHERE combo_id = $1', [id])
      for (let idx = 0; idx < cleanGifts.length; idx += 1) {
        await query(
          'INSERT INTO combo_gifts (combo_id, gift_description, sort_order) VALUES ($1, $2, $3)',
          [id, cleanGifts[idx].slice(0, 500), idx + 1]
        )
      }
    }

    const row = result.rows[0]
    const compResult = await query(
      'SELECT item_name as item, role_description as role FROM combo_components WHERE combo_id = $1 ORDER BY sort_order',
      [id]
    )
    const giftResult = await query(
      'SELECT gift_description as gift FROM combo_gifts WHERE combo_id = $1 ORDER BY sort_order',
      [id]
    )

    res.json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        tagline: row.tagline,
        price: Number(row.price),
        fastActionPrice: Number(row.fast_action_price),
        totalRealValue: Number(row.total_real_value),
        listPrice: Number(row.list_price),
        savedAmount: Number(row.saved_amount),
        roomSize: row.room_size,
        isFeatured: row.is_featured,
        badge: row.badge,
        videoUrl: row.video_url,
        videoTitle: row.video_title,
        components: compResult.rows,
        gifts: giftResult.rows.map(g => g.gift)
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Quản lý Yêu cầu Thu Cũ Đổi Mới (Trade-Ins)
app.get('/api/v1/admin/trade-ins', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM trade_ins ORDER BY created_at DESC')
    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        leadId: row.lead_id,
        customerName: row.customer_name || 'Khách hàng',
        customerPhone: row.customer_phone || '',
        customerAddress: row.customer_address || '',
        oldDeviceName: row.old_device_name,
        oldDeviceImages: row.old_device_images || '',
        conditionNote: row.condition_note || '',
        estimatedPrice: Number(row.estimated_price || 0),
        upgradeToItem: row.upgrade_to_item || '',
        status: row.status,
        createdAt: row.created_at ? new Date(row.created_at).toISOString().slice(0, 16).replace('T', ' ') : ''
      }))
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.patch('/api/v1/admin/trade-ins/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const { id } = req.params
    const { estimatedPrice, status } = req.body
    if (estimatedPrice !== undefined && !validMoney(estimatedPrice)) return res.status(400).json({ success: false, message: 'Giá thẩm định không hợp lệ.' })
    if (status !== undefined && !['CHO_DINH_GIA', 'DA_DUYET', 'DA_THU_HOI', 'HUY'].includes(status)) return res.status(400).json({ success: false, message: 'Trạng thái thu cũ không hợp lệ.' })
    const sql = `
      UPDATE trade_ins
      SET
        estimated_price = COALESCE($1, estimated_price),
        status = COALESCE($2, status)
      WHERE id = $3
      RETURNING *
    `
    const result = await query(sql, [estimatedPrice ?? null, status ?? null, id])
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu thu cũ' })
    }
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.delete('/api/v1/admin/trade-ins/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    await query('DELETE FROM trade_ins WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Đã xóa yêu cầu' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Quản lý Đơn Đặt Mua Lẻ (Orders)
app.get('/api/v1/admin/orders', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM orders ORDER BY created_at DESC')
    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        shippingAddress: row.shipping_address,
        items: row.items || [],
        totalAmount: Number(row.total_amount),
        paymentMethod: row.payment_method,
        status: row.status,
        note: row.note || '',
        createdAt: row.created_at ? new Date(row.created_at).toISOString().slice(0, 16).replace('T', ' ') : ''
      }))
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.patch('/api/v1/admin/orders/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!['MOI', 'DA_XAC_NHAN', 'DANG_GIAO', 'HOAN_THANH', 'HUY'].includes(status)) return res.status(400).json({ success: false, message: 'Trạng thái đơn hàng không hợp lệ.' })
    const result = await query(
      'UPDATE orders SET status = COALESCE($1, status) WHERE id = $2 RETURNING *',
      [status ?? null, id]
    )
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.delete('/api/v1/admin/orders/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    await query('DELETE FROM orders WHERE id = $1', [req.params.id])
    res.json({ success: true, message: 'Đã xóa đơn hàng' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Tự động đảm bảo cột bảo mật cần thiết tồn tại trên CSDL khi khởi động
const ensureDatabaseSchema = async () => {
  try {
    await query('ALTER TABLE admins ADD COLUMN IF NOT EXISTS auth_version INTEGER NOT NULL DEFAULT 0')
    await query('CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_username_lower ON admins (LOWER(username))')
  } catch (err) {
    console.error('⚠️ Cảnh báo kiểm tra schema khi khởi động:', err.message)
  }
}

// Khởi chạy máy chủ
ensureDatabaseSchema().finally(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Backend API Server đang chạy tại: http://localhost:${PORT}`)
  })
})
