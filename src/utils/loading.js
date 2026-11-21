import { reactive } from 'vue'

/**
 * Quản lý trạng thái nạp dữ liệu toàn hệ thống (Global System Loading)
 * Hỗ trợ thanh Progress Bar trên đỉnh màn hình và Modal Overlay khi cần
 */
export const systemLoading = reactive({
  active: false,
  progress: 0,
  isFinishing: false,
  modal: {
    active: false,
    message: ''
  }
})

let progressTimer = null
let finishTimer = null

/**
 * Bắt đầu thanh tiến trình tải hệ thống
 */
export function startSystemLoading() {
  if (finishTimer) {
    clearTimeout(finishTimer)
    finishTimer = null
  }

  systemLoading.active = true
  systemLoading.isFinishing = false

  if (systemLoading.progress < 25) {
    systemLoading.progress = 25
  }

  if (!progressTimer) {
    progressTimer = setInterval(() => {
      if (systemLoading.progress < 70) {
        systemLoading.progress += Math.random() * 8 + 4
      } else if (systemLoading.progress < 88) {
        systemLoading.progress += Math.random() * 3 + 1
      } else if (systemLoading.progress < 96) {
        systemLoading.progress += 0.5
      }
    }, 180)
  }
}

/**
 * Hoàn tất thanh tiến trình và ẩn đi mượt mà
 */
export function finishSystemLoading() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }

  if (!systemLoading.active) return

  systemLoading.progress = 100
  systemLoading.isFinishing = true

  finishTimer = setTimeout(() => {
    systemLoading.active = false
    systemLoading.progress = 0
    systemLoading.isFinishing = false
    finishTimer = null
  }, 280)
}

/**
 * Bật màn hình mờ chờ tải tác vụ nặng (Full-screen Loading Modal)
 * @param {string} message Thông điệp hiển thị
 */
export function showModalLoading(message = 'Đang đồng bộ dữ liệu hệ thống...') {
  systemLoading.modal.active = true
  systemLoading.modal.message = message
}

/**
 * Tắt màn hình mờ chờ tải tác vụ nặng
 */
export function hideModalLoading() {
  systemLoading.modal.active = false
  systemLoading.modal.message = ''
}
