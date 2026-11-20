<template>
  <div class="adm-page fb-care">
    <!-- Đầu trang Facebook Care & Phân Tích Quảng Cáo -->
    <div class="adm-page-head">
      <div class="fb-title-wrap">
        <h1 class="adm-page-title">Chăm Sóc Khách & Phân Tích Ads</h1>
        <p class="adm-page-sub">Theo sát khách hàng từ lúc nhắn tin đến khi chốt đơn, đo lường chi phí Meta Ads thực tế.</p>
      </div>
      <div class="head-btn-group">
        <button v-if="currentTab === 'CARE'" class="ios-action-pill" @click="showCreate = !showCreate">
          ＋ Thêm Khách Mới
        </button>
        <button v-else class="ios-action-pill" :disabled="analyticsBusy" @click="loadAnalytics">
          ↻ Tải Lại Số Liệu
        </button>
      </div>
    </div>

    <!-- Thanh chuyển đổi chức năng: Chăm sóc CRM vs Phân tích hiệu quả quảng cáo -->
    <div class="view-tabs">
      <button
        type="button"
        :class="['view-tab-btn', { active: currentTab === 'CARE' }]"
        @click="currentTab = 'CARE'"
      >
        <span class="tab-label-full">💬 Chăm Sóc Tin Nhắn & Khách Hàng ({{ customers.length }})</span>
        <span class="tab-label-short">💬 Khách Hàng ({{ customers.length }})</span>
      </button>
      <button
        type="button"
        :class="['view-tab-btn', { active: currentTab === 'ANALYTICS' }]"
        @click="switchTab('ANALYTICS')"
      >
        <span class="tab-label-full">📊 Phân Tích Hiệu Quả Quảng Cáo & ROI</span>
        <span class="tab-label-short">📊 Phân Tích & ROI</span>
      </button>
    </div>

    <!-- TAB 1: CHĂM SÓC KHÁCH HÀNG CRM -->
    <div v-if="currentTab === 'CARE'" class="care-tab-content">
      <!-- Thẻ kết nối Facebook Messenger (Apple Grouped Inset Card) -->
      <div :class="['connection-card', { online: messengerConnected }]">
        <div class="conn-top-row">
          <div class="conn-title-group">
            <span class="conn-dot"></span>
            <strong>{{ messengerConnected ? 'Facebook Messenger' : 'Hệ Thống CRM Facebook' }}</strong>
          </div>
          <span class="connection-tag">{{ messengerConnected ? 'Messenger Live' : 'CRM Sẵn Sàng' }}</span>
        </div>
        <p class="conn-desc-text">
          {{ messengerConnected ? `Tin nhắn tự động đồng bộ từ Fanpage${lastSyncedAt ? ' · Cập nhật ' + displayTime(lastSyncedAt) : ''}` : 'Hồ sơ khách từ Fanpage và Website sẵn sàng tiếp nhận, chăm sóc và theo dõi tiến độ chốt đơn.' }}
        </p>
        <div v-if="messengerConnected" class="conn-action-row">
          <button class="sync-action-btn" @click="forceSync" :disabled="syncBusy">
            {{ syncBusy ? 'Đang quét tin nhắn…' : '↻ Quét tin nhắn mới ngay' }}
          </button>
        </div>
      </div>

      <div v-if="newArrivals.length" class="new-arrivals">
        <strong>🔔 {{ newArrivals.length }} khách mới vừa vào:</strong>
        <button v-for="customer in newArrivals" :key="customer.id" type="button" @click="selectNewArrival(customer)">
          {{ customer.customerName }}{{ customer.phone ? ` · ${customer.phone}` : '' }}
        </button>
        <button type="button" class="dismiss-arrivals" @click="newArrivals = []">Ẩn</button>
      </div>

      <!-- Danh sách quảng cáo đang chạy (Responsive Desktop Table + Mobile Cards) -->
      <section v-if="adsConfigured && ads.length > 0" class="ads-card adm-card">
        <div class="ads-head">
          <div>
            <h2>Quảng Cáo Meta Đang Chạy</h2>
            <p>Số liệu phân phối & chi tiêu 30 ngày gần nhất từ Ads Manager</p>
          </div>
          <button class="refresh-ads-btn" @click="loadAds" :disabled="adsBusy">
            {{ adsBusy ? 'Đang tải…' : '↻ Làm mới' }}
          </button>
        </div>

        <!-- Desktop View: Bảng dữ liệu Inset Table chuẩn -->
        <div class="ads-table-wrap desktop-only">
          <table class="ads-table">
            <thead>
              <tr>
                <th>Quảng Cáo</th>
                <th>Chiến Dịch</th>
                <th>Lượt Hiển Thị</th>
                <th>Lượt Nhấp</th>
                <th class="text-right">Chi Tiêu (30 Ngày)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ad in ads" :key="ad.id">
                <td>
                  <strong>{{ ad.name }}</strong>
                  <small>{{ ad.adsetName || ('ID: ' + ad.id) }}</small>
                </td>
                <td>{{ ad.campaignName || '—' }}</td>
                <td>{{ formatNumber(ad.impressions) }}</td>
                <td>{{ formatNumber(ad.clicks) }}</td>
                <td class="text-right text-red font-bold">{{ formatMoney(ad.spend) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile View: Danh sách thẻ Apple Inset Cards gọn gàng -->
        <div class="ads-mobile-list mobile-only">
          <div v-for="ad in ads" :key="ad.id" class="ad-item-card">
            <div class="ad-item-top">
              <strong class="ad-item-name">{{ ad.name }}</strong>
              <span class="ad-item-spend">{{ formatMoney(ad.spend) }}</span>
            </div>
            <span class="ad-item-sub">{{ ad.campaignName || ad.adsetName || ('ID: ' + ad.id) }}</span>
            <div class="ad-item-stats">
              <span class="ad-stat-chip">👁 <b>{{ formatNumber(ad.impressions) }}</b> hiển thị</span>
              <span class="ad-stat-chip">👆 <b>{{ formatNumber(ad.clicks) }}</b> nhấp</span>
            </div>
          </div>
        </div>
      </section>

      <form v-if="showCreate" class="adm-card create-form" @submit.prevent="createCustomer">
        <h2>Thêm khách cần chăm sóc</h2>
        <div class="form-grid">
          <label>Tên khách *<input v-model="draft.customerName" required placeholder="Tên hiển thị Facebook"></label>
          <label>Facebook ID / link hồ sơ<input v-model="draft.facebookId" placeholder="Tùy chọn"></label>
          <label>Số điện thoại<input v-model="draft.phone" placeholder="Nếu khách đã cung cấp"></label>
          <label>Sản phẩm quan tâm<input v-model="draft.interest" placeholder="Ví dụ: Dàn karaoke 29 triệu"></label>
          <label>Địa chỉ khách<input v-model="draft.address" placeholder="Số nhà, đường, xã/phường"></label>
          <label>Tỉnh/thành<input v-model="draft.province" list="fb-province-options" placeholder="Chọn hoặc nhập tỉnh/thành"></label>
          <label>Nhắc chăm sóc lúc<input v-model="draft.followUpAt" type="datetime-local"></label>
          <label class="form-span-full">Ghi chú<textarea v-model="draft.notes" rows="2" placeholder="Nhu cầu, khu vực, vấn đề đang gặp"></textarea></label>
        </div>
        <button class="ios-action-pill" :disabled="busy">{{ busy ? 'Đang lưu…' : 'Lưu hồ sơ' }}</button>
      </form>
      <datalist id="fb-province-options"><option v-for="p in VIETNAM_PROVINCES" :key="p.name" :value="p.displayName" /></datalist>

      <!-- Thanh công cụ Tìm kiếm & Bộ lọc (Apple iOS Grouped Toolbar) -->
      <div class="fb-toolbar">
        <div class="fb-search-wrap">
          <span class="search-ico">🔍</span>
          <input v-model="keyword" placeholder="Tìm tên khách, số điện thoại, nhu cầu…" />
        </div>

        <div class="fb-status-scroll">
          <button
            v-for="item in statusOptions"
            :key="item.key"
            :class="['fb-pill-btn', { active: filter === item.key }]"
            @click="filter = item.key"
          >
            <span>{{ item.label }}</span>
            <b class="pill-count">{{ item.key === 'ALL' ? customers.length : customers.filter(c => c.status === item.key).length }}</b>
          </button>
        </div>

        <div class="fb-source-row">
          <select v-model="adFilter" class="fb-source-select" aria-label="Lọc nguồn quảng cáo">
            <option value="ALL">Tất cả nguồn quảng cáo</option>
            <option value="NONE">Chưa xác định quảng cáo</option>
            <option v-for="ad in knownAds" :key="ad.id" :value="ad.id">{{ ad.name }} ({{ ad.count }})</option>
          </select>
          <div class="fb-match-btns">
            <button
              type="button"
              class="fb-btn-match"
              :disabled="autoMatchingBusy || resetMatchingBusy"
              @click="autoMatchAds"
              title="Tự động phân tích hội thoại theo ngày và nội dung cụ thể để gắn nguồn quảng cáo"
            >
              {{ autoMatchingBusy ? 'Đang phân loại...' : '⚡ Khớp nguồn' }}
            </button>
            <button
              type="button"
              class="fb-btn-unmatch"
              :disabled="autoMatchingBusy || resetMatchingBusy"
              @click="resetMatchedAds"
              title="Khôi phục toàn bộ khách hàng về trạng thái Chưa xác định nguồn quảng cáo"
            >
              {{ resetMatchingBusy ? 'Đang bỏ khớp...' : '↺ Bỏ khớp' }}
            </button>
          </div>
        </div>
      </div>

      <div class="workspace adm-card">
        <div class="customer-list">
          <div class="list-title">Danh sách khách <span>{{ visibleCustomers.length }}</span></div>
          <button
            v-for="c in visibleCustomers"
            :key="c.id"
            :class="['customer-row', { active: selected?.id === c.id }]"
            @click="select(c)"
          >
            <strong>{{ c.customerName }}</strong>
            <small class="line-clamp">{{ c.interest || c.lastMessage || 'Chưa ghi nhu cầu' }}</small>
            <small>{{ c.phone || c.facebookId || c.id }}</small>
            <small v-if="c.sourceAdName || c.sourceAdId" class="source-small">Nguồn QC: {{ c.sourceAdName || c.sourceAdId }}</small>
            <small v-else-if="c.sourceType">Nguồn: {{ c.sourceType }}</small>
            <span :class="['status', c.status.toLowerCase()]">{{ labelFor(c.status) }}</span>
            <em v-if="c.followUpAt">Nhắc: {{ displayDate(c.followUpAt) }}</em>
          </button>
          <p v-if="!visibleCustomers.length" class="empty">Chưa có khách. Hệ thống tự động đồng bộ tin nhắn từ Fanpage.</p>
        </div>

        <section v-if="selected" class="detail">
          <div class="detail-head">
            <div>
              <h2>{{ selected.customerName }}</h2>
              <p>{{ selected.phone || 'Chưa có số điện thoại' }} <span v-if="selected.facebookId"> · {{ selected.facebookId }}</span></p>
            </div>
            <select v-model="edit.status" @change="save">
              <option v-for="s in statusOptions.slice(1)" :key="s.key" :value="s.key">{{ s.label }}</option>
            </select>
          </div>

          <div class="edit-grid">
            <label>Nhu cầu<input v-model="edit.interest" @change="save"></label>
            <label>Điện thoại<input v-model="edit.phone" @change="save"></label>
            <label>Địa chỉ<input v-model="edit.address" placeholder="Địa chỉ lắp đặt" @change="save"></label>
            <label>Tỉnh/thành<input v-model="edit.province" list="fb-province-options" @change="save"></label>
            <label>Nhắc chăm sóc<input v-model="edit.followUpAt" type="datetime-local" @change="save"></label>
            <label>Phụ trách<input v-model="edit.assignedTo" @change="save"></label>
            <label class="ad-select-label form-span-full">Gắn nguồn quảng cáo<select v-model="edit.sourceAdId" @change="onSourceAdChange"><option value="">-- Chưa gắn quảng cáo --</option><option v-for="ad in ads" :key="ad.id" :value="ad.id">{{ ad.name }}</option></select></label>
          </div>

          <label class="notes">Ghi chú khách hàng<textarea v-model="edit.notes" rows="3" @change="save"></textarea></label>
          <div v-if="selected.sourceAdId || selected.sourceType" class="ad-context">
            <span class="ad-context-icon">▣</span>
            <div>
              <strong>{{ selected.sourceAdId ? 'Cuộc trò chuyện này đến từ quảng cáo' : 'Nguồn cuộc trò chuyện từ Meta' }}</strong>
              <span>{{ selected.sourceAdName || (selected.sourceAdId ? `Quảng cáo ID ${selected.sourceAdId}` : selected.sourceType) }}</span>
              <small v-if="selected.sourceCampaignName">Chiến dịch: {{ selected.sourceCampaignName }}</small>
            </div>
            <span v-if="selected.sourceAdId" class="ad-context-tag">QUẢNG CÁO</span>
          </div>

          <div class="history-head">
            <h3>Lịch sử tư vấn</h3>
            <span>{{ messengerConnected ? 'Tin nhắn OUT sẽ gửi qua Messenger' : 'Ghi nhận nội bộ · Messenger chưa kết nối' }}</span>
          </div>
          <div class="history">
            <div v-for="m in selected.messages" :key="m.id" :class="['message', m.direction === 'OUT' ? 'out' : 'in']">
              <small>{{ m.direction === 'OUT' ? 'Đã tư vấn' : 'Khách nhắn' }} · {{ displayDate(m.createdAt) }}</small>
              <p>{{ m.body }}</p>
            </div>
            <p v-if="!selected.messages?.length" class="empty">Chưa có ghi nhận hội thoại.</p>
          </div>

          <form class="message-form" @submit.prevent="addMessage">
            <select v-model="messageDirection">
              <option value="IN">Khách nhắn</option>
              <option value="OUT">{{ messengerConnected ? 'Trả lời khách' : 'Đã tư vấn' }}</option>
            </select>
            <input v-model="messageBody" :placeholder="messageDirection === 'OUT' && messengerConnected ? 'Soạn tin nhắn gửi khách…' : 'Ghi nội dung trao đổi…'" required>
            <button class="ios-action-pill" :disabled="busy">{{ busy ? 'Đang gửi…' : messageDirection === 'OUT' && messengerConnected ? 'Gửi Messenger' : 'Ghi lại' }}</button>
          </form>
        </section>

        <section v-else class="placeholder">
          <div>💬</div>
          <h2>Chọn hồ sơ khách hàng</h2>
          <p>Thông tin và lịch sử chăm sóc sẽ hiển thị tại đây.</p>
        </section>
      </div>
      <p v-if="orderSyncNotice" class="order-sync-notice">{{ orderSyncNotice }}</p>
      <p v-if="autoMatchNotice" class="auto-match-notice">⚡ {{ autoMatchNotice }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <!-- TAB 2: BÁO CÁO PHÂN TÍCH HIỆU QUẢ QUẢNG CÁO & ROI -->
    <div v-else-if="currentTab === 'ANALYTICS'" class="analytics-tab-content">
      <!-- 4 THẺ CHỈ SỐ QUẢN TRỊ CAO CẤP (FUTURISTIC HERO METRICS) -->
      <div class="cockpit-hero-grid">
        <!-- Thẻ 1: Ngân Sách -->
        <div class="cockpit-card card-spend">
          <div class="card-glow glow-red"></div>
          <div class="card-head">
            <div class="card-title-wrap">
              <span class="card-icon">💳</span>
              <span class="card-title">NGÂN SÁCH ĐÃ TIÊU</span>
            </div>
            <span class="period-badge">{{ analyticsSummary.periodLabel || 'Hôm nay' }}</span>
          </div>
          <div class="card-main-val text-neon-red">{{ formatMoney(analyticsSummary.totalSpend) }}</div>
          <div class="card-foot">
            <span class="live-dot-pulse"></span>
            <span>{{ analyticsData.filter(a => a.isMetaActive).length }} chiến dịch đang cắn tiền phân phối</span>
          </div>
        </div>

        <!-- Thẻ 2: Tin Nhắn & CPL -->
        <div class="cockpit-card card-leads">
          <div class="card-glow glow-blue"></div>
          <div class="card-head">
            <div class="card-title-wrap">
              <span class="card-icon">💬</span>
              <span class="card-title">TIN NHẮN & GIÁ / TIN (CPL)</span>
            </div>
            <span class="rate-badge">{{ analyticsSummary.avgCpl > 0 ? formatMoney(analyticsSummary.avgCpl) + ' / tin' : 'Chưa phát sinh' }}</span>
          </div>
          <div class="card-main-val text-neon-blue">
            {{ analyticsSummary.totalLeads }} <span class="val-sub">tin / khách</span>
          </div>
          <div class="card-foot">
            <span>Chi phí tin nhắn: <strong class="text-amber">{{ analyticsSummary.avgCpl > 0 ? formatMoney(analyticsSummary.avgCpl) : '—' }}</strong></span>
          </div>
        </div>

        <!-- Thẻ 3: Độ Hút Content (CTR & CPM) -->
        <div class="cockpit-card card-content">
          <div class="card-glow glow-green"></div>
          <div class="card-head">
            <div class="card-title-wrap">
              <span class="card-icon">🎯</span>
              <span class="card-title">SỨC HÚT CONTENT & CPM</span>
            </div>
            <span :class="['ctr-badge', (analyticsSummary.avgCtr || 0) >= 2 ? 'badge-super' : 'badge-normal']">
              {{ (analyticsSummary.avgCtr || 0) >= 2 ? '🔥 Content Cực Hút' : 'Cần Tối Ưu' }}
            </span>
          </div>
          <div class="card-main-val text-neon-green">
            {{ analyticsSummary.avgCtr || 0 }}% <span class="val-sub">CTR</span>
          </div>
          <div class="card-foot">
            <span>CPM trung bình: <strong>{{ formatMoney(analyticsSummary.avgCpm || 0) }}</strong></span>
          </div>
        </div>

        <!-- Thẻ 4: Doanh Thu & ROAS -->
        <div class="cockpit-card card-roas">
          <div class="card-glow glow-purple"></div>
          <div class="card-head">
            <div class="card-title-wrap">
              <span class="card-icon">🚀</span>
              <span class="card-title">DOANH THU & HOÀN VỐN (ROAS)</span>
            </div>
            <span class="roas-top-badge">{{ analyticsSummary.avgRoas }}x ROAS</span>
          </div>
          <div class="card-main-val text-neon-gold">{{ formatMoney(analyticsSummary.totalRevenue) }}</div>
          <div class="card-foot">
            <span>Đã chốt: <strong class="text-green">{{ analyticsSummary.totalClosed }} đơn</strong> (Tỷ lệ: {{ analyticsSummary.overallCr }}%)</span>
          </div>
        </div>
      </div>

      <!-- HUD CHẨN ĐOÁN AI & PHƯƠNG PHÁP CHU MINH HẠNH -->
      <div class="cyber-radar-hud">
        <div class="radar-scan-effect"></div>
        <div class="hud-left">
          <div class="hud-radar-icon">
            <span class="radar-core"></span>
            <span class="radar-ring"></span>
          </div>
          <div class="hud-info">
            <div class="hud-tag">AI CHẨN ĐOÁN & RA QUYẾT ĐỊNH · CHU MINH HẠNH METHOD</div>
            <h3 class="hud-title">Bắt Mạch Chiến Dịch Quảng Cáo & Đề Xuất Tối Ưu Tức Thì</h3>
            <p class="hud-desc">
              Phân tích chéo giữa <strong>Độ hút Content (CTR)</strong>, <strong>Độ bão hòa tệp (Tần suất)</strong>, 
              <strong>Chi phí tiếp cận (CPM)</strong> và <strong>Tỷ lệ chốt đơn</strong> để quyết định: Tắt camp đốt tiền, sửa 3s đầu video hay Vít ngân sách.
            </p>
          </div>
        </div>
        <div class="hud-right">
          <div class="quick-status-pills">
            <span v-if="(analyticsSummary.avgCtr || 0) >= 2" class="status-pill pill-success">
              ✓ Content 3s đầu rất tốt (CTR {{ analyticsSummary.avgCtr }}%)
            </span>
            <span v-if="(analyticsSummary.avgCpm || 0) <= 70000 && (analyticsSummary.avgCpm || 0) > 0" class="status-pill pill-success">
              ✓ Giá thầu CPM rẻ ({{ formatMoney(analyticsSummary.avgCpm) }})
            </span>
            <span v-if="analyticsSummary.totalLeads > 0 && analyticsSummary.totalClosed === 0" class="status-pill pill-warning">
              ⚠️ Tập trung tối ưu kịch bản chốt sale
            </span>
          </div>
          <div class="hud-actions-row">
            <button type="button" class="adm-btn adm-btn-sm cyber-btn-gold" @click="autoMatchAds" :disabled="autoMatchingBusy || resetMatchingBusy">
              {{ autoMatchingBusy ? 'Đang phân loại...' : '⚡ Khớp Nguồn QC' }}
            </button>
            <button type="button" class="adm-btn adm-btn-sm cyber-btn-outline" @click="resetMatchedAds" :disabled="autoMatchingBusy || resetMatchingBusy">
              {{ resetMatchingBusy ? 'Đang bỏ khớp...' : '↺ Bỏ Khớp Nguồn' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Bảng xếp hạng chi tiết từng quảng cáo (Futuristic 7-Column Layout) -->
      <div class="adm-card analytics-table-card">
        <div class="table-card-head">
          <div class="head-title-wrap">
            <h3>Bảng Bắt Bệnh & Hiệu Quả Từng Quảng Cáo (ROI & Technical Ranking)</h3>
            <p class="period-indicator-text">
              Đang đối soát: <strong class="text-neon-blue">{{ analyticsSummary.periodLabel || 'Hôm nay' }}</strong> · CTR, CPM, Freq, Mess và Doanh thu thực tế
            </p>
          </div>

          <div class="head-actions">
            <!-- Cụm chọn nhanh ngày chuẩn Facebook Ads -->
            <div class="period-btn-group">
              <button
                type="button"
                :class="['period-btn', { active: analyticsPeriod === 'today' }]"
                @click="changePeriod('today')"
                title="Xem chi phí & khách hôm nay"
              >
                ⚡ Hôm nay
              </button>
              <button
                type="button"
                :class="['period-btn', { active: analyticsPeriod === 'yesterday' }]"
                @click="changePeriod('yesterday')"
                title="Xem chi phí & khách ngày hôm qua"
              >
                📅 Hôm qua
              </button>
              <button
                type="button"
                :class="['period-btn', { active: analyticsPeriod === '7d' }]"
                @click="changePeriod('7d')"
                title="Xem 7 ngày gần nhất"
              >
                7 ngày qua
              </button>
              <button
                type="button"
                :class="['period-btn', { active: analyticsPeriod === 'this_month' }]"
                @click="changePeriod('this_month')"
                title="Xem toàn bộ tháng này"
              >
                Tháng này
              </button>
              <button
                type="button"
                :class="['period-btn', { active: analyticsPeriod === '30d' }]"
                @click="changePeriod('30d')"
                title="Xem 30 ngày gần nhất"
              >
                30 ngày
              </button>
              <button
                type="button"
                :class="['period-btn', { active: analyticsPeriod === 'maximum' }]"
                @click="changePeriod('maximum')"
                title="Xem toàn bộ lịch sử (Trọn đời)"
              >
                🌐 Trọn đời
              </button>
            </div>

            <!-- Bộ chọn khoảng ngày tùy chỉnh (Custom Date Range) -->
            <div :class="['custom-date-box', { active: analyticsPeriod === 'custom' }]">
              <span class="custom-date-icon">🗓️</span>
              <input type="date" v-model="customFrom" class="date-picker-input" title="Từ ngày (YYYY-MM-DD)" />
              <span class="date-arrow">→</span>
              <input type="date" v-model="customTo" class="date-picker-input" title="Đến ngày (YYYY-MM-DD)" />
              <button
                type="button"
                class="apply-date-btn"
                @click="applyCustomDateRange"
                :disabled="!customFrom || !customTo || analyticsBusy"
                title="Bấm để lọc theo khoảng ngày đã chọn"
              >
                Lọc ngày
              </button>
            </div>

            <!-- Nút làm mới dữ liệu -->
            <button type="button" class="refresh-btn" @click="loadAnalytics()" :disabled="analyticsBusy">
              {{ analyticsBusy ? 'Đang tải...' : '↻ Làm Mới' }}
            </button>
          </div>
        </div>

        <!-- Thanh phân loại phụ: Bộ lọc trạng thái hoạt động / tạm dừng -->
        <div class="table-sub-bar">
          <div class="status-btn-group">
            <button
              type="button"
              :class="['status-btn', { active: analyticsStatusFilter === 'ALL' }]"
              @click="analyticsStatusFilter = 'ALL'"
              title="Xem tất cả chiến dịch"
            >
              Tất cả ({{ analyticsData.length }})
            </button>
            <button
              type="button"
              :class="['status-btn status-btn-active', { active: analyticsStatusFilter === 'ACTIVE' }]"
              @click="analyticsStatusFilter = 'ACTIVE'"
              title="Chỉ hiển thị các chiến dịch đang chạy trên Meta"
            >
              🟢 Đang chạy ({{ activeAdsCount }})
            </button>
            <button
              type="button"
              :class="['status-btn status-btn-paused', { active: analyticsStatusFilter === 'PAUSED' }]"
              @click="analyticsStatusFilter = 'PAUSED'"
              title="Chỉ hiển thị các chiến dịch đã tắt hoặc tạm dừng"
            >
              ⏸️ Đã tạm dừng ({{ pausedAdsCount }})
            </button>
          </div>
          <div class="table-stats-hint">
            <span>Hiển thị <strong>{{ filteredAnalyticsData.length }}</strong> / {{ analyticsData.length }} chiến dịch</span>
          </div>
        </div>

        <div class="analytics-table-wrap">
          <table class="analytics-table futuristic-table">
            <thead>
              <tr>
                <th>Chiến Dịch & Trạng Thái</th>
                <th>Chi Phí & Giá / Tin</th>
                <th>Chỉ Số Content (CTR · CPM)</th>
                <th>Tin Nhắn & Khách CRM</th>
                <th>Đơn Chốt & Doanh Thu</th>
                <th>Bắt Bệnh & Quyết Định (Chu Minh Hạnh)</th>
                <th class="text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredAnalyticsData" :key="item.id" :class="`row-status-${item.isMetaActive ? 'active' : 'paused'}`">
                <!-- Cột 1: Chiến Dịch & Trạng Thái -->
                <td class="col-campaign">
                  <div class="campaign-cell">
                    <div class="campaign-status-row">
                      <span :class="['cyber-dot', item.isMetaActive ? 'dot-active' : 'dot-paused']"></span>
                      <span :class="['meta-status-text', item.isMetaActive ? 'text-active' : 'text-paused']">
                        {{ item.isMetaActive ? 'ĐANG CHẠY TRÊN META' : 'ĐÃ TẠM DỪNG' }}
                      </span>
                    </div>
                    <strong class="campaign-title">{{ item.name }}</strong>
                    <span class="campaign-sub">{{ item.campaignName || ('ID: ' + item.id) }}</span>
                  </div>
                </td>

                <!-- Cột 2: Chi Phí & Giá / Tin (CPL) -->
                <td class="col-spend">
                  <div class="spend-cell">
                    <div class="spend-val font-bold text-red">{{ formatMoney(item.spend) }}</div>
                    <div class="cpl-sub">
                      Giá/tin: <strong class="text-amber">{{ item.cpl > 0 ? formatMoney(item.cpl) : '—' }}</strong>
                    </div>
                  </div>
                </td>

                <!-- Cột 3: Chỉ Số Content (CTR, CPM, Tần suất) -->
                <td class="col-metrics">
                  <div class="metrics-cell">
                    <div class="ctr-badge-row">
                      <span :class="['metric-pill', (item.ctr || 0) >= 2 ? 'metric-good' : ((item.ctr || 0) < 1.2 && item.spend > 100000 ? 'metric-bad' : 'metric-neutral')]">
                        CTR: <b>{{ item.ctr || 0 }}%</b>
                      </span>
                      <span v-if="(item.ctr || 0) >= 2" class="tag-hot">HÚT</span>
                    </div>
                    <div class="meta-sub-metrics">
                      <span>CPM: {{ formatMoney(item.cpm || 0) }}</span>
                      <span>·</span>
                      <span>Freq: {{ item.frequency || 1 }}x</span>
                    </div>
                  </div>
                </td>

                <!-- Cột 4: Tin Nhắn & Khách CRM -->
                <td class="col-leads">
                  <div class="leads-cell">
                    <div class="leads-badge-row">
                      <span class="badge-meta-msg">⚡ {{ item.metaMessages || 0 }} tin Meta</span>
                    </div>
                    <div class="crm-lead-sub">
                      👥 {{ item.totalCustomers || 0 }} khách trong CRM
                    </div>
                  </div>
                </td>

                <!-- Cột 5: Đơn Chốt & Doanh Thu -->
                <td class="col-revenue">
                  <div class="rev-cell">
                    <div class="orders-row">
                      <span class="font-bold text-green">{{ item.closedCustomers }} đơn</span>
                      <span class="text-gold font-bold">({{ formatMoney(item.effectiveRevenue) }})</span>
                    </div>
                    <div class="roas-row">
                      <span :class="['roas-pill', item.roas >= 3 ? 'roas-high' : item.roas > 0 ? 'roas-mid' : 'roas-zero']">
                        ROAS: {{ item.roas }}x
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Cột 6: Bắt Bệnh & Ra Quyết Định (Chu Minh Hạnh) -->
                <td class="col-diagnosis">
                  <div class="diagnosis-box">
                    <div class="action-badge-row">
                      <span :class="['action-badge', `action-${(item.diagnosis?.action || 'HOLD').toLowerCase()}`]">
                        {{ item.diagnosis?.actionLabel || item.gradeLabel }}
                      </span>
                    </div>
                    <strong class="disease-title">{{ item.diagnosis?.disease || item.gradeLabel }}</strong>
                    <p class="rec-text">{{ item.diagnosis?.advice || item.recommendation }}</p>
                  </div>
                </td>

                <!-- Cột 7: Thao Tác -->
                <td class="col-action text-right">
                  <button type="button" class="table-action-btn" @click="filterByCampaign(item.id)">
                    Xem khách →
                  </button>
                </td>
              </tr>
              <tr v-if="!filteredAnalyticsData.length">
                <td colspan="7" class="empty">
                  {{ analyticsBusy ? 'Đang tải dữ liệu chiến dịch...' : (analyticsStatusFilter === 'ACTIVE' ? 'Không có chiến dịch nào đang chạy trên Meta.' : (analyticsStatusFilter === 'PAUSED' ? 'Không có chiến dịch nào đã tạm dừng.' : 'Chưa có dữ liệu phân tích chiến dịch.')) }}
                </td>
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
const analyticsPeriod = ref('today')
const customFrom = ref('')
const customTo = ref('')
const analyticsStatusFilter = ref('ALL') // 'ALL' | 'ACTIVE' | 'PAUSED'
const activeAdsCount = computed(() => analyticsData.value.filter(a => a.isMetaActive).length)
const pausedAdsCount = computed(() => analyticsData.value.filter(a => !a.isMetaActive).length)
const filteredAnalyticsData = computed(() => {
  if (analyticsStatusFilter.value === 'ACTIVE') return analyticsData.value.filter(a => a.isMetaActive)
  if (analyticsStatusFilter.value === 'PAUSED') return analyticsData.value.filter(a => !a.isMetaActive)
  return analyticsData.value
})
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
    let url = `/admin/facebook-ads/analytics?period=${encodeURIComponent(analyticsPeriod.value)}`
    if (analyticsPeriod.value === 'custom' && customFrom.value && customTo.value) {
      url += `&from=${encodeURIComponent(customFrom.value)}&to=${encodeURIComponent(customTo.value)}`
    }
    const r = await apiRequest(url)
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
function changePeriod(p) {
  analyticsPeriod.value = p
  loadAnalytics(p)
}
function applyCustomDateRange() {
  if (!customFrom.value || !customTo.value) {
    adminStore.showNotice('Vui lòng chọn cả ngày bắt đầu và ngày kết thúc.', 'warning')
    return
  }
  if (customFrom.value > customTo.value) {
    adminStore.showNotice('Ngày bắt đầu không được lớn hơn ngày kết thúc.', 'warning')
    return
  }
  analyticsPeriod.value = 'custom'
  loadAnalytics('custom')
}
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
/* ==========================================================================
   APPLE iOS HUMAN INTERFACE DESIGN SYSTEM (iOS 18 / macOS Sequoia Style)
   ========================================================================== */
.fb-care {
  --ios-bg: #f2f2f7;
  --ios-card: #ffffff;
  --ios-label: #1c1c1e;
  --ios-secondary: #8e8e93;
  --ios-tertiary: #c7c7cc;
  --ios-fill: #e5e5ea;
  --ios-blue: #007aff;
  --ios-green: #34c759;
  --ios-red: #ff3b30;
  --ios-orange: #ff9500;
  --ios-purple: #af52de;
  --ios-yellow: #ffcc00;

  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  letter-spacing: -0.01em;
}

/* Page Header */
.adm-page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}
.adm-page-title {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--ios-label);
  margin: 0 0 4px;
}
.adm-page-sub {
  font-size: 0.82rem;
  color: var(--ios-secondary);
  margin: 0;
}
.head-btn-group {
  display: flex;
  gap: 8px;
}

/* iOS Pill Button Primary */
.ios-action-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: var(--ios-blue);
  color: #ffffff;
  border-radius: 999px;
  padding: 8px 18px;
  font-size: 0.82rem;
  font-weight: 650;
  border: none;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(0, 122, 255, 0.25);
  transition: all 0.15s ease;
  white-space: nowrap;
}
.ios-action-pill:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
}
.ios-action-pill:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive display helpers */
.desktop-only {
  display: block;
}
.mobile-only {
  display: none !important;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: flex !important;
  }
}

