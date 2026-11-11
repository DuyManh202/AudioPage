<template>
  <section class="users-view">
    <header class="panel-box">
      <h2>Quản lý tài khoản nhân viên</h2>
      <p>Tạo tài khoản kinh doanh hoặc quản lý kho, phân quyền, khóa/mở khóa hoặc cấp lại mật khẩu (tối thiểu 12 ký tự).</p>
    </header>

    <form class="panel-box user-form" @submit.prevent="createUser">
      <h3>Tạo tài khoản mới</h3>
      <div class="form-grid">
        <label>
          Tên đăng nhập
          <input
            v-model="form.username"
            required
            minlength="3"
            maxlength="50"
            autocomplete="off"
            placeholder="vd: dmanh hoặc sales_hanoi"
          />
          <span class="field-hint">Viết liền không dấu, tự chuyển thành chữ thường</span>
        </label>
        <label>
          Họ tên
          <input v-model="form.fullName" required maxlength="100" placeholder="vd: Nguyễn Duy Mạnh" />
        </label>
        <label>
          Số điện thoại
          <input v-model="form.phone" required type="tel" placeholder="vd: 0971356791" />
        </label>
        <label>
          Mật khẩu tạm (từ 12 ký tự)
          <div class="pwd-input-wrap">
            <input
              v-model="form.password"
              required
              :type="showCreatePwd ? 'text' : 'password'"
              minlength="12"
              maxlength="128"
              autocomplete="new-password"
              placeholder="Ít nhất 12 ký tự..."
            />
            <button type="button" class="pwd-eye-btn" @click="showCreatePwd = !showCreatePwd" title="Ẩn/hiện mật khẩu">
              {{ showCreatePwd ? 'Ẩn' : 'Hiện' }}
            </button>
          </div>
          <span class="field-hint">Đã nhập: {{ form.password.length }}/12+ ký tự</span>
        </label>
        <label>
          Vai trò
          <select v-model="form.role">
            <option value="SALES">Nhân viên kinh doanh</option>
            <option value="INVENTORY">Quản lý kho</option>
            <option value="SUPER_ADMIN">Quản trị viên cấp cao</option>
          </select>
        </label>
      </div>
      <p v-if="error" class="error-banner" role="alert">⚠️ {{ error }}</p>
      <p v-if="message" class="message-banner" role="status">✓ {{ message }}</p>
      <button class="btn-primary" type="submit" :disabled="busy">{{ busy ? '⏳ Đang lưu…' : 'Tạo tài khoản' }}</button>
    </form>

    <div class="panel-box table-wrap">
      <div class="list-head">
        <h3>Tài khoản hiện có ({{ users.length }})</h3>
        <button type="button" class="btn-reload" :disabled="busy" @click="loadUsers">🔄 Tải lại</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Tài khoản</th>
            <th>Họ tên</th>
            <th>Điện thoại</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td><strong>{{ user.username }}</strong></td>
            <td>{{ user.full_name }}</td>
            <td>{{ user.phone }}</td>
            <td>
              <select :value="user.role" :disabled="busy || !user.is_active" @change="changeRole(user, $event.target.value)">
                <option value="SUPER_ADMIN">Quản trị cấp cao</option>
                <option value="SALES">Kinh doanh</option>
                <option value="INVENTORY">Quản lý kho</option>
              </select>
            </td>
            <td>
              <span :class="['state-pill', user.is_active ? 'active-pill' : 'locked-pill']">
                {{ user.is_active ? 'Đang hoạt động' : 'Đã khóa' }}
              </span>
            </td>
            <td>
              <div class="user-actions">
                <button
                  type="button"
                  class="btn-reset-pwd"
                  :disabled="busy"
                  @click="openPasswordReset(user)"
                >
                  🔑 Đổi MK
                </button>
                <button
                  v-if="user.is_active && user.id !== currentUserId"
                  type="button"
                  class="btn-disable"
                  :disabled="busy"
                  @click="toggleUserActive(user, false)"
                >
                  Khóa
                </button>
                <button
                  v-else-if="!user.is_active"
                  type="button"
                  class="btn-enable"
                  :disabled="busy"
                  @click="toggleUserActive(user, true)"
                >
                  Mở khóa
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!users.length">
            <td colspan="6">Chưa có dữ liệu tài khoản.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="pwdModalUser" class="modal-backdrop" @click.self="pwdModalUser = null">
      <div class="modal-window">
        <h3>Đặt lại mật khẩu: {{ pwdModalUser.username }}</h3>
        <p class="sub-note">Mật khẩu mới yêu cầu tối thiểu 12 ký tự.</p>
        <form @submit.prevent="submitPasswordReset" class="pwd-form">
          <div class="pwd-input-wrap">
            <input
              :type="showResetPwd ? 'text' : 'password'"
              v-model="newPassword"
              minlength="12"
              maxlength="128"
              required
              placeholder="Nhập mật khẩu mới (>= 12 ký tự)..."
              autocomplete="new-password"
            />
            <button type="button" class="pwd-eye-btn" @click="showResetPwd = !showResetPwd">
              {{ showResetPwd ? 'Ẩn' : 'Hiện' }}
            </button>
          </div>
          <div class="pwd-actions">
            <button type="button" class="btn-outline" @click="pwdModalUser = null">Hủy</button>
            <button type="submit" class="btn-primary" :disabled="busy">Cập nhật mật khẩu</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { apiRequest } from '../../utils/api'
