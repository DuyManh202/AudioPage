<template>
  <div class="map-picker-wrap">
    <div class="address-input-row">
      <div class="address-field-box">
        <svg class="address-pin-lead" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
          />
        </svg>
        <input
          type="text"
          :value="modelValue"
          :placeholder="placeholder"
          :required="required"
          @input="$emit('update:modelValue', $event.target.value)"
        />
      </div>

      <button
        type="button"
        :class="['gmap-trigger-btn', { active: isMapOpen }]"
        @click="toggleMap"
        :title="isMapOpen ? 'Đóng bản đồ' : 'Mở bản đồ để chọn vị trí'"
      >
        <svg v-if="!isMapOpen" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 2C8.13 2 5 5.13 5 9c0 1.74.5 3.37 1.41 4.84.95 1.54 2.2 2.86 3.16 4.4.47.75.81 1.45 1.17 2.26.26.55.47 1.5 1.26 1.5s1-.95 1.25-1.5c.37-.81.7-1.51 1.17-2.26.96-1.53 2.21-2.85 3.16-4.4C18.5 12.37 19 10.74 19 9c0-3.87-3.13-7-7-7z"
          />
          <circle cx="12" cy="9" r="2.6" fill="#FFFFFF" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
        <span>{{ isMapOpen ? 'Đóng bản đồ' : 'Bản đồ' }}</span>
      </button>
    </div>

    <div v-if="coords && distanceKm !== null" :class="['distance-hint', distanceKm <= 300 ? 'in-zone' : 'out-zone']">
      <span v-if="distanceKm <= 300">
        ✓ Cách Showroom Tú Audio ~{{ distanceKm }} km (Trong vùng 300km lắp đặt &amp; căn chỉnh tận nhà)
      </span>
      <span v-else>
        ℹ️ Cách Showroom ~{{ distanceKm }} km (Hỗ trợ gửi thiết bị &amp; căn chỉnh từ xa)
      </span>
    </div>

    <Transition name="fade-slide">
      <div v-if="isMapOpen" :class="['gmap-shell', { 'is-fullscreen': isFullscreen }]">
        <div class="gmap-viewport">
          <!-- Floating Google Maps Search Box & Quick Area Chips (Top-Left) -->
          <div class="gmap-top-overlay">
            <div class="gmap-omnibox-wrap">
              <div class="gmap-omnibox">
                <svg class="gmap-omnibox-pin" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
                  />
                </svg>
                <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="Tìm địa điểm..."
                  @keydown.enter.prevent="searchPlace"
                />
                <button
                  v-if="searchQuery"
                  type="button"
                  class="gmap-icon-btn clear-btn"
                  title="Xóa tìm kiếm"
                  @click="clearSearch"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="#5F6368" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
                <span class="gmap-omnibox-divider"></span>
                <button
                  type="button"
                  class="gmap-icon-btn search-submit-btn"
                  :disabled="isSearching"
                  title="Tìm kiếm"
                  @click="searchPlace"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="#1A73E8"
                      d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                    />
                  </svg>
                </button>
              </div>

          <!-- Search suggestions -->
              <div v-if="searchResults.length > 0" class="gmap-suggestions">
                <button
                  v-for="(item, idx) in searchResults"
                  :key="item.id || idx"
                  type="button"
                  class="gmap-suggestion-row"
                  @click="pickSearchResult(item)"
                >
                  <span class="gmap-suggestion-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path
                        fill="#5F6368"
                        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
                      />
                    </svg>
                  </span>
                  <span class="gmap-suggestion-text">
                    <strong>{{ item.primary }}</strong>
                    <small v-if="item.secondary">{{ item.secondary }}</small>
                  </span>
                </button>
              </div>
            </div>

            <!-- Google Maps Category / City Pills -->
            <div v-if="searchResults.length === 0" class="gmap-chips-row">
              <button
                v-for="city in quickCities"
                :key="city.label"
                type="button"
                :class="['gmap-chip', { active: activeCity === city.label }]"
                @click="jumpToCity(city)"
              >
                {{ city.label }}
              </button>
            </div>
          </div>

          <!-- Top-Right Fullscreen Control (Google Maps White Square Card) -->
          <button
            type="button"
            class="gmap-fab-square gmap-fullscreen-btn"
            :title="isFullscreen ? 'Thu nhỏ bản đồ' : 'Xem toàn màn hình'"
            @click="toggleFullscreen"
          >
            <svg v-if="!isFullscreen" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#5F6368" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
            </svg>
            <svg v-else viewBox="0 0 24 24" width="18" height="18">
              <path fill="#5F6368" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
            </svg>
          </button>

          <!-- Map Canvas -->
          <div ref="mapEl" class="gmap-canvas"></div>

          <!-- Bottom-Left Google Maps Layer Switcher (Bản đồ | Vệ tinh) -->
          <div class="gmap-maptype-card" role="group" aria-label="Kiểu bản đồ">
            <button
              type="button"
              :class="['gmap-maptype-btn', { active: mapStyle === 'street' }]"
              @click="switchMapStyle('street')"
            >
              Bản đồ
            </button>
            <span class="gmap-maptype-sep"></span>
            <button
              type="button"
              :class="['gmap-maptype-btn', { active: mapStyle === 'satellite' }]"
              @click="switchMapStyle('satellite')"
            >
              Vệ tinh
            </button>
          </div>

          <!-- Bottom-Right Google Maps My Location + Zoom Stack -->
          <div class="gmap-right-controls">
            <button
              type="button"
              :class="['gmap-mylocation-btn', { locating: isLocating }]"
              :disabled="isLocating"
              title="Vị trí hiện tại của bác"
              @click="locateUser"
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  :fill="coords ? '#1A73E8' : '#5F6368'"
                  d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"
                />
              </svg>
            </button>

            <div class="gmap-zoom-card">
              <button type="button" class="gmap-zoom-btn" title="Phóng to" @click="zoomBy(1)">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#5F6368" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              </button>
              <span class="gmap-zoom-divider"></span>
              <button type="button" class="gmap-zoom-btn" title="Thu nhỏ" @click="zoomBy(-1)">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#5F6368" d="M19 13H5v-2h14v2z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Status Toast Pill (Google Maps Floating Toast) -->
          <div v-if="statusMsg" class="gmap-toast">{{ statusMsg }}</div>
        </div>

        <!-- Google Maps Bottom Place Info Sheet -->
        <div class="gmap-place-footer">
          <div class="gmap-place-info">
            <div class="gmap-place-pin-badge">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="#EA4335"
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
                />
              </svg>
            </div>
            <div class="gmap-place-text">
              <strong class="gmap-place-title">
                {{ coords ? (resolvedLabel || 'Đã ghim vị trí trên bản đồ') : 'Chạm vào bản đồ để thả ghim vị trí nhà bác' }}
              </strong>
              <span class="gmap-place-sub">
                <template v-if="coords">
                  Tọa độ: {{ coords.lat.toFixed(5) }}, {{ coords.lng.toFixed(5) }}
                  <a
                    :href="`https://www.google.com/maps?q=${coords.lat},${coords.lng}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="gmap-ext-link"
                  >
                    Xem trên Google Maps ↗
                  </a>
                </template>
                <template v-else>
                  Kéo thả ghim đỏ hoặc bấm biểu tượng tâm ngắm để lấy GPS hiện tại
                </template>
              </span>
            </div>
          </div>

          <button
            type="button"
            class="gmap-confirm-btn"
            @click="confirmAndClose"
          >
            {{ coords ? 'Xác nhận vị trí' : 'Đóng' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, nextTick, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const SHOWROOM_COORDS = { lat: 21.3095, lng: 105.5966 } // Vĩnh Yên, Phú Thọ

// Esri street tiles with OpenStreetMap fallback; no Google Maps key is required.
const ESRI_STREET_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
const OSM_DE_FALLBACK = 'https://tile.openstreetmap.de/{z}/{x}/{y}.png'
const ESRI_SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const ESRI_HYBRID_LABELS = 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Nhập địa chỉ hoặc chọn vị trí trên Google Maps...'
  },
  required: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const isMapOpen = ref(false)
const isFullscreen = ref(false)
const mapEl = ref(null)
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const isLocating = ref(false)
const statusMsg = ref('')
const coords = ref(null)
const resolvedLabel = ref('')
const distanceKm = ref(null)
const mapStyle = ref('street')
const activeCity = ref('')

// Engine state: 'google' | 'leaflet' | null
let activeEngine = null
let leafletMap = null
let leafletBaseLayer = null
let leafletLabelLayer = null
let leafletUserMarker = null

let activeMapPickerClose = null

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

const createGoogleRedPinHtml = () => `
  <div class="gmap-red-pin">
    <svg viewBox="0 0 36 48" width="34" height="45" aria-hidden="true">
      <defs>
        <filter id="gmp-shadow" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path
        filter="url(#gmp-shadow)"
        fill="#EA4335"
        stroke="#B31412"
        stroke-width="1"
        d="M18 2C9.72 2 3 8.72 3 17c0 10.88 13.35 26.52 14.12 27.4a1.15 1.15 0 0 0 1.76 0C19.65 43.52 33 27.88 33 17 33 8.72 26.28 2 18 2z"
      />
      <circle cx="18" cy="17" r="5.5" fill="#801411"/>
    </svg>
  </div>
`

const createShowroomPinHtml = () => `
  <div class="gmap-showroom-badge" title="Showroom Tú Audio (Vĩnh Yên)">
    <span class="gmap-showroom-dot"></span>
    <span class="gmap-showroom-text">Tú Audio</span>
  </div>
`

const clampAddress = (text, lat, lng) => {
  const combined = `${text} (${lat.toFixed(5)}, ${lng.toFixed(5)})`
  return combined.length > 480 ? combined.slice(0, 480) : combined
}

const parseDirectCoordsOrUrl = (raw) => {
  const atMatch = raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) }
  }
  const qMatch = raw.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) }
  }
  const pairMatch = raw.match(/^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/)
  if (pairMatch) {
    return { lat: parseFloat(pairMatch[1]), lng: parseFloat(pairMatch[2]) }
  }
  return null
}

