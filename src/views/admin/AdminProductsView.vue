<template>
  <div class="adm-page">
    <!-- Đầu trang Kho Loa & Chiến Dịch Sale -->
    <div class="adm-page-head">
      <div>
        <h1 class="adm-page-title">Kho Loa &amp; Chiến Dịch Chạy Sale</h1>
        <p class="adm-page-sub">
          Đồng bộ trực tiếp giá bán, mức giảm giá %, tồn kho, thông số âm học và video test âm lên Website khách hàng.
        </p>
      </div>
      <div class="adm-head-actions">
        <button type="button" class="adm-btn adm-btn-export" @click="exportProductsCsv">
          <AdminIcon name="download" :size="15" />
          <span>Xuất CSV</span>
        </button>
        <button type="button" class="adm-btn adm-btn-sale" @click="openAddSaleModal">
          <AdminIcon name="flame" :size="16" />
          <span>+ Thêm Sản Phẩm Sale</span>
        </button>
        <button type="button" class="adm-btn adm-btn-gold" @click="openAddModal">
          <AdminIcon name="plus" :size="16" />
          <span>+ Thêm Thiết Bị Mới</span>
        </button>
      </div>
    </div>

    <!-- 4 Thẻ Thống Kê & Lọc Nhanh Kho Thiết Bị -->
    <div class="adm-kpi-grid">
      <div
        :class="['adm-kpi-card clickable', { 'active-kpi': saleFilter === 'ALL' && categoryFilter === 'ALL' }]"
        @click="resetFilters"
      >
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Tổng Thiết Bị Kho</span>
          <span class="adm-kpi-value">{{ adminStore.products.length }} model</span>
          <span class="adm-kpi-meta">Đang niêm yết trên Website</span>
        </div>
        <div class="adm-kpi-icon tone-blue">
          <AdminIcon name="products" :size="20" />
        </div>
      </div>

      <div
        :class="['adm-kpi-card clickable', { 'active-kpi': saleFilter === 'ON_SALE' }]"
        @click="saleFilter = 'ON_SALE'"
      >
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Đang Chạy Sale</span>
          <span class="adm-kpi-value">{{ saleProductsCount }} thiết bị</span>
          <span class="adm-kpi-meta">Giảm trung bình <strong>-{{ avgDiscount }}%</strong></span>
        </div>
        <div class="adm-kpi-icon tone-orange">
          <AdminIcon name="flame" :size="20" />
        </div>
      </div>

      <div
        :class="['adm-kpi-card clickable', { 'active-kpi': saleFilter === 'NO_SALE' }]"
        @click="saleFilter = 'NO_SALE'"
      >
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Bán Giá Niêm Yết</span>
          <span class="adm-kpi-value">{{ adminStore.products.length - saleProductsCount }} thiết bị</span>
          <span class="adm-kpi-meta">Không gắn thẻ giảm giá %</span>
        </div>
        <div class="adm-kpi-icon tone-green">
          <AdminIcon name="check" :size="20" />
        </div>
      </div>

      <div
        :class="['adm-kpi-card clickable', { 'active-kpi': saleFilter === 'WARN' }]"
        @click="saleFilter = saleFilter === 'WARN' ? 'ALL' : 'WARN'"
      >
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Cần Kiểm Tra Giá / Kho</span>
          <span class="adm-kpi-value">{{ attentionCount }} mục</span>
          <span class="adm-kpi-meta">
            <strong>{{ priceWarnCount }}</strong> lệch giá gốc • <strong>{{ outOfStockCount }}</strong> hết hàng
          </span>
        </div>
        <div class="adm-kpi-icon tone-red">
          <AdminIcon name="alert" :size="20" />
        </div>
      </div>
    </div>

    <!-- Khung Bảng & Thanh Lọc Hợp Nhất -->
    <div class="adm-card">
      <div class="adm-toolbar">
        <div class="adm-toolbar-row">
          <div class="adm-search-box">
            <AdminIcon name="search" :size="16" class="search-ico" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Tìm tên loa, đường kính bass, nhãn chiến dịch..."
            />
          </div>

          <select v-model="categoryFilter" class="adm-select-filter">
            <option value="ALL">Tất cả danh mục ({{ adminStore.products.length }})</option>
            <option value="loa-full">Loa Full Karaoke</option>
            <option value="loa-sub">Loa Subwoofer Trầm</option>
            <option value="cuc-day">Cục Đẩy Công Suất</option>
            <option value="vang-so-micro">Vang Số &amp; Micro</option>
            <option value="loa-di-dong">Loa Di Động / Kéo</option>
          </select>

          <div class="adm-tabs">
            <button
              type="button"
              :class="['adm-tab', { active: saleFilter === 'ALL' }]"
              @click="saleFilter = 'ALL'"
            >
              Tất Cả
              <span class="adm-tab-count">{{ adminStore.products.length }}</span>
            </button>
            <button
              type="button"
              :class="['adm-tab sale-tab', { active: saleFilter === 'ON_SALE' }]"
              @click="saleFilter = 'ON_SALE'"
            >
              <AdminIcon name="flame" :size="14" />
              Đang Chạy Sale
              <span class="adm-tab-count">{{ saleProductsCount }}</span>
            </button>
            <button
              type="button"
              :class="['adm-tab', { active: saleFilter === 'NO_SALE' }]"
              @click="saleFilter = 'NO_SALE'"
            >
              Không Sale
              <span class="adm-tab-count">{{ adminStore.products.length - saleProductsCount }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>Thiết Bị / Model</th>
              <th>Danh Mục</th>
              <th>Thông Số Âm Học</th>
              <th>Giá Bán &amp; Trạng Thái Sale</th>
              <th>Tồn Kho</th>
              <th class="th-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in filteredProducts" :key="product.id">
              <td>
                <div class="prod-cell">
                  <div class="prod-thumb">
                    <img :src="product.image" :alt="product.name" />
                  </div>
                  <div class="prod-meta">
                    <strong class="prod-title">{{ product.name }}</strong>
                    <span class="prod-desc">{{ product.shortDesc || 'Chưa có mô tả ngắn' }}</span>
                    <div class="prod-tags-line">
                      <span v-if="product.videoUrl" class="mini-vid-tag">
                        <AdminIcon name="video" :size="12" /> Có video test
                      </span>
                      <span v-if="product.badge" class="mini-campaign-tag">
                        {{ product.badge }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>

              <td>
                <span class="adm-badge adm-badge-blue">{{ getCategoryName(product.category) }}</span>
              </td>

              <td>
                <div class="acoustic-col">
                  <span v-if="product.bassSize && product.bassSize !== '-'">Bass: <strong>{{ product.bassSize }}</strong></span>
                  <span v-if="product.powerRMS > 0">RMS: <strong>{{ product.powerRMS }}W</strong></span>
                  <span class="room-line">Phòng: {{ product.roomSize || 'Đa năng' }}</span>
                </div>
              </td>

              <td>
                <div class="price-col">
                  <strong class="selling-price">{{ formatCurrency(product.price) }}</strong>
                  <template v-if="getProductDiscount(product) > 0">
                    <div class="sale-sub-line">
                      <span class="orig-strike">{{ formatCurrency(product.originalPrice) }}</span>
                      <span class="adm-badge adm-badge-sale">
                        -{{ getProductDiscount(product) }}%
                      </span>
                    </div>
                  </template>
                  <span
                    v-else-if="product.originalPrice > 0 && product.originalPrice < product.price"
                    class="adm-badge adm-badge-gold"
                    title="Giá gốc đang nhỏ hơn giá bán nên chưa hiện thẻ giảm giá"
                  >
                    <AdminIcon name="alert" :size="12" /> Giá gốc &lt; Giá bán
                  </span>
                  <span v-else class="adm-badge adm-badge-slate">
                    Giá niêm yết
                  </span>
                </div>
              </td>

              <td>
                <button
                  type="button"
                  :class="['stock-toggle-btn', product.inStock !== false ? 'in-stock' : 'out-stock']"
                  @click="toggleStockQuick(product)"
                  title="Bấm để đổi nhanh trạng thái Sẵn hàng / Đặt trước"
                >
                  <span class="dot"></span>
                  <span>{{ product.inStock !== false ? 'Sẵn hàng' : 'Đặt trước' }}</span>
                </button>
              </td>

              <td>
                <div class="action-group">
                  <button
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-ghost"
                    @click="openEditModal(product)"
                    title="Chỉnh sửa thông số & cài đặt Sale"
                  >
                    <AdminIcon name="edit" :size="14" />
                    <span>Sửa / Sale</span>
                  </button>

                  <button
                    v-if="getProductDiscount(product) > 0"
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-amber"
                    @click="turnOffSale(product)"
                    title="Tắt giảm giá, giữ nguyên giá bán thực tế"
                  >
                    <AdminIcon name="ban" :size="14" />
                    <span>Tắt Sale</span>
                  </button>

                  <button
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-danger"
                    @click="handleDelete(product.id)"
                    title="Xóa thiết bị khỏi kho"
                  >
                    <AdminIcon name="trash" :size="14" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredProducts.length === 0">
              <td colspan="6" class="adm-empty">
                Không tìm thấy thiết bị nào khớp với bộ lọc hiện tại.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Thêm / Sửa Thiết Bị & Chạy Sale (2 Cột Chuyên Nghiệp) -->
    <div v-if="isModalOpen" class="adm-modal-backdrop" @click.self="closeModal">
      <div class="adm-modal wide">
        <div class="adm-modal-head">
          <div>
            <h3>{{ editingId ? 'Chỉnh Sửa Thiết Bị & Cài Đặt Sale' : 'Thêm Thiết Bị Mới Vào Kho' }}</h3>
            <p>Mọi thay đổi được đồng bộ trực tiếp lên Aiven PostgreSQL và hiển thị ngay ngoài trang khách hàng</p>
          </div>
          <button type="button" class="adm-modal-close" @click="closeModal" aria-label="Đóng">
            <AdminIcon name="x" :size="18" />
          </button>
        </div>

        <form @submit.prevent="saveProduct">
          <div class="adm-modal-body modal-split">
            <!-- CỘT TRÁI: Thông tin, Cài đặt Sale & Thông số -->
            <div class="split-col">
              <div class="sub-block-title">1. Thông Tin Cơ Bản &amp; Chiến Dịch Sale</div>

              <div class="adm-field">
                <label>Tên Sản Phẩm / Model</label>
                <input
                  type="text"
                  v-model="formData.name"
                  placeholder="Ví dụ: Loa Full 30 PF 12 Pro..."
                  required
                />
              </div>

              <div class="adm-form-grid">
                <div class="adm-field">
                  <label>Danh Mục Thiết Bị</label>
                  <select v-model="formData.category" required>
                    <option value="loa-full">Loa Full Karaoke</option>
                    <option value="loa-sub">Loa Subwoofer Trầm</option>
                    <option value="cuc-day">Cục Đẩy Công Suất</option>
                    <option value="vang-so-micro">Vang Số &amp; Micro</option>
                    <option value="loa-di-dong">Loa Di Động / Loa Kéo</option>
                  </select>
                </div>

                <div class="adm-field">
                  <label>Nhãn Chiến Dịch (Hiện trên ảnh)</label>
                  <input
                    type="text"
                    v-model="formData.badge"
                    placeholder="Sale Sốc Trong Ngày / Bán Chạy..."
                  />
                </div>
              </div>

              <!-- Khung Cài Đặt Chạy Sale Nhanh -->
              <div class="sale-config-panel">
                <div class="sale-panel-head">
                  <span class="sale-panel-title">
                    <AdminIcon name="flame" :size="16" />
                    Cài Đặt Chạy Sale Nhanh
                  </span>
                  <span v-if="previewDiscountPercent > 0" class="adm-badge adm-badge-sale">
                    Đang giảm -{{ previewDiscountPercent }}% (Tiết kiệm {{ formatCurrency(formData.originalPrice - formData.price) }})
                  </span>
                  <span v-else class="adm-badge adm-badge-slate">Chưa bật giảm giá</span>
                </div>

                <div class="chip-bar">
                  <span class="chip-bar-label">Nhãn nhanh:</span>
                  <button
                    v-for="preset in badgePresets"
                    :key="preset"
                    type="button"
                    :class="['preset-pill', { active: formData.badge === preset }]"
                    @click="formData.badge = preset"
                  >
                    {{ preset }}
                  </button>
                </div>

                <div class="adm-form-grid">
                  <div class="adm-field">
                    <label>Giá Gốc Niêm Yết (VNĐ — Để gạch ngang)</label>
                    <input
                      type="number"
                      min="0"
                      v-model.number="formData.originalPrice"
                      placeholder="Ví dụ: 11500000"
                    />
                  </div>
                  <div class="adm-field">
                    <label>Giá Bán Thực Tế (VNĐ — Khách trả)</label>
                    <input
                      type="number"
                      min="0"
                      v-model.number="formData.price"
                      required
                      placeholder="Ví dụ: 9800000"
                    />
                  </div>
                </div>

                <div class="chip-bar">
                  <span class="chip-bar-label">Tính nhanh % giảm từ Giá gốc:</span>
                  <button type="button" class="preset-pill" @click="applyQuickDiscount(10)">-10%</button>
                  <button type="button" class="preset-pill" @click="applyQuickDiscount(15)">-15%</button>
                  <button type="button" class="preset-pill" @click="applyQuickDiscount(20)">-20%</button>
                  <button type="button" class="preset-pill" @click="applyQuickDiscount(25)">-25%</button>
                  <button type="button" class="preset-pill danger" @click="formData.originalPrice = 0">
                    Tắt Sale (0%)
                  </button>
                </div>

                <p v-if="formData.originalPrice > 0 && formData.originalPrice < formData.price" class="sale-warn-msg">
                  Giá gốc đang nhỏ hơn Giá bán nên ngoài trang khách sẽ không hiển thị thẻ giảm giá %. Hãy đặt Giá gốc lớn hơn Giá bán hoặc bấm "Tắt Sale (0%)".
                </p>
              </div>

              <div class="adm-form-grid cols-3">
                <div class="adm-field">
                  <label>Đường Kính Bass</label>
                  <input type="text" v-model="formData.bassSize" placeholder="30 cm / 40 cm / -" />
                </div>
                <div class="adm-field">
                  <label>Công Suất RMS (W)</label>
                  <input type="number" min="0" v-model.number="formData.powerRMS" />
                </div>
                <div class="adm-field">
                  <label>Công Suất Peak (W)</label>
                  <input type="number" min="0" v-model.number="formData.powerPeak" />
                </div>
              </div>

              <div class="adm-form-grid cols-3">
                <div class="adm-field">
                  <label>Diện Tích Phòng</label>
                  <input type="text" v-model="formData.roomSize" placeholder="20 - 35m²" />
                </div>
                <div class="adm-field">
                  <label>Điểm Đánh Giá (1-5)</label>
                  <input type="number" min="1" max="5" step="0.1" v-model.number="formData.rating" />
                </div>
                <div class="adm-field">
                  <label>Số Bộ Đã Lắp</label>
                  <input type="number" min="0" v-model.number="formData.reviewsCount" />
                </div>
              </div>

              <div class="adm-form-grid">
                <div class="adm-field">
                  <label>Trạng Thái Tồn Kho</label>
                  <select v-model="formData.inStock">
                    <option :value="true">Đang sẵn hàng (Cho phép đặt giỏ hàng)</option>
                    <option :value="false">Tạm hết hàng (Chỉ nhận tư vấn đặt trước)</option>
                  </select>
                </div>
                <div class="adm-field">
                  <label>Cục Đẩy Khuyên Phối Ghép</label>
                  <input type="text" v-model="formData.matchingAmplifier" placeholder="600W - 800W / kênh ở 8 Ohms" />
                </div>
              </div>

              <div class="adm-field">
                <label>Mô Tả Ngắn Chất Âm</label>
                <textarea rows="2" v-model="formData.shortDesc" placeholder="Tiếng sáng, lời bay, chống hú rít..."></textarea>
              </div>

              <div class="adm-field">
                <label>Quà Tặng Kèm Theo (Mỗi dòng 1 quà tặng)</label>
                <textarea rows="3" v-model="giftsText" placeholder="Tặng 10m dây loa lõi đồng&#10;Miễn phí cân chỉnh vang số tận nhà"></textarea>
              </div>

              <!-- Bảng thông số kỹ thuật chi tiết -->
              <div class="specs-panel">
                <div class="specs-head">
                  <span>Bảng Thông Số Kỹ Thuật (Specs)</span>
                  <button type="button" class="adm-btn adm-btn-sm adm-btn-ghost" @click="addSpecRow">
                    <AdminIcon name="plus" :size="13" /> Thêm dòng
                  </button>
                </div>
                <div class="specs-list">
                  <div v-for="(row, idx) in specsRows" :key="idx" class="spec-line">
                    <input type="text" v-model="row.key" placeholder="Tên thông số (vd: Trở kháng)" />
                    <input type="text" v-model="row.value" placeholder="Giá trị (vd: 8 Ohms)" />
                    <button type="button" class="spec-del" @click="removeSpecRow(idx)" title="Xóa dòng">
                      <AdminIcon name="x" :size="14" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- CỘT PHẢI: Hình ảnh & Video Test Âm -->
            <div class="split-col">
              <div class="sub-block-title">2. Hình Ảnh Đại Diện &amp; Video Test Âm</div>

              <div class="media-card">
                <div class="adm-field">
                  <label>Ảnh Sản Phẩm (Tải từ máy hoặc dán URL)</label>
                  <div class="upload-bar">
                    <label class="adm-btn adm-btn-gold adm-btn-sm upload-trigger">
                      <input type="file" accept="image/*" @change="handleProductImageUpload" hidden />
                      <AdminIcon name="upload" :size="14" />
                      <span>Tải Ảnh Từ Máy / Điện Thoại</span>
                    </label>
                    <span class="adm-hint">Tự động nén chuẩn nét &le; 900px</span>
                  </div>
                  <input type="text" v-model="formData.image" placeholder="https://..." required />
                </div>

                <div v-if="formData.image" class="img-preview-frame">
                  <img :src="formData.image" alt="Xem trước sản phẩm" />
                </div>
              </div>

              <div class="media-card">
                <div class="adm-field">
                  <label>Link Video Test Âm Thực Tế (YouTube hoặc MP4)</label>
                  <input
                    type="text"
                    v-model="formData.videoUrl"
                    placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
                  />
                </div>

                <div class="adm-field">
                  <label>Tiêu Đề Video</label>
                  <input
                    type="text"
                    v-model="formData.videoTitle"
                    placeholder="Video Test Âm Thanh Thực Tế — Hát Nhẹ Không Hú"
                  />
                </div>

                <div class="vid-preview-frame">
                  <template v-if="embedUrl">
                    <video
                      v-if="isDirectVideo(formData.videoUrl)"
                      :src="embedUrl"
                      controls
                      preload="metadata"
                      playsinline
                    ></video>
                    <iframe
                      v-else
                      :src="embedUrl"
                      title="Video mô tả sản phẩm"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                    ></iframe>
                  </template>
                  <div v-else class="vid-empty">
                    <AdminIcon name="video" :size="28" />
                    <span>Nhập link YouTube hoặc MP4 ở trên để xem trước video test âm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="adm-modal-foot">
            <button type="button" class="adm-btn adm-btn-ghost" @click="closeModal">Hủy Bỏ</button>
            <button type="submit" class="adm-btn adm-btn-gold">
              <AdminIcon name="check" :size="16" />
              <span>Lưu &amp; Đồng Bộ Lên Website</span>
            </button>
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
import { getEmbedVideoUrl, isDirectVideo } from '../../utils/videoHelper'
import { exportRowsToCsv } from '../../utils/csvExport'
import AdminIcon from '../../components/admin/AdminIcon.vue'

const adminStore = useAdminStore()
const productStore = useProductStore()

const searchQuery = ref('')
const saleFilter = ref('ALL')
const categoryFilter = ref('ALL')

const badgePresets = [
  'Sale Sốc Trong Ngày',
  'Giá Tốt Hôm Nay',
  'Xả Kho Giá Gốc',
  'Bán Chạy Nhất',
  'Trị Hú Rít 100%'
]

const getProductDiscount = (p) => {
  const price = Number(p?.price || 0)
  const original = Number(p?.originalPrice || 0)
  if (!original || original <= price || price <= 0) return 0
  return Math.round(((original - price) / original) * 100)
}

const saleProductsCount = computed(() => {
  return adminStore.products.filter(p => getProductDiscount(p) > 0).length
})

const avgDiscount = computed(() => {
  const list = adminStore.products.filter(p => getProductDiscount(p) > 0)
  if (!list.length) return 0
  const total = list.reduce((sum, p) => sum + getProductDiscount(p), 0)
  return Math.round(total / list.length)
})

const priceWarnCount = computed(() => {
  return adminStore.products.filter(p => Number(p.originalPrice || 0) > 0 && Number(p.originalPrice) < Number(p.price)).length
})

const outOfStockCount = computed(() => {
  return adminStore.products.filter(p => p.inStock === false).length
})

const attentionCount = computed(() => {
  return adminStore.products.filter(
    p => p.inStock === false || (Number(p.originalPrice || 0) > 0 && Number(p.originalPrice) < Number(p.price))
  ).length
})

const resetFilters = () => {
  saleFilter.value = 'ALL'
  categoryFilter.value = 'ALL'
  searchQuery.value = ''
}

const filteredProducts = computed(() => {
  const kw = searchQuery.value.toLowerCase().trim()
  return adminStore.products.filter(p => {
    const matchesSearch =
      !kw ||
      p.name?.toLowerCase().includes(kw) ||
      p.bassSize?.toLowerCase().includes(kw) ||
      p.badge?.toLowerCase().includes(kw) ||
      p.category?.toLowerCase().includes(kw)

    if (!matchesSearch) return false
    if (categoryFilter.value !== 'ALL' && p.category !== categoryFilter.value) return false

    const disc = getProductDiscount(p)
    if (saleFilter.value === 'ON_SALE') return disc > 0
    if (saleFilter.value === 'NO_SALE') return disc === 0
    if (saleFilter.value === 'WARN') {
      return p.inStock === false || (Number(p.originalPrice || 0) > 0 && Number(p.originalPrice) < Number(p.price))
    }
    return true
  })
})

const getCategoryName = (slug) => {
  const map = {
    'loa-full': 'Loa Full',
    'loa-sub': 'Loa Sub',
    'cuc-day': 'Cục Đẩy',
    'vang-so-micro': 'Vang & Mic',
    'loa-di-dong': 'Loa Kéo'
  }
  return map[slug] || slug
}

const exportProductsCsv = () => {
  exportRowsToCsv(
    `kho-thiet-bi-tuaudio-${new Date().toISOString().slice(0, 10)}.csv`,
    [
      { label: 'Mã SP', value: r => r.id },
      { label: 'Tên thiết bị', value: r => r.name },
      { label: 'Danh mục', value: r => getCategoryName(r.category) },
      { label: 'Giá bán (VNĐ)', value: r => r.price || 0 },
      { label: 'Giá gốc (VNĐ)', value: r => r.originalPrice || 0 },
      { label: 'Giảm giá (%)', value: r => getProductDiscount(r) },
      { label: 'Nhãn chiến dịch', value: r => r.badge || '' },
      { label: 'Bass', value: r => r.bassSize || '' },
      { label: 'RMS (W)', value: r => r.powerRMS || 0 },
      { label: 'Diện tích phòng', value: r => r.roomSize || '' },
      { label: 'Tồn kho', value: r => (r.inStock !== false ? 'Sẵn hàng' : 'Đặt trước') }
    ],
    filteredProducts.value
  )
}

// Modal & Form State
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
  powerPeak: 1400,
  roomSize: '20 - 35m²',
  rating: 5.0,
  reviewsCount: 25,
  inStock: true,
  image: '',
  videoUrl: '',
  videoTitle: '',
  matchingAmplifier: '',
  shortDesc: ''
})

