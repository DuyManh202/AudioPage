<template>
  <section class="combos-section" id="dan-karaoke">
    <div class="container">
      <div class="section-head text-center">
        <span class="badge-gold">ĐẦY ĐỦ THIẾT BỊ — KHÔNG PHÁT SINH</span>
        <h2 class="section-title">2 Gói Dàn Karaoke Trọn Bộ Át Chủ Bài</h2>
        <p class="section-desc">
          Được chính kỹ sư âm thanh Tú Audio tính toán công suất, ghép nối chuẩn pha, giải quyết triệt để vấn đề hú rít và hụt hơi của giọng hát.
        </p>
      </div>

      <div class="combos-grid">
        <div 
          v-for="combo in combos" 
          :key="combo.id" 
          :class="['combo-card', { 'featured': combo.isFeatured }]"
        >
          <div v-if="combo.badge" class="combo-badge-top">{{ combo.badge }}</div>

          <div class="combo-header">
            <h3 class="combo-title">{{ combo.name }}</h3>
            <p class="combo-tagline">{{ combo.tagline }}</p>
            <div class="suitable-room">🏠 Phù hợp không gian: <strong>{{ combo.roomSize }}</strong></div>
          </div>

          <!-- Video Mô Tả & Hát Thử Thực Tế Cho Từng Bên Gói Dàn -->
          <div class="combo-video-box" v-if="combo.videoUrl">
            <div class="video-label-bar">
              <span class="video-tag">🎬 VIDEO TEST THẬT</span>
              <span class="video-title-text">{{ combo.videoTitle || 'Video Hát Thử Thực Tế' }}</span>
            </div>
            <div class="combo-video-embed">
              <iframe 
                :src="getEmbedVideoUrl(combo.videoUrl)" 
                :title="combo.name"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
              ></iframe>
            </div>
          </div>

          <div class="combo-pricing-block">
            <div class="real-price">
              <span class="price-big">{{ formatCurrency(combo.price) }}</span>
              <span class="list-price">Giá gốc: {{ formatCurrency(combo.listPrice) }}</span>
            </div>
            <div class="fast-action-pill">
              ⚡ Chuyển khoản trong ngày tư vấn: Còn <strong>{{ formatCurrency(combo.fastActionPrice) }}</strong>
            </div>
            <div class="save-tag">Tiết kiệm thật: {{ formatCurrency(combo.savedAmount || (combo.listPrice - combo.price)) }}</div>
          </div>

          <div class="combo-equipments">
            <h4>Cấu Hình Thiết Bị Gồm:</h4>
            <ul>
              <li v-for="(item, idx) in combo.components" :key="idx">
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
              Nhận Tư Vấn & Thử Dàn Tận Nhà
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
import { getEmbedVideoUrl } from '../../utils/videoHelper'

const productStore = useProductStore()
const cartStore = useCartStore()

const combos = computed(() => productStore.combos)

const handleSelectCombo = (combo) => {
  cartStore.openQuickOrder(combo)
}
</script>

<style scoped>
.combos-section {
  padding: 70px 0;
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
  font-size: 2.1rem;
  font-weight: 900;
  color: #fff;
  margin: 12px 0 10px;
}

.section-desc {
  font-size: 0.95rem;
  color: #94a3b8;
  line-height: 1.6;
}

.combos-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.combo-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 36px 30px;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}

.combo-card.featured {
  border: 2px solid var(--color-primary);
  box-shadow: var(--shadow-glow);
}

.combo-badge-top {
  position: absolute;
  top: -14px;
  left: 28px;
  background: var(--color-primary);
  color: #000;
  font-size: 0.75rem;
  font-weight: 900;
  padding: 4px 14px;
  border-radius: 4px;
  text-transform: uppercase;
}

.combo-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 6px;
}

.combo-tagline {
  font-size: 0.88rem;
  color: #94a3b8;
  margin-bottom: 12px;
}

.suitable-room {
  font-size: 0.85rem;
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.05);
  padding: 6px 12px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 16px;
}

/* Khối Video Mô Tả */
.combo-video-box {
  background: rgba(13, 15, 24, 0.9);
  border: 1px solid rgba(40, 55, 252, 0.35);
  border-radius: var(--radius-md);
  padding: 12px;
  margin-bottom: 20px;
}

.video-label-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.video-tag {
  font-size: 0.72rem;
  font-weight: 800;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
}

.video-title-text {
  font-size: 0.82rem;
  font-weight: 700;
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.combo-video-embed {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: #000;
}

.combo-video-embed iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.combo-pricing-block {
  background: rgba(13, 15, 24, 0.7);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 24px;
}

.real-price {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
}

.price-big {
  font-size: 1.9rem;
  font-weight: 900;
  color: var(--color-primary);
}

.list-price {
  font-size: 0.9rem;
  color: #64748b;
  text-decoration: line-through;
}

.fast-action-pill {
  font-size: 0.82rem;
  color: #fbbf24;
  margin-bottom: 4px;
}

.save-tag {
  font-size: 0.82rem;
  color: #22c55e;
  font-weight: 700;
}

.combo-equipments h4, .combo-gifts h4 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
}

.combo-equipments ul, .combo-gifts ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.combo-equipments li {
  display: flex;
  gap: 10px;
  font-size: 0.88rem;
  color: #cbd5e1;
}

.check-icon {
  color: var(--color-primary);
  font-weight: 900;
}

.item-role {
  display: block;
  font-size: 0.78rem;
  color: #94a3b8;
}

.combo-gifts {
  background: rgba(40, 55, 252, 0.08);
  border: 1px dashed rgba(40, 55, 252, 0.3);
  padding: 16px;
  border-radius: var(--radius-sm);
  margin-bottom: 24px;
}

.combo-gifts li {
  font-size: 0.82rem;
  color: #93c5fd;
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
  color: #64748b;
  margin-top: 10px;
}

@media (max-width: 900px) {
  .combos-grid {
    grid-template-columns: 1fr;
  }
}
</style>
