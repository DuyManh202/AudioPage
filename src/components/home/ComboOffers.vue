<template>
  <section class="combos-section" id="dan-karaoke">
    <div class="container">
      <!-- Tiêu đề phân khu -->
      <div class="section-head text-center" v-reveal>
        <span class="badge-gold">ĐẦY ĐỦ THIẾT BỊ — KHÔNG PHÁT SINH</span>
        <h2 class="section-title">
          {{ combos.length > 0 ? `${combos.length} Gói Dàn Karaoke Trọn Bộ Át Chủ Bài` : 'Các Gói Dàn Karaoke Trọn Bộ Át Chủ Bài' }}
        </h2>
        <p class="section-desc">
          Được chính kỹ sư âm thanh Tú Audio tính toán công suất, ghép nối chuẩn pha, giải quyết triệt để vấn đề hú rít và hụt hơi của giọng hát.
        </p>
      </div>

      <!-- Thanh Lọc Nhanh Chuẩn Phong Cách Thế Giới Di Động -->
      <div class="tgdd-filter-tabs">
        <button
          type="button"
          :class="['tgdd-tab-btn', { active: activeFilter === 'all' }]"
          @click="activeFilter = 'all'"
        >
          <span>Tất cả ({{ combos.length }})</span>
        </button>

        <button
          type="button"
          :class="['tgdd-tab-btn', { active: activeFilter === 'under20' }]"
          @click="activeFilter = 'under20'"
        >
          <span>⚡ Dưới 20 triệu</span>
        </button>

        <button
          type="button"
          :class="['tgdd-tab-btn', { active: activeFilter === '20to30' }]"
          @click="activeFilter = '20to30'"
        >
          <span>🔥 20 - 30 triệu</span>
        </button>

        <button
          type="button"
          :class="['tgdd-tab-btn', { active: activeFilter === 'over30' }]"
          @click="activeFilter = 'over30'"
        >
          <span>👑 Trên 30 triệu</span>
        </button>

        <button
          type="button"
          :class="['tgdd-tab-btn', { active: activeFilter === 'apartment' }]"
          @click="activeFilter = 'apartment'"
        >
          <span>🏢 Chung cư &amp; Phòng nhỏ</span>
        </button>

        <button
          type="button"
          :class="['tgdd-tab-btn', { active: activeFilter === 'vip' }]"
          @click="activeFilter = 'vip'"
        >
          <span>🏰 Phòng bay &amp; Biệt thự</span>
        </button>
      </div>

      <!-- Lưới Thẻ Sản Phẩm Chuẩn Thế Giới Di Động (TGDD Product Cards Grid) -->
      <div class="tgdd-product-grid">
        <div
          v-for="(combo, idx) in filteredCombos"
          :key="combo.id"
          v-reveal="idx * 60"
          :class="['tgdd-card', { 'is-featured-border': combo.isFeatured }]"
        >
          <!-- Nhãn Sticker TGDD ở góc trên ảnh -->
          <div class="tgdd-sticker-bar">
            <span v-if="calcDiscountPercent(combo) > 0" class="sticker-discount">
              Giảm {{ calcDiscountPercent(combo) }}%
            </span>
            <span v-if="combo.badge" class="sticker-badge">
              {{ combo.badge }}
            </span>
            <span class="sticker-installment">Trả góp 0%</span>
          </div>

          <!-- Ảnh Đại Diện Bộ Dàn Sắc Nét Chuẩn Studio (Không bị lộ video vlog YouTube) -->
          <div class="tgdd-img-wrap" @click="openDetailModal(combo)">
            <img
              :src="getComboImage(combo)"
              :alt="combo.name"
              loading="lazy"
              class="tgdd-product-img"
              @error="handleImgFallback"
            />
            <!-- Nút badge xem video test thực tế góc ảnh -->
            <button
              v-if="combo.videoUrl"
              type="button"
              class="video-chip-btn"
              @click.stop="openVideoModal(combo)"
              title="Bấm để xem video kỹ sư Tú Audio test dàn thực tế"
            >
              <span class="play-icon-tri">▶</span>
              <span>Video test dàn</span>
            </button>
          </div>

          <!-- Nội Dung Thẻ Sản Phẩm Chuẩn TGDD -->
          <div class="tgdd-info-body">
            <!-- Tên gói dàn (2 dòng bằng nhau) -->
            <h3 class="tgdd-item-title" :title="combo.name" @click="openDetailModal(combo)">
              {{ combo.name }}
            </h3>

            <!-- Thông số kỹ thuật tóm tắt dạng Pills TGDD -->
            <div class="tgdd-spec-pills">
              <span class="spec-pill pill-room">
                🏠 {{ combo.roomSize }}
              </span>
              <span
                v-for="(comp, cIdx) in (combo.components || []).slice(0, 3)"
                :key="cIdx"
                class="spec-pill"
                :title="comp.role"
              >
                {{ formatShortComp(comp.item) }}
              </span>
            </div>

            <!-- Khối Định Giá Phong Cách Thế Giới Di Động -->
            <div class="tgdd-price-wrap">
              <div class="price-row-main">
                <span class="price-current">{{ formatCurrency(combo.price) }}</span>
                <span v-if="combo.totalRealValue && combo.totalRealValue > combo.price" class="price-original">
                  {{ formatCurrency(combo.totalRealValue || combo.listPrice) }}
                </span>
              </div>

              <div v-if="combo.fastActionPrice" class="fast-action-pill">
                ⚡ Chuyển khoản trong ngày: <strong>{{ formatCurrency(combo.fastActionPrice) }}</strong>
              </div>

              <div class="save-badge-line">
                ✓ Tiết kiệm: <strong>{{ formatCurrency(calcSaved(combo)) }}</strong>
              </div>
            </div>

            <!-- Khung Quà Tặng Khuyến Mãi (Hộp Vàng Nét Đứt Chuẩn TGDD) -->
            <div class="tgdd-promo-box" @click="openDetailModal(combo)">
              <div class="promo-head">
                <span class="promo-icon">🎁</span>
                <strong>Quà tặng trị giá {{ formatCurrency(calcPromoGiftValue(combo)) }}:</strong>
              </div>
              <ul class="promo-list">
                <li v-for="(gift, gIdx) in (combo.gifts || []).slice(0, 2)" :key="gIdx">
                  • {{ gift }}
                </li>
                <li v-if="(combo.gifts?.length || 0) > 2" class="promo-more">
                  + Xem thêm {{ combo.gifts.length - 2 }} quà tặng &amp; đặc quyền...
                </li>
              </ul>
            </div>
          </div>

          <!-- Nút Hành Động Đôi (Buttons) -->
          <div class="tgdd-card-actions">
            <button
              type="button"
              class="btn-tgdd-order"
              @click="handleSelectCombo(combo)"
            >
              TƯ VẤN &amp; THỬ DÀN
            </button>
            <button
              type="button"
              class="btn-tgdd-detail"
              @click="openDetailModal(combo)"
            >
              Xem Cấu Hình Chi Tiết
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL POPUP CHI TIẾT CẤU HÌNH & VIDEO TEST CHUẨN THẾ GIỚI DI ĐỘNG -->
    <div v-if="activeModalCombo" class="tgdd-modal-backdrop" @click.self="activeModalCombo = null">
      <div class="tgdd-modal-box">
        <div class="tgdd-modal-head">
          <div>
            <span class="modal-badge-sku">MÃ: {{ activeModalCombo.id }}</span>
            <h2 class="modal-title">{{ activeModalCombo.name }}</h2>
            <p class="modal-sub">{{ activeModalCombo.tagline }}</p>
          </div>
          <button type="button" class="modal-close-icon" @click="activeModalCombo = null" title="Đóng">
            ✕
          </button>
        </div>

        <div class="tgdd-modal-body">
          <!-- Video Test Hát Thử Player -->
          <div v-if="activeModalCombo.videoUrl" class="modal-video-frame">
            <video
              v-if="isDirectVideo(activeModalCombo.videoUrl)"
              :src="activeModalCombo.videoUrl"
              controls
              playsinline
              autoplay
            ></video>
            <iframe
              v-else
              :src="getEmbedVideoUrl(activeModalCombo.videoUrl) + '?autoplay=1'"
              title="Video test dàn"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>

          <!-- Bảng Giá & Ưu Đãi -->
          <div class="modal-pricing-bar">
            <div class="modal-price-left">
              <span class="modal-price-big">{{ formatCurrency(activeModalCombo.price) }}</span>
              <span class="modal-price-orig">Giá niêm yết: {{ formatCurrency(activeModalCombo.totalRealValue || activeModalCombo.listPrice) }}</span>
            </div>
            <div class="modal-price-right">
              <span class="modal-save-pill">Tiết kiệm thật: {{ formatCurrency(calcSaved(activeModalCombo)) }}</span>
              <span v-if="activeModalCombo.fastActionPrice" class="modal-fast-pill">
                CK giữ chỗ: {{ formatCurrency(activeModalCombo.fastActionPrice) }}
              </span>
            </div>
          </div>

          <!-- Danh sách thiết bị chi tiết -->
          <div class="modal-section-block">
            <h4 class="modal-sec-title">
              <span>🎛️ Chi Tiết Thiết Bị Trong Bộ Dàn</span>
              <span class="count-tag">{{ activeModalCombo.components?.length || 0 }} thiết bị</span>
            </h4>
            <div class="modal-comps-grid">
              <div
                v-for="(comp, cIdx) in activeModalCombo.components"
                :key="cIdx"
                class="modal-comp-item"
              >
                <div class="comp-badge-num">{{ cIdx + 1 }}</div>
                <div class="comp-details">
                  <strong class="comp-name-txt">{{ comp.item }}</strong>
                  <span class="comp-role-txt">{{ comp.role }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Danh sách quà tặng chi tiết -->
          <div class="modal-section-block">
            <h4 class="modal-sec-title">
              <span>🎁 Quà Tặng &amp; Đặc Quyền Đã Bao Gồm</span>
              <span class="count-tag">{{ activeModalCombo.gifts?.length || 0 }} quà tặng</span>
            </h4>
            <ul class="modal-gifts-list">
              <li v-for="(gift, gIdx) in activeModalCombo.gifts" :key="gIdx">
                <span class="gift-bullet">✓</span>
                <span>{{ gift }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="tgdd-modal-foot">
          <div class="foot-guarantee">
            ✓ <strong>Cam kết Tú Audio:</strong> Vận chuyển lắp đặt tận nơi trong bán kính 300km, hát thử tại nhà không hay không lấy tiền!
          </div>
          <button
            type="button"
            class="btn-modal-order"
            @click="orderFromModal"
          >
            Nhận Tư Vấn &amp; Thử Dàn Tận Nhà
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useProductStore } from '../../stores/productStore'
import { useCartStore } from '../../stores/cartStore'
import { formatCurrency } from '../../utils/formatters'
import { getEmbedVideoUrl, isDirectVideo, getYoutubeThumbnail } from '../../utils/videoHelper'

const productStore = useProductStore()
const cartStore = useCartStore()

const combos = computed(() => productStore.combos)
const activeFilter = ref('all')
const activeModalCombo = ref(null)

// Ánh xạ ảnh bộ dàn chuẩn đẹp
const comboImageMap = {
  'CB-29TR': '/images/combos/combo-29tr.png',
  'CB-19TR': '/images/combos/combo-19tr.png',
  'CB-24TR': '/images/combos/combo-24tr.png',
  'CB-39TR': '/images/combos/combo-vip.jpg',
  'CB-14TR': '/images/combos/combo-14tr.jpg'
}

const getComboImage = (combo) => {
  if (combo.image) return combo.image
  if (comboImageMap[combo.id]) return comboImageMap[combo.id]
  const yt = getYoutubeThumbnail(combo.videoUrl)
  if (yt) return yt
  return '/images/combos/combo-29tr.png'
}

const handleImgFallback = (e) => {
  e.target.src = '/images/combos/combo-29tr.png'
}

// Bộ lọc sản phẩm
const filteredCombos = computed(() => {
  const list = [...combos.value]
  if (activeFilter.value === 'under20') {
    return list.filter(c => Number(c.price) < 20000000)
  }
  if (activeFilter.value === '20to30') {
    return list.filter(c => Number(c.price) >= 20000000 && Number(c.price) <= 30000000)
  }
  if (activeFilter.value === 'over30') {
    return list.filter(c => Number(c.price) > 30000000)
  }
  if (activeFilter.value === 'apartment') {
    return list.filter(c => {
      const s = (c.roomSize || '').toLowerCase()
      const n = (c.name || '').toLowerCase()
      return s.includes('12') || s.includes('15') || s.includes('20') || s.includes('22') || n.includes('chung cư')
    })
  }
  if (activeFilter.value === 'vip') {
    return list.filter(c => {
      const s = (c.roomSize || '').toLowerCase()
      const n = (c.name || '').toLowerCase()
      return s.includes('35') || s.includes('45') || s.includes('50') || s.includes('65') || n.includes('vip') || n.includes('phòng bay')
    })
  }
  return list
})

const calcDiscountPercent = (combo) => {
  const base = Number(combo.totalRealValue) || Number(combo.listPrice) || 0
  const cur = Number(combo.price) || 0
  if (base <= cur || base === 0) return 0
  return Math.round(((base - cur) / base) * 100)
}

const calcSaved = (combo) => {
  if (combo.savedAmount !== undefined && combo.savedAmount !== null) return Number(combo.savedAmount)
  const base = Number(combo.totalRealValue) > 0 ? Number(combo.totalRealValue) : Number(combo.listPrice) || 0
  return Math.max(0, base - (Number(combo.price) || 0))
}

const calcPromoGiftValue = (combo) => {
  const total = Number(combo.totalRealValue) || 0
  const list = Number(combo.listPrice) || 0
  if (total > list && list > 0) return total - list
  return Math.round(Number(combo.price) * 0.25)
}

// Cắt ngắn tên thiết bị để làm chip thông số TGDD
const formatShortComp = (item) => {
  if (!item) return ''
  return item
    .replace(/^1\s+Đôi\s+/i, '')
    .replace(/^2\s+Đôi\s+/i, '')
    .replace(/^Bộ\s+/i, '')
    .replace(/^Cục\s+/i, '')
    .split('(')[0]
    .trim()
}

const openDetailModal = (combo) => {
  activeModalCombo.value = combo
}

const openVideoModal = (combo) => {
  activeModalCombo.value = combo
}

const handleSelectCombo = (combo) => {
  cartStore.openQuickOrder(combo)
}

const orderFromModal = () => {
  if (activeModalCombo.value) {
    const c = activeModalCombo.value
    activeModalCombo.value = null
    cartStore.openQuickOrder(c)
  }
}
</script>

<style scoped>
.combos-section {
  padding: 56px 0 72px;
  background: #f1f5f9;
}

.text-center {
  text-align: center;
}

.section-head {
  max-width: 760px;
  margin: 0 auto 30px;
}

.section-title {
  font-size: clamp(1.6rem, 2.8vw, 2.2rem);
  font-weight: 900;
  color: #0f172a;
  margin: 12px 0 10px;
  letter-spacing: -0.01em;
}

.section-desc {
  color: #475569;
  font-size: 0.94rem;
  line-height: 1.6;
}

/* THANH FILTER TABS PHONG CÁCH THẾ GIỚI DI ĐỘNG */
.tgdd-filter-tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.tgdd-tab-btn {
  padding: 8px 16px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #374151;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.tgdd-tab-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: #f8fafc;
}

.tgdd-tab-btn.active {
  background: #dc2626;
  border-color: #dc2626;
  color: #ffffff;
  box-shadow: 0 3px 10px rgba(220, 38, 38, 0.25);
}

/* LƯỚI SẢN PHẨM PHONG CÁCH THẾ GIỚI DI ĐỘNG */
.tgdd-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 16px;
  align-items: stretch;
}