const previewDiscountPercent = computed(() => {
  const price = Number(formData.value.price || 0)
  const original = Number(formData.value.originalPrice || 0)
  if (!original || original <= price || price <= 0) return 0
  return Math.round(((original - price) / original) * 100)
})

const embedUrl = computed(() => getEmbedVideoUrl(formData.value.videoUrl))

const handleProductImageUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      const maxDim = 900
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      formData.value.image = canvas.toDataURL('image/jpeg', 0.84)
    }
    img.src = String(reader.result || '')
  }
  reader.readAsDataURL(file)
}

const addSpecRow = () => {
  specsRows.value.push({ key: '', value: '' })
}

const removeSpecRow = (idx) => {
  specsRows.value.splice(idx, 1)
}

const applyQuickDiscount = (percent) => {
  const currentOriginal = Number(formData.value.originalPrice || 0)
  const currentPrice = Number(formData.value.price || 0)
  if (currentOriginal > 0) {
    const rawSale = currentOriginal * (1 - percent / 100)
    formData.value.price = Math.round(rawSale / 10000) * 10000
  } else if (currentPrice > 0) {
    const rawOriginal = currentPrice / (1 - percent / 100)
    formData.value.originalPrice = Math.round(rawOriginal / 10000) * 10000
  }
}

const toggleStockQuick = async (product) => {
  const nextStock = product.inStock === false
  try {
    await adminStore.updateProduct(product.id, { ...product, inStock: nextStock })
    await productStore.refreshProducts()
  } catch {
    // Error handled in store
  }
}

