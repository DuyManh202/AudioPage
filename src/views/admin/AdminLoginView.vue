<template>
  <div class="login-shell">
    <div class="login-container">
      <!-- Cột Trái: Thương hiệu & Tiêu chuẩn bảo mật -->
      <div class="login-showcase">
        <div class="showcase-top">
          <div class="brand-row">
            <div class="brand-mark">TA</div>
            <div>
              <span class="brand-name">TÚ AUDIO</span>
              <span class="brand-tag">ENTERPRISE MANAGEMENT</span>
            </div>
          </div>

          <h1 class="showcase-heading">
            Hệ Thống Điều Hành Bán Hàng &amp; Kho Thiết Bị Âm Thanh
          </h1>
          <p class="showcase-desc">
            Quản lý tập trung chiến dịch chạy Sale, cấu hình gói dàn karaoke, lịch hẹn thử loa tận nhà và đơn hàng vận chuyển toàn miền Bắc trên nền tảng PostgreSQL thời gian thực.
          </p>
        </div>

        <div class="showcase-features">
          <div class="feat-item">
            <div class="feat-ico"><AdminIcon name="database" :size="18" /></div>
            <div>
              <strong>Đồng Bộ Trực Tiếp Aiven PostgreSQL</strong>
              <span>Cập nhật giá Sale, tồn kho và video test âm tức thì ngoài trang khách.</span>
            </div>
          </div>
          <div class="feat-item">
            <div class="feat-ico"><AdminIcon name="shield" :size="18" /></div>
            <div>
              <strong>Phân Quyền Bảo Mật 3 Cấp Độ</strong>
              <span>Tách biệt quyền Quản trị cấp cao, Kinh doanh CRM và Quản lý kho.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cột Phải: Biểu mẫu Đăng nhập -->
      <div class="login-panel">
        <div class="panel-head">
          <h2>Đăng Nhập Quản Trị</h2>
          <p>Nhập tài khoản nhân sự được cấp quyền để tiếp tục</p>
        </div>

        <div v-if="authStore.loginError" class="login-alert" role="alert">
          <AdminIcon name="alert" :size="17" />
          <span>{{ authStore.loginError }}</span>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="field-block">
            <label for="username">Tên đăng nhập</label>
            <div class="field-input-box">
              <AdminIcon name="users" :size="17" class="field-ico" />
              <input
                id="username"
                type="text"
                v-model="username"
                placeholder="Nhập tên đăng nhập..."
                required
                autocomplete="username"
              />
            </div>
          </div>

          <div class="field-block">
            <label for="password">Mật khẩu bảo mật</label>
            <div class="field-input-box">
              <AdminIcon name="lock" :size="17" class="field-ico" />
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
                class="pwd-toggle"
                @click="showPassword = !showPassword"
                :title="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
              >
                <AdminIcon :name="showPassword ? 'eye-off' : 'eye'" :size="17" />
              </button>
            </div>
          </div>

          <label class="remember-row">
            <input type="checkbox" v-model="rememberMe" />
            <span>Duy trì phiên đăng nhập trên thiết bị này</span>
          </label>

          <button type="submit" class="btn-primary submit-btn" :disabled="isLoading">
            <span>{{ isLoading ? 'Đang xác thực hệ thống...' : 'Truy Cập Bảng Điều Khiển' }}</span>
          </button>
        </form>

        <div class="panel-foot">
          <router-link to="/" class="store-back-link">
            <AdminIcon name="globe" :size="15" />
            <span>Quay về trang chủ khách hàng</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { adminHomeForRole } from '../../utils/permissions'
import AdminIcon from '../../components/admin/AdminIcon.vue'

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
.login-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at 18% 20%, rgba(40, 55, 252, 0.2), transparent 45%),
    radial-gradient(circle at 82% 80%, rgba(252, 183, 40, 0.12), transparent 42%),
    #070911;
}

.login-container {
  width: 100%;
  max-width: 920px;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  background: linear-gradient(180deg, #13182a 0%, #0d111e 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.8);
}

.login-showcase {
  padding: 42px 38px;
  background:
    radial-gradient(circle at 0% 0%, rgba(252, 183, 40, 0.14), transparent 55%),
    linear-gradient(160deg, rgba(22, 29, 52, 0.95) 0%, rgba(12, 16, 30, 0.98) 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--gradient-gold);
  color: #090b10;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-name {
  display: block;
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 800;
  color: #fcb728;
  letter-spacing: 0.04em;
}

.brand-tag {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.08em;
}

.showcase-heading {
  font-family: var(--font-display);
  font-size: 1.52rem;
  font-weight: 800;
  color: #f8fafc;
  line-height: 1.3;
  margin-bottom: 12px;
}

.showcase-desc {
  font-size: 0.86rem;
  color: #94a3b8;
  line-height: 1.6;
}

.showcase-features {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feat-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.feat-ico {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: rgba(252, 183, 40, 0.14);
  color: #fcb728;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feat-item strong {
  display: block;
  font-size: 0.82rem;
  color: #f1f5f9;
  margin-bottom: 2px;
}

.feat-item span {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  line-height: 1.45;
}

.login-panel {
  padding: 42px 38px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.panel-head {
  margin-bottom: 24px;
}

.panel-head h2 {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 800;
  color: #f8fafc;
  margin-bottom: 4px;
}

.panel-head p {
  font-size: 0.83rem;
  color: #94a3b8;
}

.login-alert {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 14px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
  font-size: 0.83rem;
  font-weight: 600;
  margin-bottom: 18px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-block label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #cbd5e1;
}

.field-input-box {
  display: flex;
  align-items: center;
  background: #080b14;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 0 12px;
  transition: border-color 0.18s, box-shadow 0.18s;
}

.field-input-box:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(252, 183, 40, 0.14);
}

.field-ico {
  color: #64748b;
  margin-right: 10px;
}

.field-input-box input {
  flex: 1;
  min-width: 0;
  height: 44px;
  background: transparent;
  border: none;
  color: #f8fafc;
  font-size: 0.9rem;
  outline: none;
}

.pwd-toggle {
  background: transparent;
  color: #94a3b8;
  padding: 6px;
  display: flex;
}

.pwd-toggle:hover {
  color: #f8fafc;
}

.remember-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.81rem;
  color: #94a3b8;
  cursor: pointer;
}

.submit-btn {
  width: 100%;
  height: 46px;
  font-size: 0.92rem;
  margin-top: 4px;
}

.panel-foot {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  justify-content: center;
}

.store-back-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #94a3b8;
  transition: color 0.16s;
}

.store-back-link:hover {
  color: #fcb728;
}

@media (max-width: 820px) {
  .login-container {
    grid-template-columns: 1fr;
    max-width: 460px;
  }

  .login-showcase {
    display: none;
  }

  .login-panel {
    padding: 32px 24px;
  }
}
</style>
