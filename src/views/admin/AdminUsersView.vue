<template>
  <div class="adm-page">
    <!-- Đầu trang Phân Quyền & Nhân Sự -->
    <div class="adm-page-head">
      <div>
        <h1 class="adm-page-title">Tài Khoản Nhân Sự &amp; Phân Quyền</h1>
        <p class="adm-page-sub">
          Cấp tài khoản đăng nhập cho chuyên viên kinh doanh hoặc thủ kho, phân quyền truy cập, khóa tạm thời hoặc đặt lại mật khẩu bảo mật (&ge; 12 ký tự).
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

    <!-- 3 Thẻ Cấp Độ Phân Quyền -->
    <div class="adm-kpi-grid cols-3">
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

    <!-- Khối Tạo Tài Khoản Nhân Sự Mới -->
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

    <!-- Danh sách Tài khoản hiện có -->
    <div class="adm-card">
      <div class="adm-toolbar">
        <div class="adm-toolbar-row">
          <div class="adm-search-box">
            <AdminIcon name="search" :size="16" class="search-ico" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Tìm theo tài khoản, họ tên hoặc số điện thoại..."
            />
          </div>
          <span class="adm-hint">Tổng cộng {{ filteredUsers.length }} tài khoản trong hệ thống</span>
        </div>
      </div>

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>Tài Khoản</th>
              <th>Họ Tên Nhân Sự</th>
              <th>Số Điện Thoại</th>
              <th>Cấp Độ Phân Quyền</th>
              <th>Trạng Thái</th>
              <th class="th-right">Thao Tác Bảo Mật</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div class="user-id-cell">
                  <div class="u-avatar">{{ getInitials(user.full_name || user.username) }}</div>
                  <div>
                    <strong class="u-login">{{ user.username }}</strong>
                    <span v-if="user.id === currentUserId" class="you-tag">Đang đăng nhập</span>
                  </div>
                </div>
              </td>
              <td>{{ user.full_name }}</td>
              <td>{{ user.phone || '—' }}</td>
              <td>
                <select
                  class="adm-status-select adm-status-blue"
                  :value="user.role"
                  :disabled="busy || !user.is_active"
                  @change="changeRole(user, $event.target.value)"
                >
                  <option value="SUPER_ADMIN">Quản trị cấp cao</option>
                  <option value="SALES">Chuyên viên kinh doanh</option>
                  <option value="INVENTORY">Quản lý kho</option>
                </select>
              </td>
              <td>
                <span :class="['adm-badge', user.is_active ? 'adm-badge-green' : 'adm-badge-red']">
                  {{ user.is_active ? 'Đang hoạt động' : 'Đã khóa' }}
                </span>
              </td>
              <td>
                <div class="action-group">
                  <button
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-ghost"
                    :disabled="busy"
                    @click="openPasswordReset(user)"
                  >
                    <AdminIcon name="key" :size="14" />
                    <span>Đổi mật khẩu</span>
                  </button>

                  <button
                    v-if="user.is_active && user.id !== currentUserId"
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-danger"
                    :disabled="busy"
                    @click="toggleUserActive(user, false)"
                  >
                    <AdminIcon name="lock" :size="14" />
                    <span>Khóa</span>
                  </button>

                  <button
                    v-else-if="!user.is_active"
                    type="button"
                    class="adm-btn adm-btn-sm adm-btn-export"
                    :disabled="busy"
                    @click="toggleUserActive(user, true)"
                  >
                    <AdminIcon name="check" :size="14" />
                    <span>Mở khóa</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredUsers.length">
              <td colspan="6" class="adm-empty">Không tìm thấy tài khoản nhân sự phù hợp.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Đặt Lại Mật Khẩu -->
    <div v-if="pwdModalUser" class="adm-modal-backdrop" @click.self="pwdModalUser = null">
      <div class="adm-modal pwd-modal">
        <div class="adm-modal-head">
          <div>
            <h3>Cấp Lại Mật Khẩu: {{ pwdModalUser.username }}</h3>
            <p>Mật khẩu mới bắt buộc từ 12 ký tự trở lên để đảm bảo an toàn</p>
          </div>
          <button type="button" class="adm-modal-close" @click="pwdModalUser = null">
            <AdminIcon name="x" :size="18" />
          </button>
        </div>

        <form @submit.prevent="submitPasswordReset">
          <div class="adm-modal-body">
            <div class="adm-field">
              <label>Mật khẩu mới (&ge; 12 ký tự)</label>
              <div class="pwd-box">
                <input
                  :type="showResetPwd ? 'text' : 'password'"
                  v-model="newPassword"
                  minlength="12"
                  maxlength="128"
                  required
                  placeholder="Nhập mật khẩu mới..."
                  autocomplete="new-password"
                />
                <button type="button" class="pwd-eye" @click="showResetPwd = !showResetPwd">
                  <AdminIcon :name="showResetPwd ? 'eye-off' : 'eye'" :size="16" />
                </button>
              </div>
              <span class="adm-hint">Đã nhập: {{ newPassword.length }}/12+ ký tự</span>
            </div>
          </div>

          <div class="adm-modal-foot">
            <button type="button" class="adm-btn adm-btn-ghost" @click="pwdModalUser = null">Hủy</button>
            <button type="submit" class="adm-btn adm-btn-gold" :disabled="busy">
              <AdminIcon name="check" :size="16" />
              <span>Cập Nhật Mật Khẩu</span>
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
import AdminIcon from '../../components/admin/AdminIcon.vue'