const turnOffSale = async (product) => {
  if (!confirm(`Tắt khuyến mãi cho "${product.name}" (giữ nguyên giá bán ${formatCurrency(product.price)})?`)) return
  try {
    await adminStore.updateProduct(product.id, { ...product, originalPrice: 0 })
    await productStore.refreshProducts()
  } catch {
    // Notice displayed by adminStore
  }
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
    powerPeak: 1400,
    roomSize: '20 - 35m²',
    rating: 5.0,
    reviewsCount: 25,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
    videoUrl: '',
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

const openAddSaleModal = () => {
  openAddModal()
  formData.value.badge = 'Sale Sốc Trong Ngày'
  formData.value.originalPrice = 10500000
  formData.value.price = 8900000
}

const openEditModal = (product) => {
  editingId.value = product.id
  formData.value = {
    ...product,
    powerPeak: Number(product.powerPeak || 0),
    rating: Number(product.rating || 5),
    reviewsCount: Number(product.reviewsCount || 25),
    inStock: product.inStock !== false,
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
}

const saveProduct = async () => {
  const cleanGifts = giftsText.value
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)

  const cleanSpecs = {}
  for (const r of specsRows.value) {
    if (r.key && r.key.trim()) {
      cleanSpecs[r.key.trim()] = String(r.value || '').trim()
    }
  }

  const slug = formData.value.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const payload = {
    ...formData.value,
    slug,
    gifts: cleanGifts,
    specs: cleanSpecs
  }

  try {
    if (editingId.value) {
      await adminStore.updateProduct(editingId.value, payload)
    } else {
      await adminStore.addProduct(payload)
    }
    await productStore.refreshProducts()
    closeModal()
  } catch {
    // Error handled in store
  }
}

const handleDelete = async (id) => {
  if (confirm('Anh có chắc chắn muốn xóa thiết bị này khỏi kho?')) {
    await adminStore.deleteProduct(id)
    await productStore.refreshProducts()
  }
}
</script>

<style scoped>
.th-right {
  text-align: right;
}

.prod-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 190px;
}

