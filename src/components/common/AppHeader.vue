<template>
  <header class="app-header">
    <div :class="['top-announcement', { [`festive-${festiveStore.effectiveTheme}`]: festiveStore.isFestiveActive }]">
      <div class="container flex-between">
        <div class="ticker-text">
          <span class="live-dot" aria-hidden="true"></span>
          <div class="ticker-marquee-box">
            <div class="marquee-group">
              <span class="marquee-item">{{ festiveStore.tickerMessage }}</span>
              <span class="marquee-spacer" aria-hidden="true">✦</span>
              <span class="marquee-item">{{ festiveStore.tickerMessage }}</span>
              <span class="marquee-spacer" aria-hidden="true">✦</span>
            </div>
            <div class="marquee-group" aria-hidden="true">
              <span class="marquee-item">{{ festiveStore.tickerMessage }}</span>
              <span class="marquee-spacer" aria-hidden="true">✦</span>
              <span class="marquee-item">{{ festiveStore.tickerMessage }}</span>
              <span class="marquee-spacer" aria-hidden="true">✦</span>
            </div>
          </div>
        </div>
        <div class="top-contact">
          <span>
            Hotline Kỹ Thuật:
            <a :href="CONTACT_INFO.phoneHref" class="hotline-link"><strong>{{ CONTACT_INFO.phone }}</strong></a>
            (Anh Tú)
          </span>
        </div>
      </div>
    </div>

    <div class="main-nav">
      <div class="container header-grid">
        <router-link to="/" class="brand-logo" title="Tú Audio — Âm Thanh Chuẩn Phòng Hát">
          <BrandLogo theme="light" :height="42" />
        </router-link>

        <div class="search-wrapper">
          <!-- Backdrop đóng dropdown khi nhấn ra ngoài -->
          <div v-if="isSearchOpen" class="search-backdrop" @click="closeSearchDropdown"></div>

          <div class="search-box" :class="{ 'is-active': isSearchOpen }">
            <span class="search-icon" aria-hidden="true" @click="executeSearch" title="Tìm kiếm">
              <svg class="search-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke-linecap="round" />
              </svg>
            </span>
            <input
              ref="searchInputRef"
              type="text"
              v-model="searchQuery"
              placeholder="Bạn tìm gì hôm nay? (Loa, vang số, đẩy...)"
              @focus="openSearchDropdown"
              @keydown.enter="executeSearch"
              @keydown.esc="closeSearchDropdown"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="search-clear-btn"
              @click="clearSearch"
              title="Xóa tìm kiếm"
              aria-label="Xóa tìm kiếm"
            >
              ✕
            </button>
            <button class="search-btn" type="button" @click="executeSearch" aria-label="Tìm kiếm">
              <svg class="search-btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke-linecap="round" />
              </svg>
              <span class="search-btn-text">Tìm Kiếm</span>
            </button>
          </div>

          <!-- Dropdown Gợi Ý Tìm Kiếm Thông Minh (Smart Search Autocomplete) -->
          <div v-if="isSearchOpen" class="search-dropdown-menu">
            <!-- 1. Trạng thái mặc định: Chưa nhập -> Hiện lịch sử & xu hướng -->
            <div v-if="!searchQuery.trim()" class="dropdown-pane">
              <!-- Lịch sử tìm kiếm -->
              <div v-if="searchHistory.length > 0" class="dropdown-group">
                <div class="group-header">
                  <span class="group-title">🕒 Lịch sử tìm kiếm</span>
                  <button type="button" class="btn-clear-all" @click="clearHistory">Xóa tất cả</button>
                </div>
                <div class="history-chips">
                  <span
                    v-for="kw in searchHistory"
                    :key="kw"
                    class="chip-history"
                    @mousedown.prevent="applyKeyword(kw)"
                  >
                    <span>{{ kw }}</span>
                    <button type="button" class="btn-del-chip" @click.stop="removeHistoryItem(kw)">✕</button>
                  </span>
                </div>
              </div>

              <!-- Gợi ý xu hướng tìm kiếm -->
              <div class="dropdown-group">
                <div class="group-header">
                  <span class="group-title">🔥 Xu hướng tìm kiếm hàng đầu</span>
                </div>
                <div class="trending-grid">
                  <button
                    v-for="item in trendingKeywords"
                    :key="item.text"
                    type="button"
                    class="trending-item"
                    @mousedown.prevent="applyKeyword(item.text)"
                  >
                    <span class="trend-badge">{{ item.badge }}</span>
                    <span class="trend-text">{{ item.text }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 2. Trạng thái đang gõ từ khóa: Hiện kết quả sản phẩm trực tiếp -->
            <div v-else class="dropdown-pane">
              <div v-if="matchingProducts.length > 0" class="results-group">
                <div class="group-header">
                  <span class="group-title">📦 Sản phẩm gợi ý ({{ matchingProducts.length }})</span>
                </div>

                <div class="results-list">
                  <div
                    v-for="p in matchingProducts"
                    :key="p.id"
                    class="result-item"
                    @mousedown.prevent="selectProduct(p)"
                  >
                    <img :src="p.image" :alt="p.name" class="result-thumb" loading="lazy" />
                    <div class="result-details">
                      <div class="result-name">{{ p.name }}</div>
                      <div class="result-pricing">
                        <span class="result-price">{{ formatCurrency(p.price) }}</span>
                        <span v-if="p.originalPrice > p.price" class="result-old-price">
                          {{ formatCurrency(p.originalPrice) }}
                        </span>
                        <span v-if="p.badge" class="result-badge">{{ p.badge }}</span>
                      </div>
                    </div>
                    <span class="result-arrow" aria-hidden="true">→</span>
                  </div>
                </div>

                <button type="button" class="btn-view-all" @mousedown.prevent="executeSearch">
                  Xem tất cả kết quả cho "<strong>{{ searchQuery }}</strong>" →
                </button>
              </div>

              <div v-else class="empty-results">
                <span class="empty-icon" aria-hidden="true">🔍</span>
                <p>Không tìm thấy thiết bị nào khớp với "<strong>{{ searchQuery }}</strong>"</p>
                <button type="button" class="btn-browse-all" @mousedown.prevent="viewAllProducts">
                  Xem toàn bộ kho sản phẩm
                </button>
              </div>
            </div>
          </div>
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
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '../../stores/productStore'
import { useCartStore } from '../../stores/cartStore'
import { useFestiveStore } from '../../stores/festiveStore'
import { CONTACT_INFO } from '../../config/contact'
import { formatCurrency } from '../../utils/formatters'
import BrandLogo from './BrandLogo.vue'

const router = useRouter()
const productStore = useProductStore()
const cartStore = useCartStore()
const festiveStore = useFestiveStore()
const searchQuery = ref('')
const searchInputRef = ref(null)
const isSearchOpen = ref(false)
const mobileMenuOpen = ref(false)

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

watch(() => router.currentRoute.value.fullPath, () => {
  closeMobileMenu()
  closeSearchDropdown()
})

const SEARCH_HISTORY_KEY = 'audioshop_search_history'

const loadSearchHistory = () => {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY)
    return raw ? JSON.parse(raw) : ['Dàn 29 triệu', 'Loa full 30', 'Vang số chống hú']
  } catch {
    return ['Dàn 29 triệu', 'Loa full 30', 'Vang số chống hú']
  }
}

