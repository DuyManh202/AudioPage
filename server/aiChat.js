import { randomUUID } from 'crypto'
import { query } from './db.js'
import { findProvince } from './vietnamProvinces.js'
import { getAiPsychologicalTrainingContext } from './aiPsychologicalTraining.js'
import { verifyAndCleanOutput, TEMPLATES } from './aiConsultantV2.js'

export const phoneFromMessage = (value) => {
  const match = String(value || '').match(/(?:\+?84|0)(?:[\s().-]*\d){8,10}/)
  if (!match) return null
  const digits = match[0].replace(/\D/g, '')
  const normalized = digits.startsWith('84') ? `0${digits.slice(2)}` : digits
  return /^0\d{9,10}$/.test(normalized) ? normalized : null
}

export const addressFromMessage = value => {
  const text = String(value || '').replace(/\r/g, '\n').trim()
  const labeled = text.match(/(?:địa\s*chỉ(?:\s*(?:nhận hàng|giao hàng))?|địa điểm nhận|đ\s*\/\s*c|đc|giao\s*(?:hàng|về|đến)|ship\s*(?:về|đến|tới)|nhận\s*hàng\s*(?:tại|ở)?|nhà\s*(?:em|anh|chị|mình)\s*(?:ở|tại))\s*[:：-]?\s*([\s\S]+)/i)
  if (!labeled) return null
  let address = labeled[1].trim().split(/\n+/)[0].slice(0, 200).trim()
  return address || null
}

