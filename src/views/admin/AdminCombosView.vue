<template>
  <div class="adm-page">
    <!-- Đầu trang Cấu Hình Gói Dàn -->
    <div class="adm-page-head">
      <div>
        <h1 class="adm-page-title">Cấu Hình Gói Dàn Karaoke Trọn Bộ</h1>
        <p class="adm-page-sub">
          Quản lý toàn bộ danh sách gói dàn karaoke, cấu hình phối ghép, quà tặng &amp; định giá hiển thị trên website.
        </p>
      </div>
      <div class="adm-head-actions">
        <router-link to="/#dan-karaoke" target="_blank" class="adm-btn adm-btn-ghost">
          <AdminIcon name="globe" :size="15" />
          <span>Xem Ngoài Trang Chủ</span>
        </router-link>
        <button type="button" class="adm-btn adm-btn-gold" @click="openCreateModal">
          <AdminIcon name="plus" :size="15" />
          <span>+ Thêm Gói Dàn Mới</span>
        </button>
      </div>
    </div>

    <!-- Thẻ Thống Kê Nhanh (KPIs) -->
    <div class="combo-kpi-grid">
      <div class="adm-card kpi-card">
        <div class="kpi-icon-wrap bg-blue-subtle">
          <AdminIcon name="combos" :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-num">{{ adminStore.combos.length }}</span>
          <span class="kpi-lbl">Tổng số gói dàn đang niêm yết</span>
        </div>
      </div>

      <div class="adm-card kpi-card">
        <div class="kpi-icon-wrap bg-gold-subtle">
          <AdminIcon name="star" :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-title-clamp">{{ featuredComboName }}</span>
          <span class="kpi-lbl">Gói bán chạy / nổi bật nhất</span>
        </div>
      </div>

      <div class="adm-card kpi-card">
        <div class="kpi-icon-wrap bg-green-subtle">
          <AdminIcon name="wallet" :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-num text-green">{{ priceRangeText }}</span>
          <span class="kpi-lbl">Khoảng giá trọn gói niêm yết</span>
        </div>
      </div>

      <div class="adm-card kpi-card">
        <div class="kpi-icon-wrap bg-purple-subtle">
          <AdminIcon name="flame" :size="22" />
        </div>
        <div class="kpi-info">
          <span class="kpi-num text-purple">{{ totalGiftsCount }}</span>
          <span class="kpi-lbl">Tổng phần quà &amp; đặc quyền kèm theo</span>
        </div>
      </div>
    </div>

    <!-- Thanh Tìm Kiếm & Bộ Lọc Nâng Cao -->
    <div class="adm-card combo-toolbar">
      <div class="toolbar-search">
        <AdminIcon name="search" :size="16" class="search-icon" />
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Tìm theo tên gói dàn, diện tích phòng, thiết bị hoặc quà tặng..."
        />
        <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''" title="Xóa tìm kiếm">
          <AdminIcon name="x" :size="14" />
        </button>
      </div>

      <div class="toolbar-filters">
        <div class="filter-group">
          <label class="filter-lbl">Diện tích:</label>
          <select v-model="filterRoom" class="filter-select">
            <option value="all">Tất cả diện tích</option>
            <option value="small">Phòng nhỏ (&lt; 25m²)</option>
            <option value="medium">Phòng vừa (25 - 45m²)</option>
            <option value="large">Phòng lớn (&gt; 45m²)</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-lbl">Sắp xếp:</label>
          <select v-model="sortBy" class="filter-select">
            <option value="price-desc">Giá: Cao đến thấp</option>
            <option value="price-asc">Giá: Thấp đến cao</option>
            <option value="name-asc">Tên gói A-Z</option>
          </select>
        </div>

        <button
          type="button"
          :class="['filter-pill-btn', { active: filterFeaturedOnly }]"
          @click="filterFeaturedOnly = !filterFeaturedOnly"
        >
          <AdminIcon name="star" :size="13" />
          <span>Chỉ xem gói nổi bật</span>
        </button>
      </div>
    </div>

    <!-- Danh Sách Các Cấu Hình Dàn Karaoke (Dynamic Catalog Grid) -->
    <div v-if="filteredCombos.length > 0" class="combos-catalog-grid">
      <div
        v-for="combo in filteredCombos"
        :key="combo.id"
        :class="['adm-card combo-card-item', { 'is-featured-border': combo.isFeatured }]"
      >
        <!-- Thẻ Header -->
        <div class="combo-item-top">
          <div class="badges-row">
            <span class="adm-badge adm-badge-slate sku-tag">
              {{ combo.id }}
            </span>
            <span v-if="combo.badge" class="adm-badge adm-badge-gold">
              {{ combo.badge }}
            </span>
            <span class="adm-badge adm-badge-blue">
              🏠 {{ combo.roomSize || 'Phòng gia đình' }}
            </span>
          </div>

          <button
            type="button"
            :class="['featured-toggle-btn', { active: combo.isFeatured }]"
            @click="toggleFeatured(combo)"
            :title="combo.isFeatured ? 'Đang là gói Nổi Bật (Bấm để hủy)' : 'Đặt làm gói Nổi Bật'"
          >
            <AdminIcon name="star" :size="14" />
            <span>{{ combo.isFeatured ? 'Nổi Bật' : 'Đặt Nổi Bật' }}</span>
          </button>
        </div>

        <!-- Nội dung chính của Card -->
        <div class="combo-item-content">
          <h3 class="combo-item-title">{{ combo.name }}</h3>
          <p class="combo-item-tagline">{{ combo.tagline || 'Cấu hình tiêu chuẩn chất lượng cao' }}</p>

          <!-- Khối định giá nổi bật -->
          <div class="combo-item-pricing">
            <div class="price-main-row">
              <span class="price-val">{{ formatCurrency(combo.price) }}</span>
              <span v-if="combo.fastActionPrice" class="fast-action-tag">
                CK ngay: <strong>{{ formatCurrency(combo.fastActionPrice) }}</strong>
              </span>
            </div>
            <div class="price-sub-row">
              <span class="list-val">Giá gốc: {{ formatCurrency(combo.totalRealValue || combo.listPrice) }}</span>
              <span class="save-val">Tiết kiệm: {{ formatCurrency(calcComboSaved(combo)) }}</span>
            </div>
          </div>

          <!-- Video Test Hát Thử Mini Preview -->
          <div v-if="combo.videoUrl" class="combo-item-video">
            <div class="video-meta-head">
              <span class="video-badge">
                <AdminIcon name="video" :size="12" />
                Video Hát Thử
              </span>
              <span class="video-title-trim">{{ combo.videoTitle || 'Clip test thực tế' }}</span>
            </div>
            <div class="video-thumb-frame">
              <video
                v-if="isDirectVideo(combo.videoUrl)"
                :src="combo.videoUrl"
                preload="metadata"
                controls
              ></video>
              <iframe
                v-else
                :src="getEmbed(combo.videoUrl)"
                title="Video test dàn"
                frameborder="0"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>
            </div>
          </div>

          <!-- Tóm tắt danh mục thiết bị -->
          <div class="combo-item-section">
            <div class="section-sub-head">
              <span class="sub-title">Thiết bị cấu thành ({{ combo.components?.length || 0 }})</span>
            </div>
            <ul class="mini-comps-list">
              <li v-for="(comp, cIdx) in (combo.components || []).slice(0, 3)" :key="cIdx">
                <span class="check-dot">✓</span>
                <span class="comp-name">{{ comp.item }}</span>
                <span v-if="comp.role" class="comp-role">— {{ comp.role }}</span>
              </li>
              <li v-if="(combo.components?.length || 0) > 3" class="more-row">
                + thêm {{ combo.components.length - 3 }} thiết bị âm thanh khác
              </li>
            </ul>
          </div>

          <!-- Tóm tắt quà tặng -->
          <div class="combo-item-section">
            <div class="section-sub-head">
              <span class="sub-title">Quà tặng &amp; Ưu đãi ({{ combo.gifts?.length || 0 }})</span>
            </div>
            <ul class="mini-gifts-list">
              <li v-for="(gift, gIdx) in (combo.gifts || []).slice(0, 2)" :key="gIdx">
                🎁 {{ gift }}
              </li>
              <li v-if="(combo.gifts?.length || 0) > 2" class="more-row">
                + thêm {{ combo.gifts.length - 2 }} quà tặng &amp; cam kết dịch vụ
              </li>
            </ul>
          </div>
        </div>

        <!-- Thao tác Card -->
        <div class="combo-item-footer">
          <button
            type="button"
            class="adm-btn adm-btn-gold btn-flex-1"
            @click="openEditModal(combo)"
          >
            <AdminIcon name="edit" :size="14" />
            <span>Chỉnh Sửa Chi Tiết</span>
          </button>

          <button
            type="button"
            class="adm-btn adm-btn-ghost btn-square"
            @click="duplicateComboAction(combo)"
            :disabled="isDuplicatingId === combo.id"
            title="Nhân bản tạo gói mới dựa trên cấu hình này"
          >
            <AdminIcon name="copy" :size="15" />
          </button>

          <button
            type="button"
            class="adm-btn adm-btn-danger btn-square"
            @click="confirmDeleteCombo(combo)"
            :disabled="adminStore.combos.length <= 1"
            title="Xóa cấu hình gói dàn này"
          >
            <AdminIcon name="trash" :size="15" />
          </button>
        </div>
      </div>
    </div>

    <!-- Trạng thái trống (Khi không tìm thấy gói dàn) -->
    <div v-else class="adm-card combo-empty-state">
      <div class="empty-icon-box">
        <AdminIcon name="combos" :size="40" />
      </div>
      <h3>Không tìm thấy gói dàn nào phù hợp</h3>
      <p>Thử điều chỉnh lại từ khóa tìm kiếm hoặc bỏ chọn các tiêu chí lọc diện tích.</p>
      <div class="empty-actions">
        <button type="button" class="adm-btn adm-btn-ghost" @click="resetFilters">
          <AdminIcon name="sync" :size="14" />
          <span>Đặt Lại Bộ Lọc</span>
        </button>
        <button type="button" class="adm-btn adm-btn-gold" @click="openCreateModal">
          <AdminIcon name="plus" :size="14" />
          <span>+ Thêm Gói Dàn Mới</span>
        </button>
      </div>
    </div>

    <!-- MODAL SOẠN THẢO & CẤU HÌNH CHI TIẾT GÓI DÀN -->
    <div v-if="isModalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-box modal-wide">
        <div class="modal-header">
          <div class="header-titles">
            <h2>{{ isNewCombo ? 'Thêm Gói Dàn Karaoke Mới' : 'Chỉnh Sửa Cấu Hình Gói Dàn' }}</h2>
            <p class="modal-subtitle">
              {{ isNewCombo ? 'Phối ghép thiết bị và niêm yết combo dàn karaoke mới' : editingDraft.name }}
            </p>
          </div>
          <button type="button" class="modal-close-btn" @click="closeModal" title="Đóng">
            <AdminIcon name="x" :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <!-- KHỐI 1: THÔNG TIN CƠ BẢN -->
          <div class="editor-section">
            <div class="section-header-row">
              <span class="section-title-tag">1. Nhận diện &amp; Không gian phòng</span>
            </div>

            <div class="adm-form-grid">
              <div class="adm-field field-span-2">
                <label>Tên Gói Dàn Trọn Bộ <span class="required">*</span></label>
                <input
                  type="text"
                  class="title-strong-input"
                  v-model="editingDraft.name"
                  placeholder="Ví dụ: Dàn Karaoke 35 Triệu — Chuẩn Âm Hay Hơn Quán Hát"
                />
              </div>

              <div class="adm-field">
                <label>Mã Quản Lý (Mã SKU) <span class="sub-hint">(vd: CB-01, CB-35TR)</span></label>
                <input
                  type="text"
                  v-model="editingDraft.id"
                  :disabled="!isNewCombo"
                  placeholder="Hệ thống tự sinh (CB-01, CB-35TR...)"
                  style="text-transform: uppercase; font-family: monospace; font-weight: 700;"
                />
              </div>

              <div class="adm-field">
                <label>Nhãn Tiếp Thị Nổi Bật</label>
                <input
                  type="text"
                  v-model="editingDraft.badge"
                  placeholder="Bán Chạy Số 1 / Tiết Kiệm Nhất / Khuyên Dùng..."
                />
              </div>

              <div class="adm-field field-span-2">
                <label>Diện Tích Phòng Đề Xuất</label>
                <input
                  type="text"
                  v-model="editingDraft.roomSize"
                  placeholder="Ví dụ: 25 - 45m², 15 - 30m²..."
                />
              </div>

              <div class="adm-field field-span-2">
                <label>Mô Tả Giá Trị Cốt Lõi (Tagline)</label>
                <textarea
                  rows="2"
                  v-model="editingDraft.tagline"
                  placeholder="Ví dụ: Gói cao cấp bán chạy nhất cho phòng khách gia đình từ 25 - 45m²..."
                ></textarea>
              </div>

              <div class="adm-field field-span-2">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="editingDraft.isFeatured" />
                  <span class="chk-text">
                    <strong>Đánh dấu là gói Bán Chạy / Nổi Bật Nhất</strong>
                    <span class="chk-sub">(Hiển thị viền vàng kim và huy hiệu sao nổi bật nhất trên trang chủ)</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <!-- KHỐI 2: ĐỊNH GIÁ & TIẾT KIỆM -->
          <div class="editor-section">
            <div class="section-header-row">
              <span class="section-title-tag">2. Bảng định giá &amp; Ưu đãi chuyển khoản</span>
              <span class="live-savings-tag">
                Khách tiết kiệm: <strong>{{ formatCurrency(calcSaved(editingDraft)) }}</strong>
              </span>
            </div>

            <div class="adm-form-grid">
              <div class="adm-field">
                <label>Giá Bán Trọn Gói ({{ formatCurrency(editingDraft.price) }}) <span class="required">*</span></label>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  v-model.number="editingDraft.price"
                />
              </div>

              <div class="adm-field">
                <label>Giá Ưu Đãi Chuyển Khoản ({{ formatCurrency(editingDraft.fastActionPrice) }})</label>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  v-model.number="editingDraft.fastActionPrice"
                />
              </div>

              <div class="adm-field">
                <label>Giá Lẻ Thiết Bị Cộng Gộp ({{ formatCurrency(editingDraft.listPrice) }})</label>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  v-model.number="editingDraft.listPrice"
                />
              </div>

              <div class="adm-field">
                <label>Tổng Giá Trị Thật Kèm Quà ({{ formatCurrency(editingDraft.totalRealValue) }})</label>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  v-model.number="editingDraft.totalRealValue"
                />
              </div>
            </div>
          </div>

          <!-- KHỐI 3: VIDEO TEST HÁT THỬ -->
          <div class="editor-section">
            <div class="section-header-row">
              <span class="section-title-tag">3. Video hát thử thực tế</span>
            </div>

            <div class="adm-form-grid">
              <div class="adm-field">
                <label>Đường Dẫn YouTube hoặc Video MP4</label>
                <input
                  type="text"
                  v-model="editingDraft.videoUrl"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div class="adm-field">
                <label>Tiêu Đề Video Hát Thử</label>
                <input
                  type="text"
                  v-model="editingDraft.videoTitle"
                  placeholder="Ví dụ: So Sánh Dàn Karaoke Gia Đình Với Quán Hát..."
                />
              </div>
            </div>

            <!-- Video Player Preview -->
            <div v-if="getEmbed(editingDraft.videoUrl)" class="modal-video-preview">
              <video
                v-if="isDirectVideo(editingDraft.videoUrl)"
                :src="editingDraft.videoUrl"
                controls
                preload="metadata"
              ></video>
              <iframe
                v-else
                :src="getEmbed(editingDraft.videoUrl)"
                title="Xem thử video test dàn"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>
            </div>
          </div>

          <!-- KHỐI 4: DANH MỤC THIẾT BỊ CẤU THÀNH -->
          <div class="editor-section">
            <div class="section-header-row">
              <span class="section-title-tag">
                4. Thiết bị trong bộ dàn ({{ editingDraft.components?.length || 0 }})
              </span>
              <button type="button" class="adm-btn adm-btn-sm adm-btn-ghost" @click="addComponentRow">
                <AdminIcon name="plus" :size="13" /> Thêm thiết bị
              </button>
            </div>

            <div class="editor-rows-stack">
              <div
                v-for="(comp, cIdx) in editingDraft.components"
                :key="cIdx"
                class="editor-row-comp"
              >
                <span class="row-num">{{ cIdx + 1 }}</span>
                <div class="row-inputs-grid">
                  <input
                    type="text"
                    v-model="comp.item"
                    placeholder="Tên & model thiết bị (vd: 1 Đôi Loa Full 30 PF 12 Pro, Cục Đẩy 4 Kênh...)"
                  />
                  <input
                    type="text"
                    v-model="comp.role"
                    placeholder="Vai trò âm học (vd: Tái tạo tiếng ca dày, sáng rõ, chống hú rít tuyệt đối...)"
                  />
                </div>
                <button
                  type="button"
                  class="row-remove-btn"
                  @click="removeComponentRow(cIdx)"
                  title="Xóa thiết bị này"
                >
                  <AdminIcon name="x" :size="14" />
                </button>
              </div>

              <div v-if="!editingDraft.components?.length" class="empty-list-notice">
                Chưa có thiết bị nào. Nhấn "+ Thêm thiết bị" để bắt đầu phối ghép bộ dàn.
              </div>
            </div>
          </div>

          <!-- KHỐI 5: DANH MỤC QUÀ TẶNG & DỊCH VỤ -->
          <div class="editor-section">
            <div class="section-header-row">
              <span class="section-title-tag">
                5. Quà tặng &amp; Đặc quyền kèm theo ({{ editingDraft.gifts?.length || 0 }})
              </span>
              <button type="button" class="adm-btn adm-btn-sm adm-btn-ghost" @click="addGiftRow">
                <AdminIcon name="plus" :size="13" /> Thêm quà tặng
              </button>
            </div>

            <div class="editor-rows-stack">
              <div
                v-for="(_, gIdx) in editingDraft.gifts"
                :key="gIdx"
                class="editor-row-gift"
              >
                <span class="row-num">🎁 {{ gIdx + 1 }}</span>
                <input
                  type="text"
                  v-model="editingDraft.gifts[gIdx]"
                  placeholder="Nội dung quà tặng / dịch vụ (vd: Setup căn chỉnh trực tiếp 1 lần tại nhà, Tặng quản lý nguồn...)"
                />
                <button
                  type="button"
                  class="row-remove-btn"
                  @click="removeGiftRow(gIdx)"
                  title="Xóa quà tặng này"
                >
                  <AdminIcon name="x" :size="14" />
                </button>
              </div>

              <div v-if="!editingDraft.gifts?.length" class="empty-list-notice">
                Chưa có quà tặng nào. Nhấn "+ Thêm quà tặng" để bổ sung ưu đãi kích cầu khách hàng.
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Modal -->
        <div class="modal-footer">
          <div class="footer-left-info">
            Giá bán hiển thị: <strong>{{ formatCurrency(editingDraft.price) }}</strong>
          </div>
          <div class="footer-right-buttons">
            <button type="button" class="adm-btn adm-btn-ghost" @click="closeModal">
              Hủy bỏ
            </button>
            <button
              type="button"
              class="adm-btn adm-btn-gold"
              :disabled="isSaving"
              @click="submitSaveCombo"
            >
              <AdminIcon name="check" :size="16" />
              <span>{{ isSaving ? 'Đang lưu lên hệ thống...' : isNewCombo ? 'Tạo Gói Dàn Mới' : 'Lưu & Đồng Bộ Lên Website' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL XÁC NHẬN XÓA GÓI DÀN -->
    <div v-if="deleteTargetCombo" class="modal-backdrop" @click.self="deleteTargetCombo = null">
      <div class="modal-box modal-sm">
        <div class="modal-header">
          <h2>Xác Nhận Xóa Gói Dàn</h2>
          <button type="button" class="modal-close-btn" @click="deleteTargetCombo = null">
            <AdminIcon name="x" :size="18" />
          </button>
        </div>
        <div class="modal-body">
          <p class="delete-warning-text">
            Anh có chắc chắn muốn xóa cấu hình gói dàn <strong>"{{ deleteTargetCombo.name }}"</strong> khỏi hệ thống?
          </p>
          <p class="delete-sub-text">
            Thao tác này sẽ gỡ bỏ gói dàn cùng toàn bộ thông tin thiết bị và quà tặng kèm khỏi website bán hàng.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="adm-btn adm-btn-ghost" @click="deleteTargetCombo = null">
            Hủy Bỏ
          </button>
          <button
            type="button"
            class="adm-btn adm-btn-danger"
            :disabled="isDeleting"
            @click="executeDeleteCombo"
          >
            <AdminIcon name="trash" :size="15" />
            <span>{{ isDeleting ? 'Đang xóa...' : 'Xóa Vĩnh Viễn' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import { useProductStore } from '../../stores/productStore'
import { formatCurrency } from '../../utils/formatters'
import { getEmbedVideoUrl, isDirectVideo } from '../../utils/videoHelper'
import AdminIcon from '../../components/admin/AdminIcon.vue'

const adminStore = useAdminStore()
const productStore = useProductStore()

// State tìm kiếm & bộ lọc
const searchQuery = ref('')
const filterRoom = ref('all')
const filterFeaturedOnly = ref(false)
const sortBy = ref('price-desc')

// State Modal soạn thảo
const isModalOpen = ref(false)
const isNewCombo = ref(false)
const isSaving = ref(false)
const isDuplicatingId = ref('')
const deleteTargetCombo = ref(null)
const isDeleting = ref(false)

// Object draft chỉnh sửa
const editingDraft = reactive({
  id: '',
  name: '',
  tagline: '',
  roomSize: '',
  badge: '',
  isFeatured: false,
  price: 0,
  fastActionPrice: 0,
  listPrice: 0,
  totalRealValue: 0,
  videoUrl: '',
  videoTitle: '',
  components: [],
  gifts: []
})

// KPI Computeds
const featuredComboName = computed(() => {
  const feat = adminStore.combos.find(c => c.isFeatured)
  return feat ? feat.name : (adminStore.combos[0]?.name || 'Chưa thiết lập')
})

const priceRangeText = computed(() => {
  if (!adminStore.combos.length) return '0 đ'
  const prices = adminStore.combos.map(c => Number(c.price) || 0)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return formatCurrency(min)
  return `${(min / 1000000).toFixed(1)}Tr — ${(max / 1000000).toFixed(1)}Tr`
})

const totalGiftsCount = computed(() => {
  return adminStore.combos.reduce((acc, c) => acc + (Array.isArray(c.gifts) ? c.gifts.length : 0), 0)
})

// Bộ lọc & tìm kiếm danh sách gói dàn
const filteredCombos = computed(() => {
  let list = [...adminStore.combos]

  // Lọc theo từ khóa
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(c => {
      const matchName = (c.name || '').toLowerCase().includes(q)
      const matchTagline = (c.tagline || '').toLowerCase().includes(q)
      const matchRoom = (c.roomSize || '').toLowerCase().includes(q)
      const matchBadge = (c.badge || '').toLowerCase().includes(q)
      const matchComps = (c.components || []).some(x => (x.item || '').toLowerCase().includes(q) || (x.role || '').toLowerCase().includes(q))
      const matchGifts = (c.gifts || []).some(g => String(g || '').toLowerCase().includes(q))
      return matchName || matchTagline || matchRoom || matchBadge || matchComps || matchGifts
    })
  }

  // Lọc theo diện tích phòng
  if (filterRoom.value === 'small') {
    list = list.filter(c => {
      const s = (c.roomSize || '').toLowerCase()
      return s.includes('15') || s.includes('20') || s.includes('< 25') || s.includes('nhỏ')
    })
  } else if (filterRoom.value === 'medium') {
    list = list.filter(c => {
      const s = (c.roomSize || '').toLowerCase()
      return s.includes('25') || s.includes('30') || s.includes('35') || s.includes('40') || s.includes('45')
    })
  } else if (filterRoom.value === 'large') {
    list = list.filter(c => {
      const s = (c.roomSize || '').toLowerCase()
      return s.includes('45') || s.includes('50') || s.includes('60') || s.includes('> 45') || s.includes('lớn')
    })
  }

  // Lọc chỉ xem gói nổi bật
  if (filterFeaturedOnly.value) {
    list = list.filter(c => c.isFeatured)
  }

  // Sắp xếp
  if (sortBy.value === 'price-desc') {
    list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
  } else if (sortBy.value === 'price-asc') {
    list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
  } else if (sortBy.value === 'name-asc') {
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }

  return list
})

const resetFilters = () => {
  searchQuery.value = ''
  filterRoom.value = 'all'
  filterFeaturedOnly.value = false
  sortBy.value = 'price-desc'
}

const getEmbed = (url) => getEmbedVideoUrl(url)

const calcSaved = (d) => {
  const base = Number(d.totalRealValue) > 0 ? Number(d.totalRealValue) : Number(d.listPrice) || 0
  return Math.max(0, base - (Number(d.price) || 0))
}

const calcComboSaved = (c) => {
  if (c.savedAmount !== undefined && c.savedAmount !== null) return Number(c.savedAmount)
  const base = Number(c.totalRealValue) > 0 ? Number(c.totalRealValue) : Number(c.listPrice) || 0
  return Math.max(0, base - (Number(c.price) || 0))
}

// Bật/tắt nhanh trạng thái Nổi Bật của Gói Dàn
const toggleFeatured = async (combo) => {
  try {
    const nextVal = !combo.isFeatured
    await adminStore.updateCombo(combo.id, { isFeatured: nextVal })
  } catch (err) {
    // Thông báo lỗi xử lý tại store
  }
}

// Mở modal tạo mới
const openCreateModal = () => {
  isNewCombo.value = true
  Object.assign(editingDraft, {
    id: '',
    name: '',
    tagline: '',
    roomSize: '25 - 45m²',
    badge: 'Gói Dàn Mới',
    isFeatured: false,
    price: 25000000,
    fastActionPrice: 24000000,
    listPrice: 28000000,
    totalRealValue: 32000000,
    videoUrl: '',
    videoTitle: '',
    components: [
      { item: '1 Đôi Loa Full 30 Cao Cấp', role: 'Tiếng sáng, hát nhẹ hơi, không hú rít' },
      { item: 'Cục Đẩy Công Suất 2 Kênh', role: 'Đánh căng đôi loa, âm sắc sạch và uy lực' },
      { item: 'Vang Số Chống Hú K9', role: 'Chip DSP 32-bit xử lý effect mượt mà' },
      { item: 'Bộ Micro Không Dây Chuyên Nghiệp', role: 'Cảm biến tự ngắt, tiếng mic dày ấm' }
    ],
    gifts: [
      'Bộ Quản lý nguồn điện cao cấp bảo vệ toàn bộ dàn',
      'Dây quang chất lượng cao truyền tải âm thanh sạch',
      '10m Dây loa bọc giáp đồng nguyên chất + Bộ jack cắm',
      'Setup căn chỉnh trực tiếp 1 lần tại nhà & hỗ trợ từ xa suốt đời',
      'Miễn phí vận chuyển tận nhà trong bán kính 300km'
    ]
  })
  isModalOpen.value = true
}

// Mở modal chỉnh sửa
const openEditModal = (combo) => {
  isNewCombo.value = false
  Object.assign(editingDraft, {
    id: combo.id,
    name: combo.name || '',
    tagline: combo.tagline || '',
    roomSize: combo.roomSize || '',
    badge: combo.badge || '',
    isFeatured: Boolean(combo.isFeatured),
    price: Number(combo.price) || 0,
    fastActionPrice: Number(combo.fastActionPrice) || 0,
    listPrice: Number(combo.listPrice) || 0,
    totalRealValue: Number(combo.totalRealValue || combo.listPrice) || 0,
    videoUrl: combo.videoUrl || '',
    videoTitle: combo.videoTitle || '',
    components: Array.isArray(combo.components)
      ? combo.components.map(x => ({ item: x.item || '', role: x.role || '' }))
      : [],
    gifts: Array.isArray(combo.gifts) ? [...combo.gifts] : []
  })
  isModalOpen.value = true
}

const closeModal = () => {
  if (isSaving.value) return
  isModalOpen.value = false
}

// Thêm / Xóa dòng component
const addComponentRow = () => {
  editingDraft.components.push({ item: '', role: '' })
}

const removeComponentRow = (idx) => {
  editingDraft.components.splice(idx, 1)
}

// Thêm / Xóa dòng quà tặng
const addGiftRow = () => {
  editingDraft.gifts.push('')
}

const removeGiftRow = (idx) => {
  editingDraft.gifts.splice(idx, 1)
}

// Lưu dữ liệu gói dàn (Tạo mới hoặc Cập nhật)
const submitSaveCombo = async () => {
  if (!editingDraft.name.trim()) {
    adminStore.showNotice('Vui lòng nhập tên gói dàn karaoke.', 'error')
    return
  }
  if (!Number(editingDraft.price)) {
    adminStore.showNotice('Vui lòng nhập giá bán trọn gói hợp lệ.', 'error')
    return
  }

  isSaving.value = true
  try {
    const cleanComponents = (editingDraft.components || [])
      .filter(c => c && c.item && c.item.trim())
      .map(c => ({ item: c.item.trim(), role: (c.role || '').trim() }))

    const cleanGifts = (editingDraft.gifts || [])
      .map(g => String(g || '').trim())
      .filter(Boolean)

    const payload = {
      id: (editingDraft.id || '').trim().toUpperCase() || undefined,
      name: editingDraft.name.trim(),
      tagline: (editingDraft.tagline || '').trim(),
      roomSize: (editingDraft.roomSize || '').trim() || 'Phòng gia đình',
      badge: (editingDraft.badge || '').trim(),
      isFeatured: Boolean(editingDraft.isFeatured),
      price: Number(editingDraft.price) || 0,
      fastActionPrice: Number(editingDraft.fastActionPrice) || Number(editingDraft.price) || 0,
      listPrice: Number(editingDraft.listPrice) || Number(editingDraft.price) || 0,
      totalRealValue: Number(editingDraft.totalRealValue) || Number(editingDraft.listPrice) || 0,
      videoUrl: (editingDraft.videoUrl || '').trim(),
      videoTitle: (editingDraft.videoTitle || '').trim(),
      components: cleanComponents,
      gifts: cleanGifts
    }

    if (isNewCombo.value) {
      await adminStore.addCombo(payload)
    } else {
      await adminStore.updateCombo(editingDraft.id, payload)
    }

    await productStore.refreshProducts()
    isModalOpen.value = false
  } catch (err) {
    // Lỗi đã được showNotice trong store
  } finally {
    isSaving.value = false
  }
}

// Nhân bản gói dàn (Duplicate)
const duplicateComboAction = async (combo) => {
  if (isDuplicatingId.value) return
  isDuplicatingId.value = combo.id
  try {
    await adminStore.duplicateCombo(combo.id)
    await productStore.refreshProducts()
  } catch (err) {
    // Thông báo lỗi xử lý tại store
  } finally {
    isDuplicatingId.value = ''
  }
}

// Xác nhận xóa gói dàn
const confirmDeleteCombo = (combo) => {
  if (adminStore.combos.length <= 1) {
    adminStore.showNotice('Không thể xóa gói dàn duy nhất còn lại trên website.', 'error')
    return
  }
  deleteTargetCombo.value = combo
}

const executeDeleteCombo = async () => {
  if (!deleteTargetCombo.value || isDeleting.value) return
  isDeleting.value = true
  try {
    await adminStore.deleteCombo(deleteTargetCombo.value.id)
    await productStore.refreshProducts()
    deleteTargetCombo.value = null
  } catch (err) {
    // Thông báo lỗi xử lý tại store
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
/* KPIs Grid */
.combo-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.kpi-card {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.kpi-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-blue-subtle { background: #eff6ff; color: #2563eb; }
.bg-gold-subtle { background: #fef9c3; color: #ca8a04; }
.bg-green-subtle { background: #f0fdf4; color: #16a34a; }
.bg-purple-subtle { background: #faf5ff; color: #9333ea; }

.kpi-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.kpi-num {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}

.kpi-title-clamp {
  font-size: 0.96rem;
  font-weight: 800;
  color: #b45309;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-green { color: #15803d; }
.text-purple { color: #7e22ce; }

.kpi-lbl {
  font-size: 0.76rem;
  font-weight: 600;
  color: #64748b;
  margin-top: 3px;
}

/* Toolbar Tìm kiếm & Lọc */
.combo-toolbar {
  padding: 14px 18px;
  margin-bottom: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-search {
  position: relative;
  flex: 1;
  min-width: 280px;
}

.toolbar-search input {
  width: 100%;
  padding: 10px 36px 10px 38px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.88rem;
  color: #0f172a;
  outline: none;
  transition: all 0.2s;
}

.toolbar-search input:focus {
  background: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
}

.toolbar-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-lbl {
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
  white-space: nowrap;
}

.filter-select {
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  font-size: 0.82rem;
  color: #0f172a;
  outline: none;
}

.filter-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-pill-btn:hover {
  background: #e2e8f0;
}

.filter-pill-btn.active {
  background: #fef08a;
  border-color: #eab308;
  color: #854d0e;
}

/* Lưới Thẻ Catalog Gói Dàn (Multi-Combo Grid) */
.combos-catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 22px;
  align-items: stretch;
}

.combo-card-item {
  display: flex;
  flex-direction: column;
  transition: transform 0.25s, box-shadow 0.25s;
  overflow: hidden;
}

.combo-card-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.combo-card-item.is-featured-border {
  border: 2px solid #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
}

.combo-item-top {
  padding: 14px 18px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.badges-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.sku-tag {
  font-family: monospace;
  font-weight: 800;
  letter-spacing: 0.04em;
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.sub-hint {
  font-size: 0.72rem;
  font-weight: normal;
  color: #64748b;
}

.featured-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 700;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.featured-toggle-btn.active {
  background: #fef08a;
  border-color: #eab308;
  color: #854d0e;
}

.combo-item-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 1;
}

.combo-item-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.35;
  margin: 0;
}

.combo-item-tagline {
  font-size: 0.84rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

.combo-item-pricing {
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.price-main-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.price-val {
  font-size: 1.45rem;
  font-weight: 900;
  color: #2563eb;
}

.fast-action-tag {
  font-size: 0.78rem;
  font-weight: 700;
  color: #b45309;
  background: #fef3c7;
  padding: 3px 8px;
  border-radius: 6px;
}

.price-sub-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.76rem;
  font-weight: 600;
}

.list-val {
  color: #94a3b8;
  text-decoration: line-through;
}

.save-val {
  color: #15803d;
  font-weight: 700;
}

.combo-item-video {
  border-radius: 9px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #0f172a;
}

.video-meta-head {
  padding: 6px 10px;
  background: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  color: #cbd5e1;
}

.video-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #dc2626;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 800;
  font-size: 0.68rem;
}

.video-title-trim {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.video-thumb-frame {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.video-thumb-frame video,
.video-thumb-frame iframe {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: none;
}

.combo-item-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-sub-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sub-title {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #475569;
}

.mini-comps-list,
.mini-gifts-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  color: #334155;
}

.mini-comps-list li {
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1.4;
}

.check-dot {
  color: #16a34a;
  font-weight: 900;
}

.comp-name {
  font-weight: 700;
}

.comp-role {
  color: #64748b;
  font-size: 0.75rem;
}

.mini-gifts-list li {
  line-height: 1.4;
  color: #475569;
}

.more-row {
  font-size: 0.74rem;
  color: #2563eb;
  font-weight: 700;
  font-style: italic;
  padding-left: 14px;
}

.combo-item-footer {
  padding: 14px 18px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-flex-1 {
  flex: 1;
  justify-content: center;
}

.btn-square {
  width: 38px;
  height: 38px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Empty State */
.combo-empty-state {
  padding: 60px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon-box {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.combo-empty-state h3 {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 6px;
}

.combo-empty-state p {
  font-size: 0.88rem;
  color: #64748b;
  margin-bottom: 20px;
}

.empty-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* MODAL STYLES */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-box {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.modal-wide {
  max-width: 900px;
}

.modal-sm {
  max-width: 480px;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  background: #f8fafc;
}

.header-titles h2 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.modal-subtitle {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
}

.modal-close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.editor-section {
  padding: 16px 18px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title-tag {
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #1e293b;
}

.live-savings-tag {
  font-size: 0.8rem;
  font-weight: 700;
  color: #15803d;
}

.field-span-2 {
  grid-column: span 2;
}

.title-strong-input {
  font-weight: 800;
  font-size: 0.96rem !important;
  color: #1d4ed8 !important;
}

.required {
  color: #dc2626;
  font-weight: 800;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: #f59e0b;
}

.chk-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chk-text strong {
  font-size: 0.86rem;
  color: #0f172a;
}

.chk-sub {
  font-size: 0.76rem;
  color: #64748b;
}

.modal-video-preview {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  overflow: hidden;
  background: #0f172a;
  border: 1px solid #cbd5e1;
}

.modal-video-preview video,
.modal-video-preview iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.editor-rows-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.editor-row-comp,
.editor-row-gift {
  display: flex;
  align-items: center;
  gap: 10px;
}

.row-num {
  font-size: 0.74rem;
  font-weight: 800;
  color: #64748b;
  width: 32px;
  flex-shrink: 0;
  text-align: center;
}

.row-inputs-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.editor-row-comp input,
.editor-row-gift input {
  width: 100%;
  padding: 9px 12px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  font-size: 0.84rem;
  color: #0f172a;
  outline: none;
}

.editor-row-comp input:focus,
.editor-row-gift input:focus {
  border-color: #2563eb;
}

.row-remove-btn {
  width: 34px;
  height: 36px;
  border-radius: 7px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
}

.row-remove-btn:hover {
  background: #dc2626;
  color: #ffffff;
}

.empty-list-notice {
  font-size: 0.82rem;
  color: #94a3b8;
  font-style: italic;
  padding: 10px;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  text-align: center;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-left-info {
  font-size: 0.84rem;
  color: #475569;
}

.footer-left-info strong {
  color: #2563eb;
  font-size: 1.05rem;
}

.footer-right-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.delete-warning-text {
  font-size: 0.94rem;
  color: #0f172a;
  line-height: 1.5;
  margin-bottom: 8px;
}

.delete-sub-text {
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.4;
  margin: 0;
}

/* Responsive */
@media (max-width: 1200px) {
  .combo-kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .combo-kpi-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .combos-catalog-grid {
    grid-template-columns: 1fr;
  }
  .row-inputs-grid {
    grid-template-columns: 1fr;
  }
  .field-span-2 {
    grid-column: span 1;
  }
}

@media (max-width: 380px) {
  .combo-kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
