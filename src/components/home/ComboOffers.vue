<template>
  <section class="combos-section" id="dan-karaoke">
    <div class="container">
      <div class="section-head text-center" v-reveal>
        <span class="badge-gold">ĐẦY ĐỦ THIẾT BỊ — KHÔNG PHÁT SINH</span>
        <h2 class="section-title">2 Gói Dàn Karaoke Trọn Bộ Át Chủ Bài</h2>
        <p class="section-desc">
          Được chính kỹ sư âm thanh Tú Audio tính toán công suất, ghép nối chuẩn pha, giải quyết triệt để vấn đề hú rít và hụt hơi của giọng hát.
        </p>
      </div>

      <div class="combos-grid">
        <div
          v-for="(combo, idx) in combos"
          :key="combo.id"
          v-reveal="idx * 100"
          :class="['combo-card', { featured: combo.isFeatured }]"
        >
          <div v-if="combo.badge" class="combo-badge-top">{{ combo.badge }}</div>

          <div class="combo-header">
            <h3 class="combo-title">{{ combo.name }}</h3>
            <p class="combo-tagline">{{ combo.tagline }}</p>
            <div class="suitable-room">
              <span aria-hidden="true">🏠</span>
              <span>Phù hợp không gian: <strong>{{ combo.roomSize }}</strong></span>
            </div>
          </div>

          <div class="combo-video-box" v-if="combo.videoUrl">
            <div class="video-label-bar">
              <span class="video-tag">
                <span class="eq-bars" aria-hidden="true">
                  <span></span><span></span><span></span><span></span>
                </span>
                VIDEO TEST THẬT
              </span>
              <span class="video-title-text">{{ combo.videoTitle || 'Video Hát Thử Thực Tế' }}</span>
            </div>
            <div class="combo-video-embed">
              <video
                v-if="isDirectVideo(combo.videoUrl)"
                :src="combo.videoUrl"
                controls
                preload="metadata"
                playsinline
              ></video>
              <iframe
                v-else
                :src="getEmbedVideoUrl(combo.videoUrl)"
                :title="combo.name"
                loading="lazy"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
          </div>

          <div class="combo-pricing-block">
            <div class="real-price">
              <span class="price-big">{{ formatCurrency(combo.price) }}</span>
              <span class="list-price">
                Tổng giá trị thật: {{ formatCurrency(combo.totalRealValue || combo.listPrice) }}
              </span>
            </div>
            <div class="fast-action-pill">
              ⚡ Chuyển khoản trong ngày tư vấn: Còn <strong>{{ formatCurrency(combo.fastActionPrice) }}</strong> (Giữ chỗ 20 ca lắp/tháng)
            </div>
            <div class="save-tag">
              ✓ Tiết kiệm thật: {{ formatCurrency(combo.savedAmount || Math.max(0, (combo.totalRealValue || combo.listPrice) - combo.price)) }}
              <span v-if="combo.totalRealValue && combo.listPrice" class="save-sub">
                (Thiết bị {{ formatCurrency(combo.listPrice) }} + Quà {{ formatCurrency(combo.totalRealValue - combo.listPrice) }})
              </span>
            </div>
          </div>

          <div class="combo-equipments">
            <h4>Cấu Hình Thiết Bị Gồm:</h4>
            <ul>
              <li v-for="(item, cIdx) in combo.components" :key="cIdx">
                <span class="check-icon">✓</span>
                <div>
                  <strong>{{ item.item }}</strong>
                  <span class="item-role">{{ item.role }}</span>
                </div>
              </li>
            </ul>
          </div>

          <div class="combo-gifts">
            <h4>🎁 Quà Tặng Đã Bao Gồm:</h4>
            <ul>
              <li v-for="(gift, gIdx) in combo.gifts" :key="gIdx">
                + {{ gift }}
              </li>
            </ul>
          </div>

          <div class="combo-footer">
            <button class="btn-primary full-width" @click="handleSelectCombo(combo)">
              Nhận Tư Vấn &amp; Thử Dàn Tận Nhà
            </button>
            <p class="commitment-text">Cam kết: Đến tận nhà thử không hay không lấy tiền</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useProductStore } from '../../stores/productStore'
import { useCartStore } from '../../stores/cartStore'
import { formatCurrency } from '../../utils/formatters'
import { getEmbedVideoUrl, isDirectVideo } from '../../utils/videoHelper'

const productStore = useProductStore()
const cartStore = useCartStore()

const combos = computed(() => productStore.combos)

const handleSelectCombo = (combo) => {
  cartStore.openQuickOrder(combo)
}
</script>

