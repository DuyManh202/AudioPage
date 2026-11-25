<template>
  <div class="adm-page">
    <!-- Đầu trang Nhật Ký Thao Tác -->
    <div class="adm-page-head">
      <div>
        <h1 class="adm-page-title">Nhật Ký Lịch Sử Thao Tác &amp; Pháp Y Hệ Thống</h1>
        <p class="adm-page-sub">
          Theo dõi chuyên sâu mọi thao tác: so sánh Trước vs Sau (Visual Diff), thiết bị người dùng, địa chỉ IP và giám sát an ninh mạng WAF theo thời gian thực.
        </p>
      </div>
      <div class="adm-head-actions">
        <button type="button" class="adm-btn adm-btn-shield" @click="openWafModal" title="Xem danh sách IP bị Tường lửa WAF giam giữ">
          <AdminIcon name="shield" :size="15" />
          <span>Tường Lửa WAF ({{ blockedIps.length }})</span>
        </button>
        <button type="button" class="adm-btn adm-btn-ghost" :disabled="loading" @click="fetchLogs">
          <AdminIcon name="sync" :size="15" :class="{ spinning: loading }" />
          <span>{{ loading ? 'Đang Tải...' : 'Làm Mới' }}</span>
        </button>
        <button type="button" class="adm-btn adm-btn-gold" :disabled="!logs.length" @click="exportLogsCsv">
          <AdminIcon name="download" :size="15" />
          <span>Xuất Nhật Ký (CSV)</span>
        </button>
      </div>
    </div>

    <!-- 4 Thẻ Thống Kê Nhanh -->
    <div class="adm-kpi-grid">
      <div class="adm-kpi-card">
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Tổng Sự Kiện Đã Lưu</span>
          <span class="adm-kpi-value">{{ totalCount }} thao tác</span>
          <span class="adm-kpi-meta">Toàn bộ nhật ký hoạt động hệ thống</span>
        </div>
        <div class="adm-kpi-icon tone-gold">
          <AdminIcon name="history" :size="20" />
        </div>
      </div>

      <div class="adm-kpi-card">
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Hoạt Động Hôm Nay</span>
          <span class="adm-kpi-value text-blue">{{ todayCount }} thao tác</span>
          <span class="adm-kpi-meta">Sự kiện phát sinh trong ngày</span>
        </div>
        <div class="adm-kpi-icon tone-blue">
          <AdminIcon name="calendar" :size="20" />
        </div>
      </div>

      <div class="adm-kpi-card">
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Bảo Mật &amp; Phân Quyền</span>
          <span class="adm-kpi-value text-amber">{{ securityCount }} sự kiện</span>
          <span class="adm-kpi-meta">Đăng nhập, cấp quyền, WAF chặn</span>
        </div>
        <div class="adm-kpi-icon tone-gold">
          <AdminIcon name="shield" :size="20" />
        </div>
      </div>

      <div class="adm-kpi-card">
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Thao Tác Xóa / Hủy</span>
          <span class="adm-kpi-value text-danger">{{ deleteCount }} lần</span>
          <span class="adm-kpi-meta">Xóa đơn hàng, xóa lead, hủy tài khoản</span>
        </div>
        <div class="adm-kpi-icon tone-red">
          <AdminIcon name="trash" :size="20" />
        </div>
      </div>
    </div>

    <!-- Khối Bảng Nhật Ký & Bộ Lọc Đa Chiều Chuyên Sâu -->
    <div class="adm-card">
      <div class="adm-toolbar deep-toolbar">
        <!-- Hàng 1: Tìm kiếm & Lọc chính -->
        <div class="adm-toolbar-row">
          <div class="adm-search-box">
            <AdminIcon name="search" :size="16" class="search-ico" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Tìm theo nội dung, tài khoản, ID đối tượng, giá trị cũ/mới hoặc IP..."
              @keyup.enter="handleFilterChange"
            />
            <button v-if="searchQuery" class="clear-search-btn" @click="clearSearch" title="Xóa tìm kiếm">✕</button>
          </div>

          <div class="filter-selects">
            <!-- Lọc theo nhân viên thực hiện -->
            <select v-model="adminUserFilter" class="adm-select-sm" @change="handleFilterChange" title="Lọc theo nhân sự thao tác">
              <option value="ALL">👤 Tất cả nhân sự ({{ adminUsersList.length }})</option>
              <option v-for="u in adminUsersList" :key="u.admin_username" :value="u.admin_username">
                {{ u.admin_name || u.admin_username }} (@{{ u.admin_username }})
              </option>
            </select>

            <!-- Lọc theo loại hành động -->
            <select v-model="actionFilter" class="adm-select-sm" @change="handleFilterChange">
              <option value="ALL">⚡ Tất cả hành động</option>
              <option value="SECURITY">🛡️ Bảo Mật &amp; Tường Lửa (WAF)</option>
              <option value="AUTH">🔑 Xác thực &amp; Đăng nhập</option>
              <option value="PERMISSIONS">👑 Phân quyền nhân sự</option>
              <option value="CREATE">➕ Tạo mới dữ liệu</option>
              <option value="UPDATE">✏️ Cập nhật &amp; Sửa đổi</option>
              <option value="DELETE">🗑️ Xóa &amp; Hủy dữ liệu</option>
            </select>

            <!-- Lọc theo nhóm đối tượng -->
            <select v-model="targetFilter" class="adm-select-sm" @change="handleFilterChange">
              <option value="ALL">📦 Tất cả phân hệ</option>
              <option value="lead">Khách tư vấn (Leads)</option>
              <option value="order">Đơn hàng (Orders)</option>
              <option value="product">Sản phẩm &amp; Giá</option>
              <option value="combo">Gói dàn âm thanh</option>
              <option value="tradein">Thu cũ đổi mới</option>
              <option value="festive">Hiệu ứng lễ hội</option>
              <option value="admin">Tài khoản nhân sự</option>
              <option value="waf_threat">Cảnh báo WAF</option>
              <option value="auth">Đăng nhập OTP</option>
            </select>
          </div>
        </div>

        <!-- Hàng 2: Lọc khoảng thời gian & bộ lọc nhanh đối tượng -->
        <div class="adm-toolbar-subrow">
          <div class="date-range-filter">
            <span class="filter-label">Khoảng ngày:</span>
            <div class="date-input-wrap">
              <span class="date-label">Từ</span>
              <input type="date" v-model="fromDate" class="adm-date-input" @change="handleFilterChange" />
            </div>
            <div class="date-input-wrap">
              <span class="date-label">Đến</span>
              <input type="date" v-model="toDate" class="adm-date-input" @change="handleFilterChange" />
            </div>
            <button v-if="fromDate || toDate" type="button" class="btn-clear-date" @click="clearDates" title="Xóa lọc ngày">
              ✕ Xóa ngày
            </button>
          </div>

          <!-- Huy hiệu khi đang lọc theo 1 Entity ID cụ thể -->
          <div v-if="targetIdFilter" class="active-target-badge">
            <span>Đang soi lịch sử ID: <strong>{{ targetIdFilter }}</strong></span>
            <button type="button" @click="clearTargetIdFilter" title="Bỏ lọc theo ID này">✕</button>
          </div>

          <!-- Nút reset toàn bộ bộ lọc nếu có lọc -->
          <button v-if="isFiltered" type="button" class="btn-reset-filters" @click="resetAllFilters">
            <AdminIcon name="sync" :size="13" />
            <span>Đặt lại toàn bộ lọc</span>
          </button>
        </div>
      </div>

      <!-- Bảng danh sách log -->
      <div class="adm-table-wrap">
        <table class="adm-table deep-audit-table">
          <thead>
            <tr>
              <th style="width: 40px;"></th>
              <th style="width: 155px;">Thời Gian</th>
              <th style="width: 195px;">Người Thực Hiện</th>
              <th style="width: 145px;">Hành Động</th>
              <th style="width: 135px;">Phân Hệ</th>
              <th>Nội Dung Thao Tác &amp; Biến Động Dữ Liệu</th>
              <th style="width: 180px;">Thiết Bị &amp; IP</th>
              <th style="width: 80px;" class="th-right">Chi Tiết</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && !logs.length">
              <td colspan="8" class="adm-empty">Đang tải lịch sử thao tác chuyên sâu từ máy chủ...</td>
            </tr>
            <tr v-else-if="!filteredLogs.length">
              <td colspan="8" class="adm-empty">Không tìm thấy bản ghi lịch sử nào phù hợp theo tiêu chí lọc.</td>
            </tr>
            <template v-for="log in filteredLogs" :key="log.id">
              <tr
                :class="{
                  'row-security-event': log.action_type === 'SECURITY' || log.action_type === 'PERMISSIONS' || log.action_type === 'DELETE',
                  'row-expanded': expandedLogIds.has(log.id)
                }"
              >
                <!-- Nút toggle mở rộng dòng -->
                <td class="td-expand-toggle">
                  <button
                    type="button"
                    class="btn-expand-row"
                    :class="{ active: expandedLogIds.has(log.id) }"
                    @click="toggleRowExpand(log.id)"
                    title="Mở rộng xem chi tiết so sánh trước/sau"
                  >
                    ▶
                  </button>
                </td>

                <!-- Thời gian -->
                <td>
                  <div class="log-time-cell">
                    <strong class="time-clock">{{ formatTime(log.created_at) }}</strong>
                    <span class="time-date">{{ formatDate(log.created_at) }}</span>
                  </div>
                </td>

                <!-- Người thực hiện -->
                <td>
                  <div class="log-user-cell">
                    <div class="log-user-avatar" :class="getAvatarClass(log.admin_role)">
                      {{ getInitials(log.admin_name || log.admin_username) }}
                    </div>
                    <div class="log-user-info">
                      <span class="log-user-name" :title="log.admin_username">{{ log.admin_name || log.admin_username || 'Hệ thống' }}</span>
                      <span class="log-user-role">{{ formatRole(log.admin_role) }}</span>
                    </div>
                  </div>
                </td>

                <!-- Hành động -->
                <td>
                  <span :class="['action-tag', getActionTagClass(log.action_type)]">
                    {{ formatActionType(log.action_type) }}
                  </span>
                </td>

                <!-- Phân hệ -->
                <td>
                  <span class="target-chip">{{ formatTargetType(log.target_type) }}</span>
                </td>

                <!-- Chi tiết & Biến động dữ liệu -->
                <td>
                  <div class="log-summary-cell">
                    <span class="log-summary-text">{{ log.summary }}</span>
                    <div class="log-meta-badges">
                      <!-- Badge mã đối tượng (Click để lọc toàn bộ lịch sử đối tượng này) -->
                      <button
                        v-if="log.target_id"
                        type="button"
                        class="target-id-badge clickable"
                        @click="filterByTargetId(log.target_id)"
                        title="Click để xem toàn bộ lịch sử của đối tượng này"
                      >
                        🔍 ID: {{ log.target_id }}
                      </button>

                      <!-- Huy hiệu báo có diff trước/sau -->
                      <span v-if="hasDiff(log)" class="diff-indicator-badge">
                        ⚡ Có {{ getDiffCount(log) }} trường thay đổi
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Thiết bị & IP -->
                <td>
                  <div class="log-device-cell">
                    <div class="device-pill" :title="getDeviceFullTooltip(log)">
                      <span class="device-icon">{{ getDeviceIcon(log) }}</span>
                      <span class="device-text">{{ getDeviceName(log) }}</span>
                    </div>
                    <code class="ip-code" :title="'Địa chỉ IP: ' + (log.ip_address || 'Không rõ')">{{ log.ip_address || '—' }}</code>
                  </div>
                </td>

                <!-- Nút xem chi tiết modal -->
                <td class="th-right">
                  <button
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-ghost"
                    @click="openDetailModal(log)"
                    title="Mở bảng pháp y chi tiết sự kiện"
                  >
                    <AdminIcon name="eye" :size="14" />
                  </button>
                </td>
              </tr>

              <!-- DÒNG MỞ RỘNG INLINE: VISUAL DIFF & PHÁP Y THAO TÁC -->
              <tr v-if="expandedLogIds.has(log.id)" class="row-expand-content">
                <td colspan="8">
                  <div class="inline-diff-container">
                    <!-- Khối thông tin thiết bị & Endpoint -->
                    <div class="inline-forensics-bar" v-if="log.details && log.details._client">
                      <div class="forensic-chip">
                        <span class="f-lbl">Thiết bị:</span>
                        <strong>{{ log.details._client.device }}</strong>
                      </div>
                      <div class="forensic-chip">
                        <span class="f-lbl">Trình duyệt:</span>
                        <span>{{ log.details._client.browser }}</span>
                      </div>
                      <div class="forensic-chip" v-if="log.details._client.method">
                        <span class="f-lbl">API:</span>
                        <code>{{ log.details._client.method }} {{ log.details._client.path }}</code>
                      </div>
                      <div class="forensic-chip">
                        <span class="f-lbl">IP:</span>
                        <code>{{ log.ip_address }}</code>
                      </div>
                    </div>

                    <!-- Bảng So Sánh Trước vs Sau (Visual Diff Table) -->
                    <div v-if="hasDiff(log)" class="diff-table-wrapper">
                      <div class="diff-table-title">
                        <span>📊 Bảng So Sánh Dữ Liệu Thay Đổi (Trước vs Sau)</span>
                      </div>
                      <table class="diff-table">
                        <thead>
                          <tr>
                            <th style="width: 25%;">Trường Thông Tin</th>
                            <th style="width: 37.5%;" class="th-diff-before">Giá Trị CŨ (Trước Khi Đổi)</th>
                            <th style="width: 37.5%;" class="th-diff-after">Giá Trị MỚI (Sau Khi Đổi)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(val, field) in getDiffItems(log)" :key="field">
                            <td class="td-field-name">
                              <strong>{{ field }}</strong>
                            </td>
                            <td class="td-diff-before">
                              <span class="diff-val-badge before">
                                {{ formatDiffValue(val.before) }}
                              </span>
                            </td>
                            <td class="td-diff-after">
                              <span class="diff-val-badge after">
                                {{ formatDiffValue(val.after) }}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- Nếu không có diff thay đổi trường mà là tạo mới hoặc xóa -->
                    <div v-else-if="log.action_type === 'DELETE' && getDeletedEntityInfo(log)" class="delete-info-box">
                      <strong>Thông tin bản ghi trước khi bị xóa vĩnh viễn:</strong>
                      <pre class="json-preview-sm">{{ JSON.stringify(getDeletedEntityInfo(log), null, 2) }}</pre>
                    </div>

                    <div v-else class="no-diff-note">
                      <span>Thao tác hệ thống không ghi nhận cấu trúc biến động trước/sau. Dữ liệu ghi nhận: {{ log.summary }}</span>
                    </div>

                    <!-- Nút thao tác nhanh dưới dòng mở rộng -->
                    <div class="inline-actions-footer">
                      <button
                        v-if="log.target_id"
                        type="button"
                        class="adm-btn adm-btn-sm adm-btn-ghost"
                        @click="filterByTargetId(log.target_id)"
                      >
                        🔍 Lọc toàn bộ lịch sử của đối tượng ID #{{ log.target_id }}
                      </button>
                      <button
                        type="button"
                        class="adm-btn adm-btn-sm adm-btn-ghost"
                        @click="openDetailModal(log)"
                      >
                        Mở chi tiết đầy đủ (Modal)
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Phân trang -->
      <div v-if="totalCount > pageSize" class="adm-pagination">
        <span class="page-info">
          Hiển thị <strong>{{ paginationStart }} - {{ paginationEnd }}</strong> trên tổng <strong>{{ totalCount }}</strong> bản ghi
        </span>
        <div class="page-btns">
          <button
            type="button"
            class="page-nav-btn"
            :disabled="page <= 1 || loading"
            @click="changePage(page - 1)"
          >
            Trang Trước
          </button>
          <span class="page-current">Trang {{ page }} / {{ maxPage }}</span>
          <button
            type="button"
            class="page-nav-btn"
            :disabled="page >= maxPage || loading"
            @click="changePage(page + 1)"
          >
            Trang Sau
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Xem Chi Tiết Sự Kiện & Bảng So Sánh Trước vs Sau -->
    <Teleport to="body">
      <div v-if="selectedLog" class="adm-modal-backdrop" @click.self="selectedLog = null">
      <div class="adm-modal detail-modal deep-detail-modal">
        <div class="adm-modal-head">
          <div>
            <h3>Chi Tiết Pháp Y Thao Tác Hệ Thống</h3>
            <p>Mã sự kiện: <code>{{ selectedLog.id }}</code></p>
          </div>
          <button type="button" class="adm-modal-close" @click="selectedLog = null">
            <AdminIcon name="x" :size="18" />
          </button>
        </div>

        <div class="adm-modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Thời Gian Thực Hiện</span>
              <span class="val">{{ formatFullDateTime(selectedLog.created_at) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Người Thực Hiện</span>
              <span class="val">
                {{ selectedLog.admin_name }} (@{{ selectedLog.admin_username }}) — 
                <strong>{{ formatRole(selectedLog.admin_role) }}</strong>
              </span>
            </div>
            <div class="detail-item">
              <span class="label">Loại Thao Tác</span>
              <span class="val">
                <span :class="['action-tag', getActionTagClass(selectedLog.action_type)]">
                  {{ formatActionType(selectedLog.action_type) }}
                </span>
                <code style="margin-left: 8px;">{{ selectedLog.action }}</code>
              </span>
            </div>
            <div class="detail-item">
              <span class="label">Phân Hệ Tác Động</span>
              <span class="val">
                {{ formatTargetType(selectedLog.target_type) }}
                <button
                  v-if="selectedLog.target_id"
                  type="button"
                  class="target-id-badge clickable ml-2"
                  @click="filterByTargetId(selectedLog.target_id); selectedLog = null"
                  title="Lọc toàn bộ lịch sử đối tượng này"
                >
                  🔍 ID: {{ selectedLog.target_id }}
                </button>
              </span>
            </div>

            <!-- Khối Pháp Y Thiết Bị & Kết Nối -->
            <div class="detail-item full-width" v-if="selectedLog.details && selectedLog.details._client">
              <span class="label">Thông Tin Thiết Bị &amp; Kết Nối (Forensics)</span>
              <div class="forensics-card">
                <div class="f-row">
                  <span class="f-key">📱 Thiết Bị:</span>
                  <span class="f-val">{{ selectedLog.details._client.device }}</span>
                </div>
                <div class="f-row">
                  <span class="f-key">🌐 Trình Duyệt:</span>
                  <span class="f-val">{{ selectedLog.details._client.browser }}</span>
                </div>
                <div class="f-row" v-if="selectedLog.details._client.path">
                  <span class="f-key">🔗 API Yêu Cầu:</span>
                  <span class="f-val"><code>{{ selectedLog.details._client.method }} {{ selectedLog.details._client.path }}</code></span>
                </div>
                <div class="f-row">
                  <span class="f-key">📍 Địa Chỉ IP:</span>
                  <span class="f-val"><code class="ip-code">{{ selectedLog.ip_address || 'Không xác định' }}</code></span>
                </div>
              </div>
            </div>

            <div class="detail-item full-width">
              <span class="label">Mô Tả Tóm Tắt</span>
              <div class="val-box">{{ selectedLog.summary }}</div>
            </div>

            <!-- Bảng So Sánh Trước vs Sau bên trong Modal -->
            <div class="detail-item full-width" v-if="hasDiff(selectedLog)">
              <span class="label">Biến Động Dữ Liệu Chi Tiết (Trước vs Sau)</span>
              <table class="diff-table">
                <thead>
                  <tr>
                    <th style="width: 30%;">Trường Dữ Liệu</th>
                    <th style="width: 35%;" class="th-diff-before">Trước Khi Thay Đổi (CŨ)</th>
                    <th style="width: 35%;" class="th-diff-after">Sau Khi Thay Đổi (MỚI)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(val, field) in getDiffItems(selectedLog)" :key="field">
                    <td class="td-field-name"><strong>{{ field }}</strong></td>
                    <td class="td-diff-before">
                      <span class="diff-val-badge before">{{ formatDiffValue(val.before) }}</span>
                    </td>
                    <td class="td-diff-after">
                      <span class="diff-val-badge after">{{ formatDiffValue(val.after) }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Dữ liệu gốc Payload (Cho lập trình viên / kỹ thuật) -->
            <div class="detail-item full-width" v-if="selectedLog.details && Object.keys(selectedLog.details).length">
              <div class="json-toggle-head">
                <span class="label">Mã Kỹ Thuật (Raw Payload JSON)</span>
                <button type="button" class="btn-copy-json" @click="copyJson(selectedLog.details)">
                  {{ jsonCopied ? '✓ Đã Sao Chép' : 'Sao Chép JSON' }}
                </button>
              </div>
              <pre class="json-box">{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <div class="adm-modal-foot">
          <button
            v-if="selectedLog.target_id"
            type="button"
            class="adm-btn adm-btn-gold"
            @click="filterByTargetId(selectedLog.target_id); selectedLog = null"
          >
            🔍 Xem Toàn Bộ Lịch Sử Của ID #{{ selectedLog.target_id }}
          </button>
          <button type="button" class="adm-btn adm-btn-ghost" @click="selectedLog = null">Đóng</button>
        </div>
      </div>
    </div>
    </Teleport>

    <!-- Modal Quản Lý Tường Lửa WAF & IP Bị Khóa -->
    <Teleport to="body">
      <div v-if="wafModalOpen" class="adm-modal-backdrop" @click.self="wafModalOpen = false">
      <div class="adm-modal">
        <div class="adm-modal-head">
          <div>
            <h3>🛡️ Tường Lửa Ứng Dụng WAF &amp; Giám Sát Tấn Công</h3>
            <p>Danh sách các địa chỉ IP bị khóa tự động do có hành vi dò quét, SQL Injection, XSS hoặc Brute-Force</p>
          </div>
          <button type="button" class="adm-modal-close" @click="wafModalOpen = false" aria-label="Đóng">
            <AdminIcon name="x" :size="18" />
          </button>
        </div>

        <div class="adm-modal-body">
          <div v-if="loadingBlockedIps" class="adm-empty">Đang tải danh sách IP bị khóa...</div>
          <div v-else-if="!blockedIps.length" class="waf-all-clear">
            <span class="clear-icon">✅</span>
            <h4>Hệ thống an toàn 100%!</h4>
            <p>Hiện tại không có địa chỉ IP nào nằm trong danh sách đen của Tường lửa WAF.</p>
          </div>
          <div v-else class="blocked-ips-list">
            <div v-for="item in blockedIps" :key="item.ip" class="blocked-ip-card">
              <div class="ip-main">
                <strong class="ip-address">{{ item.ip }}</strong>
                <span class="ip-duration">Còn khóa <strong>{{ item.remainingMinutes }} phút</strong></span>
                <span class="ip-strikes">Vi phạm {{ item.strikes }} lần</span>
              </div>
              <div class="ip-reasons">
                <span v-for="(reason, rIdx) in item.reasons" :key="rIdx" class="reason-pill">{{ reason }}</span>
              </div>
              <div class="ip-actions">
                <button type="button" class="adm-btn adm-btn-sm adm-btn-ghost" @click="handleUnbanIp(item.ip)">
                  Mở khóa (Unban)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="adm-modal-foot">
          <button type="button" class="adm-btn adm-btn-ghost" @click="wafModalOpen = false">Đóng</button>
          <button type="button" class="adm-btn adm-btn-gold" @click="fetchBlockedIps">
            <AdminIcon name="sync" :size="14" />
            <span>Cập nhật</span>
          </button>
        </div>
      </div>
    </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiRequest } from '../../utils/api'
import AdminIcon from '../../components/admin/AdminIcon.vue'

const logs = ref([])
const loading = ref(false)
const totalCount = ref(0)
const page = ref(1)
const pageSize = ref(25)

// Bộ lọc chuyên sâu
const searchQuery = ref('')
const adminUserFilter = ref('ALL')
const actionFilter = ref('ALL')
const targetFilter = ref('ALL')
const targetIdFilter = ref('')
const fromDate = ref('')
const toDate = ref('')
const adminUsersList = ref([])

// Quản lý xem chi tiết & mở rộng dòng
const selectedLog = ref(null)
const expandedLogIds = ref(new Set())
const jsonCopied = ref(false)

// Quản lý WAF Blocked IPs
const blockedIps = ref([])
const loadingBlockedIps = ref(false)
const wafModalOpen = ref(false)

const isFiltered = computed(() => {
  return (
    searchQuery.value.trim() !== '' ||
    adminUserFilter.value !== 'ALL' ||
    actionFilter.value !== 'ALL' ||
    targetFilter.value !== 'ALL' ||
    targetIdFilter.value !== '' ||
    fromDate.value !== '' ||
    toDate.value !== ''
  )
})

const fetchBlockedIps = async () => {
  loadingBlockedIps.value = true
  try {
    const res = await apiRequest('/admin/security/blocked-ips')
    if (res.success) {
      blockedIps.value = res.data || []
    }
  } catch (err) {
    console.warn('Lỗi tải danh sách blocked IPs:', err)
  } finally {
    loadingBlockedIps.value = false
  }
}

const openWafModal = () => {
  wafModalOpen.value = true
  fetchBlockedIps()
}

const handleUnbanIp = async (ip) => {
  try {
    const res = await apiRequest('/admin/security/unban-ip', {
      method: 'POST',
      body: JSON.stringify({ ip })
    })
    if (res.success) {
      await fetchBlockedIps()
      await fetchLogs()
    }
  } catch (err) {
    console.error('Lỗi unban IP:', err)
  }
}

const maxPage = computed(() => Math.ceil((totalCount.value || 1) / pageSize.value) || 1)
const paginationStart = computed(() => (page.value - 1) * pageSize.value + 1)
const paginationEnd = computed(() => Math.min(page.value * pageSize.value, totalCount.value))

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: String(page.value),
      limit: String(pageSize.value),
      q: searchQuery.value.trim(),
      actionType: actionFilter.value,
      targetType: targetFilter.value,
      adminUser: adminUserFilter.value,
      targetId: targetIdFilter.value.trim(),
      fromDate: fromDate.value,
      toDate: toDate.value
    })
    const res = await apiRequest(`/admin/audit-logs?${params.toString()}`)
    if (res.success) {
      logs.value = res.data || []
      totalCount.value = res.total || 0
      if (res.adminUsers && Array.isArray(res.adminUsers)) {
        adminUsersList.value = res.adminUsers
      }
    }
  } catch (err) {
    console.error('Lỗi khi tải audit logs:', err)
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  page.value = 1
  fetchLogs()
}

