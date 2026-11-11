<template>
  <div class="product-list-view container">
    <div class="list-header">
      <span class="badge-gold">KHO THIẾT BỊ ÂM THANH TÚ AUDIO</span>
      <h1 class="page-title">Kho Loa &amp; Thiết Bị Âm Thanh Chọn Lọc</h1>
      <p class="page-desc">
        Tất cả sản phẩm đều được kiểm định chất lượng âm thanh nghiêm ngặt trước khi xuất xưởng, đảm bảo đồng bộ pha và độ bền cao.
      </p>
    </div>

    <div class="filter-bar">
      <div class="category-tabs">
        <button
          type="button"
          :class="['tab-btn', { active: productStore.selectedCategory === 'all' }]"
          @click="selectCat('all')"
        >
          Tất Cả ({{ productStore.products.length }})
        </button>
        <button
          v-for="cat in productStore.categories"
          :key="cat.id"
          type="button"
          :class="['tab-btn', { active: productStore.selectedCategory === cat.id }]"
          @click="selectCat(cat.id)"
        >
          {{ cat.name }}
        </button>
      </div>

      <div class="extra-filters" v-if="productStore.selectedCategory !== 'dan-karaoke'">
        <select v-model="selectedBass" class="filter-select" aria-label="Lọc theo cỡ Bass">
          <option value="all">🔊 Tất cả cỡ Bass</option>
          <option value="25 cm">Bass 25 cm (Phòng nhỏ)</option>
          <option value="30 cm">Bass 30 cm (Chuẩn gia đình)</option>
          <option value="40 cm">Bass 40 cm (Sub/Phòng lớn)</option>
        </select>

        <select v-model="sortBy" class="filter-select" aria-label="Sắp xếp sản phẩm">
          <option value="default">Sắp xếp: Mặc định</option>
          <option value="price_asc">Giá: Thấp đến Cao</option>
          <option value="price_desc">Giá: Cao đến Thấp</option>
        </select>

        <div class="result-counter">
          Hiển thị <strong>{{ displayProducts.length }}</strong> thiết bị
        </div>
      </div>
    </div>

    <div v-if="productStore.selectedCategory === 'dan-karaoke'">
      <ComboOffers />
    </div>

    <div v-else-if="displayProducts.length > 0" class="products-grid">
      <ProductCard
        v-for="item in displayProducts"
        :key="item.id"
        :product="item"
      />
    </div>

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
const selectedBass = ref('all')
const sortBy = ref('default')

const displayProducts = computed(() => {
  let list = [...productStore.filteredProducts]

  if (selectedBass.value !== 'all') {
    list = list.filter(p => p.bassSize && p.bassSize.includes(selectedBass.value))
  }

  if (sortBy.value === 'price_asc') {
    list.sort((a, b) => a.price - b.price)
  } else if (sortBy.value === 'price_desc') {
    list.sort((a, b) => b.price - a.price)
  }

  return list
})

const selectCat = (catId) => {
  productStore.setCategory(catId)
  selectedBass.value = 'all'
}

const resetFilter = () => {
  productStore.setCategory('all')
  productStore.setSearchQuery('')
  selectedBass.value = 'all'
  sortBy.value = 'default'
}
</script>

<style scoped>
.product-list-view {
  padding: 40px 24px 80px;
}

.list-header {
  margin-bottom: 28px;
}

.page-title {
  font-size: clamp(1.75rem, 3.2vw, 2.35rem);
  font-weight: 900;
  color: #fff;
  margin: 12px 0 8px;
}

.page-desc {
  font-size: 0.96rem;
  color: var(--text-muted);
  max-width: 680px;
}

.filter-bar {
  background: linear-gradient(180deg, rgba(22, 27, 45, 0.88), rgba(14, 18, 30, 0.94));
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--shadow-card), var(--inner-highlight);
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tab-btn {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.13);
  color: var(--text-secondary);
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 700;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);
  transition: all 0.24s var(--ease-spring);
}

.tab-btn:hover {
  border-color: rgba(252, 183, 40, 0.52);
  color: #fff;
  transform: translateY(-1px);
}

.tab-btn.active {
  background: var(--gradient-gold);
  border-color: rgba(255, 232, 163, 0.65);
  color: #080a10;
  font-weight: 800;
  box-shadow: 0 8px 20px -4px rgba(252, 183, 40, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.tab-btn:active {
  transform: scale(0.97);
}

.extra-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.filter-select {
  background: var(--bg-dark-900);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f8fafc;
  padding: 9px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.86rem;
  outline: none;
  cursor: pointer;
}

.filter-select:focus {
  border-color: var(--color-primary);
}

.result-counter {
  margin-left: auto;
  font-size: 0.86rem;
  color: var(--text-muted);
}

.result-counter strong {
  color: var(--color-primary);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
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

@media (max-width: 992px) {
  .products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .product-list-view {
    padding: 24px 16px 48px;
  }

  .filter-bar {
    padding: 14px;
    gap: 12px;
  }

  .tab-btn {
    padding: 7px 12px;
    font-size: 0.78rem;
  }

  .extra-filters {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .filter-select {
    min-height: 42px;
    width: 100%;
    font-size: 0.8rem;
    padding: 8px 10px;
  }

  .result-counter {
    grid-column: 1 / -1;
    margin-left: 0;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
