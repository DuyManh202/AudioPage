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
          <button
            type="button"
            class="sync-btn"
            :disabled="adminStore.isLoading"
            @click="adminStore.fetchAllAdminData(false)"
            title="Đồng bộ dữ liệu mới nhất từ máy chủ"
          >
            {{ adminStore.isLoading ? '⏳ Đang tải...' : '🔄 Đồng Bộ' }}
          </button>
          <div :class="['db-status-badge', adminStore.dbConnected ? 'db-online' : 'db-local']">
            {{ adminStore.dbConnected ? '🟢 Aiven PostgreSQL Live' : '🟡 Chế Độ Cache Nội Bộ' }}
          </div>
          <div class="location-badge">
            📍 Showroom: Phú Thọ &amp; Phủ sóng 300km
          </div>
          <router-link to="/admin/leads" class="quick-lead-btn" v-if="can('leads') && adminStore.newLeadsCount > 0">
            🔔 {{ adminStore.newLeadsCount }} Yêu Cầu Mới Cần Gọi
          </router-link>
          <button class="topbar-logout-btn" type="button" @click="handleLogout" title="Đăng Xuất">
            Đăng Xuất
          </button>
        </div>
      </header>

      <Transition name="fade-slide">
        <div
          v-if="adminStore.adminNotice"
          :class="['admin-toast-banner', `toast-${adminStore.adminNotice.type}`]"
          role="status"
        >
          <span>{{ adminStore.adminNotice.message }}</span>
          <button type="button" class="toast-close" @click="adminStore.clearNotice" aria-label="Đóng thông báo">&times;</button>
        </div>
      </Transition>

      <main class="admin-content-area">
        <router-view v-slot="{ Component }">
          <Transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
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
  background:
    radial-gradient(ellipse 75% 45% at 75% 0%, rgba(40, 55, 252, 0.1), transparent),
    var(--bg-dark-900);
  color: var(--text-main);
}

.admin-sidebar {
  width: 276px;
  background: linear-gradient(180deg, #0f1320 0%, #0b0e18 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  box-shadow: 8px 0 30px rgba(0, 0, 0, 0.35);
}

.sidebar-brand {
  padding: 22px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.brand-badge {
  width: 42px;
  height: 42px;
  background: var(--gradient-gold);
  color: #080a10;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.2rem;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 18px rgba(252, 183, 40, 0.28);
}

.brand-info .title {
  display: block;
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: 0.04em;
}

.brand-info .sub {
  display: block;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.sidebar-menu {
  flex: 1;
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.menu-label {
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--text-subtle);
  letter-spacing: 0.06em;
  margin: 16px 10px 6px;
  text-transform: uppercase;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 13px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.88rem;
  font-weight: 600;
  border: 1px solid transparent;
  transition: all 0.22s var(--ease-spring);
}

.menu-item .icon {
  font-size: 1.08rem;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.menu-item.router-link-active {
  background: linear-gradient(135deg, rgba(252, 183, 40, 0.16), rgba(252, 183, 40, 0.05));
  color: var(--color-primary);
  border-color: rgba(252, 183, 40, 0.35);
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(252, 183, 40, 0.1);
}

.badge-count {
  margin-left: auto;
  background: #ef4444;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 999px;
}

.item-count {
  margin-left: auto;
  font-size: 0.74rem;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 7px;
  border-radius: 6px;
}

.external-link {
  color: var(--text-muted);
}

.sidebar-footer {
  padding: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.admin-user-card {
  display: flex;
  align-items: center;
  gap: 11px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  padding: 10px 12px;
  border-radius: var(--radius-md);
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: var(--gradient-blue);
  color: #fff;
  font-weight: 800;
  font-size: 0.85rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  display: block;
  font-size: 0.86rem;
  font-weight: 700;
  color: #fff;
}

.user-role {
  display: block;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.logout-btn {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: transform 0.2s, background 0.2s;
  margin-left: auto;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.08);
}

.topbar-logout-btn {
  background: rgba(239, 68, 68, 0.14);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.35);
  padding: 7px 14px;
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

.sync-btn {
  background: rgba(59, 130, 246, 0.14);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.35);
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  transition: background 0.2s, color 0.2s;
}

.sync-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.28);
  color: #fff;
}

.sync-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.admin-toast-banner {
  margin: 14px 28px 0;
  padding: 11px 16px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 700;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.toast-success {
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid rgba(34, 197, 94, 0.38);
  color: #86efac;
}

.toast-warning {
  background: rgba(234, 179, 8, 0.14);
  border: 1px solid rgba(234, 179, 8, 0.38);
  color: #fde047;
}

.toast-error {
  background: rgba(239, 68, 68, 0.16);
  border: 1px solid rgba(239, 68, 68, 0.42);
  color: #fca5a5;
}

.toast-close {
  background: transparent;
  color: inherit;
  font-size: 1.2rem;
  line-height: 1;
  padding: 2px 6px;
}

.db-status-badge {
  font-size: 0.76rem;
  font-weight: 700;
  padding: 6px 11px;
  border-radius: 999px;
}

.db-online {
  background: rgba(34, 197, 94, 0.14);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.32);
}

.db-local {
  background: rgba(234, 179, 8, 0.14);
  color: #facc15;
  border: 1px solid rgba(234, 179, 8, 0.32);
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-topbar {
  background: rgba(12, 16, 28, 0.84);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 15px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.94rem;
}

.breadcrumb-item {
  color: var(--text-subtle);
}

.breadcrumb-sep {
  color: #475569;
}

.breadcrumb-active {
  color: #fff;
  font-weight: 800;
}

.topbar-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.location-badge {
  font-size: 0.78rem;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 6px 12px;
  border-radius: 999px;
}

.quick-lead-btn {
  background: rgba(239, 68, 68, 0.16);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.42);
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.72; }
}

.admin-content-area {
  padding: 28px;
  flex: 1;
}

/* Shared Polished Surfaces & Tables Across Admin Views */
.admin-content-area :deep(.panel-box),
.admin-content-area :deep(.header-box),
.admin-content-area :deep(.leads-toolbar),
.admin-content-area :deep(.admin-toolbar),
.admin-content-area :deep(.combo-edit-card) {
  background: linear-gradient(180deg, rgba(22, 27, 45, 0.9), rgba(14, 18, 30, 0.96));
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card), var(--inner-highlight);
}

