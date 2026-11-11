<template>
  <div class="admin-shell">
    <!-- Backdrop trên Mobile khi mở Drawer -->
    <Transition name="modal-fade">
      <div
        v-if="mobileNavOpen"
        class="sidebar-backdrop"
        @click="mobileNavOpen = false"
      ></div>
    </Transition>

    <!-- Sidebar Điều Hướng Trái -->
    <aside :class="['admin-sidebar', { 'is-open': mobileNavOpen }]">
      <div class="sidebar-brand">
        <div class="brand-logo">TA</div>
        <div class="brand-meta">
          <span class="brand-title">TÚ AUDIO</span>
          <span class="brand-sub">Enterprise Admin v2.0</span>
        </div>
        <button
          type="button"
          class="mobile-close-nav"
          @click="mobileNavOpen = false"
          aria-label="Đóng menu"
        >
          <AdminIcon name="x" :size="18" />
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">Điều Hành Kinh Doanh</div>

        <router-link
          v-if="can('dashboard')"
          to="/admin/dashboard"
          class="nav-item"
          @click="mobileNavOpen = false"
        >
          <AdminIcon name="dashboard" :size="18" />
          <span class="nav-text">Tổng Quan Điều Hành</span>
        </router-link>

        <router-link
          v-if="can('leads')"
          to="/admin/leads"
          class="nav-item"
          @click="mobileNavOpen = false"
        >
          <AdminIcon name="leads" :size="18" />
          <span class="nav-text">Khách Tư Vấn &amp; Thử Dàn</span>
          <span v-if="adminStore.newLeadsCount > 0" class="nav-pill alert">
            {{ adminStore.newLeadsCount }}
          </span>
          <span v-else-if="adminStore.leads.length > 0" class="nav-pill">
            {{ adminStore.leads.length }}
          </span>
        </router-link>

        <router-link
          v-if="can('orders')"
          to="/admin/orders"
          class="nav-item"
          @click="mobileNavOpen = false"
        >
          <AdminIcon name="orders" :size="18" />
          <span class="nav-text">Đơn Đặt Mua Lẻ</span>
          <span v-if="adminStore.newOrdersCount > 0" class="nav-pill alert">
            {{ adminStore.newOrdersCount }}
          </span>
          <span v-else-if="adminStore.orders.length > 0" class="nav-pill">
            {{ adminStore.orders.length }}
          </span>
        </router-link>

        <router-link
          v-if="can('trade-ins')"
          to="/admin/trade-ins"
          class="nav-item"
          @click="mobileNavOpen = false"
        >
          <AdminIcon name="trade-ins" :size="18" />
          <span class="nav-text">Thu Cũ Đổi Mới</span>
          <span v-if="adminStore.pendingTradeInsCount > 0" class="nav-pill warn">
            {{ adminStore.pendingTradeInsCount }}
          </span>
        </router-link>

        <template v-if="can('products') || can('combos')">
          <div class="nav-section-label">Kho Loa &amp; Sản Phẩm</div>

          <router-link
            v-if="can('products')"
            to="/admin/products"
            class="nav-item"
            @click="mobileNavOpen = false"
          >
            <AdminIcon name="products" :size="18" />
            <span class="nav-text">Kho Loa &amp; Chạy Sale</span>
            <span class="nav-pill">{{ adminStore.products.length }}</span>
          </router-link>

          <router-link
            v-if="can('combos')"
            to="/admin/combos"
            class="nav-item"
            @click="mobileNavOpen = false"
          >
            <AdminIcon name="combos" :size="18" />
            <span class="nav-text">Cấu Hình Gói Dàn</span>
            <span class="nav-pill">{{ adminStore.combos.length }}</span>
          </router-link>
        </template>

        <div class="nav-section-label">Hệ Thống &amp; Phân Quyền</div>

        <router-link
          v-if="can('users')"
          to="/admin/users"
          class="nav-item"
          @click="mobileNavOpen = false"
        >
          <AdminIcon name="users" :size="18" />
          <span class="nav-text">Tài Khoản Nhân Sự</span>
        </router-link>

        <router-link to="/" target="_blank" class="nav-item storefront-link">
          <AdminIcon name="globe" :size="18" />
          <span class="nav-text">Mở Trang Khách Hàng</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="profile-box">
          <div class="profile-avatar">{{ userInitials }}</div>
          <div class="profile-info">
            <span class="profile-name">{{ authStore.currentUser?.full_name || 'Quản trị viên' }}</span>
            <span class="profile-role">{{ roleLabel }}</span>
          </div>
          <button
            type="button"
            class="profile-logout"
            @click="handleLogout"
            title="Đăng xuất khỏi hệ thống"
          >
            <AdminIcon name="logout" :size="17" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Khung Nội Dung Chính -->
    <div class="admin-main">
      <!-- Topbar Cố Định Một Hàng Gọn Gàng -->
      <header class="admin-topbar">
        <div class="topbar-left">
          <button
            type="button"
            class="mobile-menu-trigger"
            @click="mobileNavOpen = true"
            aria-label="Mở menu quản trị"
          >
            <AdminIcon name="menu" :size="20" />
          </button>
          <div class="breadcrumb-trail">
            <span class="bc-root">Tú Audio CRM</span>
            <span class="bc-sep">/</span>
            <span class="bc-current">{{ currentRouteTitle }}</span>
          </div>
        </div>

        <div class="topbar-right">
          <router-link
            v-if="can('leads') && adminStore.newLeadsCount > 0"
            to="/admin/leads"
            class="topbar-alert-pill"
          >
            <AdminIcon name="bell" :size="14" />
            <span>{{ adminStore.newLeadsCount }} khách chờ gọi</span>
          </router-link>

          <router-link
            v-if="can('orders') && adminStore.newOrdersCount > 0"
            to="/admin/orders"
            class="topbar-order-pill"
          >
            <AdminIcon name="orders" :size="14" />
            <span>{{ adminStore.newOrdersCount }} đơn mới</span>
          </router-link>

          <div :class="['db-indicator', adminStore.dbConnected ? 'online' : 'offline']">
            <span class="status-dot"></span>
            <span class="db-label">
              {{ adminStore.dbConnected ? 'PostgreSQL Live' : 'Cache Nội Bộ' }}
            </span>
            <span v-if="adminStore.lastSyncedAt" class="db-time">• {{ adminStore.lastSyncedAt }}</span>
          </div>

          <button
            type="button"
            class="topbar-sync-btn"
            :disabled="adminStore.isSyncing"
            @click="adminStore.fetchAllAdminData(false)"
            title="Đồng bộ dữ liệu mới nhất từ Aiven PostgreSQL"
          >
            <AdminIcon name="sync" :size="15" :class="{ spinning: adminStore.isSyncing }" />
            <span>{{ adminStore.isSyncing ? 'Đang tải...' : 'Đồng bộ' }}</span>
          </button>

          <router-link to="/" class="topbar-store-btn" title="Xem giao diện khách hàng">
            <AdminIcon name="globe" :size="15" />
            <span class="hide-sm">Xem Web</span>
          </router-link>

          <button
            type="button"
            class="topbar-logout"
            @click="handleLogout"
            title="Đăng xuất"
          >
            <AdminIcon name="logout" :size="15" />
            <span class="hide-sm">Thoát</span>
          </button>
        </div>
      </header>

      <!-- Thanh Thông Báo Toast -->
      <Transition name="fade-slide">
        <div
          v-if="adminStore.adminNotice"
          :class="['admin-toast', `toast-${adminStore.adminNotice.type}`]"
          role="status"
        >
          <div class="toast-msg">
            <AdminIcon
              :name="adminStore.adminNotice.type === 'error' ? 'alert' : 'check'"
              :size="17"
            />
            <span>{{ adminStore.adminNotice.text || adminStore.adminNotice.message }}</span>
          </div>
          <button
            type="button"
            class="toast-dismiss"
            @click="adminStore.clearNotice"
            aria-label="Đóng thông báo"
          >
            <AdminIcon name="x" :size="16" />
          </button>
        </div>
      </Transition>

      <!-- Nội Dung Từng Phân Hệ -->
      <main class="admin-viewport">
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
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/adminStore'
import { useAuthStore } from '../../stores/authStore'
import { canAccess } from '../../utils/permissions'
import AdminIcon from '../../components/admin/AdminIcon.vue'
import '../../assets/styles/admin.css'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const authStore = useAuthStore()
const mobileNavOpen = ref(false)

