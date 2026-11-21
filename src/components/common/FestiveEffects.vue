<template>
  <div v-if="festiveStore.isFestiveActive" class="festive-system-wrapper">
    <!-- 1. CANVAS HIỆU ỨNG RƠI HẠT (HOA MAI / ĐÀO / TUYẾT / CONFETTI) -->
    <canvas
      v-show="festiveStore.shouldShowFalling"
      ref="canvasRef"
      class="festive-canvas"
      aria-hidden="true"
    ></canvas>

    <!-- 2. TRANG TRÍ GÓC MÀN HÌNH (CORNER ACCENTS) -->
    <div v-if="festiveStore.shouldShowDecor" class="festive-corner-decors" aria-hidden="true">
      <!-- Dịp TẾT: Cành mai vàng & Đèn lồng đỏ may mắn -->
      <template v-if="festiveStore.effectiveTheme === 'tet'">
        <!-- Cành hoa mai góc trên trái -->
        <div class="corner-branch left-branch" title="Tú Audio Chúc Mừng Năm Mới">
          <svg viewBox="0 0 160 120" class="branch-svg" fill="none">
            <!-- Thân cành cây mềm mại -->
            <path d="M -10 -5 C 20 20, 60 15, 100 45 C 120 60, 135 90, 150 115" stroke="#78350f" stroke-width="4.5" stroke-linecap="round"/>
            <path d="M 50 18 C 70 8, 105 10, 120 22" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
            <path d="M 95 44 C 110 38, 130 42, 142 55" stroke="#78350f" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Chồi búp non xanh -->
            <circle cx="120" cy="22" r="3" fill="#84cc16"/>
            <circle cx="142" cy="55" r="2.8" fill="#84cc16"/>
            <circle cx="150" cy="115" r="3" fill="#84cc16"/>
            <!-- Bông hoa mai vàng 1 -->
            <g transform="translate(60, 16)">
              <circle cx="-5" cy="0" r="4.8" fill="#facc15"/>
              <circle cx="5" cy="0" r="4.8" fill="#facc15"/>
              <circle cx="0" cy="-5" r="4.8" fill="#facc15"/>
              <circle cx="0" cy="5" r="4.8" fill="#facc15"/>
              <circle cx="3.5" cy="3.5" r="4.8" fill="#facc15"/>
              <circle cx="0" cy="0" r="2.4" fill="#dc2626"/>
            </g>
            <!-- Bông hoa mai vàng 2 -->
            <g transform="translate(100, 44)">
              <circle cx="-6" cy="0" r="5.5" fill="#facc15"/>
              <circle cx="6" cy="0" r="5.5" fill="#facc15"/>
              <circle cx="0" cy="-6" r="5.5" fill="#facc15"/>
              <circle cx="0" cy="6" r="5.5" fill="#facc15"/>
              <circle cx="4" cy="4" r="5.5" fill="#facc15"/>
              <circle cx="0" cy="0" r="2.8" fill="#ea580c"/>
            </g>
            <!-- Bông hoa đào hồng 3 -->
            <g transform="translate(130, 80)">
              <circle cx="-5.5" cy="0" r="5.2" fill="#f472b6"/>
              <circle cx="5.5" cy="0" r="5.2" fill="#f472b6"/>
              <circle cx="0" cy="-5.5" r="5.2" fill="#f472b6"/>
              <circle cx="0" cy="5.5" r="5.2" fill="#f472b6"/>
              <circle cx="3.8" cy="3.8" r="5.2" fill="#f472b6"/>
              <circle cx="0" cy="0" r="2.5" fill="#e11d48"/>
            </g>
          </svg>
        </div>

        <!-- Cặp đèn lồng đỏ đung đưa góc trên phải -->
        <div class="lantern-cluster" title="Chúc Mừng Năm Mới">
          <div class="lantern-unit lantern-large">
            <div class="lantern-wire"></div>
            <div class="lantern-body">
              <span class="lantern-char">Phúc</span>
              <div class="lantern-tassel"></div>
            </div>
          </div>
          <div class="lantern-unit lantern-small">
            <div class="lantern-wire"></div>
            <div class="lantern-body">
              <span class="lantern-char">Lộc</span>
              <div class="lantern-tassel"></div>
            </div>
          </div>
        </div>
      </template>

      <!-- Dịp NOEL: Dải chuông vàng & nhánh thông tuyết góc phải -->
      <template v-else-if="festiveStore.effectiveTheme === 'noel'">
        <div class="noel-bells-cluster" title="Mừng Giáng Sinh & Năm Mới">
          <div class="noel-bow">🎀</div>
          <div class="noel-bell left-bell">🔔</div>
          <div class="noel-bell right-bell">🔔</div>
        </div>
      </template>

      <!-- Dịp SIÊU SALE: Băng rôn & Ngôi sao lấp lánh -->
      <template v-else-if="festiveStore.effectiveTheme === 'sale'">
        <div class="sale-badge-corner">
          <div class="sale-ribbon">
            <span>⚡ SIÊU SALE ⚡</span>
          </div>
        </div>
      </template>
    </div>

    <!-- 3. NÚT ĐIỀU KHIỂN TẮT/BẬT HIỆU ỨNG RƠI DÀNH CHO KHÁCH (TGDD STYLE) -->
    <button
      v-if="festiveStore.isFestiveActive && festiveStore.fallingEnabled"
      type="button"
      class="festive-user-toggle-btn"
      :class="{ 'is-disabled': !festiveStore.userFallingPreference }"
      @click="festiveStore.toggleUserFalling"
      :title="festiveStore.userFallingPreference ? 'Bấm để tắt hiệu ứng rơi' : 'Bấm để bật lại hiệu ứng rơi'"
    >
      <span class="toggle-icon">{{ toggleButtonIcon }}</span>
      <span class="toggle-text">{{ festiveStore.userFallingPreference ? 'Tắt hiệu ứng' : 'Bật hiệu ứng' }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useFestiveStore } from '../../stores/festiveStore'

