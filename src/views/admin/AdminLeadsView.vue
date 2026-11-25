<template>
  <div class="adm-page">
    <!-- Đầu trang CRM Khách Hàng -->
    <div class="adm-page-head">
      <div>
        <div class="title-with-badge">
          <h1 class="adm-page-title">Khách Tư Vấn &amp; Lịch Hẹn Thử Dàn</h1>
          <span class="live-count-pill" title="Số lượng hồ sơ có số điện thoại hợp lệ">
            {{ visibleLeads.length }} khách chuẩn SĐT
          </span>
        </div>
        <p class="adm-page-sub">
          Quản lý phễu khách hàng tư vấn từ Website, Zalo và Hotline — theo dõi lịch hẹn thử dàn và tiến độ chốt đơn.
        </p>
      </div>
      <div class="adm-head-actions">
        <button type="button" class="adm-btn adm-btn-export" @click="exportLeadsCsv">
          <AdminIcon name="download" :size="15" />
          <span>Xuất Excel (CSV)</span>
        </button>
        <button type="button" class="adm-btn adm-btn-gold" @click="openCreateModal">
          <AdminIcon name="plus" :size="16" />
          <span>+ Thêm Khách Thủ Công</span>
        </button>
      </div>
    </div>

    <!-- 4 Chỉ số KPI Lọc Nhanh -->
    <div class="adm-kpi-grid">
      <div
        :class="['adm-kpi-card clickable', { 'active-kpi': adminStore.leadFilterStatus === 'ALL' }]"
        @click="adminStore.leadFilterStatus = 'ALL'"
      >
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Tổng Hồ Sơ Khách</span>
          <span class="adm-kpi-value">{{ adminStore.totalLeadsCount }} khách</span>
          <span class="adm-kpi-meta">SĐT chuẩn Việt Nam</span>
        </div>
        <div class="adm-kpi-icon tone-blue">
          <AdminIcon name="users" :size="20" />
        </div>
      </div>

      <div
        :class="['adm-kpi-card clickable', { 'active-kpi': adminStore.leadFilterStatus === 'MOI' }]"
        @click="adminStore.leadFilterStatus = 'MOI'"
      >
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Mới Tiếp Nhận</span>
          <span class="adm-kpi-value">{{ adminStore.newLeadsCount }} yêu cầu</span>
          <span class="adm-kpi-meta">Ưu tiên gọi trong <strong>15 phút</strong></span>
        </div>
        <div class="adm-kpi-icon tone-red">
          <AdminIcon name="bell" :size="20" />
        </div>
      </div>

      <div
        :class="['adm-kpi-card clickable', { 'active-kpi': adminStore.leadFilterStatus === 'HEN_THU_TAI_NHA' }]"
        @click="adminStore.leadFilterStatus = 'HEN_THU_TAI_NHA'"
      >
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Lịch Hẹn Thử Tại Nhà</span>
          <span class="adm-kpi-value">{{ adminStore.trialScheduledCount }} lịch hẹn</span>
          <span class="adm-kpi-meta">Phạm vi lắp đặt 300km</span>
        </div>
        <div class="adm-kpi-icon tone-purple">
          <AdminIcon name="calendar" :size="20" />
        </div>
      </div>

      <div
        :class="['adm-kpi-card clickable', { 'active-kpi': adminStore.leadFilterStatus === 'DA_CHOT' }]"
        @click="adminStore.leadFilterStatus = 'DA_CHOT'"
      >
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Đã Bàn Giao Chốt</span>
          <span class="adm-kpi-value">{{ adminStore.closedDealsCount }} bộ dàn</span>
          <span class="adm-kpi-meta">Doanh thu: <strong>{{ formatCurrency(closedRevenue) }}</strong></span>
        </div>
        <div class="adm-kpi-icon tone-green">
          <AdminIcon name="check" :size="20" />
        </div>
      </div>
    </div>

    <!-- Khung Bảng & Bộ Lọc -->
    <div class="adm-card leads-card">
      <div class="adm-toolbar">
        <div class="adm-toolbar-row">
          <div class="adm-search-box">
            <AdminIcon name="search" :size="16" class="search-ico" />
            <input
              type="text"
              v-model="adminStore.leadSearchKeyword"
              placeholder="Tìm tên khách, số điện thoại, khu vực, sản phẩm quan tâm..."
            />
            <button
              v-if="adminStore.leadSearchKeyword"
              type="button"
              class="clear-search-btn"
              @click="adminStore.leadSearchKeyword = ''"
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          </div>

          <select v-model="adminStore.leadFilterStatus" class="adm-select-filter" aria-label="Lọc trạng thái tư vấn">
            <option value="ALL">Mọi trạng thái ({{ adminStore.totalLeadsCount }})</option>
            <option value="MOI">Mới tiếp nhận ({{ adminStore.newLeadsCount }})</option>
            <option value="DA_GOI">Đã gọi tư vấn</option>
            <option value="HEN_THU_TAI_NHA">Lịch hẹn thử tại nhà ({{ adminStore.trialScheduledCount }})</option>
            <option value="DA_CHOT">Đã chốt bàn giao ({{ adminStore.closedDealsCount }})</option>
            <option value="HUY">Đã hủy</option>
          </select>

          <div class="adm-date-filter">
            <label><span>Từ ngày</span><input v-model="fromDate" type="date" aria-label="Ngày bắt đầu lọc khách tư vấn" /></label>
            <label><span>Đến ngày</span><input v-model="toDate" type="date" aria-label="Ngày kết thúc lọc khách tư vấn" /></label>
            <button type="button" class="adm-date-clear" :disabled="!isDateActive" @click="clearDates">Xóa ngày</button>
          </div>
        </div>
        <p v-if="isDateLoading || dateError" :class="['adm-date-status', { error: dateError }]">
          {{ dateError || 'Đang tải danh sách theo ngày từ máy chủ…' }}
        </p>
      </div>

      <!-- Bảng danh sách khách -->
      <div class="adm-table-wrap">
        <table class="adm-table leads-table">
          <thead>
            <tr>
              <th style="width: 130px;">Mã / Nguồn</th>
              <th style="width: 220px;">Khách Hàng &amp; Khu Vực</th>
              <th style="width: 210px;">Số Điện Thoại / Liên Hệ</th>
              <th>Nhu Cầu &amp; Ghi Chú</th>
              <th style="width: 160px;">Lịch Hẹn Thử Dàn</th>
              <th style="width: 155px;">Trạng Thái</th>
              <th class="th-right" style="width: 110px;">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lead in pagedLeads" :key="lead.id" class="lead-row">
              <!-- Cột 1: Mã Lead, nguồn và ngày -->
              <td>
                <div class="code-and-source">
                  <span class="code-text" :title="lead.id">{{ shortCode(lead.id) }}</span>
                  <span v-if="lead.id.startsWith('FB-') || (lead.note && lead.note.includes('Facebook'))" class="source-chip fb">
                    💬 FB
                  </span>
                  <span v-else class="source-chip web">
                    🌐 Web
                  </span>
                </div>
                <span class="sub-line">{{ formatLeadDate(lead.createdAt) }}</span>
              </td>

              <!-- Cột 2: Tên khách & Địa chỉ -->
              <td>
                <div class="customer-info-cell">
                  <strong class="cust-name">{{ lead.name }}</strong>
                  <span class="cust-address">
                    <span class="pin-icon">📍</span>
                    <span>{{ lead.address || 'Chưa cập nhật địa chỉ' }}</span>
                  </span>
                  <span v-if="lead.roomInfo" class="room-note" :title="lead.roomInfo">Phòng: {{ lead.roomInfo }}</span>
                </div>
              </td>

              <!-- Cột 3: Số điện thoại chuẩn & liên hệ nhanh -->
              <td>
                <div class="phone-contact-cell">
                  <div class="phone-display-row">
                    <span class="clean-phone-number">{{ formatDisplayPhone(lead.phone) }}</span>
                    <button
                      type="button"
                      class="copy-phone-btn"
                      :class="{ copied: copiedPhoneId === lead.id }"
                      @click="copyPhoneToClipboard(lead.phone, lead.id)"
                      :title="copiedPhoneId === lead.id ? 'Đã sao chép SĐT!' : 'Sao chép SĐT'"
                    >
                      <AdminIcon :name="copiedPhoneId === lead.id ? 'check' : 'copy'" :size="13" />
                      <span v-if="copiedPhoneId === lead.id" class="copied-tooltip">Đã chép</span>
                    </button>
                  </div>
                  <div class="contact-actions-row">
                    <a
                      :href="`https://zalo.me/${cleanPhone(lead.phone)}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="contact-action-btn zalo-btn"
                      title="Mở nhắn tin Zalo"
                    >
                      <AdminIcon name="message" :size="12" />
                      <span>Zalo</span>
                    </a>
                    <a
                      :href="`tel:${cleanPhone(lead.phone)}`"
                      class="contact-action-btn call-btn"
                      title="Gọi điện trực tiếp"
                    >
                      <AdminIcon name="phone" :size="12" />
                      <span>Gọi</span>
                    </a>
                  </div>
                </div>
              </td>

              <!-- Cột 4: Sản phẩm quan tâm, giá trị chốt, ghi chú sạch -->
              <td>
                <div class="interest-cell">
                  <div class="interest-header">
                    <span class="interest-badge">{{ cleanInterest(lead.interest) }}</span>
                    <strong v-if="lead.dealValue > 0" class="deal-money">
                      {{ formatCurrency(lead.dealValue) }}
                    </strong>
                  </div>
                  <p v-if="cleanLeadNote(lead.note)" class="note-clean-text" :title="cleanLeadNote(lead.note)">
                    {{ cleanLeadNote(lead.note) }}
                  </p>
                </div>
              </td>

              <!-- Cột 5: Lịch hẹn thử dàn -->
              <td>
                <div class="appointment-cell">
                  <span v-if="lead.appointmentDate" class="adm-badge adm-badge-blue">
                    <AdminIcon name="calendar" :size="12" />
                    {{ formatAppointment(lead.appointmentDate) }}
                  </span>
                  <span v-else class="adm-badge adm-badge-slate">Chưa đặt lịch</span>
                </div>
              </td>

              <!-- Cột 6: Trạng thái tư vấn -->
              <td>
                <select
                  :value="lead.status"
                  @change="handleStatusChange(lead.id, $event.target.value)"
                  :class="['adm-status-select', getStatusClass(lead.status)]"
                >
                  <option value="MOI">Mới tiếp nhận</option>
                  <option value="DA_GOI">Đã gọi tư vấn</option>
                  <option value="HEN_THU_TAI_NHA">Lịch thử tại nhà</option>
                  <option value="DA_CHOT">Đã bàn giao chốt</option>
                  <option value="HUY">Đã hủy</option>
                </select>
              </td>

              <!-- Cột 7: Thao tác hồ sơ -->
              <td>
                <div class="action-group">
                  <button
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-ghost action-btn"
                    @click="openEditModal(lead)"
                    title="Cập nhật hồ sơ & lịch hẹn"
                  >
                    <AdminIcon name="edit" :size="13" />
                    <span>Hồ sơ</span>
                  </button>
                  <button
                    v-if="isSuperAdmin"
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-danger delete-btn"
                    @click="handleDelete(lead.id)"
                    title="Xóa hồ sơ khách"
                  >
                    <AdminIcon name="trash" :size="13" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!isDateLoading && !dateError && visibleLeads.length === 0">
              <td colspan="7" class="adm-empty">
                Không có hồ sơ khách hàng nào phù hợp với bộ lọc hiện tại.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Thanh Phân Trang (Pagination Bar) Hiện Đại -->
      <div v-if="visibleLeads.length > 0" class="adm-pagination-bar">
        <div class="pagination-info">
          Hiển thị <strong>{{ paginationFrom }} - {{ paginationTo }}</strong> trong tổng số <strong>{{ visibleLeads.length }}</strong> khách hàng
        </div>

        <div class="pagination-controls">
          <button
            type="button"
            class="pg-btn pg-nav-btn"
            :disabled="currentPage === 1"
            @click="changePage(1)"
            title="Trang đầu"
          >
            «
          </button>
          <button
            type="button"
            class="pg-btn pg-nav-btn"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
            title="Trang trước"
          >
            ‹
          </button>

          <template v-for="(p, idx) in pageNumbers" :key="idx">
            <span v-if="p === '...'" class="pg-dots">…</span>
            <button
              v-else
              type="button"
              :class="['pg-btn pg-num-btn', { active: p === currentPage }]"
              @click="changePage(p)"
            >
              {{ p }}
            </button>
          </template>

          <button
            type="button"
            class="pg-btn pg-nav-btn"
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
            title="Trang tiếp"
          >
            ›
          </button>
          <button
            type="button"
            class="pg-btn pg-nav-btn"
            :disabled="currentPage === totalPages"
            @click="changePage(totalPages)"
            title="Trang cuối"
          >
            »
          </button>
        </div>

        <div class="pagination-size">
          <label for="leadPageSize">Dòng / trang:</label>
          <select id="leadPageSize" v-model.number="pageSize" class="pg-size-select">
            <option :value="15">15</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Modal Thêm Mới / Chỉnh Sửa Hồ Sơ Khách Hàng -->
    <Teleport to="body">
      <div v-if="modalOpen" class="adm-modal-backdrop" @click.self="closeModal">
        <div class="adm-modal">
          <div class="adm-modal-head">
            <div>
              <h3>{{ editingLead ? `Hồ Sơ Khách Hàng: ${editingLead.name}` : 'Ghi Nhận Khách Tư Vấn Mới' }}</h3>
              <p>Cập nhật lịch hẹn chở loa thử tại nhà, giá trị dự kiến và ghi chú âm học phòng khách</p>
            </div>
            <button type="button" class="adm-modal-close" @click="closeModal" aria-label="Đóng">
              <AdminIcon name="x" :size="18" />
            </button>
          </div>

          <form @submit.prevent="submitLeadForm">
            <div class="adm-modal-body">
              <div class="adm-form-grid">
                <div class="adm-field">
                  <label>Họ và Tên Khách Hàng <span class="required">*</span></label>
                  <input type="text" v-model="leadForm.name" required placeholder="Ví dụ: Anh Hoàng, Bác Tuấn..." />
                </div>
                <div class="adm-field">
                  <label>Số Điện Thoại / Zalo (10 chữ số) <span class="required">*</span></label>
                  <input
                    type="tel"
                    v-model="leadForm.phone"
                    required
                    pattern="^(0|\+84)[35789][0-9]{8}$"
                    placeholder="Ví dụ: 0987654321"
                  />
                </div>
              </div>

              <div class="adm-field">
                <label>Địa Chỉ Lắp Đặt / Khu Vực</label>
                <input type="text" v-model="leadForm.address" placeholder="Ví dụ: Việt Trì, Phú Thọ / Cầu Giấy, Hà Nội..." />
              </div>

              <div class="adm-field">
                <label>Sản Phẩm / Gói Dàn Quan Tâm</label>
                <input type="text" v-model="leadForm.interest" placeholder="Ví dụ: Dàn Karaoke 29 Triệu / Loa Full 30 PF 12 Pro..." />
              </div>

              <div class="adm-form-grid">
                <div class="adm-field">
                  <label>Ngày &amp; Giờ Hẹn Thử Tại Nhà</label>
                  <input type="datetime-local" v-model="leadForm.appointmentDate" />
                </div>
                <div class="adm-field">
                  <label>Giá Trị Đơn Dự Kiến / Chốt (VNĐ)</label>
                  <input type="number" min="0" v-model.number="leadForm.dealValue" placeholder="Ví dụ: 29000000" />
                </div>
              </div>

              <div class="adm-field">
                <label>Đặc Điểm Phòng Khách &amp; Âm Học</label>
                <input type="text" v-model="leadForm.roomInfo" placeholder="Ví dụ: Phòng 30m², trần thạch cao, cầu thang thông tầng..." />
              </div>

              <div class="adm-field">
                <label>Ghi Chú Kỹ Thuật &amp; Nhu Cầu Riêng</label>
                <textarea rows="3" v-model="leadForm.note" placeholder="Ví dụ: Khách thích tiếng micro nhẹ, mang kèm thêm Sub hơi 40 để thử trực tiếp..."></textarea>
              </div>
            </div>

            <div class="adm-modal-foot">
              <button type="button" class="adm-btn adm-btn-ghost" @click="closeModal">Đóng</button>
              <button type="submit" class="adm-btn adm-btn-gold" :disabled="saving">
                <AdminIcon name="check" :size="16" />
                <span>{{ saving ? 'Đang lưu...' : 'Lưu Hồ Sơ Khách Hàng' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAdminStore, isValidViMobilePhone } from '../../stores/adminStore'
import { useAuthStore } from '../../stores/authStore'
import { formatCurrency } from '../../utils/formatters'
import { exportRowsToCsv } from '../../utils/csvExport'
import AdminIcon from '../../components/admin/AdminIcon.vue'
import { useApiDateFilter } from '../../composables/useApiDateFilter'

const adminStore = useAdminStore()
const route = useRoute()
if (route.query.phone) adminStore.leadSearchKeyword = String(route.query.phone)
const authStore = useAuthStore()
const isSuperAdmin = computed(() => authStore.currentUser?.role === 'SUPER_ADMIN')
const dateFilter = useApiDateFilter('/admin/leads', computed(() => adminStore.validLeads))
const { fromDate, toDate, rows: dateRows, isActive: isDateActive, isLoading: isDateLoading, error: dateError, clearDates } = dateFilter

// Chỉ hiển thị các khách hàng có số điện thoại Việt Nam hợp lệ
const visibleLeads = computed(() => {
  let list = []
  if (isDateActive.value) {
    const keyword = adminStore.leadSearchKeyword.toLowerCase().trim()
    list = dateRows.value.filter(lead => {
      if (!isValidViMobilePhone(lead.phone)) return false
      if (adminStore.leadFilterStatus !== 'ALL' && lead.status !== adminStore.leadFilterStatus) return false
      return !keyword || [lead.name, lead.phone, lead.address, lead.interest]
        .some(value => String(value || '').toLowerCase().includes(keyword))
    })
  } else {
    list = adminStore.filteredLeads
  }
  return list.filter(l => isValidViMobilePhone(l.phone))
})

// Doanh thu từ các hợp đồng đã chốt
const closedRevenue = computed(() => {
  return visibleLeads.value
    .filter(l => l.status === 'DA_CHOT')
    .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0)
})