const can = (permission) => canAccess(authStore.currentUser?.role, permission)

const roleLabel = computed(() => {
  const map = {
    SUPER_ADMIN: 'Quản trị cấp cao',
    SALES: 'Chuyên viên kinh doanh',
    INVENTORY: 'Quản lý kho thiết bị'
  }
  return map[authStore.currentUser?.role] || 'Nhân sự hệ thống'
})

onMounted(() => {
  adminStore.fetchAllAdminData()
})

const currentRouteTitle = computed(() => {
  if (route.path.includes('leads')) return 'Khách Tư Vấn & Lịch Thử Dàn'
  if (route.path.includes('orders')) return 'Quản Lý Đơn Đặt Mua Lẻ'
  if (route.path.includes('trade-ins')) return 'Thẩm Định Thu Cũ Đổi Mới'
  if (route.path.includes('users')) return 'Tài Khoản & Phân Quyền'
  if (route.path.includes('products')) return 'Kho Loa & Chiến Dịch Sale'
  if (route.path.includes('combos')) return 'Cấu Hình Gói Dàn Karaoke'
  return 'Tổng Quan Điều Hành'
})

const userInitials = computed(() => {
  const name = authStore.currentUser?.full_name || 'TA'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

const handleLogout = () => {
  if (confirm('Anh có chắc chắn muốn đăng xuất khỏi hệ thống quản trị?')) {
    authStore.logout()
    router.push('/admin/login')
  }
}
</script>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
  background:
    radial-gradient(ellipse 70% 45% at 75% -10%, rgba(40, 55, 252, 0.1), transparent),
    #080b14;
  color: #f8fafc;
}

/* Sidebar */
.admin-sidebar {
  width: 264px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #0d111e 0%, #090c16 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 90;
}

.sidebar-brand {
  height: 64px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.brand-logo {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--gradient-gold);
  color: #090b10;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(252, 183, 40, 0.25);
  flex-shrink: 0;
}

.brand-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.brand-title {
  font-family: var(--font-display);
  font-size: 1.02rem;
  font-weight: 800;
  color: #fcb728;
  letter-spacing: 0.04em;
  line-height: 1.15;
}

.brand-sub {
  font-size: 0.69rem;
  color: #64748b;
  font-weight: 600;
}

.mobile-close-nav {
  display: none;
  margin-left: auto;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  align-items: center;
  justify-content: center;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 12px 18px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow-y: auto;
}

.nav-section-label {
  font-size: 0.66rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #475569;
  padding: 14px 10px 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 12px;
  border-radius: 9px;
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid transparent;
  transition: all 0.16s ease;
}

.nav-item:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.04);
}

