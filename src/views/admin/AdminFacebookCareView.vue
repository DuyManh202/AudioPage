<template>
  <div class="adm-page fb-care">
    <div class="adm-page-head">
      <div>
        <h1 class="adm-page-title">Chăm sóc khách từ Facebook & Phân tích quảng cáo</h1>
        <p class="adm-page-sub">Theo sát khách hàng từ lúc nhắn tin đến khi chốt đơn, đo lường chi phí và doanh thu thực tế của từng quảng cáo Meta.</p>
      </div>
      <div class="head-btn-group">
        <button v-if="currentTab === 'CARE'" class="adm-btn adm-btn-gold" @click="showCreate = !showCreate">＋ Thêm khách Facebook</button>
        <button v-else class="adm-btn adm-btn-gold" :disabled="analyticsBusy" @click="loadAnalytics">↻ Tải Lại Số Liệu</button>
      </div>
    </div>

    <!-- Thanh chuyển đổi chức năng: Chăm sóc CRM vs Phân tích hiệu quả quảng cáo -->
    <div class="view-tabs">
      <button
        type="button"
        :class="['view-tab-btn', { active: currentTab === 'CARE' }]"
        @click="currentTab = 'CARE'"
      >
        💬 Chăm Sóc Tin Nhắn & Khách Hàng ({{ customers.length }})
      </button>
      <button
        type="button"
        :class="['view-tab-btn', { active: currentTab === 'ANALYTICS' }]"
        @click="switchTab('ANALYTICS')"
      >
        📊 Phân Tích Hiệu Quả Quảng Cáo & ROI
        <span class="tab-badge-hot">Đo Lường Doanh Thu</span>
      </button>
    </div>

    <!-- TAB 1: CHĂM SÓC KHÁCH HÀNG CRM -->
    <div v-if="currentTab === 'CARE'" class="care-tab-content">
      <div :class="['connection', { online: messengerConnected }]">
        <span class="offline-dot"></span>
        <div>
          <strong>{{ messengerConnected ? 'Facebook Messenger đã kết nối · Tự động đồng bộ' : 'Hệ Thống Chăm Sóc Khách Hàng Facebook (CRM)' }}</strong>
          <small v-if="messengerConnected">{{ `Tin nhắn tự động làm mới${lastSyncedAt ? ' · Cập nhật lúc ' + displayTime(lastSyncedAt) : ''}` }}</small>
          <small v-else>Hồ sơ khách từ Fanpage và Website sẵn sàng tiếp nhận, chăm sóc và theo dõi tiến độ chốt đơn.</small>
        </div>
        <button v-if="messengerConnected" class="adm-btn sync-btn" @click="forceSync" :disabled="syncBusy">{{ syncBusy ? 'Đang quét…' : '↻ Quét ngay' }}</button>
        <span class="connection-tag">{{ messengerConnected ? 'Messenger Live' : 'CRM Sẵn Sàng' }}</span>
      </div>

      <div v-if="newArrivals.length" class="new-arrivals"><strong>🔔 {{ newArrivals.length }} khách mới vừa vào</strong><button v-for="customer in newArrivals" :key="customer.id" type="button" @click="selectNewArrival(customer)">{{ customer.customerName }}{{ customer.phone ? ` · ${customer.phone}` : '' }}</button><button type="button" class="dismiss-arrivals" @click="newArrivals = []">Ẩn</button></div>

      <section v-if="adsConfigured && ads.length > 0" class="ads-card adm-card">
        <div class="ads-head"><div><h2>Quảng cáo đang chạy</h2><p>Số liệu hiệu quả trong 30 ngày gần nhất</p></div><button class="adm-btn" @click="loadAds" :disabled="adsBusy">{{ adsBusy ? 'Đang tải…' : '↻ Làm mới' }}</button></div>
        <div class="ads-table-wrap"><table class="ads-table"><thead><tr><th>Quảng cáo</th><th>Chiến dịch</th><th>Hiển thị</th><th>Nhấp</th><th>Chi tiêu (30 ngày)</th></tr></thead><tbody><tr v-for="ad in ads" :key="ad.id"><td><strong>{{ ad.name }}</strong><small>{{ ad.adsetName || ad.id }}</small></td><td>{{ ad.campaignName || '—' }}</td><td>{{ formatNumber(ad.impressions) }}</td><td>{{ formatNumber(ad.clicks) }}</td><td>{{ formatMoney(ad.spend) }}</td></tr></tbody></table></div>
      </section>

      <form v-if="showCreate" class="adm-card create-form" @submit.prevent="createCustomer">
        <h2>Thêm khách cần chăm sóc</h2>
        <div class="form-grid"><label>Tên khách *<input v-model="draft.customerName" required placeholder="Tên hiển thị Facebook"></label><label>Facebook ID / link hồ sơ<input v-model="draft.facebookId" placeholder="Tùy chọn"></label><label>Số điện thoại<input v-model="draft.phone" placeholder="Nếu khách đã cung cấp"></label><label>Sản phẩm quan tâm<input v-model="draft.interest" placeholder="Ví dụ: Dàn karaoke 29 triệu"></label><label>Địa chỉ khách<input v-model="draft.address" placeholder="Số nhà, đường, xã/phường"></label><label>Tỉnh/thành<input v-model="draft.province" list="fb-province-options" placeholder="Chọn hoặc nhập tỉnh/thành"></label><label>Nhắc chăm sóc lúc<input v-model="draft.followUpAt" type="datetime-local"></label><label>Ghi chú<textarea v-model="draft.notes" rows="2" placeholder="Nhu cầu, khu vực, vấn đề đang gặp"></textarea></label></div>
        <button class="adm-btn adm-btn-gold" :disabled="busy">{{ busy ? 'Đang lưu…' : 'Lưu hồ sơ' }}</button>
      </form>
      <datalist id="fb-province-options"><option v-for="p in VIETNAM_PROVINCES" :key="p.name" :value="p.displayName" /></datalist>

      <div class="stats"><button v-for="item in statusOptions" :key="item.key" :class="['stat', { selected: filter === item.key }]" @click="filter = item.key"><span>{{ item.label }}</span><b>{{ item.key === 'ALL' ? customers.length : customers.filter(c => c.status === item.key).length }}</b></button><label class="ad-filter">Nguồn quảng cáo<select v-model="adFilter"><option value="ALL">Tất cả nguồn</option><option value="NONE">Chưa xác định quảng cáo</option><option v-for="ad in knownAds" :key="ad.id" :value="ad.id">{{ ad.name }} · {{ ad.count }}</option></select></label><button type="button" class="adm-btn adm-btn-sm adm-btn-gold auto-match-btn" :disabled="autoMatchingBusy || resetMatchingBusy" @click="autoMatchAds" title="Tự động phân tích hội thoại theo ngày và nội dung cụ thể để gắn nguồn quảng cáo">{{ autoMatchingBusy ? 'Đang phân loại...' : '⚡ Khớp nguồn QC' }}</button><button type="button" class="adm-btn adm-btn-sm adm-btn-outline" :disabled="autoMatchingBusy || resetMatchingBusy" @click="resetMatchedAds" title="Khôi phục toàn bộ khách hàng về trạng thái Chưa xác định nguồn quảng cáo">{{ resetMatchingBusy ? 'Đang bỏ khớp...' : '↺ Bỏ khớp nguồn' }}</button><div class="search"><input v-model="keyword" placeholder="Tìm tên, số điện thoại, nhu cầu…"></div></div>

      <div class="workspace adm-card">
        <div class="customer-list"><div class="list-title">Danh sách khách <span>{{ visibleCustomers.length }}</span></div><button v-for="c in visibleCustomers" :key="c.id" :class="['customer-row', { active: selected?.id === c.id }]" @click="select(c)"><strong>{{ c.customerName }}</strong><small class="line-clamp">{{ c.interest || c.lastMessage || 'Chưa ghi nhu cầu' }}</small><small>{{ c.phone || c.facebookId || c.id }}</small><small v-if="c.sourceAdName || c.sourceAdId" class="source-small">Nguồn quảng cáo: {{ c.sourceAdName || c.sourceAdId }}</small><small v-else-if="c.sourceType">Nguồn: {{ c.sourceType }}</small><span :class="['status', c.status.toLowerCase()]">{{ labelFor(c.status) }}</span><em v-if="c.followUpAt">Nhắc: {{ displayDate(c.followUpAt) }}</em></button><p v-if="!visibleCustomers.length" class="empty">Chưa có khách. Hệ thống tự động đồng bộ tin nhắn từ Fanpage.</p></div>
        <section v-if="selected" class="detail">
          <div class="detail-head"><div><h2>{{ selected.customerName }}</h2><p>{{ selected.phone || 'Chưa có số điện thoại' }} <span v-if="selected.facebookId"> · {{ selected.facebookId }}</span></p></div><select v-model="edit.status" @change="save"><option v-for="s in statusOptions.slice(1)" :key="s.key" :value="s.key">{{ s.label }}</option></select></div>
          <div class="edit-grid"><label>Nhu cầu<input v-model="edit.interest" @change="save"></label><label>Điện thoại<input v-model="edit.phone" @change="save"></label><label>Địa chỉ<input v-model="edit.address" placeholder="Địa chỉ lắp đặt" @change="save"></label><label>Tỉnh/thành<input v-model="edit.province" list="fb-province-options" @change="save"></label><label>Nhắc chăm sóc<input v-model="edit.followUpAt" type="datetime-local" @change="save"></label><label>Phụ trách<input v-model="edit.assignedTo" @change="save"></label><label class="ad-select-label">Gắn nguồn quảng cáo<select v-model="edit.sourceAdId" @change="onSourceAdChange"><option value="">-- Chưa gắn quảng cáo --</option><option v-for="ad in ads" :key="ad.id" :value="ad.id">{{ ad.name }}</option></select></label></div>
          <label class="notes">Ghi chú khách hàng<textarea v-model="edit.notes" rows="3" @change="save"></textarea></label>
          <div v-if="selected.sourceAdId || selected.sourceType" class="ad-context"><span class="ad-context-icon">▣</span><div><strong>{{ selected.sourceAdId ? 'Cuộc trò chuyện này đến từ quảng cáo' : 'Nguồn cuộc trò chuyện từ Meta' }}</strong><span>{{ selected.sourceAdName || (selected.sourceAdId ? `Quảng cáo ID ${selected.sourceAdId}` : selected.sourceType) }}</span><small v-if="selected.sourceCampaignName">Chiến dịch: {{ selected.sourceCampaignName }}</small></div><span v-if="selected.sourceAdId" class="ad-context-tag">QUẢNG CÁO</span></div>
          <div class="history-head"><h3>Lịch sử tư vấn</h3><span>{{ messengerConnected ? 'Tin nhắn OUT sẽ gửi qua Messenger' : 'Ghi nhận nội bộ · Messenger chưa kết nối' }}</span></div>
          <div class="history"><div v-for="m in selected.messages" :key="m.id" :class="['message', m.direction === 'OUT' ? 'out' : 'in']"><small>{{ m.direction === 'OUT' ? 'Đã tư vấn' : 'Khách nhắn' }} · {{ displayDate(m.createdAt) }}</small><p>{{ m.body }}</p></div><p v-if="!selected.messages?.length" class="empty">Chưa có ghi nhận hội thoại.</p></div>
          <form class="message-form" @submit.prevent="addMessage"><select v-model="messageDirection"><option value="IN">Khách nhắn</option><option value="OUT">{{ messengerConnected ? 'Trả lời khách' : 'Đã tư vấn' }}</option></select><input v-model="messageBody" :placeholder="messageDirection === 'OUT' && messengerConnected ? 'Soạn tin nhắn gửi khách…' : 'Ghi nội dung trao đổi…'" required><button class="adm-btn adm-btn-gold" :disabled="busy">{{ busy ? 'Đang gửi…' : messageDirection === 'OUT' && messengerConnected ? 'Gửi Messenger' : 'Ghi lại' }}</button></form>
        </section>
        <section v-else class="placeholder"><div>💬</div><h2>Chọn hồ sơ khách hàng</h2><p>Thông tin và lịch sử chăm sóc sẽ hiển thị tại đây.</p></section>
      </div>
      <p v-if="orderSyncNotice" class="order-sync-notice">{{ orderSyncNotice }}</p>
      <p v-if="autoMatchNotice" class="auto-match-notice">⚡ {{ autoMatchNotice }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <!-- TAB 2: BÁO CÁO PHÂN TÍCH HIỆU QUẢ QUẢNG CÁO & ROI -->
    <div v-else-if="currentTab === 'ANALYTICS'" class="analytics-tab-content">
      <!-- 6 Thẻ Thống Kê Tổng Quan -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header"><span class="kpi-icon">💳</span><span class="kpi-label">Tổng Ngân Sách QC ({{ analyticsSummary.periodLabel || 'Trọn đời' }})</span></div>
          <div class="kpi-val text-red">{{ formatMoney(analyticsSummary.totalSpend) }}</div>
          <div class="kpi-sub">Theo dữ liệu Meta Ads Manager</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header"><span class="kpi-icon">👥</span><span class="kpi-label">Tổng Khách Nhắn Tin</span></div>
          <div class="kpi-val text-blue">{{ analyticsSummary.totalLeads }} khách</div>
          <div class="kpi-sub">{{ analyticsSummary.totalCampaigns }} chiến dịch ghi nhận</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header"><span class="kpi-icon">🏷️</span><span class="kpi-label">Giá Mỗi Khách (CPL)</span></div>
          <div class="kpi-val text-amber">{{ analyticsSummary.avgCpl > 0 ? formatMoney(analyticsSummary.avgCpl) : '—' }}</div>
          <div class="kpi-sub">Chi phí để có 1 tin nhắn khách</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header"><span class="kpi-icon">🎯</span><span class="kpi-label">Đơn Hàng Đã Chốt</span></div>
          <div class="kpi-val text-green">{{ analyticsSummary.totalClosed }} đơn</div>
          <div class="kpi-sub">Tỷ lệ chốt thành công: <strong>{{ analyticsSummary.overallCr }}%</strong></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header"><span class="kpi-icon">💰</span><span class="kpi-label">Doanh Thu Mang Về</span></div>
          <div class="kpi-val text-gold">{{ formatMoney(analyticsSummary.totalRevenue) }}</div>
          <div class="kpi-sub">Ước tính từ đơn chốt dàn karaoke</div>
        </div>

        <div class="kpi-card highlight-kpi">
          <div class="kpi-header"><span class="kpi-icon">🚀</span><span class="kpi-label">Hệ Số Hoàn Vốn (ROAS)</span></div>
          <div class="kpi-val text-purple">{{ analyticsSummary.avgRoas }}x</div>
          <div class="kpi-sub">1đ chi phí ➔ {{ analyticsSummary.avgRoas }}đ doanh thu</div>
        </div>
      </div>

      <!-- Khuyến nghị tối ưu thông minh -->
      <div v-if="bestAd" class="ai-insight-box">
        <div class="insight-icon">💡</div>
        <div class="insight-content">
          <h4>Chiến Dịch Sinh Lời Hiệu Quả Nhất</h4>
          <p>
            Chiến dịch <strong>"{{ bestAd.name }}"</strong> đang dẫn đầu với 
            <strong>{{ bestAd.totalCustomers }} khách nhắn tin</strong> và 
            <strong>{{ bestAd.closedCustomers }} đơn đã chốt</strong> 
            (Doanh thu ước tính: <strong>{{ formatMoney(bestAd.effectiveRevenue) }}</strong>, ROAS đạt <strong>{{ bestAd.roas }}x</strong>). 
            Khuyến nghị Tú Audio tiếp tục ưu tiên ngân sách và đẩy mạnh chốt sale cho chiến dịch này!
          </p>
        </div>
        <button type="button" class="adm-btn adm-btn-sm adm-btn-gold" @click="autoMatchAds" :disabled="autoMatchingBusy">
          {{ autoMatchingBusy ? 'Đang phân loại...' : '⚡ Khớp Lại Nguồn QC' }}
        </button>
      </div>

      <!-- Bảng xếp hạng chi tiết từng quảng cáo -->
      <div class="adm-card analytics-table-card">
        <div class="table-card-head">
          <div>
            <h3>Bảng Xếp Hạng Hiệu Quả Từng Quảng Cáo (ROI Ranking)</h3>
            <p>Đối soát chi phí Meta ({{ analyticsSummary.periodLabel || 'Trọn đời' }}) với lượng khách & doanh thu thực tế</p>
          </div>
          <div class="head-actions">
            <div class="period-btn-group">
              <button
                type="button"
                :class="['period-btn', { active: analyticsPeriod === 'today' }]"
                @click="changePeriod('today')"
              >
                Hôm nay
              </button>
              <button
                type="button"
                :class="['period-btn', { active: analyticsPeriod === '7d' }]"
                @click="changePeriod('7d')"
              >
                7 ngày qua
              </button>
              <button
                type="button"
                :class="['period-btn', { active: analyticsPeriod === '30d' }]"
                @click="changePeriod('30d')"
              >
                30 ngày qua
              </button>
              <button
                type="button"
                :class="['period-btn', { active: analyticsPeriod === 'maximum' }]"
                @click="changePeriod('maximum')"
              >
                Trọn đời
              </button>
            </div>
            <button type="button" class="adm-btn adm-btn-sm auto-match-btn" :disabled="autoMatchingBusy || resetMatchingBusy" @click="autoMatchAds">
              {{ autoMatchingBusy ? 'Đang phân loại...' : '⚡ Khớp nguồn QC chuẩn ngày' }}
            </button>
            <button type="button" class="adm-btn adm-btn-sm adm-btn-outline" :disabled="autoMatchingBusy || resetMatchingBusy" @click="resetMatchedAds">
              {{ resetMatchingBusy ? 'Đang bỏ khớp...' : '↺ Bỏ khớp / Xóa gán ảo' }}
            </button>
            <button type="button" class="adm-btn adm-btn-sm" @click="loadAnalytics()" :disabled="analyticsBusy">
              {{ analyticsBusy ? 'Đang tải...' : '↻ Làm Mới' }}
            </button>
          </div>
        </div>

        <div class="analytics-table-wrap">
          <table class="analytics-table">
            <thead>
              <tr>
                <th>Chiến Dịch & Tên Quảng Cáo</th>
                <th>Trạng Thái Meta</th>
                <th>Chi Phí ({{ analyticsSummary.periodLabel || 'Trọn đời' }})</th>
                <th>Tin Nhắn (Meta)</th>
                <th>Khách CRM</th>
                <th>Giá / Tin (CPL)</th>
                <th>Đơn Chốt</th>
                <th>Tỷ Lệ Chốt</th>
                <th>Doanh Thu Ước Tính</th>
                <th>ROAS</th>
                <th>Đánh Giá & Khuyến Nghị</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in analyticsData" :key="item.id" :class="`row-grade-${item.grade.toLowerCase()}`">
                <td>
                  <strong>{{ item.name }}</strong>
                  <small>{{ item.campaignName || item.id }}</small>
                </td>
                <td>
                  <span :class="['meta-status-pill', item.isMetaActive ? 'pill-active' : 'pill-paused']">
                    {{ item.statusLabel }}
                  </span>
                </td>
                <td class="font-bold text-red">{{ formatMoney(item.spend) }}</td>
                <td>
                  <span class="badge-meta-msg">{{ item.metaMessages || 0 }} tin</span>
                </td>
                <td>
                  <span class="badge-leads">{{ item.totalCustomers }} khách</span>
                </td>
                <td class="text-amber font-semibold">{{ item.cpl > 0 ? formatMoney(item.cpl) : '—' }}</td>
                <td class="font-bold text-green">{{ item.closedCustomers }} đơn</td>
                <td>
                  <div class="cr-wrap">
                    <span>{{ item.conversionRate }}%</span>
                    <div class="cr-bar"><div class="cr-fill" :style="{ width: `${Math.min(item.conversionRate * 5, 100)}%` }"></div></div>
                  </div>
                </td>
                <td class="font-bold text-gold">{{ formatMoney(item.effectiveRevenue) }}</td>
                <td>
                  <span :class="['roas-pill', item.roas >= 3 ? 'roas-high' : item.roas > 0 ? 'roas-mid' : 'roas-zero']">
                    {{ item.roas }}x
                  </span>
                </td>
                <td>
                  <div class="rec-wrap">
                    <span :class="['grade-tag', `grade-${item.grade.toLowerCase()}`]">{{ item.gradeLabel }}</span>
                    <p class="rec-text">{{ item.recommendation }}</p>
                  </div>
                </td>
                <td>
                  <button type="button" class="adm-btn adm-btn-sm adm-btn-outline" @click="filterByCampaign(item.id)">
                    Xem khách
                  </button>
                </td>
              </tr>
              <tr v-if="!analyticsData.length">
                <td colspan="12" class="empty">Chưa có dữ liệu phân tích chiến dịch. Bấm "Tải Lại Số Liệu" để đối soát.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAdminStore } from '../../stores/adminStore'