const searchHistory = ref(loadSearchHistory())

const saveSearchHistory = (keyword) => {
  const clean = keyword.trim()
  if (!clean) return
  const filtered = searchHistory.value.filter(k => k.toLowerCase() !== clean.toLowerCase())
  filtered.unshift(clean)
  const sliced = filtered.slice(0, 8)
  searchHistory.value = sliced
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(sliced))
  } catch {}
}

const removeHistoryItem = (kw) => {
  searchHistory.value = searchHistory.value.filter(k => k !== kw)
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory.value))
  } catch {}
}

const clearHistory = () => {
  searchHistory.value = []
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch {}
}

const trendingKeywords = [
  { text: 'Loa Full 30 AMEK FB-12', badge: 'Át chủ bài' },
  { text: 'Dàn karaoke 29 triệu', badge: 'Bán chạy' },
  { text: 'Vang số AMEK UK-3000', badge: 'Chống hú 4 cấp' },
  { text: 'Cục đẩy 4 kênh x800W', badge: '56 sò khủng' },
  { text: 'Loa Sub hơi 40 PF S15', badge: 'Bass lực' },
  { text: 'Micro không dây chống hú', badge: 'Hát nhẹ' }
]

const matchingProducts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return productStore.products
    .filter(p => {
      const name = (p.name || '').toLowerCase()
      const desc = (p.shortDesc || '').toLowerCase()
      const cat = (p.category || '').toLowerCase()
      return name.includes(q) || desc.includes(q) || cat.includes(q)
    })
    .slice(0, 5)
})

const openSearchDropdown = () => {
  isSearchOpen.value = true
}

const closeSearchDropdown = () => {
  isSearchOpen.value = false
}

const clearSearch = () => {
  searchQuery.value = ''
  productStore.setSearchQuery('')
  searchInputRef.value?.focus()
}