const clearSearch = () => {
  searchQuery.value = ''
  handleFilterChange()
}

const clearDates = () => {
  fromDate.value = ''
  toDate.value = ''
  handleFilterChange()
}

const filterByTargetId = (targetId) => {
  targetIdFilter.value = String(targetId)
  page.value = 1
  fetchLogs()
}

const clearTargetIdFilter = () => {
  targetIdFilter.value = ''
  handleFilterChange()
}

const resetAllFilters = () => {
  searchQuery.value = ''
  adminUserFilter.value = 'ALL'
  actionFilter.value = 'ALL'
  targetFilter.value = 'ALL'
  targetIdFilter.value = ''
  fromDate.value = ''
  toDate.value = ''
  page.value = 1
  fetchLogs()
}

const changePage = (newPage) => {
  if (newPage < 1 || newPage > maxPage.value) return
  page.value = newPage
  fetchLogs()
}

const toggleRowExpand = (id) => {
  if (expandedLogIds.value.has(id)) {
    expandedLogIds.value.delete(id)
  } else {
    expandedLogIds.value.add(id)
  }
}

onMounted(() => {
  fetchLogs()
  fetchBlockedIps()
})

const filteredLogs = computed(() => logs.value)

// Thống kê nhanh
const todayCount = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return logs.value.filter(l => l.created_at && l.created_at.startsWith(today)).length
})