import { apiRequest } from '../../utils/api'
import { VIETNAM_PROVINCES } from '../../../server/vietnamProvinces.js'
const adminStore = useAdminStore()
const customers = ref([]), newArrivals = ref([]), selected = ref(null), showCreate = ref(false), busy = ref(false), syncBusy = ref(false), error = ref(''), orderSyncNotice = ref(''), keyword = ref(''), filter = ref('ALL'), adFilter = ref('ALL'), messageBody = ref(''), messageDirection = ref('OUT'), messengerConnected = ref(false), aiEnabled = ref(false), lastSyncedAt = ref(''), syncError = ref(''), ads = ref([]), adsBusy = ref(false), adsError = ref(''), adsConfigured = ref(false), autoMatchingBusy = ref(false), autoMatchNotice = ref(''), resetMatchingBusy = ref(false)
const currentTab = ref('CARE')
const analyticsData = ref([])
const analyticsPeriod = ref('maximum')
const analyticsSummary = ref({
  totalSpend: 0,
  totalLeads: 0,
  totalClosed: 0,
  totalRevenue: 0,
  avgCpl: 0,
  avgRoas: 0,
  overallCr: 0,
  totalCampaigns: 0,
  periodLabel: 'Toàn thời gian (Trọn đời)'
})
const analyticsBusy = ref(false)
const analyticsError = ref('')
const bestAd = computed(() => analyticsData.value.length ? analyticsData.value[0] : null)
const route = useRoute()
const statusOptions = [{ key: 'ALL', label: 'Tất cả' }, { key: 'MOI', label: 'Mới' }, { key: 'DANG_TU_VAN', label: 'Đang tư vấn' }, { key: 'CHO_PHAN_HOI', label: 'Chờ phản hồi' }, { key: 'DA_CHOT', label: 'Đã chốt' }, { key: 'DA_HUY', label: 'Đã dừng' }]
const blank = () => ({ customerName: '', facebookId: '', phone: '', interest: '', address: '', province: '', notes: '', followUpAt: '' })
const draft = reactive(blank()), edit = reactive({})
let careTimer = null, adsTimer = null
let knownCustomerIds = null
const labelFor = value => statusOptions.find(x => x.key === value)?.label || value
const displayDate = value => value ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : ''
const displayTime = value => value ? new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''
const formatNumber = value => new Intl.NumberFormat('vi-VN').format(value || 0)
const formatMoney = value => `${new Intl.NumberFormat('vi-VN').format(value || 0)} đ`
const knownAds = computed(() => {
  const grouped = new Map()
  ads.value.forEach(ad => grouped.set(ad.id, { id: ad.id, name: ad.name || `Quảng cáo ${ad.id}`, count: 0 }))
  customers.value.filter(c => c.sourceAdId).forEach(c => {
    const item = grouped.get(c.sourceAdId) || { id: c.sourceAdId, name: c.sourceAdName || `Quảng cáo ${c.sourceAdId}`, count: 0 }
    item.count++
    if (!item.name || item.name === `Quảng cáo ${c.sourceAdId}`) item.name = c.sourceAdName || item.name
    grouped.set(c.sourceAdId, item)
  })
  return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
})
const visibleCustomers = computed(() => customers.value.filter(c => (filter.value === 'ALL' || c.status === filter.value) && (adFilter.value === 'ALL' || (adFilter.value === 'NONE' ? !c.sourceAdId : c.sourceAdId === adFilter.value)) && `${c.customerName} ${c.phone} ${c.interest} ${c.lastMessage || ''} ${c.facebookId} ${c.sourceAdName || ''} ${c.sourceCampaignName || ''} ${c.sourceAdId || ''}`.toLowerCase().includes(keyword.value.toLowerCase())))
const isEditingDetail = () => typeof document !== 'undefined' && Boolean(document.activeElement?.closest('.detail .edit-grid, .detail .notes, .detail .detail-head'))
async function load({ silent = false, force = false } = {}) {
  try {
    const r = await apiRequest(force ? '/admin/facebook-care?sync=force' : '/admin/facebook-care')
    const incomingCustomers = r.data || []
    if (knownCustomerIds) {
      const arrivals = incomingCustomers.filter(customer => !knownCustomerIds.has(customer.id))
      if (arrivals.length) newArrivals.value = [...arrivals, ...newArrivals.value].slice(0, 10)
    }
    knownCustomerIds = new Set(incomingCustomers.map(customer => customer.id))
    customers.value = incomingCustomers
    messengerConnected.value = Boolean(r.connected)
    aiEnabled.value = Boolean(r.aiEnabled)
    if (r.lastSyncedAt) lastSyncedAt.value = r.lastSyncedAt
    syncError.value = r.syncError || ''
    if (selected.value) {
      const updated = customers.value.find(c => c.id === selected.value.id) || null
      if (updated && silent && isEditingDetail()) selected.value = updated
      else select(updated)
    } else if (customers.value.length && !silent) {
      const routeCustomer = customers.value.find(c => c.id === String(route.query.customerId || ''))
      select(routeCustomer || customers.value[0])
    }
  } catch (e) {
    if (!silent) error.value = e.message
  }
}
async function forceSync() { syncBusy.value = true; error.value = ''; try { await load({ force: true }) } finally { syncBusy.value = false } }
async function loadAds() { adsBusy.value = true; adsError.value = ''; try { const r = await apiRequest('/admin/facebook-ads'); ads.value = r.data || []; adsConfigured.value = Boolean(r.configured) } catch (e) { adsError.value = e.message; adsConfigured.value = e.status !== 503 } finally { adsBusy.value = false } }
function select(c) { selected.value = c; if (c) Object.assign(edit, { status: c.status, interest: c.interest, phone: c.phone, address: c.address || '', province: c.province || '', notes: c.notes, followUpAt: c.followUpAt, assignedTo: c.assignedTo, sourceAdId: c.sourceAdId || '' }) }
function onSourceAdChange() { const chosen = ads.value.find(a => a.id === edit.sourceAdId); if (chosen) { Object.assign(edit, { sourceAdName: chosen.name, sourceCampaignId: chosen.campaignId || '', sourceCampaignName: chosen.campaignName || '', sourceType: 'AD' }) } else { Object.assign(edit, { sourceAdName: '', sourceCampaignId: '', sourceCampaignName: '', sourceType: '' }) }; save() }
async function autoMatchAds() {
  if (!ads.value.length) await loadAds()
  if (!ads.value.length) {
    adminStore.showNotice('Chưa tải được danh sách chiến dịch quảng cáo từ Meta.', 'error')
    error.value = 'Chưa tải được danh sách chiến dịch quảng cáo từ Meta.'
    return
  }
  const ok = await adminStore.confirm({
    title: 'Khớp nguồn quảng cáo tự động',
    message: 'Hệ thống sẽ đối soát theo ngày chạy và từ khóa ưu đãi cụ thể của từng chiến dịch Meta để phân loại khách hàng. Anh có muốn tiếp tục?',
    confirmText: 'Bắt đầu khớp',
    cancelText: 'Hủy bỏ',
    type: 'warning'
  })
  if (!ok) return

  autoMatchingBusy.value = true
  autoMatchNotice.value = ''
  try {
    const r = await apiRequest('/admin/facebook-care/auto-attribute', { method: 'POST', body: JSON.stringify({ ads: ads.value }) })
    if (r.success) {
      adminStore.showNotice(r.message, 'success')
      autoMatchNotice.value = r.message
      await load({ force: true })
      if (currentTab.value === 'ANALYTICS') await loadAnalytics()
    }
  } catch (e) {
    adminStore.showNotice(e.message, 'error')
    error.value = e.message
  } finally {
    autoMatchingBusy.value = false
  }
}

