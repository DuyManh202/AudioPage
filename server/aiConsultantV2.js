/**
 * Module Tư Vấn AI Tú Audio - Bản 2.0 (Chế độ A - Tiếp Đón & Xin Số)
 * Áp dụng đồng bộ cho: Messenger, Facebook Comments, Web Chat tuaudio.vn
 */

export const KHO_THONG_TIN = {
  showroom: 'Số 220 đường Nguyễn Danh Phương, phường Hội Hợp, TP. Vĩnh Yên, tỉnh Vĩnh Phúc',
  hotlineZalo: '0984.259.898',
  goiDan: 'Gói 19 triệu và 29 triệu (vang số có khóa mật khẩu, cài sẵn 4 chế độ bấm 1 chạm: Hát chuyên nghiệp, Hát nhẹ, Nghe nhạc vàng, Nhạc bốc)',
  dichVu: 'Có nhận căn chỉnh tận nhà (tùy khu vực và khoảng cách), có nhận thu cũ đổi mới'
}

/**
 * Thư viện câu trả lời chuẩn xác - Chế độ A
 */
export const TEMPLATES = {
  // Messenger (M-01 đến M-23)
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
  NGUOI_HAY_BOT: 'Dạ em là trợ lý tự động của Tú Audio ạ! Em xin phép ghi nhận thông tin để anh Tú liên hệ hỗ trợ bác chu đáo nhất nhé ạ!',

  // Bình luận Facebook (C-01 đến C-06)
  C01_DIA_CHI: 'Dạ showroom bên em ở Số 220 Nguyễn Danh Phương, P. Hội Hợp, TP. Vĩnh Yên, Vĩnh Phúc ạ. Bác nhắn Messenger hoặc Zalo 0984.259.898 để em tư vấn nhé ạ!',
  C02_HOI_GIA: 'Dạ giá tùy phòng và thiết bị của bác ạ. Bác nhắn Messenger hoặc Zalo 0984.259.898 để bên em báo đúng cấu hình nhé ạ!',
  C03_TAN_NHA: 'Dạ bên em có nhận căn chỉnh tận nhà, tùy khu vực ạ. Bác nhắn Messenger hoặc Zalo 0984.259.898 cho em xin khu vực để anh Tú báo lịch nhé ạ!',
  C04_KHEN_CAM_ON: 'Dạ em cảm ơn bác ạ! Bác cần tư vấn thêm cứ nhắn Messenger hoặc Zalo 0984.259.898 nhé ạ!',
  C05_NHAN_SDT: 'Dạ em đã nhận được số của bác rồi ạ, bên em sẽ liên hệ tư vấn cho bác sớm nhé ạ!'
}

/**
 * Trích xuất SĐT Việt Nam chuẩn xác (hỗ trợ dấu chấm, dấu cách, dấu gạch ngang, +84, 84)
 */
export function extractPhoneNumber(text = '') {
  if (!text) return null
  const cleaned = text
    .replace(/[\s.\-_/()]/g, '')
    .replace(/^\+84/, '0')
    .replace(/^84/, '0')
  const match = cleaned.match(/(0[3|5|7|8|9][0-9]{8})/g)
  return match ? match[0] : null
}

/**
 * Chuẩn hóa chuỗi không dấu để so khớp
 */