.tgdd-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.25s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.tgdd-card:hover {
  transform: translateY(-4px);
  border-color: #3b82f6;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.12);
}

.tgdd-card.is-featured-border {
  border: 2px solid #f59e0b;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}

/* STICKER / BADGE PHONG CÁCH TGDD */
.tgdd-sticker-bar {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  pointer-events: none;
}

.sticker-discount {
  background: #dc2626;
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 900;
  padding: 3px 7px;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(220, 38, 38, 0.3);
}

.sticker-badge {
  background: #f59e0b;
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 3px 7px;
  border-radius: 4px;
  max-width: 130px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sticker-installment {
  background: #1e293b;
  color: #f8fafc;
  font-size: 0.66rem;
  font-weight: 700;
  padding: 3px 6px;
  border-radius: 4px;
}

/* KHUNG ẢNH THUMBNAIL BỘ DÀN CHUẨN ĐỒ HỌA STUDIO */
.tgdd-img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #f8fafc;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f1f5f9;
}

.tgdd-product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.tgdd-card:hover .tgdd-product-img {
  transform: scale(1.05);
}

.video-chip-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(4px);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.68rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 5;
}

.video-chip-btn:hover {
  background: #dc2626;
  border-color: #dc2626;
  transform: scale(1.05);
}

.play-icon-tri {
  color: #f87171;
  font-size: 0.6rem;
}

