<template>
  <div class="product-list-view container">
    <!-- Hero Header Hiện Đại Chuẩn Showroom Âm Thanh Cao Cấp -->
    <header class="list-hero-card">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="pulse-dot" aria-hidden="true"></span>
          <span>KHO THIẾT BỊ ÂM THANH CHỌN LỌC • TÚ AUDIO</span>
        </div>
        <h1 class="page-title">
          Kho Loa &amp; Thiết Bị <span class="gradient-text">Chuẩn Phòng Hát</span>
        </h1>
        <p class="page-desc">
          Tất cả thiết bị đều được kỹ sư Tú Audio đo đạc đồng bộ pha, kiểm tra dải tần nghiêm ngặt và hỗ trợ giao hàng, căn chỉnh tối ưu tận nơi.
        </p>

        <!-- Dải cam kết uy tín thương hiệu -->
        <div class="hero-trust-bar">
          <div class="trust-item">
            <span class="trust-icon" aria-hidden="true">🛡️</span>
            <span>100% Chính Hãng (AMEK &amp; Acoustic MMG)</span>
          </div>
          <div class="trust-divider" aria-hidden="true"></div>
          <div class="trust-item">
            <span class="trust-icon" aria-hidden="true">🎚️</span>
            <span>Đo Đạc Cân Pha Trực Tiếp Tại Nhà</span>
          </div>
          <div class="trust-divider" aria-hidden="true"></div>
          <div class="trust-item">
            <span class="trust-icon" aria-hidden="true">🚚</span>
            <span>Miễn Phí Vận Chuyển Bán Kính 300km</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Bộ Chọn Loại Thiết Bị & Bộ Lọc Hiện Đại Chuẩn TMĐT -->
    <section class="filter-panel" aria-label="Bộ lọc thiết bị âm thanh">
      <div class="cat-picker-header">
        <div class="picker-title-group">
          <span class="picker-icon" aria-hidden="true">🎛️</span>
          <h2 class="picker-label">Danh Mục Thiết Bị</h2>
        </div>
        <div class="picker-status-group">
          <span v-if="productStore.searchQuery" class="active-search-pill">
            Từ khóa: "<strong>{{ productStore.searchQuery }}</strong>"
            <button type="button" @click="productStore.setSearchQuery('')" aria-label="Xóa từ khóa">✕</button>
          </span>
          <span class="cat-total-count">
            Tổng <strong>{{ productStore.products.length }}</strong> model
          </span>
        </div>
      </div>

      <!-- Dải thẻ danh mục trực quan có Icon SVG thanh lịch -->
      <div class="category-cards-scroll">
        <!-- Nút Tất Cả -->
        <button
          type="button"
          :class="['cat-visual-card', { active: productStore.selectedCategory === 'all' }]"
          @click="selectCat('all')"
        >
          <div class="cat-icon-wrap" aria-hidden="true">
            <svg class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <div class="cat-text-wrap">
            <span class="cat-card-name">Tất Cả</span>
            <span class="cat-card-count">{{ productStore.products.length }}</span>
          </div>
        </button>

        <!-- Nút Các Danh Mục Cụ Thể -->
        <button
          v-for="cat in productStore.categories"
          :key="cat.id"
          type="button"
          :class="['cat-visual-card', { active: productStore.selectedCategory === cat.id }]"
          @click="selectCat(cat.id)"
        >
          <div class="cat-icon-wrap" aria-hidden="true">
            <!-- Loa Full -->
            <svg v-if="cat.id === 'loa-full'" class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <circle cx="12" cy="14" r="4" />
              <circle cx="12" cy="6" r="2" />
            </svg>
            <!-- Loa Sub -->
            <svg v-else-if="cat.id === 'loa-sub'" class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="12" cy="12" r="5" stroke-dasharray="2 2" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
            <!-- Dàn Karaoke -->
            <svg v-else-if="cat.id === 'dan-karaoke'" class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
            <!-- Cục Đẩy Công Suất -->
            <svg v-else-if="cat.id === 'cuc-day'" class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="6" cy="12" r="1.5" fill="currentColor" />
              <circle cx="10" cy="12" r="1.5" fill="currentColor" />
              <line x1="14" y1="12" x2="18" y2="12" stroke-linecap="round" />
            </svg>
            <!-- Vang Số & Micro -->
            <svg v-else-if="cat.id === 'vang-so-micro'" class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 14v-4" stroke-linecap="round" />
              <path d="M8 18v-12" stroke-linecap="round" />
              <path d="M12 20v-16" stroke-linecap="round" />
              <path d="M16 16v-8" stroke-linecap="round" />
              <path d="M20 13v-2" stroke-linecap="round" />
            </svg>
            <!-- Loa Di Động -->
            <svg v-else class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="6" width="18" height="15" rx="2" />
              <circle cx="12" cy="13" r="4" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <div class="cat-text-wrap">
            <span class="cat-card-name">{{ getShortCatName(cat) }}</span>
            <span class="cat-card-count">{{ getCatCount(cat.id) }}</span>
          </div>
        </button>
      </div>

      <template v-if="productStore.selectedCategory !== 'dan-karaoke'">
        <!-- Hàng Bộ Lọc Phụ Chi Tiết -->
        <div class="filters-sub-bar">
          <div class="filter-dropdowns-group">
            <div class="select-chip-wrapper">
              <span class="chip-icon" aria-hidden="true">💰</span>
              <select v-model="selectedPrice" class="chip-select" aria-label="Lọc theo mức giá">
                <option value="all">Mức Giá: Tất cả ▾</option>
                <option value="under_6m">Dưới 6 triệu</option>
                <option value="6m_10m">Từ 6 - 10 triệu</option>
                <option value="over_10m">Trên 10 triệu</option>
              </select>
            </div>

            <div class="select-chip-wrapper">
              <span class="chip-icon" aria-hidden="true">📏</span>
              <select v-model="selectedBass" class="chip-select" aria-label="Lọc theo cỡ Bass">
                <option value="all">Cỡ Bass: Tất cả ▾</option>
                <option value="25 cm">Bass 25 cm</option>
                <option value="30 cm">Bass 30 cm</option>
                <option value="40 cm">Bass 40 cm</option>
              </select>
            </div>

            <div class="select-chip-wrapper">
              <span class="chip-icon" aria-hidden="true">🏠</span>
              <select v-model="selectedRoom" class="chip-select" aria-label="Lọc theo diện tích phòng">
                <option value="all">Diện Tích: Tất cả ▾</option>
                <option value="small">Dưới 22m² (Chung cư)</option>
                <option value="medium">20 - 35m² (Phòng khách)</option>
                <option value="large">Trên 35m² (Không gian rộng)</option>
              </select>
            </div>
          </div>

          <!-- Nút gạt bộ lọc nhanh -->
          <div class="filter-toggles-group">
            <label :class="['toggle-pill', { checked: onlyHotSale }]">
              <input type="checkbox" v-model="onlyHotSale" />
              <span class="toggle-dot" aria-hidden="true"></span>
              <span class="toggle-label">🔥 Khuyến Mãi % HOT</span>
            </label>

            <label :class="['toggle-pill', { checked: onlyWithVideo }]">
              <input type="checkbox" v-model="onlyWithVideo" />
              <span class="toggle-dot" aria-hidden="true"></span>
              <span class="toggle-label">🎬 Có Video Test</span>
            </label>
          </div>

          <!-- Sắp xếp -->
          <div class="filter-sort-group">
            <span class="sort-icon" aria-hidden="true">⇅</span>
            <select v-model="sortBy" class="sort-modern-select" aria-label="Sắp xếp sản phẩm">
              <option value="default">Sắp xếp: Bán chạy</option>
              <option value="discount_desc">Khuyến mãi % cao</option>
              <option value="price_asc">Giá: Thấp đến cao</option>
              <option value="price_desc">Giá: Cao đến thấp</option>
            </select>
          </div>
        </div>

        <!-- Trạng thái các bộ lọc đang kích hoạt -->
        <div v-if="hasSubFilter" class="active-filters-bar">
          <span class="active-filter-label">Đang áp dụng:</span>
          <div class="active-filter-tags">
            <span v-if="selectedPrice !== 'all'" class="filter-tag">
              Giá: {{ priceFilterLabel }}
              <button type="button" @click="selectedPrice = 'all'" aria-label="Xóa lọc giá">✕</button>
            </span>
            <span v-if="selectedBass !== 'all'" class="filter-tag">
              Bass {{ selectedBass }}
              <button type="button" @click="selectedBass = 'all'" aria-label="Xóa lọc bass">✕</button>
            </span>
            <span v-if="selectedRoom !== 'all'" class="filter-tag">
              {{ roomFilterLabel }}
              <button type="button" @click="selectedRoom = 'all'" aria-label="Xóa lọc diện tích">✕</button>
            </span>
            <span v-if="onlyHotSale" class="filter-tag">
              Sale % HOT
              <button type="button" @click="onlyHotSale = false" aria-label="Xóa lọc sale">✕</button>
            </span>
            <span v-if="onlyWithVideo" class="filter-tag">
              Có Video
              <button type="button" @click="onlyWithVideo = false" aria-label="Xóa lọc video">✕</button>
            </span>
            <button type="button" class="btn-clear-all-filters" @click="resetSubFilters">
              Xóa tất cả lọc
            </button>
          </div>
        </div>
      </template>
    </section>

    <!-- Hiển thị Gói Dàn Karaoke Trọn Bộ -->
    <div v-if="productStore.selectedCategory === 'dan-karaoke'">
      <ComboOffers />
    </div>

    <template v-else-if="displayProducts.length > 0">
      <!-- Khung nổi bật TOP THIẾT BỊ BÁN CHẠY: Phong cách Studio Ambiance cao cấp thay thế mảng cam đặc -->
      <section v-if="showTopShowcase" class="top-hot-box">
        <div class="top-hot-header">
          <div class="spotlight-badge">
            <span class="fire-icon" aria-hidden="true">🔥</span>
            <span>CHỌN LỌC ĐỒNG BỘ PHA • ĐỀ XUẤT TÚ AUDIO</span>
          </div>
          <h2 class="top-hot-heading">
            TOP THIẾT BỊ &amp; LOA BÁN CHẠY NHẤT
          </h2>
          <p class="top-hot-sub">
            Các model át chủ bài được ưa chuộng nhờ tiếng sáng rõ, độ bền cao và triệt tiêu hú rít hoàn toàn
          </p>
        </div>

        <div class="products-grid showcase-grid">
          <ProductCard
            v-for="item in topBestSellers"
            :key="`top-${item.id}`"
            :product="item"
          />
        </div>
      </section>

      <!-- Danh Sách Toàn Bộ Thiết Bị Theo Bộ Lọc -->
      <section class="catalog-section" aria-label="Danh sách thiết bị chính hãng">
        <div class="catalog-list-head">
          <div class="catalog-heading-wrap">
            <span class="accent-bar" aria-hidden="true"></span>
            <h2 class="catalog-sub-title">
              {{ currentCategoryLabel }}
            </h2>
          </div>
          <span class="result-counter">
            Hiển thị <strong>{{ displayProducts.length }}</strong> thiết bị chính hãng
          </span>
        </div>

        <div class="products-grid">
          <ProductCard
            v-for="item in displayProducts"
            :key="item.id"
            :product="item"
          />
        </div>
      </section>
    </template>

    <div v-else class="empty-state">
      <div class="empty-icon" aria-hidden="true">🔍</div>
      <h3>Không tìm thấy thiết bị phù hợp</h3>
      <p>Không có sản phẩm nào khớp với các tiêu chí lọc hiện tại của Bác.</p>
      <button class="btn-primary" type="button" @click="resetFilter">Xem Tất Cả Sản Phẩm</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProductStore } from '../stores/productStore'
