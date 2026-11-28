/**
 * KHO THÔNG TIN CỐ ĐỊNH & CẤU HÌNH AI CONSULTANT V2 (CHẾ ĐỘ TÂM LÝ & CHUYỂN ĐỔI LEAD)
 * Áp dụng cho: Facebook Messenger, Fanpage Bình luận, Web Chat
 */

export const FIXED_KNOWLEDGE = {
  brand: 'Tú Audio',
  showroom: 'Số 220 đường Nguyễn Danh Phương, phường Hội Hợp, TP. Vĩnh Yên, tỉnh Vĩnh Phúc',
  hotline: '0984.259.898',
  zalo: '0984.259.898'
}

/**
 * TRÍCH XUẤT SĐT DI ĐỘNG VIỆT NAM (ĐA ĐỊNH DẠNG)
 */
export function extractPhoneNumber(text) {
  if (!text || typeof text !== 'string') return null
  if (text.includes('facebook.com') || text.includes('comment_id')) return null

  // Hỗ trợ: 0969755634, 0969.755.634, 0988 123 456, 0912-345-678, +84969755634
  const phoneRegex = /(?:\+?84|0)(?:[\s.\-_]*\d){9,10}\b/g
  const matches = text.match(phoneRegex)
  if (!matches) return null

  for (const m of matches) {
    const digits = m.replace(/\D/g, '')
    const normalized = digits.startsWith('84') ? `0${digits.slice(2)}` : digits
    if (/^0[35789]\d{8}$/.test(normalized) || /^02\d{9}$/.test(normalized)) {
      return normalized
    }
  }
  return null
}

/**
 * SCHEMA JSON CHO GEMINI RESPONSE SCHEMA
 */
export const GEMINI_REPLY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    reply: {
      type: 'STRING',
      description: 'Câu trả lời gửi cho khách hàng, tối đa 2 câu, dưới 40 từ.'
    }
  },
  required: ['reply']
}

/**
 * 20 CẶP VÍ DỤ FEW-SHOT CHUẨN TÂM LÝ & NGHIỆP VỤ TÚ AUDIO (ĐÃ ẨN DANH)
 */
