/**
 * KHO THÔNG TIN CỐ ĐỊNH & CẤU HÌNH AI CONSULTANT V2 - CHẾ ĐỘ A
 * Áp dụng cho: Messenger, Bình luận Facebook, Web chat tuaudio.vn
 */

export const FIXED_KNOWLEDGE = {
  showroom: 'Số 220 đường Nguyễn Danh Phương, phường Hội Hợp, TP. Vĩnh Yên, tỉnh Vĩnh Phúc',
  hotline: '0984.259.898',
  zalo: '0984.259.898',
  combos: [
    { name: 'Gói dàn 19 triệu', price: '19 triệu', features: 'Cài sẵn 4 chế độ bấm 1 chạm (Hát chuyên nghiệp, Hát nhẹ, Nghe nhạc vàng, Nhạc bốc), vang số có khóa mật khẩu' },
    { name: 'Gói dàn 29 triệu', price: '29 triệu', features: 'Cài sẵn 4 chế độ bấm 1 chạm (Hát chuyên nghiệp, Hát nhẹ, Nghe nhạc vàng, Nhạc bốc), vang số có khóa mật khẩu' }
  ],
  services: {
    can_chinh_tan_nha: true, // Có nhận căn chỉnh tận nhà, chi tiết do anh Tú báo lại
    thu_cu_doi_moi: true     // Có nhận thu cũ đổi mới, chi tiết do anh Tú báo lại
  },
  // Các mục [ĐIỀN] chưa có dữ liệu -> ĐỂ NULL, bot bắt buộc nói anh Tú báo lại
  pending_details: {
    gio_mo_cua: null,
    phi_can_chinh_tan_nha: null,
    dieu_kien_thu_cu: null,
    hat_thu_ung_y_thanh_toan: null,
    chinh_sach_bao_hanh: null,
    giao_hang_toan_quoc: null
  }
}

/**
 * THƯ VIỆN CÂU TRẢ LỜI MẪU (TEMPLATES M-01..M-24 & C-01..C-05)
 */
