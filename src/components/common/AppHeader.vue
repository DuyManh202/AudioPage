<template>
  <header class="app-header">
    <div class="top-announcement">
      <div class="container flex-between">
        <span>🚚 Lắp đặt & Cân chỉnh tận nhà miễn phí bán kính 300km quanh Hà Nội - Phú Thọ</span>
        <div class="top-contact">
          <span>Hotline Kỹ Thuật: <strong>098x.xxx.xxx</strong> (Anh Tú)</span>
          <router-link to="/admin" class="admin-entry-link">⚙️ Quản Trị</router-link>
        </div>
      </div>
    </div>

    <div class="main-nav">
      <div class="container header-grid">
        <router-link to="/" class="brand-logo">
          <div class="logo-symbol">TA</div>
          <div class="logo-text">
            <span class="logo-title">TÚ AUDIO</span>
            <span class="logo-slogan">Âm Thanh Chuẩn Phòng Hát</span>
          </div>
        </router-link>

        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Tìm loa full 30, sub 40, vang số K9, dàn 29 triệu..." 
            @input="handleSearch"
          />
          <button class="search-btn">Tìm Kiếm</button>
        </div>

        <div class="header-actions">
          <router-link to="/dan-karaoke" class="combo-link">
            🔥 Dàn 19tr & 29tr
          </router-link>
          <button class="cart-header-btn" @click="cartStore.openCart" title="Mở Giỏ Hàng">
            🛒 Giỏ Hàng
            <span v-if="cartStore.totalItems > 0" class="cart-badge">{{ cartStore.totalItems }}</span>
          </button>
          <button class="consult-btn" @click="openConsult">
            📞 Tư Vấn Tại Nhà
          </button>
        </div>
      </div>
    </div>

    <nav class="sub-nav">
      <div class="container nav-links">
        <router-link to="/">Trang Chủ</router-link>
        <router-link to="/dan-karaoke">Dàn Karaoke Trọn Bộ</router-link>
        <router-link to="/san-pham">Tất Cả Loa & Thiết Bị</router-link>
        <a href="#calculator" @click.prevent="scrollToCalc">Gợi Ý Loa Theo Phòng</a>
        <router-link to="/thu-cu-doi-moi">Thu Cũ Đổi Mới</router-link>
        <a href="#nhan-ebook" @click.prevent="scrollToEbook">🎁 Nhận Ebook Free</a>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '../../stores/productStore'
import { useCartStore } from '../../stores/cartStore'

const router = useRouter()
const productStore = useProductStore()
const cartStore = useCartStore()
const searchQuery = ref('')

const handleSearch = () => {
  productStore.setSearchQuery(searchQuery.value)
  if (router.currentRoute.value.path !== '/san-pham') {
    router.push('/san-pham')
  }
}

const openConsult = () => {
  cartStore.openQuickOrder({ name: 'Đăng Ký Tư Vấn Dàn Karaoke Tại Nhà' })
}

const scrollToCalc = () => {
  if (router.currentRoute.value.path !== '/') {
    router.push('/').then(() => {
      document.getElementById('room-calculator')?.scrollIntoView({ behavior: 'smooth' })
    })
  } else {
    document.getElementById('room-calculator')?.scrollIntoView({ behavior: 'smooth' })
  }
}

const scrollToEbook = () => {
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
  background-color: var(--bg-dark-900);
  border-bottom: 1px solid var(--border-color);
}

.top-announcement {
  background: linear-gradient(90deg, #1b1e2e, #2837FC);
  color: #f1f5f9;
  font-size: 0.82rem;
  padding: 6px 0;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.top-contact {
  display: flex;
  align-items: center;
  gap: 14px;
}

.admin-entry-link {
  background: rgba(255, 255, 255, 0.12);
  color: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s;
}

.admin-entry-link:hover {
  background: var(--color-primary);
  color: #000;
}

.main-nav {
  padding: 14px 0;
  background: var(--bg-dark-800);
}

.header-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-symbol {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, var(--color-primary), #ff9800);
  color: #000;
  font-weight: 900;
  font-size: 1.3rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-glow);
}

.logo-title {
  display: block;
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 1px;
  color: var(--color-primary);
}

.logo-slogan {
  display: block;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.search-box {
  flex: 1;
  max-width: 520px;
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-dark-900);
}

.search-box input {
  flex: 1;
  padding: 10px 16px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 0.9rem;
  outline: none;
}

.search-btn {
  background: var(--color-primary);
  color: #000;
  font-weight: 700;
  padding: 0 18px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.combo-link {
  color: var(--color-primary);
  font-weight: 700;
  font-size: 0.9rem;
  padding: 8px 12px;
  border: 1px dashed var(--color-primary);
  border-radius: var(--radius-sm);
}

.cart-header-btn {
  background: var(--bg-dark-900);
  color: #fff;
  border: 1px solid var(--border-color);
  font-weight: 700;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: border-color 0.2s;
}

.cart-header-btn:hover {
  border-color: var(--color-primary);
}

.cart-badge {
  background: var(--color-primary);
  color: #000;
  font-size: 0.72rem;
  font-weight: 900;
  padding: 1px 6px;
  border-radius: 10px;
}

.consult-btn {
  background: var(--color-secondary);
  color: #fff;
  font-weight: 700;
  padding: 9px 16px;
  border-radius: var(--radius-md);
  font-size: 0.88rem;
}

.sub-nav {
  background: var(--bg-dark-900);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.nav-links {
  display: flex;
  gap: 28px;
  padding: 10px 0;
  font-size: 0.92rem;
  font-weight: 600;
}

.nav-links a {
  color: #cbd5e1;
  transition: color 0.2s;
}

.nav-links a:hover, .nav-links a.router-link-active {
  color: var(--color-primary);
}

@media (max-width: 900px) {
  .header-grid {
    flex-wrap: wrap;
  }
  .search-box {
    order: 3;
    max-width: 100%;
    width: 100%;
  }
}
</style>