export const FEW_SHOT_EXAMPLES = [
  // 1. Hỏi giá thiết bị lẻ cụ thể
  {
    input: 'Lọc xì số ETC LA-315 Pro giá bao nhiêu vậy shop?',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ mẫu lọc xì ETC LA-315 Pro bên em có sẵn hàng ạ. Bác cho em xin số Zalo để anh Tú gọi tư vấn phối ghép với dàn nhà mình và báo giá nét cho bác nhé!'
  },
  // 2. Đòi báo giá ngay tại chat
  {
    input: 'Báo giá ở đây luôn đi shop, gửi ở đây cũng được mà.',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ âm thanh cần xem dàn nhà mình đang dùng amply hay đẩy gì để ghép đúng tiếng bác ạ. Bác cho em xin số Zalo để anh Tú gọi trao đổi nhanh 1 phút nhé!'
  },
  // 3. Khách hỏi sửa loa / đóng thùng loa kéo (Từ chối rõ ràng)
  {
    input: 'Bên mình có nhận đóng thùng loa kéo và thay gân loa bass 30 không?',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ Tú Audio chuyên dàn karaoke gia đình và vang số chứ không nhận làm loa kéo hay đóng thùng loa bác nhé ạ. Cảm ơn bác đã quan tâm ạ!'
  },
  // 4. Khách hỏi chi phí căn chỉnh tận nhà
  {
    input: 'Chi phí căn chỉnh dàn karaoke tại nhà khoảng bao nhiêu tiền ạ?',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ bên em có nhận căn chỉnh tận nhà theo tuyến ghép chuyến bác nhé. Bác cho em xin số Zalo và dàn nhà mình đang dùng món gì để anh Tú liên hệ hỗ trợ ạ!'
  },
  // 5. Khách hỏi dây dẫn phụ kiện
  {
    input: 'Nhà mình có bán dây canon ra hoa sen nối trầm điện không? Dài 4m giá sao?',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ bên em có sẵn dây canon ra AV chống nhiễu chuyên dùng cho trầm điện bác nhé. Bác cho em xin số Zalo để anh Tú gọi kiểm tra đúng chân cắm và báo giá gửi bác ạ!'
  },
  // 6. Khách đã cho số điện thoại (Tuyệt đối không hỏi lại)
  {
    input: 'Số điện thoại của mình 0989387250 mình ở Hà Nội, mình dùng vang số',
    hasPhone: true,
    askedPhoneRecently: true,
    reply: 'Dạ em cảm ơn bác, em đã lưu số 0989387250 rồi ạ. Em báo anh Tú liên hệ qua Zalo hỗ trợ dàn nhà mình ngay bác nhé!'
  },
  // 7. Thu cũ đổi mới thiết bị
  {
    input: 'Em muốn đổi amply cũ lấy vang số mới thì bù trừ thế nào anh?',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ bên em có chính sách hỗ trợ thu cũ đổi mới rất tiện cho bác ạ. Bác chụp giúp em ảnh mặt sau amply cũ gửi qua Zalo 0984.259.898 để anh Tú định giá thu lại cho bác nhé!'
  },
  // 8. Báo lỗi hú rít / hát nặng tiếng
  {
    input: 'Dàn nhà em hát hú rít và nặng mic quá, có cách nào xử lý không shop?',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ tình trạng này thường do vang cắt dải tần chưa chuẩn hoặc lệch pha âm học bác nhé. Bác cho em xin số Zalo để anh Tú gọi bắt đúng bệnh cho dàn nhà mình ạ!'
  },
  // 9. Khách chào hỏi chung
  {
    input: 'Alo shop, bên mình có làm việc hôm nay không?',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ em chào bác ạ! Bác đang cần tư vấn dàn karaoke gia đình, nâng cấp thiết bị hay cần hỗ trợ kỹ thuật căn chỉnh vang vậy bác?'
  },
  // 10. Khách hỏi địa chỉ showroom
  {
    input: 'Showroom cửa hàng mình ở đâu vậy em?',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ showroom bên em ở Số 220 đường Nguyễn Danh Phương, P. Hội Hợp, TP. Vĩnh Yên, Vĩnh Phúc ạ. Bác cho em xin số Zalo để em gửi định vị chỉ đường cho bác nhé!'
  },
  // 11. Khách hỏi dàn karaoke trọn bộ
  {
    input: 'Tư vấn cho mình một bộ dàn karaoke gia đình hát hay chống hú với.',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ bên em có sẵn các cấu hình chuẩn phòng hát gia đình bác nhé. Bác cho em hỏi phòng khách nhà mình rộng khoảng bao nhiêu mét vuông và cho em xin số Zalo để anh Tú tư vấn nhé ạ!'
  },
  // 12. Khách vừa bị hỏi số gần đây (askedPhoneRecently = true) -> KHÔNG xin số lại
  {
    input: 'Phòng khách nhà tôi rộng khoảng 25 mét vuông, phòng kín.',
    hasPhone: false,
    askedPhoneRecently: true,
    reply: 'Dạ với phòng kín 25m2 thì đánh loa bass 30cm là tiếng phủ đều và ấm nhất bác nhé. Bác đang dùng sẵn cục đẩy hay amply gì chưa ạ?'
  },
  // 13. Khách so sánh với nơi khác
  {
    input: 'Bên em chỉnh vang có hay hơn thợ ngoài quán không?',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ mỗi nơi có thế mạnh riêng, bên em căn chỉnh bằng phần mềm chuyên sâu theo đúng chất giọng và phòng của bác ạ. Bác cho em xin số Zalo để anh Tú trao đổi kỹ hơn nhé!'
  },
  // 14. Khách hỏi nâng tiếng
  {
    input: 'Có nên lắp thêm nâng tiếng vào vang số không anh?',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ nếu vang số chuẩn rồi thì không cần lắp thêm nâng tiếng đâu bác nhé, ghép thừa dễ bị vỡ dải âm. Bác cho em xin số Zalo để anh Tú xem dàn nhà mình tư vấn chuẩn nhất ạ!'
  },
  // 15. Khách sợ mua hàng từ xa
  {
    input: 'Mình ở xa mua hàng có được kiểm tra thử tiếng không?',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ bác yên tâm ạ, anh Tú sẽ gọi điện trao đổi trực tiếp và hướng dẫn bác cách thử máy cho chuẩn. Bác cho em xin số Zalo để bên em liên hệ nhé ạ!'
  },
  // 16. Khách hỏi vang cơ hay vang số
  {
    input: 'Gia đình nên dùng vang cơ hay vang số thì dễ hát hơn shop?',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ vang số đời mới cài sẵn các chế độ bấm 1 chạm thì người già trẻ nhỏ đều hát rất nhẹ và chống hú tuyệt đối ạ. Bác cho em xin số Zalo để anh Tú tư vấn dòng phù hợp nhé!'
  },
  // 17. Khách hỏi giờ mở cửa
  {
    input: 'Cửa hàng mấy giờ mở cửa để mình ghé qua test loa?',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ showroom bên em mở cửa đón tiếp các bác từ sáng đến tối các ngày trong tuần ạ. Bác dự định ghé hôm nào cho em xin số Zalo để anh Tú đón tiếp chu đáo nhé!'
  },
  // 18. Khách hỏi chính sách bảo hành
  {
    input: 'Chế độ bảo hành thiết bị bên mình thế nào vậy?',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ mọi thiết bị bên em đều bảo hành chính hãng và hỗ trợ kỹ thuật trọn đời bác nhé. Bác cho em xin số Zalo để anh Tú gửi thông tin chi tiết cho bác ạ!'
  },
  // 19. Khách ở chung cư sợ ồn
  {
    input: 'Nhà mình ở chung cư thì dùng dàn gì để không bị dội tiếng sang hàng xóm?',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ ở chung cư quan trọng là căn dải trầm gọn gàng, hát nhỏ mà lời mic vẫn rõ nét bác nhé. Bác cho em xin số Zalo để anh Tú tư vấn cấu hình vừa vặn cho nhà mình ạ!'
  },
  // 20. Khách báo tiếng bị ù rền
  {
    input: 'Loa sub nhà mình bật lên tiếng bass cứ bị ù rền, nghe tức ngực lắm.',
    hasPhone: false,
    askedPhoneRecently: false,
    reply: 'Dạ tiếng ù rền thường do cắt tần số sub quá cao hoặc đặt sub ở góc phòng bị dội âm bác nhé. Bác chụp ảnh vị trí đặt loa gửi qua Zalo 0984.259.898 để anh Tú hướng dẫn xử lý ngay ạ!'
  }
]