/* ==========================================================================
   iOS SEGMENTED CONTROL TABS (TOP NAVIGATION)
   ========================================================================== */
.view-tabs {
  display: inline-flex;
  background: var(--ios-fill);
  border-radius: 14px;
  padding: 3px;
  gap: 3px;
  margin-bottom: 20px;
  border: none;
}
.view-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border: none;
  background: transparent;
  border-radius: 11px;
  font-size: 0.84rem;
  font-weight: 600;
  color: #636366;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.view-tab-btn:hover {
  color: var(--ios-label);
}
.view-tab-btn.active {
  background: #ffffff;
  color: var(--ios-label);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06);
}
.tab-badge-hot {
  font-size: 0.65rem;
  background: rgba(255, 59, 48, 0.12);
  color: var(--ios-red);
  padding: 2px 7px;
  border-radius: 999px;
  font-weight: 700;
}
.tab-label-short {
  display: none;
}
.tab-label-full {
  display: inline;
}

/* ==========================================================================
   TAB 1: CRM CARE ELEMENTS (Apple iOS Cleaned)
   ========================================================================== */
/* Connection Card: Clean vertical stacking, no horizontal crushing */
.connection-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  padding: 14px 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  margin-bottom: 16px;
  transition: all 0.2s ease;
}
.connection-card.online {
  border-left: 4px solid var(--ios-green);
}
.conn-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}
.conn-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.conn-title-group strong {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--ios-label);
}
.conn-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ios-green);
  box-shadow: 0 0 6px rgba(52, 199, 89, 0.6);
  flex-shrink: 0;
}
.connection-tag {
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(52, 199, 89, 0.12);
  color: #248a3d;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}
.conn-desc-text {
  font-size: 0.78rem;
  color: var(--ios-secondary);
  line-height: 1.45;
  margin: 0 0 10px;
}
.conn-action-row {
  display: flex;
  gap: 8px;
}
.sync-action-btn {
  background: var(--ios-fill);
  color: var(--ios-label);
  border: none;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.sync-action-btn:hover:not(:disabled) {
  background: #d1d1d6;
}
.sync-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Meta Ads Section */
.ads-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  padding: 16px 18px;
  margin-bottom: 18px;
  max-width: 100%;
  overflow: hidden;
}
.ads-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.ads-head h2 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--ios-label);
  margin: 0 0 2px;
}
.ads-head p {
  font-size: 0.76rem;
  color: var(--ios-secondary);
  margin: 0;
}
.refresh-ads-btn {
  background: var(--ios-fill);
  color: var(--ios-label);
  border: none;
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.refresh-ads-btn:hover {
  background: #d1d1d6;
}
.ads-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.ads-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.ads-table th {
  text-align: left;
  padding: 8px 12px;
  font-size: 0.72rem;
  color: var(--ios-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.ads-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  vertical-align: middle;
}
.ads-table td strong {
  display: block;
  font-weight: 650;
  color: var(--ios-label);
}
.ads-table td small {
  display: block;
  font-size: 0.72rem;
  color: var(--ios-secondary);
}

/* Mobile Apple Inset Cards for Meta Ads */
.ads-mobile-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ad-item-card {
  background: #f8f8fa;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ad-item-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}
.ad-item-name {
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--ios-label);
  line-height: 1.35;
  flex: 1;
}
.ad-item-spend {
  font-size: 0.86rem;
  font-weight: 800;
  color: var(--ios-red);
  white-space: nowrap;
}
.ad-item-sub {
  font-size: 0.73rem;
  color: var(--ios-secondary);
  margin-bottom: 4px;
  line-height: 1.3;
}
.ad-item-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.ad-stat-chip {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 0.72rem;
  color: #3a3a3c;
}
.ad-stat-chip b {
  color: var(--ios-label);
}

/* Toolbar & Filters (Apple iOS Style) */
.fb-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}
.fb-search-wrap {
  position: relative;
  width: 100%;
}
.fb-search-wrap .search-ico {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.85rem;
  opacity: 0.5;
  pointer-events: none;
}
.fb-search-wrap input {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 9px 12px 9px 36px;
  font-size: 0.84rem;
  background: #ffffff;
  color: var(--ios-label);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.fb-search-wrap input:focus {
  border-color: var(--ios-blue);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12);
}
.fb-status-scroll {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 2px;
}
.fb-status-scroll::-webkit-scrollbar {
  display: none;
}
.fb-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: #636366;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}
.fb-pill-btn:hover {
  background: #f2f2f7;
  color: var(--ios-label);
}
.fb-pill-btn.active {
  background: var(--ios-blue);
  color: #ffffff;
  border-color: var(--ios-blue);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}
.fb-pill-btn .pill-count {
  font-size: 0.72rem;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.06);
}
.fb-pill-btn.active .pill-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}
.fb-source-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.fb-source-select {
  flex: 1;
  min-width: 200px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 7px 10px;
  background: #ffffff;
  color: var(--ios-label);
  font-size: 0.78rem;
  outline: none;
}
.fb-match-btns {
  display: flex;
  gap: 6px;
}
.fb-btn-match {
  background: var(--ios-blue);
  color: #ffffff;
  border: none;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 0.76rem;
  font-weight: 650;
  cursor: pointer;
  white-space: nowrap;
}
.fb-btn-match:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.fb-btn-reset {
  background: var(--ios-fill);
  color: var(--ios-label);
  border: none;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.fb-btn-reset:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.new-arrivals {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 12px 0;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(52, 199, 89, 0.1);
  color: #1e7e34;
  font-size: 0.78rem;
  font-weight: 600;
}
.new-arrivals button {
  border: 1px solid rgba(52, 199, 89, 0.3);
  border-radius: 999px;
  background: #ffffff;
  padding: 4px 10px;
  color: #1e7e34;
  cursor: pointer;
  font-weight: 600;
}
.new-arrivals .dismiss-arrivals {
  margin-left: auto;
  border: none;
  background: transparent;
  color: var(--ios-secondary);
}

.stats {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.stat {
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #ffffff;
  border-radius: 999px;
  padding: 6px 14px;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  color: #636366;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.stat:hover {
  background: #f2f2f7;
  color: var(--ios-label);
}
.stat b {
  color: var(--ios-label);
}
.stat.selected {
  background: var(--ios-blue);
  color: #ffffff;
  border-color: var(--ios-blue);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}
.stat.selected b {
  color: #ffffff;
}
.ad-filter {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--ios-secondary);
  font-size: 0.78rem;
  font-weight: 600;
}
.ad-filter select {
  max-width: 250px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 7px 10px;
  background: #ffffff;
  color: var(--ios-label);
  font: inherit;
  font-size: 0.76rem;
}
.auto-match-btn {
  font-size: 0.74rem;
  padding: 7px 14px;
  border-radius: 999px;
  font-weight: 650;
  white-space: nowrap;
  cursor: pointer;
  background: var(--ios-orange);
  color: #fff;
  border: none;
  box-shadow: 0 2px 8px rgba(255, 149, 0, 0.25);
  transition: all 0.15s;
}
.auto-match-btn:hover {
  background: #e08500;
}
.search {
  margin-left: auto;
  min-width: 240px;
}
.search input {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 8px 12px;
  font: inherit;
  font-size: 0.78rem;
  color: var(--ios-label);
  background: #ffffff;
  outline: none;
}
.search input:focus {
  border-color: var(--ios-blue);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12);
}

