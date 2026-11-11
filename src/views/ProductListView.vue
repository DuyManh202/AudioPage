<template>
  <div class="product-list-view container">
    <div class="list-header">
      <span class="badge-gold">KHO THIẾT BỊ ÂM THANH TÚ AUDIO</span>
      <h1 class="page-title">Kho Loa &amp; Thiết Bị Âm Thanh Chọn Lọc</h1>
      <p class="page-desc">
        Tất cả sản phẩm đều được kiểm định chất lượng âm thanh nghiêm ngặt trước khi xuất xưởng, đảm bảo đồng bộ pha và độ bền cao.
      </p>
    </div>

    <!-- Bộ chọn loại thiết bị & bộ lọc chuẩn TMĐT di động -->
    <div class="filter-panel">
      <div class="cat-picker-head">
        <span class="picker-label">Chọn Loại Thiết Bị</span>
        <span v-if="productStore.searchQuery" class="active-search-pill">
          Từ khóa: "{{ productStore.searchQuery }}"
          <button type="button" @click="productStore.setSearchQuery('')" aria-label="Xóa từ khóa">✕</button>
        </span>
      </div>

      <div class="category-cards-scroll">
        <button
          type="button"
          :class="['cat-visual-card', { active: productStore.selectedCategory === 'all' }]"
          @click="selectCat('all')"
        >
          <span class="cat-card-icon" aria-hidden="true">🎛️</span>
          <span class="cat-card-name">Tất Cả ({{ productStore.products.length }})</span>
        </button>

        <button
          v-for="cat in productStore.categories"
          :key="cat.id"
          type="button"
          :class="['cat-visual-card', { active: productStore.selectedCategory === cat.id }]"
          @click="selectCat(cat.id)"
        >
          <span class="cat-card-icon" aria-hidden="true">{{ getCategoryIcon(cat.id) }}</span>
          <span class="cat-card-name">{{ getShortCatName(cat) }}</span>
        </button>
      </div>

      <template v-if="productStore.selectedCategory !== 'dan-karaoke'">
        <!-- Hàng dropdown lọc nhanh cuộn ngang -->
        <div class="dropdown-chips-scroll">
          <select v-model="selectedPrice" class="chip-select" aria-label="Lọc theo mức giá">
            <option value="all">Giá Thiết Bị ▾</option>
            <option value="under_6m">Dưới 6 triệu</option>
            <option value="6m_10m">Từ 6 - 10 triệu</option>
            <option value="over_10m">Trên 10 triệu</option>
          </select>

          <select v-model="selectedBass" class="chip-select" aria-label="Lọc theo cỡ Bass">
            <option value="all">Cỡ Loa Bass ▾</option>
            <option value="25 cm">Bass 25 cm</option>
            <option value="30 cm">Bass 30 cm</option>
            <option value="40 cm">Bass 40 cm</option>
          </select>

          <select v-model="selectedRoom" class="chip-select" aria-label="Lọc theo diện tích phòng">
            <option value="all">Diện Tích Phòng ▾</option>
            <option value="small">Dưới 22m² (Chung cư)</option>
            <option value="medium">20 - 35m² (Phòng khách)</option>
            <option value="large">Trên 35m² (Không gian rộng)</option>
          </select>
        </div>

        <!-- Hàng checkbox ưu đãi + Sắp xếp -->
        <div class="quick-toggles-row">
          <div class="toggle-checks">
            <label :class="['check-pill', { checked: onlyHotSale }]">
              <input type="checkbox" v-model="onlyHotSale" />
              <span>Khuyến Mãi % HOT</span>
            </label>

            <label :class="['check-pill', { checked: onlyWithVideo }]">
              <input type="checkbox" v-model="onlyWithVideo" />
              <span>Có Video Test</span>
            </label>
          </div>

          <div class="sort-wrap">
            <select v-model="sortBy" class="sort-link-select" aria-label="Sắp xếp sản phẩm">
              <option value="default">Sắp xếp: Bán chạy</option>
              <option value="discount_desc">Khuyến mãi % cao</option>
              <option value="price_asc">Giá thấp - cao</option>
              <option value="price_desc">Giá cao - thấp</option>
            </select>
          </div>
        </div>
      </template>
    </div>

    <!-- Hiển thị Gói Dàn Karaoke Trọn Bộ -->
    <div v-if="productStore.selectedCategory === 'dan-karaoke'">
      <ComboOffers />
    </div>

    <template v-else-if="displayProducts.length > 0">
      <!-- Khung nổi bật TOP THIẾT BỊ BÁN CHẠY (khi xem Tất cả & không lọc hẹp) -->
      <section v-if="showTopShowcase" class="top-hot-box">
        <div class="top-hot-banner">
          <span class="spark" aria-hidden="true">🔥</span>
          <div>
            <div class="top-hot-sub">CHỌN LỌC ĐỒNG BỘ PHA</div>
            <h2 class="top-hot-heading">TOP THIẾT BỊ &amp; LOA BÁN CHẠY</h2>
          </div>
          <span class="spark" aria-hidden="true">🔥</span>
        </div>

        <div class="products-grid showcase-grid">
          <ProductCard
            v-for="item in topBestSellers"
            :key="`top-${item.id}`"
            :product="item"
          />
        </div>
      </section>

      <!-- Danh sách toàn bộ thiết bị theo bộ lọc -->
      <div class="catalog-list-head">
        <h2 class="catalog-sub-title">
          {{ currentCategoryLabel }}
        </h2>
        <span class="result-counter">
          Hiển thị <strong>{{ displayProducts.length }}</strong> thiết bị
        </span>
      </div>

      <div class="products-grid">
        <ProductCard
          v-for="item in displayProducts"
          :key="item.id"
          :product="item"
        />
      </div>
    </template>

    <div v-else class="empty-state">
      <p>Không tìm thấy thiết bị phù hợp với bộ lọc của Bác.</p>
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

