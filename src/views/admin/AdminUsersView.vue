<template>
  <div class="adm-page">
    <!-- Đầu trang Phân Quyền & Nhân Sự -->
    <div class="adm-page-head">
      <div>
        <h1 class="adm-page-title">Tài Khoản Nhân Sự &amp; Phân Quyền</h1>
        <p class="adm-page-sub">
          Quản lý tài khoản đăng nhập nhân viên, xét duyệt đăng ký mới và phân quyền truy cập hệ thống.
        </p>
      </div>
      <div class="adm-head-actions">
        <button type="button" class="adm-btn adm-btn-ghost btn-monitor" @click="showOnlineMonitorModal = true">
          <span class="live-pulse-dot"></span>
          <span>Giám Sát Vị Trí ({{ onlineCount }} Online)</span>
        </button>
        <button type="button" class="adm-btn adm-btn-ghost" :disabled="busy" @click="loadUsers">
          <AdminIcon name="sync" :size="15" />
          <span>Tải Lại Danh Sách</span>
        </button>
        <button type="button" class="adm-btn adm-btn-gold" @click="showCreateForm = !showCreateForm">
          <AdminIcon :name="showCreateForm ? 'x' : 'plus'" :size="16" />
          <span>{{ showCreateForm ? 'Thu Gọn Biểu Mẫu' : '+ Tạo Tài Khoản Mới' }}</span>
        </button>
      </div>
    </div>

    <!-- 5 Thẻ Phân Loại Trạng Thái Nhân Sự & Trực Tuyến -->
    <div class="adm-kpi-grid kpi-grid-5">
      <div class="adm-kpi-card card-online-kpi" @click="showOnlineMonitorModal = true" style="cursor: pointer;" title="Bấm để xem chi tiết vị trí và trang các tài khoản đang truy cập">
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Đang Trực Tuyến</span>
          <span class="adm-kpi-value text-green">
            <span class="live-pulse-dot"></span>
            {{ onlineCount }} tài khoản
          </span>
          <span class="adm-kpi-meta">{{ onlineCount > 0 ? 'Có người đang thao tác hệ thống' : 'Chưa có phiên hoạt động' }}</span>
        </div>
        <div class="adm-kpi-icon tone-green">
          <AdminIcon name="map" :size="20" />
        </div>
      </div>

      <div class="adm-kpi-card">
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Quản Trị Cấp Cao</span>
          <span class="adm-kpi-value">{{ countByRole('SUPER_ADMIN') }} tài khoản</span>
          <span class="adm-kpi-meta">Toàn quyền hệ thống, giá bán &amp; nhân sự</span>
        </div>
        <div class="adm-kpi-icon tone-gold">
          <AdminIcon name="shield" :size="20" />
        </div>
      </div>

      <div class="adm-kpi-card">
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Chuyên Viên Kinh Doanh</span>
          <span class="adm-kpi-value">{{ countByRole('SALES') }} tài khoản</span>
          <span class="adm-kpi-meta">Quản lý Leads, Đơn hàng &amp; Thu cũ</span>
        </div>
        <div class="adm-kpi-icon tone-blue">
          <AdminIcon name="leads" :size="20" />
        </div>
      </div>

      <div class="adm-kpi-card">
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Quản Lý Kho Thiết Bị</span>
          <span class="adm-kpi-value">{{ countByRole('INVENTORY') }} tài khoản</span>
          <span class="adm-kpi-meta">Cập nhật Loa, Giá Sale &amp; Gói dàn</span>
        </div>
        <div class="adm-kpi-icon tone-green">
          <AdminIcon name="products" :size="20" />
        </div>
      </div>

      <div class="adm-kpi-card" :class="{ 'card-highlight-amber': pendingCount > 0 }">
        <div class="adm-kpi-info">
          <span class="adm-kpi-label">Chờ Duyệt &amp; Phân Quyền</span>
          <span class="adm-kpi-value" :class="{ 'text-amber': pendingCount > 0 }">{{ pendingCount }} hồ sơ</span>
          <span class="adm-kpi-meta">Nhân sự tự đăng ký từ bên ngoài</span>
        </div>
        <div class="adm-kpi-icon" :class="pendingCount > 0 ? 'tone-gold' : 'tone-blue'">
          <AdminIcon name="users" :size="20" />
        </div>
      </div>
    </div>

    <!-- Thông báo hồ sơ chờ duyệt nổi bật -->
    <div v-if="pendingCount > 0" class="pending-notice-banner" role="alert">
      <AdminIcon name="alert" :size="18" />
      <div>
        <strong>Có {{ pendingCount }} hồ sơ nhân sự mới đăng ký từ bên ngoài đang chờ phê duyệt.</strong>
        <span> Vui lòng chọn vai trò (Kinh doanh hoặc Quản lý kho) rồi nhấn "Duyệt &amp; Phân Quyền" để kích hoạt tài khoản.</span>
      </div>
    </div>

    <!-- Thông báo phản hồi -->
    <div v-if="error" class="feedback-banner error" role="alert">
      <AdminIcon name="alert" :size="17" />
      <span>{{ error }}</span>
    </div>
    <div v-if="message" class="feedback-banner success" role="status">
      <AdminIcon name="check" :size="17" />
      <span>{{ message }}</span>
    </div>

    <!-- Khối Tạo Tài Khoản Nhân Sự Mới (Chủ động tạo nội bộ) -->
    <Transition name="fade-slide">
      <form v-if="showCreateForm" class="adm-card adm-card-p create-user-card" @submit.prevent="createUser">
        <div class="create-head">
          <div>
            <h2 class="adm-card-title">Cấp Tài Khoản Quản Trị Mới</h2>
            <p class="adm-card-sub">Tên đăng nhập viết liền không dấu; mật khẩu bắt buộc tối thiểu 12 ký tự</p>
          </div>
        </div>

        <div class="user-form-grid">
          <div class="adm-field">
            <label>Tên đăng nhập</label>
            <input
              v-model="form.username"
              required
              minlength="3"
              maxlength="50"
              autocomplete="off"
              placeholder="vd: dmanh hoặc sales_hanoi"
            />
            <span class="adm-hint">Tự động chuyển chữ thường (a-z, 0-9, dấu chấm, gạch nối)</span>
          </div>

          <div class="adm-field">
            <label>Họ và tên nhân sự</label>
            <input v-model="form.fullName" required maxlength="100" placeholder="vd: Nguyễn Duy Mạnh" />
          </div>

          <div class="adm-field">
            <label>Email nhận mã OTP bảo mật</label>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="vd: manh.sales@tuaudio.vn"
            />
            <span class="adm-hint">Mã OTP 6 số sẽ được gửi về hòm thư này khi đăng nhập</span>
          </div>

          <div class="adm-field">
            <label>Số điện thoại liên hệ</label>
            <input v-model="form.phone" required type="tel" placeholder="vd: 0984259898" />
          </div>

          <div class="adm-field">
            <label>Mật khẩu khởi tạo (&ge; 12 ký tự)</label>
            <div class="pwd-box">
              <input
                v-model="form.password"
                required
                :type="showCreatePwd ? 'text' : 'password'"
                minlength="12"
                maxlength="128"
                autocomplete="new-password"
                placeholder="Nhập ít nhất 12 ký tự..."
              />
              <button
                type="button"
                class="pwd-eye"
                @click="showCreatePwd = !showCreatePwd"
                :title="showCreatePwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
              >
                <AdminIcon :name="showCreatePwd ? 'eye-off' : 'eye'" :size="16" />
              </button>
            </div>
            <span class="adm-hint">Độ dài hiện tại: {{ form.password.length }}/12+ ký tự</span>
          </div>

          <div class="adm-field">
            <label>Vai trò phân quyền</label>
            <select v-model="form.role">
              <option value="SALES">Chuyên viên kinh doanh (CRM &amp; Đơn hàng)</option>
              <option value="INVENTORY">Quản lý kho (Sản phẩm &amp; Gói dàn)</option>
              <option value="SUPER_ADMIN">Quản trị viên cấp cao (Toàn quyền)</option>
            </select>
          </div>
        </div>

        <div class="create-foot">
          <button type="submit" class="adm-btn adm-btn-gold" :disabled="busy">
            <AdminIcon name="check" :size="16" />
            <span>{{ busy ? 'Đang khởi tạo...' : 'Tạo Tài Khoản Nhân Sự' }}</span>
          </button>
        </div>
      </form>
    </Transition>

    <!-- Danh sách Tài khoản & Thanh lọc hồ sơ -->
    <div class="adm-card">
      <div class="adm-toolbar">
        <div class="adm-toolbar-row">
          <div class="adm-search-box">
            <AdminIcon name="search" :size="16" class="search-ico" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Tìm theo tài khoản, họ tên, email hoặc SĐT..."
            />
          </div>

          <!-- Bộ lọc trạng thái hồ sơ & trực tuyến -->
          <div class="filter-chips">
            <button
              type="button"
              :class="['filter-chip', statusFilter === 'ALL' ? 'active' : '']"
              @click="statusFilter = 'ALL'"
            >
              Tất Cả ({{ users.length }})
            </button>
            <button
              type="button"
              :class="['filter-chip chip-green', statusFilter === 'ONLINE' ? 'active' : '']"
              @click="statusFilter = 'ONLINE'"
            >
              <span class="live-pulse-dot-sm"></span>
              Đang Online ({{ onlineCount }})
            </button>
            <button
              type="button"
              :class="['filter-chip chip-amber', statusFilter === 'PENDING' ? 'active' : '']"
              @click="statusFilter = 'PENDING'"
            >
              Chờ Duyệt ({{ pendingCount }})
            </button>
            <button
              type="button"
              :class="['filter-chip', statusFilter === 'ACTIVE' ? 'active' : '']"
              @click="statusFilter = 'ACTIVE'"
            >
              Đang Hoạt Động ({{ activeCount }})
            </button>
            <button
              type="button"
              :class="['filter-chip', statusFilter === 'LOCKED' ? 'active' : '']"
              @click="statusFilter = 'LOCKED'"
            >
              Đã Khóa ({{ lockedCount }})
            </button>
          </div>
        </div>
      </div>

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>Tài Khoản</th>
              <th>Họ Tên Nhân Sự</th>
              <th>Email Nhận Mã OTP</th>
              <th>Số Điện Thoại</th>
              <th>Cấp Độ Phân Quyền</th>
              <th>Trạng Thái</th>
              <th class="th-right">Thao Tác Bảo Mật</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              :class="{ 'row-pending-highlight': user.role === 'PENDING' }"
            >
              <td>
                <div class="user-id-cell">
                  <div :class="['u-avatar', user.role === 'PENDING' ? 'avatar-pending' : '']">
                    {{ getInitials(user.full_name || user.username) }}
                  </div>
                  <div>
                    <strong class="u-login">{{ user.username }}</strong>
                    <span v-if="user.id === currentUserId" class="you-tag">Đang đăng nhập</span>
                    <span v-else-if="user.role === 'PENDING'" class="pending-tag">Đăng ký mới</span>
                  </div>
                </div>
              </td>
              <td>{{ user.full_name }}</td>
              <td>
                <div v-if="user.email" class="user-email-pill">
                  <AdminIcon name="mail" :size="13" />
                  <span>{{ user.email }}</span>
                </div>
                <span v-else class="adm-badge adm-badge-amber">Chưa cài Email OTP</span>
              </td>
              <td>{{ user.phone || '—' }}</td>
              <td>
                <div class="user-role-cell">
                  <div class="role-pill-row">
                    <span :class="['role-pill', getRoleBadgeClass(user.role)]">
                      {{ formatUserRole(user.role) }}
                    </span>
                    <span class="perms-count-pill" :title="getPermsTooltip(user)">
                      {{ getPermsCountLabel(user) }}
                    </span>
                  </div>
                  <button
                    v-if="user.role !== 'PENDING'"
                    type="button"
                    class="perm-edit-btn"
                    :disabled="busy"
                    @click="openPermissionModal(user)"
                    title="Cấu hình phân quyền sâu từng thao tác cho tài khoản này"
                  >
                    <AdminIcon name="shield" :size="12" />
                    <span>Phân quyền chi tiết</span>
                  </button>
                </div>
              </td>
              <td>
                <div class="user-status-cell">
                  <!-- Trạng thái Online / Offline / Khóa -->
                  <div class="status-indicator-row">
                    <span :class="['online-dot', getOnlineDotClass(user)]"></span>
                    <strong :class="['status-title', getOnlineTextClass(user)]">
                      {{ getOnlineStatusLabel(user) }}
                    </strong>
                  </div>

                  <!-- Thông tin vị trí & thiết bị nếu đang có phiên -->
                  <div v-if="getUserSession(user)" class="session-meta">
                    <span class="session-loc" :title="'IP mạng: ' + (getUserSession(user).ipAddress || '—')">
                      {{ getUserSession(user).city?.startsWith('🎯') ? '' : '📍 ' }}{{ formatSessionCity(getUserSession(user).city) }} • {{ getUserSession(user).deviceType || 'PC' }}
                    </span>
                    <span v-if="getUserSession(user).currentPageTitle" class="session-page" :title="getUserSession(user).currentPage">
                      👁 {{ getUserSession(user).currentPageTitle }}
                    </span>
                  </div>
                  <div v-else-if="!user.is_active" class="locked-hint">
                    Tài khoản đã bị khóa
                  </div>
                </div>
              </td>
              <td>
                <div class="action-group">
                  <!-- Nút phê duyệt nhanh cho tài khoản đang chờ duyệt -->
                  <button
                    v-if="user.role === 'PENDING' || !user.is_active"
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-gold"
                    :disabled="busy"
                    @click="openApproveModal(user)"
                    title="Phê duyệt hồ sơ và phân quyền đăng nhập"
                  >
                    <AdminIcon name="check" :size="14" />
                    <span>{{ user.role === 'PENDING' ? 'Duyệt & Phân Quyền' : 'Mở Khóa' }}</span>
                  </button>

                  <!-- Nút phân quyền sâu cho tài khoản đang hoạt động -->
                  <button
                    v-if="user.role !== 'PENDING'"
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-ghost perm-quick-btn"
                    :disabled="busy"
                    @click="openPermissionModal(user)"
                    title="Cấu hình phân quyền chi tiết từng thao tác"
                  >
                    <AdminIcon name="shield" :size="14" />
                    <span>Phân quyền</span>
                  </button>

                  <!-- Nút đổi mật khẩu cho tài khoản đã kích hoạt -->
                  <button
                    v-if="user.role !== 'PENDING'"
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-ghost"
                    :disabled="busy"
                    @click="openPasswordReset(user)"
                  >
                    <AdminIcon name="key" :size="14" />
                    <span>Đổi mật khẩu</span>
                  </button>

                  <!-- Nút khóa tài khoản đang hoạt động -->
                  <button
                    v-if="user.is_active && user.id !== currentUserId && user.role !== 'PENDING'"
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-danger"
                    :disabled="busy"
                    @click="toggleUserActive(user, false)"
                  >
                    <AdminIcon name="lock" :size="14" />
                    <span>Khóa</span>
                  </button>

                  <!-- Nút Từ chối / Xóa tài khoản -->
                  <button
                    v-if="user.id !== currentUserId && (user.role === 'PENDING' || !user.is_active)"
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-danger"
                    :disabled="busy"
                    @click="deleteUser(user)"
                    :title="user.role === 'PENDING' ? 'Từ chối đơn đăng ký' : 'Xóa tài khoản khỏi hệ thống'"
                  >
                    <AdminIcon name="x" :size="14" />
                    <span>{{ user.role === 'PENDING' ? 'Từ Chối' : 'Xóa' }}</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredUsers.length">
              <td colspan="7" class="adm-empty">Không tìm thấy tài khoản nhân sự phù hợp theo bộ lọc.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Phê Duyệt & Phân Quyền Nhân Sự Mới -->
    <div v-if="approveModalUser" class="adm-modal-backdrop" @click.self="approveModalUser = null">
      <div class="adm-modal pwd-modal">
        <div class="adm-modal-head">
          <div>
            <h3>Phê Duyệt Hồ Sơ: {{ approveModalUser.username }}</h3>
            <p>Chọn vai trò phân quyền để kích hoạt quyền đăng nhập cho nhân viên</p>
          </div>
          <button type="button" class="adm-modal-close" @click="approveModalUser = null">
            <AdminIcon name="x" :size="18" />
          </button>
        </div>

        <form @submit.prevent="submitApprove">
          <div class="adm-modal-body">
            <div class="info-callout">
              <div><strong>Họ và tên:</strong> {{ approveModalUser.full_name }}</div>
              <div><strong>Email OTP:</strong> {{ approveModalUser.email || 'Chưa có' }}</div>
              <div><strong>Số điện thoại:</strong> {{ approveModalUser.phone || 'Chưa có' }}</div>
            </div>

            <div class="adm-field">
              <label>Phân quyền vai trò truy cập</label>
              <select v-model="approveRole">
                <option value="SALES">Chuyên viên kinh doanh (Quản lý Leads &amp; Đơn hàng)</option>
                <option value="INVENTORY">Quản lý kho (Sản phẩm &amp; Gói dàn combo)</option>
                <option value="SUPER_ADMIN">Quản trị viên cấp cao (Toàn quyền)</option>
              </select>
              <span class="adm-hint">Sau khi duyệt, nhân sự có thể đăng nhập ngay với mật khẩu đã đăng ký</span>
            </div>
          </div>

          <div class="adm-modal-foot">
            <button type="button" class="adm-btn adm-btn-ghost" @click="approveModalUser = null">Hủy</button>
            <button type="submit" class="adm-btn adm-btn-gold" :disabled="busy">
              <AdminIcon name="check" :size="16" />
              <span>Phê Duyệt &amp; Kích Hoạt Ngay</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Đặt Lại Mật Khẩu & Cập Nhật Email Bảo Mật -->
    <div v-if="pwdModalUser" class="adm-modal-backdrop" @click.self="pwdModalUser = null">
      <div class="adm-modal pwd-modal">
        <div class="adm-modal-head">
          <div>
            <h3>Cập Nhật Bảo Mật: {{ pwdModalUser.username }}</h3>
            <p>Đổi mật khẩu mới hoặc thay đổi Email nhận mã OTP xác thực khi đăng nhập</p>
          </div>
          <button type="button" class="adm-modal-close" @click="pwdModalUser = null">
            <AdminIcon name="x" :size="18" />
          </button>
        </div>

        <form @submit.prevent="submitPasswordReset">
          <div class="adm-modal-body">
            <div class="adm-field">
              <label>Email nhận mã OTP bảo mật</label>
              <input
                type="email"
                v-model="resetEmail"
                placeholder="vd: employee@tuaudio.vn"
              />
              <span class="adm-hint">Mã xác thực 2 bước sẽ gửi về hòm thư này</span>
            </div>

            <div class="adm-field">
              <label>Mật khẩu mới (&ge; 12 ký tự) (Để trống nếu chỉ đổi Email)</label>
              <div class="pwd-box">
                <input
                  :type="showResetPwd ? 'text' : 'password'"
                  v-model="newPassword"
                  minlength="12"
                  maxlength="128"
                  placeholder="Nhập ít nhất 12 ký tự..."
                  autocomplete="new-password"
                />
                <button type="button" class="pwd-eye" @click="showResetPwd = !showResetPwd">
                  <AdminIcon :name="showResetPwd ? 'eye-off' : 'eye'" :size="16" />
                </button>
              </div>
              <span class="adm-hint" v-if="newPassword">Đã nhập: {{ newPassword.length }}/12+ ký tự</span>
            </div>
          </div>

          <div class="adm-modal-foot">
            <button type="button" class="adm-btn adm-btn-ghost" @click="pwdModalUser = null">Hủy</button>
            <button type="submit" class="adm-btn adm-btn-gold" :disabled="busy">
              <AdminIcon name="check" :size="16" />
              <span>Lưu Cập Nhật Bảo Mật</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Phân Quyền Chi Tiết Từng Tài Khoản -->
    <div v-if="permissionModalUser" class="adm-modal-backdrop" @click.self="permissionModalUser = null">
      <div class="adm-modal perm-modal">
        <div class="adm-modal-head">
          <div>
            <h3>Phân Quyền Chi Tiết: {{ permissionModalUser.full_name || permissionModalUser.username }}</h3>
            <p>Tài khoản: <code>{{ permissionModalUser.username }}</code> — Email nhận OTP: <strong>{{ permissionModalUser.email || 'Chưa có' }}</strong></p>
          </div>
          <button type="button" class="adm-modal-close" @click="permissionModalUser = null">
            <AdminIcon name="x" :size="18" />
          </button>
        </div>

        <form @submit.prevent="submitPermissions">
          <div class="adm-modal-body perm-modal-body">
            <!-- Chọn mẫu vai trò nhanh -->
            <div class="perm-template-box">
              <span class="template-label">Áp dụng mẫu vai trò nhanh:</span>
              <div class="template-btns">
                <button
                  type="button"
                  :class="['t-btn', selectedRole === 'SUPER_ADMIN' ? 'active t-gold' : '']"
                  @click="applyRoleTemplate('SUPER_ADMIN')"
                >
                  <AdminIcon name="shield" :size="14" />
                  <span>Quản Trị Cấp Cao (Toàn quyền *)</span>
                </button>
                <button
                  type="button"
                  :class="['t-btn', selectedRole === 'SALES' ? 'active t-blue' : '']"
                  @click="applyRoleTemplate('SALES')"
                >
                  <AdminIcon name="leads" :size="14" />
                  <span>Kinh Doanh (16 quyền)</span>
                </button>
                <button
                  type="button"
                  :class="['t-btn', selectedRole === 'INVENTORY' ? 'active t-green' : '']"
                  @click="applyRoleTemplate('INVENTORY')"
                >
                  <AdminIcon name="products" :size="14" />
                  <span>Kho Thiết Bị (8 quyền)</span>
                </button>
                <button
                  type="button"
                  :class="['t-btn', selectedRole === 'CUSTOM' ? 'active t-purple' : '']"
                  @click="selectedRole = 'CUSTOM'"
                >
                  <AdminIcon name="edit" :size="14" />
                  <span>Tùy Chỉnh Thủ Công</span>
                </button>
              </div>
            </div>

            <!-- Thanh thống kê & thao tác chọn nhanh -->
            <div class="perm-toolbar">
              <div class="perm-stats">
                Quyền được cấp: <strong class="text-gold">{{ selectedPermissions.includes('*') ? 'Toàn bộ quyền (*)' : selectedPermissions.length + ' thao tác' }}</strong>
              </div>
              <div class="perm-quick-actions" v-if="!selectedPermissions.includes('*')">
                <button type="button" class="adm-link-btn" @click="selectAllPermissions">Chọn tất cả</button>
                <span class="sep">•</span>
                <button type="button" class="adm-link-btn text-danger" @click="deselectAllPermissions">Bỏ chọn tất cả</button>
              </div>
            </div>

            <!-- Trường hợp Toàn quyền (Super Admin) -->
            <div v-if="selectedPermissions.includes('*')" class="super-admin-notice">
              <AdminIcon name="shield" :size="24" />
              <div>
                <strong>Tài khoản Quản Trị Cấp Cao (Super Admin)</strong>
                <p>Tài khoản này có toàn quyền truy cập tất cả phân hệ, chỉnh sửa giá bán, phê duyệt nhân sự và xóa mọi dữ liệu trong hệ thống.</p>
              </div>
            </div>

            <!-- Danh sách 10 nhóm quyền chi tiết (Checkbox Cards) -->
            <div v-else class="perm-groups-container">
              <div
                v-for="group in PERMISSION_GROUPS"
                :key="group.id"
                class="perm-group-card"
              >
                <div class="perm-group-header">
                  <div class="group-title">
                    <AdminIcon :name="group.icon" :size="16" />
                    <strong>{{ group.label }}</strong>
                    <span class="group-count">({{ countGroupSelected(group) }}/{{ group.permissions.length }})</span>
                  </div>
                  <button
                    type="button"
                    class="group-toggle-btn"
                    @click="toggleGroup(group)"
                  >
                    {{ isGroupAllSelected(group) ? 'Bỏ chọn nhóm' : 'Chọn cả nhóm' }}
                  </button>
                </div>

                <div class="perm-items-grid">
                  <label
                    v-for="perm in group.permissions"
                    :key="perm.key"
                    class="perm-item-label"
                    :class="{ 'item-checked': isPermSelected(perm.key), 'perm-sensitive': isSensitivePerm(perm.key) }"
                  >
                    <input
                      type="checkbox"
                      :checked="isPermSelected(perm.key)"
                      @change="togglePerm(perm.key)"
                    />
                    <div class="perm-item-content">
                      <div class="perm-item-title-row">
                        <span class="perm-title">{{ perm.label }}</span>
                        <span v-if="isSensitivePerm(perm.key)" class="badge-sensitive">Quyền nhạy cảm</span>
                      </div>
                      <span class="perm-desc">{{ perm.desc }}</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="adm-modal-foot">
            <button type="button" class="adm-btn adm-btn-ghost" @click="permissionModalUser = null">Hủy Bỏ</button>
            <button type="submit" class="adm-btn adm-btn-gold" :disabled="busy">
              <AdminIcon name="check" :size="16" />
              <span>{{ busy ? 'Đang Lưu...' : 'Lưu Cấu Hình Phân Quyền' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Giám Sát Trực Tuyến & Vị Trí Nhân Sự -->
    <div v-if="showOnlineMonitorModal" class="adm-modal-backdrop" @click.self="showOnlineMonitorModal = false">
      <div class="adm-modal monitor-modal">
        <div class="adm-modal-head">
          <div>
            <h3>Giám Sát Nhân Sự Trực Tuyến &amp; Vị Trí Hoạt Động</h3>
            <p>Theo dõi thời gian thực ai đang online, vị trí địa lý (IP/Tỉnh thành), thiết bị và trang web đang truy cập</p>
          </div>
          <button type="button" class="adm-modal-close" @click="showOnlineMonitorModal = false">
            <AdminIcon name="x" :size="18" />
          </button>
        </div>

        <div class="adm-modal-body monitor-modal-body">
          <div class="monitor-summary-bar">
            <div class="m-stat">
              <span class="live-pulse-dot"></span>
              <strong>{{ onlineCount }}</strong> tài khoản đang online
            </div>
            <div class="m-stat">
              <span class="away-dot"></span>
              <strong>{{ awayCount }}</strong> tài khoản tạm vắng (&lt; 15p)
            </div>
            <button type="button" class="adm-btn adm-btn-sm adm-btn-ghost" @click="fetchOnlineUsers">
              <AdminIcon name="sync" :size="13" />
              <span>Cập nhật ngay</span>
            </button>
          </div>

          <div class="online-cards-grid">
            <div
              v-for="user in onlineUsersList"
              :key="user.id"
              :class="['online-user-card', user.status === 'ONLINE' ? 'card-status-online' : (user.status === 'AWAY' ? 'card-status-away' : 'card-status-offline')]"
            >
              <div class="card-head-row">
                <div class="c-user-info">
                  <div class="c-avatar" :class="getAvatarClass(user.role)">
                    {{ getInitials(user.fullName || user.username) }}
                  </div>
                  <div>
                    <strong class="c-name">{{ user.fullName || user.username }}</strong>
                    <div class="c-role-row">
                      <span class="c-username">@{{ user.username }}</span>
                      <span class="c-role-tag">{{ formatUserRole(user.role) }}</span>
                    </div>
                  </div>
                </div>

                <div class="c-status-badge">
                  <span :class="['dot-indicator', user.status === 'ONLINE' ? 'dot-green' : (user.status === 'AWAY' ? 'dot-amber' : 'dot-gray')]"></span>
                  <span>{{ user.statusLabel }}</span>
                </div>
              </div>

              <div class="c-details-list">
                <div class="c-detail-item">
                  <span class="c-label">Vị trí địa lý:</span>
                  <span class="c-val text-gold">{{ user.city?.startsWith('🎯') ? '' : '📍 ' }}{{ formatSessionCity(user.city) }} <small v-if="user.ipAddress">({{ user.ipAddress }})</small></span>
                </div>
                <div class="c-detail-item">
                  <span class="c-label">Thiết bị &amp; Môi trường:</span>
                  <span class="c-val">💻 {{ user.deviceType }} • {{ user.browser }}</span>
                </div>
                <div class="c-detail-item">
                  <span class="c-label">Đang xem phân hệ:</span>
                  <span class="c-val text-blue">👁 <strong>{{ user.currentPageTitle || 'Trang Quản Trị' }}</strong> <small>({{ user.currentPage || '/admin' }})</small></span>
                </div>
                <div class="c-detail-item">
                  <span class="c-label">Hoạt động gần nhất:</span>
                  <span class="c-val text-muted">{{ formatTimeAgo(user.secondsAgo) }}</span>
                </div>
              </div>

              <div class="c-actions-row">
                <button
                  type="button"
                  class="adm-btn adm-btn-sm adm-btn-ghost"
                  @click="openPermissionModal(findUserById(user.id))"
                >
                  <AdminIcon name="shield" :size="13" />
                  <span>Sửa quyền tài khoản này</span>
                </button>
                <router-link
                  to="/admin/audit-logs"
                  class="adm-btn adm-btn-sm adm-btn-ghost"
                  @click="showOnlineMonitorModal = false"
                >
                  <AdminIcon name="history" :size="13" />
                  <span>Xem lịch sử thao tác</span>
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <div class="adm-modal-foot">
          <button type="button" class="adm-btn adm-btn-ghost" @click="showOnlineMonitorModal = false">Đóng</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { apiRequest } from '../../utils/api'
import { useAuthStore } from '../../stores/authStore'
import { useAdminStore } from '../../stores/adminStore'
import { PERMISSION_GROUPS, ROLE_TEMPLATES } from '../../utils/permissions'
import AdminIcon from '../../components/admin/AdminIcon.vue'

const auth = useAuthStore()
const adminStore = useAdminStore()
const currentUserId = computed(() => auth.currentUser?.id)

const users = ref([])
const searchQuery = ref('')
const statusFilter = ref('ALL') // 'ALL' | 'ONLINE' | 'PENDING' | 'ACTIVE' | 'LOCKED'
const showCreateForm = ref(false)
const busy = ref(false)
const error = ref('')
const message = ref('')
const showCreatePwd = ref(false)
const showResetPwd = ref(false)

// Theo Dõi Nhân Sự Trực Tuyến & Vị Trí
const showOnlineMonitorModal = ref(false)
const onlineUsersList = ref([])
const onlineSessionsMap = ref({})
let onlinePollingTimer = null

const fetchOnlineUsers = async () => {
  try {
    const res = await apiRequest('/admin/online-users')
    if (res.success) {
      onlineUsersList.value = res.data || []
      const map = {}
      res.data.forEach(item => {
        map[item.id] = item
      })
      onlineSessionsMap.value = map
    }
  } catch (err) {
    console.error('Lỗi khi tải phiên online:', err)
  }
}

const onlineCount = computed(() => onlineUsersList.value.filter(u => u.status === 'ONLINE').length)
const awayCount = computed(() => onlineUsersList.value.filter(u => u.status === 'AWAY').length)

const getUserSession = (user) => {
  return onlineSessionsMap.value[user.id] || null
}

const getOnlineDotClass = (user) => {
  if (!user.is_active) return 'dot-red'
  if (user.role === 'PENDING') return 'dot-amber'
  const session = getUserSession(user)
  if (session?.status === 'ONLINE') return 'dot-green dot-pulse'
  if (session?.status === 'AWAY') return 'dot-amber'
  return 'dot-gray'
}

const getOnlineTextClass = (user) => {
  if (!user.is_active) return 'text-danger'
  if (user.role === 'PENDING') return 'text-amber'
  const session = getUserSession(user)
  if (session?.status === 'ONLINE') return 'text-green'
  if (session?.status === 'AWAY') return 'text-amber'
  return 'text-muted'
}

const getOnlineStatusLabel = (user) => {
  if (!user.is_active) return 'Đã khóa'
  if (user.role === 'PENDING') return 'Chờ duyệt'
  const session = getUserSession(user)
  if (session?.status === 'ONLINE') return 'Đang Online'
  if (session?.status === 'AWAY') return `Tạm vắng (${formatTimeAgo(session.secondsAgo)})`
  return 'Ngoại tuyến'
}

const formatTimeAgo = (seconds) => {
  if (seconds === null || seconds === undefined) return 'Chưa có phiên'
  if (seconds < 60) return 'Vừa xong'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

const formatSessionCity = (city) => {
  if (!city) return 'Việt Nam'
  return String(city)
    .replace(/\bTinh Phu Tho\b/gi, 'Phú Thọ')
    .replace(/\bVinh Yen\b/gi, 'Vĩnh Yên')
    .replace(/\bHa Noi\b/gi, 'Hà Nội')
    .replace(/\bHanoi\b/gi, 'Hà Nội')
    .replace(/^Tinh\s+/i, 'Tỉnh ')
}

const findUserById = (userId) => {
  return users.value.find(u => u.id === userId) || { id: userId, username: 'Nhân viên' }
}

const getAvatarClass = (role) => {
  if (role === 'SUPER_ADMIN') return 'av-gold'
  if (role === 'SALES') return 'av-blue'
  if (role === 'INVENTORY') return 'av-green'
  return 'av-gray'
}

const form = reactive({
  username: '',
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'SALES'
})

const pwdModalUser = ref(null)
const newPassword = ref('')
const resetEmail = ref('')

const approveModalUser = ref(null)
const approveRole = ref('SALES')

const countByRole = (role) => users.value.filter(u => u.role === role).length
const pendingCount = computed(() => users.value.filter(u => u.role === 'PENDING').length)
const activeCount = computed(() => users.value.filter(u => u.is_active && u.role !== 'PENDING').length)
const lockedCount = computed(() => users.value.filter(u => !u.is_active && u.role !== 'PENDING').length)

const getInitials = (str) => {
  const s = String(str || 'TA').trim()
  const parts = s.split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return s.slice(0, 2).toUpperCase()
}

const filteredUsers = computed(() => {
  let list = users.value
  if (statusFilter.value === 'ONLINE') {
    list = list.filter(u => {
      const s = onlineSessionsMap.value[u.id]
      return s?.status === 'ONLINE'
    })
  } else if (statusFilter.value === 'PENDING') {
    list = list.filter(u => u.role === 'PENDING')
  } else if (statusFilter.value === 'ACTIVE') {
    list = list.filter(u => u.is_active && u.role !== 'PENDING')
  } else if (statusFilter.value === 'LOCKED') {
    list = list.filter(u => !u.is_active && u.role !== 'PENDING')
  }

  const kw = searchQuery.value.toLowerCase().trim()
  if (!kw) return list
  return list.filter(
    u =>
      u.username?.toLowerCase().includes(kw) ||
      u.full_name?.toLowerCase().includes(kw) ||
      u.email?.toLowerCase().includes(kw) ||
      u.phone?.includes(kw)
  )
})

const loadUsers = async () => {
  try {
    const response = await apiRequest('/admin/users')
    users.value = response.data || []
    await fetchOnlineUsers()
  } catch (err) {
    error.value = err.message || 'Không tải được danh sách tài khoản.'
  }
}

const createUser = async () => {
  const cleanUsername = form.username.trim().toLowerCase()
  if (!/^[a-z0-9._-]{3,50}$/.test(cleanUsername)) {
    error.value = 'Tên đăng nhập chỉ gồm chữ không dấu, số, dấu chấm hoặc gạch nối (3–50 ký tự, viết liền không khoảng trắng).'
    return
  }
  const cleanEmail = form.email.trim().toLowerCase()
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    error.value = 'Vui lòng cung cấp địa chỉ email hợp lệ để nhận mã OTP bảo mật.'
    return
  }
  if (form.password.length < 12) {
    error.value = `Mật khẩu cần ít nhất 12 ký tự (hiện tại ${form.password.length} ký tự).`
    return
  }

  busy.value = true
  error.value = ''
  message.value = ''
  try {
    const res = await apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        username: cleanUsername,
        fullName: form.fullName.trim(),
        email: cleanEmail,
        phone: form.phone.trim(),
        password: form.password,
        role: form.role
      })
    })
    form.username = ''
    form.fullName = ''
    form.email = ''
    form.phone = ''
    form.password = ''
    form.role = 'SALES'
    showCreatePwd.value = false
    showCreateForm.value = false
    message.value = `Đã tạo tài khoản "${res.data?.username || cleanUsername}" thành công.`
    await loadUsers()
  } catch (err) {
    error.value = err.message || 'Không tạo được tài khoản.'
  } finally {
    busy.value = false
  }
}