const reverseGeocodeAddress = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://photon.komoot.io/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&lang=default`
    )
    if (res.ok) {
      const data = await res.json()
      const p = data?.features?.[0]?.properties
      if (p) {
        const streetLine = [p.housenumber, p.street || p.name].filter(Boolean).join(' ')
        const parts = [...new Set([streetLine, p.district, p.county, p.city, p.state].filter(Boolean))]
        if (parts.length > 0) {
          return parts.join(', ')
        }
      }
    }
  } catch {
    // Fallback sang BigDataCloud
  }

  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=vi`
    )
    if (res.ok) {
      const data = await res.json()
      const parts = [...new Set([data.locality, data.city, data.principalSubdivision].filter(Boolean))]
      if (parts.length > 0) {
        return parts.join(', ')
      }
    }
  } catch {
    // Giữ tọa độ đã ghim
  }

  return null
}

const syncUserPinOnMap = (lat, lng, panZoom = null) => {
  if (activeEngine === 'leaflet' && leafletMap) {
    const pinIcon = L.divIcon({
      className: 'gmap-leaflet-pin-wrap',
      html: createGoogleRedPinHtml(),
      iconSize: [34, 45],
      iconAnchor: [17, 43]
    })

    if (!leafletUserMarker) {
      leafletUserMarker = L.marker([lat, lng], {
        icon: pinIcon,
        draggable: true
      }).addTo(leafletMap)

      leafletUserMarker.on('dragend', () => {
        const pos = leafletUserMarker.getLatLng()
        setMarkerAndReverseGeocode(pos.lat, pos.lng)
      })
    } else {
      leafletUserMarker.setLatLng([lat, lng])
    }

    if (panZoom) {
      leafletMap.setView([lat, lng], panZoom, { animate: true })
    }
  }
}

const setMarkerAndReverseGeocode = async (lat, lng, panZoom = null) => {
  coords.value = { lat, lng }
  distanceKm.value = haversineKm(SHOWROOM_COORDS.lat, SHOWROOM_COORDS.lng, lat, lng)
  syncUserPinOnMap(lat, lng, panZoom)

  resolvedLabel.value = 'Đang lấy tên đường / xã / tỉnh...'
  emit('update:modelValue', `Vị trí đã ghim (${lat.toFixed(5)}, ${lng.toFixed(5)})`)
  statusMsg.value = 'Đang xác định địa chỉ...'

  const readable = await reverseGeocodeAddress(lat, lng)
  if (readable) {
    resolvedLabel.value = readable
    emit('update:modelValue', clampAddress(readable, lat, lng))
  } else {
    resolvedLabel.value = `Tọa độ đã ghim (${lat.toFixed(5)}, ${lng.toFixed(5)})`
  }
  statusMsg.value = ''
}

const applyLeafletStyle = (style) => {
  if (!leafletMap) return
  if (leafletBaseLayer) {
    leafletMap.removeLayer(leafletBaseLayer)
    leafletBaseLayer = null
  }
  if (leafletLabelLayer) {
    leafletMap.removeLayer(leafletLabelLayer)
    leafletLabelLayer = null
  }

  if (style === 'satellite') {
    leafletBaseLayer = L.tileLayer(ESRI_SATELLITE_TILES, {
      maxZoom: 19,
      attribution: '&copy; Esri &middot; OpenStreetMap'
    }).addTo(leafletMap)
    leafletLabelLayer = L.tileLayer(ESRI_HYBRID_LABELS, {
      maxZoom: 19,
      pane: 'overlayPane'
    }).addTo(leafletMap)
  } else {
    let switchedFallback = false
    leafletBaseLayer = L.tileLayer(ESRI_STREET_TILES, {
      maxZoom: 19,
      attribution: '&copy; Esri &middot; OpenStreetMap'
    })
    leafletBaseLayer.on('tileerror', () => {
      if (switchedFallback || !leafletMap || mapStyle.value !== 'street') return
      switchedFallback = true
      if (leafletBaseLayer) leafletMap.removeLayer(leafletBaseLayer)
      leafletBaseLayer = L.tileLayer(OSM_DE_FALLBACK, { maxZoom: 19 }).addTo(leafletMap)
    })
    leafletBaseLayer.addTo(leafletMap)
  }
}

const switchMapStyle = (style) => {
  mapStyle.value = style
  if (activeEngine === 'leaflet') {
    applyLeafletStyle(style)
  }
}

const zoomBy = (delta) => {
  if (activeEngine === 'leaflet' && leafletMap) {
    leafletMap.setZoom(leafletMap.getZoom() + delta)
  }
}

const toggleFullscreen = async () => {
  isFullscreen.value = !isFullscreen.value
  await nextTick()
  setTimeout(() => {
    if (activeEngine === 'leaflet' && leafletMap) leafletMap.invalidateSize()
  }, 150)
}

const mountLeafletMap = () => {
  if (!mapEl.value || !isMapOpen.value) return
  destroyMap()

  const startLat = coords.value?.lat ?? SHOWROOM_COORDS.lat
  const startLng = coords.value?.lng ?? SHOWROOM_COORDS.lng
  const startZoom = coords.value ? 16 : 11

  activeEngine = 'leaflet'
  leafletMap = L.map(mapEl.value, {
    center: [startLat, startLng],
    zoom: startZoom,
    zoomControl: false,
    attributionControl: true
  })

  applyLeafletStyle(mapStyle.value)

  // Showroom badge + 300km circle
  const showroomIcon = L.divIcon({
    className: 'gmap-showroom-wrap',
    html: createShowroomPinHtml(),
    iconSize: [92, 28],
    iconAnchor: [46, 14]
  })
  L.marker([SHOWROOM_COORDS.lat, SHOWROOM_COORDS.lng], {
    icon: showroomIcon,
    interactive: true
  })
    .bindPopup('<strong>Showroom Tú Audio</strong><br/>Phố Nguyễn Danh Phương, Vĩnh Yên, Phú Thọ')
    .addTo(leafletMap)

  L.circle([SHOWROOM_COORDS.lat, SHOWROOM_COORDS.lng], {
    radius: 300000,
    color: '#1A73E8',
    weight: 1.3,
    opacity: 0.45,
    fillColor: '#1A73E8',
    fillOpacity: 0.05,
    interactive: false
  }).addTo(leafletMap)

  if (coords.value) {
    syncUserPinOnMap(coords.value.lat, coords.value.lng)
  }

  leafletMap.on('click', (e) => {
    setMarkerAndReverseGeocode(e.latlng.lat, e.latlng.lng)
  })

  setTimeout(() => {
    leafletMap?.invalidateSize()
  }, 160)
}

const initMap = () => {
  if (!mapEl.value || activeEngine) return
  mountLeafletMap()
}

const destroyMap = () => {
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
    leafletBaseLayer = null
    leafletLabelLayer = null
    leafletUserMarker = null
  }
  if (mapEl.value) {
    mapEl.value.replaceChildren()
  }
  activeEngine = null
}

const closeMapPicker = () => {
  isFullscreen.value = false
  isMapOpen.value = false
  destroyMap()
  if (activeMapPickerClose === closeMapPicker) activeMapPickerClose = null
}

const toggleMap = async () => {
  if (isMapOpen.value) {
    closeMapPicker()
    return
  }

  // Multiple forms can contain a MapLocationPicker. Keep only one map open sitewide.
  if (activeMapPickerClose && activeMapPickerClose !== closeMapPicker) {
    activeMapPickerClose()
  }
  activeMapPickerClose = closeMapPicker
  isMapOpen.value = true
  await nextTick()
  if (isMapOpen.value) initMap()
}

const confirmAndClose = () => {
  closeMapPicker()
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
}

const searchPlace = async () => {
  const q = searchQuery.value.trim()
  if (!q || isSearching.value) return

  const direct = parseDirectCoordsOrUrl(q)
  if (direct && Number.isFinite(direct.lat) && Number.isFinite(direct.lng)) {
    searchResults.value = []
    setMarkerAndReverseGeocode(direct.lat, direct.lng, 16)
    return
  }

  isSearching.value = true
  searchResults.value = []
  statusMsg.value = 'Đang tìm trên bản đồ...'

  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lat=${SHOWROOM_COORDS.lat}&lon=${SHOWROOM_COORDS.lng}`
    )
    if (res.ok) {
      const data = await res.json()
      const features = Array.isArray(data?.features) ? data.features : []
      const vnFeatures = features.filter(f => !f.properties?.countrycode || f.properties.countrycode === 'VN')
      const list = (vnFeatures.length ? vnFeatures : features)
        .map((f, index) => {
          const p = f.properties || {}
          const primary = p.name || p.street || p.district || p.city || q
          const secondaryParts = [...new Set([p.street, p.district, p.county, p.city, p.state].filter(v => v && v !== primary))]
          const [lon, lat] = f.geometry?.coordinates || []
          return {
            id: `${p.osm_id || index}-${lat}-${lon}`,
            primary,
            secondary: secondaryParts.join(', '),
            lat,
            lng: lon
          }
        })
        .filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lng))

      searchResults.value = list
      if (list.length === 1) {
        pickSearchResult(list[0])
      } else if (list.length === 0) {
        statusMsg.value = 'Không tìm thấy địa danh khớp — bác hãy chạm trực tiếp lên bản đồ.'
      } else {
        statusMsg.value = ''
      }
    }
  } catch {
    statusMsg.value = 'Không kết nối được tìm kiếm — bác hãy chạm trực tiếp lên bản đồ.'
  } finally {
    isSearching.value = false
  }
}