/**
 * XÂY DỰNG PROMPT GEMINI RÚT GỌN VỚI KHỐI TÂM LÝ & FEW-SHOTS
 */
export function buildGeminiPromptV2({
  customerName = 'bác',
  messageText = '',
  historyText = '',
  hasPhone = false,
  askedPhoneRecently = false,
  isComment = false
}) {
  const fewShotsText = FEW_SHOT_EXAMPLES.map((ex, idx) =>
    `Ví dụ ${idx + 1}:
Khách: "${ex.input}"
Đã có SĐT: ${ex.hasPhone} | Vừa xin số gần đây: ${ex.askedPhoneRecently}
Trả lời: "${ex.reply}"`
  ).join('\n\n')

  const systemInstruction = `Bạn là trợ lý tư vấn âm thanh của ${FIXED_KNOWLEDGE.brand} (Showroom: ${FIXED_KNOWLEDGE.showroom}, Hotline/Zalo: ${FIXED_KNOWLEDGE.zalo}).

NHIỆM VỤ DUY NHẤT:
Lắng nghe nhu cầu của khách hàng, thấu hiểu tâm lý và khéo léo xin số Zalo/điện thoại để anh Tú liên hệ tư vấn chuyên sâu.

NGUYÊN TẮC TÂM LÝ BÁN HÀNG:
1. Thấu hiểu trước, đổi niềm tin: Đa số khách hát chưa hay là do cách phối ghép và căn chỉnh chưa đúng, chưa chắc thiết bị của khách đã dở.
2. Giảm rủi ro cho khách: Hướng dẫn khách chụp ảnh mặt sau dàn máy gửi qua Zalo để anh Tú xem đường cắm trước.
3. Nêu rõ lý do chính đáng: Giải thích vì sao cần số Zalo (để anh Tú xem dàn máy, tư vấn cổng cắm và báo mức giá tốt nhất).

QUY TẮC BẤT DI BẤT DỊCH:
1. TUYỆT ĐỐI KHÔNG BÁO GIÁ: Cấm nêu bất kỳ con số giá tiền nào (kể cả nghìn, triệu, tr, k). Báo giá là việc của anh Tú khi gọi điện.
2. KHÔNG TỰ BỊA THÔNG TIN SẢN PHẨM: Cấm tự khẳng định tồn kho, cấm bịa tính năng, cấm hứa gửi video test/quay ruột gan.
3. KHÔNG NHẬN LÀM LOA: Từ chối lịch sự nếu khách hỏi sửa loa, đóng thùng loa hoặc loa kéo. Tú Audio chuyên dàn karaoke gia đình và vang số.
4. QUY TẮC XIN SỐ ĐIỆN THOẠI:
   - Nếu khách ĐÃ CÓ SĐT (hasPhone = true) HOẶC VỪA ĐƯỢC XIN SỐ (askedPhoneRecently = true): TUYỆT ĐỐI CẤM XIN SỐ NỮA. Chỉ tập trung giải đáp thắc mắc hoặc xác nhận anh Tú sẽ liên hệ.
   - Nếu chưa có số và chưa xin gần đây: Khéo léo xin số Zalo/SĐT ở cuối câu.
5. HÌNH THỨC CÂU TRẢ LỜI:
   - Xưng "em", gọi khách là "bác" hoặc "anh" (theo tên khách).
   - Tối đa 2 câu, dưới 40 từ. Mỗi tin nhắn chỉ chứa tối đa 1 câu hỏi thăm nhu cầu.
   - Trả về đúng định dạng JSON có trường "reply".

DANH SÁCH 20 VÍ DỤ MẪU:
${fewShotsText}`

  const userContent = `${historyText ? 'LỊCH SỬ TIN NHẮN TRƯỚC ĐÓ:\n' + historyText + '\n\n' : ''}CÂU HỎI MỚI CỦA KHÁCH:
Tên khách: "${customerName}"
Nội dung: "${messageText}"
Trạng thái đã có SĐT: ${hasPhone}
Đã xin số gần đây: ${askedPhoneRecently}

Hãy trả về JSON với cấu trúc {"reply": "..."}`

  return { systemInstruction, userContent }
}

