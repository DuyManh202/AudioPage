import { randomUUID } from 'crypto'
import { query } from './db.js'
import { phoneFromMessage, addressFromMessage } from './aiChat.js'
import { findProvince } from './vietnamProvinces.js'

/**
 * Xử lý bình luận từ Facebook Webhook (Tự động kéo khách vào Messenger, trả lời cmt và ẩn SĐT)
 */
export const handleFacebookComment = async ({
  commentId,
  postId,
  parentId = null,
  userId,
  userName = 'Khách Facebook',
  message = '',
  pageId,
  pageToken,
  graphVersion = 'v19.0',
  apiKey = null,
  model = 'gemini-3.8-flash'
}) => {
  try {
    if (!commentId || !message || !pageToken) return { skipped: true, reason: 'missing_params' }

    // 1. Không tự trả lời bình luận của chính Trang
    if (pageId && String(userId) === String(pageId)) {
      return { skipped: true, reason: 'is_page_comment' }
    }

    const cleanMsg = String(message || '').trim()
    if (!cleanMsg) return { skipped: true, reason: 'empty_message' }

    // 2. Kiểm tra xem bình luận có chứa Số Điện Thoại không
    const detectedPhone = phoneFromMessage(cleanMsg)
    const inferredAddress = addressFromMessage(cleanMsg)
    const inferredProvince = findProvince(cleanMsg, { requireContext: false })

    // Nếu có SĐT: TỰ ĐỘNG ẨN COMMENT NGAY LẬP TỨC ĐỂ CHỐNG CƯỚP KHÁCH!
    if (detectedPhone) {
      console.log(`[FB Comment] Phát hiện SĐT ${detectedPhone} từ khách ${userName} -> Tiến hành ẩn cmt và lưu CRM.`)
      
      // Ẩn comment trên Facebook
      await hideFacebookComment({ commentId, pageToken, graphVersion }).catch(err => {
        console.warn('[FB Comment Hide Error]:', err.message)
      })

      // Lưu khách vào CRM
      const customerId = `FB-CMT-${detectedPhone}`
      await saveCustomerToCrm({
        customerId,
        name: userName,
        phone: detectedPhone,
        message: cleanMsg,
        province: inferredProvince?.displayName || null,
        address: inferredAddress || null,
        source: 'FACEBOOK_COMMENT_PHONE'
      })

      // Gửi tin nhắn riêng vào Messenger xác nhận
      const privateText = `Dạ em Tú Audio xin chào anh ${userName} ạ! Em đã nhận được số điện thoại ${detectedPhone} của anh rồi ạ. Em sẽ kết bạn Zalo và gọi điện tư vấn trực tiếp cho anh ngay bây giờ nhé anh!`
      await sendPrivateReply({ commentId, pageId, pageToken, graphVersion, text: privateText }).catch(console.warn)

      // Trả lời công khai dưới comment
      const publicText = `Dạ em Tú đã nhận được thông tin và nhắn riêng qua Messenger cho anh rồi ạ, anh kiểm tra tin nhắn giúp em nhé!`
      await sendPublicCommentReply({ commentId, pageToken, graphVersion, text: publicText }).catch(console.warn)

      return { success: true, action: 'PHONE_CAPTURED_AND_HIDDEN', phone: detectedPhone }
    }

    // 3. Nếu KHÔNG có SĐT: Sử dụng kỹ năng Sale chuyên nghiệp để lôi kéo khách vào Messenger
    const salesMessages = generateSalesResponse({
      customerName: userName,
      commentText: cleanMsg
    })

    let privateReplyText = salesMessages.privateReply
    let publicReplyText = salesMessages.publicReply

    // Nếu có Gemini API Key, tối ưu câu trả lời thông minh đúng 100% ngữ cảnh
    if (apiKey) {
      try {
        const aiPrompt = `Bạn là một Chuyên Viên Bán Hàng & Chuyên Gia Âm Thanh đỉnh cao của Tú Audio (Hotline/Zalo: 0984.259.898 tại Vĩnh Yên, Vĩnh Phúc).
Khách hàng vừa để lại BÌNH LUẬN CÔNG KHAI trên bài viết Facebook của anh Tú:
Tên khách: "${userName}"
Bình luận: "${cleanMsg}"

NHIỆM VỤ CỦA BẠN: Lôi kéo và chuyển hướng khách vào hộp thư Messenger một cách cực kỳ khéo léo, tự nhiên, cuốn hút theo phong cách người bán hàng có tâm và có tầm:
1. Câu 1: Bắt đúng bệnh hoặc trả lời đúng trọng tâm câu hỏi của khách (thể hiện chuyên môn sâu sắc về vang số, amply, loa rè, diện tích phòng, nhận làm tận nhà...).
2. Câu 2: Đưa ra mồi nhử/lợi ích hấp dẫn (hướng dẫn xử lý tận gốc, gửi bảng giá cấu hình dàn ưu đãi, gửi clip test âm thanh, tặng phần mềm hoặc hẹn lịch qua tận nơi).
3. Câu 3: Kêu gọi hành động: Khéo léo mời khách cho số Zalo để anh Tú gọi video khám bệnh dàn máy hoặc trao đổi chi tiết.

YÊU CẦU ĐỊNH DẠNG XUẤT RA (BẮT BUỘC ĐÚNG 2 PHẦN):
[PRIVATE_REPLY]
(Nội dung tin nhắn riêng gửi thẳng vào hộp thư Messenger của khách, độ dài 3-4 câu thân thiện, xưng "em" hoặc "em Tú", gọi khách là "anh" hoặc "bác")
[PUBLIC_REPLY]
(Nội dung trả lời công khai ngắn gọn 1 câu dưới bình luận để thông báo và kích thích khách mở Messenger xem, ví dụ: "Dạ em Tú đã nhắn tin chi tiết giải pháp qua Messenger cho anh rồi ạ, anh mở hộp thư xem giúp em nhé!")`

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        const aiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: aiPrompt }] }],
            generationConfig: { temperature: 0.35, maxOutputTokens: 1024 }
          }),
          signal: AbortSignal.timeout(10000)
        })

        const aiData = await aiRes.json().catch(() => ({}))
        const rawAiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (rawAiText && rawAiText.includes('[PRIVATE_REPLY]')) {
          const parts = rawAiText.split('[PUBLIC_REPLY]')
          const privPart = parts[0].replace('[PRIVATE_REPLY]', '').trim()
          const pubPart = parts[1] ? parts[1].trim() : ''
          if (privPart) privateReplyText = privPart
          if (pubPart) publicReplyText = pubPart
        }
      } catch (aiErr) {
        console.warn('[AI Comment Gen Warning]:', aiErr.message)
      }
    }

    // 4. GỬI TIN NHẮN RIÊNG VÀO MESSENGER (Private Reply)
    const privateResult = await sendPrivateReply({
      commentId,
      pageId,
      pageToken,
      graphVersion,
      text: privateReplyText
    })

    // 5. TRẢ LỜI CÔNG KHAI DƯỚI BÌNH LUẬN (Public Reply)
    await sendPublicCommentReply({
      commentId,
      pageToken,
      graphVersion,
      text: publicReplyText
    })

    // 6. Ghi nhận vào CRM để nhân viên biết khách này đến từ bình luận
    const tempCustomerId = `FB-CMT-${userId || randomUUID().slice(0, 8)}`
    await saveCustomerToCrm({
      customerId: tempCustomerId,
      name: userName,
      phone: null,
      message: `[Bình luận Facebook]: ${cleanMsg}`,
      province: inferredProvince?.displayName || null,
      address: null,
      source: 'FACEBOOK_COMMENT'
    })

    return {
      success: true,
      action: 'SALES_PULL_COMPLETED',
      privateSent: Boolean(privateResult?.success),
      publicReplyText
    }
  } catch (err) {
    console.error('[handleFacebookComment Error]:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Gửi tin nhắn riêng (Private Reply) từ bình luận vào Messenger của khách
 */
export const sendPrivateReply = async ({ commentId, pageId, pageToken, graphVersion, text }) => {
  try {
    const url = `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(pageId)}/messages`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pageToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: { comment_id: commentId },
        message: { text }
      }),
      signal: AbortSignal.timeout(10000)
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.warn('[FB Private Reply API Error]:', data.error?.message || res.statusText)
      return { success: false, error: data.error?.message }
    }
    return { success: true, messageId: data.message_id }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Trả lời công khai dưới bình luận
 */
export const sendPublicCommentReply = async ({ commentId, pageToken, graphVersion, text }) => {
  try {
    const url = `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(commentId)}/comments`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pageToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: text }),
      signal: AbortSignal.timeout(10000)
    })
    const data = await res.json().catch(() => ({}))
    return { success: res.ok, id: data.id }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Ẩn bình luận khỏi trang Facebook (chống cướp số)
 */
