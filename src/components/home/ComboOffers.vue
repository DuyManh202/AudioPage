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

      <!-- Thanh Lọc Nhanh Phong Cách Thế Giới Di Động -->
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

      <!-- Lưới Thẻ Sản Phẩm Chuẩn Thế Giới Di Động -->
      <div class="tgdd-product-grid">
        <div
          v-for="(combo, idx) in filteredCombos"
          :key="combo.id"
          v-reveal="idx * 80"
          :class="['tgdd-card', { 'is-featured-border': combo.isFeatured }]"
        >
          <!-- Nhãn Sticker TGDD ở góc -->
          <div class="tgdd-sticker-bar">
            <span v-if="calcDiscountPercent(combo) > 0" class="sticker-discount">
              Giảm {{ calcDiscountPercent(combo) }}%
            </span>
            <span v-if="combo.badge" class="sticker-badge">
              {{ combo.badge }}
            </span>
            <span class="sticker-installment">Trả góp 0%</span>
          </div>

          <!-- Thumbnail Video Test Hát Thử (Ảnh bìa YouTube + Nút Play phong cách TGDD) -->
          <div class="tgdd-media-box" @click="openVideoModal(combo)">
            <img
              :src="getThumb(combo.videoUrl)"
              :alt="combo.name"
              loading="lazy"
              class="tgdd-thumb-img"
              @error="handleImgFallback"
            />
            <div class="play-overlay">
              <div class="play-circle-btn">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
              </div>
              <span class="play-text">Xem video test dàn</span>
            </div>
            <div class="media-room-tag">
              🏠 {{ combo.roomSize || 'Phòng gia đình' }}
            </div>
          </div>

          <!-- Thông tin tiêu đề & Không gian -->
          <div class="tgdd-info-body">
            <h3 class="tgdd-item-title" :title="combo.name" @click="openDetailModal(combo)">
              {{ combo.name }}
            </h3>

            <!-- Thông số kỹ thuật tóm tắt dạng Pills TGDD -->
            <div class="tgdd-spec-pills">
              <span
                v-for="(comp, cIdx) in (combo.components || []).slice(0, 4)"
                :key="cIdx"
                class="spec-pill"
                :title="comp.role"
              >
                {{ formatShortComp(comp.item) }}
              </span>
            </div>

            <!-- Khối Định Giá Chuẩn Thế Giới Di Động -->
            <div class="tgdd-price-wrap">
              <div class="price-row-main">
                <span class="price-current">{{ formatCurrency(combo.price) }}</span>
                <span v-if="combo.totalRealValue && combo.totalRealValue > combo.price" class="price-original">
                  {{ formatCurrency(combo.totalRealValue || combo.listPrice) }}
                </span>
              </div>

              <div v-if="combo.fastActionPrice" class="fast-action-text">
                ⚡ Chuyển khoản trong ngày: <strong>{{ formatCurrency(combo.fastActionPrice) }}</strong>
              </div>

              <div class="save-badge-line">
                ✓ Tiết kiệm: <strong>{{ formatCurrency(calcSaved(combo)) }}</strong>
              </div>
            </div>

            <!-- Khung Khuyến Mãi & Quà Tặng Chuẩn TGDD -->
            <div class="tgdd-promo-box" @click="openDetailModal(combo)">
              <div class="promo-head">
                <span class="promo-icon">🎁</span>
                <strong>Quà tặng kèm theo ({{ combo.gifts?.length || 0 }} phần quà):</strong>
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
              class="btn-tgdd-detail"
              @click="openDetailModal(combo)"
            >
              Xem Cấu Hình
            </button>
            <button
              type="button"
              class="btn-tgdd-order"
              @click="handleSelectCombo(combo)"
            >
              Tư Vấn &amp; Thử Dàn
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL CHI TIẾT CẤU HÌNH & VIDEO PHÁT TRỰC TIẾP -->
    <div v-if="activeModalCombo" class="tgdd-modal-backdrop" @click.self="activeModalCombo = null">
      <div class="tgdd-modal-box">
        <div class="tgdd-modal-head">
          <div>
            <span class="modal-badge-sku">{{ activeModalCombo.id }}</span>
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

const getThumb = (url) => {
  const yt = getYoutubeThumbnail(url)
  if (yt) return yt
  return 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80'
}

const handleImgFallback = (e) => {
  e.target.src = 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80'
}

// Cắt ngắn tên thiết bị để làm chip thông số TGDD
const formatShortComp = (item) => {
  if (!item) return ''
  return item
    .replace(/^1\s+Đôi\s+/i, '')
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
  padding: 64px 0 80px;
  background: #f8fafc;
}

.text-center {
  text-align: center;
}

.section-head {
  max-width: 760px;
  margin: 0 auto 36px;
}

.section-title {
  font-size: clamp(1.65rem, 3vw, 2.25rem);
  font-weight: 900;
  color: #0f172a;
  margin: 12px 0 10px;
  letter-spacing: -0.01em;
}

.section-desc {
  color: #475569;
  font-size: 0.96rem;
  line-height: 1.65;
}

