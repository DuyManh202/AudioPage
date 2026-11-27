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
  M04_HOI_GIA_DAN: 'Dạ giá phụ thuộc phòng và thiết bị bác đang có nên em chưa báo bừa được ạ. Bên em có các gói dàn 19 triệu và 29 triệu, bác cho em xin số Zalo để anh Tú gửi cấu hình và báo giá đúng cho bác nhé ạ!',
  M05_GIA_XU_LY: 'Dạ giá xử lý phải xem tình trạng dàn của bác mới báo đúng được ạ. Bác cho em xin số Zalo, anh Tú sẽ nhắn hỏi vài thông tin rồi báo giá cụ thể cho bác nhé ạ!',
  M06_HU_RIT: 'Dạ em hiểu, sắm dàn mà hát hú rít, nặng mic thì bực mình lắm ạ. Tình trạng này thường liên quan đến cách chỉnh vang số và phòng hát, cần xem thực tế mới nói chính xác được. Bác cho em xin số Zalo để anh Tú xem và tư vấn hướng xử lý cho bác nhé ạ!',
  M07_DO_CU: 'Dạ đồ bác đang dùng nếu còn tốt thì cứ giữ lại cho đỡ tốn kém ạ, em không khuyên thay cả bộ đâu. Bác cho em xin số Zalo và vài tấm ảnh dàn hiện tại để anh Tú xem nên thay món nào cho hợp nhé ạ!',
  M08_TAN_NHA_CHUNG: 'Dạ bên em có nhận căn chỉnh tại nhà ạ, nhưng tùy khu vực và lịch nên em xin phép để anh Tú báo cụ thể. Bác cho em xin số Zalo và khu vực của bác nhé ạ!',
  M09_THU_CU_DOI_MOI: 'Dạ bên em có nhận thu cũ đổi mới ạ. Giá thu phụ thuộc loại và tình trạng thiết bị, bác cho em xin số Zalo và ảnh đồ cũ để anh Tú báo giúp bác nhé ạ!',
  M10_SO_MUA_HO: 'Dạ bác cẩn thận như vậy là đúng ạ. Anh Tú bên em có thể gọi video Zalo cho bác xem trực tiếp máy. Bác cho em xin số Zalo để anh Tú gọi cho bác nhé ạ!',
  M11_SO_SANH: 'Dạ mỗi nơi đều có thế mạnh riêng, bác cứ so sánh kỹ cho yên tâm ạ. Bên em chú trọng căn chỉnh theo đúng phòng của bác, bác cho em xin số Zalo để anh Tú gửi cấu hình và video thực tế cho bác tham khảo nhé ạ!',
  M12_CHUNG_CU: 'Dạ ở chung cư hay nhà phố thì quan trọng là chỉnh dải trầm cho gọn, hát nhỏ mà lời vẫn rõ ạ. Bác cho em xin số Zalo để anh Tú gửi cấu hình phù hợp cho nhà bác nhé ạ!',
  M13_BOLERO: 'Dạ hát bolero thì tiếng mic cần dày, ấm và echo mềm thì luyến láy mới ngọt ạ. Bác cho em xin số Zalo để anh Tú gửi clip chất âm bolero cho bác nghe thử nhé ạ!',
  M14_REMIX: 'Dạ nghe nhạc bốc thì dải trầm phải chắc, gọn và không đè lên lời hát ạ. Bác cho em xin số Zalo để anh Tú gửi clip test nhạc sàn cho bác nghe thử nhé ạ!',
  M15_THONG_TANG: 'Dạ phòng thông tầng hoặc nhiều kính thường dễ dội tiếng, nghe ong ong ạ. Cần xem phòng mới biết chỉnh thế nào, bác cho em xin số Zalo và gửi ảnh phòng khách để anh Tú tư vấn nhé ạ!',
  M16_CHINH_HONG: 'Dạ em rất hiểu cảm giác đó ạ, đã tốn tiền mà hát vẫn chưa đã. Mỗi phòng một khác nên cần xem thực tế mới chỉnh đúng được. Bác cho em xin số Zalo để anh Tú xem và tư vấn cho bác nhé ạ!',
  M17_NGUOI_GIA: 'Dạ bác yên tâm ạ, vang số bên em có khóa mật khẩu và cài sẵn 4 chế độ bấm 1 chạm, người nhà chỉ cần bật nguồn là hát. Bác cho em xin số Zalo để bên em gửi video hướng dẫn cho bác xem nhé ạ!',
  M18_STEP1_M2: 'Dạ để em báo đúng gói, phòng khách nhà bác rộng khoảng bao nhiêu mét vuông ạ?',
  M18_STEP2_DAN: 'Dạ bên em có gói 19 triệu và 29 triệu, cài sẵn 4 chế độ bấm 1 chạm ạ. Bác cho em xin số Zalo để anh Tú gửi cấu hình chi tiết và clip test thực tế cho bác nhé ạ!',
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
  const systemInstruction = `Bạn là trợ lý tự động của Tú Audio (Showroom: Số 220 đường Nguyễn Danh Phương, P. Hội Hợp, TP. Vĩnh Yên, tỉnh Vĩnh Phúc. Hotline/Zalo: 0984.259.898).
MỤC TIÊU DUY NHẤT: Trả lời đúng trọng tâm câu hỏi của khách một cách ngắn gọn, lịch sự, đúng thông tin trong KHO_THÔNG_TIN, sau đó khéo léo xin số Zalo/SĐT để anh Tú trực tiếp liên hệ trao đổi cụ thể. Không giải thích sâu kỹ thuật, không tự ý báo giá bừa.

KHO_THÔNG_TIN CỐ ĐỊNH:
1. Showroom: Số 220 đường Nguyễn Danh Phương, phường Hội Hợp, TP. Vĩnh Yên, tỉnh Vĩnh Phúc. Hotline/Zalo: 0984.259.898.
2. Gói dàn karaoke gia đình: Có gói 19 triệu và 29 triệu (cài sẵn 4 chế độ bấm 1 chạm: Hát chuyên nghiệp, Hát nhẹ, Nghe nhạc vàng, Nhạc bốc; vang số có khóa mật khẩu).
3. Dịch vụ:
   - Có nhận căn chỉnh tại nhà (chi phí và lịch trình cụ thể do anh Tú trực tiếp kiểm tra và báo lại theo từng khu vực).
   - Có nhận thu cũ đổi mới (giá thu phụ thuộc tình trạng thiết bị thực tế, do anh Tú báo).
4. CÁC MỤC CHƯA CÓ DỮ LIỆU CỐ ĐỊNH (Bắt buộc thông báo để anh Tú trực tiếp báo lại):
   - Giờ mở cửa, chi phí căn chỉnh tại nhà, điều kiện thu cũ, chính sách bảo hành, thanh toán sau khi hát thử.

QUY TẮC BẮT BUỘC (TUÂN THỦ 100%):
1. Xưng hô: Xưng "em", gọi khách là "bác" (hoặc "anh"). TUYỆT ĐỐI CẤM dùng từ "Khách Facebook".
2. Trả lời đúng trọng tâm: Khách hỏi gì trả lời đúng câu đó. TUYỆT ĐỐI KHÔNG tự ý nhắc đến gói dàn 19tr/29tr nếu khách chỉ hỏi căn chỉnh vang số hoặc hỏi địa chỉ!
3. Độ dài phản hồi: ${isComment ? 'Tối đa từ 1 đến 2 câu ngắn gọn, dưới 40 từ, chỉ trả lời công khai, TUYỆT ĐỐI không nhắn riêng.' : 'Tối đa từ 1 đến 3 câu ngắn gọn, súc tích (dưới 60 từ).'}
4. Quy tắc xin số điện thoại:
   - Nếu khách CHƯA CÓ SĐT: Khéo léo xin số Zalo hoặc SĐT tối đa 1 lần để anh Tú liên hệ (đặt ask_phone = true).
   - Nếu khách ĐÃ CÓ SĐT: TUYỆT ĐỐI KHÔNG xin lại số, chỉ xác nhận đã chuyển thông tin cho anh Tú (đặt ask_phone = false).
5. Khi khách hỏi kỹ thuật ngoài kho (như cách bấm nút amply, thông số linh kiện): Đặt intent="TECH_OUT_OF_SCOPE", handoff=true và dùng câu giữ chân chuẩn (M-23): "Dạ em đã nhận tin của bác rồi ạ. Em báo anh Tú trả lời bác ngay, bác chờ em một chút nhé ạ!"
6. Khi khách hỏi là người hay máy: Trung thực xác nhận là trợ lý tự động của Tú Audio đang hỗ trợ tiếp nhận thông tin (M-24).
7. TUYỆT ĐỐI KHÔNG tự nhận là "anh Phùng Văn Tú", KHÔNG dùng lý do "đang đi công tác/đi tuyến", KHÔNG khẳng định tỷ lệ phỏng đoán "90%", KHÔNG hứa hẹn "hỗ trợ từ xa qua máy tính", và KHÔNG tự ý hẹn ngày giờ qua nhà khách.`

  const userContent = `${historyText ? 'LỊCH SỬ TIN NHẮN TRƯỚC ĐÓ:\n' + historyText + '\n\n' : ''}CÂU HỎI MỚI CỦA KHÁCH:
Tên khách: "${customerName}"
Nội dung: "${messageText}"
Trạng thái đã có SĐT: ${hasPhone ? 'CÓ' : 'CHƯA'}

Hãy phân tích và trả về đối tượng JSON theo đúng schema.`

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

  // 7. Giới hạn độ dài: Bình luận tối đa 40 từ, Messenger tối đa 3 câu (bỏ qua dấu chấm trong SĐT và "TP.")
  if (isComment) {
    const wordCount = trimmed.split(/\s+/).length
    if (wordCount > 40) {
      return { ok: false, reason: 'COMMENT_TOO_LONG', fallback: TEMPLATES.C01_DIA_CHI }
    }
  } else {
    // Tách câu: Không tính dấu chấm trong SĐT (0984.259.898) và viết tắt (TP., P.)
    const cleanSentencesText = trimmed
      .replace(/(\d+)\.(\d+)/g, '$1$2')
      .replace(/tp\./gi, 'TP')
      .replace(/p\./gi, 'P')
    const sentences = cleanSentencesText.split(/[.!?…]+/).map(s => s.trim()).filter(Boolean)
    if (sentences.length > 3) {
      return { ok: false, reason: 'MESSENGER_TOO_LONG', fallback: TEMPLATES.M23_DU_PHONG_LOI }
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
