<template>
  <div class="login-shell">
    <!-- Hiệu ứng ánh sáng nền đa tầng tinh tế -->
    <div class="ambient-glow glow-top" aria-hidden="true"></div>
    <div class="ambient-glow glow-bottom" aria-hidden="true"></div>

    <div class="login-wrapper">
      <!-- Đầu trang thương hiệu Tú Audio -->
      <div class="login-brand">
        <div class="brand-logo-badge">
          <span>TA</span>
        </div>
        <h1 class="brand-name">TÚ AUDIO</h1>
        <div class="brand-pill">
          <span class="live-dot"></span>
          <span>HỆ THỐNG ĐIỀU HÀNH BÁN HÀNG &amp; CRM</span>
        </div>
      </div>

      <!-- Khối Thẻ Trung Tâm (Chuyển đổi Đăng nhập / Đăng ký) -->
      <div class="login-card">
        <!-- ========================================== -->
        <!-- CHẾ ĐỘ 1: ĐĂNG NHẬP (CREDENTIALS + OTP)     -->
        <!-- ========================================== -->
        <Transition name="fade-step" mode="out-in">
          <div v-if="authMode === 'login'" key="mode-login">
            <!-- BƯỚC 1: TÊN ĐĂNG NHẬP & MẬT KHẨU -->
            <div v-if="step === 'credentials'" class="card-inner">
              <div class="card-head">
                <h2>Đăng Nhập Quản Trị</h2>
                <p>Nhập tài khoản nhân sự được cấp quyền để tiếp tục</p>
              </div>

              <div v-if="authStore.loginError" class="login-alert" role="alert">
                <AdminIcon name="alert" :size="16" />
                <span>{{ authStore.loginError }}</span>
              </div>

              <form @submit.prevent="handleLogin" class="auth-form">
                <div class="form-group">
                  <label for="username">Tên đăng nhập</label>
                  <div class="input-wrap">
                    <AdminIcon name="users" :size="17" class="input-ico" />
                    <input
                      id="username"
                      type="text"
                      v-model="username"
                      placeholder="Nhập tên tài khoản..."
                      required
                      autocomplete="username"
                      spellcheck="false"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label for="password">Mật khẩu bảo mật</label>
                  <div class="input-wrap">
                    <AdminIcon name="lock" :size="17" class="input-ico" />
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
                      class="eye-btn"
                      @click="showPassword = !showPassword"
                      :title="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                      tabindex="-1"
                    >
                      <AdminIcon :name="showPassword ? 'eye-off' : 'eye'" :size="16" />
                    </button>
                  </div>
                </div>

                <div class="form-meta-row">
                  <label class="remember-label">
                    <input type="checkbox" v-model="rememberMe" class="custom-chk" />
                    <span>Duy trì đăng nhập 30 ngày</span>
                  </label>
                </div>

                <button type="submit" class="submit-action-btn" :disabled="isLoading">
                  <span v-if="isLoading" class="loading-spinner"></span>
                  <span>{{ isLoading ? 'Đang kiểm tra tài khoản...' : 'Tiếp Tục Đăng Nhập' }}</span>
                  <AdminIcon v-if="!isLoading" name="arrow-right" :size="16" class="btn-arrow" />
                </button>
              </form>

              <!-- Nút chuyển sang đăng ký -->
              <div class="switch-mode-box">
                <span>Chưa có tài khoản nhân sự?</span>
                <button type="button" class="switch-link-btn" @click="switchToRegister">
                  Đăng ký tham gia ngay
                </button>
              </div>
            </div>

            <!-- BƯỚC 2: XÁC THỰC MÃ OTP EMAIL -->
            <div v-else class="card-inner otp-inner">
              <div class="otp-security-badge">
                <AdminIcon name="shield" :size="24" />
              </div>

              <div class="card-head text-center">
                <h2>Xác Thực Bảo Mật 2 Lớp</h2>
                <p class="otp-sub-text">
                  Nhập mã 6 số đã được gửi tới email:<br />
                  <strong class="email-highlight">{{ maskedEmail }}</strong>
                </p>
              </div>

              <div v-if="authStore.loginError" class="login-alert" role="alert">
                <AdminIcon name="alert" :size="16" />
                <span>{{ authStore.loginError }}</span>
              </div>

              <div v-if="devOtpNotice" class="dev-otp-pill" @click="autoFillDevOtp" title="Bấm để tự động điền mã">
                <span class="dev-tag">Bản xem trước</span>
                <span class="dev-code">Mã OTP: <strong>{{ devOtpNotice }}</strong></span>
                <span class="dev-action">(Điền nhanh)</span>
              </div>

              <form @submit.prevent="handleVerifyOtp" class="auth-form">
                <div class="form-group text-center">
                  <label for="otp-code">Mã xác thực OTP (6 chữ số)</label>
                  <div class="otp-input-wrap">
                    <input
                      id="otp-code"
                      ref="otpInputRef"
                      type="text"
                      inputmode="numeric"
                      maxlength="6"
                      pattern="[0-9]*"
                      v-model="otpCode"
                      placeholder="••••••"
                      class="otp-field"
                      required
                      autocomplete="one-time-code"
                      @input="onOtpInput"
                    />
                  </div>
                  <span class="form-hint">Mã có hiệu lực trong vòng 5 phút</span>
                </div>

                <button type="submit" class="submit-action-btn" :disabled="isLoading || otpCode.length < 6">
                  <span v-if="isLoading" class="loading-spinner"></span>
                  <span>{{ isLoading ? 'Đang xác thực OTP...' : 'Xác Nhận & Truy Cập' }}</span>
                  <AdminIcon v-if="!isLoading" name="check" :size="16" class="btn-arrow" />
                </button>
              </form>

              <div class="otp-controls">
                <span v-if="cooldown > 0" class="cooldown-msg">
                  Gửi lại mã mới sau: <strong>{{ cooldown }}s</strong>
                </span>
                <button
                  v-else
                  type="button"
                  class="resend-action-btn"
                  :disabled="resending"
                  @click="handleResendOtp"
                >
                  <AdminIcon name="sync" :size="13" />
                  <span>{{ resending ? 'Đang gửi...' : 'Gửi lại mã OTP qua Email' }}</span>
                </button>

                <button type="button" class="back-link-btn" @click="backToCredentials">
                  <AdminIcon name="arrow-left" :size="13" />
                  <span>Đổi tài khoản khác</span>
                </button>
              </div>
            </div>
          </div>

          <!-- ========================================== -->
          <!-- CHẾ ĐỘ 2: ĐĂNG KÝ TÀI KHOẢN (CHỜ DUYỆT)    -->
          <!-- ========================================== -->
          <div v-else key="mode-register" class="card-inner">
            <!-- Màn hình nộp đơn thành công -->
            <div v-if="regSuccess" class="reg-success-view">
              <div class="reg-success-badge">
                <AdminIcon name="check" :size="30" />
              </div>
              <h2>Đã Nộp Đơn Đăng Ký!</h2>
              <div class="reg-success-desc">
                <p>
                  Hồ sơ tài khoản <strong>{{ regForm.username }}</strong> đã được gửi tới hệ thống ở trạng thái
                  <span class="status-pending-pill">Chờ Phê Duyệt &amp; Phân Quyền</span>.
                </p>
                <div class="approval-note-box">
                  <AdminIcon name="shield" :size="16" />
                  <span>Quản trị viên cấp cao (anh Tú) sẽ xét duyệt và phân vai trò kinh doanh hoặc kho cho bạn trước khi kích hoạt đăng nhập.</span>
                </div>
              </div>

              <button type="button" class="submit-action-btn" @click="switchToLogin">
                <span>Quay Về Màn Hình Đăng Nhập</span>
              </button>
            </div>

            <!-- Form điền thông tin đăng ký -->
            <div v-else>
              <div class="card-head">
                <h2>Đăng Ký Tài Khoản Nhân Sự</h2>
                <p>Hồ sơ sẽ được chuyển tới Quản Trị Viên phê duyệt &amp; phân quyền</p>
              </div>

              <div v-if="regError" class="login-alert" role="alert">
                <AdminIcon name="alert" :size="16" />
                <span>{{ regError }}</span>
              </div>

              <form @submit.prevent="handleRegister" class="auth-form">
                <div class="form-group">
                  <label for="reg-username">Tên đăng nhập</label>
                  <div class="input-wrap">
                    <AdminIcon name="users" :size="17" class="input-ico" />
                    <input
                      id="reg-username"
                      type="text"
                      v-model="regForm.username"
                      placeholder="vd: dmanh hoặc sales_hanoi"
                      required
                      minlength="3"
                      maxlength="50"
                      autocomplete="off"
                      spellcheck="false"
                    />
                  </div>
                  <span class="field-micro-hint">Chữ thường không dấu, số, dấu chấm (3-50 ký tự)</span>
                </div>

                <div class="form-group">
                  <label for="reg-fullname">Họ và tên nhân sự</label>
                  <div class="input-wrap">
                    <AdminIcon name="users" :size="17" class="input-ico" />
                    <input
                      id="reg-fullname"
                      type="text"
                      v-model="regForm.fullName"
                      placeholder="vd: Nguyễn Duy Mạnh"
                      required
                      maxlength="100"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label for="reg-email">Email nhận mã xác thực OTP</label>
                  <div class="input-wrap">
                    <AdminIcon name="mail" :size="17" class="input-ico" />
                    <input
                      id="reg-email"
                      type="email"
                      v-model="regForm.email"
                      placeholder="vd: manh.sales@tuaudio.vn"
                      required
                    />
                  </div>
                  <span class="field-micro-hint">Mã OTP 2 bước sẽ gửi về email này khi đăng nhập</span>
                </div>

                <div class="form-group">
                  <label for="reg-phone">Số điện thoại liên hệ</label>
                  <div class="input-wrap">
                    <AdminIcon name="phone" :size="17" class="input-ico" />
                    <input
                      id="reg-phone"
                      type="tel"
                      v-model="regForm.phone"
                      placeholder="vd: 0984259898"
                      required
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label for="reg-password">Mật khẩu khởi tạo (&ge; 12 ký tự)</label>
                  <div class="input-wrap">
                    <AdminIcon name="lock" :size="17" class="input-ico" />
                    <input
                      id="reg-password"
                      :type="showRegPassword ? 'text' : 'password'"
                      v-model="regForm.password"
                      placeholder="Nhập ít nhất 12 ký tự..."
                      required
                      minlength="12"
                      maxlength="128"
                      autocomplete="new-password"
                    />
                    <button
                      type="button"
                      class="eye-btn"
                      @click="showRegPassword = !showRegPassword"
                      :title="showRegPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                      tabindex="-1"
                    >
                      <AdminIcon :name="showRegPassword ? 'eye-off' : 'eye'" :size="16" />
                    </button>
                  </div>
                </div>

                <div class="form-group">
                  <label for="reg-confirm-password">Xác nhận mật khẩu</label>
                  <div class="input-wrap">
                    <AdminIcon name="lock" :size="17" class="input-ico" />
                    <input
                      id="reg-confirm-password"
                      :type="showRegPassword ? 'text' : 'password'"
                      v-model="regForm.confirmPassword"
                      placeholder="Nhập lại mật khẩu..."
                      required
                      minlength="12"
                      maxlength="128"
                      autocomplete="new-password"
                    />
                  </div>
                </div>

                <button type="submit" class="submit-action-btn" :disabled="regLoading">
                  <span v-if="regLoading" class="loading-spinner"></span>
                  <span>{{ regLoading ? 'Đang gửi hồ sơ...' : 'Nộp Đơn Đăng Ký Tài Khoản' }}</span>
                  <AdminIcon v-if="!regLoading" name="arrow-right" :size="16" class="btn-arrow" />
                </button>
              </form>

              <!-- Nút quay lại đăng nhập -->
              <div class="switch-mode-box">
                <span>Đã có tài khoản quản trị?</span>
                <button type="button" class="switch-link-btn" @click="switchToLogin">
                  Đăng nhập ngay
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Chân trang & Điều hướng ngoài -->
      <div class="login-footer">
        <router-link to="/" class="store-nav-link">
          <AdminIcon name="arrow-left" :size="13" />
          <span>Quay về trang chủ bán hàng</span>
        </router-link>
        <span class="footer-dot">•</span>
        <div class="ssl-guarantee">
          <AdminIcon name="lock" :size="12" />
          <span>Mã hóa bảo mật SSL 256-bit</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { adminHomeForRole } from '../../utils/permissions'
