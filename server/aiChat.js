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
      reply: 'Dạ vâng a, vang số bên em có dòng CM x16+ (4tr2) và PF K9 (6tr8) chống hú rít tuyệt đối. Anh cho em xin số Zalo em gửi video test chất âm và tư vấn chi tiết cho tiện nhé anh!'
    }
  }

  // 2. Giá các gói Combo Dàn Karaoke / Loa gia đình
  if (
    (norm.includes('combo') || norm.includes('dan') || norm.includes('bo dan') || norm.includes('loa') || norm.includes('tron goi')) &&
    (norm.includes('gia') || norm.includes('bao nhieu') || norm.includes('tu van') || norm.includes('co nhung') || norm.includes('nhiu'))
  ) {
    return {
      type: 'COMBO',
      reply: 'Dạ vâng a, bên em có các cấu hình dàn từ 19tr đến 29tr chuẩn phòng hát gia đình. Anh cho em xin số Zalo em gửi video test thực tế và tư vấn cấu hình vừa vặn cho tiện nhé anh!'
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
      reply: 'Dạ showroom bên em ở tại số 220 đường Nguyễn Danh Phương, Vĩnh Yên, Vĩnh Phúc ạ. Anh nhắn em xin số Zalo em gửi vị trí định vị qua cho tiện đi nhé anh!'
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
