<template>
  <div class="combos-admin-view">
    <div class="header-box">
      <div>
        <h2>Cấu Hình 2 Gói Dàn Karaoke Trọn Bộ</h2>
        <p class="header-sub">
          Đây là 2 sản phẩm lõi (Core Offer). Bác có thể cập nhật giá bán, video mô tả thực tế, cấu hình thiết bị và quà tặng kèm ngay tại đây.
        </p>
      </div>
    </div>

    <div class="combos-grid">
      <div 
        v-for="combo in adminStore.combos" 
        :key="combo.id"
        class="combo-edit-card"
      >
        <div class="card-head">
          <div class="badge-row">
            <span class="badge-gold">{{ combo.badge }}</span>
            <span class="room-tag">🏠 {{ combo.roomSize }}</span>
          </div>
          <h3>{{ combo.name }}</h3>
          <p class="tagline">{{ combo.tagline }}</p>
        </div>

        <!-- Khối chỉnh sửa Video Mô Tả Thực Tế cho từng bên gói dàn -->
        <div class="video-config-box">
          <div class="box-title">🎥 Video Mô Tả & Hát Thử Thực Tế</div>

          <div class="form-group-sm">
            <label>Link Video YouTube:</label>
            <input 
              type="text" 
              :value="combo.videoUrl" 
              placeholder="https://www.youtube.com/watch?v=..."
              @input="updateField(combo.id, 'videoUrl', $event.target.value)"
            />
          </div>

          <div class="form-group-sm">
            <label>Tiêu Đề Video:</label>
            <input 
              type="text" 
              :value="combo.videoTitle" 
              placeholder="Ví dụ: Video Hát Thử Dàn Tại Nhà Khách..."
              @input="updateField(combo.id, 'videoTitle', $event.target.value)"
            />
          </div>

          <!-- Live Preview Video -->
          <div class="combo-video-preview" v-if="getEmbed(combo.videoUrl)">
            <iframe 
              :src="getEmbed(combo.videoUrl)" 
              title="Video test dàn"
              frameborder="0" 
              allowfullscreen
            ></iframe>
          </div>
        </div>

        <div class="price-editor-box">
          <div class="price-input-group">
            <label>Giá Bán (VNĐ):</label>
            <input 
              type="number" 
              :value="combo.price" 
              @input="updatePrice(combo.id, 'price', $event.target.value)"
            />
          </div>

          <div class="price-input-group">
            <label>Chuyển Khoản Trong Ngày (VNĐ):</label>
            <input 
              type="number" 
              :value="combo.fastActionPrice" 
              @input="updatePrice(combo.id, 'fastActionPrice', $event.target.value)"
            />
          </div>

          <div class="price-input-group">
            <label>Giá Gốc Niêm Yết (VNĐ):</label>
            <input 
              type="number" 
              :value="combo.listPrice" 
              @input="updatePrice(combo.id, 'listPrice', $event.target.value)"
            />
          </div>
        </div>

        <div class="components-editor">
          <h4>Thiết Bị Cấu Thành:</h4>
          <ul class="comp-list">
            <li v-for="(item, idx) in combo.components" :key="idx">
              <strong>{{ item.item }}</strong>
              <span class="role-desc">{{ item.role }}</span>
            </li>
          </ul>
        </div>

        <div class="gifts-editor">
          <h4>🎁 Quà Tặng Đã Bao Gồm:</h4>
          <ul class="gift-list">
            <li v-for="(gift, gIdx) in combo.gifts" :key="gIdx">
              ✓ {{ gift }}
            </li>
          </ul>
        </div>

        <div class="card-foot">
          <span class="saved-badge">
            Tiết kiệm cho khách: {{ formatCurrency(combo.listPrice - combo.price) }}
          </span>
          <button class="btn-primary" @click="handleSaved(combo.name)">
            Đã Đồng Bộ Lên Website
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAdminStore } from '../../stores/adminStore'
import { useProductStore } from '../../stores/productStore'
import { formatCurrency } from '../../utils/formatters'
import { getEmbedVideoUrl } from '../../utils/videoHelper'

const adminStore = useAdminStore()
const productStore = useProductStore()

const getEmbed = (url) => getEmbedVideoUrl(url)

const updateField = (comboId, field, val) => {
  adminStore.updateCombo(comboId, { [field]: val })
  productStore.refreshProducts()
}

const updatePrice = (comboId, field, val) => {
  const num = parseInt(val, 10) || 0
  adminStore.updateCombo(comboId, { [field]: num })
  productStore.refreshProducts()
}

const handleSaved = (name) => {
  alert(`Cấu hình "${name}" đã được cập nhật thành công lên website!`)
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
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.combo-edit-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.badge-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.room-tag {
  font-size: 0.8rem;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.05);
  padding: 3px 8px;
  border-radius: 4px;
}

.combo-edit-card h3 {
  font-size: 1.35rem;
  color: #fff;
  margin-bottom: 6px;
}

.tagline {
  font-size: 0.85rem;
  color: #94a3b8;
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

.combo-video-preview iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.price-editor-box {
  background: rgba(13, 15, 24, 0.7);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.price-input-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-input-group label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #cbd5e1;
}

.price-input-group input {
  width: 170px;
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

.price-input-group input:focus {
  border-color: var(--color-primary);
}

.components-editor h4, .gifts-editor h4 {
  font-size: 0.9rem;
  color: #fff;
  margin-bottom: 10px;
}

.comp-list, .gift-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.84rem;
}

.comp-list li {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.02);
  padding: 8px 12px;
  border-radius: 4px;
}

.comp-list strong {
  color: #f1f5f9;
}

.role-desc {
  font-size: 0.75rem;
  color: #94a3b8;
}

.gift-list li {
  color: #93c5fd;
  font-size: 0.8rem;
}

.card-foot {
  margin-top: auto;
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.saved-badge {
  font-size: 0.82rem;
  color: #22c55e;
  font-weight: 700;
}

@media (max-width: 992px) {
  .combos-grid {
    grid-template-columns: 1fr;
  }
}
</style>
