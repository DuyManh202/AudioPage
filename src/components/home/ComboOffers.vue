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
          v-reveal="idx * 50"
          :class="['tgdd-card', { 'is-featured-border': combo.isFeatured }]"
        >
          <!-- Nhãn Sticker TGDD ở góc trên ảnh: Chỉ giữ % Giảm và Trả Góp 0% để ảnh luôn thoáng và gọn -->
          <div class="tgdd-sticker-bar">
            <span v-if="calcDiscountPercent(combo) > 0" class="sticker-discount">
              Giảm {{ calcDiscountPercent(combo) }}%
            </span>
            <span v-else class="sticker-hot">HOT</span>
            <span class="sticker-installment">Trả góp 0%</span>
          </div>

          <!-- Ảnh Đại Diện Bộ Dàn Sắc Nét Chuẩn Studio -->
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
            <!-- Nhãn Tôn Vinh Gói Dàn (Hero Highlight Tag) hiển thị trọn vẹn không bị cắt chữ -->
            <div v-if="combo.badge" class="tgdd-hero-tag">
              <span class="tag-fire">🔥</span>
              <span>{{ combo.badge }}</span>
            </div>
            <div v-else class="tgdd-hero-tag-empty"></div>

            <!-- Tên gói dàn (2 dòng chuẩn xác bằng nhau giữa tất cả các card) -->
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
                <span v-if="calcDiscountPercent(combo) > 0" class="price-discount-tag">
                  -{{ calcDiscountPercent(combo) }}%
                </span>
              </div>

              <div v-if="combo.fastActionPrice" class="fast-action-pill">
                <span class="bolt-icon">⚡</span>
                <span>Chuyển khoản ngay: <strong>{{ formatCurrency(combo.fastActionPrice) }}</strong></span>
              </div>

              <div class="save-badge-line">
                <span class="check-icon">✓</span>
                <span>Tiết kiệm: <strong>{{ formatCurrency(calcSaved(combo)) }}</strong></span>
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
                  <span class="promo-dot">•</span>
                  <span class="promo-text">{{ gift }}</span>
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
              TƯ VẤN &amp; THỬ DÀN TẬN NHÀ
            </button>
            <button
              type="button"
              class="btn-tgdd-detail"
              @click="openDetailModal(combo)"
            >
              <span class="detail-icon">🔍</span>
              <span>Xem Cấu Hình Chi Tiết</span>
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
  padding: 50px 0 96px;
  background: #f8fafc;
}

.combos-section .container {
  max-width: 1220px;
  margin: 0 auto;
  padding: 0 20px;
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
  padding: 8px 18px;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  align-items: stretch;
}

.tgdd-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.tgdd-card:hover {
  transform: translateY(-4px);
  border-color: #3b82f6;
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.12);
}

.tgdd-card.is-featured-border {
  border: 2px solid #f59e0b;
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.15);
}

/* STICKER / BADGE PHONG CÁCH TGDD TRÊN ẢNH */
.tgdd-sticker-bar {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
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
  font-size: 0.72rem;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(220, 38, 38, 0.35);
  white-space: nowrap;
}

.sticker-hot {
  background: #ea580c;
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(234, 88, 12, 0.35);
  white-space: nowrap;
}

.sticker-installment {
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(4px);
  color: #f8fafc;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* KHUNG ẢNH THUMBNAIL BỘ DÀN CHUẨN ĐỒ HỌA STUDIO */
.tgdd-img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
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
  transform: scale(1.04);
}

.video-chip-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(4px);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.7rem;
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
  font-size: 0.62rem;
}

.video-chip-btn:hover .play-icon-tri {
  color: #ffffff;
}

/* NỘI DUNG THẺ SẢN PHẨM */
.tgdd-info-body {
  padding: 14px 16px 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* NHÃN HERO TAG TÔN VINH BỘ DÀN */
.tgdd-hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 800;
  color: #b45309;
  background: #fef3c7;
  border: 1px solid #fde68a;
  padding: 3px 8px;
  border-radius: 6px;
  margin-bottom: 8px;
  width: fit-content;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.tag-fire {
  font-size: 0.8rem;
}

.tgdd-hero-tag-empty {
  height: 25px;
  margin-bottom: 8px;
}

.tgdd-item-title {
  font-size: 1.02rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.38;
  margin: 0 0 10px 0;
  cursor: pointer;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 2.76em;
  min-height: 2.76em;
  transition: color 0.2s;
}

.tgdd-item-title:hover {
  color: #2563eb;
}

/* THÔNG SỐ DẠNG PILLS */
.tgdd-spec-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 12px;
  min-height: 28px;
  align-items: center;
}

.spec-pill {
  font-size: 0.7rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #475569;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  white-space: nowrap;
}

.pill-room {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
  font-weight: 800;
}

