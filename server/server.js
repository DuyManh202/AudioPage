import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { createHmac, timingSafeEqual } from 'crypto'
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
app.use(express.json({ limit: '10mb', verify: (req, res, buffer) => { req.rawBody = Buffer.from(buffer) } }))

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

const isFacebookMessengerConfigured = () => Boolean(process.env.META_PAGE_ID && process.env.META_PAGE_ACCESS_TOKEN && process.env.META_APP_SECRET && process.env.META_VERIFY_TOKEN && process.env.META_GRAPH_VERSION)
const isFacebookAiEnabled = () => process.env.META_AI_ENABLED === 'true' && Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL)
const isFacebookAdsConfigured = () => Boolean(process.env.META_AD_ACCOUNT_ID && process.env.META_ADS_ACCESS_TOKEN && /^v\d+\.\d+$/.test(process.env.META_GRAPH_VERSION || ''))

const fetchMetaAdDetails = async (adId) => {
  const token = process.env.META_ADS_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN
  const version = process.env.META_GRAPH_VERSION
  if (!adId || !token || !version) return {}
  try {
    const url = new URL(`https://graph.facebook.com/${version}/${encodeURIComponent(adId)}`)
    url.searchParams.set('fields', 'id,name,campaign{id,name}')
    const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(8000) })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error?.message || `Meta Graph API (${response.status})`)
    return { adId: data.id || adId, adName: data.name || '', campaignId: data.campaign?.id || '', campaignName: data.campaign?.name || '' }
  } catch (err) {
    console.warn('[Meta ads] Could not resolve referral ad:', err.message)
    return { adId }
  }
}

const sendFacebookText = async (psid, text) => {
  const { META_PAGE_ID: pageId, META_PAGE_ACCESS_TOKEN: pageToken, META_GRAPH_VERSION: graphVersion } = process.env
  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${pageId}/messages`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pageToken}` },
    body: JSON.stringify({ recipient: { id: psid }, messaging_type: 'RESPONSE', message: { text } }),
    signal: AbortSignal.timeout(20000)
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error?.message || `Meta Send API error (${response.status})`)
}

