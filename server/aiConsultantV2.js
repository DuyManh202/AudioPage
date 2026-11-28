/**
 * KHO THÔNG TIN CỐ ĐỊNH & CẤU HÌNH AI CONSULTANT V2
 * TÚ AUDIO - BỘ NGUYÊN TẮC TƯ VẤN CHUYÊN NGHIỆP & CHUYỂN ĐỔI LEAD ZALO
 * Áp dụng cho: Facebook Messenger, Fanpage Bình luận, Web Chat
 */

export const FIXED_KNOWLEDGE = {
  brand: 'Tú Audio',
  showroom: 'Số 220 đường Nguyễn Danh Phương, phường Hội Hợp, TP. Vĩnh Yên, tỉnh Vĩnh Phúc',
  hotline: '0984.259.898',
  zalo: '0984.259.898',
  warranty: 'Bảo hành chính hãng 1 năm (12 tháng), hỗ trợ kỹ thuật trọn đời'
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
 * PHÂN TÍCH VÀ KIỂM ĐỊNH SỐ ĐIỆN THOẠI KHÁCH HÀNG (ĐÚNG HAY SAI CHUẨN XÁC)
 */
export function validateVietnamesePhone(text) {
  if (!text || typeof text !== 'string') return { hasPhoneInput: false }
  if (text.includes('facebook.com') || text.includes('comment_id')) return { hasPhoneInput: false }

  const phonePattern = /(?:\+?84|0)(?:[\s.\-_]*\d){6,14}\b/g
  const matches = text.match(phonePattern)
  if (!matches) return { hasPhoneInput: false }

  for (const raw of matches) {
    const digits = raw.replace(/\D/g, '')
    const normalized = digits.startsWith('84') ? `0${digits.slice(2)}` : digits

    // Bỏ qua nếu là số tiền (ví dụ: 500000, 1000000, 2000000 kèm k/đ/tr)
    if (/(500000|1000000|2000000)/.test(normalized) && /(k|đ|vnd|triệu|tr)/i.test(text)) {
      continue
    }

    const len = normalized.length

    // 1. Số di động chuẩn Việt Nam: 10 chữ số, đầu 03, 05, 07, 08, 09
    if (/^0[35789]\d{8}$/.test(normalized)) {
      return {
        hasPhoneInput: true,
        isValid: true,
        phone: normalized,
        raw
      }
    }

    // 2. Số cố định chuẩn: 10 hoặc 11 chữ số, đầu 02
    if (/^02\d{8,9}$/.test(normalized)) {
      return {
        hasPhoneInput: true,
        isValid: true,
        phone: normalized,
        raw
      }
    }

    // 3. Khách gõ số nhưng sai/thiếu/thừa chữ số
    if (/^0\d{6,13}$/.test(normalized)) {
      let message = ''
      if (len < 10) {
        message = `Dạ hình như số điện thoại/Zalo bác vừa gửi bị thiếu số (mới có ${len} chữ số) ạ. Bác kiểm tra lại và gửi lại giúp em đủ 10 số để chuyên gia Tú Audio liên hệ hỗ trợ dàn nhà mình nhé!`
      } else if (len > 10) {
        message = `Dạ số điện thoại bác vừa gửi có ${len} chữ số, hình như bị thừa số hoặc là đầu số cũ ạ. Bác kiểm tra lại giúp em số điện thoại chuẩn 10 số để bên em liên hệ nhé!`
      } else {
        message = `Dạ đầu số ${normalized.slice(0, 3)}... bác vừa gửi hình như chưa đúng đầu số di động hiện hành ạ. Bác kiểm tra lại giúp em số Zalo/điện thoại chuẩn để chuyên gia Tú Audio liên hệ nhé!`
      }

      return {
        hasPhoneInput: true,
        isValid: false,
        phone: normalized,
        raw,
        length: len,
        message
      }
    }
  }

  return { hasPhoneInput: false }
}

/**
 * SCHEMA JSON CHO GEMINI RESPONSE SCHEMA
 */
export const GEMINI_REPLY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    reply: {
      type: 'STRING',
      description: 'Câu trả lời gửi cho khách hàng, ngắn gọn 1-3 câu, dưới 55 từ.'
    }
  },
  required: ['reply']
}

