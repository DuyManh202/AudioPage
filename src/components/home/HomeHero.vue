<template>
  <section class="hero-section">
    <div class="hero-backdrop" aria-hidden="true">
      <div class="hero-orb hero-orb-blue"></div>
      <div class="hero-orb hero-orb-gold"></div>
      <div class="acoustic-grid"></div>
    </div>

    <div class="container hero-grid">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="eq-bars" aria-hidden="true">
            <span></span><span></span><span></span><span></span>
          </span>
          <span>🏆 Chuyên Gia Dàn Karaoke Chuẩn Phòng Hát</span>
        </div>

        <h1 class="hero-title">
          Hát Nhẹ - Sạch Tiếng -
          <span class="highlight">Tuyệt Đối Không Hú Rít</span>
        </h1>

        <p class="hero-sub">
          Chấm dứt nỗi ám ảnh chi hàng chục triệu mà hát vẫn nặng, tiếng bí và hú rít. Tú Audio trực tiếp đo đạc âm học, phối ghép đồng bộ và căn chỉnh tận nhà trong bán kính 300km.
        </p>

        <div class="hero-ctas">
          <router-link to="/dan-karaoke" class="btn-primary hero-cta-main">
            Xem Gói Dàn 19tr &amp; 29tr
            <span aria-hidden="true">→</span>
          </router-link>
          <a href="#room-calculator" class="btn-outline">
            📐 Đo Diện Tích &amp; Chọn Loa
          </a>
        </div>

        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-num">300km</span>
            <span class="stat-label">Phủ sóng lắp đặt tận nơi</span>
          </div>
          <div class="stat-divider" aria-hidden="true"></div>
          <div class="stat-item">
            <span class="stat-num">100%</span>
            <span class="stat-label">Trị dứt điểm hú rít</span>
          </div>
          <div class="stat-divider" aria-hidden="true"></div>
          <div class="stat-item">
            <span class="stat-num">24 Tháng</span>
            <span class="stat-label">Bảo hành chính hãng</span>
          </div>
        </div>
      </div>

      <div class="hero-card-side">
        <div class="featured-offer-box">
          <div class="box-glow-rim" aria-hidden="true"></div>
          <div class="box-badge">🔥 KHUYẾN NGHỊ SỐ 1</div>

          <div class="box-top-meta">
            <span class="meta-chip">Phòng {{ featuredCombo.roomSize }}</span>
            <span class="meta-wave">
              <span class="eq-bars" aria-hidden="true">
                <span></span><span></span><span></span><span></span>
              </span>
              DSP Đã Cân Chỉnh
            </span>
          </div>

          <h3>{{ shortComboTitle }}</h3>
          <p class="box-tagline">
            {{ comboSummaryLine }}
          </p>

          <div class="box-pricing">
            <div class="price-val">{{ formatCurrency(featuredCombo.price) }}</div>
            <div class="savings-val">
              ✓ Tiết kiệm thật {{ formatCurrency(featuredCombo.savedAmount || (featuredCombo.totalRealValue - featuredCombo.price)) }}
            </div>
            <div class="fast-bonus-line" v-if="featuredCombo.fastActionPrice">
              ⚡ CK trong ngày tư vấn còn <strong>{{ formatCurrency(featuredCombo.fastActionPrice) }}</strong> (Giới hạn 20 ca lắp/tháng)
            </div>
          </div>

          <ul class="box-perks">
            <li><span class="perk-check">✓</span> Quản lý nguồn + Dây quang AudioQuest chính hãng</li>
            <li><span class="perk-check">✓</span> Tặng trọn bộ phụ kiện &amp; pin sạc Micro</li>
            <li><span class="perk-check">✓</span> Lắp xong hát thử không hay hoàn 100% tiền, không mất đồng nào</li>
          </ul>

          <button class="btn-primary full-width" type="button" @click="handleOrder29">
            Đăng Ký Thử Dàn Tại Nhà
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useCartStore } from '../../stores/cartStore'
import { useProductStore } from '../../stores/productStore'
import { formatCurrency } from '../../utils/formatters'
import combosData from '../../data/combos.json'

const cartStore = useCartStore()
const productStore = useProductStore()

const featuredCombo = computed(() => {
  return (
    productStore.combos.find(c => c.id === 'dan-karaoke-29tr') ||
    productStore.combos.find(c => c.isFeatured) ||
    combosData[0]
  )
})

const shortComboTitle = computed(() => {
  const raw = featuredCombo.value?.name || 'Dàn Karaoke 29 Triệu'
  return raw.split('—')[0].trim()
})

const comboSummaryLine = computed(() => {
  const comps = featuredCombo.value?.components
  if (Array.isArray(comps) && comps.length > 0) {
    return comps.map(c => c.item).join(' + ')
  }
  return '1 Đôi Loa Full 30 + Đẩy 4 Kênh x800W + Vang PF K9 + Sub Hơi 40 + Mic CM 05'
})

const handleOrder29 = () => {
  cartStore.openQuickOrder(featuredCombo.value)
}
</script>

<style scoped>
.hero-section {
  position: relative;
  overflow: hidden;
  padding: 64px 0 72px;
  background: linear-gradient(180deg, #EBF3FF 0%, #F7FAFF 58%, #F4F7FB 100%);
  border-bottom: 1px solid #DCE4F0;
}

.hero-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(85px);
  opacity: 0.55;
}

.hero-orb-blue {
  top: -120px;
  right: 6%;
  width: 480px;
  height: 480px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.22), transparent 70%);
  animation: orbFloat 11s ease-in-out infinite alternate;
}

