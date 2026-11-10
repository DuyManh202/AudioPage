<template>
  <div class="admin-wrapper">
    <!-- Sidebar bên trái -->
    <aside class="admin-sidebar">
      <div class="sidebar-brand">
        <div class="brand-badge">TA</div>
        <div class="brand-info">
          <span class="title">TÚ AUDIO</span>
          <span class="sub">Hệ Thống Quản Trị</span>
        </div>
      </div>

      <nav class="sidebar-menu">
        <div class="menu-label">ĐIỀU HÀNH BÁN HÀNG</div>
        <router-link v-if="can('dashboard')" to="/admin/dashboard" class="menu-item">
          <span class="icon">📊</span>
          <span>Tổng Quan (Dashboard)</span>
        </router-link>

        <router-link v-if="can('leads')" to="/admin/leads" class="menu-item">
          <span class="icon">📞</span>
          <span>Khách Đăng Ký & Thử Dàn</span>
          <span v-if="adminStore.newLeadsCount > 0" class="badge-count">
            {{ adminStore.newLeadsCount }}
          </span>
        </router-link>

        <router-link v-if="can('orders')" to="/admin/orders" class="menu-item">
          <span class="icon">🛒</span>
          <span>Đơn Đặt Mua Lẻ</span>
          <span v-if="adminStore.newOrdersCount > 0" class="badge-count">
            {{ adminStore.newOrdersCount }}
          </span>
        </router-link>

        <router-link v-if="can('trade-ins')" to="/admin/trade-ins" class="menu-item">
          <span class="icon">🔄</span>
          <span>Thu Cũ Đổi Mới</span>
          <span v-if="adminStore.pendingTradeInsCount > 0" class="badge-count">
            {{ adminStore.pendingTradeInsCount }}
          </span>
        </router-link>

        <div v-if="can('products')" class="menu-label">KHO THIẾT BỊ & GÓI DÀN</div>
        <router-link v-if="can('products')" to="/admin/products" class="menu-item">
          <span class="icon">🔊</span>
          <span>Quản Lý Loa & Thiết Bị</span>
          <span class="item-count">{{ adminStore.products.length }}</span>
        </router-link>

        <router-link v-if="can('combos')" to="/admin/combos" class="menu-item">
          <span class="icon">🎁</span>
          <span>Cấu Hình 2 Gói Dàn (19tr & 29tr)</span>
        </router-link>

        <div class="menu-label">TIỆN ÍCH HỆ THỐNG</div>
        <router-link to="/" class="menu-item external-link">
          <span class="icon">🌐</span>
          <span>Xem Giao Diện Khách Hàng</span>
        </router-link>
        <router-link v-if="can('users')" to="/admin/users" class="menu-item">
          <span class="icon">👥</span><span>Quản Lý Tài Khoản</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="admin-user-card">
          <div class="user-avatar">{{ userInitials }}</div>
          <div class="user-details">
            <span class="user-name">{{ authStore.currentUser.full_name }}</span>
            <span class="user-role">{{ roleLabel }}</span>
          </div>
          <button class="logout-btn" @click="handleLogout" title="Đăng Xuất">
            🚪
          </button>
        </div>
      </div>
    </aside>

    <!-- Khu vực nội dung chính -->
    <div class="admin-main">
      <header class="admin-topbar">
        <div class="topbar-left">
          <span class="breadcrumb-item">Quản Trị</span>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-active">{{ currentRouteTitle }}</span>
        </div>

        <div class="topbar-right">
          <div :class="['db-status-badge', adminStore.dbConnected ? 'db-online' : 'db-local']">
            {{ adminStore.dbConnected ? '🟢 Aiven PostgreSQL Live' : '🟡 Chế Độ Cache Nội Bộ' }}
          </div>
          <div class="location-badge">
            📍 Showroom: Phú Thọ & Phủ sóng 300km
          </div>
          <router-link to="/admin/leads" class="quick-lead-btn" v-if="adminStore.newLeadsCount > 0">
            🔔 {{ adminStore.newLeadsCount }} Yêu Cầu Mới Cần Gọi
          </router-link>
          <button class="topbar-logout-btn" @click="handleLogout" title="Đăng Xuất">
            Đăng Xuất
          </button>
        </div>
      </header>

      <main class="admin-content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/adminStore'
import { useAuthStore } from '../../stores/authStore'
import { canAccess } from '../../utils/permissions'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const authStore = useAuthStore()

const can = (permission) => canAccess(authStore.currentUser.role, permission)
const roleLabel = computed(() => ({ SUPER_ADMIN: 'Quản Trị Viên Cấp Cao', SALES: 'Nhân Viên Kinh Doanh', INVENTORY: 'Quản Lý Kho' })[authStore.currentUser.role] || 'Nhân viên')

onMounted(() => {
  adminStore.fetchAllAdminData()
})

const currentRouteTitle = computed(() => {
  if (route.path.includes('leads')) return 'Khách Hàng Đăng Ký & Thử Dàn Tại Nhà'
  if (route.path.includes('orders')) return 'Quản Lý Đơn Đặt Mua Lẻ (Giỏ Hàng)'
  if (route.path.includes('trade-ins')) return 'Thẩm Định Yêu Cầu Thu Cũ Đổi Mới'
  if (route.path.includes('users')) return 'Quản Lý Tài Khoản Nhân Viên'
  if (route.path.includes('products')) return 'Quản Lý Loa & Thiết Bị'
  if (route.path.includes('combos')) return 'Cấu Hình 2 Gói Dàn Trọn Bộ'
  return 'Bảng Điều Khiển Tổng Quan'
})

