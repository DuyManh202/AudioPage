import tls from 'node:tls'

/**
 * Vercel Serverless Function: Gửi email OTP Tú Audio qua Gmail SMTPS (Port 465)
 * Cần thiết vì Render Free Tier chặn cổng 465/587 ra ngoài, trong khi Vercel mở cổng 465 100%.
 */
function sendSmtp(config, toEmail, subject, htmlBody) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({
      host: config.host,
      port: config.port,
      rejectUnauthorized: false
    })

    let step = 0
    socket.setEncoding('utf8')

    const send = (cmd) => socket.write(cmd + '\r\n')

    socket.on('data', (data) => {
      const lines = data.trim().split('\n')
      const lastLine = lines[lines.length - 1]
      const code = parseInt(lastLine.substring(0, 3), 10)

      if (code >= 400) {
        socket.end()
        return reject(new Error(`SMTP Error (${code}): ${lastLine}`))
      }

      switch (step) {
        case 0:
          if (code === 220) {
            step++
            send('EHLO localhost')
          }
          break
        case 1:
          if (code === 250) {
            step++
            send('AUTH LOGIN')
          }
          break
        case 2:
          if (code === 334) {
            step++
            send(Buffer.from(config.user).toString('base64'))
          }
          break
        case 3:
          if (code === 334) {
            step++
            send(Buffer.from(config.pass).toString('base64'))
          }
          break
        case 4:
          if (code === 235) {
            step++
            send(`MAIL FROM:<${config.user}>`)
          }
          break
        case 5:
          if (code === 250) {
            step++
            send(`RCPT TO:<${toEmail}>`)
          }
          break
        case 6:
          if (code === 250) {
            step++
            send('DATA')
          }
          break
        case 7:
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
        case 8:
          if (code === 250) {
            socket.end()
            return resolve(true)
          }
          break
      }
    })

    socket.on('error', (err) => reject(err))

    socket.setTimeout(12000, () => {
      socket.destroy()
      reject(new Error('SMTP timeout after 12s on Vercel'))
    })
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-otp-secret')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Chỉ chấp nhận phương thức POST' })
  }

  const secret = req.headers['x-otp-secret']
  const validSecret = process.env.JWT_SECRET || 'tuaudio_super_secret_auth_token_2026'

  if (secret !== validSecret && secret !== 'tuaudio_internal_relay_key') {
    return res.status(403).json({ success: false, message: 'Khóa xác thực relay không hợp lệ' })
  }

  const { toEmail, subject, htmlBody } = req.body || {}
  if (!toEmail || !htmlBody) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin toEmail hoặc htmlBody' })
  }

  try {
    const smtpUser = process.env.SMTP_USER || 'ndm2262002@gmail.com'
    const smtpPass = (process.env.SMTP_PASS || 'wdrhecwomjsusjuq').replace(/\s+/g, '')

    await sendSmtp(
      {
        host: 'smtp.gmail.com',
        port: 465,
        user: smtpUser,
        pass: smtpPass,
        fromName: process.env.SMTP_FROM_NAME || 'Tú Audio CRM'
      },
      toEmail,
      subject || 'Mã xác thực OTP - Tú Audio CRM',
      htmlBody
    )

    return res.status(200).json({ success: true, message: 'Đã gửi email thành công qua Vercel relay' })
  } catch (error) {
    console.error('Vercel relay error:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}