const autoReplyToFacebookCustomer = async (customerId, psid) => {
  if (!isFacebookAiEnabled() || !isFacebookMessengerConfigured()) return
  try {
    const [customerResult, historyResult, productsResult, combosResult] = await Promise.all([
      query('SELECT customer_name, interest, notes, status FROM facebook_care_customers WHERE id=$1', [customerId]),
      query(`SELECT direction, body FROM facebook_care_messages WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 12`, [customerId]),
      query(`SELECT name, price, original_price, room_size, bass_size, power_rms, short_desc, specs
        FROM products WHERE in_stock=TRUE ORDER BY price ASC LIMIT 24`),
      query(`SELECT name, price, fast_action_price, room_size, tagline FROM combos ORDER BY price ASC`)
    ])
    const customer = customerResult.rows[0]
    if (!customer || customer.status === 'CHO_PHAN_HOI') return
    const productContext = {
      products: productsResult.rows.map(p => ({ ...p, price: Number(p.price), original_price: Number(p.original_price) })),
      combos: combosResult.rows.map(c => ({ ...c, price: Number(c.price), fast_action_price: Number(c.fast_action_price) }))
    }
    const history = historyResult.rows.reverse().map(m => ({ role: m.direction === 'IN' ? 'user' : 'assistant', content: m.body }))
    const instructions = `Bạn là trợ lý tư vấn khách hàng của Tú Audio, chuyên loa và dàn karaoke gia đình tại Việt Nam. Trả lời bằng tiếng Việt tự nhiên, lịch sự, ngắn gọn như nhân viên tư vấn.\n\nDỮ LIỆU SẢN PHẨM ĐANG CÓ (nguồn duy nhất để báo tên, giá, tồn kho, cấu hình): ${JSON.stringify(productContext)}\n\nQuy tắc:\n- Chỉ tư vấn sản phẩm có trong dữ liệu trên; không tự tạo giá, khuyến mại, tồn kho, bảo hành, thông số hoặc chính sách. Nếu thiếu dữ liệu, nói rõ và mời nhân viên xác nhận.\n- Hỏi từng ý cần thiết: diện tích phòng, phòng kín/thông tầng, ngân sách và thiết bị đang có. Dùng thông tin khách đã nói trong lịch sử, đừng hỏi lại.\n- Ưu tiên các gói karaoke phù hợp trong dữ liệu; nếu ngân sách chưa phù hợp, hỏi ngân sách hoặc gợi ý thiết bị có trong danh mục. Không bịa chính sách thu cũ đổi mới.\n- Ưu tiên gợi ý phù hợp phòng; giải thích ngắn gọn. Không ép mua. Giá gói lấy đúng trường price; chỉ nêu fast_action_price nếu khách hỏi ưu đãi và nói rõ điều kiện cần nhân viên xác nhận.\n- Không yêu cầu khách gửi mật khẩu, mã OTP, số thẻ hoặc dữ liệu nhạy cảm.\n- Nếu khách yêu cầu người thật, hỏi bảo hành/sửa chữa/đổi trả/đơn hàng cụ thể, khiếu nại, hoặc câu trả lời cần xác nhận chính sách, dòng đầu tiên phải là [[HANDOFF]]. Sau đó viết một câu ngắn cho khách rằng Tú Audio sẽ chuyển nhân viên hỗ trợ.\n- Nếu không biết, không đoán: hỏi lại hoặc chuyển nhân viên bằng [[HANDOFF]].`
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL, instructions, input: history, max_output_tokens: 260, store: false }),
      signal: AbortSignal.timeout(25000)
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.error?.message || `OpenAI API error (${response.status})`)
    const answer = (payload.output || []).flatMap(item => item.content || []).filter(part => part.type === 'output_text').map(part => part.text).join('\n').trim()
    if (!answer) throw new Error('AI không trả về nội dung')
    const handoff = answer.startsWith('[[HANDOFF]]')
    const reply = answer.replace(/^\[\[HANDOFF\]\]\s*/, '').slice(0, 1900)
    if (!reply) throw new Error('AI trả nội dung trống')
    await sendFacebookText(psid, reply)
    await query(`INSERT INTO facebook_care_messages (id, customer_id, body, direction, created_by)
      VALUES ($1,$2,$3,'OUT','AI Tú Audio')`, [randomUUID(), customerId, reply])
    await query(`UPDATE facebook_care_customers SET last_message=$1,
      status=CASE WHEN $2 THEN 'CHO_PHAN_HOI' ELSE status END, updated_at=CURRENT_TIMESTAMP WHERE id=$3`, [reply, handoff, customerId])
  } catch (err) {
    console.error('[Facebook AI] Auto reply failed:', err.message)
    await query(`UPDATE facebook_care_customers SET status='CHO_PHAN_HOI',
      notes=CONCAT(COALESCE(notes,''), CASE WHEN COALESCE(notes,'')='' THEN '' ELSE E'\\n' END, '[AI chưa trả lời được; cần nhân viên xử lý]'), updated_at=CURRENT_TIMESTAMP WHERE id=$1`, [customerId]).catch(dbErr => console.error('[Facebook AI] Handoff update failed:', dbErr.message))
  }
}

// Facebook Messenger webhook verification and inbound message ingestion.
app.get('/api/v1/facebook/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']
  if (mode === 'subscribe' && process.env.META_VERIFY_TOKEN && token === process.env.META_VERIFY_TOKEN) return res.status(200).type('text/plain').send(String(challenge || ''))
  return res.sendStatus(403)
})