export const TEMPLATES = {
  // Messenger (M-01 đến M-24)
  M01_CHAO: 'Dạ em chào bác ạ! Bác đang cần chỉnh lại vang số cho đỡ hú, hay tìm dàn karaoke mới để em báo đúng hướng ạ?',
  M02_DIA_CHI: 'Dạ showroom bên em ở Số 220 đường Nguyễn Danh Phương, phường Hội Hợp, TP. Vĩnh Yên, Vĩnh Phúc ạ. Bác cho em xin số Zalo để anh Tú nhắn lịch và tư vấn cho bác nhé ạ!',
  M03_XUONG_NHA: (diaPhuong = 'mình') => `Dạ em ghi nhận bác ở ${diaPhuong} ạ. Anh Tú có sang tận nơi hay hỗ trợ từ xa còn tùy lịch và khoảng cách, nên em xin phép để anh ấy trực tiếp báo lại cho bác. Bác cho em xin số Zalo để anh Tú liên hệ sớm nhất nhé ạ!`,
  M04_HOI_GIA_DAN: 'Dạ giá sẽ phụ thuộc vào không gian phòng và thiết bị bác muốn phối ghép ạ. Bác cho em xin số điện thoại hoặc Zalo để anh Tú gọi điện tư vấn chi tiết cấu hình và báo giá tốt nhất cho bác nhé ạ!',
  M05_GIA_XU_LY: 'Dạ giá xử lý phải xem tình trạng dàn của bác mới báo đúng được ạ. Bác cho em xin số Zalo, anh Tú sẽ nhắn hỏi vài thông tin rồi báo giá cụ thể cho bác nhé ạ!',
  M06_HU_RIT: 'Dạ em hiểu, sắm dàn mà hát hú rít, nặng mic thì bực mình lắm ạ. Tình trạng này thường liên quan đến cách chỉnh vang số và phòng hát, cần xem thực tế mới nói chính xác được. Bác cho em xin số Zalo để anh Tú xem và tư vấn hướng xử lý cho bác nhé ạ!',
  M07_DO_CU: 'Dạ đồ bác đang dùng nếu còn tốt thì cứ giữ lại cho đỡ tốn kém ạ, em không khuyên thay cả bộ đâu. Bác cho em xin số Zalo và vài tấm ảnh dàn hiện tại để anh Tú xem nên thay món nào cho hợp nhé ạ!',
  M08_TAN_NHA_CHUNG: 'Dạ bên em có nhận căn chỉnh tại nhà ạ, nhưng tùy khu vực và lịch nên em xin phép để anh Tú báo cụ thể. Bác cho em xin số Zalo và khu vực của bác nhé ạ!',
  M09_THU_CU_DOI_MOI: 'Dạ bên em có nhận thu cũ đổi mới ạ. Giá thu phụ thuộc loại và tình trạng thiết bị, bác cho em xin số Zalo và ảnh đồ cũ để anh Tú báo giúp bác nhé ạ!',
  M10_SO_MUA_HO: 'Dạ bác cẩn thận như vậy là đúng ạ. Bác cho em xin số điện thoại hoặc Zalo để anh Tú gọi điện trao đổi trực tiếp và hướng dẫn bác cách kiểm tra máy cho yên tâm nhé ạ!',
  M11_SO_SANH: 'Dạ mỗi nơi đều có thế mạnh riêng, bác cứ so sánh kỹ cho yên tâm ạ. Bên em chú trọng căn chỉnh theo đúng phòng và thiết bị của bác, bác cho em xin số Zalo để anh Tú tư vấn cấu hình chuẩn nhất cho bác tham khảo nhé ạ!',
  M12_CHUNG_CU: 'Dạ ở chung cư hay nhà phố thì quan trọng là chỉnh dải trầm cho gọn, hát nhỏ mà lời vẫn rõ ạ. Bác cho em xin số Zalo để anh Tú gọi tư vấn phương án phù hợp cho nhà bác nhé ạ!',
  M13_BOLERO: 'Dạ hát bolero thì tiếng mic cần dày, ấm và echo mềm thì luyến láy mới ngọt ạ. Bác cho em xin số Zalo để anh Tú tư vấn dòng vang và cách căn dải âm cho bác nhé ạ!',
  M14_REMIX: 'Dạ nghe nhạc bốc thì dải trầm phải chắc, gọn và không đè lên lời hát ạ. Bác cho em xin số Zalo để anh Tú tư vấn cấu hình chuẩn cho bác nhé ạ!',
  M15_THONG_TANG: 'Dạ phòng thông tầng hoặc nhiều kính thường dễ dội tiếng, nghe ong ong ạ. Cần xem phòng mới biết chỉnh thế nào, bác cho em xin số Zalo và gửi ảnh phòng khách để anh Tú tư vấn nhé ạ!',
  M16_CHINH_HONG: 'Dạ em rất hiểu cảm giác đó ạ, đã tốn tiền mà hát vẫn chưa đã. Mỗi phòng một khác nên cần xem thực tế mới chỉnh đúng được. Bác cho em xin số Zalo để anh Tú xem và tư vấn cho bác nhé ạ!',
  M17_NGUOI_GIA: 'Dạ bác yên tâm ạ, vang số bên em có khóa mật khẩu và cài sẵn 4 chế độ bấm 1 chạm, người nhà chỉ cần bật nguồn là hát. Bác cho em xin số Zalo để anh Tú liên hệ hướng dẫn chi tiết cho bác nhé ạ!',
  M18_STEP1_M2: 'Dạ để em nắm rõ nhu cầu, phòng khách nhà bác rộng khoảng bao nhiêu mét vuông ạ?',
  M18_STEP2_DAN: 'Dạ để chọn cấu hình phù hợp với diện tích phòng và báo mức giá tốt nhất, bác cho em xin số Zalo để anh Tú gọi điện tư vấn chi tiết cho bác nhé ạ!',
  M19_DA_NHAN_SDT: (phone) => `Dạ em đã nhận số ${phone} của bác rồi ạ. Anh Tú bên em sẽ liên hệ với bác qua Zalo hoặc điện thoại sớm nhất có thể, bác chờ giúp em nhé ạ!`,
  M20_DA_CO_SDT_NHAN_TIEP: 'Dạ em đã chuyển tin của bác cho anh Tú rồi ạ, anh ấy sẽ trả lời bác sớm nhất.',
  M21_KHIEU_NAI: 'Dạ em xin lỗi vì sự bất tiện này ạ. Em đã báo ngay anh Tú để anh ấy trực tiếp liên hệ xử lý cho bác.',
  M22_NGOAI_LINH_VUC: 'Dạ phần này em chưa hỗ trợ được ạ. Nếu bác cần tư vấn dàn karaoke, vang số thì cứ nhắn em nhé ạ!',
  M23_DU_PHONG_LOI: 'Dạ em đã nhận tin của bác rồi ạ. Em báo anh Tú trả lời bác ngay, bác chờ em một chút nhé ạ!',
  M24_NGUOI_HAY_BOT: 'Dạ em là trợ lý tự động của Tú Audio ạ! Em xin phép ghi nhận thông tin để anh Tú liên hệ hỗ trợ bác chu đáo nhất nhé ạ!',

  // Bình luận Facebook (C-01 đến C-05)
  C01_DIA_CHI: 'Dạ showroom bên em ở Số 220 Nguyễn Danh Phương, P. Hội Hợp, TP. Vĩnh Yên, Vĩnh Phúc ạ. Bác nhắn Messenger hoặc Zalo 0984.259.898 để em tư vấn nhé ạ!',
  C02_HOI_GIA: 'Dạ giá tùy phòng và thiết bị của bác ạ. Bác nhắn Messenger hoặc Zalo 0984.259.898 để bên em báo đúng cấu hình nhé ạ!',
  C03_TAN_NHA: 'Dạ bên em có nhận căn chỉnh tận nhà, tùy khu vực ạ. Bác nhắn Messenger hoặc Zalo 0984.259.898 cho em xin khu vực để anh Tú báo lịch nhé ạ!',
  C04_KHEN_CAM_ON: 'Dạ em cảm ơn bác ạ! Bác cần tư vấn thêm cứ nhắn Messenger hoặc Zalo 0984.259.898 nhé ạ!',
  C05_NHAN_SDT: 'Dạ em đã nhận được số của bác rồi ạ, bên em sẽ liên hệ tư vấn cho bác sớm nhé ạ!'
}

