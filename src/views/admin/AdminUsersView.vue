<template>
  <section class="users-view">
    <header class="panel-box">
      <h2>Quản lý tài khoản nhân viên</h2>
      <p>Tạo tài khoản kinh doanh hoặc quản lý kho. Mật khẩu cần ít nhất 12 ký tự.</p>
    </header>

    <form class="panel-box user-form" @submit.prevent="createUser">
      <h3>Tạo tài khoản</h3>
      <div class="form-grid">
        <label>Tên đăng nhập<input v-model="form.username" required minlength="3" maxlength="50" autocomplete="off"></label>
        <label>Họ tên<input v-model="form.fullName" required maxlength="100"></label>
        <label>Số điện thoại<input v-model="form.phone" required type="tel"></label>
        <label>Mật khẩu tạm<input v-model="form.password" required type="password" minlength="12" maxlength="128" autocomplete="new-password"></label>
        <label>Vai trò<select v-model="form.role"><option value="SALES">Nhân viên kinh doanh</option><option value="INVENTORY">Quản lý kho</option><option value="SUPER_ADMIN">Quản trị viên cấp cao</option></select></label>
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="message" class="message" role="status">{{ message }}</p>
      <button class="btn-primary" :disabled="busy">{{ busy ? 'Đang lưu…' : 'Tạo tài khoản' }}</button>
    </form>

    <div class="panel-box table-wrap">
      <h3>Tài khoản hiện có</h3>
      <table>
        <thead><tr><th>Tài khoản</th><th>Họ tên</th><th>Điện thoại</th><th>Vai trò</th><th>Trạng thái</th><th></th></tr></thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.username }}</td><td>{{ user.full_name }}</td><td>{{ user.phone }}</td>
            <td><select :value="user.role" :disabled="busy || !user.is_active" @change="changeRole(user, $event.target.value)"><option value="SUPER_ADMIN">Quản trị cấp cao</option><option value="SALES">Kinh doanh</option><option value="INVENTORY">Quản lý kho</option></select></td>
            <td>{{ user.is_active ? 'Đang hoạt động' : 'Đã khóa' }}</td>
            <td><button v-if="user.is_active && user.id !== currentUserId" class="btn-disable" :disabled="busy" @click="disableUser(user)">Khóa</button></td>
          </tr>
          <tr v-if="!users.length"><td colspan="6">Chưa có dữ liệu tài khoản.</td></tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { apiRequest } from '../../utils/api'
import { useAuthStore } from '../../stores/authStore'

const auth = useAuthStore()
const currentUserId = auth.currentUser.id
const users = ref([])
const busy = ref(false)
const error = ref('')
const message = ref('')
const form = reactive({ username: '', fullName: '', phone: '', password: '', role: 'SALES' })

const loadUsers = async () => {
  try {
    const response = await apiRequest('/admin/users')
    users.value = response.data || []
  } catch (err) {
    error.value = err.message || 'Không tải được danh sách tài khoản.'
  }
}

const createUser = async () => {
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    await apiRequest('/admin/users', { method: 'POST', body: JSON.stringify(form) })
    form.username = ''; form.fullName = ''; form.phone = ''; form.password = ''; form.role = 'SALES'
    message.value = 'Đã tạo tài khoản.'
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
  try {
    const response = await apiRequest(`/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ role }) })
    Object.assign(user, response.data)
  } catch (err) {
    error.value = err.message || 'Không cập nhật được vai trò.'
    await loadUsers()
  } finally {
    busy.value = false
  }
}

const disableUser = async (user) => {
  if (!confirm(`Khóa tài khoản ${user.username}?`)) return
  busy.value = true
  error.value = ''
  try {
    const response = await apiRequest(`/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: false }) })
    Object.assign(user, response.data)
  } catch (err) {
    error.value = err.message || 'Không khóa được tài khoản.'
  } finally {
    busy.value = false
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.users-view { display: flex; flex-direction: column; gap: 20px; }
.panel-box { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 22px; }
h2, h3 { color: #fff; margin-bottom: 8px; }
p { color: #94a3b8; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; margin: 18px 0; }
label { display: flex; flex-direction: column; gap: 6px; color: #cbd5e1; font-size: .85rem; font-weight: 700; }
input, select { padding: 9px 10px; background: var(--bg-dark-900); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: #fff; }
table { width: 100%; border-collapse: collapse; color: #cbd5e1; }
th, td { text-align: left; padding: 11px; border-bottom: 1px solid var(--border-color); }
.table-wrap { overflow-x: auto; }
.btn-disable { color: #fca5a5; background: transparent; border: 1px solid #7f1d1d; padding: 6px 10px; border-radius: 4px; }
.error { color: #fca5a5; margin: 12px 0; }
.message { color: #86efac; margin: 12px 0; }
@media(max-width: 700px) { .table-wrap table { min-width: 750px; } }
</style>