.workspace {
  display: grid;
  grid-template-columns: minmax(260px, 320px) 1fr;
  min-height: 540px;
  overflow: hidden;
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
}
.customer-list {
  border-right: 1px solid #f2f2f7;
  padding: 14px;
  max-height: 700px;
  overflow: auto;
}
.list-title {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 2px 4px 12px;
  display: flex;
  justify-content: space-between;
  color: var(--ios-secondary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.customer-row {
  position: relative;
  width: 100%;
  text-align: left;
  border: 1px solid transparent;
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 12px;
  margin-bottom: 6px;
  display: grid;
  gap: 4px;
  cursor: pointer;
  color: var(--ios-label);
  transition: all 0.15s ease;
}
.customer-row:hover {
  background: #f2f2f7;
}
.customer-row.active {
  background: rgba(0, 122, 255, 0.08);
  border-color: rgba(0, 122, 255, 0.25);
}
.customer-row strong {
  font-size: 0.88rem;
  padding-right: 64px;
  font-weight: 650;
}
.customer-row small {
  font-size: 0.72rem;
  color: var(--ios-secondary);
}
.customer-row .status {
  position: absolute;
  right: 10px;
  top: 12px;
}
.status {
  font-size: 0.65rem;
  padding: 3px 7px;
  border-radius: 999px;
  background: var(--ios-fill);
  color: #636366;
  font-weight: 700;
}
.status.moi {
  background: rgba(255, 59, 48, 0.12);
  color: var(--ios-red);
}
.status.dang_tu_van {
  background: rgba(0, 122, 255, 0.12);
  color: var(--ios-blue);
}
.status.cho_phan_hoi {
  background: rgba(255, 149, 0, 0.12);
  color: var(--ios-orange);
}
.status.da_chot {
  background: rgba(52, 199, 89, 0.14);
  color: #248a3d;
}

.detail {
  padding: 24px;
  min-width: 0;
}
.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
  border-bottom: 1px solid #f2f2f7;
  padding-bottom: 16px;
}
.detail-head h2 {
  margin: 0 0 4px;
  font-size: 1.1rem;
  font-weight: 700;
}
.detail-head p {
  font-size: 0.78rem;
  color: var(--ios-secondary);
}
.detail-head select {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 600;
}

.edit-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 16px 0;
}
.edit-grid label, .notes, .form-grid label {
  display: grid;
  gap: 5px;
  font-size: 0.74rem;
  color: var(--ios-secondary);
  font-weight: 600;
}
.edit-grid input, .notes textarea, .form-grid input, .form-grid textarea {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 8px 10px;
  font: inherit;
  font-size: 0.8rem;
  color: var(--ios-label);
  background: #ffffff;
  outline: none;
}
.edit-grid input:focus, .notes textarea:focus {
  border-color: var(--ios-blue);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12);
}

