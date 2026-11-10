<template>
  <div class="orders-admin-view">
    <div class="header-box">
      <div>
        <h2>Quản Lý Đơn Đặt Mua Lẻ Thiết Bị (Giỏ Hàng)</h2>
        <p class="header-sub">
          Theo dõi các đơn hàng thiết bị lẻ khách đặt trực tiếp qua giỏ hàng để đóng gói, cài sẵn vang số và giao vận chuyển.
        </p>
      </div>
    </div>

    <div class="panel-box">
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mã Đơn / Ngày</th>
              <th>Khách Hàng & Địa Chỉ</th>
              <th>Thiết Bị Đặt Mua</th>
              <th>Tổng Tiền</th>
              <th>Thanh Toán</th>
              <th>Trạng Thái</th>
              <th>Xóa</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ord in adminStore.orders" :key="ord.id">
              <td>
                <span class="order-id">{{ ord.id }}</span>
                <span class="time-sub">{{ ord.createdAt }}</span>
              </td>
              <td>
                <strong class="customer-name">{{ ord.customerName }}</strong>
                <a :href="`tel:${cleanPhone(ord.customerPhone)}`" class="phone-link">
                  📞 {{ ord.customerPhone }}
                </a>
                <span class="addr-sub">📍 {{ ord.shippingAddress }}</span>
                <span v-if="ord.note" class="note-sub">📝 {{ ord.note }}</span>
              </td>
              <td>
                <ul class="items-list">
                  <li v-for="(it, idx) in ord.items" :key="idx">
                    <strong>{{ it.quantity }}x</strong> {{ it.name }}
                  </li>
                </ul>
              </td>
              <td>
                <span class="total-price">{{ formatCurrency(ord.totalAmount) }}</span>
              </td>
              <td>
                <span class="pay-tag">{{ ord.paymentMethod === 'COD' ? 'Thu hộ (COD)' : 'Chuyển khoản' }}</span>
              </td>
              <td>
                <select 
                  :value="ord.status" 
                  @change="updateStatus(ord.id, $event.target.value)"
                  :class="['status-select', getStatusClass(ord.status)]"
                >
                  <option value="MOI">🔴 Đơn Mới</option>
                  <option value="DA_XAC_NHAN">🟡 Đã Xác Nhận</option>
                  <option value="DANG_GIAO">🔵 Đang Vận Chuyển</option>
                  <option value="HOAN_THANH">🟢 Đã Giao Thành Công</option>
                  <option value="HUY">⚪ Đã Hủy</option>
                </select>
              </td>
              <td>
                <button v-if="authStore.currentUser.role === 'SUPER_ADMIN'" class="btn-del" @click="handleDelete(ord.id)" title="Xóa">🗑️</button>
              </td>
            </tr>
            <tr v-if="adminStore.orders.length === 0">
              <td colspan="7" class="text-center py-4">Chưa có đơn đặt mua lẻ nào.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAdminStore } from '../../stores/adminStore'
import { useAuthStore } from '../../stores/authStore'
import { formatCurrency } from '../../utils/formatters'

const adminStore = useAdminStore()
const authStore = useAuthStore()

const cleanPhone = (phone) => phone ? phone.replace(/[^0-9]/g, '') : ''

const updateStatus = (id, status) => {
  adminStore.updateOrderStatus(id, status)
}

const handleDelete = (id) => {
  if (confirm('Xóa đơn hàng này?')) {
    adminStore.deleteOrder(id)
  }
}

const getStatusClass = (status) => {
  switch (status) {
    case 'MOI': return 'status-red'
    case 'DA_XAC_NHAN': return 'status-yellow'
    case 'DANG_GIAO': return 'status-blue'
    case 'HOAN_THANH': return 'status-green'
    case 'HUY': return 'status-gray'
    default: return ''
  }
}
</script>

<style scoped>
.orders-admin-view {
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

.order-id {
  display: block;
  font-weight: 800;
  color: var(--color-primary);
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

.addr-sub {
  display: block;
  font-size: 0.76rem;
  color: #cbd5e1;
}

.note-sub {
  display: block;
  font-size: 0.75rem;
  color: #fbbf24;
  margin-top: 2px;
}

.items-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.82rem;
  color: #f1f5f9;
}

.total-price {
  font-weight: 900;
  color: var(--color-primary);
  font-size: 0.95rem;
}

.pay-tag {
  font-size: 0.76rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 3px 8px;
  border-radius: 4px;
  color: #cbd5e1;
}

.status-select {
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 700;
  border: 1px solid transparent;
  outline: none;
}

.status-red { background: rgba(239, 68, 68, 0.2); color: #f87171; }
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
</style>