const getCategoryIcon = (catId) => {
  const icons = {
    'loa-full': '🔊',
    'loa-sub': '💿',
    'dan-karaoke': '🎤',
    'loa-di-dong': '📻',
    'cuc-day': '⚡',
    'vang-so-micro': '🎙️'
  }
  return icons[catId] || '🎵'
}

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

const resetFilter = () => {
  productStore.setCategory('all')
  productStore.setSearchQuery('')
  selectedPrice.value = 'all'
  selectedBass.value = 'all'
  selectedRoom.value = 'all'
  onlyHotSale.value = false
  onlyWithVideo.value = false
  sortBy.value = 'default'
}
</script>

<style scoped>
.product-list-view {
  padding: 36px 24px 80px;
}

.list-header {
  margin-bottom: 22px;
}

.page-title {
  font-size: clamp(1.65rem, 3vw, 2.25rem);
  font-weight: 900;
  color: #0f172a;
  margin: 10px 0 8px;
}

.page-desc {
  font-size: 0.94rem;
  color: var(--text-muted);
  max-width: 680px;
}

/* Khung lọc kiểu TMĐT hiện đại */
.filter-panel {
  background: #ffffff;
  border: 1px solid #dce4f0;
  border-radius: 16px;
  padding: 16px 18px;
  margin-bottom: 26px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--shadow-card);
}

.cat-picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.picker-label {
  font-size: 0.92rem;
  font-weight: 800;
  color: #0f172a;
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
  color: #dc2626;
  font-size: 0.75rem;
  font-weight: 800;
}

/* Dải thẻ danh mục có icon trượt ngang */
.category-cards-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
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
  min-width: 112px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #334155;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
  transition: transform 0.22s var(--ease-spring), border-color 0.2s, background 0.2s, color 0.2s;
}

.cat-visual-card:hover {
  border-color: #93c5fd;
  background: #ffffff;
  color: #1d4ed8;
  transform: translateY(-2px);
}

.cat-visual-card.active {
  background: #eff6ff;
  border-color: #2563eb;
  color: #1d4ed8;
  box-shadow: 0 6px 16px -6px rgba(37, 99, 235, 0.28);
}

