<template>
  <div class="adm-page fb-care" :class="{ 'is-mobile': isMobile, 'mobile-chat-open': isMobile && mobileChatActive }">
    <!-- =====================================================================
         GIAO DIỆN NATIVE CHUẨN FACEBOOK MESSENGER CHO MOBILE
         ===================================================================== -->
    <div v-if="isMobile && currentTab === 'CARE'" class="ms-mobile-container">
      <!-- 1. GIAO DIỆN HỘP THƯ / DANH SÁCH ĐOẠN CHAT (Khi chưa mở hội thoại) -->
      <div v-show="!mobileChatActive" class="ms-inbox-view">
        <!-- Messenger Top Bar -->
        <header class="ms-top-bar">
          <div class="ms-top-left">
            <div class="ms-top-title-group">
              <span class="ms-messenger-logo">💬</span>
              <h1 class="ms-messenger-title">Đoạn chat</h1>
              <span class="ms-live-pulse" title="Messenger Live"></span>
            </div>
            <span class="ms-chats-count">{{ customers.length }} cuộc trò chuyện</span>
          </div>
          <div class="ms-top-actions">
            <!-- Nút quét tin nhắn -->
            <button
              type="button"
              class="ms-circle-btn"
              :class="{ spin: syncBusy }"
              :disabled="syncBusy"
              @click="forceSync"
              title="Quét tin nhắn mới từ Fanpage"
            >
              ↻
            </button>
            <!-- Nút cài đặt AI -->
            <button
              type="button"
              class="ms-circle-btn ms-btn-ai"
              :class="{ active: aiEnabled || commentAiEnabled }"
              @click="showMobileAiModal = true"
              title="Cài đặt AI"
            >
              🤖
              <span v-if="aiEnabled && commentAiEnabled" class="ms-dot-indicator green"></span>
              <span v-else-if="aiEnabled || commentAiEnabled" class="ms-dot-indicator amber"></span>
            </button>
            <!-- Nút thêm khách mới -->
            <button
              type="button"
              class="ms-circle-btn"
              @click="showCreate = !showCreate"
              title="Thêm khách mới"
            >
              ＋
            </button>
            <!-- Nút xem phân tích ROI -->
            <button
              type="button"
              class="ms-circle-btn"
              @click="switchTab('ANALYTICS')"
              title="Xem phân tích Ads"
            >
              📊
            </button>
          </div>
        </header>

        <!-- Chuyển đổi nhanh Đoạn chat & Phân tích Ads -->
        <div class="ms-nav-tabs">
          <button
            type="button"
            :class="['ms-nav-tab', { active: currentTab === 'CARE' }]"
            @click="currentTab = 'CARE'"
          >
            💬 Đoạn chat ({{ customers.length }})
          </button>
          <button
            type="button"
            :class="['ms-nav-tab', { active: currentTab === 'ANALYTICS' }]"
            @click="switchTab('ANALYTICS')"
          >
            📊 Phân tích ROI
          </button>
        </div>

        <!-- Thanh tìm kiếm Messenger -->
        <div class="ms-search-wrap">
          <div class="ms-search-field">
            <span class="ms-search-icon">🔍</span>
            <input
              v-model="keyword"
              type="text"
              class="ms-search-input"
              placeholder="Tìm kiếm đoạn chat, SĐT, nhu cầu..."
            />
            <button v-if="keyword" type="button" class="ms-search-clear" @click="keyword = ''">✕</button>
          </div>
        </div>

        <!-- Bộ lọc Kênh & Trạng thái cuộn ngang mượt mà -->
        <div class="ms-filter-strip">
          <button
            type="button"
            :class="['ms-pill-chip', { active: channelFilter === 'ALL' }]"
            @click="channelFilter = 'ALL'"
          >
            🌐 Tất cả <b>{{ customers.length }}</b>
          </button>
          <button
            type="button"
            :class="['ms-pill-chip', 'chip-msg', { active: channelFilter === 'MESSENGER' }]"
            @click="channelFilter = 'MESSENGER'"
          >
            💬 Tin nhắn <b>{{ messengerCustomersCount }}</b>
          </button>
          <button
            type="button"
            :class="['ms-pill-chip', 'chip-cmt', { active: channelFilter === 'COMMENT' }]"
            @click="channelFilter = 'COMMENT'"
          >
            📝 Bình luận <b>{{ commentCustomersCount }}</b>
          </button>
          <button
            v-for="item in statusOptions.slice(1)"
            :key="item.key"
            type="button"
            :class="['ms-pill-chip', `chip-${item.key.toLowerCase()}`, { active: filter === item.key }]"
            @click="filter = (filter === item.key ? 'ALL' : item.key)"
          >
            {{ item.label }} <b>{{ countForStatus(item.key) }}</b>
          </button>
          <button
            type="button"
            class="ms-pill-chip chip-ad-filter"
            :class="{ 'has-ad': adFilter !== 'ALL' }"
            @click="showMobileFilterModal = true"
          >
            ⚙️ Nguồn QC {{ adFilter !== 'ALL' ? '●' : '' }}
          </button>
        </div>

        <!-- Form tạo khách mới trên Mobile nếu bấm ＋ -->
        <form v-if="showCreate" class="ms-mobile-create-form" @submit.prevent="createCustomer">
          <div class="ms-form-top">
            <strong>Thêm Khách Mới Cần Chăm Sóc</strong>
            <button type="button" class="ms-form-close" @click="showCreate = false">✕</button>
          </div>
          <div class="ms-form-body">
            <input v-model="draft.customerName" required placeholder="Tên khách Facebook *" />
            <input v-model="draft.phone" placeholder="Số điện thoại" />
            <input v-model="draft.interest" placeholder="Nhu cầu (VD: Đầu tư phòng thu âm)" />
            <input v-model="draft.address" placeholder="Địa chỉ lắp đặt" />
            <input v-model="draft.province" list="fb-province-options" placeholder="Tỉnh/Thành phố" />
            <textarea v-model="draft.notes" rows="2" placeholder="Ghi chú thêm..."></textarea>
          </div>
          <div class="ms-form-actions">
            <button type="button" class="btn-cancel" @click="showCreate = false">Hủy</button>
            <button type="submit" class="btn-save" :disabled="busy">{{ busy ? 'Đang lưu…' : 'Lưu hồ sơ' }}</button>
          </div>
        </form>

        <!-- Danh sách đoạn chat Full Height Messenger -->
        <div class="ms-chat-threads">
          <div
            v-for="c in visibleCustomers"
            :key="c.id"
            :class="['ms-thread-item', { active: selected?.id === c.id }, isCommentCustomer(c) ? 'is-cmt' : 'is-msg']"
            @click="onCustomerClick(c)"
          >
            <!-- Avatar tròn có chấm online và icon kênh -->
            <div class="ms-thread-avatar-wrap">
              <div class="ms-thread-avatar" :style="{ background: getAvatarGradient(c.customerName) }">
                {{ getInitials(c.customerName) }}
              </div>
              <span class="ms-thread-online-dot"></span>
              <span :class="['ms-thread-channel-icon', isCommentCustomer(c) ? 'icon-cmt' : 'icon-msg']">
                {{ isCommentCustomer(c) ? '📝' : '💬' }}
              </span>
            </div>

            <!-- Nội dung tóm tắt đoạn chat -->
            <div class="ms-thread-content">
              <div class="ms-thread-head">
                <span class="ms-thread-name">{{ c.customerName }}</span>
                <span class="ms-thread-time">{{ formatMessengerTime(c.updatedAt || c.createdAt) }}</span>
              </div>
              <div class="ms-thread-snippet-line">
                <span class="ms-thread-snippet" :class="{ 'is-demand': Boolean(c.interest) }">
                  {{ c.interest ? `🎯 ${c.interest}` : formatSnippet(c) }}
                </span>
              </div>
              <div class="ms-thread-tags">
                <span v-if="c.phone" class="tag-phone">📞 {{ c.phone }}</span>
                <span v-if="c.province" class="tag-province">📍 {{ c.province }}</span>
                <span :class="['tag-status', c.status.toLowerCase()]">{{ labelFor(c.status) }}</span>
              </div>
            </div>
          </div>

          <div v-if="!visibleCustomers.length" class="ms-threads-empty">
            <div class="empty-icon">💬</div>
            <h3>Không có cuộc trò chuyện nào</h3>
            <p>Thử tìm từ khóa khác hoặc bấm nút làm mới để quét tin nhắn Fanpage.</p>
          </div>
        </div>
      </div>

      <!-- 2. GIAO DIỆN KHUNG CHAT TOÀN MÀN HÌNH CHUẨN MESSENGER (Teleport vào root body để cố định chuẩn 100dvh) -->
      <Teleport to="body">
        <div v-if="isMobile && currentTab === 'CARE' && mobileChatActive && selected" class="ms-active-chat-view">
          <!-- Messenger Header Top Bar -->
          <header class="ms-chat-header">
            <button type="button" class="ms-back-arrow-btn" @click="closeMobileChat" aria-label="Quay lại">
              ‹
            </button>
            <div class="ms-chat-header-profile" @click="showMobileCrmDrawer = true">
              <div class="ms-chat-header-avatar" :style="{ background: getAvatarGradient(selected.customerName) }">
                {{ getInitials(selected.customerName) }}
                <span class="ms-header-online-dot"></span>
              </div>
              <div class="ms-chat-header-info">
                <h2 class="ms-chat-header-name">{{ selected.customerName }}</h2>
                <p class="ms-chat-header-sub">
                  <span v-if="selected.phone">📞 {{ selected.phone }}</span>
                  <span v-else-if="selected.interest">🎯 {{ selected.interest }}</span>
                  <span v-else>Đang hoạt động trên {{ isCommentCustomer(selected) ? 'Bình luận' : 'Messenger' }}</span>
                </p>
              </div>
            </div>
            <div class="ms-chat-header-btns">
              <a v-if="selected.phone" :href="'tel:' + selected.phone" class="ms-btn-call" title="Gọi điện ngay">
                📞
              </a>
              <button type="button" class="ms-btn-crm-info" @click="showMobileCrmDrawer = true" title="Xem hồ sơ CRM">
                ℹ️
              </button>
            </div>
          </header>

          <!-- Banner thông báo chính sách 24h & Kênh -->
          <div v-if="messengerPolicyInfo" class="ms-chat-policy-banner" :class="{ 'is-expired': !messengerPolicyInfo.within24h }">
            <span class="banner-icon">{{ messengerPolicyInfo.within24h ? '🟢' : '⚠️' }}</span>
            <span class="banner-text">{{ messengerPolicyInfo.label }}</span>
            <a
              v-if="!messengerPolicyInfo.within24h && selected.phone"
              :href="'https://zalo.me/' + selected.phone.replace(/\D/g, '')"
              target="_blank"
              rel="noopener"
              class="btn-open-zalo"
            >
              💬 Mở Zalo
            </a>
          </div>

          <!-- Khung tin nhắn cuộn mượt mà -->
          <div class="ms-messages-scroll" ref="chatBodyRef">
            <div
              v-for="m in selected.messages"
              :key="m.id"
              :class="['ms-msg-item', m.direction === 'OUT' ? 'msg-out' : 'msg-in', m.body && m.body.startsWith('[Bình luận Facebook]') ? 'is-comment' : '']"
            >
              <div class="ms-bubble-meta">
                <template v-if="m.direction === 'OUT'">Tú Audio</template>
                <template v-else-if="m.body && m.body.startsWith('[Bình luận Facebook]')">📝 Khách bình luận</template>
                <template v-else-if="m.platformMessageId">💬 Khách hàng</template>
                <template v-else>📝 Ghi chú</template>
                · {{ formatMessengerTime(m.createdAt) }}
              </div>
              <div v-if="m.body && !isPureImageLabel(m.body)" class="ms-bubble-text">
                <p>{{ m.body.replace(/^\[Bình luận Facebook\]:\s*/i, '') }}</p>
              </div>
              <!-- Ảnh đính kèm -->
              <div v-if="m.attachments && m.attachments.length" class="ms-bubble-images">
                <img
                  v-for="(att, i) in m.attachments"
                  :key="i"
                  :src="att.previewUrl || att.url"
                  class="ms-img-preview"
                  @click="openLightbox(att.url)"
                />
              </div>
            </div>
            <div v-if="!selected.messages?.length" class="ms-no-chat">
              Chưa có ghi nhận trao đổi. Hãy gửi tin nhắn đầu tiên cho khách!
            </div>
          </div>

          <!-- Thanh nhập tin nhắn Messenger cố định vĩnh viễn dưới cùng -->
          <form class="ms-input-bottom-bar" @submit.prevent="addMessage">
            <div class="ms-mode-pills">
              <button
                type="button"
                :class="['mode-pill', { active: messageDirection === 'OUT' }]"
                :disabled="!messengerPolicyInfo.within24h"
                @click="messageDirection = 'OUT'"
              >
                💬 FB
              </button>
              <button
                type="button"
                :class="['mode-pill', { active: messageDirection === 'IN' }]"
                @click="messageDirection = 'IN'"
              >
                📝 Ghi chú
              </button>
            </div>
            <input
              v-model="messageBody"
              type="text"
              class="ms-input-text"
              :placeholder="messageDirection === 'OUT' ? 'Nhập tin nhắn Messenger...' : 'Ghi chép nội bộ...'"
              required
              @focus="scrollChatToBottom(true)"
            />
            <button
              type="submit"
              class="ms-send-button"
              :disabled="busy || (messageDirection === 'OUT' && !messengerPolicyInfo.within24h)"
            >
              {{ busy ? '⏳' : '➤' }}
            </button>
          </form>
        </div>
      </Teleport>

      <!-- BOTTOM SHEETS / MODALS DÀNH CHO MOBILE (Teleport vào root body) -->
      <!-- DRAWER 1: HỒ SƠ KHÁCH HÀNG CRM (Khi bấm ℹ️) -->
      <Teleport to="body">
        <Transition name="ms-sheet">
          <div v-if="showMobileCrmDrawer && selected" class="ms-sheet-backdrop" @click="showMobileCrmDrawer = false">
            <div class="ms-sheet-drawer" @click.stop>
              <div class="ms-sheet-handle"></div>
              <div class="ms-sheet-header">
                <div>
                  <h3>Hồ Sơ Khách Hàng CRM</h3>
                  <p>{{ selected.customerName }} {{ selected.phone ? `· ${selected.phone}` : '' }}</p>
                </div>
                <button type="button" class="ms-sheet-close-btn" @click="showMobileCrmDrawer = false">✕</button>
              </div>

              <div class="ms-sheet-status-group">
                <button
                  v-for="s in statusOptions.slice(1)"
                  :key="s.key"
                  type="button"
                  :class="['status-chip', `chip-${s.key.toLowerCase()}`, { active: edit.status === s.key }]"
                  @click="setStatusQuick(s.key)"
                >
                  {{ s.label }}
                </button>
              </div>

              <div class="ms-sheet-form">
                <div class="ms-form-group">
                  <label>Nhu cầu của khách</label>
                  <input v-model="edit.interest" placeholder="Ví dụ: Đầu tư phòng thu âm" @change="save" />
                </div>
                <div class="ms-form-group">
                  <label>Số điện thoại</label>
                  <input v-model="edit.phone" placeholder="Nhập số điện thoại khách" @change="save" />
                </div>
                <div class="ms-form-group">
                  <label>Địa chỉ lắp đặt</label>
                  <input v-model="edit.address" placeholder="Số nhà, đường, thôn/xóm..." @change="save" />
                </div>
                <div class="ms-form-group">
                  <label>Tỉnh/Thành phố</label>
                  <input v-model="edit.province" list="fb-province-options" placeholder="Chọn tỉnh/thành" @change="save" />
                </div>
                <div class="ms-form-group">
                  <label>Ghi chú tư vấn</label>
                  <textarea v-model="edit.notes" rows="2" placeholder="Ghi chú thêm về thiết bị, giá..." @change="save"></textarea>
                </div>
                <div class="ms-form-group">
                  <label>Chiến dịch quảng cáo</label>
                  <select v-model="edit.sourceAdId" @change="onSourceAdChange">
                    <option value="">-- Chưa gắn quảng cáo --</option>
                    <option v-for="ad in ads" :key="ad.id" :value="ad.id">{{ ad.name }}</option>
                  </select>
                </div>
              </div>

              <div class="ms-sheet-footer">
                <button type="button" class="btn-sheet-done" @click="showMobileCrmDrawer = false">
                  ✓ Hoàn tất &amp; Đóng
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- DRAWER 2: CÀI ĐẶT AI TỰ ĐỘNG (Khi bấm 🤖) -->
      <Teleport to="body">
        <Transition name="ms-sheet">
          <div v-if="showMobileAiModal" class="ms-sheet-backdrop" @click="showMobileAiModal = false">
            <div class="ms-sheet-drawer" @click.stop>
              <div class="ms-sheet-handle"></div>
              <div class="ms-sheet-header">
                <div>
                  <h3>Cài Đặt Trợ Lý AI Tự Động</h3>
                  <p>Quản trị AI phản hồi Messenger &amp; Bình luận Fanpage</p>
                </div>
                <button type="button" class="ms-sheet-close-btn" @click="showMobileAiModal = false">✕</button>
              </div>

              <div class="ms-ai-sheet-body">
                <div class="ai-card" :class="{ enabled: aiEnabled }">
                  <div class="ai-card-content">
                    <strong>AI Chat Messenger</strong>
                    <p>Tự động trả lời tin nhắn Messenger. Tự ngắt khi có SĐT hoặc có nhân viên chat.</p>
                  </div>
                  <button
                    type="button"
                    class="ios-switch"
                    :class="{ on: aiEnabled }"
                    :disabled="togglingAi"
                    @click="toggleFacebookAi"
                  >
                    <span class="switch-ball"></span>
                  </button>
                </div>

                <div class="ai-card" :class="{ enabled: commentAiEnabled }">
                  <div class="ai-card-content">
                    <strong>AI Bình Luận (Cmt) Độc Lập</strong>
                    <p>Luôn trả lời 100% comment công khai &amp; gửi tin nhắn riêng kéo khách vào Messenger.</p>
                  </div>
                  <button
                    type="button"
                    class="ios-switch"
                    :class="{ on: commentAiEnabled }"
                    :disabled="togglingCommentAi"
                    @click="toggleCommentAi"
                  >
                    <span class="switch-ball"></span>
                  </button>
                </div>

                <div class="sync-action-box">
                  <button type="button" class="btn-full-sync" :disabled="syncBusy" @click="forceSync">
                    {{ syncBusy ? 'Đang quét tin nhắn mới…' : '↻ Quét tin nhắn Fanpage ngay' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- DRAWER 3: LỌC QUẢNG CÁO (Khi bấm ⚙️ Lọc QC) -->
      <Teleport to="body">
        <Transition name="ms-sheet">
          <div v-if="showMobileFilterModal" class="ms-sheet-backdrop" @click="showMobileFilterModal = false">
            <div class="ms-sheet-drawer" @click.stop>
              <div class="ms-sheet-handle"></div>
              <div class="ms-sheet-header">
                <div>
                  <h3>Lọc Theo Nguồn Quảng Cáo</h3>
                  <p>Phân loại khách theo chiến dịch Meta Ads</p>
                </div>
                <button type="button" class="ms-sheet-close-btn" @click="showMobileFilterModal = false">✕</button>
              </div>
              <div class="ms-filter-sheet-body">
                <select v-model="adFilter" class="sheet-ad-select">
                  <option value="ALL">Tất cả nguồn quảng cáo</option>
                  <option value="NONE">Chưa xác định quảng cáo</option>
                  <option v-for="ad in knownAds" :key="ad.id" :value="ad.id">{{ ad.name }} ({{ ad.count }})</option>
                </select>
                <div class="sheet-action-btns">
                  <button
                    type="button"
                    class="btn-match"
                    :disabled="autoMatchingBusy || resetMatchingBusy"
                    @click="autoMatchAds"
                  >
                    {{ autoMatchingBusy ? 'Đang phân loại...' : '⚡ Khớp nguồn tự động' }}
                  </button>
                  <button
                    type="button"
                    class="btn-unmatch"
                    :disabled="autoMatchingBusy || resetMatchingBusy"
                    @click="resetMatchedAds"
                  >
                    {{ resetMatchingBusy ? 'Đang bỏ khớp...' : '↺ Bỏ khớp' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>

    <!-- =====================================================================
         GIAO DIỆN DESKTOP (HOẶC KHI Ở TAB ANALYTICS)
         ===================================================================== -->
    <template v-if="!isMobile || currentTab === 'ANALYTICS'">
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
    </template>

    <!-- TAB 1: CHĂM SÓC KHÁCH HÀNG CRM (DESKTOP) -->
    <div v-if="!isMobile && currentTab === 'CARE'" class="care-tab-content">
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
        <div class="conn-action-row">
          <button v-if="messengerConnected" class="sync-action-btn" @click="forceSync" :disabled="syncBusy">
            {{ syncBusy ? 'Đang quét tin nhắn…' : '↻ Quét tin nhắn mới ngay' }}
          </button>
          <!-- Nút 1: AI Chat Messenger (Tự động ngắt khi có SĐT hoặc khi có người chat) -->
          <button
            type="button"
            class="ai-toggle-btn"
            :class="{ active: aiEnabled }"
            :disabled="togglingAi"
            @click="toggleFacebookAi"
            title="Bật/Tắt AI Messenger (Tự động ngắt khi có SĐT hoặc khi có nhân viên chat)"
          >
            <span class="ai-status-dot"></span>
            <span>AI Messenger: <strong>{{ aiEnabled ? 'ĐANG BẬT' : 'ĐÃ TẮT' }}</strong></span>
            <small class="ai-toggle-hint">({{ aiEnabled ? 'Bấm để Tắt' : 'Bấm để Bật' }})</small>
          </button>

          <!-- Nút 2: AI Bình Luận (Cmt) Độc Lập - LUÔN LUÔN TRẢ LỜI MỌI BÌNH LUẬN & KÉO VÀO MESSENGER -->
          <button
            type="button"
            class="ai-toggle-btn ai-toggle-comment"
            :class="{ active: commentAiEnabled }"
            :disabled="togglingCommentAi"
            @click="toggleCommentAi"
            title="Bật/Tắt AI Bình Luận độc lập (Luôn luôn trả lời 100% comment và gửi tin nhắn riêng kéo khách vào Messenger)"
          >
            <span class="ai-status-dot"></span>
            <span>AI Bình Luận (Cmt): <strong>{{ commentAiEnabled ? 'LUÔN BẬT' : 'ĐÃ TẮT' }}</strong></span>
            <small class="ai-toggle-hint">({{ commentAiEnabled ? 'Bấm để Tắt' : 'Bấm để Bật' }})</small>
          </button>
          <button
            v-if="messengerConnected"
            type="button"
            class="sync-action-btn"
            @click="clearMessengerMenu"
            :disabled="clearingMenu"
            title="Xóa menu điều hướng cũ hoặc quảng cáo thương hiệu của AhaChat khỏi Messenger của Page"
          >
            {{ clearingMenu ? 'Đang gỡ…' : '🗑 Gỡ Menu AhaChat' }}
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
          <button
            v-if="keyword"
            type="button"
            class="search-clear-btn"
            @click="keyword = ''"
            aria-label="Xóa tìm kiếm"
          >✕</button>
        </div>

        <!-- BỘ LỌC KÊNH TƯƠNG TÁC (TIN NHẮN vs BÌNH LUẬN) -->
        <div class="fb-channel-bar" aria-label="Phân loại kênh tương tác">
          <button
            type="button"
            :class="['fb-channel-btn', { active: channelFilter === 'ALL' }]"
            @click="channelFilter = 'ALL'"
          >
            <span class="channel-icon">🌐</span>
            <span>Tất cả</span>
            <b class="pill-count">{{ customers.length }}</b>
          </button>
          <button
            type="button"
            :class="['fb-channel-btn', 'btn-messenger', { active: channelFilter === 'MESSENGER' }]"
            @click="channelFilter = 'MESSENGER'"
          >
            <span class="channel-icon">💬</span>
            <span>Tin nhắn</span>
            <b class="pill-count">{{ messengerCustomersCount }}</b>
          </button>
          <button
            type="button"
            :class="['fb-channel-btn', 'btn-comment', { active: channelFilter === 'COMMENT' }]"
            @click="channelFilter = 'COMMENT'"
          >
            <span class="channel-icon">📝</span>
            <span>Bình luận</span>
            <b class="pill-count">{{ commentCustomersCount }}</b>
          </button>
        </div>

        <div class="fb-status-scroll">
          <button
            v-for="item in statusOptions"
            :key="item.key"
            :class="['fb-pill-btn', { active: filter === item.key }]"
            @click="filter = item.key"
          >
            <span>{{ item.label }}</span>
            <b class="pill-count">{{ countForStatus(item.key) }}</b>
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
            :class="['customer-row', `status-border-${c.status.toLowerCase()}`, { active: selected?.id === c.id }, isCommentCustomer(c) ? 'is-comment-row' : 'is-messenger-row']"
            @click="onCustomerClick(c)"
          >
            <!-- Messenger Avatar -->
            <div class="row-avatar-box">
              <div class="row-avatar-circle" :style="{ background: getAvatarGradient(c.customerName) }">
                {{ getInitials(c.customerName) }}
              </div>
              <span class="row-avatar-online"></span>
              <span :class="['row-channel-badge', isCommentCustomer(c) ? 'badge-comment' : 'badge-messenger']">
                {{ isCommentCustomer(c) ? '📝' : '💬' }}
              </span>
            </div>

            <div class="customer-row-main">
              <div class="customer-name-row">
                <strong class="customer-name-text">{{ c.customerName }}</strong>
                <span class="row-time-text">{{ formatMessengerTime(c.updatedAt || c.createdAt) }}</span>
                <span
                  :class="['channel-badge', isCommentCustomer(c) ? 'badge-comment' : 'badge-messenger']"
                  :title="isCommentCustomer(c) ? 'Khách tương tác từ Bình luận bài viết' : 'Khách nhắn tin qua Messenger'"
                >
                  {{ isCommentCustomer(c) ? '📝 Bình luận' : '💬 Tin nhắn' }}
                </span>
              </div>
              <small class="line-clamp" :title="c.interest || c.lastMessage">{{ formatSnippet(c) }}</small>
              <div class="customer-row-sub">
                <small class="contact-num">{{ c.phone || (isCommentCustomer(c) ? 'Bình luận Facebook' : c.facebookId || c.id) }}</small>
                <small v-if="c.sourceAdName || c.sourceAdId" class="source-small">QC: {{ c.sourceAdName || c.sourceAdId }}</small>
              </div>
            </div>
            <div class="customer-row-right">
              <span :class="['status', c.status.toLowerCase()]">{{ labelFor(c.status) }}</span>
              <a
                v-if="c.phone"
                :href="'tel:' + c.phone"
                class="row-phone-cta"
                title="Gọi điện ngay"
                @click.stop
              >📞</a>
            </div>
            <em v-if="c.followUpAt" class="row-reminder">Nhắc: {{ displayDate(c.followUpAt) }}</em>
          </button>
          <p v-if="!visibleCustomers.length" class="empty">Chưa có khách. Hệ thống tự động đồng bộ tin nhắn từ Fanpage.</p>
        </div>

        <section v-if="selected" class="detail">
          <div class="detail-head">
            <div class="detail-title-col">
              <div class="detail-name-row">
                <h2>{{ selected.customerName }}</h2>
                <span
                  :class="['detail-channel-tag', isCommentCustomer(selected) ? 'tag-comment' : 'tag-messenger']"
                >
                  {{ isCommentCustomer(selected) ? '📝 Khách từ Bình luận Facebook' : '💬 Khách từ Tin nhắn Messenger' }}
                </span>
              </div>
              <p>{{ selected.phone || 'Chưa có số điện thoại' }} <span v-if="selected.facebookId && !selected.facebookId.startsWith('FB-CMT-')"> · ID: {{ selected.facebookId }}</span></p>
            </div>
            <div class="detail-quick-actions">
              <a v-if="selected.phone" :href="'tel:' + selected.phone" class="quick-call-pill">
                📞 Gọi ngay
              </a>
              <a v-if="selected.facebookId && !selected.facebookId.startsWith('FB-CMT-')" :href="'https://facebook.com/' + selected.facebookId" target="_blank" rel="noopener" class="quick-fb-pill">
                💬 Facebook
              </a>
            </div>
          </div>

          <!-- Fast 1-Tap Status Switcher (Apple iOS Segmented Control) -->
          <div class="status-quick-switch" aria-label="Đổi trạng thái nhanh">
            <button
              v-for="s in statusOptions.slice(1)"
              :key="s.key"
              type="button"
              :class="['status-switch-pill', `sw-${s.key.toLowerCase()}`, { active: edit.status === s.key }]"
              @click="setStatusQuick(s.key)"
            >
              {{ s.label }}
            </button>
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
            <span>{{ isCommentCustomer(selected) ? 'Bình luận Facebook & Phản hồi tự động' : (messengerConnected ? 'Tin nhắn OUT sẽ gửi qua Messenger' : 'Ghi nhận nội bộ · Messenger chưa kết nối') }}</span>
          </div>
          <div class="history">
            <div v-for="m in selected.messages" :key="m.id" :class="['message', m.direction === 'OUT' ? 'out' : 'in', !m.platformMessageId && m.direction === 'IN' ? 'note' : '', m.body && m.body.startsWith('[Bình luận Facebook]') ? 'is-comment-msg' : '']">
              <small>
                <template v-if="m.direction === 'OUT'">
                  <span class="sender-tag out">Tú Audio</span>
                  <span v-if="m.createdBy && m.createdBy !== 'Tú Audio'"> ({{ m.createdBy }})</span>
                </template>
                <template v-else-if="m.body && m.body.startsWith('[Bình luận Facebook]')">
                  <span class="sender-tag comment-user">📝 Khách bình luận</span>
                </template>
                <template v-else-if="m.platformMessageId">
                  <span class="sender-tag fb-user">💬 Khách hàng (Messenger)</span>
                </template>
                <template v-else>
                  <span class="sender-tag staff-note">📝 Ghi chú nội bộ</span>
                  <span v-if="m.createdBy"> ({{ m.createdBy }})</span>
                </template>
                · {{ displayDate(m.createdAt) }}
              </small>
              <div v-if="m.body && !isPureImageLabel(m.body)" class="message-text">
                <p>{{ m.body.replace(/^\[Bình luận Facebook\]:\s*/i, '') }}</p>
              </div>

              <!-- Hiển thị ảnh thực tế nếu đã có attachments -->
              <div v-if="m.attachments && m.attachments.length" class="fb-media-grid">
                <div v-for="(att, i) in m.attachments" :key="i" class="fb-media-item">
                  <img
                    v-if="att.type === 'image' || isImageUrl(att.url)"
                    :src="att.previewUrl || att.url"
                    alt="Ảnh thiết bị khách gửi"
                    class="fb-msg-img"
                    loading="lazy"
                    title="Bấm để xem ảnh phóng to"
                    @click="openLightbox(att.url)"
                  />
                  <a v-else :href="att.url" target="_blank" rel="noopener" class="fb-file-link">
                    📎 {{ att.name || 'Tải tệp đính kèm' }}
                  </a>
                </div>
              </div>

              <!-- Nếu là tin nhắn đính kèm nhưng chưa tải xong ảnh từ Meta -->
              <div v-else-if="isMediaPlaceholder(m.body)" class="fb-media-placeholder">
                <span class="placeholder-icon">📷</span>
                <div class="placeholder-info">
                  <strong>Khách gửi ảnh thiết bị qua Messenger</strong>
                  <button
                    type="button"
                    class="btn-fetch-fb-image"
                    :disabled="loadingMediaId === (m.platformMessageId || m.id)"
                    @click="loadMessageMedia(m)"
                  >
                    <span v-if="loadingMediaId === (m.platformMessageId || m.id)">⏳ Đang tải ảnh từ Facebook…</span>
                    <span v-else>🔍 Bấm để tải &amp; xem ảnh thực tế</span>
                  </button>
                </div>
              </div>
            </div>
            <p v-if="!selected.messages?.length" class="empty">Chưa có ghi nhận hội thoại.</p>
          </div>

          <div v-if="selected" class="messenger-policy-banner" :class="{ 'window-open': messengerPolicyInfo.canSend, 'window-expired': !messengerPolicyInfo.canSend }">
            <span class="policy-text">{{ messengerPolicyInfo.label }}</span>
            <div v-if="!messengerPolicyInfo.within24h && selected.phone" class="quick-contact-actions">
              <a :href="'tel:' + selected.phone" class="quick-contact-btn phone" title="Gọi điện cho khách">📞 Gọi {{ selected.phone }}</a>
              <a :href="'https://zalo.me/' + selected.phone.replace(/\D/g, '')" target="_blank" rel="noopener" class="quick-contact-btn zalo" title="Nhắn Zalo">💬 Mở Zalo</a>
            </div>
          </div>

          <div v-if="isCommentCustomer(selected)" class="comment-channel-banner">
            <span class="comment-banner-icon">📝</span>
            <div class="comment-banner-content">
              <strong>Khách hàng từ Bình luận bài viết / Reel trên Fanpage</strong>
              <p>Hệ thống AI Tú Audio đã trả lời công khai dưới bình luận của khách. Để trao đổi thêm hoặc chốt đơn, nhân viên nên gọi điện trực tiếp hoặc nhắn tin qua Zalo số điện thoại của khách.</p>
            </div>
          </div>

          <form class="message-form" @submit.prevent="addMessage">
            <select v-model="messageDirection">
              <option value="OUT" :disabled="!messengerPolicyInfo.within24h">
                {{ messengerConnected ? (messengerPolicyInfo.within24h ? '🚀 Trả lời khách (Messenger)' : '🚀 Messenger (Quá 24h - Khóa)') : 'Đã tư vấn' }}
              </option>
              <option value="IN">📝 Ghi chú nội bộ của Shop</option>
            </select>
            <input v-model="messageBody" :placeholder="messageDirection === 'OUT' && messengerConnected ? 'Soạn tin nhắn gửi Messenger trực tiếp…' : 'Ghi chép nội dung trao đổi nội bộ, cuộc gọi, Zalo…'" required>
            <button class="ios-action-pill" :disabled="busy || (messageDirection === 'OUT' && !messengerPolicyInfo.within24h)">
              {{ busy ? 'Đang gửi…' : messageDirection === 'OUT' ? 'Gửi Messenger' : 'Lưu ghi chú' }}
            </button>
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
      <div v-if="error" class="error-dismissible-banner">
        <span>⚠️ {{ error }}</span>
        <button type="button" class="error-dismiss-btn" @click="error = ''">✕ Đóng</button>
      </div>
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

        <!-- Thẻ 4: Doanh Thu & ROAS HOẶC Khách Nét & SĐT khi chưa có đơn -->
        <div class="cockpit-card card-roas" :class="{ 'card-phone-focus': analyticsSummary.totalClosed === 0 && analyticsSummary.totalRevenue === 0 }">
          <div class="card-glow" :class="(analyticsSummary.totalClosed > 0 || analyticsSummary.totalRevenue > 0) ? 'glow-purple' : 'glow-gold'"></div>
          <div class="card-head">
            <div class="card-title-wrap">
              <span class="card-icon">{{ (analyticsSummary.totalClosed > 0 || analyticsSummary.totalRevenue > 0) ? '🚀' : '📱' }}</span>
              <span class="card-title">{{ (analyticsSummary.totalClosed > 0 || analyticsSummary.totalRevenue > 0) ? 'GIÁ TRỊ CHUYỂN ĐỔI & ROAS' : 'KHÁCH NÉT & TỶ LỆ RA SĐT' }}</span>
            </div>
            <span v-if="analyticsSummary.totalClosed > 0 || analyticsSummary.totalRevenue > 0" class="roas-top-badge">{{ analyticsSummary.avgRoas }}x ROAS</span>
            <span v-else class="rate-badge">{{ analyticsSummary.avgPhoneRate || 0 }}% Ra SĐT</span>
          </div>
          <div v-if="analyticsSummary.totalClosed > 0 || analyticsSummary.totalRevenue > 0" class="card-main-val text-neon-gold">
            {{ formatMoney(analyticsSummary.totalRevenue) }}
            <span class="val-sub" style="font-size: 0.8rem; opacity: 0.85; margin-left: 6px;">(Đã chi: {{ formatMoney(analyticsSummary.totalSpend) }})</span>
          </div>
          <div v-else class="card-main-val text-neon-gold">
            {{ analyticsSummary.totalPhoneCustomers || 0 }} <span class="val-sub">số điện thoại</span>
          </div>
          <div class="card-foot">
            <span v-if="analyticsSummary.totalClosed > 0 || analyticsSummary.totalRevenue > 0">
              Thu về: <strong class="text-green">{{ analyticsSummary.totalClosed }} lượt mua</strong> · Lãi gộp QC: <strong class="text-neon-gold">+{{ formatMoney(Math.max(0, analyticsSummary.totalRevenue - analyticsSummary.totalSpend)) }}</strong> (ROAS: {{ analyticsSummary.avgRoas }}x)
            </span>
            <span v-else>Giá / 1 SĐT: <strong class="text-amber">{{ (analyticsSummary.avgCpp || 0) > 0 ? formatMoney(analyticsSummary.avgCpp) : '—' }}</strong> (Tỷ lệ: {{ analyticsSummary.avgPhoneRate || 0 }}%)</span>
          </div>
        </div>
      </div>

      <!-- HUD CHẨN ĐOÁN AI & CỐ VẤN TĂNG TRƯỞNG QUẢNG CÁO -->
      <div class="cyber-radar-hud">
        <div class="radar-scan-effect"></div>
        <div class="hud-left">
          <div class="hud-radar-icon">
            <span class="radar-core"></span>
            <span class="radar-ring"></span>
          </div>
          <div class="hud-info">
            <div class="hud-tag">🤖 CHUYÊN GIA AI TỐI ƯU &amp; TĂNG TRƯỞNG QUẢNG CÁO · META ADS COPILOT</div>
            <h3 class="hud-title">Bắt Mạch Chiến Dịch &amp; Phân Tích Dòng Tiền Đầu Tư (Chi vs Thu)</h3>
            <p class="hud-desc">
              Đo lường chi tiết mục đích chạy QC, đối soát số tiền chi và doanh thu thực thu, bắt bệnh độ hút Content (CTR),
              giá thầu (CPM), giá tin nhắn (CPL), tệp khách nét có SĐT (CPP) và tỷ suất sinh lời ROAS.
            </p>
          </div>
        </div>
        <div class="hud-right">
          <div class="quick-status-pills">
            <span v-if="(analyticsSummary.totalPhoneCustomers || 0) > 0" class="status-pill pill-success">
              📞 Thu được {{ analyticsSummary.totalPhoneCustomers }} SĐT chất lượng ({{ analyticsSummary.avgPhoneRate }}% khách)
            </span>
            <span v-if="(analyticsSummary.avgCtr || 0) >= 2" class="status-pill pill-success">
              ✓ Content 3s đầu rất tốt (CTR {{ analyticsSummary.avgCtr }}%)
            </span>
            <span v-if="(analyticsSummary.avgCpm || 0) <= 70000 && (analyticsSummary.avgCpm || 0) > 0" class="status-pill pill-success">
              ✓ Giá thầu CPM rẻ ({{ formatMoney(analyticsSummary.avgCpm) }})
            </span>
            <span v-if="analyticsSummary.totalLeads > 10 && (analyticsSummary.totalPhoneCustomers || 0) === 0" class="status-pill pill-warning">
              ⚠️ Cảnh báo: {{ analyticsSummary.totalLeads }} khách nhưng 0 SĐT (Bệnh mess ảo)
            </span>
            <span v-else-if="analyticsSummary.totalLeads > 0 && analyticsSummary.totalClosed === 0" class="status-pill pill-warning">
              ⚡ Ưu tiên gọi tư vấn ngay cho các khách đã để lại SĐT
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

      <!-- KHU VỰC BIỂU ĐỒ TRỰC QUAN: CHI TIÊU VS DOANH THU & PHỄU CHUYỂN ĐỔI -->
      <div class="adm-card analytics-chart-card">
        <div class="chart-card-head">
          <div class="chart-head-left">
            <div class="chart-badge">VISUAL PERFORMANCE CHARTS</div>
            <h3 class="chart-card-title">
              📊 Biểu Đồ Đối Soát Tài Chính &amp; Phễu Chuyển Đổi Chiến Dịch
            </h3>
            <p class="chart-card-subtitle">
              Trực quan hóa chi tiết số tiền chi ra vs doanh thu thu về theo từng mục đích chiến dịch quảng cáo.
            </p>
          </div>

          <div class="chart-head-controls">
            <div class="chart-tab-group">
              <button
                type="button"
                :class="['chart-tab-btn', { active: activeChartView === 'BAR' }]"
                @click="activeChartView = 'BAR'"
              >
                📊 Chi Phí vs Doanh Thu
              </button>
              <button
                type="button"
                :class="['chart-tab-btn', { active: activeChartView === 'FUNNEL' }]"
                @click="activeChartView = 'FUNNEL'"
              >
                🌪️ Phễu Chuyển Đổi (Funnel)
              </button>
            </div>
            <button
              type="button"
              class="chart-collapse-btn"
              @click="showCharts = !showCharts"
              :title="showCharts ? 'Thu gọn biểu đồ' : 'Mở rộng biểu đồ'"
            >
              {{ showCharts ? '▲ Thu gọn' : '▼ Mở biểu đồ' }}
            </button>
          </div>
        </div>

        <div v-show="showCharts" class="chart-card-body">
          <!-- GÓC NHÌN 1: BIỂU ĐỒ CỘT ĐÔI SO SÁNH CHI TIÊU & DOANH THU TỪNG CHIẾN DỊCH -->
          <div v-if="activeChartView === 'BAR'" class="chart-view-bars">
            <div class="chart-bars-legend">
              <div class="legend-item">
                <span class="legend-color legend-spend"></span>
                <span>Chi Phí QC Đã Chi (Spend)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color legend-revenue"></span>
                <span>Doanh Thu Thu Được (Revenue)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color legend-profit"></span>
                <span>Lãi Gộp / ROAS Thực Tế</span>
              </div>
            </div>

            <div class="campaign-bars-list">
              <div
                v-for="item in filteredAnalyticsData"
                :key="'bar-' + item.id"
                class="campaign-bar-row"
                :class="{ 'row-highlight-win': item.roas >= 2 || item.diagnosis?.action === 'SCALE' }"
              >
                <div class="bar-row-meta">
                  <div class="bar-campaign-title-wrap">
                    <span :class="['cyber-dot', item.isMetaActive ? 'dot-active' : 'dot-paused']"></span>
                    <strong class="bar-campaign-title">{{ item.name }}</strong>
                    <span :class="['obj-badge', 'obj-badge-' + getCampaignObjective(item).color]">
                      {{ getCampaignObjective(item).icon }} {{ getCampaignObjective(item).tag }}
                    </span>
                  </div>
                  <div class="bar-campaign-strategy">{{ getCampaignObjective(item).title }}</div>
                </div>

                <div class="bar-visual-tracks">
                  <!-- Thanh Chi Phí (Spend) -->
                  <div class="track-row track-spend">
                    <div class="track-label">Chi tiêu:</div>
                    <div class="track-bar-container">
                      <div class="bar-fill fill-spend" :style="{ width: getSpendBarWidth(item.spend) }"></div>
                      <span class="bar-val-text text-red">{{ formatMoney(item.spend) }}</span>
                    </div>
                  </div>

                  <!-- Thanh Doanh Thu (Revenue) -->
                  <div class="track-row track-revenue">
                    <div class="track-label">Doanh thu:</div>
                    <div class="track-bar-container">
                      <div class="bar-fill fill-revenue" :style="{ width: getRevenueBarWidth(item.effectiveRevenue || item.metaConversionValue || 0) }"></div>
                      <span class="bar-val-text text-gold">
                        {{ formatMoney(item.effectiveRevenue || item.metaConversionValue || 0) }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="bar-row-financials">
                  <div v-if="(item.effectiveRevenue || item.metaConversionValue || 0) > 0" class="fin-stat-box fin-profit">
                    <span class="fin-label">Lãi gộp QC</span>
                    <strong class="fin-val text-green">
                      +{{ formatMoney(Math.max(0, (item.effectiveRevenue || item.metaConversionValue || 0) - item.spend)) }}
                    </strong>
                    <span :class="['roas-pill', item.roas >= 3 ? 'roas-high' : 'roas-mid']">ROAS: {{ item.roas }}x</span>
                  </div>
                  <div v-else-if="item.phoneCustomers > 0" class="fin-stat-box fin-leads">
                    <span class="fin-label">Phễu SĐT Nét</span>
                    <strong class="fin-val text-amber">{{ item.phoneCustomers }} SĐT ({{ item.phoneRate }}%)</strong>
                    <small class="fin-sub">Giá: {{ item.cpp > 0 ? formatMoney(item.cpp) : 'Rẻ' }}/SĐT</small>
                  </div>
                  <div v-else class="fin-stat-box fin-neutral">
                    <span class="fin-label">Trạng thái</span>
                    <strong class="fin-val text-muted">{{ item.cpl > 0 ? formatMoney(item.cpl) + '/tin' : 'Đang phân phối' }}</strong>
                  </div>

                  <div class="bar-ai-verdict">
                    <span :class="['action-badge', `action-${(item.diagnosis?.action || 'HOLD').toLowerCase()}`]">
                      {{ item.diagnosis?.actionLabel || 'Theo dõi' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- GÓC NHÌN 2: PHỄU CHUYỂN ĐỔI MARKETING & SALES (FUNNEL) -->
          <div v-else class="chart-view-funnel">
            <div class="funnel-summary-banner">
              <div class="funnel-kpi">
                <span class="kpi-label">Tổng vốn QC bỏ ra</span>
                <strong class="kpi-val text-red">{{ formatMoney(analyticsSummary.totalSpend) }}</strong>
              </div>
              <div class="funnel-arrow">➜</div>
              <div class="funnel-kpi">
                <span class="kpi-label">Tổng doanh thu thu về</span>
                <strong class="kpi-val text-gold">{{ formatMoney(analyticsSummary.totalRevenue) }}</strong>
              </div>
              <div class="funnel-arrow">➜</div>
              <div class="funnel-kpi">
                <span class="kpi-label">Lợi nhuận gộp tạm tính</span>
                <strong class="kpi-val text-green">
                  +{{ formatMoney(Math.max(0, analyticsSummary.totalRevenue - analyticsSummary.totalSpend)) }}
                </strong>
              </div>
              <div class="funnel-kpi">
                <span class="kpi-label">Hệ số nhân tiền</span>
                <strong class="kpi-val text-neon-blue">{{ analyticsSummary.avgRoas }}x ROAS</strong>
              </div>
            </div>

            <div class="funnel-steps-container">
              <!-- Tầng 1: Ngân Sách -->
              <div class="funnel-step step-1">
                <div class="step-badge">TẦNG 1</div>
                <div class="step-info">
                  <span class="step-name">💳 Tổng Ngân Sách Đã Chi</span>
                  <p class="step-hint">Chi phí bơm trực tiếp vào hệ thống Meta Ads</p>
                </div>
                <div class="step-bar-wrap">
                  <div class="funnel-bar bar-100"></div>
                </div>
                <div class="step-number text-red">{{ formatMoney(analyticsSummary.totalSpend) }}</div>
              </div>

              <!-- Tầng 2: Lượt Tiếp Cận (Impressions) -->
              <div class="funnel-step step-2">
                <div class="step-badge">TẦNG 2</div>
                <div class="step-info">
                  <span class="step-name">👁️ Lượt Hiển Thị &amp; Sức Hút Content</span>
                  <p class="step-hint">Độ hút 3s đầu video: <strong>CTR {{ analyticsSummary.avgCtr || 0 }}%</strong> ({{ (analyticsSummary.avgCtr || 0) >= 2 ? '🔥 Rất hút' : 'Cần tối ưu' }}) · CPM {{ formatMoney(analyticsSummary.avgCpm || 0) }}</p>
                </div>
                <div class="step-bar-wrap">
                  <div class="funnel-bar bar-85"></div>
                </div>
                <div class="step-number text-neon-blue">{{ formatNumber(analyticsSummary.totalImpressions || 0) }} lượt xem</div>
              </div>

              <!-- Tầng 3: Tin Nhắn Messenger (Leads) -->
              <div class="funnel-step step-3">
                <div class="step-badge">TẦNG 3</div>
                <div class="step-info">
                  <span class="step-name">💬 Khách Nhắn Tin Vào Fanpage (Leads)</span>
                  <p class="step-hint">Giá mỗi tin nhắn trung bình (CPL): <strong>{{ analyticsSummary.avgCpl > 0 ? formatMoney(analyticsSummary.avgCpl) : '—' }}</strong></p>
                </div>
                <div class="step-bar-wrap">
                  <div class="funnel-bar bar-70"></div>
                </div>
                <div class="step-number text-blue">{{ analyticsSummary.totalLeads }} tin nhắn</div>
              </div>

              <!-- Tầng 4: SĐT Khách Nét (MQL) -->
              <div class="funnel-step step-4">
                <div class="step-badge">TẦNG 4</div>
                <div class="step-info">
                  <span class="step-name">📞 Khách Nét Cung Cấp Số Điện Thoại</span>
                  <p class="step-hint">Tỷ lệ để lại SĐT: <strong>{{ analyticsSummary.avgPhoneRate || 0 }}%</strong> · Chi phí/1 SĐT (CPP): <strong>{{ (analyticsSummary.avgCpp || 0) > 0 ? formatMoney(analyticsSummary.avgCpp) : '—' }}</strong></p>
                </div>
                <div class="step-bar-wrap">
                  <div class="funnel-bar bar-50"></div>
                </div>
                <div class="step-number text-amber">{{ analyticsSummary.totalPhoneCustomers || 0 }} SĐT nét</div>
              </div>

              <!-- Tầng 5: Đơn Hàng Thành Công -->
              <div class="funnel-step step-5">
                <div class="step-badge">TẦNG 5</div>
                <div class="step-info">
                  <span class="step-name">🎯 Đơn Hàng Chốt Thành Công (Purchases)</span>
                  <p class="step-hint">Tỷ lệ chốt đơn: <strong>{{ analyticsSummary.overallCr || 0 }}%</strong> trên tổng khách nhắn tin</p>
                </div>
                <div class="step-bar-wrap">
                  <div class="funnel-bar bar-35"></div>
                </div>
                <div class="step-number text-green">{{ analyticsSummary.totalClosed }} đơn chốt</div>
              </div>

              <!-- Tầng 6: Doanh Thu & Thu Về -->
              <div class="funnel-step step-6">
                <div class="step-badge">TẦNG 6</div>
                <div class="step-info">
                  <span class="step-name">💰 Tổng Doanh Thu Thực Thu (Revenue)</span>
                  <p class="step-hint">Lãi ròng QC: <strong>+{{ formatMoney(Math.max(0, analyticsSummary.totalRevenue - analyticsSummary.totalSpend)) }}</strong> · ROAS đạt <strong>{{ analyticsSummary.avgRoas }}x</strong></p>
                </div>
                <div class="step-bar-wrap">
                  <div class="funnel-bar bar-20"></div>
                </div>
                <div class="step-number text-gold">{{ formatMoney(analyticsSummary.totalRevenue) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bảng xếp hạng chi tiết từng quảng cáo (Futuristic 7-Column Layout) -->
      <div class="adm-card analytics-table-card">
        <div class="table-card-head">
          <div class="head-title-wrap">
            <h3>Bảng Phân Tích Chiến Dịch &amp; Hiệu Quả Đầu Tư (ROI &amp; Ads Performance)</h3>
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

        <!-- Thanh phân loại phụ: Bộ lọc trạng thái hoạt động / tạm dừng & Chế độ phân tích -->
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

          <!-- Bộ chuyển chế độ: Phễu SĐT (khi chưa có đơn) vs Doanh thu ROAS -->
          <div class="view-mode-group">
            <span class="mode-lbl">Chế độ phân tích:</span>
            <button
              type="button"
              :class="['mode-btn', { active: effectiveAnalyticsMode === 'PHONE' }]"
              @click="userAnalyticsMode = 'PHONE'"
              title="Đo lường độ hiệu quả theo Số Điện Thoại & Khách Tiềm Năng (Chuẩn xác khi chưa chốt đơn)"
            >
              🎯 Phễu Khách Nét &amp; SĐT
            </button>
            <button
              type="button"
              :class="['mode-btn', { active: effectiveAnalyticsMode === 'REVENUE' }]"
              @click="userAnalyticsMode = 'REVENUE'"
              title="Đo lường độ hiệu quả theo Doanh Thu &amp; Đơn Hàng Thực Tế (ROAS)"
            >
              💰 Doanh Thu &amp; ROAS
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
                <th>Chiến Dịch &amp; Mục Đích Chạy QC</th>
                <th>Chi Phí Đã Chi &amp; Giá / Tin</th>
                <th>Sức Hút Content (CTR · CPM)</th>
                <th>Tin Nhắn &amp; Khách CRM</th>
                <th>{{ effectiveAnalyticsMode === 'PHONE' ? 'Khách Nét SĐT & Giá / SĐT (CPP)' : 'Doanh Thu & Lợi Nhuận Thực Tế' }}</th>
                <th>Đánh Giá Chuyên Gia AI &amp; Đề Xuất Tối Ưu</th>
                <th class="text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredAnalyticsData" :key="item.id" :class="`row-status-${item.isMetaActive ? 'active' : 'paused'}`">
                <!-- Cột 1: Chiến Dịch & Mục Đích Chạy QC -->
                <td class="col-campaign">
                  <div class="campaign-cell">
                    <div class="campaign-status-row">
                      <span :class="['cyber-dot', item.isMetaActive ? 'dot-active' : 'dot-paused']"></span>
                      <span :class="['meta-status-text', item.isMetaActive ? 'text-active' : 'text-paused']">
                        {{ item.isMetaActive ? 'ĐANG CHẠY TRÊN META' : 'ĐÃ TẠM DỪNG' }}
                      </span>
                    </div>
                    <strong class="campaign-title">{{ item.name }}</strong>
                    <div class="objective-pill-row">
                      <span :class="['obj-badge', 'obj-badge-' + getCampaignObjective(item).color]">
                        {{ getCampaignObjective(item).icon }} {{ getCampaignObjective(item).tag }}
                      </span>
                    </div>
                    <div class="objective-desc-sub">{{ getCampaignObjective(item).title }}</div>
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

                <!-- Cột 5: Đơn Chốt & Doanh Thu HOẶC Khách Nét SĐT & CPP -->
                <td class="col-revenue" v-if="effectiveAnalyticsMode === 'PHONE'">
                  <div class="phone-metric-cell">
                    <div class="phone-count-row">
                      <span class="font-bold text-amber">📞 {{ item.phoneCustomers || 0 }} SĐT</span>
                      <span class="badge-rate-pill" :class="(item.phoneRate || 0) >= 25 ? 'rate-high' : ((item.phoneRate || 0) >= 15 ? 'rate-mid' : 'rate-low')">
                        {{ item.phoneRate || 0 }}% SĐT
                      </span>
                    </div>
                    <div class="cpp-sub-row">
                      <span>Giá/SĐT: <strong class="text-neon-gold">{{ item.cpp > 0 ? formatMoney(item.cpp) : (item.phoneCustomers > 0 ? 'Miễn phí' : '—') }}</strong></span>
                    </div>
                    <div v-if="(item.closedCustomers || 0) > 0 || (item.effectiveRevenue || 0) > 0" class="sub-conversion-row" style="margin-top: 3px; font-size: 0.73rem;">
                      <span class="text-green font-bold">🎯 {{ item.closedCustomers || item.metaPurchases || 0 }} lượt mua: {{ formatMoney(item.effectiveRevenue || item.metaConversionValue || 0) }}</span>
                    </div>
                    <div class="quality-score-bar" :title="'Điểm tiềm năng: ' + (item.qualityScore || 50) + '/100'">
                      <div class="score-progress" :style="{ width: (item.qualityScore || 50) + '%' }" :class="getScoreClass(item.qualityScore)"></div>
                    </div>
                  </div>
                </td>
                <td class="col-revenue" v-else>
                  <div class="rev-cell">
                    <div class="orders-row">
                      <span class="font-bold text-green">🎯 {{ item.closedCustomers || item.metaPurchases || 0 }} lượt mua/đơn</span>
                    </div>
                    <div class="revenue-val-row" style="margin: 2px 0;">
                      <strong class="text-gold font-bold" style="font-size: 1.05rem;">{{ formatMoney(item.effectiveRevenue || item.metaConversionValue || 0) }}</strong>
                    </div>
                    <div v-if="(item.effectiveRevenue || item.metaConversionValue || 0) > 0" class="profit-val-row" style="margin-bottom: 2px; font-size: 0.74rem;">
                      <span class="text-green font-bold">Lãi: +{{ formatMoney(Math.max(0, (item.effectiveRevenue || item.metaConversionValue || 0) - item.spend)) }}</span>
                    </div>
                    <div class="roas-row">
                      <span :class="['roas-pill', item.roas >= 3 ? 'roas-high' : item.roas > 0 ? 'roas-mid' : 'roas-zero']">
                        ROAS: {{ item.roas }}x
                      </span>
                      <small v-if="item.spend > 0" class="text-muted" style="font-size: 0.72rem; margin-left: 6px;">
                        (Đã chi: {{ formatMoney(item.spend) }})
                      </small>
                    </div>
                  </div>
                </td>

                <!-- Cột 6: Đánh Giá Chuyên Gia AI & Đề Xuất Tối Ưu -->
                <td class="col-diagnosis">
                  <div class="diagnosis-box">
                    <div class="action-badge-row">
                      <span :class="['action-badge', `action-${(item.diagnosis?.action || 'HOLD').toLowerCase()}`]">
                        {{ item.diagnosis?.actionLabel || item.gradeLabel }}
                      </span>
                      <span class="quality-badge" :class="getScoreBadgeClass(item.qualityScore)">
                        ⭐ {{ item.qualityScore || 50 }}/100 đ
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

    <!-- Floating Back-to-Top Pill for Mobile & Desktop -->
    <Transition name="fade-slide">
      <button
        v-if="showBackToTop"
        type="button"
        class="floating-top-pill"
        @click="scrollToTop"
        aria-label="Cuộn lên đầu trang"
      >
        ↑ Đầu trang
      </button>
    </Transition>

    <!-- LIGHTBOX XEM ẢNH PHÓNG TO TOÀN MÀN HÌNH -->
    <Transition name="fade">
      <div v-if="lightboxImage" class="crm-lightbox-backdrop" @click.self="lightboxImage = ''">
        <div class="crm-lightbox-box">
          <button type="button" class="crm-lightbox-close" aria-label="Đóng ảnh" @click="lightboxImage = ''">✕</button>
          <img :src="lightboxImage" alt="Hình ảnh phóng to" class="crm-lightbox-img" />
          <div class="crm-lightbox-foot">
            <a :href="lightboxImage" target="_blank" rel="noopener" class="btn-lightbox-download">
              ⬇ Mở ảnh gốc kích thước đầy đủ (Tab mới)
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAdminStore } from '../../stores/adminStore'
import { apiRequest } from '../../utils/api'
import { VIETNAM_PROVINCES } from '../../../server/vietnamProvinces.js'
const adminStore = useAdminStore()
const channelFilter = ref('ALL') // 'ALL' | 'MESSENGER' | 'COMMENT'
const customers = ref([]), newArrivals = ref([]), selected = ref(null), showCreate = ref(false), busy = ref(false), syncBusy = ref(false), error = ref(''), orderSyncNotice = ref(''), keyword = ref(''), filter = ref('ALL'), adFilter = ref('ALL'), messageBody = ref(''), messageDirection = ref('OUT'), messengerConnected = ref(false), aiEnabled = ref(false), commentAiEnabled = ref(true), lastSyncedAt = ref(''), syncError = ref(''), ads = ref([]), adsBusy = ref(false), adsError = ref(''), adsConfigured = ref(false), autoMatchingBusy = ref(false), autoMatchNotice = ref(''), resetMatchingBusy = ref(false)
const isMobile = ref(false)
const mobileChatActive = ref(false)
const showMobileCrmDrawer = ref(false)
const showMobileAiModal = ref(false)
const showMobileFilterModal = ref(false)
const chatBodyRef = ref(null)

const checkIsMobile = () => {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth <= 768
  }
}

const getInitials = (name) => {
  if (!name) return '?'
  const parts = String(name).trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

const getAvatarGradient = (name) => {
  const gradients = [
    'linear-gradient(135deg, #0084ff 0%, #00c6ff 100%)',
    'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
  ]
  if (!name) return gradients[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i)
  return gradients[hash % gradients.length]
}

const formatMessengerTime = (value) => {
  if (!value) return ''
  const d = parseUtcDate(value)
  if (!d) return ''
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }).format(d)
  }
  if (diffDays === 1) return 'Hôm qua'
  if (d.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit' }).format(d)
  }
  return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: '2-digit' }).format(d)
}

function onCustomerClick(c) {
  select(c)
  if (isMobile.value) {
    mobileChatActive.value = true
    scrollChatToBottom()
  }
}

function closeMobileChat() {
  mobileChatActive.value = false
  showMobileCrmDrawer.value = false
}

function scrollChatToBottom(smooth = false) {
  const doScroll = () => {
    const el = chatBodyRef.value
    if (!el) return
    if (smooth && typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight + 1000, behavior: 'smooth' })
    } else {
      el.scrollTop = el.scrollHeight + 1000
    }
  }

  nextTick(() => {
    doScroll()
    setTimeout(doScroll, 50)
    setTimeout(doScroll, 150)
    setTimeout(doScroll, 320)
  })
}

// Tự động cuộn xuống dưới cùng khi chọn khách mới hoặc mở chat
watch(
  () => selected.value?.id,
  () => {
    if (selected.value && (!isMobile.value || mobileChatActive.value)) {
      scrollChatToBottom(false)
    }
  }
)

// Tự động cuộn xuống dưới cùng khi có tin nhắn mới (gửi đi hoặc nhận về)
watch(
  () => selected.value?.messages?.length,
  (newLen, oldLen) => {
    if (selected.value && (!isMobile.value || mobileChatActive.value)) {
      scrollChatToBottom(Boolean(oldLen && newLen > oldLen))
    }
  }
)

// Khóa cuộn trang nền khi mở hộp chat trên mobile
watch(mobileChatActive, (active) => {
  if (typeof document !== 'undefined') {
    if (active) {
      document.body.classList.add('chat-modal-open')
      scrollChatToBottom(false)
    } else {
      document.body.classList.remove('chat-modal-open')
    }
  }
})
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

const userAnalyticsMode = ref('AUTO') // 'AUTO' | 'PHONE' | 'REVENUE'
const effectiveAnalyticsMode = computed(() => {
  if (userAnalyticsMode.value === 'PHONE') return 'PHONE'
  if (userAnalyticsMode.value === 'REVENUE') return 'REVENUE'
  return (analyticsSummary.value.totalClosed || 0) > 0 ? 'REVENUE' : 'PHONE'
})

const activeChartView = ref('BAR') // 'BAR' | 'FUNNEL'
const showCharts = ref(true)

const getCampaignObjective = (item) => {
  if (item && item.objective) {
    const isLeadGen = item.objective.includes('Phễu') || item.objective.includes('SĐT')
    const isSales = item.objective.includes('Doanh Số') || item.objective.includes('Combo')
    const isPainPoint = item.objective.includes('Nỗi Đau') || item.objective.includes('Vang')
    return {
      tag: isLeadGen ? 'PHỄU THU HÚT SĐT' : (isSales ? 'CHUYỂN ĐỔI DOANH SỐ' : (isPainPoint ? 'NÂNG CẤP THIẾT BỊ' : 'LAN TỎA THƯƠNG HIỆU')),
      title: item.objective,
      desc: item.strategy || 'Tối ưu chuyển đổi khách hàng qua kênh Messenger và gọi điện tư vấn.',
      color: isLeadGen ? 'gold' : (isSales ? 'emerald' : (isPainPoint ? 'cyan' : 'blue')),
      icon: isLeadGen ? '🎯' : (isSales ? '🚀' : (isPainPoint ? '⚡' : '📢'))
    }
  }
  const text = (((item && item.name) || '') + ' ' + ((item && item.campaignName) || '')).toLowerCase()
  if (text.includes('căn chỉnh') || text.includes('miễn phí') || text.includes('thu cũ')) {
    return {
      tag: 'PHỄU THU HÚT SĐT · CHỐT COMBO',
      title: 'Tạo Phễu Thu Khách Nét & SĐT Dàn Lỗi để Chốt Combo / Thu Cũ Đổi Mới',
      desc: 'Mồi câu căn chỉnh & nâng cấp dàn tại nhà để tiếp cận tệp khách đang có dàn karaoke, lọc lấy số điện thoại có nhu cầu cao chuyển giao cho sale chốt đơn.',
      color: 'gold',
      icon: '🎯'
    }
  }
  if (text.includes('thu hút khách hàng') || text.includes('combo') || text.includes('dàn') || text.includes('bán')) {
    return {
      tag: 'CHUYỂN ĐỔI DOANH THU TRỰC TIẾP',
      title: 'Bán Trọn Gói Combo Dàn Karaoke Gia Đình & Khuyến Mãi Lớn',
      desc: 'Đánh thẳng vào khách hàng có nhu cầu sắm mới dàn karaoke gia đình, giới thiệu cấu hình đồng bộ âm học kèm quà tặng hấp dẫn.',
      color: 'emerald',
      icon: '🚀'
    }
  }
  if (text.includes('chỉnh tiếng mic') || text.includes('tiếng nhạc') || text.includes('hú rít') || text.includes('vang số')) {
    return {
      tag: 'GIẢI QUYẾT NỖI ĐAU HÁT NẶNG & HÚ RÍT',
      title: 'Đánh Đúng Nỗi Đau Hát Mệt / Hú Rít → Nâng Cấp Vang Số & Micro',
      desc: 'Khai thác tâm lý khó chịu khi hát bị mệt, rú rít để dẫn dắt khách hàng nâng cấp vang số chống hú hoặc micro chuyên nghiệp.',
      color: 'cyan',
      icon: '⚡'
    }
  }
  return {
    tag: 'MỞ RỘNG NHẬN DIỆN THƯƠNG HIỆU',
    title: 'Lan Tỏa Thương Hiệu Tú Audio & Kéo Khách Vào Hộp Thư Tư Vấn',
    desc: 'Tăng cường nhận diện chuyên gia âm thanh Tú Audio và thu hút tương tác của khách hàng yêu ca hát trên toàn quốc.',
    color: 'blue',
    icon: '📢'
  }
}

const maxChartSpendOrRevenue = computed(() => {
  const vals = filteredAnalyticsData.value.map(a => Math.max(Number(a.spend) || 0, Number(a.effectiveRevenue) || Number(a.metaConversionValue) || 0))
  return Math.max(...vals, 1000000)
})

const getSpendBarWidth = (spend) => {
  const s = Number(spend) || 0
  if (s <= 0 || maxChartSpendOrRevenue.value === 0) return '3%'
  return Math.min(100, Math.max(4, Math.round((s / maxChartSpendOrRevenue.value) * 100))) + '%'
}

const getRevenueBarWidth = (rev) => {
  const r = Number(rev) || 0
  if (r <= 0 || maxChartSpendOrRevenue.value === 0) return '0%'
  return Math.min(100, Math.max(4, Math.round((r / maxChartSpendOrRevenue.value) * 100))) + '%'
}

const getScoreClass = (score = 50) => {
  if (score >= 80) return 'score-win'
  if (score >= 65) return 'score-good'
  if (score >= 45) return 'score-mid'
  return 'score-bad'
}

const getScoreBadgeClass = (score = 50) => {
  if (score >= 80) return 'badge-score-win'
  if (score >= 65) return 'badge-score-good'
  if (score >= 45) return 'badge-score-mid'
  return 'badge-score-bad'
}

const analyticsSummary = ref({
  totalSpend: 0,
  totalLeads: 0,
  totalPhoneCustomers: 0,
  avgPhoneRate: 0,
  avgCpp: 0,
  totalClosed: 0,
  totalRevenue: 0,
  avgCpl: 0,
  avgRoas: 0,
  overallCr: 0,
  totalCampaigns: 0,
  periodLabel: 'Toàn thời gian (Trọn đời)',
  avgCtr: 0,
  avgCpm: 0,
  avgFrequency: 1
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
const parseUtcDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return value
  let str = String(value).trim()
  if (!str) return null
  // Nếu chuỗi datetime không có múi giờ từ PostgreSQL (không kết thúc bằng Z hoặc offset +07:00/-05:00)
  // thì mặc định chuẩn hóa thêm 'Z' để Date hiểu đúng mốc giờ UTC và quy đổi chính xác sang giờ Việt Nam (UTC+7)
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(str) && !str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
    str = str.replace(' ', 'T') + 'Z'
  }
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}
const displayDate = value => {
  const d = parseUtcDate(value)
  if (!d) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d)
}
const displayTime = value => {
  const d = parseUtcDate(value)
  if (!d) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(d)
}
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