import AdminIcon from '../../components/admin/AdminIcon.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Điều khiển chế độ màn hình: 'login' | 'register'
const authMode = ref('login')

// State Đăng Nhập (Bước 1)
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(true)
const isLoading = ref(false)

// State Đăng Nhập (Bước 2: OTP)
const step = ref('credentials') // 'credentials' | 'otp'
const tempToken = ref('')
const maskedEmail = ref('')
const otpCode = ref('')
const devOtpNotice = ref('')
const cooldown = ref(0)
const resending = ref(false)
const otpInputRef = ref(null)
let cooldownTimer = null

// State Đăng Ký
const regForm = reactive({
  username: '',
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
})
const showRegPassword = ref(false)
const regLoading = ref(false)
const regError = ref('')
const regSuccess = ref(false)

const startCooldown = (seconds = 60) => {
  cooldown.value = seconds
  clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    if (cooldown.value > 1) {
      cooldown.value--
    } else {
      cooldown.value = 0
      clearInterval(cooldownTimer)
    }
  }, 1000)
}

onUnmounted(() => {
  clearInterval(cooldownTimer)
})

const switchToRegister = () => {
  authMode.value = 'register'
  authStore.loginError = ''
  regError.value = ''
  regSuccess.value = false
}

const switchToLogin = () => {
  authMode.value = 'login'
  step.value = 'credentials'
  authStore.loginError = ''
  regError.value = ''
  regSuccess.value = false
}