export function normalizeText(text = '') {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

/**
 * Trích xuất địa danh / tỉnh thành lân cận
 */
export function extractProvinceName(text = '') {
  const norm = normalizeText(text)
  const map = [
    { key: 'luong son', name: 'Lương Sơn' },
    { key: 'tam dao', name: 'Tam Đảo' },
    { key: 'vinh yen', name: 'Vĩnh Yên' },
    { key: 'vinh phuc', name: 'Vĩnh Phúc' },
    { key: 'viet tri', name: 'Việt Trì' },
    { key: 'phu tho', name: 'Phú Thọ' },
    { key: 'song lo', name: 'Sông Lô' },
    { key: 'lap thach', name: 'Lập Thạch' },
    { key: 'me linh', name: 'Mê Linh' },
    { key: 'soc son', name: 'Sóc Sơn' },
    { key: 'ha noi', name: 'Hà Nội' },
    { key: 'tuyen quang', name: 'Tuyên Quang' },
    { key: 'thai nguyen', name: 'Thái Nguyên' },
    { key: 'bac ninh', name: 'Bắc Ninh' }
  ]
  for (const item of map) {
    if (norm.includes(item.key)) return item.name
  }
  return null
}

/**
 * BỘ KHỚP MẪU NHANH HYBRID (HYBRID PATTERN MATCHER)
 * Khớp siêu tốc bằng code, phản hồi < 0.1 giây, 100% không lỗi mạng
 */
export function matchFastHybridResponse({ message = '', hasPhone = false, hasSentM20 = false, isComment = false }) {
  const raw = (message || '').trim()
  const norm = normalizeText(raw)
  const phone = extractPhoneNumber(raw)

  // 1. Trường hợp bình luận Facebook (C-01 đến C-06)
  if (isComment) {
    if (phone) {
      return { matched: true, reply: TEMPLATES.C05_NHAN_SDT, ask_phone: false, isPhoneCaptured: true, phone }
    }
    // Hỏi ở đâu, địa chỉ
    if (norm.includes('o dau') || norm.includes('dia chi') || norm.includes('cho nao') || norm.includes('o vung nao') || norm.includes('o khu vuc nao')) {
      return { matched: true, reply: TEMPLATES.C01_DIA_CHI, ask_phone: true }
    }
    // Hỏi giá
    if (norm.includes('gia') || norm.includes('bao nhieu') || norm.includes('nhieu tien') || norm.includes('bao gia') || norm.includes('gia sao') || norm.includes('sin gia') || norm.includes('xin gia')) {
      return { matched: true, reply: TEMPLATES.C02_HOI_GIA, ask_phone: true }
    }
    // Hỏi làm tận nhà
    if (norm.includes('tan nha') || norm.includes('qua nha') || norm.includes('den nha') || norm.includes('tan noi') || norm.includes('ve nha') || norm.includes('xuong nha')) {
      return { matched: true, reply: TEMPLATES.C03_TAN_NHA, ask_phone: true }
    }
    // Khen, cảm ơn
    if (norm === 'hay qua' || norm === 'cam on' || norm === 'tuyet voi' || norm === 'dep qua' || norm === 'ok shop') {
      return { matched: true, reply: TEMPLATES.C04_KHEN_CAM_ON, ask_phone: false }
    }
  }

  // 2. Trường hợp tin nhắn Messenger (M-01 đến M-23)
  if (phone) {
    return { matched: true, reply: TEMPLATES.M19_DA_NHAN_SDT(phone), ask_phone: false, isPhoneCaptured: true, phone, handoff: true }
  }

  if (hasPhone) {
    // LỰA CHỌN (a): Bot trả lời đúng 1 lần bằng M-20 rồi im, chuyển người thật
    if (hasSentM20) {
      return { matched: true, silence: true, reply: '', ask_phone: false, handoff: true }
    }
    if (norm.includes('o dau') || norm.includes('dia chi')) {
      return { matched: true, reply: `Dạ showroom bên em ở Số 220 đường Nguyễn Danh Phương, phường Hội Hợp, TP. Vĩnh Yên, Vĩnh Phúc ạ. Anh Tú sẽ chủ động gọi điện trao đổi thêm với bác nhé ạ!`, ask_phone: false, sendM20: true }
    }
    return { matched: true, reply: TEMPLATES.M20_DA_CO_SDT_NHAN_TIEP, ask_phone: false, sendM20: true, handoff: true }
  }

  // Khách hỏi người hay bot
  if (norm.includes('nguoi hay bot') || norm.includes('nguoi hay may') || norm.includes('la bot') || norm.includes('la may') || norm.includes('ai tra loi')) {
    return { matched: true, reply: TEMPLATES.NGUOI_HAY_BOT, ask_phone: false }
  }

  // Khách bực, khiếu nại, hỏi bảo hành đơn cũ
  if (norm.includes('kieu nai') || norm.includes('lua dao') || norm.includes('hang loi') || norm.includes('bao hanh') || norm.includes('sao chua giao') || norm.includes('lam an')) {
    return { matched: true, reply: TEMPLATES.M21_KHIEU_NAI, ask_phone: false, handoff: true }
  }

  // Khách chào ngắn gọn "Alo", "Chào shop", "ib", "inbox", "tư vấn giúp", "tư vấn cho mình"
  if (norm === 'alo' || norm === 'chao' || norm === 'chao em' || norm === 'chao shop' || norm === 'hi' || norm === 'hello' || norm === 'e oi' || norm === 'ib' || norm === 'inbox' || norm.includes('tu van giup') || norm.includes('tu van cho') || norm.includes('tu van ho') || norm.includes('can tu van')) {
    return { matched: true, reply: TEMPLATES.M01_CHAO, ask_phone: false }
  }

  // Khách hỏi địa chỉ showroom
  if (norm.includes('o dau') || norm.includes('dia chi') || norm.includes('cho nao') || norm.includes('dia chi cu the')) {
    return { matched: true, reply: TEMPLATES.M02_DIA_CHI, ask_phone: true }
  }

  // Khách ở xa hỏi "xuống nhà được không", "có về nhà không"
  const diaPhuong = extractProvinceName(raw)
  if (norm.includes('xuong nha') || norm.includes('xuong luon') || norm.includes('den nha') || norm.includes('ve nha') || norm.includes('qua nha')) {
    if (diaPhuong) {
      return { matched: true, reply: TEMPLATES.M03_XUONG_NHA(diaPhuong), ask_phone: true }
    } else {
      return { matched: true, reply: TEMPLATES.M08_TAN_NHA_CHUNG, ask_phone: true }
    }
  }

  // Khách hỏi giá công căn chỉnh / xử lý
  if (norm.includes('gia xu ly') || norm.includes('tien cong') || norm.includes('chinh het bao nhieu') || norm.includes('gia chinh') || norm.includes('phi chinh') || norm.includes('chinh giup') || norm.includes('chinh vang')) {
    return { matched: true, reply: TEMPLATES.M05_GIA_XU_LY, ask_phone: true }
  }

  // Khách hỏi giá bộ dàn karaoke
  if (norm.includes('gia bao nhieu') || norm.includes('gia sao') || norm.includes('bao tien') || norm.includes('bao gia') || norm.includes('xin gia') || norm.includes('sin gia')) {
    return { matched: true, reply: TEMPLATES.M04_HOI_GIA_DAN, ask_phone: true }
  }

  // Khách than hú rít, nặng mic
  if (norm.includes('hu') || norm.includes('rit') || norm.includes('nang mic') || norm.includes('hat met') || norm.includes('re') || norm.includes('bi re')) {
    return { matched: true, reply: TEMPLATES.M06_HU_RIT, ask_phone: true }
  }

  // Khách có đồ cũ muốn nâng cấp / đổi vang
  if (norm.includes('nang cap') || norm.includes('do cu') || norm.includes('co con') || norm.includes('co bo') || norm.includes('dang dung')) {
    return { matched: true, reply: TEMPLATES.M07_DO_CU, ask_phone: true }
  }

  // Thu cũ đổi mới
  if (norm.includes('thu cu') || norm.includes('doi moi') || norm.includes('bu tru')) {
    return { matched: true, reply: TEMPLATES.M09_THU_CU_DOI_MOI, ask_phone: true }
  }

  // Sợ mua hớ / sợ hàng nhái
  if (norm.includes('hang bai that khong') || norm.includes('hang xin') || norm.includes('so mua ho') || norm.includes('nhai') || norm.includes('chinh hang khong')) {
    return { matched: true, reply: TEMPLATES.M10_SO_MUA_HO, ask_phone: true }
  }

  // So sánh với nơi khác
  if (norm.includes('so sanh') || norm.includes('ben kia') || norm.includes('shop khac') || norm.includes('cua hang khac')) {
    return { matched: true, reply: TEMPLATES.M11_SO_SANH, ask_phone: true }
  }

  // Chung cư, nhà liền kề sợ ồn
  if (norm.includes('chung cu') || norm.includes('nha pho') || norm.includes('so on') || norm.includes('hang xom')) {
    return { matched: true, reply: TEMPLATES.M12_CHUNG_CU, ask_phone: true }
  }

  // Mê Bolero
  if (norm.includes('bolero') || norm.includes('nhac vang') || norm.includes('dan ca') || norm.includes('tru tinh')) {
    return { matched: true, reply: TEMPLATES.M13_BOLERO, ask_phone: true }
  }

  // Mê Remix, nhạc sàn
  if (norm.includes('remix') || norm.includes('nhac san') || norm.includes('vinahouse') || norm.includes('bass')) {
    return { matched: true, reply: TEMPLATES.M14_REMIX, ask_phone: true }
  }

  // Thông tầng, nhiều kính
  if (norm.includes('thong tang') || norm.includes('kinh') || norm.includes('doi am') || norm.includes('ong tai') || norm.includes('cau thang')) {
    return { matched: true, reply: TEMPLATES.M15_THONG_TANG, ask_phone: true }
  }

  // Từng bị chỉnh hỏng
  if (norm.includes('chinh roi') || norm.includes('tho truoc') || norm.includes('chinh hong') || norm.includes('khong an thua')) {
    return { matched: true, reply: TEMPLATES.M16_CHINH_HONG, ask_phone: true }
  }

  // Người già, trẻ con
  if (norm.includes('nguoi gia') || norm.includes('tre con') || norm.includes('kho dung') || norm.includes('de dung khong')) {
    return { matched: true, reply: TEMPLATES.M17_NGUOI_GIA, ask_phone: true }
  }

  // Sắm trọn bộ
  if (norm.includes('tron bo') || norm.includes('sam dan') || norm.includes('mua ca bo')) {
    return { matched: true, reply: TEMPLATES.M18_STEP1_M2, ask_phone: false }
  }

  return { matched: false }
}

/**
 * XÂY DỰNG PROMPT GEMINI CHẾ ĐỘ A VỚI SCHEMA JSON BẮT BUỘC
 */
export function buildGeminiPromptV2({ customerName = 'bác', messageText = '', historyText = '', hasPhone = false, isComment = false }) {
  const systemInstruction = `Bạn là trợ lý tự động của Tú Audio (karaoke gia đình tầm trung và cao cấp, Vĩnh Phúc).
Mục tiêu duy nhất: trả lời đúng câu khách vừa hỏi bằng thông tin trong KHO_THÔNG_TIN, rồi xin số Zalo/SĐT để anh Tú liên hệ. Không tư vấn kỹ thuật sâu, không báo giá bừa.

KHO_THÔNG_TIN:
- Showroom: Số 220 đường Nguyễn Danh Phương, phường Hội Hợp, TP. Vĩnh Yên, tỉnh Vĩnh Phúc. Hotline/Zalo: 0984.259.898.
- Gói dàn 19 triệu và 29 triệu (cài sẵn 4 chế độ bấm 1 chạm: Hát chuyên nghiệp, Hát nhẹ, Nghe nhạc vàng, Nhạc bốc; vang số có khóa mật khẩu).
- Có nhận căn chỉnh tận nhà (tùy khu vực và khoảng cách), có nhận thu cũ đổi mới.

QUY TẮC BẮT BUỘC (TUÂN THỦ 100%):
1. Tự xưng "em", gọi khách "bác" (hoặc "anh"). Chưa biết tên thì không gọi tên. CẤM dùng từ "Khách Facebook".
2. Câu đầu tiên trả lời đúng điều khách vừa hỏi.
3. Chỉ dùng thông tin trong KHO_THÔNG_TIN. Thiếu thì nói anh Tú sẽ báo lại. Không bịa địa chỉ, giá, chính sách, giờ giấc.
4. Không chẩn đoán nguyên nhân, không hứa kết quả "xử lý dứt điểm", không hứa giờ giấc cụ thể, không hứa "thanh toán sau".
5. Không chê thiết bị hay thợ khác. Khen đồ khách đang dùng trước.
6. ${isComment ? 'BÌNH LUẬN FACEBOOK: Tối đa 2 câu, dưới 40 từ, chỉ trả lời công khai, TUYỆT ĐỐI không nhắn riêng.' : 'MESSENGER: Tối đa 3 câu ngắn gọn.'}
7. Mỗi tin tối đa 1 câu hỏi và 1 lời mời. Chỉ xin số tối đa 1 lần. ${hasPhone ? 'Khách ĐÃ CÓ SĐT: TUYỆT ĐỐI KHÔNG xin lại số Zalo/SĐT.' : ''}
8. Khách hỏi bạn là người hay máy thì nói thật là trợ lý tự động của Tú Audio.
9. Khách bực, khiếu nại, mặc cả, hỏi bảo hành hoặc đơn hàng, hoặc bạn không chắc: đặt handoff là true.

ĐẦU RA BẮT BUỘC: Trả về một đối tượng JSON hợp lệ gồm 4 trường:
{
  "intent": "Mục đích câu hỏi của khách",
  "reply": "Nội dung phản hồi hoàn chỉnh, không bị cụt câu",
  "ask_phone": true/false,
  "handoff": true/false
}`

  const userContent = `${historyText ? 'LỊCH SỬ TIN NHẮN TRƯỚC ĐÓ:\n' + historyText + '\n\n' : ''}CÂU HỎI MỚI CỦA KHÁCH:
Tên khách: "${customerName}"
Nội dung: "${messageText}"
Trạng thái đã có SĐT: ${hasPhone ? 'CÓ' : 'CHƯA'}

Hãy phân tích và trả về đúng JSON theo yêu cầu:`

  return { systemInstruction, userContent }
}

/**
 * BỘ KIỂM SOÁT ĐẦU RA AN TOÀN (OUTPUT VERIFICATION GUARDRAILS - MỤC 7)
 */
export function verifyAndCleanOutput({ rawReply = '', finishReason = 'STOP', hasPhone = false, isComment = false, recentOuts = [] }) {
  if (!rawReply || typeof rawReply !== 'string') {
    return { ok: false, reason: 'REPLY_EMPTY', fallback: TEMPLATES.M23_DU_PHONG_LOI }
  }

  const trimmed = rawReply.trim()

  // 1. Kiểm tra câu bị cắt / chưa kết thúc: finishReason khác STOP thì chặn ngay
  if (finishReason && finishReason !== 'STOP') {
    return { ok: false, reason: 'FINISH_REASON_' + finishReason, fallback: TEMPLATES.M23_DU_PHONG_LOI }
  }

  // 2. Kiểm tra địa chỉ cụt / sai lệch so với KHO_THONG_TIN (VD: câu kết thúc bằng "TP.", thiếu Vĩnh Phúc/Vĩnh Yên)
  if (/nguyễn danh phương/i.test(trimmed) || /showroom/i.test(trimmed)) {
    if (!/vĩnh yên/i.test(trimmed) || !/vĩnh phúc/i.test(trimmed) || /tp\.?\s*$/i.test(trimmed)) {
      return { ok: false, reason: 'INCOMPLETE_ADDRESS', fallback: TEMPLATES.M02_DIA_CHI }
    }
  }

  // 3. Câu phải kết thúc bằng dấu câu chuẩn (. ! ? … ạ nha nhé)
  if (!/[.!?…ạa]|(nha|nhé|nhe)\s*[.!?]?$/i.test(trimmed)) {
    return { ok: false, reason: 'INCOMPLETE_PUNCTUATION', fallback: TEMPLATES.M23_DU_PHONG_LOI }
  }

  // 2. Chặn mã rác hoặc JSON dính vào văn bản
  if (trimmed.includes('{"') || trimmed.includes('"}') || trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.includes('\\/')) {
    return { ok: false, reason: 'CORRUPTED_JSON_OR_SCRAP', fallback: TEMPLATES.M23_DU_PHONG_LOI }
  }

  // 3. Chặn từ cấm "Khách Facebook"
  if (/khách facebook/i.test(trimmed)) {
    return { ok: false, reason: 'FORBIDDEN_NAME_PHRASE', fallback: TEMPLATES.M01_CHAO }
  }

  // 4. Nếu đã có số mà bot lại đi xin số
  if (hasPhone) {
    if (/xin số/i.test(trimmed) || /xin sđt/i.test(trimmed) || /cho em số/i.test(trimmed) || /cho em xin số/i.test(trimmed)) {
      return { ok: false, reason: 'REDUNDANT_PHONE_REQUEST', fallback: TEMPLATES.M20_DA_CO_SDT_NHAN_TIEP }
    }
  }

  // 5. Giới hạn độ dài
  if (isComment) {
    const wordCount = trimmed.split(/\s+/).length
    if (wordCount > 40) {
      return { ok: false, reason: 'COMMENT_TOO_LONG', fallback: TEMPLATES.C01_DIA_CHI }
    }
  } else {
    // Messenger tối đa 3 câu
    const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0)
    if (sentences.length > 4) {
      return { ok: false, reason: 'MESSENGER_TOO_LONG', fallback: TEMPLATES.M23_DU_PHONG_LOI }
    }
  }

  // 6. Kiểm tra chống lặp tin nhắn với 5 tin gần nhất
  const normalizeForCompare = (s) => (s || '').replace(/[^a-z0-9à-ỹ]/g, '').toLowerCase()
  const replyNorm = normalizeForCompare(trimmed)
  if (recentOuts.some(outMsg => normalizeForCompare(outMsg) === replyNorm)) {
    return { ok: false, reason: 'DUPLICATE_RECENT_MESSAGE', fallback: null }
  }

  return { ok: true, cleanedReply: trimmed }
}