const isCommentCustomer = (c) => {
  if (!c) return false
  return Boolean(
    c.sourceType === 'FACEBOOK_COMMENT' ||
    String(c.id || '').startsWith('FB-CMT-') ||
    String(c.facebookId || '').startsWith('FB-CMT-') ||
    (c.lastMessage && c.lastMessage.startsWith('[Bình luận Facebook]')) ||
    (c.notes && c.notes.includes('[Bình luận Facebook]'))
  )
}

const isMessengerCustomer = (c) => Boolean(c && !isCommentCustomer(c))

const messengerCustomersCount = computed(() => customers.value.filter(isMessengerCustomer).length)
const commentCustomersCount = computed(() => customers.value.filter(isCommentCustomer).length)

const countForStatus = (statusKey) => {
  return customers.value.filter(c => {
    if (channelFilter.value === 'MESSENGER' && !isMessengerCustomer(c)) return false
    if (channelFilter.value === 'COMMENT' && !isCommentCustomer(c)) return false
    if (statusKey !== 'ALL' && c.status !== statusKey) return false
    return true
  }).length
}

const formatSnippet = (c) => {
  if (!c) return ''
  const text = c.interest || c.lastMessage || 'Chưa ghi nhu cầu'
  return text.replace(/^\[Bình luận Facebook\]:\s*/i, '').trim()
}

