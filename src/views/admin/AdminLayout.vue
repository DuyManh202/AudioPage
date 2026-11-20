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
        <BrandLogo theme="dark" :height="36" tagline="Enterprise Admin v2.0" />
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
          v-if="can('facebook-care')"
          to="/admin/facebook-care"
          class="nav-item"
          @click="mobileNavOpen = false"
        >
          <AdminIcon name="message" :size="18" />
          <span class="nav-text">Chăm Sóc Facebook</span>
        </router-link>

        <router-link
          v-if="can('ai-chat')"
          to="/admin/ai-chat"
          class="nav-item"
          @click="mobileNavOpen = false"
        >
          <AdminIcon name="bot" :size="18" />
          <span class="nav-text">Trợ Lý AI Chatbot</span>
        </router-link>

        <router-link
          v-if="can('customer-map')"
          to="/admin/customer-map"
          class="nav-item"
          @click="mobileNavOpen = false"
        >
          <AdminIcon name="map" :size="18" />
          <span class="nav-text">Bản Đồ Khách Hàng</span>
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

        <router-link
          v-if="can('audit-logs')"
          to="/admin/audit-logs"
          class="nav-item"
          @click="mobileNavOpen = false"
        >
          <AdminIcon name="history" :size="18" />
          <span class="nav-text">Lịch Sử Thao Tác</span>
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

          <!-- Nút định vị GPS chính xác cao -->
          <button
            type="button"
            class="topbar-geo-pill"
            :class="{ 'is-gps': cachedAdminGeo?.isGps }"
            @click="requestPreciseGps(true)"
            :title="cachedAdminGeo?.isGps ? 'Đã nhận diện GPS chính xác từng mét (Bấm để định vị lại)' : 'Đang định vị qua IP mạng (Bấm để lấy GPS chính xác từng mét)'"
          >
            <span class="geo-icon">{{ cachedAdminGeo?.isGps ? '🎯' : '📍' }}</span>
            <span class="geo-text">{{ isLocatingGps ? 'Đang dò GPS...' : (currentGeoLabel || 'Định vị GPS') }}</span>
          </button>

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

      <!-- Thông báo nổi phong cách iOS -->
      <Transition name="ios-toast">
        <div
          v-if="adminStore.adminNotice"
          :class="['admin-toast', `toast-${adminStore.adminNotice.type}`]"
          role="status"
          aria-live="polite"
        >
          <span class="toast-symbol" aria-hidden="true">
            <AdminIcon
              :name="['error', 'warning'].includes(adminStore.adminNotice.type) ? 'alert' : 'check'"
              :size="18"
            />
          </span>
          <div class="toast-copy">
            <strong class="toast-title">
              {{ adminStore.adminNotice.type === 'error' ? 'Có lỗi xảy ra' : adminStore.adminNotice.type === 'warning' ? 'Lưu ý' : 'Thành công' }}
            </strong>
            <span class="toast-text">{{ adminStore.adminNotice.text || adminStore.adminNotice.message }}</span>
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

      <!-- Hộp Thoại Xác Nhận Tùy Chỉnh Hiện Đại (Thay thế hoàn toàn window.confirm mặc định) -->
      <Transition name="confirm-modal-pop">
        <div
          v-if="adminStore.confirmModal"
          class="adm-confirm-backdrop"
          @click.self="adminStore.confirmModal.resolve(false)"
        >
          <div class="adm-confirm-dialog" role="dialog" aria-modal="true">
            <div :class="['confirm-icon-bubble', `type-${adminStore.confirmModal.type || 'danger'}`]">
              <svg v-if="adminStore.confirmModal.type === 'danger'" viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              <svg v-else-if="adminStore.confirmModal.type === 'warning'" viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>

            <div class="confirm-body-text">
              <h3 class="confirm-head-title">{{ adminStore.confirmModal.title }}</h3>
              <p class="confirm-desc-msg">{{ adminStore.confirmModal.message }}</p>
            </div>

            <div class="confirm-btns-group">
              <button
                type="button"
                class="confirm-action-btn cancel"
                @click="adminStore.confirmModal.resolve(false)"
              >
                {{ adminStore.confirmModal.cancelText || 'Hủy bỏ' }}
              </button>
              <button
                type="button"
                :class="['confirm-action-btn', adminStore.confirmModal.type === 'danger' ? 'danger' : 'primary']"
                @click="adminStore.confirmModal.resolve(true)"
              >
                {{ adminStore.confirmModal.confirmText || 'Xác nhận' }}
              </button>
            </div>
          </div>
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

      <!-- Thanh Điều Hướng Dưới Mobile (Apple iOS Style Bottom Tab Bar) -->
      <nav class="admin-mobile-tabbar" aria-label="Điều hướng nhanh điện thoại">
        <router-link to="/admin/dashboard" class="mobile-tab-item">
          <AdminIcon name="dashboard" :size="20" />
          <span>Tổng quan</span>
        </router-link>

        <router-link to="/admin/facebook-care" class="mobile-tab-item">
          <AdminIcon name="message" :size="20" />
          <span>Facebook</span>
        </router-link>

        <router-link to="/admin/leads" class="mobile-tab-item">
          <div class="tab-icon-wrap">
            <AdminIcon name="leads" :size="20" />
            <span v-if="adminStore.newLeadsCount > 0" class="mobile-badge">{{ adminStore.newLeadsCount }}</span>
          </div>
          <span>Khách CRM</span>
        </router-link>

        <router-link to="/admin/orders" class="mobile-tab-item">
          <div class="tab-icon-wrap">
            <AdminIcon name="orders" :size="20" />
            <span v-if="adminStore.newOrdersCount > 0" class="mobile-badge">{{ adminStore.newOrdersCount }}</span>
          </div>
          <span>Đơn hàng</span>
        </router-link>

        <button type="button" class="mobile-tab-item" @click="mobileNavOpen = true" aria-label="Mở tất cả menu">
          <AdminIcon name="menu" :size="20" />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/adminStore'
