import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function runMigration() {
  console.log('----------------------------------------------------')
  console.log('🚀 Bắt đầu khởi tạo cơ sở dữ liệu trên Aiven PostgreSQL...')
  console.log('----------------------------------------------------')

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('HOST:PORT')) {
    console.error('❌ LỖI: Chưa cấu hình DATABASE_URL trong tệp server/.env!')
    console.error('👉 Vui lòng dán Service URI từ Aiven Console vào tệp server/.env trước khi chạy lệnh.')
    process.exit(1)
  }

  const sqlPath = path.join(__dirname, '..', 'database.sql')
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Không tìm thấy tệp SQL tại: ${sqlPath}`)
    process.exit(1)
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf-8')

  try {
    const client = await pool.connect()
    console.log('✅ Đã kết nối thành công đến máy chủ Aiven Cloud!')
    console.log('⏳ Đang thực thi các lệnh tạo bảng và nạp dữ liệu mẫu...')

    await client.query(sqlContent)
    client.release()

    console.log('🎉 KHỞI TẠO HOÀN TẤT: Toàn bộ bảng dữ liệu & Seed Data của Tú Audio đã sẵn sàng trên Aiven!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Lỗi khi thực thi migration trên PostgreSQL:', error.message)
    process.exit(1)
  }
}

runMigration()