const visibleCustomers = computed(() => customers.value.filter(c => {
  if (channelFilter.value === 'MESSENGER' && !isMessengerCustomer(c)) return false
  if (channelFilter.value === 'COMMENT' && !isCommentCustomer(c)) return false
  if (filter.value !== 'ALL' && c.status !== filter.value) return false
  if (adFilter.value !== 'ALL') {
    if (adFilter.value === 'NONE') {
      if (c.sourceAdId) return false
    } else if (c.sourceAdId !== adFilter.value) {
      return false
    }
  }
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    const target = `${c.customerName} ${c.phone} ${c.interest} ${c.lastMessage || ''} ${c.facebookId} ${c.sourceAdName || ''} ${c.sourceCampaignName || ''} ${c.sourceAdId || ''}`.toLowerCase()
    if (!target.includes(kw)) return false
  }
  return true
}))
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
    commentAiEnabled.value = r.commentAiEnabled !== false
    if (r.lastSyncedAt) lastSyncedAt.value = r.lastSyncedAt
    syncError.value = r.syncError || ''
    if (selected.value) {
      const updated = customers.value.find(c => c.id === selected.value.id) || null
      if (updated && silent && isEditingDetail()) selected.value = updated
      else select(updated)
    } else if (customers.value.length && !silent) {
      const routeCustomer = customers.value.find(c => c.id === String(route.query.customerId || ''))
      if (routeCustomer) {
        select(routeCustomer)
        if (isMobile.value) mobileChatActive.value = true
      } else {
        select(customers.value[0])
        if (isMobile.value) mobileChatActive.value = false
      }
    }
  } catch (e) {
    if (!silent) error.value = e.message
  }
}
async function forceSync() { syncBusy.value = true; error.value = ''; try { await load({ force: true }) } finally { syncBusy.value = false } }
const togglingAi = ref(false)
async function toggleFacebookAi() {
  togglingAi.value = true
  try {
    const nextState = !aiEnabled.value
    await apiRequest('/admin/ai-settings', {
      method: 'POST',
      body: JSON.stringify({ facebookAiEnabled: nextState })
    })
    aiEnabled.value = nextState
    adminStore.showNotice(`Đã ${nextState ? 'BẬT' : 'TẮT'} AI tự động trả lời trên Fanpage Facebook!`, 'success')
  } catch (e) {
    adminStore.showNotice(e.message || 'Không thể đổi trạng thái AI', 'error')
  } finally {
    togglingAi.value = false
  }
}

