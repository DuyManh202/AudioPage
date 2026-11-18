<template>
  <div class="adm-page customer-map-page">
    <!-- Header -->
    <div class="adm-page-head">
      <div>
        <h1 class="adm-page-title">Bản đồ khách hàng</h1>
        <p class="adm-page-sub">Khách từ Fanpage và CRM, ghim theo tỉnh/thành được nhắc trong hội thoại hoặc hồ sơ.</p>
      </div>
      <div class="head-actions">
        <button class="adm-btn refresh-btn" :disabled="busy" @click="loadData">
          {{ busy ? 'Đang tải…' : '↻ Làm mới' }}
        </button>
      </div>
    </div>

    <!-- Mobile View Tabs Switcher (Hiển thị nổi bật trên điện thoại) -->
    <div class="mobile-view-tabs" role="tablist" aria-label="Chế độ xem trên điện thoại">
      <button
        type="button"
        role="tab"
        :aria-selected="mobileTab === 'map'"
        :class="['mobile-tab-btn', { active: mobileTab === 'map' }]"
        @click="switchMobileTab('map')"
      >
        <span class="tab-icon">🗺️</span>
        <span class="tab-label">Bản đồ</span>
        <span class="tab-count">{{ visibleCustomers.length }}</span>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="mobileTab === 'list'"
        :class="['mobile-tab-btn', { active: mobileTab === 'list' }]"
        @click="switchMobileTab('list')"
      >
        <span class="tab-icon">📋</span>
        <span class="tab-label">Danh sách</span>
        <span class="tab-count">{{ visibleCustomers.length }}</span>
      </button>
    </div>

    <!-- Thông báo khoảng cách (Collapsible trên Mobile để không chiếm chỗ) -->
    <div class="map-notice" :class="{ 'is-collapsed': !noticeExpanded }">
      <div class="notice-summary" @click="noticeExpanded = !noticeExpanded">
        <span class="notice-icon">ℹ️</span>
        <span class="notice-text">
          <strong>Khoảng cách ước tính:</strong> Điểm ghim tính từ trung tâm tỉnh/thành, không phải vị trí chính xác của nhà khách.
        </span>
        <button type="button" class="notice-toggle-btn" :aria-expanded="noticeExpanded">
          {{ noticeExpanded ? 'Thu gọn ▲' : 'Chi tiết ▼' }}
        </button>
      </div>
      <p v-if="noticeExpanded" class="notice-detail">
        Số km được tính theo đường chim bay từ cửa hàng hoặc vị trí GPS của bạn, không phải quãng đường lái xe thực tế.
      </p>
    </div>

    <!-- Thẻ gợi ý đơn giao tiếp theo (Gọn gàng trên Mobile) -->
    <section v-if="deliveryLocation" class="delivery-next adm-card">
      <div class="delivery-next-head">
        <div>
          <strong>Đơn giao tiếp theo gần bạn</strong>
          <small>
            <i :class="['gps-indicator', { active: trackingLocation }]"></i>
            {{ trackingLocation ? 'GPS đang bật' : 'GPS tắt' }}
            <span v-if="deliveryLocation.updatedAt">· {{ formatVisitTime(deliveryLocation.updatedAt) }}</span>
          </small>
        </div>
        <button
          type="button"
          class="adm-btn gps-btn"
          :disabled="locationBusy"
          @click="toggleLocationTracking"
        >
          {{ trackingLocation ? 'Tạm dừng GPS' : 'Bật định vị' }}
        </button>
      </div>
      <div v-if="nearestOrders.length" class="delivery-next-list">
        <button
          v-for="(order, index) in nearestOrders"
          :key="order.id"
          class="delivery-next-item"
          @click="focusOrder(order)"
        >
          <b>{{ index + 1 }}</b>
          <span>
            <strong>{{ order.customerName }} · ~{{ order.distanceKm }} km</strong>
            <small>{{ order.address }} · {{ order.status === 'DANG_GIAO' ? 'Đang giao' : 'Đã xác nhận' }}</small>
          </span>
        </button>
      </div>
      <p v-else class="map-empty-compact">Không có đơn giao nào gần đây.</p>
    </section>

    <!-- Thanh công cụ tìm kiếm và bộ lọc -->
    <div class="map-toolbar">
      <div class="toolbar-stats">
        <span class="stat-pill primary"><b>{{ visibleCustomers.length }}</b> khách</span>
        <span class="stat-pill success"><b>{{ visitedCount }}</b> đã đi</span>
        <span class="stat-pill warning"><b>{{ unvisitedCount }}</b> chưa đi</span>
        <span v-if="unlocatedCount" class="stat-pill muted">{{ unlocatedCount }} chưa có tỉnh</span>
      </div>
      <div class="toolbar-controls">
        <select v-model="visitFilter" class="filter-select" aria-label="Lọc theo lượt ghé">
          <option value="ALL">Tất cả điểm</option>
          <option value="NOT_VISITED">Chưa ghé thăm</option>
          <option value="VISITED">Đã ghé thăm</option>
        </select>
        <div class="search-wrap">
          <input
            v-model="keyword"
            type="search"
            class="search-input"
            placeholder="Tìm tên, SĐT, tỉnh, sản phẩm…"
          >
          <button v-if="keyword" type="button" class="clear-btn" @click="keyword = ''">✕</button>
        </div>
      </div>
    </div>

    <!-- Không gian làm việc: Bản đồ & Danh sách -->
    <section class="map-workspace adm-card" :class="[`show-${mobileTab}`]">
      <!-- Danh sách khách hàng (Cột trái trên PC, Chuyển tab trên Mobile) -->
      <aside class="map-customer-list" :class="{ 'mobile-active': mobileTab === 'list' }">
        <!-- Chi tiết khách đã chọn (Hiển thị đầu danh sách trên PC) -->
        <div v-if="selected && !isMobile" class="map-selected">
          <div class="selected-head">
            <strong>{{ selected.customerName }}</strong>
            <button type="button" aria-label="Đóng thông tin" @click="selected = null">×</button>
          </div>
          <img
            v-if="safeImage(selected.interestImage)"
            :src="safeImage(selected.interestImage)"
            :alt="selected.interest || 'Sản phẩm khách quan tâm'"
          >
          <span v-if="selected.interest" class="selected-interest">{{ selected.interest }}</span>
          <span v-if="selected.phone">
            <b>SĐT:</b> <a :href="`tel:${selected.phone}`">{{ selected.phone }}</a>
          </span>
          <span><b>Khu vực:</b> {{ selected.address ? `${selected.address}, ` : '' }}{{ selected.province }}</span>
          <span><b>Khoảng cách:</b> ~{{ distanceFromStore(selected).toLocaleString('vi-VN') }} km</span>
          <a class="google-maps-link" :href="googleMapsUrl(selected)" target="_blank" rel="noopener">
            🧭 Mở vị trí trên Google Maps ↗
          </a>
          <span v-if="selected.sourceAdName"><b>Quảng cáo:</b> {{ selected.sourceAdName }}</span>
          <span class="visit-state" :class="{ visited: selected.visitedAt }">
            {{ selected.visitedAt ? `✓ Đã đi · ${formatVisitTime(selected.visitedAt)}` : '● Chưa đi' }}
          </span>
          <div class="selected-actions">
            <button
              class="adm-btn visit-toggle"
              :disabled="visitBusy"
              @click="toggleVisited(selected)"
            >
              {{ visitBusy ? 'Đang lưu…' : selected.visitedAt ? '↶ Đánh dấu chưa đi' : '✓ Đánh dấu đã đi' }}
            </button>
            <button class="adm-btn adm-btn-gold open-crm" @click="openCrm(selected)">
              Mở hồ sơ khách hàng
            </button>
          </div>
        </div>

        <div class="map-search-meta">
          <span>Sắp xếp: <b>Gần {{ deliveryLocation ? 'bạn' : 'cửa hàng' }} nhất trước</b></span>
          <span>{{ visibleCustomers.length }} hồ sơ</span>
        </div>

        <div class="customer-rows-container">
          <button
            v-for="customer in visibleCustomers"
            :key="`${customer.recordType}:${customer.id}`"
            :class="['map-customer-row', { active: selected?.id === customer.id && selected?.recordType === customer.recordType }]"
            @click="handleCustomerRowClick(customer)"
          >
            <span :class="['red-dot', { visited: customer.visitedAt }]"></span>
            <span class="row-main">
              <span class="row-top">
                <strong>{{ customer.customerName }}</strong>
                <em v-if="customer.visitedAt" class="visited-badge">Đã đi</em>
                <span class="dist-badge">~{{ distanceFromStore(customer).toLocaleString('vi-VN') }} km</span>
              </span>
              <small class="row-sub">{{ customer.province }}{{ customer.address ? ` · ${customer.address}` : '' }}</small>
              <small class="row-desc">{{ customer.phone || customer.interest || 'Chưa ghi chú' }}</small>
            </span>
          </button>
          <p v-if="!visibleCustomers.length" class="map-empty">
            Không tìm thấy khách hàng nào phù hợp với bộ lọc.
          </p>
        </div>
      </aside>

      <!-- Khung hiển thị Bản đồ Leaflet -->
      <div class="map-container-wrap" :class="{ 'mobile-active': mobileTab === 'map' }">
        <div ref="mapElement" class="map-canvas" aria-label="Bản đồ vị trí khách hàng"></div>

        <!-- Nút điều khiển nhanh trên bản đồ (GPS / Căn giữa) -->
        <div class="map-floating-controls">
          <button
            v-if="deliveryLocation"
            type="button"
            class="map-float-btn"
            title="Xem vị trí của tôi"
            @click="centerOnMyLocation"
          >
            📍 Vị trí tôi
          </button>
          <button
            type="button"
            class="map-float-btn"
            title="Xem tất cả điểm khách"
            @click="fitAllMarkers"
          >
            ⛶ Toàn bộ
          </button>
        </div>

        <!-- Mobile Bottom Sheet: Bảng chi tiết trượt lên trên điện thoại khi bấm vào điểm ghim -->
        <div v-if="selected && isMobile && mobileTab === 'map'" class="sheet-backdrop" @click="selected = null"></div>
        <transition name="sheet-slide">
          <div v-if="selected && isMobile && mobileTab === 'map'" class="mobile-bottom-sheet">
            <div class="sheet-drag-handle" @click="selected = null"></div>
            <div class="sheet-head">
              <div class="sheet-title-group">
                <div class="sheet-name-row">
                  <h3 class="sheet-name">{{ selected.customerName }}</h3>
                  <span :class="['sheet-status-tag', { visited: selected.visitedAt }]">
                    {{ selected.visitedAt ? '✓ Đã ghé thăm' : '● Chưa đi' }}
                  </span>
                </div>
                <p class="sheet-meta">
                  📍 {{ selected.province }}{{ selected.address ? ` · ${selected.address}` : '' }}
                  <span class="sheet-dist">(~{{ distanceFromStore(selected).toLocaleString('vi-VN') }} km)</span>
                </p>
              </div>
              <button
                type="button"
                class="sheet-close-btn"
                aria-label="Đóng"
                @click="selected = null"
              >
                ✕
              </button>
            </div>

            <!-- Ảnh & Nhu cầu nếu có -->
            <div v-if="selected.interest || safeImage(selected.interestImage)" class="sheet-interest-box">
              <img
                v-if="safeImage(selected.interestImage)"
                :src="safeImage(selected.interestImage)"
                class="sheet-product-thumb"
                alt=""
              >
              <span class="sheet-interest-text">{{ selected.interest || 'Khách quan tâm dàn karaoke' }}</span>
            </div>

            <!-- Các nút hành động kích thước lớn, chạm nhanh bằng một ngón tay -->
            <div class="sheet-quick-actions">
              <a
                v-if="selected.phone"
                :href="`tel:${selected.phone}`"
                class="sheet-btn call-btn"
              >
                <span class="btn-icon">📞</span>
                <span class="btn-text">Gọi {{ selected.phone }}</span>
              </a>
              <a
                :href="googleMapsUrl(selected)"
                target="_blank"
                rel="noopener"
                class="sheet-btn maps-btn"
              >
                <span class="btn-icon">🧭</span>
                <span class="btn-text">Chỉ đường</span>
              </a>
            </div>

            <div class="sheet-sub-actions">
              <button
                type="button"
                class="sheet-secondary-btn"
                :disabled="visitBusy"
                @click="toggleVisited(selected)"
              >
                {{ selected.visitedAt ? '↶ Đánh dấu chưa đi' : '✓ Đã ghé thăm' }}
              </button>
              <button
                type="button"
                class="sheet-secondary-btn crm-btn"
                @click="openCrm(selected)"
              >
                👤 Xem hồ sơ CRM ↗
              </button>
            </div>
          </div>
        </transition>
      </div>
    </section>

    <p v-if="error" class="map-error">{{ error }}</p>
    <p class="map-attribution">
      Bản đồ © OpenStreetMap contributors. Vị trí khách được định vị theo trung tâm tỉnh/thành để hỗ trợ lộ trình di chuyển.
    </p>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { apiRequest } from '../../utils/api'

