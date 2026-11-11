<template>
  <div class="adm-page">
    <!-- Đầu trang Tổng quan -->
    <div class="adm-page-head">
      <div>
        <h1 class="adm-page-title">Bảng Điều Khiển Điều Hành</h1>
        <p class="adm-page-sub">
          Tổng hợp số liệu kinh doanh thực tế — {{ todayFormatted }} • Showroom Phú Thọ &amp; Lắp đặt tận nơi bán kính 300km
        </p>
      </div>
      <div class="adm-head-actions">
        <router-link v-if="can('products')" to="/admin/products" class="adm-btn adm-btn-sale">
          <AdminIcon name="flame" :size="16" />
          <span>Quản Lý Sale ({{ saleProductsCount }}/{{ adminStore.products.length }})</span>
        </router-link>
        <router-link v-if="can('leads')" to="/admin/leads" class="adm-btn adm-btn-gold">
          <AdminIcon name="leads" :size="16" />
          <span>Khách Tư Vấn ({{ adminStore.totalLeadsCount }})</span>
        </router-link>
      </div>
    </div>

    <!-- Cảnh báo vận hành cần xử lý ngay (chỉ hiện khi có việc cần làm thực tế) -->
    <div v-if="operationalAlerts.length > 0" class="alerts-strip">
      <router-link
        v-for="item in operationalAlerts"
        :key="item.id"
        :to="item.to"
        :class="['op-alert-item', `op-${item.tone}`]"
      >
        <AdminIcon :name="item.icon" :size="16" />
        <span>{{ item.text }}</span>
        <strong class="op-cta">{{ item.cta }} &rarr;</strong>
      </router-link>
    </div>

    <!-- 4 Chỉ số KPI Cốt lõi -->
    <div class="adm-kpi-grid">
      <div class="adm-kpi-card">
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Doanh Số Đã Chốt</span>
          <span class="adm-kpi-value">{{ formatCurrency(adminStore.totalRevenueExpected) }}</span>
          <span class="adm-kpi-meta">
            <strong>{{ adminStore.closedDealsCount }}</strong> bộ dàn &amp;
            <strong>{{ adminStore.completedOrdersCount }}</strong> đơn lẻ hoàn tất
          </span>
        </div>
        <div class="adm-kpi-icon tone-gold">
          <AdminIcon name="trend-up" :size="20" />
        </div>
      </div>

      <div class="adm-kpi-card">
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Giá Trị Đang Đàm Phán</span>
          <span class="adm-kpi-value">{{ formatCurrency(pipelineValue) }}</span>
          <span class="adm-kpi-meta">
            <strong>{{ activeLeadsCount }}</strong> khách đang chăm sóc &amp;
            <strong>{{ pendingOrdersCount }}</strong> đơn đang giao
          </span>
        </div>
        <div class="adm-kpi-icon tone-blue">
          <AdminIcon name="wallet" :size="20" />
        </div>
      </div>

      <router-link to="/admin/leads" class="adm-kpi-card clickable">
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Khách Mới &amp; Hẹn Thử Dàn</span>
          <span class="adm-kpi-value">{{ adminStore.newLeadsCount }} khách chờ gọi</span>
          <span class="adm-kpi-meta">
            <strong>{{ adminStore.trialScheduledCount }}</strong> lịch hẹn thử tại nhà • Tỷ lệ chốt <strong>{{ conversionRate }}%</strong>
          </span>
        </div>
        <div class="adm-kpi-icon tone-red">
          <AdminIcon name="leads" :size="20" />
        </div>
      </router-link>

      <router-link to="/admin/products" class="adm-kpi-card clickable">
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Kho Thiết Bị &amp; Sale</span>
          <span class="adm-kpi-value">{{ saleProductsCount }}/{{ adminStore.products.length }} đang Sale</span>
          <span class="adm-kpi-meta">
            <strong>{{ adminStore.combos.length }}</strong> gói dàn trọn bộ •
            <strong>{{ adminStore.pendingTradeInsCount }}</strong> yêu cầu thu cũ
          </span>
        </div>
        <div class="adm-kpi-icon tone-orange">
          <AdminIcon name="flame" :size="20" />
        </div>
      </router-link>
    </div>

    <!-- Khối Giữa: Phễu chuyển đổi thực tế & Tình trạng kho / đơn hàng -->
    <div class="dash-mid-grid">
      <div class="adm-card adm-card-p">
        <div class="section-head">
          <div>
            <h2 class="adm-card-title">Phễu Chăm Sóc &amp; Chuyển Đổi Khách Hàng</h2>
            <p class="adm-card-sub">Thống kê trực tiếp từ {{ adminStore.leads.length }} hồ sơ khách đăng ký trên hệ thống</p>
          </div>
          <router-link to="/admin/leads" class="adm-btn adm-btn-sm adm-btn-ghost">
            Mở Bảng CRM
          </router-link>
        </div>

        <div class="funnel-bars">
          <div v-for="stage in funnelStages" :key="stage.key" class="funnel-row">
            <div class="funnel-row-top">
              <span class="stage-name">
                <span :class="['stage-dot', stage.dot]"></span>
                {{ stage.label }}
              </span>
              <span class="stage-stat">
                <strong>{{ stage.count }}</strong> khách ({{ stage.percent }}%)
              </span>
            </div>
            <div class="bar-track">
              <div
                :class="['bar-fill', stage.bar]"
                :style="{ width: `${Math.max(stage.percent, stage.count > 0 ? 6 : 0)}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div class="adm-card adm-card-p">
        <div class="section-head">
          <div>
            <h2 class="adm-card-title">Tóm Tắt Kho &amp; Vận Hành Nhanh</h2>
            <p class="adm-card-sub">Trạng thái sản phẩm niêm yết và đơn hàng lẻ</p>
          </div>
        </div>

        <div class="quick-stat-list">
          <router-link to="/admin/products" class="q-stat-row">
            <div class="q-left">
              <div class="adm-kpi-icon tone-orange sm-ico"><AdminIcon name="flame" :size="16" /></div>
              <div>
                <strong>Sản phẩm đang chạy Sale</strong>
                <span>Hiển thị thẻ giảm % ngoài trang chủ &amp; danh mục</span>
              </div>
            </div>
            <span class="adm-badge adm-badge-sale">{{ saleProductsCount }} model</span>
          </router-link>

          <router-link to="/admin/combos" class="q-stat-row">
            <div class="q-left">
              <div class="adm-kpi-icon tone-gold sm-ico"><AdminIcon name="combos" :size="16" /></div>
              <div>
                <strong>Gói dàn Karaoke chủ lực (Core Offer)</strong>
                <span>Cấu hình trọn bộ 19 triệu &amp; 29 triệu</span>
              </div>
            </div>
            <span class="adm-badge adm-badge-gold">{{ adminStore.combos.length }} gói</span>
          </router-link>

          <router-link to="/admin/orders" class="q-stat-row">
            <div class="q-left">
              <div class="adm-kpi-icon tone-blue sm-ico"><AdminIcon name="orders" :size="16" /></div>
              <div>
                <strong>Đơn đặt mua thiết bị lẻ</strong>
                <span>Tổng giá trị đơn: {{ formatCurrency(totalOrdersValue) }}</span>
              </div>
            </div>
            <span class="adm-badge adm-badge-blue">{{ adminStore.orders.length }} đơn</span>
          </router-link>

          <router-link to="/admin/trade-ins" class="q-stat-row">
            <div class="q-left">
              <div class="adm-kpi-icon tone-green sm-ico"><AdminIcon name="trade-ins" :size="16" /></div>
              <div>
                <strong>Yêu cầu Thu cũ đổi mới</strong>
                <span>Định giá loa/amply cũ hỗ trợ khách lên đời</span>
              </div>
            </div>
            <span class="adm-badge adm-badge-green">{{ adminStore.tradeIns.length }} hồ sơ</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Khối Dưới: 2 Bảng Điều Hành Thực Tế (Khách Tư Vấn & Đơn Đặt Mua Lẻ) -->
    <div class="dash-bottom-grid">
      <!-- Bảng Khách tư vấn gần nhất -->
      <div class="adm-card">
        <div class="adm-card-head">
          <div>
            <h2 class="adm-card-title">Khách Đăng Ký Tư Vấn Mới Nhất</h2>
            <p class="adm-card-sub">Bấm số điện thoại hoặc Zalo để liên hệ ngay</p>
          </div>
          <router-link to="/admin/leads" class="adm-btn adm-btn-sm adm-btn-ghost">
            Xem tất cả ({{ adminStore.leads.length }})
          </router-link>
        </div>

        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead>
              <tr>
                <th>Khách Hàng</th>
                <th>Liên Hệ</th>
                <th>Sản Phẩm Quan Tâm</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lead in recentLeads" :key="lead.id">
                <td>
                  <strong class="row-primary">{{ lead.name }}</strong>
                  <span class="row-sub">{{ lead.address }} • {{ lead.createdAt }}</span>
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
                      Zalo
                    </a>
                  </div>
                </td>
                <td>
                  <span class="row-interest">{{ lead.interest }}</span>
                  <span v-if="lead.dealValue > 0" class="row-price">{{ formatCurrency(lead.dealValue) }}</span>
                </td>
                <td>
                  <span :class="['adm-badge', getLeadBadgeClass(lead.status)]">
                    {{ getLeadStatusLabel(lead.status) }}
                  </span>
                </td>
              </tr>
              <tr v-if="recentLeads.length === 0">
                <td colspan="4" class="adm-empty">Chưa có yêu cầu tư vấn nào.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bảng Đơn đặt mua lẻ gần nhất -->
      <div class="adm-card">
        <div class="adm-card-head">
          <div>
            <h2 class="adm-card-title">Đơn Đặt Mua Lẻ Gần Nhất</h2>
            <p class="adm-card-sub">Đơn khách đặt trực tiếp qua giỏ hàng Website</p>
          </div>
          <router-link to="/admin/orders" class="adm-btn adm-btn-sm adm-btn-ghost">
            Xem tất cả ({{ adminStore.orders.length }})
          </router-link>
        </div>

        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead>
              <tr>
                <th>Mã Đơn / Khách</th>
                <th>Tổng Tiền</th>
                <th>Thanh Toán</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ord in recentOrders" :key="ord.id">
                <td>
                  <strong class="row-primary">{{ ord.customerName }}</strong>
                  <span class="row-sub">{{ ord.id }} • {{ ord.createdAt }}</span>
                </td>
                <td>
                  <strong class="gold-num">{{ formatCurrency(ord.totalAmount) }}</strong>
                </td>
                <td>
                  <span class="adm-badge adm-badge-slate">
                    {{ ord.paymentMethod === 'COD' ? 'COD' : 'VietQR' }}
                  </span>
                </td>
                <td>
                  <span :class="['adm-badge', getOrderBadgeClass(ord.status)]">
                    {{ getOrderStatusLabel(ord.status) }}
                  </span>
                </td>
              </tr>
              <tr v-if="recentOrders.length === 0">
                <td colspan="4" class="adm-empty">Chưa có đơn hàng giỏ hàng nào.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import { useAuthStore } from '../../stores/authStore'