.history-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 20px 0 10px;
}
.history-head h3 {
  font-size: 0.88rem;
  font-weight: 700;
  margin: 0;
}
.history-head span {
  font-size: 0.7rem;
  color: var(--ios-secondary);
}
.history {
  height: 220px;
  overflow: auto;
  background: var(--ios-bg);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.message {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.message.out {
  align-self: flex-end;
  background: var(--ios-blue);
  color: #ffffff;
}
.message.out small {
  color: rgba(255, 255, 255, 0.75);
}
.message small {
  color: var(--ios-secondary);
  font-size: 0.67rem;
}
.message p {
  font-size: 0.82rem;
  margin: 3px 0 0;
  white-space: pre-wrap;
}
.message-form {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.message-form select {
  width: 120px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 8px;
  font-size: 0.76rem;
}
.message-form input {
  flex: 1;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.8rem;
}

.placeholder {
  display: grid;
  place-content: center;
  text-align: center;
  color: var(--ios-secondary);
  height: 100%;
}
.placeholder div {
  font-size: 2.2rem;
}
.placeholder h2 {
  font-size: 1rem;
  color: var(--ios-label);
  margin-top: 10px;
}
.empty {
  padding: 24px;
  color: var(--ios-secondary);
  font-size: 0.82rem;
  text-align: center;
}

/* ==========================================================================
   TAB 2: BÁO CÁO PHÂN TÍCH HIỆU QUẢ QUẢNG CÁO (Apple iOS 18 Design)
   ========================================================================== */
.analytics-tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 4 HERO METRIC CARDS (Apple Widget Style) */
.cockpit-hero-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.cockpit-card {
  position: relative;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 20px;
  padding: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 148px;
}
.cockpit-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px -4px rgba(0, 0, 0, 0.07);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.card-title-wrap {
  display: flex;
  align-items: center;
  gap: 7px;
}
.card-icon {
  font-size: 1.05rem;
}
.card-title {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: var(--ios-secondary);
  text-transform: uppercase;
}

/* iOS Badges on Cards */
.period-badge {
  font-size: 0.66rem;
  background: var(--ios-fill);
  color: #48484a;
  padding: 3px 8px;
  border-radius: 999px;
  font-weight: 650;
}
.rate-badge {
  font-size: 0.66rem;
  background: rgba(0, 122, 255, 0.1);
  color: var(--ios-blue);
  padding: 3px 8px;
  border-radius: 999px;
  font-weight: 700;
}
.ctr-badge {
  font-size: 0.66rem;
  padding: 3px 8px;
  border-radius: 999px;
  font-weight: 700;
}
.badge-super {
  background: rgba(52, 199, 89, 0.14);
  color: #248a3d;
}
.badge-normal {
  background: rgba(255, 149, 0, 0.14);
  color: #c97500;
}
.roas-top-badge {
  font-size: 0.66rem;
  background: rgba(175, 82, 222, 0.12);
  color: var(--ios-purple);
  padding: 3px 8px;
  border-radius: 999px;
  font-weight: 750;
}

/* Big Numbers */
.card-main-val {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 10px 0 6px;
  line-height: 1.15;
}
.val-sub {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ios-secondary);
}
.text-neon-red { color: var(--ios-red); }
.text-neon-blue { color: var(--ios-blue); }
.text-neon-green { color: #248a3d; }
.text-neon-gold { color: var(--ios-orange); }

.card-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  color: var(--ios-secondary);
}
.live-dot-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ios-green);
  box-shadow: 0 0 6px var(--ios-green);
  flex-shrink: 0;
  animation: pulseLive 2s infinite;
}
@keyframes pulseLive {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

/* ==========================================================================
   AI DIAGNOSIS HUD (iOS Dark Titanium Widget / Dynamic Island Style)
   ========================================================================== */
.cyber-radar-hud {
  position: relative;
  background: #1c1c1e;
  border-radius: 20px;
  padding: 22px 26px;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  flex-wrap: wrap;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.radar-scan-effect {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at 10% 50%, rgba(0, 122, 255, 0.12) 0%, transparent 60%);
  pointer-events: none;
}
.hud-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  max-width: 680px;
  position: relative;
  z-index: 2;
}
.hud-radar-icon {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.radar-core {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #0a84ff;
  box-shadow: 0 0 10px #0a84ff;
}
.radar-ring {
  position: absolute;
  inset: 6px;
  border: 1px dashed rgba(10, 132, 255, 0.5);
  border-radius: 50%;
  animation: spinRadar 12s linear infinite;
}
@keyframes spinRadar {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.hud-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hud-tag {
  font-size: 0.67rem;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: #0a84ff;
  text-transform: uppercase;
}
.hud-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
}
.hud-desc {
  font-size: 0.79rem;
  color: #aeaeb2;
  margin: 0;
  line-height: 1.45;
}
.hud-desc strong {
  color: #ffffff;
}

.hud-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  position: relative;
  z-index: 2;
}
.quick-status-pills {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}
.status-pill {
  font-size: 0.72rem;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 650;
}
.pill-success {
  background: rgba(52, 199, 89, 0.18);
  color: #30d158;
  border: 1px solid rgba(52, 199, 89, 0.3);
}
.pill-warning {
  background: rgba(255, 159, 10, 0.18);
  color: #ffd60a;
  border: 1px solid rgba(255, 159, 10, 0.3);
}
.hud-actions-row {
  display: flex;
  gap: 8px;
}
.cyber-btn-gold {
  background: var(--ios-orange);
  color: #ffffff;
  border: none;
  font-weight: 650;
  font-size: 0.75rem;
  border-radius: 999px;
  padding: 7px 15px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
}
.cyber-btn-gold:hover {
  background: #ff9f0a;
}
.cyber-btn-outline {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border: none;
  border-radius: 999px;
  padding: 7px 15px;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.15s ease;
}
.cyber-btn-outline:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* ==========================================================================
   ANALYTICS TABLE & SEGMENTED CONTROLS (Apple Inset Grouped Table)
   ========================================================================== */
