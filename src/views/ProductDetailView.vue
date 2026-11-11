<template>
  <div class="product-detail-page">
    <div v-if="product" class="product-detail-view container">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <router-link to="/">Trang Chủ</router-link>
        <span aria-hidden="true">/</span>
        <router-link to="/san-pham">Sản Phẩm</router-link>
        <span aria-hidden="true">/</span>
        <span class="current">{{ product.name }}</span>
      </nav>

      <div class="detail-grid">
        <!-- Cột Trái: Ảnh Gallery & Nút Chuyển Xem Video Trực Tiếp -->
        <div class="detail-gallery">
          <div class="media-tabs">
            <button
              type="button"
              :class="['media-tab-btn', { active: activeMediaTab === 'image' }]"
              @click="activeMediaTab = 'image'"
            >
              🖼️ Ảnh Thực Tế Thiết Bị
            </button>
            <button
              type="button"
              :class="['media-tab-btn', { active: activeMediaTab === 'video' }]"
              @click="activeMediaTab = 'video'"
            >
              🎬 Video Mô Tả &amp; Test Âm
            </button>
          </div>

          <div v-if="activeMediaTab === 'image'" class="main-image-wrap">
            <img :src="product.image" :alt="product.name" />
            <span v-if="product.badge" class="badge-overlay">{{ product.badge }}</span>

            <button class="watch-video-btn-overlay" type="button" @click="activeMediaTab = 'video'">
              <span class="play-icon">▶</span>
              <span>Bấm Xem Video Test Âm Thực Tế</span>
            </button>
          </div>

          <div v-else class="main-video-wrap">
            <video
              v-if="isDirectVideo(currentVideoUrl)"
              :src="embedUrl"
              controls
              preload="metadata"
              playsinline
            ></video>
            <iframe
              v-else-if="embedUrl"
              :src="embedUrl"
              :title="currentVideoTitle"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        </div>

        <!-- Cột Phải: Thông Tin Mua Hàng -->
        <div class="detail-info">
          <span class="room-indicator">🏠 Không gian tối ưu: {{ product.roomSize }}</span>
          <h1 class="product-name">{{ product.name }}</h1>

          <div class="rating-strip">
            <span class="stars">⭐⭐⭐⭐⭐</span>
            <span class="score">{{ product.rating }} / 5.0</span>
            <span class="reviews-count">({{ product.reviewsCount }} đánh giá thực tế)</span>
          </div>

          <div class="pricing-card">
            <div class="price-row">
              <span class="sale-price">{{ formatCurrency(product.price) }}</span>
              <span v-if="product.originalPrice > product.price" class="original-price">
                {{ formatCurrency(product.originalPrice) }}
              </span>
            </div>
            <p class="saving-notice" v-if="product.originalPrice > product.price">
              ✓ Tiết kiệm: {{ formatCurrency(product.originalPrice - product.price) }} khi đặt hôm nay
            </p>
          </div>

          <p class="summary-desc">{{ product.shortDesc }}</p>

          <div class="gifts-box" v-if="product.gifts && product.gifts.length">
            <h4>🎁 Quà Tặng Độc Quyền Theo Thiết Bị:</h4>
            <ul>
              <li v-for="(g, idx) in product.gifts" :key="idx">
                <span class="check">✓</span> {{ g }}
              </li>
            </ul>
          </div>

          <div class="matching-box" v-if="product.matchingAmplifier && product.matchingAmplifier !== '-'">
            <div class="box-tag">Kỹ Thuật Phối Ghép Chuẩn</div>
            <p>⚡ <strong>Cục đẩy công suất khuyên dùng:</strong> {{ product.matchingAmplifier }}</p>
          </div>

          <div class="actions-row">
            <button class="btn-primary btn-large" type="button" @click="handleAddToCart">
              🛒 Thêm Vào Giỏ Hàng
            </button>
            <button class="btn-secondary btn-large" type="button" @click="handleConsult">
              📞 Đăng Ký Thử Tại Nhà
            </button>
            <router-link to="/thu-cu-doi-moi" class="btn-outline btn-trade">
              🔄 Đổi Loa Cũ Lấy Loa Này
            </router-link>
          </div>

          <div class="guarantees-grid">
            <div class="g-item">🛡️ Bảo hành 24 tháng</div>
            <div class="g-item">🚚 Ship tận nhà 300km</div>
            <div class="g-item">🎧 Thử âm học tại chỗ</div>
          </div>
        </div>
      </div>

      <!-- Khối Video Mô Tả & Test Chất Âm Thực Tế -->
      <div class="video-showcase-section" id="video-section">
        <div class="video-section-header">
          <span class="badge-gold">TRẢI NGHIỆM THỰC CHỨNG 100%</span>
          <h2>Video Mô Tả &amp; Hát Thử Chất Âm Thực Tế</h2>
          <p class="video-sub">{{ currentVideoTitle }}</p>
        </div>

        <div class="video-player-container">
          <div class="video-responsive-box">
            <video
              v-if="isDirectVideo(currentVideoUrl)"
              :src="embedUrl"
              controls
              preload="metadata"
              playsinline
            ></video>
            <iframe
              v-else-if="embedUrl"
              :src="embedUrl"
              :title="currentVideoTitle"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>

          <div class="video-side-notes">
            <h4>Điểm Nhấn Khi Nghe Video:</h4>
            <ul>
              <li><strong>Dải Treble:</strong> Họng kèn titanium sáng tiếng, tiếng thở và hơi ngân rõ nét.</li>
              <li><strong>Dải Trung (Vocal):</strong> Dày ấm, không bị mỏng tiếng hay nghẹt mũi như các dòng loa trôi nổi.</li>
              <li><strong>Khả năng chống hú:</strong> Kỹ sư cầm mic đứng sát mặt lưới loa không xuất hiện hiện tượng réo rít.</li>
              <li><strong>Dải Bass:</strong> Xuống sâu dứt khoát, lực đánh căng và không ù rền làm mệt tai.</li>
            </ul>

            <button class="btn-primary full-width" type="button" @click="handleConsult">
              Mang Loa Này Đến Nhà Cho Tôi Thử
            </button>
          </div>
        </div>
      </div>

      <!-- Bảng Thông Số Kỹ Thuật Chi Tiết -->
      <div class="specs-section">
        <h2 class="specs-title">Bảng Thông Số Kỹ Thuật Chuẩn Âm Học</h2>
        <div class="specs-table-wrap">
          <table class="specs-table">
            <tbody>
              <tr v-for="(val, key) in product.specs" :key="key">
                <td class="spec-label">{{ key }}</td>
                <td class="spec-value">{{ val }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="container not-found">
      <h2>Không tìm thấy thiết bị này</h2>
      <router-link to="/san-pham" class="btn-primary">Quay lại danh sách</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '../stores/productStore'
import { useCartStore } from '../stores/cartStore'
import { formatCurrency } from '../utils/formatters'
import { getEmbedVideoUrl, isDirectVideo } from '../utils/videoHelper'

const route = useRoute()
const productStore = useProductStore()
const cartStore = useCartStore()

const activeMediaTab = ref('image')

const product = computed(() => {
  return productStore.getProductById(route.params.id)
})

const currentVideoUrl = computed(() => {
  if (product.value?.videoUrl && product.value.videoUrl.trim() !== '') {
    return product.value.videoUrl
  }
  return 'https://www.youtube.com/watch?v=hK7F0a_2x-Q'
})

const currentVideoTitle = computed(() => {
  if (product.value?.videoTitle && product.value.videoTitle.trim() !== '') {
    return product.value.videoTitle
  }
  return `Video Test Chất Âm Thực Tế ${product.value?.name || 'Thiết Bị'} — Quay Mộc Tại Showroom & Nhà Khách`
})

const embedUrl = computed(() => {
  return getEmbedVideoUrl(currentVideoUrl.value)
})

const handleConsult = () => {
  cartStore.openQuickOrder(product.value)
}

const handleAddToCart = () => {
  cartStore.addToCart(product.value, 1)
}
</script>

<style scoped>
.product-detail-view {
  padding: 28px 24px 80px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.84rem;
  color: var(--text-subtle);
  margin-bottom: 24px;
}

.breadcrumb a {
  color: var(--text-muted);
  transition: color 0.2s;
}

.breadcrumb a:hover {
  color: var(--color-primary);
}

.breadcrumb .current {
  color: var(--text-secondary);
  font-weight: 600;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.25fr);
  gap: 38px;
  margin-bottom: 56px;
}

