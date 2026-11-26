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
import { findProvince, VIETNAM_PROVINCES, normalizeVietnamText } from './vietnamProvinces.js'
import { handleAiChatRequest, checkDeterministicAiResponse } from './aiChat.js'
import { handleFacebookComment } from './facebookCommentHandler.js'
import { getAiPsychologicalTrainingContext, clearAiPsychologicalTrainingCache } from './aiPsychologicalTraining.js'
import { extractCustomerInterest } from './interestExtractor.js'
import { dispatchOtpEmail, maskEmail } from './emailService.js'
import { catalogProducts } from './catalogProducts.js'
import {
  securityHeadersMiddleware,
  createWafMiddleware,
  globalApiRateLimit,
  aiChatProtection,
  getWafBlockedIps,
  unbanWafIp,
  getClientIp
} from './securityWaf.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
// Render runs Express behind a proxy; trust its forwarded client IP for rate limiting.
app.set('trust proxy', 1)
app.use(securityHeadersMiddleware)
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.includes('replace-with')) {
  throw new Error('JWT_SECRET phải được cấu hình và có ít nhất 32 ký tự.')
}

const isValidViMobilePhone = (phone) => {
  if (!phone) return false
  const digits = String(phone).replace(/\D/g, '')
  const normalized = digits.startsWith('84') ? `0${digits.slice(2)}` : digits
  return /^0[35789]\d{8}$/.test(normalized) || /^02\d{9}$/.test(normalized)
}

const phoneFromMessage = (value) => {
  if (!value) return null
  const text = String(value)
  // Bỏ qua tin nhắn hệ thống giới thiệu bài viết / bình luận của Facebook và URL
  if (text.includes('facebook.com') || text.includes('story.php') || text.includes('comment_id') || text.includes('Facebook tạo đoạn chat')) {
    return null
  }
  // Bắt số điện thoại di động Việt Nam (10 chữ số bắt đầu bằng 03, 05, 07, 08, 09 hoặc +84)
  // Đảm bảo đứng độc lập, không bị lẫn trong chuỗi ID dài (như 100037075765648)
  const matches = text.match(/(?<!\d)(?:(?:\+?84|0)[35789])(?:[\s().-]*\d){8}(?!\d)/g)
  if (!matches) return null
  for (const m of matches) {
    const digits = m.replace(/\D/g, '')
    const normalized = digits.startsWith('84') ? `0${digits.slice(2)}` : digits
    if (/^0[35789]\d{8}$/.test(normalized)) {
      return normalized
    }
  }
  return null
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

export { extractCustomerInterest } from './interestExtractor.js'

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

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true)
    if (
      allowedOrigins.includes(origin) ||
      origin === 'https://amek.io.vn' ||
      origin === 'http://amek.io.vn' ||
      origin.endsWith('.amek.io.vn') ||
      origin === 'https://audioshop.vercel.app' ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true)
    }
    return callback(null, false)
  },
  credentials: true
}))
app.use(express.json({ limit: '10mb', verify: (req, res, buffer) => { req.rawBody = Buffer.from(buffer) } }))

const formatUtcIso = (val) => {
  if (!val) return ''
  const str = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(str) && !str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
    return str.replace(' ', 'T') + 'Z'
  }
  return new Date(val).toISOString()
}

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
  createdAt: row.created_at ? formatUtcIso(row.created_at) : '',
  name: row.name,
  phone: row.phone,
  address: row.address || '',
  interest: row.interest || 'Tư vấn âm thanh',
  roomInfo: row.room_info || '',
  status: row.status,
  appointmentDate: row.appointment_date ? formatUtcIso(row.appointment_date) : '',
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
    const result = await query('SELECT id, username, full_name, role, is_active, permissions, COALESCE(auth_version, 0) AS auth_version FROM admins WHERE id = $1', [decoded.id])
    const admin = result.rows[0]
    if (!admin || !admin.is_active) {
      return res.status(401).json({ success: false, message: 'Tài khoản đã bị khóa hoặc không còn tồn tại.' })
    }
    if (Number(admin.auth_version ?? 0) !== Number(decoded.authVersion ?? 0)) {
      return res.status(401).json({ success: false, message: 'Tài khoản đã thay đổi. Vui lòng đăng nhập lại.' })
    }
    req.admin = {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      name: admin.full_name,
      permissions: Array.isArray(admin.permissions) ? admin.permissions : []
    }
    next()
  } catch (err) {
    console.error('[authenticateAdmin] DB error:', err.message)
    return res.status(500).json({ success: false, message: 'Không thể xác thực tài khoản lúc này.' })
  }
}

/**
 * Phân tích User-Agent để xác định thiết bị và trình duyệt
 */
