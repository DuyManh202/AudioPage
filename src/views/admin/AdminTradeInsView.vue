<template>
  <div class="adm-page">
    <!-- Đầu trang Thu Cũ Đổi Mới -->
    <div class="adm-page-head">
      <div>
        <h1 class="adm-page-title">Thẩm Định Thu Cũ Đổi Mới</h1>
        <p class="adm-page-sub">
          Kiểm tra ảnh thiết bị cũ khách gửi, nhập mức định giá thu hồi để hỗ trợ khách bù chênh lệch nâng cấp lên gói dàn mới.
        </p>
      </div>
      <div class="adm-head-actions">
        <button type="button" class="adm-btn adm-btn-export" @click="exportTradeInsCsv">
          <AdminIcon name="download" :size="15" />
          <span>Xuất Excel (CSV)</span>
        </button>
      </div>
    </div>

    <!-- 4 Chỉ số KPI Thu Cũ -->
    <div class="adm-kpi-grid">
      <div
        :class="['adm-kpi-card clickable', { 'active-kpi': statusFilter === 'ALL' }]"
        @click="statusFilter = 'ALL'"
      >
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Tổng Yêu Cầu Thu Cũ</span>
          <span class="adm-kpi-value">{{ adminStore.tradeIns.length }} hồ sơ</span>
          <span class="adm-kpi-meta">Toàn bộ yêu cầu gửi lên</span>
        </div>
        <div class="adm-kpi-icon tone-blue">
          <AdminIcon name="trade-ins" :size="20" />
        </div>
      </div>

      <div
        :class="['adm-kpi-card clickable', { 'active-kpi': statusFilter === 'CHO_DINH_GIA' }]"
        @click="statusFilter = 'CHO_DINH_GIA'"
      >
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Chờ Định Giá</span>
          <span class="adm-kpi-value">{{ adminStore.pendingTradeInsCount }} yêu cầu</span>
          <span class="adm-kpi-meta">Cần xem ảnh &amp; báo giá Zalo</span>
        </div>
        <div class="adm-kpi-icon tone-gold">
          <AdminIcon name="alert" :size="20" />
        </div>
      </div>

      <div
        :class="['adm-kpi-card clickable', { 'active-kpi': statusFilter === 'DA_DUYET' }]"
        @click="statusFilter = 'DA_DUYET'"
      >
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Đã Báo Giá Khách</span>
          <span class="adm-kpi-value">{{ quotedCount }} hồ sơ</span>
          <span class="adm-kpi-meta">Đang chờ khách chốt lịch đổi</span>
        </div>
        <div class="adm-kpi-icon tone-purple">
          <AdminIcon name="message" :size="20" />
        </div>
      </div>

      <div
        :class="['adm-kpi-card clickable', { 'active-kpi': statusFilter === 'DA_THU_HOI' }]"
        @click="statusFilter = 'DA_THU_HOI'"
      >
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Đã Thu Đổi Thành Công</span>
          <span class="adm-kpi-value">{{ completedCount }} bộ</span>
          <span class="adm-kpi-meta">Khách đã nâng cấp dàn mới</span>
        </div>
        <div class="adm-kpi-icon tone-green">
          <AdminIcon name="check" :size="20" />
        </div>
      </div>
    </div>

    <!-- Bảng & Thanh Lọc -->
    <div class="adm-card">
      <div class="adm-toolbar">
        <div class="adm-toolbar-row">
          <div class="adm-search-box">
            <AdminIcon name="search" :size="16" class="search-ico" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Tìm tên khách, số điện thoại, tên loa/amply cũ..."
            />
          </div>

          <div class="adm-date-filter">
            <label><span>Từ ngày</span><input v-model="fromDate" type="date" aria-label="Ngày bắt đầu lọc yêu cầu thu cũ" /></label>
            <label><span>Đến ngày</span><input v-model="toDate" type="date" aria-label="Ngày kết thúc lọc yêu cầu thu cũ" /></label>
            <button type="button" class="adm-date-clear" :disabled="!isDateActive" @click="clearDates">Xóa ngày</button>
          </div>

          <div class="adm-tabs">
            <button
              v-for="tab in statusTabs"
              :key="tab.key"
              type="button"
              :class="['adm-tab', { active: statusFilter === tab.key }]"
              @click="statusFilter = tab.key"
            >
              {{ tab.label }}
              <span class="adm-tab-count">{{ tab.count }}</span>
            </button>
          </div>
        </div>
        <p v-if="isDateLoading || dateError" :class="['adm-date-status', { error: dateError }]">
          {{ dateError || 'Đang tải yêu cầu theo ngày từ máy chủ…' }}
        </p>
      </div>

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>Ngày Gửi</th>
              <th>Khách Hàng &amp; Liên Hệ</th>
              <th>Ảnh Thiết Bị</th>
              <th>Thiết Bị Cũ &amp; Tình Trạng</th>
              <th>Muốn Lên Đời</th>
              <th>Định Giá Thu Hồi (VNĐ)</th>
              <th>Trạng Thái</th>
              <th v-if="isSuperAdmin" class="th-right">Xóa</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredTradeIns" :key="item.id">
              <td>
                <span class="sub-line">{{ item.createdAt }}</span>
              </td>

              <td>
                <strong class="cust-name">{{ item.customerName }}</strong>
                <div class="adm-contact-row">
                  <a :href="`tel:${cleanPhone(item.customerPhone)}`" class="adm-contact-chip">
                    <AdminIcon name="phone" :size="12" />
                    {{ item.customerPhone }}
                  </a>
                  <a
                    :href="`https://zalo.me/${cleanPhone(item.customerPhone)}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="adm-contact-chip zalo"
                  >
                    Zalo
                  </a>
                </div>
                <span class="sub-line">{{ item.customerAddress }}</span>
              </td>

              <td>
                <button
                  v-if="item.oldDeviceImages"
                  type="button"
                  class="device-thumb-btn"
                  @click="previewImage = item.oldDeviceImages"
                  title="Bấm để phóng to ảnh thiết bị cũ"
                >
                  <img :src="item.oldDeviceImages" alt="Thiết bị cũ" />
                </button>
                <span v-else class="adm-badge adm-badge-slate">Chưa gửi ảnh</span>
              </td>

              <td>
                <strong class="cust-name">{{ item.oldDeviceName }}</strong>
                <span class="cond-text">{{ item.conditionNote || 'Chưa có mô tả chi tiết' }}</span>
              </td>

              <td>
                <span class="adm-badge adm-badge-gold">{{ item.upgradeToItem }}</span>
              </td>

              <td>
                <div class="appraisal-box">
                  <input
                    type="number"
                    min="0"
                    class="appraisal-input"
                    :value="item.estimatedPrice"
                    @change="updateEstimatedPrice(item.id, $event.target.value)"
                    placeholder="Nhập giá thu..."
                  />
                  <span class="appraisal-formatted">
                    {{ item.estimatedPrice > 0 ? formatCurrency(item.estimatedPrice) : 'Chưa định giá' }}
                  </span>
                </div>
              </td>

              <td>
                <select
                  :value="item.status"
                  @change="updateStatus(item.id, $event.target.value)"
                  :class="['adm-status-select', getStatusClass(item.status)]"
                >
                  <option value="CHO_DINH_GIA">Chờ định giá</option>
                  <option value="DA_DUYET">Đã báo giá khách</option>
                  <option value="DA_THU_HOI">Đã đổi thành công</option>
                  <option value="HUY">Đã hủy</option>
                </select>
              </td>

              <td v-if="isSuperAdmin" class="th-right">
                <button
                  type="button"
                  class="adm-btn adm-btn-sm adm-btn-danger"
                  @click="handleDelete(item.id)"
                  title="Xóa yêu cầu"
                >
                  <AdminIcon name="trash" :size="14" />
                </button>
              </td>
            </tr>

            <tr v-if="!isDateLoading && !dateError && filteredTradeIns.length === 0">
              <td :colspan="isSuperAdmin ? 8 : 7" class="adm-empty">
                Không có yêu cầu Thu Cũ Đổi Mới nào khớp bộ lọc.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Hộp phóng to ảnh thiết bị cũ -->
    <div v-if="previewImage" class="adm-modal-backdrop" @click="previewImage = null">
      <div class="lightbox-wrap" @click.stop>
        <button type="button" class="lightbox-close" @click="previewImage = null">
          <AdminIcon name="x" :size="18" />
        </button>
        <img :src="previewImage" alt="Ảnh thực tế thiết bị cũ của khách" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import { useAuthStore } from '../../stores/authStore'