const securityCount = computed(() => {
  return logs.value.filter(l => l.action_type === 'SECURITY' || l.action_type === 'AUTH' || l.action_type === 'PERMISSIONS').length
})

const deleteCount = computed(() => {
  return logs.value.filter(l => l.action_type === 'DELETE').length
})

// Tiện ích format thời gian
const formatTime = (isoStr) => {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const formatDate = (isoStr) => {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatFullDateTime = (isoStr) => {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return d.toLocaleString('vi-VN')
}

const getInitials = (str) => {
  if (!str) return 'HT'
  const parts = str.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return str.slice(0, 2).toUpperCase()
}

const formatRole = (role) => {
  const map = {
    SUPER_ADMIN: 'Quản trị cấp cao',
    SALES: 'Kinh doanh',
    INVENTORY: 'Quản lý kho',
    CUSTOM: 'Tùy chỉnh',
    SYSTEM: 'Hệ thống'
  }
  return map[role] || role || 'Nhân sự'
}

const getAvatarClass = (role) => {
  if (role === 'SUPER_ADMIN') return 'av-gold'
  if (role === 'SALES') return 'av-blue'
  if (role === 'INVENTORY') return 'av-green'
  return 'av-gray'
}

const formatActionType = (type) => {
  const map = {
    CREATE: 'Tạo mới',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa bỏ',
    AUTH: 'Xác thực',
    PERMISSIONS: 'Phân quyền',
    EXPORT: 'Xuất dữ liệu',
    SYSTEM: 'Hệ thống',
    SECURITY: '🛡️ Bảo Mật & WAF'
  }
  return map[type] || type || 'Thao tác'
}

const getActionTagClass = (type) => {
  const map = {
    CREATE: 'tag-green',
    UPDATE: 'tag-amber',
    DELETE: 'tag-red',
    AUTH: 'tag-blue',
    PERMISSIONS: 'tag-purple',
    EXPORT: 'tag-cyan',
    SYSTEM: 'tag-gray',
    SECURITY: 'tag-security'
  }
  return map[type] || 'tag-gray'
}

const formatTargetType = (type) => {
  const map = {
    order: 'Đơn Hàng',
    product: 'Sản Phẩm & Giá',
    combo: 'Dàn Combo',
    lead: 'Khách Tư Vấn',
    tradein: 'Thu Cũ Đổi Mới',
    admin: 'Tài Khoản Nhân Sự',
    auth: 'Đăng Nhập OTP',
    security: 'Bảo Mật',
    waf_threat: 'Tường Lửa WAF',
    festive: 'Hiệu Ứng Lễ Hội',
    system: 'Hệ Thống'
  }
  return map[type] || type || 'Chung'
}

// Xử lý Thiết bị & Trình duyệt (Forensics)
const getDeviceIcon = (log) => {
  const device = log.details?._client?.device || ''
  if (/điện thoại|mobile|iphone|android/i.test(device)) return '📱'
  if (/máy tính bảng|tablet|ipad/i.test(device)) return '📟'
  return '💻'
}

const getDeviceName = (log) => {
  const client = log.details?._client
  if (client?.device) {
    if (/điện thoại/i.test(client.device)) return 'Điện thoại'
    if (/máy tính bảng/i.test(client.device)) return 'Tablet'
    return 'Máy tính (PC)'
  }
  return 'Trình duyệt Web'
}

const getDeviceFullTooltip = (log) => {
  const client = log.details?._client
  if (!client) return 'Không có dữ liệu thiết bị'
  return `${client.device || 'Thiết bị'} • ${client.browser || 'Trình duyệt'} • ${client.method || 'GET'} ${client.path || ''}`
}

// Xử lý Visual Diff (So sánh Trước vs Sau)
const hasDiff = (log) => {
  if (!log || !log.details) return false
  if (log.details.changes && typeof log.details.changes === 'object' && Object.keys(log.details.changes).length > 0) {
    return true
  }
  return false
}

const getDiffCount = (log) => {
  if (!hasDiff(log)) return 0
  return Object.keys(log.details.changes).length
}

const getDiffItems = (log) => {
  if (!hasDiff(log)) return {}
  return log.details.changes
}

const formatDiffValue = (val) => {
  if (val === null || val === undefined || val === '') return '— (Trống)'
  if (typeof val === 'boolean') return val ? 'Bật (Đúng)' : 'Tắt (Sai)'
  if (typeof val === 'number') {
    if (val >= 10000) return `${val.toLocaleString('vi-VN')} đ`
    return String(val)
  }
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val)
    } catch {
      return String(val)
    }
  }
  return String(val)
}