const parseUserAgent = (uaString = '') => {
  const ua = String(uaString || '').toLowerCase()
  let deviceType = 'Desktop'
  if (/mobile|android|iphone|ipod/.test(ua)) {
    deviceType = 'Điện thoại'
  } else if (/ipad|tablet/.test(ua)) {
    deviceType = 'Máy tính bảng'
  } else {
    deviceType = 'Máy tính (PC/Laptop)'
  }

  let browser = 'Trình duyệt Web'
  if (/edg\//.test(ua)) browser = 'Microsoft Edge'
  else if (/chrome\//.test(ua)) browser = 'Google Chrome'
  else if (/safari\//.test(ua) && !/chrome/.test(ua)) browser = 'Apple Safari'
  else if (/firefox\//.test(ua)) browser = 'Mozilla Firefox'

  let os = ''
  if (/windows/.test(ua)) os = 'Windows'
  else if (/macintosh|mac os/.test(ua)) os = 'macOS'
  else if (/iphone|ipad/.test(ua)) os = 'iOS'
  else if (/android/.test(ua)) os = 'Android'
  else if (/linux/.test(ua)) os = 'Linux'

  return {
    deviceType,
    browser: os ? `${browser} (${os})` : browser
  }
}

/**
 * Ghi nhật ký lịch sử thao tác hệ thống (Audit Trail)
 */
const recordAuditLog = async ({
  admin,
  action,
  actionType,
  targetType = null,
  targetId = null,
  summary,
  details = {},
  req = null
}) => {
  try {
    const ip = req ? getClientIp(req) : null
    const adminId = admin?.id || null
    const adminUsername = admin?.username || 'system'
    const adminName = admin?.name || admin?.full_name || 'Hệ thống'
    const adminRole = admin?.role || 'SYSTEM'

    const enrichedDetails = { ...details }
    if (req) {
      const ua = req.headers['user-agent'] || ''
      const uaInfo = parseUserAgent(ua)
      enrichedDetails._client = {
        device: uaInfo.deviceType,
        browser: uaInfo.browser,
        method: req.method,
        path: req.originalUrl || req.url,
        ip
      }
    }

    await query(
      `INSERT INTO admin_audit_logs (id, admin_id, admin_username, admin_name, admin_role, action, action_type, target_type, target_id, summary, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        randomUUID(),
        adminId,
        adminUsername,
        adminName,
        adminRole,
        action,
        actionType,
        targetType,
        targetId ? String(targetId) : null,
        summary,
        JSON.stringify(enrichedDetails || {}),
        ip
      ]
    )
  } catch (err) {
    console.error('[recordAuditLog] Lỗi ghi nhật ký:', err.message)
  }
}

// ==============================================================================
// KÍCH HOẠT HỆ THỐNG BẢO MẬT WAF TOÀN CỤC (ACTIVE ENTERPRISE FIREWALL)
// ==============================================================================
app.use('/api/', globalApiRateLimit)
app.use(createWafMiddleware(recordAuditLog))

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.admin?.role)) {
    return res.status(403).json({ success: false, message: 'Tài khoản không có quyền thực hiện thao tác này.' })
  }
  next()
}

/**
 * Middleware phân quyền sâu (Granular Permission Check)
 * Super Admin luôn có toàn quyền bypass
 */
const authorizePermission = (...requiredPerms) => (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' })
  }
  if (req.admin.role === 'SUPER_ADMIN' || req.admin.permissions?.includes('*')) {
    return next()
  }
  const userPerms = req.admin.permissions || []
  const hasPerm = requiredPerms.some(p => userPerms.includes(p))
  if (!hasPerm) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện thao tác này. Vui lòng liên hệ Quản trị viên cấp cao.'
    })
  }
  next()
}

const validPhone = (phone) => /^\+?[0-9][0-9\s().-]{7,19}$/.test(String(phone || '').trim())
const validEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
const validMoney = (value) => (typeof value === 'number' || typeof value === 'string' && value.trim() !== '') && Number.isSafeInteger(Number(value)) && Number(value) >= 0
const validOptionalText = (value, maxLength) => value === undefined || value === null || typeof value === 'string' && value.length <= maxLength
const validRoles = new Set(['SUPER_ADMIN', 'SALES', 'INVENTORY', 'PENDING', 'CUSTOM'])
const validCategories = new Set(['loa-full', 'loa-sub', 'cuc-day', 'vang-so-micro', 'loa-di-dong'])

const getSystemSetting = async (key, defaultValue) => {
  try {
    const res = await query('SELECT value FROM system_settings WHERE key = $1', [key])
    return res.rows[0]?.value !== undefined ? res.rows[0].value : defaultValue
  } catch {
    return defaultValue
  }
}

const setSystemSetting = async (key, value) => {
  await query(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES ($1, $2::jsonb, CURRENT_TIMESTAMP)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
  `, [key, JSON.stringify(value)])
}

const getGeminiApiKey = async () => {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY
  return await getSystemSetting('gemini_api_key', '')
}

const getGeminiModel = async () => {
  if (process.env.GEMINI_MODEL) return process.env.GEMINI_MODEL
  return await getSystemSetting('gemini_model', 'gemini-3.8-flash')
}

let cachedMetaPageAccessToken = ''

const getMetaPageAccessToken = async (forceRefresh = false) => {
  if (!forceRefresh && cachedMetaPageAccessToken) return cachedMetaPageAccessToken
  let dbToken = await getSystemSetting('meta_page_access_token', '')
  if (typeof dbToken === 'string') {
    try {
      const parsed = JSON.parse(dbToken)
      if (typeof parsed === 'string') dbToken = parsed
    } catch {}
  }
  if (dbToken && typeof dbToken === 'string' && dbToken.startsWith('EAA')) {
    cachedMetaPageAccessToken = dbToken.trim()
    return cachedMetaPageAccessToken
  }
  if (process.env.META_PAGE_ACCESS_TOKEN) {
    cachedMetaPageAccessToken = process.env.META_PAGE_ACCESS_TOKEN.trim()
    return cachedMetaPageAccessToken
  }
  return ''
}

const isFacebookMessengerConfigured = () => Boolean(process.env.META_PAGE_ID && /^v\d+\.\d+$/.test(process.env.META_GRAPH_VERSION || ''))
const canReadFacebookPageInbox = () => Boolean(process.env.META_PAGE_ID && /^v\d+\.\d+$/.test(process.env.META_GRAPH_VERSION || ''))
const isFacebookAiEnabled = async () => {
  const apiKey = await getGeminiApiKey()
  if (!apiKey) return false
  const enabled = await getSystemSetting('facebook_ai_enabled', true)
  return Boolean(enabled)
}
const isFacebookCommentAiEnabled = async () => {
  const apiKey = await getGeminiApiKey()
  if (!apiKey) return false
  const enabled = await getSystemSetting('facebook_comment_ai_enabled', true)
  return Boolean(enabled)
}
const isWebAiEnabled = async () => {
  const enabled = await getSystemSetting('web_ai_enabled', true)
  return Boolean(enabled)
}
let cachedMetaAdsAccessToken = ''
const getMetaAdsAccessToken = async (forceRefresh = false) => {
  if (!forceRefresh && cachedMetaAdsAccessToken) return cachedMetaAdsAccessToken
  let dbToken = await getSystemSetting('meta_ads_access_token', '')
  if (typeof dbToken === 'string') {
    try {
      const parsed = JSON.parse(dbToken)
      if (typeof parsed === 'string') dbToken = parsed
    } catch {}
  }
  if (dbToken && typeof dbToken === 'string' && dbToken.startsWith('EAA')) {
    cachedMetaAdsAccessToken = dbToken.trim()
    return cachedMetaAdsAccessToken
  }
  if (process.env.META_ADS_ACCESS_TOKEN) {
    cachedMetaAdsAccessToken = process.env.META_ADS_ACCESS_TOKEN.trim()
    return cachedMetaAdsAccessToken
  }
  return ''
}
const isFacebookAdsConfigured = () => Boolean(process.env.META_AD_ACCOUNT_ID && /^v\d+\.\d+$/.test(process.env.META_GRAPH_VERSION || ''))

const fetchFacebookProfileName = async (psid) => {
  const pageToken = await getMetaPageAccessToken()
  const { META_GRAPH_VERSION: graphVersion } = process.env
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

const isSystemFacebookNotice = (body) => {
  if (!body) return false
  const str = String(body).trim()
  return (
    str.startsWith('Facebook tạo đoạn chat') ||
    str.includes('Facebook tạo đoạn chat này vì') ||
    str.includes('đã trả lời tin nhắn chào mừng tự động') ||
    str.includes('Để thay đổi hoặc gỡ lời chào này') ||
    str.startsWith('Đã thêm nhãn tự động:') ||
    str.includes('Đã đặt giai đoạn của khách hàng tiềm năng') ||
    str.includes('Đoạn chat này chưa dùng được tính năng phản hồi bằng AI') ||
    str.includes('Bạn có muốn được chỉ định cho cuộc trò chuyện này') ||
    str.includes('Bạn đã được chỉ định cho cuộc trò chuyện này')
  )
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
    const pageToken = await getMetaPageAccessToken()
    const { META_PAGE_ID: pageId, META_GRAPH_VERSION: graphVersion } = process.env
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

      let resp = await fetchConversations('id,updated_time,participants,messages.limit(25){id,message,created_time,from,attachments{image_data,file_url,video_data,name,mime_type},sticker}')
      if (!resp.ok && resp.body?.error?.code === 100) {
        resp = await fetchConversations('id,updated_time,participants,messages.limit(25){id,message,created_time,from,attachments,sticker}')
      }
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
          .map((m, index) => {
            const fromPage = String(m.from?.id || '') === String(pageId)
            const rawAttachments = Array.isArray(m.attachments?.data) ? m.attachments.data : []
            const isSticker = Boolean(m.sticker) || rawAttachments.some(att => att.type === 'sticker' || Boolean(att.payload?.sticker_id) || String(att.name || '').toLowerCase().includes('like'))
            const attachments = rawAttachments.map(att => {
              const url = att.image_data?.url || att.file_url || att.video_data?.url || ''
              const previewUrl = att.image_data?.preview_url || url
              const type = isSticker ? 'sticker' : (att.image_data ? 'image' : (att.video_data ? 'video' : (att.mime_type?.startsWith('image/') ? 'image' : 'file')))
              return { url, previewUrl, type, name: att.name || '' }
            }).filter(a => Boolean(a.url))

            const hasMedia = attachments.length > 0 || Boolean(m.sticker)
            let text = String(m.message || '').trim()
            if (!text && hasMedia) {
              if (isSticker) {
                text = fromPage ? '[Trang gửi icon / nhãn dán 👍]' : '[Khách gửi icon / nhãn dán 👍]'
              } else {
                text = fromPage ? '[Trang gửi hình ảnh / tệp đính kèm]' : '[Khách gửi hình ảnh / tệp đính kèm]'
              }
            }
            const createdAt = m.created_time && !Number.isNaN(Date.parse(m.created_time)) ? new Date(m.created_time).toISOString() : new Date().toISOString()
            return {
              rawIndex: index,
              platformMessageId: m.id ? String(m.id) : null,
              body: text,
              direction: fromPage ? 'OUT' : 'IN',
              createdBy: fromPage ? (m.from?.name || 'Tú Audio Page') : (m.from?.name || resolvedName),
              createdAt,
              attachments
            }
          })
          .filter(m => m.body && m.platformMessageId)
          .sort((a, b) => {
            const diff = Date.parse(a.createdAt) - Date.parse(b.createdAt)
            if (diff !== 0) return diff
            // Cùng giây: tin nhắn chào mừng (OUT) luôn đứng trước tin nhắn của khách (IN)
            if (a.direction === 'OUT' && b.direction === 'IN') return -1
            if (a.direction === 'IN' && b.direction === 'OUT') return 1
            return b.rawIndex - a.rawIndex
          })

        const latestMsg = normalizedMessages[normalizedMessages.length - 1] || null
        // Lấy tin nhắn thực chất nhất (bỏ qua toàn bộ thông báo hệ thống / nhãn tự động Facebook)
        const realMsgs = normalizedMessages.filter(m => !isSystemFacebookNotice(m.body))
        const displayLatestMsg = realMsgs[realMsgs.length - 1] || latestMsg
        const inboundMessages = normalizedMessages.filter(message => message.direction === 'IN')
        const inferredAddress = inboundMessages.slice().reverse().map(message => addressFromMessage(message.body)).find(Boolean)
        const inferredProvince = inboundMessages.slice().reverse().map(message => findProvince(message.body, { requireContext: true })).find(Boolean)
          || (inferredAddress ? findProvince(inferredAddress) : null)
        const inferredPhone = inboundMessages.map(message => phoneFromMessage(message.body)).find(Boolean)
        const inferredInterest = extractCustomerInterest(inboundMessages.map(m => m.body), displayLatestMsg?.body || latestMsg?.body || '')
        const convUpdatedIso = conv.updated_time && !Number.isNaN(Date.parse(conv.updated_time))
          ? new Date(conv.updated_time).toISOString()
          : (latestMsg?.createdAt || new Date().toISOString())

        const customerRes = await query(`INSERT INTO facebook_care_customers
          (id, customer_name, facebook_id, phone, status, last_message, province, location_lat, location_lng, address, interest, created_at, updated_at)
          VALUES ($1, $2, $3, $4, 'MOI', $5, $6, $7, $8, $9, $10, $11::timestamptz, $11::timestamptz)
          ON CONFLICT (facebook_id) WHERE facebook_id IS NOT NULL DO UPDATE SET
            customer_name = CASE
              WHEN facebook_care_customers.customer_name LIKE 'Khách Facebook %' AND EXCLUDED.customer_name NOT LIKE 'Khách Facebook %'
              THEN EXCLUDED.customer_name
              ELSE facebook_care_customers.customer_name
            END,
            phone = COALESCE(NULLIF(EXCLUDED.phone, ''), facebook_care_customers.phone),
            last_message = COALESCE(EXCLUDED.last_message, facebook_care_customers.last_message),
            address=COALESCE(NULLIF(facebook_care_customers.address,''),EXCLUDED.address),
            interest = CASE
              WHEN facebook_care_customers.interest IS NULL OR facebook_care_customers.interest = '' OR facebook_care_customers.interest = 'Tư vấn âm thanh qua Facebook' OR facebook_care_customers.interest = 'Tư vấn âm thanh karaoke'
              THEN COALESCE(EXCLUDED.interest, facebook_care_customers.interest)
              ELSE facebook_care_customers.interest
            END,
            province=CASE WHEN facebook_care_customers.location_manually_set THEN facebook_care_customers.province ELSE COALESCE(EXCLUDED.province,facebook_care_customers.province) END,
            location_lat=CASE WHEN facebook_care_customers.location_manually_set THEN facebook_care_customers.location_lat ELSE COALESCE(EXCLUDED.location_lat,facebook_care_customers.location_lat) END,
            location_lng=CASE WHEN facebook_care_customers.location_manually_set THEN facebook_care_customers.location_lng ELSE COALESCE(EXCLUDED.location_lng,facebook_care_customers.location_lng) END,
            updated_at = GREATEST(facebook_care_customers.updated_at, EXCLUDED.updated_at)
          RETURNING id,customer_name,phone,address,interest`, [
          `FB-${randomUUID()}`, resolvedName, psid, inferredPhone || null, displayLatestMsg?.body || latestMsg?.body || null,
          inferredProvince?.displayName || null, inferredProvince?.lat || null, inferredProvince?.lng || null, inferredAddress || null, inferredInterest || null, convUpdatedIso
        ])
        const syncedCustomer = customerRes.rows[0]
        const customerId = syncedCustomer?.id
        if (!customerId) continue
        if (inferredPhone || inferredProvince || inferredAddress) {
          await syncOpenOrdersForCustomer({ customerName: syncedCustomer.customer_name, phone: syncedCustomer.phone, address: syncedCustomer.address })
          if (syncedCustomer.phone) {
            await syncFbCustomersToLeads().catch(() => {})
          }
        }
        syncedCustomers += 1

        for (const msg of normalizedMessages) {
          await query(`UPDATE facebook_care_messages
            SET platform_message_id = $1,
                attachments = CASE WHEN $6::jsonb IS NOT NULL AND jsonb_array_length($6::jsonb) > 0 THEN $6::jsonb ELSE facebook_care_messages.attachments END
            WHERE id = (
              SELECT id FROM facebook_care_messages
              WHERE customer_id = $2 AND platform_message_id IS NULL AND direction = $3 AND body = $4
                AND ABS(EXTRACT(EPOCH FROM (created_at - $5::timestamptz))) <= 180
              LIMIT 1
            )`, [msg.platformMessageId, customerId, msg.direction, msg.body, msg.createdAt, JSON.stringify(msg.attachments || [])])
          const inserted = await query(`INSERT INTO facebook_care_messages
            (id, customer_id, body, direction, created_by, platform_message_id, created_at, attachments)
            VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::jsonb)
            ON CONFLICT (platform_message_id) DO UPDATE SET
              attachments = CASE WHEN EXCLUDED.attachments IS NOT NULL AND jsonb_array_length(EXCLUDED.attachments) > 0 THEN EXCLUDED.attachments ELSE facebook_care_messages.attachments END
            RETURNING id`,
            [randomUUID(), customerId, msg.body, msg.direction, msg.createdBy, msg.platformMessageId, msg.createdAt, JSON.stringify(msg.attachments || [])])
          if (inserted.rows[0]) syncedMessages += 1
        }

        // Tự động phản hồi bình luận nếu hội thoại được tạo từ bình luận bài viết Facebook
        const referralMsg = normalizedMessages.find(m => m.body && (m.body.includes('Facebook tạo đoạn chat này vì') || m.body.includes('comment_id=')))
        let extractedCommentId = null
        if (referralMsg) {
          // 1. Thử bóc tách từ comment_gqlid (base64) -> ra composite comment ID chuẩn Meta
          const gqlMatch = referralMsg.body.match(/comment_gqlid=([A-Za-z0-9%_-]+)/)
          if (gqlMatch) {
            try {
              const decoded = Buffer.from(decodeURIComponent(gqlMatch[1]), 'base64').toString('utf-8')
              extractedCommentId = decoded.replace(/^comment:/, '')
            } catch {}
          }
          // 2. Thử bóc tách từ video url
          if (!extractedCommentId) {
            const videoMatch = referralMsg.body.match(/videos\/(\d+)\/.*?comment_id=(\d+)/)
            if (videoMatch) extractedCommentId = `${videoMatch[1]}_${videoMatch[2]}`
          }
          // 3. Fallback lấy comment_id thông thường
          if (!extractedCommentId) {
            const match = referralMsg.body.match(/comment_id=(\d+)/)
            if (match) extractedCommentId = match[1]
          }
        }
        if (extractedCommentId) {
          const checkReplied = await query('SELECT comment_id FROM facebook_comment_replies WHERE comment_id=$1 AND status=\'SUCCESS\'', [extractedCommentId]).catch(() => ({ rows: [] }))
          if (checkReplied.rows.length === 0) {
            const cleanInbounds = normalizedMessages.filter(m =>
              m.direction === 'IN' &&
              !m.body.includes('Facebook tạo đoạn chat này vì') &&
              !m.body.includes('đã trả lời tin nhắn chào mừng tự động')
            )
            const commentQuestion = cleanInbounds[cleanInbounds.length - 1]?.body || ''
            if (commentQuestion) {
              const cmtAiEnabled = await isFacebookCommentAiEnabled()
              if (cmtAiEnabled) {
                const pageToken = await getMetaPageAccessToken()
                const { META_PAGE_ID: pageId, META_GRAPH_VERSION: graphVersion } = process.env
                const apiKey = await getGeminiApiKey()
                const model = await getGeminiModel()
                console.log(`[Facebook Sync Comment] Tự động phản hồi bình luận comment_id=${extractedCommentId} cho khách ${resolvedName}: "${commentQuestion}"`)
                handleFacebookComment({
                  commentId: extractedCommentId,
                  postId: null,
                  parentId: null,
                  userId: psid,
                  userName: resolvedName,
                  message: commentQuestion,
                  pageId,
                  pageToken,
                  graphVersion,
                  apiKey,
                  model
                }).then(async (cmtRes) => {
                  if (cmtRes?.success) {
                    await query(`INSERT INTO facebook_comment_replies (comment_id, customer_id, user_name, comment_text, public_reply_text, status, meta_reply_id)
                      VALUES ($1, $2, $3, $4, $5, 'SUCCESS', $6)
                      ON CONFLICT (comment_id) DO UPDATE SET status='SUCCESS', public_reply_text=EXCLUDED.public_reply_text, meta_reply_id=EXCLUDED.meta_reply_id`,
                      [extractedCommentId, customerId, resolvedName, commentQuestion, cmtRes?.publicReplyText || '', cmtRes?.replyId || null]).catch(() => {})
                  } else {
                    await query(`INSERT INTO facebook_comment_replies (comment_id, customer_id, user_name, comment_text, public_reply_text, status, error)
                      VALUES ($1, $2, $3, $4, $5, 'FAILED', $6)
                      ON CONFLICT (comment_id) DO UPDATE SET status='FAILED', error=EXCLUDED.error`,
                      [extractedCommentId, customerId, resolvedName, commentQuestion, cmtRes?.publicReplyText || '', cmtRes?.error || 'Lỗi API Meta']).catch(() => {})
                  }
                }).catch(err => {
                  console.warn('[Facebook Sync Comment Error]:', err.message)
                })
              }
            }
          }
        }

        // Tự động kích hoạt AI phản hồi nếu tin nhắn thực mới nhất trong hội thoại là khách gửi và chưa có ai trả lời
        const latestRealForAi = realMsgs[realMsgs.length - 1]
        if (latestRealForAi && latestRealForAi.direction === 'IN' && psid) {
          const msgAgeMs = Date.now() - Date.parse(latestRealForAi.createdAt)
          // Chỉ phản hồi các tin nhắn trong vòng 24 giờ (tuân thủ chính sách Meta Messenger)
          if (msgAgeMs >= 0 && msgAgeMs <= 24 * 60 * 60 * 1000) {
            isFacebookAiEnabled().then(enabled => {
              if (enabled) {
                autoReplyToFacebookCustomer(customerId, psid).catch(err => {
                  console.warn('[Sync AutoReply] Lỗi phản hồi khách', customerId, err.message)
                })
              }
            }).catch(() => {})
          }
        }
      }

      fbLastSyncMs = Date.now()
      fbLastSyncedAt = new Date(fbLastSyncMs).toISOString()
      fbLastSyncError = ''

      // Quét và tự động trả lời tất cả bình luận trên các bài viết Fanpage
      syncFacebookPageComments().catch(() => {})

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

/**
 * Quét toàn bộ bài viết mới nhất trên Fanpage và tự động trả lời bình luận công khai
 */
const syncFacebookPageComments = async () => {
  if (!(await isFacebookCommentAiEnabled()) || !canReadFacebookPageInbox()) return
  const pageToken = await getMetaPageAccessToken()
  const { META_PAGE_ID: pageId, META_GRAPH_VERSION: graphVersion } = process.env
  try {
    const apiKey = await getGeminiApiKey()
    const model = await getGeminiModel()

    // Quét bình luận trên các bài viết Feed, Published Posts và Videos của Fanpage (quét cả video reels / bài đăng quảng cáo)
    const fetchPostsFromEndpoint = async (endpoint) => {
      try {
        const u = new URL(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(pageId)}/${endpoint}`)
        u.searchParams.set('fields', 'id,comments.order(reverse_chronological).limit(50){id,from,message,created_time,parent}')
        u.searchParams.set('limit', '15')
        const r = await fetch(u, { headers: { Authorization: `Bearer ${pageToken}` }, signal: AbortSignal.timeout(15000) })
        const d = await r.json().catch(() => ({}))
        return Array.isArray(d.data) ? d.data : []
      } catch {
        return []
      }
    }

    const [publishedPosts, videoPosts, feedPosts] = await Promise.all([
      fetchPostsFromEndpoint('published_posts'),
      fetchPostsFromEndpoint('videos'),
      fetchPostsFromEndpoint('feed')
    ])

    // Ghép và lọc trùng lặp post
    const postMap = new Map()
    for (const p of [...publishedPosts, ...videoPosts, ...feedPosts]) {
      if (p?.id && !postMap.has(p.id)) postMap.set(p.id, p)
    }
    const allPosts = Array.from(postMap.values())

    for (const post of allPosts) {
      const comments = Array.isArray(post.comments?.data) ? post.comments.data : []
      for (const c of comments) {
        if (!c.id || !c.message) continue
        if (c.from?.id && String(c.from.id) === String(pageId)) continue // Bỏ qua bình luận của chính Trang

        // 1. Bỏ qua nếu bình luận này đã có câu trả lời từ Trang trên Facebook
        const isAlreadyRepliedOnFb = comments.some(other => other.parent?.id === c.id && String(other.from?.id) === String(pageId))
        if (isAlreadyRepliedOnFb) continue

        // 2. Bỏ qua nếu đã ghi nhận trả lời thành công trong database
        const already = await query('SELECT comment_id FROM facebook_comment_replies WHERE comment_id=$1 AND status=\'SUCCESS\'', [c.id]).catch(() => ({ rows: [] }))
        if (already.rows.length > 0) continue

        const commentUserId = c.from?.id || null
        const commentUserName = c.from?.name || 'Khách Facebook'

        console.log(`[Page Comment Sync] Đang tự động trả lời bình luận c.id=${c.id} từ ${commentUserName}: "${c.message}"`)
        const cmtRes = await handleFacebookComment({
          commentId: c.id,
          postId: post.id,
          parentId: c.parent?.id || null,
          userId: commentUserId,
          userName: commentUserName,
          message: c.message,
          pageId,
          pageToken,
          graphVersion,
          apiKey,
          model
        })

        const cmtCustomerId = `FB-CMT-${commentUserId || c.id}`
        if (cmtRes?.success) {
          await query(`INSERT INTO facebook_comment_replies (comment_id, customer_id, user_name, comment_text, public_reply_text, status, meta_reply_id)
            VALUES ($1, $2, $3, $4, $5, 'SUCCESS', $6)
            ON CONFLICT (comment_id) DO UPDATE SET status='SUCCESS', public_reply_text=EXCLUDED.public_reply_text, meta_reply_id=EXCLUDED.meta_reply_id`,
            [c.id, cmtCustomerId, commentUserName, c.message, cmtRes.publicReplyText || '', cmtRes.replyId || null]).catch(() => {})
        } else {
          await query(`INSERT INTO facebook_comment_replies (comment_id, customer_id, user_name, comment_text, public_reply_text, status, error)
            VALUES ($1, $2, $3, $4, $5, 'FAILED', $6)
            ON CONFLICT (comment_id) DO UPDATE SET status='FAILED', error=EXCLUDED.error`,
            [c.id, cmtCustomerId, commentUserName, c.message, cmtRes?.publicReplyText || '', cmtRes?.error || 'Lỗi API Meta']).catch(() => {})
        }
      }
    }
  } catch (err) {
    console.warn('[syncFacebookPageComments Error]:', err.message)
  }
}

const fetchMetaAdDetails = async (adId) => {
  const token = (await getMetaAdsAccessToken()) || (await getMetaPageAccessToken())
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

const sendFacebookText = async (psid, text, tag = null) => {
  const pageToken = await getMetaPageAccessToken()
  const { META_PAGE_ID: pageId, META_GRAPH_VERSION: graphVersion } = process.env
  if (!pageToken || !pageId) throw new Error('Chưa cấu hình Meta Page Token hoặc Page ID trên backend.')
  const body = {
    recipient: { id: psid },
    messaging_type: tag ? 'MESSAGE_TAG' : 'RESPONSE',
    message: { text }
  }
  if (tag) body.tag = tag
  const response = await fetch(`https://graph.facebook.com/${graphVersion || 'v19.0'}/${pageId}/messages`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pageToken}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000)
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error?.message || `Meta Send API error (${response.status})`)
  return payload
}

const fbAutoReplyInFlight = new Set()

const autoReplyToFacebookCustomer = async (customerId, psid) => {
  if (fbAutoReplyInFlight.has(customerId)) return
  if (!(await isFacebookAiEnabled()) || !isFacebookMessengerConfigured()) return

  fbAutoReplyInFlight.add(customerId)
  try {
    const [customerResult, humanCheckResult, historyResult, productsResult, combosResult] = await Promise.all([
      query('SELECT customer_name, phone, interest, notes, status, assigned_to FROM facebook_care_customers WHERE id=$1', [customerId]),
      query(`
        SELECT id, created_by, created_at, body 
        FROM facebook_care_messages 
        WHERE customer_id=$1 
          AND direction='OUT' 
          AND (created_by IS NULL OR created_by NOT LIKE '%AI%')
          AND body NOT ILIKE '%trợ lý âm thanh%'
          AND body NOT ILIKE '%tin nhắn chào mừng%'
          AND body NOT ILIKE '%Đã đặt giai đoạn%'
          AND body NOT ILIKE '%Đã thêm nhãn%'
        ORDER BY created_at DESC LIMIT 1
      `, [customerId]),
      query('SELECT direction, body, created_by, created_at FROM facebook_care_messages WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 20', [customerId]),
      query('SELECT name, price, original_price, room_size, bass_size, power_rms, short_desc, specs FROM products WHERE in_stock=TRUE ORDER BY price ASC LIMIT 24'),
      query('SELECT name, price, fast_action_price, room_size, tagline FROM combos ORDER BY price ASC')
    ])
    const customer = customerResult.rows[0]
    if (!customer) return

    // 1. DỪNG NẾU KHÁCH ĐÃ CÓ NHÂN SỰ PHỤ TRÁCH HOẶC ĐANG Ở CÁC TRẠNG THÁI HOÀN THÀNH / HỦY
    if (customer.assigned_to && customer.assigned_to.trim()) {
      console.log(`[Facebook AI] Khách ${customerId} đã được gán cho nhân sự (${customer.assigned_to}) -> AI dừng tư vấn.`)
      return
    }
    if (['HOAN_THANH', 'HUY'].includes(customer.status)) {
      console.log(`[Facebook AI] Khách ${customerId} đang có trạng thái ${customer.status} -> AI dừng tư vấn.`)
      return
    }

    const msgs = historyResult.rows.reverse().sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (diff !== 0) return diff
      if (a.direction === 'OUT' && b.direction === 'IN') return -1
      if (a.direction === 'IN' && b.direction === 'OUT') return 1
      return 0
    })

    // Lọc bỏ toàn bộ các thông báo hệ thống / nhãn tự động Facebook để lấy đúng tin nhắn trao đổi thực
    const realMsgs = msgs.filter(m => !isSystemFacebookNotice(m.body))
    if (!realMsgs.length) return

    const latestRealMsg = realMsgs[realMsgs.length - 1]
    const realInbounds = realMsgs.filter(m => m.direction === 'IN')
    const latestInbound = realInbounds[realInbounds.length - 1]

    // Nếu tin nhắn thực mới nhất trong hội thoại đã là OUT (Tú Audio hoặc AI đã trả lời) -> Dừng, không gửi lặp
    if (!latestRealMsg || latestRealMsg.direction !== 'IN') return

    // XỬ LÝ KHÁCH NHẮN NHIỀU TIN LIÊN TIẾP MỘT LÚC (GỘP TRỌN VẸN CÁC CÂU HỎI)
    // Tìm vị trí tin nhắn OUT gần nhất mà Shop hoặc AI đã gửi cho khách
    let lastOutIndex = -1
    for (let i = realMsgs.length - 1; i >= 0; i--) {
      if (realMsgs[i].direction === 'OUT') {
        lastOutIndex = i
        break
      }
    }

    // Lấy tất cả các tin nhắn IN liên tiếp kể từ sau tin OUT gần nhất (toàn bộ đợt nhắn mới này của khách)
    const pendingInboundMsgs = lastOutIndex >= 0
      ? realMsgs.slice(lastOutIndex + 1).filter(m => m.direction === 'IN')
      : realMsgs.filter(m => m.direction === 'IN')

    if (!pendingInboundMsgs.length) return

    // Gộp tất cả các tin nhắn mới của khách thành 1 văn bản đầy đủ, ngăn cách bằng xuống dòng
    const latestText = pendingInboundMsgs
      .map(m => (m.body || '').trim())
      .filter(b => b && !isSystemFacebookNotice(b))
      .join('\n')

    if (!latestText) return

    const isCommentReferral = msgs.some(m => m.body?.includes('Facebook tạo đoạn chat này vì') || m.body?.includes('comment_id='))

    // NGUYÊN TẮC ANH TÚ: Khách nào ĐÃ TỪNG INBOX rồi thì KHÔNG ĐƯỢC gửi thêm tin nhắn riêng tự động từ bình luận nữa
    if (isCommentReferral) {
      const hadPreviousOutMsg = realMsgs.some(m => m.direction === 'OUT')
      if (hadPreviousOutMsg) {
        console.log(`[Facebook AI] Khách ${customerId} (${customer.customer_name}) đã từng inbox trước đây -> Không gửi thêm tin nhắn riêng từ bình luận.`)
        return
      }
    }

    // Kiểm tra thời gian 24h của chính sách Meta Messenger
    if (latestInbound.created_at) {
      const diffHours = (Date.now() - new Date(latestInbound.created_at).getTime()) / (1000 * 60 * 60)
      if (diffHours > 24) {
        console.warn(`[Facebook AI] Bỏ qua khách ${customerId} vì tin nhắn quá 24h (${diffHours.toFixed(1)}h)`)
        return
      }
    }

    // Helper nhận biết câu xác nhận ngắn của khách ("Vâng", "Dạ", "Ok", "Cảm ơn"...)
    const isShortAcknowledgement = (text) => {
      if (!text) return false
      const clean = text.toLowerCase().replace(/[^a-z0-9à-ỹ\s]/g, '').trim()
      const shortAcks = new Set([
        'vâng', 'vang', 'dạ', 'da', 'ok', 'oke', 'oki', 'okie', 'uhm', 'uh', 'ừ', 'ừm',
        'dạ vâng', 'da vang', 'vâng ạ', 'vang a', 'dạ vâng ạ', 'da vang a',
        'cảm ơn', 'cam on', 'cảm ơn shop', 'cam on shop', 'thanks', 'tks', 'thank',
        'nhất trí', 'nhat tri', 'được', 'duoc', 'rồi', 'roi', 'ok a', 'ok anh', 'vâng anh', 'vang anh', 'vang b', 'vâng b'
      ])
      return shortAcks.has(clean)
    }

    let reply = ''

    // =========================================================================
    // YÊU CẦU ANH TÚ: NẾU KHÁCH CHO SỐ THÌ NẾU CHƯA AI NHẮN THÌ SẼ BẢO NGƯỜI TA ĐỢI
    // Chỉ kích hoạt khi khách THỰC SỰ ĐƯA SỐ MỚI trong tin nhắn này (tránh lặp lại nếu đã có SĐT từ trước)
    // =========================================================================
    const newlyProvidedPhone = phoneFromMessage(latestText)
    const alreadyConfirmedPhone = realMsgs.some(m =>
      m.direction === 'OUT' &&
      (
        (newlyProvidedPhone && m.body?.includes(newlyProvidedPhone)) ||
        (customer.phone && m.body?.includes(customer.phone)) ||
        m.body?.includes('đã nhận được số điện thoại/Zalo') ||
        m.body?.includes('đã nhận được số Zalo')
      )
    )

    if (newlyProvidedPhone && !alreadyConfirmedPhone) {
      // Kiểm tra xem sau tin nhắn này của khách, đã có nhân sự thật nào nhắn lại chưa:
      const humanMsgsAfterInbound = realMsgs.filter(m =>
        m.direction === 'OUT' &&
        (m.created_by == null || !String(m.created_by).includes('AI')) &&
        new Date(m.created_at).getTime() > new Date(latestInbound.created_at).getTime()
      )

      if (humanMsgsAfterInbound.length > 0) {
        console.log(`[Facebook AI] Khách ${customerId} (${customer.customer_name}) đã có nhân sự thật nhắn sau khi cho SĐT -> AI nhường quyền.`)
        return
      }

      // Kiểm tra xem AI đã từng gửi tin xác nhận bảo khách đợi sau tin nhắn mới nhất này chưa (tránh spam lặp):
      const aiMsgsAfterInbound = realMsgs.filter(m =>
        m.direction === 'OUT' &&
        String(m.created_by || '').includes('AI') &&
        new Date(m.created_at).getTime() >= new Date(latestInbound.created_at).getTime()
      )
      if (aiMsgsAfterInbound.length > 0) {
        return
      }

      const nameParts = (customer.customer_name || '').trim().split(/\s+/)
      const callName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : 'anh'
      const callTitle = (customer.customer_name || '').toLowerCase().includes('bác') || latestText.toLowerCase().includes('bác') ? 'bác' : 'anh'

      reply = `Dạ em Tú cảm ơn ${callTitle} ${callName} ạ! Em đã nhận được số điện thoại rồi, lát nữa bên em sẽ chủ động gọi điện tư vấn chi tiết cho ${callTitle} nhé ạ!`

      await query(
        "UPDATE facebook_care_customers SET phone=COALESCE(phone, $1), status='DANG_TU_VAN', updated_at=CURRENT_TIMESTAMP WHERE id=$2",
        [newlyProvidedPhone, customerId]
      ).catch(dbErr => console.error('[Facebook AI] Lưu SĐT khách thất bại:', dbErr.message))

      // =========================================================================
      // ĐẨY TỨC THÌ SANG BẢNG LEADS (KHÁCH TƯ VẤN & LỊCH THỬ DÀN) - NỔI LÊN TOP 1 NGAY LẬP TỨC
      // =========================================================================
      try {
        const leadId = `FB-${customerId.replace(/^FB-/, '')}`.slice(0, 50)
        const leadName = customer.customer_name || ('Khách Facebook ' + newlyProvidedPhone.slice(-4))
        const leadAddress = (customer.address || customer.province || '').trim()
        const leadAdName = (customer.source_ad_name || '').trim()
        const leadNote = [
          leadAdName ? `QC: ${leadAdName}` : '',
          `SĐT/Zalo: ${newlyProvidedPhone}`,
          `Tin nhắn: "${latestText}"`
        ].filter(Boolean).join(' · ')

        // Kiểm tra xem số điện thoại đã có trong leads chưa để tránh trùng lặp
        const existingLead = await query('SELECT id, notes FROM leads WHERE phone = $1 LIMIT 1', [newlyProvidedPhone])
        if (existingLead.rows.length > 0) {
          const curId = existingLead.rows[0].id
          const curNotes = existingLead.rows[0].notes || ''
          const updatedNotes = curNotes.includes(latestText) ? curNotes : (curNotes ? curNotes + ' · ' + leadNote : leadNote).slice(0, 2000)
          await query(`
            UPDATE leads SET
              name = CASE WHEN name IS NULL OR name = '' OR name LIKE 'Khách Facebook %' THEN $1 ELSE name END,
              notes = $2,
              status = 'MOI',
              created_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
          `, [leadName, updatedNotes, curId])
          console.log(`[Facebook AI] Đã cập nhật và đẩy SĐT ${newlyProvidedPhone} (${leadName}) lên đầu bảng Leads (Rank 1).`)
        } else {
          await query(`
            INSERT INTO leads (id, name, phone, address, interest, room_info, status, deal_value, notes, created_at, updated_at)
            VALUES ($1, $2, $3, $4, 'Tư vấn âm thanh qua Facebook', '', 'MOI', 0, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              phone = EXCLUDED.phone,
              notes = EXCLUDED.notes,
              status = 'MOI',
              created_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          `, [leadId, leadName, newlyProvidedPhone, leadAddress, leadNote])
          console.log(`[Facebook AI] Đã thêm mới SĐT ${newlyProvidedPhone} (${leadName}) vào đầu bảng Leads (Rank 1).`)
        }
      } catch (leadPushErr) {
        console.error('[Facebook AI] Lỗi đẩy tức thì SĐT vào Leads:', leadPushErr.message)
      }
    } else if (isShortAcknowledgement(latestText)) {
      // Khách chỉ xác nhận "Vâng", "Dạ", "Ok", "Cảm ơn" -> Không gửi tin nhắn tự động lặp lại
      console.log(`[Facebook AI] Khách ${customerId} gửi xác nhận ngắn "${latestText}" -> Bỏ qua không gửi tin nhắn tự động trùng lặp.`)
      return
    }

    // =========================================================================
    // NẾU KHÁCH CHƯA CHO SỐ HOẶC HỎI TIẾP: KIỂM TRA NHÂN SỰ VÀ TƯ VẤN GEMINI FLASH
    // =========================================================================
    if (!reply) {
      // Kiểm tra nhân sự thật tư vấn: Chỉ dừng nếu người thật vừa chat trong vòng 5 phút (đang trực tiếp gõ phím) hoặc khách chưa gửi câu hỏi nào mới sau tin của nhân viên.
      if (!isCommentReferral && humanCheckResult.rows.length > 0 && humanCheckResult.rows[0].created_at) {
        const lastHumanMsg = humanCheckResult.rows[0]
        const humanAgeMinutes = (Date.now() - new Date(lastHumanMsg.created_at).getTime()) / (1000 * 60)
        const inboundAfterHuman = latestInbound?.created_at && (
          new Date(latestInbound.created_at).getTime() > new Date(lastHumanMsg.created_at).getTime() ||
          (new Date(latestInbound.created_at).getTime() === new Date(lastHumanMsg.created_at).getTime() && latestRealMsg?.direction === 'IN')
        )
        if (humanAgeMinutes >= 0 && (humanAgeMinutes < 5 || !inboundAfterHuman)) {
          const humanStaffName = lastHumanMsg.created_by || 'Nhân sự Tú Audio'
          console.log(`[Facebook AI] Khách ${customerId} (${customer.customer_name}) đang được người thật (${humanStaffName}) tư vấn trực tiếp -> AI nhường quyền.`)
          return
        }
      }

      // Kiểm tra nhanh các trường hợp định danh (Icon/Sticker, Lời chào, Xin hotline, Xin địa chỉ, Hỏi qua ngay...) để phản hồi chính xác 100%, không bị ảo giác
      const fastDeterministic = checkDeterministicAiResponse(latestText)
      if (fastDeterministic && ['ICON_STICKER', 'GREETING', 'HOTLINE', 'ADDRESS', 'IMMEDIATE_VISIT_CHECK'].includes(fastDeterministic.type)) {
        if (fastDeterministic.type === 'ICON_STICKER' && (customer.phone || alreadyConfirmedPhone)) {
          reply = 'Dạ em Tú Audio xin chào anh ạ! Em/kỹ thuật bên em đang chuẩn bị liên hệ hỗ trợ trực tiếp cho anh ngay đây ạ!'
        } else if (fastDeterministic.type === 'IMMEDIATE_VISIT_CHECK' && (customer.phone || alreadyConfirmedPhone)) {
          reply = 'Dạ hôm nay em Tú và anh em kỹ thuật đang có chuyến công tác, đi hỗ trợ theo tuyến các bác khách đã đặt lịch từ trước rồi ạ. Bác cứ yên tâm nhé, lát nữa em Tú sẽ trực tiếp gọi điện lại trao đổi về bộ dàn và hẹn khung giờ tiện nhất cho bác ở nhà đón anh em nhé ạ!'
        } else {
          reply = fastDeterministic.reply
        }
      }
    }

    // 3. Gọi Gemini Flash AI xử lý thông minh 100% theo đúng ngữ cảnh câu hỏi của khách
    if (!reply) {
      // Lịch sử trao đổi trước cụm tin nhắn mới này của khách
      const priorMsgs = lastOutIndex >= 0 ? realMsgs.slice(0, lastOutIndex + 1) : []
      const historyFormatted = priorMsgs.map(m => `${m.direction === 'IN' ? 'Khách' : 'Tú Audio'}: ${m.body}`).join('\n')
      const hasKnownPhone = Boolean(customer.phone && String(customer.phone).trim().length >= 9) || alreadyConfirmedPhone
      const psychologicalContext = await getAiPsychologicalTrainingContext()

      const phoneInstruction = hasKnownPhone
        ? `CHỈ THỊ CỐT LÕI (TUÂN THỦ 100% THEO YÊU CẦU ANH TÚ): KHÁCH HÀNG NÀY ĐÃ CÓ SỐ ĐIỆN THOẠI/ZALO (${customer.phone || 'đã có số'}).
- TUYỆT ĐỐI KHÔNG HỎI HAY XIN LẠI SỐ ĐIỆN THOẠI/ZALO NỮA!
- TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý HẸN KHÁCH TRƯỚC: CẤM tự ý hẹn ngày giờ, CẤM hẹn chạy qua nhà, CẤM hứa mang máy tính mic đo RTA qua nhà, CẤM nói về "sổ lịch trình" hay "ghép chuyến"! Việc hẹn lịch đi đâu, bao giờ đi là do người thật (anh Tú hoặc kỹ thuật) gọi điện thoại trực tiếp chốt với khách, bot tuyệt đối không được tự ý hẹn trước trên tin nhắn!
- KHI KHÁCH VỪA CHO SỐ HOẶC NHẮN THÊM TÊN/THÔNG TIN: CHỈ CẢM ƠN KHÁCH VÀ BÁO ĐÃ NHẬN SỐ, LÁT NỮA BÊN EM SẼ GỌI ĐIỆN LẠI! (Ví dụ: "Dạ em Tú cảm ơn anh/bác ạ! Em đã lưu thông tin rồi, lát nữa bên em sẽ gọi điện trao đổi trực tiếp với anh/bác nhé ạ!").
- NẾU KHÁCH CÓ CÂU HỎI KỸ THUẬT MỚI: Trả lời ngắn gọn 1-2 câu giải đáp chuyên môn rồi chốt: "Lát nữa bên em gọi điện hỗ trợ trực tiếp cho anh/bác nhé ạ, em cảm ơn anh/bác!".`
        : `QUY TẮC TƯ VẤN & XIN SỐ ĐIỆN THOẠI (CHỈ XIN SỐ, TUYỆT ĐỐI KHÔNG HẸN TRƯỚC):
- Giải đáp thấu đáo, mộc mạc và đúng trọng tâm câu hỏi của khách (ngắn gọn 1-2 câu).
- Khéo léo xin số điện thoại/Zalo để bên em gọi điện hoặc nhắn tin tư vấn trực tiếp cho tiện (Ví dụ: "Bác cho em xin số điện thoại/Zalo để bên em gọi điện tư vấn cụ thể cho bác nhé ạ!").
- TUYỆT ĐỐI KHÔNG tự ý hẹn lịch qua nhà khách trước trên tin nhắn! Mọi lịch trình sẽ do anh Tú gọi điện thống nhất sau.`

      const systemInstruction = `BẠN LÀ ANH PHÙNG VĂN TÚ (TÚ AUDIO - Hotline/Zalo: 0984.259.898 tại Số 220 đường Nguyễn Danh Phương, phường Hội Hợp, TP. Vĩnh Yên, tỉnh Vĩnh Phúc).
BẠN ĐANG TRỰC TIẾP TRÒ CHUYỆN, TÂM SỰ VÀ TƯ VẤN CHO KHÁCH HÀNG TRÊN FACEBOOK MESSENGER NHƯ MỘT NGƯỜI BẠN MÊ ÂM THANH TRI KỶ.

QUY TẮC BẮT BUỘC VỀ ĐỊA CHỈ SHOWROOM (GHI RÕ RÀNG, CỤ THỂ 100%):
- Khi khách hỏi showroom ở đâu, shop ở đâu, cửa hàng ở đâu, địa chỉ ở đâu, qua đâu xem dàn...
- BẮT BUỘC PHẢI TRẢ LỜI ĐẦY ĐỦ ĐỊA CHỈ CỤ THỂ 100%: "Số 220 đường Nguyễn Danh Phương, phường Hội Hợp, TP. Vĩnh Yên, tỉnh Vĩnh Phúc (có chỗ đỗ ô tô thoải mái)".
- TUYỆT ĐỐI KHÔNG ĐƯỢC trả lời lửng lơ hoặc chung chung như "ở Phố Nguyễn Danh Phương" hay "ở TP.", BẮT BUỘC PHẢI CÓ SỐ NHÀ 220, PHƯỜNG HỘI HỢP, TP. VĨNH YÊN, TỈNH VĨNH PHÚC!

${psychologicalContext}

BỘ NÃO TỰ ĐỘNG ĐỌC VỊ TÍNH CÁCH & ĐÁNH VÀO TÂM LÝ TỪNG KHÁCH HÀNG:
1. ĐỌC VỊ TÍNH CÁCH TỪNG NGƯỜI (TỰ ĐỘNG THÍCH ỨNG 100%):
   - KHÁCH SÀNH SỎI / KỸ TÍNH (Nhắc tên vang số X5, loa bass 30 bãi Mỹ, cục đẩy, tần số...):
     -> Nói chuyện ngang tầm kỹ sư âm thanh chuyên nghiệp. Khen thiết bị khách đang có, giải thích cặn kẽ nguyên lý âm học (vì sao loa full bass 30 giải phóng tiếng trung rất sáng nhưng thiếu dải trầm sâu 40-70Hz, vì sao thêm sub tiếng hát sẽ dày ấm và đầm hơn hẳn).
   - KHÁCH BÌNH DÂN, MỘC MẠC (Hỏi ngắn, dùng từ ngữ chân chất: "bác có đi chỉnh ko", "chỉnh vang ko em", "bao tiền"):
     -> Trò chuyện gần gũi, ấm áp như anh em một nhà. Xưng "em" hoặc "em Tú", gọi "bác" hoặc "anh". Tuyệt đối không dùng từ ngữ cao siêu khó hiểu.
   - KHÁCH BỨC XÚC / ĐAU KHỔ VÌ HÚ RÍT, HÁT NẶNG, MUA ĐỒ VỀ HÁT KHÔNG HAY:
     -> Lập tức đồng cảm sâu sắc, "chia lửa" cùng khách: Em hiểu cái cảm giác bỏ tiền triệu ra sắm dàn về mà hát bí tiếng, rú ré lên điếc tai nó ức chế thế nào... Khẳng định ngay 90% là do vang số chưa cắt đúng dải tần triệt tiêu chứ không phải tại giọng anh.
   - KHÁCH DÈ DẶT, SỢ BỊ LỪA, SỢ HÀNG NHÁI / SỢ MUA HỚ:
     -> Không vồ vập bán hàng. Chia sẻ thẳng thắn, tâm sự thật lòng kinh nghiệm làm nghề và mách nước cách tự kiểm tra trước để khách thấy sự tử tế và uy tín tuyệt đối của Tú Audio.

2. NGHỆ THUẬT TÂM SỰ & DẪN DẮT (GIAO TIẾP TỰ NHIÊN NHƯ NGƯỜI THẬT NÓI CHUYỆN VỚI NHAU):
   - Nói chuyện tự nhiên, có cảm xúc, linh hoạt và thông minh như một con người thực thụ. Tuyệt đối KHÔNG trả lời như robot, KHÔNG dùng mẫu câu rập khuôn, KHÔNG lặp lại tin nhắn cũ.
   - ĐỘ DÀI BẮT BUỘC NGẮN GỌN (TỪ 2 ĐẾN TỐI ĐA 3 CÂU NGẮN): Trả lời mộc mạc, đi thẳng vào trọng tâm câu hỏi của khách, giải thích ngắn gọn, dễ hiểu. Tuyệt đối KHÔNG viết văn hoa mỹ, KHÔNG viết thành các đoạn văn dài dòng lê thê làm khách ngại đọc.
   - ${phoneInstruction}

3. QUY TẮC BẮT BUỘC KHI KHÁCH HỎI NHIỀU CÂU / NHẮN NHIỀU TIN CÙNG MỘT LÚC:
   - Khách hàng thường gửi 2-3 tin nhắn liên tiếp hỏi các ý khác nhau (Ví dụ: tin 1 hỏi địa chỉ showroom, tin 2 hỏi bên mình có đi căn chỉnh tận nhà không và xem có cần bổ sung thêm đồ gì không).
   - TUYỆT ĐỐI KHÔNG ĐƯỢC CHỈ TRẢ LỜI MỖI MỘT Ý RỒI BỎ QUÊN CÁC Ý CÒN LẠI!
   - BẠN PHẢI TRẢ LỜI ĐẦY ĐỦ, TRỌN VẸN VÀ LIỀN MẠCH TẤT CẢ CÁC CÂU HỎI CỦA KHÁCH:
     + Trả lời câu hỏi 1 (ví dụ chỉ rõ showroom ở 220 Nguyễn Danh Phương, Vĩnh Yên).
     + Trả lời câu hỏi 2 (ví dụ khẳng định bên em có nhận hỗ trợ kỹ thuật căn chỉnh cho anh em, thiết bị nào còn tốt thì giữ lại để tiết kiệm chi phí).
     + Khéo léo mời bác cho xin số điện thoại/Zalo để bên em gọi điện trao đổi trực tiếp.

4. NGUYÊN TẮC CỐT LÕI VỀ DỊCH VỤ & SẢN PHẨM:
   - DỊCH VỤ CĂN CHỈNH / TƯ VẤN KỸ THUẬT:
     + Khẳng định rõ bên em CÓ nhận hỗ trợ kỹ thuật căn chỉnh vang số và setup dàn âm thanh (cả hỗ trợ từ xa qua máy tính lẫn kỹ thuật trực tiếp).
     + TUYỆT ĐỐI KHÔNG HẸN KHÁCH TRƯỚC TRÊN TIN NHẮN (không hẹn ngày giờ, không tự hẹn chạy qua nhà, không hứa thợ mang mic đo RTA sang nhà, không nói về ghép chuyến hay sổ lịch trình). CHỈ TƯ VẤN VÀ XIN SỐ ĐIỆN THOẠI ĐỂ GỌI ĐIỆN TRAO ĐỔI TRỰC TIẾP.
     + KHI KHÁCH CHO SỐ: CHỈ CẢM ƠN KHÁCH VÀ BÁO LÁT NỮA BÊN EM SẼ GỌI ĐIỆN LẠI.
   - NÂNG CẤP ĐỒ CŨ: Luôn ưu tiên giữ lại món đồ nào còn tốt để tiết kiệm tiền cho khách, chỉ tư vấn nâng cấp món thực sự cần thiết.
   - TUYỆT ĐỐI CẤM DUY NHẤT: KHÔNG bán loa kéo di động, KHÔNG nhận sửa chữa đồ điện tử hư hỏng mạch công suất cháy nổ. Lịch sự định hướng khách sang dàn karaoke gia đình.

5. NGUYÊN TẮC XỬ LÝ KHI KHÁCH HỎI CÓ XUỐNG LUÔN / QUA NGAY ĐƯỢC KHÔNG (GIỮ CHÂN KHÁCH & TUYỆT ĐỐI KHÔNG HẸN BỪA):
   - TÌNH HUỐNG: Khách nhắn: "thế cháu có xuống luôn được không", "hôm nay có qua chỉnh được không", "bây giờ qua luôn được không", "chiều nay qua được không"...
   - HOÀN CẢNH THỰC TẾ: Anh Tú và đội ngũ kỹ thuật thường xuyên có lịch đi công tác xa, đi lắp đặt công trình hoặc đã kín lịch hẹn trước theo tuyến với các bác khách khác từ trước.
   - NGHỆ THUẬT GIỮ CHÂN KHÁCH ĐỈNH CAO (ĐỌC KỸ TIN NHẮN, KHÔNG HẸN BỪA, KHÔNG ĐỂ MẤT KHÁCH):
     + ĐỌC KỸ TIN NHẮN TRƯỚC, TUYỆT ĐỐI KHÔNG ĐƯỢC HẸN BỪA (Cấm nhận lời qua luôn, cấm tự chốt ngày giờ cụ thể trên tin nhắn).
     + TUYỆT ĐỐI KHÔNG TỪ CHỐI CỘC LỐC (Cấm nói "cháu không qua được", "hôm nay bận").
     + BỘ KHUNG TRẢ LỜI MẪU MỰC (NGẮN GỌN 2-3 CÂU, ẤM ÁP & THUYẾT PHỤC):
       1. Khéo léo giải thích lịch trình công tác: "Dạ hôm nay em Tú và anh em kỹ thuật đang có chuyến công tác / hỗ trợ theo tuyến cho các bác khách đã đặt lịch từ trước rồi ạ."
       2. Giữ chân & Cam kết ưu tiên: "Nhưng bác/anh cứ yên tâm nhé, bên em luôn ưu tiên sắp xếp thời gian tiện nhất cho anh em."
       3. Xin số điện thoại/Zalo để anh Tú gọi trực tiếp chốt lịch: "Bác/anh cho em xin số điện thoại hoặc Zalo để lát nữa em Tú trực tiếp gọi điện lại trao đổi về bộ dàn và hẹn khung giờ tiện nhất cho bác ở nhà đón anh em ghé qua hỗ trợ nhé ạ!"

6. XỬ LÝ ICON & ẢNH GỬI (TÔN TRỌNG SỰ THẬT TUYỆT ĐỐI):
   - Khách gửi 👍 hoặc icon: Chào hỏi thân thiện, hỏi thăm nhu cầu âm thanh của anh em một cách gần gũi.
   - Khách gửi ảnh thật: Báo đã nhận ảnh, hỏi thăm về cấu hình dàn trong ảnh để trao đổi sâu hơn.

HÃY ĐỌC VỊ TÂM LÝ KHÁCH HÀNG VÀ TÂM SỰ TRẢ LỜI CỰC KỲ TỰ NHIÊN, THUYẾT PHỤC VÀ CUỐN HÚT:`

      try {
        const apiKey = await getGeminiApiKey()
        const model = await getGeminiModel()
        if (apiKey) {
          const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey
          const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [{
                  text: systemInstruction +
                    (historyFormatted ? '\n\nLỊCH SỬ CHAT TRƯỚC ĐÓ:\n' + historyFormatted : '') +
                    '\n\nCÁC CÂU HỎI MỚI KHÁCH VỪA NHẮN (LƯU Ý ĐẶC BIỆT: NẾU KHÁCH HỎI NHIỀU Ý HOẶC NHẮN NHIỀU TIN, BẮT BUỘC TRẢ LỜI ĐẦY ĐỦ TẤT CẢ CÁC CÂU HỎI MỘT CÁCH GỌN GÀNG, KHÔNG ĐƯỢC BỎ SÓT Ý NÀO):\n"' + latestText + '"\n\nHãy đọc vị tâm lý khách hàng và trả lời trọn vẹn mọi thắc mắc của khách theo phong cách chuyên gia anh Tú:'
                }]
              }],
              generationConfig: {
                temperature: 0.35,
                maxOutputTokens: 2048,
                thinkingConfig: { thinkingBudget: 0 }
              }
            }),
            signal: AbortSignal.timeout(15000)
          })

          const geminiData = await geminiRes.json().catch(() => ({}))
          const cand = geminiData.candidates?.[0]
          const rawReply = cand?.content?.parts?.[0]?.text?.trim()
          if (rawReply && (cand?.finishReason === 'STOP' || /[.!?…ạa]$/i.test(rawReply))) {
            reply = rawReply
          } else if (rawReply && cand?.finishReason !== 'MAX_TOKENS') {
            reply = rawReply
          }
        }
      } catch (aiErr) {
        console.warn('[Facebook AI AutoReply Warning]:', aiErr.message)
      }
    }

    // 3. Dự phòng bằng kịch bản nếu gián đoạn mạng
    if (!reply) {
      const fallbackDeterministic = checkDeterministicAiResponse(latestText)
      reply = fallbackDeterministic?.reply || 'Dạ em Tú Audio đây ạ! Anh nhắn em xin số Zalo em gọi điện tư vấn chi tiết và gửi video test máy cho tiện nhé anh!'
    }

    if (!reply || !reply.trim()) return

    // KIỂM TRA CHỐNG TRÙNG LẶP TIN NHẮN TUYỆT ĐỐI (ANTI-DUPLICATE GUARD)
    // AI không bao giờ gửi tin nhắn giống hệt hoặc lặp lại nội dung đã gửi gần đây cho khách
    const recentOuts = realMsgs
      .filter(m => m.direction === 'OUT')
      .slice(-5)
      .map(m => (m.body || '').trim().toLowerCase())

    const normalizeForCompare = (s) => s.replace(/[^a-z0-9à-ỹ]/g, '')
    const replyNorm = normalizeForCompare(reply.trim().toLowerCase())

    if (recentOuts.some(outMsg => normalizeForCompare(outMsg) === replyNorm)) {
      console.log(`[Facebook AI] Bỏ qua câu trả lời vì bị trùng lặp nội dung với tin nhắn đã gửi gần đây cho khách ${customerId}: "${reply}"`)
      return
    }

    const sentPayload = await sendFacebookText(psid, reply)
    await query('INSERT INTO facebook_care_messages (id, customer_id, body, direction, created_by, platform_message_id) VALUES ($1,$2,$3,\'OUT\',\'AI Tú Audio\',$4) ON CONFLICT (platform_message_id) DO NOTHING', [randomUUID(), customerId, reply, sentPayload?.message_id || null])
    await query('UPDATE facebook_care_customers SET last_message=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2', [reply, customerId])
  } catch (err) {
    console.error('[Facebook AI] Auto reply failed:', err.message)
    await query("UPDATE facebook_care_customers SET status='CHO_PHAN_HOI', notes=CONCAT(COALESCE(notes,''), CASE WHEN COALESCE(notes,'')='' THEN '' ELSE E'\\n' END, '[AI chưa trả lời được; cần nhân viên xử lý]'), updated_at=CURRENT_TIMESTAMP WHERE id=$1", [customerId]).catch(() => {})
  } finally {
    fbAutoReplyInFlight.delete(customerId)
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
      // 1. Tự động xử lý bình luận trên bài viết (Facebook Comments & Feed) -> Lôi kéo vào Messenger
      for (const change of entry.changes || []) {
        if (change.field === 'feed') {
          const val = change.value || {}
          if (val.item === 'comment' && (val.verb === 'add' || val.verb === 'edit')) {
            const commentId = val.comment_id
            const postId = val.post_id
            const parentId = val.parent_id || null
            const fromUser = val.from || {}
            const text = val.message || ''

            isFacebookCommentAiEnabled().then(enabled => {
              if (!enabled) return
              getGeminiApiKey().then(apiKey => {
                getGeminiModel().then(async (model) => {
                  const pageToken = await getMetaPageAccessToken()
                  const { META_PAGE_ID: pageId, META_GRAPH_VERSION: graphVersion } = process.env
                  handleFacebookComment({
                    commentId,
                    postId,
                    parentId,
                    userId: fromUser.id,
                    userName: fromUser.name || 'Khách Facebook',
                    message: text,
                    pageId,
                    pageToken,
                    graphVersion: graphVersion || 'v19.0',
                    apiKey,
                    model
                  }).catch(err => {
                    console.error('[Comment Webhook Error]:', err.message)
                  })
                })
              }).catch(() => {})
            }).catch(() => {})
          }
        }
      }

      // 2. Xử lý các tin nhắn Messenger (Facebook Messaging)
      for (const event of entry.messaging || []) {
        const isEcho = Boolean(event.message?.is_echo)
        const psid = isEcho ? event.recipient?.id : event.sender?.id
        if (!psid) continue

        // Nếu là tin nhắn phản hồi từ Page (do anh Tú hoặc nhân viên trả lời từ điện thoại / Meta Business Suite):
        if (isEcho) {
          const echoMid = event.message?.mid
          const echoText = event.message?.text || (event.message?.attachments?.length ? '[Trang gửi hình ảnh / tệp đính kèm]' : '')
          if (echoMid && echoText) {
            const custRes = await query('SELECT id FROM facebook_care_customers WHERE facebook_id=$1', [String(psid)])
            if (custRes.rows[0]) {
              const custId = custRes.rows[0].id
              await query(
                `INSERT INTO facebook_care_messages (id, customer_id, body, direction, created_by, platform_message_id)
                 VALUES ($1, $2, $3, 'OUT', 'Nhân viên Page', $4)
                 ON CONFLICT (platform_message_id) DO NOTHING`,
                [randomUUID(), custId, echoText, echoMid]
              ).catch(() => {})
              await query('UPDATE facebook_care_customers SET last_message=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2', [echoText, custId]).catch(() => {})
            }
          }
          continue
        }

        const rawAtts = Array.isArray(event.message?.attachments) ? event.message.attachments : []
        const isSticker = Boolean(event.message?.sticker_id) || rawAtts.some(att => att.type === 'sticker' || Boolean(att.payload?.sticker_id))
        const webhookAttachments = rawAtts.map(att => ({
          url: att.payload?.url || '',
          type: isSticker ? 'sticker' : (att.type || 'image')
        })).filter(a => Boolean(a.url))

        let text = event.message?.text || event.postback?.title || ''
        if (!text) {
          if (isSticker) {
            text = '[Khách gửi icon / nhãn dán 👍]'
          } else if (webhookAttachments.length) {
            text = '[Khách gửi hình ảnh / tệp đính kèm]'
          }
        }
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
            phone = COALESCE(NULLIF(EXCLUDED.phone, ''), facebook_care_customers.phone),
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
          await syncFbCustomersToLeads().catch(() => {})
        }
        if (!text) continue
        const platformMessageId = event.message?.mid || (event.timestamp ? `postback-${psid}-${event.timestamp}` : `event-${randomUUID()}`)
        const inserted = await query(`INSERT INTO facebook_care_messages (id, customer_id, body, direction, created_by, platform_message_id, attachments)
          VALUES ($1,$2,$3,'IN',$4,$5,$6::jsonb)
          ON CONFLICT (platform_message_id) DO UPDATE SET
            attachments = CASE WHEN EXCLUDED.attachments IS NOT NULL AND jsonb_array_length(EXCLUDED.attachments) > 0 THEN EXCLUDED.attachments ELSE facebook_care_messages.attachments END
          RETURNING id`, [randomUUID(), customer.rows[0].id, text, resolvedName, platformMessageId, JSON.stringify(webhookAttachments)])
        if (inserted.rows[0]) {
          isFacebookAiEnabled().then(enabled => {
            if (enabled) autoReplyToFacebookCustomer(customer.rows[0].id, psid)
          }).catch(() => {})
        }
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
const failedLoginAccounts = new Map() // username -> { count, lockedUntil }

const checkAccountLock = (cleanUser) => {
  if (!cleanUser) return null
  const info = failedLoginAccounts.get(cleanUser)
  if (!info) return null
  const now = Date.now()
  if (info.lockedUntil > now) {
    return Math.ceil((info.lockedUntil - now) / 60000)
  }
  return null
}

const recordFailedLogin = async (cleanUser, reason, req) => {
  const now = Date.now()
  const info = failedLoginAccounts.get(cleanUser) || { count: 0, lockedUntil: 0 }
  info.count += 1
  const isLocked = info.count >= 5
  if (isLocked) {
    info.lockedUntil = now + 15 * 60 * 1000 // Khóa 15 phút
  }
  failedLoginAccounts.set(cleanUser, info)

  const ip = getClientIp(req)
  await recordAuditLog({
    admin: { id: null, username: cleanUser, name: 'Khách lạ', role: 'UNKNOWN' },
    action: isLocked ? 'SECURITY_ACCOUNT_LOCKED_BRUTEFORCE' : 'AUTH_LOGIN_FAILED',
    actionType: 'SECURITY',
    targetType: 'auth',
    targetId: cleanUser,
    summary: isLocked
      ? `[CẢNH BÁO BẢO MẬT] Tài khoản '${cleanUser}' bị tạm khóa 15 phút do nhập sai mật khẩu 5 lần liên tiếp từ IP ${ip}.`
      : `Đăng nhập thất bại vào tài khoản '${cleanUser}' từ IP ${ip}: ${reason}`,
    details: { username: cleanUser, reason, ip, userAgent: req.headers['user-agent'], attemptCount: info.count },
    req
  }).catch(() => {})
  return { isLocked, count: info.count }
}

const resetFailedLogin = (cleanUser) => {
  failedLoginAccounts.delete(cleanUser)
}

const publicSubmissionAttempts = new Map()
const publicSubmissionRateLimit = (req, res, next) => {
  const now = Date.now()
  for (const [ip, attempt] of publicSubmissionAttempts) {
    if (attempt.expiresAt <= now) publicSubmissionAttempts.delete(ip)
  }

  const key = getClientIp(req)
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
  const key = getClientIp(req)
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
    let data = result.rows.map(mapProductRow)

    if (data.length === 0 && (!category || category === 'all') && !search) {
      data = catalogProducts
    } else if (data.length === 0 && category && category !== 'all') {
      data = catalogProducts.filter(p => p.category === category)
    }

    res.json({
      success: true,
      data
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

    if (combos.length === 0) {
      try {
        const fallbackPath = path.join(__dirname, '../src/data/combos.json')
        if (fs.existsSync(fallbackPath)) {
          combos.push(...JSON.parse(fs.readFileSync(fallbackPath, 'utf8')))
        }
      } catch (e) {}
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
// 1.4 AI CHATBOT TÚ AUDIO (BẢO VỆ CHỐNG SPAM & TỰ ĐỘNG TƯ VẤN)
// ==========================================
app.post('/api/v1/ai-chat', aiChatProtection, handleAiChatRequest)

// ==========================================
// 2. ADMIN APIS (QUẢN TRỊ BẢO MẬT BẰNG JWT)
// ==========================================

// Đăng ký tài khoản nhân sự từ bên ngoài (Tự động vào trạng thái CHỜ DUYỆT & PHÂN QUYỀN)
app.post('/api/v1/admin/auth/register', loginRateLimit, async (req, res) => {
  try {
    const { username, password, fullName, phone, email } = req.body
    const cleanUsername = typeof username === 'string' ? username.trim().toLowerCase() : ''
    if (!/^[a-z0-9._-]{3,50}$/.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập chỉ gồm chữ không dấu, số, dấu chấm hoặc gạch nối (3–50 ký tự, viết liền không khoảng trắng).'
      })
    }
    if (typeof fullName !== 'string' || !fullName.trim() || fullName.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Họ tên nhân sự không được để trống và tối đa 100 ký tự.' })
    }
    const cleanPhone = String(phone || '').trim()
    if (!validPhone(cleanPhone) || cleanPhone.length > 20) {
      return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ (từ 8 đến 15 chữ số).' })
    }
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!cleanEmail || !validEmail(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ email hợp lệ để nhận mã xác minh OTP.' })
    }
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Mật khẩu cần dài từ 12 đến 128 ký tự để đảm bảo an toàn.' })
    }

    // Kiểm tra tên đăng nhập đã được sử dụng chưa
    const existingUser = await query('SELECT id FROM admins WHERE LOWER(username) = $1', [cleanUsername])
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, message: `Tên đăng nhập "${cleanUsername}" đã tồn tại. Vui lòng chọn tên khác.` })
    }

    // Kiểm tra email đã được liên kết chưa
    const existingEmail = await query('SELECT id FROM admins WHERE LOWER(email) = $1', [cleanEmail])
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ success: false, message: `Email "${cleanEmail}" đã được liên kết với một tài khoản khác.` })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const newId = randomUUID()
    await query(
      `INSERT INTO admins (id, username, password_hash, full_name, email, phone, role, is_active, auth_version)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', FALSE, 0)`,
      [newId, cleanUsername, passwordHash, fullName.trim(), cleanEmail, cleanPhone]
    )

    return res.status(201).json({
      success: true,
      message: 'Nộp đơn đăng ký tài khoản thành công! Hồ sơ của bạn đang ở trạng thái CHỜ DUYỆT & PHÂN QUYỀN bởi Quản Trị Viên (anh Tú).'
    })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Tên đăng nhập hoặc email đã tồn tại trong hệ thống.' })
    }
    res.status(500).json({ success: false, message: err.message })
  }
})