export const normalizeTextSimple = (str) => {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

export const checkDeterministicAiResponse = (message) => {
  const norm = normalizeTextSimple(message)

  // 0. Khách gửi số điện thoại / Zalo trong tin nhắn
  const detectedPhone = phoneFromMessage(message)
  if (detectedPhone) {
    return {
      type: 'PHONE_CAPTURED',
      reply: `Dạ vâng anh, em Tú đã nhận được số Zalo ${detectedPhone} của anh rồi ạ! Em kết bạn nhắn qua Zalo với anh ngay bây giờ nhé anh!`
    }
  }

  // 0.1 Khách gửi icon, like, nhãn dán, sticker 👍
  const isIconOrSticker = (
    norm.includes('nhan dan') || norm.includes('icon') || norm.includes('sticker') ||
    message.includes('👍') || message.includes('👏') || message.includes('❤️') ||
    norm === 'like' || norm.includes('(y)') || norm.includes('[khach gui icon')
  )
  if (isIconOrSticker) {
    return {
      type: 'ICON_STICKER',
      reply: 'Dạ em Tú Audio xin chào anh ạ! Anh nhắn em xin số Zalo em tư vấn cấu hình dàn hoặc vang số trực tiếp cho tiện và nhanh nhất nhé anh!'
    }
  }

  // 1. Vang số CM x16+ và PF K9
  if (
    norm.includes('cm x16') || norm.includes('cmx16') || norm.includes('x16+') || norm.includes('x16') ||
    norm.includes('pf k9') || norm.includes('k9')
  ) {
    return {
      type: 'VANG_SO',
      reply: 'Dạ vâng a, vang số bên em có các dòng chống hú rít tuyệt đối và tiếng mic rất nhẹ. Bác cho em xin số Zalo để anh Tú gọi điện tư vấn chi tiết cấu hình và báo giá tốt nhất cho dàn nhà mình nhé ạ!'
    }
  }

  // 2. Giá các gói Combo Dàn Karaoke / Loa gia đình
  if (
    (norm.includes('combo') || norm.includes('dan') || norm.includes('bo dan') || norm.includes('loa') || norm.includes('tron goi')) &&
    (norm.includes('gia') || norm.includes('bao nhieu') || norm.includes('tu van') || norm.includes('co nhung') || norm.includes('nhiu'))
  ) {
    return {
      type: 'COMBO',
      reply: 'Dạ vâng a, bên em có các cấu hình dàn chuyên nghiệp chuẩn phòng hát gia đình. Bác cho em xin số Zalo để anh Tú gọi điện tư vấn chi tiết cấu hình và báo giá tốt nhất cho mình nhé ạ!'
    }
  }

  // 3. Địa chỉ showroom / Cửa hàng ở đâu / Test dàn trực tiếp
  if (
    norm.includes('dia chi') || norm.includes('o dau') || norm.includes('cho nao') ||
    norm.includes('cua hang') || norm.includes('showroom') || norm.includes('den xem') ||
    norm.includes('test dan') || norm.includes('qua xem') || norm.includes('shop o dau') ||
    norm.includes('nha o dau') || norm.includes('dia diem')
  ) {
    return {
      type: 'ADDRESS',
      reply: 'Dạ showroom Tú Audio bên em ở tại số 220 đường Nguyễn Danh Phương, phường Hội Hợp, TP. Vĩnh Yên, tỉnh Vĩnh Phúc ạ (gần ngã tư Quán Tiên, có chỗ đỗ ô tô thoải mái). Anh/bác nhắn em xin số Zalo em gửi định vị chi tiết qua cho tiện nhé ạ!'
    }
  }

  // 3.1 Khách hỏi về Loa kéo / Chỉnh loa kéo / Sửa loa kéo (Tú Audio chuyên dàn karaoke gia đình, TUYỆT ĐỐI không làm loa kéo)
  if (
    norm.includes('loa keo') || norm.includes('lo keo') || norm.includes('keo di dong') ||
    norm.includes('loa keo keo') || norm.includes('chinh loa keo')
  ) {
    return {
      type: 'NO_PORTABLE_SPEAKER',
      reply: 'Dạ bên em chuyên phân phối dàn karaoke gia đình và thiết bị phòng hát cao cấp, bên em không nhận chỉnh loa kéo anh ạ. Nếu anh muốn nâng cấp sang dàn karaoke chuẩn để hát nhẹ, tiếng bay bổng và chống hú tuyệt đối, anh nhắn em xin số Zalo em tư vấn cấu hình phù hợp phòng nhà mình nhé anh!'
    }
  }

  // 3.9 Khách hỏi có xuống luôn / qua ngay / hôm nay có qua được không (Tránh hẹn bừa, khéo léo giải thích lịch công tác & xin số)
  if (
    norm.includes('xuong luon') || norm.includes('qua luon') || norm.includes('den luon') ||
    norm.includes('xuong ngay') || norm.includes('qua ngay') || norm.includes('den ngay') ||
    (norm.includes('hom nay') && (norm.includes('qua') || norm.includes('xuong') || norm.includes('den') || norm.includes('chinh') || norm.includes('ban khong'))) ||
    (norm.includes('chieu nay') && (norm.includes('qua') || norm.includes('xuong') || norm.includes('den') || norm.includes('chinh'))) ||
    norm.includes('co xuong duoc khong') || norm.includes('co qua duoc khong') || norm.includes('co den duoc khong') ||
    norm.includes('xuong duoc khong') || norm.includes('qua duoc khong') || norm.includes('den duoc khong')
  ) {
    return {
      type: 'IMMEDIATE_VISIT_CHECK',
      reply: 'Dạ hôm nay em Tú và anh em kỹ thuật đang có chuyến công tác, đi hỗ trợ theo tuyến các bác khách đã đặt lịch từ trước rồi ạ. Bác cứ yên tâm nhé, bên em luôn ưu tiên sắp xếp thời gian tiện nhất cho bác. Bác cho em xin số điện thoại hoặc Zalo để lát nữa em Tú gọi điện trao đổi cụ thể và hẹn khung giờ tiện nhất cho bác nhé ạ!'
    }
  }

  // 4. Khách hỏi dịch vụ Căn chỉnh / Setup tận nhà / Chi phí đi lại
  if (
    norm.includes('setup') || norm.includes('can chinh') || norm.includes('chinh giup') ||
    norm.includes('di chinh') || norm.includes('chinh khong') || norm.includes('chinh vang') ||
    norm.includes('qua nha') || norm.includes('ve nha') || norm.includes('den nha') ||
    norm.includes('tai nha') || norm.includes('chinh dan') || norm.includes('set up') ||
    norm.includes('chinh ho') || norm.includes('can giup')
  ) {
    return {
      type: 'SETUP_HOME',
      reply: 'Dạ bên em CÓ nhận qua tận nhà căn chỉnh âm thanh ạ. Anh cho em xin số Zalo để em gọi trao đổi cụ thể và hẹn lịch tiện chuyến qua hỗ trợ anh nhé!'
    }
  }

  // 5. Khách hỏi về Lọc xì / Equalizer / Nâng tiếng
  if (
    norm.includes('loc xi') || norm.includes('equalizer') || norm.includes('eq') ||
    norm.includes('nang tieng') || norm.includes('co can loc') || norm.includes('them loc')
  ) {
    return {
      type: 'EQUALIZER_ADVICE',
      reply: 'Dạ anh ơi, đã dùng vang số chuẩn rồi thì không cần ghép lọc xì đâu ạ, dễ méo tiếng. Anh cho em xin số Zalo em hướng dẫn anh chỉnh lại vang số là tiếng sáng đẹp ngay nhé anh!'
    }
  }

  // 6. Khách hỏi Thu cũ đổi mới thiết bị
  if (
    norm.includes('thu cu') || norm.includes('doi moi') || norm.includes('doi vang') ||
    norm.includes('len doi') || norm.includes('doi cac') || norm.includes('doi cu')
  ) {
    return {
      type: 'TRADE_IN',
      reply: 'Dạ bên em CÓ nhận thu cũ đổi mới lên vang số chống hú ạ. Anh cho em xin số Zalo gửi ảnh máy cũ em định giá hỗ trợ mình cụ thể nhé anh!'
    }
  }

  // 7. Khách hỏi nghe thử trước khi mua / Đổi trả / Hoàn tiền
  if (
    norm.includes('nghe thu') || norm.includes('hat thu') || norm.includes('doi tra') ||
    norm.includes('tra lai') || norm.includes('khong hay') || norm.includes('bao hanh')
  ) {
    return {
      type: 'TRIAL_POLICY',
      reply: 'Dạ bên em bao test 7 ngày, nhận hàng hát thử ưng ý mới thanh toán ạ. Anh cho em xin số Zalo em tư vấn chi tiết cho tiện nhé anh!'
    }
  }

  // 8. Chào hỏi / Nút BẮT ĐẦU (Get Started) trên Facebook Messenger
  if (
    norm === 'bat dau' || norm.includes('bat dau') || norm === 'chao' || norm === 'xin chao' ||
    norm.startsWith('alo') || norm.startsWith('chao') || norm === 'hi' || norm === 'hello'
  ) {
    return {
      type: 'GREETING',
      reply: 'Dạ em Tú Audio xin chào anh ạ! Anh nhắn em xin số Zalo em tư vấn cấu hình dàn hoặc vang số trực tiếp cho tiện và nhanh nhất nhé anh!'
    }
  }

  // 9. Tải phần mềm vang số / driver / setup vang
  if (
    norm.includes('phan mem') || norm.includes('tai phan mem') || norm.includes('driver') ||
    norm.includes('link tai') || norm.includes('cai dat vang') || norm.includes('chinh vang')
  ) {
    return {
      type: 'SOFTWARE',
      reply: 'Dạ anh nhắn em xin số Zalo em gửi link tải phần mềm driver và hỗ trợ cắm Ultraview chỉnh vang miễn phí cho anh luôn nhé!'
    }
  }

  // 10. Khách hỏi số điện thoại / Hotline / Zalo của shop
  const isAskingHotline = (
    norm.includes('xin sdt') || norm.includes('xin so dien thoai') || norm.includes('xin so dt') ||
    norm.includes('hotline') || norm.includes('cho sdt') || norm.includes('cho xin so') ||
    norm.includes('sdt cua shop') || norm.includes('so cua shop') || norm.includes('so anh tu') ||
    norm.includes('gap anh tu') || norm.includes('so zalo') || norm.includes('lien he voi shop') ||
    norm.includes('goi dien cho shop')
  ) && !norm.includes('sdt toi') && !norm.includes('so cua toi') && !norm.includes('sdt cua em')

  if (isAskingHotline) {
    return {
      type: 'HOTLINE',
      reply: 'Dạ số Zalo và hotline trực tiếp của em Tú là 0984.259.898 ạ. Hoặc anh nhắn lại số Zalo của anh tại đây, em Tú kết bạn tư vấn trực tiếp ngay nhé anh!'
    }
  }

  return null
}

const getDbGeminiApiKey = async () => {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY
  try {
    const res = await query("SELECT value FROM system_settings WHERE key = 'gemini_api_key'")
    return res.rows[0]?.value || ''
  } catch {
    return ''
  }
}

const getDbGeminiModel = async () => {
  if (process.env.GEMINI_MODEL) return process.env.GEMINI_MODEL
  try {
    const res = await query("SELECT value FROM system_settings WHERE key = 'gemini_model'")
    return res.rows[0]?.value || 'gemini-3.8-flash'
  } catch {
    return 'gemini-3.8-flash'
  }
}

export const handleAiChatRequest = async (req, res) => {
  try {
    const settingRes = await query("SELECT value FROM system_settings WHERE key = 'web_ai_enabled'").catch(() => ({ rows: [] }))
    if (settingRes.rows[0]?.value === false) {
      return res.status(503).json({ success: false, message: 'Trợ lý AI trên website hiện đang tạm tắt để nhân viên trực tiếp hỗ trợ.' })
    }

    const { message, history = [], sessionId, customerName: inputName } = req.body
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống.' })
    }

    const trimmedMsg = message.trim()
    const inferredPhone = phoneFromMessage(trimmedMsg)
    const inferredAddress = addressFromMessage(trimmedMsg)
    const inferredProvince = findProvince(trimmedMsg, { requireContext: false }) || (inferredAddress ? findProvince(inferredAddress) : null)

    // CRM Lead Auto-Sync khi khách để lại số điện thoại
    if (inferredPhone) {
      try {
        const customerId = 'WEB-' + inferredPhone
        const resolvedName = inputName?.trim() || 'Khách Web ' + inferredPhone.slice(-4)

        // 1. Ghi nhận vào facebook_care_customers (để hiển thị pin đỏ trên Bản Đồ Khách Hàng)
        await query(`
          INSERT INTO facebook_care_customers
            (id, customer_name, facebook_id, phone, status, last_message, source_type, province, location_lat, location_lng, address, created_at, updated_at)
          VALUES ($1, $2, NULL, $3, 'MOI', $4, 'WEBSITE', $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET
            customer_name = CASE WHEN facebook_care_customers.customer_name LIKE 'Khách Web %' AND EXCLUDED.customer_name NOT LIKE 'Khách Web %' THEN EXCLUDED.customer_name ELSE facebook_care_customers.customer_name END,
            last_message = EXCLUDED.last_message,
            province = CASE WHEN facebook_care_customers.location_manually_set THEN facebook_care_customers.province ELSE COALESCE(EXCLUDED.province, facebook_care_customers.province) END,
            location_lat = CASE WHEN facebook_care_customers.location_manually_set THEN facebook_care_customers.location_lat ELSE COALESCE(EXCLUDED.location_lat, facebook_care_customers.location_lat) END,
            location_lng = CASE WHEN facebook_care_customers.location_manually_set THEN facebook_care_customers.location_lng ELSE COALESCE(EXCLUDED.location_lng, facebook_care_customers.location_lng) END,
            address = COALESCE(NULLIF(facebook_care_customers.address, ''), EXCLUDED.address),
            updated_at = CURRENT_TIMESTAMP
        `, [
          customerId,
          resolvedName,
          inferredPhone,
          trimmedMsg,
          inferredProvince?.displayName || null,
          inferredProvince?.lat || null,
          inferredProvince?.lng || null,
          inferredAddress || inferredProvince?.displayName || null
        ])

        // 2. Ghi nhận vào leads (Phễu Khách Tư Vấn & Thử Dàn)
        await query(`
          INSERT INTO leads (id, name, phone, address, interest, status, notes)
          VALUES ($1, $2, $3, $4, $5, 'MOI', $6)
        `, [
          'LD-' + randomUUID(),
          resolvedName,
          inferredPhone,
          inferredAddress || inferredProvince?.displayName || 'Website AI Chatbot',
          'Tư vấn qua AI Chatbot Website',
          'Khách để lại số điện thoại trên Website. Lời nhắn: ' + trimmedMsg.slice(0, 300)
        ])

        // 3. Lưu tin nhắn vào bảng tin nhắn chăm sóc
        await query(`
          INSERT INTO facebook_care_messages (id, customer_id, body, direction, created_by)
          VALUES ($1, $2, $3, 'IN', 'Khách Web')
        `, [randomUUID(), customerId, trimmedMsg]).catch(() => {})
      } catch (crmErr) {
        console.warn('[AI Chatbot CRM Sync Warning]:', crmErr.message)
      }
    }

    // Lấy ngữ cảnh kho hàng từ Database
    const [productsRes, combosRes] = await Promise.all([
      query(`SELECT name, price, original_price, room_size, bass_size, power_rms, short_desc
        FROM products WHERE in_stock=TRUE ORDER BY price ASC LIMIT 20`),
      query(`SELECT name, price, fast_action_price, room_size, tagline FROM combos ORDER BY price ASC`)
    ])

    const catalogContext = {
      products: productsRes.rows.map(p => ({
        name: p.name,
        price: Number(p.price),
        room_size: p.room_size,
        desc: p.short_desc || ''
      })),
      combos: combosRes.rows.map(c => ({
        name: c.name,
        price: Number(c.price),
        room_size: c.room_size,
        tagline: c.tagline || ''
      }))
    }

    const psychologicalContext = await getAiPsychologicalTrainingContext()

    const systemInstruction = `BẠN LÀ ANH PHÙNG VĂN TÚ (TÚ AUDIO - Hotline/Zalo: 0984.259.898 tại 220 Nguyễn Danh Phương, Vĩnh Yên, Vĩnh Phúc).
BẠN ĐANG TRỰC TIẾP TRÒ CHUYỆN, TÂM SỰ VÀ TƯ VẤN CHO KHÁCH HÀNG NHƯ MỘT NGƯỜI BẠN MÊ ÂM THANH TRI KỶ.

BỘ NÃO TỰ ĐỘNG ĐỌC VỊ TÍNH CÁCH & ĐÁNH VÀO TÂM LÝ TỪNG KHÁCH HÀNG:
1. ĐỌC VỊ TÍNH CÁCH TỪNG NGƯỜI (TỰ ĐỘNG THÍCH ỨNG 100%):
   - KHÁCH SÀNH SỎI / KỸ TÍNH (Nhắc tên vang số X5, loa bass 30 bãi Mỹ, cục đẩy, tần số...):
     -> Nói chuyện ngang tầm kỹ sư âm thanh chuyên nghiệp. Khen thiết bị khách đang có, giải thích cặn kẽ nguyên lý âm học (vì sao loa full bass 30 giải phóng tiếng trung rất sáng nhưng thiếu dải trầm sâu 40-70Hz, vì sao thêm sub tiếng hát sẽ dày ấm và đầm hơn hẳn).
   - KHÁCH BÌNH DÂN, MỘC MẠC (Hỏi ngắn, dùng từ ngữ chân chất: "bác có đi chỉnh ko", "chỉnh vang ko em", "bao tiền"):
     -> Trò chuyện gần gũi, ấm áp như anh em một nhà. Xưng "em" hoặc "em Tú", gọi "bác" hoặc "anh". Tuyệt đối không dùng từ ngữ cao siêu khó hiểu.
   - KHÁCH BỨC XÚC / ĐAU KHỔ VÌ HÚ RÍT, HÁT NẶNG, MUA ĐỒ VỀ HÁT KHÔNG HAY:
     -> Lập tức đồng cảm sâu sắc, "chia lửa" cùng khách: Em hiểu cái cảm giác bỏ tiền triệu ra sắm dàn về mà hát bí tiếng, rú ré lên điếc tai nó ức chế thế nào... Khẳng định ngay 90% là do vang số chưa cắt đúng dải tần triệt tiêu chứ không phải tại giọng anh.
   - KHÁCH DÈ DẶT, SỢ BỊ LỪA, SỢ HÀNG NHÁI / SỢ MUA HỚ:
     -> Không vồ vập bán hàng. Chia sẻ thẳng thắn, tâm sự thật lòng kinh nghiệm làm nghề và mách nước cách tự kiểm tra trước để khách thấy sự tử tế và uy tín tuyệt đối của Tú Audio.

2. NGHỆ THUẬT TÂM SỰ & XIN SỐ ĐIỆN THOẠI (TUÂN THỦ 100% THEO CHỈ THỊ ANH TÚ):
   - Nói chuyện tự nhiên, có cảm xúc, linh hoạt và thông minh như một con người thực thụ. Tuyệt đối KHÔNG trả lời như robot, KHÔNG dùng mẫu câu rập khuôn, KHÔNG lặp lại tin nhắn cũ.
   - TUYỆT ĐỐI KHÔNG HẸN KHÁCH TRƯỚC: CẤM tự ý hẹn ngày giờ, CẤM hẹn chạy qua nhà, CẤM hứa mang máy tính mic đo RTA qua nhà, CẤM nói về "ghép chuyến" hay "sổ lịch trình". Việc hẹn lịch là do anh Tú hoặc thợ kỹ thuật gọi điện thoại trực tiếp chốt với khách, bot tuyệt đối không được tự ý hẹn trước!
   - KHI KHÁCH HỎI CÓ XUỐNG LUÔN / QUA NGAY ĐƯỢC KHÔNG (Ví dụ: "thế cháu có xuống luôn được không", "chiều qua luôn được không"):
     + Hoàn cảnh: Anh Tú và kỹ thuật thường xuyên đi công tác xa, đi tuyến lắp dàn đã có lịch hẹn trước của các bác khách khác.
     + Nguyên tắc giữ chân khách: TUYỆT ĐỐI KHÔNG HẸN BỪA (không nhận lời qua luôn), KHÔNG TỪ CHỐI CỘC LỐC (không nói bận/không qua được).
     + Cách trả lời chuẩn (ngắn gọn 2-3 câu): Khéo léo giải thích hôm nay em Tú và anh em đang có chuyến công tác/hỗ trợ lắp đặt theo tuyến các bác khách đặt trước; cam kết bên em luôn ưu tiên sắp xếp lịch thuận tiện nhất; xin số điện thoại/Zalo để lát nữa em Tú gọi điện trao đổi về dàn và hẹn khung giờ tiện nhất cho bác ở nhà đón anh em ghé qua hỗ trợ nhé ạ!
   - KHI KHÁCH CHƯA CHO SỐ: Giải đáp ngắn gọn, đúng trọng tâm và xin số điện thoại/Zalo để bên em gọi điện tư vấn trực tiếp cho tiện (Ví dụ: "Bác cho em xin số điện thoại/Zalo để bên em gọi điện tư vấn cụ thể cho bác nhé ạ!").
   - KHI KHÁCH ĐÃ CHO SỐ: CHỈ CẢM ƠN KHÁCH VÀ BÁO ĐÃ NHẬN ĐƯỢC SỐ, LÁT NỮA BÊN EM SẼ GỌI ĐIỆN LẠI! (Ví dụ: "Dạ em Tú cảm ơn anh/bác ạ! Em đã lưu số rồi, lát nữa bên em sẽ gọi điện trao đổi trực tiếp với anh/bác nhé ạ!").

3. NGUYÊN TẮC CỐT LÕI VỀ DỊCH VỤ & SẢN PHẨM:
   - DỊCH VỤ CĂN CHỈNH / TƯ VẤN KỸ THUẬT: Khẳng định bên em CÓ nhận hỗ trợ kỹ thuật căn chỉnh vang số và setup dàn âm thanh. Nhưng KHÔNG HẸN TRƯỚC TRÊN TIN NHẮN, CHỈ XIN SỐ XONG CẢM ƠN THÔI.
   - NÂNG CẤP ĐỒ CŨ & THU CŨ ĐỔI MỚI: Luôn ưu tiên giữ lại món đồ nào còn tốt để tiết kiệm tiền cho khách, chỉ tư vấn nâng cấp món thực sự cần thiết.
   - ĐÃ CÓ VANG SỐ THÌ KHÔNG CẦN LỌC XÌ (EQUALIZER): Thợ bán cố vẽ ra để lấy tiền, tín hiệu qua nhiều tầng bị méo pha; giải pháp gốc rễ là chỉnh chuẩn EQ trong vang số.
   - TUYỆT ĐỐI CẤM DUY NHẤT: KHÔNG bán loa kéo di động, KHÔNG nhận sửa chữa đồ điện tử hư hỏng mạch công suất cháy nổ. Lịch sự định hướng khách sang dàn karaoke gia đình.

THÔNG TIN ĐỘC QUYỀN CHÍNH XÁC:
- Địa chỉ showroom: Số 220 đường Nguyễn Danh Phương, phường Hội Hợp, thành phố Vĩnh Yên, tỉnh Vĩnh Phúc (gần khu Quán Tiên, có chỗ đỗ ô tô thoải mái).
- Hotline / Zalo: 0984.259.898.
- Vang số tiêu biểu:
  + Vang số CM x16+ chính hãng: 4.200.000đ (dòng quốc dân, chống hú 99%, cài sẵn 4 cấu hình Echo/Reverb chuẩn).
  + Vang số PF K9: 6.800.000đ (chip DSP cao cấp, tiếng Reverb sâu mịn, hát rất nhẹ).
- Combo dàn gia đình:
  + Combo Gold Home (19.800.000đ): phòng 20 - 30m2.
  + Combo Luxury Home (29.900.000đ): phòng 30 - 45m2.

${psychologicalContext}

DANH MỤC SẢN PHẨM & GÓI COMBO ĐANG CÓ TRONG KHO:
${JSON.stringify(catalogContext)}`

    const recentHistory = Array.isArray(history) ? history.slice(-6).map(h => `${h.role === 'user' ? 'Khách' : 'Tú Audio'}: ${h.content}`).join('\n') : ''

    const apiKey = await getDbGeminiApiKey()
    const model = await getDbGeminiModel()
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey

    const promptText = systemInstruction + '\n\n' + (recentHistory ? 'LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:\n' + recentHistory + '\n\n' : '') + 'TIN NHẮN MỚI CỦA KHÁCH:\n"' + trimmedMsg + '"\n\nHãy phân tích kỹ ý định thực sự của khách và trả lời đúng trọng tâm câu hỏi, chuẩn phong cách chuyên gia âm thanh Tú Audio:'

    let reply = ''
    let isAiGenerated = false

    try {
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: promptText }]
            }
          ],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 2048,
            thinkingConfig: { thinkingBudget: 0 }
          }
        }),
        signal: AbortSignal.timeout(15000)
      })

      const geminiData = await geminiRes.json().catch(() => ({}))
      const cand = geminiData.candidates?.[0]
      const rawText = cand?.content?.parts?.[0]?.text?.trim()
      if (rawText) {
        const verified = verifyAndCleanOutput({
          rawReply: rawText,
          finishReason: cand?.finishReason,
          hasPhone: Boolean(inferredPhone),
          isComment: false
        })
        if (verified.ok) {
          reply = verified.cleanedReply
          isAiGenerated = true
        } else if (verified.fallback) {
          reply = verified.fallback
        }
      }
    } catch (aiErr) {
      console.warn('[Gemini AI Fetch Warning]:', aiErr.message)
    }

    // Nếu Gemini gặp lỗi mạng hoặc không trả về -> Dự phòng bằng Guardrail chuẩn xác
    if (!reply) {
      const fallbackDeterministic = checkDeterministicAiResponse(trimmedMsg)
      reply = fallbackDeterministic?.reply || TEMPLATES.M23_DU_PHONG_LOI
    }

    if (inferredPhone) {
      await query(`
        INSERT INTO facebook_care_messages (id, customer_id, body, direction, created_by)
        VALUES ($1, $2, $3, 'OUT', 'AI Tú Audio')
      `, [randomUUID(), 'WEB-' + inferredPhone, reply]).catch(() => {})
    }

    res.json({
      success: true,
      reply,
      leadCaptured: Boolean(inferredPhone),
      isAi: isAiGenerated,
      model: isAiGenerated ? model : 'fallback'
    })
  } catch (err) {
    console.error('[AI Chatbot Error]:', err.message)
    res.json({
      success: true,
      reply: 'Dạ, em Tú Audio xin chào bác ạ! Bác đang muốn nâng cấp vang số hay tìm dàn karaoke trọn gói cho phòng khách gia đình ạ? Bác có thể nhắn trực tiếp số Zalo 0984.259.898 hoặc để lại số điện thoại em gọi tư vấn và gửi clip test tiếng chi tiết cho bác nhé ạ!'
    })
  }
}