const pickSearchResult = (item) => {
  searchResults.value = []
  searchQuery.value = [item.primary, item.secondary].filter(Boolean).join(', ')
  if (Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
    setMarkerAndReverseGeocode(item.lat, item.lng, 16)
  }
}

const jumpToCity = (city) => {
  activeCity.value = city.label
  searchResults.value = []
  if (activeEngine === 'leaflet' && leafletMap) {
    leafletMap.setView([city.lat, city.lng], city.zoom, { animate: true })
  }
}

const locateUser = () => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    statusMsg.value = 'Thiết bị không hỗ trợ GPS — bác vui lòng chạm trực tiếp trên bản đồ.'
    return
  }

  isLocating.value = true
  statusMsg.value = 'Đang định vị GPS hiện tại...'

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      isLocating.value = false
      setMarkerAndReverseGeocode(pos.coords.latitude, pos.coords.longitude, 17)
    },
    () => {
      isLocating.value = false
      statusMsg.value = 'Chưa cấp quyền định vị GPS — bác có thể tìm xã/huyện hoặc chạm lên bản đồ.'
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

onBeforeUnmount(() => {
  if (activeMapPickerClose === closeMapPicker) activeMapPickerClose = null
  destroyMap()
})
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

.address-field-box {
  flex: 1;
  min-width: 0;
  position: relative;
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 1px solid #DADCE0;
  border-radius: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.address-field-box:focus-within {
  border-color: #1A73E8;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.15);
}

.address-pin-lead {
  margin-left: 11px;
  flex-shrink: 0;
}

.address-field-box input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  padding: 10px 12px 10px 8px;
  color: #202124;
  font-size: 0.9rem;
  outline: none;
}

.gmap-trigger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 14px;
  border-radius: 8px;
  background: #FFFFFF;
  border: 1px solid #DADCE0;
  color: #1A73E8;
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.12);
  transition: background 0.18s, border-color 0.18s, box-shadow 0.18s;
}

