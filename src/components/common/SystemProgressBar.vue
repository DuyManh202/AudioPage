<template>
  <div class="system-loading-container" aria-live="polite">
    <!-- Thanh tiến trình trên đỉnh màn hình (Top Progress Bar) -->
    <div
      v-if="systemLoading.active"
      class="top-progress-track"
      :class="{ 'is-finishing': systemLoading.isFinishing }"
    >
      <div
        class="top-progress-bar"
        :style="{ width: `${systemLoading.progress}%` }"
      >
        <!-- Hạt phát sáng ở đầu mũi tiến trình -->
        <div class="progress-comet-glow"></div>
      </div>
    </div>

    <!-- Màn hình chờ tác vụ nặng toàn hệ thống (Modal Overlay khi cần) -->
    <Transition name="fade-overlay">
      <div v-if="systemLoading.modal.active" class="system-modal-backdrop">
        <div class="system-modal-card">
          <div class="loader-visual">
            <div class="spinner-ring"></div>
            <div class="center-pulse-emblem">
              <svg viewBox="0 0 48 48" width="32" height="32" fill="none">
                <rect x="2" y="2" width="44" height="44" rx="10" fill="#1e293b" stroke="#fcb728" stroke-width="1.6"/>
                <path d="M 12 15 L 24 15 C 24.8 15 24.8 16.5 24 18 L 20 18 L 20 32 C 20 33 18.5 33 18.5 32 L 18.5 18 L 12 18 C 11.2 18 11.2 15 12 15 Z" fill="#3b82f6"/>
                <path d="M 28 14 L 35.5 32 C 35.9 32.8 34.3 33.4 33.7 32.3 L 31.5 27 L 24.5 27 L 22.3 32.3 C 21.7 33.4 20.1 32.8 20.5 32 L 28 14 Z M 28 18.5 L 25.7 24.5 L 30.3 24.5 Z" fill="#fcb728"/>
              </svg>
            </div>
          </div>
          <div class="modal-loading-text">{{ systemLoading.modal.message || 'Đang xử lý dữ liệu...' }}</div>
          <div class="modal-loading-sub">Vui lòng đợi trong giây lát</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { systemLoading } from '../../utils/loading'
</script>

<style scoped>
.system-loading-container {
  pointer-events: none;
  position: relative;
  z-index: 99999999;
}

/* 1. TOP PROGRESS BAR */
.top-progress-track {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: rgba(252, 183, 40, 0.08);
  pointer-events: none;
  z-index: 99999999;
  transition: opacity 0.25s ease;
}

.top-progress-track.is-finishing {
  opacity: 0;
  transition: opacity 0.28s ease 0.1s;
}

.top-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #fde047 0%, #fcb728 50%, #d97706 100%);
  box-shadow: 0 0 10px rgba(252, 183, 40, 0.8), 0 0 4px #fde047;
  transition: width 0.2s cubic-bezier(0.1, 0.7, 0.1, 1);
  position: relative;
  border-radius: 0 2px 2px 0;
}

.progress-comet-glow {
  position: absolute;
  right: 0;
  top: -2px;
  bottom: -2px;
  width: 20px;
  background: radial-gradient(circle, #ffffff 10%, rgba(253, 224, 71, 0.8) 50%, transparent 80%);
  border-radius: 50%;
  animation: cometPulse 1.2s infinite ease-in-out;
}

@keyframes cometPulse {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.3); }
}

/* 2. MODAL OVERLAY CHO TÁC VỤ NẶNG */
.system-modal-backdrop {
  pointer-events: auto;
  position: fixed;
  inset: 0;
  background: rgba(9, 13, 22, 0.78);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999998;
  padding: 16px;
}

.system-modal-card {
  background: #111827;
  border: 1px solid rgba(252, 183, 40, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(252, 183, 40, 0.15);
  border-radius: 20px;
  padding: 28px 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 320px;
  width: 90%;
  animation: cardPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes cardPop {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

.loader-visual {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.spinner-ring {
  position: absolute;
  inset: 0;
  border: 3px solid rgba(252, 183, 40, 0.18);
  border-top-color: #fcb728;
  border-right-color: #fde047;
  border-radius: 50%;
  animation: spinRing 0.9s linear infinite;
}

@keyframes spinRing {
  to { transform: rotate(360deg); }
}

.center-pulse-emblem {
  animation: emblemBreath 2s infinite ease-in-out;
}

@keyframes emblemBreath {
  0%, 100% { transform: scale(0.95); opacity: 0.9; }
  50% { transform: scale(1.05); opacity: 1; }
}

.modal-loading-text {
  font-size: 15px;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 6px;
  line-height: 1.4;
}

.modal-loading-sub {
  font-size: 12.5px;
  color: #94a3b8;
}

/* Hiệu ứng Fade Overlay */
.fade-overlay-enter-active,
.fade-overlay-leave-active {
  transition: opacity 0.25s ease;
}

.fade-overlay-enter-from,
.fade-overlay-leave-to {
  opacity: 0;
}
</style>
