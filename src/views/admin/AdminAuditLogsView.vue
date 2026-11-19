<template>
  <div class="adm-page">
    <!-- Đầu trang Nhật Ký Thao Tác -->
    <div class="adm-page-head">
      <div>
        <h1 class="adm-page-title">Nhật Ký Lịch Sử Thao Tác</h1>
        <p class="adm-page-sub">
          Ghi nhận toàn bộ hoạt động đăng nhập, sửa giá thiết bị, xử lý đơn hàng và phân quyền hệ thống theo thời gian thực.
        </p>
      </div>
      <div class="adm-head-actions">
        <button type="button" class="adm-btn adm-btn-ghost" :disabled="loading" @click="fetchLogs">
          <AdminIcon name="sync" :size="15" :class="{ spinning: loading }" />
          <span>{{ loading ? 'Đang Tải...' : 'Làm Mới' }}</span>
        </button>
        <button type="button" class="adm-btn adm-btn-gold" :disabled="!logs.length" @click="exportLogsCsv">
          <AdminIcon name="download" :size="15" />
          <span>Xuất Nhật Ký (CSV)</span>
        </button>
      </div>
    </div>

    <!-- 4 Thẻ Thống Kê Nhanh -->
    <div class="adm-kpi-grid">
      <div class="adm-kpi-card">
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Tổng Sự Kiện Đã Lưu</span>
          <span class="adm-kpi-value">{{ totalCount }} thao tác</span>
          <span class="adm-kpi-meta">Toàn bộ nhật ký hoạt động hệ thống</span>
        </div>
        <div class="adm-kpi-icon tone-gold">
          <AdminIcon name="history" :size="20" />
        </div>
      </div>

      <div class="adm-kpi-card">
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Hoạt Động Hôm Nay</span>
          <span class="adm-kpi-value text-blue">{{ todayCount }} thao tác</span>
          <span class="adm-kpi-meta">Sự kiện phát sinh trong ngày</span>
        </div>
        <div class="adm-kpi-icon tone-blue">
          <AdminIcon name="calendar" :size="20" />
        </div>
      </div>

      <div class="adm-kpi-card">
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Bảo Mật &amp; Phân Quyền</span>
          <span class="adm-kpi-value text-amber">{{ securityCount }} sự kiện</span>
          <span class="adm-kpi-meta">Đăng nhập, cấp quyền, duyệt nhân sự</span>
        </div>
        <div class="adm-kpi-icon tone-gold">
          <AdminIcon name="shield" :size="20" />
        </div>
      </div>

      <div class="adm-kpi-card">
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Thao Tác Xóa / Hủy</span>
          <span class="adm-kpi-value text-danger">{{ deleteCount }} lần</span>
          <span class="adm-kpi-meta">Xóa đơn hàng, xóa lead, hủy tài khoản</span>
        </div>
        <div class="adm-kpi-icon tone-red">
          <AdminIcon name="trash" :size="20" />
        </div>
      </div>
    </div>

    <!-- Khối Bảng Nhật Ký & Bộ Lọc Nâng Cao -->
    <div class="adm-card">
      <div class="adm-toolbar">
        <div class="adm-toolbar-row">
          <div class="adm-search-box">
            <AdminIcon name="search" :size="16" class="search-ico" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Tìm theo nội dung, tài khoản, đối tượng hoặc IP..."
              @keyup.enter="fetchLogs"
            />
          </div>

          <div class="filter-selects">
            <!-- Lọc theo loại hành động -->
            <select v-model="actionFilter" class="adm-select-sm" @change="fetchLogs">
              <option value="ALL">Tất cả hành động</option>
              <option value="AUTH">Xác thực &amp; Đăng nhập</option>
              <option value="PERMISSIONS">Phân quyền nhân sự</option>
              <option value="CREATE">Tạo mới dữ liệu</option>
              <option value="UPDATE">Cập nhật &amp; Sửa đổi</option>
              <option value="DELETE">Xóa &amp; Hủy dữ liệu</option>
            </select>

            <!-- Lọc theo nhóm đối tượng -->
            <select v-model="targetFilter" class="adm-select-sm" @change="fetchLogs">
              <option value="ALL">Tất cả phân hệ</option>
              <option value="order">Đơn hàng (Orders)</option>
              <option value="product">Sản phẩm &amp; Giá (Products)</option>
              <option value="combo">Gói dàn (Combos)</option>
              <option value="lead">Khách tư vấn (Leads)</option>
              <option value="tradein">Thu cũ đổi mới</option>
              <option value="admin">Nhân sự (Admins)</option>
              <option value="auth">Đăng nhập (Auth)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Bảng danh sách log -->
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th style="width: 160px;">Thời Gian</th>
              <th style="width: 200px;">Người Thực Hiện</th>
              <th style="width: 140px;">Hành Động</th>
              <th style="width: 130px;">Phân Hệ</th>
              <th>Nội Dung Thao Tác Chi Tiết</th>
              <th style="width: 130px;">Địa Chỉ IP</th>
              <th style="width: 80px;" class="th-right">Chi Tiết</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && !logs.length">
              <td colspan="7" class="adm-empty">Đang tải lịch sử thao tác từ máy chủ...</td>
            </tr>
            <tr v-else-if="!filteredLogs.length">
              <td colspan="7" class="adm-empty">Không tìm thấy bản ghi lịch sử nào phù hợp theo tiêu chí lọc.</td>
            </tr>
            <tr v-for="log in filteredLogs" :key="log.id" :class="{ 'row-security-event': log.action_type === 'PERMISSIONS' || log.action_type === 'DELETE' }">
              <!-- Thời gian -->
              <td>
                <div class="log-time-cell">
                  <strong class="time-clock">{{ formatTime(log.created_at) }}</strong>
                  <span class="time-date">{{ formatDate(log.created_at) }}</span>
                </div>
              </td>

              <!-- Người thực hiện -->
              <td>
                <div class="log-user-cell">
                  <div class="log-user-avatar" :class="getAvatarClass(log.admin_role)">
                    {{ getInitials(log.admin_name || log.admin_username) }}
                  </div>
                  <div class="log-user-info">
                    <span class="log-user-name">{{ log.admin_name || log.admin_username || 'Hệ thống' }}</span>
                    <span class="log-user-role">{{ formatRole(log.admin_role) }}</span>
                  </div>
                </div>
              </td>

              <!-- Hành động -->
              <td>
                <span :class="['action-tag', getActionTagClass(log.action_type)]">
                  {{ formatActionType(log.action_type) }}
                </span>
              </td>

              <!-- Phân hệ -->
              <td>
                <span class="target-chip">{{ formatTargetType(log.target_type) }}</span>
              </td>

              <!-- Chi tiết -->
              <td>
                <div class="log-summary-cell">
                  <span class="log-summary-text">{{ log.summary }}</span>
                  <span v-if="log.target_id" class="target-id-badge">ID: {{ log.target_id }}</span>
                </div>
              </td>

              <!-- IP -->
              <td>
                <code class="ip-code">{{ log.ip_address || '—' }}</code>
              </td>

              <!-- Nút xem chi tiết -->
              <td class="th-right">
                <button
                  type="button"
                  class="adm-btn adm-btn-sm adm-btn-ghost"
                  @click="openDetailModal(log)"
                  title="Xem thông tin chi tiết sự kiện"
                >
                  <AdminIcon name="eye" :size="14" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Phân trang -->
      <div v-if="totalCount > pageSize" class="adm-pagination">
        <span class="page-info">
          Hiển thị <strong>{{ paginationStart }} - {{ paginationEnd }}</strong> trên tổng <strong>{{ totalCount }}</strong> bản ghi
        </span>
        <div class="page-btns">
          <button
            type="button"
            class="page-nav-btn"
            :disabled="page <= 1 || loading"
            @click="changePage(page - 1)"
          >
            Trang Trước
          </button>
          <span class="page-current">Trang {{ page }} / {{ maxPage }}</span>
          <button
            type="button"
            class="page-nav-btn"
            :disabled="page >= maxPage || loading"
            @click="changePage(page + 1)"
          >
            Trang Sau
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Xem Chi Tiết Sự Kiện -->
    <div v-if="selectedLog" class="adm-modal-backdrop" @click.self="selectedLog = null">
      <div class="adm-modal detail-modal">
        <div class="adm-modal-head">
          <div>
            <h3>Chi Tiết Nhật Ký Thao Tác</h3>
            <p>Mã sự kiện: <code>{{ selectedLog.id }}</code></p>
          </div>
          <button type="button" class="adm-modal-close" @click="selectedLog = null">
            <AdminIcon name="x" :size="18" />
          </button>
        </div>

        <div class="adm-modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Thời Gian</span>
              <span class="val">{{ formatFullDateTime(selectedLog.created_at) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Người Thực Hiện</span>
              <span class="val">{{ selectedLog.admin_name }} ({{ selectedLog.admin_username }}) — <strong>{{ formatRole(selectedLog.admin_role) }}</strong></span>
            </div>
            <div class="detail-item">
              <span class="label">Loại Thao Tác</span>
              <span class="val">
                <span :class="['action-tag', getActionTagClass(selectedLog.action_type)]">
                  {{ formatActionType(selectedLog.action_type) }}
                </span>
                <code style="margin-left: 8px;">{{ selectedLog.action }}</code>
              </span>
            </div>
            <div class="detail-item">
              <span class="label">Phân Hệ Tác Động</span>
              <span class="val">{{ formatTargetType(selectedLog.target_type) }} <span v-if="selectedLog.target_id">(ID: {{ selectedLog.target_id }})</span></span>
            </div>
            <div class="detail-item full-width">
              <span class="label">Mô Tả Thao Tác</span>
              <div class="val-box">{{ selectedLog.summary }}</div>
            </div>
            <div class="detail-item full-width" v-if="selectedLog.details && Object.keys(selectedLog.details).length">
              <span class="label">Dữ Liệu Kèm Theo (Payload)</span>
              <pre class="json-box">{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
            </div>
            <div class="detail-item">
              <span class="label">Địa Chỉ IP</span>
              <span class="val"><code class="ip-code">{{ selectedLog.ip_address || 'Không xác định' }}</code></span>
            </div>
          </div>
        </div>

        <div class="adm-modal-foot">
          <button type="button" class="adm-btn adm-btn-ghost" @click="selectedLog = null">Đóng</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiRequest } from '../../utils/api'
import AdminIcon from '../../components/admin/AdminIcon.vue'

const logs = ref([])
const loading = ref(false)
const totalCount = ref(0)
const page = ref(1)
const pageSize = ref(25)

const searchQuery = ref('')
const actionFilter = ref('ALL')
const targetFilter = ref('ALL')
const selectedLog = ref(null)

const maxPage = computed(() => Math.ceil((totalCount.value || 1) / pageSize.value) || 1)
const paginationStart = computed(() => (page.value - 1) * pageSize.value + 1)
const paginationEnd = computed(() => Math.min(page.value * pageSize.value, totalCount.value))

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: String(page.value),
      limit: String(pageSize.value),
      q: searchQuery.value.trim(),
      actionType: actionFilter.value,
      targetType: targetFilter.value
    })
    const res = await apiRequest(`/admin/audit-logs?${params.toString()}`)
    if (res.success) {
      logs.value = res.data || []
      totalCount.value = res.total || 0
    }
  } catch (err) {
    console.error('Lỗi khi tải audit logs:', err)
  } finally {
    loading.value = false
  }
}

