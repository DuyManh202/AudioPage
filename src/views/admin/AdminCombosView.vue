<template>
  <div class="combos-admin-view">
    <div class="header-box">
      <div>
        <h2>Cấu Hình 2 Gói Dàn Karaoke Trọn Bộ</h2>
        <p class="header-sub">
          Đây là 2 sản phẩm lõi (Core Offer). Chỉnh sửa giá bán, tổng giá trị thực, video thực tế, danh sách thiết bị và quà tặng rồi bấm <strong>Lưu &amp; Đồng Bộ Lên Website</strong>.
        </p>
      </div>
    </div>

    <div class="combos-grid">
      <div
        v-for="combo in adminStore.combos"
        :key="combo.id"
        class="combo-edit-card"
      >
        <template v-if="drafts[combo.id]">
          <div class="card-head">
            <div class="badge-row">
              <input
                type="text"
                class="badge-input"
                v-model="drafts[combo.id].badge"
                @input="markDirty(combo.id)"
                placeholder="Nhãn gói dàn"
              />
              <input
                type="text"
                class="room-input"
                v-model="drafts[combo.id].roomSize"
                @input="markDirty(combo.id)"
                placeholder="Diện tích phòng..."
              />
            </div>
            <input
              type="text"
              class="combo-title-input"
              v-model="drafts[combo.id].name"
              @input="markDirty(combo.id)"
            />
            <textarea
              rows="2"
              class="combo-tagline-input"
              v-model="drafts[combo.id].tagline"
              @input="markDirty(combo.id)"
            ></textarea>
          </div>

          <div class="video-config-box">
            <div class="box-title">🎥 Video Mô Tả &amp; Hát Thử Thực Tế</div>

            <div class="form-group-sm">
              <label>Link Video YouTube hoặc File MP4:</label>
              <input
                type="text"
                v-model="drafts[combo.id].videoUrl"
                @input="markDirty(combo.id)"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div class="form-group-sm">
              <label>Tiêu Đề Video:</label>
              <input
                type="text"
                v-model="drafts[combo.id].videoTitle"
                @input="markDirty(combo.id)"
                placeholder="Ví dụ: Video Hát Thử Dàn Tại Nhà Khách..."
              />
            </div>

            <div class="combo-video-preview" v-if="getEmbed(drafts[combo.id].videoUrl)">
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

          <div class="price-editor-box">
            <div class="price-input-group">
              <label>Giá Bán Trọn Gói (VNĐ):</label>
              <input
                type="number"
                v-model.number="drafts[combo.id].price"
                @input="markDirty(combo.id)"
              />
            </div>

            <div class="price-input-group">
              <label>Giá Ưu Đãi Nhanh / CK (VNĐ):</label>
              <input
                type="number"
                v-model.number="drafts[combo.id].fastActionPrice"
                @input="markDirty(combo.id)"
              />
            </div>

            <div class="price-input-group">
              <label>Giá Niêm Yết Thiết Bị (VNĐ):</label>
              <input
                type="number"
                v-model.number="drafts[combo.id].listPrice"
                @input="markDirty(combo.id)"
              />
            </div>

            <div class="price-input-group">
              <label>Tổng Giá Trị Thật + Quà (VNĐ):</label>
              <input
                type="number"
                v-model.number="drafts[combo.id].totalRealValue"
                @input="markDirty(combo.id)"
              />
            </div>
          </div>

          <div class="components-editor">
            <div class="editor-head">
              <h4>Thiết Bị Cấu Thành ({{ drafts[combo.id].components.length }}):</h4>
              <button type="button" class="mini-add-btn" @click="addComponent(combo.id)">+ Thêm thiết bị</button>
            </div>
            <div class="comp-edit-list">
              <div v-for="(comp, idx) in drafts[combo.id].components" :key="idx" class="comp-edit-row">
                <div class="comp-fields">
                  <input
                    type="text"
                    v-model="comp.item"
                    @input="markDirty(combo.id)"
                    placeholder="Tên & số lượng thiết bị..."
                  />
                  <input
                    type="text"
                    v-model="comp.role"
                    @input="markDirty(combo.id)"
                    placeholder="Vai trò âm học..."
                  />
                </div>
                <button type="button" class="mini-del-btn" @click="removeComponent(combo.id, idx)" title="Xóa dòng">&times;</button>
              </div>
            </div>
          </div>

          <div class="gifts-editor">
            <div class="editor-head">
              <h4>🎁 Quà Tặng &amp; Dịch Vụ Kèm ({{ drafts[combo.id].gifts.length }}):</h4>
              <button type="button" class="mini-add-btn" @click="addGift(combo.id)">+ Thêm quà tặng</button>
            </div>
            <div class="gift-edit-list">
              <div v-for="(_, gIdx) in drafts[combo.id].gifts" :key="gIdx" class="gift-edit-row">
                <input
                  type="text"
                  v-model="drafts[combo.id].gifts[gIdx]"
                  @input="markDirty(combo.id)"
                  placeholder="Nội dung quà tặng / bảo hành..."
                />
                <button type="button" class="mini-del-btn" @click="removeGift(combo.id, gIdx)" title="Xóa quà">&times;</button>
              </div>
            </div>
          </div>

          <div class="card-foot">
            <span class="saved-badge">
              Tiết kiệm thực cho khách: {{ formatCurrency(calcSaved(drafts[combo.id])) }}
            </span>
            <button
              type="button"
              class="btn-primary"
              :disabled="savingId === combo.id"
              @click="saveCombo(combo.id)"
            >
              {{
                savingId === combo.id
                  ? '⏳ Đang Lưu...'
                  : dirtyMap[combo.id]
                    ? '💾 Lưu & Đồng Bộ Lên Website'
                    : '✓ Đã Đồng Bộ (Bấm Lưu Lại)'
              }}
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
        components: Array.isArray(c.components) ? c.components.map(x => ({ item: x.item || '', role: x.role || '' })) : [],
        gifts: Array.isArray(c.gifts) ? [...c.gifts] : []
      }
      dirtyMap[c.id] = false
    }
  }
}

