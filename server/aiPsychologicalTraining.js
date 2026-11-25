import { query } from './db.js'

let cachedContext = ''
let lastCacheTime = 0
const CACHE_TTL_MS = 60000 // 1 phút

/**
 * Xóa cache huấn luyện để AI cập nhật kiến thức mới ngay lập tức
 */
export const clearAiPsychologicalTrainingCache = () => {
  cachedContext = ''
  lastCacheTime = 0
}

/**
 * Lấy toàn bộ kịch bản đào tạo tâm lý khách hàng đang kích hoạt để nhúng vào Prompt của Gemini AI
 */
export const getAiPsychologicalTrainingContext = async () => {
  const now = Date.now()
  if (cachedContext && (now - lastCacheTime < CACHE_TTL_MS)) {
    return cachedContext
  }

  try {
    const res = await query(`
      SELECT id, title, persona_type, psychological_trigger, customer_keywords, suggested_response 
      FROM ai_training_rules 
      WHERE is_active = TRUE 
      ORDER BY id ASC
    `)

    if (!res.rows || res.rows.length === 0) {
      return ''
    }

    const lines = [
      'CHIẾN THUẬT ĐỌC VỊ TỰ ĐỘNG & NGHỆ THUẬT TÂM SỰ ĐÁNH TRÚNG TÂM LÝ TỪNG KHÁCH HÀNG (TÚ AUDIO):',
      'Khi khách nhắn tin hoặc bình luận, bạn TỰ ĐỘNG đọc vị tâm lý để điều chỉnh giọng điệu và cách tiếp cận phù hợp nhất:',
      '- Với khách sành sỏi: Đàm đạo kỹ thuật sâu, tôn trọng và khen thiết bị họ đang sở hữu.',
      '- Với khách bình dân: Trò chuyện mộc mạc, ấm áp, gần gũi như anh em một nhà.',
      '- Với khách đau khổ vì dàn hát dở/hú rít: Đồng cảm sâu sắc nỗi ức chế trước, chỉ ra nguyên nhân cốt lõi sau.',
      '- Với khách e dè/sợ mua hớ: Tư vấn thật tâm, không vồ vập đòi số, mách nước giải pháp miễn phí trước.',
      'Dưới đây là các đòn bẩy tâm lý và bài học thực chiến để bạn vận dụng linh hoạt:'
    ]

    res.rows.forEach((r, idx) => {
      lines.push(`${idx + 1}. TÌNH HUỐNG [${r.title}]:`)
      lines.push(`   - Nỗi đau & Tâm lý ẩn sâu: ${r.psychological_trigger}`)
      if (r.customer_keywords) {
        lines.push(`   - Từ khóa nhận diện: "${r.customer_keywords}"`)
      }
      lines.push(`   - Định hướng phản hồi tâm lý: "${r.suggested_response}"`)
    })

    lines.push('\nMỤC TIÊU CỐT LÕI: Nói chuyện tự nhiên như người thật, thấu cảm sâu sắc, không ép bán hàng máy móc, khéo léo dẫn dắt để khách nể phục và chủ động kết nối Zalo/SĐT!')

    cachedContext = '\n\n' + lines.join('\n') + '\n\n'
    lastCacheTime = now
    return cachedContext
  } catch (err) {
    console.warn('[AI Psychological Training] Lỗi nạp kịch bản đào tạo:', err.message)
    return ''
  }
}
