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

      // Trả lời công khai dưới comment
      const publicText = `Dạ em Tú đã nhận được số điện thoại của anh/bác rồi ạ, lát nữa bên em sẽ chủ động gọi điện tư vấn trực tiếp cho anh/bác nhé ạ!`
      await sendPublicCommentReply({ commentId, pageToken, graphVersion, text: publicText }).catch(console.warn)

      return { success: true, action: 'PHONE_CAPTURED_AND_HIDDEN', phone: detectedPhone, hasExistingChat }
    }

    // 4. Nếu KHÔNG có SĐT: Tạo câu trả lời công khai thông minh lôi kéo khách vào Messenger/Zalo
    const salesMessages = generateSalesResponse({
      customerName: userName,
      commentText: cleanMsg,
      hasExistingChat
    })

    let publicReplyText = salesMessages.publicReply

    // Nếu có Gemini API Key, tối ưu câu trả lời thông minh đúng 100% ngữ cảnh
    if (apiKey) {
      try {
        const psychologicalContext = await getAiPsychologicalTrainingContext()
        const aiPrompt = `Bạn là một Chuyên Viên Bán Hàng & Chuyên Gia Âm Thanh của Tú Audio (Hotline/Zalo: 0984.259.898 tại Số 220 đường Nguyễn Danh Phương, phường Hội Hợp, TP. Vĩnh Yên, tỉnh Vĩnh Phúc).
Khách hàng vừa để lại BÌNH LUẬN CÔNG KHAI trên bài viết Facebook của anh Tú:
Tên khách: "${userName}"
Bình luận: "${cleanMsg}"

${psychologicalContext}

NGUYÊN TẮC BẮT BUỘC (TUÂN THỦ 100% THEO CHỈ THỊ ANH TÚ):
1. BẠN CHỈ VIẾT DUY NHẤT 1 CÂU TRẢ LỜI CÔNG KHAI DƯỚI BÌNH LUẬN (PUBLIC REPLY). TUYỆT ĐỐI KHÔNG GỬI TIN NHẮN RIÊNG.
2. ĐỘ DÀI: CHỈ VIẾT TỐI ĐA 1 ĐẾN 2 CÂU NGẮN GỌN (DƯỚI 40 TỪ).
3. NỘI DUNG:
   - Trả lời thẳng thắn, đúng trọng tâm câu hỏi của khách (CÓ nhận hỗ trợ căn chỉnh vang số / địa chỉ showroom tại Số 220 đường Nguyễn Danh Phương, phường Hội Hợp, TP. Vĩnh Yên, tỉnh Vĩnh Phúc / có thu cũ đổi mới / báo giá dàn).
   - Xưng "em", gọi "bác" hoặc "anh".
   - KẾT CÂU LÔI KÉO VÀO TIN NHẮN: Mời bác/anh nhắn tin qua Messenger cho Trang hoặc kết bạn Zalo 0984.259.898 để em Tú gửi chi tiết cấu hình và tư vấn hỗ trợ nhé ạ!
4. TUYỆT ĐỐI KHÔNG DÙNG TỪ NGỮ DÀI DÒNG, KHÔNG TỰ HẸN GIỜ QUA NHÀ.`

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        const aiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: aiPrompt }] }],
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: 2048,
              thinkingConfig: { thinkingBudget: 0 }
            }
          }),
          signal: AbortSignal.timeout(10000)
        })

        const aiData = await aiRes.json().catch(() => ({}))
        const cand = aiData.candidates?.[0]
        const rawAiText = cand?.content?.parts?.[0]?.text?.trim()
        const cleanReply = (txt) => (txt || '').replace(/^\[(PUBLIC|PRIVATE)_REPLY\]\s*:?\s*/gi, '').replace(/^[:\-\s]+/, '').trim()
        if (rawAiText && (cand?.finishReason === 'STOP' || /[.!?…ạa]$/i.test(rawAiText))) {
          publicReplyText = cleanReply(rawAiText)
        } else if (rawAiText && cand?.finishReason !== 'MAX_TOKENS') {
          publicReplyText = cleanReply(rawAiText)
        }
      } catch (aiErr) {
        console.warn('[AI Comment Gen Warning]:', aiErr.message)
      }
    }

    // 5. TRẢ LỜI CÔNG KHAI DƯỚI BÌNH LUẬN (TUYỆT ĐỐI KHÔNG BẮN TIN NHẮN RIÊNG VÀO MESSENGER)
    const publicResult = await sendPublicCommentReply({
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
      success: Boolean(publicResult?.success),
      replyId: publicResult?.id || null,
      error: publicResult?.error || null,
      action: 'PUBLIC_REPLY_AND_PULL_MESSENGER',
      hasExistingChat,
      privateSent: false,
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
 * CHỈ TRẢ LỜI CÔNG KHAI DƯỚI COMMENT, TUYỆT ĐỐI KHÔNG GỬI TIN NHẮN RIÊNG TỰ ĐỘNG
 */
function generateSalesResponse({ customerName = 'bác', commentText = '', hasExistingChat = false }) {
  const norm = commentText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()

  // 1. Khách hỏi về loa kéo / sửa loa kéo
  if (norm.includes('loa keo') || norm.includes('lo keo')) {
    return {
      publicReply: `Dạ bên em chuyên phân phối dàn karaoke gia đình và thiết bị phòng hát, bên em không nhận chỉnh loa kéo anh nhé! Em Tú chào anh ạ.`
    }
  }

  // 2. Khách hỏi có đi căn chỉnh không / chỉnh vang số
  if (norm.includes('can chinh') || norm.includes('chinh vang') || norm.includes('di chinh') || norm.includes('chinh khong') || norm.includes('chinh giup') || norm.includes('setup') || norm.includes('chinh dan')) {
    return {
      publicReply: `Dạ bên em CÓ nhận hỗ trợ kỹ thuật căn chỉnh vang số và setup dàn tận nhà anh nhé! Anh nhắn tin qua Messenger cho em hoặc kết bạn Zalo 0984.259.898 để em Tú tư vấn chi tiết cho anh nhé ạ!`
    }
  }

  // 3. Khách hỏi địa chỉ / làm tận nhà ở các tỉnh (Phú Thọ, Hà Nội, Vĩnh Phúc...)
  if (norm.includes('nam dinh') || norm.includes('ha noi') || norm.includes('phu tho') || norm.includes('o dau') || norm.includes('tan nha') || norm.includes('qua nha') || norm.includes('ve nha') || norm.includes('dia chi')) {
    return {
      publicReply: `Dạ showroom Tú Audio ở tại số 220 đường Nguyễn Danh Phương, phường Hội Hợp, TP. Vĩnh Yên, tỉnh Vĩnh Phúc và bên em CÓ nhận hỗ trợ tận nhà ạ. Bác nhắn tin qua Messenger hoặc Zalo 0984.259.898 em gửi định vị chi tiết nhé ạ!`
    }
  }

  // 4. Khách hỏi giá dàn karaoke / vang số
  if (norm.includes('gia') || norm.includes('bao nhieu') || norm.includes('karaoke') || norm.includes('bo') || norm.includes('dan')) {
    return {
      publicReply: `Dạ dàn karaoke gia đình bên em có các gói từ 19tr đến 29tr bảo hành tận nhà rất hợp túi tiền ạ. Bác nhắn tin qua Messenger hoặc Zalo 0984.259.898 em gửi chi tiết bảng giá và clip test máy nhé bác!`
    }
  }

  // 5. Khách hỏi réo / amply rè / hú rít
  if (norm.includes('reo') || norm.includes('amply') || norm.includes('am ly') || norm.includes('hu rit') || norm.includes('re')) {
    return {
      publicReply: `Dạ em Tú chào anh ạ! Bệnh này do rò mass hoặc dải tần EQ, anh nhắn tin qua Messenger cho em hoặc kết bạn Zalo 0984.259.898 em hướng dẫn xử lý dứt điểm nhé anh!`
    }
  }

  // Mặc định: Chào hỏi thân thiện và lôi kéo vào Messenger/Zalo
  return {
    publicReply: `Dạ em Tú Audio xin chào anh ạ! Anh nhắn tin qua hộp thư Messenger cho Trang hoặc kết bạn Zalo 0984.259.898 để em Tú tư vấn chi tiết cấu hình và hỗ trợ cho mình nhé ạ!`
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
