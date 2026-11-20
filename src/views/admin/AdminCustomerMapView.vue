<template>
  <div class="adm-page customer-map-page" :class="{ 'mobile-app-mode': isMobile }">
    <!-- ========================================================
         GIAO DIỆN DESKTOP (MÀN HÌNH MÁY TÍNH > 860PX) - HIỆN ĐẠI, TINH GỌN
         ======================================================== -->
    <template v-if="!isMobile">
      <div class="adm-page-head">
        <div class="head-title-wrap">
          <div class="title-row">
            <h1 class="adm-page-title">Bản đồ khách hàng</h1>
            <div class="map-stats-badges">
              <span class="stat-pill total"><b>{{ visibleCustomers.length }}</b> khách hiển thị</span>
              <span class="stat-pill custom">📍 <b>{{ customPointsCount }}</b> điểm tự thêm</span>
              <span class="stat-pill unvisited">● <b>{{ unvisitedCount }}</b> chưa đi</span>
              <span class="stat-pill visited">✓ <b>{{ visitedCount }}</b> đã đi</span>
              <span v-if="unlocatedCount > 0" class="stat-pill unlocated">{{ unlocatedCount }} chưa ghim tỉnh</span>
            </div>
          </div>
          <p class="adm-page-sub">Ghim vị trí theo tỉnh/thành khách hàng từ Fanpage &amp; CRM, và tự thêm các điểm khảo sát riêng biệt.</p>
        </div>
        <div class="head-actions">
          <button
            type="button"
            class="adm-btn adm-btn-add-point"
            @click="openAddModal"
            title="Tự thêm điểm mới độc lập trên bản đồ"
          >
            ＋ Thêm Điểm Mới
          </button>
          <button
            type="button"
            :class="['adm-gps-toggle-btn', { active: trackingLocation }]"
            :disabled="locationBusy"
            @click="toggleLocationTracking"
            :title="trackingLocation ? 'Đang theo dõi vị trí GPS của bạn' : 'Bật theo dõi vị trí GPS'"
          >
            <span class="gps-dot"></span>
            <span>{{ trackingLocation ? 'GPS: Đang theo dõi' : 'Bật theo dõi GPS' }}</span>
          </button>
          <button class="adm-btn adm-btn-refresh" :disabled="busy" @click="loadData">
            {{ busy ? 'Đang cập nhật…' : '↻ Làm mới' }}
          </button>
        </div>
      </div>

      <!-- Khối đơn giao tiếp theo: CHỈ hiển thị khi có đơn thực tế cần giao -->
      <section v-if="nearestOrders.length > 0" class="delivery-strip-box adm-card">
        <div class="delivery-strip-head">
          <span class="strip-icon">🚚</span>
          <strong>Đơn giao tiếp theo gần bạn:</strong>
        </div>
        <div class="delivery-strip-list">
          <button
            v-for="(order, index) in nearestOrders"
            :key="order.id"
            class="delivery-strip-item"
            @click="focusOrder(order)"
          >
            <span class="strip-num">{{ index + 1 }}</span>
            <span class="strip-info">
              <strong>{{ order.customerName }}</strong>
              <small>{{ order.address }} · ~{{ order.distanceKm }} km</small>
            </span>
            <span class="strip-badge">{{ order.status === 'DANG_GIAO' ? 'Đang giao' : 'Đã duyệt' }}</span>
          </button>
        </div>
      </section>

      <!-- Khung Không Gian Bản Đồ Desktop Tinh Gọn -->
      <section class="map-workspace adm-card">
        <aside class="map-customer-list">
          <!-- Thanh tìm kiếm & Bộ lọc Tab chuẩn App -->
          <div class="map-sidebar-filter">
            <div class="search-input-wrap">
              <span class="search-ico">🔍</span>
              <input
                v-model="keyword"
                type="search"
                placeholder="Tìm tên, SĐT, tỉnh/thành, ghi chú..."
              />
              <button v-if="keyword" type="button" class="clear-btn" @click="keyword = ''">✕</button>
            </div>

            <!-- Tab lọc Nguồn: Tách riêng Điểm tự thêm khỏi Facebook & Lead -->
            <div class="source-filter-tabs">
              <button
                type="button"
                :class="['source-tab', { active: sourceFilter === 'ALL' }]"
                @click="sourceFilter = 'ALL'"
              >
                Tất cả ({{ customers.length }})
              </button>
              <button
                type="button"
                :class="['source-tab custom', { active: sourceFilter === 'CUSTOM' }]"
                @click="sourceFilter = 'CUSTOM'"
              >
                📍 Tự thêm ({{ customPointsCount }})
              </button>
              <button
                type="button"
                :class="['source-tab fb', { active: sourceFilter === 'FACEBOOK' }]"
                @click="sourceFilter = 'FACEBOOK'"
              >
                💬 Facebook ({{ fbPointsCount }})
              </button>
              <button
                type="button"
                :class="['source-tab lead', { active: sourceFilter === 'LEAD' }]"
                @click="sourceFilter = 'LEAD'"
              >
                📋 CRM Lead ({{ leadPointsCount }})
              </button>
            </div>

            <div class="filter-chip-tabs">
              <button
                type="button"
                :class="['filter-tab', { active: visitFilter === 'ALL' }]"
                @click="visitFilter = 'ALL'"
              >
                Tất cả ({{ currentFilteredTotal }})
              </button>
              <button
                type="button"
                :class="['filter-tab warn', { active: visitFilter === 'NOT_VISITED' }]"
                @click="visitFilter = 'NOT_VISITED'"
              >
                ● Chưa đi ({{ currentFilteredUnvisited }})
              </button>
              <button
                type="button"
                :class="['filter-tab done', { active: visitFilter === 'VISITED' }]"
                @click="visitFilter = 'VISITED'"
              >
                ✓ Đã đi ({{ currentFilteredVisited }})
              </button>
            </div>
          </div>

          <!-- Chi tiết hồ sơ khách khi bấm chọn -->
          <div v-if="selected" class="map-selected-card" :class="{ 'is-custom-point': selected.recordType === 'CUSTOM' }">
            <div class="selected-head">
              <div class="selected-avatar" :class="{ custom: selected.recordType === 'CUSTOM' }">
                {{ selected.recordType === 'CUSTOM' ? '📍' : (selected.customerName?.charAt(0) || 'K') }}
              </div>
              <div class="selected-info">
                <div class="selected-name-row">
                  <strong>{{ selected.customerName }}</strong>
                  <span v-if="selected.recordType === 'CUSTOM'" class="badge-source-custom">
                    📍 Tự thêm · {{ pointTypeLabel(selected.pointType) }}
                  </span>
                </div>
                <span :class="['selected-status', { visited: selected.visitedAt }]">
                  {{ selected.visitedAt ? '✓ Đã hoàn tất ghé' : '● Chưa ghé' }}
                </span>
              </div>
              <button type="button" class="selected-close" aria-label="Đóng" @click="selected = null">✕</button>
            </div>

            <div class="selected-body">
              <div v-if="selected.phone" class="selected-row">
                <span class="row-lbl">Điện thoại:</span>
                <a :href="`tel:${selected.phone}`" class="row-phone">📞 {{ selected.phone }}</a>
                <a :href="`https://zalo.me/${selected.phone.replace(/[^0-9]/g, '')}`" target="_blank" rel="noopener" class="row-zalo">Zalo</a>
              </div>
              <div class="selected-row">
                <span class="row-lbl">Khu vực:</span>
                <span class="row-val">{{ customerArea(selected) }}</span>
              </div>
              <div class="selected-row">
                <span class="row-lbl">Khoảng cách:</span>
                <span class="row-km">~{{ distanceFromStore(selected).toLocaleString('vi-VN') }} km</span>
              </div>
              <div v-if="selected.interest || selected.notes" class="selected-row">
                <span class="row-lbl">{{ selected.recordType === 'CUSTOM' ? 'Ghi chú:' : 'Quan tâm:' }}</span>
                <span class="row-interest">{{ selected.notes || selected.interest }}</span>
              </div>
            </div>

            <div class="selected-actions">
              <button
                type="button"
                class="adm-btn visit-toggle"
                :class="{ visited: selected.visitedAt }"
                :disabled="visitBusy"
                @click="toggleVisited(selected)"
              >
                {{ visitBusy ? 'Đang lưu…' : selected.visitedAt ? '↶ Đổi sang chưa đi' : '✓ Đánh dấu đã đi' }}
              </button>
              <a class="adm-btn adm-btn-gmaps" :href="googleMapsUrl(selected)" target="_blank" rel="noopener">
                🧭 Google Maps
              </a>
              <template v-if="selected.recordType === 'CUSTOM'">
                <button type="button" class="adm-btn adm-btn-edit-point" @click="openEditModal(selected)">
                  ✏ Sửa điểm
                </button>
                <button type="button" class="adm-btn adm-btn-delete-point" :disabled="modalBusy" @click="deleteCustomPoint(selected)">
                  🗑 Xóa
                </button>
              </template>
              <button v-else type="button" class="adm-btn adm-btn-gold open-crm" @click="openCrm(selected)">
                Hồ sơ CRM
              </button>
            </div>
          </div>

          <!-- Danh sách khách hàng cuộn mượt -->
          <div class="map-customer-scroll">
            <button
              v-for="customer in visibleCustomers"
              :key="`${customer.recordType}:${customer.id}`"
              :class="['map-customer-item', { active: selected?.id === customer.id && selected?.recordType === customer.recordType, 'is-custom': customer.recordType === 'CUSTOM' }]"
              @click="selectCustomer(customer)"
            >
              <div :class="['customer-pin-dot', { visited: customer.visitedAt, custom: customer.recordType === 'CUSTOM' }]"></div>
              <div class="customer-item-main">
                <div class="item-title-row">
                  <span class="item-name">{{ customer.customerName }}</span>
                  <span v-if="customer.recordType === 'CUSTOM'" class="item-custom-tag">📍 Tự thêm</span>
                  <span v-if="customer.visitedAt" class="item-visited-badge">Đã đi</span>
                </div>
                <div class="item-sub-row">
                  <span class="item-province">{{ customer.province }}</span>
                  <span class="item-km">~{{ distanceFromStore(customer).toLocaleString('vi-VN') }} km</span>
                </div>
                <span v-if="customer.phone || customer.interest || customer.notes" class="item-detail">
                  {{ customer.phone ? `📞 ${customer.phone}` : (customer.notes || customer.interest) }}
                </span>
              </div>
            </button>
            <p v-if="!visibleCustomers.length" class="map-empty-state">
              Không tìm thấy khách hàng phù hợp.
            </p>
          </div>
        </aside>

        <!-- Bản đồ chiếm toàn bộ không gian còn lại bên phải -->
        <div ref="mapElementDesktop" class="map-canvas" aria-label="Bản đồ vị trí khách hàng"></div>
      </section>
      <p v-if="error" class="map-error">{{ error }}</p>
    </template>

    <!-- ========================================================
         GIAO DIỆN APP PHONG CÁCH XANH SM (TRÊN MOBILE <= 860PX)
         Bản đồ tràn viền 100%, tìm kiếm nổi, Bottom Drawer trượt êm
         ======================================================== -->
    <template v-else>
      <div class="xanhsm-app-container">
        <!-- Bản đồ tràn viền hoàn toàn làm nền -->
        <div ref="mapElementMobile" class="xanhsm-map-canvas" aria-label="Bản đồ định vị Xanh SM"></div>

        <!-- Khối tìm kiếm nổi trên đỉnh bản đồ (Xanh SM Header Bar) -->
        <header class="xanhsm-top-bar">
          <div class="xanhsm-search-pill">
            <span class="search-icon">🔍</span>
            <input
              v-model="keyword"
              type="search"
              class="xanhsm-input"
              placeholder="Tìm khách hàng, số điện thoại, khu vực…"
            >
            <button v-if="keyword" type="button" class="search-clear" @click="keyword = ''">✕</button>
            <button type="button" class="xanhsm-add-point-btn" @click="openAddModal" title="Thêm điểm mới">
              ＋ Điểm mới
            </button>
          </div>

          <!-- Bộ lọc Tab Nguồn (Tất cả, Điểm tự thêm, Facebook, CRM) -->
          <div class="xanhsm-source-chips">
            <button
              type="button"
              :class="['xanhsm-src-chip', { active: sourceFilter === 'ALL' }]"
              @click="sourceFilter = 'ALL'"
            >
              Tất cả ({{ customers.length }})
            </button>
            <button
              type="button"
              :class="['xanhsm-src-chip', 'custom', { active: sourceFilter === 'CUSTOM' }]"
              @click="sourceFilter = 'CUSTOM'"
            >
              📍 Tự thêm ({{ customPointsCount }})
            </button>
            <button
              type="button"
              :class="['xanhsm-src-chip', 'fb', { active: sourceFilter === 'FACEBOOK' }]"
              @click="sourceFilter = 'FACEBOOK'"
            >
              💬 FB ({{ fbPointsCount }})
            </button>
            <button
              type="button"
              :class="['xanhsm-src-chip', 'lead', { active: sourceFilter === 'LEAD' }]"
              @click="sourceFilter = 'LEAD'"
            >
              📋 CRM ({{ leadPointsCount }})
            </button>
          </div>

          <!-- Bộ lọc chip nổi dạng Xanh SM (Tất cả, Chưa đi, Đã đi) -->
          <div class="xanhsm-filter-chips">
            <button
              type="button"
              :class="['xanhsm-chip', { active: visitFilter === 'ALL' }]"
              @click="visitFilter = 'ALL'"
            >
              Tất cả ({{ currentFilteredTotal }})
            </button>
            <button
              type="button"
              :class="['xanhsm-chip', 'warn', { active: visitFilter === 'NOT_VISITED' }]"
              @click="visitFilter = 'NOT_VISITED'"
            >
              ● Chưa đi ({{ currentFilteredUnvisited }})
            </button>
            <button
              type="button"
              :class="['xanhsm-chip', 'done', { active: visitFilter === 'VISITED' }]"
              @click="visitFilter = 'VISITED'"
            >
              ✓ Đã đi ({{ currentFilteredVisited }})
            </button>
          </div>
        </header>

        <!-- Các nút tiện ích nổi góc phải phong cách App (Vị trí tôi, Toàn bộ, Danh sách) -->
        <div class="xanhsm-fab-group">
          <button
            type="button"
            class="xanhsm-fab-btn add-custom-fab"
            title="Thêm điểm mới độc lập"
            @click="openAddModal"
          >
            ＋
          </button>
          <button
            type="button"
            class="xanhsm-fab-btn"
            title="Xem toàn bộ khách hàng"
            @click="fitAllMarkers"
          >
            ⛶
          </button>
          <button
            type="button"
            class="xanhsm-fab-btn my-location"
            :class="{ active: trackingLocation }"
            title="Định vị vị trí của bạn"
            @click="handleGpsFabClick"
          >
            <span class="gps-dot"></span>
            📍
          </button>
          <button
            type="button"
            class="xanhsm-fab-btn list-toggle"
            :class="{ active: sheetState === 'expanded' }"
            title="Xem danh sách khách"
            @click="toggleSheetList"
          >
            📋
          </button>
        </div>

        <!-- Backdrop mờ khi mở full danh sách hoặc chi tiết khách -->
        <transition name="fade">
          <div
            v-if="sheetState === 'expanded' || (sheetState === 'detail' && selected)"
            class="xanhsm-backdrop"
            @click="handleBackdropClick"
          ></div>
        </transition>

        <!-- ========================================================
             BOTTOM DRAWER PHONG CÁCH XANH SM (3 TRẠNG THÁI)
             1. Peek Bar: Thu gọn hiển thị tóm tắt & khách gần nhất
             2. Expanded List: Kéo lên xem danh sách khách kiểu app
             3. Customer Card: Thẻ điều hướng & gọi điện cho khách đã chọn
             ======================================================== -->
        <div
          class="xanhsm-bottom-drawer"
          :class="[`state-${sheetState}`]"
        >
          <!-- Thanh kéo drag handle chuẩn app -->
          <div class="xanhsm-drag-handle-wrap" @click="handleHandleClick">
            <div class="xanhsm-drag-bar"></div>
          </div>

          <!-- TRẠNG THÁI 1: THU GỌN (PEEK) - Chạm để xem danh sách -->
          <div v-if="sheetState === 'peek'" class="xanhsm-peek-content" @click="sheetState = 'expanded'">
            <div class="peek-left">
              <div class="peek-badge-car">🚗 Tú Audio CRM</div>
              <strong class="peek-title">{{ visibleCustomers.length }} khách hàng trên lộ trình</strong>
              <small class="peek-sub">
                Gần nhất: {{ visibleCustomers[0] ? `${visibleCustomers[0].customerName} (~${distanceFromStore(visibleCustomers[0])} km)` : 'Không có' }}
              </small>
            </div>
            <button type="button" class="peek-open-btn">
              Xem danh sách ❯
            </button>
          </div>

          <!-- TRẠNG THÁI 2: DANH SÁCH KHÁCH (EXPANDED LIST) -->
          <div v-else-if="sheetState === 'expanded'" class="xanhsm-list-content">
            <div class="drawer-header">
              <div>
                <h3 class="drawer-title">Danh sách khách theo khoảng cách</h3>
                <small class="drawer-sub">Ưu tiên khách gần vị trí của bạn nhất</small>
              </div>
              <button type="button" class="drawer-close-btn" @click="sheetState = 'peek'">✕</button>
            </div>

            <div class="xanhsm-cards-scroll">
              <div
                v-for="(customer, idx) in visibleCustomers"
                :key="`${customer.recordType}:${customer.id}`"
                :class="['xanhsm-customer-card', { active: selected?.id === customer.id, 'is-custom': customer.recordType === 'CUSTOM' }]"
                @click="focusAndSelectCustomer(customer)"
              >
                <div class="card-left">
                  <span class="card-num" :class="{ custom: customer.recordType === 'CUSTOM' }">
                    {{ customer.recordType === 'CUSTOM' ? '📍' : (idx + 1) }}
                  </span>
                  <div class="card-info">
                    <div class="card-name-row">
                      <strong>{{ customer.customerName }}</strong>
                      <span v-if="customer.recordType === 'CUSTOM'" class="mobile-custom-tag">📍 Tự thêm</span>
                      <span :class="['card-status-badge', { visited: customer.visitedAt }]">
                        {{ customer.visitedAt ? '✓ Đã ghé' : '● Chưa đi' }}
                      </span>
                    </div>
                    <p class="card-address">
                      📍 {{ customerArea(customer) }}
                    </p>
                    <span v-if="customer.interest || customer.notes" class="card-interest">
                      {{ customer.notes || customer.interest }}
                    </span>
                  </div>
                </div>
                <div class="card-right">
                  <span class="card-km">~{{ distanceFromStore(customer) }} km</span>
                  <a
                    v-if="customer.phone"
                    :href="`tel:${customer.phone}`"
                    class="card-call-btn"
                    title="Gọi ngay"
                    @click.stop
                  >
                    📞
                  </a>
                </div>
              </div>
              <p v-if="!visibleCustomers.length" class="map-empty">
                Không tìm thấy điểm hoặc khách hàng nào theo bộ lọc.
              </p>
            </div>
          </div>

          <!-- TRẠNG THÁI 3: CHI TIẾT KHÁCH HÀNG (CUSTOMER DETAIL CARD - NHƯ NHẬN CUỐC XANH SM) -->
          <div v-else-if="sheetState === 'detail' && selected" class="xanhsm-detail-content" :class="{ 'is-custom': selected.recordType === 'CUSTOM' }">
            <div class="drawer-header detail-header">
              <div class="detail-name-group">
                <div class="detail-name-row">
                  <h3 class="detail-customer-name">{{ selected.customerName }}</h3>
                  <span v-if="selected.recordType === 'CUSTOM'" class="mobile-custom-tag">
                    📍 Tự thêm · {{ pointTypeLabel(selected.pointType) }}
                  </span>
                  <span :class="['card-status-badge', { visited: selected.visitedAt }]">
                    {{ selected.visitedAt ? '✓ Đã ghé thăm' : '● Chưa đi' }}
                  </span>
                </div>
                <p class="detail-location">
                  📍 {{ customerArea(selected) }}
                  <b class="detail-dist">(~{{ distanceFromStore(selected) }} km)</b>
                </p>
              </div>
              <button type="button" class="drawer-close-btn" @click="closeDetailSheet">✕</button>
            </div>

            <!-- Nhu cầu & sản phẩm khách quan tâm / Ghi chú -->
            <div v-if="selected.interest || selected.notes || safeImage(selected.interestImage)" class="detail-product-card">
              <img
                v-if="safeImage(selected.interestImage)"
                :src="safeImage(selected.interestImage)"
                class="detail-thumb"
                alt=""
              >
              <div class="detail-product-info">
                <small>{{ selected.recordType === 'CUSTOM' ? 'Ghi chú / Nhu cầu:' : 'Sản phẩm quan tâm:' }}</small>
                <strong>{{ selected.notes || selected.interest || 'Dàn Karaoke Gia Đình' }}</strong>
              </div>
            </div>

            <!-- HÀNG NÚT BẤM TO CHUẨN APP XANH SM: GỌI ĐIỆN & CHỈ ĐƯỜNG -->
            <div class="xanhsm-action-grid">
              <a
                v-if="selected.phone"
                :href="`tel:${selected.phone}`"
                class="xanhsm-action-btn btn-call"
              >
                <span class="action-icon">📞</span>
                <div class="action-text">
                  <small>GỌI ĐIỆN</small>
                  <strong>{{ selected.phone }}</strong>
                </div>
              </a>
              <a
                :href="googleMapsUrl(selected)"
                target="_blank"
                rel="noopener"
                class="xanhsm-action-btn btn-direct"
              >
                <span class="action-icon">🧭</span>
                <div class="action-text">
                  <small>CHỈ ĐƯỜNG</small>
                  <strong>Google Maps</strong>
                </div>
              </a>
            </div>

            <!-- Hàng nút phụ: Đánh dấu đã đi & Mở hồ sơ CRM / Sửa / Xóa -->
            <div class="xanhsm-sub-actions">
              <button
                type="button"
                class="xanhsm-sub-btn visit-btn"
                :disabled="visitBusy"
                @click="toggleVisited(selected)"
              >
                {{ selected.visitedAt ? '↶ Đánh dấu chưa đi' : '✓ Đã hoàn thành ghé thăm' }}
              </button>
              <template v-if="selected.recordType === 'CUSTOM'">
                <button
                  type="button"
                  class="xanhsm-sub-btn edit-btn"
                  @click="openEditModal(selected)"
                >
                  ✏ Sửa điểm
                </button>
                <button
                  type="button"
                  class="xanhsm-sub-btn delete-btn"
                  :disabled="modalBusy"
                  @click="deleteCustomPoint(selected)"
                >
                  🗑 Xóa
                </button>
              </template>
              <button
                v-else
                type="button"
                class="xanhsm-sub-btn crm-btn"
                @click="openCrm(selected)"
              >
                👤 Xem hồ sơ CRM ↗
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- BANNER HƯỚNG DẪN CHỌN TỌA ĐỘ TRỰC TIẾP TRÊN BẢN ĐỒ -->
    <transition name="slide-down">
      <div v-if="isPickingLocationOnMap" class="map-pick-banner">
        <div class="pick-banner-content">
          <span class="pick-pulse-dot"></span>
          <span class="pick-text">
            🎯 <strong>Chế độ chọn tọa độ:</strong> Chạm hoặc nhấp chuột vào bất kỳ vị trí nào trên bản đồ để lấy vị trí cho điểm.
          </span>
          <button type="button" class="pick-cancel-btn" @click="cancelPickingLocation">
            ✕ Hủy chọn
          </button>
        </div>
      </div>
    </transition>

    <!-- MODAL THÊM / CHỈNH SỬA ĐIỂM BẢN ĐỒ (RIÊNG BIỆT) -->
    <transition name="modal-fade">
      <div v-if="showCustomModal" class="custom-modal-backdrop" @click.self="closeCustomModal">
        <div class="custom-modal-card">
          <div class="modal-card-head">
            <div class="modal-title-wrap">
              <span class="modal-pin-icon">📍</span>
              <div>
                <h3>{{ modalMode === 'add' ? 'Thêm điểm mới trên bản đồ' : 'Chỉnh sửa điểm bản đồ' }}</h3>
                <small>Điểm này được lưu độc lập, không gộp vào tin nhắn Facebook hay CRM</small>
              </div>
            </div>
            <button type="button" class="modal-close-btn" @click="closeCustomModal">✕</button>
          </div>

          <form class="modal-card-body" @submit.prevent="saveCustomPoint">
            <div class="form-row">
              <label>Tên điểm / Tên khách hàng <span class="req">*</span></label>
              <input
                v-model="formPoint.name"
                type="text"
                placeholder="VD: Bác Tuấn - Dàn 29Tr, Kho Loa Lâm Thao, Nhà thử dàn..."
                required
                class="form-input"
              >
            </div>

            <div class="form-grid-2">
              <div class="form-row">
                <label>Phân loại điểm</label>
                <select v-model="formPoint.pointType" class="form-input">
                  <option value="CUSTOMER">Khách lắp đặt</option>
                  <option value="TESTING">Điểm thử dàn / Nghe thử</option>
                  <option value="PARTNER">Đại lý / Showroom đối tác</option>
                  <option value="DELIVERY">Điểm giao nhận / Bến xe</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
              <div class="form-row">
                <label>Số điện thoại (tùy chọn)</label>
                <input
                  v-model="formPoint.phone"
                  type="tel"
                  placeholder="VD: 0987654321"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-row">
                <label>Tỉnh / Thành phố <span class="req">*</span></label>
                <select v-model="formPoint.province" class="form-input" @change="onProvinceChange">
                  <option v-for="p in VIETNAM_PROVINCES_LIST" :key="p.name" :value="p.displayName">
                    {{ p.displayName }}
                  </option>
                </select>
              </div>
              <div class="form-row">
                <label>Địa chỉ cụ thể</label>
                <input
                  v-model="formPoint.address"
                  type="text"
                  placeholder="VD: Số 12 phố X, Phường Tiên Cát"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row coords-group">
              <div class="coords-head">
                <label>Tọa độ GPS (Vĩ độ &amp; Kinh độ) <span class="req">*</span></label>
                <button type="button" class="btn-pick-map" @click="startPickingLocationOnMap">
                  🎯 Chọn trực tiếp trên bản đồ
                </button>
              </div>
              <div class="form-grid-2">
                <div class="input-with-label">
                  <span class="sub-lbl">Lat:</span>
                  <input
                    v-model.number="formPoint.lat"
                    type="number"
                    step="any"
                    placeholder="Vĩ độ (VD: 21.32)"
                    class="form-input"
                    required
                  >
                </div>
                <div class="input-with-label">
                  <span class="sub-lbl">Lng:</span>
                  <input
                    v-model.number="formPoint.lng"
                    type="number"
                    step="any"
                    placeholder="Kinh độ (VD: 105.40)"
                    class="form-input"
                    required
                  >
                </div>
              </div>
            </div>

            <div class="form-row">
              <label>Ghi chú / Nhu cầu dàn / Thiết bị</label>
              <textarea
                v-model="formPoint.notes"
                rows="2"
                placeholder="Ghi chú cấu hình loa, âm ly, lưu ý khi ghé thăm..."
                class="form-textarea"
              ></textarea>
            </div>

            <div v-if="modalError" class="modal-form-error">{{ modalError }}</div>

            <div class="modal-card-foot">
              <button type="button" class="btn-modal-cancel" @click="closeCustomModal">Hủy bỏ</button>
              <button type="submit" class="btn-modal-submit" :disabled="modalBusy">
                {{ modalBusy ? 'Đang lưu…' : (modalMode === 'add' ? '✓ Thêm điểm mới' : '✓ Lưu cập nhật') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { apiRequest } from '../../utils/api'

const VIETNAM_PROVINCES_LIST = [
  { name: 'Phu Tho', displayName: 'Phú Thọ', lat: 21.32, lng: 105.40 },
  { name: 'Ha Noi', displayName: 'Hà Nội', lat: 21.03, lng: 105.85 },
  { name: 'Vinh Phuc', displayName: 'Vĩnh Phúc', lat: 21.31, lng: 105.60 },
  { name: 'Bac Ninh', displayName: 'Bắc Ninh', lat: 21.18, lng: 106.07 },
  { name: 'Hai Phong', displayName: 'Hải Phòng', lat: 20.85, lng: 106.68 },
  { name: 'Hai Duong', displayName: 'Hải Dương', lat: 20.94, lng: 106.33 },
  { name: 'Hung Yen', displayName: 'Hưng Yên', lat: 20.65, lng: 106.05 },
  { name: 'Thai Nguyen', displayName: 'Thái Nguyên', lat: 21.59, lng: 105.85 },
  { name: 'Tuyen Quang', displayName: 'Tuyên Quang', lat: 21.82, lng: 105.21 },
  { name: 'Yen Bai', displayName: 'Yên Bái', lat: 21.72, lng: 104.91 },
  { name: 'Lao Cai', displayName: 'Lào Cai', lat: 22.48, lng: 103.98 },
  { name: 'Bac Giang', displayName: 'Bắc Giang', lat: 21.27, lng: 106.20 },
  { name: 'Quang Ninh', displayName: 'Quảng Ninh', lat: 20.96, lng: 107.04 },
  { name: 'Nam Dinh', displayName: 'Nam Định', lat: 20.43, lng: 106.17 },
  { name: 'Ninh Binh', displayName: 'Ninh Bình', lat: 20.25, lng: 105.97 },
  { name: 'Ha Nam', displayName: 'Hà Nam', lat: 20.54, lng: 105.91 },
  { name: 'Thai Binh', displayName: 'Thái Bình', lat: 20.45, lng: 106.34 },
  { name: 'Hoa Binh', displayName: 'Hòa Bình', lat: 20.82, lng: 105.34 },
  { name: 'Son La', displayName: 'Sơn La', lat: 21.33, lng: 103.91 },
  { name: 'Thanh Hoa', displayName: 'Thanh Hóa', lat: 19.81, lng: 105.78 },
  { name: 'Nghe An', displayName: 'Nghệ An', lat: 18.67, lng: 105.68 },
  { name: 'Ha Tinh', displayName: 'Hà Tĩnh', lat: 18.35, lng: 105.90 },
  { name: 'Da Nang', displayName: 'Đà Nẵng', lat: 16.05, lng: 108.22 },
  { name: 'Hue', displayName: 'TP. Huế', lat: 16.46, lng: 107.59 },
  { name: 'Khanh Hoa', displayName: 'Khánh Hòa', lat: 12.24, lng: 109.19 },
  { name: 'Lam Dong', displayName: 'Lâm Đồng', lat: 11.94, lng: 108.44 },
  { name: 'Ho Chi Minh City', displayName: 'TP. Hồ Chí Minh', lat: 10.78, lng: 106.70 },
  { name: 'Binh Duong', displayName: 'Bình Dương', lat: 11.00, lng: 106.65 },
  { name: 'Dong Nai', displayName: 'Đồng Nai', lat: 10.95, lng: 106.82 },
  { name: 'Can Tho', displayName: 'Cần Thơ', lat: 10.03, lng: 105.78 },
  { name: 'An Giang', displayName: 'An Giang', lat: 10.38, lng: 105.44 },
  { name: 'Dak Lak', displayName: 'Đắk Lắk', lat: 12.67, lng: 108.04 },
  { name: 'Gia Lai', displayName: 'Gia Lai', lat: 13.98, lng: 108.00 }
]

const router = useRouter()
const customers = ref([])
const deliveryOrders = ref([])
const deliveryLocation = ref(null)
const selected = ref(null)
const keyword = ref('')
const visitFilter = ref('ALL')
const sourceFilter = ref('ALL') // 'ALL' | 'CUSTOM' | 'FACEBOOK' | 'LEAD'
const busy = ref(false)
const visitBusy = ref(false)
const locationBusy = ref(false)
const trackingLocation = ref(false)
const error = ref('')
const unlocatedCount = ref(0)
const isMobile = ref(false)

// Quản lý Modal Thêm / Sửa điểm tự thêm
const showCustomModal = ref(false)
const modalMode = ref('add') // 'add' | 'edit'
const modalBusy = ref(false)
const modalError = ref('')
const isPickingLocationOnMap = ref(false)
const formPoint = ref({
  id: '',
  name: '',
  phone: '',
  pointType: 'CUSTOMER',
  address: '',
  province: 'Phú Thọ',
  lat: 21.32,
  lng: 105.40,
  notes: '',
  interest: ''
})

// Trạng thái của Bottom Drawer trên Mobile: 'peek' (thu gọn) | 'expanded' (danh sách) | 'detail' (chi tiết khách)
const sheetState = ref('peek')

const mapElementDesktop = ref(null)
const mapElementMobile = ref(null)

let map = null
let markerLayer = null
let tempPickLayer = null
let tileLayer = null
let refreshTimer = null
let locationWatchId = null
let tileErrorCount = 0
let tileLoadCount = 0
let usingFallbackTiles = false
let origin = { lat: 21.31, lng: 105.60 }

const checkIsMobile = () => {
  if (typeof window !== 'undefined') {
    const wasMobile = isMobile.value
    isMobile.value = window.innerWidth <= 860
    if (wasMobile !== isMobile.value) {
      nextTick(() => {
        reInitMap()
      })
    }
  }
}

// Thống kê phân loại nguồn
const customPointsCount = computed(() => customers.value.filter(c => c.recordType === 'CUSTOM').length)
const fbPointsCount = computed(() => customers.value.filter(c => c.recordType === 'FACEBOOK').length)
const leadPointsCount = computed(() => customers.value.filter(c => c.recordType === 'LEAD').length)

// Danh sách sau khi lọc nguồn
const sourceFilteredCustomers = computed(() => {
  if (sourceFilter.value === 'ALL') return customers.value
  return customers.value.filter(c => c.recordType === sourceFilter.value)
})

const currentFilteredTotal = computed(() => sourceFilteredCustomers.value.length)
const currentFilteredVisited = computed(() => sourceFilteredCustomers.value.filter(c => c.visitedAt).length)
const currentFilteredUnvisited = computed(() => currentFilteredTotal.value - currentFilteredVisited.value)

const visibleCustomers = computed(() => {
  const term = keyword.value.trim().toLocaleLowerCase('vi')
  const reference = deliveryLocation.value || origin
  return sourceFilteredCustomers.value.filter(c => {
    const matchesTerm = !term || `${c.customerName} ${c.phone} ${c.address} ${c.province} ${c.interest} ${c.notes} ${c.sourceAdName}`.toLocaleLowerCase('vi').includes(term)
    const matchesVisit = visitFilter.value === 'ALL' || (visitFilter.value === 'VISITED' ? Boolean(c.visitedAt) : !c.visitedAt)
    return matchesTerm && matchesVisit
  }).sort((a, b) => distanceBetween(reference, a) - distanceBetween(reference, b))
})

const visitedCount = computed(() => customers.value.filter(customer => customer.visitedAt).length)
const unvisitedCount = computed(() => customers.value.length - visitedCount.value)
const nearestOrders = computed(() => deliveryLocation.value ? deliveryOrders.value.map(order => ({ ...order, distanceKm: distanceBetween(deliveryLocation.value, order) })).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 5) : [])

watch(visibleCustomers, renderMarkers)
watch([deliveryOrders, deliveryLocation], renderMarkers)

function pointTypeLabel(type) {
  switch (type) {
    case 'CUSTOMER': return 'Khách lắp đặt'
    case 'TESTING': return 'Điểm thử dàn'
    case 'PARTNER': return 'Đại lý / Showroom'
    case 'DELIVERY': return 'Điểm giao nhận'
    default: return 'Khác'
  }
}

function onProvinceChange() {
  const matched = VIETNAM_PROVINCES_LIST.find(p => p.displayName === formPoint.value.province)
  if (matched && (!formPoint.value.lat || modalMode.value === 'add')) {
    formPoint.value.lat = matched.lat
    formPoint.value.lng = matched.lng
  }
}

function openAddModal() {
  modalMode.value = 'add'
  modalError.value = ''
  formPoint.value = {
    id: '',
    name: '',
    phone: '',
    pointType: 'CUSTOMER',
    address: '',
    province: 'Phú Thọ',
    lat: 21.32,
    lng: 105.40,
    notes: '',
    interest: ''
  }
  showCustomModal.value = true
}

function openEditModal(point) {
  modalMode.value = 'edit'
  modalError.value = ''
  formPoint.value = {
    id: point.id,
    name: point.customerName || '',
    phone: point.phone || '',
    pointType: point.pointType || 'CUSTOMER',
    address: point.address || '',
    province: point.province || 'Phú Thọ',
    lat: Number(point.lat),
    lng: Number(point.lng),
    notes: point.notes || '',
    interest: point.interest || ''
  }
  showCustomModal.value = true
}

function closeCustomModal() {
  showCustomModal.value = false
  modalError.value = ''
  if (tempPickLayer) {
    tempPickLayer.clearLayers()
  }
}

function startPickingLocationOnMap() {
  showCustomModal.value = false
  isPickingLocationOnMap.value = true
  if (map) {
    map.once('click', handleMapClickPickLocation)
  }
}

function cancelPickingLocation() {
  isPickingLocationOnMap.value = false
  if (map) {
    map.off('click', handleMapClickPickLocation)
  }
  showCustomModal.value = true
}

function handleMapClickPickLocation(e) {
  if (!e.latlng) return
  formPoint.value.lat = Number(e.latlng.lat.toFixed(6))
  formPoint.value.lng = Number(e.latlng.lng.toFixed(6))
  isPickingLocationOnMap.value = false

  if (tempPickLayer) {
    tempPickLayer.clearLayers()
    L.circleMarker([e.latlng.lat, e.latlng.lng], {
      radius: 10,
      color: '#5b21b6',
      fillColor: '#8b5cf6',
      fillOpacity: 0.9,
      weight: 3
    }).addTo(tempPickLayer)
  }

  showCustomModal.value = true
}

async function saveCustomPoint() {
  modalBusy.value = true
  modalError.value = ''
  try {
    const payload = {
      name: formPoint.value.name,
      phone: formPoint.value.phone,
      pointType: formPoint.value.pointType,
      address: formPoint.value.address,
      province: formPoint.value.province,
      lat: formPoint.value.lat,
      lng: formPoint.value.lng,
      notes: formPoint.value.notes,
      interest: formPoint.value.notes
    }

    let saved = null
    if (modalMode.value === 'add') {
      const res = await apiRequest('/admin/customer-map/custom-points', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      saved = res.data
    } else {
      const res = await apiRequest(`/admin/customer-map/custom-points/${encodeURIComponent(formPoint.value.id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })
      saved = res.data
    }

    closeCustomModal()
    await loadData()

    if (saved) {
      const target = customers.value.find(c => c.id === saved.id && c.recordType === 'CUSTOM')
      if (target) {
        selectCustomer(target)
      }
    }
  } catch (err) {
    modalError.value = err.message || 'Lỗi lưu thông tin điểm.'
  } finally {
    modalBusy.value = false
  }
}

async function deleteCustomPoint(point) {
  if (!confirm(`Bạn có chắc muốn xóa điểm "${point.customerName}" này không? Điểm sẽ bị xóa vĩnh viễn khỏi bản đồ.`)) return
  modalBusy.value = true
  try {
    await apiRequest(`/admin/customer-map/custom-points/${encodeURIComponent(point.id)}`, {
      method: 'DELETE'
    })
    if (selected.value?.id === point.id) {
      selected.value = null
      if (isMobile.value) sheetState.value = 'peek'
    }
    await loadData()
  } catch (err) {
    alert(err.message || 'Lỗi khi xóa điểm.')
  } finally {
    modalBusy.value = false
  }
}

function selectCustomer(customer) {
  selected.value = customer
  if (isMobile.value) {
    sheetState.value = 'detail'
  }
  const marker = markerLayer?.getLayers().find(item =>
    (item.customerRecord?.id === customer.id && item.customerRecord?.recordType === customer.recordType) ||
    item.clusterCustomers?.some(entry => entry.id === customer.id && entry.recordType === customer.recordType)
  )
  if (marker) {
    map.setView([customer.lat, customer.lng], Math.max(map.getZoom(), 8), { animate: true })
    if (marker.clusterCustomers) {
      // Selecting a person from a cluster should show that person's card,
      // not reopen the list of everyone sharing the approximate map point.
      map.closePopup()
    } else if (!isMobile.value) {
      marker.openPopup()
    }
  }
}

function focusAndSelectCustomer(customer) {
  selectCustomer(customer)
}

function closeDetailSheet() {
  selected.value = null
  sheetState.value = 'peek'
}

function handleBackdropClick() {
  if (sheetState.value === 'detail') {
    closeDetailSheet()
  } else {
    sheetState.value = 'peek'
  }
}

function handleHandleClick() {
  if (sheetState.value === 'peek') {
    sheetState.value = 'expanded'
  } else if (sheetState.value === 'expanded') {
    sheetState.value = 'peek'
  } else if (sheetState.value === 'detail') {
    closeDetailSheet()
  }
}

function toggleSheetList() {
  if (sheetState.value === 'expanded') {
    sheetState.value = 'peek'
  } else {
    selected.value = null
    sheetState.value = 'expanded'
  }
}

function handleGpsFabClick() {
  if (deliveryLocation.value) {
    map?.setView([deliveryLocation.value.lat, deliveryLocation.value.lng], 12, { animate: true })
  } else {
    startLocationTracking()
  }
}

function fitAllMarkers() {
  if (!map) return
  const bounds = [[origin.lat, origin.lng]]
  for (const c of visibleCustomers.value) bounds.push([c.lat, c.lng])
  if (deliveryLocation.value) bounds.push([deliveryLocation.value.lat, deliveryLocation.value.lng])
  if (bounds.length > 1) map.fitBounds(bounds, { padding: [24, 24] })
}

async function loadData() {
  busy.value = true
  error.value = ''
  try {
    const response = await apiRequest('/admin/customer-map')
    customers.value = response.data || []
    deliveryOrders.value = response.deliveryOrders || []
    try {
      deliveryLocation.value = JSON.parse(localStorage.getItem('deliveryCurrentLocation') || 'null')
    } catch {
      deliveryLocation.value = null
    }
    unlocatedCount.value = Number(response.unlocatedCount || 0)
    if (response.origin?.lat && response.origin?.lng) {
      origin = { lat: Number(response.origin.lat), lng: Number(response.origin.lng) }
    }
    await nextTick()
    initMap()
    renderMarkers()
    if (map) setTimeout(() => map.invalidateSize(), 150)
  } catch (e) {
    error.value = e.message || 'Không tải được vị trí khách hàng.'
  } finally {
    busy.value = false
  }
}

function focusOrder(order) {
  if (!map) return
  const marker = markerLayer?.getLayers().find(item => item.orderRecord?.id === order.id)
  if (marker) {
    map.setView([order.lat, order.lng], Math.max(map.getZoom(), 8))
    marker.openPopup()
  }
}

function stopLocationTracking() {
  if (locationWatchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(locationWatchId)
  }
  locationWatchId = null
  trackingLocation.value = false
}

function startLocationTracking() {
  if (!navigator.geolocation || locationWatchId !== null) return
  error.value = ''
  locationBusy.value = true
  locationWatchId = navigator.geolocation.watchPosition(
    position => {
      deliveryLocation.value = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: Math.round(position.coords.accuracy || 0),
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem('deliveryCurrentLocation', JSON.stringify(deliveryLocation.value))
      trackingLocation.value = true
      locationBusy.value = false
    },
    () => {
      stopLocationTracking()
      locationBusy.value = false
      error.value = 'Không lấy được GPS. Hãy cấp quyền định vị.'
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
  )
  trackingLocation.value = true
}

function toggleLocationTracking() {
  if (trackingLocation.value) stopLocationTracking()
  else startLocationTracking()
}

async function toggleVisited(customer) {
  if (!customer || visitBusy.value) return
  visitBusy.value = true
  try {
    const linkedRecords = [
      customer.facebookCareId ? { recordType: 'FACEBOOK', id: customer.facebookCareId } : null,
      customer.leadId ? { recordType: 'LEAD', id: customer.leadId } : null
    ].filter(Boolean)
    await apiRequest(`/admin/customer-map/${customer.recordType}/${encodeURIComponent(customer.id)}/visit`, {
      method: 'PATCH',
      body: JSON.stringify({ visited: !customer.visitedAt, linkedRecords })
    })
    await loadData()
    selected.value = customers.value.find(item => item.id === customer.id && item.recordType === customer.recordType) || null
  } catch (e) {
    error.value = e.message || 'Không lưu được trạng thái ghé thăm.'
  } finally {
    visitBusy.value = false
  }
}

function openCrm(customer) {
  if (customer.recordType === 'FACEBOOK' || customer.facebookCareId) {
    router.push({ path: '/admin/facebook-care', query: { customerId: customer.facebookCareId || customer.id } })
  } else {
    router.push({ path: '/admin/leads', query: { customerId: customer.id, phone: customer.phone } })
  }
}

onMounted(() => {
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)
  loadData()
  startLocationTracking()
  refreshTimer = setInterval(() => {
    if (document.visibilityState === 'visible' && !busy.value) loadData()
  }, 30000)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkIsMobile)
  }
  if (refreshTimer) clearInterval(refreshTimer)
  stopLocationTracking()
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
/* ========================================================
   CSS CHO DESKTOP (GIỮ NGUYÊN BỐ CỤC CHUẨN)
   ======================================================== */
.customer-map-page {
  --map-ink: #172033;
  --map-muted: #64748b;
  --xanh-primary: #00b1a9;
  --xanh-dark: #008080;
}
.adm-page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.head-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.adm-page-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.02em;
}
.map-stats-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.stat-pill {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.stat-pill.total {
  background: #f1f5f9;
  color: #334155;
  border-color: #cbd5e1;
}
.stat-pill.unvisited {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}
.stat-pill.visited {
  background: #f0fdf4;
  color: #15803d;
  border-color: #bbf7d0;
}
.stat-pill.custom {
  background: #f5f3ff;
  color: #7c3aed;
  border-color: #ddd6fe;
}
.stat-pill.unlocated {
  background: #fffbeb;
  color: #b45309;
  border-color: #fde68a;
}
.adm-page-sub {
  font-size: 0.78rem;
  color: #64748b;
  margin: 0;
}
.head-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.adm-btn-add-point {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid #7c3aed;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
  transition: all 0.2s ease;
}
.adm-btn-add-point:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(124, 58, 237, 0.35);
  background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
}
.adm-gps-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.adm-gps-toggle-btn:hover {
  border-color: #00b1a9;
  color: #008080;
}
.adm-gps-toggle-btn.active {
  background: #e6fffa;
  border-color: #00b1a9;
  color: #008080;
}
.gps-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}
.adm-gps-toggle-btn.active .gps-dot {
  background: #00b1a9;
  box-shadow: 0 0 0 3px rgba(0, 177, 169, 0.25);
}
.adm-btn-refresh {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
}

/* Delivery Strip (Chỉ hiện khi có đơn thực tế) */
.delivery-strip-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  margin-bottom: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}
.delivery-strip-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #0f172a;
  white-space: nowrap;
}
.delivery-strip-list {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  flex: 1;
}
.delivery-strip-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
  white-space: nowrap;
  font-size: 0.76rem;
  transition: all 0.15s ease;
}
.delivery-strip-item:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}
.strip-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffedd5;
  color: #c2410c;
  font-size: 0.7rem;
  font-weight: 700;
  display: grid;
  place-items: center;
}
.strip-badge {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: #dbeafe;
  color: #1e40af;
  font-weight: 600;
}

/* Map Workspace 2 Cột Desktop */
.map-workspace {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  height: calc(100vh - 170px);
  min-height: 600px;
  max-height: 880px;
  padding: 0;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
}
.map-customer-list {
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}
.map-sidebar-filter {
  padding: 12px 14px 10px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 6px 12px;
  transition: all 0.2s;
}
.search-input-wrap:focus-within {
  background: #ffffff;
  border-color: #00b1a9;
  box-shadow: 0 0 0 3px rgba(0, 177, 169, 0.15);
}
.search-input-wrap input {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  outline: none;
  font-size: 0.82rem;
  width: 100%;
  color: #0f172a;
}
.search-ico {
  font-size: 0.85rem;
  opacity: 0.6;
}
.clear-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.75rem;
  color: #94a3b8;
}
.filter-chip-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f8fafc;
  padding: 3px;
  border-radius: 8px;
}
.filter-tab {
  flex: 1;
  padding: 6px 8px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  text-align: center;
  white-space: nowrap;
  transition: all 0.15s ease;
}
.filter-tab.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}
.filter-tab.warn.active {
  color: #dc2626;
}
.filter-tab.done.active {
  color: #16a34a;
}

/* Thẻ Chi Tiết Khách Được Chọn */
.map-selected-card {
  padding: 14px;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.selected-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.selected-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #00b1a9;
  color: #ffffff;
  font-weight: 800;
  font-size: 0.9rem;
  display: grid;
  place-items: center;
  flex: none;
}
.selected-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.selected-info strong {
  font-size: 0.92rem;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.selected-status {
  font-size: 0.68rem;
  font-weight: 700;
  color: #dc2626;
}
.selected-status.visited {
  color: #16a34a;
}
.selected-close {
  border: none;
  background: #e2e8f0;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: grid;
  place-items: center;
  color: #64748b;
  font-size: 0.75rem;
}
.selected-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.76rem;
  color: #334155;
  background: #ffffff;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.selected-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.row-lbl {
  color: #64748b;
  width: 75px;
  flex: none;
}
.row-phone {
  color: #008080;
  font-weight: 700;
  text-decoration: none;
}
.row-zalo {
  font-size: 0.68rem;
  padding: 1px 6px;
  border-radius: 4px;
  background: #0068ff;
  color: #ffffff;
  text-decoration: none;
  font-weight: 700;
  margin-left: 6px;
}
.row-km {
  font-weight: 800;
  color: #00b1a9;
}
.selected-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.selected-actions .adm-btn {
  padding: 7px 10px;
  font-size: 0.72rem;
  border-radius: 6px;
  flex: 1;
  text-align: center;
  justify-content: center;
}
.adm-btn-gmaps {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

/* Danh Sách Khách Hàng Cuộn */
.map-customer-scroll {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
}
.map-customer-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}
.map-customer-item:hover {
  background: #f8fafc;
}
.map-customer-item.active {
  background: #e6fffa;
  border-left: 4px solid #00b1a9;
}
.customer-pin-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
  flex: none;
}
.customer-pin-dot.visited {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}
.customer-item-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.item-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.item-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-visited-badge {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
  flex: none;
}
.item-sub-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 0.72rem;
}
.item-province {
  color: #475569;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-km {
  font-weight: 700;
  color: #00b1a9;
  flex: none;
}
.item-detail {
  font-size: 0.68rem;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.map-empty-state {
  padding: 30px 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.8rem;
}
.map-canvas {
  height: 100%;
  width: 100%;
  min-width: 0;
  z-index: 0;
}
.gps-indicator.active {
  background: #16a34a;
  box-shadow: 0 0 0 3px #dcfce7;
}
.map-empty {
  padding: 20px;
  color: #94a3b8;
  font-size: 0.8rem;
  text-align: center;
}
.map-error {
  color: #b91c1c;
  font-size: 0.8rem;
  margin-top: 8px;
}

/* ========================================================
   CSS CHO MOBILE APP MODE (CHUẨN GIAO DIỆN XANH SM)
   Bản đồ tràn viền 100%, tìm kiếm nổi, FAB floating, Drawer 3 nấc
   ======================================================== */
@media (max-width: 860px) {
  .customer-map-page.mobile-app-mode {
    /* Đẩy tràn viền khỏi padding mặc định của admin-viewport */
    margin: -14px;
    height: calc(100dvh - 56px);
    width: calc(100% + 28px);
    overflow: hidden;
    position: relative;
    background: #e2e8f0;
  }

  .xanhsm-app-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  /* Bản đồ toàn màn hình làm nền */
  .xanhsm-map-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  /* Khối tìm kiếm nổi trên đỉnh bản đồ (Top Floating Bar) */
  .xanhsm-top-bar {
    position: absolute;
    top: 12px;
    left: 14px;
    right: 14px;
    z-index: 400;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none; /* Chỉ các phần tử con nhận touch */
  }

  .xanhsm-search-pill {
    pointer-events: auto;
    display: flex;
    align-items: center;
    background: #ffffff;
    border-radius: 999px;
    padding: 6px 14px;
    box-shadow: 0 4px 18px rgba(15, 23, 42, 0.16);
    border: 1px solid rgba(226, 232, 240, 0.8);
    height: 46px;
  }
  .search-icon {
    font-size: 1rem;
    margin-right: 8px;
    color: #64748b;
  }
  .xanhsm-input {
    flex: 1;
    border: 0;
    outline: 0;
    font-size: 0.85rem;
    font-family: inherit;
    color: #0f172a;
    background: transparent;
  }
  .xanhsm-input::placeholder {
    color: #94a3b8;
  }
  .search-clear {
    border: 0;
    background: #f1f5f9;
    color: #64748b;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    font-size: 0.7rem;
    cursor: pointer;
  }

  /* Chips lọc nổi phong cách Xanh SM */
  .xanhsm-filter-chips {
    pointer-events: auto;
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
  }
  .xanhsm-filter-chips::-webkit-scrollbar {
    display: none;
  }
  .xanhsm-chip {
    flex: none;
    border: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    color: #334155;
    font-size: 0.74rem;
    font-weight: 700;
    padding: 7px 12px;
    border-radius: 999px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .xanhsm-chip.active {
    background: #00b1a9;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 177, 169, 0.35);
  }
  .xanhsm-chip.warn.active {
    background: #ef4444;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
  }
  .xanhsm-chip.done.active {
    background: #16a34a;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35);
  }

  /* Nút bấm nổi FAB góc phải màn hình */
  .xanhsm-fab-group {
    position: absolute;
    right: 14px;
    bottom: 120px; /* Nằm ngay phía trên thanh Bottom Sheet */
    z-index: 400;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: bottom 0.25s cubic-bezier(0.2, 0.8, 0.4, 1);
  }
  .xanhsm-fab-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 0;
    background: #ffffff;
    color: #0f172a;
    font-size: 1.15rem;
    display: grid;
    place-items: center;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.18);
    cursor: pointer;
    position: relative;
    -webkit-tap-highlight-color: transparent;
  }
  .xanhsm-fab-btn:active {
    transform: scale(0.92);
  }
  .xanhsm-fab-btn.my-location .gps-dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #94a3b8;
  }
  .xanhsm-fab-btn.my-location.active .gps-dot {
    background: #00b1a9;
    box-shadow: 0 0 0 3px rgba(0, 177, 169, 0.3);
  }
  .xanhsm-fab-btn.list-toggle.active {
    background: #00b1a9;
    color: #ffffff;
  }

  /* Backdrop mờ khi mở full danh sách hoặc chi tiết */
  .xanhsm-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.35);
    backdrop-filter: blur(2px);
    z-index: 500;
  }

  /* ========================================================
     BOTTOM DRAWER PHONG CÁCH XANH SM
     ======================================================== */
  .xanhsm-bottom-drawer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: #ffffff;
    border-radius: 24px 24px 0 0;
    box-shadow: 0 -8px 30px rgba(15, 23, 42, 0.2);
    z-index: 600;
    transition: transform 0.26s cubic-bezier(0.2, 0.8, 0.4, 1), height 0.26s cubic-bezier(0.2, 0.8, 0.4, 1);
    display: flex;
    flex-direction: column;
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }

  .xanhsm-drag-handle-wrap {
    padding: 10px 0 6px;
    cursor: pointer;
    display: flex;
    justify-content: center;
  }
  .xanhsm-drag-bar {
    width: 44px;
    height: 5px;
    background: #cbd5e1;
    border-radius: 999px;
  }

  /* TRẠNG THÁI 1: PEEK (THU GỌN - CHỈ CAO ~85PX) */
  .xanhsm-bottom-drawer.state-peek {
    height: 88px;
  }
  .xanhsm-peek-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 18px 10px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .peek-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .peek-badge-car {
    font-size: 0.68rem;
    font-weight: 700;
    color: #008080;
    background: #e6fffa;
    padding: 2px 8px;
    border-radius: 999px;
    align-self: flex-start;
  }
  .peek-title {
    font-size: 0.9rem;
    font-weight: 800;
    color: #0f172a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .peek-sub {
    font-size: 0.72rem;
    color: #64748b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .peek-open-btn {
    border: 0;
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
    font-size: 0.78rem;
    padding: 8px 12px;
    border-radius: 999px;
    white-space: nowrap;
    cursor: pointer;
  }

  /* TRẠNG THÁI 2: EXPANDED LIST (MỞ RỘNG DANH SÁCH KHÁCH) */
  .xanhsm-bottom-drawer.state-expanded {
    height: 72vh;
  }
  .xanhsm-list-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    padding: 0 16px 10px;
  }
  .drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 10px;
    border-bottom: 1px solid #f1f5f9;
  }
  .drawer-title {
    font-size: 0.98rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
  }
  .drawer-sub {
    font-size: 0.72rem;
    color: #64748b;
  }
  .drawer-close-btn {
    border: 0;
    background: #f1f5f9;
    color: #64748b;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 0.88rem;
    cursor: pointer;
  }

  .xanhsm-cards-scroll {
    overflow-y: auto;
    flex: 1;
    padding: 10px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    -webkit-overflow-scrolling: touch;
  }
  .xanhsm-customer-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #ffffff;
    cursor: pointer;
    transition: all 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .xanhsm-customer-card:active {
    background: #f8fafc;
    border-color: #00b1a9;
  }
  .card-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
  }
  .card-num {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #f1f5f9;
    color: #475569;
    font-weight: 800;
    font-size: 0.72rem;
    flex: none;
  }
  .card-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .card-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .card-name-row strong {
    font-size: 0.88rem;
    color: #0f172a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .card-status-badge {
    font-size: 0.62rem;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 999px;
    background: #fee2e2;
    color: #b91c1c;
    white-space: nowrap;
  }
  .card-status-badge.visited {
    background: #dcfce7;
    color: #15803d;
  }
  .card-address {
    font-size: 0.74rem;
    color: #64748b;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .card-interest {
    font-size: 0.7rem;
    color: #008080;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .card-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: none;
    margin-left: 8px;
  }
  .card-km {
    font-size: 0.78rem;
    font-weight: 800;
    color: #00b1a9;
    background: #e6fffa;
    padding: 4px 8px;
    border-radius: 8px;
  }
  .card-call-btn {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #00b1a9;
    color: white;
    text-decoration: none;
    font-size: 0.85rem;
    box-shadow: 0 2px 6px rgba(0, 177, 169, 0.35);
  }

  /* TRẠNG THÁI 3: DETAIL (CHI TIẾT KHÁCH HÀNG KIỂU CUỐC XE XANH SM) */
  .xanhsm-bottom-drawer.state-detail {
    max-height: 85vh;
  }
  .xanhsm-detail-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 18px 12px;
    overflow-y: auto;
  }
  .detail-header {
    border-bottom: 0;
    padding-bottom: 0;
  }
  .detail-name-group {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .detail-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .detail-customer-name {
    font-size: 1.15rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
  }
  .detail-location {
    font-size: 0.8rem;
    color: #64748b;
    margin: 0;
  }
  .detail-dist {
    color: #00b1a9;
    font-weight: 800;
  }

  .detail-product-card {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 9px 12px;
  }
  .detail-thumb {
    width: 44px;
    height: 44px;
    object-fit: cover;
    border-radius: 8px;
    flex: none;
  }
  .detail-product-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .detail-product-info small {
    font-size: 0.68rem;
    color: #64748b;
  }
  .detail-product-info strong {
    font-size: 0.82rem;
    color: #0f172a;
  }

  /* HÀNG NÚT BẤM TO CHUẨN XANH SM */
  .xanhsm-action-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 2px;
  }
  .xanhsm-action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 14px;
    border-radius: 14px;
    text-decoration: none;
    min-height: 52px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.1s ease;
  }
  .xanhsm-action-btn:active {
    transform: scale(0.98);
  }
  .btn-call {
    background: linear-gradient(135deg, #00b1a9 0%, #008080 100%);
    color: #ffffff;
  }
  .btn-direct {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: #ffffff;
  }
  .action-icon {
    font-size: 1.35rem;
    flex: none;
  }
  .action-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .action-text small {
    font-size: 0.62rem;
    font-weight: 700;
    opacity: 0.88;
    letter-spacing: 0.5px;
  }
  .action-text strong {
    font-size: 0.84rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Nút phụ: Đã ghé thăm & CRM */
  .xanhsm-sub-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .xanhsm-sub-btn {
    padding: 10px;
    border-radius: 10px;
    font-size: 0.78rem;
    font-weight: 700;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    color: #334155;
    cursor: pointer;
    min-height: 42px;
  }
  .xanhsm-sub-btn.visit-btn {
    background: #f0fdf4;
    border-color: #86efac;
    color: #15803d;
  }
  .xanhsm-sub-btn.crm-btn {
    background: #fffbeb;
    border-color: #fde68a;
    color: #b45309;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
}

/* ========================================================
   LEAFLET POPUP VÀ CLUSTER CHUNG
   ======================================================== */
:global(.customer-popup) {
  display: grid;
  gap: 5px;
  min-width: 170px;
  color: #172033;
  font: 12px/1.4 Arial, sans-serif;
}
:global(.customer-popup img) {
  width: 100%;
  height: 110px;
  object-fit: cover;
  border-radius: 6px;
}
:global(.customer-popup strong) {
  font-size: 13px;
}
:global(.customer-popup a) {
  color: #008080;
  font-weight: 700;
  text-decoration: none;
}
:global(.cluster-customer-list) {
  display: grid;
  gap: 5px;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px;
}
:global(.cluster-btn-row) {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #ccfbf1;
  border-radius: 6px;
  background: #f0fdfa;
  padding: 8px 10px;
  text-align: left;
  color: #0f766e;
  cursor: pointer;
  font-size: 12px;
  width: 100%;
}
:global(.c-dot) {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  flex: none;
}
:global(.c-dot.visited) {
  background: #22c55e;
}
:global(.customer-cluster-pin) {
  display: grid;
  place-items: center;
  border: 0 !important;
  background: transparent !important;
}
:global(.customer-cluster-pin span) {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 2px solid #008080;
  border-radius: 50%;
  background: #00b1a9;
  color: white;
  font-weight: 800;
  box-shadow: 0 2px 8px rgba(0, 177, 169, 0.4);
  font-size: 13px;
}
:global(.customer-cluster-pin span.visited) {
  background: #22c55e;
  border-color: #166534;
}
:global(.customer-cluster-pin span.mixed) {
  background: #f59e0b;
  border-color: #b45309;
}

/* ========================================================
   CSS NGUỒN ĐIỂM (SOURCE FILTER & CUSTOM POINTS)
   ======================================================== */
.source-filter-tabs {
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 10px;
  margin-top: 8px;
  overflow-x: auto;
}
.source-tab {
  flex: 1;
  min-width: max-content;
  padding: 5px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #475569;
  font-size: 0.73rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.source-tab:hover {
  color: #0f172a;
}
.source-tab.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.source-tab.custom.active {
  background: #f5f3ff;
  color: #7c3aed;
  font-weight: 700;
}
.source-tab.fb.active {
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
}
.source-tab.lead.active {
  background: #fffbeb;
  color: #b45309;
  font-weight: 700;
}

/* Card chi tiết & Avatar Custom */
.selected-avatar.custom {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  color: #ffffff;
  font-size: 1.1rem;
}
.selected-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.badge-source-custom {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 6px;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  color: #7c3aed;
  font-size: 0.68rem;
  font-weight: 700;
}
.adm-btn-edit-point {
  background: #f5f3ff;
  border: 1px solid #c4b5fd;
  color: #6d28d9;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}
.adm-btn-edit-point:hover {
  background: #ede9fe;
}
.adm-btn-delete-point {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}
.adm-btn-delete-point:hover {
  background: #fee2e2;
}

/* Danh sách cuộn Desktop */
.customer-pin-dot.custom {
  background: #8b5cf6;
  border-color: #6d28d9;
}
.item-custom-tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  background: #f5f3ff;
  color: #7c3aed;
  font-size: 0.65rem;
  font-weight: 700;
  margin-left: 4px;
}

/* CSS Mobile App Xanh SM */
.xanhsm-add-point-btn {
  margin-left: auto;
  padding: 6px 12px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  color: #ffffff;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
}
.xanhsm-source-chips {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 2px 2px 4px;
  scrollbar-width: none;
}
.xanhsm-source-chips::-webkit-scrollbar {
  display: none;
}
.xanhsm-src-chip {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}
.xanhsm-src-chip.active {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}
.xanhsm-src-chip.custom.active {
  background: #7c3aed;
  border-color: #7c3aed;
  color: #ffffff;
}
.xanhsm-src-chip.fb.active {
  background: #1d4ed8;
  border-color: #1d4ed8;
  color: #ffffff;
}
.xanhsm-src-chip.lead.active {
  background: #d97706;
  border-color: #d97706;
  color: #ffffff;
}

.add-custom-fab {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9) !important;
  color: #ffffff !important;
  font-size: 18px !important;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4) !important;
}

.card-num.custom {
  background: #f5f3ff !important;
  color: #7c3aed !important;
  border: 1px solid #ddd6fe !important;
  font-size: 13px !important;
}
.mobile-custom-tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 999px;
  background: #f5f3ff;
  color: #7c3aed;
  font-size: 0.68rem;
  font-weight: 700;
}
.xanhsm-sub-btn.edit-btn {
  background: #f5f3ff;
  border-color: #c4b5fd;
  color: #6d28d9;
}
.xanhsm-sub-btn.delete-btn {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

/* ========================================================
   MAP PICK BANNER (CHẾ ĐỘ CHỌN TỌA ĐỘ TRÊN BẢN ĐỒ)
   ======================================================== */
.map-pick-banner {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: 90%;
  max-width: 600px;
}
.pick-banner-content {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #1e1b4b;
  color: #ffffff;
  padding: 10px 16px;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  border: 1px solid #4338ca;
  animation: pulse-glow 2s infinite ease-in-out;
}
.pick-pulse-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #a855f7;
  box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.4);
  flex: none;
}
.pick-text {
  font-size: 0.8rem;
  line-height: 1.35;
  flex: 1;
}
.pick-cancel-btn {
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.pick-cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 8px 24px rgba(67, 56, 202, 0.35); }
  50% { box-shadow: 0 8px 28px rgba(168, 85, 247, 0.55); }
}

/* ========================================================
   MODAL THÊM / CHỈNH SỬA ĐIỂM
   ======================================================== */
.custom-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.custom-modal-card {
  background: #ffffff;
  border-radius: 18px;
  width: 100%;
  max-width: 540px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.35);
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
.modal-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #faf5ff;
  border-bottom: 1px solid #f3e8ff;
}
.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}
.modal-pin-icon {
  font-size: 1.5rem;
  background: #ffffff;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(124, 58, 237, 0.15);
  border: 1px solid #e9d5ff;
}
.modal-title-wrap h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #4c1d95;
}
.modal-title-wrap small {
  display: block;
  font-size: 0.72rem;
  color: #7c3aed;
  margin-top: 2px;
}
.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
}
.modal-close-btn:hover {
  color: #0f172a;
}
.modal-card-body {
  padding: 18px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-row label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
}
.form-row label .req {
  color: #ef4444;
}
.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.form-input,
.form-textarea {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.82rem;
  color: #0f172a;
  background: #ffffff;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}
.form-input:focus,
.form-textarea:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
}
.coords-group {
  background: #f8fafc;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}
.coords-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.btn-pick-map {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #c4b5fd;
  background: #ffffff;
  color: #6d28d9;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-pick-map:hover {
  background: #f5f3ff;
  border-color: #8b5cf6;
}
.input-with-label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.input-with-label .sub-lbl {
  font-size: 0.74rem;
  font-weight: 700;
  color: #64748b;
  width: 28px;
}
.modal-form-error {
  padding: 8px 12px;
  border-radius: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 0.76rem;
}
.modal-card-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 6px;
}
.btn-modal-cancel {
  padding: 9px 16px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-modal-submit {
  padding: 9px 20px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
  transition: all 0.2s ease;
}
.btn-modal-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
}
.btn-modal-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ========================================================
   LEAFLET CUSTOM PIN GLOBAL
   ======================================================== */
:global(.customer-custom-pin-wrap) {
  display: grid;
  place-items: center;
  border: none !important;
  background: transparent !important;
}
:global(.custom-pin-inner) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  border: 2px solid #ffffff;
  box-shadow: 0 4px 10px rgba(109, 40, 217, 0.45);
  cursor: pointer;
  transition: transform 0.15s ease;
}
:global(.custom-pin-inner:hover) {
  transform: rotate(-45deg) scale(1.15);
}
:global(.custom-pin-inner.visited) {
  background: linear-gradient(135deg, #10b981, #047857);
  box-shadow: 0 4px 10px rgba(4, 120, 87, 0.45);
}
:global(.custom-pin-icon) {
  transform: rotate(45deg);
  font-size: 14px;
}
:global(.customer-popup.custom-pop) {
  border-left: 3px solid #7c3aed;
  padding-left: 6px;
}
:global(.custom-badge-pop) {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f5f3ff;
  color: #7c3aed;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 2px;
}
</style>