// Đăng nhập Admin (Kiểm tra trực tiếp từ bảng admins trên Aiven PostgreSQL, hỗ trợ OTP Email 2 bước & Khóa Brute-force)
app.post('/api/v1/admin/auth/login', loginRateLimit, async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body
    const cleanUser = username?.trim().toLowerCase()

    if (!cleanUser || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu' })
    }

    // 1. Kiểm tra tài khoản có đang bị khóa do nhập sai nhiều lần liên tiếp không
    const lockMins = checkAccountLock(cleanUser)
    if (lockMins) {
      return res.status(429).json({
        success: false,
        message: `Tài khoản '${cleanUser}' đang bị tạm khóa an toàn do nhập sai mật khẩu 5 lần liên tiếp. Vui lòng thử lại sau ${lockMins} phút.`
      })
    }

    const result = await query('SELECT * FROM admins WHERE LOWER(username) = $1', [cleanUser])
    if (result.rows.length === 0) {
      await recordFailedLogin(cleanUser, 'Tài khoản không tồn tại', req)
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' })
    }

    const admin = result.rows[0]

    // Kiểm tra trạng thái tài khoản
    if (!admin.is_active) {
      if (admin.role === 'PENDING') {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn vừa đăng ký thành công và đang ở trạng thái CHỜ PHÊ DUYỆT & PHÂN QUYỀN. Vui lòng liên hệ Quản trị viên (anh Tú) để được kích hoạt.'
        })
      }
      return res.status(403).json({ success: false, message: 'Tài khoản này hiện đang tạm khóa hoặc đã bị ngưng hoạt động.' })
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash)

    if (!isMatch) {
      const { isLocked, count } = await recordFailedLogin(cleanUser, 'Mật khẩu không chính xác', req)
      const remaining = Math.max(0, 5 - count)
      return res.status(401).json({
        success: false,
        message: isLocked
          ? `Bạn đã nhập sai mật khẩu 5 lần. Tài khoản '${cleanUser}' đã bị tạm khóa 15 phút để bảo vệ an toàn.`
          : `Mật khẩu không chính xác. Bạn còn ${remaining} lần thử trước khi tài khoản bị khóa tạm thời.`
      })
    }

    // Đăng nhập thành công -> Reset các bộ đếm sai
    resetFailedLogin(cleanUser)
    loginAttempts.delete(getClientIp(req))

    // Nếu tài khoản đã cài đặt Email -> Kích hoạt xác thực 2 bước qua mã OTP
    if (admin.email && admin.email.trim()) {
      await query("DELETE FROM admin_otp_codes WHERE admin_id = $1 OR expires_at < CURRENT_TIMESTAMP", [admin.id])
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      const otpId = randomUUID()
      await query(
        "INSERT INTO admin_otp_codes (id, admin_id, code, purpose, expires_at) VALUES ($1, $2, $3, 'LOGIN', CURRENT_TIMESTAMP + INTERVAL '5 minutes')",
        [otpId, admin.id, otpCode]
      )

      const tempToken = jwt.sign(
        { id: admin.id, purpose: 'ADMIN_OTP_VERIFY', rememberMe: Boolean(rememberMe) },
        JWT_SECRET,
        { expiresIn: '5m' }
      )

      const emailResult = await dispatchOtpEmail({
        toEmail: admin.email,
        otpCode,
        adminName: admin.full_name || admin.username
      })

      return res.json({
        success: true,
        requireOtp: true,
        tempToken,
        maskedEmail: maskEmail(admin.email),
        expiresInSeconds: 300,
        ...((!emailResult.sent && emailResult.devOtp) ? { devOtp: emailResult.devOtp, note: 'Máy chủ chưa cấu hình SMTP. Mã OTP đã hiển thị sẵn để thử nghiệm thuận tiện.' } : {})
      })
    }

    // Tài khoản chưa cài Email: Cho phép đăng nhập trực tiếp và nhắc nhở bổ sung Email bảo mật
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role, name: admin.full_name, authVersion: Number(admin.auth_version ?? 0) },
      JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '8h' }
    )
    return res.json({
      success: true,
      requireOtp: false,
      token,
      user: { id: admin.id, username: admin.username, full_name: admin.full_name, role: admin.role, email: admin.email || null },
      warning: 'Tài khoản chưa cập nhật Email bảo mật. Vui lòng thêm Email trong mục Phân Quyền để kích hoạt mã OTP 2 bước.'
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Xác thực mã OTP 6 số để nhận JWT Token chính thức
app.post('/api/v1/admin/auth/verify-otp', async (req, res) => {
  try {
    const { tempToken, otp } = req.body
    if (!tempToken || !otp) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ phiên xác thực và mã OTP 6 số.' })
    }

    let decoded
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET)
    } catch {
      return res.status(401).json({ success: false, message: 'Phiên xác thực đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại từ đầu.' })
    }

    if (decoded.purpose !== 'ADMIN_OTP_VERIFY') {
      return res.status(403).json({ success: false, message: 'Phiên làm việc không hợp lệ cho tác vụ này.' })
    }

    const otpResult = await query(
      "SELECT * FROM admin_otp_codes WHERE admin_id = $1 AND purpose = 'LOGIN' AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1",
      [decoded.id]
    )

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Mã xác thực OTP đã hết hạn (5 phút). Vui lòng nhấn Gửi lại mã mới.' })
    }

    const otpRecord = otpResult.rows[0]
    const cleanCode = String(otp).trim()

    if (otpRecord.code !== cleanCode) {
      const newAttempts = Number(otpRecord.attempts || 0) + 1
      if (newAttempts >= 5) {
        await query('DELETE FROM admin_otp_codes WHERE id = $1', [otpRecord.id])
        return res.status(400).json({ success: false, message: 'Bạn đã nhập sai mã quá 5 lần. Mã đã bị hủy vì lý do an toàn, vui lòng yêu cầu mã mới.' })
      }
      await query('UPDATE admin_otp_codes SET attempts = $1 WHERE id = $2', [newAttempts, otpRecord.id])
      return res.status(400).json({ success: false, message: `Mã OTP không chính xác. Bạn còn ${5 - newAttempts} lần thử.` })
    }

    // OTP chính xác: Xóa mã đã sử dụng
    await query('DELETE FROM admin_otp_codes WHERE id = $1', [otpRecord.id])

    // Lấy thông tin tài khoản admin mới nhất
    const adminResult = await query('SELECT * FROM admins WHERE id = $1 AND is_active = TRUE', [decoded.id])
    if (adminResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Tài khoản quản trị không tồn tại hoặc đã bị khóa.' })
    }

    const admin = adminResult.rows[0]
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role, name: admin.full_name, authVersion: Number(admin.auth_version ?? 0) },
      JWT_SECRET,
      { expiresIn: decoded.rememberMe ? '30d' : '8h' }
    )

    await recordAuditLog({
      admin: { id: admin.id, username: admin.username, name: admin.full_name, role: admin.role },
      action: 'AUTH_LOGIN_SUCCESS',
      actionType: 'AUTH',
      targetType: 'auth',
      targetId: admin.username,
      summary: `Quản trị viên ${admin.full_name} (${admin.username}) đã đăng nhập thành công bằng mã OTP Email.`,
      details: { email: admin.email, role: admin.role },
      req
    })

    return res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name,
        role: admin.role,
        email: admin.email || null,
        permissions: Array.isArray(admin.permissions) ? admin.permissions : []
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Gửi lại mã OTP tới email (Cooldown 60s)
app.post('/api/v1/admin/auth/resend-otp', async (req, res) => {
  try {
    const { tempToken } = req.body
    if (!tempToken) {
      return res.status(400).json({ success: false, message: 'Phiên xác thực không tồn tại.' })
    }

    let decoded
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET)
    } catch {
      return res.status(401).json({ success: false, message: 'Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại.' })
    }

    const adminResult = await query('SELECT * FROM admins WHERE id = $1 AND is_active = TRUE', [decoded.id])
    if (adminResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Tài khoản quản trị không tồn tại hoặc đã bị khóa.' })
    }
    const admin = adminResult.rows[0]
    if (!admin.email) {
      return res.status(400).json({ success: false, message: 'Tài khoản chưa có email nhận mã OTP.' })
    }

    // Kiểm tra cooldown 60 giây
    const lastOtp = await query(
      "SELECT created_at FROM admin_otp_codes WHERE admin_id = $1 AND purpose = 'LOGIN' ORDER BY created_at DESC LIMIT 1",
      [admin.id]
    )
    if (lastOtp.rows.length > 0) {
      const elapsedSeconds = (Date.now() - new Date(lastOtp.rows[0].created_at).getTime()) / 1000
      if (elapsedSeconds < 60) {
        const waitMore = Math.ceil(60 - elapsedSeconds)
        return res.status(429).json({ success: false, message: `Vui lòng đợi ${waitMore} giây trước khi yêu cầu gửi lại mã mới.` })
      }
    }

    // Sinh mã mới và gửi
    await query("DELETE FROM admin_otp_codes WHERE admin_id = $1 AND purpose = 'LOGIN'", [admin.id])
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpId = randomUUID()
    await query(
      "INSERT INTO admin_otp_codes (id, admin_id, code, purpose, expires_at) VALUES ($1, $2, $3, 'LOGIN', CURRENT_TIMESTAMP + INTERVAL '5 minutes')",
      [otpId, admin.id, otpCode]
    )

    const emailResult = await dispatchOtpEmail({
      toEmail: admin.email,
      otpCode,
      adminName: admin.full_name || admin.username
    })

    return res.json({
      success: true,
      message: 'Mã xác thực mới đã được gửi tới email của bạn.',
      ...((!emailResult.sent && emailResult.devOtp) ? { devOtp: emailResult.devOtp } : {})
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Cập nhật thông tin hồ sơ của chính nhân viên / admin đang đăng nhập
app.patch('/api/v1/admin/auth/profile', authenticateAdmin, async (req, res) => {
  try {
    const { fullName, phone, email, password } = req.body
    if (fullName !== undefined && (typeof fullName !== 'string' || !fullName.trim() || fullName.length > 100)) {
      return res.status(400).json({ success: false, message: 'Họ tên không hợp lệ.' })
    }
    if (phone !== undefined && (!validPhone(phone) || String(phone).trim().length > 20)) {
      return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ.' })
    }
    if (email !== undefined && email !== null && String(email).trim() !== '') {
      if (!validEmail(String(email).trim())) {
        return res.status(400).json({ success: false, message: 'Định dạng email không hợp lệ.' })
      }
    }
    if (password !== undefined && (typeof password !== 'string' || password.length < 12 || password.length > 128)) {
      return res.status(400).json({ success: false, message: 'Mật khẩu cần dài từ 12 đến 128 ký tự.' })
    }

    const cleanEmail = email !== undefined ? (email && String(email).trim() ? String(email).trim().toLowerCase() : null) : undefined
    const passwordHash = password ? await bcrypt.hash(password, 12) : null

    const result = await query(
      `UPDATE admins SET
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        password_hash = COALESCE($4, password_hash),
        auth_version = COALESCE(auth_version, 0) + 1,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING id, username, full_name, email, phone, role, is_active, auth_version, created_at`,
      [fullName?.trim() ?? null, phone?.trim() ?? null, cleanEmail, passwordHash, req.admin.id]
    )
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' })
    const updated = result.rows[0]
    const newToken = jwt.sign(
      { id: updated.id, username: updated.username, role: updated.role, name: updated.full_name, authVersion: Number(updated.auth_version ?? 0) },
      JWT_SECRET,
      { expiresIn: '8h' }
    )
    res.json({
      success: true,
      data: {
        id: updated.id,
        username: updated.username,
        full_name: updated.full_name,
        email: updated.email,
        phone: updated.phone,
        role: updated.role
      },
      newToken
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Quản lý tài khoản nhân viên: chỉ SUPER_ADMIN được phép
app.get('/api/v1/admin/users', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const result = await query('SELECT id, username, full_name, email, phone, role, is_active, permissions, created_at FROM admins ORDER BY created_at DESC')
    res.json({ success: true, data: result.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.post('/api/v1/admin/users', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { username, password, fullName, phone, role, email, permissions } = req.body
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
    let cleanEmail = null
    if (email !== undefined && email !== null && String(email).trim() !== '') {
      const em = String(email).trim().toLowerCase()
      if (!validEmail(em)) {
        return res.status(400).json({ success: false, message: 'Định dạng email nhận mã OTP không hợp lệ.' })
      }
      cleanEmail = em
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
    const perms = Array.isArray(permissions) ? permissions : (role === 'SUPER_ADMIN' ? ['*'] : [])
    const result = await query(
      'INSERT INTO admins (id, username, password_hash, full_name, email, phone, role, is_active, permissions, auth_version) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8, 0) RETURNING id, username, full_name, email, phone, role, is_active, permissions, created_at',
      [randomUUID(), cleanUsername, passwordHash, fullName.trim(), cleanEmail, cleanPhone, role, JSON.stringify(perms)]
    )

    await recordAuditLog({
      admin: req.admin,
      action: 'USER_CREATE',
      actionType: 'CREATE',
      targetType: 'admin',
      targetId: cleanUsername,
      summary: `Tạo tài khoản nhân viên mới: ${fullName.trim()} (${cleanUsername}) với vai trò ${role}.`,
      details: { username: cleanUsername, fullName: fullName.trim(), phone: cleanPhone, email: cleanEmail, role, permissions: perms },
      req
    })

    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Tên đăng nhập đã được sử dụng.' })
    res.status(500).json({ success: false, message: err.message })
  }
})

app.patch('/api/v1/admin/users/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const { role, isActive, fullName, phone, password, email } = req.body
    if (id === req.admin.id && isActive === false) {
      return res.status(400).json({ success: false, message: 'Không thể tự khóa tài khoản đang đăng nhập.' })
    }
    if (role !== undefined && !validRoles.has(role)) return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' })
    if (fullName !== undefined && (typeof fullName !== 'string' || !fullName.trim() || fullName.length > 100)) return res.status(400).json({ success: false, message: 'Họ tên không hợp lệ.' })
    if (phone !== undefined && (!validPhone(phone) || String(phone).trim().length > 20)) return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ.' })
    let cleanEmail = undefined
    if (email !== undefined) {
      if (email !== null && String(email).trim() !== '') {
        const em = String(email).trim().toLowerCase()
        if (!validEmail(em)) return res.status(400).json({ success: false, message: 'Định dạng email nhận mã OTP không hợp lệ.' })
        cleanEmail = em
      } else {
        cleanEmail = null
      }
    }
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
        email = COALESCE($5, email),
        password_hash = COALESCE($6, password_hash), auth_version = COALESCE(auth_version, 0) + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING id, username, full_name, email, phone, role, is_active, permissions, auth_version, created_at`,
      [role ?? null, isActive ?? null, fullName?.trim() ?? null, phone?.trim() ?? null, cleanEmail, passwordHash, id]
    )
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' })
    const updatedRow = result.rows[0]

    await recordAuditLog({
      admin: req.admin,
      action: isActive === false ? 'USER_LOCK' : (isActive === true ? 'USER_ACTIVATE' : 'USER_UPDATE'),
      actionType: 'UPDATE',
      targetType: 'admin',
      targetId: updatedRow.username,
      summary: `Cập nhật tài khoản ${updatedRow.username}: ${isActive === false ? 'Khóa tài khoản' : (isActive === true ? 'Mở khóa / Kích hoạt' : 'Sửa thông tin cá nhân/vai trò')}.`,
      details: { targetUserId: id, role, isActive, fullName, phone, email: cleanEmail },
      req
    })

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

// Cập nhật phân quyền sâu chi tiết cho từng tài khoản (Chỉ SUPER_ADMIN)
app.put('/api/v1/admin/users/:id/permissions', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const { role, permissions } = req.body

    if (role !== undefined && !validRoles.has(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò được chọn không hợp lệ.' })
    }
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: 'Danh sách quyền hạn phải là một mảng.' })
    }

    const target = await query('SELECT username, full_name, role, is_active, permissions FROM admins WHERE id = $1', [id])
    if (!target.rows.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản nhân sự.' })
    }
    const oldUser = target.rows[0]

    // Tránh tước quyền SUPER_ADMIN của quản trị viên duy nhất
    if (oldUser.role === 'SUPER_ADMIN' && role && role !== 'SUPER_ADMIN') {
      const superCount = await query("SELECT COUNT(*)::int AS count FROM admins WHERE role = 'SUPER_ADMIN' AND is_active = TRUE AND id <> $1", [id])
      if (superCount.rows[0].count === 0) {
        return res.status(400).json({ success: false, message: 'Cần giữ lại ít nhất một Quản trị viên cấp cao trong hệ thống.' })
      }
    }

    const newRole = role || oldUser.role
    const result = await query(
      `UPDATE admins 
       SET role = $1, permissions = $2, auth_version = COALESCE(auth_version, 0) + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING id, username, full_name, email, phone, role, is_active, permissions, auth_version, created_at`,
      [newRole, JSON.stringify(permissions), id]
    )

    await recordAuditLog({
      admin: req.admin,
      action: 'USER_UPDATE_PERMISSIONS',
      actionType: 'PERMISSIONS',
      targetType: 'admin',
      targetId: oldUser.username,
      summary: `Phân quyền chi tiết tài khoản ${oldUser.username} (${oldUser.full_name}): Vai trò [${newRole}], gồm ${permissions.includes('*') ? 'Toàn quyền (*)' : permissions.length + ' quyền thao tác'}.`,
      details: {
        targetUserId: id,
        targetUsername: oldUser.username,
        oldRole: oldUser.role,
        newRole,
        oldPermissions: oldUser.permissions,
        newPermissions: permissions
      },
      req
    })

    let refreshedToken = null
    if (id === req.admin.id) {
      refreshedToken = jwt.sign(
        { id: result.rows[0].id, username: result.rows[0].username, role: result.rows[0].role, name: result.rows[0].full_name, authVersion: Number(result.rows[0].auth_version ?? 0) },
        JWT_SECRET,
        { expiresIn: '8h' }
      )
    }

    const { auth_version: _av, ...publicAdmin } = result.rows[0]
    res.json({
      success: true,
      message: `Đã cập nhật phân quyền cho tài khoản ${oldUser.username} thành công.`,
      data: publicAdmin,
      ...(refreshedToken ? { newToken: refreshedToken } : {})
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Xóa hoặc từ chối tài khoản nhân sự (Chỉ SUPER_ADMIN được phép)
app.delete('/api/v1/admin/users/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    if (id === req.admin.id) {
      return res.status(400).json({ success: false, message: 'Không thể tự xóa tài khoản đang đăng nhập.' })
    }
    const target = await query('SELECT username, full_name, role, is_active FROM admins WHERE id = $1', [id])
    if (target.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản nhân sự này.' })
    }
    if (target.rows[0].role === 'SUPER_ADMIN') {
      const superCount = await query("SELECT COUNT(*)::int AS count FROM admins WHERE role = 'SUPER_ADMIN' AND id <> $1", [id])
      if (superCount.rows[0].count === 0) {
        return res.status(400).json({ success: false, message: 'Cần giữ lại ít nhất một Quản trị viên cấp cao.' })
      }
    }
    await query('DELETE FROM admins WHERE id = $1', [id])

    await recordAuditLog({
      admin: req.admin,
      action: 'USER_DELETE',
      actionType: 'DELETE',
      targetType: 'admin',
      targetId: target.rows[0].username || id,
      summary: `Đã xóa tài khoản nhân sự ${target.rows[0].username} (${target.rows[0].full_name}) khỏi hệ thống.`,
      details: { targetUserId: id, targetUsername: target.rows[0].username, targetRole: target.rows[0].role },
      req
    })

    res.json({ success: true, message: 'Đã xóa tài khoản khỏi hệ thống thành công.' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Lấy danh sách lịch sử thao tác hệ thống chuyên sâu (Audit Logs)
app.get('/api/v1/admin/audit-logs', authenticateAdmin, async (req, res) => {
  try {
    if (req.admin.role !== 'SUPER_ADMIN' && !req.admin.permissions?.includes('*') && !req.admin.permissions?.includes('logs.view')) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem nhật ký thao tác hệ thống.' })
    }

    const {
      page = 1,
      limit = 25,
      q = '',
      actionType = 'ALL',
      targetType = 'ALL',
      adminUser = 'ALL',
      targetId = '',
      fromDate = '',
      toDate = ''
    } = req.query

    const parsedPage = Math.max(1, parseInt(page, 10))
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const offset = (parsedPage - 1) * take

    const conditions = []
    const params = []

    if (q && q.trim()) {
      params.push(`%${q.trim().toLowerCase()}%`)
      conditions.push(`(
        LOWER(admin_username) LIKE $${params.length} OR 
        LOWER(admin_name) LIKE $${params.length} OR 
        LOWER(summary) LIKE $${params.length} OR 
        LOWER(ip_address) LIKE $${params.length} OR 
        LOWER(target_id) LIKE $${params.length} OR
        LOWER(action) LIKE $${params.length} OR
        details::text ILIKE $${params.length}
      )`)
    }

    if (actionType && actionType !== 'ALL') {
      params.push(actionType)
      conditions.push(`action_type = $${params.length}`)
    }

    if (targetType && targetType !== 'ALL') {
      params.push(targetType)
      conditions.push(`target_type = $${params.length}`)
    }

    if (adminUser && adminUser !== 'ALL') {
      params.push(adminUser.toLowerCase())
      conditions.push(`LOWER(admin_username) = $${params.length}`)
    }

    if (targetId && targetId.trim()) {
      params.push(targetId.trim())
      conditions.push(`target_id = $${params.length}`)
    }

    if (fromDate) {
      params.push(fromDate)
      conditions.push(`created_at >= $${params.length}::date`)
    }

    if (toDate) {
      params.push(toDate)
      conditions.push(`created_at < ($${params.length}::date + INTERVAL '1 day')`)
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRes = await query(`SELECT COUNT(*)::int AS count FROM admin_audit_logs ${whereClause}`, params)
    const total = countRes.rows[0].count

    // Danh sách nhân viên để phục vụ bộ lọc
    const adminUsersRes = await query(`
      SELECT DISTINCT admin_username, admin_name 
      FROM admin_audit_logs 
      WHERE admin_username IS NOT NULL 
      ORDER BY admin_name ASC
    `)

    params.push(take, offset)
    const dataRes = await query(
      `SELECT id, admin_id, admin_username, admin_name, admin_role, action, action_type, target_type, target_id, summary, details, ip_address, created_at
       FROM admin_audit_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    res.json({
      success: true,
      data: dataRes.rows,
      total,
      page: parsedPage,
      limit: take,
      adminUsers: adminUsersRes.rows
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

const ipLocationCache = new Map()

/**
 * Định dạng tên địa danh Việt Nam có dấu chuẩn
 */
const formatVietnameseLocation = (city, region, country) => {
  const c = (city || '').trim()
  const r = (region || '').replace(/^Tinh\s+/i, '').replace(/^Tỉnh\s+/i, '').replace(/^Thanh pho\s+/i, '').replace(/^Thành phố\s+/i, '').trim()

  const accentMap = {
    'Vinh Yen': 'Vĩnh Yên',
    'Phu Tho': 'Phú Thọ',
    'Tinh Phu Tho': 'Phú Thọ',
    'Hanoi': 'Hà Nội',
    'Ha Noi': 'Hà Nội',
    'Ho Chi Minh City': 'TP. Hồ Chí Minh',
    'Da Nang': 'Đà Nẵng',
    'Hai Phong': 'Hải Phòng',
    'Can Tho': 'Cần Thơ',
    'Bien Hoa': 'Biên Hòa',
    'Nha Trang': 'Nha Trang',
    'Hue': 'Huế',
    'Vung Tau': 'Vũng Tàu',
    'Buon Ma Thuot': 'Buôn Ma Thuột',
    'Quy Nhon': 'Quy Nhơn',
    'Long Xuyen': 'Long Xuyên',
    'Thai Nguyen': 'Thái Nguyên',
    'Nam Dinh': 'Nam Định',
    'Viet Tri': 'Việt Trì',
    'Vinh': 'Vinh',
    'Bac Ninh': 'Bắc Ninh',
    'Hai Duong': 'Hải Dương',
    'Thai Binh': 'Thái Bình',
    'Ha Long': 'Hạ Long',
    'Quang Ninh': 'Quảng Ninh',
    'Vinh Phuc': 'Vĩnh Phúc',
    'Thanh Hoa': 'Thanh Hóa',
    'Nghe An': 'Nghệ An'
  }

  const vCity = accentMap[c] || c
  const vRegion = accentMap[r] || r

  if (vCity && vRegion && vCity !== vRegion) {
    return `${vCity} / ${vRegion}`
  }
  return vCity || vRegion || country || 'Việt Nam'
}

/**
 * Xác định vị trí địa lý của Client (IP, Tỉnh/Thành phố)
 */
const resolveClientLocation = async (req, clientLocation = null) => {
  const rawIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim()
  const cleanIp = rawIp.replace(/^::ffff:/, '')

  // 1. Ưu tiên vị trí chính xác do Client gửi lên từ ipwho.is
  if (clientLocation && typeof clientLocation === 'string' && clientLocation.trim()) {
    return {
      ip: cleanIp || '127.0.0.1',
      city: clientLocation.trim(),
      country: 'Việt Nam'
    }
  }

  // 2. Mạng nội bộ / Localhost
  if (!cleanIp || cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp.startsWith('192.168.') || cleanIp.startsWith('10.') || cleanIp.startsWith('172.16.')) {
    return {
      ip: cleanIp || '127.0.0.1',
      city: 'Mạng Nội Bộ',
      country: 'Việt Nam'
    }
  }

  // 3. Header từ Proxy Vercel / Cloudflare nếu có
  const vercelCity = req.headers['x-vercel-ip-city']
  const cfCity = req.headers['cf-ipcity']
  let headerCity = vercelCity || cfCity || null
  if (headerCity) {
    try {
      headerCity = decodeURIComponent(headerCity)
    } catch {
      // ignore
    }
    return {
      ip: cleanIp,
      city: headerCity,
      country: 'Việt Nam'
    }
  }

  // 4. Tra cứu IP từ Cache
  if (ipLocationCache.has(cleanIp)) {
    return ipLocationCache.get(cleanIp)
  }

  // 5. Tra cứu IP vị trí qua ipwho.is trên server
  try {
    const res = await fetch(`https://ipwho.is/${cleanIp}`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const data = await res.json()
      if (data && data.success) {
        const formattedCity = formatVietnameseLocation(data.city, data.region, data.country)
        const result = {
          ip: cleanIp,
          city: formattedCity,
          country: data.country || 'Việt Nam'
        }
        ipLocationCache.set(cleanIp, result)
        if (ipLocationCache.size > 1000) {
          const firstKey = ipLocationCache.keys().next().value
          ipLocationCache.delete(firstKey)
        }
        return result
      }
    }
  } catch {
    // Không chặn luồng nếu api timeout
  }

  return {
    ip: cleanIp,
    city: 'Việt Nam',
    country: 'Việt Nam'
  }
}

// Gửi nhịp tim (Heartbeat) cập nhật trang đang xem & vị trí hoạt động
app.post('/api/v1/admin/heartbeat', authenticateAdmin, async (req, res) => {
  try {
    const { page, pageTitle, clientLocation } = req.body || {}
    const admin = req.admin
    const uaInfo = parseUserAgent(req.headers['user-agent'])
    const loc = await resolveClientLocation(req, clientLocation)

    const cleanPage = typeof page === 'string' ? page.slice(0, 100) : '/admin/dashboard'
    const cleanTitle = typeof pageTitle === 'string' ? pageTitle.slice(0, 150) : 'Trang Quản Trị'

    await query(
      `INSERT INTO admin_active_sessions 
        (id, admin_id, username, full_name, role, current_page, current_page_title, ip_address, city, country, device_type, browser, last_active_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
       ON CONFLICT (admin_id) DO UPDATE SET
         username = EXCLUDED.username,
         full_name = EXCLUDED.full_name,
         role = EXCLUDED.role,
         current_page = EXCLUDED.current_page,
         current_page_title = EXCLUDED.current_page_title,
         ip_address = EXCLUDED.ip_address,
         city = EXCLUDED.city,
         country = EXCLUDED.country,
         device_type = EXCLUDED.device_type,
         browser = EXCLUDED.browser,
         last_active_at = CURRENT_TIMESTAMP`,
      [
        randomUUID(),
        admin.id,
        admin.username,
        admin.name,
        admin.role,
        cleanPage,
        cleanTitle,
        loc.ip,
        loc.city,
        loc.country,
        uaInfo.deviceType,
        uaInfo.browser
      ]
    )

    res.json({ success: true, timestamp: Date.now() })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Lấy danh sách tài khoản đang Online, trang đang xem và vị trí thiết bị
app.get('/api/v1/admin/online-users', authenticateAdmin, async (req, res) => {
  try {
    const sql = `
      SELECT 
        a.id AS admin_id,
        a.username,
        a.full_name,
        a.role,
        a.email,
        a.phone,
        a.is_active,
        s.current_page,
        s.current_page_title,
        s.ip_address,
        s.city,
        s.country,
        s.device_type,
        s.browser,
        s.last_active_at,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.last_active_at))::int AS seconds_ago
      FROM admins a
      LEFT JOIN admin_active_sessions s ON a.id = s.admin_id
      WHERE a.is_active = TRUE AND a.role <> 'PENDING'
      ORDER BY 
        CASE 
          WHEN s.last_active_at IS NOT NULL AND s.last_active_at > CURRENT_TIMESTAMP - INTERVAL '3 MINUTES' THEN 1
          WHEN s.last_active_at IS NOT NULL AND s.last_active_at > CURRENT_TIMESTAMP - INTERVAL '15 MINUTES' THEN 2
          ELSE 3
        END,
        s.last_active_at DESC NULLS LAST
    `
    const result = await query(sql)

    const mapped = result.rows.map(row => {
      const secAgo = row.seconds_ago
      let status = 'OFFLINE'
      let statusLabel = 'Ngoại tuyến'

      if (secAgo !== null && secAgo !== undefined) {
        if (secAgo <= 180) { // trong vòng 3 phút
          status = 'ONLINE'
          statusLabel = 'Đang trực tuyến'
        } else if (secAgo <= 900) { // trong vòng 15 phút
          status = 'AWAY'
          statusLabel = 'Vừa rời đi / Tạm vắng'
        }
      }

      return {
        id: row.admin_id,
        username: row.username,
        fullName: row.full_name,
        role: row.role,
        email: row.email,
        phone: row.phone,
        status,
        statusLabel,
        currentPage: row.current_page || null,
        currentPageTitle: row.current_page_title || null,
        ipAddress: row.ip_address || null,
        city: row.city || null,
        country: row.country || 'Việt Nam',
        deviceType: row.device_type || 'Desktop',
        browser: row.browser || 'Web Browser',
        lastActiveAt: row.last_active_at,
        secondsAgo: secAgo
      }
    })

    const onlineCount = mapped.filter(u => u.status === 'ONLINE').length
    const awayCount = mapped.filter(u => u.status === 'AWAY').length

    res.json({
      success: true,
      data: mapped,
      counts: {
        online: onlineCount,
        away: awayCount,
        totalActiveAdmins: mapped.length
      }
    })
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

// Tự động đồng bộ khách hàng Facebook đã có số điện thoại sang bảng Khách Tư Vấn & Thử Dàn (Leads)
const cleanCustomerNote = (msg) => {
  if (!msg) return ''
  const str = String(msg).trim()
  if (str.startsWith('Facebook tạo đoạn chat') || str.includes('facebook.com/story.php')) return ''
  return str.replace(/\[Nguồn:\s*AUTO_MATCHED\]\s*·?\s*/gi, '').trim()
}

const syncFbCustomersToLeads = async () => {
  try {
    const fbCustomers = await query(`
      SELECT id, customer_name, facebook_id, phone, address, province, interest, status, notes, last_message, source_ad_name, source_type, created_at, updated_at
      FROM facebook_care_customers
      WHERE phone IS NOT NULL AND (phone ~ '^0[35789][0-9]{8}$' OR phone ~ '^0[2][0-9]{9}$')
    `)
    for (const c of fbCustomers.rows) {
      const cleanP = phoneFromMessage(c.phone) || c.phone.trim().replace(/\D/g, '')
      if (!isValidViMobilePhone(cleanP)) continue

      const leadId = `FB-${c.id.replace(/^FB-/, '')}`.slice(0, 50)
      const leadAddress = (c.address || c.province || '').trim()
      const cleanAd = (c.source_ad_name || '').trim()
      const cleanLastMsg = cleanCustomerNote(c.last_message)
      const cleanNotes = cleanCustomerNote(c.notes)

      const leadInterest = (c.interest && c.interest !== 'Tư vấn âm thanh qua Facebook' && c.interest !== 'Tư vấn âm thanh karaoke')
        ? c.interest
        : extractCustomerInterest([c.last_message, c.notes], c.last_message, c.source_ad_name)
      const leadNote = [
        cleanAd ? `QC: ${cleanAd}` : '',
        cleanLastMsg ? `Tin nhắn: ${cleanLastMsg}` : '',
        cleanNotes
      ].filter(Boolean).join(' · ')

      const leadStatus = c.status === 'DA_CHOT' ? 'DA_CHOT' : (c.status === 'DA_HUY' ? 'HUY' : (c.status === 'DANG_TU_VAN' ? 'DA_GOI' : 'MOI'))

      // Kiểm tra xem số điện thoại này đã có trong leads chưa (tránh sinh 2 dòng LD-... và FB-CMT-...)
      const existingLead = await query(`SELECT id, name, notes, address, interest FROM leads WHERE phone = $1 LIMIT 1`, [cleanP])
      if (existingLead.rows.length > 0) {
        const cur = existingLead.rows[0]
        const mergedNotes = [cur.notes, leadNote].filter(Boolean)
        const uniqueMerged = [...new Set(mergedNotes.join(' · ').split(' · '))].join(' · ').slice(0, 2000)
        await query(`
          UPDATE leads SET
            name = CASE WHEN leads.name IS NULL OR leads.name = '' OR leads.name LIKE 'Khách Facebook %' THEN $1 ELSE leads.name END,
            address = CASE WHEN leads.address IS NULL OR leads.address = '' OR leads.address = 'Facebook Comment Lead' THEN $2 ELSE leads.address END,
            interest = CASE WHEN leads.interest IS NULL OR leads.interest = '' OR leads.interest = 'Tư vấn âm thanh qua Facebook' THEN $3 ELSE leads.interest END,
            notes = $4,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `, [
          c.customer_name || cur.name || ('Khách Facebook ' + cleanP.slice(-4)),
          leadAddress || cur.address,
          leadInterest || cur.interest,
          uniqueMerged,
          cur.id
        ]).catch(() => {})
      } else {
        await query(`
          INSERT INTO leads (id, name, phone, address, interest, room_info, status, deal_value, notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, '', $6, 0, $7, COALESCE($8, CURRENT_TIMESTAMP), COALESCE($9, CURRENT_TIMESTAMP))
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            address = CASE WHEN leads.address IS NULL OR leads.address = '' THEN EXCLUDED.address ELSE leads.address END,
            interest = CASE WHEN leads.interest IS NULL OR leads.interest = '' OR leads.interest = 'Tư vấn âm thanh qua Facebook' THEN EXCLUDED.interest ELSE leads.interest END,
            notes = CASE WHEN leads.notes IS NULL OR leads.notes = '' THEN EXCLUDED.notes ELSE leads.notes END,
            updated_at = CURRENT_TIMESTAMP
        `, [
          leadId,
          c.customer_name || 'Khách Facebook ' + cleanP.slice(-4),
          cleanP,
          leadAddress,
          leadInterest,
          leadStatus,
          leadNote,
          c.updated_at || c.created_at || new Date(),
          c.updated_at || new Date()
        ]).catch(() => {})
      }
    }
  } catch (err) {
    console.warn('[syncFbCustomersToLeads warning]:', err.message)
  }
}

// Lấy danh sách khách hàng (Leads) - Chỉ trả về đúng số điện thoại hợp lệ
app.get('/api/v1/admin/leads', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    await syncFbCustomersToLeads()
    const { status, keyword } = req.query
    const dateRange = parseDateRange(req, res)
    if (!dateRange) return
    let sql = "SELECT * FROM leads WHERE (phone ~ '^0[35789][0-9]{8}$' OR phone ~ '^0[2][0-9]{9}$')"
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

    if (updatedLead.phone) {
      const fbStatusMap = {
        'MOI': 'MOI',
        'DA_GOI': 'DANG_TU_VAN',
        'HEN_THU_TAI_NHA': 'DANG_TU_VAN',
        'DA_CHOT': 'DA_CHOT',
        'HUY': 'DA_HUY'
      }
      const mappedFbStatus = status ? fbStatusMap[status] : null
      if (mappedFbStatus) {
        await query("UPDATE facebook_care_customers SET status=$1, updated_at=CURRENT_TIMESTAMP WHERE phone=$2 OR id=$3", [mappedFbStatus, updatedLead.phone, id.replace(/^FB-/, '')]).catch(() => {})
      }
    }

    // Ghi nhật ký biến động chi tiết (Visual Diff / Changes)
    const changes = {}
    if (name !== undefined && name !== existingLead?.name) changes['Họ tên khách'] = { before: existingLead?.name || '—', after: name }
    if (phone !== undefined && phone !== existingLead?.phone) changes['Số điện thoại'] = { before: existingLead?.phone || '—', after: phone }
    if (status !== undefined && status !== existingLead?.status) changes['Trạng thái tư vấn'] = { before: existingLead?.status || 'MOI', after: status }
    if (dealValue !== undefined && Number(dealValue) !== Number(existingLead?.deal_value || 0)) changes['Giá trị chốt'] = { before: Number(existingLead?.deal_value || 0), after: Number(dealValue) }
    if (appointmentDate !== undefined && appointmentDate !== existingLead?.appointment_date) changes['Lịch hẹn thử dàn'] = { before: existingLead?.appointment_date || 'Chưa đặt', after: appointmentDate || 'Đã hủy' }
    if (address !== undefined && address !== existingLead?.address) changes['Địa chỉ lắp đặt'] = { before: existingLead?.address || '—', after: address }

    if (Object.keys(changes).length > 0) {
      await recordAuditLog({
        admin: req.admin,
        action: 'LEAD_UPDATE',
        actionType: 'UPDATE',
        targetType: 'lead',
        targetId: id,
        summary: `Cập nhật thông tin khách tư vấn "${updatedLead.name}": đổi ${Object.keys(changes).join(', ')}.`,
        details: { changes, leadId: id, leadName: updatedLead.name, leadPhone: updatedLead.phone },
        req
      })
    }

    res.json({ success: true, data: mapLeadRow(updatedLead), syncedOrders })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Xóa khách hàng (Chỉ SUPER_ADMIN được xóa vĩnh viễn dữ liệu CRM)
app.delete('/api/v1/admin/leads/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const existingResult = await query('SELECT name, phone, address FROM leads WHERE id=$1', [id])
    const lead = existingResult.rows[0]
    await query('DELETE FROM leads WHERE id = $1', [id])
    await recordAuditLog({
      admin: req.admin,
      action: 'LEAD_DELETE',
      actionType: 'DELETE',
      targetType: 'lead',
      targetId: id,
      summary: `Đã xóa vĩnh viễn hồ sơ khách tư vấn "${lead?.name || id}" (SĐT: ${lead?.phone || '—'}).`,
      details: { leadId: id, name: lead?.name, phone: lead?.phone },
      req
    })
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

    // Kiểm tra quyền sửa giá bán nếu có thay đổi giá
    if ((p.price !== undefined || p.originalPrice !== undefined) && req.admin.role !== 'SUPER_ADMIN' && !req.admin.permissions?.includes('*') && !req.admin.permissions?.includes('products.price_edit')) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn chưa được cấp quyền chỉnh sửa giá bán / giá khuyến mãi sản phẩm.' })
    }

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

    await recordAuditLog({
      admin: req.admin,
      action: (p.price !== undefined || p.originalPrice !== undefined) ? 'PRODUCT_PRICE_UPDATE' : 'PRODUCT_UPDATE',
      actionType: 'UPDATE',
      targetType: 'product',
      targetId: id,
      summary: `Cập nhật thông tin thiết bị "${result.rows[0].name}"${p.price ? ` (Giá mới: ${Number(p.price).toLocaleString('vi-VN')}đ)` : ''}.`,
      details: { productId: id, name: result.rows[0].name, price: p.price, inStock: p.inStock },
      req
    })

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
app.post('/api/v1/admin/combos', authenticateAdmin, authorizePermission('combos.create'), async (req, res) => {
  try {
    const c = req.body
    if (!c.name || typeof c.name !== 'string' || !c.name.trim()) {
      return res.status(400).json({ success: false, message: 'Tên gói dàn không được để trống.' })
    }
    for (const field of ['price', 'fastActionPrice', 'listPrice', 'totalRealValue']) {
      if (c[field] !== undefined && !validMoney(c[field])) {
        return res.status(400).json({ success: false, message: `Giá trị ${field} không hợp lệ.` })
      }
    }
    if (!validOptionalText(c.name, 200) || !validOptionalText(c.tagline, 255) || !validOptionalText(c.roomSize, 100) || !validOptionalText(c.badge, 100) || !validOptionalText(c.videoUrl, 2048) || !validOptionalText(c.videoTitle, 255)) {
      return res.status(400).json({ success: false, message: 'Thông tin văn bản của gói dàn vượt giới hạn cho phép.' })
    }

    const price = Number(c.price) || 0
    const fastActionPrice = c.fastActionPrice !== undefined && c.fastActionPrice !== '' ? Number(c.fastActionPrice) : price
    const listPrice = c.listPrice !== undefined && c.listPrice !== '' ? Number(c.listPrice) : price
    const totalRealValue = c.totalRealValue !== undefined && c.totalRealValue !== '' ? Number(c.totalRealValue) : listPrice
    const savedAmount = Math.max(0, totalRealValue - price)
    const isFeatured = Boolean(c.isFeatured)

    let id = (c.id || '').trim().toUpperCase()
    if (!id || !/^[A-Z0-9_-]+$/i.test(id)) {
      const mil = Math.round(price / 1000000)
      const baseId = mil > 0 ? `CB-${mil}TR` : 'CB-01'
      const existing = await query('SELECT id FROM combos WHERE id = $1', [baseId])
      if (existing.rows.length === 0) {
        id = baseId
      } else {
        const countRes = await query('SELECT COUNT(*) FROM combos')
        const nextNum = String(Number(countRes.rows[0].count) + 1).padStart(2, '0')
        id = `CB-${nextNum}`
      }
    }

    const sql = `
      INSERT INTO combos (
        id, name, tagline, price, fast_action_price, list_price, total_real_value,
        saved_amount, room_size, is_featured, badge, video_url, video_title
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `
    const result = await query(sql, [
      id,
      c.name.trim(),
      c.tagline?.trim() || null,
      price,
      fastActionPrice,
      listPrice,
      totalRealValue,
      savedAmount,
      c.roomSize?.trim() || 'Phòng gia đình',
      isFeatured,
      c.badge?.trim() || null,
      c.videoUrl?.trim() || null,
      c.videoTitle?.trim() || null
    ])

    const row = result.rows[0]

    if (Array.isArray(c.components)) {
      const cleanComps = c.components
        .filter(item => item && typeof item.item === 'string' && item.item.trim())
        .slice(0, 30)
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
      for (let idx = 0; idx < cleanGifts.length; idx += 1) {
        await query(
          'INSERT INTO combo_gifts (combo_id, gift_description, sort_order) VALUES ($1, $2, $3)',
          [id, cleanGifts[idx].slice(0, 500), idx + 1]
        )
      }
    }

    const compResult = await query(
      'SELECT item_name as item, role_description as role FROM combo_components WHERE combo_id = $1 ORDER BY sort_order',
      [id]
    )
    const giftResult = await query(
      'SELECT gift_description as gift FROM combo_gifts WHERE combo_id = $1 ORDER BY sort_order',
      [id]
    )

    await recordAuditLog({
      admin: req.admin,
      action: 'COMBO_CREATE',
      actionType: 'CREATE',
      targetType: 'combo',
      targetId: id,
      details: { name: row.name, price: Number(row.price), roomSize: row.room_size }
    })

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

// Cập nhật gói dàn karaoke (Combos)
app.put('/api/v1/admin/combos/:id', authenticateAdmin, authorizePermission('combos.edit'), async (req, res) => {
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

    const isFeaturedVal = c.isFeatured !== undefined ? Boolean(c.isFeatured) : null

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
        is_featured = COALESCE($11, is_featured),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
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
      isFeaturedVal,
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

    await recordAuditLog({
      admin: req.admin,
      action: 'COMBO_UPDATE',
      actionType: 'UPDATE',
      targetType: 'combo',
      targetId: id,
      details: { name: row.name, price: Number(row.price), isFeatured: row.is_featured }
    })

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

// Xóa gói dàn karaoke (Combos)
app.delete('/api/v1/admin/combos/:id', authenticateAdmin, authorizePermission('combos.delete'), async (req, res) => {
  try {
    const { id } = req.params
    const existing = await query('SELECT id, name FROM combos WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy gói dàn cần xóa.' })
    }
    const comboName = existing.rows[0].name

    await query('DELETE FROM combo_components WHERE combo_id = $1', [id])
    await query('DELETE FROM combo_gifts WHERE combo_id = $1', [id])
    await query('DELETE FROM combos WHERE id = $1', [id])

    await recordAuditLog({
      admin: req.admin,
      action: 'COMBO_DELETE',
      actionType: 'DELETE',
      targetType: 'combo',
      targetId: id,
      details: { name: comboName }
    })

    res.json({ success: true, message: `Đã xóa gói dàn "${comboName}".` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Nhân bản gói dàn karaoke (Duplicate)
app.post('/api/v1/admin/combos/:id/duplicate', authenticateAdmin, authorizePermission('combos.create'), async (req, res) => {
  try {
    const { id } = req.params
    const origResult = await query('SELECT * FROM combos WHERE id = $1', [id])
    if (origResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy gói dàn nguồn để nhân bản.' })
    }
    const orig = origResult.rows[0]
    const countRes = await query('SELECT COUNT(*) FROM combos')
    const nextNum = String(Number(countRes.rows[0].count) + 1).padStart(2, '0')
    const newId = `${orig.id}-COPY-${nextNum}`
    const newName = `${orig.name} (Bản sao)`

    const insertSql = `
      INSERT INTO combos (
        id, name, tagline, price, fast_action_price, list_price, total_real_value,
        saved_amount, room_size, is_featured, badge, video_url, video_title
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `
    const insertRes = await query(insertSql, [
      newId,
      newName,
      orig.tagline,
      orig.price,
      orig.fast_action_price,
      orig.list_price,
      orig.total_real_value,
      orig.saved_amount,
      orig.room_size,
      false,
      orig.badge,
      orig.video_url,
      orig.video_title
    ])
    const newRow = insertRes.rows[0]

    const compRows = await query('SELECT item_name, role_description, sort_order FROM combo_components WHERE combo_id = $1 ORDER BY sort_order', [id])
    for (const c of compRows.rows) {
      await query(
        'INSERT INTO combo_components (combo_id, item_name, role_description, sort_order) VALUES ($1, $2, $3, $4)',
        [newId, c.item_name, c.role_description, c.sort_order]
      )
    }

    const giftRows = await query('SELECT gift_description, sort_order FROM combo_gifts WHERE combo_id = $1 ORDER BY sort_order', [id])
    for (const g of giftRows.rows) {
      await query(
        'INSERT INTO combo_gifts (combo_id, gift_description, sort_order) VALUES ($1, $2, $3)',
        [newId, g.gift_description, g.sort_order]
      )
    }

    await recordAuditLog({
      admin: req.admin,
      action: 'COMBO_DUPLICATE',
      actionType: 'CREATE',
      targetType: 'combo',
      targetId: newId,
      details: { originalId: id, name: newName }
    })

    res.json({
      success: true,
      data: {
        id: newRow.id,
        name: newRow.name,
        tagline: newRow.tagline,
        price: Number(newRow.price),
        fastActionPrice: Number(newRow.fast_action_price),
        totalRealValue: Number(newRow.total_real_value),
        listPrice: Number(newRow.list_price),
        savedAmount: Number(newRow.saved_amount),
        roomSize: newRow.room_size,
        isFeatured: newRow.is_featured,
        badge: newRow.badge,
        videoUrl: newRow.video_url,
        videoTitle: newRow.video_title,
        components: compRows.rows.map(r => ({ item: r.item_name, role: r.role_description })),
        gifts: giftRows.rows.map(r => r.gift_description)
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

    const prevTrade = await query('SELECT customer_name, customer_phone, old_device_name, estimated_price, status FROM trade_ins WHERE id = $1', [id])
    const oldTrade = prevTrade.rows[0]

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

    const changes = {}
    if (status && oldTrade && status !== oldTrade.status) changes['Trạng thái'] = { before: oldTrade.status, after: status }
    if (estimatedPrice !== undefined && oldTrade && Number(estimatedPrice) !== Number(oldTrade.estimated_price || 0)) changes['Giá thẩm định'] = { before: Number(oldTrade.estimated_price || 0), after: Number(estimatedPrice) }

    if (Object.keys(changes).length > 0) {
      await recordAuditLog({
        admin: req.admin,
        action: 'TRADE_IN_UPDATE',
        actionType: 'UPDATE',
        targetType: 'tradein',
        targetId: id,
        summary: `Cập nhật hồ sơ thu cũ "${oldTrade?.old_device_name || id}": ${Object.keys(changes).join(', ')}.`,
        details: { changes, tradeId: id, customerName: oldTrade?.customer_name },
        req
      })
    }

    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.delete('/api/v1/admin/trade-ins/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const prevTrade = await query('SELECT customer_name, old_device_name FROM trade_ins WHERE id = $1', [id])
    const oldTrade = prevTrade.rows[0]
    await query('DELETE FROM trade_ins WHERE id = $1', [id])
    await recordAuditLog({
      admin: req.admin,
      action: 'TRADE_IN_DELETE',
      actionType: 'DELETE',
      targetType: 'tradein',
      targetId: id,
      summary: `Đã xóa yêu cầu thu cũ đổi mới "${oldTrade?.old_device_name || id}" của khách "${oldTrade?.customer_name || 'Khách'}".`,
      details: { tradeId: id, oldTrade },
      req
    })
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
    const prevOrder = await query('SELECT customer_name, customer_phone, status, total_amount FROM orders WHERE id = $1', [id])
    const oldOrder = prevOrder.rows[0]
    const result = await query(
      'UPDATE orders SET status = COALESCE($1, status), updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status ?? null, id]
    )
    if (oldOrder && status && status !== oldOrder.status) {
      await recordAuditLog({
        admin: req.admin,
        action: 'ORDER_STATUS_UPDATE',
        actionType: 'UPDATE',
        targetType: 'order',
        targetId: id,
        summary: `Cập nhật trạng thái đơn hàng #${id} (${oldOrder.customer_name}): từ "${oldOrder.status}" sang "${status}".`,
        details: {
          changes: {
            'Trạng thái đơn hàng': { before: oldOrder.status, after: status }
          },
          orderId: id,
          customerName: oldOrder.customer_name,
          phone: oldOrder.customer_phone,
          totalAmount: Number(oldOrder.total_amount)
        },
        req
      })
    }
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.delete('/api/v1/admin/orders/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const prevOrder = await query('SELECT customer_name, customer_phone, total_amount FROM orders WHERE id = $1', [id])
    const oldOrder = prevOrder.rows[0]
    await query('DELETE FROM orders WHERE id = $1', [id])
    await recordAuditLog({
      admin: req.admin,
      action: 'ORDER_DELETE',
      actionType: 'DELETE',
      targetType: 'order',
      targetId: id,
      summary: `Đã xóa đơn hàng #${id} của khách "${oldOrder?.customer_name || 'Khách'}" (Giá trị: ${Number(oldOrder?.total_amount || 0).toLocaleString('vi-VN')}đ).`,
      details: { orderId: id, oldOrder },
      req
    })
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
  createdAt: row.created_at, 
  messages: (row.messages || []).map(m => ({
    ...m,
    createdAt: m.createdAt ? formatUtcIso(m.createdAt) : ''
  }))
})

const adsAnalyticsCache = new Map()

app.get('/api/v1/admin/facebook-ads', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  const adsToken = await getMetaAdsAccessToken()
  if (!isFacebookAdsConfigured() || !adsToken) return res.status(503).json({ success: false, configured: false, message: 'Chưa cấu hình META_AD_ACCOUNT_ID và META_ADS_ACCESS_TOKEN trên backend.' })
  try {
    const version = process.env.META_GRAPH_VERSION || 'v19.0'
    const accountId = process.env.META_AD_ACCOUNT_ID.replace(/^act_/, '')
    const url = new URL(`https://graph.facebook.com/${version}/act_${encodeURIComponent(accountId)}/ads`)
    url.searchParams.set('fields', 'id,name,status,effective_status,campaign{id,name},adset{id,name},insights.date_preset(last_30d){impressions,reach,clicks,spend}')
    url.searchParams.set('filtering', JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE'] }]))
    url.searchParams.set('limit', '100')
    const response = await fetch(url, { headers: { Authorization: 'Bearer ' + adsToken }, signal: AbortSignal.timeout(15000) })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) return res.status(502).json({ success: false, configured: true, message: payload.error?.message || `Meta Marketing API (${response.status})` })
    const ads = (payload.data || []).map(ad => {
      const insight = ad.insights?.data?.[0] || {}
      return { id: ad.id, name: ad.name, status: ad.effective_status, campaignId: ad.campaign?.id || '', campaignName: ad.campaign?.name || '', adsetName: ad.adset?.name || '', impressions: Number(insight.impressions || 0), reach: Number(insight.reach || 0), clicks: Number(insight.clicks || 0), spend: Number(insight.spend || 0) }
    })
    res.json({ success: true, configured: true, data: ads, period: 'last_30d' })
  } catch (err) { res.status(502).json({ success: false, configured: true, message: err.message || 'Không lấy được dữ liệu quảng cáo từ Meta.' }) }
})

// Phân tích hiệu quả quảng cáo & Tỷ suất sinh lời (Ads Analytics & ROI)
app.get('/api/v1/admin/facebook-ads/analytics', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    let ads = []
    const periodParam = String(req.query.period || 'today').toLowerCase()
    const fromParam = String(req.query.from || '').trim()
    const toParam = String(req.query.to || '').trim()

    const cacheKey = `${periodParam}_${fromParam}_${toParam}`
    if (req.query.force !== 'true') {
      const cached = adsAnalyticsCache.get(cacheKey)
      if (cached && Date.now() - cached.ts < 60000) {
        return res.json(cached.data)
      }
    }

    let period = 'today'
    let periodLabel = 'Hôm nay'
    let insightsField = 'insights.date_preset(today)'
    let dateSqlFilter = "AND (c.created_at AT TIME ZONE 'Asia/Bangkok')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date"

    const isCustomDate = /^\d{4}-\d{2}-\d{2}$/.test(fromParam) && /^\d{4}-\d{2}-\d{2}$/.test(toParam)

    if (periodParam === 'custom' && isCustomDate) {
      insightsField = `insights.time_range({'since':'${fromParam}','until':'${toParam}'})`
      periodLabel = `Từ ${fromParam} đến ${toParam}`
      dateSqlFilter = `AND (c.created_at AT TIME ZONE 'Asia/Bangkok')::date >= '${fromParam}' AND (c.created_at AT TIME ZONE 'Asia/Bangkok')::date <= '${toParam}'`
    } else if (periodParam === 'yesterday') {
      period = 'yesterday'
      periodLabel = 'Hôm qua'
      insightsField = 'insights.date_preset(yesterday)'
      dateSqlFilter = "AND (c.created_at AT TIME ZONE 'Asia/Bangkok')::date = ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date - INTERVAL '1 day')::date"
    } else if (periodParam === '7d' || periodParam === 'last_7d') {
      period = 'last_7d'
      periodLabel = '7 ngày gần nhất'
      insightsField = 'insights.date_preset(last_7d)'
      dateSqlFilter = "AND (c.created_at AT TIME ZONE 'Asia/Bangkok')::date >= ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date - INTERVAL '6 day')::date"
    } else if (periodParam === 'this_month') {
      period = 'this_month'
      periodLabel = 'Tháng này'
      insightsField = 'insights.date_preset(this_month)'
      dateSqlFilter = "AND (c.created_at AT TIME ZONE 'Asia/Bangkok') >= date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')"
    } else if (periodParam === '30d' || periodParam === 'last_30d') {
      period = 'last_30d'
      periodLabel = '30 ngày gần nhất'
      insightsField = 'insights.date_preset(last_30d)'
      dateSqlFilter = "AND (c.created_at AT TIME ZONE 'Asia/Bangkok')::date >= ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date - INTERVAL '29 day')::date"
    } else if (periodParam === 'maximum' || periodParam === 'all') {
      period = 'maximum'
      periodLabel = 'Toàn thời gian (Trọn đời)'
      insightsField = 'insights.date_preset(maximum)'
      dateSqlFilter = "" // Toàn bộ lịch sử
    } else {
      period = 'today'
      periodLabel = 'Hôm nay'
      insightsField = 'insights.date_preset(today)'
      dateSqlFilter = "AND (c.created_at AT TIME ZONE 'Asia/Bangkok')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date"
    }

    // Tự động dọn dẹp các trường hợp bị gán nhầm vào chiến dịch ngày 19/11 nếu khách nhắn trước ngày 19/11
    await query(`
      UPDATE facebook_care_customers
      SET source_ad_id = NULL,
          source_ad_name = NULL,
          source_campaign_id = NULL,
          source_campaign_name = NULL,
          source_type = NULL
      WHERE (source_ad_name LIKE '%19/11/2026%' OR source_campaign_name LIKE '%19/11/2026%')
        AND created_at < '2026-11-19 00:00:00+07:00'
    `).catch(() => {})

    const adsToken = await getMetaAdsAccessToken()
    if (isFacebookAdsConfigured() && adsToken) {
      try {
        const version = process.env.META_GRAPH_VERSION || 'v19.0'
        const accountId = process.env.META_AD_ACCOUNT_ID.replace(/^act_/, '')
        const url = new URL(`https://graph.facebook.com/${version}/act_${encodeURIComponent(accountId)}/ads`)
        url.searchParams.set('fields', `id,name,status,effective_status,campaign{id,name},adset{id,name},${insightsField}{impressions,reach,clicks,spend,actions,action_values,cost_per_action_type}`)
        url.searchParams.set('limit', '100')
        const response = await fetch(url, { headers: { Authorization: 'Bearer ' + adsToken }, signal: AbortSignal.timeout(15000) })
        const payload = await response.json().catch(() => ({}))
        if (response.ok && Array.isArray(payload.data)) {
          ads = payload.data.map(ad => {
            const insight = ad.insights?.data?.[0] || {}
            const rawStatus = String(ad.effective_status || ad.status || 'PAUSED').toUpperCase()
            const isMetaActive = rawStatus === 'ACTIVE'
            const isMetaPaused = rawStatus.includes('PAUSE')
            const statusLabel = isMetaActive ? '🟢 Đang chạy trên Meta' : (isMetaPaused ? '⏸️ Đã tạm dừng trên Meta' : '📦 Đã tắt / Lưu trữ')

            let metaMessages = 0
            let metaPurchases = 0
            let metaConversionValue = 0

            if (Array.isArray(insight.actions)) {
              const msgAction = insight.actions.find(a =>
                a.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
                a.action_type === 'onsite_conversion.total_messaging_connection' ||
                a.action_type === 'messaging_conversation_started_7d' ||
                a.action_type?.includes('messaging') ||
                a.action_type === 'lead'
              )
              if (msgAction) metaMessages = Number(msgAction.value || 0)

              const purchaseAction = insight.actions.find(a =>
                a.action_type === 'omni_purchase' ||
                a.action_type === 'purchase' ||
                a.action_type === 'onsite_conversion.purchase' ||
                a.action_type === 'onsite_web_app_purchase' ||
                a.action_type === 'onsite_web_purchase'
              )
              if (purchaseAction) metaPurchases = Number(purchaseAction.value || 0)
            }

            if (Array.isArray(insight.action_values)) {
              const valAction = insight.action_values.find(a =>
                a.action_type === 'omni_purchase' ||
                a.action_type === 'purchase' ||
                a.action_type === 'onsite_conversion.purchase' ||
                a.action_type === 'onsite_web_app_purchase' ||
                a.action_type === 'onsite_web_purchase'
              )
              if (valAction) metaConversionValue = Math.round(Number(valAction.value || 0))
            }

            const spend = Number(insight.spend || 0)
            let metaCpl = (spend > 0 && metaMessages > 0) ? Math.round(spend / metaMessages) : 0
            if (metaCpl === 0 && Array.isArray(insight.cost_per_action_type)) {
              const cplAction = insight.cost_per_action_type.find(a =>
                a.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
                a.action_type === 'messaging_conversation_started_7d'
              )
              if (cplAction && Number(cplAction.value) > 0 && Number(cplAction.value) <= spend) {
                metaCpl = Math.round(Number(cplAction.value))
              }
            }

            return {
              id: ad.id,
              name: ad.name,
              status: rawStatus,
              isMetaActive,
              statusLabel,
              campaignId: ad.campaign?.id || '',
              campaignName: ad.campaign?.name || '',
              adsetName: ad.adset?.name || '',
              impressions: Number(insight.impressions || 0),
              reach: Number(insight.reach || 0),
              clicks: Number(insight.clicks || 0),
              spend,
              metaMessages,
              metaPurchases,
              metaConversionValue,
              metaCpl
            }
          })
        }
      } catch (err) {
        console.warn('[Meta Ads Analytics Error]:', err.message)
      }
    }

    const dbStats = await query(`
      SELECT
        c.source_ad_id,
        c.source_ad_name,
        c.source_campaign_id,
        c.source_campaign_name,
        COUNT(DISTINCT c.id) as total_customers,
        COUNT(DISTINCT CASE WHEN c.phone IS NOT NULL AND c.phone <> '' THEN c.id END) as phone_customers,
        COUNT(DISTINCT CASE WHEN c.status = 'DA_CHOT' THEN c.id END) as closed_customers,
        COUNT(DISTINCT CASE WHEN c.status = 'DANG_TU_VAN' THEN c.id END) as consulting_customers,
        COUNT(DISTINCT CASE WHEN c.status = 'MOI' THEN c.id END) as new_customers,
        COALESCE(SUM(o.total_amount), 0)::bigint as total_order_revenue,
        COUNT(DISTINCT o.id) as total_orders_count
      FROM facebook_care_customers c
      LEFT JOIN orders o ON (
        (c.phone IS NOT NULL AND c.phone <> '' AND o.customer_phone = c.phone)
        OR (c.customer_name IS NOT NULL AND LOWER(c.customer_name) = LOWER(o.customer_name))
      ) AND o.status <> 'CANCELLED'
      WHERE c.source_ad_id IS NOT NULL AND c.source_ad_id <> ''
      ${dateSqlFilter}
      GROUP BY c.source_ad_id, c.source_ad_name, c.source_campaign_id, c.source_campaign_name
    `)

    const dbMap = new Map()
    dbStats.rows.forEach(row => {
      dbMap.set(row.source_ad_id, {
        totalCustomers: Number(row.total_customers || 0),
        phoneCustomers: Number(row.phone_customers || 0),
        closedCustomers: Number(row.closed_customers || 0),
        consultingCustomers: Number(row.consulting_customers || 0),
        newCustomers: Number(row.new_customers || 0),
        totalOrderRevenue: Number(row.total_order_revenue || 0),
        totalOrdersCount: Number(row.total_orders_count || 0)
      })
    })

    const combinedAds = []
    const processedAdIds = new Set()

    for (const ad of ads) {
      processedAdIds.add(ad.id)
      const stat = dbMap.get(ad.id) || {
        totalCustomers: 0,
        phoneCustomers: 0,
        closedCustomers: 0,
        consultingCustomers: 0,
        newCustomers: 0,
        totalOrderRevenue: 0,
        totalOrdersCount: 0
      }

      const effectiveClosed = (stat.closedCustomers > 0) ? stat.closedCustomers : (ad.metaPurchases || 0)
      const effectiveRevenue = stat.totalOrderRevenue > 0
        ? stat.totalOrderRevenue
        : (ad.metaConversionValue > 0 ? ad.metaConversionValue : (stat.closedCustomers * 25000000))

      const effectiveCustomers = Math.max(stat.totalCustomers || 0, ad.metaMessages || 0)
      const phoneCustomers = Number(stat.phoneCustomers || 0)
      const phoneRate = effectiveCustomers > 0 ? Number(((phoneCustomers / effectiveCustomers) * 100).toFixed(1)) : 0
      const cpl = ad.metaCpl > 0 ? ad.metaCpl : (ad.spend > 0 && effectiveCustomers > 0 ? Math.round(ad.spend / effectiveCustomers) : 0)
      const cpp = ad.spend > 0 && phoneCustomers > 0 ? Math.round(ad.spend / phoneCustomers) : 0
      const cpa = ad.spend > 0 && effectiveClosed > 0 ? Math.round(ad.spend / effectiveClosed) : 0
      const conversionRate = effectiveCustomers > 0 ? Number(((effectiveClosed / effectiveCustomers) * 100).toFixed(1)) : 0
      const roas = (ad.spend > 0 && effectiveRevenue > 0) ? Number((effectiveRevenue / ad.spend).toFixed(2)) : 0

      const impressions = Number(ad.impressions || 0)
      const reach = Number(ad.reach || 0)
      const clicks = Number(ad.clicks || 0)
      const spend = Number(ad.spend || 0)

      const cpm = impressions > 0 ? Math.round((spend / impressions) * 1000) : 0
      const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0
      const cpc = clicks > 0 ? Math.round(spend / clicks) : 0
      const frequency = reach > 0 ? Number((impressions / reach).toFixed(2)) : 1
      const clickToMessRate = clicks > 0 && effectiveCustomers > 0 ? Number(((effectiveCustomers / clicks) * 100).toFixed(1)) : 0

      // Tính điểm chất lượng phễu khách hàng (Quality Lead Score: 0 - 100) khi chưa có đơn
      let qualityScore = 50
      if (phoneRate >= 30) qualityScore += 30
      else if (phoneRate >= 20) qualityScore += 20
      else if (phoneRate >= 10) qualityScore += 10
      else if (effectiveCustomers >= 10 && phoneCustomers === 0) qualityScore -= 20

      if (ctr >= 3.0) qualityScore += 20
      else if (ctr >= 2.0) qualityScore += 14
      else if (ctr >= 1.2) qualityScore += 8
      else if (ctr > 0 && ctr < 1.0) qualityScore -= 15

      if (cpl > 0 && cpl <= 35000) qualityScore += 18
      else if (cpl > 0 && cpl <= 60000) qualityScore += 10
      else if (cpl > 120000) qualityScore -= 12

      if (cpm > 0 && cpm <= 80000) qualityScore += 10
      else if (cpm > 140000) qualityScore -= 10

      if (frequency >= 1.8) qualityScore -= 12
      else if (frequency <= 1.4 && frequency > 0) qualityScore += 8

      if (stat.closedCustomers > 0) qualityScore += Math.min(25, stat.closedCustomers * 12)
      qualityScore = Math.max(10, Math.min(100, Math.round(qualityScore)))

      // Hệ thống AI Phân Tích & Tối Ưu Tăng Trưởng Quảng Cáo (Meta Ads AI Strategy Engine)
      // ĐẶC BIỆT TỐI ƯU CHO GIAI ĐOẠN CHƯA CÓ ĐƠN (ĐO QUA SỐ ĐIỆN THOẠI & PHỄU MQL)
      // Phân tích mục đích & chiến lược chạy quảng cáo chuyên sâu
      let objective = 'Mở rộng tiếp cận & Nhận diện thương hiệu'
      let strategy = 'Dẫn dắt khách hàng vào hộp thư Messenger để đội ngũ kỹ thuật Tú Audio tư vấn trực tiếp.'
      const lowerName = ((ad.name || '') + ' ' + (ad.campaignName || '')).toLowerCase()
      if (lowerName.includes('căn chỉnh') || lowerName.includes('miễn phí') || lowerName.includes('thu cũ')) {
        objective = 'Tạo Phễu Thu Khách Nét (Lead Gen) & Thu SĐT để Chốt Combo / Thu Cũ Đổi Mới'
        strategy = 'Dùng mồi câu "Căn chỉnh miễn phí vang số / Thu cũ đổi mới" tiếp cận khách có dàn sẵn đang hát dở, lọc lấy SĐT người dùng thật để sale tư vấn nâng cấp trọn bộ.'
      } else if (lowerName.includes('thu hút khách hàng') || lowerName.includes('combo') || lowerName.includes('bán') || lowerName.includes('dàn')) {
        objective = 'Thúc Đẩy Doanh Số Trực Tiếp (Direct Sales) - Bán Trọn Gói Combo Dàn Karaoke'
        strategy = 'Giới thiệu các cấu hình dàn karaoke gia đình phối ghép chuẩn âm học, kích thích khách hàng mua trọn bộ để nhận ưu đãi và quà tặng.'
      } else if (lowerName.includes('chỉnh tiếng mic') || lowerName.includes('tiếng nhạc') || lowerName.includes('chống hú')) {
        objective = 'Giải Quyết Nỗi Đau Khách Hàng (Hát Nặng, Tiếng Hú Rít) → Nâng Cấp Vang Số / Mic'
        strategy = 'Đánh trúng bức xúc khi dàn karaoke gia đình hát bị mệt, rú rít hoặc nhạc mỏng, điều hướng khách hàng nâng cấp vang số cao cấp hoặc micro chuyên nghiệp.'
      }

      let diagnosis = {
        action: 'HOLD',
        actionLabel: '👁️ Tiếp tục theo dõi',
        badgeClass: 'badge-hold',
        disease: 'Phân phối bình thường',
        advice: 'Chiến dịch đang trong ngưỡng phân phối cơ bản, tiếp tục theo dõi biến động chỉ số.'
      }

      if (!ad.isMetaActive) {
        diagnosis = {
          action: 'PAUSED',
          actionLabel: '⏸️ Đã tạm dừng',
          badgeClass: 'badge-paused',
          disease: 'Chiến dịch đã tắt',
          advice: 'Chiến dịch này hiện đã tạm dừng trong Trình quản lý quảng cáo Meta.'
        }
      } else if (roas >= 3 || (effectiveClosed >= 2 && roas >= 2) || (effectiveRevenue >= spend * 2 && spend >= 500000)) {
        diagnosis = {
          action: 'SCALE',
          actionLabel: '🚀 SIÊU PHẨM WIN (VÍT MẠNH NGÂN SÁCH)',
          badgeClass: 'badge-scale',
          disease: `🔥 Siêu Lợi Nhuận: ROAS ${roas}x (Doanh thu: ${new Intl.NumberFormat('vi-VN').format(effectiveRevenue)} đ)`,
          advice: `Chiến dịch đỉnh cao! Đã mang về ${effectiveClosed} đơn/lượt mua với tổng giá trị ${new Intl.NumberFormat('vi-VN').format(effectiveRevenue)} đ trên chi phí ${new Intl.NumberFormat('vi-VN').format(spend)} đ. ROAS đạt ${roas}x (1 đồng chi tiêu thu về ${roas} đồng doanh thu). Đề xuất anh Tú tăng 30-50% ngân sách để gom trọn thị trường!`
        }
      } else if (effectiveClosed > 0 && roas >= 1.5) {
        diagnosis = {
          action: 'POTENTIAL_WIN',
          actionLabel: '⭐ CHIẾN DỊCH HIỆU QUẢ (GIỮ & VÍT)',
          badgeClass: 'badge-win',
          disease: `Lãi Tốt: ROAS ${roas}x (${effectiveClosed} đơn / ${new Intl.NumberFormat('vi-VN').format(effectiveRevenue)} đ)`,
          advice: `Chiến dịch hoạt động hiệu quả, thu về ${effectiveClosed} lượt mua với giá trị ${new Intl.NumberFormat('vi-VN').format(effectiveRevenue)} đ trên chi phí ${new Intl.NumberFormat('vi-VN').format(spend)} đ (ROAS: ${roas}x). Tiếp tục duy trì và mở rộng nhóm tệp tương tự!`
        }
      } else if (phoneCustomers >= 3 && phoneRate >= 22 && (cpp <= 90000 || cpl <= 38000)) {
        diagnosis = {
          action: 'POTENTIAL_WIN',
          actionLabel: '🔥 WIN TIỀM NĂNG (GIỮ & VÍT)',
          badgeClass: 'badge-scale',
          disease: `🌟 Tệp Khách Nét (Tỷ lệ SĐT: ${phoneRate}%)`,
          advice: `Chưa cần đơn chốt! Chiến dịch đã thu về ${phoneCustomers} SĐT chất lượng (chiếm ${phoneRate}% tổng khách, giá chỉ ${new Intl.NumberFormat('vi-VN').format(cpp || cpl)} đ/SĐT). Đây là tệp có nhu cầu thật rất cao. Yêu cầu đội sale gọi điện thoại tư vấn trực tiếp và hẹn thử dàn ngay!`
        }
      } else if (effectiveCustomers >= 12 && phoneCustomers === 0 && spend >= 150000) {
        diagnosis = {
          action: 'OPTIMIZE_SALE',
          actionLabel: '💬 BỆNH MESS RẺ KHÔNG RA SĐT',
          badgeClass: 'badge-optimize',
          disease: '⚠️ Bệnh "Mess Rác / Ham Rẻ" (Kinh Điển)',
          advice: `Đã có ${effectiveCustomers} khách nhắn tin (CPL: ${new Intl.NumberFormat('vi-VN').format(cpl)} đ) nhưng 0 người để lại SĐT! Nguyên nhân: Khách tò mò bấm vào xin đồ miễn phí hoặc hỏi vu vơ. Cách xử lý: Đổi kịch bản chatbot/sales xin SĐT ngay tin thứ 2-3, hoặc bổ sung điều kiện bảo hành/báo giá chỉ gửi qua Zalo để lọc bớt khách rác.`
        }
      } else if (spend >= 200000 && effectiveCustomers === 0 && ctr < 1.2) {
        diagnosis = {
          action: 'KILL',
          actionLabel: '🛑 TẮT NGAY (Cắt Lỗ)',
          badgeClass: 'badge-kill',
          disease: '🚨 Bệnh Content Hỏng: CTR quá thấp (< 1.2%)',
          advice: `Đã tiêu ${new Intl.NumberFormat('vi-VN').format(spend)} đ nhưng không có tin nhắn hay SĐT, CTR chỉ ${ctr}%. Khuyến nghị AI: Tắt ngay lập tức để cắt lỗ, không nuôi hy vọng làm cháy ngân sách!`
        }
      } else if (frequency >= 1.8 && spend >= 300000) {
        diagnosis = {
          action: 'CHANGE_CONTENT',
          actionLabel: '🔄 THAY BÀI / ĐỔI TỆP',
          badgeClass: 'badge-change',
          disease: `⚠️ Bão Hòa Tệp (Tần suất ${frequency}x >= 1.8x)`,
          advice: `Tần suất hiển thị ${frequency}x (khách đã thấy lại lần 2-3). Cảnh báo AI: Tệp bắt đầu bão hòa, giá tin nhắn và SĐT sẽ tăng vọt. Cần đổi video mới hoặc nhân nhóm đổi tệp target.`
        }
      } else if (ctr < 1.5 && spend >= 100000 && cpm <= 80000) {
        diagnosis = {
          action: 'CHANGE_CONTENT',
          actionLabel: '🎨 SỬA 3S ĐẦU / THUMBNAIL',
          badgeClass: 'badge-change',
          disease: '⚠️ Lỗi 3 Giây Đầu Video (CTR < 1.5%)',
          advice: `CPM rẻ (${new Intl.NumberFormat('vi-VN').format(cpm)} đ) chứng tỏ tệp đúng, nhưng CTR chỉ đạt ${ctr}%. Khách lướt qua không thèm dừng lại. Lỗi 100% ở 3s đầu video hoặc ảnh bìa!`
        }
      } else if (cpm >= 150000) {
        diagnosis = {
          action: 'CHANGE_TARGET',
          actionLabel: '🎯 NỚI RỘNG TỆP TARGET',
          badgeClass: 'badge-target',
          disease: '💸 CPM Quá Cao (> 150.000 đ)',
          advice: `Chi phí 1.000 lượt hiển thị cao (${new Intl.NumberFormat('vi-VN').format(cpm)} đ) do tệp quá hẹp hoặc bị cạnh tranh giá thầu. Nên nới rộng vị trí/độ tuổi hoặc tắt bớt nhóm bị trùng lặp tệp.`
        }
      } else if (phoneCustomers > 0 && phoneRate >= 20) {
        diagnosis = {
          action: 'HOLD',
          actionLabel: '✅ KHÁCH TỐT · GỌI CHỐT NHANH',
          badgeClass: 'badge-hold',
          disease: `Tỷ Lệ Thu SĐT Tốt (${phoneRate}%)`,
          advice: `Thu được ${phoneCustomers} SĐT (${phoneRate}%). Khách đang quan tâm thật. Bàn giao danh sách cho kỹ thuật hoặc sale gọi điện trong vòng 15 phút đầu.`
        }
      } else if (effectiveCustomers > 0 && cpl <= 35000) {
        diagnosis = {
          action: 'HOLD',
          actionLabel: '✅ GIỮ VÀ LỌC LẤY SĐT',
          badgeClass: 'badge-hold',
          disease: 'Giá Tin Nhắn Rất Đẹp',
          advice: `CPL đạt ${new Intl.NumberFormat('vi-VN').format(cpl)} đ/khách (rất tốt với ngành âm thanh). Yêu cầu đội sale tập trung xin SĐT gọi tư vấn trực tiếp để đẩy sang chốt đơn.`
        }
      }

      let grade = diagnosis.action === 'SCALE' ? 'STAR' : (diagnosis.action === 'KILL' ? 'BAD' : (diagnosis.action === 'OPTIMIZE_SALE' ? 'WARNING' : (ad.isMetaActive ? 'NEUTRAL' : 'PAUSED')))
      let gradeLabel = diagnosis.disease
      let recommendation = diagnosis.advice

      combinedAds.push({
        id: ad.id,
        name: ad.name,
        campaignId: ad.campaignId,
        campaignName: ad.campaignName,
        objective,
        strategy,
        profit: Math.round(effectiveRevenue - spend),
        status: ad.status,
        isMetaActive: ad.isMetaActive,
        statusLabel: ad.statusLabel,
        impressions,
        reach,
        clicks,
        spend,
        cpm,
        ctr,
        cpc,
        frequency,
        diagnosis,
        qualityScore,
        phoneCustomers,
        phoneRate,
        cpp,
        clickToMessRate,
        metaMessages: ad.metaMessages || 0,
        metaPurchases: ad.metaPurchases || 0,
        metaConversionValue: ad.metaConversionValue || 0,
        metaCpl: ad.metaCpl || 0,
        ...stat,
        closedCustomers: effectiveClosed,
        totalCustomers: effectiveCustomers,
        effectiveRevenue,
        conversionValue: effectiveRevenue,
        cpl,
        cpa,
        conversionRate,
        roas,
        grade,
        gradeLabel,
        recommendation
      })
    }

    for (const row of dbStats.rows) {
      if (!processedAdIds.has(row.source_ad_id)) {
        const totalCustomers = Number(row.total_customers || 0)
        const phoneCustomers = Number(row.phone_customers || 0)
        const closedCustomers = Number(row.closed_customers || 0)
        const totalOrderRevenue = Number(row.total_order_revenue || 0)
        const effectiveRevenue = totalOrderRevenue > 0 ? totalOrderRevenue : (closedCustomers * 25000000)
        const conversionRate = totalCustomers > 0 ? Number(((closedCustomers / totalCustomers) * 100).toFixed(1)) : 0
        const phoneRate = totalCustomers > 0 ? Number(((phoneCustomers / totalCustomers) * 100).toFixed(1)) : 0

        combinedAds.push({
          id: row.source_ad_id,
          name: row.source_ad_name || `Chiến dịch ${row.source_ad_id}`,
          campaignId: row.source_campaign_id || '',
          campaignName: row.source_campaign_name || '',
          status: 'ARCHIVED',
          isMetaActive: false,
          statusLabel: '📦 Đã tắt / Lưu trữ',
          impressions: 0,
          reach: 0,
          clicks: 0,
          spend: 0,
          totalCustomers,
          phoneCustomers,
          phoneRate,
          cpp: 0,
          qualityScore: closedCustomers > 0 ? 85 : (phoneCustomers > 0 ? 70 : 50),
          closedCustomers,
          consultingCustomers: Number(row.consulting_customers || 0),
          newCustomers: Number(row.new_customers || 0),
          totalOrderRevenue,
          totalOrdersCount: Number(row.total_orders_count || 0),
          effectiveRevenue,
          cpl: 0,
          cpa: 0,
          conversionRate,
          roas: 0,
          grade: closedCustomers > 0 ? 'GOOD' : 'NEUTRAL',
          gradeLabel: closedCustomers > 0 ? '✅ Đã Chốt Đơn' : 'Lịch sử',
          recommendation: 'Chiến dịch trước đây đã ghi nhận dữ liệu trong CRM.'
        })
      }
    }

    combinedAds.sort((a, b) => {
      // 1. Ưu tiên chiến dịch đang chạy trên Meta
      const activeDiff = (b.isMetaActive ? 1 : 0) - (a.isMetaActive ? 1 : 0)
      if (activeDiff !== 0) return activeDiff

      // 2. Nếu có đơn hàng thực tế -> ưu tiên doanh thu và đơn chốt
      const revDiff = (b.effectiveRevenue || 0) - (a.effectiveRevenue || 0)
      if (revDiff !== 0) return revDiff

      const closedDiff = (b.closedCustomers || 0) - (a.closedCustomers || 0)
      if (closedDiff !== 0) return closedDiff

      // 3. Khi CHƯA CÓ ĐƠN HÀNG: xếp hạng theo Điểm Chất Lượng Phễu & Số điện thoại thu được!
      const scoreDiff = (b.qualityScore || 0) - (a.qualityScore || 0)
      if (scoreDiff !== 0) return scoreDiff

      const phoneDiff = (b.phoneCustomers || 0) - (a.phoneCustomers || 0)
      if (phoneDiff !== 0) return phoneDiff

      return (b.totalCustomers || 0) - (a.totalCustomers || 0)
    })

    const totalSpend = combinedAds.reduce((sum, a) => sum + (a.spend || 0), 0)
    const totalLeads = combinedAds.reduce((sum, a) => sum + (a.totalCustomers || 0), 0)
    const totalPhoneCustomers = combinedAds.reduce((sum, a) => sum + (a.phoneCustomers || 0), 0)
    const totalClosed = combinedAds.reduce((sum, a) => sum + (a.closedCustomers || 0), 0)
    const totalRevenue = combinedAds.reduce((sum, a) => sum + (a.effectiveRevenue || 0), 0)
    const totalImpressions = combinedAds.reduce((sum, a) => sum + (a.impressions || 0), 0)
    const totalClicks = combinedAds.reduce((sum, a) => sum + (a.clicks || 0), 0)
    const totalReach = combinedAds.reduce((sum, a) => sum + (a.reach || 0), 0)

    const avgCpl = totalLeads > 0 && totalSpend > 0 ? Math.round(totalSpend / totalLeads) : 0
    const avgCpp = totalPhoneCustomers > 0 && totalSpend > 0 ? Math.round(totalSpend / totalPhoneCustomers) : 0
    const avgPhoneRate = totalLeads > 0 ? Number(((totalPhoneCustomers / totalLeads) * 100).toFixed(1)) : 0
    const avgRoas = totalSpend > 0 && totalRevenue > 0 ? Number((totalRevenue / totalSpend).toFixed(2)) : 0
    const overallCr = totalLeads > 0 ? Number(((totalClosed / totalLeads) * 100).toFixed(1)) : 0
    const avgCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0
    const avgCpm = totalImpressions > 0 ? Math.round((totalSpend / totalImpressions) * 1000) : 0
    const avgFrequency = totalReach > 0 ? Number((totalImpressions / totalReach).toFixed(2)) : 1
    const killCount = combinedAds.filter(a => a.diagnosis?.action === 'KILL').length
    const scaleCount = combinedAds.filter(a => a.diagnosis?.action === 'SCALE' || a.diagnosis?.action === 'POTENTIAL_WIN').length
    const optimizeSaleCount = combinedAds.filter(a => a.diagnosis?.action === 'OPTIMIZE_SALE').length

    const responsePayload = {
      success: true,
      summary: {
        totalSpend,
        totalRevenue,
        totalLeads,
        totalPhoneCustomers,
        totalImpressions,
        totalClicks,
        totalReach,
        avgPhoneRate,
        avgCpp,
        totalClosed,
        avgCpl,
        avgRoas,
        overallCr,
        totalCampaigns: combinedAds.length,
        periodLabel,
        avgCtr,
        avgCpm,
        avgFrequency,
        killCount,
        scaleCount,
        optimizeSaleCount
      },
      data: combinedAds,
      period
    }
    adsAnalyticsCache.set(cacheKey, { ts: Date.now(), data: responsePayload })
    res.json(responsePayload)
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.get('/api/v1/admin/facebook-care', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const forceSync = req.query.sync === 'force'
    if (canReadFacebookPageInbox() && (forceSync || Date.now() - fbLastSyncMs >= FB_SYNC_INTERVAL_MS)) {
      if (forceSync) {
        await Promise.race([
          syncFacebookConversations({ force: true }),
          new Promise(resolve => setTimeout(resolve, 5000))
        ])
      } else {
        // Tối ưu tốc độ cao: Đồng bộ ngầm trong nền không chặn phản hồi HTTP, trả dữ liệu tức thì!
        syncFacebookConversations({ force: false }).catch(() => {})
      }
    }
    const result = await query(`SELECT c.*, COALESCE(json_agg(json_build_object('id', m.id, 'body', m.body, 'direction', m.direction, 'createdAt', m.created_at, 'platformMessageId', m.platform_message_id, 'createdBy', m.created_by, 'attachments', COALESCE(m.attachments, '[]'::jsonb)) ORDER BY m.created_at) FILTER (WHERE m.id IS NOT NULL), '[]') AS messages
      FROM facebook_care_customers c LEFT JOIN facebook_care_messages m ON m.customer_id = c.id
      GROUP BY c.id ORDER BY c.updated_at DESC`)
    const connected = isFacebookMessengerConfigured()
    res.json({
      success: true,
      data: result.rows.map(mapFbCare),
      connected,
      aiEnabled: await isFacebookAiEnabled(),
      commentAiEnabled: await isFacebookCommentAiEnabled(),
      lastSyncedAt: fbLastSyncedAt,
      syncError: fbLastSyncError || ''
    })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// Lấy chi tiết hồ sơ 1 khách hàng Facebook kèm toàn bộ tin nhắn & đơn hàng liên quan (cho Popup CRM)
app.get('/api/v1/admin/facebook-care/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const result = await query(`SELECT c.*, COALESCE(json_agg(json_build_object('id', m.id, 'body', m.body, 'direction', m.direction, 'createdAt', m.created_at, 'platformMessageId', m.platform_message_id, 'createdBy', m.created_by, 'attachments', COALESCE(m.attachments, '[]'::jsonb)) ORDER BY m.created_at) FILTER (WHERE m.id IS NOT NULL), '[]') AS messages
      FROM facebook_care_customers c LEFT JOIN facebook_care_messages m ON m.customer_id = c.id
      WHERE c.id = $1
      GROUP BY c.id`, [req.params.id])
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ khách hàng Facebook.' })
    const customer = mapFbCare(result.rows[0])
    let relatedOrders = []
    if (customer.phone) {
      const ordersRes = await query(`SELECT id, customer_name, customer_phone, shipping_address, total_amount, status, created_at FROM orders WHERE customer_phone = $1 ORDER BY created_at DESC LIMIT 5`, [customer.phone])
      relatedOrders = ordersRes.rows
    }
    res.json({ success: true, data: customer, relatedOrders })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// Tải hình ảnh / tệp đính kèm tươi từ Meta Graph API theo messageId khi xem chi tiết
app.post('/api/v1/admin/facebook-care/clear-menu', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const pageToken = await getMetaPageAccessToken()
    const { META_GRAPH_VERSION: graphVersion } = process.env
    if (!pageToken || !graphVersion) return res.status(503).json({ success: false, message: 'Chưa cấu hình Meta Page Access Token trên máy chủ.' })
    const url = `https://graph.facebook.com/${graphVersion}/me/messenger_profile`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pageToken}`
      },
      body: JSON.stringify({ fields: ['persistent_menu'] })
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      return res.status(502).json({ success: false, message: payload.error?.message || 'Meta báo lỗi khi gỡ menu.' })
    }
    return res.json({ success: true, message: 'Đã gỡ bỏ sạch menu quảng cáo của AhaChat khỏi Fanpage!' })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// Tải hình ảnh / tệp đính kèm tươi từ Meta Graph API theo messageId khi xem chi tiết
app.get('/api/v1/admin/facebook-care/message-media/:platformMessageId', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const { platformMessageId } = req.params
    const pageToken = await getMetaPageAccessToken()
    const { META_GRAPH_VERSION: graphVersion } = process.env
    if (!pageToken || !graphVersion) {
      return res.status(503).json({ success: false, message: 'Chưa cấu hình Meta Page Token trên máy chủ.' })
    }

    // 1. Kiểm tra cache trong database trước
    const existing = await query('SELECT attachments FROM facebook_care_messages WHERE platform_message_id = $1', [platformMessageId])
    const existingAtts = existing.rows[0]?.attachments
    if (Array.isArray(existingAtts) && existingAtts.length > 0 && existingAtts[0]?.url) {
      return res.json({ success: true, attachments: existingAtts })
    }

    // 2. Gọi Meta Graph API lấy attachments
    const url = new URL(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(platformMessageId)}/attachments`)
    const response = await fetch(url, { headers: { Authorization: `Bearer ${pageToken}` }, signal: AbortSignal.timeout(10000) })
    const data = await response.json().catch(() => ({}))

    let atts = []
    if (response.ok && Array.isArray(data.data)) {
      atts = data.data.map(att => ({
        url: att.image_data?.url || att.file_url || att.video_data?.url || '',
        previewUrl: att.image_data?.preview_url || att.image_data?.url || att.file_url || '',
        type: att.image_data ? 'image' : (att.video_data ? 'video' : 'file'),
        name: att.name || ''
      })).filter(a => Boolean(a.url))
    }

    if (atts.length === 0) {
      // Fallback: Gọi endpoint chi tiết của message
      const fbUrl = new URL(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(platformMessageId)}`)
      fbUrl.searchParams.set('fields', 'id,message,attachments{image_data,file_url,video_data,name,mime_type}')
      const fbRes = await fetch(fbUrl, { headers: { Authorization: `Bearer ${pageToken}` }, signal: AbortSignal.timeout(10000) })
      const fbData = await fbRes.json().catch(() => ({}))
      if (fbRes.ok && Array.isArray(fbData.attachments?.data)) {
        atts = fbData.attachments.data.map(att => ({
          url: att.image_data?.url || att.file_url || att.video_data?.url || '',
          previewUrl: att.image_data?.preview_url || att.image_data?.url || att.file_url || '',
          type: att.image_data ? 'image' : (att.video_data ? 'video' : 'file'),
          name: att.name || ''
        })).filter(a => Boolean(a.url))
      }
    }

    if (atts.length > 0) {
      await query('UPDATE facebook_care_messages SET attachments = $1::jsonb WHERE platform_message_id = $2', [JSON.stringify(atts), platformMessageId]).catch(() => {})
      return res.json({ success: true, attachments: atts })
    }

    res.json({ success: false, message: 'Không tìm thấy tệp đính kèm trên Meta cho tin nhắn này.', attachments: [] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Lấy chi tiết 1 Lead kèm đơn hàng liên quan (cho Popup CRM)
app.get('/api/v1/admin/leads/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM leads WHERE id = $1', [req.params.id])
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ Lead.' })
    const lead = mapLeadRow(result.rows[0])
    let relatedOrders = []
    if (lead.phone) {
      const ordersRes = await query(`SELECT id, customer_name, customer_phone, shipping_address, total_amount, status, created_at FROM orders WHERE customer_phone = $1 ORDER BY created_at DESC LIMIT 5`, [lead.phone])
      relatedOrders = ordersRes.rows
    }
    res.json({ success: true, data: lead, relatedOrders })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

app.get('/api/v1/admin/customer-map', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const [fbResult, leadResult, ordersResult, customPointsResult] = await Promise.all([
      query(`SELECT c.id,c.customer_name,c.facebook_id,c.phone,c.address,c.province,c.location_lat,c.location_lng,c.location_manually_set,c.interest,c.last_message,c.status,c.source_ad_name,c.updated_at,
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
        WHERE status IN ('DA_XAC_NHAN','DANG_GIAO') ORDER BY created_at DESC`),
      query(`SELECT id, name, phone, address, province, location_lat, location_lng, point_type, notes, interest, visited_at, visited_by, created_by, created_at, updated_at
        FROM custom_map_points ORDER BY updated_at DESC`)
    ])
    const byPhone = new Map()
    let unlocatedCount = 0
    const normalizePhone = value => String(value || '').replace(/\D/g, '').replace(/^84/, '0')
    const videoThumbnail = value => {
      const match = String(value || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)
      return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : ''
    }
    const add = (row, type) => {
      // Prefer the complete address because a saved province may have been
      // inferred incorrectly from a same-named ward in older records.
      const province = findProvince(row.address) || findProvince(row.province)
      const hasManualLocation = row.location_manually_set === true
      const lat = hasManualLocation && row.location_lat != null ? Number(row.location_lat) : province?.lat
      const lng = hasManualLocation && row.location_lng != null ? Number(row.location_lng) : province?.lng
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
        locationPrecision: hasManualLocation ? 'EXACT' : 'PROVINCE',
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

    // Điểm tự thêm (Custom points) ĐƯỢC GIỮ HOÀN TOÀN TÁCH BIỆT, không gộp theo phone vào Facebook
    const customPoints = (customPointsResult?.rows || []).map(row => {
      const lat = Number(row.location_lat)
      const lng = Number(row.location_lng)
      const detected = findProvince(row.address) || findProvince(row.province)
      return {
        id: row.id,
        recordType: 'CUSTOM',
        customerName: row.name || 'Điểm tự thêm',
        phone: row.phone || '',
        address: row.address || '',
        province: row.province || detected?.displayName || 'Khác',
        lat,
        lng,
        locationPrecision: 'EXACT',
        pointType: row.point_type || 'CUSTOMER',
        notes: row.notes || '',
        interest: row.interest || '',
        visitedAt: row.visited_at || '',
        visitedBy: row.visited_by || '',
        createdBy: row.created_by || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    }).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))

    const deliveryOrders = ordersResult.rows.flatMap(row => {
      const province = findProvince(row.shipping_address)
      return province ? [{ id: row.id, customerName: row.customer_name || 'Khách đặt hàng', phone: row.customer_phone || '', address: row.shipping_address || '', status: row.status, lat: province.lat, lng: province.lng, province: province.displayName, locationPrecision: 'PROVINCE' }] : []
    })
    res.json({ success: true, data: [...byPhone.values(), ...customPoints], deliveryOrders, unlocatedCount, origin: { address: '43 Hùng Vương, Phường Vĩnh Yên, Phú Thọ', lat: 21.31, lng: 105.60 } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.get('/api/v1/admin/customer-map/search-location', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] })
    }

    const results = []
    // 1. Thử gọi Photon Geocoding API (OpenStreetMap dữ liệu thế giới & Việt Nam)
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lat=21.32&lon=105.40`
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 3500)
      const resp = await fetch(photonUrl, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      })
      clearTimeout(timer)
      if (resp.ok) {
        const json = await resp.json()
        if (Array.isArray(json?.features)) {
          for (const f of json.features) {
            const props = f.properties || {}
            const coords = f.geometry?.coordinates || []
            if (coords.length >= 2 && Number.isFinite(coords[0]) && Number.isFinite(coords[1])) {
              const name = props.name || props.street || q
              const parts = [props.name, props.street, props.district || props.city, props.state, props.country].filter(Boolean)
              const displayName = parts.join(', ') || name
              const detected = findProvince(displayName) || findProvince(props.state || props.city)
              results.push({
                name,
                displayName,
                lat: Number(coords[1]),
                lng: Number(coords[0]),
                province: detected?.displayName || props.state || props.city || ''
              })
            }
          }
        }
      }
    } catch (e) {
      // Bỏ qua lỗi Photon nếu timeout hoặc mạng chặn
    }

    // 2. Nếu chưa có kết quả, thử Nominatim OpenStreetMap
    if (results.length === 0) {
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=vn&limit=8&addressdetails=1`
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 4000)
        const resp = await fetch(nomUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'TuAudioApp/2.0 (contact@amek.io.vn)'
          },
          signal: controller.signal
        })
        clearTimeout(timer)
        if (resp.ok) {
          const json = await resp.json()
          if (Array.isArray(json)) {
            for (const item of json) {
              const lat = Number(item.lat)
              const lng = Number(item.lon)
              if (Number.isFinite(lat) && Number.isFinite(lng)) {
                const detected = findProvince(item.display_name) || findProvince(item.address?.state || item.address?.province)
                results.push({
                  name: item.name || item.display_name?.split(',')[0] || q,
                  displayName: item.display_name,
                  lat,
                  lng,
                  province: detected?.displayName || item.address?.state || item.address?.province || ''
                })
              }
            }
          }
        }
      } catch (e) {
        // Bỏ qua lỗi Nominatim
      }
    }

    // 3. Fallback đối chiếu với danh sách các tỉnh thành và alias nội bộ
    if (results.length === 0) {
      const qNorm = normalizeVietnamText(q)
      const matchedProvinces = VIETNAM_PROVINCES.filter(p =>
        normalizeVietnamText(p.displayName).includes(qNorm) ||
        p.aliases.some(alias => normalizeVietnamText(alias).includes(qNorm))
      )
      for (const p of matchedProvinces.slice(0, 5)) {
        results.push({
          name: p.displayName,
          displayName: `${p.displayName}, Việt Nam`,
          lat: p.lat,
          lng: p.lng,
          province: p.displayName
        })
      }
    }

    res.json({ success: true, data: results })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.post('/api/v1/admin/customer-map/custom-points', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const { name, phone, address, province, pointType, notes, interest } = req.body || {}
    let lat = req.body?.lat != null ? Number(req.body.lat) : null
    let lng = req.body?.lng != null ? Number(req.body.lng) : null

    if (!String(name || '').trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên điểm hoặc tên khách hàng.' })
    }

    const detected = findProvince(province || address)
    if ((!Number.isFinite(lat) || !Number.isFinite(lng)) && detected) {
      lat = detected.lat
      lng = detected.lng
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tọa độ hoặc chọn tỉnh/thành hợp lệ.' })
    }

    const id = `CMP-${randomUUID()}`
    const result = await query(
      `INSERT INTO custom_map_points (id, name, phone, address, province, location_lat, location_lng, point_type, notes, interest, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        id,
        String(name).trim(),
        phone ? String(phone).trim() : null,
        address ? String(address).trim() : null,
        province ? String(province).trim() : (detected?.displayName || null),
        lat,
        lng,
        pointType ? String(pointType).trim() : 'CUSTOMER',
        notes ? String(notes).trim() : null,
        interest ? String(interest).trim() : null,
        req.admin.name
      ]
    )

    const row = result.rows[0]
    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        recordType: 'CUSTOM',
        customerName: row.name,
        phone: row.phone || '',
        address: row.address || '',
        province: row.province || '',
        lat: Number(row.location_lat),
        lng: Number(row.location_lng),
        locationPrecision: 'EXACT',
        pointType: row.point_type,
        notes: row.notes || '',
        interest: row.interest || '',
        visitedAt: row.visited_at || '',
        visitedBy: row.visited_by || '',
        createdBy: row.created_by || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.patch('/api/v1/admin/customer-map/custom-points/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const { id } = req.params
    const { name, phone, address, province, pointType, notes, interest } = req.body || {}
    const exists = await query('SELECT * FROM custom_map_points WHERE id=$1', [id])
    if (!exists.rows[0]) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy điểm tự thêm.' })
    }

    let lat = req.body?.lat != null ? Number(req.body.lat) : Number(exists.rows[0].location_lat)
    let lng = req.body?.lng != null ? Number(req.body.lng) : Number(exists.rows[0].location_lng)

    const detected = findProvince(province || address)
    if ((!Number.isFinite(lat) || !Number.isFinite(lng)) && detected) {
      lat = detected.lat
      lng = detected.lng
    }

    const updatedName = name !== undefined ? String(name || '').trim() : exists.rows[0].name
    if (!updatedName) {
      return res.status(400).json({ success: false, message: 'Tên điểm không được để trống.' })
    }

    const result = await query(
      `UPDATE custom_map_points
       SET name=$1, phone=$2, address=$3, province=$4, location_lat=$5, location_lng=$6, point_type=$7, notes=$8, interest=$9, updated_at=CURRENT_TIMESTAMP
       WHERE id=$10
       RETURNING *`,
      [
        updatedName,
        phone !== undefined ? (phone ? String(phone).trim() : null) : exists.rows[0].phone,
        address !== undefined ? (address ? String(address).trim() : null) : exists.rows[0].address,
        province !== undefined ? (province ? String(province).trim() : null) : exists.rows[0].province,
        lat,
        lng,
        pointType !== undefined ? String(pointType).trim() : exists.rows[0].point_type,
        notes !== undefined ? (notes ? String(notes).trim() : null) : exists.rows[0].notes,
        interest !== undefined ? (interest ? String(interest).trim() : null) : exists.rows[0].interest,
        id
      ]
    )

    const row = result.rows[0]
    res.json({
      success: true,
      data: {
        id: row.id,
        recordType: 'CUSTOM',
        customerName: row.name,
        phone: row.phone || '',
        address: row.address || '',
        province: row.province || '',
        lat: Number(row.location_lat),
        lng: Number(row.location_lng),
        locationPrecision: 'EXACT',
        pointType: row.point_type,
        notes: row.notes || '',
        interest: row.interest || '',
        visitedAt: row.visited_at || '',
        visitedBy: row.visited_by || '',
        createdBy: row.created_by || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.delete('/api/v1/admin/customer-map/custom-points/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const { id } = req.params
    const result = await query('DELETE FROM custom_map_points WHERE id=$1 RETURNING id', [id])
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy điểm để xóa.' })
    }
    res.json({ success: true, message: 'Đã xóa điểm thành công.' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.patch('/api/v1/admin/customer-map/:recordType/:id/visit', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const recordType = String(req.params.recordType || '').toUpperCase()
    const { visited } = req.body || {}
    if (!['FACEBOOK', 'LEAD', 'CUSTOM'].includes(recordType) || typeof visited !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Thông tin đánh dấu lượt ghé thăm không hợp lệ.' })
    }

    if (recordType === 'CUSTOM') {
      const exists = await query('SELECT id FROM custom_map_points WHERE id=$1', [req.params.id])
      if (!exists.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy điểm tự thêm.' })
      if (visited) {
        await query('UPDATE custom_map_points SET visited_at=CURRENT_TIMESTAMP, visited_by=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2', [req.admin.name, req.params.id])
      } else {
        await query('UPDATE custom_map_points SET visited_at=NULL, visited_by=NULL, updated_at=CURRENT_TIMESTAMP WHERE id=$1', [req.params.id])
      }
      return res.json({ success: true, visited })
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
    const {
      status, notes, phone, interest, assignedTo, followUpAt, customerName, address, province,
      sourceAdId, sourceAdName, sourceCampaignId, sourceCampaignName, sourceType
    } = req.body
    const validStatuses = ['MOI', 'DANG_TU_VAN', 'CHO_PHAN_HOI', 'DA_CHOT', 'DA_HUY']
    if (status !== undefined && !validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Trạng thái chăm sóc không hợp lệ.' })
    if (!validOptionalText(address, 500) || !validOptionalText(province, 100)) return res.status(400).json({ success: false, message: 'Địa chỉ hoặc tỉnh/thành không hợp lệ.' })
    const locationChanged = address !== undefined || province !== undefined
    const detectedProvince = locationChanged ? findProvince(province || address) : null
    const existingResult = await query('SELECT customer_name,phone,address FROM facebook_care_customers WHERE id=$1', [req.params.id])
    const existingCustomer = existingResult.rows[0]
    if (!existingCustomer) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ khách Facebook.' })

    const adChanged = sourceAdId !== undefined
    const cleanAdId = sourceAdId ? String(sourceAdId).trim() : null
    const cleanAdName = sourceAdName ? String(sourceAdName).trim() : null
    const cleanCampaignId = sourceCampaignId ? String(sourceCampaignId).trim() : null
    const cleanCampaignName = sourceCampaignName ? String(sourceCampaignName).trim() : null
    const cleanSourceType = sourceType ? String(sourceType).trim() : (cleanAdId ? 'AD' : null)

    const result = await query(`UPDATE facebook_care_customers SET
      customer_name=COALESCE($1,customer_name), phone=COALESCE($2,phone), interest=COALESCE($3,interest), notes=COALESCE($4,notes),
      status=COALESCE($5,status), assigned_to=COALESCE($6,assigned_to), follow_up_at=$7,
      address=COALESCE($8,address), province=COALESCE($9,province), location_lat=COALESCE($10,location_lat), location_lng=COALESCE($11,location_lng),
      location_manually_set=CASE WHEN $12 THEN TRUE ELSE location_manually_set END,
      source_ad_id=CASE WHEN $14 THEN $15 ELSE source_ad_id END,
      source_ad_name=CASE WHEN $14 THEN $16 ELSE source_ad_name END,
      source_campaign_id=CASE WHEN $14 THEN $17 ELSE source_campaign_id END,
      source_campaign_name=CASE WHEN $14 THEN $18 ELSE source_campaign_name END,
      source_type=CASE WHEN $14 THEN $19 ELSE source_type END,
      updated_at=CURRENT_TIMESTAMP
      WHERE id=$13 RETURNING *`, [
      customerName ?? null, phone ?? null, interest ?? null, notes ?? null, status ?? null, assignedTo ?? null, followUpAt || null,
      address ?? null, detectedProvince?.displayName || null, detectedProvince?.lat ?? null, detectedProvince?.lng ?? null,
      locationChanged && Boolean(detectedProvince), req.params.id,
      adChanged, cleanAdId, cleanAdName, cleanCampaignId, cleanCampaignName, cleanSourceType
    ])
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

// Trợ giúp trích xuất ngày bắt đầu chiến dịch từ tên chiến dịch (vd: 19/11/2026 -> 2026-11-19)
const parseCampaignStartDate = (name = '') => {
  const match = name.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (match) {
    const day = match[1].padStart(2, '0')
    const month = match[2].padStart(2, '0')
    const year = match[3]
    return new Date(`${year}-${month}-${day}T00:00:00+07:00`)
  }
  return null
}

// Khôi phục toàn bộ nguồn quảng cáo về trạng thái chưa gán
app.post('/api/v1/admin/facebook-care/reset-attribute', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const result = await query(`
      UPDATE facebook_care_customers
      SET source_ad_id = NULL,
          source_ad_name = NULL,
          source_campaign_id = NULL,
          source_campaign_name = NULL,
          source_type = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE source_ad_id IS NOT NULL OR source_ad_name IS NOT NULL
    `)
    res.json({
      success: true,
      resetCount: result.rowCount,
      message: `Đã khôi phục ${result.rowCount} khách hàng về trạng thái Chưa xác định quảng cáo.`
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Tự động phân tích hội thoại và khớp nguồn chiến dịch quảng cáo chuẩn xác theo ngày & nội dung
app.post('/api/v1/admin/facebook-care/auto-attribute', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const { ads } = req.body || {}
    let adsList = Array.isArray(ads) && ads.length > 0 ? ads : []
    if (adsList.length === 0 && isFacebookAdsConfigured()) {
      try {
        const version = process.env.META_GRAPH_VERSION || 'v19.0'
        const accountId = process.env.META_AD_ACCOUNT_ID.replace(/^act_/, '')
        const url = new URL(`https://graph.facebook.com/${version}/act_${encodeURIComponent(accountId)}/ads`)
        url.searchParams.set('fields', 'id,name,campaign{id,name},adset{id,name},status,effective_status')
        url.searchParams.set('limit', '100')
        const response = await fetch(url, { headers: { Authorization: 'Bearer ' + process.env.META_ADS_ACCESS_TOKEN }, signal: AbortSignal.timeout(15000) })
        const payload = await response.json().catch(() => ({}))
        if (response.ok && Array.isArray(payload.data)) {
          adsList = payload.data.map(ad => ({
            id: ad.id,
            name: ad.name,
            campaignId: ad.campaign?.id || '',
            campaignName: ad.campaign?.name || ''
          }))
        }
      } catch (err) {
        console.warn('[Auto-attribute Ads Fetch Warning]:', err.message)
      }
    }

    if (adsList.length === 0) {
      return res.status(400).json({ success: false, message: 'Chưa lấy được danh sách chiến dịch quảng cáo từ Meta để đối soát.' })
    }

    const unassigned = await query(`
      SELECT c.id, c.customer_name, c.last_message, c.interest, c.created_at,
        COALESCE(string_agg(m.body, ' ' ORDER BY m.created_at), '') as all_messages
      FROM facebook_care_customers c
      LEFT JOIN facebook_care_messages m ON m.customer_id = c.id
      WHERE c.source_ad_id IS NULL OR c.source_ad_id = '' OR c.source_type = 'AUTO_MATCHED'
      GROUP BY c.id
    `)

    let matchedCount = 0

    // Chuẩn bị danh sách quảng cáo kèm ngày bắt đầu và từ khóa đặc trưng
    const preparedAds = adsList.map(a => {
      const name = a.name || ''
      const startDate = parseCampaignStartDate(name) || parseCampaignStartDate(a.campaignName || '')
      return {
        ...a,
        startDate
      }
    })

    const micMusicAd = preparedAds.find(a => (a.name || '').includes('19/11') || (a.name || '').includes('tiếng mic') || (a.name || '').includes('tiếng nhạc'))
    const leadAttractAd = preparedAds.find(a => (a.name || '').includes('6/11') || (a.name || '').includes('Thu Hút Khách Hàng'))
    const tradeInAd = preparedAds.find(a => (a.name || '').includes('Thu Cũ') || (a.name || '').includes('Vang Số'))
    const rentalAd = preparedAds.find(a => (a.name || '').includes('Cho Thuê') || (a.name || '').includes('500K'))

    const micTime = micMusicAd?.startDate?.getTime() || new Date('2026-11-19T00:00:00+07:00').getTime()
    const attractTime = leadAttractAd?.startDate?.getTime() || new Date('2026-11-06T00:00:00+07:00').getTime()

    for (const c of unassigned.rows) {
      const customerTime = c.created_at ? new Date(c.created_at).getTime() : 0
      const fullText = `${c.customer_name || ''} ${c.interest || ''} ${c.last_message || ''} ${c.all_messages || ''}`.toLowerCase()
      let matchedAd = null

      // 1. Chiến dịch thuê âm thanh: bắt buộc có từ khóa thuê âm thanh
      if (rentalAd && (fullText.includes('thuê âm thanh') || fullText.includes('cho thuê loa') || fullText.includes('thuê dàn') || fullText.includes('500k'))) {
        if (!rentalAd.startDate || customerTime >= rentalAd.startDate.getTime()) {
          matchedAd = rentalAd
        }
      }
      // 2. Chiến dịch thu cũ đổi mới / căn chỉnh vang số: khách hỏi về thu cũ, đổi mới, đổi loa cũ, vang số
      else if (tradeInAd && (fullText.includes('thu cũ') || fullText.includes('đổi mới') || fullText.includes('đổi loa') || fullText.includes('đổi vang') || fullText.includes('căn chỉnh miễn phí'))) {
        if (!tradeInAd.startDate || customerTime >= tradeInAd.startDate.getTime()) {
          matchedAd = tradeInAd
        }
      }
      // 3. Chiến dịch 19/11 Chỉnh tiếng mic tiếng nhạc: Khách nhắn từ ngày 19/11/2026 khi chiến dịch 19/11 đang chạy
      else if (micMusicAd && customerTime >= micTime) {
        matchedAd = micMusicAd
      }
      // 4. Chiến dịch 6/11 Thu hút khách hàng: Khách nhắn từ ngày 06/11 đến trước ngày 19/11 hỏi về dàn karaoke, âm thanh, giá cả
      else if (leadAttractAd && customerTime >= attractTime && customerTime < micTime) {
        matchedAd = leadAttractAd
      }

      if (matchedAd) {
        await query(`
          UPDATE facebook_care_customers
          SET source_ad_id = $1,
              source_ad_name = $2,
              source_campaign_id = $3,
              source_campaign_name = $4,
              source_type = 'AUTO_MATCHED',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `, [matchedAd.id, matchedAd.name, matchedAd.campaignId || null, matchedAd.campaignName || null, c.id])
        matchedCount++
      }
    }

    res.json({
      success: true,
      matchedCount,
      totalUnassigned: unassigned.rows.length,
      message: `Đã phân loại chuẩn xác theo ngày & nội dung cho ${matchedCount} khách hàng (khách cũ trước ngày chạy quảng cáo được giữ nguyên nguồn tự nhiên)!`
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
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
    const pageToken = await getMetaPageAccessToken()
    const { META_PAGE_ID: pageId, META_GRAPH_VERSION: graphVersion } = process.env
    if (!pageId || !pageToken || !/^v\d+\.\d+$/.test(graphVersion || '')) return res.status(503).json({ success: false, message: 'Chưa cấu hình đầy đủ Meta Page ID, Page Access Token và Graph API version trên backend.' })
    const customerResult = await query('SELECT id, customer_name, facebook_id, phone FROM facebook_care_customers WHERE id=$1', [req.params.id])
    const customer = customerResult.rows[0]
    if (!customer?.facebook_id) return res.status(400).json({ success: false, message: 'Hồ sơ này chưa có Facebook PSID nên chưa thể gửi Messenger.' })
    
    // Tìm tin nhắn gần nhất thực sự do khách gửi từ Facebook (ưu tiên có platform_message_id)
    const lastInboundResult = await query(`
      SELECT created_at FROM facebook_care_messages 
      WHERE customer_id=$1 AND direction='IN' AND platform_message_id IS NOT NULL 
      ORDER BY created_at DESC LIMIT 1
    `, [customer.id])
    const fallbackInbound = !lastInboundResult.rows[0] 
      ? await query("SELECT created_at FROM facebook_care_messages WHERE customer_id=$1 AND direction='IN' ORDER BY created_at DESC LIMIT 1", [customer.id])
      : null
    const lastInboundRow = lastInboundResult.rows[0] || fallbackInbound?.rows[0]
    const diffHours = lastInboundRow ? (Date.now() - new Date(lastInboundRow.created_at).getTime()) / (1000 * 60 * 60) : 9999

    if (diffHours > 24) {
      return res.status(409).json({ 
        success: false, 
        message: `Đã quá 24 giờ kể từ tin nhắn Messenger gần nhất của khách. Meta (Facebook) chặn gửi tin nhắn tự do để chống spam. Vui lòng bấm [Nhắn Zalo] hoặc [Gọi điện] qua SĐT ${customer.phone ? `(${customer.phone})` : ''} để tiếp tục tư vấn.` 
      })
    }

    let sentPayload
    try {
      sentPayload = await sendFacebookText(customer.facebook_id, text)
    } catch (err) {
      const isWindowError = err.message && (
        err.message.includes('outside of allowed window') || 
        err.message.includes('2018278') ||
        err.message.includes('HUMAN_AGENT') ||
        err.message.includes('phê duyệt trước')
      )
      if (isWindowError) {
        return res.status(409).json({ 
          success: false, 
          message: `Đã quá 24 giờ kể từ tin nhắn Messenger gần nhất của khách. Meta (Facebook) chặn gửi tin nhắn tự do để chống spam. Vui lòng bấm [Nhắn Zalo] hoặc [Gọi điện] qua SĐT ${customer.phone ? `(${customer.phone})` : ''}.` 
        })
      }
      return res.status(502).json({ success: false, message: err.message || 'Meta chưa nhận tin nhắn. Hãy kiểm tra quyền Page và token.' })
    }
    const saved = await query("INSERT INTO facebook_care_messages (id, customer_id, body, direction, created_by, platform_message_id) VALUES ($1,$2,$3,'OUT',$4,$5) ON CONFLICT (platform_message_id) DO UPDATE SET created_by=EXCLUDED.created_by RETURNING id, body, direction, created_at", [randomUUID(), customer.id, text, req.admin.name, sentPayload?.message_id || null])
    await query('UPDATE facebook_care_customers SET last_message=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2', [text, customer.id])
    res.status(201).json({ success: true, data: { id: saved.rows[0].id, body: text, direction: 'OUT', createdAt: saved.rows[0].created_at } })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

app.get('/api/v1/ai-chat/status', async (req, res) => {
  try {
    const enabled = await isWebAiEnabled()
    res.json({ success: true, enabled })
  } catch (err) {
    res.json({ success: true, enabled: true })
  }
})

app.get('/api/v1/admin/ai-settings', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const [webAi, fbAi, fbCommentAi, apiKey, model] = await Promise.all([
      isWebAiEnabled(),
      isFacebookAiEnabled(),
      isFacebookCommentAiEnabled(),
      getGeminiApiKey(),
      getGeminiModel()
    ])
    const maskedKey = apiKey && apiKey.length > 12 
      ? apiKey.slice(0, 8) + '•'.repeat(Math.min(16, apiKey.length - 12)) + apiKey.slice(-4)
      : (apiKey ? '••••••••' : '')
    res.json({
      success: true,
      data: {
        webAiEnabled: webAi,
        facebookAiEnabled: fbAi,
        facebookCommentAiEnabled: fbCommentAi,
        geminiConfigured: Boolean(apiKey),
        hasKey: Boolean(apiKey),
        maskedKey,
        model: model || 'gemini-3.8-flash'
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.post('/api/v1/admin/ai-settings', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { webAiEnabled, facebookAiEnabled, facebookCommentAiEnabled, apiKey, model } = req.body
    if (typeof webAiEnabled === 'boolean') {
      await setSystemSetting('web_ai_enabled', webAiEnabled)
    }
    if (typeof facebookAiEnabled === 'boolean') {
      await setSystemSetting('facebook_ai_enabled', facebookAiEnabled)
    }
    if (typeof facebookCommentAiEnabled === 'boolean') {
      await setSystemSetting('facebook_comment_ai_enabled', facebookCommentAiEnabled)
    }
    if (typeof apiKey === 'string' && apiKey.trim()) {
      await setSystemSetting('gemini_api_key', apiKey.trim())
    }
    if (typeof model === 'string' && model.trim()) {
      await setSystemSetting('gemini_model', model.trim())
    }
    const [newWeb, newFb, newFbComment, currentKey, currentModel] = await Promise.all([
      isWebAiEnabled(),
      isFacebookAiEnabled(),
      isFacebookCommentAiEnabled(),
      getGeminiApiKey(),
      getGeminiModel()
    ])
    const maskedKey = currentKey && currentKey.length > 12 
      ? currentKey.slice(0, 8) + '•'.repeat(Math.min(16, currentKey.length - 12)) + currentKey.slice(-4)
      : (currentKey ? '••••••••' : '')
    res.json({
      success: true,
      message: 'Cập nhật cấu hình Bật/Tắt & Token AI thành công!',
      data: {
        webAiEnabled: newWeb,
        facebookAiEnabled: newFb,
        facebookCommentAiEnabled: newFbComment,
        geminiConfigured: Boolean(currentKey),
        hasKey: Boolean(currentKey),
        maskedKey,
        model: currentModel || 'gemini-3.8-flash'
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ==========================================
// ĐÀO TẠO TÂM LÝ KHÁCH HÀNG & KỊCH BẢN CHỐT SALE AI (AI TRAINING HUB)
// ==========================================
app.get('/api/v1/admin/ai-training', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM ai_training_rules ORDER BY created_at ASC, id ASC')
    res.json({
      success: true,
      data: result.rows
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.post('/api/v1/admin/ai-training', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { title, personaType, psychologicalTrigger, customerKeywords, suggestedResponse, isActive } = req.body
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Tiêu đề kịch bản tâm lý không được để trống.' })
    }
    if (!psychologicalTrigger || !psychologicalTrigger.trim()) {
      return res.status(400).json({ success: false, message: 'Phân tích tâm lý & đòn bẩy không được để trống.' })
    }
    if (!suggestedResponse || !suggestedResponse.trim()) {
      return res.status(400).json({ success: false, message: 'Câu trả lời mẫu phong cách anh Tú không được để trống.' })
    }

    const id = 'rule-' + randomUUID().slice(0, 8)
    const result = await query(`
      INSERT INTO ai_training_rules (id, title, persona_type, psychological_trigger, customer_keywords, suggested_response, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `, [
      id,
      title.trim(),
      (personaType || 'CHUYEN_SAU').trim().toUpperCase(),
      psychologicalTrigger.trim(),
      (customerKeywords || '').trim(),
      suggestedResponse.trim(),
      typeof isActive === 'boolean' ? isActive : true
    ])

    clearAiPsychologicalTrainingCache()
    res.json({
      success: true,
      message: 'Thêm kịch bản tâm lý mới thành công!',
      data: result.rows[0]
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.put('/api/v1/admin/ai-training/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const { title, personaType, psychologicalTrigger, customerKeywords, suggestedResponse, isActive } = req.body

    const existing = await query('SELECT id FROM ai_training_rules WHERE id = $1', [id])
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy kịch bản tâm lý này.' })
    }

    const result = await query(`
      UPDATE ai_training_rules
      SET title = COALESCE($1, title),
          persona_type = COALESCE($2, persona_type),
          psychological_trigger = COALESCE($3, psychological_trigger),
          customer_keywords = COALESCE($4, customer_keywords),
          suggested_response = COALESCE($5, suggested_response),
          is_active = COALESCE($6, is_active),
          updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [
      title ? title.trim() : null,
      personaType ? personaType.trim().toUpperCase() : null,
      psychologicalTrigger ? psychologicalTrigger.trim() : null,
      typeof customerKeywords === 'string' ? customerKeywords.trim() : null,
      suggestedResponse ? suggestedResponse.trim() : null,
      typeof isActive === 'boolean' ? isActive : null,
      id
    ])

    clearAiPsychologicalTrainingCache()
    res.json({
      success: true,
      message: 'Cập nhật kịch bản tâm lý thành công!',
      data: result.rows[0]
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.delete('/api/v1/admin/ai-training/:id', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const result = await query('DELETE FROM ai_training_rules WHERE id = $1 RETURNING id', [id])
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy kịch bản tâm lý cần xóa.' })
    }

    clearAiPsychologicalTrainingCache()
    res.json({
      success: true,
      message: 'Đã xóa kịch bản tâm lý thành công!'
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.post('/api/v1/admin/ai-training/train', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    clearAiPsychologicalTrainingCache()
    const activeRules = await query('SELECT COUNT(*) as count FROM ai_training_rules WHERE is_active = TRUE')
    const count = Number(activeRules.rows[0]?.count || 0)
    
    // Nạp mới vào bộ nhớ
    await getAiPsychologicalTrainingContext()

    res.json({
      success: true,
      message: `Đã nạp ${count} kịch bản tâm lý thành công vào toàn bộ hệ thống AI (Website, Messenger, Comment Facebook)!`,
      activeCount: count
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// AI TỰ ĐỘNG SOẠN KỊCH BẢN TÂM LÝ BÁN HÀNG THEO YÊU CẦU HOẶC TỰ ĐỘNG ĐỀ XUẤT
app.post('/api/v1/admin/ai-training/auto-generate', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const { topic, personaType } = req.body || {}
    const apiKey = await getGeminiApiKey()
    const model = await getGeminiModel()
    if (!apiKey) {
      return res.status(400).json({ success: false, message: 'Chưa cấu hình Google Gemini API Key trong hệ thống.' })
    }

    // Lấy danh sách các kịch bản hiện có để AI không bị trùng lặp
    const existingRules = await query('SELECT title, customer_keywords FROM ai_training_rules LIMIT 15')
    const existingTitles = existingRules.rows.map(r => r.title).join('; ')

    // Lấy thêm vài tin nhắn thực tế gần đây của khách làm cảm hứng
    let recentCustomerMsgs = ''
    try {
      const msgs = await query(`
        SELECT body FROM facebook_messages 
        WHERE direction = 'IN' AND body IS NOT NULL AND length(body) > 10 
        ORDER BY created_at DESC LIMIT 15
      `)
      if (msgs.rows.length) {
        recentCustomerMsgs = msgs.rows.map(m => m.body.replace(/\\n+/g, ' ')).join(' | ')
      }
    } catch (_) {}

    const prompt = `Bạn là Chuyên gia Đào tạo AI Bán Hàng & Chuyên gia Âm thanh Karaoke cao cấp Tú Audio (tuaudio.vn, hotline/Zalo 0984.259.898, showroom Phố Nguyễn Danh Phương, Vĩnh Yên).
Nhiệm vụ của bạn là SOẠN THẢO 1 KỊCH BẢN TÂM LÝ KHÁCH HÀNG THỰC CHIẾN MỚI để nạp vào não bộ AI cho hệ thống bán hàng và tư vấn âm thanh.

${topic ? `Yêu cầu chủ đề / tình huống từ anh Tú: "${topic}"` : 'Hãy tự động phân tích và tạo ra 1 tình huống bán hàng âm thanh karaoke gia đình thực tế và rất phổ biến mà khách hay gặp (chưa trùng với các kịch bản đã có).'}
${personaType ? `Nhóm tâm lý ưu tiên: ${personaType}` : ''}

Các kịch bản hiện đã có trong hệ thống (HÃY TRÁNH TRÙNG LẶP):
${existingTitles || 'Chưa có'}

${recentCustomerMsgs ? `Các câu hỏi thực tế khách vừa nhắn trên Fanpage để bạn tham khảo:\n${recentCustomerMsgs}\n` : ''}

YÊU CẦU ĐẶC BIỆT THEO CHUẨN TÚ AUDIO:
1. "persona_type" phải là một trong các giá trị: "HU_RIT_THAT_VONG", "NANG_CAP_DO_CU", "DICH_VU_TAN_NHA", "DO_GIA_SO_HO", "KHACH_MOI_TRON_BO", hoặc "CHUYEN_SAU".
2. "psychological_trigger": Nêu rõ nỗi sợ, băn khoăn thầm kín của khách và đòn bẩy tâm lý để thuyết phục họ.
3. "customer_keywords": 4-8 cụm từ khách hay nhắn nhất (viết chữ thường không dấu hoặc có dấu, ngăn cách bằng dấu phẩy).
4. "suggested_response": Câu trả lời 1-2 câu cực kỳ thấu cảm, chuyên môn cao, đúng văn phong của anh Tú Audio. Tuyệt đối KHÔNG từ chối khách thô lỗ. Luôn gợi mở giải pháp và khéo léo xin số điện thoại hoặc Zalo để gửi video test / tư vấn chi tiết.

TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON (không kèm markdown):
{
  "title": "Tiêu đề kịch bản ngắn gọn, rõ ràng",
  "persona_type": "Mã nhóm persona",
  "psychological_trigger": "Phân tích nỗi đau tâm lý và giải pháp",
  "customer_keywords": "từ khóa 1, từ khóa 2, từ khóa 3, từ khóa 4",
  "suggested_response": "Câu trả lời mẫu chuẩn phong cách anh Tú"
}`

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json'
        }
      }),
      signal: AbortSignal.timeout(20000)
    })

    const data = await geminiRes.json().catch(() => ({}))
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!rawText) {
      throw new Error('Gemini không phản hồi dữ liệu kịch bản.')
    }

    let parsed = null
    try {
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      parsed = JSON.parse(cleanJson)
    } catch (e) {
      throw new Error('Dữ liệu JSON từ Gemini không đúng định dạng: ' + rawText.slice(0, 100))
    }

    res.json({
      success: true,
      message: 'AI đã tự động soạn kịch bản tâm lý thành công!',
      data: parsed
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ==========================================
// CẤU HÌNH DỊP LỄ HỘI & HIỆU ỨNG SỰ KIỆN
// ==========================================
const DEFAULT_FESTIVE_SETTINGS = {
  theme: 'noel', // 'noel' | 'tet' | 'sale' | 'none' | 'auto' - Mặc định Giáng Sinh / Noel sắp tới
  fallingEnabled: true,
  decorEnabled: true,
  customTicker: '',
  updatedAt: new Date().toISOString()
}

// 1. API công khai cho khách xem web lấy cấu hình dịp lễ
app.get('/api/v1/festive-settings', async (req, res) => {
  try {
    const settings = await getSystemSetting('festive_settings', DEFAULT_FESTIVE_SETTINGS)
    res.json({
      success: true,
      data: {
        ...DEFAULT_FESTIVE_SETTINGS,
        ...(typeof settings === 'object' && settings !== null ? settings : {})
      }
    })
  } catch (err) {
    res.json({ success: true, data: DEFAULT_FESTIVE_SETTINGS })
  }
})

// 2. API Quản trị lấy cấu hình dịp lễ
app.get('/api/v1/admin/festive-settings', authenticateAdmin, async (req, res) => {
  try {
    const settings = await getSystemSetting('festive_settings', DEFAULT_FESTIVE_SETTINGS)
    res.json({
      success: true,
      data: {
        ...DEFAULT_FESTIVE_SETTINGS,
        ...(typeof settings === 'object' && settings !== null ? settings : {})
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 3. API Quản trị lưu cập nhật cấu hình dịp lễ
app.post('/api/v1/admin/festive-settings', authenticateAdmin, authorizeRoles('SUPER_ADMIN', 'SALES'), async (req, res) => {
  try {
    const current = await getSystemSetting('festive_settings', DEFAULT_FESTIVE_SETTINGS)
    const { theme, fallingEnabled, decorEnabled, customTicker } = req.body

    const allowedThemes = ['tet', 'noel', 'sale', 'none', 'auto']
    const nextTheme = allowedThemes.includes(theme) ? theme : (current.theme || 'noel')
    const nextFalling = typeof fallingEnabled === 'boolean' ? fallingEnabled : (current.fallingEnabled ?? true)
    const nextDecor = typeof decorEnabled === 'boolean' ? decorEnabled : (current.decorEnabled ?? true)
    const nextTicker = typeof customTicker === 'string' ? customTicker.trim() : (current.customTicker || '')

    const updated = {
      theme: nextTheme,
      fallingEnabled: nextFalling,
      decorEnabled: nextDecor,
      customTicker: nextTicker,
      updatedAt: new Date().toISOString(),
      updatedBy: req.admin?.username || 'admin'
    }

    await setSystemSetting('festive_settings', updated)
    await recordAuditLog({
      admin: req.admin,
      action: 'Cập nhật cấu hình sự kiện & hiệu ứng lễ hội',
      actionType: 'UPDATE_FESTIVE_SETTINGS',
      summary: `Đã đổi chủ đề lễ hội thành: ${nextTheme}`,
      details: updated,
      req
    })

    res.json({
      success: true,
      message: 'Cập nhật cấu hình dịp lễ hội thành công!',
      data: updated
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Tự động đảm bảo cột bảo mật cần thiết tồn tại trên CSDL khi khởi động
const ensureDatabaseSchema = async () => {
  try {
    await query(`CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(100) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`)
    await query('ALTER TABLE admins ADD COLUMN IF NOT EXISTS auth_version INTEGER NOT NULL DEFAULT 0')
    await query('ALTER TABLE admins ADD COLUMN IF NOT EXISTS email VARCHAR(255)')
    await query('CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_username_lower ON admins (LOWER(username))')
    await query(`CREATE TABLE IF NOT EXISTS admin_otp_codes (
      id VARCHAR(50) PRIMARY KEY,
      admin_id VARCHAR(50) NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
      code VARCHAR(10) NOT NULL,
      purpose VARCHAR(30) NOT NULL DEFAULT 'LOGIN',
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )`)
    await query('CREATE INDEX IF NOT EXISTS idx_admin_otp_lookup ON admin_otp_codes(admin_id, purpose, expires_at)')
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
    await query("ALTER TABLE facebook_care_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'")
    await query('CREATE UNIQUE INDEX IF NOT EXISTS idx_fb_care_platform_message_id ON facebook_care_messages(platform_message_id)')
    await query('CREATE UNIQUE INDEX IF NOT EXISTS idx_fb_care_facebook_id ON facebook_care_customers(facebook_id) WHERE facebook_id IS NOT NULL')
    await query("ALTER TABLE facebook_care_messages ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'").catch(() => {})
    await query("ALTER TABLE facebook_care_customers ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'").catch(() => {})
    await query("ALTER TABLE facebook_care_customers ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC'").catch(() => {})
    await query(`CREATE TABLE IF NOT EXISTS facebook_comment_replies (
      comment_id VARCHAR(100) PRIMARY KEY,
      customer_id VARCHAR(100),
      user_name VARCHAR(255),
      comment_text TEXT,
      public_reply_text TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )`)
    await query(`CREATE TABLE IF NOT EXISTS customer_map_visits (
      record_type VARCHAR(20) NOT NULL CHECK (record_type IN ('FACEBOOK','LEAD')),
      record_id VARCHAR(50) NOT NULL,
      visited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      visited_by VARCHAR(100) NOT NULL,
      PRIMARY KEY (record_type,record_id)
    )`)
    await query(`CREATE TABLE IF NOT EXISTS custom_map_points (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      phone VARCHAR(30),
      address TEXT,
      province VARCHAR(100),
      location_lat DOUBLE PRECISION NOT NULL,
      location_lng DOUBLE PRECISION NOT NULL,
      point_type VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
      notes TEXT,
      interest TEXT,
      visited_at TIMESTAMP NULL,
      visited_by VARCHAR(100),
      created_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`)
    await query('CREATE INDEX IF NOT EXISTS idx_custom_map_points_updated ON custom_map_points(updated_at DESC)')
    await query('ALTER TABLE combos ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE')
    // Chuẩn hóa ràng buộc khóa ngoại ON UPDATE CASCADE và cập nhật ID gói dàn cũ sang mã SKU chuẩn
    try {
      await query(`
        ALTER TABLE combo_components DROP CONSTRAINT IF EXISTS combo_components_combo_id_fkey;
        ALTER TABLE combo_components ADD CONSTRAINT combo_components_combo_id_fkey FOREIGN KEY (combo_id) REFERENCES combos(id) ON DELETE CASCADE ON UPDATE CASCADE;
        ALTER TABLE combo_gifts DROP CONSTRAINT IF EXISTS combo_gifts_combo_id_fkey;
        ALTER TABLE combo_gifts ADD CONSTRAINT combo_gifts_combo_id_fkey FOREIGN KEY (combo_id) REFERENCES combos(id) ON DELETE CASCADE ON UPDATE CASCADE;
        UPDATE combos SET id = 'CB-19TR' WHERE id = 'dan-karaoke-19tr';
        UPDATE combos SET id = 'CB-29TR' WHERE id = 'dan-karaoke-29tr';
      `)
    } catch (e) {
      // Bỏ qua nếu đã nâng cấp
    }

    // Tự động làm sạch các bản ghi vị trí bị gán cứng 'Hà Nội / Việt Nam' do bug cũ
    try {
      await query(`
        UPDATE admin_active_sessions 
        SET city = 'Vĩnh Yên / Phú Thọ' 
        WHERE city = 'Hà Nội / Việt Nam' AND (ip_address LIKE '14.191.%' OR ip_address = '14.191.31.153');
        UPDATE admin_active_sessions 
        SET city = 'Việt Nam' 
        WHERE city = 'Hà Nội / Việt Nam';
      `)
    } catch (e) {
      // Bỏ qua nếu bảng chưa tồn tại
    }

    // Tự động nạp danh sách 5 gói dàn karaoke chuẩn thương hiệu Tú Audio nếu chưa tồn tại
    try {
      const defaultCombos = [
        {
          id: 'CB-29TR',
          name: 'Dàn Karaoke 29 Triệu — Chuẩn Âm Hay Hơn Quán Hát',
          tagline: 'Gói cao cấp bán chạy nhất cho phòng khách từ 25 - 45m²',
          price: 29900000,
          fastActionPrice: 28900000,
          totalRealValue: 40000000,
          listPrice: 34800000,
          savedAmount: 10100000,
          roomSize: '25 - 45m²',
          isFeatured: true,
          badge: 'Lựa Chọn Số 1 Của 80% Khách Hàng',
          videoUrl: 'https://www.youtube.com/watch?v=AwEJrll5EPk',
          videoTitle: 'So Sánh Dàn Karaoke Gia Đình Với Quán Hát — Lắp Thực Tế Nhà Anh Ngọc (Vĩnh Phúc)',
          components: [
            { item: '1 Đôi Loa Full 30 PF 12 Pro', role: 'Tiếng sáng, hát nhẹ, không hú rít' },
            { item: 'Cục Đẩy 4 Kênh x800W Acoustic', role: 'Mạch Class H khỏe, đánh căng không nóng máy' },
            { item: 'Vang Số Cao Cấp PF K9', role: 'Chip DSP 32-bit chống hú rít tuyệt đối, effect mượt mà' },
            { item: 'Bộ Micro Không Dây CM 05', role: 'Bắt sóng xa, cảm biến tự ngắt, tiếng mic dày ấm' },
            { item: 'Loa Sub Trầm Hơi 40 PF S15', role: 'Bass 40 đánh rung sàn, uy lực chuẩn phòng bay' }
          ],
          gifts: [
            'Bộ Quản lý nguồn điện cao cấp bảo vệ toàn bộ dàn',
            'Dây quang AudioQuest xịn truyền tải nhạc sạch',
            '10m Dây loa bọc giáp đồng nguyên chất + Bộ jack Neutrik',
            'Bộ pin sạc dung lượng cao cho Micro (dùng 2-3 năm không cần mua pin tiểu)',
            'Setup căn chỉnh trực tiếp 1 lần tại nhà & hỗ trợ từ xa suốt đời',
            'Miễn phí vận chuyển tận nhà trong bán kính 300km'
          ]
        },
        {
          id: 'CB-19TR',
          name: 'Dàn Karaoke 19 Triệu — Hay Như Quán Hát Tiết Kiệm',
          tagline: 'Cấu hình tiêu chuẩn tối ưu chi phí cho phòng khách từ 15 - 30m²',
          price: 19800000,
          fastActionPrice: 18800000,
          totalRealValue: 30400000,
          listPrice: 26700000,
          savedAmount: 10600000,
          roomSize: '15 - 30m²',
          isFeatured: false,
          badge: 'Tiết Kiệm Nhất',
          videoUrl: 'https://www.youtube.com/watch?v=9sh3YSPm57I',
          videoTitle: 'Dàn Karaoke Gia Đình 19,5 Triệu Hay Như Quán Hát — Lắp Nhà Cô Hồng (Phú Thọ)',
          components: [
            { item: '1 Đôi Loa Full 30 PF 12 Pro', role: 'Bass 30cm nội lực, dải trung rõ nét' },
            { item: 'Cục Đẩy 2 Kênh x600W Acoustic', role: 'Kéo căng đôi loa full 30, âm sắc sạch' },
            { item: 'Vang Số Cơ Lai CM x16+', role: 'Dễ chỉnh tay hoặc máy tính, chống hú tốt' },
            { item: 'Bộ Micro Không Dây CM 05', role: 'Hát nhẹ hơi, nâng giọng cho người giọng yếu' },
            { item: 'Loa Sub Điện 30 PF S12', role: 'Gọn gàng, tăng cường dải bass ấm cúng cho gia đình' }
          ],
          gifts: [
            'Dây quang AudioQuest chính hãng truyền nhạc sạch từ Smart TV',
            'Dây loa + Toàn bộ jack canon phụ kiện đi kèm',
            'Bộ pin sạc micro chuyên dụng',
            'Setup căn chỉnh trực tiếp 1 lần tại nhà & hỗ trợ từ xa',
            'Miễn phí vận chuyển tận nhà trong bán kính 300km'
          ]
        },
        {
          id: 'CB-24TR',
          name: 'Dàn Karaoke Quốc Dân 24 Triệu — Đẩy Vang Đồng Bộ, Hát Nhẹ Tuyệt Đối',
          tagline: 'Cấu hình gia đình được ưa chuộng nhất cho không gian phòng khách từ 20 - 35m²',
          price: 24800000,
          fastActionPrice: 23900000,
          totalRealValue: 35000000,
          listPrice: 30500000,
          savedAmount: 10200000,
          roomSize: '20 - 35m²',
          isFeatured: false,
          badge: 'Gia Đình Khuyên Dùng',
          videoUrl: 'https://www.youtube.com/watch?v=hK7F0a_2x-Q',
          videoTitle: 'Lắp Dàn Karaoke 5 Năm Rồi Mà Càng Ngày Càng Hay — Tú Audio Thực Tế',
          components: [
            { item: '1 Đôi Loa Full 30 PF 12 Pro Họng Kèn Titan', role: 'Lời ca sáng trong, tiếng nhạc tách bạch, hát không hụt hơi' },
            { item: 'Cục Đẩy 3 Kênh Tích Hợp Độc Lập', role: 'Gọn gàng 1 khối máy, 2 kênh kéo loa full và 1 kênh kéo riêng sub' },
            { item: 'Vang Số Chỉnh Cơ PF K8+ Màn Hình LED', role: 'DSP 32-bit chống hú rít 100%, dễ chỉnh tay hoặc phần mềm' },
            { item: 'Bộ Micro Không Dây CM 05 Cảm Biến Gia Tốc', role: 'Tự ngắt chống rú rít khi đặt xuống bàn, củ mic dày ấm tôn giọng' },
            { item: 'Loa Sub Điện 30 PF S12 Siêu Trầm', role: 'Dải bass sâu lắng, nghe nhạc vàng ấm cúng, hát bolero truyền cảm' }
          ],
          gifts: [
            'Bộ Quản lý nguồn cao cấp bảo vệ an toàn nguồn điện hệ thống',
            'Dây quang AudioQuest xịn kết nối Smart TV',
            '10m Dây loa bọc giáp đồng nguyên chất + Bộ jack cắm chuyên dụng',
            'Bộ pin sạc dung lượng cao cho Micro (dùng 2-3 năm)',
            'Căn chỉnh âm học trực tiếp 1 lần tại nhà & hỗ trợ từ xa suốt đời',
            'Miễn phí vận chuyển và lắp đặt tận nhà trong 300km'
          ]
        },
        {
          id: 'CB-39TR',
          name: 'Dàn Karaoke VIP 39 Triệu — 2 Đôi Loa Full + Sub Kép Chuẩn Phòng Bay',
          tagline: 'Cấu hình đẳng cấp âm thanh sân khấu cho phòng khách lớn & biệt thự từ 35 - 65m²',
          price: 39500000,
          fastActionPrice: 38500000,
          totalRealValue: 56000000,
          listPrice: 48500000,
          savedAmount: 16500000,
          roomSize: '35 - 65m²',
          isFeatured: false,
          badge: 'Đẳng Cấp Phòng Bay VIP',
          videoUrl: 'https://www.youtube.com/watch?v=vHKHBGQSV8o',
          videoTitle: 'Dàn Karaoke Gia Đình 54 Triệu Vẫn Không Hay, Cân Chỉnh Đồng Bộ Hay Gấp Đôi',
          components: [
            { item: '2 Đôi Loa Full 30 PF 12 Pro (4 Chiếc)', role: 'Góc phủ âm rộng 360 độ, âm thanh dày đặc bao trọn không gian lớn' },
            { item: 'Cục Đẩy Công Suất 4 Kênh x1000W Class H', role: 'Đánh căng đét 4 loa full 30, lực đánh cực khỏe không méo tiếng' },
            { item: 'Cục Đẩy 2 Kênh Kéo Sub Riêng Biệt 1200W', role: 'Mạch lực đánh sub riêng, tạo tiếng trầm sâu thẳm chuẩn quán hát' },
            { item: 'Vang Số Cao Cấp DSP 32-bit PF K9', role: 'Hiệu ứng Echo - Reverb bay bổng, triệt tiêu phản hồi âm học tuyệt đối' },
            { item: 'Bộ Micro Không Dây 4 Râu Sóng Khỏe CM 08', role: 'Bắt sóng xa 100m ổn định, hát nhẹ hơi như ca sĩ chuyên nghiệp' },
            { item: 'Loa Sub Hơi 50cm PF S18 Uy Lực', role: 'Bass 50 đánh rung chuyển sàn nhà, uy lực bùng nổ cho tiệc tùng' }
          ],
          gifts: [
            'Bộ Quản lý nguồn thông minh 8 cổng tự ngắt bảo vệ toàn diện',
            'Tủ máy âm thanh chuyên nghiệp bọc nhôm cánh mở cao cấp',
            'Dây quang AudioQuest xịn truyền nhạc số sạch không suy hao',
            'Toàn bộ hệ thống dây giắc kết nối Neutrik mạ vàng',
            'Kỹ sư Tú Audio trực tiếp tới căn chỉnh đo đạc pha âm thanh tại nhà',
            'Bảo hành đổi mới 1-1 trong 12 tháng & Bảo trì miễn phí trọn đời'
          ]
        },
        {
          id: 'CB-14TR',
          name: 'Dàn Karaoke Chung Cư 14.5 Triệu — Nhỏ Gọn, Hát Êm, Không Lo Hàng Xóm',
          tagline: 'Cấu hình âm thanh tinh gọn tối ưu cho căn hộ chung cư và phòng khách từ 12 - 22m²',
          price: 14500000,
          fastActionPrice: 13800000,
          totalRealValue: 21500000,
          listPrice: 18500000,
          savedAmount: 7000000,
          roomSize: '12 - 22m²',
          isFeatured: false,
          badge: 'Chung Cư & Phòng Nhỏ',
          videoUrl: 'https://www.youtube.com/watch?v=mb9PpteD70c',
          videoTitle: 'Khắc Phục Dàn Loa Hát Nặng, Bí Tiếng Tại Phòng Khách Gia Đình — Tú Audio',
          components: [
            { item: '1 Đôi Loa Full 25 CM Pro Nhỏ Gọn', role: 'Tiếng sáng rõ, trung âm dày dặn, không bí tiếng, phù hợp phòng nhỏ' },
            { item: 'Cục Đẩy Liền Vang Cơ Bluetooth 600W', role: 'Thiết kế 2 trong 1 cực kỳ gọn gàng, tiết kiệm diện tích kệ TV' },
            { item: 'Bộ Micro Không Dây CM 05 Chống Hú', role: 'Bắt sóng ổn định, củ mic hát nhẹ tôn giọng người hát yếu' },
            { item: 'Loa Sub Điện 30cm Gọn Nhẹ', role: 'Dải bass ấm êm dịu, không bị rung tường gây phiền toái căn hộ bên cạnh' }
          ],
          gifts: [
            'Tặng kèm bộ giá treo loa áp tường chịu lực chuyên dụng',
            'Dây quang Optical chính hãng kết nối trực tiếp Smart TV',
            '10m Dây loa bọc giáp đồng chống nhiễu',
            'Setup cài đặt âm học chuẩn phòng chung cư tận nơi',
            'Miễn phí vận chuyển tận nhà trong bán kính 300km'
          ]
        }
      ]

      for (const cb of defaultCombos) {
        const check = await query('SELECT id FROM combos WHERE id = $1', [cb.id])
        if (check.rows.length === 0) {
          await query(`
            INSERT INTO combos (
              id, name, tagline, price, fast_action_price, list_price, total_real_value,
              saved_amount, room_size, is_featured, badge, video_url, video_title
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [
            cb.id, cb.name, cb.tagline, cb.price, cb.fastActionPrice, cb.listPrice, cb.totalRealValue,
            cb.savedAmount, cb.roomSize, cb.isFeatured, cb.badge, cb.videoUrl, cb.videoTitle
          ])

          for (let i = 0; i < cb.components.length; i++) {
            await query(`
              INSERT INTO combo_components (combo_id, item_name, role_description, sort_order)
              VALUES ($1, $2, $3, $4)
            `, [cb.id, cb.components[i].item, cb.components[i].role, i + 1])
          }

          for (let i = 0; i < cb.gifts.length; i++) {
            await query(`
              INSERT INTO combo_gifts (combo_id, gift_description, sort_order)
              VALUES ($1, $2, $3)
            `, [cb.id, cb.gifts[i], i + 1])
          }
        }
      }

      // Tự động nạp sản phẩm mẫu vào Database PostgreSQL nếu bảng đang trống
      try {
        const prodCheck = await query('SELECT COUNT(*) as count FROM products')
        const count = Number(prodCheck.rows[0]?.count || 0)
        if (count < catalogProducts.length) {
          for (const p of catalogProducts) {
            await query(`
              INSERT INTO products (
                id, name, slug, category_id, bass_size, power_rms, power_peak, price, original_price,
                room_size, badge, in_stock, rating, reviews_count,
                image_url, video_url, video_title, matching_amplifier, short_desc, specs, gifts
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20::json, $21::json)
              ON CONFLICT (id) DO UPDATE SET
                price = EXCLUDED.price,
                original_price = EXCLUDED.original_price,
                image_url = EXCLUDED.image_url,
                short_desc = EXCLUDED.short_desc,
                specs = EXCLUDED.specs
            `, [
              p.id, p.name, p.slug || p.id, p.category || 'loa-full', p.bassSize || '-',
              Number(p.powerRMS) || 0, Number(p.powerPeak) || 0,
              Number(p.price) || 0, Number(p.originalPrice) || 0,
              p.roomSize || '20 - 35m²', p.badge || '',
              p.inStock ?? true, Number(p.rating) || 5.0, Number(p.reviewsCount) || 30,
              p.image || '', p.videoUrl || '', p.videoTitle || '',
              p.matchingAmplifier || '', p.shortDesc || '',
              JSON.stringify(p.specs || {}), JSON.stringify(p.gifts || [])
            ])
          }
        }
      } catch (prodSeedErr) {
        console.warn('⚠️ Lỗi nạp sản phẩm mặc định vào DB:', prodSeedErr.message)
      }
    } catch (seedErr) {
      console.warn('⚠️ Lỗi nạp combo mặc định:', seedErr.message)
    }
  } catch (err) {
    console.error('⚠️ Cảnh báo kiểm tra schema khi khởi động:', err.message)
  }
}

// ==========================================
// HỆ THỐNG QUẢN TRỊ AN NINH & TƯỜNG LỬA (WAF APIS)
// ==========================================

// Lấy danh sách IP đang bị giam cầm bởi WAF
app.get('/api/v1/admin/security/blocked-ips', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), (req, res) => {
  res.json({
    success: true,
    data: getWafBlockedIps()
  })
})

// Mở khóa IP thủ công (Unban IP)
app.post('/api/v1/admin/security/unban-ip', authenticateAdmin, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { ip } = req.body
    if (!ip) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ IP cần mở khóa.' })
    const unbanned = unbanWafIp(ip)
    if (unbanned) {
      await recordAuditLog({
        admin: req.admin,
        action: 'SECURITY_WAF_IP_UNBANNED',
        actionType: 'SECURITY',
        targetType: 'waf_threat',
        targetId: ip,
        summary: `Quản trị viên ${req.admin.name} đã mở khóa IP ${ip} khỏi danh sách đen Tường Lửa.`,
        details: { ip },
        req
      })
    }
    res.json({
      success: true,
      message: unbanned ? `Đã mở khóa IP ${ip} thành công.` : `Địa chỉ IP ${ip} không nằm trong danh sách đang bị khóa.`
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Khởi chạy máy chủ
ensureDatabaseSchema().finally(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Backend API Server đang chạy tại: http://localhost:${PORT}`)
    if (canReadFacebookPageInbox()) {
      syncFacebookConversations({ force: true }).catch(() => {})
    }
    setInterval(() => {
      if (canReadFacebookPageInbox()) syncFacebookConversations().catch(() => {})
    }, 30000).unref()
  })
})