const festiveStore = useFestiveStore()
const canvasRef = ref(null)

let animationFrameId = null
let particles = []
let canvasWidth = 0
let canvasHeight = 0

const toggleButtonIcon = computed(() => {
  switch (festiveStore.effectiveTheme) {
    case 'tet': return '🌸'
    case 'noel': return '❄️'
    case 'sale': return '🎉'
    default: return '✨'
  }
})

// Khởi tạo hạt theo chủ đề
function createParticle() {
  const theme = festiveStore.effectiveTheme
  const x = Math.random() * canvasWidth
  const y = Math.random() * -canvasHeight * 0.5 // Bắt đầu từ phía trên màn hình

  if (theme === 'tet') {
    // 60% Hoa Mai Vàng, 40% Hoa Đào Hồng
    const isApricot = Math.random() < 0.6
    return {
      type: isApricot ? 'mai' : 'dao',
      x,
      y,
      size: Math.random() * 8 + 10, // 10px - 18px
      speedY: Math.random() * 1.2 + 0.8,
      speedX: Math.random() * 1.4 - 0.7,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 2.5,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.04 + 0.02,
      opacity: Math.random() * 0.35 + 0.65
    }
  } else if (theme === 'noel') {
    // Bông tuyết trắng
    return {
      type: 'snow',
      x,
      y,
      size: Math.random() * 4 + 2, // 2px - 6px
      speedY: Math.random() * 1.5 + 0.8,
      speedX: Math.random() * 0.8 - 0.4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 1.5,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.03 + 0.015,
      opacity: Math.random() * 0.45 + 0.55
    }
  } else {
    // Confetti kim tuyến đa sắc
    const colors = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6']
    return {
      type: 'confetti',
      x,
      y,
      color: colors[Math.floor(Math.random() * colors.length)],
      width: Math.random() * 6 + 6,
      height: Math.random() * 8 + 10,
      speedY: Math.random() * 2 + 1.2,
      speedX: Math.random() * 1.6 - 0.8,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 4,
      tilt: Math.random() * 10,
      tiltSpeed: Math.random() * 0.08 + 0.04,
      opacity: Math.random() * 0.35 + 0.65
    }
  }
}