import ProductCard from '../components/product/ProductCard.vue'
import ComboOffers from '../components/home/ComboOffers.vue'

const productStore = useProductStore()
const selectedPrice = ref('all')
const selectedBass = ref('all')
const selectedRoom = ref('all')
const onlyHotSale = ref(false)
const onlyWithVideo = ref(false)
const sortBy = ref('default')

const getShortCatName = (cat) => {
  const shortMap = {
    'loa-full': 'Loa Full Karaoke',
    'loa-sub': 'Loa Sub Trầm',
    'dan-karaoke': 'Dàn Karaoke Bộ',
    'loa-di-dong': 'Loa Di Động',
    'cuc-day': 'Cục Đẩy Công Suất',
    'vang-so-micro': 'Vang Số & Micro'
  }
  return shortMap[cat.id] || cat.name
}

const getCatCount = (catId) => {
  if (catId === 'dan-karaoke') return productStore.combos.length || 5
  return productStore.products.filter(p => p.category === catId).length
}

const getDiscountRate = (item) => {
  const price = Number(item.price || 0)
  const original = Number(item.originalPrice || 0)
  if (!original || original <= price || price <= 0) return 0
  return (original - price) / original
}

const matchesRoomFilter = (roomSizeText, filterKey) => {
  if (filterKey === 'all') return true
  const numbers = String(roomSizeText || '').match(/\d+/g)?.map(Number) || []
  if (numbers.length === 0) return true
  const maxArea = Math.max(...numbers)
  const minArea = Math.min(...numbers)
  if (filterKey === 'small') return minArea <= 22
  if (filterKey === 'medium') return minArea <= 35 && maxArea >= 20
  if (filterKey === 'large') return maxArea >= 35
  return true
}

