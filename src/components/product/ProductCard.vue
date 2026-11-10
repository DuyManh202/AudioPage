<template>
  <div class="product-card">
    <div class="card-thumb">
      <img :src="product.image" :alt="product.name" loading="lazy" />
      <span v-if="product.badge" class="card-badge">{{ product.badge }}</span>
      <span v-if="product.videoUrl" class="video-indicator-badge">▶ Video Test</span>
      <span class="room-tag">{{ product.roomSize }}</span>
    </div>

    <div class="card-body">
      <h3 class="card-title">
        <router-link :to="`/san-pham/${product.id}`">{{ product.name }}</router-link>
      </h3>

      <div class="specs-mini">
        <span v-if="product.bassSize !== '-'" class="spec-pill">🔊 Bass: {{ product.bassSize }}</span>
        <span v-if="product.powerRMS > 0" class="spec-pill">⚡ RMS: {{ product.powerRMS }}W</span>
      </div>

      <p class="card-desc">{{ product.shortDesc }}</p>

      <div class="card-price-row">
        <div class="price-wrap">
          <span class="current-price">{{ formatCurrency(product.price) }}</span>
          <span v-if="product.originalPrice > product.price" class="old-price">
            {{ formatCurrency(product.originalPrice) }}
          </span>
        </div>
      </div>

      <div class="card-actions">
        <router-link :to="`/san-pham/${product.id}`" class="btn-detail">
          Chi Tiết
        </router-link>
        <button class="btn-add-cart" @click="handleAddToCart" title="Thêm vào giỏ hàng">
          🛒 Mua
        </button>
        <button class="btn-order" @click="handleOrder">
          Tư Vấn
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatCurrency } from '../../utils/formatters'
import { useCartStore } from '../../stores/cartStore'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const cartStore = useCartStore()

const handleOrder = () => {
  cartStore.openQuickOrder(props.product)
}

const handleAddToCart = () => {
  cartStore.addToCart(props.product, 1)
}
</script>

<style scoped>
.product-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-focus);
  box-shadow: var(--shadow-card);
}

.card-thumb {
  position: relative;
  width: 100%;
  height: 220px;
  background: #111422;
  overflow: hidden;
}

.card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.product-card:hover .card-thumb img {
  transform: scale(1.05);
}

.card-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--color-primary);
  color: #000;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.video-indicator-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(34, 197, 94, 0.9);
  color: #000;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 4px;
}

.room-tag {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(13, 15, 24, 0.85);
  color: #f1f5f9;
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 8px;
  line-height: 1.4;
  height: 42px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-title a {
  color: #fff;
  transition: color 0.2s;
}

.card-title a:hover {
  color: var(--color-primary);
}

.specs-mini {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.spec-pill {
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 8px;
  border-radius: 4px;
  color: #94a3b8;
}

.card-desc {
  font-size: 0.82rem;
  color: #94a3b8;
  line-height: 1.5;
  margin-bottom: 14px;
  height: 38px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-price-row {
  margin-top: auto;
  padding-bottom: 14px;
}

.price-wrap {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.current-price {
  font-size: 1.18rem;
  font-weight: 800;
  color: var(--color-primary);
}

.old-price {
  font-size: 0.85rem;
  color: #64748b;
  text-decoration: line-through;
}

.card-actions {
  display: grid;
  grid-template-columns: 1fr 0.9fr 1fr;
  gap: 8px;
}

.btn-detail {
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 8px 0;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: #cbd5e1;
  transition: all 0.2s;
}

.btn-detail:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-add-cart {
  background: var(--color-primary);
  color: #000;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 8px 0;
  border-radius: var(--radius-sm);
  transition: opacity 0.2s;
}

.btn-add-cart:hover {
  opacity: 0.9;
}

.btn-order {
  background: var(--color-secondary);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 8px 0;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
}

.btn-order:hover {
  background: var(--color-secondary-hover);
}
</style>