.video-chip-btn:hover .play-icon-tri {
  color: #ffffff;
}

/* NỘI DUNG THẺ SẢN PHẨM */
.tgdd-info-body {
  padding: 14px 14px 10px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.tgdd-item-title {
  font-size: 0.94rem;
  font-weight: 800;
  color: #1f2937;
  line-height: 1.35;
  margin: 0 0 8px 0;
  cursor: pointer;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 2.7em;
  transition: color 0.2s;
}

.tgdd-item-title:hover {
  color: #2563eb;
}

/* THÔNG SỐ DẠNG PILLS */
.tgdd-spec-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.spec-pill {
  font-size: 0.68rem;
  font-weight: 700;
  background: #f3f4f6;
  color: #4b5563;
  padding: 2px 7px;
  border-radius: 4px;
  white-space: nowrap;
}

.pill-room {
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 800;
}

/* KHỐI ĐỊNH GIÁ */
.tgdd-price-wrap {
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e5e7eb;
}

.price-row-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 3px;
  flex-wrap: wrap;
}

.price-current {
  font-size: 1.35rem;
  font-weight: 900;
  color: #dc2626;
  letter-spacing: -0.01em;
}

.price-original {
  font-size: 0.8rem;
  color: #9ca3af;
  text-decoration: line-through;
  font-weight: 600;
}