const priceFilterLabel = computed(() => {
  if (selectedPrice.value === 'under_6m') return 'Dưới 6 triệu'
  if (selectedPrice.value === '6m_10m') return '6 - 10 triệu'
  if (selectedPrice.value === 'over_10m') return 'Trên 10 triệu'
  return ''
})

const roomFilterLabel = computed(() => {
  if (selectedRoom.value === 'small') return 'Dưới 22m²'
  if (selectedRoom.value === 'medium') return '20 - 35m²'
  if (selectedRoom.value === 'large') return 'Trên 35m²'
  return ''
})

const displayProducts = computed(() => {
  let list = [...productStore.filteredProducts]

  if (selectedPrice.value === 'under_6m') {
    list = list.filter(p => Number(p.price) < 6000000)
  } else if (selectedPrice.value === '6m_10m') {
    list = list.filter(p => Number(p.price) >= 6000000 && Number(p.price) <= 10000000)
  } else if (selectedPrice.value === 'over_10m') {
    list = list.filter(p => Number(p.price) > 10000000)
  }

  if (selectedBass.value !== 'all') {
    list = list.filter(p => p.bassSize && p.bassSize.includes(selectedBass.value))
  }

  if (selectedRoom.value !== 'all') {
    list = list.filter(p => matchesRoomFilter(p.roomSize, selectedRoom.value))
  }

  if (onlyHotSale.value) {
    list = list.filter(p => Number(p.originalPrice) > Number(p.price))
  }

  if (onlyWithVideo.value) {
    list = list.filter(p => Boolean(p.videoUrl && p.videoUrl.trim()))
  }

  if (sortBy.value === 'price_asc') {
    list.sort((a, b) => a.price - b.price)
  } else if (sortBy.value === 'price_desc') {
    list.sort((a, b) => b.price - a.price)
  } else if (sortBy.value === 'discount_desc') {
    list.sort((a, b) => getDiscountRate(b) - getDiscountRate(a))
  } else {
    list.sort((a, b) => Number(b.reviewsCount || 0) - Number(a.reviewsCount || 0))
  }

  return list
})

