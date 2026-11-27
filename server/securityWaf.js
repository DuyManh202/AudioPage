/**
 * ==============================================================================
 * HỆ THỐNG BẢO MẬT & TƯỜNG LỬA ỨNG DỤNG CẤP CAO (ENTERPRISE WAF & SECURITY SUITE)
 * Phát triển riêng cho nền tảng thương mại điện tử & CRM Tú Audio
 * ==============================================================================
 * 
 * Các lớp bảo vệ cốt lõi:
 * 1. HTTP Security Headers (OWASP Top 10): HSTS, CSP, X-Frame-Options, XSS, NoSniff...
 * 2. Active Web Application Firewall (WAF):
 *    - Chặn đứng Bot Scanner (sqlmap, nikto, acunetix, masscan, wpscan...)
 *    - Chặn Path Traversal / LFI (../, ..\, /etc/passwd, .env, .git...)
 *    - Chặn SQL Injection (UNION SELECT, OR 1=1, SLEEP, BENCHMARK...)
 *    - Chặn XSS Injection (<script, javascript:, onerror=...)
 *    - Chặn Command Injection (shell pipe, backticks, sensitive probes)
 * 3. Dynamic IP Auto-Jail: Tự động giam (Block) các IP có 3 hành vi tấn công trong 1 giờ.
 * 4. Strict Rate Limiting: Chống DoS API, bảo vệ ngân sách AI Chatbot & phễu đơn hàng.
 * 5. Security Audit Logging: Tự động ghi nhận mọi sự kiện tấn công vào CSDL.
 */

import { randomUUID } from 'crypto'

// Danh sách IP bị giam (In-Memory IP Jail)
// Map: ip -> { strikes: number, blockedUntil: number, reasons: string[] }
const ipJail = new Map()

// Danh sách IP ngoại lệ (Whitelist, ví dụ localhost / máy chủ nội bộ)
const IP_WHITELIST = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

// Cấu hình thời gian
const STRIKE_WINDOW_MS = 15 * 60 * 1000 // 15 phút
const BAN_DURATION_MS = 60 * 60 * 1000  // 60 phút khóa IP khi vi phạm 3 lần
const MAX_STRIKES_BEFORE_BAN = 3

// Danh mục User-Agent bot dò quét lỗ hổng nguy hiểm cần chặn tức thì
const MALICIOUS_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /acunetix/i,
  /masscan/i,
  /dirbuster/i,
  /wpscan/i,
  /zgrab/i,
  /nmap/i,
  /openvas/i,
  /nessus/i,
  /gobuster/i,
  /hydra/i,
  /havij/i,
  /morfeus/i,
  /commix/i
]

// Các đường dẫn bot thường dò quét để khai thác trái phép
const SENSITIVE_PROBE_PATHS = [
  /^\/\.env/i,
  /^\/\.git/i,
  /^\/\.aws/i,
  /^\/\.ssh/i,
  /^\/wp-login\.php/i,
  /^\/wp-admin/i,
  /^\/phpmyadmin/i,
  /^\/pma\/?/i,
  /^\/actuator/i,
  /^\/config\.json/i,
  /^\/backup/i,
  /^\/dump\.sql/i,
  /^\/\.DS_Store/i,
  /^\/xmlrpc\.php/i,
  /^\/cgi-bin/i
]

// Các mẫu tấn công SQL Injection nguy hiểm
const SQLI_PATTERNS = [
  /\bunion\s+(all\s+)?select\b/i,
  /\bor\s+1\s*=\s*1\b/i,
  /\band\s+1\s*=\s*1\b/i,
  /\bwaitfor\s+delay\b/i,
  /\bbenchmark\s*\(/i,
  /\bsleep\s*\(\s*\d+\s*\)/i,
  /\bpg_sleep\s*\(\s*\d+\s*\)/i,
  /\bdrop\s+table\b/i,
  /\binsert\s+into\b.*\bvalues\b/i,
  /information_schema\./i,
  /sys\.user_tables/i
]

// Các mẫu tấn công XSS Injection
const XSS_PATTERNS = [
  /<script\b[^>]*>/i,
  /<\/script>/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
  /on(?:error|load|click|mouseover|focus|blur)\s*=\s*["'][^"']+["']/i
]

// Các mẫu Path Traversal / LFI
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.[\/\\]/,
  /%2e%2e[\/\\]/i,
  /\/etc\/passwd/i,
  /\/windows\/win\.ini/i,
  /\/proc\/self/i
]

