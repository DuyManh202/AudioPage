<template>
  <div v-if="festiveStore.isFestiveActive" class="festive-system-wrapper">
    <!-- CANVAS HIỆU ỨNG RƠI HẠT NHẸ NHÀNG (HOA MAI / ĐÀO / TUYẾT / CONFETTI) -->
    <canvas
      v-show="festiveStore.shouldShowFalling"
      ref="canvasRef"
      class="festive-canvas"
      aria-hidden="true"
    ></canvas>
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
    // 35% Cánh hoa tuyết tinh thể 6 nhánh, 65% bông tuyết tròn mềm mại
    const isCrystal = Math.random() < 0.35
    return {
      type: isCrystal ? 'crystal' : 'snow',
      x,
      y,
      size: isCrystal ? (Math.random() * 5 + 6) : (Math.random() * 4 + 2.5),
      speedY: Math.random() * 1.3 + 0.7,
      speedX: Math.random() * 0.9 - 0.45,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 1.8,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.03 + 0.015,
      opacity: Math.random() * 0.4 + 0.6
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

// Vẽ cánh hoa tuyết tinh thể 6 nhánh (Noel)
function drawCrystal(ctx, p) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate((p.rotation * Math.PI) / 180)
  ctx.globalAlpha = p.opacity

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.3
  ctx.lineCap = 'round'

  // 6 nhánh hoa tuyết đối xứng
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, p.size)
    // Nhánh phụ chữ V
    ctx.moveTo(0, p.size * 0.55)
    ctx.lineTo(p.size * 0.28, p.size * 0.8)
    ctx.moveTo(0, p.size * 0.55)
    ctx.lineTo(-p.size * 0.28, p.size * 0.8)
    ctx.stroke()
    ctx.rotate(Math.PI / 3)
  }

  // Điểm sáng tròn ở tâm
  ctx.beginPath()
  ctx.arc(0, 0, 1.2, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
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
    } else if (p.type === 'crystal') {
      drawCrystal(ctx, p)
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

/* CANVAS HIỆU ỨNG RƠI HẠT TINH TẾ (KHÔNG CHE CHỮ, KHÔNG CẢN TRỞ CLICK) */
.festive-canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 25;
  pointer-events: none;
  opacity: 0.55;
}
</style>
