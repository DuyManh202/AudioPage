<template>
  <div class="leads-view">
    <!-- Thanh điều khiển & Lọc -->
    <div class="leads-toolbar">
      <div class="search-input-wrap">
        <input 
          type="text" 
          v-model="adminStore.leadSearchKeyword" 
          placeholder="Tìm theo tên khách, số điện thoại, địa chỉ, dàn quan tâm..."
        />
      </div>

      <div class="status-filters">
        <button 
          v-for="f in filterOptions" 
          :key="f.key"
          :class="['filter-chip', { active: adminStore.leadFilterStatus === f.key }]"
          @click="adminStore.leadFilterStatus = f.key"
        >
          {{ f.label }}
          <span v-if="f.count > 0" class="chip-count">({{ f.count }})</span>
        </button>
      </div>
    </div>

    <!-- Danh Sách Khách Hàng -->
    <div class="panel-box">
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mã / Ngày Tạo</th>
              <th>Khách Hàng</th>
              <th>Số Điện Thoại</th>
              <th>Địa Chỉ & Khu Vực</th>
              <th>Sản Phẩm Quan Tâm</th>
              <th>Lịch Hẹn Thử Dàn</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lead in adminStore.filteredLeads" :key="lead.id">
              <td>
                <span class="lead-code">{{ lead.id }}</span>
                <span class="lead-time">{{ lead.createdAt }}</span>
              </td>
              <td>
                <strong class="customer-name">{{ lead.name }}</strong>
                <span class="room-hint" v-if="lead.roomInfo">{{ lead.roomInfo }}</span>
              </td>
              <td>
                <div class="phone-actions">
                  <a :href="`tel:${cleanPhone(lead.phone)}`" class="phone-link">
                    📞 {{ lead.phone }}
                  </a>
                  <a 
                    :href="`https://zalo.me/${cleanPhone(lead.phone)}`" 
                    target="_blank" 
                    class="zalo-link"
                    title="Nhắn tin Zalo"
                  >
                    💬 Zalo
                  </a>
                </div>
              </td>
              <td>{{ lead.address }}</td>
              <td>
                <span class="interest-badge">{{ lead.interest }}</span>
                <span v-if="lead.dealValue > 0" class="deal-val">
                  {{ formatCurrency(lead.dealValue) }}
                </span>
              </td>
              <td>
                <span v-if="lead.appointmentDate" class="appointment-pill">
                  📅 {{ lead.appointmentDate }}
                </span>
                <span v-else class="text-muted">Chưa hẹn</span>
              </td>
              <td>
                <select 
                  :value="lead.status" 
                  @change="handleStatusChange(lead.id, $event.target.value)"
                  :class="['status-select', getStatusClass(lead.status)]"
                >
                  <option value="MOI">🔴 Mới Tiếp Nhận</option>
                  <option value="DA_GOI">🟡 Đã Gọi Điện</option>
                  <option value="HEN_THU_TAI_NHA">🔵 Lên Lịch Thử Dàn</option>
                  <option value="DA_CHOT">🟢 Đã Bàn Giao Chốt</option>
                  <option value="HUY">⚪ Đã Hủy</option>
                </select>
              </td>
              <td>
                <div class="row-actions">
                  <button class="btn-icon" @click="openEditModal(lead)" title="Sửa chi tiết">
                    ✏️
                  </button>
                  <button class="btn-icon text-red" @click="handleDelete(lead.id)" title="Xóa">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="adminStore.filteredLeads.length === 0">
              <td colspan="8" class="text-center py-4">
                Không có yêu cầu nào phù hợp với bộ lọc.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Chỉnh Sửa Chi Tiết Lead -->
    <div v-if="editingLead" class="modal-backdrop" @click.self="closeEditModal">
      <div class="modal-window">
        <button class="close-x" @click="closeEditModal">&times;</button>
        <div class="modal-header">
          <h3>Chi Tiết Khách Hàng {{ editingLead.name }} ({{ editingLead.id }})</h3>
          <p class="modal-sub">Cập nhật lịch hẹn thử loa tận nhà và ghi chú âm học</p>
        </div>

        <form @submit.prevent="saveLeadDetails" class="modal-form">
          <div class="form-row">
            <div class="form-group flex-1">
              <label>Họ Tên:</label>
              <input type="text" v-model="editForm.name" required />
            </div>
            <div class="form-group flex-1">
              <label>Số Điện Thoại:</label>
              <input type="text" v-model="editForm.phone" required />
            </div>
          </div>

          <div class="form-group">
            <label>Địa Chỉ Lắp Đặt / Thử Dàn:</label>
            <input type="text" v-model="editForm.address" required />
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Ngày & Giờ Hẹn Thử Tại Nhà:</label>
              <input type="datetime-local" v-model="editForm.appointmentDate" />
            </div>
            <div class="form-group flex-1">
              <label>Giá Trị Đơn Hàng (VNĐ):</label>
              <input type="number" v-model.number="editForm.dealValue" />
            </div>
          </div>

          <div class="form-group">
            <label>Đặc Điểm Phòng Khách & Âm Học:</label>
            <input type="text" v-model="editForm.roomInfo" placeholder="Ví dụ: Phòng 30m2, trần cao 3.5m, cầu thang hở..." />
          </div>

          <div class="form-group">
            <label>Ghi Chú Kỹ Thuật & Yêu Cầu Riêng Của Bác Khách:</label>
            <textarea rows="3" v-model="editForm.note" placeholder="Ví dụ: Bác thích dải trầm dày, mang thêm 1 sub hơi 40 qua thử..."></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-outline" @click="closeEditModal">Đóng</button>
            <button type="submit" class="btn-primary">Lưu Thông Tin</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import { formatCurrency } from '../../utils/formatters'

