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
    <div class="map-toolbar"><span><b>{{ visibleCustomers.length }}</b> khách có vị trí</span><span>{{ unlocatedCount }} khách chưa có tỉnh/thành</span><input v-model="keyword" placeholder="Tìm tên, số điện thoại, tỉnh, sản phẩm…"></div>

    <section class="map-workspace adm-card">
      <aside class="map-customer-list">
        <div v-if="selected" class="map-selected">
          <div class="selected-head"><strong>{{ selected.customerName }}</strong><button type="button" aria-label="Đóng thông tin" @click="selected = null">×</button></div>
          <img v-if="safeImage(selected.interestImage)" :src="safeImage(selected.interestImage)" :alt="selected.interest || 'Sản phẩm khách quan tâm'">
          <span v-if="selected.interest" class="selected-interest">{{ selected.interest }}</span>
          <span v-if="selected.phone"><b>SĐT:</b> <a :href="`tel:${selected.phone}`">{{ selected.phone }}</a></span>
          <span><b>Khu vực:</b> {{ selected.address ? `${selected.address}, ` : '' }}{{ selected.province }}</span>
          <span><b>Khoảng cách:</b> ~{{ distanceFromStore(selected).toLocaleString('vi-VN') }} km (ước tính)</span>
          <span v-if="selected.sourceAdName"><b>Quảng cáo:</b> {{ selected.sourceAdName }}</span>
          <button class="adm-btn adm-btn-gold open-crm" @click="openCrm(selected)">Mở hồ sơ khách hàng</button>
        </div>
        <div class="map-search"><input v-model="keyword" placeholder="Tìm trong danh sách…"></div>
        <button v-for="customer in visibleCustomers" :key="`${customer.recordType}:${customer.id}`" :class="['map-customer-row', { active: selected?.id === customer.id && selected?.recordType === customer.recordType }]" @click="selectCustomer(customer)">
          <span class="red-dot"></span><span class="row-main"><strong>{{ customer.customerName }}</strong><small>{{ customer.province }} · ~{{ distanceFromStore(customer).toLocaleString('vi-VN') }} km</small><small>{{ customer.phone || customer.interest || 'Chưa có số điện thoại' }}</small></span>
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
const customers = ref([]), selected = ref(null), keyword = ref(''), busy = ref(false), error = ref(''), unlocatedCount = ref(0), mapElement = ref(null)
let map = null, markerLayer = null, refreshTimer = null, origin = { lat: 21.31, lng: 105.60 }
const visibleCustomers = computed(() => {
  const term = keyword.value.trim().toLocaleLowerCase('vi')
  if (!term) return customers.value
  return customers.value.filter(c => `${c.customerName} ${c.phone} ${c.address} ${c.province} ${c.interest} ${c.sourceAdName}`.toLocaleLowerCase('vi').includes(term))
})
watch(visibleCustomers, renderMarkers)
const distanceFromStore = customer => {
  const rad = degree => degree * Math.PI / 180
  const dLat = rad(customer.lat - origin.lat), dLng = rad(customer.lng - origin.lng)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(origin.lat)) * Math.cos(rad(customer.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}
const safeImage = value => /^(https?:\/\/|data:image\/)/i.test(String(value || '')) ? value : ''
const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const popupContent = customer => {
  const image = safeImage(customer.interestImage)
  return `<div class="customer-popup">${image ? `<img src="${escapeHtml(image)}" alt="">` : ''}<strong>${escapeHtml(customer.customerName)}</strong>${customer.interest ? `<span>${escapeHtml(customer.interest)}</span>` : ''}${customer.phone ? `<a href="tel:${escapeHtml(customer.phone)}">${escapeHtml(customer.phone)}</a>` : ''}<span>${escapeHtml(customer.province)} · khoảng ${distanceFromStore(customer)} km</span><small>Vị trí ước tính theo trung tâm tỉnh/thành</small></div>`
}
function initMap() {
  if (!mapElement.value || map) return
  map = L.map(mapElement.value, { scrollWheelZoom: true, zoomControl: true }).setView([origin.lat, origin.lng], 6)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' }).addTo(map)
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
      const marker = L.marker([group[0].lat, group[0].lng], { icon: L.divIcon({ className: 'customer-cluster-pin', html: `<span>${group.length}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] }) })
      marker.clusterCustomers = group
      const rows = group.map((customer, index) => `<button type="button" data-map-customer="${index}">${escapeHtml(customer.customerName)}${customer.phone ? ` · ${escapeHtml(customer.phone)}` : ''}</button>`).join('')
      marker.bindPopup(`<div class="customer-popup"><strong>${escapeHtml(group[0].province)} · ${group.length} khách</strong><small>Vị trí ghim theo trung tâm tỉnh/thành</small><div class="cluster-customer-list">${rows}</div></div>`, { maxWidth: 320 })
      marker.on('popupopen', event => event.popup.getElement()?.querySelectorAll('[data-map-customer]').forEach(button => button.addEventListener('click', () => selectCustomer(group[Number(button.dataset.mapCustomer)]))))
      marker.addTo(markerLayer)
      bounds.push([group[0].lat, group[0].lng])
      continue
    }
    const customer = group[0]
    const marker = L.circleMarker([customer.lat, customer.lng], { radius: 8, color: '#991b1b', weight: 1.5, fillColor: '#ef4444', fillOpacity: 0.92 })
    marker.customerRecord = customer
    marker.bindPopup(popupContent(customer), { maxWidth: 300 })
    marker.on('click', () => { selected.value = customer })
    marker.addTo(markerLayer)
    bounds.push([customer.lat, customer.lng])
  }
  if (bounds.length > 1) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 7 })
  else map.setView([origin.lat, origin.lng], 8)
}
async function loadData() {
  busy.value = true
  error.value = ''
  try {
    const response = await apiRequest('/admin/customer-map')
    customers.value = response.data || []
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
function selectCustomer(customer) {
  selected.value = customer
  const marker = markerLayer?.getLayers().find(item => item.customerRecord?.id === customer.id && item.customerRecord?.recordType === customer.recordType || item.clusterCustomers?.some(entry => entry.id === customer.id && entry.recordType === customer.recordType))
  if (marker) { map.setView([customer.lat, customer.lng], Math.max(map.getZoom(), 8)); marker.openPopup() }
}
function openCrm(customer) {
  if (customer.recordType === 'FACEBOOK' || customer.facebookCareId) router.push({ path: '/admin/facebook-care', query: { customerId: customer.facebookCareId || customer.id } })
  else router.push({ path: '/admin/leads', query: { customerId: customer.id, phone: customer.phone } })
}
onMounted(() => {
  loadData()
  refreshTimer = setInterval(() => {
    if (document.visibilityState === 'visible' && !busy.value) loadData()
  }, 30000)
})
onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (map) { map.remove(); map = null }
})
</script>

<style scoped>
.customer-map-page{--map-ink:#172033;--map-muted:#64748b}.map-notice{padding:11px 14px;margin-bottom:12px;border:1px solid #fed7aa;background:#fff7ed;border-radius:9px;color:#9a3412;font-size:.78rem}.map-toolbar{display:flex;align-items:center;gap:18px;margin-bottom:12px;color:#64748b;font-size:.8rem}.map-toolbar b{color:#172033}.map-toolbar input,.map-search input{border:1px solid #dbe2ec;border-radius:8px;padding:9px 10px;font:inherit}.map-toolbar input{margin-left:auto;min-width:250px}.map-workspace{display:grid;grid-template-columns:330px minmax(0,1fr);height:min(72vh,760px);min-height:500px;padding:0;overflow:hidden}.map-customer-list{border-right:1px solid #e2e8f0;overflow:auto;background:#fff}.map-search{position:sticky;top:0;z-index:2;background:white;padding:12px;border-bottom:1px solid #e2e8f0}.map-search input{width:100%}.map-customer-row{display:flex;width:100%;align-items:flex-start;gap:10px;padding:12px;border:0;border-bottom:1px solid #f1f5f9;background:white;text-align:left;cursor:pointer;color:#172033}.map-customer-row:hover,.map-customer-row.active{background:#eff6ff}.red-dot{width:12px;height:12px;flex:none;margin-top:4px;border-radius:50%;background:#ef4444;border:2px solid #991b1b}.row-main{display:grid;gap:4px;min-width:0}.row-main strong{font-size:.82rem}.row-main small{font-size:.72rem;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.map-canvas{height:100%;min-width:0;z-index:0}.map-selected{display:grid;gap:8px;padding:14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#475569;font-size:.76rem}.selected-head{display:flex;justify-content:space-between;align-items:center;color:#172033;font-size:.9rem}.selected-head button{border:0;background:transparent;font-size:1.4rem;cursor:pointer;color:#64748b}.map-selected>img{width:100%;height:130px;object-fit:cover;border-radius:8px;background:white}.map-selected a{color:#1d4ed8}.selected-interest{color:#334155;font-weight:650}.open-crm{justify-self:start;margin-top:2px}.map-empty{padding:20px;color:#94a3b8;font-size:.8rem;text-align:center}.map-error{color:#b91c1c}.map-attribution{font-size:.68rem;color:#94a3b8;margin-top:8px}:global(.customer-popup){display:grid;gap:5px;min-width:160px;color:#172033;font:12px/1.4 Arial,sans-serif}:global(.customer-popup img){width:100%;height:110px;object-fit:cover;border-radius:6px}:global(.customer-popup strong){font-size:13px}:global(.customer-popup a){color:#1d4ed8}:global(.customer-popup small){color:#64748b}:global(.cluster-customer-list){display:grid;gap:4px;max-height:180px;overflow:auto}:global(.cluster-customer-list button){border:0;border-radius:5px;background:#eff6ff;padding:6px;text-align:left;color:#1e3a8a;cursor:pointer;font-size:11px}:global(.customer-cluster-pin){display:grid;place-items:center;border:0!important;background:transparent!important}:global(.customer-cluster-pin span){display:grid;place-items:center;width:34px;height:34px;border:2px solid #991b1b;border-radius:50%;background:#ef4444;color:white;font-weight:800;box-shadow:0 1px 4px #0004}@media(max-width:760px){.map-workspace{grid-template-columns:1fr;height:auto;min-height:0}.map-customer-list{max-height:300px;border-right:0;border-bottom:1px solid #e2e8f0}.map-canvas{height:55vh;min-height:360px}.map-toolbar{flex-wrap:wrap;gap:8px}.map-toolbar input{margin:0;width:100%;min-width:0}}
</style>
