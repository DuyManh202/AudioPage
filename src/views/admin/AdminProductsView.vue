<template>
  <div class="products-admin-view">
    <div class="admin-toolbar">
      <div class="search-wrap">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Tìm theo tên loa, bass, mã thiết bị..."
        />
      </div>

      <button class="btn-primary" @click="openAddModal">
        ➕ Thêm Thiết Bị Mới
      </button>
    </div>

    <!-- Bảng Danh Sách Sản Phẩm -->
    <div class="panel-box">
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Hình Ảnh</th>
              <th>Tên Thiết Bị / Model</th>
              <th>Danh Mục</th>
              <th>Cấu Hình Âm Học</th>
              <th>Video Mô Tả</th>
              <th>Giá Bán</th>
              <th>Phù Hợp Phòng</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in filteredProducts" :key="product.id">
              <td>
                <div class="thumb-mini">
                  <img :src="product.image" :alt="product.name" />
                </div>
              </td>
              <td>
                <strong class="product-name">{{ product.name }}</strong>
                <span class="product-desc-mini">{{ product.shortDesc }}</span>
              </td>
              <td>
                <span class="category-tag">{{ getCategoryName(product.category) }}</span>
              </td>
              <td>
                <div class="specs-mini-list">
                  <span v-if="product.bassSize !== '-'">🔊 Bass: <strong>{{ product.bassSize }}</strong></span>
                  <span v-if="product.powerRMS > 0">⚡ RMS: <strong>{{ product.powerRMS }}W</strong></span>
                </div>
              </td>
              <td>
                <span v-if="product.videoUrl" class="video-badge" title="Đã có video test âm">
                  ▶️ Có Video
                </span>
                <span v-else class="no-video-badge">
                  Chưa có
                </span>
              </td>
              <td>
                <span class="price-val">{{ formatCurrency(product.price) }}</span>
                <span v-if="product.originalPrice > product.price" class="old-price">
                  {{ formatCurrency(product.originalPrice) }}
                </span>
              </td>
              <td>
                <span class="room-pill">{{ product.roomSize }}</span>
              </td>
              <td>
                <div class="row-actions">
                  <button class="btn-icon" @click="openEditModal(product)" title="Chỉnh sửa">
                    ✏️ Sửa
                  </button>
                  <button class="btn-icon text-red" @click="handleDelete(product.id)" title="Xóa">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredProducts.length === 0">
              <td colspan="8" class="text-center py-4">
                Không tìm thấy thiết bị nào.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Thêm / Chỉnh Sửa Sản Phẩm (Thiết kế 2 bên chuyên nghiệp) -->
    <div v-if="isModalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-window modal-wide">
        <button class="close-x" @click="closeModal">&times;</button>
        <div class="modal-header">
          <h3>{{ editingId ? 'Chỉnh Sửa Thiết Bị' : 'Thêm Thiết Bị Mới Vào Kho' }}</h3>
          <p class="modal-sub">Điền đầy đủ thông số âm học và bổ sung video mô tả/test âm thực tế cho thiết bị</p>
        </div>

        <form @submit.prevent="saveProduct" class="modal-form">
          <div class="modal-two-columns">
            <!-- CỘT BÊN TRÁI: Thông số kỹ thuật & Giá bán -->
            <div class="modal-col-left">
              <div class="col-title">1. Thông Số & Giá Bán</div>

              <div class="form-group">
                <label>Tên Sản Phẩm / Thiết Bị:</label>
                <input type="text" v-model="formData.name" placeholder="Ví dụ: Loa Full 30 PF 12 Pro..." required />
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Danh Mục:</label>
                  <select v-model="formData.category" required>
                    <option value="loa-full">Loa Full Karaoke</option>
                    <option value="loa-sub">Loa Subwoofer Trầm</option>
                    <option value="cuc-day">Cục Đẩy Công Suất</option>
                    <option value="vang-so-micro">Vang Số & Micro</option>
                    <option value="loa-di-dong">Loa Di Động / Loa Kéo</option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label>Huy Hiệu (Badge):</label>
                  <input type="text" v-model="formData.badge" placeholder="Bán Chạy / Bass Uy Lực..." />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Giá Bán Khuyến Mại (VNĐ):</label>
                  <input type="number" v-model.number="formData.price" required />
                </div>
                <div class="form-group flex-1">
                  <label>Giá Gốc Niêm Yết (VNĐ):</label>
                  <input type="number" v-model.number="formData.originalPrice" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Đường Kính Bass:</label>
                  <input type="text" v-model="formData.bassSize" placeholder="Ví dụ: 30 cm, 40 cm hoặc -" />
                </div>
                <div class="form-group flex-1">
                  <label>Công Suất RMS (W):</label>
                  <input type="number" v-model.number="formData.powerRMS" placeholder="Ví dụ: 350" />
                </div>
                <div class="form-group flex-1">
                  <label>Diện Tích Phòng Đề Xuất:</label>
                  <input type="text" v-model="formData.roomSize" placeholder="Ví dụ: 20 - 35m²" />
                </div>
              </div>

              <div class="form-group">
                <label>Cục Đẩy Công Suất Khuyên Phối Ghép:</label>
                <input type="text" v-model="formData.matchingAmplifier" placeholder="Ví dụ: Cục đẩy công suất từ 600W - 800W / kênh ở 8 Ohms" />
              </div>

              <div class="form-group">
                <label>Mô Tả Ngắn (Điểm nổi bật chất âm):</label>
                <textarea rows="2" v-model="formData.shortDesc" placeholder="Mô tả chất âm: tiếng sáng, hát nhẹ, không hú rít..."></textarea>
              </div>

              <!-- Quà Tặng Độc Quyền -->
              <div class="form-group">
                <label>🎁 Quà Tặng Kèm Theo (Mỗi dòng 1 món quà):</label>
                <textarea 
                  rows="3" 
                  v-model="giftsText" 
                  placeholder="Ví dụ:&#10;Tặng 10m dây loa bọc giáp&#10;Tặng 2 jack Neutrik"
                ></textarea>
              </div>

              <!-- Thông Số Kỹ Thuật Chi Tiết -->
              <div class="specs-editor-block">
                <div class="specs-editor-head">
                  <label>📋 Bảng Thông Số Kỹ Thuật (Specs):</label>
                  <button type="button" class="btn-add-spec" @click="addSpecRow">+ Thêm Dòng</button>
                </div>
                <div class="specs-rows">
                  <div v-for="(row, idx) in specsRows" :key="idx" class="spec-row-item">
                    <input type="text" v-model="row.key" placeholder="Tên thông số (vd: Trở kháng)" />
                    <input type="text" v-model="row.value" placeholder="Giá trị (vd: 8 Ohms)" />
                    <button type="button" class="btn-del-spec" @click="removeSpecRow(idx)" title="Xóa">&times;</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- CỘT BÊN PHẢI: Hình Ảnh & Phần Video Mô Tả / Test Âm Thực Tế -->
            <div class="modal-col-right">
              <div class="col-title">2. Video Mô Tả & Hình Ảnh</div>

              <!-- Phần nhập Video mô tả -->
              <div class="video-input-box">
                <div class="form-group">
                  <label>🎥 Link Video Mô Tả / Test Âm (YouTube URL hoặc MP4):</label>
                  <input 
                    type="text" 
                    v-model="formData.videoUrl" 
                    placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..." 
                  />
                  <span class="field-hint">Dán link YouTube video test tiếng loa, hát thử thực tế hoặc review nội thất.</span>
                </div>

                <div class="form-group">
                  <label>Tiêu Đề Video Mô Tả:</label>
                  <input 
                    type="text" 
                    v-model="formData.videoTitle" 
                    placeholder="Ví dụ: Video Test Tiếng Hát Mộc Không Hú Rít..." 
                  />
                </div>

                <!-- Khung xem trước Video mô tả -->
                <div class="video-preview-wrapper">
                  <label class="preview-label">Xem Trước Video Mô Tả:</label>
                  <div v-if="embedUrl" class="video-frame">
                    <iframe 
                      :src="embedUrl" 
                      title="Video mô tả sản phẩm" 
                      frameborder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowfullscreen
                    ></iframe>
                  </div>
                  <div v-else class="video-placeholder">
                    <span class="icon">🎬</span>
                    <p>Chưa có video mô tả</p>
                    <span class="sub-hint">Nhập link YouTube ở trên để xem trước tại đây</span>
                  </div>
                </div>
              </div>

              <!-- Phần nhập Ảnh đại diện -->
              <div class="image-input-box">
                <div class="form-group">
                  <label>🖼️ Link Hình Ảnh (URL):</label>
                  <input type="text" v-model="formData.image" placeholder="https://..." required />
                </div>
                <div class="image-preview" v-if="formData.image">
                  <img :src="formData.image" alt="Xem trước ảnh" />
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-outline" @click="closeModal">Đóng</button>
            <button type="submit" class="btn-primary">Lưu Sản Phẩm & Video</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import { useProductStore } from '../../stores/productStore'
