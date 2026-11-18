<template>
  <div class="adm-page customer-map-page" :class="{ 'mobile-app-mode': isMobile }">
    <!-- ========================================================
         GIAO DIỆN DESKTOP (MÀN HÌNH MÁY TÍNH > 860PX)
         ======================================================== -->
    <template v-if="!isMobile">
      <div class="adm-page-head">
        <div>
          <h1 class="adm-page-title">Bản đồ khách hàng</h1>
          <p class="adm-page-sub">Khách từ Fanpage và CRM, ghim theo tỉnh/thành được nhắc trong hội thoại hoặc hồ sơ.</p>
        </div>
        <button class="adm-btn" :disabled="busy" @click="loadData">
          {{ busy ? 'Đang cập nhật…' : '↻ Làm mới' }}
        </button>
      </div>

      <div class="map-notice">
        <strong>Khoảng cách là ước tính:</strong> Điểm ghim tính theo trung tâm tỉnh/thành; số km tính đường chim bay từ cửa hàng hoặc vị trí GPS của bạn.
      </div>

      <section v-if="deliveryLocation" class="delivery-next adm-card">
        <div class="delivery-next-head">
          <div>
            <strong>Đơn giao tiếp theo gần bạn</strong>
            <small>
              <i :class="['gps-indicator', { active: trackingLocation }]"></i>
              {{ trackingLocation ? 'Đang theo dõi GPS' : 'Đã dừng theo dõi' }} · cập nhật {{ deliveryLocation.updatedAt ? formatVisitTime(deliveryLocation.updatedAt) : '' }}
            </small>
          </div>
          <button class="adm-btn" :disabled="locationBusy" @click="toggleLocationTracking">
            {{ trackingLocation ? 'Tạm dừng theo dõi' : 'Bật theo dõi vị trí' }}
          </button>
        </div>
        <div v-if="nearestOrders.length" class="delivery-next-list">
          <button v-for="(order, index) in nearestOrders" :key="order.id" class="delivery-next-item" @click="focusOrder(order)">
            <b>{{ index + 1 }}</b>
            <span>
              <strong>{{ order.customerName }} · ~{{ order.distanceKm }} km</strong>
              <small>{{ order.address }} · {{ order.status === 'DANG_GIAO' ? 'Đang giao' : 'Đã xác nhận' }}</small>
            </span>
          </button>
        </div>
        <p v-else class="map-empty">Không có đơn đã xác nhận hoặc đang giao có tỉnh/thành để gợi ý.</p>
      </section>

      <div class="map-toolbar">
        <span><b>{{ visibleCustomers.length }}</b> khách có vị trí</span>
        <span><b>{{ visitedCount }}</b> đã đi · <b>{{ unvisitedCount }}</b> chưa đi</span>
        <span>{{ unlocatedCount }} khách chưa có tỉnh/thành</span>
        <select v-model="visitFilter" aria-label="Lọc theo lượt ghé">
          <option value="ALL">Tất cả điểm</option>
          <option value="NOT_VISITED">Chưa đi</option>
          <option value="VISITED">Đã đi</option>
        </select>
        <input v-model="keyword" placeholder="Tìm tên, số điện thoại, tỉnh, sản phẩm…">
      </div>

      <section class="map-workspace adm-card">
        <aside class="map-customer-list">
          <div v-if="selected" class="map-selected">
            <div class="selected-head">
              <strong>{{ selected.customerName }}</strong>
              <button type="button" aria-label="Đóng thông tin" @click="selected = null">×</button>
            </div>
            <img v-if="safeImage(selected.interestImage)" :src="safeImage(selected.interestImage)" :alt="selected.interest || 'Sản phẩm khách quan tâm'">
            <span v-if="selected.interest" class="selected-interest">{{ selected.interest }}</span>
            <span v-if="selected.phone"><b>SĐT:</b> <a :href="`tel:${selected.phone}`">{{ selected.phone }}</a></span>
            <span><b>Khu vực:</b> {{ selected.address ? `${selected.address}, ` : '' }}{{ selected.province }}</span>
            <span><b>Khoảng cách:</b> ~{{ distanceFromStore(selected).toLocaleString('vi-VN') }} km</span>
            <a class="google-maps-link" :href="googleMapsUrl(selected)" target="_blank" rel="noopener">🧭 Mở vị trí trên Google Maps ↗</a>
            <span v-if="selected.sourceAdName"><b>Quảng cáo:</b> {{ selected.sourceAdName }}</span>
            <span class="visit-state" :class="{ visited: selected.visitedAt }">
              {{ selected.visitedAt ? `✓ Đã đi · ${formatVisitTime(selected.visitedAt)}` : '● Chưa đi' }}
            </span>
            <button class="adm-btn visit-toggle" :disabled="visitBusy" @click="toggleVisited(selected)">
              {{ visitBusy ? 'Đang lưu…' : selected.visitedAt ? '↶ Đánh dấu chưa đi' : '✓ Đánh dấu đã đi' }}
            </button>
            <button class="adm-btn adm-btn-gold open-crm" @click="openCrm(selected)">Mở hồ sơ khách hàng</button>
          </div>

          <div class="map-search">
            <input v-model="keyword" placeholder="Tìm trong danh sách…">
            <small>Gần {{ deliveryLocation ? 'vị trí hiện tại' : 'cửa hàng' }} trước · {{ visibleCustomers.length }} khách</small>
          </div>

          <button
            v-for="customer in visibleCustomers"
            :key="`${customer.recordType}:${customer.id}`"
            :class="['map-customer-row', { active: selected?.id === customer.id && selected?.recordType === customer.recordType }]"
            @click="selectCustomer(customer)"
          >
            <span :class="['red-dot', { visited: customer.visitedAt }]"></span>
            <span class="row-main">
              <strong>{{ customer.customerName }} <em v-if="customer.visitedAt" class="visited-badge">Đã đi</em></strong>
              <small>{{ customer.province }} · ~{{ distanceFromStore(customer).toLocaleString('vi-VN') }} km</small>
              <small>{{ customer.phone || customer.interest || 'Chưa có số điện thoại' }}</small>
            </span>
          </button>
          <p v-if="!visibleCustomers.length" class="map-empty">Chưa có khách nào có tỉnh/thành để hiển thị.</p>
        </aside>

        <div ref="mapElementDesktop" class="map-canvas" aria-label="Bản đồ vị trí khách hàng"></div>
      </section>
      <p v-if="error" class="map-error">{{ error }}</p>
    </template>

    <!-- ========================================================
         GIAO DIỆN APP PHONG CÁCH XANH SM (TRÊN MOBILE <= 860PX)
         Bản đồ tràn viền 100%, tìm kiếm nổi, Bottom Drawer trượt êm
         ======================================================== -->
    <template v-else>
      <div class="xanhsm-app-container">
        <!-- Bản đồ tràn viền hoàn toàn làm nền -->
        <div ref="mapElementMobile" class="xanhsm-map-canvas" aria-label="Bản đồ định vị Xanh SM"></div>

        <!-- Khối tìm kiếm nổi trên đỉnh bản đồ (Xanh SM Header Bar) -->
        <header class="xanhsm-top-bar">
          <div class="xanhsm-search-pill">
            <span class="search-icon">🔍</span>
            <input
              v-model="keyword"
              type="search"
              class="xanhsm-input"
              placeholder="Tìm khách hàng, số điện thoại, khu vực…"
            >
            <button v-if="keyword" type="button" class="search-clear" @click="keyword = ''">✕</button>
          </div>

          <!-- Bộ lọc chip nổi dạng Xanh SM (Tất cả, Chưa đi, Đã đi) -->
          <div class="xanhsm-filter-chips">
            <button
              type="button"
              :class="['xanhsm-chip', { active: visitFilter === 'ALL' }]"
              @click="visitFilter = 'ALL'"
            >
              Tất cả ({{ customers.length }})
            </button>
            <button
              type="button"
              :class="['xanhsm-chip', 'warn', { active: visitFilter === 'NOT_VISITED' }]"
              @click="visitFilter = 'NOT_VISITED'"
            >
              ● Chưa đi ({{ unvisitedCount }})
            </button>
            <button
              type="button"
              :class="['xanhsm-chip', 'done', { active: visitFilter === 'VISITED' }]"
              @click="visitFilter = 'VISITED'"
            >
              ✓ Đã đi ({{ visitedCount }})
            </button>
          </div>
        </header>

        <!-- Các nút tiện ích nổi góc phải phong cách App (Vị trí tôi, Toàn bộ, Danh sách) -->
        <div class="xanhsm-fab-group">
          <button
            type="button"
            class="xanhsm-fab-btn"
            title="Xem toàn bộ khách hàng"
            @click="fitAllMarkers"
          >
            ⛶
          </button>
          <button
            type="button"
            class="xanhsm-fab-btn my-location"
            :class="{ active: trackingLocation }"
            title="Định vị vị trí của bạn"
            @click="handleGpsFabClick"
          >
            <span class="gps-dot"></span>
            📍
          </button>
          <button
            type="button"
            class="xanhsm-fab-btn list-toggle"
            :class="{ active: sheetState === 'expanded' }"
            title="Xem danh sách khách"
            @click="toggleSheetList"
          >
            📋
          </button>
        </div>

        <!-- Backdrop mờ khi mở full danh sách hoặc chi tiết khách -->
        <transition name="fade">
          <div
            v-if="sheetState === 'expanded' || (sheetState === 'detail' && selected)"
            class="xanhsm-backdrop"
            @click="handleBackdropClick"
          ></div>
        </transition>

        <!-- ========================================================
             BOTTOM DRAWER PHONG CÁCH XANH SM (3 TRẠNG THÁI)
             1. Peek Bar: Thu gọn hiển thị tóm tắt & khách gần nhất
             2. Expanded List: Kéo lên xem danh sách khách kiểu app
             3. Customer Card: Thẻ điều hướng & gọi điện cho khách đã chọn
             ======================================================== -->
        <div
          class="xanhsm-bottom-drawer"
          :class="[`state-${sheetState}`]"
        >
          <!-- Thanh kéo drag handle chuẩn app -->
          <div class="xanhsm-drag-handle-wrap" @click="handleHandleClick">
            <div class="xanhsm-drag-bar"></div>
          </div>

          <!-- TRẠNG THÁI 1: THU GỌN (PEEK) - Chạm để xem danh sách -->
          <div v-if="sheetState === 'peek'" class="xanhsm-peek-content" @click="sheetState = 'expanded'">
            <div class="peek-left">
              <div class="peek-badge-car">🚗 Tú Audio CRM</div>
              <strong class="peek-title">{{ visibleCustomers.length }} khách hàng trên lộ trình</strong>
              <small class="peek-sub">
                Gần nhất: {{ visibleCustomers[0] ? `${visibleCustomers[0].customerName} (~${distanceFromStore(visibleCustomers[0])} km)` : 'Không có' }}
              </small>
            </div>
            <button type="button" class="peek-open-btn">
              Xem danh sách ❯
            </button>
          </div>

          <!-- TRẠNG THÁI 2: DANH SÁCH KHÁCH (EXPANDED LIST) -->
          <div v-else-if="sheetState === 'expanded'" class="xanhsm-list-content">
            <div class="drawer-header">
              <div>
                <h3 class="drawer-title">Danh sách khách theo khoảng cách</h3>
                <small class="drawer-sub">Ưu tiên khách gần vị trí của bạn nhất</small>
              </div>
              <button type="button" class="drawer-close-btn" @click="sheetState = 'peek'">✕</button>
            </div>

            <div class="xanhsm-cards-scroll">
              <div
                v-for="(customer, idx) in visibleCustomers"
                :key="`${customer.recordType}:${customer.id}`"
                :class="['xanhsm-customer-card', { active: selected?.id === customer.id }]"
                @click="focusAndSelectCustomer(customer)"
              >
                <div class="card-left">
                  <span class="card-num">{{ idx + 1 }}</span>
                  <div class="card-info">
                    <div class="card-name-row">
                      <strong>{{ customer.customerName }}</strong>
                      <span :class="['card-status-badge', { visited: customer.visitedAt }]">
                        {{ customer.visitedAt ? '✓ Đã ghé' : '● Chưa đi' }}
                      </span>
                    </div>
                    <p class="card-address">
                      📍 {{ customer.province }}{{ customer.address ? ` · ${customer.address}` : '' }}
                    </p>
                    <span v-if="customer.interest" class="card-interest">{{ customer.interest }}</span>
                  </div>
                </div>
                <div class="card-right">
                  <span class="card-km">~{{ distanceFromStore(customer) }} km</span>
                  <a
                    v-if="customer.phone"
                    :href="`tel:${customer.phone}`"
                    class="card-call-btn"
                    title="Gọi ngay"
                    @click.stop
                  >
                    📞
                  </a>
                </div>
              </div>
              <p v-if="!visibleCustomers.length" class="map-empty">
                Không tìm thấy khách hàng nào theo bộ lọc.
              </p>
            </div>
          </div>

          <!-- TRẠNG THÁI 3: CHI TIẾT KHÁCH HÀNG (CUSTOMER DETAIL CARD - NHƯ NHẬN CUỐC XANH SM) -->
          <div v-else-if="sheetState === 'detail' && selected" class="xanhsm-detail-content">
            <div class="drawer-header detail-header">
              <div class="detail-name-group">
                <div class="detail-name-row">
                  <h3 class="detail-customer-name">{{ selected.customerName }}</h3>
                  <span :class="['card-status-badge', { visited: selected.visitedAt }]">
                    {{ selected.visitedAt ? '✓ Đã ghé thăm' : '● Chưa đi' }}
                  </span>
                </div>
                <p class="detail-location">
                  📍 {{ selected.province }}{{ selected.address ? ` · ${selected.address}` : '' }}
                  <b class="detail-dist">(~{{ distanceFromStore(selected) }} km)</b>
                </p>
              </div>
              <button type="button" class="drawer-close-btn" @click="closeDetailSheet">✕</button>
            </div>

            <!-- Nhu cầu & sản phẩm khách quan tâm -->
            <div v-if="selected.interest || safeImage(selected.interestImage)" class="detail-product-card">
              <img
                v-if="safeImage(selected.interestImage)"
                :src="safeImage(selected.interestImage)"
                class="detail-thumb"
                alt=""
              >
              <div class="detail-product-info">
                <small>Sản phẩm quan tâm:</small>
                <strong>{{ selected.interest || 'Dàn Karaoke Gia Đình' }}</strong>
              </div>
            </div>

            <!-- HÀNG NÚT BẤM TO CHUẨN APP XANH SM: GỌI ĐIỆN & CHỈ ĐƯỜNG -->
            <div class="xanhsm-action-grid">
              <a
                v-if="selected.phone"
                :href="`tel:${selected.phone}`"
                class="xanhsm-action-btn btn-call"
              >
                <span class="action-icon">📞</span>
                <div class="action-text">
                  <small>GỌI KHÁCH</small>
                  <strong>{{ selected.phone }}</strong>
                </div>
              </a>
              <a
                :href="googleMapsUrl(selected)"
                target="_blank"
                rel="noopener"
                class="xanhsm-action-btn btn-direct"
              >
                <span class="action-icon">🧭</span>
                <div class="action-text">
                  <small>CHỈ ĐƯỜNG</small>
                  <strong>Google Maps</strong>
                </div>
              </a>
            </div>

            <!-- Hàng nút phụ: Đánh dấu đã đi & Mở hồ sơ CRM -->
            <div class="xanhsm-sub-actions">
              <button
                type="button"
                class="xanhsm-sub-btn visit-btn"
                :disabled="visitBusy"
                @click="toggleVisited(selected)"
              >
                {{ selected.visitedAt ? '↶ Đánh dấu chưa đi' : '✓ Đã hoàn thành ghé thăm' }}
              </button>
              <button
                type="button"
                class="xanhsm-sub-btn crm-btn"
                @click="openCrm(selected)"
              >
                👤 Xem hồ sơ CRM ↗
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
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
const locationBusy = ref(false)
const trackingLocation = ref(false)
const error = ref('')
const unlocatedCount = ref(0)
const isMobile = ref(false)

