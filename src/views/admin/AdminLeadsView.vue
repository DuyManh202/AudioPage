<template>
  <div class="adm-page">
    <!-- Đầu trang CRM Khách Hàng -->
    <div class="adm-page-head">
      <div>
        <h1 class="adm-page-title">Khách Tư Vấn &amp; Lịch Hẹn Thử Dàn</h1>
        <p class="adm-page-sub">
          Quản lý phễu khách hàng đăng ký tư vấn từ Website, Zalo và Hotline — ghi chú đặc điểm phòng khách và hẹn lịch chở dàn thử tận nhà.
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
          <span class="adm-kpi-value">{{ adminStore.leads.length }} khách</span>
          <span class="adm-kpi-meta">Toàn bộ danh sách CRM</span>
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
    <div class="adm-card">
      <div class="adm-toolbar">
        <div class="adm-toolbar-row">
          <div class="adm-search-box">
            <AdminIcon name="search" :size="16" class="search-ico" />
            <input
              type="text"
              v-model="adminStore.leadSearchKeyword"
              placeholder="Tìm tên khách, số điện thoại, khu vực, sản phẩm quan tâm..."
            />
          </div>

          <div class="adm-tabs">
            <button
              v-for="f in filterOptions"
              :key="f.key"
              type="button"
              :class="['adm-tab', { active: adminStore.leadFilterStatus === f.key }]"
              @click="adminStore.leadFilterStatus = f.key"
            >
              {{ f.label }}
              <span class="adm-tab-count">{{ f.count }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>Mã / Thời Gian</th>
              <th>Khách Hàng &amp; Khu Vực</th>
              <th>Liên Hệ Nhanh</th>
              <th>Sản Phẩm Quan Tâm</th>
              <th>Lịch Hẹn Thử Dàn</th>
              <th>Trạng Thái Chăm Sóc</th>
              <th class="th-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lead in adminStore.filteredLeads" :key="lead.id">
              <td>
                <strong class="code-text" :title="lead.id">{{ shortCode(lead.id) }}</strong>
                <span class="sub-line">{{ lead.createdAt }}</span>
              </td>

              <td>
                <strong class="cust-name">{{ lead.name }}</strong>
                <span class="sub-line">{{ lead.address || 'Chưa cập nhật địa chỉ' }}</span>
                <span v-if="lead.roomInfo" class="room-note">Phòng: {{ lead.roomInfo }}</span>
              </td>

              <td>
                <div class="adm-contact-row">
                  <a :href="`tel:${cleanPhone(lead.phone)}`" class="adm-contact-chip">
                    <AdminIcon name="phone" :size="12" />
                    {{ lead.phone }}
                  </a>
                  <a
                    :href="`https://zalo.me/${cleanPhone(lead.phone)}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="adm-contact-chip zalo"
                  >
                    <AdminIcon name="message" :size="12" />
                    Zalo
                  </a>
                </div>
              </td>

              <td>
                <span class="interest-text">{{ lead.interest }}</span>
                <strong v-if="lead.dealValue > 0" class="deal-money">
                  {{ formatCurrency(lead.dealValue) }}
                </strong>
                <span v-if="lead.note" class="note-preview">{{ lead.note }}</span>
              </td>

              <td>
                <span v-if="lead.appointmentDate" class="adm-badge adm-badge-blue">
                  <AdminIcon name="calendar" :size="12" />
                  {{ formatAppointment(lead.appointmentDate) }}
                </span>
                <span v-else class="adm-badge adm-badge-slate">Chưa đặt lịch</span>
              </td>

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

              <td>
                <div class="action-group">
                  <button
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-ghost"
                    @click="openEditModal(lead)"
                    title="Cập nhật hồ sơ & lịch hẹn"
                  >
                    <AdminIcon name="edit" :size="14" />
                    <span>Hồ sơ</span>
                  </button>
                  <button
                    v-if="isSuperAdmin"
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-danger"
                    @click="handleDelete(lead.id)"
                    title="Xóa hồ sơ"
                  >
                    <AdminIcon name="trash" :size="14" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="adminStore.filteredLeads.length === 0">
              <td colspan="7" class="adm-empty">
                Không có hồ sơ khách hàng nào phù hợp với bộ lọc hiện tại.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Thêm Mới / Chỉnh Sửa Hồ Sơ Khách Hàng -->
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
                <label>Họ và Tên Khách Hàng</label>
                <input type="text" v-model="leadForm.name" required placeholder="Ví dụ: Anh Hoàng, Bác Tuấn..." />
              </div>
              <div class="adm-field">
                <label>Số Điện Thoại / Zalo</label>
                <input type="tel" v-model="leadForm.phone" required placeholder="Ví dụ: 0987654321" />
              </div>
            </div>

            <div class="adm-field">
              <label>Địa Chỉ Lắp Đặt / Khu Vực</label>
              <input type="text" v-model="leadForm.address" required placeholder="Ví dụ: Việt Trì, Phú Thọ / Cầu Giấy, Hà Nội..." />
            </div>

            <div class="adm-field">
              <label>Sản Phẩm / Gói Dàn Quan Tâm</label>
              <input type="text" v-model="leadForm.interest" required placeholder="Ví dụ: Dàn Karaoke 29 Triệu / Loa Full 30 PF 12 Pro..." />
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import { useAuthStore } from '../../stores/authStore'
import { formatCurrency } from '../../utils/formatters'
import { exportRowsToCsv } from '../../utils/csvExport'
import AdminIcon from '../../components/admin/AdminIcon.vue'

const adminStore = useAdminStore()
const authStore = useAuthStore()
const isSuperAdmin = computed(() => authStore.currentUser?.role === 'SUPER_ADMIN')

const closedRevenue = computed(() => {
  return adminStore.leads
    .filter(l => l.status === 'DA_CHOT')
    .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0)
})