const handleLogin = async () => {
  isLoading.value = true
  authStore.loginError = ''

  const res = await authStore.login(username.value, password.value, rememberMe.value)
  isLoading.value = false

  if (res && res.requireOtp) {
    step.value = 'otp'
    tempToken.value = res.tempToken
    maskedEmail.value = res.maskedEmail || 'email của bạn'
    devOtpNotice.value = res.devOtp || ''
    otpCode.value = ''
    startCooldown(60)

    nextTick(() => {
      otpInputRef.value?.focus()
    })
    return
  }

  if (res && res.success) {
    const redirectPath = route.query.redirect || adminHomeForRole(authStore.currentUser?.role)
    router.push(redirectPath)
  }
}

const onOtpInput = (e) => {
  otpCode.value = e.target.value.replace(/\D/g, '').slice(0, 6)
  if (otpCode.value.length === 6) {
    handleVerifyOtp()
  }
}

const autoFillDevOtp = () => {
  if (devOtpNotice.value) {
    otpCode.value = devOtpNotice.value
    handleVerifyOtp()
  }
}

const handleVerifyOtp = async () => {
  if (otpCode.value.length < 6 || isLoading.value) return
  isLoading.value = true
  authStore.loginError = ''

  const res = await authStore.verifyOtp(tempToken.value, otpCode.value, rememberMe.value)
  isLoading.value = false

  if (res && res.success) {
    const redirectPath = route.query.redirect || adminHomeForRole(authStore.currentUser?.role)
    router.push(redirectPath)
  }
}