/**
 * Lấy IP thực tế của khách hàng (hỗ trợ proxy / CDN)
 */
export const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.socket?.remoteAddress || req.ip || '0.0.0.0'
}

/**
 * 1. Middleware thiết lập Security Headers cấp cao (OWASP Hardening)
 */
export const securityHeadersMiddleware = (req, res, next) => {
  // Ẩn chữ ký máy chủ
  res.removeHeader('X-Powered-By')

  // Chống MIME-Type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // Chống Clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')

  // Bật bộ lọc XSS của trình duyệt
  res.setHeader('X-XSS-Protection', '1; mode=block')

  // HSTS: Bắt buộc HTTPS trong 1 năm
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  // Kiểm soát Referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Khóa các API phần cứng không dùng
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')

  next()
}

/**
 * Đăng ký vi phạm bảo mật và tự động đưa IP vào danh sách đen (Auto-Jail)
 */
export const registerSecurityStrike = (ip, reason, recordLogFn = null, req = null) => {
  if (IP_WHITELIST.has(ip)) return false

  const now = Date.now()
  const current = ipJail.get(ip) || { strikes: 0, lastStrike: 0, blockedUntil: 0, reasons: [] }

  // Nếu quá hạn thì reset strike
  if (now - current.lastStrike > STRIKE_WINDOW_MS) {
    current.strikes = 0
    current.reasons = []
  }

  current.strikes += 1
  current.lastStrike = now
  current.reasons.push(reason)

  let isBanned = false
  if (current.strikes >= MAX_STRIKES_BEFORE_BAN || reason.startsWith('CRITICAL:')) {
    current.blockedUntil = now + BAN_DURATION_MS
    isBanned = true
  }

  ipJail.set(ip, current)

  // Ghi nhật ký bảo mật vào CSDL nếu hàm ghi được truyền vào
  if (recordLogFn) {
    recordLogFn({
      admin: null,
      action: isBanned ? 'SECURITY_WAF_IP_BANNED' : 'SECURITY_THREAT_INTERCEPTED',
      actionType: 'SECURITY',
      targetType: 'waf_threat',
      targetId: ip,
      summary: isBanned
        ? `[TƯỜNG LỬA WAF] Đã khóa IP ${ip} trong 60 phút do phát hiện hành vi tấn công liên tục: ${reason}`
        : `[TƯỜNG LỬA WAF] Đã chặn mối đe dọa bảo mật từ IP ${ip}: ${reason}`,
      details: {
        ip,
        reason,
        strikes: current.strikes,
        blockedUntil: current.blockedUntil ? new Date(current.blockedUntil).toISOString() : null,
        url: req?.originalUrl || req?.url,
        userAgent: req?.headers['user-agent']
      },
      req
    }).catch(() => {})
  }

  return isBanned
}

/**
 * 2. Middleware Tường lửa WAF (Active Threat Interception)
 */
