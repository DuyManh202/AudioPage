<template>
  <div class="dashboard-view">
    <!-- Hàng thẻ thống kê nhanh (KPIs) -->
    <div class="metrics-grid">
      <div class="metric-card gold-border">
        <div class="metric-icon">💰</div>
        <div class="metric-data">
          <span class="metric-label">Doanh Số Đã Chốt Đơn</span>
          <span class="metric-value">{{ formatCurrency(adminStore.totalRevenueExpected) }}</span>
          <span class="metric-sub">{{ adminStore.closedDealsCount }} bộ dàn &amp; {{ adminStore.completedOrdersCount }} đơn lẻ hoàn thành</span>
        </div>
      </div>

      <div class="metric-card blue-border">
        <div class="metric-icon">🚚</div>
        <div class="metric-data">
          <span class="metric-label">Lịch Hẹn Thử Dàn Tại Nhà</span>
          <span class="metric-value">{{ adminStore.trialScheduledCount }} Lịch Hẹn</span>
          <span class="metric-sub">Bán kính 300km (Hà Nội, Phú Thọ...)</span>
        </div>
      </div>

      <div class="metric-card red-border">
        <div class="metric-icon">📞</div>
        <div class="metric-data">
          <span class="metric-label">Khách Mới Chờ Gọi Lại</span>
          <span class="metric-value">{{ adminStore.newLeadsCount }} Yêu Cầu</span>
          <span class="metric-sub">Cần gọi ngay trong 15 phút</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">🔊</div>
        <div class="metric-data">
          <span class="metric-label">Thiết Bị & Gói Dàn</span>
          <span class="metric-value">{{ adminStore.products.length }} Model Loa</span>
          <span class="metric-sub">2 Gói dàn chủ lực (19tr & 29tr)</span>
        </div>
      </div>
    </div>

    <!-- Phễu Chốt Sale & Khối Điều Hành -->
    <div class="dashboard-columns">
      <!-- Cột Trái: Danh sách khách hàng mới nhất -->
      <div class="panel-box flex-2">
        <div class="panel-header">
          <div>
            <h3>Yêu Cầu Tư Vấn & Đặt Lịch Gần Nhất</h3>
            <p class="panel-sub">Theo dõi sát sao từng khách để nâng cao tỷ lệ chốt đơn</p>
          </div>
          <router-link to="/admin/leads" class="btn-outline-sm">Xem Tất Cả ({{ adminStore.totalLeadsCount }})</router-link>
        </div>

        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Khách Hàng</th>
                <th>SĐT / Zalo</th>
                <th>Khu Vực</th>
                <th>Quan Tâm</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lead in recentLeads" :key="lead.id">
                <td>
                  <strong>{{ lead.name }}</strong>
                  <span class="time-sub">{{ lead.createdAt }}</span>
                </td>
                <td>
                  <a :href="`tel:${lead.phone.replace(/[^0-9]/g, '')}`" class="phone-link">
                    {{ lead.phone }}
                  </a>
                </td>
                <td>{{ lead.address }}</td>
                <td>
                  <span class="interest-pill">{{ lead.interest }}</span>
                </td>
                <td>
                  <span :class="['status-badge', getStatusClass(lead.status)]">
                    {{ getStatusText(lead.status) }}
                  </span>
                </td>
                <td>
                  <router-link to="/admin/leads" class="action-btn">Chi Tiết</router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cột Phải: Phễu Bán Hàng 3 Bước Chuẩn Tú Audio -->
      <div class="panel-box flex-1">
        <div class="panel-header">
          <div>
            <h3>Quy Trình Phễu Chốt Sale</h3>
            <p class="panel-sub">Quy tắc vàng 3 bước khi tư vấn khách</p>
          </div>
        </div>

        <div class="funnel-steps">
          <div class="funnel-step-item active-step">
            <div class="step-num">1</div>
            <div class="step-desc">
              <strong>Core Offer (Ưu tiên số 1):</strong>
              <p>Chốt 1 trong 2 Gói Dàn Trọn Bộ (Gói 29tr chuẩn quán hoặc Gói 19tr tiết kiệm).</p>
            </div>
          </div>

          <div class="funnel-step-item">
            <div class="step-num">2</div>
            <div class="step-desc">
              <strong>Downsell Bước 1 (Thu cũ đổi mới):</strong>
              <p>Nếu khách tiếc dàn cũ hoặc chê đắt: Đề xuất phương án thu dàn cũ trừ tiền lên dàn mới.</p>
            </div>
          </div>

          <div class="funnel-step-item">
            <div class="step-num">3</div>
            <div class="step-desc">
              <strong>Downsell Bước 2 (Nâng cấp lẻ):</strong>
              <p>Bán combo Vang số K9 + Micro CM 05 để trị dứt hú rít ngay trên dàn loa cũ của khách.</p>
            </div>
          </div>
        </div>

        <div class="quick-notice">
          💡 <em>Mẹo: 80% khách chốt đơn khi được chở loa đến tận nhà hát thử trực tiếp trên phòng khách thực tế.</em>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import { formatCurrency } from '../../utils/formatters'