import { useAuthStore } from '../../stores/authStore'
import { canAccessMenu } from '../../utils/permissions'
import { apiRequest } from '../../utils/api'
import AdminIcon from '../../components/admin/AdminIcon.vue'
import BrandLogo from '../../components/common/BrandLogo.vue'
import '../../assets/styles/admin.css'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const authStore = useAuthStore()
const mobileNavOpen = ref(false)

const can = (permission) => canAccessMenu(authStore.currentUser, permission)

const roleLabel = computed(() => {
  const map = {
    SUPER_ADMIN: 'Quản trị cấp cao',
    SALES: 'Chuyên viên kinh doanh',
    INVENTORY: 'Quản lý kho thiết bị',
    CUSTOM: 'Quyền hạn tùy chỉnh'
  }
  return map[authStore.currentUser?.role] || 'Nhân sự hệ thống'
})

let heartbeatTimer = null
let cachedAdminGeo = null
const isLocatingGps = ref(false)
const currentGeoLabel = ref('Đang xác định...')

const updateGeoLabel = () => {
  if (cachedAdminGeo?.city) {
    currentGeoLabel.value = cachedAdminGeo.city
  }
}

const getAdminGeo = async () => {
  if (cachedAdminGeo) return cachedAdminGeo
  try {
    const saved = sessionStorage.getItem('tuaudio_admin_geo')
    if (saved) {
      cachedAdminGeo = JSON.parse(saved)
      updateGeoLabel()
      return cachedAdminGeo
    }
  } catch {}

  try {
    const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(3500) })
    if (res.ok) {
      const data = await res.json()
      if (data && data.success) {
        const city = (data.city || '').trim()
        const region = (data.region || '').replace(/^Tinh\s+/i, '').replace(/^Tỉnh\s+/i, '').trim()
        
        const accentMap = {
          'Vinh Yen': 'Vĩnh Yên',
          'Phu Tho': 'Phú Thọ',
          'Hanoi': 'Hà Nội',
          'Ha Noi': 'Hà Nội',
          'Ho Chi Minh City': 'TP. Hồ Chí Minh',
          'Da Nang': 'Đà Nẵng',
          'Hai Phong': 'Hải Phòng',
          'Can Tho': 'Cần Thơ',
          'Vinh Phuc': 'Vĩnh Phúc',
          'Thai Nguyen': 'Thái Nguyên',
          'Bac Ninh': 'Bắc Ninh',
          'Viet Tri': 'Việt Trì',
          'Vinh': 'Vinh',
          'Thanh Hoa': 'Thanh Hóa',
          'Nam Dinh': 'Nam Định'
        }
        const vCity = accentMap[city] || city
        const vRegion = accentMap[region] || region
        const locString = vCity && vRegion && vCity !== vRegion ? `${vCity} / ${vRegion}` : (vCity || vRegion || data.country || 'Việt Nam')
        
        cachedAdminGeo = {
          city: locString,
          country: data.country || 'Việt Nam',
          ip: data.ip,
          isGps: false
        }
        try {
          sessionStorage.setItem('tuaudio_admin_geo', JSON.stringify(cachedAdminGeo))
        } catch {}
        updateGeoLabel()
        return cachedAdminGeo
      }
    }
  } catch {
    // Không gián đoạn nếu mạng chậm hoặc ngoại tuyến
  }
  return null
}