const handleResendOtp = async () => {
  if (cooldown.value > 0 || resending.value) return
  resending.value = true
  authStore.loginError = ''

  try {
    const res = await authStore.resendOtp(tempToken.value)
    if (res && res.devOtp) {
      devOtpNotice.value = res.devOtp
    }
    startCooldown(60)
  } catch (err) {
    authStore.loginError = err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.'
  } finally {
    resending.value = false
  }
}

const backToCredentials = () => {
  step.value = 'credentials'
  authStore.loginError = ''
  otpCode.value = ''
  tempToken.value = ''
  devOtpNotice.value = ''
  clearInterval(cooldownTimer)
}

const handleRegister = async () => {
  regError.value = ''
  const cleanUsername = regForm.username.trim().toLowerCase()
  if (!/^[a-z0-9._-]{3,50}$/.test(cleanUsername)) {
    regError.value = 'Tên đăng nhập chỉ gồm chữ không dấu, số, dấu chấm hoặc gạch nối (3–50 ký tự, viết liền không khoảng trắng).'
    return
  }
  if (!regForm.fullName.trim()) {
    regError.value = 'Vui lòng nhập đầy đủ họ và tên nhân sự.'
    return
  }
  if (!regForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email.trim())) {
    regError.value = 'Vui lòng cung cấp địa chỉ email hợp lệ để nhận mã xác thực OTP.'
    return
  }
  if (regForm.password.length < 12) {
    regError.value = 'Mật khẩu bắt buộc phải từ 12 ký tự trở lên để đảm bảo an toàn.'
    return
  }
  if (regForm.password !== regForm.confirmPassword) {
    regError.value = 'Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.'
    return
  }

  regLoading.value = true
  try {
    await authStore.register({
      username: cleanUsername,
      fullName: regForm.fullName.trim(),
      email: regForm.email.trim().toLowerCase(),
      phone: regForm.phone.trim(),
      password: regForm.password
    })
    regSuccess.value = true
  } catch (err) {
    regError.value = err.message || 'Không thể gửi đơn đăng ký. Vui lòng thử lại sau.'
  } finally {
    regLoading.value = false
  }
}
</script>