async function resetMatchedAds() {
  const ok = await adminStore.confirm({
    title: 'Xóa gán nguồn quảng cáo ảo',
    message: 'Anh có chắc chắn muốn xóa toàn bộ việc gán quảng cáo tự động và đưa tất cả khách hàng về nguồn tự nhiên (Chưa xác định) không?',
    confirmText: 'Đồng ý xóa gán',
    cancelText: 'Hủy bỏ',
    type: 'danger'
  })
  if (!ok) return

  resetMatchingBusy.value = true
  error.value = ''
  autoMatchNotice.value = ''
  try {
    const r = await apiRequest('/admin/facebook-care/reset-attribute', { method: 'POST' })
    if (r.success) {
      adminStore.showNotice(r.message || 'Đã khôi phục toàn bộ khách hàng về nguồn tự nhiên!', 'success')
      await load({ force: true })
      if (currentTab.value === 'ANALYTICS') await loadAnalytics()
    }
  } catch (e) {
    adminStore.showNotice(e.message, 'error')
    error.value = e.message
  } finally {
    resetMatchingBusy.value = false
  }
}
async function loadAnalytics(period) {
  if (period) analyticsPeriod.value = period
  analyticsBusy.value = true
  analyticsError.value = ''
  try {
    const r = await apiRequest(`/admin/facebook-ads/analytics?period=${analyticsPeriod.value}`)
    if (r.success) {
      analyticsData.value = r.data || []
      analyticsSummary.value = r.summary || analyticsSummary.value
    }
  } catch (e) {
    analyticsError.value = e.message || 'Lỗi khi tải báo cáo hiệu quả quảng cáo.'
  } finally {
    analyticsBusy.value = false
  }
}
function changePeriod(p) { loadAnalytics(p) }
function switchTab(tab) { currentTab.value = tab; if (tab === 'ANALYTICS') loadAnalytics() }
function filterByCampaign(adId) { currentTab.value = 'CARE'; adFilter.value = adId }
function selectNewArrival(customer) { select(customer); newArrivals.value = newArrivals.value.filter(item => item.id !== customer.id) }
async function createCustomer() { busy.value = true; error.value = ''; orderSyncNotice.value = ''; try { const r = await apiRequest('/admin/facebook-care', { method: 'POST', body: JSON.stringify(draft) }); customers.value.unshift(r.data); select(r.data); if (r.syncedOrders) orderSyncNotice.value = `Đã đồng bộ thông tin sang ${r.syncedOrders} đơn chưa giao.`; Object.assign(draft, blank()); showCreate.value = false } catch (e) { error.value = e.message } finally { busy.value = false } }
async function save() { if (!selected.value) return; try { const r = await apiRequest(`/admin/facebook-care/${selected.value.id}`, { method: 'PATCH', body: JSON.stringify(edit) }); Object.assign(selected.value, r.data); orderSyncNotice.value = r.syncedOrders ? `Đã đồng bộ thông tin sang ${r.syncedOrders} đơn chưa giao.` : '' } catch (e) { error.value = e.message } }
async function addMessage() { if (!messageBody.value.trim()) return; busy.value = true; try { const customerId = selected.value.id; const endpoint = messageDirection.value === 'OUT' && messengerConnected.value ? `/admin/facebook-care/${customerId}/send` : `/admin/facebook-care/${customerId}/messages`; await apiRequest(endpoint, { method: 'POST', body: JSON.stringify({ body: messageBody.value, direction: messageDirection.value }) }); messageBody.value = ''; await load({ silent: true }); select(customers.value.find(c => c.id === customerId) || selected.value) } catch (e) { error.value = e.message } finally { busy.value = false } }
const onVisible = () => { if (document.visibilityState === 'visible' && !busy.value && !syncBusy.value) load({ silent: true }) }
onMounted(() => {
  load(); loadAds()
  careTimer = setInterval(() => { if (document.visibilityState === 'visible' && !busy.value && !syncBusy.value) load({ silent: true }) }, 10000)
  adsTimer = setInterval(() => { if (document.visibilityState === 'visible' && !adsBusy.value) loadAds() }, 180000)
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', onVisible)
})
onBeforeUnmount(() => {
  if (careTimer) clearInterval(careTimer)
  if (adsTimer) clearInterval(adsTimer)
  document.removeEventListener('visibilitychange', onVisible)
  window.removeEventListener('focus', onVisible)
})
</script>