const adminStore = useAdminStore()

const filterOptions = computed(() => [
  { key: 'ALL', label: 'Tất Cả', count: adminStore.leads.length },
  { key: 'MOI', label: '🔴 Mới Tiếp Nhận', count: adminStore.leads.filter(l => l.status === 'MOI').length },
  { key: 'DA_GOI', label: '🟡 Đã Gọi Điện', count: adminStore.leads.filter(l => l.status === 'DA_GOI').length },
  { key: 'HEN_THU_TAI_NHA', label: '🔵 Lịch Thử Tại Nhà', count: adminStore.leads.filter(l => l.status === 'HEN_THU_TAI_NHA').length },
  { key: 'DA_CHOT', label: '🟢 Đã Bàn Giao', count: adminStore.leads.filter(l => l.status === 'DA_CHOT').length },
  { key: 'HUY', label: '⚪ Đã Hủy', count: adminStore.leads.filter(l => l.status === 'HUY').length }
])

const cleanPhone = (phone) => {
  return phone ? phone.replace(/[^0-9]/g, '') : ''
}

const getStatusClass = (status) => {
  switch (status) {
    case 'MOI': return 'status-red'
    case 'DA_GOI': return 'status-yellow'
    case 'HEN_THU_TAI_NHA': return 'status-blue'
    case 'DA_CHOT': return 'status-green'
    case 'HUY': return 'status-gray'
    default: return ''
  }
}

const handleStatusChange = (leadId, newStatus) => {
  adminStore.updateLeadStatus(leadId, newStatus)
}

const handleDelete = (leadId) => {
  if (confirm('Bác có chắc chắn muốn xóa khách hàng này khỏi danh sách?')) {
    adminStore.deleteLead(leadId)
  }
}

// Modal chỉnh sửa chi tiết
const editingLead = ref(null)
const editForm = ref({
  name: '',
  phone: '',
  address: '',
  appointmentDate: '',
  dealValue: 0,
  roomInfo: '',
  note: ''
})

const openEditModal = (lead) => {
  editingLead.value = lead
  editForm.value = {
    name: lead.name,
    phone: lead.phone,
    address: lead.address,
    appointmentDate: lead.appointmentDate || '',
    dealValue: lead.dealValue || 0,
    roomInfo: lead.roomInfo || '',
    note: lead.note || ''
  }
}

const closeEditModal = () => {
  editingLead.value = null
}

const saveLeadDetails = () => {
  if (editingLead.value) {
    adminStore.updateLeadDetails(editingLead.value.id, editForm.value)
    closeEditModal()
  }
}
</script>

<style scoped>
.leads-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.leads-toolbar {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--bg-card);
  padding: 18px 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.search-input-wrap input {
  width: 100%;
  padding: 10px 16px;
  background: var(--bg-dark-900);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 0.9rem;
  outline: none;
}

.search-input-wrap input:focus {
  border-color: var(--color-primary);
}

.status-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chip {
  background: var(--bg-dark-900);
  border: 1px solid var(--border-color);
  color: #cbd5e1;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;
}

.filter-chip:hover {
  border-color: var(--color-primary);
  color: #fff;
}

.filter-chip.active {
  background: rgba(252, 183, 40, 0.15);
  border-color: var(--color-primary);
  color: var(--color-primary);
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

.lead-code {
  display: block;
  font-weight: 800;
  color: var(--color-primary);
  font-size: 0.82rem;
}

.lead-time {
  font-size: 0.72rem;
  color: #64748b;
}

.customer-name {
  display: block;
  color: #fff;
}

.room-hint {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
}

.phone-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.phone-link {
  color: #60a5fa;
  font-weight: 700;
  font-size: 0.85rem;
}

.zalo-link {
  color: #38bdf8;
  font-size: 0.78rem;
  text-decoration: underline;
}

.interest-badge {
  display: block;
  font-weight: 600;
  color: #f1f5f9;
  font-size: 0.84rem;
}

.deal-val {
  display: block;
  color: var(--color-primary);
  font-weight: 800;
  font-size: 0.8rem;
}

.appointment-pill {
  font-size: 0.8rem;
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.text-muted {
  color: #64748b;
  font-size: 0.8rem;
}

.status-select {
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 700;
  border: 1px solid transparent;
  outline: none;
  cursor: pointer;
}

.status-red { background: rgba(239, 68, 68, 0.2); color: #f87171; border-color: rgba(239, 68, 68, 0.4); }
.status-yellow { background: rgba(234, 179, 8, 0.2); color: #facc15; border-color: rgba(234, 179, 8, 0.4); }
.status-blue { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border-color: rgba(59, 130, 246, 0.4); }
.status-green { background: rgba(34, 197, 94, 0.2); color: #4ade80; border-color: rgba(34, 197, 94, 0.4); }
.status-gray { background: rgba(148, 163, 184, 0.2); color: #94a3b8; border-color: rgba(148, 163, 184, 0.4); }

.row-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.1);
}

.text-red:hover {
  background: rgba(239, 68, 68, 0.2);
}

.py-4 { padding: 32px 0; }
.text-center { text-align: center; }

/* Modal */
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

.modal-window {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  max-width: 600px;
  width: 100%;
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
  font-size: 1.25rem;
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
  gap: 14px;
}

.form-row {
  display: flex;
  gap: 14px;
}

.flex-1 { flex: 1; }

.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #cbd5e1;
  margin-bottom: 4px;
}

.form-group input, .form-group textarea {
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

.form-group input:focus, .form-group textarea:focus {
  border-color: var(--color-primary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 10px;
}
</style>