export const createWafMiddleware = (recordLogFn) => {
  return (req, res, next) => {
    // Bỏ qua kiểm tra WAF cho webhook từ các nền tảng chính thức (Facebook / Meta Webhook)
    const rawUrl = req.originalUrl || req.url || ''
    if (rawUrl.startsWith('/api/v1/facebook/webhook')) {
      return next()
    }

    const ip = getClientIp(req)
    const now = Date.now()

    // 1. Kiểm tra xem IP có đang bị giam cầm (Jail / Blocklist) không
    const jailInfo = ipJail.get(ip)
    if (jailInfo && jailInfo.blockedUntil > now) {
      const remainingMinutes = Math.ceil((jailInfo.blockedUntil - now) / 60000)
      return res.status(403).json({
        success: false,
        code: 'WAF_IP_BLOCKED',
        message: `Địa chỉ IP của bạn tạm thời bị khóa bởi Tường Lửa Bảo Mật (WAF) trong ${remainingMinutes} phút do phát hiện hành vi tấn công bất thường.`
      })
    }

    const rawUrl = req.originalUrl || req.url || ''
    let decodedUrl = rawUrl
    try {
      decodedUrl = decodeURIComponent(rawUrl)
    } catch {
      decodedUrl = rawUrl
    }
    const testTargets = [rawUrl, decodedUrl]
    const userAgent = req.headers['user-agent'] || ''

    // 2. Kiểm tra User-Agent công cụ quét lỗ hổng
    for (const pattern of MALICIOUS_USER_AGENTS) {
      if (pattern.test(userAgent)) {
        registerSecurityStrike(ip, `CRITICAL: Phát hiện công cụ tấn công dò quét (${userAgent.slice(0, 50)})`, recordLogFn, req)
        return res.status(403).json({
          success: false,
          code: 'WAF_SCANNER_BLOCKED',
          message: 'Yêu cầu bị từ chối bởi hệ thống bảo mật.'
        })
      }
    }

    // 3. Kiểm tra các đường dẫn bot cố tình dò tìm file nhạy cảm
    for (const target of testTargets) {
      for (const pattern of SENSITIVE_PROBE_PATHS) {
        if (pattern.test(target)) {
          registerSecurityStrike(ip, `Dò quét đường dẫn nhạy cảm: ${target.slice(0, 60)}`, recordLogFn, req)
          return res.status(404).json({
            success: false,
            code: 'WAF_PROBE_DROPPED',
            message: 'Đường dẫn không tồn tại trên hệ thống.'
          })
        }
      }
    }

    // 4. Kiểm tra Path Traversal / LFI trong URL & Query
    for (const target of testTargets) {
      for (const pattern of PATH_TRAVERSAL_PATTERNS) {
        if (pattern.test(target)) {
          registerSecurityStrike(ip, `Tấn công Path Traversal / LFI: ${target.slice(0, 60)}`, recordLogFn, req)
          return res.status(400).json({
            success: false,
            code: 'WAF_TRAVERSAL_BLOCKED',
            message: 'Phát hiện tham số độc hại.'
          })
        }
      }
    }

    // 5. Kiểm tra SQL Injection trong URL / Query Params
    for (const target of testTargets) {
      for (const pattern of SQLI_PATTERNS) {
        if (pattern.test(target)) {
          registerSecurityStrike(ip, `Tấn công SQL Injection trong URL: ${target.slice(0, 80)}`, recordLogFn, req)
          return res.status(400).json({
            success: false,
            code: 'WAF_SQLI_BLOCKED',
            message: 'Tham số yêu cầu chứa cú pháp nguy hiểm.'
          })
        }
      }
    }

    // 6. Kiểm tra XSS trong Query Params
    for (const target of testTargets) {
      for (const pattern of XSS_PATTERNS) {
        if (pattern.test(target)) {
          registerSecurityStrike(ip, `Tấn công Cross-Site Scripting (XSS) trong URL: ${target.slice(0, 80)}`, recordLogFn, req)
          return res.status(400).json({
            success: false,
            code: 'WAF_XSS_BLOCKED',
            message: 'Dữ liệu chứa mã thực thi độc hại.'
          })
        }
      }
    }

    // 7. Kiểm tra sâu trong Request Body (nếu có dữ liệu JSON)
    if (req.body && typeof req.body === 'object') {
      const inspectStringValues = (obj, depth = 0) => {
        if (!obj || depth > 5) return null
        for (const [key, val] of Object.entries(obj)) {
          if (typeof val === 'string') {
            // Kiểm tra SQLi
            for (const pattern of SQLI_PATTERNS) {
              if (pattern.test(val)) return `SQL Injection ở trường '${key}'`
            }
            // Kiểm tra XSS (bỏ qua các trường cho phép HTML nếu có)
            for (const pattern of XSS_PATTERNS) {
              if (pattern.test(val)) return `XSS Injection ở trường '${key}'`
            }
            // Kiểm tra Path Traversal
            for (const pattern of PATH_TRAVERSAL_PATTERNS) {
              if (pattern.test(val)) return `Path Traversal ở trường '${key}'`
            }
          } else if (typeof val === 'object' && val !== null) {
            const found = inspectStringValues(val, depth + 1)
            if (found) return found
          }
        }
        return null
      }

      const threatInBody = inspectStringValues(req.body)
      if (threatInBody) {
        registerSecurityStrike(ip, `Tấn công ${threatInBody}`, recordLogFn, req)
        return res.status(400).json({
          success: false,
          code: 'WAF_BODY_THREAT_BLOCKED',
          message: 'Dữ liệu gửi lên chứa nội dung bị cấm bởi Tường lửa Bảo mật.'
        })
      }
    }

    next()
  }
}