<style scoped>
.combos-section {
  padding: 76px 0;
  background: var(--bg-dark-900);
}

.text-center {
  text-align: center;
}

.section-head {
  max-width: 720px;
  margin: 0 auto 48px;
}

.section-title {
  font-size: clamp(1.65rem, 3vw, 2.25rem);
  font-weight: 900;
  color: #fff;
  margin: 12px 0 10px;
  letter-spacing: -0.01em;
}

.section-desc {
  color: var(--text-muted);
  font-size: 0.96rem;
  line-height: 1.65;
}

.combos-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
  align-items: stretch;
}

.combo-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: linear-gradient(180deg, rgba(25, 30, 48, 0.9) 0%, rgba(16, 20, 34, 0.95) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  padding: 32px 26px 26px;
  box-shadow: var(--shadow-card), var(--inner-highlight);
  transition: transform 0.32s var(--ease-spring), border-color 0.28s, box-shadow 0.32s;
}

.combo-card:hover {
  transform: translateY(-6px);
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow: var(--shadow-elevated);
}

.combo-card.featured {
  border: 1.5px solid rgba(252, 183, 40, 0.65);
  box-shadow: var(--shadow-elevated), 0 0 38px rgba(252, 183, 40, 0.14), var(--inner-highlight);
}

.combo-card.featured:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-elevated), 0 0 50px rgba(252, 183, 40, 0.24);
}

.combo-badge-top {
  position: absolute;
  top: -13px;
  left: 24px;
  max-width: calc(100% - 48px);
  background: var(--gradient-gold);
  color: #080a10;
  font-size: 0.74rem;
  font-weight: 900;
  padding: 5px 14px;
  border-radius: 999px;
  letter-spacing: 0.03em;
  box-shadow: 0 6px 18px rgba(252, 183, 40, 0.38);
}

.combo-header {
  margin-bottom: 18px;
}

.combo-title {
  font-size: 1.5rem;
  font-weight: 900;
  color: #fff;
  margin-bottom: 6px;
}

.combo-tagline {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.suitable-room {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.28);
  color: #bfdbfe;
  font-size: 0.8rem;
  padding: 5px 12px;
  border-radius: 999px;
}

.combo-video-box {
  background: #070910;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 20px;
}

.video-label-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.video-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ef4444;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}

.video-title-text {
  font-size: 0.78rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.combo-video-embed {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
}

.combo-video-embed iframe,
.combo-video-embed video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  object-fit: cover;
  background: #000;
}

.combo-pricing-block {
  background: rgba(0, 0, 0, 0.34);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 20px;
}

.real-price {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.price-big {
  font-family: var(--font-display);
  font-size: 1.85rem;
  font-weight: 700;
  color: var(--color-primary);
}

.list-price {
  font-size: 0.85rem;
  color: var(--text-subtle);
  text-decoration: line-through;
}

.fast-action-pill {
  background: linear-gradient(135deg, rgba(252, 183, 40, 0.18), rgba(245, 158, 11, 0.08));
  border: 1px dashed rgba(252, 183, 40, 0.45);
  color: #fde68a;
  font-size: 0.82rem;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
}

.fast-action-pill strong {
  color: var(--color-primary);
  font-weight: 900;
}

.save-tag {
  font-size: 0.8rem;
  color: #4ade80;
  font-weight: 700;
}

.save-sub {
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.75rem;
}

.combo-equipments {
  margin-bottom: 18px;
}

.combo-equipments h4,
.combo-gifts h4 {
  font-size: 0.9rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 10px;
}

.combo-equipments ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.combo-equipments li {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--text-secondary);
}

.check-icon {
  color: var(--color-primary);
  font-weight: 900;
  flex-shrink: 0;
}

.combo-equipments strong {
  color: #fff;
  display: block;
}

.item-role {
  display: block;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.combo-gifts {
  background: rgba(34, 197, 94, 0.06);
  border: 1px solid rgba(34, 197, 94, 0.22);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  margin-bottom: 22px;
}

.combo-gifts ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.82rem;
  color: #bbf7d0;
}

.combo-footer {
  margin-top: auto;
}

.full-width {
  width: 100%;
}

.commitment-text {
  text-align: center;
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 9px;
}

@media (max-width: 920px) {
  .combos-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .combos-section {
    padding: 46px 0;
  }

  .section-head {
    margin-bottom: 28px;
  }

  .combo-card {
    padding: 26px 16px 20px;
  }

  .combo-title {
    font-size: 1.32rem;
  }

  .price-big {
    font-size: 1.55rem;
  }
}
</style>