.prod-thumb {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #090c15;
  flex-shrink: 0;
}

.prod-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.prod-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.prod-title {
  font-size: 0.86rem;
  color: #f8fafc;
  line-height: 1.25;
}

.prod-desc {
  font-size: 0.73rem;
  color: #64748b;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 220px;
}

.prod-tags-line {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.mini-vid-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.68rem;
  font-weight: 700;
  color: #6ee7b7;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 1px 7px;
  border-radius: 4px;
}

.mini-campaign-tag {
  font-size: 0.68rem;
  font-weight: 700;
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.12);
  padding: 1px 7px;
  border-radius: 4px;
}

.acoustic-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.78rem;
  color: #94a3b8;
  white-space: nowrap;
}

.acoustic-col strong {
  color: #e2e8f0;
}

.room-line {
  font-size: 0.72rem;
  color: #64748b;
}

.price-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  white-space: nowrap;
}

.selling-price {
  font-family: var(--font-display);
  font-size: 0.96rem;
  font-weight: 800;
  color: #fcb728;
}

.sale-sub-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.orig-strike {
  font-size: 0.75rem;
  color: #64748b;
  text-decoration: line-through;
}

.stock-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 700;
  white-space: nowrap;
  transition: transform 0.15s;
}

.stock-toggle-btn:hover {
  transform: scale(1.03);
}

