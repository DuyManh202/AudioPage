<template>
  <div class="map-picker-wrap">
    <div class="address-input-row">
      <input
        type="text"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <button
        type="button"
        :class="['map-toggle-btn', { active: isMapOpen }]"
        @click="toggleMap"
        :title="isMapOpen ? 'Đóng bản đồ' : 'Mở bản đồ chọn vị trí'"
      >
        <span aria-hidden="true">{{ isMapOpen ? '✕' : '📍' }}</span>
        <span>{{ isMapOpen ? 'Đóng' : 'Chọn Bản Đồ' }}</span>
      </button>
    </div>

    <div v-if="coords && distanceKm !== null" :class="['distance-hint', distanceKm <= 300 ? 'in-zone' : 'out-zone']">
      <span v-if="distanceKm <= 300">
        ✓ Cách Showroom Tú Audio ~{{ distanceKm }} km (Trong vùng 300km lắp đặt tận nhà)
      </span>
      <span v-else>
        ℹ️ Cách Showroom ~{{ distanceKm }} km (Hỗ trợ giao thiết bị &amp; căn chỉnh từ xa)
      </span>
    </div>

    <Transition name="fade-slide">
      <div v-if="isMapOpen" class="map-drawer-panel">
        <div class="map-toolbar">
          <div class="map-search-box">
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Tìm xã/phường, quận/huyện, tỉnh..."
              @keydown.enter.prevent="searchPlace"
            />
            <button type="button" class="map-search-btn" :disabled="isSearching" @click="searchPlace">
              {{ isSearching ? '...' : 'Tìm' }}
            </button>
          </div>
          <button
            type="button"
            class="gps-btn"
            :disabled="isLocating"
            @click="locateUser"
            title="Lấy vị trí GPS hiện tại"
          >
            {{ isLocating ? '⏳ Đang dò...' : '🎯 Vị trí tôi' }}
          </button>
        </div>

        <div v-if="searchResults.length > 0" class="search-results-list">
          <button
            v-for="(item, idx) in searchResults"
            :key="item.id || idx"
            type="button"
            class="search-result-item"
            @click="pickSearchResult(item)"
          >
            📍 {{ item.label }}
          </button>
        </div>

        <div class="quick-cities">
          <button
            v-for="city in quickCities"
            :key="city.label"
            type="button"
            class="city-chip"
            @click="jumpToCity(city)"
          >
            {{ city.label }}
          </button>
        </div>

        <div class="map-canvas-wrap">
          <div ref="mapEl" class="leaflet-canvas"></div>
          <div class="map-style-switch">
            <button
              type="button"
              :class="['style-pill', { active: mapStyle === 'street' }]"
              @click="switchMapStyle('street')"
            >
              🗺️ Bản đồ
            </button>
            <button
              type="button"
              :class="['style-pill', { active: mapStyle === 'satellite' }]"
              @click="switchMapStyle('satellite')"
            >
              🛰️ Vệ tinh
            </button>
          </div>
          <div v-if="statusMsg" class="map-status-overlay">{{ statusMsg }}</div>
        </div>

        <p class="map-help-note">
          💡 Chạm vào bản đồ hoặc kéo thả ghim vàng <strong>📍</strong> đến đúng vị trí nhà Bác (có thể sửa thêm số nhà/ngõ ở ô phía trên).
        </p>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, nextTick, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const SHOWROOM_COORDS = { lat: 21.3095, lng: 105.5966 } // Vĩnh Yên, Phú Thọ
const ESRI_STREET_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
const ESRI_SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const OSM_DE_FALLBACK_URL = 'https://tile.openstreetmap.de/{z}/{x}/{y}.png'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Nhập địa chỉ hoặc chọn vị trí trên bản đồ...'
  },
  required: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const isMapOpen = ref(false)
const mapEl = ref(null)
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const isLocating = ref(false)
const statusMsg = ref('')
const coords = ref(null)
const distanceKm = ref(null)
const mapStyle = ref('street')

let mapInstance = null
let baseTileLayer = null
let userMarker = null
let fallbackTileSwitched = false

const quickCities = [
  { label: 'Vĩnh Yên', lat: 21.3095, lng: 105.5966, zoom: 13 },
  { label: 'Hà Nội', lat: 21.0285, lng: 105.8542, zoom: 12 },
  { label: 'Bắc Ninh', lat: 21.1861, lng: 106.0763, zoom: 12 },
  { label: 'Thái Nguyên', lat: 21.5942, lng: 105.8482, zoom: 12 },
  { label: 'Việt Trì', lat: 21.3227, lng: 105.402, zoom: 12 },
  { label: 'Hải Phòng', lat: 20.8449, lng: 106.6881, zoom: 12 }
]

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