const filterOptions = computed(() => [
  { key: 'ALL', label: 'Tất Cả', count: adminStore.leads.length },
  { key: 'MOI', label: 'Mới Tiếp Nhận', count: adminStore.leads.filter(l => l.status === 'MOI').length },
  { key: 'DA_GOI', label: 'Đã Gọi Điện', count: adminStore.leads.filter(l => l.status === 'DA_GOI').length },
  { key: 'HEN_THU_TAI_NHA', label: 'Lịch Thử Tại Nhà', count: adminStore.leads.filter(l => l.status === 'HEN_THU_TAI_NHA').length },
  { key: 'DA_CHOT', label: 'Đã Bàn Giao', count: adminStore.leads.filter(l => l.status === 'DA_CHOT').length },
  { key: 'HUY', label: 'Đã Hủy', count: adminStore.leads.filter(l => l.status === 'HUY').length }
])

const cleanPhone = (phone) => (phone ? String(phone).replace(/[^0-9]/g, '') : '')

const shortCode = (id) => {
  const s = String(id || '')
  return s.length > 14 ? s.slice(0, 11).toUpperCase() : s
}

const formatAppointment = (val) => {
  if (!val) return ''
  return String(val).replace('T', ' ')
}

const getStatusClass = (status) => ({
  MOI: 'adm-status-red',
  DA_GOI: 'adm-status-yellow',
  HEN_THU_TAI_NHA: 'adm-status-blue',
  DA_CHOT: 'adm-status-green',
  HUY: 'adm-status-gray'
}[status] || '')

const handleStatusChange = (leadId, newStatus) => {
  adminStore.updateLeadStatus(leadId, newStatus)
}

const handleDelete = (leadId) => {
  if (confirm('Anh có chắc chắn muốn xóa hồ sơ khách hàng này khỏi danh sách?')) {
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
      { label: 'Số điện thoại', value: r => r.phone },
      { label: 'Địa chỉ', value: r => r.address },
      { label: 'Sản phẩm quan tâm', value: r => r.interest },
      { label: 'Giá trị dự kiến', value: r => r.dealValue || 0 },
      { label: 'Lịch hẹn thử dàn', value: r => r.appointmentDate || '' },
      { label: 'Trạng thái', value: r => r.status },
      { label: 'Thông tin phòng', value: r => r.roomInfo || '' },
      { label: 'Ghi chú', value: r => r.note || '' }
    ],
    adminStore.filteredLeads
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
    phone: lead.phone || '',
    address: lead.address || '',
    interest: lead.interest || '',
    appointmentDate: lead.appointmentDate || '',
    dealValue: Number(lead.dealValue || 0),
    roomInfo: lead.roomInfo || '',
    note: lead.note || ''
  }
  modalOpen.value = true
}

const closeModal = () => {
  modalOpen.value = false
  editingLead.value = null
}

const submitLeadForm = async () => {
  saving.value = true
  try {
    if (editingLead.value) {
      await adminStore.updateLeadDetails(editingLead.value.id, { ...leadForm.value })
    } else {
      const created = await adminStore.addNewLead({
        name: leadForm.value.name,
        phone: leadForm.value.phone,
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
.th-right {
  text-align: right;
}

.code-text {
  display: block;
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: #fcb728;
}

.sub-line {
  display: block;
  font-size: 0.73rem;
  color: #64748b;
  margin-top: 2px;
}

.cust-name {
  display: block;
  color: #f8fafc;
  font-size: 0.86rem;
}

.room-note {
  display: inline-block;
  margin-top: 3px;
  font-size: 0.72rem;
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.1);
  padding: 1px 7px;
  border-radius: 4px;
}

.interest-text {
  display: block;
  font-weight: 600;
  color: #e2e8f0;
  font-size: 0.83rem;
}

.deal-money {
  display: block;
  color: #fcb728;
  font-size: 0.8rem;
  margin-top: 2px;
}

.note-preview {
  display: block;
  font-size: 0.73rem;
  color: #94a3b8;
  margin-top: 2px;
  max-width: 240px;
}

.action-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  white-space: nowrap;
}
</style>