app.post('/api/v1/facebook/webhook', async (req, res) => {
  const appSecret = process.env.META_APP_SECRET
  const signature = req.get('x-hub-signature-256') || ''
  if (!appSecret || !req.rawBody || !signature.startsWith('sha256=')) return res.sendStatus(401)
  const expected = Buffer.from(`sha256=${createHmac('sha256', appSecret).update(req.rawBody).digest('hex')}`)
  const actual = Buffer.from(signature)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return res.sendStatus(401)
  if (req.body?.object !== 'page') return res.sendStatus(404)
  try {
    for (const entry of req.body.entry || []) {
      for (const event of entry.messaging || []) {
        const psid = event.sender?.id
        const text = event.message?.text || event.postback?.title || (event.message?.attachments?.length ? '[Khách gửi tệp đính kèm hoặc hình ảnh qua Messenger]' : '')
        if (!psid || event.message?.is_echo) continue
        const referral = event.referral || event.message?.referral || event.postback?.referral || {}
        const referralAdId = referral.ad_id || referral.adId || null
        if (!text && !referralAdId && !referral.source && !referral.type) continue
        const adDetails = referralAdId ? await fetchMetaAdDetails(String(referralAdId)) : {}
        const sourceType = referral.source || (referralAdId ? 'AD' : null)
        const customer = await query(`INSERT INTO facebook_care_customers
          (id, customer_name, facebook_id, status, last_message, source_type, source_ad_id, source_ad_name, source_campaign_id, source_campaign_name)
          VALUES ($1,$2,$3,'MOI',$4,$5,$6,$7,$8,$9)
          ON CONFLICT (facebook_id) WHERE facebook_id IS NOT NULL DO UPDATE SET last_message=COALESCE(EXCLUDED.last_message,facebook_care_customers.last_message),
            source_type=COALESCE(EXCLUDED.source_type,facebook_care_customers.source_type),
            source_ad_id=COALESCE(EXCLUDED.source_ad_id,facebook_care_customers.source_ad_id),
            source_ad_name=COALESCE(EXCLUDED.source_ad_name,facebook_care_customers.source_ad_name),
            source_campaign_id=COALESCE(EXCLUDED.source_campaign_id,facebook_care_customers.source_campaign_id),
            source_campaign_name=COALESCE(EXCLUDED.source_campaign_name,facebook_care_customers.source_campaign_name),
            updated_at=CURRENT_TIMESTAMP
          RETURNING id`, [`FB-${randomUUID()}`, `Khách Facebook ${psid.slice(-6)}`, psid, text || null, sourceType,
          adDetails.adId || referralAdId, adDetails.adName || null, adDetails.campaignId || null, adDetails.campaignName || null])
        if (!text) continue
        const platformMessageId = event.message?.mid || (event.timestamp ? `postback-${psid}-${event.timestamp}` : `event-${randomUUID()}`)
        const inserted = await query(`INSERT INTO facebook_care_messages (id, customer_id, body, direction, created_by, platform_message_id)
          VALUES ($1,$2,$3,'IN','Facebook Page',$4) ON CONFLICT (platform_message_id) DO NOTHING RETURNING id`, [randomUUID(), customer.rows[0].id, text, platformMessageId])
        if (inserted.rows[0] && isFacebookAiEnabled()) setImmediate(() => autoReplyToFacebookCustomer(customer.rows[0].id, psid))
      }
    }
    return res.sendStatus(200)
  } catch (err) {
    console.error('[Facebook webhook] Database error:', err.message)
    return res.sendStatus(500)
  }
})