import { canAccess } from '../../utils/permissions'
import { formatCurrency } from '../../utils/formatters'
import AdminIcon from '../../components/admin/AdminIcon.vue'

const adminStore = useAdminStore()
const authStore = useAuthStore()
const can = (perm) => canAccess(authStore.currentUser?.role, perm)

const todayFormatted = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
}).format(new Date())

const cleanPhone = (phone) => (phone ? String(phone).replace(/[^0-9]/g, '') : '')

const saleProductsCount = computed(() => {
  return adminStore.products.filter(p => {
    const price = Number(p?.price || 0)
    const orig = Number(p?.originalPrice || 0)
    return price > 0 && orig > price
  }).length
})

const priceMismatchCount = computed(() => {
  return adminStore.products.filter(p => {
    const price = Number(p?.price || 0)
    const orig = Number(p?.originalPrice || 0)
    return orig > 0 && orig < price
  }).length
})

const activeLeadsCount = computed(() => {
  return adminStore.leads.filter(l => ['MOI', 'DA_GOI', 'HEN_THU_TAI_NHA'].includes(l.status)).length
})

const pendingOrdersCount = computed(() => {
  return adminStore.orders.filter(o => ['MOI', 'DA_XAC_NHAN', 'DANG_GIAO'].includes(o.status)).length
})