<style scoped>
.fb-care{--ink:#172033;--muted:#64748b}.ads-card{padding:16px 18px}.ads-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.ads-head h2{font-size:.95rem;margin:0}.ads-head p{font-size:.74rem;color:#64748b;margin-top:4px}.ads-empty,.ads-error{padding:14px;color:#64748b;font-size:.8rem}.ads-error{color:#b91c1c}.ads-table-wrap{overflow:auto}.ads-table{width:100%;border-collapse:collapse;font-size:.78rem}.ads-table th,.ads-table td{text-align:left;padding:9px 10px;border-bottom:1px solid #e2e8f0;white-space:nowrap}.ads-table th{color:#64748b;font-size:.7rem}.ads-table td strong,.ads-table td small{display:block}.ads-table td small{color:#94a3b8;font-size:.68rem;margin-top:3px}.source-small{color:#7c3aed!important}.ad-context{display:flex;align-items:center;gap:10px;margin-top:16px;padding:12px 14px;background:#f8fafc;border:1px solid #dbe2ec;border-radius:9px;color:#334155}.ad-context-icon{display:grid;place-items:center;width:32px;height:32px;flex:none;border-radius:7px;background:#e0e7ff;color:#4338ca;font-size:1rem}.ad-context>div{display:grid;gap:3px;min-width:0;flex:1}.ad-context strong{font-size:.78rem}.ad-context span,.ad-context small{font-size:.73rem;color:#64748b;overflow-wrap:anywhere}.ad-context-tag{font-size:.62rem!important;font-weight:800;color:#1d4ed8!important;background:#dbeafe;padding:5px 7px;border-radius:20px;white-space:nowrap}.source-card{display:grid;gap:4px;margin-top:14px;padding:12px 14px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:9px;color:#5b21b6;font-size:.78rem}.source-card small{color:#7c6aa6}.connection{display:flex;align-items:center;gap:10px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 17px;color:#9a3412}.connection>div{flex:1;min-width:0}.connection strong,.connection small{display:block}.connection small{font-size:.78rem;color:#9a6044;margin-top:3px}.sync-warn{color:#b45309!important;font-weight:600}.sync-btn{font-size:.75rem;padding:6px 10px;white-space:nowrap}.line-clamp{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.offline-dot{width:10px;height:10px;border-radius:50%;background:#f97316;flex:none}.connection-tag{font-size:.75rem;font-weight:700;background:#ffedd5;padding:6px 9px;border-radius:20px;white-space:nowrap}.create-form{padding:20px}.create-form h2,.detail h2{font-size:1rem;margin-bottom:14px}.form-grid,.edit-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:14px}.form-grid label,.edit-grid label,.notes{display:grid;gap:5px;font-size:.76rem;color:#64748b;font-weight:650}.form-grid input,.form-grid textarea,.edit-grid input,.notes textarea,.detail-head select,.message-form input,.message-form select,.search input{width:100%;border:1px solid #dbe2ec;border-radius:8px;padding:9px 10px;font:inherit;color:#172033;background:white}.stats{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.stat{border:1px solid #e2e8f0;background:white;border-radius:10px;padding:9px 13px;display:flex;gap:9px;align-items:center;color:#475569;cursor:pointer}.stat b{color:#172033}.stat.selected{border-color:#2563eb;background:#eff6ff}.ad-filter{display:flex;align-items:center;gap:7px;color:#475569;font-size:.78rem;font-weight:650}.ad-filter select{max-width:260px;border:1px solid #dbe2ec;border-radius:8px;padding:9px 10px;background:white;color:#172033;font:inherit}.search{margin-left:auto;min-width:260px}.workspace{display:grid;grid-template-columns:minmax(230px,300px) 1fr;min-height:520px;overflow:hidden}.customer-list{border-right:1px solid #e2e8f0;padding:14px;max-height:690px;overflow:auto}.list-title{font-size:.82rem;font-weight:800;padding:2px 4px 12px;display:flex;justify-content:space-between}.customer-row{position:relative;width:100%;text-align:left;border:1px solid transparent;background:#fff;border-radius:10px;padding:11px 10px;margin-bottom:5px;display:grid;gap:4px;cursor:pointer;color:#172033}.customer-row:hover,.customer-row.active{background:#f1f5f9;border-color:#cbd5e1}.customer-row strong{font-size:.86rem;padding-right:64px}.customer-row small,.customer-row em{font-size:.72rem;color:#64748b;font-style:normal}.customer-row .status{position:absolute;right:9px;top:10px}.status{font-size:.66rem;padding:3px 6px;border-radius:10px;background:#e2e8f0;color:#475569}.status.moi{background:#fee2e2;color:#b91c1c}.status.dang_tu_van{background:#dbeafe;color:#1d4ed8}.status.cho_phan_hoi{background:#fef3c7;color:#92400e}.status.da_chot{background:#dcfce7;color:#166534}.detail{padding:21px;min-width:0}.detail-head{display:flex;justify-content:space-between;align-items:start;gap:12px;border-bottom:1px solid #e2e8f0;padding-bottom:14px}.detail-head h2{margin:0 0 5px}.detail-head p{font-size:.78rem;color:#64748b}.detail-head select{width:auto;min-width:150px}.edit-grid{grid-template-columns:repeat(4,minmax(0,1fr));margin:16px 0}.notes textarea{resize:vertical}.history-head{display:flex;justify-content:space-between;align-items:baseline;margin:20px 0 10px}.history-head h3{font-size:.9rem}.history-head span{font-size:.7rem;color:#94a3b8}.history{height:220px;overflow:auto;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:9px}.message{max-width:82%;padding:9px 11px;border-radius:10px;background:white;border:1px solid #e2e8f0}.message.out{align-self:flex-end;background:#eff6ff;border-color:#bfdbfe}.message small{color:#64748b;font-size:.67rem}.message p{font-size:.83rem;margin-top:4px;white-space:pre-wrap}.message-form{display:flex;gap:8px;margin-top:10px}.message-form select{width:130px}.message-form input{flex:1}.placeholder{display:grid;place-content:center;text-align:center;color:#64748b}.placeholder div{font-size:2rem}.placeholder h2{font-size:1rem;color:#334155;margin-top:10px}.empty{padding:18px;color:#94a3b8;font-size:.8rem;text-align:center}.error{color:#b91c1c}.order-sync-notice{color:#166534;font-size:.78rem;font-weight:650}@media(max-width:800px){.workspace{grid-template-columns:1fr}.customer-list{max-height:260px;border-right:0;border-bottom:1px solid #e2e8f0}.form-grid,.edit-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.search{margin:0;width:100%}}@media(max-width:520px){.form-grid,.edit-grid{grid-template-columns:1fr}.detail-head,.history-head{align-items:flex-start;flex-direction:column}.message-form{flex-wrap:wrap}.message-form input{min-width:100%;order:1}.message-form button{order:2}}
.connection.online{background:#f0fdf4;border-color:#bbf7d0;color:#166534}.connection.online small{color:#4d7c5b}.connection.online .offline-dot{background:#22c55e}.connection.online .connection-tag{background:#dcfce7}.ai-tag{margin-left:0;font-size:.75rem;font-weight:700;background:#e2e8f0;color:#475569;padding:6px 9px;border-radius:20px;white-space:nowrap}.ai-tag.active{background:#dbeafe;color:#1d4ed8}@media(max-width:520px){.connection{align-items:flex-start;flex-wrap:wrap}.sync-btn{margin-left:20px}}
.new-arrivals{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:12px 0;padding:10px 13px;border:1px solid #86efac;border-radius:9px;background:#f0fdf4;color:#166534;font-size:.78rem}.new-arrivals button{border:1px solid #bbf7d0;border-radius:999px;background:#fff;padding:5px 9px;color:#166534;cursor:pointer}.new-arrivals .dismiss-arrivals{margin-left:auto;border:0;background:transparent;color:#64748b}
.auto-match-btn{font-size:.74rem;padding:6px 12px;border-radius:8px;font-weight:700;white-space:nowrap;cursor:pointer;background:#f59e0b;color:#fff;border:none;transition:all .15s}
.auto-match-btn:hover{background:#d97706}
.auto-match-notice{color:#15803d;font-weight:700;font-size:.78rem;background:#f0fdf4;border:1px solid #bbf7d0;padding:8px 12px;border-radius:8px;margin-top:10px}
.ad-select-label select{width:100%;border:1px solid #dbe2ec;border-radius:8px;padding:9px 10px;background:#f8fafc;font:inherit;color:#1e293b;font-weight:600}

/* TABS ĐIỀU HƯỚNG CHÍNH */
.head-btn-group{display:flex;gap:8px}
.view-tabs{display:flex;gap:8px;margin-bottom:14px;border-bottom:2px solid #e2e8f0;padding-bottom:1px}
.view-tab-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border:none;background:transparent;font-size:.86rem;font-weight:700;color:#64748b;cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-3px;transition:all .2s ease}
.view-tab-btn:hover{color:#1e293b}
.view-tab-btn.active{color:#2563eb;border-bottom-color:#2563eb}
.tab-badge-hot{font-size:.64rem;background:#fee2e2;color:#dc2626;padding:2px 6px;border-radius:999px;font-weight:800}

/* KPI GRID PHÂN TÍCH HIỆU QUẢ QUẢNG CÁO */
.analytics-tab-content{display:flex;flex-direction:column;gap:16px}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}
.kpi-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,0.04);display:flex;flex-direction:column;gap:4px}
.kpi-card.highlight-kpi{background:#faf5ff;border-color:#e9d5ff}
.kpi-header{display:flex;align-items:center;gap:6px}
.kpi-icon{font-size:1.1rem}
.kpi-label{font-size:.73rem;font-weight:700;color:#64748b}
.kpi-val{font-size:1.35rem;font-weight:900;line-height:1.2;margin:4px 0}
.kpi-sub{font-size:.68rem;color:#94a3b8}

/* KHUYẾN NGHỊ THÔNG MINH AI */
.ai-insight-box{display:flex;align-items:center;gap:14px;padding:14px 18px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;color:#92400e}
.insight-icon{font-size:1.8rem;flex:none}
.insight-content{flex:1;min-width:0}
.insight-content h4{font-size:.88rem;margin:0 0 3px;color:#78350f;font-weight:800}
.insight-content p{font-size:.78rem;margin:0;line-height:1.45;color:#92400e}

/* BẢNG XẾP HẠNG QUẢNG CÁO */
.analytics-table-card{padding:18px 20px}
.table-card-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.table-card-head h3{font-size:.95rem;margin:0;color:#0f172a;font-weight:800}
.table-card-head p{font-size:.74rem;color:#64748b;margin:3px 0 0}
.head-actions{display:flex;gap:8px}
.analytics-table-wrap{overflow-x:auto}
.meta-status-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;font-size:.68rem;font-weight:700;white-space:nowrap}
.pill-active{background:#dcfce7;color:#15803d;border:1px solid #bbf7d0}
.pill-paused{background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0}
.period-btn-group{display:inline-flex;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden}
.period-btn{padding:5px 10px;font-size:.73rem;font-weight:700;border:none;background:#f8fafc;color:#475569;cursor:pointer;transition:all .15s}
.period-btn:hover{background:#e2e8f0}
.period-btn.active{background:#2563eb;color:#fff}

.analytics-table{width:100%;border-collapse:collapse;font-size:.78rem}
.analytics-table th{background:#f8fafc;padding:10px 11px;text-align:left;color:#475569;font-weight:700;border-bottom:2px solid #e2e8f0;white-space:nowrap}
.analytics-table td{padding:12px 11px;border-bottom:1px solid #e2e8f0;vertical-align:middle}
.analytics-table tr:hover td{background:#f8fafc}
.badge-leads{display:inline-block;padding:3px 8px;background:#e0f2fe;color:#0369a1;border-radius:999px;font-weight:700;font-size:.74rem}
.badge-meta-msg{display:inline-block;padding:3px 8px;background:#ede9fe;color:#6d28d9;border-radius:999px;font-weight:700;font-size:.74rem}
.cr-wrap{display:flex;flex-direction:column;gap:3px}
.cr-bar{width:56px;height:5px;background:#e2e8f0;border-radius:3px;overflow:hidden}
.cr-fill{height:100%;background:#16a34a;border-radius:3px}
.roas-pill{display:inline-block;padding:3px 9px;border-radius:999px;font-weight:800;font-size:.76rem}
.roas-high{background:#dcfce7;color:#15803d;border:1px solid #bbf7d0}
.roas-mid{background:#e0e7ff;color:#3730a3;border:1px solid #c7d2fe}
.roas-zero{background:#f1f5f9;color:#64748b}
.rec-wrap{display:flex;flex-direction:column;gap:3px;max-width:260px}
.grade-tag{display:inline-block;font-size:.65rem;font-weight:800;padding:2px 7px;border-radius:4px;width:fit-content}
.grade-star{background:#dcfce7;color:#15803d}
.grade-good{background:#dbeafe;color:#1d4ed8}
.grade-warning{background:#fef3c7;color:#b45309}
.grade-bad{background:#fee2e2;color:#b91c1c}
.grade-neutral{background:#f1f5f9;color:#475569}
.rec-text{font-size:.7rem;color:#475569;margin:0;line-height:1.35}
.font-bold{font-weight:700}
.text-red{color:#dc2626}
.text-blue{color:#2563eb}
.text-amber{color:#d97706}
.text-green{color:#16a34a}
.text-gold{color:#b45309}
.text-purple{color:#7e22ce}
.adm-btn-outline{background:#fff;border:1px solid #cbd5e1;color:#334155}
.adm-btn-outline:hover{background:#f1f5f9;border-color:#94a3b8}

@media(max-width:768px){
  .kpi-grid{grid-template-columns:repeat(2,1fr)}
  .view-tabs{overflow-x:auto}
  .ai-insight-box{flex-direction:column;align-items:flex-start}
}
</style>
