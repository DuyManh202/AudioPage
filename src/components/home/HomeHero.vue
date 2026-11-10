<template>
  <section class="hero-section">
    <div class="container hero-grid">
      <div class="hero-content">
        <div class="hero-badge">
          <span>🏆 Chuyên Gia Dàn Karaoke Chuẩn Phòng Hát</span>
        </div>
        <h1 class="hero-title">
          Hát Nhẹ - Sạch Tiếng - <span class="highlight">Tuyệt Đối Không Hú Rít</span>
        </h1>
        <p class="hero-sub">
          Chấm dứt nỗi ám ảnh chi hàng chục triệu mà hát vẫn nặng, tiếng bí và hú rít. Tú Audio trực tiếp đo đạc âm học, phối ghép đồng bộ và căn chỉnh tận nhà trong bán kính 300km.
        </p>

        <div class="hero-ctas">
          <router-link to="/dan-karaoke" class="btn-primary">
            Xem Gói Dàn 19tr & 29tr
          </router-link>
          <a href="#room-calculator" class="btn-outline">
            📐 Đo Diện Tích & Chọn Loa
          </a>
        </div>

        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-num">300km</span>
            <span class="stat-label">Phủ sóng lắp đặt tận nơi</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">100%</span>
            <span class="stat-label">Trị dứt điểm hú rít</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">24 Tháng</span>
            <span class="stat-label">Bảo hành chính hãng</span>
          </div>
        </div>
      </div>

      <div class="hero-card-side">
        <div class="featured-offer-box">
          <div class="box-badge">🔥 KHUYẾN NGHỊ SỐ 1</div>
          <h3>Dàn Karaoke 29 Triệu</h3>
          <p class="box-tagline">1 Đôi Loa Full 30 + Đẩy 4 Kênh x800W + Vang PF K9 + Sub Hơi 40 + Mic CM 05</p>
          <div class="box-pricing">
            <div class="price-val">29.900.000 đ</div>
            <div class="savings-val">Tiết kiệm thật 10,1 triệu</div>
          </div>
          <ul class="box-perks">
            <li>✓ Quản lý nguồn + Dây quang AudioQuest xịn</li>
            <li>✓ Tặng trọn bộ phụ kiện & pin sạc Micro</li>
            <li>✓ Thử dàn trực tiếp tại phòng khách ưng mới thanh toán</li>
          </ul>
          <button class="btn-primary full-width" @click="handleOrder29">
            Đăng Ký Thử Dàn Tại Nhà
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useCartStore } from '../../stores/cartStore'
import combosData from '../../data/combos.json'

const cartStore = useCartStore()

const handleOrder29 = () => {
  const combo29 = combosData.find(c => c.id === 'dan-karaoke-29tr')
  cartStore.openQuickOrder(combo29)
}
</script>

<style scoped>
.hero-section {
  padding: 60px 0;
  background: radial-gradient(circle at 80% 20%, rgba(40, 55, 252, 0.15), transparent 50%),
              radial-gradient(circle at 20% 80%, rgba(252, 183, 40, 0.08), transparent 40%);
  border-bottom: 1px solid var(--border-color);
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.3fr 0.9fr;
  gap: 40px;
  align-items: center;
}

.hero-badge {
  display: inline-block;
  background: rgba(252, 183, 40, 0.12);
  color: var(--color-primary);
  border: 1px solid rgba(252, 183, 40, 0.3);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 18px;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 900;
  line-height: 1.25;
  margin-bottom: 18px;
  color: #fff;
}

.highlight {
  color: var(--color-primary);
}

.hero-sub {
  font-size: 1.05rem;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 28px;
  max-width: 580px;
}

.hero-ctas {
  display: flex;
  gap: 16px;
  margin-bottom: 36px;
  flex-wrap: wrap;
}

.hero-stats {
  display: flex;
  gap: 36px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-num {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
}

.stat-label {
  font-size: 0.82rem;
  color: #64748b;
}

.featured-offer-box {
  background: var(--bg-card);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-lg);
  padding: 28px;
  box-shadow: var(--shadow-glow);
  position: relative;
}

.box-badge {
  position: absolute;
  top: -12px;
  left: 24px;
  background: var(--color-primary);
  color: #000;
  font-size: 0.75rem;
  font-weight: 900;
  padding: 4px 12px;
  border-radius: 4px;
}

.featured-offer-box h3 {
  font-size: 1.4rem;
  color: #fff;
  margin-bottom: 8px;
}

.box-tagline {
  font-size: 0.88rem;
  color: #94a3b8;
  line-height: 1.5;
  margin-bottom: 18px;
}

.box-pricing {
  margin-bottom: 18px;
  background: rgba(0, 0, 0, 0.3);
  padding: 12px 16px;
  border-radius: var(--radius-sm);
}

.price-val {
  font-size: 1.7rem;
  font-weight: 900;
  color: var(--color-primary);
}

.savings-val {
  font-size: 0.82rem;
  color: #22c55e;
  font-weight: 600;
}

.box-perks {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.86rem;
  color: #cbd5e1;
  margin-bottom: 22px;
}

.full-width {
  width: 100%;
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }
  .hero-title {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 32px 0;
  }

  .hero-title {
    font-size: clamp(1.7rem, 7vw, 2.2rem);
  }

  .hero-ctas {
    gap: 10px;
    margin-bottom: 24px;
  }

  .hero-ctas > * {
    flex: 1 1 100%;
    text-align: center;
  }

  .hero-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding-top: 18px;
  }

  .stat-num {
    font-size: 1.2rem;
  }

  .stat-label {
    font-size: 0.7rem;
    line-height: 1.35;
  }

  .featured-offer-box {
    padding: 24px 18px 18px;
  }
}
</style>
