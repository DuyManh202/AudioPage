import { defineStore } from 'pinia'
import { apiRequest } from '../utils/api'

export const useAuthStore = defineStore('auth', {
  state: () => {
    const savedUser = localStorage.getItem('audioshop_user') || sessionStorage.getItem('audioshop_user')
    const savedToken = localStorage.getItem('audioshop_token') || sessionStorage.getItem('audioshop_token')
    if (savedToken?.startsWith('local_token_')) {
      localStorage.removeItem('audioshop_user')
      localStorage.removeItem('audioshop_token')
      sessionStorage.removeItem('audioshop_user')
      sessionStorage.removeItem('audioshop_token')
    }

    return {
      user: (() => {
        try { return savedUser ? JSON.parse(savedUser) : null } catch { return null }
      })(),
      token: savedToken?.startsWith('local_token_') ? null : savedToken,
      loginError: ''
    }
  },

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    currentUser: (state) => state.user || { full_name: 'Quản Trị Viên', role: null }
  },

  actions: {
    /**
     * Bước 1: Xác thực Tên đăng nhập và Mật khẩu
     * Trả về { success: true } nếu đăng nhập thẳng,
     * hoặc { requireOtp: true, tempToken, maskedEmail, devOtp } nếu tài khoản yêu cầu OTP
     */
    async login(username, password, rememberMe = true) {
      this.loginError = ''
      const cleanUsername = username.trim().toLowerCase()

      try {
        const res = await apiRequest('/admin/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username: cleanUsername, password, rememberMe })
        })

        // Trường hợp yêu cầu nhập mã OTP gửi qua Email
        if (res.success && res.requireOtp) {
          return {
            requireOtp: true,
            tempToken: res.tempToken,
            maskedEmail: res.maskedEmail,
            expiresInSeconds: res.expiresInSeconds || 300,
            devOtp: res.devOtp || null,
            note: res.note || null
          }
        }

        // Trường hợp đăng nhập trực tiếp (tài khoản chưa cấu hình email)
        if (res.success && res.token) {
          this.user = res.user
          this.token = res.token
          this.logoutStorage()
          const storage = rememberMe ? localStorage : sessionStorage
          storage.setItem('audioshop_user', JSON.stringify(res.user))
          storage.setItem('audioshop_token', res.token)
          return { success: true, user: res.user, warning: res.warning || null }
        }

        this.loginError = res.message || 'Xác thực không thành công'
        return { success: false, message: this.loginError }
      } catch (err) {
        this.loginError = err.message || 'Không thể kết nối máy chủ đăng nhập.'
        return { success: false, message: this.loginError }
      }
    },

    /**
     * Bước 2: Xác thực mã OTP 6 số
     */
    async verifyOtp(tempToken, otp, rememberMe = true) {
      this.loginError = ''
      try {
        const res = await apiRequest('/admin/auth/verify-otp', {
          method: 'POST',
          body: JSON.stringify({ tempToken, otp, rememberMe })
        })

        if (res.success && res.token) {
          this.user = res.user
          this.token = res.token
          this.logoutStorage()
          const storage = rememberMe ? localStorage : sessionStorage
          storage.setItem('audioshop_user', JSON.stringify(res.user))
          storage.setItem('audioshop_token', res.token)
          return { success: true, user: res.user }
        }

        this.loginError = res.message || 'Mã OTP không chính xác'
        return { success: false, message: this.loginError }
      } catch (err) {
        this.loginError = err.message || 'Không thể xác thực mã OTP.'
        return { success: false, message: this.loginError }
      }
    },

    /**
     * Gửi lại mã OTP tới email
     */
    async resendOtp(tempToken) {
      try {
        const res = await apiRequest('/admin/auth/resend-otp', {
          method: 'POST',
          body: JSON.stringify({ tempToken })
        })
        return res
      } catch (err) {
        throw err
      }
    },

    /**
     * Cập nhật hồ sơ cá nhân (Email, SĐT, Mật khẩu)
     */
    async updateProfile(profileData) {
      try {
        const res = await apiRequest('/admin/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify(profileData)
        })
        if (res.success && res.data) {
          if (res.newToken) {
            this.updateSessionToken(res.newToken, res.data)
          } else {
            this.user = { ...this.user, ...res.data }
            const useLocal = Boolean(localStorage.getItem('audioshop_token'))
            const storage = useLocal ? localStorage : sessionStorage
            storage.setItem('audioshop_user', JSON.stringify(this.user))
          }
          return { success: true, data: res.data }
        }
        return { success: false, message: res.message }
      } catch (err) {
        return { success: false, message: err.message }
      }
    },

    updateSessionToken(newToken, updatedUser = null) {
      if (!newToken) return
      this.token = newToken
      if (updatedUser) this.user = { ...this.user, ...updatedUser }
      const useLocal = Boolean(localStorage.getItem('audioshop_token'))
      const storage = useLocal ? localStorage : sessionStorage
      storage.setItem('audioshop_token', newToken)
      if (this.user) storage.setItem('audioshop_user', JSON.stringify(this.user))
    },

    logout() {
      this.user = null
      this.token = null
      this.loginError = ''
      this.logoutStorage()
    },

    logoutStorage() {
      for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem('audioshop_user')
        storage.removeItem('audioshop_token')
      }
    }
  }
})
