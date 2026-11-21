import { defineStore } from 'pinia'
import { apiRequest } from '../utils/api'

export const useFestiveStore = defineStore('festive', {
  state: () => ({
    theme: 'tet', // 'tet' | 'noel' | 'sale' | 'none' | 'auto'
    fallingEnabled: true,
    decorEnabled: true,
    customTicker: '',
    userFallingPreference: true,
    isAdminModalOpen: false,
    isSaving: false,
    isLoaded: false
  }),

  getters: {
    // Tự động nhận diện chủ đề theo tháng nếu chọn 'auto'
    effectiveTheme(state) {
      if (state.theme !== 'auto') return state.theme

      const now = new Date()
      const month = now.getMonth() + 1 // 1-12
      const date = now.getDate()

      // Tháng 12 hoặc đầu tháng 1: Giáng Sinh / Noel
      if (month === 12 || (month === 1 && date <= 5)) {
        return 'noel'
      }
      // Tháng 1 & tháng 2: Tết Nguyên Đán
      if (month === 1 || month === 2) {
        return 'tet'
      }
      // Tháng 11 (Black Friday, 11/11): Siêu Sale
      if (month === 11) {
        return 'sale'
      }
      // Mặc định các tháng còn lại
      return 'tet'
    },

    isFestiveActive() {
      return this.effectiveTheme !== 'none'
    },

    shouldShowFalling(state) {
      return this.isFestiveActive && state.fallingEnabled && state.userFallingPreference
    },

    shouldShowDecor(state) {
      return this.isFestiveActive && state.decorEnabled
    },

    tickerMessage(state) {
      if (state.customTicker && state.customTicker.trim()) {
        return state.customTicker.trim()
      }
      switch (this.effectiveTheme) {
        case 'tet':
          return '🌸 Chúc Mừng Năm Mới — Rộn Ràng Hát Ca — Lắp Đặt & Cân Chỉnh Âm Học Tận Nhà Miễn Phí 300km'
        case 'noel':
          return '🎄 Mừng Giáng Sinh & Năm Mới — Dàn Karaoke Ấm Áp Gia Đình — Miễn Phí Lắp Đặt & Cân Chỉnh 300km'
        case 'sale':
          return '⚡ ĐẠI TIỆC SIÊU SALE ÂM THANH — Giảm Sốc Đến 10 Triệu/Bộ — Thử Dàn Tận Nhà Ưng Ý Mới Thanh Toán'
        default:
          return 'Lắp đặt & Cân chỉnh tận nhà miễn phí bán kính 300km quanh Hà Nội - Phú Thọ'
      }
    },

    themeLabel() {
      switch (this.effectiveTheme) {
        case 'tet':
          return 'Tết Nguyên Đán (Hoa Mai & Đào)'
        case 'noel':
          return 'Giáng Sinh & Noel (Tuyết Rơi)'
        case 'sale':
          return 'Đại Tiệc Siêu Sale (Confetti & Sao)'
        default:
          return 'Giao Diện Thường (Tắt hiệu ứng)'
      }
    }
  },

  actions: {
    // Tải cấu hình từ API
    async fetchSettings() {
      // Khôi phục tùy chọn cá nhân của khách từ sessionStorage
      const savedUserPref = sessionStorage.getItem('tuaudio_user_falling_pref')
      if (savedUserPref !== null) {
        this.userFallingPreference = savedUserPref === 'true'
      }

      try {
        const res = await apiRequest('/festive-settings', { silent: true })
        if (res?.data) {
          this.theme = res.data.theme || 'tet'
          this.fallingEnabled = res.data.fallingEnabled ?? true
          this.decorEnabled = res.data.decorEnabled ?? true
          this.customTicker = res.data.customTicker || ''
          this.isLoaded = true
        }
      } catch {
        // Fallback mặc định
        this.isLoaded = true
      }
    },

    // Khách hàng bấm nút tắt/bật hiệu ứng rơi hạt
    toggleUserFalling() {
      this.userFallingPreference = !this.userFallingPreference
      sessionStorage.setItem('tuaudio_user_falling_pref', String(this.userFallingPreference))
    },

    // Quản trị viên lưu cấu hình sự kiện
    async saveSettings(payload) {
      this.isSaving = true
      try {
        const res = await apiRequest('/admin/festive-settings', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        if (res?.data) {
          this.theme = res.data.theme
          this.fallingEnabled = res.data.fallingEnabled
          this.decorEnabled = res.data.decorEnabled
          this.customTicker = res.data.customTicker
        }
        return { success: true, message: 'Đã lưu cấu hình dịp lễ hội thành công!' }
      } catch (err) {
        return { success: false, message: err.message || 'Lỗi khi lưu cấu hình' }
      } finally {
        this.isSaving = false
      }
    }
  }
})
