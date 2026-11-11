<template>
  <div class="home-view">
    <HomeHero />

    <ComboOffers />

    <!-- Bằng Chứng Thực Tế Khách Hàng Lắp Đặt -->
    <CustomerProofSection />

    <!-- Khung Showcase Top Thiết Bị & Loa Bán Chạy (Chuẩn 2 cột trên Mobile) -->
    <section class="speakers-section">
      <div class="container">
        <div class="hot-showcase-frame" v-reveal>
          <div class="hot-showcase-header">
            <div class="hot-header-titles">
              <span class="hot-kicker">🔥 TUYỂN CHỌN BÁN CHẠY NHẤT TÚ AUDIO</span>
              <h2 class="hot-title">TOP THIẾT BỊ &amp; LOA KARAOKE BÁN CHẠY</h2>
            </div>
            <router-link to="/san-pham" class="view-all-link">
              Xem Kho Thiết Bị &rarr;
            </router-link>
          </div>

          <div class="products-grid">
            <ProductCard
              v-for="item in featuredProducts"
              :key="item.id"
              :product="item"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Công Cụ Tính Âm Học Theo Phòng -->
    <RoomCalculator />

    <!-- Thu Cũ Đổi Mới -->
    <section class="trade-in-section" id="trade-in">
      <div class="container">
        <div class="trade-in-box" v-reveal>
          <div class="trade-ring-decor" aria-hidden="true"></div>

          <div class="trade-in-content">
            <span class="badge-blue">CHÍNH SÁCH ĐỘC QUYỀN</span>
            <h2>Thu Cũ Đổi Mới — Lên Đời Dàn Không Lo Lỗ</h2>
            <p>
              Bác đang có đôi loa cũ, amply cũ hoặc vang cơ rè tiếng mà bỏ thì tiếc, dùng thì chán? Tú Audio hỗ trợ định giá sát giá thị trường để trừ thẳng vào tiền khi lên dàn mới hoặc nâng cấp vang số, micro!
            </p>
            <ul class="trade-perks">
              <li><span class="check">✓</span> Nhận định giá nhanh qua Zalo chỉ bằng ảnh chụp thiết bị</li>
              <li><span class="check">✓</span> Trừ tiền trực tiếp vào hóa đơn nâng cấp</li>
              <li><span class="check">✓</span> Kỹ thuật viên mang dàn mới đến tận nhà lắp và nhận thiết bị cũ mang về</li>
            </ul>
            <router-link to="/thu-cu-doi-moi" class="btn-primary">
              Gửi Ảnh Dàn Cũ Để Định Giá Ngay
            </router-link>
          </div>

          <div class="trade-side-cards">
            <div class="trade-stat-card">
              <span class="ts-num">15 Phút</span>
              <span class="ts-text">Thẩm định giá thu hồi sát thị trường qua ảnh Zalo</span>
            </div>
            <div class="trade-stat-card">
              <span class="ts-num">300km</span>
              <span class="ts-text">Đổi các trực tiếp tại nhà ở Hà Nội &amp; toàn Miền Bắc</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Phễu Tặng Ebook Miễn Phí Toàn Quốc -->
    <EbookLeadMagnet />

    <!-- Nỗi Đau & Cam Kết Thật -->
    <section class="pain-points-section">
      <div class="container">
        <div class="text-center section-head" v-reveal>
          <span class="badge-gold">TÔN TRỌNG SỰ THẬT</span>
          <h2 class="section-title">Tại Sao 90% Khách Hàng Tìm Đến Tú Audio?</h2>
          <p class="section-desc">
            Không quảng cáo hoa mỹ, không bán hàng trôi nổi. Chúng tôi giải quyết triệt để từng vấn đề mà người chơi âm thanh thường gặp phải.
          </p>
        </div>

        <div class="pain-grid">
          <div class="pain-card" v-reveal="0">
            <span class="card-num">01</span>
            <div class="pain-icon">🚫</div>
            <h3>Sợ Hú Rít, Mic Nặng Tiếng</h3>
            <p>Được căn chỉnh bằng phần mềm âm học chuyên sâu trên vang số K9. Cắt đúng tần số gây cộng hưởng phòng mà không làm mỏng giọng hát.</p>
          </div>

          <div class="pain-card" v-reveal="90">
            <span class="card-num">02</span>
            <div class="pain-icon">💸</div>
            <h3>Sợ Mua Hớ, Phối Ghép Sai</h3>
            <p>Rất nhiều bác ghép đẩy yếu kéo loa to dẫn đến méo tiếng, cháy treble. Tú Audio tính toán đủ Headroom công suất để loa bền bỉ 10 năm.</p>
          </div>

          <div class="pain-card" v-reveal="180">
            <span class="card-num">03</span>
            <div class="pain-icon">🚚</div>
            <h3>Sợ Nghe Ở Shop Hay, Về Nhà Dở</h3>
            <p>Âm học mỗi phòng khách một khác nhau (kính, gỗ, rèm). Tú Audio chở đồ đến tận nhà, setup theo đúng không gian thực tế của bác.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useProductStore } from '../stores/productStore'