.stock-toggle-btn .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.stock-toggle-btn.in-stock {
  background: rgba(34, 197, 94, 0.13);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #86efac;
}

.stock-toggle-btn.in-stock .dot {
  background: #22c55e;
}

.stock-toggle-btn.out-stock {
  background: rgba(239, 68, 68, 0.13);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.stock-toggle-btn.out-stock .dot {
  background: #ef4444;
}

.action-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  white-space: nowrap;
}

/* Modal 2-Column Layout */
.modal-split {
  display: grid;
  grid-template-columns: 1.25fr 0.95fr;
  gap: 24px;
}

.split-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.sub-block-title {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #fcb728;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sale-config-panel {
  padding: 14px;
  border-radius: 12px;
  background: rgba(234, 88, 12, 0.07);
  border: 1px solid rgba(249, 115, 22, 0.28);
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.sale-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.sale-panel-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 800;
  color: #fb923c;
}

.chip-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.chip-bar-label {
  font-size: 0.73rem;
  color: #94a3b8;
  font-weight: 600;
}

.preset-pill {
  padding: 4px 9px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(9, 12, 21, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
  transition: all 0.15s;
}

.preset-pill:hover,
.preset-pill.active {
  background: rgba(252, 183, 40, 0.18);
  border-color: #fcb728;
  color: #fcb728;
}

.preset-pill.danger:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  color: #fca5a5;
}

