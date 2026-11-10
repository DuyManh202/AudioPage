<template>
  <footer class="app-footer">
    <div class="container footer-grid">
      <div class="footer-col">
        <div class="footer-brand">
          <span class="brand-title">TÚ AUDIO</span>
          <span class="brand-sub">Chuyên Gia Dàn Karaoke Gia Đình & Bán Lẻ Loa</span>
        </div>
        <p class="desc">
          Cam kết thiết bị âm thanh đồng bộ, xử lý dứt điểm hú rít, đem lại chất âm dày ấm, chuẩn phòng hát cho không gian nhà bạn.
        </p>
        <div class="trust-points">
          <div class="trust-item">✓ Thử dàn trực tiếp tại nhà trước khi nhận</div>
          <div class="trust-item">✓ Thu cũ đổi mới trợ giá tối đa</div>
          <div class="trust-item">✓ Hỗ trợ căn chỉnh âm học từ xa suốt đời</div>
        </div>
      </div>

      <div class="footer-col">
        <h4>Danh Mục Chính</h4>
        <ul>
          <li><router-link to="/dan-karaoke">Dàn Karaoke 29 Triệu (Cao Cấp)</router-link></li>
          <li><router-link to="/dan-karaoke">Dàn Karaoke 19 Triệu (Tiết Kiệm)</router-link></li>
          <li><router-link to="/san-pham">Loa Full Bass 30cm Coil 75</router-link></li>
          <li><router-link to="/san-pham">Loa Subwoofer Trầm Hơi 40 & Sub Điện 30</router-link></li>
          <li><router-link to="/san-pham">Cục Đẩy Công Suất & Vang Số Chống Hú</router-link></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Chính Sách & Hỗ Trợ</h4>
        <ul>
          <li>Chính sách thử loa 7 ngày tại nhà</li>
          <li>Bảo hành chính hãng 24 tháng đổi mới lỗi nhà sản xuất</li>
          <li>Quy trình lắp đặt chuẩn bán kính 300km</li>
          <li>Hướng dẫn tự cân chỉnh vang số & micro</li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Liên Hệ Showroom</h4>
        <div class="contact-info">
          <p>📍 <strong>Trụ sở:</strong> Phố Nguyễn Danh Phương, P. Vĩnh Yên, Phú Thọ</p>
          <p>🚚 <strong>Phạm vi phục vụ:</strong> Hà Nội & Toàn bộ các tỉnh Miền Bắc (bán kính 300km)</p>
          <p>📞 <strong>Hotline / Zalo:</strong> 098x.xxx.xxx (Anh Tú)</p>
          <p>⏰ <strong>Giờ làm việc:</strong> 8:00 - 21:00 (Cả Thứ 7, Chủ Nhật)</p>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="container text-center">
        <p>© 2026 TÚ AUDIO - Bản quyền thuộc về Tú Audio. Tôn trọng sự thật - Uy tín tạo dựng từ chất âm thực tế.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background-color: var(--bg-dark-800);
  border-top: 1px solid var(--border-color);
  padding-top: 50px;
  margin-top: 60px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
  gap: 36px;
  padding-bottom: 40px;
}

.brand-title {
  display: block;
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--color-primary);
}

.brand-sub {
  display: block;
  font-size: 0.85rem;
  color: #94a3b8;
  margin-bottom: 12px;
}

.desc {
  font-size: 0.9rem;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 16px;
}

.trust-points {
  font-size: 0.85rem;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trust-item {
  color: var(--color-primary);
}

.footer-col h4 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 18px;
  position: relative;
  padding-bottom: 8px;
}

.footer-col h4::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 32px;
  height: 2px;
  background: var(--color-primary);
}

.footer-col ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-col ul li a, .footer-col ul li {
  font-size: 0.9rem;
  color: #94a3b8;
  transition: color 0.2s;
}

.footer-col ul li a:hover {
  color: var(--color-primary);
}

.contact-info p {
  font-size: 0.88rem;
  color: #cbd5e1;
  margin-bottom: 8px;
  line-height: 1.5;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 18px 0;
  font-size: 0.85rem;
  color: #64748b;
}

.text-center {
  text-align: center;
}

@media (max-width: 992px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