.media-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.media-tab-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  padding: 10px 12px;
  border-radius: var(--radius-md);
  font-size: 0.84rem;
  font-weight: 700;
  transition: all 0.2s;
}

.media-tab-btn.active {
  background: var(--gradient-gold);
  border-color: transparent;
  color: #080a10;
  font-weight: 800;
}

.main-image-wrap {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: radial-gradient(circle at 50% 50%, #1b223a, #0b0e18);
  aspect-ratio: 4 / 3;
  box-shadow: var(--shadow-card);
}

.main-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge-overlay {
  position: absolute;
  top: 14px;
  left: 14px;
  background: var(--gradient-gold);
  color: #080a10;
  font-size: 0.74rem;
  font-weight: 900;
  padding: 5px 12px;
  border-radius: 999px;
}

.watch-video-btn-overlay {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: rgba(10, 13, 24, 0.88);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(252, 183, 40, 0.55);
  color: #fff;
  font-size: 0.86rem;
  font-weight: 800;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  transition: background 0.22s, transform 0.24s var(--ease-spring), box-shadow 0.24s;
}

.watch-video-btn-overlay:hover {
  background: rgba(18, 23, 40, 0.96);
  transform: translateY(-3px);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.65), 0 0 22px rgba(252, 183, 40, 0.28);
}