const router = useRouter()
const customers = ref([])
const deliveryOrders = ref([])
const deliveryLocation = ref(null)
const selected = ref(null)
const keyword = ref('')
const visitFilter = ref('ALL')
const busy = ref(false)
const visitBusy = ref(false)
const trackingLocation = ref(false)
const error = ref('')
const unlocatedCount = ref(0)
const mapElement = ref(null)
const mobileTab = ref('map')
const noticeExpanded = ref(false)
const isMobile = ref(false)

let map = null
let markerLayer = null
let tileLayer = null
let refreshTimer = null
let locationWatchId = null
let tileErrorCount = 0
let tileLoadCount = 0
let usingFallbackTiles = false
let origin = { lat: 21.31, lng: 105.60 }

const checkIsMobile = () => {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth <= 860
  }
}

const visibleCustomers = computed(() => {
  const term = keyword.value.trim().toLocaleLowerCase('vi')
  const reference = deliveryLocation.value || origin
  return customers.value.filter(c => {
    const matchesTerm = !term || `${c.customerName} ${c.phone} ${c.address} ${c.province} ${c.interest} ${c.sourceAdName}`.toLocaleLowerCase('vi').includes(term)
    const matchesVisit = visitFilter.value === 'ALL' || (visitFilter.value === 'VISITED' ? Boolean(c.visitedAt) : !c.visitedAt)
    return matchesTerm && matchesVisit
  }).sort((a, b) => distanceBetween(reference, a) - distanceBetween(reference, b))
})

