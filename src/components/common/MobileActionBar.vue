<template>
  <nav class="mobile-action-bar" aria-label="Điều hướng nhanh trên điện thoại">
    <router-link to="/dan-karaoke" class="bar-btn">
      <span class="bar-icon" aria-hidden="true">🔥</span>
      <span class="bar-label">Gói Dàn</span>
    </router-link>

    <button type="button" class="bar-btn" @click="goCalculator">
      <span class="bar-icon" aria-hidden="true">📐</span>
      <span class="bar-label">Đo Phòng</span>
    </button>

    <button type="button" class="bar-btn" @click="cartStore.openCart">
      <span class="bar-icon-wrap">
        <svg class="bar-cart-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M3 4h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.9a1.5 1.5 0 0 0 1.4-1.1L21 7H6.2"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle cx="9.5" cy="19.5" r="1.4" fill="currentColor" />
          <circle cx="17.5" cy="19.5" r="1.4" fill="currentColor" />
        </svg>
        <span v-if="cartStore.totalItems > 0" class="bar-badge">{{ cartStore.totalItems }}</span>
      </span>
      <span class="bar-label">Giỏ Hàng</span>
    </button>

    <button type="button" class="bar-btn bar-btn-primary" @click="openConsult">
      <span class="bar-icon" aria-hidden="true">📞</span>
      <span class="bar-label">Tư Vấn</span>
    </button>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cartStore'

const router = useRouter()
const cartStore = useCartStore()

const goCalculator = () => {
  if (router.currentRoute.value.path !== '/') {
    router.push('/').then(() => {
      setTimeout(() => {
        document.getElementById('room-calculator')?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    })
  } else {
    document.getElementById('room-calculator')?.scrollIntoView({ behavior: 'smooth' })
  }
}

const openConsult = () => {
  cartStore.openQuickOrder({ name: 'Đăng Ký Tư Vấn Dàn Karaoke Tại Nhà' })
}
</script>

<style scoped>
.mobile-action-bar {
  display: none;
}

@media (max-width: 768px) {
  .mobile-action-bar {
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: max(10px, env(safe-area-inset-bottom));
    z-index: 95;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    padding: 6px;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid #CBD5E1;
    border-radius: 16px;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.16);
  }

  .bar-btn {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    min-height: 50px;
    padding: 5px 2px;
    border-radius: 12px;
    background: transparent;
    color: #334155;
    transition: background 0.22s var(--ease-smooth), color 0.22s var(--ease-smooth),
      transform 0.22s var(--ease-spring), box-shadow 0.22s;
  }

  .bar-btn.router-link-active {
    background: #EFF6FF;
    border: 1px solid #93C5FD;
    color: #1D4ED8;
  }

  .bar-btn:active {
    transform: scale(0.94);
  }

  .bar-btn-primary {
    background: var(--gradient-gold);
    color: #080a10;
    font-weight: 800;
    border: 1px solid rgba(255, 232, 163, 0.65);
    box-shadow:
      0 8px 20px rgba(252, 183, 40, 0.42),
      inset 0 1px 0 rgba(255, 255, 255, 0.55);
  }

  .bar-icon-wrap {
    position: relative;
    display: inline-flex;
  }

  .bar-icon {
    font-size: 1.05rem;
    line-height: 1;
  }

  .bar-cart-svg {
    width: 19px;
    height: 19px;
    display: block;
  }

  .bar-label {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }

  .bar-badge {
    position: absolute;
    top: -6px;
    right: -10px;
    min-width: 17px;
    height: 17px;
    padding: 0 4px;
    border-radius: 999px;
    background: #ef4444;
    color: #fff;
    font-size: 0.65rem;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.5);
  }
}
</style>