const createPinIcon = () =>
  L.divIcon({
    className: 'tuaudio-map-pin-wrap',
    html: '<div class="tuaudio-map-pin"><span>📍</span></div>',
    iconSize: [34, 40],
    iconAnchor: [17, 38]
  })

const createShowroomIcon = () =>
  L.divIcon({
    className: 'tuaudio-showroom-pin-wrap',
    html: '<div class="tuaudio-showroom-pin">TA</div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  })

const clampAddress = (text, lat, lng) => {
  const combined = `${text} (${lat.toFixed(5)}, ${lng.toFixed(5)})`
  return combined.length > 480 ? combined.slice(0, 480) : combined
}

const reverseGeocodeAddress = async (lat, lng) => {
  // 1. Thử Photon với lang=default để lấy đúng tên tiếng Việt địa phương (đường, phường, TP, tỉnh)
  try {
    const res = await fetch(
      `https://photon.komoot.io/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&lang=default`
    )
    if (res.ok) {
      const data = await res.json()
      const p = data?.features?.[0]?.properties
      if (p) {
        const streetLine = [p.housenumber, p.street].filter(Boolean).join(' ')
        const parts = [...new Set([streetLine, p.district, p.county, p.city, p.state].filter(Boolean))]
        if (parts.length > 0) {
          return clampAddress(parts.join(', '), lat, lng)
        }
      }
    }
  } catch {
    // Fallback xuống BigDataCloud
  }

  // 2. Fallback BigDataCloud reverse geocode
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=vi`
    )
    if (res.ok) {
      const data = await res.json()
      const parts = [...new Set([data.locality, data.city, data.principalSubdivision].filter(Boolean))]
      if (parts.length > 0) {
        return clampAddress(parts.join(', '), lat, lng)
      }
    }
  } catch {
    // Giữ lại tọa độ đã ghim
  }

  return null
}

const setMarkerAndReverseGeocode = async (lat, lng, panZoom = null) => {
  coords.value = { lat, lng }
  distanceKm.value = haversineKm(SHOWROOM_COORDS.lat, SHOWROOM_COORDS.lng, lat, lng)

  if (mapInstance) {
    if (!userMarker) {
      userMarker = L.marker([lat, lng], {
        icon: createPinIcon(),
        draggable: true
      }).addTo(mapInstance)

      userMarker.on('dragend', () => {
        const pos = userMarker.getLatLng()
        setMarkerAndReverseGeocode(pos.lat, pos.lng)
      })
    } else {
      userMarker.setLatLng([lat, lng])
    }

    if (panZoom) {
      mapInstance.setView([lat, lng], panZoom, { animate: true })
    }
  }

  emit('update:modelValue', `Vị trí đã ghim (${lat.toFixed(5)}, ${lng.toFixed(5)})`)
  statusMsg.value = 'Đang lấy tên đường / xã / tỉnh...'

  const readable = await reverseGeocodeAddress(lat, lng)
  if (readable) {
    emit('update:modelValue', readable)
  }
  statusMsg.value = ''
}

const applyTileLayer = (style) => {
  if (!mapInstance) return
  if (baseTileLayer) {
    mapInstance.removeLayer(baseTileLayer)
    baseTileLayer = null
  }
  fallbackTileSwitched = false

  const url = style === 'satellite' ? ESRI_SATELLITE_URL : ESRI_STREET_URL
  baseTileLayer = L.tileLayer(url, {
    attribution: '&copy; Esri &amp; OpenStreetMap',
    maxZoom: 19
  })

  baseTileLayer.on('tileerror', () => {
    if (fallbackTileSwitched || !mapInstance || style === 'satellite') return
    fallbackTileSwitched = true
    if (baseTileLayer) mapInstance.removeLayer(baseTileLayer)
    baseTileLayer = L.tileLayer(OSM_DE_FALLBACK_URL, {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(mapInstance)
  })

  baseTileLayer.addTo(mapInstance)
}

const switchMapStyle = (style) => {
  mapStyle.value = style
  applyTileLayer(style)
}

const initMap = () => {
  if (!mapEl.value || mapInstance) return

  const startLat = coords.value?.lat ?? SHOWROOM_COORDS.lat
  const startLng = coords.value?.lng ?? SHOWROOM_COORDS.lng

  mapInstance = L.map(mapEl.value, {
    center: [startLat, startLng],
    zoom: coords.value ? 15 : 10,
    zoomControl: true
  })

  applyTileLayer(mapStyle.value)

  // Đánh dấu Showroom Tú Audio & bán kính hỗ trợ 300km
  L.marker([SHOWROOM_COORDS.lat, SHOWROOM_COORDS.lng], {
    icon: createShowroomIcon(),
    interactive: true
  })
    .bindTooltip('Showroom Tú Audio (Vĩnh Yên)', { direction: 'top' })
    .addTo(mapInstance)

  L.circle([SHOWROOM_COORDS.lat, SHOWROOM_COORDS.lng], {
    radius: 300000,
    color: '#2837FC',
    weight: 1.2,
    opacity: 0.45,
    fillColor: '#2837FC',
    fillOpacity: 0.05,
    interactive: false
  }).addTo(mapInstance)

  if (coords.value) {
    userMarker = L.marker([coords.value.lat, coords.value.lng], {
      icon: createPinIcon(),
      draggable: true
    }).addTo(mapInstance)

    userMarker.on('dragend', () => {
      const pos = userMarker.getLatLng()
      setMarkerAndReverseGeocode(pos.lat, pos.lng)
    })
  }

  mapInstance.on('click', (e) => {
    setMarkerAndReverseGeocode(e.latlng.lat, e.latlng.lng)
  })

  setTimeout(() => {
    mapInstance?.invalidateSize()
  }, 180)
}

const destroyMap = () => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
    baseTileLayer = null
    userMarker = null
  }
}

const toggleMap = async () => {
  if (isMapOpen.value) {
    isMapOpen.value = false
    destroyMap()
    return
  }

  isMapOpen.value = true
  await nextTick()
  initMap()
}

const searchPlace = async () => {
  const q = searchQuery.value.trim()
  if (!q || isSearching.value) return

  isSearching.value = true
  searchResults.value = []
  statusMsg.value = 'Đang tìm khu vực...'

  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lat=${SHOWROOM_COORDS.lat}&lon=${SHOWROOM_COORDS.lng}`
    )
    if (res.ok) {
      const data = await res.json()
      const features = Array.isArray(data?.features) ? data.features : []
      const vnFeatures = features.filter(f => !f.properties?.countrycode || f.properties.countrycode === 'VN')
      const list = (vnFeatures.length ? vnFeatures : features).map((f, index) => {
        const p = f.properties || {}
        const label = [...new Set([p.name, p.street, p.district, p.county, p.city, p.state].filter(Boolean))].join(', ')
        const [lon, lat] = f.geometry?.coordinates || []
        return {
          id: `${p.osm_id || index}-${lat}-${lon}`,
          label: label || q,
          lat,
          lng: lon
        }
      }).filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lng))

      searchResults.value = list
      if (list.length === 1) {
        pickSearchResult(list[0])
      } else if (list.length === 0) {
        statusMsg.value = 'Không thấy địa danh khớp — hãy chạm trực tiếp lên bản đồ.'
      } else {
        statusMsg.value = ''
      }
    }
  } catch {
    statusMsg.value = 'Không kết nối được tìm kiếm — vui lòng chọn trực tiếp trên bản đồ.'
  } finally {
    isSearching.value = false
  }
}