const auth = useAuthStore()
const currentUserId = computed(() => auth.currentUser?.id)

const users = ref([])
const searchQuery = ref('')
const showCreateForm = ref(true)
const busy = ref(false)
const error = ref('')
const message = ref('')
const showCreatePwd = ref(false)
const showResetPwd = ref(false)

const form = reactive({
  username: '',
  fullName: '',
  phone: '',
  password: '',
  role: 'SALES'
})

const pwdModalUser = ref(null)
const newPassword = ref('')

const countByRole = (role) => users.value.filter(u => u.role === role).length

const getInitials = (str) => {
  const s = String(str || 'TA').trim()
  const parts = s.split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return s.slice(0, 2).toUpperCase()
}

const filteredUsers = computed(() => {
  const kw = searchQuery.value.toLowerCase().trim()
  if (!kw) return users.value
  return users.value.filter(
    u =>
      u.username?.toLowerCase().includes(kw) ||
      u.full_name?.toLowerCase().includes(kw) ||
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
        phone: form.phone.trim(),
        password: form.password,
        role: form.role
      })
    })
    form.username = ''
    form.fullName = ''
    form.phone = ''
    form.password = ''
    form.role = 'SALES'
    showCreatePwd.value = false
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

const toggleUserActive = async (user, nextActive) => {
  const actionLabel = nextActive ? 'Mở khóa' : 'Khóa'
  if (!confirm(`${actionLabel} tài khoản ${user.username}?`)) return
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

const openPasswordReset = (user) => {
  pwdModalUser.value = user
  newPassword.value = ''
  showResetPwd.value = false
  error.value = ''
  message.value = ''
}

const submitPasswordReset = async () => {
  if (!pwdModalUser.value || newPassword.value.length < 12) {
    error.value = 'Mật khẩu phải từ 12 ký tự trở lên.'
    return
  }
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    const response = await apiRequest(`/admin/users/${pwdModalUser.value.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ password: newPassword.value })
    })
    if (response.newToken) auth.updateSessionToken(response.newToken, response.data)
    message.value = `Đã đổi mật khẩu cho tài khoản ${pwdModalUser.value.username}.`
    pwdModalUser.value = null
    newPassword.value = ''
  } catch (err) {
    error.value = err.message || 'Không đổi được mật khẩu.'
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
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
}

.feedback-banner.success {
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(16, 185, 129, 0.35);
  color: #6ee7b7;
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
  color: #94a3b8;
  padding: 4px;
  display: flex;
}

.pwd-eye:hover {
  color: #f8fafc;
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
  background: rgba(59, 130, 246, 0.18);
  border: 1px solid rgba(59, 130, 246, 0.32);
  color: #93c5fd;
  font-size: 0.76rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.u-login {
  display: block;
  color: #f8fafc;
  font-size: 0.86rem;
}

.you-tag {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 700;
  color: #fcb728;
}

.action-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  white-space: nowrap;
}

.pwd-modal {
  max-width: 460px;
}
</style>
