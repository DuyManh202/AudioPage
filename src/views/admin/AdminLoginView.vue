<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="brand-badge">TA</div>
        <h1 class="login-title">TÚ AUDIO ADMIN</h1>
        <p class="login-sub">Đăng nhập hệ thống quản lý bán hàng & kho thiết bị</p>
      </div>

      <div v-if="authStore.loginError" class="alert-error">
        <span>⚠️ {{ authStore.loginError }}</span>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Tên Đăng Nhập:</label>
          <div class="input-wrap">
            <span class="input-icon">👤</span>
            <input 
              id="username"
              type="text" 
              v-model="username" 
              placeholder="Nhập tên đăng nhập quản trị..." 
              required
              autocomplete="username"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Mật Khẩu:</label>
          <div class="input-wrap">
            <span class="input-icon">🔒</span>
            <input 
              id="password"
              :type="showPassword ? 'text' : 'password'" 
              v-model="password" 
              placeholder="Nhập mật khẩu..." 
              required
              autocomplete="current-password"
            />
            <button 
              type="button" 
              class="toggle-pwd-btn" 
              @click="showPassword = !showPassword"
              title="Ẩn/hiện mật khẩu"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </div>

        <div class="form-actions">
          <label class="remember-label">
            <input type="checkbox" v-model="rememberMe" />
            <span>Ghi nhớ phiên đăng nhập</span>
          </label>
        </div>

        <button type="submit" class="btn-primary full-width" :disabled="isLoading">
          <span v-if="isLoading">⏳ Đang Xác Thực...</span>
          <span v-else>Đăng Nhập Quản Trị</span>
        </button>
      </form>

      <div class="login-footer">
        <router-link to="/" class="back-link">
          &larr; Quay lại trang bán hàng khách hàng
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(true)
const isLoading = ref(false)

const handleLogin = async () => {
  isLoading.value = true
  authStore.loginError = ''

  const success = await authStore.login(username.value, password.value, rememberMe.value)
  isLoading.value = false

  if (success) {
    // Chuyển hướng đến trang dự định hoặc dashboard
    const redirectPath = route.query.redirect || '/admin/dashboard'
    router.push(redirectPath)
  }
}

</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 30%, #1a1e30, #0a0c14);
  padding: 20px;
}

.login-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  max-width: 440px;
  width: 100%;
  padding: 36px 32px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.7);
  position: relative;
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.brand-badge {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, var(--color-primary), #ff9800);
  color: #000;
  font-weight: 900;
  font-size: 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  box-shadow: var(--shadow-glow);
}

.login-title {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--color-primary);
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.login-sub {
  font-size: 0.85rem;
  color: #94a3b8;
}

.alert-error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  margin-bottom: 18px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #cbd5e1;
}

.input-wrap {
  display: flex;
  align-items: center;
  background: var(--bg-dark-900);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0 12px;
  transition: border-color 0.2s;
}

.input-wrap:focus-within {
  border-color: var(--color-primary);
}

.input-icon {
  font-size: 1rem;
  color: #64748b;
  margin-right: 8px;
}

.input-wrap input {
  flex: 1;
  padding: 11px 0;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 0.92rem;
  outline: none;
}

.toggle-pwd-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remember-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: #94a3b8;
  cursor: pointer;
}

.full-width {
  width: 100%;
  padding: 12px;
  font-size: 0.95rem;
}

.quick-credentials {
  margin-top: 24px;
  padding: 14px;
  background: rgba(40, 55, 252, 0.08);
  border: 1px dashed rgba(40, 55, 252, 0.35);
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
}

.quick-title {
  font-weight: 700;
  color: #93c5fd;
  margin-bottom: 6px;
}

.cred-row {
  display: flex;
  justify-content: space-between;
  color: #cbd5e1;
  margin-bottom: 10px;
}

.btn-fill-quick {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: 1px solid var(--border-color);
  padding: 6px 0;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-fill-quick:hover {
  background: var(--color-secondary);
  border-color: var(--color-secondary);
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 16px;
}

.back-link {
  color: #94a3b8;
  font-size: 0.85rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--color-primary);
}
</style>