.admin-content-area :deep(.admin-table th) {
  background: rgba(255, 255, 255, 0.025);
  color: var(--text-muted);
  border-bottom: 1px solid rgba(255, 255, 255, 0.09);
}

.admin-content-area :deep(.admin-table tbody tr) {
  transition: background 0.18s ease;
}

.admin-content-area :deep(.admin-table tbody tr:hover) {
  background: rgba(252, 183, 40, 0.04);
}

.admin-content-area :deep(.modal-window) {
  background: linear-gradient(180deg, #161b2d 0%, #101422 100%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.admin-content-area :deep(.filter-chip) {
  border-radius: 999px;
  transition: transform 0.22s var(--ease-spring), border-color 0.2s, background 0.2s, color 0.2s, box-shadow 0.22s;
}

.admin-content-area :deep(.filter-chip:hover) {
  transform: translateY(-1px);
}

.admin-content-area :deep(.filter-chip.active) {
  box-shadow: 0 4px 14px rgba(252, 183, 40, 0.22);
}

.admin-content-area :deep(.status-select) {
  border-radius: 8px;
  padding: 7px 10px;
}

.admin-content-area :deep(.btn-icon),
.admin-content-area :deep(.btn-del),
.admin-content-area :deep(.btn-outline-sm),
.admin-content-area :deep(.action-btn) {
  border-radius: 8px;
  transition: background 0.22s, transform 0.22s var(--ease-spring), border-color 0.2s, box-shadow 0.22s;
}

.admin-content-area :deep(.btn-icon:hover),
.admin-content-area :deep(.btn-del:hover),
.admin-content-area :deep(.btn-outline-sm:hover),
.admin-content-area :deep(.action-btn:hover) {
  transform: translateY(-1px);
}

.admin-content-area :deep(.btn-icon:active),
.admin-content-area :deep(.btn-del:active) {
  transform: scale(0.95);
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
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .sidebar-menu::-webkit-scrollbar {
    display: none;
  }

  .menu-label {
    display: none;
  }

  .menu-item {
    flex: 0 0 auto;
    justify-content: flex-start;
    gap: 6px;
    padding: 8px 11px;
    white-space: nowrap;
    font-size: 0.76rem;
    border-radius: 999px;
  }

  .menu-item span:not(.icon) {
    display: inline;
  }

  .menu-item .icon {
    font-size: 0.95rem;
  }

  .menu-item.router-link-active {
    border-color: rgba(252, 183, 40, 0.45);
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
    font-size: 0.82rem;
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
    padding: 5px 9px;
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