const changeRole = async (user, role) => {
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    const response = await apiRequest(`/admin/users/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    })
    Object.assign(user, response.data)
    if (response.newToken) auth.updateSessionToken(response.newToken, response.data)
    message.value = `Đã cập nhật phân quyền cho tài khoản ${user.username}.`
  } catch (err) {
    error.value = err.message || 'Không cập nhật được vai trò.'
    await loadUsers()
  } finally {
    busy.value = false
  }
}

const openApproveModal = (user) => {
  approveModalUser.value = user
  approveRole.value = user.role !== 'PENDING' ? user.role : 'SALES'
  error.value = ''
  message.value = ''
}

const submitApprove = async () => {
  if (!approveModalUser.value) return
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    const response = await apiRequest(`/admin/users/${approveModalUser.value.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: approveRole.value, isActive: true })
    })
    Object.assign(approveModalUser.value, response.data)
    message.value = `Đã phê duyệt và kích hoạt quyền ${approveRole.value} cho nhân sự ${approveModalUser.value.username} thành công.`
    approveModalUser.value = null
    await loadUsers()
  } catch (err) {
    error.value = err.message || 'Không thể phê duyệt tài khoản.'
  } finally {
    busy.value = false
  }
}

const toggleUserActive = async (user, nextActive) => {
  const actionLabel = nextActive ? 'Mở khóa' : 'Khóa'
  const ok = await adminStore.confirm({
    title: `${actionLabel} tài khoản nhân sự`,
    message: `Anh có chắc chắn muốn ${actionLabel.toLowerCase()} quyền truy cập của tài khoản "${user.username}" (${user.full_name || 'Nhân viên'})?`,
    confirmText: `Đồng ý ${actionLabel.toLowerCase()}`,
    cancelText: 'Hủy bỏ',
    type: nextActive ? 'info' : 'danger'
  })
  if (!ok) return
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    const response = await apiRequest(`/admin/users/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: nextActive })
    })
    Object.assign(user, response.data)
    message.value = `Đã ${actionLabel.toLowerCase()} tài khoản ${user.username}.`
  } catch (err) {
    error.value = err.message || `Không thể ${actionLabel.toLowerCase()} tài khoản.`
  } finally {
    busy.value = false
  }
}

const deleteUser = async (user) => {
  const isPending = user.role === 'PENDING'
  const actionName = isPending ? 'Từ chối hồ sơ đăng ký' : 'Xóa tài khoản'
  const ok = await adminStore.confirm({
    title: `${actionName} nhân sự`,
    message: `Anh có chắc chắn muốn ${actionName.toLowerCase()} của tài khoản "${user.username}" (${user.full_name || 'Nhân viên'})? Thao tác này sẽ xóa vĩnh viễn khỏi hệ thống.`,
    confirmText: `Đồng ý ${actionName.toLowerCase()}`,
    cancelText: 'Hủy bỏ',
    type: 'danger'
  })
  if (!ok) return
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    await apiRequest(`/admin/users/${user.id}`, {
      method: 'DELETE'
    })
    message.value = `Đã ${actionName.toLowerCase()} "${user.username}" thành công.`
    await loadUsers()
  } catch (err) {
    error.value = err.message || `Không thể ${actionName.toLowerCase()}.`
  } finally {
    busy.value = false
  }
}

const openPasswordReset = (user) => {
  pwdModalUser.value = user
  resetEmail.value = user.email || ''
  newPassword.value = ''
  showResetPwd.value = false
  error.value = ''
  message.value = ''
}

const submitPasswordReset = async () => {
  if (!pwdModalUser.value) return
  const cleanEmail = resetEmail.value.trim().toLowerCase()
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    error.value = 'Địa chỉ email nhận mã OTP không hợp lệ.'
    return
  }
  if (!newPassword.value && cleanEmail === (pwdModalUser.value.email || '').toLowerCase()) {
    error.value = 'Vui lòng nhập mật khẩu mới hoặc thay đổi email nhận mã OTP.'
    return
  }
  if (newPassword.value && newPassword.value.length < 12) {
    error.value = 'Mật khẩu mới phải từ 12 ký tự trở lên.'
    return
  }

  busy.value = true
  error.value = ''
  message.value = ''
  try {
    const payload = {}
    if (newPassword.value) payload.password = newPassword.value
    if (cleanEmail !== (pwdModalUser.value.email || '').toLowerCase()) {
      payload.email = cleanEmail || null
    }

    const response = await apiRequest(`/admin/users/${pwdModalUser.value.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })
    if (response.newToken) auth.updateSessionToken(response.newToken, response.data)
    Object.assign(pwdModalUser.value, response.data)
    message.value = `Đã cập nhật bảo mật cho tài khoản ${pwdModalUser.value.username} thành công.`
    pwdModalUser.value = null
    newPassword.value = ''
    resetEmail.value = ''
    await loadUsers()
  } catch (err) {
    error.value = err.message || 'Không cập nhật được thông tin bảo mật.'
  } finally {
    busy.value = false
  }
}