const togglingCommentAi = ref(false)
async function toggleCommentAi() {
  togglingCommentAi.value = true
  try {
    const nextState = !commentAiEnabled.value
    await apiRequest('/admin/ai-settings', {
      method: 'POST',
      body: JSON.stringify({ facebookCommentAiEnabled: nextState })
    })
    commentAiEnabled.value = nextState
    adminStore.showNotice(`Đã ${nextState ? 'BẬT' : 'TẮT'} AI trả lời bình luận (Comments) tự động!`, 'success')
  } catch (e) {
    adminStore.showNotice(e.message || 'Không thể đổi trạng thái AI bình luận', 'error')
  } finally {
    togglingCommentAi.value = false
  }
}
const clearingMenu = ref(false)
async function clearMessengerMenu() {
  if (!confirm('Bạn có chắc chắn muốn gỡ sạch menu điều hướng cũ (quảng cáo của AhaChat) khỏi Messenger của Fanpage?')) return
  clearingMenu.value = true
  try {
    const res = await apiRequest('/admin/facebook-care/clear-menu', { method: 'POST' })
    adminStore.showNotice(res.message || 'Đã gỡ bỏ sạch menu AhaChat thành công!', 'success')
  } catch (e) {
    adminStore.showNotice(e.message || 'Không thể gỡ menu Messenger', 'error')
  } finally {
    clearingMenu.value = false
  }
}
async function loadAds() { adsBusy.value = true; adsError.value = ''; try { const r = await apiRequest('/admin/facebook-ads'); ads.value = r.data || []; adsConfigured.value = Boolean(r.configured) } catch (e) { adsError.value = e.message; adsConfigured.value = e.status !== 503 } finally { adsBusy.value = false } }
const messengerPolicyInfo = computed(() => {
  if (!selected.value) return { canSend: false, within24h: false, label: '' }
  if (!messengerConnected.value) return { canSend: false, within24h: false, label: 'Chưa cấu hình Meta Page Messenger' }
  const msgs = selected.value.messages || []
  const realInbounds = msgs.filter(m => m.direction === 'IN' && m.platformMessageId)
  const fallbackInbounds = msgs.filter(m => m.direction === 'IN')
  const lastIn = realInbounds.slice(-1)[0] || fallbackInbounds.slice(-1)[0]
  if (!lastIn) {
    return { canSend: false, within24h: false, label: 'Chưa có tin nhắn Messenger từ khách gửi tới Page' }
  }
  const diffMs = Date.now() - new Date(lastIn.createdAt).getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours <= 24) {
    const leftHours = Math.max(0, 24 - diffHours)
    const h = Math.floor(leftHours)
    const m = Math.round((leftHours - h) * 60)
    return {
      canSend: true,
      within24h: true,
      label: `🟢 Cửa sổ 24h đang mở: Còn ${h} giờ ${m} phút để nhắn tin trực tiếp qua Messenger`
    }
  } else {
    return {
      canSend: false,
      within24h: false,
      label: '⚠️ Đã quá 24h: Facebook Meta khóa gửi tin tự do để chống spam. Vui lòng bấm [💬 Mở Zalo] hoặc chọn [📝 Ghi chú nội bộ].'
    }
  }
})