// Vẽ hoa mai vàng hoặc hoa đào hồng
function drawFlower(ctx, p) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate((p.rotation * Math.PI) / 180)
  ctx.globalAlpha = p.opacity

  const isMai = p.type === 'mai'
  const petalColor = isMai ? '#facc15' : '#f472b6'
  const centerColor = isMai ? '#ea580c' : '#e11d48'
  const r = p.size * 0.42

  // 5 cánh hoa
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5
    const px = Math.cos(angle) * r
    const py = Math.sin(angle) * r
    ctx.beginPath()
    ctx.arc(px, py, r * 0.8, 0, Math.PI * 2)
    ctx.fillStyle = petalColor
    ctx.fill()
  }

  // Nhụy hoa
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2)
  ctx.fillStyle = centerColor
  ctx.fill()

  ctx.restore()
}

// Vẽ bông tuyết
function drawSnow(ctx, p) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.globalAlpha = p.opacity

  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size)
  grad.addColorStop(0, '#ffffff')
  grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.85)')
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.beginPath()
  ctx.arc(0, 0, p.size, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()

  ctx.restore()
}

// Vẽ confetti
function drawConfetti(ctx, p) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate((p.rotation * Math.PI) / 180)
  ctx.globalAlpha = p.opacity

  ctx.fillStyle = p.color
  const curWidth = p.width * Math.cos(p.tilt)
  ctx.fillRect(-curWidth / 2, -p.height / 2, curWidth, p.height)

  ctx.restore()
}

// Vòng lặp render canvas 60fps
function loop() {
  if (!canvasRef.value) return

  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]

    // Cập nhật vị trí
    p.wobble = (p.wobble || 0) + (p.wobbleSpeed || 0.03)
    p.x += p.speedX + Math.sin(p.wobble) * 0.8
    p.y += p.speedY
    p.rotation += p.rotSpeed

    if (p.type === 'confetti') {
      p.tilt += p.tiltSpeed
    }

    // Vẽ từng hạt
    if (p.type === 'mai' || p.type === 'dao') {
      drawFlower(ctx, p)
    } else if (p.type === 'snow') {
      drawSnow(ctx, p)
    } else if (p.type === 'confetti') {
      drawConfetti(ctx, p)
    }

    // Tái sinh hạt khi ra khỏi màn hình
    if (p.y > canvasHeight + 20 || p.x < -30 || p.x > canvasWidth + 30) {
      particles[i] = createParticle()
      particles[i].y = -15
      particles[i].x = Math.random() * canvasWidth
    }
  }

  animationFrameId = requestAnimationFrame(loop)
}

function handleResize() {
  if (!canvasRef.value) return
  canvasWidth = window.innerWidth
  canvasHeight = window.innerHeight
  canvasRef.value.width = canvasWidth
  canvasRef.value.height = canvasHeight

  // Số lượng hạt tối ưu (Mobile 16 hạt, Desktop 32 hạt để đảm bảo siêu mượt 60fps)
  const count = canvasWidth < 768 ? 16 : 32
  particles = Array.from({ length: count }, () => createParticle())
}

function initCanvas() {
  if (!canvasRef.value) return
  handleResize()
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (festiveStore.shouldShowFalling) {
    animationFrameId = requestAnimationFrame(loop)
  }
}

function stopCanvas() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  }
}

// Theo dõi thay đổi trạng thái để bật/tắt canvas
watch(
  () => [festiveStore.shouldShowFalling, festiveStore.effectiveTheme],
  ([shouldShow]) => {
    if (shouldShow) {
      handleResize()
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(loop)
      }
    } else {
      stopCanvas()
    }
  }
)

onMounted(() => {
  window.addEventListener('resize', handleResize)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopCanvas()
    } else if (festiveStore.shouldShowFalling) {
      animationFrameId = requestAnimationFrame(loop)
    }
  })

  // Đảm bảo DOM canvas sẵn sàng
  setTimeout(() => {
    initCanvas()
  }, 100)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  stopCanvas()
})
</script>

<style scoped>
.festive-system-wrapper {
  pointer-events: none;
}

/* 1. CANVAS */
.festive-canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9998;
  pointer-events: none;
}

/* 2. TRANG TRÍ GÓC (CORNER ACCENTS) */
.festive-corner-decors {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9997;
  overflow: hidden;
}

