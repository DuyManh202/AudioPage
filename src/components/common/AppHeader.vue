<template>
  <header class="app-header">
    <div class="top-announcement">
      <div class="container flex-between">
        <div class="ticker-text">
          <span class="live-dot" aria-hidden="true"></span>
          <span>Lắp đặt &amp; Cân chỉnh tận nhà miễn phí bán kính 300km quanh Hà Nội - Phú Thọ</span>
        </div>
        <div class="top-contact">
          <span>
            Hotline Kỹ Thuật:
            <a :href="CONTACT_INFO.phoneHref" class="hotline-link"><strong>{{ CONTACT_INFO.phone }}</strong></a>
            (Anh Tú)
          </span>
          <router-link to="/admin" class="admin-entry-link">⚙️ Quản Trị</router-link>
        </div>
      </div>
    </div>

    <div class="main-nav">
      <div class="container header-grid">
        <router-link to="/" class="brand-logo">
          <div class="logo-symbol">
            <span>TA</span>
          </div>
          <div class="logo-text">
            <span class="logo-title">TÚ AUDIO</span>
            <span class="logo-slogan">Âm Thanh Chuẩn Phòng Hát</span>
          </div>
        </router-link>

        <div class="search-box">
          <span class="search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Tìm loa full 30, sub 40, vang số K9, dàn 29 triệu..."
            @input="handleSearch"
          />
          <button class="search-btn" type="button" @click="handleSearch">Tìm Kiếm</button>
        </div>

        <div class="header-actions">
          <router-link to="/dan-karaoke" class="combo-link">
            <span aria-hidden="true">🔥</span> Dàn 19tr &amp; 29tr
          </router-link>
          <button
            class="cart-header-btn"
            type="button"
            @click="cartStore.openCart"
            title="Mở Giỏ Hàng"
            aria-label="Mở Giỏ Hàng"
          >
            <svg class="cart-svg" viewBox="0 0 24 24" aria-hidden="true">
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
            <span class="cart-text">Giỏ Hàng</span>
            <span v-if="cartStore.totalItems > 0" class="cart-badge">{{ cartStore.totalItems }}</span>
          </button>
          <button class="consult-btn" type="button" @click="openConsult">
            <span aria-hidden="true">📞</span> <span>Tư Vấn</span>
          </button>
          <button
            class="mobile-menu-toggle"
            type="button"
            :aria-expanded="mobileMenuOpen"
            aria-controls="mobile-site-nav"
            :aria-label="mobileMenuOpen ? 'Đóng menu' : 'Mở menu'"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <span :class="['hamburger-lines', { open: mobileMenuOpen }]" aria-hidden="true">
              <i></i><i></i><i></i>
            </span>
          </button>
        </div>
      </div>
    </div>

    <nav id="mobile-site-nav" :class="['sub-nav', { 'mobile-open': mobileMenuOpen }]">
      <div class="container nav-links">
        <router-link to="/" @click="closeMobileMenu">Trang Chủ</router-link>
        <router-link to="/dan-karaoke" @click="closeMobileMenu">Dàn Karaoke Trọn Bộ</router-link>
        <router-link to="/san-pham" @click="closeMobileMenu">Tất Cả Loa &amp; Thiết Bị</router-link>
        <a href="#room-calculator" @click.prevent="scrollToCalc">Gợi Ý Loa Theo Phòng</a>
        <router-link to="/thu-cu-doi-moi" @click="closeMobileMenu">Thu Cũ Đổi Mới</router-link>
        <a href="#nhan-ebook" @click.prevent="scrollToEbook">🎁 Nhận Ebook Free</a>
        <button class="mobile-consult-link" type="button" @click="openConsult">
          📞 Tư Vấn Thử Dàn Tại Nhà
        </button>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '../../stores/productStore'
import { useCartStore } from '../../stores/cartStore'
import { CONTACT_INFO } from '../../config/contact'

const router = useRouter()
const productStore = useProductStore()
const cartStore = useCartStore()
const searchQuery = ref('')
const mobileMenuOpen = ref(false)

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

watch(() => router.currentRoute.value.fullPath, closeMobileMenu)

const handleSearch = () => {
  productStore.setSearchQuery(searchQuery.value)
  if (router.currentRoute.value.path !== '/san-pham') {
    router.push('/san-pham')
  }
}

const openConsult = () => {
  closeMobileMenu()
  cartStore.openQuickOrder({ name: 'Đăng Ký Tư Vấn Dàn Karaoke Tại Nhà' })
}

const scrollToCalc = () => {
  closeMobileMenu()
  if (router.currentRoute.value.path !== '/') {
    router.push('/').then(() => {
      document.getElementById('room-calculator')?.scrollIntoView({ behavior: 'smooth' })
    })
  } else {
    document.getElementById('room-calculator')?.scrollIntoView({ behavior: 'smooth' })
  }
}