const getDeletedEntityInfo = (log) => {
  if (!log.details) return null
  return log.details.oldLead || log.details.oldOrder || log.details.oldTrade || log.details.deletedUser || null
}

const openDetailModal = (log) => {
  selectedLog.value = log
  jsonCopied.value = false
}

const copyJson = (payload) => {
  try {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    jsonCopied.value = true
    setTimeout(() => {
      jsonCopied.value = false
    }, 2000)
  } catch (err) {
    console.warn('Lỗi copy JSON:', err)
  }
}

// Xuất file CSV
const exportLogsCsv = () => {
  if (!logs.value.length) return
  const headers = ['Thời gian', 'Tài khoản', 'Họ tên', 'Vai trò', 'Hành động', 'Phân hệ', 'Nội dung chi tiết', 'Thiết bị', 'Trình duyệt', 'IP']
  const rows = logs.value.map(l => [
    formatFullDateTime(l.created_at),
    `"${l.admin_username || ''}"`,
    `"${l.admin_name || ''}"`,
    `"${formatRole(l.admin_role)}"`,
    `"${formatActionType(l.action_type)}"`,
    `"${formatTargetType(l.target_type)}"`,
    `"${(l.summary || '').replace(/"/g, '""')}"`,
    `"${l.details?._client?.device || ''}"`,
    `"${l.details?._client?.browser || ''}"`,
    `"${l.ip_address || ''}"`
  ])
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `tuaudio_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.deep-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.adm-toolbar-subrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 10px;
  border-top: 1px dashed #e2e8f0;
}

.clear-search-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  padding: 0 8px;
}
.clear-search-btn:hover {
  color: #ef4444;
}

.filter-selects {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.adm-select-sm {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--adm-border, #e2e8f0);
  background: #ffffff;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.adm-select-sm:focus {
  border-color: #eab308;
}

.date-range-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.filter-label {
  font-weight: 600;
  color: #64748b;
  font-size: 12px;
}

.date-input-wrap {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  overflow: hidden;
}

.date-label {
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  border-right: 1px solid #cbd5e1;
}

.adm-date-input {
  border: none;
  background: transparent;
  padding: 4px 8px;
  font-size: 12px;
  color: #1e293b;
  outline: none;
}

.btn-clear-date {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-clear-date:hover {
  background: #fca5a5;
}

.active-target-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
}

.active-target-badge button {
  background: none;
  border: none;
  color: #ef4444;
  font-weight: bold;
  cursor: pointer;
  padding: 0 4px;
}

.btn-reset-filters {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-left: auto;
  transition: all 0.15s;
}
.btn-reset-filters:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* Bảng */
.deep-audit-table {
  border-collapse: collapse;
}

.td-expand-toggle {
  text-align: center;
  padding: 8px 4px !important;
}

.btn-expand-row {
  background: none;
  border: none;
  font-size: 10px;
  color: #94a3b8;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-expand-row:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.btn-expand-row.active {
  transform: rotate(90deg);
  color: #d97706;
}

.row-expanded {
  background: #fffbeb !important;
}

.log-time-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.time-clock {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  font-family: monospace;
}

.time-date {
  font-size: 11px;
  color: #64748b;
}

.log-user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.log-user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.av-gold { background: #fef3c7; color: #b45309; }
.av-blue { background: #dbeafe; color: #1d4ed8; }
.av-green { background: #dcfce7; color: #15803d; }
.av-gray { background: #f1f5f9; color: #475569; }

.log-user-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  line-height: 1.25;
  overflow: hidden;
}

.log-user-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.log-user-role {
  font-size: 11px;
  color: #64748b;
}

.action-tag {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.tag-green { background: #dcfce7; color: #166534; }
.tag-amber { background: #fef3c7; color: #92400e; }
.tag-red { background: #fee2e2; color: #991b1b; }
.tag-blue { background: #dbeafe; color: #1e40af; }
.tag-purple { background: #f3e8ff; color: #6b21a8; }
.tag-cyan { background: #cffafe; color: #155e75; }
.tag-gray { background: #f1f5f9; color: #475569; }

.target-chip {
  display: inline-block;
  padding: 3px 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.log-summary-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-summary-text {
  font-size: 13px;
  color: #1e293b;
  line-height: 1.4;
}

.log-meta-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.target-id-badge {
  display: inline-block;
  font-size: 11px;
  color: #0369a1;
  background: #e0f2fe;
  padding: 1px 6px;
  border-radius: 4px;
  font-family: monospace;
  border: none;
}

.target-id-badge.clickable {
  cursor: pointer;
  transition: all 0.15s;
}
.target-id-badge.clickable:hover {
  background: #bae6fd;
  text-decoration: underline;
}

.diff-indicator-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: #b45309;
  background: #fef3c7;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid #fde68a;
}

.log-device-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.device-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #334155;
  background: #f1f5f9;
  padding: 2px 7px;
  border-radius: 4px;
  width: fit-content;
}

.ip-code {
  font-size: 11px;
  background: #f8fafc;
  padding: 1px 6px;
  border-radius: 4px;
  color: #64748b;
  font-family: monospace;
  width: fit-content;
  border: 1px solid #e2e8f0;
}

/* DÒNG MỞ RỘNG (INLINE EXPAND) */
.row-expand-content {
  background: #fffdf5;
}

.inline-diff-container {
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid #fde68a;
  border-radius: 8px;
  margin: 6px 10px 14px 10px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.inline-forensics-bar {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 12px;
  margin-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 12px;
}

.forensic-chip {
  display: flex;
  align-items: center;
  gap: 5px;
}

.f-lbl {
  color: #64748b;
  font-weight: 500;
}

.diff-table-wrapper {
  margin-bottom: 14px;
}

.diff-table-title {
  font-size: 12px;
  font-weight: 700;
  color: #92400e;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.diff-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.diff-table th {
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
}

.th-diff-before {
  color: #991b1b !important;
  background: #fef2f2 !important;
}

.th-diff-after {
  color: #166534 !important;
  background: #f0fdf4 !important;
}

.diff-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

.td-field-name {
  color: #1e293b;
  font-weight: 600;
  background: #fafafa;
}

.td-diff-before {
  background: #fffafa;
}

.td-diff-after {
  background: #f8fdf9;
}

.diff-val-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  word-break: break-word;
}

.diff-val-badge.before {
  background: #fee2e2;
  color: #991b1b;
  text-decoration: line-through;
  opacity: 0.85;
}

.diff-val-badge.after {
  background: #dcfce7;
  color: #15803d;
  font-weight: 700;
}

.delete-info-box {
  padding: 10px 14px;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  color: #991b1b;
  font-size: 12px;
  margin-bottom: 12px;
}

.json-preview-sm {
  margin: 6px 0 0 0;
  background: #ffffff;
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  max-height: 150px;
  overflow-y: auto;
}

.no-diff-note {
  font-size: 12px;
  color: #64748b;
  padding: 8px 0;
}

.inline-actions-footer {
  display: flex;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

/* Pagination */
.adm-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-top: 1px solid #e2e8f0;
  font-size: 13px;
}

.page-btns {
  display: flex;
  gap: 10px;
  align-items: center;
}

.page-nav-btn {
  padding: 6px 14px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.page-nav-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
}

.page-nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-current {
  font-weight: 600;
  color: #475569;
}

/* Modal Chi Tiết Pháp Y */
.deep-detail-modal {
  max-width: 720px;
  width: 90vw;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item .label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
  color: #64748b;
}

.detail-item .val {
  font-size: 13px;
  color: #0f172a;
}

.forensics-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
}

.f-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.f-key {
  font-weight: 600;
  color: #475569;
  min-width: 120px;
}

.val-box {
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: #1e293b;
}

.json-toggle-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.btn-copy-json {
  background: none;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  color: #475569;
  transition: all 0.15s;
}
.btn-copy-json:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.json-box {
  margin: 0;
  padding: 12px;
  background: #0f172a;
  color: #38bdf8;
  border-radius: 6px;
  font-size: 11px;
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
}

/* WAF Security & Row Styling */
.tag-security {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
  font-weight: 800;
}

.row-security-event {
  background: #fff8f8;
  border-left: 3px solid #ef4444;
}

.adm-btn-shield {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.adm-btn-shield:hover {
  background: #fecaca;
  color: #991b1b;
}

.waf-all-clear {
  text-align: center;
  padding: 30px 20px;
}
.waf-all-clear .clear-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 8px;
}
.waf-all-clear h4 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #166534;
  margin: 0 0 6px 0;
}
.waf-all-clear p {
  color: #64748b;
  font-size: 0.88rem;
  margin: 0;
}

.blocked-ips-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.blocked-ip-card {
  padding: 12px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.ip-main {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ip-address {
  font-family: monospace;
  font-size: 0.95rem;
  color: #991b1b;
}
.ip-duration {
  font-size: 0.75rem;
  color: #475569;
}
.ip-strikes {
  font-size: 0.72rem;
  background: #dc2626;
  color: #fff;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 700;
}
.ip-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}
.reason-pill {
  font-size: 0.7rem;
  background: #fff;
  color: #7f1d1d;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #fca5a5;
}
</style>
