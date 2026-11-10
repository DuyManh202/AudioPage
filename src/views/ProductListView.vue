<template>
  <div class="product-list-view container">
    <div class="list-header">
      <h1 class="page-title">Kho Loa & Thiết Bị Âm Thanh Chọn Lọc</h1>
      <p class="page-desc">
        Tất cả sản phẩm đều được kiểm định chất lượng âm thanh nghiêm ngặt trước khi xuất xưởng, đảm bảo đồng bộ pha và độ bền cao.
      </p>
    </div>

    <!-- Thanh Lọc Danh Mục -->
    <div class="filter-bar">
      <div class="category-tabs">
        <button 
          :class="['tab-btn', { active: productStore.selectedCategory === 'all' }]"
          @click="selectCat('all')"
        >
          Tất Cả ({{ productStore.products.length }})
        </button>
        <button 
          v-for="cat in productStore.categories"
          :key="cat.id"
          :class="['tab-btn', { active: productStore.selectedCategory === cat.id }]"
          @click="selectCat(cat.id)"
        >
          {{ cat.name }}
        </button>
      </div>

      <div class="extra-filters" v-if="productStore.selectedCategory !== 'dan-karaoke'">
        <select v-model="selectedBass" class="filter-select">
          <option value="all">🔊 Tất cả cỡ Bass</option>
          <option value="25 cm">Bass 25 cm (Phòng nhỏ)</option>
          <option value="30 cm">Bass 30 cm (Chuẩn gia đình)</option>
          <option value="40 cm">Bass 40 cm (Sub/Phòng lớn)</option>
        </select>

        <select v-model="sortBy" class="filter-select">
          <option value="default">Sắp xếp: Mặc định</option>
          <option value="price_asc">Giá: Thấp đến Cao</option>
          <option value="price_desc">Giá: Cao đến Thấp</option>
        </select>

        <div class="result-counter">
          Hiển thị <strong>{{ displayProducts.length }}</strong> thiết bị
        </div>
      </div>
    </div>

    <!-- Nếu chọn tab Dàn Karaoke Trọn Bộ: Hiển thị ngay 2 gói dàn chủ lực -->
    <div v-if="productStore.selectedCategory === 'dan-karaoke'">
      <ComboOffers />
    </div>

    <!-- Lưới Sản Phẩm Rời -->
    <div v-else-if="displayProducts.length > 0" class="products-grid">
      <ProductCard 
        v-for="item in displayProducts" 
        :key="item.id" 
        :product="item" 
      />
    </div>

    <div v-else class="empty-state">
      <p>Không tìm thấy thiết bị phù hợp với bộ lọc của Bác.</p>
      <button class="btn-primary" @click="resetFilter">Xem Tất Cả Sản Phẩm</button>
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

  // Lọc theo đường kính bass
  if (selectedBass.value !== 'all') {
    list = list.filter(p => p.bassSize && p.bassSize.includes(selectedBass.value))
  }

  // Sắp xếp theo giá
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
  padding: 40px 20px 80px;
}

.list-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 2.2rem;
  font-weight: 900;
  color: #fff;
  margin-bottom: 8px;
}

.page-desc {
  font-size: 0.95rem;
  color: #94a3b8;
  max-width: 680px;
}

.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--bg-card);
  padding: 18px 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  margin-bottom: 32px;
}

.category-tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tab-btn {
  background: var(--bg-dark-900);
  border: 1px solid var(--border-color);
  color: #cbd5e1;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tab-btn.active {
  background: var(--color-primary);
  color: #000;
  border-color: var(--color-primary);
  font-weight: 700;
}

.extra-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 14px;
}

.filter-select {
  background: var(--bg-dark-900);
  border: 1px solid var(--border-color);
  color: #cbd5e1;
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.84rem;
  outline: none;
  cursor: pointer;
}

.filter-select:focus {
  border-color: var(--color-primary);
}

.result-counter {
  margin-left: auto;
  font-size: 0.88rem;
  color: #94a3b8;
}

.result-counter strong {
  color: var(--color-primary);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  background: var(--bg-card);
  border-radius: var(--radius-md);
}

.empty-state p {
  color: #94a3b8;
  font-size: 1.05rem;
  margin-bottom: 18px;
}
</style>