const pipelineValue = computed(() => {
  const leadPipe = adminStore.leads
    .filter(l => ['MOI', 'DA_GOI', 'HEN_THU_TAI_NHA'].includes(l.status))
    .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0)
  const orderPipe = adminStore.orders
    .filter(o => ['MOI', 'DA_XAC_NHAN', 'DANG_GIAO'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
  return leadPipe + orderPipe
})

const totalOrdersValue = computed(() => {
  return adminStore.orders
    .filter(o => o.status !== 'HUY')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
})

const conversionRate = computed(() => {
  const total = adminStore.leads.length
  if (!total) return 0
  return Math.round((adminStore.closedDealsCount / total) * 100)
})

const operationalAlerts = computed(() => {
  const list = []
  if (can('leads') && adminStore.newLeadsCount > 0) {
    list.push({
      id: 'leads-new',
      tone: 'red',
      icon: 'bell',
      text: `Có ${adminStore.newLeadsCount} khách đăng ký mới đang chờ gọi tư vấn.`,
      cta: 'Gọi ngay',
      to: '/admin/leads'
    })
  }
  if (can('orders') && adminStore.newOrdersCount > 0) {
    list.push({
      id: 'orders-new',
      tone: 'gold',
      icon: 'orders',
      text: `Có ${adminStore.newOrdersCount} đơn đặt mua lẻ mới cần xác nhận đóng gói.`,
      cta: 'Xử lý đơn',
      to: '/admin/orders'
    })
  }
  if (can('products') && priceMismatchCount.value > 0) {
    list.push({
      id: 'price-warn',
      tone: 'amber',
      icon: 'alert',
      text: `Có ${priceMismatchCount.value} thiết bị đang để Giá gốc thấp hơn Giá bán nên chưa hiện nhãn giảm giá.`,
      cta: 'Kiểm tra giá',
      to: '/admin/products'
    })
  }
  return list
})

const funnelStages = computed(() => {
  const total = adminStore.leads.length || 1
  const countOf = (st) => adminStore.leads.filter(l => l.status === st).length
  const defs = [
    { key: 'MOI', label: 'Mới tiếp nhận (Chờ gọi)', dot: 'dot-red', bar: 'bar-red' },
    { key: 'DA_GOI', label: 'Đã gọi tư vấn cấu hình', dot: 'dot-gold', bar: 'bar-gold' },
    { key: 'HEN_THU_TAI_NHA', label: 'Đã lên lịch thử dàn tận nhà', dot: 'dot-blue', bar: 'bar-blue' },
    { key: 'DA_CHOT', label: 'Đã bàn giao & chốt đơn', dot: 'dot-green', bar: 'bar-green' },
    { key: 'HUY', label: 'Tạm hoãn / Đã hủy', dot: 'dot-slate', bar: 'bar-slate' }
  ]
  return defs.map(d => {
    const c = countOf(d.key)
    return {
      ...d,
      count: c,
      percent: adminStore.leads.length ? Math.round((c / total) * 100) : 0
    }
  })
})

const recentLeads = computed(() => adminStore.leads.slice(0, 5))
const recentOrders = computed(() => adminStore.orders.slice(0, 5))

const getLeadBadgeClass = (st) => ({
  MOI: 'adm-badge-red',
  DA_GOI: 'adm-badge-gold',
  HEN_THU_TAI_NHA: 'adm-badge-blue',
  DA_CHOT: 'adm-badge-green',
  HUY: 'adm-badge-slate'
}[st] || 'adm-badge-slate')

const getLeadStatusLabel = (st) => ({
  MOI: 'Mới tiếp nhận',
  DA_GOI: 'Đã gọi tư vấn',
  HEN_THU_TAI_NHA: 'Hẹn thử tại nhà',
  DA_CHOT: 'Đã bàn giao',
  HUY: 'Đã hủy'
}[st] || st)

const getOrderBadgeClass = (st) => ({
  MOI: 'adm-badge-red',
  DA_XAC_NHAN: 'adm-badge-gold',
  DANG_GIAO: 'adm-badge-blue',
  HOAN_THANH: 'adm-badge-green',
  HUY: 'adm-badge-slate'
}[st] || 'adm-badge-slate')

const getOrderStatusLabel = (st) => ({
  MOI: 'Đơn mới',
  DA_XAC_NHAN: 'Đã xác nhận',
  DANG_GIAO: 'Đang giao',
  HOAN_THANH: 'Hoàn thành',
  HUY: 'Đã hủy'
}[st] || st)
</script>

<style scoped>
.alerts-strip {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.op-alert-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-radius: 11px;
  font-size: 0.83rem;
  font-weight: 600;
  transition: transform 0.15s ease;
}

.op-alert-item:hover {
  transform: translateX(2px);
}

.op-cta {
  margin-left: auto;
  white-space: nowrap;
  font-size: 0.78rem;
}

.op-red {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.op-gold {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #b45309;
}

.op-amber {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #c2410c;
}

.dash-mid-grid {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 18px;
}

.dash-bottom-grid {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 18px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.funnel-bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.funnel-row-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.81rem;
  margin-bottom: 6px;
}

.stage-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #334155;
  font-weight: 600;
}

.stage-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-red { background: #ef4444; }
.dot-gold { background: #f59e0b; }
.dot-blue { background: #3b82f6; }
.dot-green { background: #22c55e; }
.dot-slate { background: #64748b; }

.stage-stat {
  color: #64748b;
  font-size: 0.78rem;
}

.stage-stat strong {
  color: #0f172a;
}

.bar-track {
  width: 100%;
  height: 8px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.bar-red { background: linear-gradient(90deg, #ef4444, #f87171); }
.bar-gold { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.bar-blue { background: linear-gradient(90deg, #2563eb, #60a5fa); }
.bar-green { background: linear-gradient(90deg, #16a34a, #4ade80); }
.bar-slate { background: #94a3b8; }

.quick-stat-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.q-stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 13px;
  border-radius: 11px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: border-color 0.16s, background 0.16s;
}

.q-stat-row:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}

.q-left {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.sm-ico {
  width: 36px;
  height: 36px;
  border-radius: 9px;
}

.q-left strong {
  display: block;
  font-size: 0.83rem;
  color: #0f172a;
}

.q-left span {
  display: block;
  font-size: 0.73rem;
  color: #64748b;
}

.row-primary {
  display: block;
  color: #0f172a;
  font-size: 0.85rem;
}

.row-sub {
  display: block;
  font-size: 0.72rem;
  color: #64748b;
  margin-top: 2px;
}

.row-interest {
  display: block;
  font-size: 0.8rem;
  color: #334155;
  font-weight: 600;
}

.row-price,
.gold-num {
  color: #dc2626;
  font-weight: 800;
  font-size: 0.82rem;
}

@media (max-width: 1120px) {
  .dash-mid-grid,
  .dash-bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>