const visitedCount = computed(() => customers.value.filter(customer => customer.visitedAt).length)
const unvisitedCount = computed(() => customers.value.length - visitedCount.value)
const nearestOrders = computed(() => deliveryLocation.value ? deliveryOrders.value.map(order => ({ ...order, distanceKm: distanceBetween(deliveryLocation.value, order) })).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 5) : [])

watch(visibleCustomers, renderMarkers)
watch([deliveryOrders, deliveryLocation], renderMarkers)

function switchMobileTab(tab) {
  mobileTab.value = tab
  if (tab === 'map') {
    nextTick(() => {
      if (map) {
        setTimeout(() => map.invalidateSize(), 150)
      }
    })
  }
}

function handleCustomerRowClick(customer) {
  selectCustomer(customer)
  if (isMobile.value) {
    switchMobileTab('map')
  }
}

const distanceFromStore = customer => distanceBetween(deliveryLocation.value || origin, customer)
const distanceBetween = (from, to) => {
  const rad = degree => degree * Math.PI / 180
  const dLat = rad(to.lat - from.lat), dLng = rad(to.lng - from.lng)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

const safeImage = value => /^(https?:\/\/|data:image\/)/i.test(String(value || '')) ? value : ''
const googleMapsUrl = customer => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${customer.lat},${customer.lng}`)}`
const formatVisitTime = value => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

const popupContent = customer => {
  const image = safeImage(customer.interestImage)
  return `<div class="customer-popup">${image ? `<img src="${escapeHtml(image)}" alt="">` : ''}<strong>${escapeHtml(customer.customerName)}</strong><b>${customer.visitedAt ? `✓ Đã đi${customer.visitedBy ? ` · ${escapeHtml(customer.visitedBy)}` : ''}` : '● Chưa đi'}</b>${customer.interest ? `<span>${escapeHtml(customer.interest)}</span>` : ''}${customer.phone ? `<a href="tel:${escapeHtml(customer.phone)}">📞 ${escapeHtml(customer.phone)}</a>` : ''}${customer.address ? `<span>${escapeHtml(customer.address)}</span>` : ''}<span>${escapeHtml(customer.province)} · ~${distanceFromStore(customer)} km</span><small>Ước tính theo trung tâm tỉnh/thành</small></div>`
}

function initMap() {
  if (!mapElement.value || map) return
  map = L.map(mapElement.value, { scrollWheelZoom: true, zoomControl: true }).setView([origin.lat, origin.lng], 6)
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
  tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution, subdomains: 'abc' }).addTo(map)
  tileLayer.on('tileload', () => { tileLoadCount += 1 })
  tileLayer.on('tileerror', () => {
    tileErrorCount += 1
    if (!usingFallbackTiles && tileErrorCount >= 3 && tileLoadCount === 0) {
      usingFallbackTiles = true
      tileLayer.remove()
      tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', { maxZoom: 19, attribution, subdomains: 'abc' }).addTo(map)
    }
  })
  markerLayer = L.layerGroup().addTo(map)
}