.sale-warn-msg {
  font-size: 0.75rem;
  color: #fde047;
  background: rgba(234, 179, 8, 0.12);
  border: 1px solid rgba(234, 179, 8, 0.3);
  padding: 8px 10px;
  border-radius: 8px;
}

.specs-panel {
  padding: 12px;
  border-radius: 10px;
  background: rgba(9, 12, 21, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.specs-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
  font-weight: 700;
  color: #cbd5e1;
}

.specs-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.spec-line {
  display: grid;
  grid-template-columns: 1fr 1.2fr auto;
  gap: 7px;
}

.spec-line input {
  padding: 7px 10px;
  background: #090c15;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 7px;
  color: #f8fafc;
  font-size: 0.8rem;
}

.spec-del {
  width: 32px;
  height: 32px;
  border-radius: 7px;
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-card {
  padding: 14px;
  border-radius: 12px;
  background: rgba(9, 12, 21, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.upload-trigger {
  cursor: pointer;
}

.img-preview-frame {
  width: 100%;
  height: 200px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #06080f;
}

.img-preview-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vid-preview-frame {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  overflow: hidden;
  background: #06080f;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.vid-preview-frame iframe,
.vid-preview-frame video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vid-empty {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  text-align: center;
  color: #64748b;
  font-size: 0.78rem;
}

@media (max-width: 920px) {
  .modal-split {
    grid-template-columns: 1fr;
  }
}
</style>