/* THANH FILTER TABS PHONG CÁCH THẾ GIỚI DI ĐỘNG */
.tgdd-filter-tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.tgdd-tab-btn {
  padding: 8px 16px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.tgdd-tab-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.tgdd-tab-btn.active {
  background: #dc2626;
  border-color: #dc2626;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
}

/* LƯỚI SẢN PHẨM PHONG CÁCH THẾ GIỚI DI ĐỘNG */
.tgdd-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(285px, 1fr));
  gap: 20px;
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
  transition: all 0.28s ease;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.tgdd-card:hover {
  transform: translateY(-5px);
  border-color: #3b82f6;
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.12);
}

.tgdd-card.is-featured-border {
  border: 2px solid #f59e0b;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.18);
}

/* STICKER / BADGE PHONG CÁCH TGDD */
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
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 900;
  padding: 3px 8px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(220, 38, 38, 0.35);
}

.sticker-badge {
  background: #f59e0b;
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sticker-installment {
  background: #1e293b;
  color: #f8fafc;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 6px;
}

/* KHUNG ẢNH THUMBNAIL / VIDEO TEST */
.tgdd-media-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #0f172a;
  overflow: hidden;
  cursor: pointer;
}

.tgdd-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.tgdd-card:hover .tgdd-thumb-img {
  transform: scale(1.05);
}

.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.38);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.25s;
}

.tgdd-card:hover .play-overlay {
  background: rgba(15, 23, 42, 0.52);
}

.play-circle-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #dc2626;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.5);
  transition: transform 0.25s;
}

.tgdd-card:hover .play-circle-btn {
  transform: scale(1.15);
}

.play-text {
  font-size: 0.72rem;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.02em;
}

.media-room-tag {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  color: #f8fafc;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
}

/* PHẦN NỘI DUNG CHÍNH (BODY) */
.tgdd-info-body {
  padding: 16px 16px 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.tgdd-item-title {
  font-size: 0.98rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.4;
  margin: 0 0 10px 0;
  cursor: pointer;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.8em;
  transition: color 0.2s;
}

.tgdd-item-title:hover {
  color: #2563eb;
}

/* THÔNG SỐ PILLS */
.tgdd-spec-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 12px;
}

.spec-pill {
  font-size: 0.7rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #475569;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

/* KHỐI ĐỊNH GIÁ TGDD */
.tgdd-price-wrap {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #e2e8f0;
}

.price-row-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.price-current {
  font-size: 1.38rem;
  font-weight: 900;
  color: #dc2626;
  letter-spacing: -0.01em;
}

.price-original {
  font-size: 0.82rem;
  color: #94a3b8;
  text-decoration: line-through;
  font-weight: 600;
}

.fast-action-text {
  font-size: 0.76rem;
  color: #b45309;
  margin-bottom: 3px;
}

.fast-action-text strong {
  font-weight: 800;
}

.save-badge-line {
  font-size: 0.75rem;
  color: #15803d;
  font-weight: 700;
}

/* KHUNG KHUYẾN MÃI QUÀ TẶNG */
.tgdd-promo-box {
  background: #fffbeb;
  border: 1px dashed #fcd34d;
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
  font-size: 0.76rem;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.promo-more {
  color: #2563eb;
  font-weight: 700;
  margin-top: 2px;
}

/* NÚT THAO TÁC THẺ SẢN PHẨM */
.tgdd-card-actions {
  padding: 12px 16px 16px;
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 8px;
  background: #ffffff;
}

.btn-tgdd-detail {
  padding: 9px 8px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 800;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-tgdd-detail:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-tgdd-order {
  padding: 9px 8px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 900;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 3px 8px rgba(217, 119, 6, 0.3);
}

.btn-tgdd-order:hover {
  background: linear-gradient(135deg, #d97706, #b45309);
  transform: translateY(-1px);
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
  border-radius: 18px;
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
}

.tgdd-modal-head {
  padding: 18px 22px;
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
  font-size: 1.25rem;
  font-weight: 900;
  color: #0f172a;
  margin: 0 0 3px 0;
}

.modal-sub {
  font-size: 0.82rem;
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
  padding: 20px 22px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
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
  padding: 14px 16px;
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
  font-size: 1.6rem;
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
  font-size: 0.78rem;
  font-weight: 800;
  color: #15803d;
  background: #dcfce7;
  padding: 4px 10px;
  border-radius: 6px;
}

.modal-fast-pill {
  font-size: 0.78rem;
  font-weight: 800;
  color: #b45309;
  background: #fef3c7;
  padding: 4px 10px;
  border-radius: 6px;
}

.modal-section-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal-sec-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.92rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.count-tag {
  font-size: 0.74rem;
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
  padding: 10px 12px;
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
  font-size: 0.74rem;
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
  font-size: 0.82rem;
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
  padding: 14px 22px;
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
  min-width: 240px;
}

.btn-modal-order {
  padding: 11px 22px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  color: #ffffff;
  font-size: 0.88rem;
  font-weight: 900;
  border-radius: 9px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35);
  transition: all 0.2s;
}

.btn-modal-order:hover {
  background: linear-gradient(135deg, #d97706, #b45309);
  transform: translateY(-2px);
}

/* RESPONSIVE */
@media (max-width: 900px) {
  .tgdd-product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
  .modal-comps-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .tgdd-product-grid {
    grid-template-columns: 1fr;
  }
  .tgdd-filter-tabs {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 6px;
    flex-wrap: nowrap;
  }
  .tgdd-tab-btn {
    flex-shrink: 0;
  }
}
</style>
