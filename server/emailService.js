import tls from 'node:tls'
import net from 'node:net'

/**
 * Trình gửi email bảo mật Tú Audio (Zero Dependency)
 * Hỗ trợ:
 * 1. Resend HTTP API nếu có RESEND_API_KEY
 * 2. Giao thức SMTP qua TLS (Port 465 / 587)
 * 3. Fallback chế độ Console Logger nếu chưa cấu hình SMTP (tránh treo hệ thống)
 */

// Hàm tạo giao diện HTML Email OTP thương hiệu Tú Audio
export const createOtpEmailTemplate = (otpCode, adminName = 'Quản trị viên') => {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mã Xác Minh Bảo Mật - Tú Audio</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 32px 30px; text-align: center; border-bottom: 1px solid #2d3748;">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; background: linear-gradient(135deg, #eab308 0%, #f59e0b 100%); color: #000; font-weight: 800; font-size: 20px; margin-bottom: 12px;">TA</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">TÚ AUDIO CRM</h1>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">Hệ Thống Quản Trị & Điều Hành Bán Hàng</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                Xin chào <strong>${adminName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                Hệ thống vừa nhận được yêu cầu đăng nhập vào trang quản trị Tú Audio. Dưới đây là mã xác thực 2 bước (OTP) dùng một lần của bạn:
              </p>

              <!-- OTP Code Display -->
              <div style="background: #090d16; border: 1px dashed #eab308; border-radius: 12px; padding: 22px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #eab308; display: block; margin-bottom: 8px; font-weight: 600;">Mã Xác Minh Bảo Mật</span>
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #fbbf24; font-family: monospace;">${otpCode}</span>
                <span style="font-size: 12px; color: #64748b; display: block; margin-top: 8px;">Hiệu lực trong vòng <strong>5 phút</strong></span>
              </div>

              <!-- Warning Notice -->
              <div style="background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; padding: 12px 14px; border-radius: 4px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #fca5a5; line-height: 1.5;">
                  <strong>Lưu ý bảo mật:</strong> Tuyệt đối không cung cấp mã OTP này cho bất kỳ ai, kể cả nhân viên kỹ thuật. Nếu bạn không thực hiện yêu cầu đăng nhập này, vui lòng đổi mật khẩu ngay lập tức.
                </p>
              </div>

              <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
                Email này được gửi tự động từ máy chủ bảo mật Tú Audio CRM.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #0a0e17; padding: 20px 30px; text-align: center; border-top: 1px solid #1e293b;">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                &copy; ${new Date().getFullYear()} Tú Audio. Bản quyền thuộc về Hệ thống Âm Thanh Tú Audio.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Gửi email qua SMTP socket trực tiếp (Hỗ trợ Port 465 SSL/TLS)
 */
const sendViaSmtpPort465 = (config, toEmail, subject, htmlBody) => {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({
      host: config.host,
      port: config.port,
      rejectUnauthorized: false
    }, () => {
      // Kết nối thành công
    })

    let step = 0
    let logBuffer = ''

    socket.setEncoding('utf8')

    const send = (cmd) => {
      socket.write(cmd + '\r\n')
    }

    socket.on('data', (data) => {
      logBuffer += data
      const lines = data.trim().split('\n')
      const lastLine = lines[lines.length - 1]
      const code = parseInt(lastLine.substring(0, 3), 10)

      if (code >= 400) {
        socket.end()
        return reject(new Error(`Lỗi SMTP (${code}): ${lastLine}`))
      }

      switch (step) {
        case 0: // Kết nối nhận 220
          if (code === 220) {
            step++
            send(`EHLO localhost`)
          }
          break
        case 1: // Nhận 250 từ EHLO
          if (code === 250) {
            step++
            send(`AUTH LOGIN`)
          }
          break
        case 2: // Nhận 334 yêu cầu Username base64
          if (code === 334) {
            step++
            send(Buffer.from(config.user).toString('base64'))
          }
          break
        case 3: // Nhận 334 yêu cầu Password base64
          if (code === 334) {
            step++
            send(Buffer.from(config.pass).toString('base64'))
          }
          break
        case 4: // Nhận 235 Authentication successful
          if (code === 235) {
            step++
            send(`MAIL FROM:<${config.user}>`)
          }
          break
        case 5: // Nhận 250 MAIL FROM OK
          if (code === 250) {
            step++
            send(`RCPT TO:<${toEmail}>`)
          }
          break
        case 6: // Nhận 250 RCPT TO OK
          if (code === 250) {
            step++
            send(`DATA`)
          }
          break
        case 7: // Nhận 354 Start mail input
          if (code === 354) {
            step++
            const fromName = config.fromName || 'Tú Audio CRM'
            const msg = [
              `From: "${fromName}" <${config.user}>`,
              `To: <${toEmail}>`,
              `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
              `MIME-Version: 1.0`,
              `Content-Type: text/html; charset=UTF-8`,
              `Content-Transfer-Encoding: base64`,
              ``,
              Buffer.from(htmlBody).toString('base64'),
              `.`
            ].join('\r\n')
            send(msg)
          }
          break
        case 8: // Nhận 250 Message queued for delivery
          if (code === 250) {
            socket.end()
            return resolve(true)
          }
          break
      }
    })

    socket.on('error', (err) => {
      reject(err)
    })

    socket.setTimeout(15000, () => {
      socket.destroy()
      reject(new Error('SMTP connection timed out after 15s'))
    })
  })
}

/**
 * Gửi email qua HTTP API của Resend (nếu có cấu hình RESEND_API_KEY)
 */
const sendViaResend = async (apiKey, toEmail, subject, htmlBody) => {
  const from = process.env.RESEND_FROM || 'Tú Audio CRM <onboarding@resend.dev>'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [toEmail],
      subject,
      html: htmlBody
    })
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Resend API Error (${res.status}): ${errorText}`)
  }
  return true
}

/**
 * Hàm điều phối gửi mã OTP chính
 * Tự động chọn kênh gửi phù hợp nhất: Resend -> SMTP -> Console Logger
 */
export const dispatchOtpEmail = async ({ toEmail, otpCode, adminName = 'Quản trị viên' }) => {
  const subject = `[Tú Audio] Mã xác thực đăng nhập: ${otpCode}`
  const htmlBody = createOtpEmailTemplate(otpCode, adminName)

  // 1. Nếu có cấu hình RESEND_API_KEY
  if (process.env.RESEND_API_KEY) {
    try {
      await sendViaResend(process.env.RESEND_API_KEY, toEmail, subject, htmlBody)
      console.log(`📧 [OTP SUCCESS] Đã gửi mã OTP tới email ${toEmail} qua Resend API`)
      return { sent: true, provider: 'resend' }
    } catch (err) {
      console.error(`⚠️ [OTP ERROR] Không thể gửi qua Resend:`, err.message)
    }
  }

  // 2. Nếu có cấu hình SMTP (Gmail, Zoho, Hostinger, ...)
  const smtpHost = process.env.SMTP_HOST
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10)

  if (smtpHost && smtpUser && smtpPass) {
    try {
      await sendViaSmtpPort465(
        {
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          pass: smtpPass,
          fromName: process.env.SMTP_FROM_NAME || 'Tú Audio CRM'
        },
        toEmail,
        subject,
        htmlBody
      )
      console.log(`📧 [OTP SUCCESS] Đã gửi mã OTP tới email ${toEmail} qua SMTP (${smtpHost})`)
      return { sent: true, provider: 'smtp' }
    } catch (err) {
      console.error(`⚠️ [OTP ERROR] Không thể gửi qua SMTP:`, err.message)
    }
  }

  // 3. Fallback chế độ dev / preview (Chưa cấu hình mail server)
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                TÚ AUDIO SECURITY OTP VERIFICATION              ║
╠════════════════════════════════════════════════════════════════╣
║ Tài khoản: ${adminName.padEnd(51)}║
║ Email nhận: ${toEmail.padEnd(50)}║
║ MÃ OTP XÁC THỰC: [ ${otpCode} ] (Có hiệu lực trong 5 phút)          ║
║ Trạng thái: Console Mode (Cần thêm SMTP_HOST/USER/PASS vào env)║
╚════════════════════════════════════════════════════════════════╝
  `)

  return {
    sent: false,
    provider: 'console',
    devOtp: otpCode,
    message: 'Máy chủ chưa cấu hình SMTP email. Đã xuất mã OTP ra log hệ thống.'
  }
}

/**
 * Ẩn email để hiển thị an toàn trên giao diện (vd: nguyenduy***@gmail.com)
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return ''
  const parts = email.split('@')
  if (parts.length !== 2) return email
  const [name, domain] = parts
  if (name.length <= 2) {
    return `${name.charAt(0)}***@${domain}`
  }
  const prefix = name.slice(0, 2)
  return `${prefix}***@${domain}`
}