// Trạng thái của Bottom Drawer trên Mobile: 'peek' (thu gọn) | 'expanded' (danh sách) | 'detail' (chi tiết khách)
const sheetState = ref('peek')

const mapElementDesktop = ref(null)
const mapElementMobile = ref(null)

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
    const wasMobile = isMobile.value
    isMobile.value = window.innerWidth <= 860
    if (wasMobile !== isMobile.value) {
      nextTick(() => {
        reInitMap()
      })
    }
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
  return `<div class="customer-popup">${image ? `<img src="${escapeHtml(image)}" alt="">` : ''}<strong>${escapeHtml(customer.customerName)}</strong><b>${customer.visitedAt ? `✓ Đã đi${customer.visitedBy ? ` · ${escapeHtml(customer.visitedBy)}` : ''}` : '● Chưa đi'}</b>${customer.interest ? `<span>${escapeHtml(customer.interest)}</span>` : ''}${customer.phone ? `<a href="tel:${escapeHtml(customer.phone)}">📞 ${escapeHtml(customer.phone)}</a>` : ''}${customer.address ? `<span>${escapeHtml(customer.address)}</span>` : ''}<span>${escapeHtml(customer.province)} · ~${distanceFromStore(customer)} km</span><small>Vị trí ước tính theo trung tâm tỉnh/thành</small></div>`
}

