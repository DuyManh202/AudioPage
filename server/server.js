import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { createHmac, timingSafeEqual } from 'crypto'
import { query, withTransaction } from './db.js'
import { findProvince } from './vietnamProvinces.js'
import { handleAiChatRequest, checkDeterministicAiResponse } from './aiChat.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
// Render runs Express behind a proxy; trust its forwarded client IP for rate limiting.
app.set('trust proxy', 1)
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.includes('replace-with')) {
  throw new Error('JWT_SECRET phải được cấu hình và có ít nhất 32 ký tự.')
}

const phoneFromMessage = (value) => {
  const match = String(value || '').match(/(?:\+?84|0)(?:[\s().-]*\d){8,10}/)
  if (!match) return null
  const digits = match[0].replace(/\D/g, '')
  const normalized = digits.startsWith('84') ? `0${digits.slice(2)}` : digits
  return /^0\d{9,10}$/.test(normalized) ? normalized : null
}

const addressFromMessage = value => {
  const text = String(value || '').replace(/\r/g, '\n').trim()
  const labeled = text.match(/(?:địa\s*chỉ(?:\s*(?:nhận hàng|giao hàng))?|địa điểm nhận|đ\s*\/\s*c|đc|giao\s*(?:hàng|về|đến)|ship\s*(?:về|đến|tới)|nhận\s*hàng\s*(?:tại|ở)?|nhà\s*(?:em|anh|chị|mình)\s*(?:ở|tại))\s*[:：-]?\s*([\s\S]+)/i)
  if (!labeled) return null
  let address = labeled[1].trim()
    .split(/\n+/)[0]
    .replace(/\b(?:sđt|số điện thoại|điện thoại|tên khách hàng)\s*[:：-]?.*$/i, '')
    .replace(/(?:\+?84|0)(?:[\s().-]*\d){8,10}/g, '')
    .replace(/^[\s,;:.\-]+|[\s,;:.\-]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 500)
  if (address.length < 8 || !/(\d|phường|xã|quận|huyện|thị trấn|thôn|ấp|tổ|khu phố|đường|phố|ngõ|ngách|hẻm|chung cư|tòa nhà)/i.test(address)) return null
  return address
}

const normalizePhoneForSync = value => {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('84') ? `0${digits.slice(2)}` : digits
}

const phoneLookupKeys = value => {
  const digits = String(value || '').replace(/\D/g, '')
  const local = normalizePhoneForSync(value)
  return [...new Set([digits, local, local.startsWith('0') ? `84${local.slice(1)}` : ''].filter(Boolean))]
}

