import { randomUUID } from 'crypto'
import { query } from './db.js'
import { findProvince } from './vietnamProvinces.js'

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

  // 1. Vang số CM x16+ và PF K9
  if (
    norm.includes('cm x16') || norm.includes('cmx16') || norm.includes('x16+') || norm.includes('x16') ||
    norm.includes('pf k9') || norm.includes('k9')
  ) {
    return {
      type: 'VANG_SO',
      reply: 'Dạ, 2 dòng vang số cao cấp đang bán chạy nhất tại Tú Audio gồm:\n\n1. Vang số CM x16+ chính hãng: 4.200.000đ — Dòng vang số quốc dân, chip xử lý cao cấp, chống hú rít 99%, đã cài đặt sẵn 4 chế độ Echo/Reverb chuẩn cho giọng hát gia đình.\n2. Vang số cao cấp PF K9: 6.800.000đ — Chip xử lý DSP 32-bit thế hệ mới, giải mã âm thanh siêu chi tiết, tiếng Reverb mịn sâu, Echo mượt mà, chống rú rít tuyệt đối.\n\n🎁 Đặc biệt khi mua vang số tại Tú Audio, em đều tự tay setup thông số chuẩn theo không gian phòng và chất giọng của bác, tặng kèm đầy đủ dây Canon kết nối xịn và bảo hành 12 tháng lỗi 1 đổi 1 ạ! Bác đang phối ghép với cục đẩy hay amply gì thế ạ?'
    }
  }

  // 2. Giá các gói Combo Dàn Karaoke gia đình
  if (
    (norm.includes('combo') || norm.includes('dan karaoke') || norm.includes('bo dan') || norm.includes('tron goi')) &&
    (norm.includes('gia') || norm.includes('bao nhieu') || norm.includes('tu van') || norm.includes('co nhung'))
  ) {
    return {
      type: 'COMBO',
      reply: 'Dạ, Tú Audio có 2 cấu hình dàn karaoke gia đình đồng bộ chuẩn âm học đang được các bác chuộng nhất:\n\n1. Combo Gold Home (19.800.000đ): Phù hợp phòng 20 - 30m2. Cấu hình gồm cục đẩy công suất lớn, vang số chống hú setup sẵn, micro không dây bắt mic trợ giọng tốt, loa Full bass 30cm tiếng sáng thoát âm.\n2. Combo Luxury Home (29.900.000đ): Phù hợp phòng 30 - 45m2 hoặc thông tầng. Cấu hình cao cấp chuẩn quán hát gia đình, tiếng bass đánh chắc nịch, hát nhẹ tênh không tốn hơi.\n\nBác cho em hỏi phòng khách nhà bác rộng khoảng bao nhiêu m2 và không gian kín hay có thông cầu thang để em tư vấn cấu hình vừa vặn nhất ạ?'
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
      reply: 'Dạ, cửa hàng Tú Audio bên em ở tại số 220 đường Nguyễn Danh Phương, phường Hội Hợp, thành phố Vĩnh Yên, tỉnh Vĩnh Phúc (gần khu Quán Tiên, nhà mặt đường rộng rãi có chỗ đỗ ô tô thoải mái ạ).\n\nCửa hàng mở cửa từ 8h00 đến 21h00 tất cả các ngày trong tuần. Bác ghé lúc nào cũng có sẵn phòng test âm thanh thực tế với đầy đủ các cấu hình để bác trải nghiệm trực tiếp chất âm ạ!'
    }
  }

  // 4. Khách hỏi dịch vụ Căn chỉnh / Setup tận nhà / Chi phí đi lại
  if (
    norm.includes('setup') || norm.includes('can chinh') || norm.includes('chinh giup') ||
    norm.includes('qua nha') || norm.includes('ve nha') || norm.includes('den nha') ||
    norm.includes('tai nha') || norm.includes('chinh dan') || norm.includes('set up') ||
    norm.includes('chinh ho') || norm.includes('can giup')
  ) {
    return {
      type: 'SETUP_HOME',
      reply: 'Dạ vâng em CÓ nhận qua tận nhà căn chỉnh và setup lại dàn âm thanh cho các bác ạ!\n\nEm ở ngay Vĩnh Yên và thường xuyên có các chuyến đi qua Hà Nội, Đông Anh, Mê Linh, Bắc Ninh, Bắc Giang, Hải Phòng, Thanh Hóa... Chi phí đi lại em hỗ trợ ghép chuyến nên rất hợp lý.\n\nBác nhắn giúp em số điện thoại hoặc kết bạn Zalo em 0984.259.898, chụp gửi em ảnh bộ dàn nhà mình đang dùng để em xem trước thiết bị và hẹn lịch tiện chuyến qua phục vụ bác nhé ạ!'
    }
  }

  // 5. Khách hỏi về Lọc xì / Equalizer / Nâng tiếng
  if (
    norm.includes('loc xi') || norm.includes('equalizer') || norm.includes('eq') ||
    norm.includes('nang tieng') || norm.includes('co can loc') || norm.includes('them loc')
  ) {
    return {
      type: 'EQUALIZER_ADVICE',
      reply: 'Dạ anh ơi, đã dùng Vang số chuẩn rồi thì TUYỆT ĐỐI KHÔNG CẦN ghép thêm lọc xì hay nâng tiếng đâu anh nhé!\n\nTrong vang số cao cấp (như CM x16+, PF K9...) đã tích hợp sẵn hệ thống Equalizer tham số (PEQ) cực kỳ chi tiết cho cả đường mic và đường nhạc. Thợ tư vấn lắp thêm lọc xì là họ cố vẽ ra để bán lấy tiền thôi ạ. Ghép nhiều thiết bị tín hiệu qua nhiều tầng xử lý bị méo pha và bí tiếng.\n\nNguyên nhân gốc rễ là ở cách phối ghép thiết bị và căn chỉnh vang số chứ không phải phần ngọn là lọc. Bác nhắn số Zalo qua 0984.259.898, em hỗ trợ chỉnh lại vang số là tiếng sáng đẹp ngay ạ!'
    }
  }

  // 6. Khách hỏi Thu cũ đổi mới thiết bị
  if (
    norm.includes('thu cu') || norm.includes('doi moi') || norm.includes('doi vang') ||
    norm.includes('len doi') || norm.includes('doi cac') || norm.includes('doi cu')
  ) {
    return {
      type: 'TRADE_IN',
      reply: 'Dạ bên em CÓ chính sách Thu cũ đổi mới hỗ trợ các bác lên đời thiết bị âm thanh ạ!\n\nBác đang dùng amply hoặc vang cơ, vang số đời cũ muốn lên dòng Vang số quốc dân CM x16+ (4.200.000đ) hay PF K9 (6.800.000đ) chống hú 99%, em đều hỗ trợ định giá thu lại tốt nhất.\n\nBác chụp giúp em ảnh mặt trước mặt sau thiết bị cũ gửi qua Zalo 0984.259.898 hoặc để lại số Zalo tại đây, em định giá và báo mức bù trừ cụ thể cho bác nhé ạ!'
    }
  }

  // 7. Khách hỏi nghe thử trước khi mua / Đổi trả / Hoàn tiền
  if (
    norm.includes('nghe thu') || norm.includes('hat thu') || norm.includes('doi tra') ||
    norm.includes('tra lai') || norm.includes('khong hay') || norm.includes('bao hanh')
  ) {
    return {
      type: 'TRIAL_POLICY',
      reply: 'Dạ bác hoàn toàn yên tâm 100% ạ! Phương châm làm nghề của em Tú là "Lấy chữ Tín làm đầu":\n\n1. Toàn bộ thiết bị em gửi đi đều được chính tay em Tú cắm máy đo RTA setup sẵn phần mềm chuẩn chỉ theo chất giọng của bác.\n2. Khi nhận hàng bác được mở kiểm tra, cắm hát thử thực tế ưng ý mới thanh toán tiền.\n3. Trong 7 ngày đầu trải nghiệm, nếu bác thấy chưa hợp hoặc không ưng, em hỗ trợ đổi cấu hình khác hoặc nhận lại hàng hoàn tiền đàng hoàng cho bác.\n\nBác nhắn em số Zalo 0984.259.898 em tư vấn cấu hình chuẩn cho nhà mình nhé ạ!'
    }
  }

  // 8. Tải phần mềm vang số / driver / setup vang
  if (
    norm.includes('phan mem') || norm.includes('tai phan mem') || norm.includes('driver') ||
    norm.includes('link tai') || norm.includes('cai dat vang') || norm.includes('chinh vang')
  ) {
    return {
      type: 'SOFTWARE',
      reply: 'Dạ, toàn bộ link tải phần mềm căn chỉnh vang số chuẩn của các dòng vang bên em (như CM x16+, PF K9, S690, X5, X6...) đều được cập nhật đầy đủ tại website https://tuaudio.vn.\n\nHoặc bác nhắn trực tiếp qua Zalo 0984.259.898, em gửi link Google Drive tốc độ cao và hỗ trợ kết nối máy tính chỉnh vang qua Ultraview/TeamViewer miễn phí cho bác nhé ạ!'
    }
  }

  // 9. Khách hỏi số điện thoại / Hotline / Zalo của shop
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
      reply: 'Dạ, số hotline và Zalo chính thức của em Tú Audio là 0984.259.898 ạ.\n\nBác có thể gọi trực tiếp hoặc kết bạn Zalo với em bất cứ lúc nào để em gửi video test chất âm bộ dàn thực tế và hỗ trợ kỹ thuật nhanh nhất cho bác nhé ạ!'
    }
  }

  return null
}