import { formatCurrency } from '../../utils/formatters'
import { getEmbedVideoUrl } from '../../utils/videoHelper'

const adminStore = useAdminStore()
const productStore = useProductStore()
const searchQuery = ref('')

const filteredProducts = computed(() => {
  return adminStore.products.filter(p => {
    const q = searchQuery.value.toLowerCase()
    return !q || p.name.toLowerCase().includes(q) || p.shortDesc?.toLowerCase().includes(q)
  })
})

const getCategoryName = (catId) => {
  switch (catId) {
    case 'loa-full': return 'Loa Full'
    case 'loa-sub': return 'Loa Sub'
    case 'cuc-day': return 'Cục Đẩy'
    case 'vang-so-micro': return 'Vang & Mic'
    case 'loa-di-dong': return 'Loa Di Động'
    default: return catId
  }
}

const handleDelete = (id) => {
  if (confirm('Bác có chắc chắn muốn xóa sản phẩm này khỏi kho hiển thị?')) {
    adminStore.deleteProduct(id)
    productStore.refreshProducts()
  }
}

// Modal Thêm / Sửa
const isModalOpen = ref(false)
const editingId = ref(null)
const giftsText = ref('')
const specsRows = ref([])

const formData = ref({
  name: '',
  category: 'loa-full',
  price: 0,
  originalPrice: 0,
  badge: '',
  bassSize: '30 cm',
  powerRMS: 350,
  roomSize: '20 - 35m²',
  image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
  videoUrl: '',
  videoTitle: '',
  matchingAmplifier: '',
  shortDesc: ''
})

