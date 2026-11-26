import { randomUUID } from 'crypto'
import { query } from './db.js'
import { phoneFromMessage, addressFromMessage } from './aiChat.js'
import { findProvince } from './vietnamProvinces.js'
import { getAiPsychologicalTrainingContext } from './aiPsychologicalTraining.js'

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

    // 2. Kiểm tra xem khách hàng này ĐÃ TỪNG NHẮN TIN INBOX TRONG MESSENGER chưa
    let hasExistingChat = false
    try {
      if (userId) {
        const outCheck = await query(
          `SELECT m.id FROM facebook_care_customers c 
           JOIN facebook_care_messages m ON m.customer_id = c.id 
           WHERE c.facebook_id = $1 AND m.direction = 'OUT' LIMIT 1`,
          [String(userId)]
        )
        if (outCheck.rows.length > 0) hasExistingChat = true
      }
      if (!hasExistingChat && userName && userName !== 'Khách Facebook') {
        const outCheckName = await query(
          `SELECT m.id FROM facebook_care_customers c 
           JOIN facebook_care_messages m ON m.customer_id = c.id 
           WHERE LOWER(c.customer_name) = LOWER($1) AND m.direction = 'OUT' LIMIT 1`,
          [userName.trim()]
        )
        if (outCheckName.rows.length > 0) hasExistingChat = true
      }
    } catch (checkErr) {
      console.warn('[Check Existing Chat Error]:', checkErr.message)
    }

    // 3. Kiểm tra xem bình luận có chứa Số Điện Thoại không
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

      // Chỉ gửi tin nhắn riêng nếu khách CHƯA TỪNG IB
      if (!hasExistingChat) {
        const privateText = `Dạ em Tú Audio xin chào anh ${userName} ạ! Em đã nhận được số điện thoại ${detectedPhone} của anh rồi ạ. Em sẽ kết bạn Zalo và gọi điện tư vấn trực tiếp cho anh ngay bây giờ nhé anh!`
        await sendPrivateReply({ commentId, userId, pageId, pageToken, graphVersion, text: privateText }).catch(console.warn)
      }

      // Trả lời công khai dưới comment
      const publicText = hasExistingChat
        ? `Dạ em Tú đã nhận được số điện thoại của anh rồi ạ, em sẽ kết bạn Zalo và gọi điện tư vấn trực tiếp cho anh ngay nhé anh!`
        : `Dạ em Tú đã nhận được thông tin và nhắn riêng qua Messenger cho anh rồi ạ, anh kiểm tra tin nhắn giúp em nhé!`
      await sendPublicCommentReply({ commentId, pageToken, graphVersion, text: publicText }).catch(console.warn)

      return { success: true, action: 'PHONE_CAPTURED_AND_HIDDEN', phone: detectedPhone, hasExistingChat }
    }

    // 4. Nếu KHÔNG có SĐT: Tạo câu trả lời thông minh
    const salesMessages = generateSalesResponse({
      customerName: userName,
      commentText: cleanMsg,
      hasExistingChat
    })

    let privateReplyText = salesMessages.privateReply
    let publicReplyText = salesMessages.publicReply

    // Nếu có Gemini API Key, tối ưu câu trả lời thông minh đúng 100% ngữ cảnh
    if (apiKey) {
      try {
        const psychologicalContext = await getAiPsychologicalTrainingContext()
        const aiPrompt = `Bạn là một Chuyên Viên Bán Hàng & Chuyên Gia Âm Thanh đỉnh cao của Tú Audio (Hotline/Zalo: 0984.259.898 tại Vĩnh Yên, Vĩnh Phúc).
Khách hàng vừa để lại BÌNH LUẬN CÔNG KHAI trên bài viết Facebook của anh Tú:
Tên khách: "${userName}"
Bình luận: "${cleanMsg}"

${psychologicalContext}

NGUYÊN TẮC BẮT BUỘC VỀ PHẠM VI SẢN PHẨM & DỊCH VỤ CỦA TÚ AUDIO (TUÂN THỦ 100%):
- TÚ AUDIO CHUYÊN SALE DÀN KARAOKE GIA ĐÌNH & THIẾT BỊ PHÒNG HÁT CAO CẤP (Loa Full chuyên nghiệp, Vang số cao cấp, Cục đẩy công suất, Loa Subwoofer, Micro không dây).
- NGUYÊN TẮC CỐT LÕI VỀ CĂN CHỈNH / SETUP DÀN VANG SỐ (BẮT BUỘC NHẬN HẾT 100%):
  * Khi khách hỏi: "có căn chỉnh không", "có đi chỉnh không", "có qua tận nơi chỉnh không", "có chỉnh vang không", "có setup lại không"...
  * BẮT BUỘC LUÔN LUÔN NHẬN HẾT 100%! TUYỆT ĐỐI CẤM TỪ CHỐI KHÁCH! TUYỆT ĐỐI KHÔNG BAO GIỜ nói câu: "bên em không nhận đi căn chỉnh dịch vụ lẻ bên ngoài".
  * Khẳng định rõ bên em CÓ NHẬN hỗ trợ kỹ thuật căn chỉnh vang số và setup dàn.
  * TUYỆT ĐỐI KHÔNG HẸN KHÁCH TRƯỚC TRÊN TIN NHẮN (không hẹn ngày giờ, không tự hẹn chạy qua nhà, không hứa thợ mang mic đo RTA sang nhà). CHỈ XIN SỐ ĐIỆN THOẠI ĐỂ GỌI ĐIỆN TRAO ĐỔI TRỰC TIẾP.
  * KHI KHÁCH CHO SỐ: CHỈ CẢM ƠN KHÁCH VÀ BÁO LÁT NỮA BÊN EM SẼ LIÊN HỆ LẠI.
  * Mời khách cho số điện thoại / kết bạn Zalo để bên em gọi điện tư vấn trực tiếp cho tiện.
- TUYỆT ĐỐI CẤM DUY NHẤT: KHÔNG bán loa kéo / loa kẹo kéo di động, KHÔNG nhận sửa chữa đồ điện tử hư hỏng mạch công suất.
- NẾU KHÁCH HỎI VỀ LOA KÉO: Lịch sự từ chối dịch vụ loa kéo và giải thích rõ bên em chuyên dàn karaoke gia đình và thiết bị phòng hát chuẩn. Khéo léo định hướng khách nâng cấp lên dàn karaoke gia đình chuẩn (các gói 19tr - 29tr) hát nhẹ tiếng và chống hú tuyệt đối, xin số Zalo để tư vấn.

${hasExistingChat ? 
`QUY TẮC CỐT LÕI (TUÂN THỦ 100% THEO CHỈ THỊ ANH TÚ):
KHÁCH HÀNG NÀY ĐÃ TỪNG NHẮN TIN RIÊNG (INBOX) VỚI TÚ AUDIO TRONG MESSENGER RỒI.
TUYỆT ĐỐI KHÔNG GỬI THÊM TIN NHẮN RIÊNG NÀO VÀO MESSENGER NỮA (KHÔNG ĐƯỢC IB).
BẠN CHỈ CẦN XUẤT RA DUY NHẤT 1 PHẦN LÀ [PUBLIC_REPLY]:
Trả lời bình luận công khai dưới bài viết cực kỳ thông minh, tâm sự đúng trọng tâm câu hỏi của khách (báo giá/địa chỉ showroom tại 220 Nguyễn Danh Phương, Vĩnh Yên/nhận làm tận nhà các tỉnh), thân thiện xưng "em" gọi "anh" (hoặc "bác"), đồng thời nhắc anh nhắn tiếp vào đoạn chat Messenger cũ mà hai bên đang trao đổi.`
:
`QUY TẮC: Khách hàng này CHƯA TỪNG NHẮN TIN INBOX VỚI TRANG.
Nhiệm vụ: Lôi kéo và chuyển hướng khách vào hộp thư Messenger một cách cực kỳ khéo léo và tâm lý:
1. Đọc vị câu hỏi của khách, đồng cảm và trả lời đúng trọng tâm chuyên môn như một người bạn mê âm thanh tận tụy.
2. Gợi mở giá trị thực tế (video test dàn, bảng cấu hình tối ưu chi phí, hẹn lịch kỹ thuật ghé nhà kiểm tra).
3. Khéo léo mời khách kết bạn Zalo hoặc gửi ảnh dàn qua tin nhắn để em Tú hỗ trợ chu đáo nhất.

YÊU CẦU ĐỊNH DẠNG XUẤT RA (BẮT BUỘC ĐÚNG 2 PHẦN):
[PRIVATE_REPLY]
(Nội dung tin nhắn riêng gửi thẳng vào hộp thư Messenger của khách, độ dài 2-3 câu thân thiện, ngắt ý tự nhiên như người thật)
[PUBLIC_REPLY]
(Nội dung trả lời công khai ngắn gọn 1 câu dưới bình luận để thông báo và kích thích khách mở Messenger xem)`
}`

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
        if (rawAiText) {
          if (hasExistingChat) {
            privateReplyText = null
            publicReplyText = rawAiText.replace('[PUBLIC_REPLY]', '').replace('[PRIVATE_REPLY]', '').trim()
          } else if (rawAiText.includes('[PRIVATE_REPLY]')) {
            const parts = rawAiText.split('[PUBLIC_REPLY]')
            const privPart = parts[0].replace('[PRIVATE_REPLY]', '').trim()
            const pubPart = parts[1] ? parts[1].trim() : ''
            if (privPart) privateReplyText = privPart
            if (pubPart) publicReplyText = pubPart
          }
        }
      } catch (aiErr) {
        console.warn('[AI Comment Gen Warning]:', aiErr.message)
      }
    }

    // 5. GỬI TIN NHẮN RIÊNG VÀO MESSENGER (CHỈ GỬI KHI KHÁCH CHƯA TỪNG INBOX)
    let privateResult = null
    if (!hasExistingChat && privateReplyText) {
      privateResult = await sendPrivateReply({
        commentId,
        userId,
        pageId,
        pageToken,
        graphVersion,
        text: privateReplyText
      })
    } else {
      console.log(`[FB Comment] Khách ${userName} (userId: ${userId}) ĐÃ TỪNG IB TRƯỚC ĐÂY -> Bỏ qua tin nhắn riêng (không ib), chỉ trả lời bình luận công khai.`)
    }

    // 6. TRẢ LỜI CÔNG KHAI DƯỚI BÌNH LUẬN (Luôn luôn thực hiện 100%)
    const publicResult = await sendPublicCommentReply({
      commentId,
      pageToken,
      graphVersion,
      text: publicReplyText
    })

    // 7. Ghi nhận vào CRM để nhân viên biết khách này đến từ bình luận
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
      success: Boolean(publicResult?.success),
      replyId: publicResult?.id || null,
      error: publicResult?.error || null,
      action: 'SALES_PULL_COMPLETED',
      hasExistingChat,
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
export const sendPrivateReply = async ({ commentId, userId = null, pageId, pageToken, graphVersion, text }) => {
  try {
    const url = `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(pageId)}/messages`
    let res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pageToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: commentId ? { comment_id: commentId } : { id: userId },
        message: { text }
      }),
      signal: AbortSignal.timeout(10000)
    })
    let data = await res.json().catch(() => ({}))
    if (!res.ok && userId) {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pageToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: { id: userId },
          message: { text }
        }),
        signal: AbortSignal.timeout(10000)
      })
      data = await res.json().catch(() => ({}))
    }
    if (!res.ok) {
      console.warn('[FB Private Reply API Error]:', data.error?.message || res.statusText)
      return { success: false, error: data.error?.message }
    }
    return { success: true, messageId: data.message_id || data.id }
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
    if (!res.ok) {
      console.warn(`[sendPublicCommentReply Failed] commentId=${commentId}:`, data.error?.message || res.status)
      return { success: false, error: data.error?.message || `HTTP ${res.status}` }
    }
    return { success: true, id: data.id }
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
function generateSalesResponse({ customerName = 'bác', commentText = '', hasExistingChat = false }) {
  const norm = commentText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()

  // NẾU KHÁCH ĐÃ TỪNG INBOX: TUYỆT ĐỐI KHÔNG GỬI THÊM TIN NHẮN RIÊNG (privateReply: null), CHỈ TRẢ LỜI CÔNG KHAI
  if (hasExistingChat) {
    if (norm.includes('loa keo') || norm.includes('lo keo')) {
      return {
        privateReply: null,
        publicReply: `Dạ bên em chuyên phân phối dàn karaoke gia đình và thiết bị phòng hát, không nhận chỉnh loa kéo anh nhé! Em Tú chào anh ạ.`
      }
    }
    // Khách hỏi có đi chỉnh / căn chỉnh dàn không
    if (norm.includes('can chinh') || norm.includes('chinh vang') || norm.includes('di chinh') || norm.includes('chinh khong') || norm.includes('chinh giup') || norm.includes('setup') || norm.includes('chinh giup')) {
      return {
        privateReply: null,
        publicReply: `Dạ bên em CÓ nhận căn chỉnh vang số và setup dàn tận nơi anh nhé! Em thấy trước đó em với anh đang có đoạn chat trong Messenger rồi, anh nhắn tiếp vào tin nhắn cũ gửi ảnh bộ dàn hiện tại để em xem và hẹn lịch hỗ trợ cho anh nhé anh!`
      }
    }
    if (norm.includes('reo') || norm.includes('amply') || norm.includes('am ly') || norm.includes('hu rit') || norm.includes('re')) {
      return {
        privateReply: null,
        publicReply: `Dạ em Tú chào anh ${customerName} ạ! Bệnh này do rò mass hoặc tụ nguồn tiền khuếch đại. Em với anh đang nhắn tin trong Messenger rồi, anh mở hộp thư xem hướng dẫn chi tiết nhé anh!`
      }
    }
    if (norm.includes('nam dinh') || norm.includes('ha noi') || norm.includes('phu tho') || norm.includes('o dau') || norm.includes('tan nha') || norm.includes('qua nha') || norm.includes('ve nha')) {
      return {
        privateReply: null,
        publicReply: `Dạ showroom Tú Audio ở 220 đường Nguyễn Danh Phương, Vĩnh Yên và bên em CÓ nhận làm tại nhà anh nhé! Em với anh đang nhắn tin trong Messenger rồi, anh kiểm tra hộp thư giúp em nhé!`
      }
    }
    if (norm.includes('gia') || norm.includes('bao nhieu') || norm.includes('karaoke') || norm.includes('bo') || norm.includes('dan')) {
      return {
        privateReply: null,
        publicReply: `Dạ dàn karaoke gia đình bên em đang có gói từ 19tr đến 29tr bảo hành tận nhà. Em với anh đang trao đổi trong Messenger rồi, anh mở hộp thư xem chi tiết nhé anh!`
      }
    }
    return {
      privateReply: null,
      publicReply: `Dạ em Tú chào anh ${customerName} ạ! Em vừa đọc bình luận của anh, em với anh đang nhắn tin trong Messenger rồi, anh mở hộp thư trao đổi tiếp cho tiện nhé anh!`
    }
  }

  // NẾU KHÁCH MỚI TINH (CHƯA TỪNG INBOX): Gửi tin nhắn riêng kéo khách vào Messenger + Trả lời công khai
  // 0. Khách hỏi về loa kéo / sửa chỉnh loa kéo (Tú Audio chuyên dàn karaoke gia đình, TUYỆT ĐỐI không làm loa kéo)
  if (norm.includes('loa keo') || norm.includes('lo keo')) {
    return {
      privateReply: `Dạ em Tú chào anh ${customerName} ạ! Bên em chuyên cung cấp các bộ dàn karaoke gia đình và thiết bị phòng hát chuyên nghiệp, bên em không làm dịch vụ chỉnh loa kéo anh ạ. Loa kéo mạch công suất nhỏ hát rất dễ bị bí tiếng và mệt, nếu anh muốn nâng cấp sang dàn karaoke phòng khách hát nhẹ và chống hú tuyệt đối, anh nhắn em xin số Zalo em tư vấn cho anh nhé!`,
      publicReply: `Dạ bên em chuyên phân phối dàn karaoke gia đình và thiết bị phòng hát cao cấp, bên em không nhận chỉnh loa kéo anh nhé! Em Tú chào anh ạ.`
    }
  }

  // 0.5. Khách hỏi có đi chỉnh không / căn chỉnh vang số tận nhà
  if (norm.includes('can chinh') || norm.includes('chinh vang') || norm.includes('di chinh') || norm.includes('chinh khong') || norm.includes('chinh giup') || norm.includes('setup')) {
    return {
      privateReply: `Dạ em Tú chào anh ${customerName} ạ! Bên em CÓ nhận hỗ trợ kỹ thuật căn chỉnh vang số và setup dàn nhé anh. Anh cho em xin số điện thoại/Zalo để bên em gọi điện tư vấn chi tiết hỗ trợ cho dàn nhà mình hát nhẹ và chống hú tốt nhất nhé anh!`,
      publicReply: `Dạ bên em CÓ nhận hỗ trợ kỹ thuật anh nhé! Em Tú vừa nhắn tin riêng qua Messenger xin số Zalo để tư vấn cho anh rồi ạ, anh xem giúp em nhé!`
    }
  }

  // 1. Khách hỏi sửa amply rè / hú rít
  if (norm.includes('reo') || norm.includes('amply') || norm.includes('am ly') || norm.includes('hu rit') || norm.includes('re')) {
    return {
      privateReply: `Dạ em Tú Audio xin chào anh ${customerName} ạ! Em vừa đọc bình luận của anh về bộ amply/dàn âm thanh bị réo ù. Bệnh này thường do dải tần EQ hoặc dây mass, anh cho em xin số điện thoại/Zalo để bên em gọi điện hướng dẫn kiểm tra bắt bệnh cho anh nhé!`,
      publicReply: `Dạ em Tú đã nhắn tin chi tiết qua Messenger cho anh rồi ạ, anh mở hộp thư xem giúp em nhé!`
    }
  }

  // 2. Khách hỏi làm tận nhà ở các tỉnh (Nam Định, Thái Bình, Hà Nội, Phú Thọ...)
  if (norm.includes('nam dinh') || norm.includes('ha noi') || norm.includes('phu tho') || norm.includes('o dau') || norm.includes('tan nha') || norm.includes('qua nha') || norm.includes('ve nha')) {
    return {
      privateReply: `Dạ em Tú chào anh ${customerName} ạ! Bên em CÓ nhận hỗ trợ kỹ thuật căn chỉnh và setup cho anh em ở khu vực của anh nhé. Anh cho em xin số điện thoại/Zalo để bên em gọi điện tư vấn trực tiếp cho anh nhé anh!`,
      publicReply: `Dạ bên em CÓ nhận hỗ trợ anh nhé! Em Tú vừa nhắn tin riêng qua Messenger xin số để liên hệ trao đổi với anh rồi ạ, anh xem giúp em nhé!`
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
      const existing = await query(`SELECT id, notes FROM leads WHERE phone = $1 LIMIT 1`, [phone])
      if (existing.rows.length > 0) {
        const currentNotes = existing.rows[0].notes || ''
        const newNote = 'Khách bình luận trên Fanpage: ' + message
        const updatedNotes = currentNotes.includes(message) ? currentNotes : (currentNotes ? currentNotes + ' · ' + newNote : newNote).slice(0, 2000)
        await query(`UPDATE leads SET notes = $1, created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [updatedNotes, existing.rows[0].id])
      } else {
        await query(`
          INSERT INTO leads (id, name, phone, address, interest, status, notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, 'MOI', $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          'LD-' + randomUUID(),
          name,
          phone,
          address || province || 'Facebook Comment Lead',
          'Khách để lại SĐT trên bình luận bài viết Facebook',
          'Khách bình luận trên Fanpage: ' + message
        ]).catch(() => {})
      }
    }
  } catch (err) {
    console.warn('[CRM Save Warning]:', err.message)
  }
}