const lightboxImage = ref('')
const loadingMediaId = ref('')

function isPureImageLabel(text) {
  if (!text) return false
  const t = text.trim().toLowerCase()
  return t === '[khách gửi hình ảnh / tệp đính kèm]' ||
         t === '[khách gửi tệp đính kèm hoặc hình ảnh qua messenger]' ||
         t === '[trang gửi hình ảnh / tệp đính kèm]'
}

function isMediaPlaceholder(text) {
  if (!text) return false
  const t = text.toLowerCase()
  return t.includes('hình ảnh') || t.includes('tệp đính kèm')
}

function isImageUrl(url) {
  if (!url) return false
  return /\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(url) || url.includes('fbcdn.net') || url.includes('fbsbx.com')
}

function openLightbox(url) {
  lightboxImage.value = url
}

async function loadMessageMedia(msg) {
  const targetId = msg.platformMessageId || msg.id
  if (!targetId || loadingMediaId.value === targetId) return
  loadingMediaId.value = targetId
  try {
    const res = await apiRequest(`/admin/facebook-care/message-media/${encodeURIComponent(targetId)}`)
    if (res.attachments && res.attachments.length > 0) {
      msg.attachments = res.attachments
    }
  } catch (err) {
    console.warn('[FB Media] Load media warning:', err.message)
  } finally {
    loadingMediaId.value = ''
  }
}