const parseDateRange = (req, res) => {
  const from = typeof req.query.from === 'string' ? req.query.from : ''
  const to = typeof req.query.to === 'string' ? req.query.to : ''
  const isDateOnly = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const date = new Date(`${value}T00:00:00.000Z`)
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  }

  if ((from && !isDateOnly(from)) || (to && !isDateOnly(to))) {
    res.status(400).json({ success: false, message: 'Ngày lọc không hợp lệ. Dùng định dạng YYYY-MM-DD.' })
    return null
  }
  if (from && to && from > to) {
    res.status(400).json({ success: false, message: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.' })
    return null
  }
  return { from, to }
}

const createdAtDateFilter = ({ from, to }, params) => {
  let sql = ''
  if (from) {
    params.push(from)
    sql += ` AND created_at >= $${params.length}::date`
  }
  if (to) {
    params.push(to)
    sql += ` AND created_at < ($${params.length}::date + INTERVAL '1 day')`
  }
  return sql
}

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
    const dateRange = parseDateRange(req, res)
    if (!dateRange) return
    let sql = 'SELECT * FROM leads WHERE 1=1'
    const params = []

    sql += createdAtDateFilter(dateRange, params)

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
    const dateRange = parseDateRange(req, res)
    if (!dateRange) return
    const params = []
    const result = await query(`SELECT * FROM trade_ins WHERE 1=1${createdAtDateFilter(dateRange, params)} ORDER BY created_at DESC`, params)
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
    const dateRange = parseDateRange(req, res)
    if (!dateRange) return
    const params = []
    const result = await query(`SELECT * FROM orders WHERE 1=1${createdAtDateFilter(dateRange, params)} ORDER BY created_at DESC`, params)
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

// Facebook Page care CRM: stores customers and a staff-maintained conversation log.
const mapFbCare = row => ({
  id: row.id, customerName: row.customer_name, facebookId: row.facebook_id || '', phone: row.phone || '',
  interest: row.interest || '', status: row.status, assignedTo: row.assigned_to || '',
  followUpAt: row.follow_up_at ? new Date(row.follow_up_at).toISOString().slice(0, 16) : '',
  sourceType: row.source_type || '', sourceAdId: row.source_ad_id || '', sourceAdName: row.source_ad_name || '',
  sourceCampaignId: row.source_campaign_id || '', sourceCampaignName: row.source_campaign_name || '',
  notes: row.notes || '', lastMessage: row.last_message || '', updatedAt: row.updated_at,
  createdAt: row.created_at, messages: row.messages || []
})

app.get('/api/v1/admin/facebook-ads', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  if (!isFacebookAdsConfigured()) return res.status(503).json({ success: false, configured: false, message: 'Chưa cấu hình META_AD_ACCOUNT_ID và META_ADS_ACCESS_TOKEN trên backend.' })
  try {
    const version = process.env.META_GRAPH_VERSION
    const accountId = process.env.META_AD_ACCOUNT_ID.replace(/^act_/, '')
    const url = new URL(`https://graph.facebook.com/${version}/act_${encodeURIComponent(accountId)}/ads`)
    url.searchParams.set('fields', 'id,name,status,effective_status,campaign{id,name},adset{id,name},insights.date_preset(last_30d){impressions,reach,clicks,spend}')
    url.searchParams.set('filtering', JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE'] }]))
    url.searchParams.set('limit', '100')
    const response = await fetch(url, { headers: { Authorization: 'Bearer ' + process.env.META_ADS_ACCESS_TOKEN }, signal: AbortSignal.timeout(20000) })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) return res.status(502).json({ success: false, configured: true, message: payload.error?.message || `Meta Marketing API (${response.status})` })
    const ads = (payload.data || []).map(ad => {
      const insight = ad.insights?.data?.[0] || {}
      return { id: ad.id, name: ad.name, status: ad.effective_status, campaignId: ad.campaign?.id || '', campaignName: ad.campaign?.name || '', adsetName: ad.adset?.name || '', impressions: Number(insight.impressions || 0), reach: Number(insight.reach || 0), clicks: Number(insight.clicks || 0), spend: Number(insight.spend || 0) }
    })
    res.json({ success: true, configured: true, data: ads, period: 'last_30d' })
  } catch (err) { res.status(502).json({ success: false, configured: true, message: err.message || 'Không lấy được dữ liệu quảng cáo từ Meta.' }) }
})

