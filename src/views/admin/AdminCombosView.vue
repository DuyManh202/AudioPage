<template>
  <div class="adm-page">
    <!-- Đầu trang Cấu Hình Gói Dàn -->
    <div class="adm-page-head">
      <div>
        <h1 class="adm-page-title">Cấu Hình Gói Dàn Karaoke Trọn Bộ</h1>
        <p class="adm-page-sub">
          Quản lý sản phẩm chủ lực (Core Offer) hiển thị ngay đầu Trang Chủ — chỉnh sửa giá trọn gói, video hát thử thực tế, danh mục thiết bị và quà tặng đi kèm.
        </p>
      </div>
      <div class="adm-head-actions">
        <router-link to="/#combo-packages" target="_blank" class="adm-btn adm-btn-ghost">
          <AdminIcon name="globe" :size="15" />
          <span>Xem Ngoài Trang Chủ</span>
        </router-link>
      </div>
    </div>

    <!-- Lưới Chỉnh Sửa 2 Gói Dàn -->
    <div class="combos-grid">
      <div
        v-for="combo in adminStore.combos"
        :key="combo.id"
        class="adm-card combo-panel"
      >
        <template v-if="drafts[combo.id]">
          <!-- Thanh Trạng Thái Đầu Thẻ -->
          <div class="combo-panel-head">
            <div class="combo-head-badges">
              <span class="adm-badge adm-badge-gold">{{ drafts[combo.id].badge || 'Gói Dàn Chủ Lực' }}</span>
              <span class="adm-badge adm-badge-blue">{{ drafts[combo.id].roomSize || 'Phòng gia đình' }}</span>
            </div>
            <span v-if="dirtyMap[combo.id]" class="adm-badge adm-badge-red">Chưa lưu thay đổi</span>
            <span v-else class="adm-badge adm-badge-green">Đã đồng bộ CSDL</span>
          </div>

          <div class="combo-panel-body">
            <!-- Thông tin tiêu đề & nhãn -->
            <div class="adm-form-grid">
              <div class="adm-field">
                <label>Nhãn Nổi Bật Gói Dàn</label>
                <input
                  type="text"
                  v-model="drafts[combo.id].badge"
                  @input="markDirty(combo.id)"
                  placeholder="Bán Chạy Số 1 / Tiết Kiệm Nhất..."
                />
              </div>
              <div class="adm-field">
                <label>Diện Tích Phòng Đề Xuất</label>
                <input
                  type="text"
                  v-model="drafts[combo.id].roomSize"
                  @input="markDirty(combo.id)"
                  placeholder="Phòng 25 - 45m²..."
                />
              </div>
            </div>

            <div class="adm-field">
              <label>Tên Gói Dàn Trọn Bộ</label>
              <input
                type="text"
                class="title-strong-input"
                v-model="drafts[combo.id].name"
                @input="markDirty(combo.id)"
              />
            </div>

            <div class="adm-field">
              <label>Mô Tả Giá Trị Cốt Lõi (Tagline)</label>
              <textarea
                rows="2"
                v-model="drafts[combo.id].tagline"
                @input="markDirty(combo.id)"
              ></textarea>
            </div>

            <!-- Cấu hình Giá & Tiết kiệm -->
            <div class="pricing-block">
              <div class="block-label-row">
                <span class="sub-title">Bảng Định Giá &amp; Ưu Đãi Trọn Bộ</span>
                <span class="saved-live">
                  Khách tiết kiệm: <strong>{{ formatCurrency(calcSaved(drafts[combo.id])) }}</strong>
                </span>
              </div>

              <div class="adm-form-grid">
                <div class="adm-field">
                  <label>Giá Bán Trọn Gói ({{ formatCurrency(drafts[combo.id].price) }})</label>
                  <input
                    type="number"
                    min="0"
                    v-model.number="drafts[combo.id].price"
                    @input="markDirty(combo.id)"
                  />
                </div>

                <div class="adm-field">
                  <label>Giá Ưu Đãi Chuyển Khoản ({{ formatCurrency(drafts[combo.id].fastActionPrice) }})</label>
                  <input
                    type="number"
                    min="0"
                    v-model.number="drafts[combo.id].fastActionPrice"
                    @input="markDirty(combo.id)"
                  />
                </div>

                <div class="adm-field">
                  <label>Giá Lẻ Cộng Gộp ({{ formatCurrency(drafts[combo.id].listPrice) }})</label>
                  <input
                    type="number"
                    min="0"
                    v-model.number="drafts[combo.id].listPrice"
                    @input="markDirty(combo.id)"
                  />
                </div>

                <div class="adm-field">
                  <label>Tổng Giá Trị Kèm Quà ({{ formatCurrency(drafts[combo.id].totalRealValue) }})</label>
                  <input
                    type="number"
                    min="0"
                    v-model.number="drafts[combo.id].totalRealValue"
                    @input="markDirty(combo.id)"
                  />
                </div>
              </div>
            </div>

            <!-- Video Test Dàn Thực Tế -->
            <div class="video-block">
              <div class="block-label-row">
                <span class="sub-title">
                  <AdminIcon name="video" :size="15" />
                  Video Hát Thử Thực Tế
                </span>
              </div>

              <div class="adm-form-grid">
                <div class="adm-field">
                  <label>Đường Dẫn YouTube hoặc MP4</label>
                  <input
                    type="text"
                    v-model="drafts[combo.id].videoUrl"
                    @input="markDirty(combo.id)"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <div class="adm-field">
                  <label>Tiêu Đề Video</label>
                  <input
                    type="text"
                    v-model="drafts[combo.id].videoTitle"
                    @input="markDirty(combo.id)"
                    placeholder="Video Test Dàn Tại Nhà Khách..."
                  />
                </div>
              </div>

              <div v-if="getEmbed(drafts[combo.id].videoUrl)" class="video-embed-box">
                <video
                  v-if="isDirectVideo(drafts[combo.id].videoUrl)"
                  :src="getEmbed(drafts[combo.id].videoUrl)"
                  controls
                  preload="metadata"
                  playsinline
                ></video>
                <iframe
                  v-else
                  :src="getEmbed(drafts[combo.id].videoUrl)"
                  title="Video test dàn"
                  frameborder="0"
                  allowfullscreen
                ></iframe>
              </div>
            </div>

            <!-- Danh mục Thiết bị cấu thành -->
            <div class="list-editor-block">
              <div class="block-label-row">
                <span class="sub-title">Thiết Bị Trong Bộ Dàn ({{ drafts[combo.id].components.length }})</span>
                <button type="button" class="adm-btn adm-btn-sm adm-btn-ghost" @click="addComponent(combo.id)">
                  <AdminIcon name="plus" :size="13" /> Thêm thiết bị
                </button>
              </div>

              <div class="rows-stack">
                <div
                  v-for="(comp, idx) in drafts[combo.id].components"
                  :key="idx"
                  class="comp-item-row"
                >
                  <div class="comp-inputs">
                    <input
                      type="text"
                      v-model="comp.item"
                      @input="markDirty(combo.id)"
                      placeholder="Tên & số lượng thiết bị (vd: Đôi Loa Full 30 PF 12 Pro)..."
                    />
                    <input
                      type="text"
                      v-model="comp.role"
                      @input="markDirty(combo.id)"
                      placeholder="Vai trò âm học (vd: Tái tạo tiếng ca dày, sáng rõ)..."
                    />
                  </div>
                  <button
                    type="button"
                    class="row-del-btn"
                    @click="removeComponent(combo.id, idx)"
                    title="Xóa thiết bị này"
                  >
                    <AdminIcon name="x" :size="14" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Danh mục Quà tặng & Dịch vụ -->
            <div class="list-editor-block">
              <div class="block-label-row">
                <span class="sub-title">Quà Tặng &amp; Đặc Quyền Kèm Theo ({{ drafts[combo.id].gifts.length }})</span>
                <button type="button" class="adm-btn adm-btn-sm adm-btn-ghost" @click="addGift(combo.id)">
                  <AdminIcon name="plus" :size="13" /> Thêm quà tặng
                </button>
              </div>

              <div class="rows-stack">
                <div
                  v-for="(_, gIdx) in drafts[combo.id].gifts"
                  :key="gIdx"
                  class="gift-item-row"
                >
                  <input
                    type="text"
                    v-model="drafts[combo.id].gifts[gIdx]"
                    @input="markDirty(combo.id)"
                    placeholder="Nội dung quà tặng / cam kết lắp đặt..."
                  />
                  <button
                    type="button"
                    class="row-del-btn"
                    @click="removeGift(combo.id, gIdx)"
                    title="Xóa dòng quà tặng"
                  >
                    <AdminIcon name="x" :size="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Chân thẻ: Lưu đồng bộ -->
          <div class="combo-panel-foot">
            <span class="foot-note">
              Giá bán hiển thị: <strong>{{ formatCurrency(drafts[combo.id].price) }}</strong>
            </span>
            <button
              type="button"
              class="adm-btn adm-btn-gold"
              :disabled="savingId === combo.id"
              @click="saveCombo(combo.id)"
            >
              <AdminIcon name="check" :size="16" />
              <span>
                {{
                  savingId === combo.id
                    ? 'Đang lưu lên CSDL...'
                    : dirtyMap[combo.id]
                      ? 'Lưu & Đồng Bộ Lên Website'
                      : 'Lưu Cập Nhật Gói Dàn'
                }}
              </span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import { useProductStore } from '../../stores/productStore'
