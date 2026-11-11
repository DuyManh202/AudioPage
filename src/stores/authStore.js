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
    async login(username, password, rememberMe = true) {
      this.loginError = ''
      const cleanUsername = username.trim().toLowerCase()

      try {
        // Gọi API xác thực thực tế từ Backend Server
        const res = await apiRequest('/admin/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username: cleanUsername, password })
        })

        if (res.success && res.token) {
          this.user = res.user
          this.token = res.token
          this.logoutStorage()
          const storage = rememberMe ? localStorage : sessionStorage
          storage.setItem('audioshop_user', JSON.stringify(res.user))
          storage.setItem('audioshop_token', res.token)
          return true
        }
      } catch (err) {
        this.loginError = err.message || 'Không thể kết nối máy chủ đăng nhập.'
        return false
      }

      return false
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
