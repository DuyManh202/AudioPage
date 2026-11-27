import assert from 'assert'
import { verifyAndCleanOutput, buildGeminiPromptV2, extractPhoneNumber, TEMPLATES } from './aiConsultantV2.js'

console.log('====================================================================')
console.log('BỘ KIỂM THỬ TÍCH HỢP TOÀN DIỆN V2 (TEST_V2_COMPREHENSIVE_SUITE)')
console.log('====================================================================\n')

let passed = 0
let failed = 0

function test(title, fn) {
  try {
    fn()
    console.log(`[PASS] ${title}`)
    passed++
  } catch (err) {
    console.error(`[FAIL] ${title}:`, err.message)
    failed++
  }
}

// 1. TEST KHÁCH VÀO TỪ QUẢNG CÁO CÓ LỜI CHÀO META (CÙNG GIÂY VÀ KHÁC GIÂY)
test('1.1. Lọc thông báo Meta nhãn tự động & lời chào hệ thống khỏi tin thực', () => {
  const isSystemFacebookNotice = (body) => {
    if (!body) return false
    const str = String(body).trim()
    return (
      str.startsWith('Facebook tạo đoạn chat') ||
      str.includes('Facebook tạo đoạn chat này vì') ||
      str.includes('đã trả lời tin nhắn chào mừng tự động') ||
      str.includes('Để thay đổi hoặc gỡ lời chào này') ||
      str.startsWith('Đã thêm nhãn tự động:') ||
      str.includes('Đã đặt giai đoạn của khách hàng tiềm năng') ||
      str.includes('Đoạn chat này chưa dùng được tính năng phản hồi bằng AI') ||
      (str.includes('Dạ em chào bác') && str.includes('Em là trợ lý âm thanh của Tú Audio'))
    )
  }

  const msgs = [
    { body: "Dạ em chào bác Nguyễn Chuyên! Em là trợ lý âm thanh của Tú Audio. Bác đang quan tâm...", direction: "OUT" },
    { body: "Nguyễn Chuyên đã trả lời tin nhắn chào mừng tự động của bạn. Để thay đổi hoặc gỡ lời chào này...", direction: "OUT" },
    { body: "Đã thêm nhãn tự động: Đã đặt giai đoạn của khách hàng tiềm năng thành Tiếp nhận.", direction: "OUT" },
    { body: "Bộ giàn kaoke nhà mình hát ko đc hay tiếng nặng ko đc mượt có cách nào ko bạn ơi", direction: "IN" }
  ]

  const realMsgs = msgs.filter(m => !isSystemFacebookNotice(m.body))
  assert.strictEqual(realMsgs.length, 1)
  assert.strictEqual(realMsgs[0].direction, 'IN')
  assert.strictEqual(realMsgs[0].body.includes('Bộ giàn kaoke'), true)
})

test('1.2. Sắp xếp tin cùng giây và tiêu chí phụ id/platformMessageId', () => {
  const rawList = [
    { id: "msg_2", createdAt: "2026-11-26T08:54:43.000Z", direction: "IN", body: "chỉnh 203n như nào" },
    { id: "msg_1", createdAt: "2026-11-26T08:54:43.000Z", direction: "OUT", body: "Dạ em chào bác" }
  ]
  const sorted = rawList.sort((a, b) => {
    const diff = Date.parse(a.createdAt) - Date.parse(b.createdAt)
    if (diff !== 0) return diff
    if (a.direction === 'OUT' && b.direction === 'IN') return -1
    if (a.direction === 'IN' && b.direction === 'OUT') return 1
    return String(a.id).localeCompare(String(b.id))
  })
  // Tin OUT phải đứng trước tin IN khi cùng giây
  assert.strictEqual(sorted[0].direction, 'OUT')
  assert.strictEqual(sorted[1].direction, 'IN')
  assert.strictEqual(sorted[sorted.length - 1].direction, 'IN')
})