// Phân Quyền Sâu Từng Tài Khoản
const permissionModalUser = ref(null)
const selectedRole = ref('SALES')
const selectedPermissions = ref([])

const openPermissionModal = (user) => {
  permissionModalUser.value = user
  selectedRole.value = user.role || 'SALES'
  if (user.role === 'SUPER_ADMIN') {
    selectedPermissions.value = ['*']
  } else if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    selectedPermissions.value = [...user.permissions]
  } else {
    selectedPermissions.value = [...(ROLE_TEMPLATES[user.role] || [])]
  }
  error.value = ''
  message.value = ''
}

const applyRoleTemplate = (role) => {
  selectedRole.value = role
  if (role === 'SUPER_ADMIN') {
    selectedPermissions.value = ['*']
  } else {
    selectedPermissions.value = [...(ROLE_TEMPLATES[role] || [])]
  }
}

const getAllPermissionKeys = () => {
  const keys = []
  PERMISSION_GROUPS.forEach(g => {
    g.permissions.forEach(p => keys.push(p.key))
  })
  return keys
}

const selectAllPermissions = () => {
  selectedPermissions.value = getAllPermissionKeys()
  selectedRole.value = 'CUSTOM'
}

const deselectAllPermissions = () => {
  selectedPermissions.value = []
  selectedRole.value = 'CUSTOM'
}