.gmap-trigger-btn:hover {
  background: #F8FAFD;
  border-color: #1A73E8;
  box-shadow: 0 1px 4px rgba(26, 115, 232, 0.22);
}

.gmap-trigger-btn.active {
  background: #FCE8E6;
  border-color: #F28B82;
  color: #C5221F;
}

.distance-hint {
  font-size: 0.78rem;
  font-weight: 600;
  padding: 7px 11px;
  border-radius: 8px;
}

.distance-hint.in-zone {
  background: #E6F4EA;
  border: 1px solid #A8DAB5;
  color: #137333;
}

.distance-hint.out-zone {
  background: #FEF7E0;
  border: 1px solid #FDD663;
  color: #B06000;
}

/* Google Maps Shell */
.gmap-shell {
  background: #FFFFFF;
  border: 1px solid #DADCE0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(60, 64, 67, 0.18);
  display: flex;
  flex-direction: column;
}

.gmap-shell.is-fullscreen {
  position: fixed;
  inset: 16px;
  z-index: 9999;
  border-radius: 14px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.42);
}

.gmap-viewport {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: 330px;
  background: #E8EAED;
  overflow: hidden;
}

.gmap-shell.is-fullscreen .gmap-viewport {
  flex: 1;
  height: auto;
}

.gmap-canvas {
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* Top-left Floating Google Maps Omnibox + Chips */
.gmap-top-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 54px;
  z-index: 600;
  display: flex;
  flex-direction: column;
  gap: 7px;
  pointer-events: none;
}