/**
 * BỘ KIỂM ĐỊNH CHECK REPLY (THAY THẾ HOÀN TOÀN verifyAndCleanOutput CŨ)
 * Trả về { ok: true, cleanedReply } hoặc { ok: false, reason: string }
 */
export function checkReply(reply, {
  finishReason = 'STOP',
  hasPhone = false,
  askedPhoneRecently = false,
  originalCustomerPhone = null,
  recentOuts = []
} = {}) {
  if (!reply || typeof reply !== 'string') {
    return { ok: false, reason: 'EMPTY_REPLY' }
  }

  const trimmed = reply.trim()

  // 1. Kiểm tra finishReason
  if (finishReason && finishReason !== 'STOP') {
    return { ok: false, reason: 'FINISH_REASON_' + finishReason }
  }

  // 2. Chặn số tiền (triệu, tr, k, nghìn, 000đ, đ, vnd)
  const priceRegex = /\b\d+([.,]\d+)?\s*(triệu|tr|nghìn|k|000đ|000|đ|vnd|vnđ)\b/i
  if (priceRegex.test(trimmed)) {
    return { ok: false, reason: 'CONTAINS_PRICE' }
  }

  // 3. Chặn từ cam kết / khan hiếm / khuyến mãi ảo
  const forbiddenPromoRegex = /\b(miễn phí|cam kết|đảm bảo|chỉ hôm nay|duy nhất|bảo hành \d+|trả góp|giảm giá sốc)\b/i
  if (forbiddenPromoRegex.test(trimmed)) {
    return { ok: false, reason: 'CONTAINS_FORBIDDEN_PROMISE_WORD' }
  }

  // 4. Chặn từ hứa hẹn video
  if (/\b(video|clip|quay ruột)\b/i.test(trimmed)) {
    return { ok: false, reason: 'CONTAINS_VIDEO_PROMISE' }
  }

  // 5. Kiểm tra số điện thoại nhắc lại trong tin nhắn
  const foundPhone = extractPhoneNumber(trimmed)
  if (foundPhone) {
    const isShopPhone = foundPhone === '0984259898'
    const isCustomerPhone = originalCustomerPhone && foundPhone === originalCustomerPhone.replace(/\D/g, '')
    if (!isShopPhone && !isCustomerPhone) {
      return { ok: false, reason: 'FABRICATED_PHONE_NUMBER' }
    }
  }

  // 6. Kiểm tra xin số lặp
  const askPhoneRegex = /(xin số|cho em xin số|xin sđt|xin số zalo|nhắn số zalo|cho em số)/i
  if ((hasPhone || askedPhoneRecently) && askPhoneRegex.test(trimmed)) {
    return { ok: false, reason: 'REDUNDANT_PHONE_REQUEST' }
  }

  // 7. Chuẩn hóa để đếm câu chính xác
  // Sử dụng lookbehind/lookahead unicode chuẩn để chỉ khớp 'TP.' hoặc 'P.' đứng riêng
  const normalizedForSentenceCount = trimmed
    .replace(/(?<=\d)\.(?=\d)/g, '') // xóa chấm trong số
    .replace(/(?<!\p{L})(tp|p)\./giu, '$1') // chỉ khớp TP. và P.
    .replace(/^(dạ\s+(?:em\s+)?(?:chào|cảm ơn)[^.!?…\n]{1,35})[!]/iu, '$1,') // gộp dấu ! sau lời chào ngắn

  const sentences = normalizedForSentenceCount.split(/[.!?…]+/).map(s => s.trim()).filter(Boolean)
  if (sentences.length > 2) {
    return { ok: false, reason: 'TOO_MANY_SENTENCES_' + sentences.length }
  }

  // 8. Đếm số từ (tối đa 40 từ)
  const wordCount = trimmed.split(/\s+/).length
  if (wordCount > 40) {
    return { ok: false, reason: 'TOO_MANY_WORDS_' + wordCount }
  }

  // 9. Kiểm tra câu cụt (phải kết thúc bằng dấu câu hợp lệ)
  if (!/[.!?…ạa]$/u.test(trimmed)) {
    return { ok: false, reason: 'INCOMPLETE_PUNCTUATION' }
  }

  // 10. Chống lặp tin với các tin nhắn OUT gần đây
  const normalizeForCompare = (s) => (s || '').replace(/[^a-z0-9à-ỹ]/gi, '').toLowerCase()
  const replyNorm = normalizeForCompare(trimmed)
  if (recentOuts.some(outMsg => normalizeForCompare(outMsg) === replyNorm)) {
    return { ok: false, reason: 'DUPLICATE_RECENT_MESSAGE' }
  }

  return { ok: true, cleanedReply: trimmed }
}