function getActiveMapElement() {
  return isMobile.value ? mapElementMobile.value : mapElementDesktop.value
}

function initMap() {
  const targetEl = getActiveMapElement()
  if (!targetEl || map) return
  map = L.map(targetEl, {
    scrollWheelZoom: true,
    zoomControl: !isMobile.value // Trên mobile ẩn zoomControl mặc định, dùng cảm ứng 2 ngón tay hoặc nút nổi
  }).setView([origin.lat, origin.lng], 6)

  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a>'
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

function reInitMap() {
  if (map) {
    map.remove()
    map = null
    markerLayer = null
    tileLayer = null
  }
  nextTick(() => {
    initMap()
    renderMarkers()
  })
}

function renderMarkers() {
  if (!map || !markerLayer) return
  markerLayer.clearLayers()
  L.circleMarker([origin.lat, origin.lng], { radius: 8, color: '#008080', weight: 2, fillColor: '#00b1a9', fillOpacity: 1 })
    .bindPopup('<strong>Tú Audio</strong><br>Điểm gốc cửa hàng').addTo(markerLayer)
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
          <small>Bấm vào khách để chọn:</small>
          <div class="cluster-customer-list">${rows}</div>
        </div>`,
        { maxWidth: 300 }
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
    if (!isMobile.value) {
      marker.bindPopup(popupContent(customer), { maxWidth: 300 })
    }
    marker.on('click', () => {
      selectCustomer(customer)
    })
    marker.addTo(markerLayer)
    bounds.push([customer.lat, customer.lng])
  }

  if (deliveryLocation.value) {
    const current = deliveryLocation.value
    L.circleMarker([current.lat, current.lng], {
      radius: 11,
      color: '#008080',
      weight: 3,
      fillColor: '#00b1a9',
      fillOpacity: 1
    }).bindPopup('<strong>Vị trí của bạn (Xanh SM Mode)</strong>').addTo(markerLayer)
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
        <b>~${distanceBetween(deliveryLocation.value || origin, order)} km</b>
      </div>`
    )
    marker.addTo(markerLayer)
    bounds.push([order.lat, order.lng])
  }

  if (deliveryLocation.value) map.setView([deliveryLocation.value.lat, deliveryLocation.value.lng], 8)
  else if (bounds.length > 1) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 7 })
  else map.setView([origin.lat, origin.lng], 8)
}