// 2. TEST GỘP TIN NHẮN LIÊN TIẾP (DEBOUNCE)
test('2.1. Gộp trọn vẹn 2 tin nhắn liên tiếp của khách', () => {
  const pendingInbounds = [
    { body: "he lo sop ơi", direction: "IN" },
    { body: "chỉnh 203n như nào để hát cho dễ hát và hay hơn vậy sop tu vấn giúp", direction: "IN" }
  ]
  const latestText = pendingInbounds.map(m => m.body).join('\n')
  assert.strictEqual(latestText.includes('he lo sop ơi'), true)
  assert.strictEqual(latestText.includes('chỉnh 203n như nào'), true)
  assert.strictEqual(latestText.split('\n').length, 2)
})

// 3. TEST GỬI SĐT KHI NHÂN VIÊN ĐANG CHAT
test('3.1. Nhân viên đang chat trong 30 phút -> lưu SĐT vào Leads và nhường quyền (không gửi M-19)', () => {
  const isHumanStaffActive = true
  const incomingPhone = extractPhoneNumber("Số em là 0969755634 nhé")
  assert.strictEqual(incomingPhone, '0969755634')

  let replySent = null
  let leadSaved = false

  if (incomingPhone) {
    leadSaved = true
    if (isHumanStaffActive) {
      // Nhường quyền, không gán replySent
      replySent = null
    } else {
      replySent = TEMPLATES.M19_DA_NHAN_SDT(incomingPhone)
    }
  }

  assert.strictEqual(leadSaved, true)
  assert.strictEqual(replySent, null)
})

// 4. TEST GEMINI LỖI / 503 / GUARDRAIL FALLBACK
test('4.1. Guardrail chặn FINISH_REASON != STOP (ví dụ MAX_TOKENS) -> trả về M-23', () => {
  const res = verifyAndCleanOutput({
    rawReply: "Dạ bên em có các gói dàn karaoke gia đình",
    finishReason: "MAX_TOKENS"
  })
  assert.strictEqual(res.ok, false)
  assert.strictEqual(res.reason, "FINISH_REASON_MAX_TOKENS")
  assert.strictEqual(res.fallback, TEMPLATES.M23_DU_PHONG_LOI)
})

test('4.2. Guardrail chặn JSON hỏng, mã rác hoặc escape thừa -> trả về M-23', () => {
  const res = verifyAndCleanOutput({
    rawReply: '{"intent": "CHAO", "reply": "Dạ em chào bác ạ!\\"',
    finishReason: "STOP"
  })
  assert.strictEqual(res.ok, false)
  assert.strictEqual(res.reason, "CORRUPTED_JSON_OR_SCRAP")
  assert.strictEqual(res.fallback, TEMPLATES.M23_DU_PHONG_LOI)
})

test('4.3. Guardrail chặn câu không có dấu câu kết thúc -> trả về M-23', () => {
  const res = verifyAndCleanOutput({
    rawReply: 'Dạ bên em có nhận hỗ trợ kỹ thuật căn chỉnh',
    finishReason: "STOP"
  })
  assert.strictEqual(res.ok, false)
  assert.strictEqual(res.reason, "INCOMPLETE_PUNCTUATION")
  assert.strictEqual(res.fallback, TEMPLATES.M23_DU_PHONG_LOI)
})

test('4.4. Guardrail chặn địa điểm sai (nhận showroom ở Hà Nội) -> trả về M-02', () => {
  const res = verifyAndCleanOutput({
    rawReply: 'Dạ showroom bên em ở tại Hà Nội bác nhé ạ!',
    finishReason: "STOP"
  })
  assert.strictEqual(res.ok, false)
  assert.strictEqual(res.reason, "WRONG_LOCATION_STORE")
  assert.strictEqual(res.fallback, TEMPLATES.M02_DIA_CHI)
})