function select(c) {
  error.value = ''
  selected.value = c
  if (c) {
    // Tự động kiểm tra và tải hình ảnh thực tế cho các tin nhắn đính kèm
    if (Array.isArray(c.messages)) {
      c.messages.forEach(m => {
        if (isMediaPlaceholder(m.body) && m.platformMessageId && (!m.attachments || m.attachments.length === 0)) {
          loadMessageMedia(m).catch(() => {})
        }
      })
    }
    Object.assign(edit, {
      status: c.status,
      interest: c.interest,
      phone: c.phone,
      address: c.address || '',
      province: c.province || '',
      notes: c.notes,
      followUpAt: c.followUpAt,
      assignedTo: c.assignedTo,
      sourceAdId: c.sourceAdId || ''
    })
    // Tự động kiểm tra thời hạn: nếu trong 24h thì mặc định Trả lời khách qua Messenger ('OUT'), nếu quá 24h thì tự động chuyển sang Ghi chú nội bộ ('IN')
    const msgs = c.messages || []
    const realIn = msgs.filter(m => m.direction === 'IN' && m.platformMessageId).slice(-1)[0]
      || msgs.filter(m => m.direction === 'IN').slice(-1)[0]
    const diffHours = realIn ? (Date.now() - new Date(realIn.createdAt).getTime()) / (1000 * 60 * 60) : 9999
    messageDirection.value = (messengerConnected.value && diffHours <= 24) ? 'OUT' : 'IN'
  }
}
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
async function setStatusQuick(key) {
  edit.status = key
  await save()
}
const showBackToTop = ref(false)
const onScroll = () => {
  showBackToTop.value = window.scrollY > 280
}
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
async function addMessage() {
  if (!messageBody.value.trim()) return
  error.value = ''
  if (messageDirection.value === 'OUT' && messengerConnected.value && !messengerPolicyInfo.value.within24h) {
    error.value = 'Khách hàng này đã quá 24 giờ kể từ tin nhắn cuối trên Messenger. Meta (Facebook) chặn gửi tự do để chống spam. Anh vui lòng bấm nút [💬 Mở Zalo] hoặc đổi sang [📝 Ghi chú nội bộ] nhé.'
    return
  }
  busy.value = true
  try {
    const customerId = selected.value.id
    const endpoint = messageDirection.value === 'OUT' && messengerConnected.value
      ? `/admin/facebook-care/${customerId}/send`
      : `/admin/facebook-care/${customerId}/messages`
    await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ body: messageBody.value, direction: messageDirection.value })
    })
    messageBody.value = ''
    await load({ silent: true })
    select(customers.value.find(c => c.id === customerId) || selected.value)
    scrollChatToBottom()
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
const onVisible = () => { if (document.visibilityState === 'visible' && !busy.value && !syncBusy.value) load({ silent: true }) }
onMounted(() => {
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)
  load(); loadAds()
  careTimer = setInterval(() => { if (document.visibilityState === 'visible' && !busy.value && !syncBusy.value) load({ silent: true }) }, 10000)
  adsTimer = setInterval(() => { if (document.visibilityState === 'visible' && !adsBusy.value) loadAds() }, 180000)
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', onVisible)
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.remove('chat-modal-open')
  }
  window.removeEventListener('resize', checkIsMobile)
  if (careTimer) clearInterval(careTimer)
  if (adsTimer) clearInterval(adsTimer)
  document.removeEventListener('visibilitychange', onVisible)
  window.removeEventListener('focus', onVisible)
  window.removeEventListener('scroll', onScroll)
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

.ai-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}
.ai-toggle-btn:hover:not(:disabled) {
  background: #f1f5f9;
}
.ai-toggle-btn.active {
  background: #f0fdf4;
  border-color: #86efac;
  color: #166534;
}
.ai-toggle-btn .ai-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
  display: inline-block;
}
.ai-toggle-btn.active .ai-status-dot {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}
.ai-toggle-btn.ai-toggle-comment.active {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
}
.ai-toggle-btn.ai-toggle-comment.active .ai-status-dot {
  background: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}
.ai-toggle-hint {
  font-size: 0.72rem;
  opacity: 0.8;
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

/* BỘ LỌC KÊNH TƯƠNG TÁC (TIN NHẮN vs BÌNH LUẬN) */
.fb-channel-bar {
  display: flex;
  gap: 6px;
  background: #f2f2f7;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.fb-channel-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: #636366;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
}
.fb-channel-btn:hover {
  color: var(--ios-label);
  background: rgba(255, 255, 255, 0.6);
}
.fb-channel-btn.active {
  background: #ffffff;
  color: var(--ios-label);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.fb-channel-btn.btn-messenger.active {
  color: #007aff;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.18);
}
.fb-channel-btn.btn-comment.active {
  color: #d97706;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.18);
}
.fb-channel-btn .channel-icon {
  font-size: 0.9rem;
}
.fb-channel-btn .pill-count {
  font-size: 0.72rem;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.06);
}
.fb-channel-btn.active .pill-count {
  background: rgba(0, 0, 0, 0.08);
  color: var(--ios-label);
}
.fb-channel-btn.btn-messenger.active .pill-count {
  background: rgba(0, 122, 255, 0.12);
  color: #007aff;
}
.fb-channel-btn.btn-comment.active .pill-count {
  background: rgba(217, 119, 6, 0.14);
  color: #d97706;
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
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: #ffffff;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 6px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  color: var(--ios-label);
  transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
}
.customer-row:hover {
  background: #f8f8fa;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}
.customer-row.active {
  background: rgba(0, 122, 255, 0.07);
  border-color: rgba(0, 122, 255, 0.35);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.15);
}
.customer-row.is-comment-row {
  background: #fffdf7;
  border-color: rgba(245, 158, 11, 0.22);
}
.customer-row.is-comment-row:hover {
  background: #fdf8eb;
}
.customer-row.is-comment-row.active {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.45);
}
.customer-row-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.customer-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.customer-name-text {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--ios-label);
}
.channel-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1.5px 6px;
  border-radius: 6px;
  letter-spacing: 0.2px;
  line-height: 1.2;
}
.channel-badge.badge-messenger {
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
  border: 1px solid rgba(0, 122, 255, 0.22);
}
.channel-badge.badge-comment {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
  border: 1px solid rgba(245, 158, 11, 0.28);
}
.customer-row-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.customer-row-sub .contact-num {
  font-size: 0.72rem;
  color: #48484a;
  font-weight: 600;
}
.customer-row-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}
.row-phone-cta {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(52, 199, 89, 0.14);
  color: #248a3d;
  text-decoration: none;
  font-weight: 700;
  transition: all 0.15s ease;
}
.row-phone-cta:hover {
  background: #34c759;
  color: #ffffff;
}

