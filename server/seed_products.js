import { query } from './db.js'
import { catalogProducts } from './catalogProducts.js'

async function seed() {
  try {
    console.log(`Bắt đầu nạp ${catalogProducts.length} sản phẩm vào Aiven PostgreSQL...`)
    
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

    let inserted = 0
    for (const p of catalogProducts) {
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
        p.id, p.name, p.slug || p.id, p.category || 'loa-full', p.bassSize || '-',
        Number(p.powerRMS) || 0, Number(p.powerPeak) || 0,
        Number(p.price) || 0, Number(p.originalPrice) || 0,
        p.roomSize || '20 - 35m²', p.badge || '',
        p.inStock ?? true, Number(p.rating) || 5.0, Number(p.reviewsCount) || 30,
        p.image || '', p.videoUrl || '', p.videoTitle || '',
        p.matchingAmplifier || '', p.shortDesc || '',
        JSON.stringify(p.specs || {}), JSON.stringify(p.gifts || [])
      ])
      inserted++
    }

    const check = await query('SELECT count(*) FROM products')
    console.log(`✅ Thành công! Đã nạp ${inserted} sản phẩm. Tổng số sản phẩm trong DB hiện tại: ${check.rows[0].count}`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Lỗi khi nạp sản phẩm vào DB:', err)
    process.exit(1)
  }
}

seed()