.analytics-table-card {
  padding: 24px;
  border-radius: 22px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: #ffffff;
  box-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}
.table-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  padding-bottom: 14px;
  border-bottom: 1px solid #f2f2f7;
}
.table-card-head h3 {
  font-size: 1.05rem;
  margin: 0;
  color: var(--ios-label);
  font-weight: 750;
  letter-spacing: -0.015em;
}
.period-indicator-text {
  font-size: 0.76rem;
  color: var(--ios-secondary);
  margin: 3px 0 0;
}
.period-indicator-text strong {
  color: var(--ios-blue);
}
.head-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

/* iOS SEGMENTED CONTROL: DATE PRESETS */
.period-btn-group {
  display: inline-flex;
  background: var(--ios-fill);
  border-radius: 12px;
  padding: 2px;
  gap: 2px;
  border: none;
}
.period-btn {
  padding: 5px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #636366;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}
.period-btn:hover {
  color: var(--ios-label);
}
.period-btn.active {
  background: #ffffff;
  color: var(--ios-label);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.06);
}

/* iOS SEGMENTED CONTROL: STATUS FILTER */
.table-sub-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 2px 14px;
  flex-wrap: wrap;
  gap: 10px;
}
.status-btn-group {
  display: inline-flex;
  background: var(--ios-fill);
  border-radius: 12px;
  padding: 2px;
  gap: 2px;
  border: none;
}
.status-btn {
  padding: 5px 13px;
  font-size: 0.75rem;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #636366;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.status-btn:hover {
  color: var(--ios-label);
}
.status-btn.active {
  background: #ffffff;
  color: var(--ios-label);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.06);
}
.status-btn.status-btn-active.active {
  color: #248a3d;
  font-weight: 700;
}
.status-btn.status-btn-paused.active {
  color: var(--ios-secondary);
  font-weight: 700;
}
.table-stats-hint {
  font-size: 0.74rem;
  color: var(--ios-secondary);
}
.table-stats-hint strong {
  color: var(--ios-label);
}

