<template>
  <article class="product-card">
    <!-- Hàng tag nhỏ phía trên ảnh (chuẩn bố cục TMĐT 2 cột) -->
    <div class="card-top-tags">
      <span v-if="product.inStock === false" class="status-tag out-stock-tag">
        ● Đặt trước
      </span>
      <span v-else class="status-tag">
        <span class="star-dot" aria-hidden="true">★</span> Bán chạy
      </span>
      <span v-if="product.roomSize" class="room-pill" :title="`Diện tích phù hợp: ${product.roomSize}`">
        ↕ {{ product.roomSize }}
      </span>
    </div>

    <!-- Ảnh sản phẩm vuông vức, bấm mở chi tiết -->
    <router-link :to="`/san-pham/${product.id}`" class="card-thumb" :aria-label="product.name">
      <div class="thumb-stage-glow" aria-hidden="true"></div>
      <img :src="product.image" :alt="product.name" loading="lazy" />
      <span v-if="product.videoUrl" class="video-indicator-badge">
        <span class="play-pulse" aria-hidden="true">▶</span> Video
      </span>
    </router-link>

    <div class="card-body">
      <!-- Nhãn ưu đãi nổi bật dưới ảnh -->
      <div class="promo-ribbon-row">
        <span class="promo-ribbon">
          <span class="bolt" aria-hidden="true">⚡</span>
          {{ promoText }}
        </span>
      </div>

      <!-- Tên sản phẩm giới hạn 2 dòng đồng đều chiều cao -->
      <h3 class="card-title">
        <router-link :to="`/san-pham/${product.id}`">{{ product.name }}</router-link>
      </h3>

      <!-- Thông số rút gọn trên màn hình lớn -->
      <div v-if="hasSpecs" class="specs-mini">
        <span v-if="product.bassSize && product.bassSize !== '-'" class="spec-pill">
          Bass {{ product.bassSize }}
        </span>
        <span v-if="product.powerRMS > 0" class="spec-pill">
          {{ product.powerRMS }}W RMS
        </span>
      </div>

      <!-- Khối giá bán + Giá niêm yết gạch ngang + % Giảm -->
      <div class="card-price-block">
        <div class="current-price">{{ formatCurrency(product.price) }}</div>
        <div v-if="discountPercent > 0" class="old-price-row">
          <span class="old-price">{{ formatCurrency(product.originalPrice) }}</span>
          <span class="discount-badge">-{{ discountPercent }}%</span>
        </div>
      </div>

      <!-- Dòng quà tặng đi kèm -->
      <p class="gift-line" :title="giftTooltip">
        <span class="gift-label">Quà tặng:</span>
        <strong class="gift-text">{{ primaryGift }}</strong>
      </p>

      <!-- Đánh giá & Số lượng đã lắp đặt thực tế -->
      <div class="social-meta-row">
        <span class="rating-chip">{{ displayRating }}/5 <span aria-hidden="true">★</span></span>
        <span class="meta-divider" aria-hidden="true">|</span>
        <span class="sold-count">Đã lắp: {{ displayReviewsCount }}</span>
      </div>

      <!-- Cụm nút thao tác gọn gàng vừa khít cột mobile -->
      <div class="card-actions">
        <button
          v-if="product.inStock !== false"
          class="btn-cart-icon"
          type="button"
          @click="handleAddToCart"
          title="Thêm vào giỏ hàng"
          aria-label="Thêm vào giỏ hàng"
        >
          🛒
        </button>
        <button class="btn-consult" type="button" @click="handleOrder">
          {{ product.inStock === false ? 'Đặt Trước Ngay' : 'Tư Vấn Ngay' }}
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { formatCurrency } from '../../utils/formatters'
import { useCartStore } from '../../stores/cartStore'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const cartStore = useCartStore()

const discountPercent = computed(() => {
  const price = Number(props.product.price || 0)
  const original = Number(props.product.originalPrice || 0)
  if (!original || original <= price || price <= 0) return 0
  return Math.round(((original - price) / original) * 100)
})

const promoText = computed(() => {
  if (props.product.badge && props.product.badge.trim() !== '') {
    return props.product.badge
  }
  return discountPercent.value >= 12 ? 'Giá Tốt Trong Ngày' : 'Ưu Đãi Chính Hãng'
})