.gmap-omnibox-wrap {
  max-width: 390px;
  width: 100%;
  pointer-events: auto;
  position: relative;
}

.gmap-omnibox {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 24px;
  height: 42px;
  padding: 0 6px 0 12px;
  box-shadow: 0 2px 6px rgba(60, 64, 67, 0.28), 0 1px 2px rgba(60, 64, 67, 0.15);
  border: 1px solid rgba(218, 220, 224, 0.7);
}

.gmap-omnibox-pin {
  flex-shrink: 0;
  margin-right: 8px;
}

.gmap-omnibox input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: #202124;
  font-size: 0.86rem;
  font-weight: 500;
  outline: none;
}

.gmap-omnibox input::placeholder {
  color: #70757A;
  font-weight: 400;
}

.gmap-omnibox-divider {
  width: 1px;
  height: 22px;
  background: #DADCE0;
  margin: 0 2px;
}

.gmap-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: transparent;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s;
}

.gmap-icon-btn:hover {
  background: #F1F3F4;
}

.gmap-suggestions {
  margin-top: 6px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(60, 64, 67, 0.28);
  border: 1px solid #DADCE0;
  overflow-y: auto;
  max-height: 190px;
  padding: 4px 0;
}

.gmap-suggestion-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: transparent;
  border: none;
  text-align: left;
  transition: background 0.14s;
}