.cat-card-icon {
  font-size: 1.35rem;
  line-height: 1;
}

.cat-card-name {
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
}

.cat-visual-card.active .cat-card-name {
  color: #1d4ed8;
  font-weight: 800;
}

/* Hàng dropdown lọc ngang */
.dropdown-chips-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}

.dropdown-chips-scroll::-webkit-scrollbar {
  height: 4px;
}

.chip-select {
  flex: 0 0 auto;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #1e293b;
  padding: 7px 12px;
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 600;
  outline: none;
  cursor: pointer;
}

.chip-select:focus {
  background: #ffffff;
  border-color: #2563eb;
}

/* Hàng checkbox ưu đãi + Sắp xếp */
.quick-toggles-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid #eef2f7;
}

.toggle-checks {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.check-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.79rem;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  user-select: none;
}

.check-pill input {
  width: 15px;
  height: 15px;
  accent-color: #2563eb;
  cursor: pointer;
}

.check-pill.checked {
  color: #1d4ed8;
}

.sort-wrap {
  margin-left: auto;
}

.sort-link-select {
  background: transparent;
  border: none;
  color: #1d4ed8;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  outline: none;
}

.sort-link-select option {
  background: #ffffff;
  color: #0f172a;
}

/* Khung TOP THIẾT BỊ BÁN CHẠY nổi bật */
.top-hot-box {
  background: linear-gradient(180deg, #ea580c 0%, #dc2626 100%);
  border: 1.5px solid #f97316;
  border-radius: 18px;
  padding: 16px 16px 18px;
  margin-bottom: 30px;
  box-shadow: 0 18px 40px -14px rgba(220, 38, 38, 0.35);
}

.top-hot-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  margin-bottom: 14px;
}

.top-hot-sub {
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #fef08a;
}

.top-hot-heading {
  font-size: clamp(1.12rem, 2.2vw, 1.55rem);
  font-weight: 900;
  color: #ffffff;
  text-transform: uppercase;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
}

.spark {
  font-size: 1.35rem;
}

.catalog-list-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.catalog-sub-title {
  font-size: 1.18rem;
  font-weight: 800;
  color: #0f172a;
}

.result-counter {
  font-size: 0.84rem;
  color: var(--text-muted);
}

.result-counter strong {
  color: #dc2626;
}

/* Lưới sản phẩm: 4 cột Desktop rộng, 3 cột Laptop, 2 cột Tablet & Mobile */
.products-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.empty-state {
  text-align: center;
  padding: 64px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
}

.empty-state p {
  color: var(--text-muted);
  margin-bottom: 18px;
}

@media (max-width: 1120px) {
  .products-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .products-grid.showcase-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .product-list-view {
    padding: 18px 10px 44px;
  }

  .list-header {
    margin-bottom: 14px;
    padding: 0 2px;
  }

  .page-title {
    font-size: 1.35rem;
    margin: 8px 0 4px;
  }

  .page-desc {
    font-size: 0.82rem;
  }

  .filter-panel {
    padding: 12px 10px;
    border-radius: 13px;
    margin-bottom: 18px;
    gap: 10px;
  }

  .cat-visual-card {
    min-width: 96px;
    padding: 8px 9px;
    border-radius: 10px;
    gap: 4px;
  }

  .cat-card-icon {
    font-size: 1.18rem;
  }

  .cat-card-name {
    font-size: 0.7rem;
  }

  .chip-select {
    font-size: 0.75rem;
    padding: 6px 9px;
  }

  .check-pill {
    font-size: 0.73rem;
    gap: 4px;
  }

  .sort-link-select {
    font-size: 0.76rem;
  }

  .top-hot-box {
    padding: 12px 8px 12px;
    border-radius: 14px;
    margin-bottom: 22px;
  }

  .top-hot-heading {
    font-size: 1.02rem;
  }

  .catalog-sub-title {
    font-size: 1rem;
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