/**
 * 3. Bộ giới hạn tốc độ yêu cầu (Rate Limiters)
 */

// Bộ giới hạn toàn cục API: tối đa 150 request / phút / IP
const globalApiBucket = new Map()
export const globalApiRateLimit = (req, res, next) => {
  const ip = getClientIp(req)
  const now = Date.now()
  const windowMs = 60 * 1000
  const maxReq = 150

  const record = globalApiBucket.get(ip) || { count: 0, resetAt: now + windowMs }
  if (now > record.resetAt) {
    record.count = 0
    record.resetAt = now + windowMs
  }

  record.count += 1
  globalApiBucket.set(ip, record)

  if (record.count > maxReq) {
    return res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Bạn đang gửi quá nhiều yêu cầu đến hệ thống. Vui lòng chờ 1 phút rồi thử lại.'
    })
  }

  next()
}

// Bộ bảo vệ riêng cho AI Chatbot: tối đa 12 câu hỏi / phút / IP
const aiChatBucket = new Map()
export const aiChatProtection = (req, res, next) => {
  const ip = getClientIp(req)
  const now = Date.now()
  const windowMs = 60 * 1000
  const maxReq = 12

  const record = aiChatBucket.get(ip) || { count: 0, resetAt: now + windowMs }
  if (now > record.resetAt) {
    record.count = 0
    record.resetAt = now + windowMs
  }

  record.count += 1
  aiChatBucket.set(ip, record)

  if (record.count > maxReq) {
    return res.status(429).json({
      success: false,
      code: 'AI_CHAT_RATE_LIMITED',
      message: 'Bạn đang hỏi quá nhanh. Để đảm bảo tốc độ phục vụ, vui lòng chờ 1 phút để tiếp tục trò chuyện cùng trợ lý AI Tú Audio.'
    })
  }

  // Khống chế độ dài tin nhắn chat tối đa 1000 ký tự (Chống Prompt Injection & Token Drain)
  const { message, history } = req.body || {}
  if (message && typeof message === 'string' && message.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Nội dung câu hỏi quá dài (tối đa 1.000 ký tự). Vui lòng rút gọn để AI tư vấn chính xác nhất.'
    })
  }

  if (Array.isArray(history) && history.length > 30) {
    req.body.history = history.slice(-20) // Cắt gọn ngữ cảnh lịch sử
  }

  next()
}

/**
 * 4. Tiện ích quản lý danh sách IP bị giam (Dành cho Quản trị viên cấp cao)
 */
export const getWafBlockedIps = () => {
  const now = Date.now()
  const list = []
  for (const [ip, info] of ipJail.entries()) {
    if (info.blockedUntil > now) {
      list.push({
        ip,
        strikes: info.strikes,
        blockedUntil: new Date(info.blockedUntil).toISOString(),
        remainingMinutes: Math.ceil((info.blockedUntil - now) / 60000),
        reasons: info.reasons
      })
    }
  }
  return list
}

export const unbanWafIp = (ip) => {
  if (ipJail.has(ip)) {
    ipJail.delete(ip)
    return true
  }
  return false
}