.gmap-suggestion-row:hover {
  background: #F1F3F4;
}

.gmap-suggestion-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #F1F3F4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.gmap-suggestion-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.gmap-suggestion-text strong {
  color: #202124;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gmap-suggestion-text small {
  color: #5F6368;
  font-size: 0.74rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Google Maps Filter Chips */
.gmap-chips-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  pointer-events: auto;
  padding-bottom: 2px;
}

.gmap-chips-row::-webkit-scrollbar {
  display: none;
}

.gmap-chip {
  background: #FFFFFF;
  border: 1px solid rgba(218, 220, 224, 0.85);
  color: #3C4043;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 5px 11px;
  border-radius: 999px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.22);
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.gmap-chip:hover {
  background: #F8F9FA;
  color: #1A73E8;
}

.gmap-chip.active {
  background: #E8F0FE;
  border-color: #1A73E8;
  color: #1967D2;
}

/* Top-Right Fullscreen Button */
.gmap-fab-square {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 600;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #FFFFFF;
  border: none;
  box-shadow: 0 1px 4px rgba(60, 64, 67, 0.3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.gmap-fab-square:hover {
  background: #F1F3F4;
}

/* Bottom-Left Google Maps Classic Map/Satellite Card */
.gmap-maptype-card {
  position: absolute;
  left: 10px;
  bottom: 12px;
  z-index: 600;
  display: inline-flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(60, 64, 67, 0.3);
  overflow: hidden;
}

.gmap-maptype-btn {
  background: #FFFFFF;
  border: none;
  color: #5F6368;
  font-size: 0.78rem;
  font-weight: 500;
  padding: 8px 13px;
  transition: background 0.15s, color 0.15s;
}

.gmap-maptype-btn:hover {
  background: #F8F9FA;
  color: #202124;
}

.gmap-maptype-btn.active {
  color: #1A73E8;
  font-weight: 700;
  background: #F8FAFD;
}

.gmap-maptype-sep {
  width: 1px;
  height: 20px;
  background: #E8EAED;
}

/* Bottom-Right Google Maps GPS Crosshair + Zoom Stack */
.gmap-right-controls {
  position: absolute;
  right: 10px;
  bottom: 18px;
  z-index: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.gmap-mylocation-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #FFFFFF;
  border: none;
  box-shadow: 0 1px 4px rgba(60, 64, 67, 0.3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, transform 0.15s;
}

.gmap-mylocation-btn:hover {
  background: #F1F3F4;
}

.gmap-mylocation-btn.locating svg {
  animation: gmap-pulse 1s infinite ease-in-out;
}

@keyframes gmap-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.84); opacity: 0.6; }
}