const syncOpenOrdersForCustomer = async ({ customerName, phone, previousPhone, address }) => {
  const oldPhone = normalizePhoneForSync(previousPhone)
  const newPhone = normalizePhoneForSync(phone)
  // On a number change, the old number is the reliable link to the customer's existing orders.
  const matchPhone = oldPhone && newPhone && oldPhone !== newPhone ? previousPhone : phone || previousPhone
  const keys = phoneLookupKeys(matchPhone)
  if (!keys.length) return 0
  const cleanName = typeof customerName === 'string' && customerName.trim() ? customerName.trim().slice(0, 100) : null
  const cleanPhone = typeof phone === 'string' && phone.trim() ? phone.trim().slice(0, 20) : null
  const cleanAddress = typeof address === 'string' && address.trim() ? address.trim().slice(0, 500) : null
  if (!cleanName && !cleanPhone && !cleanAddress) return 0
  const result = await query(`UPDATE orders
    SET customer_name=COALESCE($1,customer_name), customer_phone=COALESCE($2,customer_phone), shipping_address=COALESCE($3,shipping_address)
    WHERE status IN ('MOI','DA_XAC_NHAN')
      AND regexp_replace(customer_phone,'[^0-9]','','g')=ANY($4::text[])
      AND (customer_name IS DISTINCT FROM COALESCE($1,customer_name)
        OR customer_phone IS DISTINCT FROM COALESCE($2,customer_phone)
        OR shipping_address IS DISTINCT FROM COALESCE($3,shipping_address))
    RETURNING id`, [cleanName, cleanPhone, cleanAddress, keys])
  return result.rowCount || 0
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
const canReadFacebookPageInbox = () => Boolean(process.env.META_PAGE_ID && process.env.META_PAGE_ACCESS_TOKEN && /^v\d+\.\d+$/.test(process.env.META_GRAPH_VERSION || ''))
const isFacebookAiEnabled = () => Boolean(process.env.GEMINI_API_KEY)
const isFacebookAdsConfigured = () => Boolean(process.env.META_AD_ACCOUNT_ID && process.env.META_ADS_ACCESS_TOKEN && /^v\d+\.\d+$/.test(process.env.META_GRAPH_VERSION || ''))

const fetchFacebookProfileName = async (psid) => {
  const { META_PAGE_ACCESS_TOKEN: pageToken, META_GRAPH_VERSION: graphVersion } = process.env
  if (!psid || !pageToken || !graphVersion) return ''
  try {
    const url = new URL(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(psid)}`)
    url.searchParams.set('fields', 'name,first_name,last_name')
    const response = await fetch(url, { headers: { Authorization: `Bearer ${pageToken}` }, signal: AbortSignal.timeout(5000) })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) return ''
    return String(data.name || `${data.first_name || ''} ${data.last_name || ''}`).trim()
  } catch {
    return ''
  }
}

const FB_SYNC_INTERVAL_MS = 25000
let fbSyncInFlight = null
let fbLastSyncMs = 0
let fbLastSyncedAt = null
let fbLastSyncError = ''

const syncFacebookConversations = async ({ force = false } = {}) => {
  if (!canReadFacebookPageInbox()) return { synced: false, configured: false }
  if (!force && fbLastSyncMs > 0 && Date.now() - fbLastSyncMs < FB_SYNC_INTERVAL_MS) {
    return { synced: false, cached: true, lastSyncedAt: fbLastSyncedAt, error: fbLastSyncError }
  }
  if (fbSyncInFlight) return fbSyncInFlight

  fbSyncInFlight = (async () => {
    const { META_PAGE_ID: pageId, META_PAGE_ACCESS_TOKEN: pageToken, META_GRAPH_VERSION: graphVersion } = process.env
    try {
      const fetchConversations = async (fields) => {
        const url = new URL(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(pageId)}/conversations`)
        url.searchParams.set('platform', 'messenger')
        url.searchParams.set('fields', fields)
        url.searchParams.set('limit', '50')
        const res = await fetch(url, { headers: { Authorization: `Bearer ${pageToken}` }, signal: AbortSignal.timeout(15000) })
        const body = await res.json().catch(() => ({}))
        return { ok: res.ok, status: res.status, body }
      }

      let resp = await fetchConversations('id,updated_time,participants,messages.limit(25){id,message,created_time,from,attachments,sticker}')
      if (!resp.ok && resp.body?.error?.code === 100) {
        resp = await fetchConversations('id,updated_time,participants,messages.limit(25){id,message,created_time,from}')
      }
      if (!resp.ok) {
        throw new Error(resp.body?.error?.message || `Meta Conversations API (${resp.status})`)
      }

      let syncedCustomers = 0
      let syncedMessages = 0
      for (const conv of resp.body?.data || []) {
        const participants = Array.isArray(conv.participants?.data) ? conv.participants.data : []
        const rawMessages = Array.isArray(conv.messages?.data) ? conv.messages.data : []
        let participant = participants.find(p => p?.id && String(p.id) !== String(pageId))
        if (!participant) {
          const senderMsg = rawMessages.find(m => m?.from?.id && String(m.from.id) !== String(pageId))
          if (senderMsg?.from) participant = senderMsg.from
        }
        if (!participant?.id) continue

        const psid = String(participant.id)
        const resolvedName = String(participant.name || '').trim() || `Khách Facebook ${psid.slice(-6)}`
        const normalizedMessages = rawMessages
          .map(m => {
            const fromPage = String(m.from?.id || '') === String(pageId)
            const hasMedia = Boolean(m.attachments?.data?.length || m.sticker)
            const text = String(m.message || '').trim() || (hasMedia ? (fromPage ? '[Trang gửi hình ảnh / tệp đính kèm]' : '[Khách gửi hình ảnh / tệp đính kèm]') : '')
            const createdAt = m.created_time && !Number.isNaN(Date.parse(m.created_time)) ? new Date(m.created_time).toISOString() : new Date().toISOString()
            return {
              platformMessageId: m.id ? String(m.id) : null,
              body: text,
              direction: fromPage ? 'OUT' : 'IN',
              createdBy: fromPage ? (m.from?.name || 'Tú Audio Page') : (m.from?.name || resolvedName),
              createdAt
            }
          })
          .filter(m => m.body && m.platformMessageId)
          .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))

        const latestMsg = normalizedMessages[normalizedMessages.length - 1] || null
        const inboundMessages = normalizedMessages.filter(message => message.direction === 'IN')
        const inferredAddress = inboundMessages.slice().reverse().map(message => addressFromMessage(message.body)).find(Boolean)
        const inferredProvince = inboundMessages.slice().reverse().map(message => findProvince(message.body, { requireContext: true })).find(Boolean)
          || (inferredAddress ? findProvince(inferredAddress) : null)
        const inferredPhone = inboundMessages.map(message => phoneFromMessage(message.body)).find(Boolean)
        const convUpdatedIso = conv.updated_time && !Number.isNaN(Date.parse(conv.updated_time))
          ? new Date(conv.updated_time).toISOString()
          : (latestMsg?.createdAt || new Date().toISOString())

        const customerRes = await query(`INSERT INTO facebook_care_customers
          (id, customer_name, facebook_id, phone, status, last_message, province, location_lat, location_lng, address, created_at, updated_at)
          VALUES ($1, $2, $3, $4, 'MOI', $5, $6, $7, $8, $9, $10::timestamptz, $10::timestamptz)
          ON CONFLICT (facebook_id) WHERE facebook_id IS NOT NULL DO UPDATE SET
            customer_name = CASE
              WHEN facebook_care_customers.customer_name LIKE 'Khách Facebook %' AND EXCLUDED.customer_name NOT LIKE 'Khách Facebook %'
              THEN EXCLUDED.customer_name
              ELSE facebook_care_customers.customer_name
            END,
            phone=COALESCE(facebook_care_customers.phone,EXCLUDED.phone),
            last_message = COALESCE(EXCLUDED.last_message, facebook_care_customers.last_message),
            address=COALESCE(NULLIF(facebook_care_customers.address,''),EXCLUDED.address),
            province=CASE WHEN facebook_care_customers.location_manually_set THEN facebook_care_customers.province ELSE COALESCE(EXCLUDED.province,facebook_care_customers.province) END,
            location_lat=CASE WHEN facebook_care_customers.location_manually_set THEN facebook_care_customers.location_lat ELSE COALESCE(EXCLUDED.location_lat,facebook_care_customers.location_lat) END,
            location_lng=CASE WHEN facebook_care_customers.location_manually_set THEN facebook_care_customers.location_lng ELSE COALESCE(EXCLUDED.location_lng,facebook_care_customers.location_lng) END,
            updated_at = GREATEST(facebook_care_customers.updated_at, EXCLUDED.updated_at)
          RETURNING id,customer_name,phone,address`, [
          `FB-${randomUUID()}`, resolvedName, psid, inferredPhone || null, latestMsg?.body || null,
          inferredProvince?.displayName || null, inferredProvince?.lat || null, inferredProvince?.lng || null, inferredAddress || null, convUpdatedIso
        ])
        const syncedCustomer = customerRes.rows[0]
        const customerId = syncedCustomer?.id
        if (!customerId) continue
        if (inferredPhone || inferredProvince || inferredAddress) {
          await syncOpenOrdersForCustomer({ customerName: syncedCustomer.customer_name, phone: syncedCustomer.phone, address: syncedCustomer.address })
        }
        syncedCustomers += 1

        for (const msg of normalizedMessages) {
          await query(`UPDATE facebook_care_messages
            SET platform_message_id = $1
            WHERE id = (
              SELECT id FROM facebook_care_messages
              WHERE customer_id = $2 AND platform_message_id IS NULL AND direction = $3 AND body = $4
                AND ABS(EXTRACT(EPOCH FROM (created_at - $5::timestamptz))) <= 180
              LIMIT 1
            )`, [msg.platformMessageId, customerId, msg.direction, msg.body, msg.createdAt])
          const inserted = await query(`INSERT INTO facebook_care_messages
            (id, customer_id, body, direction, created_by, platform_message_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz)
            ON CONFLICT (platform_message_id) DO NOTHING RETURNING id`,
            [randomUUID(), customerId, msg.body, msg.direction, msg.createdBy, msg.platformMessageId, msg.createdAt])
          if (inserted.rows[0]) syncedMessages += 1
        }
      }

      fbLastSyncMs = Date.now()
      fbLastSyncedAt = new Date(fbLastSyncMs).toISOString()
      fbLastSyncError = ''
      return { synced: true, syncedCustomers, syncedMessages, lastSyncedAt: fbLastSyncedAt, error: '' }
    } catch (err) {
      fbLastSyncMs = Date.now()
      fbLastSyncError = err.message || 'Không đồng bộ được hội thoại từ Fanpage.'
      console.warn('[Facebook Sync] Failed:', fbLastSyncError)
      return { synced: false, lastSyncedAt: fbLastSyncedAt, error: fbLastSyncError }
    } finally {
      fbSyncInFlight = null
    }
  })()

  return fbSyncInFlight
}

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
  return payload
}

