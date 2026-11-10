<template>
  <div class="tradeins-admin-view">
    <div class="header-box">
      <div>
        <h2>Quản Lý Yêu Cầu Thu Cũ Đổi Mới</h2>
        <p class="header-sub">
          Xem ảnh thiết bị cũ khách gửi lên, định giá thu hồi hợp lý để hỗ trợ khách lên đời dàn 19tr hoặc 29tr.
        </p>
      </div>
    </div>

    <div class="panel-box">
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Ngày Gửi</th>
              <th>Khách Hàng & Zalo</th>
              <th>Ảnh Thiết Bị Cũ</th>
              <th>Tên Thiết Bị & Tình Trạng</th>
              <th>Muốn Đổi Lên</th>
              <th>Định Giá Thu Hồi (VNĐ)</th>
              <th>Trạng Thái</th>
              <th>Xóa</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in adminStore.tradeIns" :key="item.id">
              <td>
                <span class="time-sub">{{ item.createdAt }}</span>
              </td>
              <td>
                <strong class="customer-name">{{ item.customerName }}</strong>
                <a :href="`tel:${cleanPhone(item.customerPhone)}`" class="phone-link">
                  📞 {{ item.customerPhone }}
                </a>
                <a 
                  :href="`https://zalo.me/${cleanPhone(item.customerPhone)}`" 
                  target="_blank" 
                  class="zalo-link"
                >
                  💬 Nhắn Zalo
                </a>
                <span class="addr-sub">{{ item.customerAddress }}</span>
              </td>
              <td>
                <div 
                  v-if="item.oldDeviceImages" 
                  class="old-img-thumb" 
                  @click="previewImage = item.oldDeviceImages"
                  title="Bấm để phóng to ảnh"
                >
                  <img :src="item.oldDeviceImages" alt="Thiết bị cũ" />
                </div>
                <span v-else class="no-img">Không có ảnh</span>
              </td>
              <td>
                <strong class="device-name">{{ item.oldDeviceName }}</strong>
                <span class="cond-note">{{ item.conditionNote || 'Không có mô tả thêm' }}</span>
              </td>
              <td>
                <span class="upgrade-pill">{{ item.upgradeToItem }}</span>
              </td>
              <td>
                <input 
                  type="number" 
                  class="price-input" 
                  :value="item.estimatedPrice" 
                  @change="updateEstimatedPrice(item.id, $event.target.value)"
                />
              </td>
              <td>
                <select 
                  :value="item.status" 
                  @change="updateStatus(item.id, $event.target.value)"
                  :class="['status-select', getStatusClass(item.status)]"
                >
                  <option value="CHO_DINH_GIA">🟡 Chờ Định Giá</option>
                  <option value="DA_DUYET">🔵 Đã Báo Giá Khách</option>
                  <option value="DA_THU_HOI">🟢 Đã Đổi Thành Công</option>
                  <option value="HUY">⚪ Đã Hủy</option>
                </select>
              </td>
              <td>
                <button class="btn-del" @click="handleDelete(item.id)" title="Xóa">🗑️</button>
              </td>
            </tr>
            <tr v-if="adminStore.tradeIns.length === 0">
              <td colspan="8" class="text-center py-4">Chưa có yêu cầu Thu Cũ Đổi Mới nào.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal phóng to ảnh -->
    <div v-if="previewImage" class="img-modal-backdrop" @click="previewImage = null">
      <div class="img-modal-box">
        <img :src="previewImage" alt="Phóng to thiết bị cũ" />
        <p class="close-hint">Bấm ra ngoài để đóng</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAdminStore } from '../../stores/adminStore'

const adminStore = useAdminStore()
const previewImage = ref(null)

const cleanPhone = (phone) => phone ? phone.replace(/[^0-9]/g, '') : ''

const updateEstimatedPrice = (id, val) => {
  const num = parseInt(val, 10) || 0
  adminStore.updateTradeIn(id, { estimatedPrice: num })
}

const updateStatus = (id, status) => {
  adminStore.updateTradeIn(id, { status })
}

const handleDelete = (id) => {
  if (confirm('Xóa yêu cầu thu cũ đổi mới này?')) {
    adminStore.deleteTradeIn(id)
  }
}

const getStatusClass = (status) => {
  switch (status) {
    case 'CHO_DINH_GIA': return 'status-yellow'
    case 'DA_DUYET': return 'status-blue'
    case 'DA_THU_HOI': return 'status-green'
    case 'HUY': return 'status-gray'
    default: return ''
  }
}
</script>

<style scoped>
.tradeins-admin-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-box {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 20px 24px;
  border-radius: var(--radius-md);
}

.header-box h2 {
  font-size: 1.4rem;
  color: #fff;
  margin-bottom: 4px;
}

.header-sub {
  font-size: 0.88rem;
  color: #94a3b8;
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
  font-size: 0.86rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.time-sub {
  font-size: 0.75rem;
  color: #64748b;
}

.customer-name {
  display: block;
  color: #fff;
}

.phone-link {
  display: block;
  color: #60a5fa;
  font-weight: 700;
  font-size: 0.82rem;
}

.zalo-link {
  display: inline-block;
  color: #38bdf8;
  font-size: 0.76rem;
  text-decoration: underline;
  margin: 2px 0;
}

.addr-sub {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
}

.old-img-thumb {
  width: 64px;
  height: 64px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  cursor: pointer;
}

.old-img-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-img {
  font-size: 0.75rem;
  color: #64748b;
}

.device-name {
  display: block;
  color: #f1f5f9;
}

.cond-note {
  display: block;
  font-size: 0.76rem;
  color: #94a3b8;
  max-width: 220px;
}

.upgrade-pill {
  font-size: 0.78rem;
  background: rgba(252, 183, 40, 0.12);
  color: var(--color-primary);
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.price-input {
  width: 130px;
  padding: 7px 10px;
  background: var(--bg-dark-900);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--color-primary);
  font-weight: 800;
  font-size: 0.88rem;
  outline: none;
}

.price-input:focus {
  border-color: var(--color-primary);
}

.status-select {
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 700;
  border: 1px solid transparent;
  outline: none;
}

.status-yellow { background: rgba(234, 179, 8, 0.2); color: #facc15; }
.status-blue { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.status-green { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.status-gray { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }

.btn-del {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  padding: 6px 10px;
  border-radius: 4px;
}

.py-4 { padding: 32px 0; }
.text-center { text-align: center; }

.img-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.img-modal-box img {
  max-width: 90vw;
  max-height: 80vh;
  border-radius: 10px;
  border: 2px solid var(--color-primary);
}

.close-hint {
  text-align: center;
  color: #94a3b8;
  font-size: 0.85rem;
  margin-top: 10px;
}
</style>