const pickSearchResult = (item) => {
  searchResults.value = []
  if (Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
    setMarkerAndReverseGeocode(item.lat, item.lng, 15)
  }
}

const jumpToCity = (city) => {
  searchResults.value = []
  if (mapInstance) {
    mapInstance.setView([city.lat, city.lng], city.zoom, { animate: true })
  }
}

const locateUser = () => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    statusMsg.value = 'Trình duyệt không hỗ trợ GPS — vui lòng chạm trên bản đồ.'
    return
  }

  isLocating.value = true
  statusMsg.value = 'Đang xin quyền định vị thiết bị...'

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      isLocating.value = false
      setMarkerAndReverseGeocode(pos.coords.latitude, pos.coords.longitude, 16)
    },
    () => {
      isLocating.value = false
      statusMsg.value = 'Không truy cập được GPS — vui lòng tìm hoặc chạm vị trí trên bản đồ.'
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

onBeforeUnmount(destroyMap)
</script>

<style scoped>
.map-picker-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.address-input-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.address-input-row input {
  flex: 1;
  min-width: 0;
  background: var(--bg-dark-900);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-sm);
  padding: 10px 13px;
  color: #fff;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.address-input-row input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(252, 183, 40, 0.14);
}

.map-toggle-btn {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 13px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, rgba(252, 183, 40, 0.2), rgba(245, 158, 11, 0.08));
  border: 1px solid rgba(252, 183, 40, 0.48);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  transition: all 0.22s var(--ease-spring);
}

