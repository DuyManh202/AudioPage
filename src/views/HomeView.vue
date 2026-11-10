<template>
  <div class="home-view">
    <HomeHero />

    <ComboOffers />

    <!-- Danh Sách Loa Nổi Bật -->
    <section class="speakers-section">
      <div class="container">
        <div class="section-head-row">
          <div>
            <span class="badge-gold">TUYỂN CHỌN CHẤT LƯỢNG CAO</span>
            <h2 class="section-title">Loa Full & Loa Subwoofer Rời Bán Chạy</h2>
          </div>
          <router-link to="/san-pham" class="view-all-link">
            Xem Tất Cả Thiết Bị &rarr;
          </router-link>
        </div>

        <div class="products-grid">
          <ProductCard 
            v-for="item in featuredSpeakers" 
            :key="item.id" 
            :product="item" 
          />
        </div>
      </div>
    </section>

    <!-- Công Cụ Tính Âm Học Theo Phòng -->
    <RoomCalculator />

    <!-- Thu Cũ Đổi Mới -->
    <section class="trade-in-section" id="trade-in">
      <div class="container">
        <div class="trade-in-box">
          <div class="trade-in-content">
            <span class="badge-blue">CHÍNH SÁCH ĐỘC QUYỀN</span>
            <h2>Thu Cũ Đổi Mới — Lên Đời Dàn Không Lo Lỗ</h2>
            <p>
              Bác đang có đôi loa cũ, amply cũ hoặc vang cơ rè tiếng mà bỏ thì tiếc, dùng thì chán? Tú Audio hỗ trợ định giá sát giá thị trường để trừ thẳng vào tiền khi lên dàn mới hoặc nâng cấp vang số, micro!
            </p>
            <ul class="trade-perks">
              <li>✓ Nhận định giá nhanh qua Zalo chỉ bằng hình ảnh chụp thiết bị</li>
              <li>✓ Trừ tiền trực tiếp vào hóa đơn nâng cấp</li>
              <li>✓ Kỹ thuật viên mang dàn mới đến tận nhà lắp và nhận thiết bị cũ mang về</li>
            </ul>
            <router-link to="/thu-cu-doi-moi" class="btn-primary">
              Gửi Hình Dàn Cũ Để Định Giá Ngay
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Phễu Tặng Ebook Miễn Phí Toàn Quốc -->
    <EbookLeadMagnet />

    <!-- Nỗi Đau & Cam Kết Thật -->
    <section class="pain-points-section">
      <div class="container">
        <div class="text-center section-head">
          <span class="badge-gold">TÔN TRỌNG SỰ THẬT</span>
          <h2 class="section-title">Tại Sao 90% Khách Hàng Tìm Đến Tú Audio?</h2>
          <p class="section-desc">
            Không quảng cáo hoa mỹ, không bán hàng trôi nổi. Chúng tôi giải quyết triệt để từng vấn đề mà người chơi âm thanh thường gặp phải.
          </p>
        </div>

        <div class="pain-grid">
          <div class="pain-card">
            <div class="pain-icon">🚫</div>
            <h3>Sợ Hú Rít, Mic Nặng Tiếng</h3>
            <p>Được căn chỉnh bằng phần mềm âm học chuyên sâu trên vang số K9. Cắt đúng tần số gây cộng hưởng phòng mà không làm mỏng giọng hát.</p>
          </div>

          <div class="pain-card">
            <div class="pain-icon">💸</div>
            <h3>Sợ Mua Hớ, Phối Ghép Sai</h3>
            <p>Rất nhiều bác ghép đẩy yếu kéo loa to dẫn đến méo tiếng, cháy treble. Tú Audio tính toán đủ Headroom công suất để loa bền bỉ 10 năm.</p>
          </div>

          <div class="pain-card">
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
import { useCartStore } from '../stores/cartStore'
import HomeHero from '../components/home/HomeHero.vue'
import ComboOffers from '../components/home/ComboOffers.vue'
import RoomCalculator from '../components/home/RoomCalculator.vue'
import EbookLeadMagnet from '../components/home/EbookLeadMagnet.vue'
import ProductCard from '../components/product/ProductCard.vue'

const productStore = useProductStore()

const featuredSpeakers = computed(() => productStore.featuredSpeakers)
</script>

<style scoped>
.speakers-section {
  padding: 60px 0;
  background: var(--bg-dark-900);
}

.section-head-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #fff;
  margin-top: 6px;
}

.view-all-link {
  color: var(--color-primary);
  font-weight: 700;
  font-size: 0.95rem;
  transition: transform 0.2s;
}

.view-all-link:hover {
  transform: translateX(4px);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 24px;
}

.trade-in-section {
  padding: 50px 0;
}

.trade-in-box {
  background: linear-gradient(135deg, #181c2d, #101322);
  border: 1px solid rgba(40, 55, 252, 0.4);
  border-radius: var(--radius-lg);
  padding: 44px;
}

.trade-in-content {
  max-width: 720px;
}

.trade-in-content h2 {
  font-size: 1.8rem;
  color: #fff;
  margin: 10px 0 14px;
}

.trade-in-content p {
  font-size: 0.95rem;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 20px;
}

.trade-perks {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.9rem;
  color: #cbd5e1;
  margin-bottom: 26px;
}

.pain-points-section {
  padding: 70px 0;
  background: var(--bg-dark-800);
}

.text-center {
  text-align: center;
}

.section-head {
  max-width: 680px;
  margin: 0 auto 40px;
}

.section-desc {
  font-size: 0.95rem;
  color: #94a3b8;
  line-height: 1.6;
}

.pain-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

.pain-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 30px;
  text-align: center;
}

.pain-icon {
  font-size: 2.2rem;
  margin-bottom: 14px;
}

.pain-card h3 {
  font-size: 1.15rem;
  color: #fff;
  margin-bottom: 10px;
}

.pain-card p {
  font-size: 0.88rem;
  color: #94a3b8;
  line-height: 1.55;
}

@media (max-width: 850px) {
  .pain-grid {
    grid-template-columns: 1fr;
  }
  .section-head-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
