<template>
  <div v-if="product" class="product-detail-view container">
    <div class="breadcrumb">
      <router-link to="/">Trang Chủ</router-link> &gt; 
      <router-link to="/san-pham">Sản Phẩm</router-link> &gt; 
      <span>{{ product.name }}</span>
    </div>

    <div class="detail-grid">
      <!-- Cột Trái: Ảnh Gallery & Nút Chuyển Xem Video Trực Tiếp -->
      <div class="detail-gallery">
        <div class="media-tabs">
          <button 
            :class="['media-tab-btn', { active: activeMediaTab === 'image' }]"
            @click="activeMediaTab = 'image'"
          >
            🖼️ Hình Ảnh Thiết Bị
          </button>
          <button 
            :class="['media-tab-btn', { active: activeMediaTab === 'video' }]"
            @click="activeMediaTab = 'video'"
          >
            🎬 Video Mô Tả & Test Âm
          </button>
        </div>

        <!-- Khung hiển thị Ảnh -->
        <div v-if="activeMediaTab === 'image'" class="main-image-wrap">
          <img :src="product.image" :alt="product.name" />
          <span v-if="product.badge" class="badge-overlay">{{ product.badge }}</span>

          <!-- Nút kích hoạt nhanh xem video trực tiếp trên ảnh -->
          <button class="watch-video-btn-overlay" @click="activeMediaTab = 'video'">
            <span class="play-icon">▶</span>
            <span>Bấm Xem Video Test Âm Thực Tế</span>
          </button>
        </div>

        <!-- Khung hiển thị Video nếu chọn tab Video -->
        <div v-else class="main-video-wrap">
          <iframe 
            v-if="embedUrl"
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
            Tiết kiệm: {{ formatCurrency(product.originalPrice - product.price) }} khi đặt hôm nay
          </p>
        </div>

        <p class="summary-desc">{{ product.shortDesc }}</p>

        <!-- Quà Tặng Đi Kèm -->
        <div class="gifts-box" v-if="product.gifts && product.gifts.length">
          <h4>🎁 Quà Tặng Độc Quyền Theo Thiết Bị:</h4>
          <ul>
            <li v-for="(g, idx) in product.gifts" :key="idx">
              ✓ {{ g }}
            </li>
          </ul>
        </div>

        <!-- Khuyến Nghị Cục Đẩy Phối Ghép -->
        <div class="matching-box" v-if="product.matchingAmplifier && product.matchingAmplifier !== '-'">
          <div class="box-tag">Kỹ Thuật Phối Ghép Chuẩn</div>
          <p>⚡ <strong>Cục đẩy công suất khuyên dùng:</strong> {{ product.matchingAmplifier }}</p>
        </div>

        <!-- Các Nút Hành Động -->
        <div class="actions-row">
          <button class="btn-primary btn-large" @click="handleAddToCart">
            🛒 Thêm Vào Giỏ Hàng
          </button>
          <button class="btn-secondary btn-large" @click="handleConsult">
            📞 Đăng Ký Thử Tại Nhà
          </button>
          <router-link to="/thu-cu-doi-moi" class="btn-outline">
            🔄 Đổi Loa Cũ Lấy Loa Này
          </router-link>
        </div>

        <div class="guarantees-grid">
          <div class="g-item">🛡️ Bảo hành 24 tháng</div>
          <div class="g-item">🚚 Ship tận nhà trong 300km</div>
          <div class="g-item">🎧 Thử âm học tại chỗ</div>
        </div>
      </div>
    </div>

    <!-- Khối Video Mô Tả & Test Chất Âm Thực Tế Toàn Diện (Luôn hiển thị) -->
    <div class="video-showcase-section" id="video-section">
      <div class="video-section-header">
        <span class="badge-gold">TRẢI NGHIỆM THỰC CHỨNG 100%</span>
        <h2>Video Mô Tả & Hát Thử Chất Âm Thực Tế</h2>
        <p class="video-sub">
          {{ currentVideoTitle }}
        </p>
      </div>

      <div class="video-player-container">
        <div class="video-responsive-box">
          <iframe 
            v-if="embedUrl"
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

          <button class="btn-primary full-width" @click="handleConsult">
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
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '../stores/productStore'
import { useCartStore } from '../stores/cartStore'
import { formatCurrency } from '../utils/formatters'
import { getEmbedVideoUrl } from '../utils/videoHelper'

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
  // Video mặc định nếu sản phẩm chưa gán link riêng
  return 'https://www.youtube.com/watch?v=kJQP7kiw5Fk'
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
  padding: 30px 20px 80px;
}

.breadcrumb {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 24px;
}

.breadcrumb a {
  color: #94a3b8;
}