.play-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f87171, #ef4444);
  color: #fff;
  font-size: 0.72rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25);
}

.main-video-wrap {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  aspect-ratio: 16 / 9;
  background: #070910;
}

.main-video-wrap iframe,
.main-video-wrap video,
.video-responsive-box iframe,
.video-responsive-box video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.room-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(59, 130, 246, 0.14);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #93c5fd;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 999px;
  margin-bottom: 12px;
}

.product-name {
  font-size: clamp(1.55rem, 2.8vw, 2.15rem);
  font-weight: 900;
  color: #fff;
  line-height: 1.25;
  margin-bottom: 10px;
}

.rating-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.86rem;
  margin-bottom: 18px;
}

.score {
  color: var(--color-primary);
  font-weight: 800;
}

.reviews-count {
  color: var(--text-muted);
}

.pricing-card {
  background: linear-gradient(135deg, rgba(252, 183, 40, 0.09), rgba(20, 25, 42, 0.9));
  border: 1px solid rgba(252, 183, 40, 0.3);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  margin-bottom: 18px;
}

.price-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 12px;
}

.sale-price {
  font-family: var(--font-display);
  font-size: 1.95rem;
  font-weight: 700;
  color: var(--color-primary);
}

.original-price {
  font-size: 1rem;
  color: var(--text-subtle);
  text-decoration: line-through;
}

.saving-notice {
  font-size: 0.83rem;
  color: #4ade80;
  font-weight: 700;
  margin-top: 6px;
}

.summary-desc {
  font-size: 0.94rem;
  color: var(--text-secondary);
  line-height: 1.65;
  margin-bottom: 18px;
}

.gifts-box {
  background: rgba(34, 197, 94, 0.06);
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  margin-bottom: 16px;
}

.gifts-box h4 {
  font-size: 0.9rem;
  color: #86efac;
  margin-bottom: 8px;
}

.gifts-box ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  color: #dcfce7;
}

.gifts-box .check {
  color: #4ade80;
  font-weight: 900;
  margin-right: 4px;
}

.matching-box {
  background: rgba(40, 55, 252, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.28);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  margin-bottom: 22px;
}

.box-tag {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #93c5fd;
  margin-bottom: 4px;
}

.matching-box p {
  font-size: 0.88rem;
  color: #e2e8f0;
}

.actions-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 18px;
}

.btn-trade {
  grid-column: 1 / -1;
}

.btn-large {
  min-height: 46px;
}

.guarantees-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.g-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-sm);
  padding: 10px;
  text-align: center;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.video-showcase-section {
  background: linear-gradient(180deg, rgba(22, 27, 45, 0.9), rgba(14, 18, 30, 0.96));
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--radius-xl);
  padding: 36px;
  margin-bottom: 48px;
  box-shadow: var(--shadow-card);
}

.video-section-header {
  text-align: center;
  margin-bottom: 28px;
}

.video-section-header h2 {
  font-size: clamp(1.4rem, 2.6vw, 1.9rem);
  font-weight: 900;
  color: #fff;
  margin: 12px 0 6px;
}

.video-sub {
  font-size: 0.92rem;
  color: var(--text-muted);
}

.video-player-container {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 28px;
  align-items: center;
}

.video-responsive-box {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #070910;
}

.video-responsive-box iframe {
  width: 100%;
  height: 100%;
}

.video-side-notes h4 {
  font-size: 1.05rem;
  color: #fff;
  margin-bottom: 12px;
}

.video-side-notes ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.video-side-notes strong {
  color: var(--color-primary);
}

.full-width {
  width: 100%;
}

.specs-section {
  background: rgba(20, 24, 40, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--radius-xl);
  padding: 32px;
}

.specs-title {
  font-size: 1.45rem;
  font-weight: 900;
  color: #fff;
  margin-bottom: 20px;
}

.specs-table {
  width: 100%;
  border-collapse: collapse;
}

.specs-table tr {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.specs-table tr:nth-child(odd) {
  background: rgba(255, 255, 255, 0.02);
}

.specs-table td {
  padding: 13px 16px;
  font-size: 0.9rem;
}

.spec-label {
  width: 36%;
  color: var(--text-muted);
  font-weight: 700;
}

.spec-value {
  color: #fff;
  font-weight: 600;
}

.not-found {
  text-align: center;
  padding: 80px 20px;
}

.not-found h2 {
  margin-bottom: 18px;
}

@media (max-width: 960px) {
  .detail-grid,
  .video-player-container {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .product-detail-view {
    padding: 20px 16px 48px;
  }

  .actions-row {
    grid-template-columns: 1fr;
  }

  .guarantees-grid {
    grid-template-columns: 1fr;
  }

  .video-showcase-section,
  .specs-section {
    padding: 22px 16px;
  }

  .spec-label {
    width: 44%;
  }
}
</style>