// Phân trang (Pagination)
const currentPage = ref(1)
const pageSize = ref(20)

const totalPages = computed(() => Math.max(1, Math.ceil(visibleLeads.value.length / pageSize.value)))

const pagedLeads = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return visibleLeads.value.slice(start, start + pageSize.value)
})

const paginationFrom = computed(() => {
  if (visibleLeads.value.length === 0) return 0
  return (currentPage.value - 1) * pageSize.value + 1
})

const paginationTo = computed(() => {
  return Math.min(currentPage.value * pageSize.value, visibleLeads.value.length)
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total]
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  }
  return [1, '...', current - 1, current, current + 1, '...', total]
})

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

// Tự động chuyển về trang 1 khi lọc thay đổi
watch([
  () => adminStore.leadSearchKeyword,
  () => adminStore.leadFilterStatus,
  fromDate,
  toDate,
  pageSize
], () => {
  currentPage.value = 1
})

// Chuẩn hóa và làm sạch số điện thoại
const cleanPhone = (phone) => {
  if (!phone) return ''
  const digits = String(phone).replace(/\D/g, '')
  return digits.startsWith('84') ? `0${digits.slice(2)}` : digits
}

const formatDisplayPhone = (phone) => {
  const p = cleanPhone(phone)
  if (!p) return '—'
  if (p.length === 10) {
    return `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}`
  }
  return p
}