/* iOS Date Picker Capsule */
.custom-date-box {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--ios-fill);
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 2px 8px;
  transition: all 0.2s ease;
}
.custom-date-box.active {
  background: #ffffff;
  border-color: var(--ios-blue);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.14);
}
.custom-date-icon {
  font-size: 0.82rem;
}
.date-picker-input {
  border: none;
  background: transparent;
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--ios-label);
  padding: 4px 2px;
  outline: none;
  font-family: inherit;
}
.date-arrow {
  color: var(--ios-secondary);
  font-size: 0.72rem;
}
.apply-date-btn {
  background: var(--ios-blue);
  color: #ffffff;
  border: none;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 0.74rem;
  font-weight: 650;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.apply-date-btn:hover:not(:disabled) {
  background: #0062cc;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}
.apply-date-btn:disabled {
  background: var(--ios-tertiary);
  cursor: not-allowed;
  opacity: 0.6;
}

.refresh-btn {
  background: var(--ios-fill);
  color: var(--ios-label);
  border: none;
  border-radius: 999px;
  padding: 6px 14px;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.refresh-btn:hover {
  background: #d1d1d6;
}

/* ==========================================================================
   SMART TABLE ROWS (Apple Inset Card Rows)
   ========================================================================== */
.analytics-table-wrap {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
}
.futuristic-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
  font-size: 0.8rem;
}
.futuristic-table th {
  background: transparent;
  color: var(--ios-secondary);
  font-weight: 700;
  font-size: 0.69rem;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  padding: 10px 14px;
  border-bottom: 1px solid #f2f2f7;
  text-align: left;
  white-space: nowrap;
}

.futuristic-table tbody tr {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}
.futuristic-table tbody tr:hover {
  box-shadow: 0 6px 20px -2px rgba(0, 0, 0, 0.07);
  transform: translateY(-1px);
}
.futuristic-table td {
  padding: 14px 16px;
  border-top: 1px solid #f2f2f7;
  border-bottom: 1px solid #f2f2f7;
  vertical-align: middle;
}
.futuristic-table td:first-child {
  border-left: 3.5px solid transparent;
  border-top-left-radius: 14px;
  border-bottom-left-radius: 14px;
}
.futuristic-table td:last-child {
  border-right: 1px solid #f2f2f7;
  border-top-right-radius: 14px;
  border-bottom-right-radius: 14px;
}

.futuristic-table tr.row-status-active td:first-child {
  border-left-color: var(--ios-green);
}
.futuristic-table tr.row-status-paused td:first-child {
  border-left-color: var(--ios-tertiary);
}
.futuristic-table tr.row-status-paused {
  background: #fafafa;
  opacity: 0.85;
}
.futuristic-table tr.row-status-paused:hover {
  opacity: 1;
  background: #ffffff;
}

/* Table Cells */
.campaign-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: 270px;
}
.campaign-status-row {
  display: flex;
  align-items: center;
  gap: 5px;
}
.cyber-dot {
  width: 6.5px;
  height: 6.5px;
  border-radius: 50%;
}
.dot-active {
  background: var(--ios-green);
  box-shadow: 0 0 6px rgba(52, 199, 89, 0.6);
}
.dot-paused {
  background: var(--ios-secondary);
}
.meta-status-text {
  font-size: 0.64rem;
  font-weight: 750;
  letter-spacing: 0.4px;
}
.text-active {
  color: #248a3d;
}
.text-paused {
  color: var(--ios-secondary);
}
.campaign-title {
  font-size: 0.86rem;
  color: var(--ios-label);
  line-height: 1.35;
  font-weight: 700;
}
.campaign-sub {
  font-size: 0.69rem;
  color: var(--ios-secondary);
}

.spend-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.spend-val {
  font-size: 0.96rem;
  color: var(--ios-red);
  font-weight: 800;
  letter-spacing: -0.02em;
}
.cpl-sub {
  font-size: 0.72rem;
  color: var(--ios-secondary);
}

.metrics-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ctr-badge-row {
  display: flex;
  align-items: center;
  gap: 5px;
}
.metric-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 999px;
  font-weight: 750;
  font-size: 0.71rem;
}
.metric-good {
  background: rgba(52, 199, 89, 0.14);
  color: #248a3d;
}
.metric-bad {
  background: rgba(255, 59, 48, 0.12);
  color: var(--ios-red);
}
.metric-neutral {
  background: var(--ios-fill);
  color: #636366;
}
.tag-hot {
  font-size: 0.6rem;
  background: var(--ios-green);
  color: #ffffff;
  padding: 1px 6px;
  border-radius: 999px;
  font-weight: 800;
}
.meta-sub-metrics {
  font-size: 0.69rem;
  color: var(--ios-secondary);
  display: flex;
  gap: 6px;
  align-items: center;
}