.gmap-zoom-card {
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(60, 64, 67, 0.3);
  overflow: hidden;
}

.gmap-zoom-btn {
  width: 38px;
  height: 36px;
  background: #FFFFFF;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.gmap-zoom-btn:hover {
  background: #F1F3F4;
}

.gmap-zoom-divider {
  width: 24px;
  height: 1px;
  background: #E8EAED;
  align-self: center;
}

/* Google Maps Floating Toast */
.gmap-toast {
  position: absolute;
  left: 50%;
  bottom: 56px;
  transform: translateX(-50%);
  z-index: 650;
  background: #202124;
  color: #FFFFFF;
  font-size: 0.76rem;
  font-weight: 500;
  padding: 7px 14px;
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
  white-space: nowrap;
  max-width: calc(100% - 24px);
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
}

/* Google Maps Bottom Place Info Sheet */
.gmap-place-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 14px;
  background: #FFFFFF;
  border-top: 1px solid #E8EAED;
}

.gmap-place-info {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  min-width: 0;
  flex: 1;
}

.gmap-place-pin-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #FCE8E6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.gmap-place-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.gmap-place-title {
  color: #202124;
  font-size: 0.83rem;
  font-weight: 600;
  line-height: 1.35;
}

.gmap-place-sub {
  color: #5F6368;
  font-size: 0.74rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.gmap-ext-link {
  color: #1A73E8;
  font-weight: 600;
  text-decoration: none;
}

.gmap-ext-link:hover {
  text-decoration: underline;
}

.gmap-confirm-btn {
  background: #1A73E8;
  color: #FFFFFF;
  border: none;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(26, 115, 232, 0.35);
  transition: background 0.16s, box-shadow 0.16s;
}

.gmap-confirm-btn:hover {
  background: #1557B0;
  box-shadow: 0 2px 6px rgba(26, 115, 232, 0.42);
}

/* Custom Pins inside Leaflet Fallback */
:deep(.leaflet-tile),
:deep(.leaflet-container img) {
  max-width: none !important;
  max-height: none !important;
}

:deep(.leaflet-control-attribution) {
  font-size: 10px !important;
  background: rgba(255, 255, 255, 0.78) !important;
  color: #5F6368 !important;
  padding: 1px 5px !important;
}

:deep(.gmap-leaflet-pin-wrap),
:deep(.gmap-showroom-wrap) {
  background: transparent;
  border: none;
}

:deep(.gmap-red-pin) {
  display: flex;
  align-items: center;
  justify-content: center;
  animation: gmap-drop 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes gmap-drop {
  0% { transform: translateY(-14px) scale(0.92); opacity: 0.5; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

:deep(.gmap-showroom-badge) {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #FFFFFF;
  border: 1.5px solid #1A73E8;
  color: #1967D2;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(26, 115, 232, 0.3);
  white-space: nowrap;
}

:deep(.gmap-showroom-dot) {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1A73E8;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.22);
}

@media (max-width: 640px) {
  .address-input-row {
    flex-direction: column;
  }

  .address-field-box input {
    min-height: 44px;
    font-size: 16px;
  }

  .gmap-trigger-btn {
    min-height: 42px;
    width: 100%;
  }

  .gmap-viewport {
    height: 290px;
  }

  .gmap-omnibox {
    height: 40px;
  }

  .gmap-omnibox input {
    font-size: 15px;
  }

  .gmap-place-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .gmap-confirm-btn {
    width: 100%;
    min-height: 40px;
  }
}
</style>