// Sao chép số điện thoại
const copiedPhoneId = ref(null)
const copyPhoneToClipboard = async (phone, leadId) => {
  const raw = cleanPhone(phone)
  if (!raw) return
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(raw)
    } else {
      const el = document.createElement('textarea')
      el.value = raw
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    copiedPhoneId.value = leadId
    setTimeout(() => {
      if (copiedPhoneId.value === leadId) copiedPhoneId.value = null
    }, 2000)
  } catch {
    // fallback
  }
}

// Làm sạch ghi chú và nhu cầu (loại bỏ thông báo boilerplate của Facebook)
const cleanInterest = (interest) => {
  if (!interest) return 'Tư vấn âm thanh'
  return interest
    .replace(/^\[Nguồn:\s*[^\]]+\]\s*·?\s*/gi, '')
    .trim() || 'Tư vấn âm thanh'
}

const cleanLeadNote = (note) => {
  if (!note) return ''
  let text = String(note)
  text = text.replace(/Tin nhắn:\s*Facebook tạo đoạn chat[^·]*/gi, '')
  text = text.replace(/\[Nguồn:\s*AUTO_MATCHED\]\s*·?\s*/gi, '')
  text = text.replace(/https?:\/\/[^\s]+/gi, '')
  text = text.replace(/\s*·\s*·+/g, ' · ')
  text = text.replace(/^[\s·\-:]+|[\s·\-:]+$/g, '')
  return text.trim()
}

const parseUtcDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return value
  let str = String(value).trim()
  if (!str) return null
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(str) && !str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
    str = str.replace(' ', 'T') + 'Z'
  }
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

const formatLeadDate = (val) => {
  const d = parseUtcDate(val)
  if (!d) return val || '—'
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d)
}

const shortCode = (id) => {
  const s = String(id || '')
  if (s.startsWith('FB-')) {
    const raw = s.replace('FB-', '')
    return '#' + (raw.length > 8 ? raw.slice(0, 8).toUpperCase() : raw.toUpperCase())
  }
  return '#' + (s.length > 8 ? s.slice(0, 8).toUpperCase() : s.toUpperCase())
}

const formatAppointment = (val) => {
  if (!val) return ''
  return String(val).replace('T', ' ').slice(0, 16)
}

const getStatusClass = (status) => ({
  MOI: 'adm-status-red',
  DA_GOI: 'adm-status-yellow',
  HEN_THU_TAI_NHA: 'adm-status-blue',
  DA_CHOT: 'adm-status-green',
  HUY: 'adm-status-gray'
}[status] || '')

const handleStatusChange = async (leadId, newStatus) => {
  const lead = adminStore.leads.find(l => l.id === leadId)
  if (newStatus === 'DA_CHOT' && lead && (!lead.dealValue || Number(lead.dealValue) <= 0)) {
    openEditModal(lead)
    adminStore.showNotice('Vui lòng nhập giá trị hợp đồng/bộ dàn đã chốt để ghi nhận doanh số chính xác.', 'warning')
    return
  }
  await adminStore.updateLeadStatus(leadId, newStatus)
}