const isPermSelected = (key) => {
  if (selectedPermissions.value.includes('*')) return true
  return selectedPermissions.value.includes(key)
}

const togglePerm = (key) => {
  if (selectedPermissions.value.includes('*')) {
    selectedPermissions.value = getAllPermissionKeys().filter(k => k !== key)
    selectedRole.value = 'CUSTOM'
    return
  }
  const idx = selectedPermissions.value.indexOf(key)
  if (idx > -1) {
    selectedPermissions.value.splice(idx, 1)
  } else {
    selectedPermissions.value.push(key)
  }
  selectedRole.value = 'CUSTOM'
}

const countGroupSelected = (group) => {
  if (selectedPermissions.value.includes('*')) return group.permissions.length
  return group.permissions.filter(p => selectedPermissions.value.includes(p.key)).length
}

const isGroupAllSelected = (group) => {
  if (selectedPermissions.value.includes('*')) return true
  return group.permissions.every(p => selectedPermissions.value.includes(p.key))
}

const toggleGroup = (group) => {
  const groupKeys = group.permissions.map(p => p.key)
  if (selectedPermissions.value.includes('*')) {
    selectedPermissions.value = getAllPermissionKeys().filter(k => !groupKeys.includes(k))
    selectedRole.value = 'CUSTOM'
    return
  }
  if (isGroupAllSelected(group)) {
    selectedPermissions.value = selectedPermissions.value.filter(k => !groupKeys.includes(k))
  } else {
    groupKeys.forEach(k => {
      if (!selectedPermissions.value.includes(k)) selectedPermissions.value.push(k)
    })
  }
  selectedRole.value = 'CUSTOM'
}