const hasSubFilter = computed(() => {
  return (
    selectedPrice.value !== 'all' ||
    selectedBass.value !== 'all' ||
    selectedRoom.value !== 'all' ||
    onlyHotSale.value ||
    onlyWithVideo.value ||
    Boolean(productStore.searchQuery)
  )
})

const showTopShowcase = computed(() => {
  return productStore.selectedCategory === 'all' && !hasSubFilter.value && displayProducts.value.length >= 4
})

const topBestSellers = computed(() => {
  return [...productStore.products]
    .sort((a, b) => Number(b.reviewsCount || 0) - Number(a.reviewsCount || 0))
    .slice(0, 4)
})

const currentCategoryLabel = computed(() => {
  if (productStore.selectedCategory === 'all') return 'Tất Cả Thiết Bị Chính Hãng'
  const found = productStore.categories.find(c => c.id === productStore.selectedCategory)
  return found ? found.name : 'Danh Sách Thiết Bị'
})

const selectCat = (catId) => {
  productStore.setCategory(catId)
  selectedBass.value = 'all'
}

const resetSubFilters = () => {
  selectedPrice.value = 'all'
  selectedBass.value = 'all'
  selectedRoom.value = 'all'
  onlyHotSale.value = false
  onlyWithVideo.value = false
  productStore.setSearchQuery('')
}