import { useAuthStore } from '../../stores/authStore'

const auth = useAuthStore()
const currentUserId = computed(() => auth.currentUser?.id)
const users = ref([])
const busy = ref(false)
const error = ref('')
const message = ref('')
const showCreatePwd = ref(false)
const showResetPwd = ref(false)
const form = reactive({ username: '', fullName: '', phone: '', password: '', role: 'SALES' })

const pwdModalUser = ref(null)
const newPassword = ref('')

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
    const response = await apiRequest(`/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ role }) })
    Object.assign(user, response.data)
    if (response.newToken) auth.updateSessionToken(response.newToken, response.data)
    message.value = `Đã cập nhật vai trò cho ${user.username}.`
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
    const response = await apiRequest(`/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: nextActive }) })
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
.users-view { display: flex; flex-direction: column; gap: 20px; }
.panel-box {
  background: linear-gradient(180deg, rgba(22, 27, 45, 0.92), rgba(14, 18, 30, 0.96));
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-card), var(--inner-highlight);
}
h2, h3 { color: #fff; margin-bottom: 8px; }
p { color: var(--text-muted); }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin: 18px 0; }
label { display: flex; flex-direction: column; gap: 6px; color: var(--text-secondary); font-size: .85rem; font-weight: 700; }
.field-hint { font-size: 0.74rem; font-weight: 500; color: var(--text-muted); }
input, select {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-dark-900);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-sm);
  color: #fff;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
input:focus, select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(252, 183, 40, 0.14);
}
.pwd-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.pwd-input-wrap input {
  padding-right: 54px;
}
.pwd-eye-btn {
  position: absolute;
  right: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.72rem;
  font-weight: 700;
}
.list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.btn-reload {
  background: rgba(59, 130, 246, 0.14);
  border: 1px solid rgba(59, 130, 246, 0.35);
  color: #93c5fd;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
}
table { width: 100%; border-collapse: collapse; color: var(--text-secondary); }
th { text-align: left; font-size: 0.74rem; font-weight: 800; color: var(--text-subtle); text-transform: uppercase; padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
td { text-align: left; padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
tbody tr:hover { background: rgba(255, 255, 255, 0.025); }
.table-wrap { overflow-x: auto; }
.state-pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}
.active-pill { background: rgba(34, 197, 94, 0.15); color: #86efac; }
.locked-pill { background: rgba(239, 68, 68, 0.15); color: #fca5a5; }
.user-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-reset-pwd { color: #93c5fd; background: rgba(59, 130, 246, 0.14); border: 1px solid rgba(59, 130, 246, 0.35); padding: 6px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; }
.btn-disable { color: #fca5a5; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); padding: 6px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; }
.btn-enable { color: #86efac; background: rgba(34, 197, 94, 0.14); border: 1px solid rgba(34, 197, 94, 0.38); padding: 6px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; }
.error-banner {
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.38);
  color: #fca5a5;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  margin: 12px 0;
}
.message-banner {
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid rgba(34, 197, 94, 0.38);
  color: #86efac;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  margin: 12px 0;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.modal-window {
  width: 100%;
  max-width: 440px;
  padding: 24px;
  border-radius: var(--radius-lg);
}
.sub-note { font-size: 0.82rem; margin-bottom: 14px; }
.pwd-form { display: flex; flex-direction: column; gap: 14px; }
.pwd-actions { display: flex; justify-content: flex-end; gap: 10px; }

@media(max-width: 700px) {
  .table-wrap table { min-width: 750px; }
  input, select { min-height: 44px; font-size: 16px; }
}
</style>