const requestPreciseGps = async (manualClick = false) => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    if (manualClick) {
      adminStore.showNotice({
        type: 'warning',
        title: 'Thiết bị không hỗ trợ GPS',
        message: 'Trình duyệt hoặc máy tính của bạn không hỗ trợ Geolocation API.'
      })
    }
    return
  }

  isLocatingGps.value = true

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      isLocatingGps.value = false
      const { latitude, longitude } = pos.coords
      let preciseAddress = null

      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=vi`,
          { signal: AbortSignal.timeout(4000) }
        )
        if (res.ok) {
          const data = await res.json()
          const locality = data.locality || data.neighbourhood || ''
          const city = data.city || ''
          const province = data.principalSubdivision || ''
          const parts = [locality, city, province].filter(Boolean)
          if (parts.length > 0) {
            preciseAddress = parts.join(', ')
          }
        }
      } catch {}

      if (!preciseAddress) {
        try {
          const res = await fetch(
            `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`,
            { signal: AbortSignal.timeout(4000) }
          )
          if (res.ok) {
            const data = await res.json()
            const p = data?.features?.[0]?.properties
            if (p) {
              const parts = [p.name || p.street, p.district || p.suburb, p.city || p.county, p.state].filter(Boolean)
              if (parts.length > 0) preciseAddress = parts.join(', ')
            }
          }
        } catch {}
      }

      const display = preciseAddress ? `🎯 ${preciseAddress}` : `🎯 GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`

      cachedAdminGeo = {
        city: display,
        country: 'Việt Nam',
        isGps: true,
        coords: { lat: latitude, lng: longitude }
      }
      try {
        sessionStorage.setItem('tuaudio_admin_geo', JSON.stringify(cachedAdminGeo))
      } catch {}

      updateGeoLabel()
      sendHeartbeat()

      if (manualClick) {
        adminStore.showNotice({
          type: 'success',
          title: 'Đã nhận diện GPS chính xác!',
          message: `Vị trí phiên của bạn: ${display}`
        })
      }
    },
    (err) => {
      isLocatingGps.value = false
      if (manualClick) {
        let msg = 'Chưa cấp quyền truy cập vị trí. Bạn có thể bấm biểu tượng ổ khóa 🔒 trên thanh địa chỉ, chọn Cho phép vị trí (Location -> Allow) rồi thử lại.'
        adminStore.showNotice({
          type: 'warning',
          title: 'Chưa thể lấy GPS',
          message: msg
        })
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  )
}

const sendHeartbeat = async () => {
  if (!authStore.isAuthenticated) return
  try {
    const geo = await getAdminGeo()
    await apiRequest('/admin/heartbeat', {
      method: 'POST',
      body: JSON.stringify({
        page: route.path,
        pageTitle: currentRouteTitle.value,
        clientLocation: geo?.city || null
      })
    })
  } catch {
    // Giữ kết nối im lặng
  }
}

onMounted(async () => {
  adminStore.fetchAllAdminData()
  await getAdminGeo()
  sendHeartbeat()
  heartbeatTimer = setInterval(sendHeartbeat, 30000)

  // Nếu trình duyệt đã cấp quyền vị trí, tự động lấy GPS chính xác
  if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
    navigator.permissions.query({ name: 'geolocation' }).then(result => {
      if (result.state === 'granted') {
        requestPreciseGps(false)
      }
    }).catch(() => {})
  }
})

onUnmounted(() => {
  if (heartbeatTimer) clearInterval(heartbeatTimer)
})

watch(() => route.path, () => {
  sendHeartbeat()
})

const currentRouteTitle = computed(() => {
  if (route.path.includes('facebook-care')) return 'Chăm Sóc Facebook Page'
  if (route.path.includes('customer-map')) return 'Bản Đồ Khách Hàng'
  if (route.path.includes('leads')) return 'Khách Tư Vấn & Lịch Thử Dàn'
  if (route.path.includes('orders')) return 'Quản Lý Đơn Đặt Mua Lẻ'
  if (route.path.includes('trade-ins')) return 'Thẩm Định Thu Cũ Đổi Mới'
  if (route.path.includes('users')) return 'Tài Khoản & Phân Quyền'
  if (route.path.includes('audit-logs')) return 'Nhật Ký Lịch Sử Thao Tác'
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

const handleLogout = async () => {
  const ok = await adminStore.confirm({
    title: 'Đăng xuất quản trị',
    message: 'Anh có chắc chắn muốn đăng xuất khỏi hệ thống quản trị Tú Audio CRM?',
    confirmText: 'Đăng xuất',
    cancelText: 'Ở lại',
    type: 'warning'
  })
  if (ok) {
    authStore.logout()
    router.push('/admin/login')
  }
}
</script>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
  background: #f1f5f9;
  color: #0f172a;
  width: 100%;
}

/* Sidebar (Fixed on Desktop so it never scrolls away or gets cut off) */
.admin-sidebar {
  width: 264px;
  flex-shrink: 0;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  height: 100vh;
  z-index: 90;
}

.sidebar-brand {
  height: 64px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #e2e8f0;
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
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
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
  color: #0f172a;
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
  background: #f1f5f9;
  color: #475569;
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
  color: #94a3b8;
  padding: 14px 10px 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 12px;
  border-radius: 9px;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid transparent;
  transition: all 0.16s ease;
}

.nav-item:hover {
  color: #0f172a;
  background: #f8fafc;
}

.nav-item.router-link-active {
  color: #1d4ed8;
  font-weight: 700;
  background: #eff6ff;
  border-color: #bfdbfe;
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
  background: #f1f5f9;
  color: #475569;
}

.nav-pill.alert {
  background: #ef4444;
  color: #fff;
}

.nav-pill.warn {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.storefront-link {
  color: #64748b;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid #e2e8f0;
}

.profile-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
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
  color: #0f172a;
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
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.16s;
}

.profile-logout:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Main Content Area */
.admin-main {
  flex: 1;
  min-width: 0;
  margin-left: 264px;
  width: calc(100% - 264px);
  display: flex;
  flex-direction: column;
}

.admin-topbar {
  height: 64px;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid #e2e8f0;
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
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #0f172a;
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
  color: #cbd5e1;
  font-size: 0.85rem;
}

.bc-current {
  font-size: 0.92rem;
  font-weight: 800;
  color: #0f172a;
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
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.topbar-order-pill {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #b45309;
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
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  white-space: nowrap;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.db-indicator.online {
  color: #15803d;
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.db-indicator.online .status-dot {
  background: #16a34a;
  box-shadow: 0 0 6px rgba(22, 163, 74, 0.45);
}

.db-indicator.offline {
  color: #b45309;
  border-color: #fde68a;
  background: #fffbeb;
}

.db-indicator.offline .status-dot {
  background: #d97706;
}

.db-time {
  color: #64748b;
  font-weight: 600;
}

.topbar-geo-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 11px;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 700;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
  cursor: pointer;
  white-space: nowrap;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.2s ease;
}

.topbar-geo-pill:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #0f172a;
}

.topbar-geo-pill.is-gps {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #15803d;
}

.topbar-geo-pill .geo-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
}

.topbar-sync-btn:hover:not(:disabled) {
  background: #dbeafe;
  color: #1e40af;
}

.topbar-store-btn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
}

.topbar-store-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.topbar-logout {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
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

/* iOS-style notification */
.admin-toast {
  position: fixed;
  top: max(84px, calc(env(safe-area-inset-top) + 72px));
  right: 22px;
  z-index: 2100;
  width: min(390px, calc(100vw - 28px));
  padding: 14px 14px 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.94);
  color: #172033;
  font-size: 0.84rem;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) 28px;
  align-items: center;
  gap: 11px;
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.18), 0 2px 8px rgba(15, 23, 42, 0.07);
  backdrop-filter: blur(22px) saturate(1.4);
  -webkit-backdrop-filter: blur(22px) saturate(1.4);
}

.toast-symbol {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toast-title {
  color: #151b27;
  font-size: 0.84rem;
  font-weight: 800;
  line-height: 1.25;
}

.toast-text {
  color: #586174;
  font-size: 0.78rem;
  font-weight: 500;
  line-height: 1.45;
}

.toast-success {
  border-color: rgba(34, 197, 94, 0.16);
}

.toast-success .toast-symbol {
  background: #e8f9ef;
  color: #159447;
}

.toast-warning {
  border-color: rgba(245, 158, 11, 0.2);
}

.toast-warning .toast-symbol {
  background: #fff4d8;
  color: #c47700;
}

.toast-error {
  border-color: rgba(239, 68, 68, 0.18);
}

.toast-error .toast-symbol {
  background: #feecec;
  color: #d83232;
}

.toast-dismiss {
  width: 28px;
  height: 28px;
  background: rgba(15, 23, 42, 0.055);
  color: #788193;
  padding: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.16s ease, color 0.16s ease;
}

.toast-dismiss:hover {
  background: rgba(15, 23, 42, 0.11);
  color: #273246;
}

.ios-toast-enter-active,
.ios-toast-leave-active {
  transition: opacity 0.24s ease, transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.ios-toast-enter-from,
.ios-toast-leave-to {
  opacity: 0;
  transform: translate3d(0, -12px, 0) scale(0.97);
}

.admin-viewport {
  padding: 24px;
  flex: 1;
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
}

.sidebar-backdrop {
  display: none;
}

/* ========================================================
   APPLE iOS MOBILE BOTTOM TAB BAR (<768PX)
   ======================================================== */
.admin-mobile-tabbar {
  display: none;
}

@media (max-width: 768px) {
  .admin-mobile-tabbar {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    height: calc(56px + env(safe-area-inset-bottom, 0px));
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.04);
    justify-content: space-around;
    align-items: center;
  }

  .admin-viewport {
    padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important;
  }

  .mobile-tab-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    color: #8e8e93;
    font-size: 0.68rem;
    font-weight: 600;
    text-decoration: none;
    border: none;
    background: transparent;
    padding: 6px 12px 10px;
    border-radius: 10px;
    cursor: pointer;
    transition: color 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.12s ease;
  }

  .mobile-tab-item:active {
    transform: scale(0.92);
  }

  .mobile-tab-item.router-link-active {
    color: #007aff;
    font-weight: 750;
  }

  .mobile-tab-item.router-link-active::after {
    content: '';
    position: absolute;
    bottom: 3px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #007aff;
    box-shadow: 0 0 6px rgba(0, 122, 255, 0.7);
    animation: appleBadgePulse 2.5s infinite ease-in-out;
  }

  .tab-icon-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-badge {
    position: absolute;
    top: -4px;
    right: -8px;
    background: #ff3b30;
    color: #ffffff;
    font-size: 0.58rem;
    font-weight: 800;
    padding: 1px 5px;
    border-radius: 999px;
    min-width: 14px;
    text-align: center;
    box-shadow: 0 1px 4px rgba(255, 59, 48, 0.4);
  }
}

@media (max-width: 1120px) {
  .db-time,
  .topbar-order-pill {
    display: none;
  }
}

@media (max-width: 960px) {
  .admin-shell {
    overflow-x: hidden;
    max-width: 100vw;
  }

  .admin-main {
    margin-left: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: hidden;
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(4px);
    z-index: 2000;
  }

  .admin-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), visibility 0.25s;
    box-shadow: none;
    visibility: hidden;
    z-index: 2010;
  }

  .admin-sidebar.is-open {
    transform: translateX(0);
    box-shadow: 20px 0 50px rgba(15, 23, 42, 0.3);
    visibility: visible;
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
    padding: 0 10px;
    height: 52px;
  }

  .topbar-left {
    gap: 8px;
    min-width: 0;
    flex-shrink: 1;
  }

  .topbar-right {
    gap: 6px;
    flex-shrink: 0;
  }

  .topbar-geo-pill {
    max-width: 100px;
    padding: 0 8px;
    height: 30px;
  }

  .topbar-geo-pill .geo-text {
    max-width: 62px;
    font-size: 0.67rem;
  }

  .topbar-sync-btn span {
    display: none;
  }

  .topbar-sync-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    justify-content: center;
    border-radius: 50%;
  }

  .topbar-store-btn,
  .topbar-logout {
    width: 32px;
    height: 32px;
    padding: 0;
    justify-content: center;
    border-radius: 50%;
  }

  .db-label,
  .hide-sm,
  .topbar-alert-pill {
    display: none;
  }

  .db-indicator {
    padding: 0 8px;
    height: 28px;
  }

  .admin-viewport {
    padding: 12px;
  }

  .admin-toast {
    top: max(60px, calc(env(safe-area-inset-top) + 54px));
    right: 10px;
    width: calc(100vw - 20px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ios-toast-enter-active,
  .ios-toast-leave-active,
  .confirm-modal-pop-enter-active,
  .confirm-modal-pop-leave-active {
    transition: none;
  }
}

/* ========================================================
   HỘP THOẠI XÁC NHẬN TÙY CHỈNH (CUSTOM CONFIRM MODAL)
   ======================================================== */
.adm-confirm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  z-index: 9999;
  padding: 16px;
}

.adm-confirm-dialog {
  background: #ffffff;
  border-radius: 20px;
  width: 100%;
  max-width: 420px;
  padding: 26px 24px 22px;
  box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  position: relative;
}

.confirm-icon-bubble {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex: none;
}
.confirm-icon-bubble.type-danger {
  background: #fef2f2;
  color: #dc2626;
  box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.12);
}
.confirm-icon-bubble.type-warning {
  background: #fffbeb;
  color: #d97706;
  box-shadow: 0 0 0 8px rgba(217, 119, 6, 0.12);
}
.confirm-icon-bubble.type-info {
  background: #eff6ff;
  color: #2563eb;
  box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.12);
}

.confirm-body-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.confirm-head-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.01em;
}
.confirm-desc-msg {
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.55;
  margin: 0;
}

.confirm-btns-group {
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 6px;
}
.confirm-action-btn {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
  border: none;
  display: grid;
  place-items: center;
}
.confirm-action-btn.cancel {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}
.confirm-action-btn.cancel:hover {
  background: #e2e8f0;
  color: #0f172a;
}
.confirm-action-btn.danger {
  background: #dc2626;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);
}
.confirm-action-btn.danger:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}
.confirm-action-btn.primary {
  background: #00b1a9;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(0, 177, 169, 0.35);
}
.confirm-action-btn.primary:hover {
  background: #008080;
  transform: translateY(-1px);
}

/* Hiệu ứng Pop-in động */
.confirm-modal-pop-enter-active,
.confirm-modal-pop-leave-active {
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
.confirm-modal-pop-enter-from,
.confirm-modal-pop-leave-to {
  opacity: 0;
}
.confirm-modal-pop-enter-from .adm-confirm-dialog,
.confirm-modal-pop-leave-to .adm-confirm-dialog {
  transform: scale(0.92) translateY(10px);
}
</style>