const resetFilter = () => {
  productStore.setCategory('all')
  resetSubFilters()
  sortBy.value = 'default'
}
</script>

<style scoped>
.product-list-view {
  padding: 30px 24px 80px;
}

/* ==========================================================================
   1. HERO CARD HIỆN ĐẠI
   ========================================================================== */
.list-hero-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafd 60%, #eef4fc 100%);
  border: 1px solid #dce4f0;
  border-radius: 22px;
  padding: 26px 28px 24px;
  margin-bottom: 24px;
  box-shadow: 0 10px 30px -12px rgba(15, 23, 42, 0.08);
  position: relative;
  overflow: hidden;
}

.list-hero-card::after {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fde68a;
  padding: 4px 12px;
  border-radius: 999px;
  margin-bottom: 10px;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #16a34a;
  box-shadow: 0 0 8px rgba(22, 163, 74, 0.6);
  animation: pulseDot 2s infinite ease-in-out;
}

@keyframes pulseDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

.page-title {
  font-size: clamp(1.6rem, 2.8vw, 2.25rem);
  font-weight: 900;
  color: #0f172a;
  line-height: 1.25;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.gradient-text {
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #d97706 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-desc {
  font-size: 0.94rem;
  color: #475569;
  max-width: 740px;
  line-height: 1.55;
  margin: 0;
}

.hero-trust-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #1e293b;
}

.trust-icon {
  font-size: 0.95rem;
}

.trust-divider {
  width: 1px;
  height: 14px;
  background: #cbd5e1;
}

/* ==========================================================================
   2. KHUNG LỌC BỘ CHỌN THIẾT BỊ (FILTER PANEL)
   ========================================================================== */
.filter-panel {
  background: #ffffff;
  border: 1px solid #dce4f0;
  border-radius: 20px;
  padding: 20px 22px;
  margin-bottom: 28px;
  box-shadow: 0 10px 30px -12px rgba(15, 23, 42, 0.07);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cat-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.picker-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.picker-icon {
  font-size: 1.15rem;
}

.picker-label {
  font-size: 0.98rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.picker-status-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.cat-total-count {
  font-size: 0.82rem;
  color: #64748b;
}

.cat-total-count strong {
  color: #1d4ed8;
}

.active-search-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  padding: 3px 10px;
  border-radius: 999px;
}

.active-search-pill button {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  padding: 0 2px;
}

/* Dải thẻ danh mục cuộn ngang kiểu mới */
.category-cards-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

@media (min-width: 1024px) {
  .category-cards-scroll {
    flex-wrap: wrap;
    overflow-x: visible;
    padding-bottom: 2px;
  }
}

.category-cards-scroll::-webkit-scrollbar {
  height: 5px;
}

.category-cards-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.cat-visual-card {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 13px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #334155;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  user-select: none;
}

.cat-visual-card:hover {
  background: #ffffff;
  border-color: #93c5fd;
  color: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px -6px rgba(37, 99, 235, 0.16);
}

.cat-visual-card.active {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 55%, #1e3a8a 100%);
  border-color: #1d4ed8;
  color: #ffffff;
  box-shadow: 0 8px 22px -6px rgba(29, 78, 216, 0.42);
  transform: translateY(-2px);
}

.cat-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
  flex-shrink: 0;
}

.cat-visual-card:hover .cat-icon-wrap {
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.cat-visual-card.active .cat-icon-wrap {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.3);
  color: #ffffff;
}

.cat-svg {
  width: 17px;
  height: 17px;
}

.cat-text-wrap {
  display: flex;
  align-items: center;
  gap: 7px;
}

.cat-card-name {
  font-size: 0.81rem;
  font-weight: 700;
  white-space: nowrap;
}

.cat-card-count {
  font-size: 0.69rem;
  font-weight: 800;
  background: #e2e8f0;
  color: #475569;
  padding: 2px 7px;
  border-radius: 999px;
  line-height: 1.2;
}

