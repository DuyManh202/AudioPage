<template>
  <div class="adm-page customer-map-page">
    <div class="adm-page-head">
      <div>
        <h1 class="adm-page-title">Bản đồ khách hàng</h1>
        <p class="adm-page-sub">Khách từ Fanpage và CRM, ghim đỏ theo tỉnh/thành được nhắc trong hội thoại hoặc hồ sơ.</p>
      </div>
      <button class="adm-btn" :disabled="busy" @click="loadData">{{ busy ? 'Đang cập nhật…' : '↻ Làm mới' }}</button>
    </div>

    <div class="map-notice"><strong>Khoảng cách là ước tính:</strong> khách chỉ ghi tỉnh/thành sẽ được đặt tại trung tâm tỉnh; số km tính đường chim bay từ cửa hàng, không phải quãng đường lái xe hay vị trí chính xác của nhà khách.</div>
    <section v-if="deliveryLocation" class="delivery-next adm-card">
      <div class="delivery-next-head"><div><strong>Đơn giao tiếp theo gần bạn</strong><small><i :class="['gps-indicator', { active: trackingLocation }]"></i>{{ trackingLocation ? 'Đang theo dõi GPS' : 'Đã dừng theo dõi' }} · cập nhật {{ deliveryLocation.updatedAt ? formatVisitTime(deliveryLocation.updatedAt) : '' }} · khoảng cách đường chim bay</small></div><button class="adm-btn" :disabled="locationBusy" @click="toggleLocationTracking">{{ trackingLocation ? 'Tạm dừng theo dõi' : 'Bật theo dõi vị trí' }}</button></div>
      <div v-if="nearestOrders.length" class="delivery-next-list"><button v-for="(order, index) in nearestOrders" :key="order.id" class="delivery-next-item" @click="focusOrder(order)"><b>{{ index + 1 }}</b><span><strong>{{ order.customerName }} · {{ order.distanceKm }} km</strong><small>{{ order.address }} · {{ order.status === 'DANG_GIAO' ? 'Đang giao' : 'Đã xác nhận' }}</small></span></button></div>
      <p v-else class="map-empty">Không có đơn đã xác nhận hoặc đang giao có tỉnh/thành để gợi ý.</p>
    </section>
    <div class="map-toolbar"><span><b>{{ visibleCustomers.length }}</b> khách có vị trí</span><span><b>{{ visitedCount }}</b> đã đi · <b>{{ unvisitedCount }}</b> chưa đi</span><span>{{ unlocatedCount }} khách chưa có tỉnh/thành</span><select v-model="visitFilter" aria-label="Lọc theo lượt ghé"><option value="ALL">Tất cả điểm</option><option value="NOT_VISITED">Chưa đi</option><option value="VISITED">Đã đi</option></select><input v-model="keyword" placeholder="Tìm tên, số điện thoại, tỉnh, sản phẩm…"></div>

    <section class="map-workspace adm-card">
      <aside class="map-customer-list">
        <div v-if="selected" class="map-selected">
          <div class="selected-head"><strong>{{ selected.customerName }}</strong><button type="button" aria-label="Đóng thông tin" @click="selected = null">×</button></div>
          <img v-if="safeImage(selected.interestImage)" :src="safeImage(selected.interestImage)" :alt="selected.interest || 'Sản phẩm khách quan tâm'">
          <span v-if="selected.interest" class="selected-interest">{{ selected.interest }}</span>
          <span v-if="selected.phone"><b>SĐT:</b> <a :href="`tel:${selected.phone}`">{{ selected.phone }}</a></span>
          <span><b>Khu vực:</b> {{ selected.address ? `${selected.address}, ` : '' }}{{ selected.province }}</span>
          <span><b>Khoảng cách:</b> ~{{ distanceFromStore(selected).toLocaleString('vi-VN') }} km (ước tính)</span>
          <a class="google-maps-link" :href="googleMapsUrl(selected)" target="_blank" rel="noopener">Mở vị trí trên Google Maps ↗</a>
          <span v-if="selected.sourceAdName"><b>Quảng cáo:</b> {{ selected.sourceAdName }}</span>
          <span class="visit-state" :class="{ visited: selected.visitedAt }">{{ selected.visitedAt ? `Đã đi${selected.visitedBy ? ` · ${selected.visitedBy}` : ''} · ${formatVisitTime(selected.visitedAt)}` : 'Chưa đi' }}</span>
          <button class="adm-btn visit-toggle" :disabled="visitBusy" @click="toggleVisited(selected)">{{ visitBusy ? 'Đang lưu…' : selected.visitedAt ? '↶ Đánh dấu chưa đi' : '✓ Đánh dấu đã đi' }}</button>
          <button class="adm-btn adm-btn-gold open-crm" @click="openCrm(selected)">Mở hồ sơ khách hàng</button>
        </div>
        <div class="map-search"><input v-model="keyword" placeholder="Tìm trong danh sách…"><small>Gần {{ deliveryLocation ? 'vị trí hiện tại' : 'cửa hàng' }} trước</small></div>
        <button v-for="customer in visibleCustomers" :key="`${customer.recordType}:${customer.id}`" :class="['map-customer-row', { active: selected?.id === customer.id && selected?.recordType === customer.recordType }]" @click="selectCustomer(customer)">
          <span :class="['red-dot', { visited: customer.visitedAt }]"></span><span class="row-main"><strong>{{ customer.customerName }} <em v-if="customer.visitedAt" class="visited-badge">Đã đi</em></strong><small>{{ customer.province }} · ~{{ distanceFromStore(customer).toLocaleString('vi-VN') }} km</small><small>{{ customer.phone || customer.interest || 'Chưa có số điện thoại' }}</small></span>
        </button>
        <p v-if="!visibleCustomers.length" class="map-empty">Chưa có khách nào có tỉnh/thành để hiển thị.</p>
      </aside>
      <div ref="mapElement" class="map-canvas" aria-label="Bản đồ vị trí khách hàng"></div>
    </section>
    <p v-if="error" class="map-error">{{ error }}</p>
    <p class="map-attribution">Bản đồ © OpenStreetMap contributors. Vị trí khách được suy ra theo tỉnh/thành, không phải địa chỉ chính xác.</p>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { apiRequest } from '../../utils/api'