const embedUrl = computed(() => {
  return getEmbedVideoUrl(formData.value.videoUrl)
})

const addSpecRow = () => {
  specsRows.value.push({ key: '', value: '' })
}

const removeSpecRow = (idx) => {
  specsRows.value.splice(idx, 1)
}

const openAddModal = () => {
  editingId.value = null
  formData.value = {
    name: '',
    category: 'loa-full',
    price: 0,
    originalPrice: 0,
    badge: 'Mới Về',
    bassSize: '30 cm',
    powerRMS: 350,
    roomSize: '20 - 35m²',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    videoTitle: 'Video Test Âm Thanh Thực Tế — Hát Nhẹ Không Hú',
    matchingAmplifier: 'Cục đẩy công suất từ 600W - 800W / kênh',
    shortDesc: ''
  }
  giftsText.value = 'Tặng dây loa đồng nguyên chất\nMiễn phí setup tận nhà'
  specsRows.value = [
    { key: 'Loại loa', value: 'Loa Full 2 đường tiếng' },
    { key: 'Đường kính Bass', value: '30 cm' },
    { key: 'Công suất RMS', value: '350 W' },
    { key: 'Trở kháng', value: '8 Ohms' }
  ]
  isModalOpen.value = true
}

const openEditModal = (product) => {
  editingId.value = product.id
  formData.value = { 
    ...product,
    videoUrl: product.videoUrl || '',
    videoTitle: product.videoTitle || ''
  }
  giftsText.value = Array.isArray(product.gifts) ? product.gifts.join('\n') : ''
  const sp = product.specs || {}
  specsRows.value = Object.keys(sp).map(k => ({ key: k, value: sp[k] }))
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingId.value = null
}

const saveProduct = async () => {
  if (!formData.value.name) return

  const gifts = giftsText.value
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  const specs = {}
  specsRows.value.forEach(r => {
    if (r.key && r.key.trim()) {
      specs[r.key.trim()] = r.value.trim()
    }
  })

  const payload = {
    ...formData.value,
    gifts,
    specs
  }

  if (editingId.value) {
    await adminStore.updateProduct(editingId.value, payload)
  } else {
    await adminStore.addProduct({
      ...payload,
      id: 'sp-' + Date.now(),
      slug: formData.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      rating: 5.0,
      reviewsCount: 1,
      inStock: true
    })
  }
  await productStore.refreshProducts()
  closeModal()
}
</script>

<style scoped>
.products-admin-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.admin-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  background: var(--bg-card);
  padding: 16px 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.search-wrap {
  flex: 1;
  max-width: 450px;
}