.map-toggle-btn:hover {
  background: rgba(252, 183, 40, 0.28);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px -4px rgba(252, 183, 40, 0.35);
}

.map-toggle-btn.active {
  background: rgba(239, 68, 68, 0.16);
  border-color: rgba(239, 68, 68, 0.45);
  color: #fca5a5;
}

.distance-hint {
  font-size: 0.76rem;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 8px;
}

.distance-hint.in-zone {
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #86efac;
}

.distance-hint.out-zone {
  background: rgba(252, 183, 40, 0.1);
  border: 1px solid rgba(252, 183, 40, 0.3);
  color: #fde68a;
}

.map-drawer-panel {
  background: rgba(9, 12, 22, 0.96);
  border: 1px solid rgba(252, 183, 40, 0.36);
  border-radius: var(--radius-md);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.55);
}

.map-toolbar {
  display: flex;
  gap: 6px;
}

.map-search-box {
  flex: 1;
  min-width: 0;
  display: flex;
  background: var(--bg-dark-800);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  overflow: hidden;
}

.map-search-box input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  padding: 7px 10px;
  color: #fff;
  font-size: 0.8rem;
  outline: none;
}

.map-search-btn {
  background: var(--gradient-gold);
  color: #080a10;
  font-size: 0.76rem;
  font-weight: 800;
  padding: 0 12px;
}

.gps-btn {
  background: rgba(40, 55, 252, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.45);
  color: #bfdbfe;
  font-size: 0.76rem;
  font-weight: 700;
  padding: 0 11px;
  border-radius: 8px;
  white-space: nowrap;
  transition: background 0.2s, transform 0.2s;
}

.gps-btn:hover {
  background: rgba(40, 55, 252, 0.34);
  transform: translateY(-1px);
}

.search-results-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 120px;
  overflow-y: auto;
}

.search-result-item {
  text-align: left;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
}

.search-result-item:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.quick-cities {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.city-chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}

.city-chip:hover {
  border-color: var(--color-primary);
  background: rgba(252, 183, 40, 0.12);
  color: var(--color-primary);
}

.map-canvas-wrap {
  position: relative;
  width: 100%;
  height: 230px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.leaflet-canvas {
  width: 100%;
  height: 100%;
  background: #e5e7eb;
  z-index: 1;
}

.map-style-switch {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 500;
  display: inline-flex;
  gap: 3px;
  padding: 3px;
  border-radius: 999px;
  background: rgba(10, 13, 24, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.style-pill {
  background: transparent;
  color: #cbd5e1;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 999px;
  transition: background 0.2s, color 0.2s;
}

.style-pill.active {
  background: var(--gradient-gold);
  color: #080a10;
}

:deep(.leaflet-tile),
:deep(.leaflet-container img) {
  max-width: none !important;
  max-height: none !important;
}

.map-status-overlay {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  z-index: 500;
  background: rgba(10, 13, 24, 0.92);
  border: 1px solid rgba(252, 183, 40, 0.45);
  color: #fde68a;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 8px;
  text-align: center;
  pointer-events: none;
}

.map-help-note {
  font-size: 0.73rem;
  color: var(--text-muted);
  line-height: 1.4;
}

:deep(.tuaudio-map-pin) {
  width: 34px;
  height: 34px;
  border-radius: 50% 50% 50% 0;
  background: linear-gradient(135deg, #ffd15c, #FCB728);
  border: 2px solid #090b10;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.55);
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.tuaudio-map-pin span) {
  transform: rotate(45deg);
  font-size: 14px;
  line-height: 1;
}

:deep(.tuaudio-showroom-pin) {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #2837FC;
  color: #fff;
  border: 2px solid #fff;
  font-size: 10px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(40, 55, 252, 0.5);
}

@media (max-width: 640px) {
  .address-input-row {
    flex-direction: column;
  }

  .address-input-row input {
    min-height: 44px;
    font-size: 16px;
  }

  .map-toggle-btn {
    min-height: 40px;
    width: 100%;
  }

  .map-toolbar {
    flex-direction: column;
  }

  .map-search-box input {
    min-height: 38px;
    font-size: 14px;
  }

  .gps-btn {
    min-height: 36px;
  }

  .map-canvas-wrap {
    height: 205px;
  }
}
</style>