.cat-visual-card.active .cat-card-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

/* Hàng Bộ Lọc Phụ */
.filters-sub-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.filter-dropdowns-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.select-chip-wrapper {
  display: inline-flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 2px 8px 2px 10px;
  transition: all 0.2s;
}

.select-chip-wrapper:focus-within {
  background: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.chip-icon {
  font-size: 0.82rem;
  margin-right: 4px;
}

.chip-select {
  background: transparent;
  border: none;
  color: #1e293b;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 6px 4px;
  outline: none;
  cursor: pointer;
}

.filter-toggles-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toggle-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.toggle-pill input {
  display: none;
}

.toggle-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
  transition: all 0.2s;
}

.toggle-pill:hover {
  background: #ffffff;
  border-color: #94a3b8;
}

.toggle-pill.checked {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
}

.toggle-pill.checked .toggle-dot {
  background: #2563eb;
  box-shadow: 0 0 6px rgba(37, 99, 235, 0.6);
}

.filter-sort-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.sort-icon {
  font-size: 0.85rem;
  color: #1d4ed8;
  font-weight: 900;
}

.sort-modern-select {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  padding: 6px 10px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #1d4ed8;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.sort-modern-select:focus {
  border-color: #2563eb;
}

/* Thanh bộ lọc đang áp dụng */
.active-filters-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px dashed #cbd5e1;
}

.active-filter-label {
  font-size: 0.74rem;
  font-weight: 700;
  color: #64748b;
}

.active-filter-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.74rem;
  font-weight: 700;
  color: #1e40af;
  background: #dbeafe;
  border: 1px solid #bfdbfe;
  padding: 2px 8px;
  border-radius: 6px;
}

.filter-tag button {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
}

.btn-clear-all-filters {
  background: none;
  border: none;
  font-size: 0.74rem;
  font-weight: 700;
  color: #dc2626;
  text-decoration: underline;
  cursor: pointer;
  padding: 2px 4px;
}

/* ==========================================================================
   3. KHUNG NỔI BẬT TOP THIẾT BỊ BÁN CHẠY (STUDIO SPOTLIGHT AMBIANCE)
   ========================================================================== */
.top-hot-box {
  background: linear-gradient(135deg, #0b1329 0%, #172554 50%, #0f172a 100%);
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 22px;
  padding: 26px 22px 28px;
  margin-bottom: 34px;
  box-shadow: 0 24px 50px -14px rgba(11, 19, 41, 0.45);
  position: relative;
  overflow: hidden;
}

.top-hot-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 120px;
  background: radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.16), transparent 70%);
  pointer-events: none;
}

.top-hot-header {
  text-align: center;
  position: relative;
  z-index: 1;
  margin-bottom: 20px;
}

.spotlight-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(245, 158, 11, 0.16);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #fbbf24;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 999px;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.fire-icon {
  font-size: 0.85rem;
}

.top-hot-heading {
  font-size: clamp(1.25rem, 2.4vw, 1.68rem);
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.01em;
  margin: 0 0 6px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}

.top-hot-sub {
  font-size: 0.86rem;
  color: #94a3b8;
  max-width: 740px;
  margin: 0 auto;
  line-height: 1.5;
}

/* ==========================================================================
   4. TIÊU ĐỀ DANH SÁCH & LƯỚI SẢN PHẨM
   ========================================================================== */
.catalog-section {
  margin-top: 10px;
}

.catalog-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 2px solid #eef2f7;
}

