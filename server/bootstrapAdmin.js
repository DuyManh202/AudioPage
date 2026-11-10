import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { pool, query } from './db.js'

const username = process.env.BOOTSTRAP_ADMIN_USERNAME?.trim().toLowerCase()
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD
const fullName = process.env.BOOTSTRAP_ADMIN_FULL_NAME?.trim()
const phone = process.env.BOOTSTRAP_ADMIN_PHONE?.trim()

try {
  if (!/^[a-z0-9._-]{3,50}$/.test(username || '') || !password || password.length < 12 || password.length > 128 || !fullName || fullName.length > 100 || !phone) {
    throw new Error('Cần đặt BOOTSTRAP_ADMIN_USERNAME, PASSWORD (12+ ký tự), FULL_NAME và PHONE trong server/.env.')
  }

  const existing = await query("SELECT COUNT(*)::int AS count FROM admins WHERE role = 'SUPER_ADMIN' AND is_active = TRUE")
  if (existing.rows[0].count > 0) {
    throw new Error('Đã có SUPER_ADMIN đang hoạt động. Không tạo thêm tài khoản bootstrap.')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const result = await query(
    `INSERT INTO admins (id, username, password_hash, full_name, phone, role, is_active)
     VALUES ($1, $2, $3, $4, $5, 'SUPER_ADMIN', TRUE)
     RETURNING id, username, full_name, phone, role`,
    [randomUUID(), username, passwordHash, fullName, phone]
  )
  console.log(`Đã tạo quản trị viên cấp cao: ${result.rows[0].username}`)
} catch (error) {
  console.error(`Không thể tạo tài khoản quản trị: ${error.message}`)
  process.exitCode = 1
} finally {
  await pool.end()
}