function selectCustomer(customer) {
  selected.value = customer
  if (isMobile.value) {
    sheetState.value = 'detail'
  }
  const marker = markerLayer?.getLayers().find(item =>
    (item.customerRecord?.id === customer.id && item.customerRecord?.recordType === customer.recordType) ||
    item.clusterCustomers?.some(entry => entry.id === customer.id && entry.recordType === customer.recordType)
  )
  if (marker) {
    map.setView([customer.lat, customer.lng], Math.max(map.getZoom(), 8), { animate: true })
    if (!isMobile.value) marker.openPopup()
  }
}

function focusAndSelectCustomer(customer) {
  selectCustomer(customer)
}

function closeDetailSheet() {
  selected.value = null
  sheetState.value = 'peek'
}

function handleBackdropClick() {
  if (sheetState.value === 'detail') {
    closeDetailSheet()
  } else {
    sheetState.value = 'peek'
  }
}

function handleHandleClick() {
  if (sheetState.value === 'peek') {
    sheetState.value = 'expanded'
  } else if (sheetState.value === 'expanded') {
    sheetState.value = 'peek'
  } else if (sheetState.value === 'detail') {
    closeDetailSheet()
  }
}

function toggleSheetList() {
  if (sheetState.value === 'expanded') {
    sheetState.value = 'peek'
  } else {
    selected.value = null
    sheetState.value = 'expanded'
  }
}