.leads-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.badge-meta-msg {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 9px;
  background: rgba(175, 82, 222, 0.12);
  color: var(--ios-purple);
  border-radius: 999px;
  font-weight: 750;
  font-size: 0.73rem;
  width: fit-content;
}
.crm-lead-sub {
  font-size: 0.72rem;
  color: var(--ios-blue);
  font-weight: 650;
}

.rev-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.orders-row {
  display: flex;
  gap: 5px;
  align-items: baseline;
}
.roas-row {
  margin-top: 1px;
}
.roas-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.71rem;
}
.roas-high {
  background: rgba(52, 199, 89, 0.14);
  color: #248a3d;
}
.roas-mid {
  background: rgba(0, 122, 255, 0.12);
  color: var(--ios-blue);
}
.roas-zero {
  background: var(--ios-fill);
  color: var(--ios-secondary);
}

/* Diagnosis Box (Apple Style) */
.diagnosis-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 310px;
  background: var(--ios-bg);
  padding: 10px 12px;
  border-radius: 12px;
}
.action-badge-row {
  margin-bottom: 2px;
}
.action-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 999px;
  font-weight: 750;
  font-size: 0.67rem;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}
.action-scale {
  background: rgba(175, 82, 222, 0.15);
  color: #8f2ebb;
}
.action-potential_win {
  background: rgba(255, 59, 48, 0.14);
  color: #d72c23;
  font-weight: 800;
}
.action-kill {
  background: rgba(255, 59, 48, 0.15);
  color: var(--ios-red);
}
.action-optimize_sale {
  background: rgba(255, 149, 0, 0.14);
  color: #c97500;
}
.action-change_content {
  background: rgba(255, 149, 0, 0.14);
  color: #e06c00;
}
.action-change_target {
  background: rgba(0, 122, 255, 0.12);
  color: var(--ios-blue);
}
.action-hold {
  background: rgba(52, 199, 89, 0.14);
  color: #248a3d;
}
.action-paused {
  background: var(--ios-fill);
  color: var(--ios-secondary);
}
.disease-title {
  font-size: 0.77rem;
  color: var(--ios-label);
  font-weight: 750;
  line-height: 1.3;
}
.rec-text {
  font-size: 0.71rem;
  color: #636366;
  margin: 0;
  line-height: 1.45;
}

