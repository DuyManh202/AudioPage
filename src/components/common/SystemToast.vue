<template>
  <Teleport to="body">
    <Transition name="toast-slide">
      <div
        v-if="toastState.visible"
        class="system-toast-container"
        :class="`toast-${toastState.type}`"
        role="alert"
        aria-live="assertive"
      >
        <div class="toast-card">
          <!-- Icon biểu tượng trạng thái -->
          <div class="toast-icon-wrap">
            <span class="toast-icon">{{ toastState.icon }}</span>
          </div>

          <!-- Nội dung thông báo -->
          <div class="toast-content">
            <div class="toast-title">{{ toastState.title }}</div>
            <div class="toast-message">{{ toastState.message }}</div>
          </div>

          <!-- Nút đóng -->
          <button
            type="button"
            class="toast-close-btn"
            @click="closeToast"
            aria-label="Đóng thông báo"
          >
            &times;
          </button>

          <!-- Thanh tiến trình thời gian chạy ngầm phía dưới -->
          <div class="toast-progress-bar"></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { toastState, closeToast } from '../../utils/toast'
</script>

<style scoped>
.system-toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 999999999;
  pointer-events: auto;
  max-width: 440px;
  width: calc(100vw - 32px);
}

.toast-card {
  position: relative;
  background: #0f172a;
  border-radius: 14px;
  padding: 16px 20px 18px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.65), 0 0 20px rgba(0, 0, 0, 0.4);
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  overflow: hidden;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* THÀNH CÔNG */
.toast-success .toast-card {
  border-color: rgba(34, 197, 94, 0.5);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(34, 197, 94, 0.2);
}
.toast-success .toast-title {
  color: #4ade80;
}
.toast-success .toast-progress-bar {
  background: linear-gradient(90deg, #22c55e, #facc15);
}

/* LỖI */
.toast-error .toast-card {
  border-color: rgba(239, 68, 68, 0.6);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6), 0 0 24px rgba(239, 68, 68, 0.3);
}
.toast-error .toast-title {
  color: #f87171;
}
.toast-error .toast-progress-bar {
  background: linear-gradient(90deg, #ef4444, #f97316);
}

.toast-icon-wrap {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

.toast-icon {
  font-size: 17px;
  line-height: 1;
}

.toast-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.toast-title {
  font-size: 14.5px;
  font-weight: 750;
  line-height: 1.3;
}

.toast-message {
  font-size: 13px;
  color: #cbd5e1;
  line-height: 1.45;
  word-break: break-word;
}

.toast-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 0 0 0 6px;
  transition: color 0.2s;
  flex-shrink: 0;
}

.toast-close-btn:hover {
  color: #f8fafc;
}

.toast-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  animation: toastShrink 4s linear forwards;
}

@keyframes toastShrink {
  from { width: 100%; }
  to { width: 0%; }
}

/* HIỆU ỨNG TRƯỢT VÀO / RA */
.toast-slide-enter-active {
  transition: all 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-slide-leave-active {
  transition: all 0.25s ease-in;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@media (max-width: 640px) {
  .system-toast-container {
    top: 14px;
    right: 16px;
    left: 16px;
    width: auto;
  }
}
</style>