/**
 * TRÍCH XUẤT SĐT DI ĐỘNG VIỆT NAM (ĐA ĐỊNH DẠNG)
 */
export function extractPhoneNumber(text) {
  if (!text || typeof text !== 'string') return null
  if (text.includes('facebook.com') || text.includes('comment_id')) return null

  // Hỗ trợ: 0969755634, 0969.755.634, 0988 123 456, 0912-345-678, +84969755634, +84 969 755 634
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
 * BỘ SCHEMA VÀ CẤU HÌNH GỌI GEMINI STRUCTURED OUTPUTS (R3)
 */
export const GEMINI_JSON_SCHEMA = {
  type: 'OBJECT',
  properties: {
    intent: {
      type: 'STRING',
      description: 'Ý định câu hỏi: CHAO, DIA_CHI, GIA, HOI_DAN, HU_RIT, DO_CU, TAN_NHA, THU_CU, SO_HO, SO_SANH, BOLERO, REMIX, CHUNG_CU, NGUOI_GIA, TECH_OUT_OF_SCOPE, GENERAL_UNKNOWN'
    },
    reply: {
      type: 'STRING',
      description: 'Nội dung câu trả lời hoàn chỉnh tiếng Việt, đúng kịch bản Chế độ A, tối đa 3 câu (Messenger) hoặc 2 câu dưới 40 từ (Bình luận)'
    },
    ask_phone: {
      type: 'BOOLEAN',
      description: 'Có xin số điện thoại Zalo hay không (nếu khách đã có số thì bắt buộc là false)'
    },
    handoff: {
      type: 'BOOLEAN',
      description: 'Chuyển cho anh Tú / nhân sự thật tiếp quản (khi khách khiếu nại, hỏi ngoài kho, hoặc cần tư vấn sâu)'
    }
  },
  required: ['intent', 'reply', 'ask_phone', 'handoff']
}

/**
 * XÂY DỰNG PROMPT GEMINI CHẾ ĐỘ A VỚI NGUYÊN TẮC R3 & R5
 */
export function buildGeminiPromptV2({ customerName = 'bác', messageText = '', historyText = '', hasPhone = false, isComment = false }) {
  const systemInstruction = `Bạn là nhân viên tư vấn âm thanh chuyên nghiệp, nhiệt tình của thương hiệu Tú Audio (Showroom: Số 220 đường Nguyễn Danh Phương, P. Hội Hợp, TP. Vĩnh Yên, tỉnh Vĩnh Phúc. Hotline/Zalo: 0984.259.898).

NGUYÊN TẮC CỐT LÕI (ĐƠN GIẢN NHẤT - HỎI NHU CẦU & XIN SỐ ĐỂ ANH TÚ TRẢ LỜI):
1. TUYỆT ĐỐI KHÔNG BÁO GIÁ:
   - Bất kể khách hỏi giá sản phẩm gì (lọc xì, vang số, vang cơ, micro, loa, cục đẩy, combo dàn, hay phí căn chỉnh), AI TUYỆT ĐỐI KHÔNG TỰ BÁO BẤT KỲ MỨC GIÁ NÀO (không nêu bất kỳ con số giá nào).
   - Khi khách hỏi sản phẩm hoặc hỏi giá: Chỉ xác nhận bên em có sẵn hàng chuẩn xịn, và khéo léo xin số Zalo/điện thoại để anh Tú gọi điện tư vấn chi tiết và báo mức giá tốt nhất cho khách.

2. NẾU KHÁCH MUỐN HỎI SẢN PHẨM GÌ:
   - Hỏi thăm nhu cầu sử dụng của khách (nhà mình đang dùng đẩy hay amply gì, loa gì, phòng bao nhiêu mét vuông).
   - Xin số điện thoại / Zalo để anh Tú trực tiếp trả lời, hướng dẫn phối ghép chuẩn và báo giá nét cho khách.

3. TUYỆT ĐỐI KHÔNG HỨA HẸN "gửi video test / video quay ruột gan" (vì anh Tú có thể không có sẵn video máy đó)!

4. CHÍNH SÁCH DỊCH VỤ & THIẾT BỊ:
   - BÊN EM KHÔNG NHẬN LÀM LOA, KHÔNG NHẬN SỬA CHỮA ĐÓNG MỚI THÙNG LOA HOẶC QUẤN CÔN/THAY GÂN LOA!
   - BÊN EM KHÔNG LÀM LOA KÉO!
   - Khi khách hỏi sửa loa / làm loa / loa kéo: Lễ phép báo rõ "Dạ bên em chuyên về dàn karaoke gia đình và vang số/amply chứ không nhận làm/sửa loa bác nhé ạ".

5. QUY TẮC SỐ ĐIỆN THOẠI & PHONG CÁCH:
   - Khi khách ĐÃ CHO SĐT: Tuyệt đối không hỏi lại SĐT, chỉ xác nhận em đã lưu số và báo anh Tú liên hệ ngay.
   - Nếu khách bảo "Gửi ở đây cũng được / Báo ở đây đi": Lễ phép giải thích âm thanh cần biết cấu hình dàn nhà mình đang dùng để tư vấn chuẩn không bị lãng phí, mời bác cho số Zalo để anh Tú gọi tư vấn nhanh 1 phút.
   - Xưng "em", gọi khách là "bác" hoặc "anh". CẤM gọi "Khách Facebook".
   - Ngắn gọn, chuẩn xác từ 1 đến 2 câu (khoảng 25 - 40 từ). Đi thẳng vào nhu cầu, tôn trọng khách.`

  const userContent = `${historyText ? 'LỊCH SỬ TIN NHẮN TRƯỚC ĐÓ:\n' + historyText + '\n\n' : ''}CÂU HỎI MỚI CỦA KHÁCH:
Tên khách: "${customerName}"
Nội dung: "${messageText}"
Trạng thái đã có SĐT: ${hasPhone ? 'CÓ' : 'CHƯA'}

YÊU CẦU ĐẶC BIỆT QUAN TRỌNG:
Hãy trả lời trực tiếp nội dung tin nhắn sẽ gửi cho khách bằng văn bản thuần túy (Plain text). TUYỆT ĐỐI KHÔNG xuất cú pháp JSON, KHÔNG bọc mã trong \`\`\`json, KHÔNG thêm lời giải thích hay phân tích nào khác!`

  return { systemInstruction, userContent }
}

/**
 * BỘ KIỂM TRA ĐẦU RA AN TOÀN TRƯỚC KHI GỬI (GUARDRAIL - R4)
 */
export function verifyAndCleanOutput({ rawReply = '', finishReason = 'STOP', hasPhone = false, isComment = false, recentOuts = [] }) {
  if (!rawReply || typeof rawReply !== 'string') {
    return { ok: false, reason: 'REPLY_EMPTY', fallback: TEMPLATES.M23_DU_PHONG_LOI }
  }

  const trimmed = rawReply.trim()

  // 1. Kiểm tra finishReason khác STOP (bị cắt do MAX_TOKENS)
  if (finishReason && finishReason !== 'STOP') {
    return { ok: false, reason: 'FINISH_REASON_' + finishReason, fallback: TEMPLATES.M23_DU_PHONG_LOI }
  }

  // 2. Chặn địa điểm cửa hàng sai lệch (chỉ được ở Vĩnh Yên, cấm nhận ở Hà Nội hay tỉnh khác là vị trí showroom)
  if (/(showroom|cửa hàng|ở tại|địa chỉ của bên em|bên em ở)\s+(tại\s+)?(hà nội|hải phòng|nam định|thái bình|bắc ninh|phú thọ)/i.test(trimmed)) {
    return { ok: false, reason: 'WRONG_LOCATION_STORE', fallback: TEMPLATES.M02_DIA_CHI }
  }

  // 2b. Chặn địa chỉ cụt hoặc sai lệch (kết thúc bằng "TP.", thiếu Vĩnh Yên/Vĩnh Phúc)
  if (/nguyễn danh phương/i.test(trimmed) || /showroom/i.test(trimmed)) {
    if (!/vĩnh yên/i.test(trimmed) || !/vĩnh phúc/i.test(trimmed) || /tp\.?\s*$/i.test(trimmed)) {
      return { ok: false, reason: 'INCOMPLETE_ADDRESS', fallback: TEMPLATES.M02_DIA_CHI }
    }
  }

  // 3. Chặn mã rác hoặc chuỗi escape JSON
  if (trimmed.includes('{"') || trimmed.includes('"}') || trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.includes('\\"') || trimmed.includes('\\/')) {
    return { ok: false, reason: 'CORRUPTED_JSON_OR_SCRAP', fallback: TEMPLATES.M23_DU_PHONG_LOI }
  }

  // 4. Chặn biến chưa thay thế hoặc xưng hô cấm
  if (trimmed.includes('{') || trimmed.includes('}') || /khách facebook/i.test(trimmed)) {
    return { ok: false, reason: 'UNRESOLVED_VARIABLE_OR_FORBIDDEN_NAME', fallback: TEMPLATES.M23_DU_PHONG_LOI }
  }

  // 5. Câu phải kết thúc bằng dấu câu hợp lệ (. ! ? … ạ nha nhé) có neo cuối chuỗi $
  if (!/([.!?…ạa]|(nha|nhé|nhe)\s*[.!?]?)$/i.test(trimmed)) {
    return { ok: false, reason: 'INCOMPLETE_PUNCTUATION', fallback: TEMPLATES.M23_DU_PHONG_LOI }
  }

  // 6. Nếu đã có số mà bot lại đi xin số
  if (hasPhone) {
    if (/xin số/i.test(trimmed) || /xin sđt/i.test(trimmed) || /cho em số/i.test(trimmed) || /cho em xin số/i.test(trimmed) || /xin số zalo/i.test(trimmed)) {
      return { ok: false, reason: 'REDUNDANT_PHONE_REQUEST', fallback: TEMPLATES.M20_DA_CO_SDT_NHAN_TIEP }
    }
  }

  // 7. Giới hạn độ dài: Bình luận tối đa 35 từ, Messenger tối đa 2 câu (bỏ qua dấu chấm trong SĐT và "TP.")
  if (isComment) {
    const wordCount = trimmed.split(/\s+/).length
    if (wordCount > 35) {
      return { ok: false, reason: 'COMMENT_TOO_LONG', fallback: TEMPLATES.C01_DIA_CHI }
    }
  } else {
    // Chuẩn hóa dấu chấm trong SĐT (0984.259.898), tiền tệ và từ viết tắt (TP., P.)
    const cleanSentencesText = trimmed
      .replace(/(?<=\d)\.(?=\d)/g, '')
      .replace(/tp\./gi, 'TP')
      .replace(/p\./gi, 'P')
      // Gộp dấu chấm than sau lời chào ngắn (ví dụ: "Dạ em chào bác Toàn Đô!") thành dấu phẩy để không bị ngắt thành câu riêng
      .replace(/^(dạ\s+(?:em\s+)?(?:chào|cảm ơn)[^.!?…\n]{1,35})[!]/i, '$1,')

    const sentences = cleanSentencesText.split(/[.!?…]+/).map(s => s.trim()).filter(Boolean)
    // Nếu tin nhắn có trên 3 câu hoặc dài quá 55 từ, chỉ giữ lại 2 câu đầu tiên
    const wordCount = trimmed.split(/\s+/).length
    if (sentences.length > 3 || (sentences.length > 2 && wordCount > 55)) {
      const firstTwo = sentences.slice(0, 2).join('. ') + '.'
      return { ok: true, cleanedReply: firstTwo }
    }
  }

  // 8. Chống lặp tin nhắn với các tin gần nhất
  const normalizeForCompare = (s) => (s || '').replace(/[^a-z0-9à-ỹ]/g, '').toLowerCase()
  const replyNorm = normalizeForCompare(trimmed)
  if (recentOuts.some(outMsg => normalizeForCompare(outMsg) === replyNorm)) {
    return { ok: false, reason: 'DUPLICATE_RECENT_MESSAGE', fallback: null }
  }

  return { ok: true, cleanedReply: trimmed }
}