/**
 * HÀM getAiReply: VÒNG LẶP GỌI GEMINI TỐI ĐA 3 LẦN VỚI CƠ CHẾ TỰ SỬA LỖI
 */
export async function getAiReply({
  callGeminiFn,
  customerName = 'bác',
  messageText = '',
  historyText = '',
  hasPhone = false,
  askedPhoneRecently = false,
  originalCustomerPhone = null,
  recentOuts = [],
  maxRetries = 3
}) {
  let correctionNote = ''

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const promptInput = {
      customerName,
      messageText: correctionNote ? `${messageText}\n\n[LƯU Ý QUAN TRỌNG: Câu trước bị từ chối vì "${correctionNote}". Hãy viết lại ngắn gọn, tối đa 2 câu, dưới 40 từ, tuân thủ tuyệt đối quy tắc!]` : messageText,
      historyText,
      hasPhone,
      askedPhoneRecently,
      isComment: false
    }

    const { systemInstruction, userContent } = buildGeminiPromptV2(promptInput)

    let rawReply = ''
    let finishReason = 'STOP'

    try {
      const geminiData = await callGeminiFn({ systemInstruction, userContent })
      const cand = geminiData?.candidates?.[0]
      finishReason = cand?.finishReason || 'STOP'
      const rawText = cand?.content?.parts?.[0]?.text?.trim() || ''

      // Parse JSON
      if (rawText.includes('{')) {
        try {
          const jsonStr = rawText.replace(/```json/gi, '').replace(/```/g, '').trim()
          const parsed = JSON.parse(jsonStr)
          rawReply = parsed.reply || parsed.message || parsed.phan_hoi || rawText
        } catch {
          rawReply = rawText
        }
      } else {
        rawReply = rawText
      }
    } catch (apiErr) {
      console.warn(`[getAiReply] Lỗi gọi Gemini attempt ${attempt}:`, apiErr.message)
      if (attempt === maxRetries) {
        return { ok: false, handoff: true, reason: 'API_ERROR: ' + apiErr.message }
      }
      continue
    }

    const check = checkReply(rawReply, {
      finishReason,
      hasPhone,
      askedPhoneRecently,
      originalCustomerPhone,
      recentOuts
    })

    if (check.ok) {
      return { ok: true, reply: check.cleanedReply, attempts: attempt }
    }

    console.warn(`[getAiReply] Lần ${attempt} không đạt: ${check.reason}. Nội dung: "${rawReply}"`)
    correctionNote = check.reason
  }

  // Sau 3 lần vẫn không đạt -> Báo handoff cho anh Tú, KHÔNG gửi tin mặc định
  return {
    ok: false,
    handoff: true,
    reason: `FAILED_AFTER_${maxRetries}_ATTEMPTS: ${correctionNote}`
  }
}