/* Status border accents */
.status-border-moi { border-left: 4px solid var(--ios-red) !important; }
.status-border-dang_tu_van { border-left: 4px solid var(--ios-blue) !important; }
.status-border-cho_phan_hoi { border-left: 4px solid var(--ios-orange) !important; }
.status-border-da_chot { border-left: 4px solid var(--ios-green) !important; }
.status-border-da_huy { border-left: 4px solid var(--ios-secondary) !important; }

.search-clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #c7c7cc;
  color: #ffffff;
  border: none;
  font-size: 0.68rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  line-height: 1;
  padding: 0;
}
.search-clear-btn:hover {
  background: #8e8e93;
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
  padding-bottom: 14px;
}
.detail-title-col {
  flex: 1;
  min-width: 0;
}
.detail-head h2 {
  margin: 0 0 4px;
  font-size: 1.1rem;
  font-weight: 700;
}
.detail-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}
.detail-name-row h2 {
  margin: 0;
}
.detail-channel-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 0.2px;
}
.detail-channel-tag.tag-messenger {
  background: rgba(0, 122, 255, 0.12);
  color: #007aff;
  border: 1px solid rgba(0, 122, 255, 0.25);
}
.detail-channel-tag.tag-comment {
  background: rgba(245, 158, 11, 0.14);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.detail-head p {
  font-size: 0.78rem;
  color: var(--ios-secondary);
}
.detail-quick-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.quick-call-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #34c759;
  color: #ffffff;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 0.76rem;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(52, 199, 89, 0.35);
  transition: all 0.15s ease;
}
.quick-call-pill:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}
.quick-fb-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #007aff;
  color: #ffffff;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 0.76rem;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  transition: all 0.15s ease;
}
.quick-fb-pill:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}