/**
 * 20 CẶP VÍ DỤ FEW-SHOT CHUẨN 3 NGUYÊN TẮC TÂM LÝ & NGHIỆP VỤ TÚ AUDIO
 */
export const FEW_SHOT_EXAMPLES = [
  // 1. Khách hỏi sản phẩm không có sẵn trên web (Loa BMB bãi)
  {
    input: 'Bên shop có bán loa BMB 2000SE bãi xịn không?',
    hasPhone: false,
    reply: 'Dạ bên em để giá bằng giá thấp nhất trên mạng mà bác tham khảo ạ. Dòng này bên em đang sẵn mẫu loa AMEK CF-12 bass 30cm hát rất sáng tiếng, bác cho em xin số Zalo để nhận ưu đãi giá tốt nhé!'
  },
  // 2. Khách hỏi sản phẩm không có trên web (Vang số Tripath X5)
  {
    input: 'Vang số X5 bãi bên em bán bao nhiêu tiền?',
    hasPhone: false,
    reply: 'Dạ bên em để giá bằng giá thấp nhất trên mạng mà bác tham khảo ạ. Dòng này bên em có sẵn vang số UK-3000 Pro chip xử lý mới hơn, bác gửi thông tin qua Zalo cho tiện nhé, ở Facebook nhiều người nhắn dễ trôi tin ạ!'
  },
  // 3. Khách hỏi sản phẩm không có trên web (Đẩy Crown)
  {
    input: 'Shop có đẩy bãi Crown 3600 không giá sao?',
    hasPhone: false,
    reply: 'Dạ bên em để giá bằng giá thấp nhất trên mạng mà bác tham khảo ạ. Dòng này bên em có sẵn đẩy AMEK D-750 và D-2800 đánh rất lực, bác gửi số Zalo trước để em lưu lại, nếu không tiện nghe thì bên em nhắn tin thôi cũng được ạ!'
  },
  // 4. Khách hỏi dịch vụ căn chỉnh chung
  {
    input: 'Bên mình có nhận căn chỉnh dàn karaoke tại nhà không shop?',
    hasPhone: false,
    reply: 'Dạ bên em có nhận căn chỉnh tận nhà bác nhé. Bác chụp giúp em ảnh bộ dàn hoặc gửi tên các thiết bị, và cho em xin số Zalo để trao đổi cụ thể về vị trí và thời gian làm việc ạ!'
  },
  // 5. Khách hỏi giá căn chỉnh setup vang số (Lần 1 - Bước 1)
  {
    input: 'Căn chỉnh vang số tại nhà giá bao nhiêu tiền vậy shop?',
    hasPhone: false,
    reply: 'Dạ bác chụp giúp em ảnh bộ dàn hoặc gửi tên các thiết bị trong nhà nhé. Bác cho em xin số Zalo để nói chuyện cụ thể về vị trí và thời gian làm việc ạ!'
  },
  // 6. Khách gặng hỏi giá căn chỉnh (Lần 2 - Bước 2)
  {
    input: 'Cứ báo chi phí căn chỉnh khoảng bao nhiêu trước đi để tôi xem.',
    hasPhone: false,
    reply: 'Dạ chi phí tùy thuộc vào khoảng cách và dàn thiết bị nhà mình bác ạ. Bác cho em xin số Zalo để tiện gửi định vị vị trí nhà nhé, ở Facebook này không gửi được vị trí ạ!'
  },
  // 7. Khách cố tình hỏi giá trước sau 3 lần xin số Zalo vẫn chưa cho (Bước 3)
  {
    input: 'Tôi muốn biết giá trước thì mới cho số được, cứ nói tầm bao nhiêu tiền?',
    hasPhone: false,
    reply: 'Dạ phí căn chỉnh từ 500k đến 1tr, thậm chí tiện tuyến đường ghép chuyến bên em có thể căn chỉnh miễn phí, thợ ngoài thường lấy 2 triệu 1 lần ạ. Nhưng bên em chỉ ưu đãi khi có số Zalo, bác gửi số để bên em hỗ trợ nhé!'
  },
  // 8. Xin số Zalo - Lý do 1: Có ưu đãi qua Zalo
  {
    input: 'Dàn nhà mình hát tiếng mic cứ bị nặng và bí, tư vấn giúp mình.',
    hasPhone: false,
    reply: 'Dạ tiếng nặng thường do căn chỉnh dải Mid và cắt tần số mic chưa chuẩn bác ạ. Bác cho em xin số Zalo để bên em gửi ưu đãi hỗ trợ cho dàn nhà mình nhé!'
  },
  // 9. Xin số Zalo - Lý do 2: Gửi thông tin qua Zalo cho tiện, chống trôi tin Facebook
  {
    input: 'Bên mình có cục đẩy công suất nào đánh đôi loa bass 30 không?',
    hasPhone: false,
    reply: 'Dạ bên em có sẵn đẩy AMEK D-750 công suất thực chuyên trị bass 30 bác nhé. Bác gửi thông tin qua Zalo cho tiện nhé, ở Facebook này nhiều người nhắn quá dễ bị trôi mất tin nhắn ạ!'
  },
  // 10. Xin số Zalo - Lý do 3: Zalo gửi được định vị vị trí nhà
  {
    input: 'Mình ở Ba Vì Hà Nội, bên bạn có qua lắp đặt được không?',
    hasPhone: false,
    reply: 'Dạ bên em phục vụ tận nhà theo tuyến ghép chuyến bác nhé. Bác cho em xin số Zalo để gửi định vị, vị trí nhà cho tiện, ở Facebook này không gửi được vị trí ạ!'
  },
  // 11. Xin số Zalo - Lý do 4: Lưu số trước, không tiện nghe thì nhắn tin
  {
    input: 'Tôi đang bận đi làm không tiện nghe điện thoại đâu.',
    hasPhone: false,
    reply: 'Dạ bác cứ gửi số Zalo trước để bên em lưu lại, nếu bác không tiện nghe máy thì bên em nhắn tin thôi cũng được nhé bác!'
  },
  // 12. Khách ĐÃ CHO SỐ ZALO (hasPhone = true) -> Bảo chờ chuyên gia Tú Audio, KHÔNG xin số nữa
  {
    input: 'Số Zalo của tôi 0989387250, mình ở Đông Anh',
    hasPhone: true,
    reply: 'Dạ em cảm ơn bác, em đã lưu số 0989387250 rồi ạ. Bác chờ chút chuyên gia Tú Audio sẽ liên hệ tư vấn trực tiếp cho bác ngay nhé!'
  },
  // 13. Khách đã có số Zalo nhắn tiếp (hasPhone = true) -> Tiếp tục trao đổi, cấm xin lại
  {
    input: 'Dàn nhà mình đang dùng amply Jarguar 203N',
    hasPhone: true,
    reply: 'Dạ em đã ghi chú dàn nhà mình đang dùng amply Jarguar rồi ạ. Bác chờ chuyên gia Tú Audio liên hệ trao đổi chi tiết phương án nâng cấp cho nhà mình nhé!'
  },
  // 14. Khách hỏi vang số có sẵn (UK-3000 Pro)
  {
    input: 'Vang số AMEK UK-3000 Pro dùng có hay không em?',
    hasPhone: false,
    reply: 'Dạ vang số AMEK UK-3000 Pro bên em sẵn hàng, chip DSP cao cấp cài sẵn các chế độ hát nhẹ chống hú ạ. Bác cho em xin số Zalo để nhận ưu đãi giá tốt qua Zalo nhé!'
  },
  // 15. Khách hỏi loa có sẵn (AMEK CF-12)
  {
    input: 'Loa full AMEK CF-12 đánh phòng 25m2 ổn không shop?',
    hasPhone: false,
    reply: 'Dạ cặp loa AMEK CF-12 bass 30cm bên em sẵn hàng, tiếng sáng và bay lời rất hợp phòng 25m2 ạ. Bác gửi thông tin qua Zalo cho tiện nhé, ở Facebook dễ bị trôi tin nhắn ạ!'
  },
  // 16. Khách hỏi sửa loa kéo / đóng thùng loa (Từ chối theo nghiệp vụ)
  {
    input: 'Bên mình có nhận đóng thùng loa kéo và thay gân loa bass 30 không?',
    hasPhone: false,
    reply: 'Dạ Tú Audio chuyên dàn karaoke gia đình và vang số chứ không nhận làm loa kéo hay đóng thùng loa bác nhé ạ. Cảm ơn bác đã quan tâm ạ!'
  },
  // 17. Khách hỏi địa chỉ showroom
  {
    input: 'Showroom cửa hàng mình ở đâu vậy em?',
    hasPhone: false,
    reply: 'Dạ showroom bên em ở Số 220 Nguyễn Danh Phương, P. Hội Hợp, TP. Vĩnh Yên, Vĩnh Phúc ạ. Bác cho em xin số Zalo để gửi định vị vị trí nhà cho tiện, ở Facebook không gửi được ạ!'
  },
  // 18. Khách hỏi chính sách bảo hành
  {
    input: 'Chế độ bảo hành thiết bị bên mình thế nào vậy shop?',
    hasPhone: false,
    reply: 'Dạ mọi thiết bị bên em đều bảo hành chính hãng 1 năm và hỗ trợ kỹ thuật trọn đời bác nhé. Bác cho em xin số Zalo để chuyên gia Tú Audio gửi thông tin chi tiết cho bác ạ!'
  },
  // 19. Khách báo tiếng bị hú rít nặng mic
  {
    input: 'Dàn nhà em hát hú rít và nặng mic quá, có cách nào xử lý không shop?',
    hasPhone: false,
    reply: 'Dạ tiếng hú rít thường do căn chỉnh dải Mid-Hi và cắt tần số rú chưa đúng âm học phòng bác ạ. Bác gửi số Zalo trước để bên em lưu lại và hỗ trợ bắt đúng bệnh cho dàn nhà mình nhé!'
  },
  // 20. Khách hỏi giờ mở cửa
  {
    input: 'Cửa hàng mấy giờ mở cửa để mình ghé qua test loa?',
    hasPhone: false,
    reply: 'Dạ showroom bên em mở cửa đón tiếp các bác từ sáng đến tối cả tuần ạ. Bác gửi thông tin qua Zalo cho tiện nhé, ở Facebook nhiều tin nhắn dễ trôi, để bên em đón tiếp chu đáo ạ!'
  }
]