const router = useRouter()
const customers = ref([]), deliveryOrders = ref([]), deliveryLocation = ref(null), selected = ref(null), keyword = ref(''), visitFilter = ref('ALL'), busy = ref(false), visitBusy = ref(false), trackingLocation = ref(false), error = ref(''), unlocatedCount = ref(0), mapElement = ref(null)
let map = null, markerLayer = null, tileLayer = null, refreshTimer = null, locationWatchId = null, tileErrorCount = 0, tileLoadCount = 0, usingFallbackTiles = false, origin = { lat: 21.31, lng: 105.60 }
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
  return `<div class="customer-popup">${image ? `<img src="${escapeHtml(image)}" alt="">` : ''}<strong>${escapeHtml(customer.customerName)}</strong><b>${customer.visitedAt ? `✓ Đã đi${customer.visitedBy ? ` · ${escapeHtml(customer.visitedBy)}` : ''}` : '● Chưa đi'}</b>${customer.interest ? `<span>${escapeHtml(customer.interest)}</span>` : ''}${customer.phone ? `<a href="tel:${escapeHtml(customer.phone)}">${escapeHtml(customer.phone)}</a>` : ''}${customer.address ? `<span>${escapeHtml(customer.address)}</span>` : ''}<span>${escapeHtml(customer.province)} · khoảng ${distanceFromStore(customer)} km</span><small>Vị trí ước tính theo trung tâm tỉnh/thành</small></div>`
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
  L.circleMarker([origin.lat, origin.lng], { radius: 8, color: '#1d4ed8', weight: 2, fillColor: '#3b82f6', fillOpacity: 1 }).bindPopup('<strong>Tú Audio</strong><br>Điểm gốc tính khoảng cách (khu vực cửa hàng)').addTo(markerLayer)
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
      const marker = L.marker([group[0].lat, group[0].lng], { icon: L.divIcon({ className: 'customer-cluster-pin', html: `<span class="${visitClass}">${group.length}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] }) })
      marker.clusterCustomers = group
      const rows = group.map((customer, index) => `<button type="button" data-map-customer="${index}">${customer.visitedAt ? '✓ ' : '● '}${escapeHtml(customer.customerName)}${customer.phone ? ` · ${escapeHtml(customer.phone)}` : ''}</button>`).join('')
      marker.bindPopup(`<div class="customer-popup"><strong>${escapeHtml(group[0].province)} · ${group.length} khách</strong><small>Vị trí ghim theo trung tâm tỉnh/thành</small><div class="cluster-customer-list">${rows}</div></div>`, { maxWidth: 320 })
      marker.on('popupopen', event => event.popup.getElement()?.querySelectorAll('[data-map-customer]').forEach(button => button.addEventListener('click', () => selectCustomer(group[Number(button.dataset.mapCustomer)]))))
      marker.addTo(markerLayer)
      bounds.push([group[0].lat, group[0].lng])
      continue
    }
    const customer = group[0]
    const marker = L.circleMarker([customer.lat, customer.lng], { radius: 8, color: customer.visitedAt ? '#166534' : '#991b1b', weight: 1.5, fillColor: customer.visitedAt ? '#22c55e' : '#ef4444', fillOpacity: 0.92 })
    marker.customerRecord = customer
    marker.bindPopup(popupContent(customer), { maxWidth: 300 })
    marker.on('click', () => { selected.value = customer })
    marker.addTo(markerLayer)
    bounds.push([customer.lat, customer.lng])
  }
  if (deliveryLocation.value) {
    const current = deliveryLocation.value
    L.circleMarker([current.lat, current.lng], { radius: 10, color: '#1d4ed8', weight: 3, fillColor: '#60a5fa', fillOpacity: 1 }).bindPopup('<strong>Vị trí hiện tại của bạn</strong>').addTo(markerLayer)
    bounds.push([current.lat, current.lng])
  }
  for (const order of deliveryOrders.value) {
    const marker = L.circleMarker([order.lat, order.lng], { radius: 9, color: '#7c2d12', weight: 2, fillColor: '#f97316', fillOpacity: 0.95 })
    marker.orderRecord = order
    marker.bindPopup(`<div class="customer-popup"><strong>Đơn ${escapeHtml(String(order.id).slice(0, 8))} · ${escapeHtml(order.customerName)}</strong><span>${escapeHtml(order.address)}</span><b>~${distanceBetween(deliveryLocation.value || origin, order)} km từ ${deliveryLocation.value ? 'vị trí hiện tại' : 'cửa hàng'}</b><small>Vị trí ước tính theo trung tâm ${escapeHtml(order.province)}</small></div>`)
    marker.addTo(markerLayer)
    bounds.push([order.lat, order.lng])
  }
  if (deliveryLocation.value) map.setView([deliveryLocation.value.lat, deliveryLocation.value.lng], 8)
  else if (bounds.length > 1) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 7 })
  else map.setView([origin.lat, origin.lng], 8)
}
async function loadData() {
  busy.value = true
  error.value = ''
  try {
    const response = await apiRequest('/admin/customer-map')
    customers.value = response.data || []
    deliveryOrders.value = response.deliveryOrders || []
    try { deliveryLocation.value = JSON.parse(localStorage.getItem('deliveryCurrentLocation') || 'null') } catch { deliveryLocation.value = null }
    unlocatedCount.value = Number(response.unlocatedCount || 0)
    if (response.origin?.lat && response.origin?.lng) origin = { lat: Number(response.origin.lat), lng: Number(response.origin.lng) }
    await nextTick()
    initMap()
    renderMarkers()
    if (map) setTimeout(() => map.invalidateSize(), 0)
  } catch (e) {
    error.value = e.message || 'Không tải được vị trí khách hàng.'
  } finally {
    busy.value = false
  }
}
function focusOrder(order) {
  if (!map) return
  const marker = markerLayer?.getLayers().find(item => item.orderRecord?.id === order.id)
  if (marker) { map.setView([order.lat, order.lng], Math.max(map.getZoom(), 8)); marker.openPopup() }
}
function stopLocationTracking() {
  if (locationWatchId !== null && navigator.geolocation) navigator.geolocation.clearWatch(locationWatchId)
  locationWatchId = null
  trackingLocation.value = false
}
function startLocationTracking() {
  if (!navigator.geolocation || locationWatchId !== null) return
  error.value = ''
  locationWatchId = navigator.geolocation.watchPosition(position => {
    deliveryLocation.value = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: Math.round(position.coords.accuracy || 0), updatedAt: new Date().toISOString() }
    localStorage.setItem('deliveryCurrentLocation', JSON.stringify(deliveryLocation.value))
    trackingLocation.value = true
  }, () => {
    stopLocationTracking()
    error.value = 'Không lấy được GPS liên tục. Hãy cấp quyền vị trí và mở trang bằng HTTPS.'
  }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 })
  trackingLocation.value = true
}
function toggleLocationTracking() {
  if (trackingLocation.value) stopLocationTracking()
  else startLocationTracking()
}
function selectCustomer(customer) {
  selected.value = customer
  const marker = markerLayer?.getLayers().find(item => item.customerRecord?.id === customer.id && item.customerRecord?.recordType === customer.recordType || item.clusterCustomers?.some(entry => entry.id === customer.id && entry.recordType === customer.recordType))
  if (marker) { map.setView([customer.lat, customer.lng], Math.max(map.getZoom(), 8)); marker.openPopup() }
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
  if (customer.recordType === 'FACEBOOK' || customer.facebookCareId) router.push({ path: '/admin/facebook-care', query: { customerId: customer.facebookCareId || customer.id } })
  else router.push({ path: '/admin/leads', query: { customerId: customer.id, phone: customer.phone } })
}
onMounted(() => {
  loadData()
  startLocationTracking()
  refreshTimer = setInterval(() => {
    if (document.visibilityState === 'visible' && !busy.value) loadData()
  }, 30000)
})
onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  stopLocationTracking()
  if (map) { map.remove(); map = null }
})
</script>

<style scoped>
.customer-map-page{--map-ink:#172033;--map-muted:#64748b}.map-notice{padding:11px 14px;margin-bottom:12px;border:1px solid #fed7aa;background:#fff7ed;border-radius:9px;color:#9a3412;font-size:.78rem}.map-toolbar{display:flex;align-items:center;gap:18px;margin-bottom:12px;color:#64748b;font-size:.8rem}.map-toolbar b{color:#172033}.map-toolbar input,.map-search input{border:1px solid #dbe2ec;border-radius:8px;padding:9px 10px;font:inherit}.map-toolbar input{margin-left:auto;min-width:250px}.map-workspace{display:grid;grid-template-columns:330px minmax(0,1fr);height:min(72vh,760px);min-height:500px;padding:0;overflow:hidden}.map-customer-list{border-right:1px solid #e2e8f0;overflow:auto;background:#fff}.map-search{position:sticky;top:0;z-index:2;background:white;padding:12px;border-bottom:1px solid #e2e8f0}.map-search input{width:100%}.map-customer-row{display:flex;width:100%;align-items:flex-start;gap:10px;padding:12px;border:0;border-bottom:1px solid #f1f5f9;background:white;text-align:left;cursor:pointer;color:#172033}.map-customer-row:hover,.map-customer-row.active{background:#eff6ff}.red-dot{width:12px;height:12px;flex:none;margin-top:4px;border-radius:50%;background:#ef4444;border:2px solid #991b1b}.row-main{display:grid;gap:4px;min-width:0}.row-main strong{font-size:.82rem}.row-main small{font-size:.72rem;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.map-canvas{height:100%;min-width:0;z-index:0}.map-selected{display:grid;gap:8px;padding:14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#475569;font-size:.76rem}.selected-head{display:flex;justify-content:space-between;align-items:center;color:#172033;font-size:.9rem}.selected-head button{border:0;background:transparent;font-size:1.4rem;cursor:pointer;color:#64748b}.map-selected>img{width:100%;height:130px;object-fit:cover;border-radius:8px;background:white}.map-selected a{color:#1d4ed8}.selected-interest{color:#334155;font-weight:650}.open-crm{justify-self:start;margin-top:2px}.map-empty{padding:20px;color:#94a3b8;font-size:.8rem;text-align:center}.map-error{color:#b91c1c}.map-attribution{font-size:.68rem;color:#94a3b8;margin-top:8px}:global(.customer-popup){display:grid;gap:5px;min-width:160px;color:#172033;font:12px/1.4 Arial,sans-serif}:global(.customer-popup img){width:100%;height:110px;object-fit:cover;border-radius:6px}:global(.customer-popup strong){font-size:13px}:global(.customer-popup a){color:#1d4ed8}:global(.customer-popup small){color:#64748b}:global(.cluster-customer-list){display:grid;gap:4px;max-height:180px;overflow:auto}:global(.cluster-customer-list button){border:0;border-radius:5px;background:#eff6ff;padding:6px;text-align:left;color:#1e3a8a;cursor:pointer;font-size:11px}:global(.customer-cluster-pin){display:grid;place-items:center;border:0!important;background:transparent!important}:global(.customer-cluster-pin span){display:grid;place-items:center;width:34px;height:34px;border:2px solid #991b1b;border-radius:50%;background:#ef4444;color:white;font-weight:800;box-shadow:0 1px 4px #0004}@media(max-width:760px){.map-workspace{grid-template-columns:1fr;height:auto;min-height:0}.map-customer-list{max-height:300px;border-right:0;border-bottom:1px solid #e2e8f0}.map-canvas{height:55vh;min-height:360px}.map-toolbar{flex-wrap:wrap;gap:8px}.map-toolbar input{margin:0;width:100%;min-width:0}}
.map-toolbar select{border:1px solid #dbe2ec;border-radius:8px;padding:9px 10px;background:#fff;color:#172033;font:inherit}.red-dot.visited{background:#22c55e;border-color:#166534}.visited-badge{font-size:.65rem;font-style:normal;font-weight:700;color:#15803d;background:#dcfce7;border-radius:999px;padding:2px 6px}.visit-state{font-weight:700;color:#b91c1c}.visit-state.visited{color:#15803d}.visit-toggle{justify-self:start;color:#166534;border-color:#86efac;background:#f0fdf4}.visit-toggle:hover{background:#dcfce7}:global(.customer-cluster-pin span.visited){background:#22c55e}:global(.customer-cluster-pin span.mixed){background:#f59e0b}@media(max-width:760px){.map-toolbar select{width:100%}}
.delivery-next{padding:12px 14px;margin-bottom:12px}.delivery-next-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.delivery-next-head>div{display:grid;gap:3px}.delivery-next-head strong{font-size:.84rem;color:#172033}.delivery-next-head small,.delivery-next-item small{font-size:.7rem;color:#64748b}.delivery-next-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:7px;margin-top:10px}.delivery-next-item{display:flex;align-items:center;gap:9px;min-width:0;padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;background:white;text-align:left;cursor:pointer}.delivery-next-item:hover{border-color:#93c5fd;background:#eff6ff}.delivery-next-item>b{display:grid;place-items:center;width:23px;height:23px;flex:none;border-radius:50%;background:#ffedd5;color:#c2410c}.delivery-next-item>span{display:grid;gap:3px;min-width:0}.delivery-next-item strong{font-size:.73rem;color:#172033}.delivery-next-item small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.google-maps-link{color:#1d4ed8;font-weight:700}.map-selected .google-maps-link{justify-self:start}
.gps-indicator{display:inline-block;width:8px;height:8px;margin-right:5px;border-radius:50%;background:#94a3b8}.gps-indicator.active{background:#16a34a;box-shadow:0 0 0 3px #dcfce7}
.map-search small{display:block;margin-top:5px;color:#64748b;font-size:.68rem}
</style>