const executeSearch = () => {
  const q = searchQuery.value.trim()
  if (q) {
    saveSearchHistory(q)
    productStore.setSearchQuery(q)
  } else {
    productStore.setSearchQuery('')
  }
  closeSearchDropdown()
  if (router.currentRoute.value.path !== '/san-pham') {
    router.push('/san-pham')
  }
}

const applyKeyword = (kw) => {
  searchQuery.value = kw
  executeSearch()
}

const selectProduct = (p) => {
  saveSearchHistory(p.name)
  closeSearchDropdown()
  router.push(`/san-pham/${p.id}`)
}

const viewAllProducts = () => {
  searchQuery.value = ''
  productStore.setSearchQuery('')
  closeSearchDropdown()
  router.push('/san-pham')
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
  transition: background 0.3s ease;
}

.top-announcement.festive-tet {
  background: linear-gradient(90deg, #991b1b 0%, #1e3a8a 50%, #991b1b 100%);
  border-bottom: 1px solid rgba(250, 204, 21, 0.4);
}

.top-announcement.festive-noel {
  background: linear-gradient(90deg, #14532d 0%, #1e3a8a 50%, #14532d 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.3);
}

.top-announcement.festive-sale {
  background: linear-gradient(90deg, #b91c1c 0%, #c2410c 50%, #b91c1c 100%);
  border-bottom: 1px solid rgba(250, 204, 21, 0.5);
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
  gap: 10px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.ticker-marquee-box {
  display: flex;
  overflow: hidden;
  user-select: none;
  gap: 36px;
  width: 100%;
  mask-image: linear-gradient(90deg, transparent 0%, #000 2%, #000 98%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 2%, #000 98%, transparent 100%);
}

.marquee-group {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 36px;
  min-width: 100%;
  animation: tickerScroll 26s linear infinite;
  white-space: nowrap;
}

.ticker-marquee-box:hover .marquee-group {
  animation-play-state: paused;
}

.marquee-item {
  font-weight: 600;
  letter-spacing: 0.01em;
}

.marquee-spacer {
  color: #FDE047;
  font-size: 0.72rem;
  opacity: 0.85;
}

@keyframes tickerScroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-100% - 36px));
  }
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
  white-space: nowrap;
}

.top-contact strong {
  color: #FDE047;
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

.search-wrapper {
  flex: 1;
  max-width: 500px;
  position: relative;
  z-index: 105;
}

.search-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(2px);
  z-index: 104;
}

.search-box {
  position: relative;
  z-index: 105;
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 1.5px solid #CBD5E1;
  border-radius: 999px;
  padding: 3px 3px 3px 14px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  transition: all 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}

.search-box:focus-within,
.search-box.is-active {
  background: #FFFFFF;
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16), 0 8px 24px rgba(15, 23, 42, 0.08);
}

.search-icon {
  display: flex;
  align-items: center;
  color: #64748B;
  margin-right: 8px;
  flex-shrink: 0;
}

.search-svg {
  width: 17px;
  height: 17px;
}

.search-box input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: #0F172A;
  font-size: 0.88rem;
  padding: 7px 4px;
}

.search-box input::placeholder {
  color: #94A3B8;
  font-size: 0.84rem;
}

.search-clear-btn {
  background: none;
  border: none;
  color: #94A3B8;
  font-size: 0.85rem;
  font-weight: 800;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, background 0.2s;
}

.search-clear-btn:hover {
  color: #DC2626;
  background: #F1F5F9;
}