export const hideFacebookComment = async ({ commentId, pageToken, graphVersion }) => {
  try {
    const url = `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(commentId)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pageToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_hidden: true }),
      signal: AbortSignal.timeout(8000)
    })
    return { success: res.ok }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Kịch bản bán hàng thực chiến kéo khách vào Messenger (Sales Pull Fallback)
 */
function generateSalesResponse({ customerName = 'bác', commentText = '' }) {
  const norm = commentText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()

  // 1. Khách hỏi sửa amply rè / hú rít
  if (norm.includes('reo') || norm.includes('amply') || norm.includes('am ly') || norm.includes('hu rit') || norm.includes('re')) {
    return {
      privateReply: `Dạ em Tú Audio xin chào anh ${customerName} ạ! Em vừa đọc bình luận của anh về bộ amply/dàn âm thanh bị réo ù. Bệnh này thường do rò tụ nguồn hoặc dây mass tiền khuếch đại, để lâu rất dễ cháy củ treble loa. Anh nhắn em xin số Zalo em gọi video hướng dẫn anh kiểm tra bắt bệnh miễn phí, hoặc tiện chuyến em ghé xử lý dứt điểm cho anh nhé!`,
      publicReply: `Dạ em Tú đã nhắn tin chi tiết cách xử lý qua Messenger cho anh rồi ạ, anh mở hộp thư xem giúp em nhé!`
    }
  }

  // 2. Khách hỏi làm tận nhà ở các tỉnh (Nam Định, Thái Bình, Hà Nội, Phú Thọ...)
  if (norm.includes('nam dinh') || norm.includes('ha noi') || norm.includes('phu tho') || norm.includes('o dau') || norm.includes('tan nha') || norm.includes('qua nha') || norm.includes('ve nha')) {
    return {
      privateReply: `Dạ em Tú chào anh ${customerName} ạ! Bên em CÓ nhận căn chỉnh và setup tận nhà cho anh em ở khu vực của anh nhé. Đội kỹ thuật bên em đi các tỉnh liên tục nên chi phí ghép chuyến rất hợp lý. Anh cho em xin số Zalo để em tiện đường ghép chuyến ghé qua đo đạc xử lý cho dàn nhà mình hát nhẹ và không bị hú rít nhé anh!`,
      publicReply: `Dạ bên em CÓ nhận làm tại nhà anh nhé! Em Tú vừa nhắn tin riêng qua Messenger trao đổi lịch hẹn với anh rồi ạ, anh xem giúp em nhé!`
    }
  }

  // 3. Khách xin giá dàn karaoke gia đình
  if (norm.includes('gia') || norm.includes('bao nhieu') || norm.includes('karaoke') || norm.includes('bo') || norm.includes('dan')) {
    return {
      privateReply: `Dạ em Tú chào anh ${customerName} ạ! Cảm ơn anh đã quan tâm đến dàn âm thanh Tú Audio. Bên em đang có các gói cấu hình phòng khách gia đình từ 19tr đến 29tr cực kỳ chất lượng, bao hát thử 7 ngày ưng mới thanh toán. Anh cho em xin số Zalo em gửi clip test tiếng thực tế và tư vấn bộ vừa vặn nhất với phòng nhà mình nhé anh!`,
      publicReply: `Dạ em Tú đã gửi bảng giá chi tiết và clip test qua Messenger cho anh rồi ạ, anh mở tin nhắn xem giúp em nhé!`
    }
  }

  // Mặc định: Chào hỏi thân thiện và lôi kéo
  return {
    privateReply: `Dạ em Tú Audio xin chào anh ${customerName} ạ! Em vừa đọc bình luận của anh trên bài viết. Anh đang quan tâm đến nâng cấp vang số chống hú hay tìm bộ dàn karaoke gia đình ạ? Anh nhắn em xin số Zalo em tư vấn trực tiếp và gửi clip test thực tế cho anh tham khảo nhé!`,
    publicReply: `Dạ em Tú đã nhắn tin trao đổi chi tiết qua Messenger cho anh rồi ạ, anh mở hộp thư xem giúp em nhé!`
  }
}

/**
 * Lưu khách hàng vào CRM hệ thống
 */
async function saveCustomerToCrm({ customerId, name, phone, message, province, address, source }) {
  try {
    await query(`
      INSERT INTO facebook_care_customers
        (id, customer_name, phone, status, last_message, source_type, province, address, created_at, updated_at)
      VALUES ($1, $2, $3, 'MOI', $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        customer_name = CASE WHEN EXCLUDED.customer_name IS NOT NULL THEN EXCLUDED.customer_name ELSE facebook_care_customers.customer_name END,
        phone = COALESCE(EXCLUDED.phone, facebook_care_customers.phone),
        last_message = EXCLUDED.last_message,
        province = COALESCE(EXCLUDED.province, facebook_care_customers.province),
        address = COALESCE(EXCLUDED.address, facebook_care_customers.address),
        updated_at = CURRENT_TIMESTAMP
    `, [customerId, name, phone, message, source, province, address])

    if (phone) {
      await query(`
        INSERT INTO leads (id, name, phone, address, interest, status, notes)
        VALUES ($1, $2, $3, $4, $5, 'MOI', $6)
        ON CONFLICT DO NOTHING
      `, [
        'LD-' + randomUUID(),
        name,
        phone,
        address || province || 'Facebook Comment Lead',
        'Khách để lại SĐT trên bình luận bài viết Facebook',
        'Khách bình luận trên Fanpage: ' + message
      ]).catch(() => {})
    }
  } catch (err) {
    console.warn('[CRM Save Warning]:', err.message)
  }
}
