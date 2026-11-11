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
  color: #1d4ed8;
}

.breadcrumb .current {
  color: #0f172a;
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
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  font-size: 0.84rem;
  font-weight: 700;
  transition: all 0.2s;
}

.media-tab-btn:hover {
  border-color: #93c5fd;
  color: #1d4ed8;
}

.media-tab-btn.active {
  background: var(--gradient-gold);
  border-color: #f59e0b;
  color: #080a10;
  font-weight: 800;
}

.main-image-wrap {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid #dce4f0;
  background: #ffffff;
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
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(252, 211, 77, 0.65);
  color: #fff;
  font-size: 0.86rem;
  font-weight: 800;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.35);
  transition: background 0.22s, transform 0.24s var(--ease-spring), box-shadow 0.24s;
}

.watch-video-btn-overlay:hover {
  background: rgba(15, 23, 42, 0.96);
  transform: translateY(-3px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.45);
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
  border: 1px solid #dce4f0;
  aspect-ratio: 16 / 9;
  background: #0f172a;
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
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 999px;
  margin-bottom: 12px;
}

.product-name {
  font-size: clamp(1.55rem, 2.8vw, 2.15rem);
  font-weight: 900;
  color: #0f172a;
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
  color: #d97706;
  font-weight: 800;
}

.reviews-count {
  color: var(--text-muted);
}

.pricing-card {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #fcd34d;
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
  color: #dc2626;
}

.original-price {
  font-size: 1rem;
  color: #64748b;
  text-decoration: line-through;
}

.saving-notice {
  font-size: 0.83rem;
  color: #15803d;
  font-weight: 700;
  margin-top: 6px;
}

.summary-desc {
  font-size: 0.94rem;
  color: #334155;
  line-height: 1.65;
  margin-bottom: 18px;
}

.gifts-box {
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: var(--radius-md);
  padding: 14px 16px;
  margin-bottom: 16px;
}

.gifts-box h4 {
  font-size: 0.9rem;
  color: #15803d;
  margin-bottom: 8px;
}

.gifts-box ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  color: #166534;
}

.gifts-box .check {
  color: #16a34a;
  font-weight: 900;
  margin-right: 4px;
}

.matching-box {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-md);
  padding: 14px 16px;
  margin-bottom: 22px;
}

.box-tag {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #1d4ed8;
  margin-bottom: 4px;
}

.matching-box p {
  font-size: 0.88rem;
  color: #1e293b;
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
  background: #ffffff;
  border: 1px solid #dce4f0;
  border-radius: var(--radius-sm);
  padding: 10px;
  text-align: center;
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
}

.video-showcase-section {
  background: #ffffff;
  border: 1px solid #dce4f0;
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
  color: #0f172a;
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
  border: 1px solid #dce4f0;
  background: #0f172a;
}

.video-responsive-box iframe {
  width: 100%;
  height: 100%;
}

.video-side-notes h4 {
  font-size: 1.05rem;
  color: #0f172a;
  margin-bottom: 12px;
}

.video-side-notes ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  font-size: 0.88rem;
  color: #334155;
  line-height: 1.5;
}

.video-side-notes strong {
  color: #b45309;
}

.full-width {
  width: 100%;
}

.specs-section {
  background: #ffffff;
  border: 1px solid #dce4f0;
  border-radius: var(--radius-xl);
  padding: 32px;
  box-shadow: var(--shadow-card);
}

.specs-title {
  font-size: 1.45rem;
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 20px;
}

.specs-table {
  width: 100%;
  border-collapse: collapse;
}

.specs-table tr {
  border-bottom: 1px solid #eef2f7;
}

.specs-table tr:nth-child(odd) {
  background: #f8fafc;
}

.specs-table td {
  padding: 13px 16px;
  font-size: 0.9rem;
}

.spec-label {
  width: 36%;
  color: #475569;
  font-weight: 700;
}

.spec-value {
  color: #0f172a;
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