import { formatCurrency } from '../../utils/formatters'
import { exportRowsToCsv } from '../../utils/csvExport'
import AdminIcon from '../../components/admin/AdminIcon.vue'
import { useApiDateFilter } from '../../composables/useApiDateFilter'

const adminStore = useAdminStore()
const authStore = useAuthStore()
const isSuperAdmin = computed(() => authStore.currentUser?.role === 'SUPER_ADMIN')
const dateFilter = useApiDateFilter('/admin/trade-ins', computed(() => adminStore.tradeIns))
const { fromDate, toDate, rows: dateRows, isActive: isDateActive, isLoading: isDateLoading, error: dateError, clearDates } = dateFilter

const searchQuery = ref('')
const statusFilter = ref('ALL')
const previewImage = ref(null)

const cleanPhone = (phone) => (phone ? String(phone).replace(/[^0-9]/g, '') : '')

const quotedCount = computed(() => adminStore.tradeIns.filter(t => t.status === 'DA_DUYET').length)
const completedCount = computed(() => adminStore.tradeIns.filter(t => t.status === 'DA_THU_HOI').length)

const statusTabs = computed(() => [
  { key: 'ALL', label: 'Tất Cả', count: adminStore.tradeIns.length },
  { key: 'CHO_DINH_GIA', label: 'Chờ Định Giá', count: adminStore.pendingTradeInsCount },
  { key: 'DA_DUYET', label: 'Đã Báo Giá', count: quotedCount.value },
  { key: 'DA_THU_HOI', label: 'Đã Đổi Xong', count: completedCount.value },
  { key: 'HUY', label: 'Đã Hủy', count: adminStore.tradeIns.filter(t => t.status === 'HUY').length }
])

