import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const { Pool } = pg

// Chuẩn hóa connection string loại bỏ sslmode để pg không ép rejectUnauthorized: true
const rawConnectionString = process.env.DATABASE_URL || ''
const cleanConnectionString = rawConnectionString
  .replace('?sslmode=require', '')
  .replace('&sslmode=require', '')

// Cấu hình kết nối PostgreSQL Aiven Cloud với SSL an toàn
export const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: {
    rejectUnauthorized: false // Cho phép chứng chỉ tự ký của cụm máy chủ đám mây Aiven
  }
})

pool.on('error', (err) => {
  console.error('[PostgreSQL Error]: Lỗi kết nối CSDL:', err.message)
})

export const query = (text, params) => pool.query(text, params)