import HomeHero from '../components/home/HomeHero.vue'
import ComboOffers from '../components/home/ComboOffers.vue'
import CustomerProofSection from '../components/home/CustomerProofSection.vue'
import RoomCalculator from '../components/home/RoomCalculator.vue'
import EbookLeadMagnet from '../components/home/EbookLeadMagnet.vue'
import ProductCard from '../components/product/ProductCard.vue'

const productStore = useProductStore()

const featuredProducts = computed(() => productStore.products.slice(0, 6))
</script>

<style scoped>
.speakers-section {
  padding: 56px 0 68px;
  background: var(--bg-dark-900);
}

.hot-showcase-frame {
  position: relative;
  background: linear-gradient(180deg, rgba(180, 83, 9, 0.24) 0%, rgba(28, 22, 34, 0.96) 22%, rgba(13, 17, 30, 0.98) 100%);
  border: 1.5px solid rgba(252, 183, 40, 0.42);
  border-radius: 22px;
  padding: 24px 22px 26px;
  box-shadow: 0 22px 48px -16px rgba(0, 0, 0, 0.78), 0 0 32px rgba(252, 183, 40, 0.08);
}

.hot-showcase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(252, 183, 40, 0.22);
}

.hot-header-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hot-kicker {
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #fde68a;
  text-transform: uppercase;
}

.hot-title {
  font-size: clamp(1.32rem, 2.5vw, 1.95rem);
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.01em;
  text-shadow: 0 2px 14px rgba(252, 183, 40, 0.22);
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #080a10;
  font-weight: 800;
  font-size: 0.86rem;
  padding: 9px 16px;
  border-radius: 999px;
  background: var(--gradient-gold);
  border: 1px solid rgba(255, 232, 163, 0.55);
  white-space: nowrap;
  box-shadow: 0 6px 16px -4px rgba(252, 183, 40, 0.45);
  transition: filter 0.2s, transform 0.2s;
}

.view-all-link:hover {
  filter: brightness(1.06);
  transform: translateX(3px);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.trade-in-section {
  padding: 58px 0;
  background: var(--bg-dark-900);
}

.trade-in-box {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 0.85fr);
  gap: 36px;
  align-items: center;
  background: linear-gradient(135deg, rgba(24, 31, 64, 0.9) 0%, rgba(16, 20, 35, 0.96) 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: var(--radius-xl);
  padding: 42px;
  box-shadow: var(--shadow-elevated), var(--inner-highlight);
}

.trade-ring-decor {
  position: absolute;
  right: -120px;
  top: -120px;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  border: 42px solid rgba(40, 55, 252, 0.08);
  pointer-events: none;
}

.trade-in-content h2 {
  font-size: clamp(1.5rem, 2.8vw, 2.05rem);
  font-weight: 900;
  color: #fff;
  margin: 12px 0 12px;
}

.trade-in-content p {
  color: var(--text-secondary);
  font-size: 0.96rem;
  line-height: 1.65;
  margin-bottom: 18px;
}

.trade-perks {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-bottom: 24px;
  font-size: 0.9rem;
  color: #e2e8f0;
}

.trade-perks li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.trade-perks .check {
  color: var(--color-primary);
  font-weight: 900;
}

.trade-side-cards {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.trade-stat-card {
  background: rgba(8, 11, 20, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 20px;
  backdrop-filter: blur(8px);
}

.ts-num {
  display: block;
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.ts-text {
  font-size: 0.86rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.pain-points-section {
  padding: 68px 0 44px;
}

.text-center {
  text-align: center;
}

.section-head {
  max-width: 700px;
  margin: 0 auto 40px;
}

.section-desc {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-top: 8px;
}

.pain-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.pain-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(24, 29, 46, 0.9) 0%, rgba(16, 20, 34, 0.96) 100%);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--radius-lg);
  padding: 28px 24px;
  box-shadow: var(--shadow-card), var(--inner-highlight);
  transition: transform 0.3s var(--ease-spring), border-color 0.25s;
}

.pain-card:hover {
  transform: translateY(-5px);
  border-color: var(--border-focus);
}

.card-num {
  position: absolute;
  top: 16px;
  right: 20px;
  font-family: var(--font-display);
  font-size: 2.3rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.05);
  line-height: 1;
}

.pain-icon {
  font-size: 2rem;
  margin-bottom: 14px;
}

.pain-card h3 {
  font-size: 1.12rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 10px;
}

.pain-card p {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.65;
}

@media (max-width: 1100px) {
  .products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
}

@media (max-width: 992px) {
  .pain-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .trade-in-box {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .speakers-section {
    padding: 36px 0 44px;
  }

  .speakers-section .container {
    padding: 0 10px;
  }

  .hot-showcase-frame {
    padding: 16px 10px 16px;
    border-radius: 16px;
  }

  .hot-showcase-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
    margin-bottom: 14px;
    padding-bottom: 12px;
  }

  .hot-title {
    font-size: 1.18rem;
  }

  .view-all-link {
    font-size: 0.78rem;
    padding: 7px 14px;
  }

  .products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .pain-grid {
    grid-template-columns: 1fr;
  }

  .trade-in-box {
    padding: 24px 18px;
    gap: 22px;
  }

  .trade-in-content .btn-primary {
    width: 100%;
  }

  .pain-points-section {
    padding: 44px 0 24px;
  }
}
</style>