/**
 * XÂY DỰNG PROMPT GEMINI RÚT GỌN VỚI 3 NGUYÊN TẮC CỐT LÕI TÚ AUDIO
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
Đã có SĐT: ${ex.hasPhone}
Trả lời: "${ex.reply}"`
  ).join('\n\n')

  const systemInstruction = `Bạn là trợ lý tư vấn âm thanh chuyên nghiệp của ${FIXED_KNOWLEDGE.brand} (Showroom: ${FIXED_KNOWLEDGE.showroom}, Hotline/Zalo: ${FIXED_KNOWLEDGE.zalo}).

BỘ NGUYÊN TẮC TƯ VẤN VÀ CHUYỂN ĐỔI LEAD ZALO (BẮT BUỘC TUÂN THỦ 100%):

1. KHÁCH HỎI SẢN PHẨM KHÔNG CÓ TRÊN WEB / SẢN PHẨM KHÁC:
   - Trả lời nguyên văn theo tinh thần: "Bên em để giá bằng giá thấp nhất trên mạng mà bác tham khảo ạ."
   - Đồng thời tư vấn khách sang các sản phẩm mà bên em đang có sẵn (ví dụ: loa AMEK CF-12 / ST12 bass 30cm, vang số UK-3000 Pro / VR500, cục đẩy AMEK D-750 / D-2800 / D-9004, sub điện AMEK PMA350, mic không dây AMEK 450 Plus...).
   - Khéo léo xin số Zalo để anh Tú gửi thông tin chi tiết và ưu đãi.

2. TẬP TRUNG HỎI SỐ ZALO:
   - Khi ĐÃ CÓ số Zalo (hasPhone = true): Tuyệt đối KHÔNG xin số nữa. Xác nhận đã lưu số và bảo khách: "Bác chờ chút chuyên gia Tú Audio sẽ liên hệ tư vấn trực tiếp cho bác ngay nhé!".
   - Nếu khách CHƯA CHO số Zalo (hasPhone = false): Sau mỗi câu trả lời PHẢI khéo léo xin số Zalo, luân chuyển 1 trong 4 lý do sau:
     + Lý do 1: Có ưu đãi đặc biệt qua Zalo.
     + Lý do 2: Gửi thông tin qua Zalo cho tiện, ở Facebook này nhiều người nhắn quá dễ bị trôi mất tin nhắn.
     + Lý do 3: Zalo gửi được định vị, vị trí nhà, ở Facebook này không gửi được vị trí.
     + Lý do 4: Nhờ bác gửi số Zalo trước để bên em lưu lại, nếu bác không tiện nghe máy thì bên em nhắn tin thôi cũng được.

3. DỊCH VỤ CĂN CHỈNH / SETUP VANG SỐ / CĂN CHỈNH BỘ DÀN:
   - Khách hỏi dịch vụ căn chỉnh chung: Xin ảnh bộ dàn hoặc tên các thiết bị, và xin số Zalo để nói chuyện cụ thể về vị trí và thời gian làm việc.
   - Khách hỏi GIÁ căn chỉnh:
     + Bước 1: Xin ảnh bộ dàn hoặc tên các thiết bị trong nhà.
     + Bước 2: Xin số Zalo để nói chuyện cụ thể về vị trí và thời gian làm việc.
     + Bước 3: Nếu khách cố tình hỏi giá trước (đã gặng hỏi sau 3 lần xin số Zalo vẫn chưa cho): Báo giá từ 500k đến 1tr, thậm chí nếu tiện tuyến đường ghép chuyến và phù hợp thì có thể căn chỉnh miễn phí. Nhưng chỉ ưu đãi khi có số điện thoại hoặc Zalo. Nhắc thêm cho khách biết: Bình luận thực tế khách thuê thợ ngoài căn chỉnh giá 2 triệu 1 lần để khách so sánh.

4. CHÍNH SÁCH BẢO HÀNH & KỸ THUẬT:
   - Mọi thiết bị chính hãng bên em đều được bảo hành chính hãng 1 năm (12 tháng) và hỗ trợ kỹ thuật căn chỉnh trọn đời.

5. QUY TẮC BẤT DI BẤT DỊCH:
   - Cấm tự bịa giá thiết bị khác ngoài giá căn chỉnh đã được quy định ở trên.
   - Cấm tự bịa hứa hẹn gửi video/clip test ruột gan thiết bị.
   - Từ chối lịch sự nếu khách hỏi sửa loa, đóng thùng loa hoặc loa kéo (Tú Audio chuyên dàn karaoke gia đình và vang số).
   - Xưng "em", gọi khách là "bác" hoặc "anh" (theo tên khách).
   - Ngắn gọn, súc tích: tối đa 2-3 câu, dưới 55 từ.
   - Trả về JSON đúng cấu trúc {"reply": "..."}.

DANH SÁCH 20 VÍ DỤ MẪU:
${fewShotsText}`

  const userContent = `${historyText ? 'LỊCH SỬ TIN NHẮN TRƯỚC ĐÓ:\n' + historyText + '\n\n' : ''}CÂU HỎI MỚI CỦA KHÁCH:
Tên khách: "${customerName}"
Nội dung: "${messageText}"
Trạng thái SĐT: ${hasPhone ? 'ĐÃ CÓ SĐT HỢP LỆ TRONG HỆ THỐNG' : 'CHƯA CÓ SĐT HỢP LỆ (Lưu ý: Bất kỳ dãy số nào trong lịch sử chưa đủ 10 chữ số như 098765432 đều là số sai/thiếu, TUYỆT ĐỐI KHÔNG được coi là đã có số). Bắt buộc phải xin số Zalo theo nguyên tắc!'}

Hãy trả về JSON với cấu trúc {"reply": "..."}`

  return { systemInstruction, userContent }
}

/**
 * BỘ KIỂM ĐỊNH CHECK REPLY (TUÂN THỦ 3 NGUYÊN TẮC TÚ AUDIO)
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

  // 2. Kiểm tra giá tiền:
  // Cho phép mức giá căn chỉnh được anh Tú phê duyệt (500k, 1tr, 1 triệu, 2 triệu), tuyệt đối cấm bịa giá thiết bị khác
  const allPrices = trimmed.match(/\b\d+([.,]\d+)?\s*(triệu|tr|nghìn|k|000\s*(?:đ|vnd|vnđ)|đ|vnd|vnđ)\b/gi) || []
  if (allPrices.length > 0) {
    const isAllowedSetupPrice = allPrices.every(p => {
      const cleanP = p.replace(/\s+/g, '').toLowerCase()
      return /^(500k|1tr|1triệu|2triệu|500000đ?|1000000đ?|2000000đ?)$/i.test(cleanP)
    }) && /(căn chỉnh|setup|chỉnh vang|thợ ngoài|2 triệu|miễn phí)/i.test(trimmed)

    if (!isAllowedSetupPrice) {
      return { ok: false, reason: 'CONTAINS_UNAUTHORIZED_PRICE' }
    }
  }

  // 3. Chặn từ cam kết ảo / khan hiếm / khuyến mãi lừa đảo (Cho phép 'miễn phí' khi nói về căn chỉnh ghép chuyến, cho phép 'bảo hành 1 năm')
  const forbiddenPromoRegex = /\b(cam kết|đảm bảo|chỉ hôm nay|duy nhất|trả góp|giảm giá sốc|bảo hành (?:2|3|5|10)\s*năm)\b/i
  if (forbiddenPromoRegex.test(trimmed)) {
    return { ok: false, reason: 'CONTAINS_FORBIDDEN_PROMISE_WORD' }
  }

  // 4. Chặn từ hứa hẹn gửi video
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

  // 6. Kiểm tra xin số lặp khi ĐÃ CÓ SỐ
  const askPhoneRegex = /(xin số|cho em xin số|xin sđt|xin số zalo|nhắn số zalo|cho em số|gửi số zalo|lưu số zalo)/i
  if (hasPhone && askPhoneRegex.test(trimmed)) {
    return { ok: false, reason: 'REDUNDANT_PHONE_REQUEST' }
  }

  // 7. Chuẩn hóa để đếm câu chính xác
  const normalizedForSentenceCount = trimmed
    .replace(/(?<=\d)\.(?=\d)/g, '') // xóa chấm trong số
    .replace(/(?<!\p{L})(tp|p)\./giu, '$1') // chỉ khớp TP. và P.
    .replace(/^(dạ\s+(?:em\s+)?(?:chào|cảm ơn)[^.!?…\n]{1,35})[!]/iu, '$1,') // gộp dấu ! sau lời chào ngắn

  const sentences = normalizedForSentenceCount.split(/[.!?…]+/).map(s => s.trim()).filter(Boolean)
  if (sentences.length > 3) {
    return { ok: false, reason: 'TOO_MANY_SENTENCES_' + sentences.length }
  }

  // 8. Đếm số từ (tối đa 55 từ)
  const wordCount = trimmed.split(/\s+/).length
  if (wordCount > 55) {
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

  // 11. Chống tự nhận vơ là đã có SĐT khi hasPhone = false
  if (!hasPhone) {
    const falsePhoneConfirmation = /(đã lưu số|đã lưu thông tin|anh tú sẽ gọi|gọi điện trực tiếp|sẽ liên hệ qua zalo tư vấn căn chỉnh dàn cho anh ngay|em đã báo anh tú rồi)/i
    if (falsePhoneConfirmation.test(trimmed)) {
      return { ok: false, reason: 'UNAUTHORIZED_PHONE_CONFIRMATION' }
    }
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
      messageText: correctionNote ? `${messageText}\n\n[LƯU Ý QUAN TRỌNG: Câu trước bị từ chối vì "${correctionNote}". Hãy viết lại ngắn gọn, tối đa 2-3 câu, dưới 55 từ, tuân thủ tuyệt đối quy tắc!]` : messageText,
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
  M19_DA_NHAN_SDT: (phone) => `Dạ em cảm ơn bác, em đã lưu số ${phone} rồi ạ. Bác chờ chút chuyên gia Tú Audio sẽ liên hệ tư vấn trực tiếp cho bác ngay nhé!`,
  M20_DA_CO_SDT_NHAN_TIEP: 'Dạ em đã ghi nhận thông tin của bác rồi ạ. Bác chờ chuyên gia Tú Audio liên hệ với bác sớm nhất nhé ạ!',
  M23_DU_PHONG_LOI: 'Dạ em đã nhận tin của bác rồi ạ. Bác chờ chút chuyên gia Tú Audio sẽ liên hệ hỗ trợ bác ngay nhé ạ!'
}