function handleGpsFabClick() {
  if (deliveryLocation.value) {
    map?.setView([deliveryLocation.value.lat, deliveryLocation.value.lng], 12, { animate: true })
  } else {
    startLocationTracking()
  }
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
    if (map) setTimeout(() => map.invalidateSize(), 150)
  } catch (e) {
    error.value = e.message || 'Không tải được vị trí khách hàng.'
  } finally {
    busy.value = false
  }
}

function focusOrder(order) {
  if (!map) return
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
  locationBusy.value = true
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
      locationBusy.value = false
    },
    () => {
      stopLocationTracking()
      locationBusy.value = false
      error.value = 'Không lấy được GPS. Hãy cấp quyền định vị.'
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
  )
  trackingLocation.value = true
}

function toggleLocationTracking() {
  if (trackingLocation.value) stopLocationTracking()
  else startLocationTracking()
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
/* ========================================================
   CSS CHO DESKTOP (GIỮ NGUYÊN BỐ CỤC CHUẨN)
   ======================================================== */
.customer-map-page {
  --map-ink: #172033;
  --map-muted: #64748b;
  --xanh-primary: #00b1a9;
  --xanh-dark: #008080;
}
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
.map-notice {
  padding: 11px 14px;
  margin-bottom: 12px;
  border: 1px solid #fed7aa;
  background: #fff7ed;
  border-radius: 9px;
  color: #9a3412;
  font-size: 0.78rem;
}
.map-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  color: #64748b;
  font-size: 0.8rem;
  flex-wrap: wrap;
}
.map-toolbar b {
  color: #172033;
}
.map-toolbar input,
.map-search input {
  border: 1px solid #dbe2ec;
  border-radius: 8px;
  padding: 9px 10px;
  font: inherit;
}
.map-toolbar input {
  margin-left: auto;
  min-width: 250px;
}
.map-toolbar select {
  border: 1px solid #dbe2ec;
  border-radius: 8px;
  padding: 9px 10px;
  background: #fff;
  color: #172033;
  font: inherit;
}
.map-workspace {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  height: min(74vh, 760px);
  min-height: 500px;
  padding: 0;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
}
.map-customer-list {
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  background: #fff;
}
.map-search {
  position: sticky;
  top: 0;
  z-index: 2;
  background: white;
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
}
.map-search input {
  width: 100%;
}
.map-search small {
  display: block;
  margin-top: 5px;
  color: #64748b;
  font-size: 0.68rem;
}
.map-customer-row {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 0;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  text-align: left;
  cursor: pointer;
  color: #172033;
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
}
.row-main strong {
  font-size: 0.82rem;
}
.row-main small {
  font-size: 0.72rem;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.map-canvas {
  height: 100%;
  min-width: 0;
  z-index: 0;
}
.map-selected {
  display: grid;
  gap: 8px;
  padding: 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  color: #475569;
  font-size: 0.76rem;
}
.selected-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #172033;
  font-size: 0.9rem;
}
.selected-head button {
  border: 0;
  background: transparent;
  font-size: 1.4rem;
  cursor: pointer;
  color: #64748b;
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
.visit-toggle {
  color: #166534;
  border-color: #86efac;
  background: #f0fdf4;
}
.delivery-next {
  padding: 12px 14px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
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
  font-size: 0.84rem;
  color: #172033;
}
.delivery-next-head small {
  font-size: 0.7rem;
  color: #64748b;
}
.delivery-next-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 7px;
  margin-top: 10px;
}
.delivery-next-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  text-align: left;
  cursor: pointer;
}
.delivery-next-item > b {
  display: grid;
  place-items: center;
  width: 23px;
  height: 23px;
  flex: none;
  border-radius: 50%;
  background: #ffedd5;
  color: #c2410c;
}
.delivery-next-item > span {
  display: grid;
  gap: 3px;
  min-width: 0;
}
.delivery-next-item strong {
  font-size: 0.73rem;
  color: #172033;
}
.delivery-next-item small {
  font-size: 0.68rem;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
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
.map-empty {
  padding: 20px;
  color: #94a3b8;
  font-size: 0.8rem;
  text-align: center;
}
.map-error {
  color: #b91c1c;
  font-size: 0.8rem;
  margin-top: 8px;
}

/* ========================================================
   CSS CHO MOBILE APP MODE (CHUẨN GIAO DIỆN XANH SM)
   Bản đồ tràn viền 100%, tìm kiếm nổi, FAB floating, Drawer 3 nấc
   ======================================================== */
@media (max-width: 860px) {
  .customer-map-page.mobile-app-mode {
    /* Đẩy tràn viền khỏi padding mặc định của admin-viewport */
    margin: -14px;
    height: calc(100dvh - 56px);
    width: calc(100% + 28px);
    overflow: hidden;
    position: relative;
    background: #e2e8f0;
  }

  .xanhsm-app-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  /* Bản đồ toàn màn hình làm nền */
  .xanhsm-map-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  /* Khối tìm kiếm nổi trên đỉnh bản đồ (Top Floating Bar) */
  .xanhsm-top-bar {
    position: absolute;
    top: 12px;
    left: 14px;
    right: 14px;
    z-index: 400;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none; /* Chỉ các phần tử con nhận touch */
  }

  .xanhsm-search-pill {
    pointer-events: auto;
    display: flex;
    align-items: center;
    background: #ffffff;
    border-radius: 999px;
    padding: 6px 14px;
    box-shadow: 0 4px 18px rgba(15, 23, 42, 0.16);
    border: 1px solid rgba(226, 232, 240, 0.8);
    height: 46px;
  }
  .search-icon {
    font-size: 1rem;
    margin-right: 8px;
    color: #64748b;
  }
  .xanhsm-input {
    flex: 1;
    border: 0;
    outline: 0;
    font-size: 0.85rem;
    font-family: inherit;
    color: #0f172a;
    background: transparent;
  }
  .xanhsm-input::placeholder {
    color: #94a3b8;
  }
  .search-clear {
    border: 0;
    background: #f1f5f9;
    color: #64748b;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    font-size: 0.7rem;
    cursor: pointer;
  }

  /* Chips lọc nổi phong cách Xanh SM */
  .xanhsm-filter-chips {
    pointer-events: auto;
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
  }
  .xanhsm-filter-chips::-webkit-scrollbar {
    display: none;
  }
  .xanhsm-chip {
    flex: none;
    border: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    color: #334155;
    font-size: 0.74rem;
    font-weight: 700;
    padding: 7px 12px;
    border-radius: 999px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .xanhsm-chip.active {
    background: #00b1a9;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 177, 169, 0.35);
  }
  .xanhsm-chip.warn.active {
    background: #ef4444;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
  }
  .xanhsm-chip.done.active {
    background: #16a34a;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35);
  }

  /* Nút bấm nổi FAB góc phải màn hình */
  .xanhsm-fab-group {
    position: absolute;
    right: 14px;
    bottom: 120px; /* Nằm ngay phía trên thanh Bottom Sheet */
    z-index: 400;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: bottom 0.25s cubic-bezier(0.2, 0.8, 0.4, 1);
  }
  .xanhsm-fab-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 0;
    background: #ffffff;
    color: #0f172a;
    font-size: 1.15rem;
    display: grid;
    place-items: center;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.18);
    cursor: pointer;
    position: relative;
    -webkit-tap-highlight-color: transparent;
  }
  .xanhsm-fab-btn:active {
    transform: scale(0.92);
  }
  .xanhsm-fab-btn.my-location .gps-dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #94a3b8;
  }
  .xanhsm-fab-btn.my-location.active .gps-dot {
    background: #00b1a9;
    box-shadow: 0 0 0 3px rgba(0, 177, 169, 0.3);
  }
  .xanhsm-fab-btn.list-toggle.active {
    background: #00b1a9;
    color: #ffffff;
  }

  /* Backdrop mờ khi mở full danh sách hoặc chi tiết */
  .xanhsm-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.35);
    backdrop-filter: blur(2px);
    z-index: 500;
  }

  /* ========================================================
     BOTTOM DRAWER PHONG CÁCH XANH SM
     ======================================================== */
  .xanhsm-bottom-drawer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: #ffffff;
    border-radius: 24px 24px 0 0;
    box-shadow: 0 -8px 30px rgba(15, 23, 42, 0.2);
    z-index: 600;
    transition: transform 0.26s cubic-bezier(0.2, 0.8, 0.4, 1), height 0.26s cubic-bezier(0.2, 0.8, 0.4, 1);
    display: flex;
    flex-direction: column;
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }

  .xanhsm-drag-handle-wrap {
    padding: 10px 0 6px;
    cursor: pointer;
    display: flex;
    justify-content: center;
  }
  .xanhsm-drag-bar {
    width: 44px;
    height: 5px;
    background: #cbd5e1;
    border-radius: 999px;
  }

  /* TRẠNG THÁI 1: PEEK (THU GỌN - CHỈ CAO ~85PX) */
  .xanhsm-bottom-drawer.state-peek {
    height: 88px;
  }
  .xanhsm-peek-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 18px 10px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .peek-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .peek-badge-car {
    font-size: 0.68rem;
    font-weight: 700;
    color: #008080;
    background: #e6fffa;
    padding: 2px 8px;
    border-radius: 999px;
    align-self: flex-start;
  }
  .peek-title {
    font-size: 0.9rem;
    font-weight: 800;
    color: #0f172a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .peek-sub {
    font-size: 0.72rem;
    color: #64748b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .peek-open-btn {
    border: 0;
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
    font-size: 0.78rem;
    padding: 8px 12px;
    border-radius: 999px;
    white-space: nowrap;
    cursor: pointer;
  }

  /* TRẠNG THÁI 2: EXPANDED LIST (MỞ RỘNG DANH SÁCH KHÁCH) */
  .xanhsm-bottom-drawer.state-expanded {
    height: 72vh;
  }
  .xanhsm-list-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    padding: 0 16px 10px;
  }
  .drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 10px;
    border-bottom: 1px solid #f1f5f9;
  }
  .drawer-title {
    font-size: 0.98rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
  }
  .drawer-sub {
    font-size: 0.72rem;
    color: #64748b;
  }
  .drawer-close-btn {
    border: 0;
    background: #f1f5f9;
    color: #64748b;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 0.88rem;
    cursor: pointer;
  }

  .xanhsm-cards-scroll {
    overflow-y: auto;
    flex: 1;
    padding: 10px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    -webkit-overflow-scrolling: touch;
  }
  .xanhsm-customer-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #ffffff;
    cursor: pointer;
    transition: all 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .xanhsm-customer-card:active {
    background: #f8fafc;
    border-color: #00b1a9;
  }
  .card-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
  }
  .card-num {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #f1f5f9;
    color: #475569;
    font-weight: 800;
    font-size: 0.72rem;
    flex: none;
  }
  .card-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .card-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .card-name-row strong {
    font-size: 0.88rem;
    color: #0f172a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .card-status-badge {
    font-size: 0.62rem;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 999px;
    background: #fee2e2;
    color: #b91c1c;
    white-space: nowrap;
  }
  .card-status-badge.visited {
    background: #dcfce7;
    color: #15803d;
  }
  .card-address {
    font-size: 0.74rem;
    color: #64748b;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .card-interest {
    font-size: 0.7rem;
    color: #008080;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .card-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: none;
    margin-left: 8px;
  }
  .card-km {
    font-size: 0.78rem;
    font-weight: 800;
    color: #00b1a9;
    background: #e6fffa;
    padding: 4px 8px;
    border-radius: 8px;
  }
  .card-call-btn {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #00b1a9;
    color: white;
    text-decoration: none;
    font-size: 0.85rem;
    box-shadow: 0 2px 6px rgba(0, 177, 169, 0.35);
  }

  /* TRẠNG THÁI 3: DETAIL (CHI TIẾT KHÁCH HÀNG KIỂU CUỐC XE XANH SM) */
  .xanhsm-bottom-drawer.state-detail {
    max-height: 85vh;
  }
  .xanhsm-detail-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 18px 12px;
    overflow-y: auto;
  }
  .detail-header {
    border-bottom: 0;
    padding-bottom: 0;
  }
  .detail-name-group {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .detail-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .detail-customer-name {
    font-size: 1.15rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
  }
  .detail-location {
    font-size: 0.8rem;
    color: #64748b;
    margin: 0;
  }
  .detail-dist {
    color: #00b1a9;
    font-weight: 800;
  }

  .detail-product-card {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 9px 12px;
  }
  .detail-thumb {
    width: 44px;
    height: 44px;
    object-fit: cover;
    border-radius: 8px;
    flex: none;
  }
  .detail-product-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .detail-product-info small {
    font-size: 0.68rem;
    color: #64748b;
  }
  .detail-product-info strong {
    font-size: 0.82rem;
    color: #0f172a;
  }

  /* HÀNG NÚT BẤM TO CHUẨN XANH SM */
  .xanhsm-action-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 2px;
  }
  .xanhsm-action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 14px;
    border-radius: 14px;
    text-decoration: none;
    min-height: 52px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.1s ease;
  }
  .xanhsm-action-btn:active {
    transform: scale(0.98);
  }
  .btn-call {
    background: linear-gradient(135deg, #00b1a9 0%, #008080 100%);
    color: #ffffff;
  }
  .btn-direct {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: #ffffff;
  }
  .action-icon {
    font-size: 1.35rem;
    flex: none;
  }
  .action-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .action-text small {
    font-size: 0.62rem;
    font-weight: 700;
    opacity: 0.88;
    letter-spacing: 0.5px;
  }
  .action-text strong {
    font-size: 0.84rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Nút phụ: Đã ghé thăm & CRM */
  .xanhsm-sub-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .xanhsm-sub-btn {
    padding: 10px;
    border-radius: 10px;
    font-size: 0.78rem;
    font-weight: 700;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    color: #334155;
    cursor: pointer;
    min-height: 42px;
  }
  .xanhsm-sub-btn.visit-btn {
    background: #f0fdf4;
    border-color: #86efac;
    color: #15803d;
  }
  .xanhsm-sub-btn.crm-btn {
    background: #fffbeb;
    border-color: #fde68a;
    color: #b45309;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
}

/* ========================================================
   LEAFLET POPUP VÀ CLUSTER CHUNG
   ======================================================== */
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
  color: #008080;
  font-weight: 700;
  text-decoration: none;
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
  border: 1px solid #ccfbf1;
  border-radius: 6px;
  background: #f0fdfa;
  padding: 8px 10px;
  text-align: left;
  color: #0f766e;
  cursor: pointer;
  font-size: 12px;
  width: 100%;
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
  border: 2px solid #008080;
  border-radius: 50%;
  background: #00b1a9;
  color: white;
  font-weight: 800;
  box-shadow: 0 2px 8px rgba(0, 177, 169, 0.4);
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
</style>