/* KHỐI ĐỊNH GIÁ */
.tgdd-price-wrap {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.price-row-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.price-current {
  font-size: 1.45rem;
  font-weight: 900;
  color: #dc2626;
  letter-spacing: -0.02em;
}

.price-original {
  font-size: 0.82rem;
  color: #94a3b8;
  text-decoration: line-through;
  font-weight: 600;
}

.price-discount-tag {
  font-size: 0.72rem;
  font-weight: 800;
  color: #dc2626;
  background: #fee2e2;
  padding: 2px 6px;
  border-radius: 4px;
}

.fast-action-pill {
  font-size: 0.76rem;
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fde68a;
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
}

.fast-action-pill strong {
  font-weight: 900;
}

.bolt-icon {
  color: #d97706;
  font-size: 0.82rem;
}

.save-badge-line {
  font-size: 0.74rem;
  color: #15803d;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.check-icon {
  color: #16a34a;
  font-weight: 900;
}

/* KHUNG QUÀ TẶNG KHUYẾN MÃI (HỘP VÀNG NÉT ĐỨT TGDD) */
.tgdd-promo-box {
  background: #fffbeb;
  border: 1px dashed #f59e0b;
  border-radius: 8px;
  padding: 10px 12px;
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
  gap: 5px;
  font-size: 0.75rem;
  color: #92400e;
  margin-bottom: 5px;
}

.promo-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.74rem;
  color: #78350f;
  line-height: 1.35;
}

.promo-list li {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.promo-dot {
  color: #d97706;
  font-weight: 900;
  flex-shrink: 0;
}

.promo-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.promo-more {
  color: #2563eb;
  font-weight: 700;
  margin-top: 2px;
  cursor: pointer;
}

/* NÚT THAO TÁC THẺ SẢN PHẨM */
.tgdd-card-actions {
  padding: 12px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #ffffff;
  border-top: 1px solid #f1f5f9;
}

.btn-tgdd-order {
  width: 100%;
  padding: 11px 14px;
  background: linear-gradient(180deg, #fd6e1d 0%, #ea580c 100%);
  border: none;
  color: #ffffff;
  font-size: 0.86rem;
  font-weight: 900;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(234, 88, 12, 0.28);
  text-align: center;
  letter-spacing: 0.01em;
}

.btn-tgdd-order:hover {
  background: linear-gradient(180deg, #ea580c 0%, #c2410c 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(234, 88, 12, 0.35);
}

.btn-tgdd-detail {
  width: 100%;
  padding: 9px 12px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #374151;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-tgdd-detail:hover {
  background: #f8fafc;
  color: #111827;
  border-color: #9ca3af;
}

.detail-icon {
  font-size: 0.82rem;
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

/* RESPONSIVE DESKTOP VỪA & TABLET (681px - 1024px) */
@media (max-width: 1024px) {
  .tgdd-product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
}

/* RESPONSIVE MOBILE ĐẶC BIỆT CHUẨN THẾ GIỚI DI ĐỘNG (<= 680px) */
@media (max-width: 680px) {
  .combos-section {
    padding: 36px 0 130px;
  }
  
  .combos-section .container {
    padding: 0 12px;
  }
  
  .section-head {
    margin-bottom: 20px;
  }

  /* Thanh tab cuộn mượt tay chuẩn app di động */
  .tgdd-filter-tabs {
    justify-content: flex-start;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding: 0 12px 10px;
    flex-wrap: nowrap;
    gap: 8px;
    margin-bottom: 20px;
  }
  
  .tgdd-filter-tabs::-webkit-scrollbar {
    display: none;
  }

  .tgdd-tab-btn {
    flex-shrink: 0;
    padding: 7px 14px;
    font-size: 0.78rem;
  }

  /* Lưới 1 cột trên Mobile: Mỗi bộ dàn là 1 thẻ lớn sang trọng, thoáng đãng, không bị bóp nghẹt */
  .tgdd-product-grid {
    grid-template-columns: 1fr;
    max-width: 440px;
    margin: 0 auto;
    gap: 20px;
  }

  .tgdd-card {
    border-radius: 16px;
  }

  .tgdd-img-wrap {
    aspect-ratio: 16 / 10;
  }

  .tgdd-info-body {
    padding: 14px 14px 10px;
  }

  .tgdd-item-title {
    font-size: 0.98rem;
    height: auto;
    min-height: unset;
    -webkit-line-clamp: 3;
    margin-bottom: 8px;
  }

  .tgdd-spec-pills {
    margin-bottom: 10px;
  }

  .spec-pill {
    font-size: 0.68rem;
    padding: 2px 7px;
  }

  .price-current {
    font-size: 1.35rem;
  }

  .tgdd-promo-box {
    padding: 9px 10px;
  }

  .promo-list {
    font-size: 0.72rem;
  }

  .tgdd-card-actions {
    padding: 10px 14px 14px;
    gap: 7px;
  }

  .btn-tgdd-order {
    padding: 11px;
    font-size: 0.84rem;
  }

  .btn-tgdd-detail {
    padding: 9px;
    font-size: 0.78rem;
  }

  /* Modal trên Mobile */
  .modal-comps-grid {
    grid-template-columns: 1fr;
  }
  
  .tgdd-modal-box {
    max-height: 94vh;
    border-radius: 14px;
  }
  
  .modal-pricing-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