import { formatCurrency } from '../../utils/formatters'
import { getEmbedVideoUrl, isDirectVideo } from '../../utils/videoHelper'
import AdminIcon from '../../components/admin/AdminIcon.vue'

const adminStore = useAdminStore()
const productStore = useProductStore()

const drafts = reactive({})
const dirtyMap = reactive({})
const savingId = ref('')

const syncDraftsFromStore = (combos) => {
  for (const c of combos || []) {
    if (!drafts[c.id] || !dirtyMap[c.id]) {
      drafts[c.id] = {
        name: c.name || '',
        tagline: c.tagline || '',
        roomSize: c.roomSize || '',
        badge: c.badge || '',
        price: Number(c.price) || 0,
        fastActionPrice: Number(c.fastActionPrice) || 0,
        listPrice: Number(c.listPrice) || 0,
        totalRealValue: Number(c.totalRealValue || c.listPrice) || 0,
        videoUrl: c.videoUrl || '',
        videoTitle: c.videoTitle || '',
        components: Array.isArray(c.components)
          ? c.components.map(x => ({ item: x.item || '', role: x.role || '' }))
          : [],
        gifts: Array.isArray(c.gifts) ? [...c.gifts] : []
      }
      dirtyMap[c.id] = false
    }
  }
}

watch(
  () => adminStore.combos,
  (list) => {
    syncDraftsFromStore(list)
  },
  { immediate: true, deep: true }
)

