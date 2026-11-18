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

    <!-- 4 Thẻ Phân Loại Trạng Thái Nhân Sự -->
    <div class="adm-kpi-grid">
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

          <!-- Bộ lọc trạng thái hồ sơ -->
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
                <select
                  :class="['adm-status-select', user.role === 'PENDING' ? 'adm-status-amber' : 'adm-status-blue']"
                  :value="user.role"
                  :disabled="busy"
                  @change="changeRole(user, $event.target.value)"
                >
                  <option value="PENDING" disabled>Chờ phân quyền...</option>
                  <option value="SALES">Chuyên viên kinh doanh</option>
                  <option value="INVENTORY">Quản lý kho</option>
                  <option value="SUPER_ADMIN">Quản trị cấp cao</option>
                </select>
              </td>
              <td>
                <span :class="['adm-badge', user.role === 'PENDING' ? 'adm-badge-amber' : (user.is_active ? 'adm-badge-green' : 'adm-badge-red')]">
                  {{ user.role === 'PENDING' ? 'Chờ duyệt' : (user.is_active ? 'Đang hoạt động' : 'Đã khóa') }}
                </span>
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
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { apiRequest } from '../../utils/api'
import { useAuthStore } from '../../stores/authStore'
import { useAdminStore } from '../../stores/adminStore'
import AdminIcon from '../../components/admin/AdminIcon.vue'

const auth = useAuthStore()
const adminStore = useAdminStore()
const currentUserId = computed(() => auth.currentUser?.id)

const users = ref([])
const searchQuery = ref('')
const statusFilter = ref('ALL') // 'ALL' | 'PENDING' | 'ACTIVE' | 'LOCKED'
const showCreateForm = ref(false)
const busy = ref(false)
const error = ref('')
const message = ref('')
const showCreatePwd = ref(false)
const showResetPwd = ref(false)

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
  if (statusFilter.value === 'PENDING') {
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

onMounted(loadUsers)
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
</style>
