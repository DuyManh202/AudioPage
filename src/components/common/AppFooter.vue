<template>
  <footer class="app-footer">
    <div class="footer-glow-line" aria-hidden="true"></div>

    <div class="container footer-grid">
      <div class="footer-col footer-brand-col">
        <div class="footer-brand">
          <div class="footer-logo-mark">TA</div>
          <div>
            <span class="brand-title">TÚ AUDIO</span>
            <span class="brand-sub">Chuyên Gia Dàn Karaoke Gia Đình &amp; Bán Lẻ Loa</span>
          </div>
        </div>
        <p class="desc">
          Cam kết thiết bị âm thanh đồng bộ, xử lý dứt điểm hú rít, đem lại chất âm dày ấm, chuẩn phòng hát cho không gian nhà bạn.
        </p>
        <div class="trust-points">
          <div class="trust-item"><span class="check">✓</span> Thử dàn trực tiếp tại nhà trước khi nhận</div>
          <div class="trust-item"><span class="check">✓</span> Thu cũ đổi mới trợ giá tối đa</div>
          <div class="trust-item"><span class="check">✓</span> Hỗ trợ căn chỉnh âm học từ xa suốt đời</div>
        </div>
      </div>

      <div class="footer-col">
        <h4>Danh Mục Chính</h4>
        <ul>
          <li><router-link to="/dan-karaoke">Dàn Karaoke 29 Triệu (Cao Cấp)</router-link></li>
          <li><router-link to="/dan-karaoke">Dàn Karaoke 19 Triệu (Tiết Kiệm)</router-link></li>
          <li><router-link to="/san-pham">Loa Full Bass 30cm Coil 75</router-link></li>
          <li><router-link to="/san-pham">Loa Subwoofer Trầm Hơi 40 &amp; Sub Điện 30</router-link></li>
          <li><router-link to="/san-pham">Cục Đẩy Công Suất &amp; Vang Số Chống Hú</router-link></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Chính Sách &amp; Hỗ Trợ</h4>
        <ul>
          <li>Chính sách thử loa 7 ngày tại nhà</li>
          <li>Bảo hành chính hãng 24 tháng đổi mới lỗi nhà sản xuất</li>
          <li>Quy trình lắp đặt chuẩn bán kính 300km</li>
          <li>Hướng dẫn tự cân chỉnh vang số &amp; micro</li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Liên Hệ Showroom</h4>
        <div class="contact-card">
          <p>
            📍 <strong>Trụ sở:</strong>
            <a :href="CONTACT_INFO.mapUrl" target="_blank" rel="noopener noreferrer" class="contact-inline-link">
              Phố Nguyễn Danh Phương, P. Vĩnh Yên, Phú Thọ
            </a>
          </p>
          <p>🚚 <strong>Phạm vi phục vụ:</strong> Hà Nội &amp; Toàn bộ các tỉnh Miền Bắc (bán kính 300km)</p>
          <p>
            📞 <strong>Hotline / Zalo:</strong>
            <a :href="CONTACT_INFO.phoneHref" class="footer-phone">{{ CONTACT_INFO.phone }}</a>
          </p>
          <p>⏰ <strong>Giờ làm việc:</strong> 8:00 - 21:00 (Cả Thứ 7, Chủ Nhật)</p>
          <div class="social-links-row">
            <a :href="CONTACT_INFO.zaloUrl" target="_blank" rel="noopener noreferrer" class="social-pill zalo-pill">
              💬 Chat Zalo
            </a>
            <a :href="CONTACT_INFO.messengerUrl" target="_blank" rel="noopener noreferrer" class="social-pill messenger-pill">
              ⚡ Messenger
            </a>
            <a :href="CONTACT_INFO.youtubeUrl" target="_blank" rel="noopener noreferrer" class="social-pill yt-pill">
              ▶ YouTube @tuaudio92
            </a>
            <a :href="CONTACT_INFO.facebookUrl" target="_blank" rel="noopener noreferrer" class="social-pill fb-pill">
              📘 Facebook
            </a>
            <a :href="CONTACT_INFO.mapUrl" target="_blank" rel="noopener noreferrer" class="social-pill map-pill">
              📍 Google Maps
            </a>
          </div>
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