.search-wrap input {
  width: 100%;
  padding: 9px 14px;
  background: var(--bg-dark-900);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 0.88rem;
  outline: none;
}

.search-wrap input:focus {
  border-color: var(--color-primary);
}

.panel-box {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  text-align: left;
  font-size: 0.75rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-color);
}

.admin-table td {
  padding: 14px;
  font-size: 0.88rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.thumb-mini {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  overflow: hidden;
  background: #101322;
}

.thumb-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-name {
  display: block;
  color: #fff;
}

.product-desc-mini {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-tag {
  font-size: 0.78rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 3px 8px;
  border-radius: 4px;
  color: #cbd5e1;
}

.specs-mini-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.78rem;
  color: #94a3b8;
}

.video-badge {
  font-size: 0.75rem;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.3);
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 700;
}

.no-video-badge {
  font-size: 0.75rem;
  color: #64748b;
}

.price-val {
  display: block;
  font-weight: 800;
  color: var(--color-primary);
}

.old-price {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  text-decoration: line-through;
}

.room-pill {
  font-size: 0.78rem;
  color: #cbd5e1;
  background: rgba(40, 55, 252, 0.1);
  padding: 3px 8px;
  border-radius: 4px;
}

.row-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  cursor: pointer;
  color: #cbd5e1;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.text-red:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.py-4 { padding: 32px 0; }
.text-center { text-align: center; }

/* Modal 2 bên (Two columns) */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-window.modal-wide {
  max-width: 1040px;
  width: 100%;
  max-height: 92vh;
  overflow-y: auto;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 28px;
  position: relative;
}

.close-x {
  position: absolute;
  top: 16px;
  right: 18px;
  background: transparent;
  color: #94a3b8;
  font-size: 1.5rem;
}

.modal-header h3 {
  font-size: 1.3rem;
  color: #fff;
  margin-bottom: 4px;
}

.modal-sub {
  font-size: 0.82rem;
  color: #94a3b8;
  margin-bottom: 20px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-two-columns {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 28px;
}

.col-title {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--color-primary);
  text-transform: uppercase;
  margin-bottom: 14px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(252, 183, 40, 0.2);
}

.modal-col-left, .modal-col-right {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.flex-1 { flex: 1; }

.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #cbd5e1;
  margin-bottom: 4px;
}

.field-hint {
  display: block;
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 4px;
}

.form-group input, .form-group select, .form-group textarea {
  width: 100%;
  padding: 9px 12px;
  background: var(--bg-dark-900);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: #fff;
  font-family: inherit;
  font-size: 0.88rem;
  outline: none;
}

.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  border-color: var(--color-primary);
}

.video-input-box {
  background: rgba(13, 15, 24, 0.7);
  border: 1px solid rgba(40, 55, 252, 0.3);
  padding: 16px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-preview-wrapper {
  margin-top: 6px;
}

.preview-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  color: #93c5fd;
  margin-bottom: 6px;
}

.video-frame {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: #000;
}

.video-frame iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.video-placeholder {
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-sm);
  padding: 24px 16px;
  text-align: center;
  color: #64748b;
  background: var(--bg-dark-900);
}

.video-placeholder .icon {
  font-size: 1.8rem;
  display: block;
  margin-bottom: 6px;
}

.video-placeholder p {
  font-size: 0.85rem;
  color: #94a3b8;
  font-weight: 600;
}

.sub-hint {
  font-size: 0.72rem;
  color: #64748b;
}

.image-input-box {
  background: rgba(13, 15, 24, 0.7);
  border: 1px solid var(--border-color);
  padding: 16px;
  border-radius: var(--radius-md);
}

.image-preview {
  margin-top: 10px;
  height: 120px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 10px;
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
}

.specs-editor-block {
  background: rgba(13, 15, 24, 0.6);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 12px;
}

.specs-editor-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.specs-editor-head label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #cbd5e1;
}

.btn-add-spec {
  background: rgba(252, 183, 40, 0.15);
  color: var(--color-primary);
  border: 1px solid rgba(252, 183, 40, 0.35);
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
}

.specs-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
}

.spec-row-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.spec-row-item input {
  flex: 1;
  padding: 7px 10px;
  background: var(--bg-dark-900);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: #fff;
  font-size: 0.8rem;
  outline: none;
}

.btn-del-spec {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  font-weight: 800;
}

@media (max-width: 900px) {
  .modal-two-columns {
    grid-template-columns: 1fr;
  }
}
</style>
