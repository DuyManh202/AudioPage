import { query } from './db.js'
import { catalogProducts } from './catalogProducts.js'

async function seed() {
  try {
    console.log(`Bắt đầu đồng bộ ${catalogProducts.length} sản phẩm vào Aiven PostgreSQL...`)
    
    // Đảm bảo các danh mục tồn tại trước
    const categories = [
      ['loa-full', 'Loa Full Karaoke', 'loa-full-karaoke', 'Loa bass 25, 30, 40cm sáng tiếng, chống hú', 'speaker', 1],
      ['loa-sub', 'Loa Subwoofer Trầm', 'loa-subwoofer', 'Sub điện 30cm, Sub hơi 40-50cm bass đánh lực', 'disc', 2],
      ['dan-karaoke', 'Dàn Karaoke Trọn Bộ', 'dan-karaoke-tron-bo', 'Các bộ dàn phối ghép tối ưu chuẩn quán hát', 'music', 3],
      ['loa-di-dong', 'Loa Di Động / Loa Kéo', 'loa-di-dong-xach-tay', 'Loa xách tay biểu diễn dã ngoại, du lịch tiện lợi', 'radio', 4],
      ['cuc-day', 'Cục Đẩy Công Suất', 'cuc-day-cong-suat', 'Đẩy 2 kênh, 4 kênh Class H khuếch đại khỏe', 'cpu', 5],
      ['vang-so-micro', 'Vang Số & Micro', 'vang-so-micro', 'Vang số DSP chống hú, micro không dây', 'mic', 6]
    ]

    for (const cat of categories) {
      await query(`
        INSERT INTO categories (id, name, slug, description, icon, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description
      `, cat)
    }

    const existingRes = await query('SELECT id, slug FROM products')
    const existingBySlug = new Map()
    existingRes.rows.forEach(r => existingBySlug.set(r.slug, r.id))

    let updatedCount = 0
    let insertedCount = 0

    for (const p of catalogProducts) {
      const slug = p.slug || p.id
      const existingId = existingBySlug.get(slug)

      if (existingId) {
        // Cập nhật sản phẩm đã tồn tại theo existingId
        await query(`
          UPDATE products SET
            name = $2,
            category_id = $3,
            bass_size = $4,
            power_rms = $5,
            power_peak = $6,
            price = $7,
            original_price = $8,
            room_size = $9,
            badge = $10,
            in_stock = $11,
            rating = $12,
            reviews_count = $13,
            image_url = $14,
            video_url = $15,
            video_title = $16,
            matching_amplifier = $17,
            short_desc = $18,
            specs = $19::json,
            gifts = $20::json,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [
          existingId,
          p.name,
          p.category || 'loa-full',
          p.bassSize || '-',
          Number(p.powerRMS) || 0,
          Number(p.powerPeak) || 0,
          Number(p.price) || 0,
          Number(p.originalPrice) || 0,
          p.roomSize || '20 - 35m²',
          p.badge || '',
          p.inStock ?? true,
          Number(p.rating) || 5.0,
          Number(p.reviewsCount) || 30,
          p.image || '',
          p.videoUrl || null,
          p.videoTitle || null,
          p.matchingAmplifier || '',
          p.shortDesc || '',
          JSON.stringify(p.specs || {}),
          JSON.stringify(p.gifts || [])
        ])
        updatedCount++
      } else {
        // Thêm mới sản phẩm
        await query(`
          INSERT INTO products (
            id, name, slug, category_id, bass_size, power_rms, power_peak, price, original_price,
            room_size, badge, in_stock, rating, reviews_count,
            image_url, video_url, video_title, matching_amplifier, short_desc, specs, gifts
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20::json, $21::json)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            category_id = EXCLUDED.category_id,
            bass_size = EXCLUDED.bass_size,
            power_rms = EXCLUDED.power_rms,
            power_peak = EXCLUDED.power_peak,
            price = EXCLUDED.price,
            original_price = EXCLUDED.original_price,
            room_size = EXCLUDED.room_size,
            badge = EXCLUDED.badge,
            in_stock = EXCLUDED.in_stock,
            rating = EXCLUDED.rating,
            reviews_count = EXCLUDED.reviews_count,
            image_url = EXCLUDED.image_url,
            video_url = EXCLUDED.video_url,
            video_title = EXCLUDED.video_title,
            matching_amplifier = EXCLUDED.matching_amplifier,
            short_desc = EXCLUDED.short_desc,
            specs = EXCLUDED.specs,
            gifts = EXCLUDED.gifts,
            updated_at = CURRENT_TIMESTAMP
        `, [
          slug,
          p.name,
          slug,
          p.category || 'loa-full',
          p.bassSize || '-',
          Number(p.powerRMS) || 0,
          Number(p.powerPeak) || 0,
          Number(p.price) || 0,
          Number(p.originalPrice) || 0,
          p.roomSize || '20 - 35m²',
          p.badge || '',
          p.inStock ?? true,
          Number(p.rating) || 5.0,
          Number(p.reviewsCount) || 30,
          p.image || '',
          p.videoUrl || null,
          p.videoTitle || null,
          p.matchingAmplifier || '',
          p.shortDesc || '',
          JSON.stringify(p.specs || {}),
          JSON.stringify(p.gifts || [])
        ])
        existingBySlug.set(slug, slug)
        insertedCount++
      }
    }

    const check = await query('SELECT count(*) FROM products')
    console.log(`✅ Thành công! Đã cập nhật ${updatedCount} sản phẩm cũ, thêm mới ${insertedCount} sản phẩm mới.`)
    console.log(`📊 Tổng số sản phẩm trong cơ sở dữ liệu hiện tại: ${check.rows[0].count} sản phẩm.`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Lỗi khi nạp sản phẩm vào DB:', err)
    process.exit(1)
  }
}

seed()