app.get('/api/v1/admin/facebook-care', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const result = await query(`SELECT c.*, COALESCE(json_agg(json_build_object('id', m.id, 'body', m.body, 'direction', m.direction, 'createdAt', m.created_at) ORDER BY m.created_at) FILTER (WHERE m.id IS NOT NULL), '[]') AS messages
      FROM facebook_care_customers c LEFT JOIN facebook_care_messages m ON m.customer_id = c.id
      GROUP BY c.id ORDER BY c.updated_at DESC`)
    const connected = isFacebookMessengerConfigured()
    res.json({ success: true, data: result.rows.map(mapFbCare), connected, aiEnabled: isFacebookAiEnabled() })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

app.post('/api/v1/admin/facebook-care', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const { customerName, facebookId, phone, interest, notes, followUpAt } = req.body
    if (!String(customerName || '').trim()) return res.status(400).json({ success: false, message: 'Vui lòng nhập tên khách hàng.' })
    const id = `FB-${randomUUID()}`
    const result = await query(`INSERT INTO facebook_care_customers (id, customer_name, facebook_id, phone, interest, notes, follow_up_at, assigned_to)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [id, String(customerName).trim(), facebookId || null, phone || null, interest || null, notes || null, followUpAt || null, req.admin.name])
    res.status(201).json({ success: true, data: mapFbCare({ ...result.rows[0], messages: [] }) })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

app.patch('/api/v1/admin/facebook-care/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const { status, notes, phone, interest, assignedTo, followUpAt, customerName } = req.body
    const validStatuses = ['MOI', 'DANG_TU_VAN', 'CHO_PHAN_HOI', 'DA_CHOT', 'DA_HUY']
    if (status !== undefined && !validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Trạng thái chăm sóc không hợp lệ.' })
    const result = await query(`UPDATE facebook_care_customers SET
      customer_name=COALESCE($1,customer_name), phone=COALESCE($2,phone), interest=COALESCE($3,interest), notes=COALESCE($4,notes),
      status=COALESCE($5,status), assigned_to=COALESCE($6,assigned_to), follow_up_at=$7, updated_at=CURRENT_TIMESTAMP
      WHERE id=$8 RETURNING *`, [customerName ?? null, phone ?? null, interest ?? null, notes ?? null, status ?? null, assignedTo ?? null, followUpAt || null, req.params.id])
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ khách Facebook.' })
    res.json({ success: true, data: mapFbCare({ ...result.rows[0], messages: [] }) })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

app.post('/api/v1/admin/facebook-care/:id/messages', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const body = String(req.body.body || '').trim()
    const direction = req.body.direction === 'OUT' ? 'OUT' : 'IN'
    if (!body) return res.status(400).json({ success: false, message: 'Nội dung ghi nhận không được để trống.' })
    const id = randomUUID()
    const result = await query(`INSERT INTO facebook_care_messages (id, customer_id, body, direction, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [id, req.params.id, body, direction, req.admin.name])
    await query('UPDATE facebook_care_customers SET last_message=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2', [body, req.params.id])
    res.status(201).json({ success: true, data: { id, body, direction, createdAt: result.rows[0].created_at } })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

app.post('/api/v1/admin/facebook-care/:id/send', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const text = String(req.body.body || '').trim()
    if (!text || text.length > 2000) return res.status(400).json({ success: false, message: 'Tin nhắn phải có nội dung và không quá 2.000 ký tự.' })
    const { META_PAGE_ID: pageId, META_PAGE_ACCESS_TOKEN: pageToken, META_GRAPH_VERSION: graphVersion } = process.env
    if (!pageId || !pageToken || !/^v\d+\.\d+$/.test(graphVersion || '')) return res.status(503).json({ success: false, message: 'Chưa cấu hình đầy đủ Meta Page ID, Page Access Token và Graph API version trên backend.' })
    const customerResult = await query('SELECT id, facebook_id FROM facebook_care_customers WHERE id=$1', [req.params.id])
    const customer = customerResult.rows[0]
    if (!customer?.facebook_id) return res.status(400).json({ success: false, message: 'Hồ sơ này chưa có Facebook PSID nên chưa thể gửi Messenger.' })
    const lastInbound = await query("SELECT created_at FROM facebook_care_messages WHERE customer_id=$1 AND direction='IN' ORDER BY created_at DESC LIMIT 1", [customer.id])
    if (!lastInbound.rows[0] || Date.now() - new Date(lastInbound.rows[0].created_at).getTime() > 24 * 60 * 60 * 1000) {
      return res.status(409).json({ success: false, message: 'Đã quá 24 giờ kể từ tin nhắn gần nhất của khách. Messenger không cho gửi tin nhắn tự do trong trường hợp này.' })
    }
    try { await sendFacebookText(customer.facebook_id, text) } catch (err) { return res.status(502).json({ success: false, message: err.message || 'Meta chưa nhận tin nhắn. Hãy kiểm tra quyền Page và token.' }) }
    const saved = await query("INSERT INTO facebook_care_messages (id, customer_id, body, direction, created_by) VALUES ($1,$2,$3,'OUT',$4) RETURNING id, body, direction, created_at", [randomUUID(), customer.id, text, req.admin.name])
    await query('UPDATE facebook_care_customers SET last_message=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2', [text, customer.id])
    res.status(201).json({ success: true, data: { id: saved.rows[0].id, body: text, direction: 'OUT', createdAt: saved.rows[0].created_at } })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// Tự động đảm bảo cột bảo mật cần thiết tồn tại trên CSDL khi khởi động
const ensureDatabaseSchema = async () => {
  try {
    await query('ALTER TABLE admins ADD COLUMN IF NOT EXISTS auth_version INTEGER NOT NULL DEFAULT 0')
    await query('CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_username_lower ON admins (LOWER(username))')
    await query(`CREATE TABLE IF NOT EXISTS facebook_care_customers (
      id VARCHAR(50) PRIMARY KEY, customer_name VARCHAR(150) NOT NULL, facebook_id VARCHAR(100), phone VARCHAR(30),
      interest TEXT, status VARCHAR(30) NOT NULL DEFAULT 'MOI', assigned_to VARCHAR(100), follow_up_at TIMESTAMP NULL,
      notes TEXT, last_message TEXT, source_type VARCHAR(50), source_ad_id VARCHAR(100), source_ad_name VARCHAR(255),
      source_campaign_id VARCHAR(100), source_campaign_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`)
    await query('ALTER TABLE facebook_care_customers ADD COLUMN IF NOT EXISTS source_type VARCHAR(50)')
    await query('ALTER TABLE facebook_care_customers ADD COLUMN IF NOT EXISTS source_ad_id VARCHAR(100)')
    await query('ALTER TABLE facebook_care_customers ADD COLUMN IF NOT EXISTS source_ad_name VARCHAR(255)')
    await query('ALTER TABLE facebook_care_customers ADD COLUMN IF NOT EXISTS source_campaign_id VARCHAR(100)')
    await query('ALTER TABLE facebook_care_customers ADD COLUMN IF NOT EXISTS source_campaign_name VARCHAR(255)')
    await query(`CREATE TABLE IF NOT EXISTS facebook_care_messages (
      id VARCHAR(50) PRIMARY KEY, customer_id VARCHAR(50) NOT NULL REFERENCES facebook_care_customers(id) ON DELETE CASCADE,
      body TEXT NOT NULL, direction VARCHAR(3) NOT NULL DEFAULT 'IN', created_by VARCHAR(100), platform_message_id TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`)
    await query('ALTER TABLE facebook_care_messages ADD COLUMN IF NOT EXISTS platform_message_id TEXT')
    await query('CREATE UNIQUE INDEX IF NOT EXISTS idx_fb_care_platform_message_id ON facebook_care_messages(platform_message_id)')
    await query('CREATE UNIQUE INDEX IF NOT EXISTS idx_fb_care_facebook_id ON facebook_care_customers(facebook_id) WHERE facebook_id IS NOT NULL')
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