const hasSpecs = computed(() => {
  return (props.product.bassSize && props.product.bassSize !== '-') || Number(props.product.powerRMS) > 0
})

const primaryGift = computed(() => {
  if (Array.isArray(props.product.gifts) && props.product.gifts.length > 0) {
    return props.product.gifts[0].replace(/^Tặng\s+/i, '')
  }
  return 'Dây phụ kiện & căn chỉnh tận nơi'
})

const giftTooltip = computed(() => {
  if (Array.isArray(props.product.gifts) && props.product.gifts.length > 0) {
    return props.product.gifts.join(' • ')
  }
  return primaryGift.value
})

const displayRating = computed(() => {
  const r = Number(props.product.rating)
  if (!r || Number.isNaN(r)) return '5'
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
})

const displayReviewsCount = computed(() => {
  const count = Number(props.product.reviewsCount)
  return count > 0 ? count : 24
})

const handleOrder = () => {
  cartStore.openQuickOrder(props.product)
}

const handleAddToCart = () => {
  cartStore.addToCart(props.product, 1)
}
</script>

<style scoped>
.product-card {
  background: linear-gradient(180deg, rgba(24, 30, 48, 0.95) 0%, rgba(14, 18, 31, 0.98) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 26px -10px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transition: transform 0.28s var(--ease-spring), border-color 0.24s, box-shadow 0.28s;
}

.product-card:hover {
  transform: translateY(-5px);
  border-color: rgba(252, 183, 40, 0.55);
  box-shadow: 0 20px 38px -12px rgba(0, 0, 0, 0.78), 0 0 24px rgba(252, 183, 40, 0.14);
}

/* Hàng nhãn mini trên đầu thẻ */
.card-top-tags {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 9px 12px 7px;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.72rem;
  font-weight: 800;
  color: #34d399;
  white-space: nowrap;
}

.star-dot {
  font-size: 0.72rem;
  color: #10b981;
}

.out-stock-tag {
  color: #fbbf24;
}

.room-pill {
  display: inline-flex;
  align-items: center;
  background: rgba(139, 92, 246, 0.16);
  border: 1px solid rgba(167, 139, 250, 0.32);
  color: #c4b5fd;
  font-size: 0.69rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 58%;
}

/* Khung ảnh sản phẩm */
.card-thumb {
  position: relative;
  display: block;
  margin: 0 10px;
  border-radius: 10px;
  aspect-ratio: 4 / 3;
  background: #0b0e18;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.thumb-stage-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 60%, rgba(40, 55, 252, 0.18), transparent 72%);
  pointer-events: none;
  z-index: 1;
}

.card-thumb img {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.42s var(--ease-spring);
}

.product-card:hover .card-thumb img {
  transform: scale(1.06);
}

.video-indicator-badge {
  position: absolute;
  bottom: 7px;
  right: 7px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(8, 10, 18, 0.84);
  backdrop-filter: blur(6px);
  color: #fecaca;
  border: 1px solid rgba(239, 68, 68, 0.45);
  font-size: 0.66rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 999px;
}

.play-pulse {
  color: #ef4444;
  font-size: 0.6rem;
}

/* Phần nội dung thẻ */
.card-body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.promo-ribbon-row {
  margin-bottom: 7px;
}

.promo-ribbon {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  background: linear-gradient(90deg, #dc2626 0%, #ea580c 52%, #1e3a8a 100%);
  color: #fff;
  font-size: 0.67rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 3px 10px rgba(220, 38, 38, 0.28);
}

.promo-ribbon .bolt {
  color: #fde047;
  font-size: 0.72rem;
}

.card-title {
  font-size: 0.96rem;
  font-weight: 800;
  line-height: 1.36;
  margin-bottom: 8px;
  min-height: 2.72em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-title a {
  color: #f8fafc;
  transition: color 0.2s;
}

.card-title a:hover {
  color: var(--color-primary);
}

.specs-mini {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 8px;
}

.spec-pill {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.09);
  color: var(--text-secondary);
  font-size: 0.69rem;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 5px;
  white-space: nowrap;
}

/* Giá bán + % giảm */
.card-price-block {
  margin-top: auto;
  margin-bottom: 7px;
}

.current-price {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1.2;
}

.old-price-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 3px;
}

.old-price {
  font-size: 0.78rem;
  color: var(--text-subtle);
  text-decoration: line-through;
}

.discount-badge {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 5px;
  line-height: 1.35;
}

/* Quà tặng */
.gift-line {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.35;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gift-label {
  color: var(--text-muted);
  margin-right: 4px;
}

.gift-text {
  color: #fca5a5;
  font-weight: 700;
}

/* Đánh giá & Đã lắp */
.social-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  padding-top: 7px;
  margin-bottom: 10px;
  border-top: 1px dashed rgba(255, 255, 255, 0.09);
  white-space: nowrap;
  overflow: hidden;
}

.rating-chip {
  color: #fbbf24;
  font-weight: 800;
}

.meta-divider {
  color: rgba(255, 255, 255, 0.2);
}

.sold-count {
  color: var(--text-secondary);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Nút hành động */
.card-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}

.btn-cart-icon {
  flex: 0 0 38px;
  height: 38px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  background: rgba(252, 183, 40, 0.12);
  border: 1px solid rgba(252, 183, 40, 0.38);
  color: var(--color-primary);
  transition: transform 0.22s var(--ease-spring), background 0.2s, border-color 0.2s;
}

.btn-cart-icon:hover {
  background: rgba(252, 183, 40, 0.24);
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.btn-consult {
  position: relative;
  overflow: hidden;
  flex: 1;
  min-width: 0;
  height: 38px;
  border-radius: 9px;
  padding: 0 10px;
  background: var(--gradient-gold);
  border: 1px solid rgba(255, 232, 163, 0.55);
  color: #080a10;
  font-size: 0.8rem;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: 0 6px 16px -5px rgba(252, 183, 40, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: transform 0.22s var(--ease-spring), filter 0.2s, box-shadow 0.22s;
}

.btn-consult:hover {
  filter: brightness(1.06);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(252, 183, 40, 0.62);
}

.btn-cart-icon:active,
.btn-consult:active {
  transform: scale(0.96);
}

/* Tối ưu chuyên biệt cho lưới 2 cột trên Mobile */
@media (max-width: 768px) {
  .product-card {
    border-radius: 12px;
  }

  .card-top-tags {
    padding: 7px 8px 6px;
    gap: 4px;
  }

  .status-tag {
    font-size: 0.66rem;
  }

  .room-pill {
    font-size: 0.63rem;
    padding: 1px 5px;
  }

  .card-thumb {
    margin: 0 7px;
    aspect-ratio: 1 / 1;
    border-radius: 8px;
  }

  .video-indicator-badge {
    bottom: 5px;
    right: 5px;
    font-size: 0.6rem;
    padding: 2px 6px;
  }

  .card-body {
    padding: 8px 8px 10px;
  }

  .promo-ribbon-row {
    margin-bottom: 5px;
  }

  .promo-ribbon {
    font-size: 0.6rem;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .card-title {
    font-size: 0.84rem;
    line-height: 1.34;
    min-height: 2.68em;
    margin-bottom: 6px;
  }

  .specs-mini {
    display: none;
  }

  .current-price {
    font-size: 1.02rem;
  }

  .old-price {
    font-size: 0.71rem;
  }

  .discount-badge {
    font-size: 0.63rem;
    padding: 1px 5px;
  }

  .gift-line {
    font-size: 0.69rem;
    margin-bottom: 6px;
  }

  .social-meta-row {
    font-size: 0.68rem;
    gap: 5px;
    padding-top: 6px;
    margin-bottom: 8px;
  }

  .card-actions {
    gap: 5px;
  }

  .btn-cart-icon {
    flex: 0 0 34px;
    height: 34px;
    border-radius: 8px;
    font-size: 0.86rem;
  }

  .btn-consult {
    height: 34px;
    border-radius: 8px;
    font-size: 0.74rem;
    padding: 0 6px;
  }
}

@media (max-width: 370px) {
  .current-price {
    font-size: 0.95rem;
  }

  .card-title {
    font-size: 0.8rem;
  }
}
</style>