.catalog-heading-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.accent-bar {
  width: 4px;
  height: 22px;
  border-radius: 4px;
  background: linear-gradient(180deg, #1d4ed8 0%, #d97706 100%);
}

.catalog-sub-title {
  font-size: 1.25rem;
  font-weight: 900;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.01em;
}

.result-counter {
  font-size: 0.84rem;
  color: #64748b;
  font-weight: 600;
}

.result-counter strong {
  color: #dc2626;
}

/* Lưới sản phẩm chuẩn Showroom: 4 cột màn hình rộng, 3 cột laptop, 2 cột mobile */
.products-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.empty-state {
  text-align: center;
  padding: 64px 20px;
  background: #ffffff;
  border: 1px solid #dce4f0;
  border-radius: 20px;
  box-shadow: 0 8px 24px -10px rgba(15, 23, 42, 0.06);
}

.empty-icon {
  font-size: 2.8rem;
  margin-bottom: 12px;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 6px;
}

.empty-state p {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.btn-primary {
  display: inline-block;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
  font-weight: 800;
  font-size: 0.9rem;
  padding: 10px 24px;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(217, 119, 6, 0.35);
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(217, 119, 6, 0.45);
}

/* ==========================================================================
   5. RESPONSIVE BREAKPOINTS (TABLET & MOBILE)
   ========================================================================== */
@media (max-width: 1120px) {
  .products-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .products-grid.showcase-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .product-list-view {
    padding: 10px 8px 120px;
  }

  .list-hero-card {
    padding: 12px 14px;
    border-radius: 14px;
    margin-bottom: 12px;
  }

  .hero-badge {
    font-size: 0.68rem;
    padding: 2px 8px;
    margin-bottom: 6px;
  }

  .page-title {
    font-size: 1.25rem;
    margin-bottom: 4px;
  }

  .page-desc {
    display: none;
  }

  .hero-trust-bar {
    gap: 6px;
    margin-top: 8px;
    padding-top: 8px;
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .hero-trust-bar::-webkit-scrollbar {
    display: none;
  }

  .trust-item {
    font-size: 0.72rem;
    flex-shrink: 0;
    background: #f1f5f9;
    padding: 3px 8px;
    border-radius: 6px;
    white-space: nowrap;
  }

  .trust-divider {
    display: none;
  }

  .filter-panel {
    padding: 12px 10px;
    border-radius: 14px;
    gap: 10px;
    margin-bottom: 16px;
  }

  .cat-picker-header {
    margin-bottom: 0;
  }

  .picker-label {
    font-size: 0.88rem;
  }

  .cat-total-count {
    font-size: 0.75rem;
  }

  .category-cards-scroll {
    gap: 6px;
    padding-bottom: 2px;
    scrollbar-width: none;
  }

  .category-cards-scroll::-webkit-scrollbar {
    display: none;
  }

  .cat-visual-card {
    padding: 6px 10px;
    border-radius: 9px;
    gap: 6px;
  }

  .cat-icon-wrap {
    width: 24px;
    height: 24px;
    border-radius: 6px;
  }

  .cat-svg {
    width: 13px;
    height: 13px;
  }

  .cat-card-name {
    font-size: 0.72rem;
  }

  .cat-card-count {
    font-size: 0.65rem;
    padding: 1px 5px;
  }

  /* Đưa toàn bộ các chip lọc phụ lên 1 hàng cuộn ngang mượt mà, không bị xếp chồng 5 dòng */
  .filters-sub-bar {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 6px;
    padding-top: 8px;
    padding-bottom: 4px;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .filters-sub-bar::-webkit-scrollbar {
    display: none;
  }

  .filter-dropdowns-group {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    flex-shrink: 0;
  }

  .select-chip-wrapper {
    flex-shrink: 0;
    white-space: nowrap;
    padding: 2px 6px 2px 8px;
  }

  .chip-select {
    font-size: 0.74rem;
    padding: 4px 2px;
  }

  .filter-toggles-group {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    flex-shrink: 0;
  }

  .toggle-pill {
    flex-shrink: 0;
    white-space: nowrap;
    padding: 4px 9px;
    font-size: 0.72rem;
  }

  .filter-sort-group {
    flex-shrink: 0;
    margin-left: 0;
  }

  .sort-modern-select {
    padding: 4px 8px;
    font-size: 0.74rem;
  }

  .top-hot-box {
    padding: 16px 10px 18px;
    border-radius: 14px;
    margin-bottom: 20px;
  }

  .spotlight-badge {
    font-size: 0.66rem;
    padding: 3px 9px;
    margin-bottom: 6px;
  }

  .top-hot-heading {
    font-size: 1.15rem;
    margin-bottom: 4px;
  }

  .top-hot-sub {
    font-size: 0.76rem;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  .catalog-sub-title {
    font-size: 1.05rem;
  }

  .result-counter {
    font-size: 0.76rem;
  }

  .products-grid,
  .products-grid.showcase-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
}
</style>
