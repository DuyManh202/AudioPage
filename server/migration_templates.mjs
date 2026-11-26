import { query } from './db.js';

async function migrateTemplates() {
  await query(`
    CREATE TABLE IF NOT EXISTS ai_templates (
      code VARCHAR(20) PRIMARY KEY,
      channel VARCHAR(20) NOT NULL,
      intent VARCHAR(50) NOT NULL,
      description VARCHAR(255),
      content TEXT NOT NULL,
      is_active BOOLEAN DEFAULT true,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const templates = [
    // Messenger
    ['M-01', 'MESSENGER', 'CHAO', 'Chào, hỏi chung', 'Dạ em chào bác ạ! Bác đang cần chỉnh lại vang số cho đỡ hú, hay tìm dàn karaoke mới để em báo đúng hướng ạ?'],
    ['M-02', 'MESSENGER', 'DIA_CHI', 'Hỏi địa chỉ', 'Dạ showroom bên em ở Số 220 đường Nguyễn Danh Phương, phường Hội Hợp, TP. Vĩnh Yên, Vĩnh Phúc ạ. Bác cho em xin số Zalo để anh Tú nhắn lịch và tư vấn cho bác nhé ạ!'],
    ['M-03', 'MESSENGER', 'XUONG_NHA', 'Khách ở xa, hỏi xuống nhà', 'Dạ em ghi nhận bác ở {dia_phuong} ạ. Anh Tú có sang tận nơi hay hỗ trợ từ xa còn tùy lịch và khoảng cách, nên em xin phép để anh ấy trực tiếp báo lại cho bác. Bác cho em xin số Zalo để anh Tú liên hệ sớm nhất nhé ạ!'],
    ['M-04', 'MESSENGER', 'HOI_GIA_DAN', 'Hỏi giá dàn karaoke', 'Dạ giá phụ thuộc phòng và thiết bị bác đang có nên em chưa báo bừa được ạ. Bên em có các gói dàn 19 triệu và 29 triệu, bác cho em xin số Zalo để anh Tú gửi cấu hình và báo giá đúng cho bác nhé ạ!'],
    ['M-05', 'MESSENGER', 'GIA_XU_LY', 'Hỏi giá xử lý, căn chỉnh', 'Dạ giá xử lý phải xem tình trạng dàn của bác mới báo đúng được ạ. Bác cho em xin số Zalo, anh Tú sẽ nhắn hỏi vài thông tin rồi báo giá cụ thể cho bác nhé ạ!'],
    ['M-06', 'MESSENGER', 'HU_RIT', 'Hú rít, hát mệt', 'Dạ em hiểu, sắm dàn mà hát hú rít, nặng mic thì bực mình lắm ạ. Tình trạng này thường liên quan đến cách chỉnh vang số và phòng hát, cần xem thực tế mới nói chính xác được. Bác cho em xin số Zalo để anh Tú xem và tư vấn hướng xử lý cho bác nhé ạ!'],
    ['M-07', 'MESSENGER', 'DO_CU', 'Có đồ cũ muốn nâng cấp', 'Dạ đồ bác đang dùng nếu còn tốt thì cứ giữ lại cho đỡ tốn kém ạ, em không khuyên thay cả bộ đâu. Bác cho em xin số Zalo và vài tấm ảnh dàn hiện tại để anh Tú xem nên thay món nào cho hợp nhé ạ!'],
    ['M-08', 'MESSENGER', 'TAN_NHA_CHUNG', 'Hỏi làm tận nhà chung', 'Dạ bên em có nhận căn chỉnh tại nhà ạ, nhưng tùy khu vực và lịch nên em xin phép để anh Tú báo cụ thể. Bác cho em xin số Zalo và khu vực của bác nhé ạ!'],
    ['M-09', 'MESSENGER', 'THU_CU_DOI_MOI', 'Thu cũ đổi mới', 'Dạ bên em có nhận thu cũ đổi mới ạ. Giá thu phụ thuộc loại và tình trạng thiết bị, bác cho em xin số Zalo và ảnh đồ cũ để anh Tú báo giúp bác nhé ạ!'],
    ['M-10', 'MESSENGER', 'SO_MUA_HO', 'Sợ mua hớ / giả bãi', 'Dạ bác cẩn thận như vậy là đúng ạ. Anh Tú bên em có thể gọi video Zalo cho bác xem trực tiếp máy. Bác cho em xin số Zalo để anh Tú gọi cho bác nhé ạ!'],
    ['M-11', 'MESSENGER', 'SO_SANH', 'So sánh bên khác', 'Dạ mỗi nơi đều có thế mạnh riêng, bác cứ so sánh kỹ cho yên tâm ạ. Bên em chú trọng căn chỉnh theo đúng phòng của bác, bác cho em xin số Zalo để anh Tú gửi cấu hình và video thực tế cho bác tham khảo nhé ạ!'],
    ['M-12', 'MESSENGER', 'CHUNG_CU', 'Chung cư, nhà phố', 'Dạ ở chung cư hay nhà phố thì quan trọng là chỉnh dải trầm cho gọn, hát nhỏ mà lời vẫn rõ ạ. Bác cho em xin số Zalo để anh Tú gửi cấu hình phù hợp cho nhà bác nhé ạ!'],
    ['M-13', 'MESSENGER', 'BOLERO', 'Bolero, nhạc vàng', 'Dạ hát bolero thì tiếng mic cần dày, ấm và echo mềm thì luyến láy mới ngọt ạ. Bác cho em xin số Zalo để anh Tú gửi clip chất âm bolero cho bác nghe thử nhé ạ!'],
    ['M-14', 'MESSENGER', 'REMIX', 'Remix, nhạc sàn', 'Dạ nghe nhạc bốc thì dải trầm phải chắc, gọn và không đè lên lời hát ạ. Bác cho em xin số Zalo để anh Tú gửi clip test nhạc sàn cho bác nghe thử nhé ạ!'],
    ['M-15', 'MESSENGER', 'THONG_TANG', 'Phòng thông tầng, nhiều kính', 'Dạ phòng thông tầng hoặc nhiều kính thường dễ dội tiếng, nghe ong ong ạ. Cần xem phòng mới biết chỉnh thế nào, bác cho em xin số Zalo và gửi ảnh phòng khách để anh Tú tư vấn nhé ạ!'],
    ['M-16', 'MESSENGER', 'CHINH_HONG', 'Thợ khác chỉnh hỏng', 'Dạ em rất hiểu cảm giác đó ạ, đã tốn tiền mà hát vẫn chưa đã. Mỗi phòng một khác nên cần xem thực tế mới chỉnh đúng được. Bác cho em xin số Zalo để anh Tú xem và tư vấn cho bác nhé ạ!'],
    ['M-17', 'MESSENGER', 'NGUOI_GIA', 'Người già, trẻ nhỏ', 'Dạ bác yên tâm ạ, vang số bên em có khóa mật khẩu và cài sẵn 4 chế độ bấm 1 chạm, người nhà chỉ cần bật nguồn là hát. Bác cho em xin số Zalo để bên em gửi video hướng dẫn cho bác xem nhé ạ!'],
    ['M-18A', 'MESSENGER', 'SAM_DAN_M2', 'Sắm trọn bộ bước 1', 'Dạ để em báo đúng gói, phòng khách nhà bác rộng khoảng bao nhiêu mét vuông ạ?'],
    ['M-18B', 'MESSENGER', 'SAM_DAN_GOI', 'Sắm trọn bộ bước 2', 'Dạ bên em có gói 19 triệu và 29 triệu, cài sẵn 4 chế độ bấm 1 chạm ạ. Bác cho em xin số Zalo để anh Tú gửi cấu hình chi tiết và clip test thực tế cho bác nhé ạ!'],
    ['M-19', 'MESSENGER', 'DA_NHAN_SDT', 'Xác nhận vừa nhận SĐT', 'Dạ em đã nhận số {phone} của bác rồi ạ. Anh Tú bên em sẽ liên hệ với bác qua Zalo hoặc điện thoại sớm nhất có thể, bác chờ giúp em nhé ạ!'],
    ['M-20', 'MESSENGER', 'DA_CO_SDT_NHAN_TIEP', 'Khách đã có số nhắn tiếp', 'Dạ em đã chuyển tin của bác cho anh Tú rồi ạ, anh ấy sẽ trả lời bác sớm nhất.'],
    ['M-21', 'MESSENGER', 'KHIEU_NAI', 'Khiếu nại / bực mình', 'Dạ em xin lỗi vì sự bất tiện này ạ. Em đã báo ngay anh Tú để anh ấy trực tiếp liên hệ xử lý cho bác.'],
    ['M-22', 'MESSENGER', 'NGOAI_LINH_VUC', 'Hỏi ngoài âm thanh', 'Dạ phần này em chưa hỗ trợ được ạ. Nếu bác cần tư vấn dàn karaoke, vang số thì cứ nhắn em nhé ạ!'],
    ['M-23', 'MESSENGER', 'DU_PHONG_LOI', 'Dự phòng lỗi / giữ chân', 'Dạ em đã nhận tin của bác rồi ạ. Em báo anh Tú trả lời bác ngay, bác chờ em một chút nhé ạ!'],
    ['M-24', 'MESSENGER', 'NGUOI_HAY_BOT', 'Hỏi người hay máy', 'Dạ em là trợ lý tự động của Tú Audio ạ! Em xin phép ghi nhận thông tin để anh Tú liên hệ hỗ trợ bác chu đáo nhất nhé ạ!'],

    // Facebook Comments
    ['C-01', 'COMMENT', 'DIA_CHI', 'Bình luận hỏi địa chỉ', 'Dạ showroom bên em ở Số 220 Nguyễn Danh Phương, P. Hội Hợp, TP. Vĩnh Yên, Vĩnh Phúc ạ. Bác nhắn Messenger hoặc Zalo 0984.259.898 để em tư vấn nhé ạ!'],
    ['C-02', 'COMMENT', 'HOI_GIA', 'Bình luận hỏi giá', 'Dạ giá tùy phòng và thiết bị của bác ạ. Bác nhắn Messenger hoặc Zalo 0984.259.898 để bên em báo đúng cấu hình nhé ạ!'],
    ['C-03', 'COMMENT', 'TAN_NHA', 'Bình luận hỏi tận nhà', 'Dạ bên em có nhận căn chỉnh tận nhà, tùy khu vực ạ. Bác nhắn Messenger hoặc Zalo 0984.259.898 cho em xin khu vực để anh Tú báo lịch nhé ạ!'],
    ['C-04', 'COMMENT', 'KHEN_CAM_ON', 'Bình luận khen / cảm ơn', 'Dạ em cảm ơn bác ạ! Bác cần tư vấn thêm cứ nhắn Messenger hoặc Zalo 0984.259.898 nhé ạ!'],
    ['C-05', 'COMMENT', 'NHAN_SDT', 'Bình luận để lại SĐT', 'Dạ em đã nhận được số của bác rồi ạ, bên em sẽ liên hệ tư vấn cho bác sớm nhé ạ!']
  ];

  for (const t of templates) {
    await query(`
      INSERT INTO ai_templates (code, channel, intent, description, content, is_active, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP)
      ON CONFLICT (code) DO UPDATE SET
        content = EXCLUDED.content,
        description = EXCLUDED.description,
        intent = EXCLUDED.intent,
        updated_at = CURRENT_TIMESTAMP
    `, t);
  }

  console.log(`Migrated ${templates.length} templates into ai_templates table.`);
  process.exit(0);
}

migrateTemplates().catch(err => {
  console.error(err);
  process.exit(1);
});
