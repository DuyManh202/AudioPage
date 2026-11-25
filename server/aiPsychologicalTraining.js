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
      'CHIẾN THUẬT ĐỌC VỊ VÀ ĐÁNH TRÚNG TÂM LÝ TỪNG KHÁCH HÀNG CỦA TÚ AUDIO (BẮT BUỘC ÁP DỤNG 100%):',
      'Khi khách hàng nhắn tin hoặc bình luận, bạn PHẢI phân tích câu từ để nhận diện khách thuộc nhóm tâm lý nào sau đây và xuất chiêu chính xác, không dùng văn mẫu chung chung:'
    ]

    res.rows.forEach((r, idx) => {
      lines.push(`${idx + 1}. NHÓM [${r.title}]:`)
      lines.push(`   - Tâm lý & Nỗi đau: ${r.psychological_trigger}`)
      if (r.customer_keywords) {
        lines.push(`   - Dấu hiệu nhận diện từ câu của khách: "${r.customer_keywords}"`)
      }
      lines.push(`   - Đòn bẩy trả lời mẫu (chuẩn phong cách anh Tú): "${r.suggested_response}"`)
    })

    lines.push('\nMỤC TIÊU TỐI THƯỢNG: Thấu cảm nỗi đau của khách, khẳng định uy tín chuyên gia đo RTA chuẩn âm học, không bao giờ từ chối khách và khéo léo lấy được SỐ ĐIỆN THOẠI / ZALO để kết nối tư vấn chuyên sâu!')

    cachedContext = '\n\n' + lines.join('\n') + '\n\n'
    lastCacheTime = now
    return cachedContext
  } catch (err) {
    console.warn('[AI Psychological Training] Lỗi nạp kịch bản đào tạo:', err.message)
    return ''
  }
}