const handleDelete = async (leadId) => {
  const lead = adminStore.leads.find(l => l.id === leadId)
  const name = lead?.name ? `của khách "${lead.name}"` : 'này'
  const ok = await adminStore.confirm({
    title: 'Xóa hồ sơ khách hàng',
    message: `Anh có chắc chắn muốn xóa hồ sơ ${name} khỏi danh sách? Thao tác này sẽ xóa vĩnh viễn trên hệ thống CRM.`,
    confirmText: 'Xác nhận xóa',
    cancelText: 'Hủy bỏ',
    type: 'danger'
  })
  if (ok) {
    adminStore.deleteLead(leadId)
  }
}

const exportLeadsCsv = () => {
  exportRowsToCsv(
    `danh-sach-khach-hang-${new Date().toISOString().slice(0, 10)}.csv`,
    [
      { label: 'Mã Lead', value: r => r.id },
      { label: 'Ngày tạo', value: r => r.createdAt },
      { label: 'Họ tên', value: r => r.name },
      { label: 'Số điện thoại', value: r => cleanPhone(r.phone) },
      { label: 'Địa chỉ', value: r => r.address },
      { label: 'Sản phẩm quan tâm', value: r => r.interest },
      { label: 'Giá trị dự kiến', value: r => r.dealValue || 0 },
      { label: 'Lịch hẹn thử dàn', value: r => r.appointmentDate || '' },
      { label: 'Trạng thái', value: r => r.status },
      { label: 'Thông tin phòng', value: r => r.roomInfo || '' },
      { label: 'Ghi chú', value: r => cleanLeadNote(r.note) }
    ],
    visibleLeads.value
  )
}