const scrollToEbook = () => {
  closeMobileMenu()
  if (router.currentRoute.value.path !== '/') {
    router.push('/').then(() => {
      document.getElementById('nhan-ebook')?.scrollIntoView({ behavior: 'smooth' })
    })
  } else {
    document.getElementById('nhan-ebook')?.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 6px 24px -10px rgba(15, 23, 42, 0.08);
}

.top-announcement {
  background: linear-gradient(90deg, #1E3A8A 0%, #1D4ED8 52%, #1E3A8A 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  color: #FFFFFF;
  font-size: 0.78rem;
  padding: 7px 0;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.ticker-text {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.ticker-text > span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 10px #22c55e;
  animation: beaconPulse 2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes beaconPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.45;
    transform: scale(0.82);
  }
}

.top-contact {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.top-contact strong {
  color: #FDE047;
}

.admin-entry-link {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #FFFFFF;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}

.admin-entry-link:hover {
  background: rgba(252, 183, 40, 0.25);
  border-color: #FDE047;
  color: #FEF08A;
}

.main-nav {
  padding: 13px 0;
}

.header-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  max-width: 100%;
  flex-shrink: 1;
}

.logo-symbol {
  position: relative;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  background: var(--gradient-gold);
  color: #080a10;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 22px rgba(252, 183, 40, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.45);
  transition: transform 0.3s var(--ease-spring);
}

.brand-logo:hover .logo-symbol {
  transform: rotate(-4deg) scale(1.04);
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  min-width: 0;
  overflow: hidden;
}

.logo-title {
  font-family: var(--font-display);
  font-size: 1.32rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #0F172A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logo-slogan {
  font-size: 0.7rem;
  font-weight: 700;
  color: #B45309;
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-box {
  flex: 1;
  max-width: 500px;
  display: flex;
  align-items: center;
  background: #F1F5F9;
  border: 1.5px solid #CBD5E1;
  border-radius: 999px;
  padding: 4px 4px 4px 14px;
  transition: border-color 0.25s var(--ease-smooth), box-shadow 0.25s var(--ease-smooth), background 0.2s;
}

.search-box:focus-within {
  background: #FFFFFF;
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
}

.search-icon {
  font-size: 0.88rem;
  opacity: 0.75;
  margin-right: 8px;
}

.search-box input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: #0F172A;
  font-size: 0.86rem;
  padding: 6px 4px;
}

.search-box input::placeholder {
  color: #64748B;
}

.search-btn {
  position: relative;
  overflow: hidden;
  background: var(--gradient-gold);
  color: #090b10;
  font-weight: 800;
  font-size: 0.78rem;
  padding: 8px 17px;
  border-radius: 999px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 232, 163, 0.55);
  box-shadow: 0 4px 14px rgba(252, 183, 40, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: transform 0.24s var(--ease-spring), filter 0.2s, box-shadow 0.24s;
}

.search-btn:hover {
  filter: brightness(1.06);
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 8px 20px rgba(252, 183, 40, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.search-btn:active {
  transform: scale(0.97);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.combo-link {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 15px;
  border-radius: 11px;
  background: linear-gradient(135deg, #FEF3C7, #FFEDD5);
  border: 1px solid #F59E0B;
  color: #9A3412;
  font-size: 0.83rem;
  font-weight: 800;
  transition: background 0.24s, border-color 0.24s, transform 0.24s var(--ease-spring), box-shadow 0.24s;
}

.combo-link:hover {
  background: linear-gradient(135deg, #FDE68A, #FED7AA);
  border-color: #EA580C;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px -6px rgba(234, 88, 12, 0.28);
}

.cart-header-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 14px;
  border-radius: 11px;
  background: #F8FAFC;
  border: 1px solid #CBD5E1;
  color: #0F172A;
  font-size: 0.83rem;
  font-weight: 700;
  transition: border-color 0.22s, background 0.22s, transform 0.22s var(--ease-spring);
}

.cart-svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.cart-header-btn:hover {
  border-color: #D97706;
  background: #FFFBEB;
  color: #92400E;
  transform: translateY(-2px);
}

.cart-badge {
  background: #ef4444;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 900;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(239, 68, 68, 0.45);
}

.consult-btn {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 17px;
  border-radius: 11px;
  background: var(--gradient-blue);
  border: 1px solid rgba(147, 197, 253, 0.35);
  color: #fff;
  font-size: 0.83rem;
  font-weight: 800;
  box-shadow: 0 8px 20px rgba(40, 55, 252, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.28);
  transition: transform 0.24s var(--ease-spring), box-shadow 0.24s, filter 0.24s;
}

.consult-btn::after {
  content: '';
  position: absolute;
  top: -60%;
  left: -75%;
  width: 48%;
  height: 220%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.32), transparent);
  transform: skewX(-24deg);
  transition: left 0.6s var(--ease-spring);
  pointer-events: none;
}

.consult-btn:hover::after {
  left: 130%;
}

.consult-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.08);
  box-shadow: 0 12px 26px rgba(40, 55, 252, 0.58);
}

.consult-btn:active,
.cart-header-btn:active,
.combo-link:active {
  transform: scale(0.96);
}

.mobile-menu-toggle,
.mobile-consult-link {
  display: none;
}

.sub-nav {
  background: #F8FAFC;
  border-top: 1px solid #E2E8F0;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 0 24px;
}

.nav-links a {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 12px 0;
  font-size: 0.86rem;
  font-weight: 700;
  color: #334155;
  transition: color 0.2s;
}

.nav-links a::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2.5px;
  border-radius: 2px;
  background: var(--gradient-blue);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.26s var(--ease-spring);
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #1D4ED8;
}

.nav-links a:hover::after,
.nav-links a.router-link-active::after {
  transform: scaleX(1);
}

@media (max-width: 1040px) {
  .combo-link {
    display: none;
  }

  .nav-links {
    gap: 18px;
  }
}

@media (max-width: 768px) {
  .top-announcement {
    font-size: 0.69rem;
    padding: 5px 0;
  }

  .top-contact {
    display: none;
  }

  .ticker-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .main-nav {
    padding: 10px 0 12px;
  }

  .header-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    row-gap: 10px;
    column-gap: 8px;
  }

  .brand-logo {
    gap: 9px;
  }

  .logo-symbol {
    width: 36px;
    height: 36px;
    font-size: 1rem;
    border-radius: 10px;
  }

  .logo-title {
    font-size: 1.02rem;
  }

  .logo-slogan {
    font-size: 0.6rem;
    white-space: nowrap;
  }

  .search-box {
    grid-column: 1 / -1;
    grid-row: 2;
    max-width: none;
    padding: 3px 3px 3px 12px;
  }

  .search-box input {
    font-size: 14px;
    padding: 6px 2px;
  }

  .search-btn {
    padding: 7px 13px;
    font-size: 0.76rem;
  }

  .header-actions {
    gap: 6px;
  }

  .cart-text {
    display: none;
  }

  .cart-header-btn,
  .consult-btn,
  .mobile-menu-toggle {
    min-width: 40px;
    min-height: 40px;
    padding: 6px 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.78rem;
    border-radius: 10px;
    white-space: nowrap;
  }

  .cart-header-btn,
  .mobile-menu-toggle {
    width: 40px;
    height: 40px;
    padding: 0;
  }

  .cart-header-btn .cart-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    font-size: 0.66rem;
    border: 2px solid #FFFFFF;
  }

  .mobile-menu-toggle {
    background: #F1F5F9;
    border: 1px solid #CBD5E1;
    color: #0F172A;
  }

  .hamburger-lines {
    width: 18px;
    height: 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .hamburger-lines i {
    display: block;
    width: 100%;
    height: 2px;
    border-radius: 2px;
    background: #0F172A;
    transition: transform 0.25s var(--ease-spring), opacity 0.2s;
  }

  .hamburger-lines.open i:nth-child(1) {
    transform: translateY(6px) rotate(45deg);
  }

  .hamburger-lines.open i:nth-child(2) {
    opacity: 0;
  }

  .hamburger-lines.open i:nth-child(3) {
    transform: translateY(-6px) rotate(-45deg);
  }

  .sub-nav {
    display: none;
    background: #FFFFFF;
    border-bottom: 1px solid var(--border-color);
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
  }

  .sub-nav.mobile-open {
    display: block;
    animation: slideDownNav 0.24s var(--ease-spring);
  }

  @keyframes slideDownNav {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .nav-links {
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    padding: 8px 16px 14px;
  }

  .nav-links a,
  .mobile-consult-link {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding: 8px 6px;
    border-bottom: 1px solid #EEF2F7;
    font-size: 0.92rem;
  }

  .nav-links a::after {
    display: none;
  }

  .mobile-consult-link {
    width: 100%;
    margin-top: 8px;
    border-bottom: none;
    border-radius: 10px;
    padding: 0 14px;
    justify-content: center;
    background: var(--gradient-gold);
    color: #080a10;
    font-weight: 800;
  }
}

@media (max-width: 420px) {
  .brand-logo {
    gap: 8px;
  }

  .logo-symbol {
    width: 34px;
    height: 34px;
    font-size: 0.94rem;
  }

  .logo-title {
    font-size: 0.96rem;
  }

  .logo-slogan {
    font-size: 0.54rem;
    letter-spacing: 0;
  }

  .cart-header-btn,
  .mobile-menu-toggle {
    width: 38px;
    height: 38px;
    min-width: 38px;
    min-height: 38px;
  }

  .consult-btn {
    min-height: 38px;
    padding: 0 9px;
    font-size: 0.74rem;
  }
}
</style>