const adminStore = useAdminStore()

const recentLeads = computed(() => {
  return adminStore.leads.slice(0, 5)
})

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

const getStatusText = (status) => {
  switch (status) {
    case 'MOI': return 'Mới Tiếp Nhận'
    case 'DA_GOI': return 'Đã Gọi Tư Vấn'
    case 'HEN_THU_TAI_NHA': return 'Hẹn Thử Tại Nhà'
    case 'DA_CHOT': return 'Đã Chốt Bàn Giao'
    case 'HUY': return 'Đã Hủy'
    default: return status
  }
}
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.metric-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(175deg, rgba(25, 31, 51, 0.94), rgba(15, 19, 32, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--radius-lg);
  padding: 22px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-card), var(--inner-highlight);
  transition: transform 0.28s var(--ease-spring), border-color 0.25s, box-shadow 0.28s;
}

.metric-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.18);
  box-shadow: var(--shadow-elevated);
}

.metric-card.gold-border {
  border-top: 3px solid var(--color-primary);
}

.metric-card.blue-border {
  border-top: 3px solid #3b82f6;
}

.metric-card.red-border {
  border-top: 3px solid #ef4444;
}

.metric-icon {
  font-size: 1.9rem;
  width: 54px;
  height: 54px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-data {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.metric-label {
  font-size: 0.74rem;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.metric-value {
  font-family: var(--font-display);
  font-size: 1.48rem;
  font-weight: 700;
  color: #fff;
  margin: 3px 0;
}

.metric-sub {
  font-size: 0.76rem;
  color: var(--text-subtle);
}

.dashboard-columns {
  display: flex;
  gap: 24px;
}

.flex-2 { flex: 2; min-width: 0; }
.flex-1 { flex: 1.2; min-width: 0; }

.panel-box {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.panel-header h3 {
  font-size: 1.15rem;
  font-weight: 800;
  color: #fff;
}

.panel-sub {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.btn-outline-sm {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--color-primary);
  border: 1px solid rgba(252, 183, 40, 0.42);
  padding: 6px 13px;
  border-radius: 999px;
  transition: all 0.2s;
}

.btn-outline-sm:hover {
  background: var(--color-primary);
  color: #080a10;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  text-align: left;
  font-size: 0.74rem;
  font-weight: 800;
  color: var(--text-subtle);
  text-transform: uppercase;
  padding: 11px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.admin-table td {
  padding: 13px 12px;
  font-size: 0.87rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.time-sub {
  display: block;
  font-size: 0.72rem;
  color: var(--text-subtle);
}

.phone-link {
  color: var(--color-primary);
  font-weight: 700;
}

.interest-pill {
  font-size: 0.79rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 4px 9px;
  border-radius: 6px;
  color: var(--text-secondary);
}

.status-badge {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 4px 9px;
  border-radius: 999px;
  display: inline-block;
}

.status-red { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.status-yellow { background: rgba(234, 179, 8, 0.2); color: #facc15; }
.status-blue { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.status-green { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.status-gray { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }

.action-btn {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
  border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 5px 10px;
  border-radius: 6px;
  transition: all 0.2s;
}

.action-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.funnel-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 18px;
}

.funnel-step-item {
  display: flex;
  gap: 12px;
  background: rgba(8, 11, 20, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 15px;
  border-radius: var(--radius-md);
}

.funnel-step-item.active-step {
  border-color: rgba(252, 183, 40, 0.45);
  background: rgba(252, 183, 40, 0.06);
}

.step-num {
  width: 30px;
  height: 30px;
  background: var(--gradient-gold);
  color: #080a10;
  font-family: var(--font-display);
  font-weight: 800;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.step-desc strong {
  font-size: 0.88rem;
  color: #fff;
  display: block;
  margin-bottom: 3px;
}

.step-desc p {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.45;
}

.quick-notice {
  background: rgba(40, 55, 252, 0.1);
  border-left: 3px solid #3b82f6;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #bfdbfe;
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .dashboard-columns {
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .metric-card {
    padding: 16px;
  }

  .metric-value {
    font-size: 1.25rem;
  }

  .panel-header {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