function renderMarkers() {
  if (!map || !markerLayer) return
  markerLayer.clearLayers()
  L.circleMarker([origin.lat, origin.lng], { radius: 8, color: '#1d4ed8', weight: 2, fillColor: '#3b82f6', fillOpacity: 1 })
    .bindPopup('<strong>Tú Audio</strong><br>Điểm gốc tính khoảng cách (khu vực cửa hàng)').addTo(markerLayer)
  const bounds = [[origin.lat, origin.lng]]
  const byProvince = new Map()
  for (const customer of visibleCustomers.value) {
    const key = `${customer.lat.toFixed(3)},${customer.lng.toFixed(3)}`
    byProvince.set(key, [...(byProvince.get(key) || []), customer])
  }
  for (const group of byProvince.values()) {
    if (group.length > 1) {
      const allVisited = group.every(customer => customer.visitedAt)
      const someVisited = group.some(customer => customer.visitedAt)
      const visitClass = allVisited ? 'visited' : someVisited ? 'mixed' : ''
      const marker = L.marker([group[0].lat, group[0].lng], {
        icon: L.divIcon({
          className: 'customer-cluster-pin',
          html: `<span class="${visitClass}">${group.length}</span>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        })
      })
      marker.clusterCustomers = group
      const rows = group.map((customer, index) =>
        `<button type="button" class="cluster-btn-row" data-map-customer="${index}">
          <span class="c-dot ${customer.visitedAt ? 'visited' : ''}"></span>
          <strong>${escapeHtml(customer.customerName)}</strong>
          ${customer.phone ? `<small>📞 ${escapeHtml(customer.phone)}</small>` : ''}
        </button>`
      ).join('')
      marker.bindPopup(
        `<div class="customer-popup cluster-pop">
          <strong>${escapeHtml(group[0].province)} · ${group.length} khách</strong>
          <small>Bấm vào khách để xem chi tiết & chỉ đường</small>
          <div class="cluster-customer-list">${rows}</div>
        </div>`,
        { maxWidth: 320 }
      )
      marker.on('popupopen', event => {
        event.popup.getElement()?.querySelectorAll('[data-map-customer]').forEach(button => {
          button.addEventListener('click', () => {
            const chosen = group[Number(button.dataset.mapCustomer)]
            selectCustomer(chosen)
          })
        })
      })
      marker.addTo(markerLayer)
      bounds.push([group[0].lat, group[0].lng])
      continue
    }
    const customer = group[0]
    const marker = L.circleMarker([customer.lat, customer.lng], {
      radius: 9,
      color: customer.visitedAt ? '#166534' : '#991b1b',
      weight: 1.5,
      fillColor: customer.visitedAt ? '#22c55e' : '#ef4444',
      fillOpacity: 0.92
    })
    marker.customerRecord = customer
    marker.bindPopup(popupContent(customer), { maxWidth: 300 })
    marker.on('click', () => {
      selected.value = customer
    })
    marker.addTo(markerLayer)
    bounds.push([customer.lat, customer.lng])
  }

  if (deliveryLocation.value) {
    const current = deliveryLocation.value
    L.circleMarker([current.lat, current.lng], {
      radius: 11,
      color: '#1d4ed8',
      weight: 3,
      fillColor: '#60a5fa',
      fillOpacity: 1
    }).bindPopup('<strong>Vị trí hiện tại của bạn</strong>').addTo(markerLayer)
    bounds.push([current.lat, current.lng])
  }

  for (const order of deliveryOrders.value) {
    const marker = L.circleMarker([order.lat, order.lng], {
      radius: 9,
      color: '#7c2d12',
      weight: 2,
      fillColor: '#f97316',
      fillOpacity: 0.95
    })
    marker.orderRecord = order
    marker.bindPopup(
      `<div class="customer-popup">
        <strong>Đơn ${escapeHtml(String(order.id).slice(0, 8))} · ${escapeHtml(order.customerName)}</strong>
        <span>${escapeHtml(order.address)}</span>
        <b>~${distanceBetween(deliveryLocation.value || origin, order)} km từ ${deliveryLocation.value ? 'vị trí hiện tại' : 'cửa hàng'}</b>
        <small>Vị trí ước tính theo trung tâm ${escapeHtml(order.province)}</small>
      </div>`
    )
    marker.addTo(markerLayer)
    bounds.push([order.lat, order.lng])
  }

  if (deliveryLocation.value) map.setView([deliveryLocation.value.lat, deliveryLocation.value.lng], 8)
  else if (bounds.length > 1) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 7 })
  else map.setView([origin.lat, origin.lng], 8)
}

function centerOnMyLocation() {
  if (!map || !deliveryLocation.value) return
  map.setView([deliveryLocation.value.lat, deliveryLocation.value.lng], 11, { animate: true })
}

function fitAllMarkers() {
  if (!map) return
  const bounds = [[origin.lat, origin.lng]]
  for (const c of visibleCustomers.value) bounds.push([c.lat, c.lng])
  if (deliveryLocation.value) bounds.push([deliveryLocation.value.lat, deliveryLocation.value.lng])
  if (bounds.length > 1) map.fitBounds(bounds, { padding: [24, 24] })
}

async function loadData() {
  busy.value = true
  error.value = ''
  try {
    const response = await apiRequest('/admin/customer-map')
    customers.value = response.data || []
    deliveryOrders.value = response.deliveryOrders || []
    try {
      deliveryLocation.value = JSON.parse(localStorage.getItem('deliveryCurrentLocation') || 'null')
    } catch {
      deliveryLocation.value = null
    }
    unlocatedCount.value = Number(response.unlocatedCount || 0)
    if (response.origin?.lat && response.origin?.lng) {
      origin = { lat: Number(response.origin.lat), lng: Number(response.origin.lng) }
    }
    await nextTick()
    initMap()
    renderMarkers()
    if (map) setTimeout(() => map.invalidateSize(), 100)
  } catch (e) {
    error.value = e.message || 'Không tải được vị trí khách hàng.'
  } finally {
    busy.value = false
  }
}

function focusOrder(order) {
  if (!map) return
  if (isMobile.value) switchMobileTab('map')
  const marker = markerLayer?.getLayers().find(item => item.orderRecord?.id === order.id)
  if (marker) {
    map.setView([order.lat, order.lng], Math.max(map.getZoom(), 8))
    marker.openPopup()
  }
}

function stopLocationTracking() {
  if (locationWatchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(locationWatchId)
  }
  locationWatchId = null
  trackingLocation.value = false
}

function startLocationTracking() {
  if (!navigator.geolocation || locationWatchId !== null) return
  error.value = ''
  locationWatchId = navigator.geolocation.watchPosition(
    position => {
      deliveryLocation.value = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: Math.round(position.coords.accuracy || 0),
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem('deliveryCurrentLocation', JSON.stringify(deliveryLocation.value))
      trackingLocation.value = true
    },
    () => {
      stopLocationTracking()
      error.value = 'Không lấy được GPS liên tục. Hãy cấp quyền vị trí cho trình duyệt.'
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
  )
  trackingLocation.value = true
}

function toggleLocationTracking() {
  if (trackingLocation.value) stopLocationTracking()
  else startLocationTracking()
}

function selectCustomer(customer) {
  selected.value = customer
  const marker = markerLayer?.getLayers().find(item =>
    (item.customerRecord?.id === customer.id && item.customerRecord?.recordType === customer.recordType) ||
    item.clusterCustomers?.some(entry => entry.id === customer.id && entry.recordType === customer.recordType)
  )
  if (marker) {
    map.setView([customer.lat, customer.lng], Math.max(map.getZoom(), 8), { animate: true })
    if (!isMobile.value) marker.openPopup()
  }
}

async function toggleVisited(customer) {
  if (!customer || visitBusy.value) return
  visitBusy.value = true
  try {
    const linkedRecords = [
      customer.facebookCareId ? { recordType: 'FACEBOOK', id: customer.facebookCareId } : null,
      customer.leadId ? { recordType: 'LEAD', id: customer.leadId } : null
    ].filter(Boolean)
    await apiRequest(`/admin/customer-map/${customer.recordType}/${encodeURIComponent(customer.id)}/visit`, {
      method: 'PATCH',
      body: JSON.stringify({ visited: !customer.visitedAt, linkedRecords })
    })
    await loadData()
    selected.value = customers.value.find(item => item.id === customer.id && item.recordType === customer.recordType) || null
  } catch (e) {
    error.value = e.message || 'Không lưu được trạng thái ghé thăm.'
  } finally {
    visitBusy.value = false
  }
}

function openCrm(customer) {
  if (customer.recordType === 'FACEBOOK' || customer.facebookCareId) {
    router.push({ path: '/admin/facebook-care', query: { customerId: customer.facebookCareId || customer.id } })
  } else {
    router.push({ path: '/admin/leads', query: { customerId: customer.id, phone: customer.phone } })
  }
}

onMounted(() => {
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)
  loadData()
  startLocationTracking()
  refreshTimer = setInterval(() => {
    if (document.visibilityState === 'visible' && !busy.value) loadData()
  }, 30000)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkIsMobile)
  }
  if (refreshTimer) clearInterval(refreshTimer)
  stopLocationTracking()
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.customer-map-page {
  --map-ink: #172033;
  --map-muted: #64748b;
  display: flex;
  flex-direction: column;
}

/* Header */
.adm-page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}
.adm-page-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}
.adm-page-sub {
  font-size: 0.8rem;
  color: #64748b;
  margin: 3px 0 0;
}
.refresh-btn {
  font-size: 0.8rem;
  padding: 8px 14px;
}

/* Mobile Segmented Switcher */
.mobile-view-tabs {
  display: none;
  background: #e2e8f0;
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 12px;
  gap: 4px;
}
.mobile-tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: #475569;
  font-weight: 700;
  font-size: 0.84rem;
  padding: 10px 14px;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.4, 1);
  -webkit-tap-highlight-color: transparent;
}
.mobile-tab-btn.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
}
.tab-count {
  font-size: 0.72rem;
  background: #f1f5f9;
  color: #334155;
  padding: 2px 7px;
  border-radius: 999px;
}
.mobile-tab-btn.active .tab-count {
  background: #eff6ff;
  color: #2563eb;
}

/* Collapsible Notice */
.map-notice {
  padding: 10px 14px;
  margin-bottom: 12px;
  border: 1px solid #fed7aa;
  background: #fff7ed;
  border-radius: 10px;
  color: #9a3412;
  font-size: 0.78rem;
  line-height: 1.45;
}
.notice-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}
.notice-icon {
  font-size: 0.95rem;
  flex: none;
}
.notice-text {
  flex: 1;
}
.notice-toggle-btn {
  border: 0;
  background: transparent;
  color: #c2410c;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  padding: 2px 4px;
  white-space: nowrap;
}
.notice-detail {
  margin: 6px 0 0 24px;
  font-size: 0.74rem;
  color: #b45309;
}

/* Delivery Next Card */
.delivery-next {
  padding: 12px 14px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}
.delivery-next-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.delivery-next-head > div {
  display: grid;
  gap: 3px;
}
.delivery-next-head strong {
  font-size: 0.86rem;
  color: #172033;
}
.delivery-next-head small {
  font-size: 0.72rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}
.gps-btn {
  font-size: 0.76rem;
  padding: 6px 12px;
  white-space: nowrap;
}
.delivery-next-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px;
  margin-top: 10px;
}
.delivery-next-item {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding: 9px 11px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}
.delivery-next-item:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}
.delivery-next-item > b {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  flex: none;
  border-radius: 50%;
  background: #ffedd5;
  color: #c2410c;
  font-size: 0.76rem;
}
.delivery-next-item > span {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.delivery-next-item strong {
  font-size: 0.76rem;
  color: #172033;
}
.delivery-next-item small {
  font-size: 0.68rem;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.map-empty-compact {
  padding: 8px 0;
  color: #94a3b8;
  font-size: 0.74rem;
  margin: 0;
}

/* Toolbar */
.map-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.toolbar-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.stat-pill {
  font-size: 0.74rem;
  padding: 4px 10px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
}
.stat-pill b {
  color: #0f172a;
}
.stat-pill.success {
  background: #dcfce7;
  color: #166534;
}
.stat-pill.warning {
  background: #fef3c7;
  color: #92400e;
}
.toolbar-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
  min-width: 280px;
}
.filter-select {
  border: 1px solid #dbe2ec;
  border-radius: 8px;
  padding: 8px 10px;
  background: #fff;
  color: #172033;
  font: inherit;
  font-size: 0.8rem;
  height: 38px;
}
.search-wrap {
  position: relative;
  flex: 1;
  max-width: 320px;
}
.search-input {
  width: 100%;
  border: 1px solid #dbe2ec;
  border-radius: 8px;
  padding: 8px 30px 8px 11px;
  font: inherit;
  font-size: 0.8rem;
  height: 38px;
  background: #fff;
}
.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 4px;
}

/* Workspace */
.map-workspace {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  height: min(74vh, 760px);
  min-height: 520px;
  padding: 0;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  position: relative;
}

/* Customer List (Desktop Sidebar) */
.map-customer-list {
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.map-search-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.72rem;
  color: #64748b;
}
.customer-rows-container {
  overflow-y: auto;
  flex: 1;
}
.map-customer-row {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 0;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  text-align: left;
  cursor: pointer;
  color: #172033;
  transition: background 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}
.map-customer-row:hover,
.map-customer-row.active {
  background: #eff6ff;
}
.red-dot {
  width: 12px;
  height: 12px;
  flex: none;
  margin-top: 4px;
  border-radius: 50%;
  background: #ef4444;
  border: 2px solid #991b1b;
}
.red-dot.visited {
  background: #22c55e;
  border-color: #166534;
}
.row-main {
  display: grid;
  gap: 3px;
  min-width: 0;
  flex: 1;
}
.row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.row-top strong {
  font-size: 0.86rem;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dist-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 6px;
  white-space: nowrap;
}
.visited-badge {
  font-size: 0.65rem;
  font-style: normal;
  font-weight: 700;
  color: #15803d;
  background: #dcfce7;
  border-radius: 999px;
  padding: 1px 6px;
  white-space: nowrap;
}
.row-sub {
  font-size: 0.74rem;
  color: #475569;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row-desc {
  font-size: 0.7rem;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Selected Customer Card (PC Sidebar) */
.map-selected {
  display: grid;
  gap: 8px;
  padding: 14px;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  color: #475569;
  font-size: 0.78rem;
}
.selected-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #172033;
  font-size: 0.94rem;
}
.selected-head button {
  border: 0;
  background: transparent;
  font-size: 1.4rem;
  cursor: pointer;
  color: #64748b;
  padding: 0 4px;
}
.map-selected > img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  background: white;
}
.selected-interest {
  color: #334155;
  font-weight: 650;
}
.google-maps-link {
  color: #1d4ed8;
  font-weight: 700;
  text-decoration: none;
}
.visit-state {
  font-weight: 700;
  color: #b91c1c;
}
.visit-state.visited {
  color: #15803d;
}
.selected-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}
.visit-toggle {
  color: #166534;
  border-color: #86efac;
  background: #f0fdf4;
  font-size: 0.78rem;
  padding: 8px 12px;
}
.visit-toggle:hover {
  background: #dcfce7;
}

/* Map Wrap */
.map-container-wrap {
  position: relative;
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.map-canvas {
  height: 100%;
  width: 100%;
  min-width: 0;
  z-index: 0;
}

/* Floating map controls */
.map-floating-controls {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 400;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.map-float-btn {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}
.map-float-btn:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

/* Backdrop mờ phía sau bottom sheet */
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(3px);
  z-index: 1190;
}

/* Mobile Bottom Sheet Drawer (Trượt lên từ đáy bản đồ khi bấm vào điểm ghim) */
.mobile-bottom-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -10px 40px rgba(15, 23, 42, 0.3);
  padding: 12px 16px max(20px, env(safe-area-inset-bottom));
  z-index: 1200;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 82vh;
  overflow-y: auto;
  border-top: 1px solid #e2e8f0;
}
.sheet-drag-handle {
  width: 40px;
  height: 4px;
  background: #cbd5e1;
  border-radius: 999px;
  margin: 0 auto 4px;
  cursor: pointer;
}
.sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.sheet-title-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.sheet-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.sheet-name {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}
.sheet-status-tag {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  background: #fee2e2;
  color: #b91c1c;
}
.sheet-status-tag.visited {
  background: #dcfce7;
  color: #15803d;
}
.sheet-meta {
  font-size: 0.78rem;
  color: #475569;
  margin: 0;
}
.sheet-dist {
  font-weight: 700;
  color: #2563eb;
  margin-left: 4px;
}
.sheet-close-btn {
  border: 0;
  background: #f1f5f9;
  color: #64748b;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  cursor: pointer;
  flex: none;
}
.sheet-interest-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.sheet-product-thumb {
  width: 42px;
  height: 42px;
  object-fit: cover;
  border-radius: 6px;
  flex: none;
}
.sheet-interest-text {
  font-size: 0.78rem;
  color: #334155;
  font-weight: 600;
}

/* Nút bấm to chạm ngón tay trên điện thoại */
.sheet-quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.sheet-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.88rem;
  min-height: 46px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: transform 0.1s ease;
  -webkit-tap-highlight-color: transparent;
}
.sheet-btn:active {
  transform: scale(0.98);
}
.call-btn {
  background: #16a34a;
  color: #ffffff;
}
.maps-btn {
  background: #2563eb;
  color: #ffffff;
}
.sheet-sub-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.sheet-secondary-btn {
  padding: 10px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 650;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
  min-height: 40px;
}
.sheet-secondary-btn.crm-btn {
  background: #fffbeb;
  border-color: #fde68a;
  color: #b45309;
}

/* Bottom Sheet Slide Transition */
.sheet-slide-enter-active,
.sheet-slide-leave-active {
  transition: transform 0.24s cubic-bezier(0.2, 0.8, 0.4, 1), opacity 0.2s ease;
}
.sheet-slide-enter-from,
.sheet-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Leaflet Overrides */
.gps-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 5px;
  border-radius: 50%;
  background: #94a3b8;
}
.gps-indicator.active {
  background: #16a34a;
  box-shadow: 0 0 0 3px #dcfce7;
}
:global(.customer-popup) {
  display: grid;
  gap: 5px;
  min-width: 170px;
  color: #172033;
  font: 12px/1.4 Arial, sans-serif;
}
:global(.customer-popup img) {
  width: 100%;
  height: 110px;
  object-fit: cover;
  border-radius: 6px;
}
:global(.customer-popup strong) {
  font-size: 13px;
}
:global(.customer-popup a) {
  color: #1d4ed8;
  font-weight: 700;
  text-decoration: none;
}
:global(.customer-popup small) {
  color: #64748b;
}
:global(.cluster-customer-list) {
  display: grid;
  gap: 5px;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px;
}
:global(.cluster-btn-row) {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #dbeafe;
  border-radius: 6px;
  background: #eff6ff;
  padding: 8px 10px;
  text-align: left;
  color: #1e3a8a;
  cursor: pointer;
  font-size: 12px;
  width: 100%;
}
:global(.cluster-btn-row:active) {
  background: #dbeafe;
}
:global(.c-dot) {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  flex: none;
}
:global(.c-dot.visited) {
  background: #22c55e;
}
:global(.customer-cluster-pin) {
  display: grid;
  place-items: center;
  border: 0 !important;
  background: transparent !important;
}
:global(.customer-cluster-pin span) {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 2px solid #991b1b;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  font-weight: 800;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  font-size: 13px;
}
:global(.customer-cluster-pin span.visited) {
  background: #22c55e;
  border-color: #166534;
}
:global(.customer-cluster-pin span.mixed) {
  background: #f59e0b;
  border-color: #b45309;
}

.map-empty {
  padding: 24px;
  color: #94a3b8;
  font-size: 0.8rem;
  text-align: center;
}
.map-error {
  color: #b91c1c;
  font-size: 0.8rem;
  margin-top: 8px;
}
.map-attribution {
  font-size: 0.68rem;
  color: #94a3b8;
  margin-top: 8px;
}

/* ========================================================
   RESPONSIVE CHO ĐIỆN THOẠI DI ĐỘNG (<= 860px)
   ======================================================== */
@media (max-width: 860px) {
  .customer-map-page {
    padding-bottom: 20px;
  }

  /* Hiện thanh tab chuyển Bản đồ / Danh sách */
  .mobile-view-tabs {
    display: flex;
  }

  /* Điều chỉnh Header */
  .adm-page-head {
    align-items: center;
  }
  .adm-page-title {
    font-size: 1.15rem;
  }
  .adm-page-sub {
    display: none; /* Ẩn bớt phụ đề dài dòng trên mobile */
  }

  /* Thanh công cụ tìm kiếm gọn gàng */
  .map-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .toolbar-stats {
    overflow-x: auto;
    padding-bottom: 2px;
    white-space: nowrap;
  }
  .toolbar-controls {
    min-width: 0;
    width: 100%;
  }
  .search-wrap {
    max-width: none;
  }

  /* Không gian bản đồ toàn màn hình trên Mobile */
  .map-workspace {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 0;
    border-radius: 12px;
  }

  /* Ẩn hiện tab theo lựa chọn */
  .map-customer-list {
    display: none;
    border-right: 0;
    max-height: 65vh;
  }
  .map-customer-list.mobile-active {
    display: flex;
  }

  .map-container-wrap {
    display: none;
    height: calc(100dvh - 240px);
    min-height: 420px;
  }
  .map-container-wrap.mobile-active {
    display: flex;
  }

  /* Nút floating map to hơn, dễ bấm ngón tay */
  .map-floating-controls {
    top: 10px;
    right: 10px;
  }
  .map-float-btn {
    padding: 8px 10px;
    font-size: 0.72rem;
  }

  /* Dòng khách hàng trong danh sách trên mobile to bản, dễ chạm */
  .customer-rows-container {
    padding-bottom: 96px; /* Để cuộn hết danh sách mà không bị nút AI nổi che khuất */
  }
  .map-customer-row {
    padding: 13px 14px;
  }
  .row-top strong {
    font-size: 0.9rem;
  }
  .row-sub {
    font-size: 0.76rem;
  }
  .row-desc {
    font-size: 0.72rem;
  }
}
</style>