const isSensitivePerm = (key) => {
  const sensitiveKeys = [
    'products.price_edit',
    'orders.delete',
    'leads.delete',
    'products.delete',
    'combos.delete',
    'tradeins.delete',
    'users.permissions',
    'users.delete'
  ]
  return sensitiveKeys.includes(key)
}

const submitPermissions = async () => {
  if (!permissionModalUser.value) return
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    const res = await apiRequest(`/admin/users/${permissionModalUser.value.id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({
        role: selectedRole.value,
        permissions: selectedPermissions.value
      })
    })
    Object.assign(permissionModalUser.value, res.data)
    if (res.newToken && permissionModalUser.value.id === currentUserId.value) {
      auth.updateSessionToken(res.newToken, res.data)
    }
    message.value = res.message || `Đã cập nhật phân quyền cho tài khoản ${permissionModalUser.value.username}.`
    permissionModalUser.value = null
    await loadUsers()
  } catch (err) {
    error.value = err.message || 'Không cập nhật được phân quyền.'
  } finally {
    busy.value = false
  }
}

const formatUserRole = (role) => {
  const map = {
    SUPER_ADMIN: 'Quản trị cấp cao',
    SALES: 'Kinh doanh',
    INVENTORY: 'Quản lý kho',
    CUSTOM: 'Tùy chỉnh',
    PENDING: 'Chờ duyệt'
  }
  return map[role] || role || 'Nhân viên'
}

const getRoleBadgeClass = (role) => {
  if (role === 'SUPER_ADMIN') return 'role-gold'
  if (role === 'SALES') return 'role-blue'
  if (role === 'INVENTORY') return 'role-green'
  if (role === 'CUSTOM') return 'role-purple'
  return 'role-amber'
}

const getPermsCountLabel = (user) => {
  if (user.role === 'SUPER_ADMIN' || user.permissions?.includes('*')) return 'Toàn quyền (*)'
  if (Array.isArray(user.permissions) && user.permissions.length > 0) return `${user.permissions.length} quyền`
  const defCount = (ROLE_TEMPLATES[user.role] || []).length
  return defCount > 0 ? `${defCount} quyền` : 'Chưa cấp quyền'
}

const getPermsTooltip = (user) => {
  if (user.role === 'SUPER_ADMIN' || user.permissions?.includes('*')) return 'Toàn quyền thao tác trên mọi phân hệ'
  if (Array.isArray(user.permissions) && user.permissions.length > 0) return user.permissions.join(', ')
  return 'Sử dụng bộ quyền mặc định theo vai trò'
}

onMounted(() => {
  loadUsers()
  onlinePollingTimer = setInterval(fetchOnlineUsers, 15000)
})

onUnmounted(() => {
  if (onlinePollingTimer) clearInterval(onlinePollingTimer)
})
</script>

<style scoped>
.th-right {
  text-align: right;
}

.pending-notice-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 12px;
  color: #92400e;
  font-size: 0.85rem;
  line-height: 1.45;
  box-shadow: 0 4px 14px -4px rgba(245, 158, 11, 0.15);
}

.feedback-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.84rem;
  font-weight: 700;
}

.feedback-banner.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.feedback-banner.success {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #15803d;
}

.card-highlight-amber {
  border-color: #fde68a !important;
  background: #fffdf5 !important;
}

.text-amber {
  color: #d97706 !important;
}

.filter-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chip {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.filter-chip:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.filter-chip.active {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}

.filter-chip.chip-amber.active {
  background: #d97706;
  border-color: #d97706;
  color: #ffffff;
}

.create-user-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.pwd-box {
  position: relative;
  display: flex;
  align-items: center;
}

.pwd-box input {
  padding-right: 42px;
}

.pwd-eye {
  position: absolute;
  right: 8px;
  background: transparent;
  color: #64748b;
  padding: 4px;
  display: flex;
}

.pwd-eye:hover {
  color: #0f172a;
}

.create-foot {
  display: flex;
  justify-content: flex-end;
}

.user-id-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.u-avatar {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-size: 0.76rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-pending {
  background: #fffbeb !important;
  border-color: #fde68a !important;
  color: #d97706 !important;
}

.u-login {
  display: block;
  color: #0f172a;
  font-size: 0.86rem;
}

.you-tag {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 700;
  color: #1d4ed8;
}

.pending-tag {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 4px;
  padding: 1px 5px;
}

.row-pending-highlight {
  background: #fffdf5;
}

.action-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  white-space: nowrap;
}

.user-email-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  border-radius: 6px;
  font-size: 0.8rem;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-weight: 600;
}

.adm-status-amber {
  background: #fffbeb !important;
  border-color: #fde68a !important;
  color: #b45309 !important;
}

.adm-badge-amber {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.info-callout {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 0.82rem;
  color: #334155;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
}

.pwd-modal {
  max-width: 480px;
}

/* User Role Cell & Badge */
.user-role-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.role-pill-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.role-pill {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.role-gold { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
.role-blue { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
.role-green { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.role-purple { background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
.role-amber { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }

.perms-count-pill {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  background: #f1f5f9;
  color: #475569;
  padding: 2px 6px;
  border-radius: 4px;
}

.perm-edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
  width: fit-content;
}

.perm-edit-btn:hover:not(:disabled) {
  border-color: #eab308;
  color: #b45309;
  background: #fefce8;
}

.perm-quick-btn {
  color: #6366f1 !important;
}

.perm-quick-btn:hover {
  background: #eef2ff !important;
  color: #4f46e5 !important;
}

/* Modal Phân Quyền Sâu */
.perm-modal {
  max-width: 860px;
  width: 95vw;
}

.perm-modal-body {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 6px;
}

.perm-template-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.template-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 10px;
}

.template-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.t-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s;
}

.t-btn:hover {
  border-color: #94a3b8;
  background: #f1f5f9;
}

.t-btn.active.t-gold {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #92400e;
  font-weight: 700;
}

.t-btn.active.t-blue {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #1e40af;
  font-weight: 700;
}

.t-btn.active.t-green {
  background: #dcfce7;
  border-color: #22c55e;
  color: #166534;
  font-weight: 700;
}

.t-btn.active.t-purple {
  background: #f3e8ff;
  border-color: #a855f7;
  color: #6b21a8;
  font-weight: 700;
}

.perm-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2e8f0;
}

.perm-stats {
  font-size: 0.84rem;
  color: #334155;
}

.perm-quick-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.adm-link-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
}

.adm-link-btn:hover {
  text-decoration: underline;
}

.adm-link-btn.text-danger {
  color: #dc2626;
}

.sep {
  color: #cbd5e1;
}

.super-admin-notice {
  display: flex;
  gap: 14px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: 16px 20px;
  color: #92400e;
}

.super-admin-notice p {
  margin: 4px 0 0;
  font-size: 0.82rem;
  line-height: 1.5;
  color: #78350f;
}

.perm-groups-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.perm-group-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
}

.perm-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.86rem;
  color: #0f172a;
}

.group-count {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.group-toggle-btn {
  background: none;
  border: none;
  font-size: 0.74rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

.group-toggle-btn:hover {
  color: #0f172a;
  text-decoration: underline;
}

.perm-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
  padding: 12px 14px;
}

.perm-item-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.12s;
  user-select: none;
}

.perm-item-label:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.perm-item-label.item-checked {
  background: #f0fdf4;
  border-color: #86efac;
}

.perm-item-label.perm-sensitive.item-checked {
  background: #fffdf5;
  border-color: #fde68a;
}

.perm-item-label input[type="checkbox"] {
  margin-top: 3px;
  cursor: pointer;
  accent-color: #16a34a;
}

.perm-item-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.35;
}

.perm-item-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.perm-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e293b;
}

.badge-sensitive {
  font-size: 0.65rem;
  font-weight: 700;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  padding: 1px 4px;
  border-radius: 4px;
}

.perm-desc {
  font-size: 0.72rem;
  color: #64748b;
}

/* KPI 5 Cột */
.kpi-grid-5 {
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)) !important;
}

.card-online-kpi:hover {
  border-color: #22c55e !important;
  box-shadow: 0 6px 20px -4px rgba(34, 197, 94, 0.2) !important;
}

/* Nút Giám Sát */
.btn-monitor {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #f0fdf4 !important;
  border-color: #bbf7d0 !important;
  color: #15803d !important;
  font-weight: 700 !important;
}

.btn-monitor:hover {
  background: #dcfce7 !important;
  border-color: #86efac !important;
}

/* Chấm xanh nhấp nháy Pulse */
.live-pulse-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background-color: #22c55e;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  animation: livePulse 1.8s infinite;
  vertical-align: middle;
}

.live-pulse-dot-sm {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #22c55e;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  animation: livePulse 1.8s infinite;
  margin-right: 4px;
}

@keyframes livePulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

.chip-green.active {
  background: #15803d !important;
  border-color: #15803d !important;
  color: #ffffff !important;
}

/* User Status Cell Trong Bảng */
.user-status-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-indicator-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-green { background-color: #22c55e; }
.dot-amber { background-color: #f59e0b; }
.dot-red { background-color: #ef4444; }
.dot-gray { background-color: #94a3b8; }

.dot-pulse {
  animation: livePulse 1.8s infinite;
}

.status-title {
  font-size: 0.8rem;
}

.session-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.25;
}

.session-loc {
  font-size: 0.72rem;
  color: #475569;
  font-weight: 500;
}

.session-page {
  font-size: 0.72rem;
  color: #2563eb;
  font-weight: 600;
}

.locked-hint {
  font-size: 0.72rem;
  color: #dc2626;
}

.offline-hint {
  font-size: 0.72rem;
  color: #94a3b8;
}

/* Modal Giám Sát Trực Tuyến */
.monitor-modal {
  max-width: 860px;
  width: 95vw;
}

.monitor-modal-body {
  max-height: 72vh;
  overflow-y: auto;
}

.monitor-summary-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 16px;
}

.m-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.84rem;
  color: #334155;
}

.away-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #f59e0b;
}

.online-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 14px;
}

.online-user-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.15s;
}

.card-status-online {
  border-color: #86efac;
  background: #fcfdfc;
  box-shadow: 0 4px 12px -2px rgba(34, 197, 94, 0.12);
}

.card-status-away {
  border-color: #fde68a;
  background: #fffdf9;
}

.card-status-offline {
  border-color: #e2e8f0;
  opacity: 0.8;
}

.card-head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.c-user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.c-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.c-name {
  font-size: 0.9rem;
  color: #0f172a;
  display: block;
}

.c-role-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.c-username {
  font-size: 0.72rem;
  color: #64748b;
  font-family: monospace;
}

.c-role-tag {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #475569;
}

.c-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.dot-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.c-details-list {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.78rem;
}

.c-detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.c-detail-item .c-label {
  color: #64748b;
  font-weight: 600;
  flex-shrink: 0;
}

.c-detail-item .c-val {
  color: #1e293b;
  text-align: right;
  word-break: break-word;
}

.c-actions-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: auto;
}
</style>