const changePage = (newPage) => {
  if (newPage < 1 || newPage > maxPage.value) return
  page.value = newPage
  fetchLogs()
}

onMounted(() => {
  fetchLogs()
})

const filteredLogs = computed(() => logs.value)

// Thống kê nhanh
const todayCount = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return logs.value.filter(l => l.created_at && l.created_at.startsWith(today)).length
})

const securityCount = computed(() => {
  return logs.value.filter(l => l.action_type === 'AUTH' || l.action_type === 'PERMISSIONS').length
})

const deleteCount = computed(() => {
  return logs.value.filter(l => l.action_type === 'DELETE').length
})

// Tiện ích format
const formatTime = (isoStr) => {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const formatDate = (isoStr) => {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatFullDateTime = (isoStr) => {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return d.toLocaleString('vi-VN')
}

const getInitials = (str) => {
  if (!str) return 'HT'
  const parts = str.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return str.slice(0, 2).toUpperCase()
}

const formatRole = (role) => {
  const map = {
    SUPER_ADMIN: 'Quản trị cấp cao',
    SALES: 'Kinh doanh',
    INVENTORY: 'Quản lý kho',
    CUSTOM: 'Tùy chỉnh',
    SYSTEM: 'Hệ thống'
  }
  return map[role] || role || 'Nhân sự'
}

const getAvatarClass = (role) => {
  if (role === 'SUPER_ADMIN') return 'av-gold'
  if (role === 'SALES') return 'av-blue'
  if (role === 'INVENTORY') return 'av-green'
  return 'av-gray'
}

const formatActionType = (type) => {
  const map = {
    CREATE: 'Tạo mới',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa bỏ',
    AUTH: 'Xác thực',
    PERMISSIONS: 'Phân quyền',
    EXPORT: 'Xuất dữ liệu',
    SYSTEM: 'Hệ thống'
  }
  return map[type] || type || 'Thao tác'
}

const getActionTagClass = (type) => {
  const map = {
    CREATE: 'tag-green',
    UPDATE: 'tag-amber',
    DELETE: 'tag-red',
    AUTH: 'tag-blue',
    PERMISSIONS: 'tag-purple',
    EXPORT: 'tag-cyan',
    SYSTEM: 'tag-gray'
  }
  return map[type] || 'tag-gray'
}

const formatTargetType = (type) => {
  const map = {
    order: 'Đơn Hàng',
    product: 'Sản Phẩm',
    combo: 'Dàn Combo',
    lead: 'Khách Tư Vấn',
    tradein: 'Thu Cũ Đổi Mới',
    admin: 'Tài Khoản Nhân Sự',
    auth: 'Đăng Nhập OTP',
    security: 'Bảo Mật',
    system: 'Hệ Thống'
  }
  return map[type] || type || 'Chung'
}

const openDetailModal = (log) => {
  selectedLog.value = log
}

// Xuất file CSV
const exportLogsCsv = () => {
  if (!logs.value.length) return
  const headers = ['Thời gian', 'Tài khoản', 'Họ tên', 'Vai trò', 'Hành động', 'Phân hệ', 'Nội dung chi tiết', 'IP']
  const rows = logs.value.map(l => [
    formatFullDateTime(l.created_at),
    `"${l.admin_username || ''}"`,
    `"${l.admin_name || ''}"`,
    `"${formatRole(l.admin_role)}"`,
    `"${formatActionType(l.action_type)}"`,
    `"${formatTargetType(l.target_type)}"`,
    `"${(l.summary || '').replace(/"/g, '""')}"`,
    `"${l.ip_address || ''}"`
  ])
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `tuaudio_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.filter-selects {
  display: flex;
  gap: 10px;
  align-items: center;
}

.adm-select-sm {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--adm-border, #e2e8f0);
  background: #ffffff;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.adm-select-sm:focus {
  border-color: #eab308;
}

.log-time-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.time-clock {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  font-family: monospace;
}

.time-date {
  font-size: 11px;
  color: #64748b;
}

.log-user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.log-user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.av-gold { background: #fef3c7; color: #b45309; }
.av-blue { background: #dbeafe; color: #1d4ed8; }
.av-green { background: #dcfce7; color: #15803d; }
.av-gray { background: #f1f5f9; color: #475569; }

.log-user-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  line-height: 1.25;
}

.log-user-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.log-user-role {
  font-size: 11px;
  color: #64748b;
}

.action-tag {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.tag-green { background: #dcfce7; color: #166534; }
.tag-amber { background: #fef3c7; color: #92400e; }
.tag-red { background: #fee2e2; color: #991b1b; }
.tag-blue { background: #dbeafe; color: #1e40af; }
.tag-purple { background: #f3e8ff; color: #6b21a8; }
.tag-cyan { background: #cffafe; color: #155e75; }
.tag-gray { background: #f1f5f9; color: #475569; }

.target-chip {
  display: inline-block;
  padding: 3px 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.log-summary-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.log-summary-text {
  font-size: 13px;
  color: #1e293b;
  line-height: 1.4;
}

.target-id-badge {
  display: inline-block;
  font-size: 11px;
  color: #64748b;
  font-family: monospace;
}

.ip-code {
  font-size: 11px;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  color: #475569;
}

.row-security-event {
  background-color: #fffdf5;
}

/* Pagination */
.adm-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-top: 1px solid #e2e8f0;
  font-size: 13px;
}

.page-btns {
  display: flex;
  gap: 10px;
  align-items: center;
}

.page-nav-btn {
  padding: 6px 14px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.page-nav-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
}

.page-nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-current {
  font-weight: 600;
  color: #475569;
}

/* Modal chi tiết */
.detail-modal {
  max-width: 620px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item .label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
  color: #64748b;
}

.detail-item .val {
  font-size: 14px;
  color: #0f172a;
}

.val-box {
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: #1e293b;
}

.json-box {
  margin: 0;
  padding: 12px;
  background: #0f172a;
  color: #38bdf8;
  border-radius: 8px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
}
</style>