<style scoped>
.login-shell {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px 18px;
  background-color: #f1f5f9;
  background-image:
    radial-gradient(at 0% 0%, rgba(245, 158, 11, 0.08) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(37, 99, 235, 0.08) 0px, transparent 50%),
    radial-gradient(at 50% 50%, #ffffff 0px, #f1f5f9 100%);
  overflow-x: hidden;
}

/* Ánh sáng mờ tinh tế phía sau */
.ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  opacity: 0.6;
}

.glow-top {
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  height: 280px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, transparent 70%);
}

.glow-bottom {
  bottom: -100px;
  right: 15%;
  width: 400px;
  height: 240px;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%);
}

.login-wrapper {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Khối Logo & Thương hiệu */
.login-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 22px;
}

.brand-logo-badge {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ffd54f 0%, #fcb728 50%, #d97706 100%);
  color: #0b0f19;
  font-family: var(--font-display, inherit);
  font-weight: 900;
  font-size: 1.35rem;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px -4px rgba(245, 158, 11, 0.38), 0 2px 6px rgba(0, 0, 0, 0.06);
  margin-bottom: 12px;
  transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.brand-logo-badge:hover {
  transform: translateY(-2px) scale(1.03);
}

.brand-name {
  font-family: var(--font-display, inherit);
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.06em;
  margin: 0 0 6px 0;
  line-height: 1.2;
}

.brand-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
  font-size: 0.68rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
}

/* Thẻ đăng nhập chính */
.login-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 32px 28px;
  box-shadow:
    0 20px 40px -15px rgba(15, 23, 42, 0.08),
    0 1px 3px rgba(15, 23, 42, 0.04);
  transition: box-shadow 0.2s ease;
}

.card-head {
  margin-bottom: 20px;
}

