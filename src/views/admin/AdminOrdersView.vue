<template>
  <div class="adm-page">
    <!-- Đầu trang Đơn Đặt Mua Lẻ -->
    <div class="adm-page-head">
      <div>
        <h1 class="adm-page-title">Quản Lý Đơn Đặt Mua Lẻ (Giỏ Hàng)</h1>
        <p class="adm-page-sub">
          Theo dõi đơn hàng thiết bị lẻ đặt qua Website, kiểm tra thanh toán COD / VietQR, cài sẵn cấu hình vang số và in phiếu giao vận.
        </p>
      </div>
      <div class="adm-head-actions">
        <button type="button" class="adm-btn adm-btn-export" @click="exportOrdersCsv">
          <AdminIcon name="download" :size="15" />
          <span>Xuất Excel (CSV)</span>
        </button>
      </div>
    </div>

    <!-- 4 Chỉ Số KPI Đơn Hàng -->
    <div class="adm-kpi-grid">
      <div
        :class="['adm-kpi-card clickable', { 'active-kpi': statusFilter === 'ALL' }]"
        @click="statusFilter = 'ALL'"
      >
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Tổng Đơn Giỏ Hàng</span>
          <span class="adm-kpi-value">{{ adminStore.orders.length }} đơn</span>
          <span class="adm-kpi-meta">Tổng giá trị: <strong>{{ formatCurrency(allOrdersValue) }}</strong></span>
        </div>
        <div class="adm-kpi-icon tone-blue">
          <AdminIcon name="orders" :size="20" />
        </div>
      </div>

      <div
        :class="['adm-kpi-card clickable', { 'active-kpi': statusFilter === 'MOI' }]"
        @click="statusFilter = 'MOI'"
      >
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Đơn Mới Chờ Duyệt</span>
          <span class="adm-kpi-value">{{ adminStore.newOrdersCount }} đơn</span>
          <span class="adm-kpi-meta">Cần gọi xác nhận địa chỉ nhận</span>
        </div>
        <div class="adm-kpi-icon tone-red">
          <AdminIcon name="bell" :size="20" />
        </div>
      </div>

      <div
        :class="['adm-kpi-card clickable', { 'active-kpi': statusFilter === 'DANG_GIAO' }]"
        @click="statusFilter = 'DANG_GIAO'"
      >
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Đang Đóng Gói / Giao</span>
          <span class="adm-kpi-value">{{ shippingCount }} đơn</span>
          <span class="adm-kpi-meta">Bao gồm đã xác nhận &amp; đang giao</span>
        </div>
        <div class="adm-kpi-icon tone-gold">
          <AdminIcon name="calendar" :size="20" />
        </div>
      </div>

      <div
        :class="['adm-kpi-card clickable', { 'active-kpi': statusFilter === 'HOAN_THANH' }]"
        @click="statusFilter = 'HOAN_THANH'"
      >
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Đơn Đã Hoàn Thành</span>
          <span class="adm-kpi-value">{{ adminStore.completedOrdersCount }} đơn</span>
          <span class="adm-kpi-meta">Thực thu: <strong>{{ formatCurrency(completedRevenue) }}</strong></span>
        </div>
        <div class="adm-kpi-icon tone-green">
          <AdminIcon name="check" :size="20" />
        </div>
      </div>
    </div>

    <!-- Bảng Đơn Hàng & Bộ Lọc -->
    <div class="adm-card">
      <div class="adm-toolbar">
        <div class="adm-toolbar-row">
          <div class="adm-search-box">
            <AdminIcon name="search" :size="16" class="search-ico" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Tìm mã đơn, tên khách, số điện thoại, tên thiết bị..."
            />
          </div>

          <select v-model="paymentFilter" class="adm-select-filter">
            <option value="ALL">Mọi hình thức thanh toán</option>
            <option value="COD">Thu hộ khi nhận (COD)</option>
            <option value="BANK">Chuyển khoản VietQR</option>
          </select>

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
      </div>

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>Mã Đơn / Ngày Đặt</th>
              <th>Khách Nhận &amp; Địa Chỉ</th>
              <th>Thiết Bị Đặt Mua</th>
              <th>Tổng Thanh Toán</th>
              <th>Hình Thức</th>
              <th>Trạng Thái Đơn</th>
              <th class="th-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ord in filteredOrders" :key="ord.id">
              <td>
                <strong class="ord-code">{{ ord.id }}</strong>
                <span class="sub-line">{{ ord.createdAt }}</span>
              </td>

              <td>
                <strong class="cust-name">{{ ord.customerName }}</strong>
                <div class="adm-contact-row">
                  <a :href="`tel:${cleanPhone(ord.customerPhone)}`" class="adm-contact-chip">
                    <AdminIcon name="phone" :size="12" />
                    {{ ord.customerPhone }}
                  </a>
                  <a
                    :href="`https://zalo.me/${cleanPhone(ord.customerPhone)}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="adm-contact-chip zalo"
                  >
                    Zalo
                  </a>
                </div>
                <span class="addr-text">{{ ord.shippingAddress }}</span>
                <span v-if="ord.note" class="note-chip">Ghi chú: {{ ord.note }}</span>
              </td>

              <td>
                <ul class="item-lines">
                  <li v-for="(it, idx) in ord.items" :key="idx">
                    <span class="qty-pill">{{ it.quantity }}x</span>
                    <span>{{ it.name }}</span>
                  </li>
                </ul>
              </td>

              <td>
                <strong class="ord-total">{{ formatCurrency(ord.totalAmount) }}</strong>
              </td>

              <td>
                <span :class="['adm-badge', ord.paymentMethod === 'COD' ? 'adm-badge-gold' : 'adm-badge-blue']">
                  {{ ord.paymentMethod === 'COD' ? 'Thu hộ COD' : 'VietQR CK' }}
                </span>
              </td>

              <td>
                <select
                  :value="ord.status"
                  @change="updateStatus(ord.id, $event.target.value)"
                  :class="['adm-status-select', getStatusClass(ord.status)]"
                >
                  <option value="MOI">Đơn mới</option>
                  <option value="DA_XAC_NHAN">Đã xác nhận</option>
                  <option value="DANG_GIAO">Đang vận chuyển</option>
                  <option value="HOAN_THANH">Đã giao thành công</option>
                  <option value="HUY">Đã hủy</option>
                </select>
              </td>

              <td>
                <div class="action-group">
                  <button
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-ghost"
                    @click="selectedOrder = ord"
                    title="Xem chi tiết & in phiếu giao hàng"
                  >
                    <AdminIcon name="printer" :size="14" />
                    <span>Phiếu đơn</span>
                  </button>
                  <button
                    v-if="isSuperAdmin"
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-danger"
                    @click="handleDelete(ord.id)"
                    title="Xóa đơn hàng"
                  >
                    <AdminIcon name="trash" :size="14" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredOrders.length === 0">
              <td colspan="7" class="adm-empty">
                Không tìm thấy đơn đặt mua lẻ nào phù hợp với bộ lọc.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Xem Chi Tiết & In Phiếu Xuất Kho / Giao Hàng -->
    <div v-if="selectedOrder" class="adm-modal-backdrop" @click.self="selectedOrder = null">
      <div class="adm-modal invoice-modal">
        <div class="adm-modal-head no-print">
          <div>
            <h3>Phiếu Đơn Hàng: {{ selectedOrder.id }}</h3>
            <p>Kiểm tra danh mục thiết bị đóng gói và in phiếu xuất kho kèm kiện hàng</p>
          </div>
          <button type="button" class="adm-modal-close" @click="selectedOrder = null">
            <AdminIcon name="x" :size="18" />
          </button>
        </div>

        <div class="adm-modal-body printable-slip">
          <div class="slip-header">
            <div>
              <strong class="slip-brand">TÚ AUDIO — ÂM THANH KARAOKE CHUYÊN NGHIỆP</strong>
              <span>Showroom Phú Thọ • Hotline kỹ thuật &amp; bảo hành: 0971.356.791</span>
            </div>
            <div class="slip-meta">
              <strong>PHIẾU GIAO THIẾT BỊ</strong>
              <span>Mã đơn: {{ selectedOrder.id }}</span>
              <span>Ngày đặt: {{ selectedOrder.createdAt }}</span>
            </div>
          </div>

          <div class="slip-customer">
            <div><strong>Người nhận:</strong> {{ selectedOrder.customerName }}</div>
            <div><strong>Điện thoại:</strong> {{ selectedOrder.customerPhone }}</div>
            <div><strong>Địa chỉ giao:</strong> {{ selectedOrder.shippingAddress }}</div>
            <div>
              <strong>Thanh toán:</strong>
              {{ selectedOrder.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng (VietQR)' }}
            </div>
            <div v-if="selectedOrder.note"><strong>Ghi chú khách hàng:</strong> {{ selectedOrder.note }}</div>
          </div>

          <table class="slip-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên Thiết Bị</th>
                <th>SL</th>
                <th>Đơn Giá</th>
                <th>Thành Tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in selectedOrder.items" :key="idx">
                <td>{{ idx + 1 }}</td>
                <td>{{ it.name }}</td>
                <td>{{ it.quantity }}</td>
                <td>{{ formatCurrency(it.price || 0) }}</td>
                <td>{{ formatCurrency((it.price || 0) * (it.quantity || 1)) }}</td>
              </tr>
            </tbody>
          </table>

          <div class="slip-total-row">
            <span>Tổng cộng thanh toán:</span>
            <strong>{{ formatCurrency(selectedOrder.totalAmount) }}</strong>
          </div>
        </div>

        <div class="adm-modal-foot no-print">
          <button type="button" class="adm-btn adm-btn-ghost" @click="selectedOrder = null">Đóng</button>
          <button type="button" class="adm-btn adm-btn-gold" @click="printSlip">
            <AdminIcon name="printer" :size="16" />
            <span>In Phiếu Giao Hàng</span>
          </button>
        </div>
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

const searchQuery = ref('')
const statusFilter = ref('ALL')
const paymentFilter = ref('ALL')
const selectedOrder = ref(null)

const cleanPhone = (phone) => (phone ? String(phone).replace(/[^0-9]/g, '') : '')

const allOrdersValue = computed(() => {
  return adminStore.orders
    .filter(o => o.status !== 'HUY')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
})

const completedRevenue = computed(() => {
  return adminStore.orders
    .filter(o => o.status === 'HOAN_THANH')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
})

const shippingCount = computed(() => {
  return adminStore.orders.filter(o => ['DA_XAC_NHAN', 'DANG_GIAO'].includes(o.status)).length
})

const statusTabs = computed(() => [
  { key: 'ALL', label: 'Tất Cả', count: adminStore.orders.length },
  { key: 'MOI', label: 'Đơn Mới', count: adminStore.orders.filter(o => o.status === 'MOI').length },
  { key: 'DA_XAC_NHAN', label: 'Đã Xác Nhận', count: adminStore.orders.filter(o => o.status === 'DA_XAC_NHAN').length },
  { key: 'DANG_GIAO', label: 'Đang Giao', count: adminStore.orders.filter(o => o.status === 'DANG_GIAO').length },
  { key: 'HOAN_THANH', label: 'Hoàn Thành', count: adminStore.orders.filter(o => o.status === 'HOAN_THANH').length },
  { key: 'HUY', label: 'Đã Hủy', count: adminStore.orders.filter(o => o.status === 'HUY').length }
])

const filteredOrders = computed(() => {
  const kw = searchQuery.value.toLowerCase().trim()
  return adminStore.orders.filter(o => {
    if (statusFilter.value !== 'ALL' && o.status !== statusFilter.value) return false
    if (paymentFilter.value !== 'ALL') {
      const pm = o.paymentMethod === 'COD' ? 'COD' : 'BANK'
      if (pm !== paymentFilter.value) return false
    }
    if (!kw) return true
    const itemNames = (o.items || []).map(i => i.name).join(' ').toLowerCase()
    return (
      o.id?.toLowerCase().includes(kw) ||
      o.customerName?.toLowerCase().includes(kw) ||
      o.customerPhone?.includes(kw) ||
      o.shippingAddress?.toLowerCase().includes(kw) ||
      itemNames.includes(kw)
    )
  })
})

const exportOrdersCsv = () => {
  exportRowsToCsv(
    `danh-sach-don-hang-${new Date().toISOString().slice(0, 10)}.csv`,
    [
      { label: 'Mã Đơn', value: r => r.id },
      { label: 'Ngày đặt', value: r => r.createdAt },
      { label: 'Khách hàng', value: r => r.customerName },
      { label: 'Điện thoại', value: r => r.customerPhone },
      { label: 'Địa chỉ nhận', value: r => r.shippingAddress },
      { label: 'Thiết bị đặt mua', value: r => (r.items || []).map(i => `${i.quantity}x ${i.name}`).join(' | ') },
      { label: 'Tổng tiền', value: r => r.totalAmount || 0 },
      { label: 'Thanh toán', value: r => r.paymentMethod },
      { label: 'Trạng thái', value: r => r.status },
      { label: 'Ghi chú', value: r => r.note || '' }
    ],
    filteredOrders.value
  )
}

const updateStatus = (id, status) => {
  adminStore.updateOrderStatus(id, status)
}

const handleDelete = (id) => {
  if (confirm('Anh có chắc chắn muốn xóa đơn hàng này khỏi hệ thống?')) {
    adminStore.deleteOrder(id)
  }
}

const printSlip = () => {
  window.print()
}

const getStatusClass = (status) => ({
  MOI: 'adm-status-red',
  DA_XAC_NHAN: 'adm-status-yellow',
  DANG_GIAO: 'adm-status-blue',
  HOAN_THANH: 'adm-status-green',
  HUY: 'adm-status-gray'
}[status] || '')
</script>

<style scoped>
.th-right {
  text-align: right;
}

.ord-code {
  display: block;
  font-family: var(--font-display);
  font-size: 0.82rem;
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
  font-size: 0.86rem;
  color: #f8fafc;
}

.addr-text {
  display: block;
  font-size: 0.76rem;
  color: #94a3b8;
  margin-top: 4px;
  max-width: 280px;
}

.note-chip {
  display: inline-block;
  margin-top: 4px;
  font-size: 0.72rem;
  color: #fde047;
  background: rgba(234, 179, 8, 0.12);
  padding: 2px 7px;
  border-radius: 4px;
}

.item-lines {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.82rem;
  color: #e2e8f0;
}

.item-lines li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qty-pill {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(252, 183, 40, 0.15);
  color: #fcb728;
}

.ord-total {
  font-family: var(--font-display);
  font-size: 0.96rem;
  font-weight: 800;
  color: #fcb728;
  white-space: nowrap;
}

.action-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  white-space: nowrap;
}

/* Printable Order Slip */
.slip-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.15);
}

.slip-brand {
  display: block;
  font-size: 0.92rem;
  color: #fcb728;
  margin-bottom: 3px;
}

.slip-header span {
  display: block;
  font-size: 0.76rem;
  color: #94a3b8;
}

.slip-meta {
  text-align: right;
}

.slip-meta strong {
  display: block;
  font-size: 0.86rem;
  color: #f8fafc;
}

.slip-customer {
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(9, 12, 21, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.83rem;
  color: #e2e8f0;
}

.slip-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.slip-table th,
.slip-table td {
  padding: 9px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
}

.slip-table th {
  color: #94a3b8;
  font-size: 0.72rem;
  text-transform: uppercase;
}

.slip-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  font-size: 0.95rem;
}

.slip-total-row strong {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: #fcb728;
}

@media print {
  .no-print {
    display: none !important;
  }
}
</style>