const userInitials = computed(() => {
  const name = authStore.currentUser?.full_name || 'PT'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

const handleLogout = () => {
  if (confirm('Bác có chắc chắn muốn đăng xuất khỏi hệ thống quản trị?')) {
    authStore.logout()
    router.push('/admin/login')
  }
}
</script>

<style scoped>
.admin-wrapper {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-dark-900);
  color: var(--text-main);
}

.admin-sidebar {
  width: 280px;
  background: var(--bg-dark-800);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-brand {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.brand-badge {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-primary), #ff9800);
  color: #000;
  font-weight: 900;
  font-size: 1.2rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-info .title {
  display: block;
  font-size: 1.15rem;
  font-weight: 900;
  color: var(--color-primary);
  letter-spacing: 0.5px;
}

.brand-info .sub {
  display: block;
  font-size: 0.72rem;
  color: #94a3b8;
}

.sidebar-menu {
  flex: 1;
  padding: 20px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.menu-label {
  font-size: 0.68rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.5px;
  margin: 16px 8px 6px;
  text-transform: uppercase;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: var(--radius-sm);
  color: #cbd5e1;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;
}

.menu-item .icon {
  font-size: 1.1rem;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}

.menu-item.router-link-active {
  background: rgba(252, 183, 40, 0.12);
  color: var(--color-primary);
  border-left: 3px solid var(--color-primary);
}

.badge-count {
  margin-left: auto;
  background: #ef4444;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 10px;
}

.item-count {
  margin-left: auto;
  font-size: 0.75rem;
  color: #64748b;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

.external-link {
  color: #94a3b8;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.admin-user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.25);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: var(--color-secondary);
  color: #fff;
  font-weight: 800;
  font-size: 0.85rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-name {
  display: block;
  font-size: 0.88rem;
  font-weight: 700;
  color: #fff;
}

.user-role {
  display: block;
  font-size: 0.72rem;
  color: #94a3b8;
}

.logout-btn {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: transform 0.2s, background 0.2s;
  margin-left: auto;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.1);
}

.topbar-logout-btn {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.topbar-logout-btn:hover {
  background: #ef4444;
  color: #fff;
  border-color: #ef4444;
}

.db-status-badge {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: var(--radius-sm);
}

.db-online {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.db-local {
  background: rgba(234, 179, 8, 0.15);
  color: #facc15;
  border: 1px solid rgba(234, 179, 8, 0.3);
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-topbar {
  background: var(--bg-dark-800);
  border-bottom: 1px solid var(--border-color);
  padding: 16px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

.breadcrumb-item {
  color: #64748b;
}

.breadcrumb-sep {
  color: #475569;
}

.breadcrumb-active {
  color: #fff;
  font-weight: 700;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.location-badge {
  font-size: 0.8rem;
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.04);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
}

.quick-lead-btn {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.4);
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 700;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.75; }
}

.admin-content-area {
  padding: 28px;
  flex: 1;
}

@media (max-width: 992px) {
  .admin-sidebar {
    width: 72px;
  }
  .brand-info, .menu-label, .menu-item span:not(.icon), .sidebar-footer {
    display: none;
  }
  .menu-item {
    justify-content: center;
    padding: 12px;
  }
}

@media (max-width: 700px) {
  .admin-wrapper {
    flex-direction: column;
    min-height: 100svh;
  }

  .admin-sidebar {
    position: sticky;
    top: 0;
    z-index: 60;
    width: 100%;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--border-color);
  }

  .sidebar-brand,
  .sidebar-footer {
    display: none;
  }

  .sidebar-menu {
    flex: 0 0 auto;
    flex-direction: row;
    gap: 6px;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 8px 10px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }

  .menu-label {
    display: none;
  }

  .menu-item {
    flex: 0 0 auto;
    justify-content: flex-start;
    gap: 6px;
    padding: 9px 10px;
    white-space: nowrap;
    font-size: 0.74rem;
  }

  .menu-item span:not(.icon) {
    display: inline;
  }

  .menu-item .icon {
    font-size: 0.95rem;
  }

  .menu-item.router-link-active {
    border-left: 0;
    border-bottom: 2px solid var(--color-primary);
  }

  .badge-count,
  .item-count {
    margin-left: 0;
  }

  .admin-main {
    width: 100%;
    min-width: 0;
  }

  .admin-topbar {
    position: relative;
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    padding: 12px 14px;
  }

  .topbar-left {
    flex-wrap: wrap;
    font-size: 0.8rem;
  }

  .breadcrumb-active {
    overflow-wrap: anywhere;
  }

  .topbar-right {
    width: 100%;
    flex-wrap: wrap;
    gap: 7px;
  }

  .db-status-badge,
  .location-badge {
    font-size: 0.68rem;
    padding: 5px 7px;
  }

  .topbar-logout-btn {
    margin-left: auto;
  }

  .quick-lead-btn {
    order: 4;
    width: 100%;
    text-align: center;
  }

  .admin-content-area {
    min-width: 0;
    padding: 12px;
  }

  .admin-content-area .panel-box {
    min-width: 0;
    padding: 14px;
  }

  .admin-content-area .table-responsive,
  .admin-content-area .table-wrap {
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .admin-content-area .admin-table,
  .admin-content-area .table-wrap table {
    min-width: 760px;
  }
}
</style>