export const handleAiChatRequest = async (req, res) => {
  try {
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

    const systemInstruction = `Bạn là Trợ lý AI Chuyên Gia Âm Thanh của Tú Audio (thương hiệu âm thanh karaoke gia đình của anh Phùng Văn Tú tại Vĩnh Yên, Vĩnh Phúc).
Bối cảnh & Phong cách:
- Bạn đại diện cho em Tú tư vấn tận tâm cho khách ghé thăm website và khách nhắn từ mạng xã hội.
- Xưng "em" hoặc "em Tú", gọi khách là "bác" hoặc "anh" (phong cách chuyên gia âm thanh miền Bắc gần gũi, chân thành, nhiệt tình, am hiểu kỹ thuật).
- Tuyệt đối trung thực 100%, không bịa đặt số nhà hay giá ngoài danh mục dưới đây.

THÔNG TIN ĐỘC QUYỀN CHÍNH XÁC:
- Địa chỉ showroom: Số 220 đường Nguyễn Danh Phương, phường Hội Hợp, thành phố Vĩnh Yên, tỉnh Vĩnh Phúc (gần khu Quán Tiên, có chỗ đỗ ô tô thoải mái).
- Hotline / Zalo: 0984.259.898.
- Phần mềm vang số: Đầy đủ link tải driver và phần mềm cho CM x16+, PF K9, X5, X6, S690... trên website tuaudio.vn hoặc gửi qua Zalo 0984.259.898 kèm hỗ trợ Ultraview/TeamViewer miễn phí.
- Vang số tiêu biểu:
  + Vang số CM x16+ chính hãng: 4.200.000đ (dòng quốc dân, chống hú 99%, cài sẵn 4 cấu hình Echo/Reverb chuẩn).
  + Vang số PF K9: 6.800.000đ (chip DSP cao cấp, tiếng Reverb sâu mịn, hát rất nhẹ).
- Combo dàn gia đình:
  + Combo Gold Home (19.800.000đ): phòng 20 - 30m2.
  + Combo Luxury Home (29.900.000đ): phòng 30 - 45m2.

BỘ NGUYÊN TẮC TƯ VẤN THỰC CHIẾN (7 KỊCH BẢN CHUẨN):
1. Khách hỏi Setup / Căn chỉnh tại nhà (Đông Anh, Hà Nội, Bắc Ninh, Hải Phòng, Thanh Hóa...): Em CÓ nhận làm tại nhà, có ghép chuyến các tỉnh nên chi phí rất hợp lý; mời khách gửi ảnh dàn máy qua Zalo 0984.259.898 hoặc để lại số Zalo để em hẹn lịch.
2. Khách hỏi về Lọc xì / Equalizer: Khẳng định ngay là ĐÃ CÓ VANG SỐ THÌ KHÔNG CẦN LỌC XÌ. Thợ bán cố vẽ ra để lấy tiền, tín hiệu qua nhiều tầng bị méo pha; giải pháp gốc rễ là chỉnh chuẩn EQ trong vang số.
3. Khách hỏi Thu cũ đổi mới: Bên em có nhận thu cũ vang cơ/amply/vang X5 để lên vang số CM x16+ hoặc PF K9. Xin ảnh dàn máy cũ để định giá thu lại cao nhất.
4. Khách hỏi tải phần mềm / driver vang số: Hỏi rõ bác đang dùng vang model gì, mời kết bạn Zalo 0984.259.898 em gửi link Google Drive tốc độ cao và hỗ trợ Ultraview miễn phí.
5. Khách hỏi nghe thử / đổi trả: Cam kết tự tay em Tú setup đo RTA trước khi gửi, nhận hàng hát thử ưng ý mới thanh toán, bao test 7 ngày không ưng hoàn tiền.
6. Khách hỏi địa chỉ: Chỉ rõ số 220 Nguyễn Danh Phương, P. Hội Hợp, TP. Vĩnh Yên, Vĩnh Phúc (gần Quán Tiên, có chỗ đỗ ô tô).
7. Câu trả lời ngắn gọn, thông minh, đúng trọng tâm câu hỏi của khách (2-3 đoạn ngắn).
8. Luôn kết thúc bằng việc mời khách kết bạn Zalo hoặc để lại số điện thoại/Zalo (0984.259.898) để em gửi video test âm thanh thực tế hoặc gọi video khám bệnh dàn máy.

DANH MỤC SẢN PHẨM & GÓI COMBO ĐANG CÓ TRONG KHO:
${JSON.stringify(catalogContext)}`

    const recentHistory = Array.isArray(history) ? history.slice(-6).map(h => `${h.role === 'user' ? 'Khách' : 'Tú Audio'}: ${h.content}`).join('\n') : ''

    const apiKey = process.env.GEMINI_API_KEY
    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash'
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
            maxOutputTokens: 2048
          }
        }),
        signal: AbortSignal.timeout(15000)
      })

      const geminiData = await geminiRes.json().catch(() => ({}))
      reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      if (reply) isAiGenerated = true
    } catch (aiErr) {
      console.warn('[Gemini AI Fetch Warning]:', aiErr.message)
    }

    // Nếu Gemini gặp lỗi mạng hoặc không trả về -> Dự phòng bằng Guardrail chuẩn xác
    if (!reply) {
      const fallbackDeterministic = checkDeterministicAiResponse(trimmedMsg)
      reply = fallbackDeterministic?.reply || 'Dạ em Tú Audio đây ạ! Cảm ơn bác đã nhắn cho em. Bác cho em hỏi phòng khách nhà bác rộng bao nhiêu m2 hoặc bác đang quan tâm đến vang số hay cả bộ dàn để em tư vấn cấu hình chuẩn nhất cho bác ạ? Bác cũng có thể gọi hoặc kết bạn Zalo với em qua số 0984.259.898 nhé ạ!'
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
