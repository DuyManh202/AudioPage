<template>
  <div class="dashboard-view">
    <!-- Hàng thẻ thống kê nhanh (KPIs) -->
    <div class="metrics-grid">
      <div class="metric-card gold-border">
        <div class="metric-icon">💰</div>
        <div class="metric-data">
          <span class="metric-label">Doanh Số Đã Chốt Đơn</span>
          <span class="metric-value">{{ formatCurrency(adminStore.totalRevenueExpected) }}</span>
          <span class="metric-sub">{{ adminStore.closedDealsCount }} bộ dàn đã giao thành công</span>
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
  gap: 28px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.metric-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
}

.metric-card.gold-border {
  border-top: 3px solid var(--color-primary);
}

.metric-card.blue-border {
  border-top: 3px solid var(--color-secondary);
}

.metric-card.red-border {
  border-top: 3px solid #ef4444;
}

.metric-icon {
  font-size: 2rem;
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-data {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
}

.metric-value {
  font-size: 1.45rem;
  font-weight: 900;
  color: #fff;
  margin: 2px 0;
}

.metric-sub {
  font-size: 0.75rem;
  color: #64748b;
}

.dashboard-columns {
  display: flex;
  gap: 24px;
}

.flex-2 { flex: 2; }
.flex-1 { flex: 1.2; }

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
  color: #94a3b8;
  margin-top: 2px;
}

.btn-outline-sm {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-primary);
  border: 1px solid rgba(252, 183, 40, 0.4);
  padding: 5px 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-outline-sm:hover {
  background: var(--color-primary);
  color: #000;
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
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color);
}

.admin-table td {
  padding: 12px;
  font-size: 0.88rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.time-sub {
  display: block;
  font-size: 0.72rem;
  color: #64748b;
}

.phone-link {
  color: var(--color-primary);
  font-weight: 700;
}

.interest-pill {
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.04);
  padding: 3px 8px;
  border-radius: 4px;
  color: #cbd5e1;
}

.status-badge {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
}

.status-red { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.status-yellow { background: rgba(234, 179, 8, 0.2); color: #facc15; }
.status-blue { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.status-green { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.status-gray { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }

.action-btn {
  font-size: 0.78rem;
  color: #94a3b8;
  border: 1px solid var(--border-color);
  padding: 4px 8px;
  border-radius: 4px;
}

.action-btn:hover {
  color: #fff;
  border-color: #fff;
}

.funnel-steps {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}

.funnel-step-item {
  display: flex;
  gap: 12px;
  background: rgba(13, 15, 24, 0.6);
  border: 1px solid var(--border-color);
  padding: 14px;
  border-radius: var(--radius-sm);
}

.funnel-step-item.active-step {
  border-color: rgba(252, 183, 40, 0.4);
}

.step-num {
  width: 28px;
  height: 28px;
  background: var(--color-primary);
  color: #000;
  font-weight: 900;
  border-radius: 50%;
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
  margin-bottom: 2px;
}

.step-desc p {
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.4;
}

.quick-notice {
  background: rgba(40, 55, 252, 0.08);
  border-left: 3px solid var(--color-secondary);
  padding: 10px 14px;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #93c5fd;
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dashboard-columns {
    flex-direction: column;
  }
}
</style>
