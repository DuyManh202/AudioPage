import { reactive } from 'vue'

export const toastState = reactive({
  visible: false,
  type: 'success', // 'success' | 'error' | 'warning' | 'info'
  title: '',
  message: '',
  icon: '✅'
})

let timer = null

export function showToast({ type = 'success', title = '', message = '', duration = 4000 }) {
  if (timer) clearTimeout(timer)

  toastState.type = type
  toastState.title = title || (type === 'success' ? 'Thành Công' : (type === 'error' ? 'Lỗi Hệ Thống' : 'Thông Báo'))
  toastState.message = message

  switch (type) {
    case 'success':
      toastState.icon = '✅'
      break
    case 'error':
      toastState.icon = '⚠️'
      break
    case 'warning':
      toastState.icon = '🔔'
      break
    default:
      toastState.icon = 'ℹ️'
  }

  toastState.visible = true

  timer = setTimeout(() => {
    toastState.visible = false
  }, duration)
}

export function showSuccess(message, title = 'Thành Công') {
  showToast({ type: 'success', title, message })
}

export function showError(message, title = 'Lỗi Thao Tác') {
  showToast({ type: 'error', title, message, duration: 5500 })
}

export function closeToast() {
  if (timer) clearTimeout(timer)
  toastState.visible = false
}