/**
 * HÀM TƯƠNG THÍCH NGƯỢC CHO aiChat.js VÀ facebookCommentHandler.js
 */
export function verifyAndCleanOutput({ rawReply, finishReason, hasPhone, isComment, recentOuts }) {
  const result = checkReply(rawReply, { finishReason, hasPhone, recentOuts })
  if (result.ok) {
    return { ok: true, cleanedReply: result.cleanedReply }
  }
  return { ok: false, reason: result.reason, fallback: null }
}

export const TEMPLATES = {
  M01_CHAO: 'Dạ em chào bác ạ! Bác đang cần tư vấn dàn karaoke gia đình hay hỗ trợ kỹ thuật căn chỉnh vang vậy bác?',
  M02_DIA_CHI: `Dạ showroom bên em ở ${FIXED_KNOWLEDGE.showroom} ạ. Bác cho em xin số Zalo để em gửi định vị chỉ đường cho bác nhé!`,
  M19_DA_NHAN_SDT: (phone) => `Dạ em cảm ơn bác, em đã lưu số ${phone} rồi ạ. Em báo anh Tú liên hệ qua Zalo hỗ trợ dàn nhà mình ngay bác nhé!`,
  M20_DA_CO_SDT_NHAN_TIEP: 'Dạ em đã chuyển thông tin của bác cho anh Tú rồi ạ, anh ấy sẽ liên hệ với bác sớm nhất.',
  M23_DU_PHONG_LOI: 'Dạ em đã nhận tin của bác rồi ạ. Em báo anh Tú liên hệ hỗ trợ bác ngay nhé ạ!'
}
