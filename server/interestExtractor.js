/**
 * Module trích xuất nhu cầu thực tế của khách hàng từ tin nhắn / bình luận Facebook
 * cho hệ thống Tú Audio CRM
 */

export const extractCustomerInterest = (messages = [], lastMsg = '', adName = '') => {
  const cleanMsgs = (Array.isArray(messages) ? messages : [])
    .map(m => typeof m === 'string' ? m : (m?.body || ''))
    .concat([lastMsg])
    .map(t => String(t || '').trim())
    .filter(t => 
      t &&
      !t.startsWith('Facebook tạo đoạn chat') &&
      !t.includes('Facebook tạo đoạn chat này vì') &&
      !t.includes('Đã thêm nhãn tự động') &&
      !t.includes('Đã đặt giai đoạn') &&
      !t.includes('đã trả lời tin nhắn chào mừng') &&
      !t.includes('BẮT ĐẦU') &&
      !t.includes('Bắt đầu') &&
      !t.includes('[Khách gửi hình ảnh') &&
      !/^0\d{8,10}$/.test(t.replace(/\D/g, ''))
    )

  const fullText = cleanMsgs.join(' \n ')

  // 1. PHÒNG THU ÂM / THU ÂM CHUYÊN NGHIỆP / LIVESTREAM
  if (/(?:đầu\s*tư|làm|setup|mở|lắp|muốn|mốn|cần|hỗ\s*trợ).*(?:phòng\s*thu(?:\s*âm)?)/i.test(fullText) || /phòng\s*thu\s*âm/i.test(fullText) || /phòng\s*thu/i.test(fullText)) {
    return 'Đầu tư phòng thu âm'
  }
  if (/(?:hát\s*livestream|hát\s*live|mic\s*thu\s*âm|soundcard|thu\s*âm)/i.test(fullText)) {
    return 'Thiết bị thu âm / Livestream'
  }

  // 2. THU CŨ ĐỔI MỚI
  const tradeMatch = fullText.match(/(?:vang\s*[a-z0-9]+)\s*(?:muốn\s*lên|đổi\s*lên)\s*([a-z0-9]+)/i)
  if (tradeMatch) {
    return `Thu cũ đổi mới: ${tradeMatch[0]}`
  }
  if (/(?:thu\s*cũ\s*đổi\s*mới|đổi\s*bộ\s*cũ|đổi\s*cũ\s*lấy\s*mới|thu\s*lại\s*được\s*không|bộ\s*cũ.*thu|đổi\s*vang)/i.test(fullText)) {
    return 'Thu cũ đổi mới dàn karaoke / thiết bị'
  }

  // 3. CĂN CHỈNH VANG SỐ / VANG CƠ / DÀN KARAOKE TẠI NHÀ
  const nexMatch = fullText.match(/(?:nex\s*fx\d+)/i)
  if (nexMatch) {
    return `Căn chỉnh vang ${nexMatch[0].toUpperCase()} tại nhà`
  }
  const vangModelMatch = fullText.match(/(?:vang\s*(?:số\s*)?|chỉnh|setup|cài\s*lại|khám\s*bệnh|cần\s*con|mua\s*con|ghép|có\s*|bán\s*)(parttyhour|partyhouse\s*[a-z0-9]*|dk\s*3000|x[5-9]|x1[0-2]|kx180|km330|km350|s[5-9]00|bosa|tripath|siso)/i)
  if (vangModelMatch) {
    const model = vangModelMatch[1].toUpperCase()
    if (/ghép|đẩy|loa|mua|bán|có\s*vang/i.test(fullText)) {
      return `Tìm mua vang ${model} ghép bộ dàn`
    }
    return `Căn chỉnh vang số ${model}`
  }
  if (/(?:chỉnh|setup|cài\s*lại).*(?:vang\s*số|vang\s*cơ|con\s*vang|vang)/i.test(fullText) || /vang.*mất\s*đèn/i.test(fullText)) {
    return 'Căn chỉnh vang số / chống hú'
  }
  if (/(?:chỉnh|setup|khám\s*bệnh|cài\s*đặt).*(?:dàn|giàn|âm\s*thanh)/i.test(fullText) || /chỉnh\s*nhạc/i.test(fullText) || /cách\s*chỉnh/i.test(fullText)) {
    return 'Căn chỉnh dàn karaoke gia đình tại nhà'
  }

  // 4. BỘ DÀN KARAOKE GIA ĐÌNH
  if (/(?:bộ|dàn)\s*(?:3\s*thớt|ba\s*thớt)/i.test(fullText)) {
    return 'Bộ karaoke 3 thớt (Đẩy, Vang, Mic)'
  }
  const priceMatch = fullText.match(/(?:bộ|dàn)\s*(?:karaoke)?\s*(\d+[\s.,]*\d*|\d+)\s*(?:tr|triệu|củ|trđ)/i)
  if (priceMatch) {
    return `Dàn karaoke gia đình ${priceMatch[1]} triệu`
  }
  if (/(?:xin\s*giá|báo\s*giá|bao\s*nhiêu|giá\s*sao|thông\s*tin|bao\s*tiên)\s*(?:bộ|dàn|combo)/i.test(fullText) || /xin\s*giá/i.test(fullText) || /bao\s*tiên\s*bộ/i.test(fullText)) {
    return 'Tư vấn báo giá bộ dàn karaoke'
  }
  if (/(?:tư\s*vấn|mua|lắp|đầu\s*tư)\s*(?:bộ|dàn)\s*karaoke/i.test(fullText)) {
    return 'Tư vấn mua dàn karaoke gia đình'
  }

  // 5. THIẾT BỊ LẺ
  if (/(?:cục\s*đẩy|con\s*đẩy|đẩy\s*4\s*kênh|đẩy\s*2\s*kênh|đẩy\s*công\s*suất)/i.test(fullText)) {
    return 'Tìm mua cục đẩy công suất'
  }
  if (/(?:loa\s*sub|sub\s*hơi|sub\s*điện|loa\s*trầm)/i.test(fullText)) {
    return 'Tìm mua loa Sub siêu trầm'
  }
  if (/(?:loa\s*bãi|loa\s*full|loa\s*cây|đôi\s*loa|mua\s*loa)/i.test(fullText)) {
    return 'Tìm mua loa karaoke'
  }
  if (/(?:micro|mic\s*không\s*dây|mic\s*hát)/i.test(fullText)) {
    return 'Tìm mua micro không dây'
  }
  if (/(?:nâng\s*tiếng|máy\s*nâng\s*tiếng|lọc\s*xì)/i.test(fullText)) {
    return 'Tìm mua máy nâng tiếng / lọc xì'
  }

  // 6. LOA KÉO
  if (/(?:loa\s*kéo|loa\s*di\s*động)/i.test(fullText)) {
    return 'Hỏi loa kéo (Tư vấn dàn gia đình)'
  }

  // 7. HỎI ĐỊA CHỈ SHOWROOM
  if (/(?:shop|quán|cửa\s*hàng|bác|tú)\s*(?:ở\s*đâu|chỗ\s*nào|địa\s*chỉ)/i.test(fullText) || /(?:ở\s*đâu|chỗ\s*nào).*(?:shop|quán|cửa\s*hàng)/i.test(fullText) || /cửa\s*hàng.*ở\s*đâu/i.test(fullText) || /shop\s*ở\s*đâu/i.test(fullText)) {
    return 'Hỏi địa chỉ showroom Tú Audio'
  }

  // 8. NGUỒN QUẢNG CÁO
  if (adName && typeof adName === 'string') {
    let cleanAd = adName.replace(/^QC:\s*/i, '').replace(/^\d{1,2}\/\d{1,2}\/\d{4}\s*/, '').trim()
    cleanAd = cleanAd.replace(/\s*(quảng cáo|ad|campaign|chiến dịch).*$/i, '').trim()
    if (/căn\s*chỉnh|tiếng\s*mic/i.test(cleanAd)) return 'Căn chỉnh tiếng nhạc & tiếng mic'
    if (/thu\s*cũ/i.test(cleanAd)) return 'Thu cũ đổi mới thiết bị karaoke'
    if (/\d+[\s.,]*\d*\s*triệu/i.test(cleanAd)) return `Dàn karaoke ${cleanAd}`
    if (cleanAd.length >= 6 && cleanAd.length <= 40 && !/thu\s*hút\s*khách/i.test(cleanAd)) return cleanAd
  }

  // 9. NẾU CÓ TIN NHẮN THỰC CHẤT CỦA KHÁCH
  const meaningfulMsg = cleanMsgs.find(m => m.length >= 6 && !/^(chào|alo|xin\s*chào|hi|hello)/i.test(m))
  if (meaningfulMsg) {
    return meaningfulMsg.replace(/^\[Bình luận Facebook\]:\s*/i, '').slice(0, 45)
  }

  return 'Tư vấn âm thanh karaoke'
}