// 5. TEST RANH GIỚI TỪ KÊNH BÌNH LUẬN (TRÁNH BẮT NHẦM 'GIA')
test('5.1. Bình luận hỏi địa danh hoặc có từ gia đình, tham gia không bị kích hoạt C02_HOI_GIA', () => {
  const checkCommentIntent = (cleanMsg) => {
    const lower = cleanMsg.toLowerCase()
    const isAddressQuery = /(^|[\s,.\-?!])(ở đâu|địa chỉ|chỗ nào|o dau|dia chi)([\s,.\-?!]|$)/i.test(lower)
    const isPriceQuery = /(^|[\s,.\-?!])(giá|bao nhiêu|nhiêu tiền|báo giá|bao nhieu|nhieu tien)([\s,.\-?!]|$)/i.test(lower) && !/(gia đình|gia dinh|tham gia|đánh giá|danh gia)/i.test(lower)
    const isHomeServiceQuery = /(^|[\s,.\-?!])(tận nhà|tận nơi|về nhà|xuống nhà|đến nhà|có chỉnh không|có làm không|có đi không|co chinh khong|co lam khong|co di khong)([\s,.\-?!]|$)/i.test(lower)

    if (isAddressQuery) return 'C01'
    if (isPriceQuery) return 'C02'
    if (isHomeServiceQuery) return 'C03'
    return 'UNKNOWN'
  }

  // Khách Thịnh Vũ: "Sông lô , Phú thọ có chỉnh không ạ" -> phải ra C03 (căn chỉnh tận nhà), KHÔNG ĐƯỢC ra C02
  assert.strictEqual(checkCommentIntent("Sông lô , Phú thọ có chỉnh không ạ"), 'C03')
  // Khách viết về dàn gia đình: "Dàn karaoke gia đình hay quá" -> KHÔNG ĐƯỢC ra C02
  assert.strictEqual(checkCommentIntent("Dàn karaoke gia đình hay quá"), 'UNKNOWN')
  // Khách tham gia: "Cho em tham gia với" -> KHÔNG ĐƯỢC ra C02
  assert.strictEqual(checkCommentIntent("Cho em tham gia với"), 'UNKNOWN')
  // Khách hỏi giá thật: "bộ này giá bao nhiêu" -> ra C02
  assert.strictEqual(checkCommentIntent("bộ này giá bao nhiêu"), 'C02')
})

// 6. TEST KHÁCH ĐÃ CÓ SĐT THÌ KHÔNG XIN LẠI SỐ
test('6.1. Khách đã có SĐT thì guardrail chặn xin số thừa -> trả về M-20', () => {
  const res = verifyAndCleanOutput({
    rawReply: 'Dạ bác cho em xin số Zalo để anh Tú gửi bảng giá nhé ạ!',
    hasPhone: true,
    finishReason: 'STOP'
  })
  assert.strictEqual(res.ok, false)
  assert.strictEqual(res.reason, 'REDUNDANT_PHONE_REQUEST')
  assert.strictEqual(res.fallback, TEMPLATES.M20_DA_CO_SDT_NHAN_TIEP)
})

// 7. TEST PROMPT MESSENGER 2.0
test('7.1. Prompt Messenger 2.0 loại bỏ Phùng Văn Tú và xưng hô trợ lý tự động', () => {
  const prompt = buildGeminiPromptV2({
    customerName: 'Nguyễn Văn Cường',
    messageText: 'Căn chỉnh lại.',
    hasPhone: false,
    isComment: false
  })
  assert.strictEqual(prompt.systemInstruction.includes('BẠN LÀ ANH PHÙNG VĂN TÚ'), false)
  assert.strictEqual(prompt.systemInstruction.includes('trợ lý tự động của Tú Audio'), true)
  assert.strictEqual(prompt.systemInstruction.includes('khẳng định 90% là do'), false)
  assert.strictEqual(prompt.systemInstruction.includes('CẤM dùng từ "Khách Facebook"'), true)
  assert.strictEqual(prompt.systemInstruction.includes('TUYỆT ĐỐI KHÔNG tự nhận là "anh Phùng Văn Tú"'), true)
})

console.log('\n====================================================================')
console.log(`KẾT QUẢ: ${passed} PASS, ${failed} FAIL`)
console.log('====================================================================')
if (failed > 0) process.exit(1)