<script setup>
import { CONTACT_INFO } from '../../config/contact'
</script>

<style scoped>
.app-footer {
  position: relative;
  background: linear-gradient(180deg, #0b0e18 0%, #070910 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 60px;
  margin-top: 72px;
}

.footer-glow-line {
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: min(620px, 80%);
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
  opacity: 0.7;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1.25fr;
  gap: 36px;
  padding-bottom: 44px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.footer-logo-mark {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: var(--gradient-gold);
  color: #080a10;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.15rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 18px rgba(252, 183, 40, 0.25);
}

.brand-title {
  display: block;
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: 0.04em;
}

.brand-sub {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.desc {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.65;
  margin-bottom: 18px;
}

.trust-points {
  font-size: 0.84rem;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e2e8f0;
}

.trust-item .check {
  color: var(--color-primary);
  font-weight: 900;
}

.footer-col h4 {
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 18px;
  position: relative;
  padding-bottom: 10px;
}

.footer-col h4::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 34px;
  height: 2px;
  border-radius: 2px;
  background: var(--gradient-gold);
}

.footer-col ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.footer-col ul li a,
.footer-col ul li {
  font-size: 0.88rem;
  color: var(--text-muted);
  transition: color 0.2s, transform 0.2s;
}

.footer-col ul li a {
  display: inline-block;
}

.footer-col ul li a:hover {
  color: var(--color-primary);
  transform: translateX(3px);
}

.contact-card {
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.contact-card p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.footer-phone {
  color: var(--color-primary);
  font-weight: 800;
  margin-left: 4px;
}

.contact-inline-link {
  color: var(--text-secondary);
  text-decoration: underline;
  text-decoration-color: rgba(252, 183, 40, 0.4);
  text-underline-offset: 3px;
  transition: color 0.2s;
}

.contact-inline-link:hover {
  color: var(--color-primary);
}

.social-links-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.social-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
  color: #e2e8f0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: border-color 0.24s, background 0.24s, transform 0.24s var(--ease-spring), box-shadow 0.24s, color 0.24s;
}

.social-pill:hover {
  transform: translateY(-2px);
}

.social-pill.zalo-pill:hover {
  border-color: rgba(14, 165, 233, 0.65);
  background: rgba(14, 165, 233, 0.16);
  color: #7dd3fc;
  box-shadow: 0 8px 18px -6px rgba(14, 165, 233, 0.45);
}

.social-pill.messenger-pill:hover {
  border-color: rgba(139, 92, 246, 0.65);
  background: rgba(139, 92, 246, 0.16);
  color: #c4b5fd;
  box-shadow: 0 8px 18px -6px rgba(139, 92, 246, 0.45);
}

.social-pill.yt-pill:hover {
  border-color: rgba(239, 68, 68, 0.65);
  background: rgba(239, 68, 68, 0.16);
  color: #fca5a5;
  box-shadow: 0 8px 18px -6px rgba(239, 68, 68, 0.45);
}

.social-pill.fb-pill:hover {
  border-color: rgba(59, 130, 246, 0.65);
  background: rgba(59, 130, 246, 0.16);
  color: #93c5fd;
  box-shadow: 0 8px 18px -6px rgba(59, 130, 246, 0.45);
}

.social-pill.map-pill:hover {
  border-color: rgba(34, 197, 94, 0.65);
  background: rgba(34, 197, 94, 0.16);
  color: #86efac;
  box-shadow: 0 8px 18px -6px rgba(34, 197, 94, 0.45);
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 20px 0;
  font-size: 0.82rem;
  color: var(--text-subtle);
}

.text-center {
  text-align: center;
}

@media (max-width: 992px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .app-footer {
    padding-top: 42px;
    padding-bottom: 84px;
    margin-top: 48px;
  }
}

@media (max-width: 600px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}
</style>