/* ==========================================================================
   TABLE ACTION BUTTON (Apple iOS Blue Capsule Button)
   ========================================================================== */
.table-action-btn {
  background: rgba(0, 122, 255, 0.1);
  color: var(--ios-blue);
  border: none;
  border-radius: 999px;
  padding: 6px 14px;
  font-weight: 650;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}
.table-action-btn:hover {
  background: var(--ios-blue);
  color: #ffffff;
  box-shadow: 0 3px 10px rgba(0, 122, 255, 0.3);
}
.table-action-btn:active {
  transform: scale(0.96);
}

.font-bold { font-weight: 700; }
.text-red { color: var(--ios-red); }
.text-blue { color: var(--ios-blue); }
.text-amber { color: var(--ios-orange); }
.text-green { color: #248a3d; }
.text-gold { color: var(--ios-orange); }
.text-purple { color: var(--ios-purple); }
.text-right { text-align: right; }

@media(max-width: 1100px) {
  .cockpit-hero-grid { grid-template-columns: repeat(2, 1fr); }
  .cyber-radar-hud { flex-direction: column; align-items: flex-start; }
  .hud-right { align-items: flex-start; }
  .quick-status-pills { align-items: flex-start; }
}

@media(max-width: 768px) {
  /* Tabs điều hướng chính: Nhãn ngắn vừa khít 100% màn hình, không bị tràn cắt chữ */
  .tab-label-short {
    display: inline;
  }
  .tab-label-full {
    display: none;
  }
  .hide-mobile {
    display: none !important;
  }
  .view-tabs {
    display: flex;
    width: 100%;
    padding: 3px;
    gap: 3px;
  }
  .view-tab-btn {
    flex: 1 1 50%;
    justify-content: center;
    text-align: center;
    white-space: nowrap;
    font-size: 0.79rem;
    padding: 8px 6px;
  }

  /* Nhóm nút chọn ngày & trạng thái dạng cuộn ngang chuẩn iOS */
  .period-btn-group,
  .status-btn-group {
    display: flex;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding: 2px;
  }
  .period-btn-group::-webkit-scrollbar,
  .status-btn-group::-webkit-scrollbar { display: none; }
  .period-btn,
  .status-btn {
    flex-shrink: 0;
    white-space: nowrap;
  }

  .table-card-head {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .head-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .custom-date-box {
    width: 100%;
    justify-content: space-between;
  }
  .date-picker-input {
    flex: 1;
    min-width: 0;
    font-size: 16px !important;
  }
  .refresh-btn {
    width: 100%;
    justify-content: center;
  }
  .table-sub-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  /* Bảng dữ liệu Meta Ads có min-width để không bị bẹp cột */
  .futuristic-table {
    min-width: 860px;
  }

  /* Tab Chăm sóc CRM trên Mobile */
  .adm-page.fb-care {
    max-width: 100%;
    overflow-x: hidden;
  }
  .adm-page-head {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 14px;
  }
  .head-btn-group {
    width: 100%;
  }
  .head-btn-group .ios-action-pill {
    width: 100%;
    justify-content: center;
  }
  .fb-source-row {
    flex-direction: column;
    align-items: stretch;
  }
  .fb-source-select {
    width: 100%;
    max-width: 100%;
  }
  .fb-match-btns {
    width: 100%;
  }
  .fb-match-btns button {
    flex: 1;
    text-align: center;
    justify-content: center;
  }
  .analytics-table-card {
    padding: 14px 12px;
    border-radius: 16px;
    max-width: 100%;
    overflow: hidden;
  }
  .workspace {
    grid-template-columns: 1fr;
    max-width: 100%;
    overflow: hidden;
  }
  .customer-list { max-height: 280px; border-right: 0; border-bottom: 1px solid #f2f2f7; }
  .form-grid, .edit-grid { grid-template-columns: 1fr; }
  .search { margin: 0; width: 100%; }
  .ad-filter { width: 100%; justify-content: space-between; }
  .ad-filter select { flex: 1; max-width: none; }
}

@media(max-width: 520px) {
  .cockpit-hero-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .cockpit-card {
    padding: 12px;
    min-height: 120px;
    border-radius: 14px;
  }
  .card-main-val {
    font-size: 1.25rem;
    margin: 4px 0 2px;
  }
  .card-title {
    font-size: 0.66rem;
  }
  .val-sub {
    font-size: 0.72rem;
  }
  .card-foot {
    font-size: 0.68rem;
  }
}

@media(max-width: 380px) {
  .cockpit-hero-grid {
    grid-template-columns: 1fr;
  }
}
</style>