watch(() => adminStore.combos, (list) => {
  syncDraftsFromStore(list)
}, { immediate: true, deep: true })

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
    // adminStore.adminNotice displays exact server error
  } finally {
    savingId.value = ''
  }
}
</script>

<style scoped>
.combos-admin-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header-box {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 24px;
  border-radius: var(--radius-md);
}

.header-box h2 {
  font-size: 1.5rem;
  color: #fff;
  margin-bottom: 6px;
}

.header-sub {
  font-size: 0.9rem;
  color: #94a3b8;
}

.combos-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.combo-edit-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 26px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.badge-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
}

.badge-input,
.room-input,
.combo-title-input,
.combo-tagline-input {
  width: 100%;
  background: var(--bg-dark-900);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-sm);
  color: #fff;
  padding: 8px 10px;
  outline: none;
}

.badge-input {
  color: var(--color-primary);
  font-weight: 800;
  font-size: 0.8rem;
}

.room-input {
  color: #93c5fd;
  font-size: 0.8rem;
}

.combo-title-input {
  font-size: 1.15rem;
  font-weight: 800;
  margin-bottom: 8px;
}

.combo-tagline-input {
  font-size: 0.84rem;
  color: #cbd5e1;
  resize: vertical;
}

.video-config-box {
  background: rgba(40, 55, 252, 0.08);
  border: 1px solid rgba(40, 55, 252, 0.35);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.box-title {
  font-size: 0.85rem;
  font-weight: 800;
  color: #93c5fd;
  text-transform: uppercase;
}

.form-group-sm label {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  color: #cbd5e1;
  margin-bottom: 4px;
}

.form-group-sm input {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-dark-900);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 0.85rem;
  outline: none;
}

.form-group-sm input:focus {
  border-color: var(--color-primary);
}

.combo-video-preview {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: #000;
  margin-top: 4px;
}

.combo-video-preview iframe,
.combo-video-preview video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.price-editor-box {
  background: rgba(13, 15, 24, 0.7);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.price-input-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.price-input-group label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #cbd5e1;
}

.price-input-group input {
  width: 175px;
  padding: 8px 12px;
  background: var(--bg-dark-900);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--color-primary);
  font-weight: 800;
  font-size: 0.95rem;
  text-align: right;
  outline: none;
}

.editor-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.components-editor h4,
.gifts-editor h4 {
  font-size: 0.9rem;
  color: #fff;
}

.mini-add-btn {
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: #86efac;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
}

.comp-edit-list,
.gift-edit-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comp-edit-row,
.gift-edit-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.comp-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.comp-fields input,
.gift-edit-row input {
  width: 100%;
  background: var(--bg-dark-900);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 7px 10px;
  color: #f1f5f9;
  font-size: 0.82rem;
  outline: none;
}

.comp-fields input:last-child {
  color: #94a3b8;
  font-size: 0.78rem;
}

.mini-del-btn {
  width: 30px;
  height: 32px;
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.14);
  color: #fca5a5;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.card-foot {
  margin-top: auto;
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.saved-badge {
  font-size: 0.82rem;
  color: #4ade80;
  font-weight: 700;
}

@media (max-width: 992px) {
  .combos-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .header-box {
    padding: 16px;
  }

  .combo-edit-card {
    padding: 18px 14px;
  }

  .badge-row {
    grid-template-columns: 1fr;
  }

  .price-input-group {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .price-input-group input {
    width: 100%;
    text-align: left;
    min-height: 44px;
    font-size: 16px;
  }

  .card-foot {
    flex-direction: column;
    align-items: stretch;
  }

  .card-foot .btn-primary {
    width: 100%;
  }
}
</style>