.nav-item.router-link-active {
  color: #fcb728;
  font-weight: 700;
  background: linear-gradient(90deg, rgba(252, 183, 40, 0.14) 0%, rgba(252, 183, 40, 0.03) 100%);
  border-color: rgba(252, 183, 40, 0.28);
}

.nav-text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-pill {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
  color: #cbd5e1;
}

.nav-pill.alert {
  background: #ef4444;
  color: #fff;
}

.nav-pill.warn {
  background: rgba(245, 158, 11, 0.22);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.storefront-link {
  color: #64748b;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.profile-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.profile-avatar {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: var(--gradient-blue);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-role {
  display: block;
  font-size: 0.7rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-logout {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.16s;
}

.profile-logout:hover {
  background: rgba(239, 68, 68, 0.16);
  color: #fca5a5;
}

/* Main Content Area */
.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.admin-topbar {
  height: 64px;
  padding: 0 24px;
  background: rgba(11, 15, 26, 0.88);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 60;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.mobile-menu-trigger {
  display: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.breadcrumb-trail {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  white-space: nowrap;
}

.bc-root {
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 600;
}

.bc-sep {
  color: #334155;
  font-size: 0.85rem;
}

.bc-current {
  font-size: 0.92rem;
  font-weight: 800;
  color: #f8fafc;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.topbar-alert-pill,
.topbar-order-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 11px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.topbar-alert-pill {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
}

.topbar-order-pill {
  background: rgba(252, 183, 40, 0.14);
  border: 1px solid rgba(252, 183, 40, 0.35);
  color: #fcd34d;
}

.db-indicator {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 11px;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  white-space: nowrap;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.db-indicator.online {
  color: #86efac;
  border-color: rgba(34, 197, 94, 0.26);
  background: rgba(34, 197, 94, 0.08);
}

.db-indicator.online .status-dot {
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

.db-indicator.offline {
  color: #fde047;
  border-color: rgba(234, 179, 8, 0.28);
  background: rgba(234, 179, 8, 0.08);
}

.db-indicator.offline .status-dot {
  background: #eab308;
}

.db-time {
  color: #64748b;
  font-weight: 600;
}

.topbar-sync-btn,
.topbar-store-btn,
.topbar-logout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 11px;
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
  transition: all 0.16s ease;
}

.topbar-sync-btn {
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #93c5fd;
}

.topbar-sync-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.22);
  color: #fff;
}

.topbar-store-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
}

.topbar-store-btn:hover {
  background: rgba(255, 255, 255, 0.09);
  color: #fff;
}

.topbar-logout {
  background: rgba(239, 68, 68, 0.11);
  border: 1px solid rgba(239, 68, 68, 0.28);
  color: #fca5a5;
}

.topbar-logout:hover {
  background: #dc2626;
  border-color: #dc2626;
  color: #fff;
}

.spinning {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Toast Notification */
.admin-toast {
  margin: 14px 24px 0;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 0.84rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toast-msg {
  display: flex;
  align-items: center;
  gap: 9px;
}

.toast-success {
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(16, 185, 129, 0.35);
  color: #6ee7b7;
}

.toast-warning {
  background: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #fcd34d;
}

.toast-error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.38);
  color: #fca5a5;
}

.toast-dismiss {
  background: transparent;
  color: inherit;
  padding: 4px;
  border-radius: 6px;
  display: flex;
}

.admin-viewport {
  padding: 24px;
  flex: 1;
  min-width: 0;
}

.sidebar-backdrop {
  display: none;
}

@media (max-width: 1120px) {
  .db-time,
  .topbar-order-pill {
    display: none;
  }
}

@media (max-width: 960px) {
  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(4, 7, 15, 0.72);
    backdrop-filter: blur(4px);
    z-index: 85;
  }

  .admin-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    box-shadow: 20px 0 50px rgba(0, 0, 0, 0.75);
  }

  .admin-sidebar.is-open {
    transform: translateX(0);
  }

  .mobile-close-nav,
  .mobile-menu-trigger {
    display: inline-flex;
  }

  .bc-root,
  .bc-sep {
    display: none;
  }
}

@media (max-width: 680px) {
  .admin-topbar {
    padding: 0 14px;
    height: 56px;
  }

  .db-label,
  .hide-sm,
  .topbar-alert-pill {
    display: none;
  }

  .db-indicator {
    padding: 0 9px;
  }

  .admin-viewport {
    padding: 14px;
  }

  .admin-toast {
    margin: 12px 14px 0;
  }
}
</style>