const filteredTradeIns = computed(() => {
  const kw = searchQuery.value.toLowerCase().trim()
  return dateRows.value.filter(t => {
    if (statusFilter.value !== 'ALL' && t.status !== statusFilter.value) return false
    if (!kw) return true
    return (
      t.customerName?.toLowerCase().includes(kw) ||
      t.customerPhone?.includes(kw) ||
      t.oldDeviceName?.toLowerCase().includes(kw) ||
      t.upgradeToItem?.toLowerCase().includes(kw)
    )
  })
})

const exportTradeInsCsv = () => {
  exportRowsToCsv(
    `thu-cu-doi-moi-${new Date().toISOString().slice(0, 10)}.csv`,
    [
      { label: 'Ngày gửi', value: r => r.createdAt },
      { label: 'Khách hàng', value: r => r.customerName },
      { label: 'Điện thoại', value: r => r.customerPhone },
      { label: 'Địa chỉ', value: r => r.customerAddress },
      { label: 'Thiết bị cũ', value: r => r.oldDeviceName },
      { label: 'Tình trạng', value: r => r.conditionNote || '' },
      { label: 'Muốn đổi lên', value: r => r.upgradeToItem },
      { label: 'Giá thu dự kiến', value: r => r.estimatedPrice || 0 },
      { label: 'Trạng thái', value: r => r.status }
    ],
    filteredTradeIns.value
  )
}

const updateEstimatedPrice = (id, val) => {
  const num = parseInt(val, 10) || 0
  adminStore.updateTradeIn(id, { estimatedPrice: num })
}

const updateStatus = (id, status) => {
  adminStore.updateTradeIn(id, { status })
}

const handleDelete = (id) => {
  if (confirm('Anh có chắc chắn muốn xóa yêu cầu thu cũ đổi mới này?')) {
    adminStore.deleteTradeIn(id)
  }
}

const getStatusClass = (status) => ({
  CHO_DINH_GIA: 'adm-status-yellow',
  DA_DUYET: 'adm-status-blue',
  DA_THU_HOI: 'adm-status-green',
  HUY: 'adm-status-gray'
}[status] || '')
</script>

<style scoped>
.th-right {
  text-align: right;
}

.cust-name {
  display: block;
  color: #0f172a;
  font-size: 0.86rem;
}

.sub-line {
  display: block;
  font-size: 0.73rem;
  color: #64748b;
  margin-top: 2px;
}

.cond-text {
  display: block;
  font-size: 0.76rem;
  color: #475569;
  margin-top: 3px;
  max-width: 240px;
}

.device-thumb-btn {
  width: 58px;
  height: 58px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  padding: 0;
  transition: transform 0.16s, border-color 0.16s;
}

.device-thumb-btn:hover {
  transform: scale(1.05);
  border-color: #2563eb;
}

.device-thumb-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.appraisal-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.appraisal-input {
  width: 138px;
  height: 34px;
  padding: 0 10px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  color: #dc2626;
  font-weight: 800;
  font-size: 0.84rem;
  outline: none;
}

.appraisal-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
}

.appraisal-formatted {
  font-size: 0.72rem;
  color: #475569;
  font-weight: 600;
}

.lightbox-wrap {
  position: relative;
  max-width: 88vw;
  max-height: 86vh;
}

.lightbox-wrap img {
  max-width: 88vw;
  max-height: 82vh;
  border-radius: 14px;
  border: 2px solid #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.45);
}

.lightbox-close {
  position: absolute;
  top: -14px;
  right: -14px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #0f172a;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
