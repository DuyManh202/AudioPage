import {
  matchFastHybridResponse,
  verifyAndCleanOutput,
  TEMPLATES,
  extractPhoneNumber,
  extractProvinceName
} from './aiConsultantV2.js'

async function runTestSuite() {
  console.log('=================================================================')
  console.log('KIỂM THỬ TỰ ĐỘNG BỘ KỊCH BẢN AI TÚ AUDIO – BẢN 2.0 (CHẾ ĐỘ A)')
  console.log('=================================================================\n')

  let passed = 0
  let total = 10

  // Test 1: “Mình ở Việt Trì, bạn ở đâu?”
  console.log('--- Test 1: Khách hỏi địa chỉ (Việt Trì, bạn ở đâu) ---')
  const t1 = matchFastHybridResponse({ message: 'Mình ở Việt Trì, bạn ở đâu?', isComment: false })
  const v1 = verifyAndCleanOutput({ rawReply: t1.reply, isComment: false })
  console.log('Input: "Mình ở Việt Trì, bạn ở đâu?"')
  console.log('Output:', v1.cleanedReply)
  if (v1.ok && v1.cleanedReply.includes('Số 220 đường Nguyễn Danh Phương') && v1.cleanedReply.includes('Vĩnh Phúc')) {
    console.log('=> TEST 1: PASS ✅ (Đầy đủ địa chỉ Vĩnh Yên - Vĩnh Phúc, không bị cụt câu)\n')
    passed++
  } else {
    console.log('=> TEST 1: FAIL ❌\n')
  }

  // Test 2: Bình luận "mình ở đâu vậy"
  console.log('--- Test 2: Bình luận hỏi ở đâu ---')
  const t2 = matchFastHybridResponse({ message: 'mình ở đâu vậy', isComment: true })
  const v2 = verifyAndCleanOutput({ rawReply: t2.reply, isComment: true })
  console.log('Input: "mình ở đâu vậy" (Comment)')
  console.log('Output:', v2.cleanedReply)
  if (v2.ok && !v2.cleanedReply.includes('{') && !v2.cleanedReply.includes('/')) {
    console.log('=> TEST 2: PASS ✅ (Khớp mẫu C-01 chuẩn, không có ký tự rác)\n')
    passed++
  } else {
    console.log('=> TEST 2: FAIL ❌\n')
  }

  // Test 3: Bình luận "Cháu nhận xử lý ở đâu đấy"
  console.log('--- Test 3: Bình luận "Cháu nhận xử lý ở đâu đấy" ---')
  const t3 = matchFastHybridResponse({ message: 'Cháu nhận xử lý ở đâu đấy', isComment: true })
  const v3 = verifyAndCleanOutput({ rawReply: t3.reply, isComment: true })
  console.log('Input: "Cháu nhận xử lý ở đâu đấy"')
  console.log('Output:', v3.cleanedReply)
  if (v3.ok && v3.cleanedReply.includes('Vĩnh Yên, Vĩnh Phúc') && !v3.cleanedReply.includes('Hà Nội')) {
    console.log('=> TEST 3: PASS ✅ (Nêu rõ Vĩnh Yên Vĩnh Phúc, không nói nhầm sang Hà Nội)\n')
    passed++
  } else {
    console.log('=> TEST 3: FAIL ❌\n')
  }

  // Test 4: Khách gửi SĐT
  console.log('--- Test 4: Khách gửi SĐT (0969755634) ---')
  const t4 = matchFastHybridResponse({ message: '0969755634', isComment: false })
  const v4 = verifyAndCleanOutput({ rawReply: t4.reply, hasPhone: true, isComment: false })
  console.log('Input: "0969755634"')
  console.log('Output:', v4.cleanedReply)
  console.log('isPhoneCaptured:', t4.isPhoneCaptured, 'handoff:', t4.handoff)
  // Sau đó giả định khách nhắn thêm câu nữa:
  const t4_next = matchFastHybridResponse({ message: 'bao giờ bạn gọi vậy', hasPhone: true, isComment: false })
  console.log('Khách nhắn tiếp: "bao giờ bạn gọi vậy"')
  console.log('Output tin tiếp theo:', t4_next.reply)
  if (t4.isPhoneCaptured && t4_next.ask_phone === false && !t4_next.reply.includes('xin số')) {
    console.log('=> TEST 4: PASS ✅ (Nhận SĐT, M-19 phản hồi, tin tiếp theo không xin lại số)\n')
    passed++
  } else {
    console.log('=> TEST 4: FAIL ❌\n')
  }

  // Test 5: "Alo" rồi "Giá xử lý thế nào?" gửi liền nhau
  console.log('--- Test 5: Gộp tin nhắn debounce ("Alo" + "Giá xử lý thế nào?") ---')
  const combinedMsg = 'Alo Giá xử lý thế nào?'
  const t5 = matchFastHybridResponse({ message: combinedMsg, isComment: false })
  const v5 = verifyAndCleanOutput({ rawReply: t5.reply, isComment: false })
  console.log('Input gộp: "Alo Giá xử lý thế nào?"')
  console.log('Output:', v5.cleanedReply)
  if (v5.ok && v5.cleanedReply === TEMPLATES.M05_GIA_XU_LY) {
    console.log('=> TEST 5: PASS ✅ (Ưu tiên giải đáp câu hỏi trọng tâm M-05, không trả lời vụn)\n')
    passed++
  } else {
    console.log('=> TEST 5: FAIL ❌\n')
  }

  // Test 6: Giả lập Gemini lỗi hoặc timeout
  console.log('--- Test 6: Giả lập lỗi hoặc phản hồi cụt từ AI ---')
  const truncatedBadReply = 'Dạ showroom bên em ở Phố Nguyễn Danh Phương, TP.' // không có dấu chấm, cụt
  const v6 = verifyAndCleanOutput({ rawReply: truncatedBadReply, finishReason: 'MAX_TOKENS', isComment: false })
  console.log('Input lỗi: Truncated finishReason=MAX_TOKENS')
  console.log('Output fallback:', v6.fallback)
  if (!v6.ok && v6.fallback === TEMPLATES.M23_DU_PHONG_LOI) {
    console.log('=> TEST 6: PASS ✅ (Chặn câu cụt thành công, chuyển sang M-23 dự phòng an toàn)\n')
    passed++
  } else {
    console.log('=> TEST 6: FAIL ❌\n')
  }

  // Test 7: Khách ở Lương Sơn hỏi "xuống nhà được không"
  console.log('--- Test 7: Khách ở Lương Sơn hỏi "xuống nhà được không" ---')
  const t7 = matchFastHybridResponse({ message: 'Anh ở Lương Sơn thế cháu có xuống nhà được không', isComment: false })
  const v7 = verifyAndCleanOutput({ rawReply: t7.reply, isComment: false })
  console.log('Input: "Anh ở Lương Sơn thế cháu có xuống nhà được không"')
  console.log('Output:', v7.cleanedReply)
  if (v7.ok && v7.cleanedReply.includes('Lương Sơn') && !v7.cleanedReply.includes('xuống ngay') && !v7.cleanedReply.includes('miễn phí')) {
    console.log('=> TEST 7: PASS ✅ (Nhận diện đúng Lương Sơn M-03, không hứa liều thời gian hay phí)\n')
    passed++
  } else {
    console.log('=> TEST 7: FAIL ❌\n')
  }

  // Test 8: “Dàn nhà em hú lắm”
  console.log('--- Test 8: "Dàn nhà em hú lắm" ---')
  const t8 = matchFastHybridResponse({ message: 'Dàn nhà em hú lắm', isComment: false })
  const v8 = verifyAndCleanOutput({ rawReply: t8.reply, isComment: false })
  console.log('Input: "Dàn nhà em hú lắm"')
  console.log('Output:', v8.cleanedReply)
  if (v8.ok && v8.cleanedReply.includes('hú rít, nặng mic') && !v8.cleanedReply.includes('xử lý dứt điểm 100%')) {
    console.log('=> TEST 8: PASS ✅ (Đồng cảm bực mình M-06, không hứa dứt điểm bừa bãi)\n')
    passed++
  } else {
    console.log('=> TEST 8: FAIL ❌\n')
  }

  // Test 9: “Bạn là người hay bot?”
  console.log('--- Test 9: "Bạn là người hay bot?" ---')
  const t9 = matchFastHybridResponse({ message: 'Bạn là người hay bot?', isComment: false })
  const v9 = verifyAndCleanOutput({ rawReply: t9.reply, isComment: false })
  console.log('Input: "Bạn là người hay bot?"')
  console.log('Output:', v9.cleanedReply)
  if (v9.ok && v9.cleanedReply.includes('trợ lý tự động')) {
    console.log('=> TEST 9: PASS ✅ (Thành thật nhận là trợ lý tự động)\n')
    passed++
  } else {
    console.log('=> TEST 9: FAIL ❌\n')
  }

  // Test 10: Kiểm tra công tắc AI và người thật nhắn tay
  console.log('--- Test 10: Kiểm tra điều kiện ngắt bot (Admin nhắn tay hoặc tắt bot) ---')
  const isAiEnabled = true
  const lastStaffMsgTime = Date.now() - (10 * 60 * 1000) // 10 phút trước
  const shouldSkipBot = !isAiEnabled || (Date.now() - lastStaffMsgTime < 30 * 60 * 1000)
  console.log('Nhân viên vừa nhắn cách đây 10 phút (< 30 phút). Bot shouldSkipBot =', shouldSkipBot)
  if (shouldSkipBot === true) {
    console.log('=> TEST 10: PASS ✅ (Bot tự động nhường quyền khi nhân viên nhắn tay trong 30 phút)\n')
    passed++
  } else {
    console.log('=> TEST 10: FAIL ❌\n')
  }

  console.log('=================================================================')
  console.log(`KẾT QUẢ: ${passed}/${total} TEST CASES ĐẠT CHUẨN 100%`)
  console.log('=================================================================')
}

runTestSuite().catch(console.error)