const autoReplyToFacebookCustomer = async (customerId, psid) => {
  if (!isFacebookAiEnabled() || !isFacebookMessengerConfigured()) return
  try {
    const [customerResult, historyResult, productsResult, combosResult] = await Promise.all([
      query('SELECT customer_name, interest, notes, status FROM facebook_care_customers WHERE id=$1', [customerId]),
      query('SELECT direction, body FROM facebook_care_messages WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 12', [customerId]),
      query('SELECT name, price, original_price, room_size, bass_size, power_rms, short_desc, specs FROM products WHERE in_stock=TRUE ORDER BY price ASC LIMIT 24'),
      query('SELECT name, price, fast_action_price, room_size, tagline FROM combos ORDER BY price ASC')
    ])
    const customer = customerResult.rows[0]
    if (!customer || customer.status === 'CHO_PHAN_HOI') return

    const msgs = historyResult.rows.reverse()
    const latestInbound = msgs.filter(m => m.direction === 'IN').slice(-1)[0]
    const latestText = latestInbound?.body || ''
    let reply = ''

    // 1. Gọi Gemini 3.8 Flash AI Chuyên Gia
    const productContext = {
      products: productsResult.rows.map(p => ({ ...p, price: Number(p.price), original_price: Number(p.original_price) })),
      combos: combosResult.rows.map(c => ({ ...c, price: Number(c.price), fast_action_price: Number(c.fast_action_price) }))
    }
    const historyFormatted = msgs.map(m => `${m.direction === 'IN' ? 'Khách' : 'Tú Audio'}: ${m.body}`).join('\n')

    const systemInstruction = `Bạn là Trợ lý AI Chuyên Gia Âm Thanh của Tú Audio (thương hiệu âm thanh karaoke gia đình của anh Phùng Văn Tú tại Vĩnh Yên, Vĩnh Phúc).
Bối cảnh & Phong cách:
- Bạn đại diện cho em Tú tư vấn tận tâm cho khách nhắn tin qua Fanpage Facebook.
- Xưng "em" hoặc "em Tú", gọi khách là "bác" hoặc "anh" (phong cách chuyên gia âm thanh miền Bắc gần gũi, chân thành, nhiệt tình, am hiểu kỹ thuật).
- Tuyệt đối trung thực 100%, không bịa đặt số nhà hay giá ngoài danh mục.
THÔNG TIN CHUẨN XÁC 100%:
- Showroom: Số 220 đường Nguyễn Danh Phương, phường Hội Hợp, thành phố Vĩnh Yên, tỉnh Vĩnh Phúc (gần khu Quán Tiên, có chỗ đỗ ô tô thoải mái).
- Hotline / Zalo: 0984.259.898.
- Phần mềm vang số: Đầy đủ link tải driver và phần mềm cho CM x16+, PF K9, X5, X6, S690... trên web hoặc gửi qua Zalo 0984.259.898 kèm hỗ trợ Ultraview.
- Vang số tiêu biểu: CM x16+ (4.200.000đ), PF K9 (6.800.000đ).
- Dàn Karaoke: Combo Gold Home (19.800.000đ), Combo Luxury Home (29.900.000đ).
DANH MỤC SẢN PHẨM: ${JSON.stringify(productContext)}
BỘ NGUYÊN TẮC TƯ VẤN THỰC CHIẾN (7 KỊCH BẢN CHUẨN):
1. Setup tại nhà (Đông Anh, Hà Nội, Bắc Ninh, Hải Phòng, Thanh Hóa...): Em CÓ nhận làm tại nhà, có ghép chuyến các tỉnh nên chi phí rất hợp lý; mời khách gửi ảnh dàn máy qua Zalo 0984.259.898 để em hẹn lịch.
2. Lọc xì / EQ: ĐÃ CÓ VANG SỐ THÌ KHÔNG CẦN LỌC XÌ. Thợ vẽ ra để bán lấy tiền, tín hiệu qua nhiều tầng bị méo pha; giải pháp là chỉnh chuẩn EQ trong vang số.
3. Thu cũ đổi mới: Có nhận thu cũ vang cơ/amply/vang X5 để lên vang số CM x16+ hoặc PF K9. Xin ảnh dàn máy cũ để định giá thu lại cao nhất.
4. Phần mềm vang số: Hỏi rõ model máy, mời kết bạn Zalo 0984.259.898 gửi link Drive và hỗ trợ Ultraview.
5. Nghe thử / đổi trả: Em Tú setup đo RTA trước khi gửi, nhận hàng hát thử ưng ý mới thanh toán, bao test 7 ngày không ưng hoàn tiền.
6. Địa chỉ: Số 220 Nguyễn Danh Phương, P. Hội Hợp, TP. Vĩnh Yên, Vĩnh Phúc.
7. Trả lời ngắn gọn, tự nhiên như tin nhắn Facebook Messenger (2-4 câu).
8. Luôn khéo léo mời khách để lại SĐT/Zalo hoặc nhắn qua Zalo 0984.259.898 để em Tú gửi video test dàn thực tế.`

    try {
      const apiKey = process.env.GEMINI_API_KEY
      const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash'
      const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey

      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemInstruction + '\n\nLỊCH SỬ CHAT:\n' + historyFormatted + '\n\nKhách nhắn: "' + latestText + '"\nTrả lời:' }] }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 2048 }
        }),
        signal: AbortSignal.timeout(15000)
      })

      const geminiData = await geminiRes.json().catch(() => ({}))
      reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    } catch (aiErr) {
      console.warn('[Facebook AI AutoReply Warning]:', aiErr.message)
    }

    // 2. Dự phòng bằng Guardrail cố định nếu mạng hoặc AI gián đoạn
    if (!reply) {
      const fallbackDeterministic = checkDeterministicAiResponse(latestText)
      reply = fallbackDeterministic?.reply || 'Dạ em Tú Audio đây ạ! Bác đang quan tâm đến vang số hay cả bộ dàn cho phòng khách bao nhiêu m2 thế ạ? Bác nhắn em tư vấn cấu hình chuẩn nhất cho bác nhé ạ!'
    }

    const sentPayload = await sendFacebookText(psid, reply)
    await query('INSERT INTO facebook_care_messages (id, customer_id, body, direction, created_by, platform_message_id) VALUES ($1,$2,$3,\'OUT\',\'AI Tú Audio\',$4) ON CONFLICT (platform_message_id) DO NOTHING', [randomUUID(), customerId, reply, sentPayload?.message_id || null])
    await query('UPDATE facebook_care_customers SET last_message=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2', [reply, customerId])
  } catch (err) {
    console.error('[Facebook AI] Auto reply failed:', err.message)
    await query("UPDATE facebook_care_customers SET status='CHO_PHAN_HOI', notes=CONCAT(COALESCE(notes,''), CASE WHEN COALESCE(notes,'')='' THEN '' ELSE E'\\n' END, '[AI chưa trả lời được; cần nhân viên xử lý]'), updated_at=CURRENT_TIMESTAMP WHERE id=$1", [customerId]).catch(() => {})
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
        const [adDetails, profileName] = await Promise.all([
          referralAdId ? fetchMetaAdDetails(String(referralAdId)) : Promise.resolve({}),
          fetchFacebookProfileName(String(psid))
        ])
        const resolvedName = profileName || `Khách Facebook ${psid.slice(-6)}`
        const sourceType = referral.source || (referralAdId ? 'AD' : null)
        const inferredAddress = addressFromMessage(text)
        const inferredProvince = findProvince(text, { requireContext: true }) || (inferredAddress ? findProvince(inferredAddress) : null)
        const inferredPhone = phoneFromMessage(text)
        const customer = await query(`INSERT INTO facebook_care_customers
          (id, customer_name, facebook_id, phone, status, last_message, source_type, source_ad_id, source_ad_name, source_campaign_id, source_campaign_name, province, location_lat, location_lng, address)
          VALUES ($1,$2,$3,$4,'MOI',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
          ON CONFLICT (facebook_id) WHERE facebook_id IS NOT NULL DO UPDATE SET
            customer_name=CASE
              WHEN facebook_care_customers.customer_name LIKE 'Khách Facebook %' AND EXCLUDED.customer_name NOT LIKE 'Khách Facebook %'
              THEN EXCLUDED.customer_name
              ELSE facebook_care_customers.customer_name
            END,
            phone=COALESCE(facebook_care_customers.phone,EXCLUDED.phone),
            last_message=COALESCE(EXCLUDED.last_message,facebook_care_customers.last_message),
            address=COALESCE(NULLIF(facebook_care_customers.address,''),EXCLUDED.address),
            province=CASE WHEN facebook_care_customers.location_manually_set THEN facebook_care_customers.province ELSE COALESCE(EXCLUDED.province,facebook_care_customers.province) END,
            location_lat=CASE WHEN facebook_care_customers.location_manually_set THEN facebook_care_customers.location_lat ELSE COALESCE(EXCLUDED.location_lat,facebook_care_customers.location_lat) END,
            location_lng=CASE WHEN facebook_care_customers.location_manually_set THEN facebook_care_customers.location_lng ELSE COALESCE(EXCLUDED.location_lng,facebook_care_customers.location_lng) END,
            source_type=COALESCE(EXCLUDED.source_type,facebook_care_customers.source_type),
            source_ad_id=COALESCE(EXCLUDED.source_ad_id,facebook_care_customers.source_ad_id),
            source_ad_name=COALESCE(EXCLUDED.source_ad_name,facebook_care_customers.source_ad_name),
            source_campaign_id=COALESCE(EXCLUDED.source_campaign_id,facebook_care_customers.source_campaign_id),
            source_campaign_name=COALESCE(EXCLUDED.source_campaign_name,facebook_care_customers.source_campaign_name),
            updated_at=CURRENT_TIMESTAMP
          RETURNING id,customer_name,phone,address`, [
          `FB-${randomUUID()}`, resolvedName, psid, inferredPhone || null, text || null, sourceType,
          adDetails.adId || referralAdId, adDetails.adName || null, adDetails.campaignId || null, adDetails.campaignName || null,
          inferredProvince?.displayName || null, inferredProvince?.lat || null, inferredProvince?.lng || null, inferredAddress || null
        ])
        const syncedCustomer = customer.rows[0]
        if (syncedCustomer?.phone) {
          await syncOpenOrdersForCustomer({ customerName: syncedCustomer.customer_name, phone: syncedCustomer.phone, address: syncedCustomer.address })
        }
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
const publicSubmissionAttempts = new Map()
const publicSubmissionRateLimit = (req, res, next) => {
  const now = Date.now()
  for (const [ip, attempt] of publicSubmissionAttempts) {
    if (attempt.expiresAt <= now) publicSubmissionAttempts.delete(ip)
  }

  const key = req.ip
  const current = publicSubmissionAttempts.get(key)
  if (!current || current.expiresAt <= now) {
    publicSubmissionAttempts.set(key, { count: 1, expiresAt: now + 15 * 60 * 1000 })
    return next()
  }
  if (current.count >= 20) {
    return res.status(429).json({ success: false, message: 'Bạn gửi yêu cầu liên tục. Vui lòng chờ 15 phút rồi thử lại.' })
  }
  current.count += 1
  next()
}

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
app.post('/api/v1/leads', publicSubmissionRateLimit, async (req, res) => {
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
app.post('/api/v1/trade-ins', publicSubmissionRateLimit, async (req, res) => {
  try {
    const { customerName, customerPhone, customerAddress, oldDeviceName, oldDeviceImages, conditionNote, upgradeToItem } = req.body
    if (typeof customerName !== 'string' || !customerName.trim() || !validPhone(customerPhone) || typeof oldDeviceName !== 'string' || !oldDeviceName.trim() || oldDeviceName.length > 200 || !validOptionalText(customerAddress, 500) || !validOptionalText(oldDeviceImages, 8_000_000) || !validOptionalText(conditionNote, 2000) || !validOptionalText(upgradeToItem, 200)) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp họ tên, SĐT và tên thiết bị cũ' })
    }

    // Tự động tạo lead để ghi nhận vào phễu CRM
    const leadId = 'LD-' + randomUUID()
    const result = await withTransaction(async client => {
      await client.query(
        `INSERT INTO leads (id, name, phone, address, interest, status, notes)
         VALUES ($1, $2, $3, $4, $5, 'MOI', $6)`,
        [
          leadId, customerName.trim(), customerPhone.trim(), customerAddress || '',
          `Thu cũ đổi mới: ${oldDeviceName.trim()} -> ${upgradeToItem || 'Lên đời dàn'}`,
          conditionNote || ''
        ]
      )

      return client.query(`
        INSERT INTO trade_ins (
          lead_id, customer_name, customer_phone, customer_address,
          old_device_name, old_device_images, condition_note, upgrade_to_item, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CHO_DINH_GIA')
        RETURNING *
      `, [
        leadId, customerName.trim(), customerPhone.trim(), customerAddress || '',
        oldDeviceName.trim(), oldDeviceImages || '', conditionNote || '', upgradeToItem || 'Dàn Karaoke 29 Triệu'
      ])
    })

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
app.post('/api/v1/orders', publicSubmissionRateLimit, async (req, res) => {
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
    const result = await withTransaction(async client => {
      const orderResult = await client.query(sql, [
        orderId, customerName.trim(), customerPhone.trim(), shippingAddress.trim(),
        JSON.stringify(trustedItems), trustedTotal, cleanPayMethod, note || ''
      ])

      // Ghi đơn và lead CRM cùng transaction để tránh lưu một nửa khi có lỗi.
      const itemSummary = trustedItems.map(i => `${i.quantity}x ${i.name}`).join(', ')
      const payLabel = cleanPayMethod === 'BANK' ? 'Chuyển khoản' : 'COD'
      await client.query(
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
      return orderResult
    })

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
// 1.4 AI CHATBOT TÚ AUDIO (TỰ ĐỘNG TƯ VẤN & CRM MAP AUTO-SYNC)
// ==========================================
app.post('/api/v1/ai-chat', handleAiChatRequest)

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

    const existingResult = await query('SELECT name,phone,address FROM leads WHERE id=$1', [id])
    const existingLead = existingResult.rows[0]

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
    const updatedLead = result.rows[0]
    const nameChanged = name !== undefined && name !== existingLead?.name
    const phoneChanged = phone !== undefined && phone !== existingLead?.phone
    const addressChanged = address !== undefined && address !== existingLead?.address
    const customerFieldsChanged = nameChanged || phoneChanged || addressChanged
    const syncedOrders = customerFieldsChanged ? await syncOpenOrdersForCustomer({
      customerName: nameChanged ? updatedLead.name : null,
      phone: updatedLead.phone,
      previousPhone: phoneChanged ? existingLead?.phone : null,
      address: addressChanged ? updatedLead.address : null
    }) : 0
    res.json({ success: true, data: mapLeadRow(updatedLead), syncedOrders })
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
  address: row.address || '', province: row.province || '', locationLat: row.location_lat == null ? null : Number(row.location_lat), locationLng: row.location_lng == null ? null : Number(row.location_lng),
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
    const forceSync = req.query.sync === 'force'
    if (canReadFacebookPageInbox() && (forceSync || Date.now() - fbLastSyncMs >= FB_SYNC_INTERVAL_MS)) {
      await Promise.race([
        syncFacebookConversations({ force: forceSync }),
        new Promise(resolve => setTimeout(resolve, 10000))
      ])
    }
    const result = await query(`SELECT c.*, COALESCE(json_agg(json_build_object('id', m.id, 'body', m.body, 'direction', m.direction, 'createdAt', m.created_at) ORDER BY m.created_at) FILTER (WHERE m.id IS NOT NULL), '[]') AS messages
      FROM facebook_care_customers c LEFT JOIN facebook_care_messages m ON m.customer_id = c.id
      GROUP BY c.id ORDER BY c.updated_at DESC`)
    const connected = isFacebookMessengerConfigured()
    res.json({
      success: true,
      data: result.rows.map(mapFbCare),
      connected,
      aiEnabled: isFacebookAiEnabled(),
      lastSyncedAt: fbLastSyncedAt,
      syncError: fbLastSyncError || ''
    })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

app.get('/api/v1/admin/customer-map', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const [fbResult, leadResult, ordersResult] = await Promise.all([
      query(`SELECT c.id,c.customer_name,c.facebook_id,c.phone,c.address,c.province,c.location_lat,c.location_lng,c.interest,c.last_message,c.status,c.source_ad_name,c.updated_at,
        visits.visited_at,visits.visited_by,
        COALESCE(product_image.image_url,combo_image.image_url,'') AS interest_image, combo_image.video_url AS interest_video_url
        FROM facebook_care_customers c
        LEFT JOIN customer_map_visits visits ON visits.record_type='FACEBOOK' AND visits.record_id=c.id
        LEFT JOIN LATERAL (SELECT p.image_url FROM products p WHERE LOWER(COALESCE(NULLIF(c.interest,''),c.last_message,'')) LIKE '%' || LOWER(p.name) || '%' LIMIT 1) product_image ON TRUE
        LEFT JOIN LATERAL (SELECT p.image_url,co.video_url FROM combos co JOIN combo_components cc ON cc.combo_id=co.id JOIN products p ON p.id=cc.product_id OR LOWER(cc.item_name) LIKE '%' || LOWER(p.name) || '%' WHERE LOWER(COALESCE(NULLIF(c.interest,''),c.last_message,'')) LIKE '%' || LOWER(SPLIT_PART(co.name,'—',1)) || '%' ORDER BY cc.sort_order LIMIT 1) combo_image ON TRUE
        ORDER BY c.updated_at DESC`),
      query(`SELECT l.id,l.name AS customer_name,l.phone,l.address,l.interest,l.status,l.updated_at,
        visits.visited_at,visits.visited_by,
        COALESCE(product_image.image_url,combo_image.image_url,'') AS interest_image, combo_image.video_url AS interest_video_url
        FROM leads l
        LEFT JOIN customer_map_visits visits ON visits.record_type='LEAD' AND visits.record_id=l.id
        LEFT JOIN LATERAL (SELECT p.image_url FROM products p WHERE LOWER(COALESCE(l.interest,'')) LIKE '%' || LOWER(p.name) || '%' LIMIT 1) product_image ON TRUE
        LEFT JOIN LATERAL (SELECT p.image_url,co.video_url FROM combos co JOIN combo_components cc ON cc.combo_id=co.id JOIN products p ON p.id=cc.product_id OR LOWER(cc.item_name) LIKE '%' || LOWER(p.name) || '%' WHERE LOWER(COALESCE(l.interest,'')) LIKE '%' || LOWER(SPLIT_PART(co.name,'—',1)) || '%' ORDER BY cc.sort_order LIMIT 1) combo_image ON TRUE
        ORDER BY l.updated_at DESC`),
      query(`SELECT id,customer_name,customer_phone,shipping_address,status,created_at FROM orders
        WHERE status IN ('DA_XAC_NHAN','DANG_GIAO') ORDER BY created_at DESC`)
    ])
    const byPhone = new Map()
    let unlocatedCount = 0
    const normalizePhone = value => String(value || '').replace(/\D/g, '').replace(/^84/, '0')
    const videoThumbnail = value => {
      const match = String(value || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)
      return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : ''
    }
    const add = (row, type) => {
      const province = findProvince(row.province) || findProvince(row.address)
      const lat = row.location_lat == null ? province?.lat : Number(row.location_lat)
      const lng = row.location_lng == null ? province?.lng : Number(row.location_lng)
      if (!province || !Number.isFinite(lat) || !Number.isFinite(lng)) { unlocatedCount += 1; return }
      const phoneKey = normalizePhone(row.phone)
      const previous = phoneKey ? byPhone.get(phoneKey) : null
      const record = {
        id: row.id,
        recordType: type,
        customerName: row.customer_name || 'Khách hàng',
        facebookId: row.facebook_id || '',
        phone: row.phone || previous?.phone || '',
        address: row.address || previous?.address || '',
        province: province.displayName,
        lat, lng,
        locationPrecision: row.location_lat == null ? 'PROVINCE' : 'PROVINCE',
        interest: row.interest || row.last_message || previous?.interest || '',
        interestImage: row.interest_image || videoThumbnail(row.interest_video_url) || previous?.interestImage || '',
        status: row.status || '',
        sourceAdName: row.source_ad_name || '',
        visitedAt: row.visited_at || '',
        visitedBy: row.visited_by || '',
        updatedAt: row.updated_at,
        facebookCareId: type === 'FACEBOOK' ? row.id : previous?.facebookCareId || '',
        leadId: type === 'LEAD' ? row.id : previous?.leadId || ''
      }
      if (phoneKey && previous) {
        const incomingIsNewer = Date.parse(record.updatedAt || 0) >= Date.parse(previous.updatedAt || 0)
        const newest = incomingIsNewer ? record : previous
        const visitTime = value => value ? (Date.parse(value) || 0) : 0
        const newestVisit = visitTime(record.visitedAt) >= visitTime(previous.visitedAt) ? record : previous
        byPhone.set(phoneKey, {
          ...previous, ...record,
          customerName: newest.customerName || previous.customerName,
          province: newest.province || previous.province,
          lat: newest.lat ?? previous.lat,
          lng: newest.lng ?? previous.lng,
          address: newest.address || record.address || previous.address,
          interest: newest.interest || record.interest || previous.interest,
          interestImage: newest.interestImage || record.interestImage || previous.interestImage,
          visitedAt: newestVisit.visitedAt || '',
          visitedBy: newestVisit.visitedBy || '',
          phone: record.phone || previous.phone,
          facebookCareId: record.facebookCareId || previous.facebookCareId,
          leadId: record.leadId || previous.leadId,
          recordType: record.facebookCareId || previous.facebookCareId ? 'FACEBOOK' : newest.recordType,
          updatedAt: newest.updatedAt || previous.updatedAt
        })
      } else {
        byPhone.set(phoneKey || `${type}:${row.id}`, record)
      }
    }
    leadResult.rows.forEach(row => add(row, 'LEAD'))
    fbResult.rows.forEach(row => add(row, 'FACEBOOK'))
    const deliveryOrders = ordersResult.rows.flatMap(row => {
      const province = findProvince(row.shipping_address)
      return province ? [{ id: row.id, customerName: row.customer_name || 'Khách đặt hàng', phone: row.customer_phone || '', address: row.shipping_address || '', status: row.status, lat: province.lat, lng: province.lng, province: province.displayName, locationPrecision: 'PROVINCE' }] : []
    })
    res.json({ success: true, data: [...byPhone.values()], deliveryOrders, unlocatedCount, origin: { address: '43 Hùng Vương, Phường Vĩnh Yên, Phú Thọ', lat: 21.31, lng: 105.60 } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.patch('/api/v1/admin/customer-map/:recordType/:id/visit', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const recordType = String(req.params.recordType || '').toUpperCase()
    const { visited } = req.body || {}
    if (!['FACEBOOK', 'LEAD'].includes(recordType) || typeof visited !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Thông tin đánh dấu lượt ghé thăm không hợp lệ.' })
    }
    const linked = Array.isArray(req.body?.linkedRecords) ? req.body.linkedRecords.slice(0, 2) : []
    const records = [...new Map([{ recordType, id: req.params.id }, ...linked]
      .filter(record => ['FACEBOOK', 'LEAD'].includes(String(record?.recordType || '').toUpperCase()) && typeof record?.id === 'string' && record.id.length <= 50)
      .map(record => [`${String(record.recordType).toUpperCase()}:${record.id}`, { recordType: String(record.recordType).toUpperCase(), id: record.id }])).values()]
    for (const record of records) {
      const table = record.recordType === 'FACEBOOK' ? 'facebook_care_customers' : 'leads'
      const exists = await query(`SELECT id FROM ${table} WHERE id=$1`, [record.id])
      if (!exists.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ khách hàng.' })
    }
    for (const record of records) {
      if (visited) {
        await query(`INSERT INTO customer_map_visits (record_type,record_id,visited_at,visited_by)
          VALUES ($1,$2,CURRENT_TIMESTAMP,$3)
          ON CONFLICT (record_type,record_id) DO UPDATE SET visited_at=CURRENT_TIMESTAMP,visited_by=EXCLUDED.visited_by`, [record.recordType, record.id, req.admin.name])
      } else {
        await query('DELETE FROM customer_map_visits WHERE record_type=$1 AND record_id=$2', [record.recordType, record.id])
      }
    }
    res.json({ success: true, visited })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

app.post('/api/v1/admin/facebook-care/sync', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const syncInfo = await syncFacebookConversations({ force: true })
    if (!syncInfo.configured && syncInfo.configured !== undefined) {
      return res.status(503).json({ success: false, message: 'Chưa cấu hình META_PAGE_ID và META_PAGE_ACCESS_TOKEN trên backend.' })
    }
    if (syncInfo.error) {
      return res.status(502).json({ success: false, message: syncInfo.error, lastSyncedAt: syncInfo.lastSyncedAt })
    }
    res.json({ success: true, ...syncInfo })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

app.post('/api/v1/admin/facebook-care', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const { customerName, facebookId, phone, interest, notes, followUpAt, address, province } = req.body
    if (!String(customerName || '').trim()) return res.status(400).json({ success: false, message: 'Vui lòng nhập tên khách hàng.' })
    if (!validOptionalText(address, 500)) return res.status(400).json({ success: false, message: 'Địa chỉ không hợp lệ.' })
    const id = `FB-${randomUUID()}`
    const detectedProvince = findProvince(province || address)
    const result = await query(`INSERT INTO facebook_care_customers (id, customer_name, facebook_id, phone, interest, notes, follow_up_at, assigned_to, address, province, location_lat, location_lng, location_manually_set)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`, [id, String(customerName).trim(), facebookId || null, phone || null, interest || null, notes || null, followUpAt || null, req.admin.name, address || null, detectedProvince?.displayName || null, detectedProvince?.lat ?? null, detectedProvince?.lng ?? null, Boolean(detectedProvince)])
    const customer = result.rows[0]
    const syncedOrders = await syncOpenOrdersForCustomer({ customerName: customer.customer_name, phone: customer.phone, address: customer.address })
    res.status(201).json({ success: true, data: mapFbCare({ ...customer, messages: [] }), syncedOrders })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

app.patch('/api/v1/admin/facebook-care/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const { status, notes, phone, interest, assignedTo, followUpAt, customerName, address, province } = req.body
    const validStatuses = ['MOI', 'DANG_TU_VAN', 'CHO_PHAN_HOI', 'DA_CHOT', 'DA_HUY']
    if (status !== undefined && !validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Trạng thái chăm sóc không hợp lệ.' })
    if (!validOptionalText(address, 500) || !validOptionalText(province, 100)) return res.status(400).json({ success: false, message: 'Địa chỉ hoặc tỉnh/thành không hợp lệ.' })
    const locationChanged = address !== undefined || province !== undefined
    const detectedProvince = locationChanged ? findProvince(province || address) : null
    const existingResult = await query('SELECT customer_name,phone,address FROM facebook_care_customers WHERE id=$1', [req.params.id])
    const existingCustomer = existingResult.rows[0]
    if (!existingCustomer) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ khách Facebook.' })
    const result = await query(`UPDATE facebook_care_customers SET
      customer_name=COALESCE($1,customer_name), phone=COALESCE($2,phone), interest=COALESCE($3,interest), notes=COALESCE($4,notes),
      status=COALESCE($5,status), assigned_to=COALESCE($6,assigned_to), follow_up_at=$7,
      address=COALESCE($8,address), province=COALESCE($9,province), location_lat=COALESCE($10,location_lat), location_lng=COALESCE($11,location_lng),
      location_manually_set=CASE WHEN $12 THEN TRUE ELSE location_manually_set END, updated_at=CURRENT_TIMESTAMP
      WHERE id=$13 RETURNING *`, [customerName ?? null, phone ?? null, interest ?? null, notes ?? null, status ?? null, assignedTo ?? null, followUpAt || null, address ?? null, detectedProvince?.displayName || null, detectedProvince?.lat ?? null, detectedProvince?.lng ?? null, locationChanged && Boolean(detectedProvince), req.params.id])
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ khách Facebook.' })
    const updatedCustomer = result.rows[0]
    const nameChanged = updatedCustomer.customer_name !== existingCustomer.customer_name
    const phoneChanged = updatedCustomer.phone !== existingCustomer.phone
    const addressChanged = updatedCustomer.address !== existingCustomer.address
    const syncedOrders = nameChanged || phoneChanged || addressChanged ? await syncOpenOrdersForCustomer({
      customerName: nameChanged ? updatedCustomer.customer_name : null,
      phone: updatedCustomer.phone,
      previousPhone: phoneChanged ? existingCustomer.phone : null,
      address: addressChanged ? updatedCustomer.address : null
    }) : 0
    res.json({ success: true, data: mapFbCare({ ...updatedCustomer, messages: [] }), syncedOrders })
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
    let sentPayload
    try { sentPayload = await sendFacebookText(customer.facebook_id, text) } catch (err) { return res.status(502).json({ success: false, message: err.message || 'Meta chưa nhận tin nhắn. Hãy kiểm tra quyền Page và token.' }) }
    const saved = await query("INSERT INTO facebook_care_messages (id, customer_id, body, direction, created_by, platform_message_id) VALUES ($1,$2,$3,'OUT',$4,$5) ON CONFLICT (platform_message_id) DO UPDATE SET created_by=EXCLUDED.created_by RETURNING id, body, direction, created_at", [randomUUID(), customer.id, text, req.admin.name, sentPayload?.message_id || null])
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
      notes TEXT, last_message TEXT, address TEXT, province VARCHAR(100), location_lat DOUBLE PRECISION, location_lng DOUBLE PRECISION,
      location_manually_set BOOLEAN NOT NULL DEFAULT FALSE, source_type VARCHAR(50), source_ad_id VARCHAR(100), source_ad_name VARCHAR(255),
      source_campaign_id VARCHAR(100), source_campaign_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`)
    await query('ALTER TABLE facebook_care_customers ADD COLUMN IF NOT EXISTS address TEXT')
    await query('ALTER TABLE facebook_care_customers ADD COLUMN IF NOT EXISTS province VARCHAR(100)')
    await query('ALTER TABLE facebook_care_customers ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION')
    await query('ALTER TABLE facebook_care_customers ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION')
    await query('ALTER TABLE facebook_care_customers ADD COLUMN IF NOT EXISTS location_manually_set BOOLEAN NOT NULL DEFAULT FALSE')
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
    await query(`CREATE TABLE IF NOT EXISTS customer_map_visits (
      record_type VARCHAR(20) NOT NULL CHECK (record_type IN ('FACEBOOK','LEAD')),
      record_id VARCHAR(50) NOT NULL,
      visited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      visited_by VARCHAR(100) NOT NULL,
      PRIMARY KEY (record_type,record_id)
    )`)
  } catch (err) {
    console.error('⚠️ Cảnh báo kiểm tra schema khi khởi động:', err.message)
  }
}

// Khởi chạy máy chủ
ensureDatabaseSchema().finally(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Backend API Server đang chạy tại: http://localhost:${PORT}`)
    if (canReadFacebookPageInbox()) {
      syncFacebookConversations({ force: true }).catch(() => {})
    }
    setInterval(() => {
      if (canReadFacebookPageInbox()) syncFacebookConversations().catch(() => {})
    }, 45000).unref()
  })
})