.search-btn {
  position: relative;
  overflow: hidden;
  background: var(--gradient-gold);
  color: #090B10;
  font-weight: 800;
  font-size: 0.78rem;
  padding: 8px 16px;
  border-radius: 999px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 232, 163, 0.55);
  box-shadow: 0 4px 14px rgba(252, 183, 40, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.search-btn:hover {
  filter: brightness(1.06);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(252, 183, 40, 0.45);
}

.search-btn-svg {
  width: 14px;
  height: 14px;
}

/* ==========================================================================
   SMART SEARCH DROPDOWN MENU
   ========================================================================== */
.search-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  min-width: 520px;
  background: #FFFFFF;
  border: 1px solid #DCE4F0;
  border-radius: 18px;
  box-shadow: 0 20px 48px -10px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.04);
  padding: 16px;
  z-index: 106;
  max-height: 480px;
  overflow-y: auto;
  animation: searchDrop 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes searchDrop {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-group {
  margin-bottom: 14px;
}

.dropdown-group:last-child {
  margin-bottom: 0;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.group-title {
  font-size: 0.78rem;
  font-weight: 800;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.btn-clear-all {
  background: none;
  border: none;
  font-size: 0.74rem;
  font-weight: 700;
  color: #DC2626;
  cursor: pointer;
  padding: 0;
}

.btn-clear-all:hover {
  text-decoration: underline;
}

.history-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-history {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  color: #1E293B;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.18s;
}

.chip-history:hover {
  background: #E2E8F0;
  color: #1D4ED8;
}

.btn-del-chip {
  background: none;
  border: none;
  color: #94A3B8;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
  padding: 0 2px;
}

.btn-del-chip:hover {
  color: #DC2626;
}

.trending-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.trending-item {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 8px 10px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.trending-item:hover {
  background: #EFF6FF;
  border-color: #BFDBFE;
  transform: translateY(-1px);
}

.trend-badge {
  font-size: 0.65rem;
  font-weight: 800;
  background: #FEF3C7;
  color: #B45309;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.trend-text {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1E293B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Danh sách kết quả gợi ý trực tiếp */
.results-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  cursor: pointer;
  transition: all 0.2s;
}

.result-item:hover {
  background: #EFF6FF;
  border-color: #93C5FD;
}

.result-thumb {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 8px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  flex-shrink: 0;
}

.result-details {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: #0F172A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.result-pricing {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
}

.result-price {
  color: #DC2626;
  font-weight: 800;
}

.result-old-price {
  color: #94A3B8;
  text-decoration: line-through;
  font-size: 0.7rem;
}

.result-badge {
  background: #FEF3C7;
  color: #B45309;
  font-size: 0.64rem;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 4px;
}

.result-arrow {
  color: #94A3B8;
  font-weight: 800;
  font-size: 0.9rem;
  transition: transform 0.2s, color 0.2s;
}

.result-item:hover .result-arrow {
  color: #2563EB;
  transform: translateX(3px);
}

.btn-view-all {
  width: 100%;
  padding: 9px;
  border-radius: 10px;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  color: #1D4ED8;
  font-size: 0.82rem;
  font-weight: 800;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view-all:hover {
  background: #DBEAFE;
}

.empty-results {
  text-align: center;
  padding: 20px 10px;
}

.empty-icon {
  font-size: 1.8rem;
  display: block;
  margin-bottom: 6px;
}

.empty-results p {
  font-size: 0.82rem;
  color: #64748B;
  margin-bottom: 10px;
}

.btn-browse-all {
  background: var(--gradient-gold);
  border: none;
  color: #090B10;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 7px 16px;
  border-radius: 8px;
  cursor: pointer;
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
    font-size: 0.72rem;
    padding: 6px 0;
  }

  .top-contact {
    display: none;
  }

  .ticker-marquee-box {
    gap: 24px;
  }

  .marquee-group {
    animation-duration: 20s;
    gap: 24px;
  }

  @keyframes tickerScroll {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(calc(-100% - 24px));
    }
  }

  .app-header {
    background: #FFFFFF !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  .main-nav {
    padding: 8px 0 10px;
  }

  .header-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    row-gap: 8px;
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

  .search-wrapper {
    grid-column: 1 / -1;
    grid-row: 2;
    max-width: none;
    width: 100%;
    position: relative;
    z-index: 105;
  }

  .search-box {
    max-width: none;
    height: 42px;
    padding: 0 10px 0 14px;
    background: #F1F5F9;
    border: 1px solid #CBD5E1;
    border-radius: 999px;
    display: flex;
    align-items: center;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .search-box:focus-within,
  .search-box.is-active {
    background: #FFFFFF;
    border-color: #2563EB;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
  }

  .search-icon {
    font-size: 16px;
    color: #64748B;
    cursor: pointer;
    display: flex;
    align-items: center;
    margin-right: 6px;
    flex-shrink: 0;
  }

  .search-svg {
    width: 18px;
    height: 18px;
  }

  .search-box input {
    font-size: 14px;
    padding: 6px 4px;
    background: transparent;
    color: #0F172A;
  }

  .search-box input::placeholder {
    font-size: 13px;
    color: #94A3B8;
  }

  .search-btn {
    display: none !important;
  }

  .search-btn-text {
    display: none !important;
  }

  .search-clear-btn {
    width: 24px;
    height: 24px;
    font-size: 12px;
    padding: 0;
    margin-right: 2px;
    background: #E2E8F0;
    border-radius: 50%;
    color: #64748B;
  }

  .search-dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    min-width: 0 !important;
    width: 100% !important;
    max-height: 72vh;
    border-radius: 16px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.16);
    padding: 12px;
  }

  .trending-grid {
    grid-template-columns: 1fr;
    gap: 6px;
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