.card-head h2 {
  font-family: var(--font-display, inherit);
  font-size: 1.26rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.card-head p {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.45;
}

.text-center {
  text-align: center;
}

/* Cảnh báo lỗi */
.login-alert {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.45;
  margin-bottom: 16px;
}

/* Biểu mẫu Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-size: 0.79rem;
  font-weight: 700;
  color: #334155;
}

.field-micro-hint {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 1px;
}

.input-wrap {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 11px;
  padding: 0 12px;
  transition: all 0.18s ease;
}

.input-wrap:focus-within {
  background: #ffffff;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.16);
}

.input-ico {
  color: #94a3b8;
  margin-right: 10px;
  flex-shrink: 0;
  transition: color 0.15s;
}

.input-wrap:focus-within .input-ico {
  color: #d97706;
}

.input-wrap input {
  flex: 1;
  min-width: 0;
  height: 42px;
  background: transparent;
  border: none;
  color: #0f172a;
  font-size: 0.88rem;
  outline: none;
}

.input-wrap input::placeholder {
  color: #94a3b8;
}

.eye-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 6px;
  display: flex;
  align-items: center;
  cursor: pointer;
  border-radius: 6px;
  transition: color 0.15s;
}

.eye-btn:hover {
  color: #0f172a;
}

.form-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.remember-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #475569;
  cursor: pointer;
  user-select: none;
}

.custom-chk {
  width: 16px;
  height: 16px;
  accent-color: #d97706;
  cursor: pointer;
}

/* Nút hành động chính */
.submit-action-btn {
  position: relative;
  width: 100%;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 11px;
  background: linear-gradient(135deg, #ffd54f 0%, #fcb728 50%, #f59e0b 100%);
  color: #090b10;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 18px -3px rgba(245, 158, 11, 0.42);
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  margin-top: 4px;
}

.submit-action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 22px -3px rgba(245, 158, 11, 0.55);
}

.submit-action-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-action-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-arrow {
  transition: transform 0.15s ease;
}

.submit-action-btn:hover:not(:disabled) .btn-arrow {
  transform: translateX(3px);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: #090b10;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Hàng chuyển đổi chế độ Đăng nhập / Đăng ký */
.switch-mode-box {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #64748b;
}

.switch-link-btn {
  background: none;
  border: none;
  color: #d97706;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0;
  transition: text-decoration 0.15s;
}

.switch-link-btn:hover {
  text-decoration: underline;
  color: #b45309;
}

/* BƯỚC 2: GIAO DIỆN OTP */
.otp-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.otp-security-badge {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: #eff6ff;
  border: 2px solid #bfdbfe;
  color: #1d4ed8;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px -4px rgba(37, 99, 235, 0.25);
  margin-bottom: 14px;
}

.otp-sub-text {
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.5;
  margin-top: 4px;
}

.email-highlight {
  color: #1d4ed8;
  font-weight: 700;
  font-family: monospace;
  font-size: 0.9rem;
}

.dev-otp-pill {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 9px;
  background: #f0fdf4;
  border: 1px dashed #86efac;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.15s;
}

.dev-otp-pill:hover {
  background: #dcfce7;
  border-color: #22c55e;
}

.dev-tag {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #15803d;
  background: #bbf7d0;
  padding: 2px 6px;
  border-radius: 4px;
}

.dev-code {
  font-size: 0.8rem;
  color: #166534;
}

.dev-action {
  font-size: 0.75rem;
  color: #15803d;
  text-decoration: underline;
}

.otp-input-wrap {
  display: flex;
  justify-content: center;
  margin-top: 4px;
}

.otp-field {
  width: 100%;
  height: 54px;
  text-align: center;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 2.1rem;
  font-weight: 800;
  letter-spacing: 14px;
  padding-left: 14px;
  color: #0f172a;
  background: #f8fafc;
  border: 2px solid #cbd5e1;
  border-radius: 12px;
  outline: none;
  transition: all 0.18s ease;
}

.otp-field:focus {
  background: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
}

.form-hint {
  font-size: 0.74rem;
  color: #94a3b8;
  margin-top: 4px;
}

.otp-controls {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
}

.cooldown-msg {
  font-size: 0.8rem;
  color: #64748b;
}

.cooldown-msg strong {
  color: #0f172a;
}

.resend-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #1d4ed8;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
}

.resend-action-btn:hover {
  color: #1e40af;
  background: #eff6ff;
}

.back-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
}

.back-link-btn:hover {
  color: #0f172a;
}

/* MÀN HÌNH ĐĂNG KÝ THÀNH CÔNG */
.reg-success-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px 0;
}

.reg-success-badge {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  background: #f0fdf4;
  border: 2px solid #86efac;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px -4px rgba(22, 163, 74, 0.25);
  margin-bottom: 16px;
}

.reg-success-view h2 {
  font-family: var(--font-display, inherit);
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px 0;
}

.reg-success-desc {
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 22px;
}

.status-pending-pill {
  display: inline-block;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #b45309;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 6px;
  font-size: 0.78rem;
}

.approval-note-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  border-radius: 10px;
  padding: 12px 14px;
  margin-top: 14px;
  text-align: left;
  font-size: 0.8rem;
  line-height: 1.45;
}

/* Chân trang */
.login-footer {
  margin-top: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 0.78rem;
  color: #64748b;
}

.store-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #475569;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.15s;
}

.store-nav-link:hover {
  color: #1d4ed8;
}

.footer-dot {
  color: #cbd5e1;
}

.ssl-guarantee {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #94a3b8;
}

/* Hiệu ứng chuyển bước mượt */
.fade-step-enter-active,
.fade-step-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-step-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-step-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 480px) {
  .login-card {
    padding: 24px 18px;
    border-radius: 16px;
  }

  .brand-name {
    font-size: 1.3rem;
  }

  .otp-field {
    font-size: 1.7rem;
    letter-spacing: 10px;
    height: 48px;
  }
}
</style>