.hero-orb-gold {
  bottom: -140px;
  left: -4%;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.22), transparent 70%);
  animation: orbFloat 13s ease-in-out infinite alternate-reverse;
}

@keyframes orbFloat {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(26px, -22px, 0) scale(1.08);
  }
}

.acoustic-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(30, 58, 138, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30, 58, 138, 0.045) 1px, transparent 1px);
  background-size: 46px 46px;
  mask-image: radial-gradient(ellipse 85% 75% at 50% 45%, #000 35%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 85% 75% at 50% 45%, #000 35%, transparent 100%);
}

.hero-grid {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1.24fr) minmax(0, 0.94fr);
  gap: 48px;
  align-items: center;
}

.hero-content {
  animation: heroEnter 0.65s var(--ease-spring) both;
}

.hero-card-side {
  animation: heroEnter 0.78s var(--ease-spring) 0.1s both;
}

@keyframes heroEnter {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #FEF3C7;
  color: #92400E;
  border: 1px solid #F59E0B;
  padding: 7px 15px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 800;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.14);
}

.hero-title {
  font-size: clamp(2.15rem, 3.8vw, 3.05rem);
  font-weight: 900;
  line-height: 1.18;
  letter-spacing: -0.02em;
  margin-bottom: 18px;
  color: #0F172A;
}

.highlight {
  display: inline-block;
  background: linear-gradient(135deg, #1D4ED8 0%, #D97706 58%, #DC2626 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-sub {
  font-size: 1.04rem;
  color: #334155;
  line-height: 1.68;
  margin-bottom: 30px;
  max-width: 580px;
}

.hero-ctas {
  display: flex;
  gap: 14px;
  margin-bottom: 38px;
  flex-wrap: wrap;
}

.hero-cta-main {
  padding: 13px 26px;
  font-size: 0.96rem;
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 28px;
  background: #FFFFFF;
  border: 1px solid #DCE4F0;
  border-radius: var(--radius-md);
  padding: 16px 22px;
  box-shadow: 0 8px 24px -10px rgba(15, 23, 42, 0.08);
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-num {
  font-family: var(--font-display);
  font-size: 1.55rem;
  font-weight: 800;
  color: #1D4ED8;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.78rem;
  color: #64748B;
  margin-top: 2px;
  font-weight: 600;
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: #E2E8F0;
}

.featured-offer-box {
  position: relative;
  background: #FFFFFF;
  border: 2px solid #F59E0B;
  border-radius: var(--radius-xl);
  padding: 32px 28px 28px;
  box-shadow: 0 22px 50px -12px rgba(15, 23, 42, 0.14), 0 0 0 4px rgba(252, 183, 40, 0.12);
  transition: transform 0.35s var(--ease-spring), box-shadow 0.35s var(--ease-smooth);
}

.featured-offer-box:hover {
  transform: translateY(-4px);
  box-shadow: 0 28px 60px -12px rgba(15, 23, 42, 0.18), 0 0 0 6px rgba(252, 183, 40, 0.18);
}

.box-badge {
  position: absolute;
  top: -13px;
  left: 26px;
  background: linear-gradient(135deg, #DC2626, #EA580C);
  color: #FFFFFF;
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  padding: 5px 14px;
  border-radius: 999px;
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.32);
}

.box-top-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.meta-chip {
  font-size: 0.73rem;
  font-weight: 700;
  color: #1D4ED8;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  padding: 3px 10px;
  border-radius: 999px;
}

.meta-wave {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 800;
  color: #15803D;
}

.featured-offer-box h3 {
  font-size: 1.55rem;
  font-weight: 900;
  color: #0F172A;
  margin-bottom: 8px;
}

.box-tagline {
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.55;
  margin-bottom: 18px;
}

.box-pricing {
  margin-bottom: 18px;
  background: linear-gradient(135deg, #FFFBEB, #FEF3C7);
  border: 1px solid #FCD34D;
  padding: 14px 16px;
  border-radius: var(--radius-md);
}

.price-val {
  font-family: var(--font-display);
  font-size: 1.95rem;
  font-weight: 800;
  color: #DC2626;
  line-height: 1.15;
}

.savings-val {
  font-size: 0.82rem;
  color: #15803D;
  font-weight: 800;
  margin-top: 4px;
}

.fast-bonus-line {
  font-size: 0.78rem;
  color: #78350F;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed rgba(217, 119, 6, 0.35);
}

.fast-bonus-line strong {
  color: #B45309;
  font-weight: 900;
}

.box-perks {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 9px;
  font-size: 0.86rem;
  color: #334155;
  margin-bottom: 24px;
}

.box-perks li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.perk-check {
  color: #16A34A;
  font-weight: 900;
}

.full-width {
  width: 100%;
}

@media (max-width: 960px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 28px 0 42px;
  }

  .hero-badge {
    font-size: 0.72rem;
    padding: 5px 12px;
    margin-bottom: 14px;
  }

  .hero-title {
    font-size: clamp(1.7rem, 7vw, 2.2rem);
    margin-bottom: 12px;
  }

  .hero-sub {
    font-size: 0.92rem;
    margin-bottom: 22px;
  }

  .hero-ctas {
    gap: 10px;
    margin-bottom: 22px;
  }

  .hero-ctas > * {
    flex: 1 1 100%;
    text-align: center;
  }

  .hero-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    padding: 12px;
  }

  .stat-divider {
    display: none;
  }

  .stat-num {
    font-size: 1.15rem;
  }

  .stat-label {
    font-size: 0.68rem;
    line-height: 1.3;
  }

  .featured-offer-box {
    padding: 26px 18px 20px;
  }

  .price-val {
    font-size: 1.65rem;
  }
}
</style>
