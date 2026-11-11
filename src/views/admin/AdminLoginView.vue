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
import { adminHomeForRole } from '../../utils/permissions'

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
    const redirectPath = route.query.redirect || adminHomeForRole(authStore.currentUser?.role)
    router.push(redirectPath)
  }
}

</script>

<style scoped>
.login-page {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 20% 20%, rgba(40, 55, 252, 0.22), transparent 45%),
    radial-gradient(circle at 80% 78%, rgba(252, 183, 40, 0.14), transparent 42%),
    #080a12;
  padding: 20px;
}

.login-card {
  background: linear-gradient(175deg, rgba(24, 29, 48, 0.94) 0%, rgba(14, 18, 30, 0.98) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-xl);
  max-width: 440px;
  width: 100%;
  padding: 38px 34px 30px;
  box-shadow: 0 28px 64px rgba(0, 0, 0, 0.78), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(18px);
  position: relative;
  animation: cardEnter 0.45s var(--ease-spring);
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 26px;
}

.brand-badge {
  width: 56px;
  height: 56px;
  background: var(--gradient-gold);
  color: #080a10;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.55rem;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  box-shadow: 0 0 28px rgba(252, 183, 40, 0.36);
}

.login-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.login-sub {
  font-size: 0.86rem;
  color: var(--text-muted);
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
  color: var(--text-secondary);
}

.input-wrap {
  display: flex;
  align-items: center;
  background: var(--bg-dark-900);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-md);
  padding: 0 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-wrap:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(252, 183, 40, 0.15);
}

.input-icon {
  font-size: 1rem;
  color: var(--text-subtle);
  margin-right: 10px;
}

.input-wrap input {
  flex: 1;
  min-width: 0;
  padding: 12px 0;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 0.92rem;
  outline: none;
}

.toggle-pwd-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
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
  color: var(--text-muted);
  cursor: pointer;
}

.full-width {
  width: 100%;
  padding: 13px;
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
  margin-top: 22px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  padding-top: 16px;
}

.back-link {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--color-primary);
}

@media (max-width: 480px) {
  .login-card {
    padding: 28px 20px 24px;
  }

  .input-wrap input {
    min-height: 44px;
    font-size: 16px;
  }
}
</style>
