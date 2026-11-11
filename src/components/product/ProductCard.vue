<template>
  <article class="product-card">
    <div class="card-thumb">
      <div class="thumb-stage-glow" aria-hidden="true"></div>
      <img :src="product.image" :alt="product.name" loading="lazy" />
      <span v-if="product.badge" class="card-badge">{{ product.badge }}</span>
      <span v-if="product.videoUrl" class="video-indicator-badge">
        <span class="play-pulse" aria-hidden="true">▶</span> Video Test
      </span>
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
        <button class="btn-add-cart" type="button" @click="handleAddToCart" title="Thêm vào giỏ hàng">
          🛒 Mua
        </button>
        <button class="btn-order" type="button" @click="handleOrder">
          Tư Vấn
        </button>
      </div>
    </div>
  </article>
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
  background: linear-gradient(180deg, rgba(25, 30, 48, 0.88) 0%, rgba(16, 20, 34, 0.96) 100%);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-card), var(--inner-highlight);
  transition: transform 0.3s var(--ease-spring), border-color 0.25s, box-shadow 0.3s;
}

.product-card:hover {
  transform: translateY(-6px);
  border-color: var(--border-focus);
  box-shadow: 0 22px 44px -12px rgba(0, 0, 0, 0.78), 0 0 26px rgba(252, 183, 40, 0.14);
}

.card-thumb {
  position: relative;
  width: 100%;
  height: 224px;
  background: #0d101b;
  overflow: hidden;
}

.thumb-stage-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 60%, rgba(40, 55, 252, 0.18), transparent 70%);
  pointer-events: none;
  z-index: 1;
}

.card-thumb img {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.45s var(--ease-spring);
}

.product-card:hover .card-thumb img {
  transform: scale(1.06);
}

.card-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  background: var(--gradient-gold);
  color: #080a10;
  font-size: 0.7rem;
  font-weight: 900;
  padding: 4px 10px;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(252, 183, 40, 0.35);
}

.video-indicator-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(8, 10, 18, 0.84);
  backdrop-filter: blur(8px);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.42);
  font-size: 0.68rem;
  font-weight: 800;
  padding: 4px 9px;
  border-radius: 999px;
}

.play-pulse {
  color: #ef4444;
  font-size: 0.65rem;
}

.room-tag {
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 2;
  background: rgba(8, 10, 18, 0.82);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 8px;
}

.card-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-title {
  font-size: 1.03rem;
  font-weight: 800;
  line-height: 1.38;
  margin-bottom: 10px;
  min-height: 2.75em;
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
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.spec-pill {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.09);
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
}

.card-desc {
  font-size: 0.83rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-price-row {
  margin-top: auto;
  margin-bottom: 14px;
}

.price-wrap {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px 10px;
}

.current-price {
  font-family: var(--font-display);
  font-size: 1.24rem;
  font-weight: 700;
  color: var(--color-primary);
}

.old-price {
  font-size: 0.82rem;
  color: var(--text-subtle);
  text-decoration: line-through;
}

.card-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.btn-detail,
.btn-add-cart,
.btn-order {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 800;
  transition: transform 0.24s var(--ease-spring), filter 0.22s, border-color 0.22s,
    background 0.22s, box-shadow 0.24s, color 0.22s;
}

.btn-add-cart::after,
.btn-order::after {
  content: '';
  position: absolute;
  top: -60%;
  left: -75%;
  width: 50%;
  height: 220%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
  transform: skewX(-22deg);
  transition: left 0.55s var(--ease-spring);
  pointer-events: none;
}

.btn-add-cart:hover::after,
.btn-order:hover::after {
  left: 130%;
}

.btn-detail {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #e2e8f0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.btn-detail:hover {
  border-color: rgba(252, 183, 40, 0.6);
  color: var(--color-primary);
  background: rgba(252, 183, 40, 0.09);
  transform: translateY(-2px);
}

.btn-add-cart {
  background: var(--gradient-gold);
  border: 1px solid rgba(255, 232, 163, 0.55);
  color: #080a10;
  box-shadow: 0 6px 16px -4px rgba(252, 183, 40, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.btn-add-cart:hover {
  filter: brightness(1.06);
  transform: translateY(-2px);
  box-shadow: 0 10px 22px -4px rgba(252, 183, 40, 0.62);
}

.btn-order {
  background: var(--gradient-blue);
  border: 1px solid rgba(147, 197, 253, 0.35);
  color: #fff;
  box-shadow: 0 6px 16px -4px rgba(40, 55, 252, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.btn-order:hover {
  filter: brightness(1.08);
  transform: translateY(-2px);
  box-shadow: 0 10px 22px -4px rgba(40, 55, 252, 0.64);
}

.btn-detail:active,
.btn-add-cart:active,
.btn-order:active {
  transform: scale(0.96);
}

@media (max-width: 768px) {
  .card-thumb {
    height: auto;
    aspect-ratio: 1.3;
  }

  .card-body {
    padding: 14px;
  }

  .card-title {
    min-height: 2.6em;
    font-size: 0.94rem;
  }

  .spec-pill {
    font-size: 0.68rem;
    padding: 2px 6px;
  }

  .card-desc {
    display: none;
  }

  .current-price {
    font-size: 1.06rem;
  }

  .btn-detail,
  .btn-add-cart,
  .btn-order {
    min-height: 38px;
    padding: 4px 2px;
    font-size: 0.72rem;
    white-space: nowrap;
  }
}

@media (max-width: 420px) {
  .card-thumb {
    aspect-ratio: 1.5;
  }

  .card-desc {
    display: -webkit-box;
  }
}
</style>