// Modal Create / Edit
const modalOpen = ref(false)
const editingLead = ref(null)
const saving = ref(false)
const leadForm = ref({
  name: '',
  phone: '',
  address: '',
  interest: '',
  appointmentDate: '',
  dealValue: 0,
  roomInfo: '',
  note: ''
})

const openCreateModal = () => {
  editingLead.value = null
  leadForm.value = {
    name: '',
    phone: '',
    address: '',
    interest: 'Tư vấn cấu hình dàn Karaoke gia đình',
    appointmentDate: '',
    dealValue: 0,
    roomInfo: '',
    note: ''
  }
  modalOpen.value = true
}

const openEditModal = (lead) => {
  editingLead.value = lead
  leadForm.value = {
    name: lead.name || '',
    phone: cleanPhone(lead.phone) || '',
    address: lead.address || '',
    interest: lead.interest || '',
    appointmentDate: lead.appointmentDate ? String(lead.appointmentDate).slice(0, 16) : '',
    dealValue: Number(lead.dealValue || 0),
    roomInfo: lead.roomInfo || '',
    note: cleanLeadNote(lead.note) || ''
  }
  modalOpen.value = true
}

const closeModal = () => {
  modalOpen.value = false
  editingLead.value = null
}

const submitLeadForm = async () => {
  if (!isValidViMobilePhone(leadForm.value.phone)) {
    adminStore.showNotice('Số điện thoại không hợp lệ. Vui lòng nhập đúng số di động 10 chữ số (bắt đầu bằng 03, 05, 07, 08, 09).', 'error')
    return
  }
  saving.value = true
  try {
    if (editingLead.value) {
      await adminStore.updateLeadDetails(editingLead.value.id, { ...leadForm.value })
    } else {
      const created = await adminStore.addNewLead({
        name: leadForm.value.name,
        phone: cleanPhone(leadForm.value.phone),
        address: leadForm.value.address,
        interest: leadForm.value.interest,
        roomInfo: leadForm.value.roomInfo,
        note: leadForm.value.note,
        price: Number(leadForm.value.dealValue || 0)
      })
      if (created?.id && leadForm.value.appointmentDate) {
        await adminStore.updateLeadDetails(created.id, {
          appointmentDate: leadForm.value.appointmentDate,
          status: 'HEN_THU_TAI_NHA'
        })
      } else {
        adminStore.showNotice(`Đã ghi nhận khách hàng "${leadForm.value.name}" vào CRM.`, 'success')
      }
    }
    closeModal()
  } catch (err) {
    adminStore.showNotice(err.message || 'Không lưu được thông tin khách hàng.', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.title-with-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.live-count-pill {
  display: inline-flex;
  align-items: center;
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 0.2px;
}

.clear-search-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0 8px;
  margin-left: -28px;
  z-index: 2;
  transition: color 0.15s;
}
.clear-search-btn:hover {
  color: #0f172a;
}

.leads-card {
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  background: #ffffff;
}

.leads-table th {
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: #64748b;
  padding: 12px 14px;
  background: #f8fafc;
  border-bottom: 1.5px solid #e2e8f0;
}

.leads-table td {
  padding: 12px 14px;
  vertical-align: middle;
  border-bottom: 1px solid #f1f5f9;
}

.lead-row {
  transition: background-color 0.15s ease;
}

.lead-row:hover {
  background-color: #f8fafc;
}

.th-right {
  text-align: right;
}

/* Cột 1: Mã / Nguồn */
.code-and-source {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.code-text {
  font-family: var(--font-display, ui-monospace, monospace);
  font-size: 0.82rem;
  font-weight: 800;
  color: #1e3a8a;
  letter-spacing: 0.3px;
}

.source-chip {
  display: inline-flex;
  align-items: center;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  line-height: 1.3;
}

.source-chip.fb {
  background: #e7f3ff;
  color: #1877f2;
  border: 1px solid #cce4ff;
}

.source-chip.web {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.sub-line {
  display: block;
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 3px;
}

/* Cột 2: Khách Hàng & Địa chỉ */
.customer-info-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cust-name {
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.3;
}

.cust-address {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.74rem;
  color: #475569;
  line-height: 1.3;
}

.pin-icon {
  font-size: 0.7rem;
  flex-shrink: 0;
}

.room-note {
  display: inline-block;
  align-self: flex-start;
  margin-top: 3px;
  font-size: 0.7rem;
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 1px 6px;
  border-radius: 4px;
  max-width: 210px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Cột 3: Số Điện Thoại & Liên Hệ Nhanh */
.phone-contact-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.phone-display-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.clean-phone-number {
  font-family: var(--font-display, ui-monospace, monospace);
  font-size: 0.92rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.5px;
}

.copy-phone-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.copy-phone-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #cbd5e1;
}

.copy-phone-btn.copied {
  background: #dcfce7;
  color: #166534;
  border-color: #86efac;
}

.copied-tooltip {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  color: #fff;
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  font-weight: 600;
}

.contact-actions-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.contact-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.15s ease;
}

.zalo-btn {
  background: #0068ff;
  color: #ffffff;
  border: 1px solid #0056d6;
}

.zalo-btn:hover {
  background: #0056d6;
  box-shadow: 0 2px 6px rgba(0, 104, 255, 0.3);
}

.call-btn {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.call-btn:hover {
  background: #d1fae5;
}

/* Cột 4: Nhu Cầu & Ghi Chú Sạch */
.interest-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 320px;
}

.interest-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.interest-badge {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

.deal-money {
  display: inline-block;
  color: #dc2626;
  font-weight: 800;
  font-size: 0.8rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 1px 7px;
  border-radius: 4px;
}

.note-clean-text {
  font-size: 0.74rem;
  color: #64748b;
  line-height: 1.35;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Cột 5: Lịch hẹn thử dàn */
.appointment-cell {
  white-space: nowrap;
}

/* Cột 6: Trạng thái */
.adm-status-select {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  width: 100%;
  max-width: 145px;
}

.adm-status-red {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.adm-status-yellow {
  background: #fffbeb;
  color: #d97706;
  border-color: #fde68a;
}

.adm-status-blue {
  background: #eff6ff;
  color: #2563eb;
  border-color: #bfdbfe;
}

.adm-status-green {
  background: #f0fdf4;
  color: #16a34a;
  border-color: #bbf7d0;
}

.adm-status-gray {
  background: #f8fafc;
  color: #64748b;
  border-color: #e2e8f0;
}

/* Cột 7: Thao Tác */
.action-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
}

.action-btn {
  padding: 5px 10px;
  font-size: 0.74rem;
  font-weight: 700;
  border-radius: 6px;
}

.delete-btn {
  padding: 5px 8px;
  border-radius: 6px;
}

/* Thanh Phân Trang (Pagination Bar) */
.adm-pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-top: 1.5px solid #f1f5f9;
  background: #ffffff;
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
  gap: 16px;
  flex-wrap: wrap;
}

.pagination-info {
  font-size: 0.8rem;
  color: #64748b;
}

.pagination-info strong {
  color: #0f172a;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #334155;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pg-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #0f172a;
}

.pg-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f8fafc;
}

.pg-num-btn.active {
  background: #d4af37;
  color: #1e1e1e;
  border-color: #bfa130;
  box-shadow: 0 2px 6px rgba(212, 175, 55, 0.3);
}

.pg-dots {
  padding: 0 4px;
  color: #94a3b8;
  font-weight: 800;
}

.pagination-size {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #64748b;
}

.pg-size-select {
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font-size: 0.8rem;
  font-weight: 700;
  color: #0f172a;
  cursor: pointer;
}

.required {
  color: #ef4444;
}

@media (max-width: 900px) {
  .adm-pagination-bar {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
}
</style>