const markDirty = (comboId) => {
  dirtyMap[comboId] = true
}

const getEmbed = (url) => getEmbedVideoUrl(url)

const calcSaved = (d) => {
  const base = Number(d.totalRealValue) > 0 ? Number(d.totalRealValue) : Number(d.listPrice) || 0
  return Math.max(0, base - (Number(d.price) || 0))
}

const addComponent = (comboId) => {
  drafts[comboId].components.push({ item: '', role: '' })
  markDirty(comboId)
}

const removeComponent = (comboId, idx) => {
  drafts[comboId].components.splice(idx, 1)
  markDirty(comboId)
}

const addGift = (comboId) => {
  drafts[comboId].gifts.push('')
  markDirty(comboId)
}

const removeGift = (comboId, idx) => {
  drafts[comboId].gifts.splice(idx, 1)
  markDirty(comboId)
}

const saveCombo = async (comboId) => {
  const d = drafts[comboId]
  if (!d || savingId.value) return

  savingId.value = comboId
  try {
    const cleanComponents = d.components
      .filter(c => c.item && c.item.trim() !== '')
      .map(c => ({ item: c.item.trim(), role: (c.role || '').trim() }))
    const cleanGifts = d.gifts.map(g => String(g || '').trim()).filter(Boolean)

    await adminStore.updateCombo(comboId, {
      name: d.name,
      tagline: d.tagline,
      roomSize: d.roomSize,
      badge: d.badge,
      price: Number(d.price) || 0,
      fastActionPrice: Number(d.fastActionPrice) || 0,
      listPrice: Number(d.listPrice) || 0,
      totalRealValue: Number(d.totalRealValue) || 0,
      savedAmount: calcSaved(d),
      videoUrl: d.videoUrl,
      videoTitle: d.videoTitle,
      components: cleanComponents,
      gifts: cleanGifts
    })
    dirtyMap[comboId] = false
    await productStore.refreshProducts()
  } catch {
    // Error handled in store
  } finally {
    savingId.value = ''
  }
}
</script>

<style scoped>
.combos-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.combo-panel {
  display: flex;
  flex-direction: column;
}

.combo-panel-head {
  padding: 15px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(9, 12, 21, 0.55);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.combo-head-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.combo-panel-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.title-strong-input {
  font-weight: 800;
  font-size: 1rem !important;
  color: #fcb728 !important;
}

.pricing-block,
.video-block,
.list-editor-block {
  padding: 14px;
  border-radius: 12px;
  background: rgba(9, 12, 21, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.block-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.sub-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #cbd5e1;
}

.saved-live {
  font-size: 0.78rem;
  color: #86efac;
}

.video-embed-box {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  overflow: hidden;
  background: #05070d;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.video-embed-box iframe,
.video-embed-box video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rows-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comp-item-row,
.gift-item-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.comp-inputs {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.comp-inputs input,
.gift-item-row input {
  width: 100%;
  padding: 8px 10px;
  background: #090c15;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 7px;
  color: #f8fafc;
  font-size: 0.82rem;
  outline: none;
}

.comp-inputs input:last-child {
  color: #94a3b8;
  font-size: 0.77rem;
}

.comp-inputs input:focus,
.gift-item-row input:focus {
  border-color: #fcb728;
}

.row-del-btn {
  width: 32px;
  height: 34px;
  border-radius: 7px;
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.row-del-btn:hover {
  background: #dc2626;
  color: #fff;
}

.combo-panel-foot {
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(9, 12, 21, 0.65);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.foot-note {
  font-size: 0.82rem;
  color: #94a3b8;
}

.foot-note strong {
  color: #fcb728;
}

@media (max-width: 1060px) {
  .combos-grid {
    grid-template-columns: 1fr;
  }
}
</style>