.fast-action-pill {
  font-size: 0.74rem;
  color: #b45309;
  background: #fef3c7;
  padding: 3px 8px;
  border-radius: 5px;
  margin-bottom: 3px;
  display: inline-block;
}

.fast-action-pill strong {
  font-weight: 900;
}

.save-badge-line {
  font-size: 0.72rem;
  color: #15803d;
  font-weight: 700;
}

/* KHUNG QUÀ TẶNG KHUYẾN MÃI (HỘP VÀNG NÉT ĐỨT TGDD) */
.tgdd-promo-box {
  background: #fffbeb;
  border: 1px dashed #fcd34d;
  border-radius: 6px;
  padding: 8px 10px;
  cursor: pointer;
  margin-top: auto;
  transition: background 0.2s;
}

.tgdd-promo-box:hover {
  background: #fef3c7;
}

.promo-head {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: #92400e;
  margin-bottom: 4px;
}

.promo-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.72rem;
  color: #78350f;
  line-height: 1.3;
}

.promo-list li {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.promo-more {
  color: #2563eb;
  font-weight: 700;
  margin-top: 1px;
}

/* NÚT THAO TÁC THẺ SẢN PHẨM */
.tgdd-card-actions {
  padding: 10px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #ffffff;
}

.btn-tgdd-order {
  width: 100%;
  padding: 10px;
  background: linear-gradient(180deg, #fd6e1d, #f59000);
  border: none;
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 900;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(245, 144, 0, 0.35);
  text-align: center;
}

.btn-tgdd-order:hover {
  background: linear-gradient(180deg, #f59000, #d97706);
  transform: translateY(-1px);
}

.btn-tgdd-detail {
  width: 100%;
  padding: 7px;
  background: transparent;
  border: 1px solid #d1d5db;
  color: #4b5563;
  font-size: 0.76rem;
  font-weight: 700;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.btn-tgdd-detail:hover {
  background: #f3f4f6;
  color: #111827;
  border-color: #9ca3af;
}

/* MODAL CHI TIẾT & VIDEO */
.tgdd-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.tgdd-modal-box {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
}

.tgdd-modal-head {
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.modal-badge-sku {
  display: inline-block;
  font-family: monospace;
  font-weight: 900;
  font-size: 0.74rem;
  background: #eff6ff;
  color: #2563eb;
  padding: 2px 7px;
  border-radius: 4px;
  margin-bottom: 4px;
}

.modal-title {
  font-size: 1.22rem;
  font-weight: 900;
  color: #0f172a;
  margin: 0 0 3px 0;
}

.modal-sub {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
}

.modal-close-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  border: none;
  font-size: 1.1rem;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-icon:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.tgdd-modal-body {
  padding: 18px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-video-frame {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
}

.modal-video-frame iframe,
.modal-video-frame video {
  width: 100%;
  height: 100%;
  border: none;
  object-fit: cover;
}

.modal-pricing-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
}

.modal-price-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.modal-price-big {
  font-size: 1.55rem;
  font-weight: 900;
  color: #dc2626;
}

.modal-price-orig {
  font-size: 0.82rem;
  color: #94a3b8;
  text-decoration: line-through;
}

.modal-price-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.modal-save-pill {
  font-size: 0.76rem;
  font-weight: 800;
  color: #15803d;
  background: #dcfce7;
  padding: 4px 10px;
  border-radius: 6px;
}

.modal-fast-pill {
  font-size: 0.76rem;
  font-weight: 800;
  color: #b45309;
  background: #fef3c7;
  padding: 4px 10px;
  border-radius: 6px;
}

.modal-section-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-sec-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.count-tag {
  font-size: 0.72rem;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 999px;
}

.modal-comps-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.modal-comp-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.comp-badge-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #2563eb;
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.comp-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.comp-name-txt {
  font-size: 0.82rem;
  color: #0f172a;
}

.comp-role-txt {
  font-size: 0.72rem;
  color: #64748b;
}

.modal-gifts-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.modal-gifts-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.8rem;
  color: #166534;
  line-height: 1.4;
  background: #f0fdf4;
  padding: 8px 12px;
  border-radius: 7px;
}

.gift-bullet {
  color: #16a34a;
  font-weight: 900;
}

.tgdd-modal-foot {
  padding: 14px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.foot-guarantee {
  font-size: 0.78rem;
  color: #475569;
  flex: 1;
  min-width: 220px;
}

.btn-modal-order {
  padding: 10px 20px;
  background: linear-gradient(180deg, #fd6e1d, #f59000);
  border: none;
  color: #ffffff;
  font-size: 0.86rem;
  font-weight: 900;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(245, 144, 0, 0.35);
  transition: all 0.2s;
}

.btn-modal-order:hover {
  background: linear-gradient(180deg, #f59000, #d97706);
  transform: translateY(-1px);
}

/* RESPONSIVE */
@media (max-width: 900px) {
  .tgdd-product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .modal-comps-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .combos-section {
    padding: 36px 0 48px;
  }
  .tgdd-product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  .tgdd-info-body {
    padding: 10px 8px 6px;
  }
  .tgdd-card-actions {
    padding: 6px 8px 10px;
  }
  .price-current {
    font-size: 1.1rem;
  }
  .tgdd-filter-tabs {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 4px;
    flex-wrap: nowrap;
  }
  .tgdd-tab-btn {
    flex-shrink: 0;
  }
}
</style>