.breadcrumb a:hover {
  color: var(--color-primary);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1.1fr 1.3fr;
  gap: 40px;
  margin-bottom: 50px;
}

.media-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.media-tab-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: #94a3b8;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 700;
  transition: all 0.2s;
  cursor: pointer;
}

.media-tab-btn:hover {
  color: #fff;
  border-color: var(--color-primary);
}

.media-tab-btn.active {
  background: var(--color-primary);
  color: #000;
  border-color: var(--color-primary);
}

.main-image-wrap {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  height: 420px;
}

.main-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.watch-video-btn-overlay {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(13, 15, 24, 0.9);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  padding: 8px 18px;
  border-radius: 30px;
  font-size: 0.82rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
  white-space: nowrap;
}

.watch-video-btn-overlay:hover {
  background: var(--color-primary);
  color: #000;
  transform: translateX(-50%) scale(1.04);
}

.play-icon {
  width: 22px;
  height: 22px;
  background: var(--color-primary);
  color: #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 900;
}

.watch-video-btn-overlay:hover .play-icon {
  background: #000;
  color: var(--color-primary);
}

.main-video-wrap {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: #000;
  height: 420px;
}

.main-video-wrap iframe {
  width: 100%;
  height: 100%;
}

.badge-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  background: var(--color-primary);
  color: #000;
  font-weight: 800;
  font-size: 0.8rem;
  padding: 4px 12px;
  border-radius: 4px;
}

.room-indicator {
  display: inline-block;
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
  font-size: 0.82rem;
  padding: 4px 12px;
  border-radius: 4px;
  margin-bottom: 12px;
}

.product-name {
  font-size: 1.8rem;
  font-weight: 900;
  color: #fff;
  line-height: 1.3;
  margin-bottom: 10px;
}

.rating-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  margin-bottom: 20px;
}

.score {
  color: #f1f5f9;
  font-weight: 700;
}

.reviews-count {
  color: #64748b;
}

.pricing-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 18px 20px;
  margin-bottom: 20px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
}

.sale-price {
  font-size: 1.8rem;
  font-weight: 900;
  color: var(--color-primary);
}

.original-price {
  font-size: 1rem;
  color: #64748b;
  text-decoration: line-through;
}

.saving-notice {
  font-size: 0.82rem;
  color: #22c55e;
  font-weight: 600;
  margin-top: 4px;
}

.summary-desc {
  font-size: 0.95rem;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 24px;
}

.gifts-box {
  background: rgba(40, 55, 252, 0.08);
  border: 1px dashed rgba(40, 55, 252, 0.35);
  padding: 16px 20px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.gifts-box h4 {
  font-size: 0.92rem;
  color: #fff;
  margin-bottom: 10px;
}

.gifts-box ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.matching-box {
  background: rgba(252, 183, 40, 0.08);
  border-left: 3px solid var(--color-primary);
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 24px;
}

.box-tag {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.matching-box p {
  font-size: 0.88rem;
  color: #f1f5f9;
}

.actions-row {
  display: flex;
  gap: 14px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.btn-large {
  flex: 1;
  padding: 14px 24px;
  font-size: 0.95rem;
}

.guarantees-grid {
  display: flex;
  gap: 16px;
  font-size: 0.82rem;
  color: #94a3b8;
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
}

/* Khối Video Showcase toàn diện */
.video-showcase-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 36px;
  margin-bottom: 50px;
}

.video-section-header {
  margin-bottom: 24px;
}

.video-section-header h2 {
  font-size: 1.6rem;
  color: #fff;
  margin: 8px 0 4px;
}

.video-sub {
  font-size: 0.9rem;
  color: #94a3b8;
}

.video-player-container {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 30px;
  align-items: center;
}

.video-responsive-box {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: #000;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.video-responsive-box iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.video-side-notes {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.video-side-notes h4 {
  font-size: 1.05rem;
  color: var(--color-primary);
}

.video-side-notes ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 0.88rem;
  color: #cbd5e1;
}

.video-side-notes li strong {
  color: #fff;
}

.full-width {
  width: 100%;
}

/* Bảng Thông Số */
.specs-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 36px;
}

.specs-title {
  font-size: 1.35rem;
  color: #fff;
  margin-bottom: 20px;
}

.specs-table {
  width: 100%;
  border-collapse: collapse;
}

.specs-table tr {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.specs-table td {
  padding: 12px 16px;
  font-size: 0.9rem;
}

.spec-label {
  color: #94a3b8;
  width: 35%;
  font-weight: 600;
}

.spec-value {
  color: #f1f5f9;
}

.not-found {
  padding: 80px 20px;
  text-align: center;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .video-player-container {
    grid-template-columns: 1fr;
  }
}
</style>