/* Cành hoa mai góc trên trái */
.corner-branch.left-branch {
  position: fixed;
  top: 0;
  left: 0;
  width: 150px;
  height: 110px;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.15));
  animation: branchSway 4s ease-in-out infinite alternate;
  transform-origin: top left;
}

.branch-svg {
  width: 100%;
  height: 100%;
}

@keyframes branchSway {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(2.5deg); }
}

/* Cặp đèn lồng đỏ may mắn góc trên phải */
.lantern-cluster {
  position: fixed;
  top: 0;
  right: 18px;
  display: flex;
  gap: 14px;
}

.lantern-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  transform-origin: top center;
  animation: lanternSwing 3.5s ease-in-out infinite alternate;
}

.lantern-unit.lantern-small {
  animation-delay: -1.7s;
  animation-duration: 3s;
}

.lantern-wire {
  width: 2px;
  height: 22px;
  background: #b91c1c;
}

.lantern-small .lantern-wire {
  height: 34px;
}

.lantern-body {
  width: 32px;
  height: 38px;
  background: radial-gradient(circle at 40% 30%, #ef4444, #b91c1c 80%, #7f1d1d);
  border: 1.5px solid #facc15;
  border-radius: 14px;
  box-shadow: 0 0 14px rgba(239, 68, 68, 0.6), inset 0 0 6px rgba(250, 204, 21, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.lantern-small .lantern-body {
  width: 26px;
  height: 32px;
  border-radius: 12px;
}

.lantern-char {
  color: #fef08a;
  font-size: 11px;
  font-weight: 800;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  font-family: serif;
}

.lantern-small .lantern-char {
  font-size: 9.5px;
}

.lantern-tassel {
  position: absolute;
  bottom: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 14px;
  background: #facc15;
  border-radius: 0 0 2px 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

@keyframes lanternSwing {
  0% { transform: rotate(-5deg); }
  100% { transform: rotate(5deg); }
}

/* Chuông Noel góc phải */
.noel-bells-cluster {
  position: fixed;
  top: 10px;
  right: 20px;
  font-size: 26px;
  display: flex;
  align-items: center;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  animation: bellRing 2.5s ease-in-out infinite alternate;
  transform-origin: top center;
}

.noel-bow {
  font-size: 24px;
  margin-right: -10px;
  z-index: 2;
}

.noel-bell.left-bell {
  transform: rotate(-12deg);
}

.noel-bell.right-bell {
  transform: rotate(12deg);
}

@keyframes bellRing {
  0% { transform: rotate(-4deg); }
  100% { transform: rotate(4deg); }
}

/* Ribbon Siêu Sale */
.sale-badge-corner {
  position: fixed;
  top: 8px;
  right: 14px;
}

.sale-ribbon {
  background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
  color: #ffffff;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
  border: 1px solid rgba(254, 240, 138, 0.6);
  animation: salePulse 1.8s infinite ease-in-out;
}

@keyframes salePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 3. NÚT TẮT/BẬT HIỆU ỨNG RƠI CHO KHÁCH HÀNG (TGDD STYLE) */
.festive-user-toggle-btn {
  pointer-events: auto;
  position: fixed;
  bottom: 84px;
  left: 18px;
  z-index: 9990;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(17, 24, 39, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(250, 204, 21, 0.4);
  border-radius: 999px;
  color: #fef08a;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  transition: all 0.25s ease;
  user-select: none;
}

.festive-user-toggle-btn:hover {
  background: rgba(17, 24, 39, 0.98);
  border-color: #facc15;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(250, 204, 21, 0.3);
}

.festive-user-toggle-btn.is-disabled {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(148, 163, 184, 0.3);
  color: #94a3b8;
}

.toggle-icon {
  font-size: 13px;
}

/* Tối ưu màn hình Mobile */
@media (max-width: 640px) {
  .corner-branch.left-branch {
    width: 105px;
    height: 80px;
  }
  .lantern-cluster {
    right: 8px;
    gap: 8px;
  }
  .lantern-body {
    width: 26px;
    height: 32px;
  }
  .lantern-small .lantern-body {
    width: 22px;
    height: 27px;
  }
  .festive-user-toggle-btn {
    bottom: 68px;
    left: 12px;
    padding: 5px 10px;
    font-size: 11px;
  }
}
</style>