/* Fast 1-Tap Status Switcher */
.status-quick-switch {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 10px 0 14px;
  border-bottom: 1px solid #f2f2f7;
}
.status-quick-switch::-webkit-scrollbar {
  display: none;
}
.status-switch-pill {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 0.74rem;
  font-weight: 650;
  background: #f8f8fa;
  color: #636366;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}
.status-switch-pill:hover {
  background: #e5e5ea;
  color: var(--ios-label);
}
.status-switch-pill.active {
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  border-color: transparent;
}
.status-switch-pill.sw-moi.active { background: #ff3b30; }
.status-switch-pill.sw-dang_tu_van.active { background: #007aff; }
.status-switch-pill.sw-cho_phan_hoi.active { background: #ff9500; }
.status-switch-pill.sw-da_chot.active { background: #34c759; }
.status-switch-pill.sw-da_huy.active { background: #8e8e93; }

/* Floating Back-to-Top Button (Mobile only to avoid covering PC chat send button) */
.floating-top-pill {
  display: none;
}
@media (max-width: 768px) {
  .floating-top-pill {
    display: block;
    position: fixed;
    bottom: calc(72px + env(safe-area-inset-bottom, 0px));
    right: 18px;
    z-index: 990;
    background: rgba(28, 28, 30, 0.9);
    color: #ffffff;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 999px;
    padding: 8px 16px;
    font-size: 0.76rem;
    font-weight: 700;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.22);
    cursor: pointer;
    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .floating-top-pill:hover {
    background: rgba(0, 122, 255, 0.95);
    transform: translateY(-2px);
  }
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
.message.note {
  background: #fffbeb;
  border: 1px solid #fef08a;
  border-left: 3px solid #f59e0b;
}
.message.note small {
  color: #92400e;
}
.sender-tag {
  font-weight: 700;
}
.sender-tag.fb-user {
  color: #2563eb;
}
.sender-tag.staff-note {
  color: #b45309;
}
.sender-tag.comment-user {
  color: #d97706;
}
.sender-tag.out {
  color: #ffffff;
}
.message.is-comment-msg {
  background: #fefce8 !important;
  border-left: 3px solid #f59e0b !important;
}
.comment-channel-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fffbeb;
  border: 1px solid rgba(245, 158, 11, 0.28);
  border-radius: 12px;
  padding: 10px 14px;
  margin-top: 10px;
}
.comment-banner-icon {
  font-size: 1.2rem;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
}
.comment-banner-content strong {
  display: block;
  font-size: 0.82rem;
  color: #92400e;
  margin-bottom: 2px;
}
.comment-banner-content p {
  font-size: 0.76rem;
  color: #b45309;
  margin: 0;
  line-height: 1.4;
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
.messenger-policy-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.76rem;
  margin-top: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}
.messenger-policy-banner.window-open {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}
.messenger-policy-banner.window-expired {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}
.messenger-policy-banner .policy-text {
  font-weight: 600;
  line-height: 1.4;
}
.quick-contact-actions {
  display: inline-flex;
  gap: 6px;
  margin-left: auto;
}
.quick-contact-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
}
.quick-contact-btn.phone {
  background: #22c55e;
  color: #ffffff;
}
.quick-contact-btn.phone:hover {
  background: #16a34a;
}
.quick-contact-btn.zalo {
  background: #0068ff;
  color: #ffffff;
}
.quick-contact-btn.zalo:hover {
  background: #0052cc;
}

.message-form {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.message-form select {
  min-width: 170px;
  max-width: 220px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 0.78rem;
  font-weight: 600;
  background: #ffffff;
}
.message-form input {
  flex: 1;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.8rem;
}

.error-dismissible-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #b91c1c;
  font-size: 0.82rem;
  font-weight: 600;
}
.error-dismiss-btn {
  background: transparent;
  border: 1px solid #f87171;
  color: #b91c1c;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.75rem;
  cursor: pointer;
  font-weight: bold;
}
.error-dismiss-btn:hover {
  background: #fee2e2;
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

/* CHẾ ĐỘ PHÂN TÍCH: PHỄU SĐT VS DOANH THU */
.view-mode-group {
  display: inline-flex;
  align-items: center;
  background: var(--ios-fill);
  border-radius: 12px;
  padding: 2px 4px;
  gap: 4px;
}
.mode-lbl {
  font-size: 0.72rem;
  font-weight: 650;
  color: var(--ios-secondary);
  padding: 0 4px;
}
.mode-btn {
  padding: 5px 12px;
  font-size: 0.74rem;
  font-weight: 650;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #636366;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.mode-btn:hover {
  color: var(--ios-label);
}
.mode-btn.active {
  background: #ffffff;
  color: var(--ios-blue);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-weight: 750;
}

.phone-metric-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.phone-count-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.badge-rate-pill {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
}
.rate-high {
  background: #dcfce7;
  color: #15803d;
}
.rate-mid {
  background: #fef3c7;
  color: #b45309;
}
.rate-low {
  background: #fee2e2;
  color: #b91c1c;
}
.cpp-sub-row {
  font-size: 0.72rem;
  color: var(--ios-secondary);
}
.quality-score-bar {
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 2px;
}
.score-progress {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}
.score-win { background: #10b981; }
.score-good { background: #3b82f6; }
.score-mid { background: #f59e0b; }
.score-bad { background: #ef4444; }

.quality-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.badge-score-win { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
.badge-score-good { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
.badge-score-mid { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
.badge-score-bad { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

.glow-gold {
  box-shadow: 0 0 30px rgba(245, 158, 11, 0.25);
}
.card-phone-focus {
  border-color: rgba(245, 158, 11, 0.3) !important;
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
  .detail-head {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .detail-quick-actions {
    width: 100%;
  }
  .detail-quick-actions .quick-call-pill,
  .detail-quick-actions .quick-fb-pill {
    flex: 1;
    justify-content: center;
    padding: 8px 12px;
    font-size: 0.8rem;
  }
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

/* FB Media & Lightbox */
.fb-media-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}
.fb-media-item {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.fb-msg-img {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 10px;
  cursor: pointer;
  display: block;
  transition: transform 0.15s ease, filter 0.15s ease;
  background: #000;
}
.fb-msg-img:hover {
  transform: scale(1.03);
  filter: brightness(1.05);
}
.fb-file-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #0284c7;
  text-decoration: none;
}
.fb-media-placeholder {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  background: #eff6ff;
  border: 1px dashed #93c5fd;
  border-radius: 12px;
  color: #1e40af;
  margin-top: 4px;
}
.placeholder-icon {
  font-size: 1.2rem;
}
.btn-fetch-fb-image {
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
}
.btn-fetch-fb-image:hover:not(:disabled) {
  background: #1d4ed8;
}
.btn-fetch-fb-image:disabled {
  opacity: 0.7;
  cursor: wait;
}

.crm-lightbox-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(8px);
  z-index: 110000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.crm-lightbox-box {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.crm-lightbox-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}
.crm-lightbox-close:hover {
  background: rgba(255, 255, 255, 0.4);
}
.crm-lightbox-img {
  max-width: 88vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
}
.crm-lightbox-foot {
  margin-top: 12px;
}
.btn-lightbox-download {
  color: #93c5fd;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: underline;
}

/* ==========================================================================
   GIAO DIỆN NATIVE CHUẨN FACEBOOK MESSENGER (MOBILE VIEW)
   ========================================================================== */
.ms-mobile-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: calc(100vh - 70px);
  background: #ffffff;
  color: #050505;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  margin: -12px;
  padding-bottom: 24px;
}

/* Header Top Bar chuẩn Messenger */
.ms-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px 16px;
  background: #ffffff;
  position: sticky;
  top: 0;
  z-index: 20;
}
.ms-top-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ms-top-title-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ms-messenger-logo {
  font-size: 1.45rem;
}
.ms-messenger-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: #050505;
  letter-spacing: -0.4px;
  margin: 0;
}
.ms-live-pulse {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #31a24c;
  box-shadow: 0 0 0 2.5px rgba(49, 162, 76, 0.25);
  display: inline-block;
}
.ms-chats-count {
  font-size: 0.78rem;
  color: #65676b;
  font-weight: 500;
}
.ms-top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ms-circle-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f0f2f5;
  color: #050505;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: background 0.15s, transform 0.1s;
}
.ms-circle-btn:active {
  transform: scale(0.92);
  background: #e4e6eb;
}
.ms-circle-btn.spin {
  animation: ms-spin 0.8s linear infinite;
}
@keyframes ms-spin {
  100% { transform: rotate(360deg); }
}
.ms-dot-indicator {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid #ffffff;
}
.ms-dot-indicator.green { background: #31a24c; }
.ms-dot-indicator.amber { background: #f59e0b; }

/* Sub Tabs */
.ms-nav-tabs {
  display: flex;
  padding: 4px 16px 8px 16px;
  gap: 8px;
  background: #ffffff;
}
.ms-nav-tab {
  flex: 1;
  padding: 7px 12px;
  border-radius: 18px;
  border: 1px solid transparent;
  background: #f0f2f5;
  color: #65676b;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}
.ms-nav-tab.active {
  background: #e7f3ff;
  color: #0084ff;
  font-weight: 700;
  border-color: rgba(0, 132, 255, 0.2);
}

/* Search bar */
.ms-search-wrap {
  padding: 4px 16px 8px 16px;
  background: #ffffff;
}
.ms-search-field {
  position: relative;
  display: flex;
  align-items: center;
  background: #f0f2f5;
  border-radius: 20px;
  padding: 0 14px 0 36px;
  height: 38px;
}
.ms-search-icon {
  position: absolute;
  left: 12px;
  font-size: 0.95rem;
  opacity: 0.55;
}
.ms-search-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  color: #050505;
  outline: none;
}
.ms-search-input::placeholder {
  color: #8a8d91;
}
.ms-search-clear {
  border: none;
  background: rgba(0, 0, 0, 0.18);
  color: #ffffff;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Filter Strip */
.ms-filter-strip {
  display: flex;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 4px 16px 10px 16px;
  gap: 6px;
  background: #ffffff;
  border-bottom: 1px solid #f0f2f5;
}
.ms-filter-strip::-webkit-scrollbar { display: none; }
.ms-pill-chip {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 16px;
  border: none;
  background: #f0f2f5;
  color: #65676b;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.ms-pill-chip.active {
  background: #0084ff;
  color: #ffffff;
}
.ms-pill-chip.active b {
  color: #ffffff;
}
.ms-pill-chip b {
  font-weight: 800;
  margin-left: 2px;
}
.ms-pill-chip.chip-msg.active { background: #0084ff; }
.ms-pill-chip.chip-cmt.active { background: #9333ea; }
.ms-pill-chip.chip-ad-filter.has-ad { background: #fef3c7; color: #b45309; }

/* Mobile Create Form */
.ms-mobile-create-form {
  margin: 10px 16px;
  padding: 14px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.ms-form-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.ms-form-top strong {
  font-size: 0.95rem;
  color: #111827;
}
.ms-form-close {
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  cursor: pointer;
}
.ms-form-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ms-form-body input,
.ms-form-body textarea {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.88rem;
  outline: none;
}
.ms-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}
.btn-cancel {
  border: none;
  background: #f3f4f6;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.84rem;
  cursor: pointer;
}
.btn-save {
  border: none;
  background: #0084ff;
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.84rem;
  cursor: pointer;
}

/* Chat Threads List */
.ms-chat-threads {
  display: flex;
  flex-direction: column;
  background: #ffffff;
}
.ms-thread-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  border-bottom: 1px solid #f6f7f9;
  cursor: pointer;
  transition: background 0.12s;
}
.ms-thread-item:active {
  background: #f0f2f5;
}
.ms-thread-avatar-wrap {
  position: relative;
  flex-shrink: 0;
  width: 52px;
  height: 52px;
}
.ms-thread-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 1.15rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.ms-thread-online-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #31a24c;
  border: 2.5px solid #ffffff;
}
.ms-thread-channel-icon {
  position: absolute;
  top: -2px;
  right: -2px;
  font-size: 0.75rem;
  background: #ffffff;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.ms-thread-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.ms-thread-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.ms-thread-name {
  font-size: 0.98rem;
  font-weight: 700;
  color: #050505;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ms-thread-time {
  font-size: 0.72rem;
  color: #8a8d91;
  flex-shrink: 0;
  font-weight: 500;
}
.ms-thread-snippet-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ms-thread-snippet {
  font-size: 0.84rem;
  color: #65676b;
}
.ms-thread-snippet.is-demand {
  color: #0284c7;
  font-weight: 600;
}
.ms-thread-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 3px;
}
.tag-phone {
  font-size: 0.72rem;
  color: #059669;
  font-weight: 600;
  background: #ecfdf5;
  padding: 1px 6px;
  border-radius: 10px;
}
.tag-province {
  font-size: 0.72rem;
  color: #4b5563;
  background: #f3f4f6;
  padding: 1px 6px;
  border-radius: 10px;
}
.tag-status {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
  text-transform: uppercase;
}
.tag-status.moi { background: #fee2e2; color: #dc2626; }
.tag-status.dang_tu_van { background: #fef3c7; color: #d97706; }
.tag-status.cho_phan_hoi { background: #e0f2fe; color: #0284c7; }
.tag-status.da_chot { background: #dcfce7; color: #15803d; }
.tag-status.da_dung { background: #f3f4f6; color: #6b7280; }

.ms-threads-empty {
  text-align: center;
  padding: 40px 20px;
  color: #8a8d91;
}
.ms-threads-empty .empty-icon {
  font-size: 2.5rem;
  margin-bottom: 8px;
}
.ms-threads-empty h3 {
  color: #111827;
  font-size: 1rem;
  margin: 0 0 4px 0;
}
.ms-threads-empty p {
  font-size: 0.82rem;
  margin: 0;
}

/* Giao diện khung Chat toàn màn hình (Active Chat View) */
.ms-active-chat-view {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  width: 100%;
  height: 100dvh;
  height: 100vh;
  z-index: 999999;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}
.ms-chat-header {
  height: calc(56px + env(safe-area-inset-top, 0px));
  padding-top: env(safe-area-inset-top, 0px);
  padding-left: 12px;
  padding-right: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border-bottom: 1px solid #e4e6eb;
  flex-shrink: 0;
}
.ms-back-arrow-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  font-size: 2.2rem;
  color: #0084ff;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding-bottom: 4px;
}
.ms-chat-header-profile {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  cursor: pointer;
}
.ms-chat-header-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ms-header-online-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #31a24c;
  border: 2px solid #ffffff;
}
.ms-chat-header-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.ms-chat-header-name {
  font-size: 0.98rem;
  font-weight: 700;
  color: #050505;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ms-chat-header-sub {
  font-size: 0.73rem;
  color: #65676b;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ms-chat-header-btns {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ms-btn-call,
.ms-btn-crm-info {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #f0f2f5;
  border: none;
  color: #0084ff;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  cursor: pointer;
}

/* Policy Banner */
.ms-chat-policy-banner {
  padding: 6px 14px;
  background: #f0fdf4;
  color: #166534;
  font-size: 0.76rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #dcfce7;
  flex-shrink: 0;
}
.ms-chat-policy-banner.is-expired {
  background: #fef2f2;
  color: #991b1b;
  border-color: #fee2e2;
}
.btn-open-zalo {
  margin-left: auto;
  background: #0068ff;
  color: #ffffff;
  padding: 3px 8px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.72rem;
  white-space: nowrap;
}

/* Messages Scroll Area */
.ms-messages-scroll {
  flex: 1 1 0%;
  min-height: 0;
  height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #ffffff;
}
.ms-msg-item {
  display: flex;
  flex-direction: column;
  max-width: 82%;
}
.ms-msg-item.msg-in {
  align-self: flex-start;
}
.ms-msg-item.msg-out {
  align-self: flex-end;
}
.ms-bubble-meta {
  font-size: 0.68rem;
  color: #8a8d91;
  margin-bottom: 3px;
  padding: 0 4px;
}
.ms-msg-item.msg-out .ms-bubble-meta {
  text-align: right;
}
.ms-bubble-text {
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 0.92rem;
  line-height: 1.4;
  word-break: break-word;
}
.ms-msg-item.msg-in .ms-bubble-text {
  background: #f0f2f5;
  color: #050505;
  border-bottom-left-radius: 4px;
}
.ms-msg-item.msg-out .ms-bubble-text {
  background: linear-gradient(135deg, #0084ff 0%, #0072ff 100%);
  color: #ffffff;
  border-bottom-right-radius: 4px;
}
.ms-bubble-text p {
  margin: 0;
}
.ms-bubble-images {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ms-img-preview {
  max-width: 220px;
  max-height: 220px;
  border-radius: 14px;
  object-fit: cover;
  cursor: pointer;
}
.ms-no-chat {
  margin: auto;
  text-align: center;
  color: #8a8d91;
  font-size: 0.85rem;
  padding: 20px;
}

/* Bottom Chat Input Bar */
.ms-input-bottom-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0px)) 12px;
  background: #ffffff;
  border-top: 1px solid #e4e6eb;
  position: sticky;
  bottom: 0;
  z-index: 10;
}
.ms-mode-pills {
  display: flex;
  background: #f0f2f5;
  border-radius: 16px;
  padding: 2px;
  flex-shrink: 0;
}
.mode-pill {
  border: none;
  background: none;
  padding: 5px 8px;
  border-radius: 14px;
  font-size: 0.74rem;
  font-weight: 600;
  color: #65676b;
  cursor: pointer;
}
.mode-pill.active {
  background: #ffffff;
  color: #0084ff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}
.ms-input-text {
  flex: 1;
  height: 38px;
  border-radius: 20px;
  border: none;
  background: #f0f2f5;
  padding: 0 14px;
  font-size: 0.92rem;
  color: #050505;
  outline: none;
}
.ms-send-button {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #0084ff;
  color: #ffffff;
  border: none;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.1s;
}
.ms-send-button:active {
  transform: scale(0.92);
}
.ms-send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Bottom Sheets / Drawers */
.ms-sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

:global(body.chat-modal-open) {
  overflow: hidden !important;
  overscroll-behavior: none !important;
}
.ms-sheet-drawer {
  background: #ffffff;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 12px 16px 24px 16px;
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.2);
}
.ms-sheet-handle {
  width: 36px;
  height: 4px;
  background: #d1d5db;
  border-radius: 2px;
  margin: 0 auto 10px auto;
}
.ms-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.ms-sheet-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #050505;
}
.ms-sheet-header p {
  margin: 2px 0 0 0;
  font-size: 0.8rem;
  color: #65676b;
}
.ms-sheet-close-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: #f0f2f5;
  color: #65676b;
  font-size: 0.9rem;
  cursor: pointer;
}
.ms-sheet-status-group {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 4px 0 12px 0;
  scrollbar-width: none;
}
.ms-sheet-status-group::-webkit-scrollbar { display: none; }
.status-chip {
  padding: 6px 12px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 0.78rem;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  cursor: pointer;
}
.status-chip.active {
  background: #0084ff;
  color: #ffffff;
  border-color: #0084ff;
}
.ms-sheet-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ms-form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ms-form-group label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #4b5563;
}
.ms-form-group input,
.ms-form-group select,
.ms-form-group textarea {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.9rem;
  color: #050505;
  outline: none;
}
.ms-form-group input:focus,
.ms-form-group select:focus,
.ms-form-group textarea:focus {
  border-color: #0084ff;
}
.ms-sheet-footer {
  margin-top: 16px;
}
.btn-sheet-done {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: #0084ff;
  color: #ffffff;
  border: none;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
}

/* AI Sheet */
.ms-ai-sheet-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 6px 0;
}
.ai-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}
.ai-card.enabled {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.ai-card-content strong {
  display: block;
  font-size: 0.92rem;
  color: #111827;
}
.ai-card-content p {
  margin: 2px 0 0 0;
  font-size: 0.74rem;
  color: #6b7280;
}
.ios-switch {
  position: relative;
  width: 46px;
  height: 26px;
  border-radius: 13px;
  background: #d1d5db;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}
.ios-switch.on {
  background: #31a24c;
}
.switch-ball {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}
.ios-switch.on .switch-ball {
  transform: translateX(20px);
}
.sync-action-box {
  margin-top: 8px;
}
.btn-full-sync {
  width: 100%;
  padding: 11px;
  border-radius: 12px;
  background: #f0f2f5;
  color: #1f2937;
  border: none;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
}

/* Filter Ads Sheet */
.ms-filter-sheet-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 6px 0;
}
.sheet-ad-select {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.92rem;
  outline: none;
}
.sheet-action-btns {
  display: flex;
  gap: 8px;
}
.btn-match,
.btn-unmatch {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  border: none;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-match {
  background: #2563eb;
  color: #ffffff;
}
.btn-unmatch {
  background: #f3f4f6;
  color: #374151;
}

/* Transitions */
.ms-sheet-enter-active,
.ms-sheet-leave-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}
.ms-sheet-enter-from,
.ms-sheet-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

/* Desktop enhanced avatar styling */
.row-avatar-box {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  margin-right: 10px;
}
.row-avatar-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}
.row-avatar-online {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #31a24c;
  border: 2px solid #ffffff;
}
.row-channel-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  font-size: 0.65rem;
  background: #ffffff;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}
.row-time-text {
  font-size: 0.72rem;
  color: #8e8e93;
  margin-left: auto;
}

/* ==========================================================================
   KHU VỰC BIỂU ĐỒ TRỰC QUAN (VISUAL CHARTS DASHBOARD) & PHÂN TÍCH MỤC ĐÍCH QC
   ========================================================================== */
.analytics-chart-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}
.chart-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.chart-badge {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #0284c7;
  background: #e0f2fe;
  padding: 3px 10px;
  border-radius: 6px;
  display: inline-block;
  margin-bottom: 6px;
}
.chart-card-title {
  font-size: 1.22rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.chart-card-subtitle {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}
.chart-head-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}
.chart-tab-group {
  display: flex;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 10px;
  gap: 3px;
}
.chart-tab-btn {
  padding: 6px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
}
.chart-tab-btn.active {
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.chart-collapse-btn {
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
}
.chart-collapse-btn:hover {
  background: #f8fafc;
}

/* Legend */
.chart-bars-legend {
  display: flex;
  gap: 20px;
  padding: 10px 16px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 16px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  flex-wrap: wrap;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.legend-color {
  width: 14px;
  height: 14px;
  border-radius: 4px;
}
.legend-spend {
  background: linear-gradient(135deg, #ef4444, #f97316);
}
.legend-revenue {
  background: linear-gradient(135deg, #10b981, #eab308);
}
.legend-profit {
  background: linear-gradient(135deg, #0284c7, #8b5cf6);
}

/* Campaign Bars List */
.campaign-bars-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.campaign-bar-row {
  display: grid;
  grid-template-columns: 290px 1fr 210px;
  gap: 20px;
  align-items: center;
  padding: 14px 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  transition: all 0.2s ease;
}
.campaign-bar-row:hover {
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border-color: #cbd5e1;
}
.campaign-bar-row.row-highlight-win {
  border-left: 4px solid #10b981;
  background: #f0fdf4;
}
.bar-row-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bar-campaign-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.bar-campaign-title {
  font-size: 0.92rem;
  color: #0f172a;
  font-weight: 700;
  line-height: 1.3;
}
.bar-campaign-strategy {
  font-size: 0.74rem;
  color: #64748b;
  margin-top: 2px;
  line-height: 1.35;
}

/* Objective Badges */
.obj-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 0.02em;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.obj-badge-gold {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
}
.obj-badge-emerald {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}
.obj-badge-cyan {
  background: #cffafe;
  color: #155e75;
  border: 1px solid #a5f3fc;
}
.obj-badge-blue {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

/* Bar Tracks */
.bar-visual-tracks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.track-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.76rem;
}
.track-label {
  width: 72px;
  font-weight: 600;
  color: #64748b;
  flex-shrink: 0;
  text-align: right;
}
.track-bar-container {
  flex: 1;
  height: 20px;
  background: #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  position: relative;
}
.bar-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.fill-spend {
  background: linear-gradient(90deg, #ef4444, #f97316);
}
.fill-revenue {
  background: linear-gradient(90deg, #10b981, #eab308);
}
.bar-val-text {
  font-weight: 800;
  font-size: 0.74rem;
  padding-left: 8px;
  white-space: nowrap;
}

/* Financials in Bar Card */
.bar-row-financials {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}
.fin-stat-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.fin-label {
  font-size: 0.68rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
}
.fin-val {
  font-size: 0.95rem;
  font-weight: 800;
}
.fin-sub {
  font-size: 0.72rem;
  color: #64748b;
}

/* Funnel Visualization */
.funnel-summary-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #0f172a;
  border-radius: 16px;
  padding: 18px 24px;
  color: #ffffff;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}
.funnel-kpi {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.kpi-label {
  font-size: 0.74rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
}
.kpi-val {
  font-size: 1.25rem;
  font-weight: 800;
}
.funnel-arrow {
  font-size: 1.2rem;
  color: #64748b;
}
.funnel-steps-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.funnel-step {
  display: grid;
  grid-template-columns: 80px 240px 1fr 150px;
  gap: 16px;
  align-items: center;
  padding: 12px 18px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}
.funnel-step:hover {
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}
.step-badge {
  font-size: 0.7rem;
  font-weight: 800;
  color: #0284c7;
  background: #e0f2fe;
  padding: 3px 8px;
  border-radius: 6px;
  text-align: center;
}
.step-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.step-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
}
.step-hint {
  font-size: 0.74rem;
  color: #64748b;
  margin: 0;
}
.step-bar-wrap {
  height: 16px;
  background: #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}
.funnel-bar {
  height: 100%;
  border-radius: 8px;
}
.bar-100 { width: 100%; background: linear-gradient(90deg, #ef4444, #f97316); }
.bar-85 { width: 85%; background: linear-gradient(90deg, #0284c7, #38bdf8); }
.bar-70 { width: 70%; background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.bar-50 { width: 50%; background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.bar-35 { width: 35%; background: linear-gradient(90deg, #10b981, #34d399); }
.bar-20 { width: 20%; background: linear-gradient(90deg, #8b5cf6, #ec4899); }
.step-number {
  font-size: 0.95rem;
  font-weight: 800;
  text-align: right;
}

/* Objective in Table */
.objective-pill-row {
  margin: 4px 0 2px;
}
.objective-desc-sub {
  font-size: 0.72rem;
  color: #64748b;
  line-height: 1.25;
  margin-bottom: 2px;
}

@media (max-width: 1024px) {
  .campaign-bar-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .funnel-step {
    grid-template-columns: 70px 1fr 110px;
    gap: 10px;
  }
  .step-bar-wrap {
    display: none;
  }
}
</style>
