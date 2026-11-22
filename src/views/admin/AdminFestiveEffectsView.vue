<template>
  <div class="festive-admin-view">
    <!-- 1. HEADER TRANG QUẢN LÝ -->
    <div class="view-header flex-between">
      <div>
        <div class="header-badges">
          <span class="view-badge">Cài Đặt Giao Diện &amp; Sự Kiện</span>
          <span class="view-status-pill" :class="`status-${festiveStore.effectiveTheme}`">
            {{ currentStatusLabel }}
          </span>
        </div>
        <h1 class="view-title">Quản Lý Hiệu Ứng Lễ Hội &amp; Sự Kiện</h1>
        <p class="view-subtitle">
          Chủ động điều phối giao diện theo mùa: Giáng Sinh Noel, Tết Nguyên Đán, Siêu Sale hoặc Tự động theo lịch năm.
        </p>
      </div>

      <div class="header-actions">
        <a href="/" target="_blank" class="btn-preview-web" title="Mở trang chủ xem trực tiếp">
          <span>🌐</span> Xem Trang Web
        </a>
        <button
          type="button"
          class="btn-save-settings"
          :disabled="isSaving"
          @click="saveChanges"
        >
          <span class="btn-save-icon">{{ isSaving ? '⏳' : '💾' }}</span>
          <span>{{ isSaving ? 'Đang lưu...' : 'Lưu &amp; Kích Hoạt Tức Thì' }}</span>
        </button>
      </div>
    </div>

    <!-- 2. KHUNG XEM TRƯỚC TRỰC QUAN (LIVE SIMULATOR) -->
    <div class="preview-section-card">
      <div class="preview-header">
        <div class="preview-title-box">
          <span class="preview-dot red"></span>
          <span class="preview-dot yellow"></span>
          <span class="preview-dot green"></span>
          <span class="preview-label">Khung Xem Trước Trực Quan Tức Thì (Live Preview)</span>
        </div>
        <div class="preview-meta">
          Đang xem trước: <strong>{{ previewThemeTitle }}</strong>
        </div>
      </div>

      <!-- Mô phỏng màn hình Web thu nhỏ -->
      <div class="simulator-screen" :class="`sim-theme-${form.theme}`">
        <!-- Canvas tuyết / hoa rơi giả lập trong khung -->
        <canvas v-if="form.fallingEnabled && form.theme !== 'none'" ref="simCanvasRef" class="sim-canvas"></canvas>

        <!-- Thanh Ticker giả lập -->
        <div class="sim-ticker-bar" :class="`ticker-${simEffectiveTheme}`">
          <span>{{ simTickerMessage }}</span>
        </div>

        <!-- Thanh Header giả lập -->
        <div class="sim-header-bar">
          <div class="sim-logo-box">
            <div class="sim-logo-emblem">
              <span>TA</span>
              <!-- Mũ noel hoặc hoa mai trên logo -->
              <span v-if="form.decorEnabled && simEffectiveTheme === 'noel'" class="sim-hat">🎅</span>
              <span v-else-if="form.decorEnabled && simEffectiveTheme === 'tet'" class="sim-blossom">🌸</span>
            </div>
            <div class="sim-logo-text">
              <strong>TÚ AUDIO</strong>
              <small>ÂM THANH PHÒNG HÁT</small>
            </div>
          </div>

          <div class="sim-search-bar">Tìm loa full 30, vang số K9...</div>

          <div class="sim-menu-pills">
            <span class="sim-pill gold">🔥 Dàn 19tr &amp; 29tr</span>
            <span class="sim-pill blue">🛒 Giỏ Hàng</span>
          </div>

          <!-- Phụ kiện góc giả lập -->
          <template v-if="form.decorEnabled">
            <div v-if="simEffectiveTheme === 'noel'" class="sim-corner-noel-left">🌲❄️</div>
            <div v-else-if="simEffectiveTheme === 'tet'" class="sim-corner-tet-left">🌸🌿</div>

            <div v-if="simEffectiveTheme === 'noel'" class="sim-corner-noel-right">🔔🔔</div>
            <div v-else-if="simEffectiveTheme === 'tet'" class="sim-corner-tet-right">🏮🏮</div>
          </template>
        </div>

        <!-- Banner giả lập -->
        <div class="sim-hero-banner">
          <div class="sim-hero-content">
            <div class="sim-tag">⭐ Chuyên Gia Dàn Karaoke Chuẩn Phòng Hát</div>
            <h2>Hát Nhẹ — Sạch Tiếng — Tuyệt Đối Không Hú Rít</h2>
            <p>Căn chỉnh tận nhà miễn phí bán kính 300km quanh Hà Nội - Phú Thọ</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. BẢNG ĐIỀU KHIỂN & CHỌN DỊP LỄ HỘI -->
    <div class="config-grid">
      <!-- CỘT TRÁI: CHỌN DỊP SỰ KIỆN -->
      <div class="config-card">
        <h2 class="card-heading">
          <span class="heading-icon">🎯</span>
          <span>1. Chọn Dịp Sự Kiện Hoạt Động</span>
        </h2>
        <p class="card-desc">Bấm chọn một chủ đề để áp dụng ngay lên toàn bộ hệ thống Tú Audio</p>

        <div class="theme-select-list">
          <!-- 1. GIÁNG SINH / NOEL -->
          <div
            class="theme-select-card theme-noel"
            :class="{ 'is-active': form.theme === 'noel' }"
            @click="form.theme = 'noel'"
          >
            <div class="theme-card-left">
              <span class="theme-icon">🎄</span>
              <div>
                <div class="theme-name">
                  <strong>Giáng Sinh &amp; Năm Mới (Noel)</strong>
                  <span class="theme-chip chip-green">Mùa hiện tại</span>
                </div>
                <div class="theme-detail">
                  Tuyết trắng &amp; tinh thể 6 cánh rơi nhẹ, <strong>mũ Noel đội trên Logo Tú Audio</strong>, cành thông tuyết, cặp chuông vàng.
                </div>
              </div>
            </div>
            <div class="theme-radio">
              <span class="radio-circle" :class="{ checked: form.theme === 'noel' }"></span>
            </div>
          </div>

          <!-- 2. TẾT NGUYÊN ĐÁN -->
          <div
            class="theme-select-card theme-tet"
            :class="{ 'is-active': form.theme === 'tet' }"
            @click="form.theme = 'tet'"
          >
            <div class="theme-card-left">
              <span class="theme-icon">🌸</span>
              <div>
                <div class="theme-name">
                  <strong>Tết Nguyên Đán (Xuân Bính Ngọ)</strong>
                  <span class="theme-chip chip-red">Rộn ràng</span>
                </div>
                <div class="theme-detail">
                  Cánh hoa mai vàng &amp; hoa đào hồng rơi lượn gió, cành đào góc trái, <strong>cặp đèn lồng đỏ Phúc - Lộc</strong>, hoa mai trên logo.
                </div>
              </div>
            </div>
            <div class="theme-radio">
              <span class="radio-circle" :class="{ checked: form.theme === 'tet' }"></span>
            </div>
          </div>

          <!-- 3. ĐẠI TIỆC SIÊU SALE -->
          <div
            class="theme-select-card theme-sale"
            :class="{ 'is-active': form.theme === 'sale' }"
            @click="form.theme = 'sale'"
          >
            <div class="theme-card-left">
              <span class="theme-icon">⚡</span>
              <div>
                <div class="theme-name">
                  <strong>Đại Tiệc Siêu Sale (Black Friday &amp; Khuyến Mãi)</strong>
                  <span class="theme-chip chip-gold">Giảm sâu</span>
                </div>
                <div class="theme-detail">
                  Pháo giấy kim tuyến ngũ sắc (Confetti) xoay lật rơi 3D, dải ruy băng đỏ vàng siêu sale phát quang.
                </div>
              </div>
            </div>
            <div class="theme-radio">
              <span class="radio-circle" :class="{ checked: form.theme === 'sale' }"></span>
            </div>
          </div>

          <!-- 4. TỰ ĐỘNG THEO LỊCH -->
          <div
            class="theme-select-card theme-auto"
            :class="{ 'is-active': form.theme === 'auto' }"
            @click="form.theme = 'auto'"
          >
            <div class="theme-card-left">
              <span class="theme-icon">🤖</span>
              <div>
                <div class="theme-name">
                  <strong>Tự Động Theo Lịch Năm (Smart Auto)</strong>
                  <span class="theme-chip chip-blue">Tự vận hành</span>
                </div>
                <div class="theme-detail">
                  Hệ thống tự động kích hoạt: <strong>Tháng 12 Noel</strong>, <strong>Tháng 1-2 Tết</strong>, <strong>Tháng 11 Siêu Sale</strong> theo đúng chu kỳ.
                </div>
              </div>
            </div>
            <div class="theme-radio">
              <span class="radio-circle" :class="{ checked: form.theme === 'auto' }"></span>
            </div>
          </div>

          <!-- 5. TẮT HIỆU ỨNG -->
          <div
            class="theme-select-card theme-none"
            :class="{ 'is-active': form.theme === 'none' }"
            @click="form.theme = 'none'"
          >
            <div class="theme-card-left">
              <span class="theme-icon">☀️</span>
              <div>
                <div class="theme-name">
                  <strong>Tắt Hiệu Ứng (Giao Diện Tiêu Chuẩn)</strong>
                </div>
                <div class="theme-detail">
                  Trở về giao diện thông thường, không hiển thị hạt rơi hay phụ kiện trang trí sự kiện.
                </div>
              </div>
            </div>
            <div class="theme-radio">
              <span class="radio-circle" :class="{ checked: form.theme === 'none' }"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- CỘT PHẢI: CHI TIẾT TINH CHỈNH & THÔNG ĐIỆP -->
      <div class="config-card">
        <h2 class="card-heading">
          <span class="heading-icon">⚙️</span>
          <span>2. Tùy Chọn Tinh Chỉnh &amp; Thông Điệp</span>
        </h2>
        <p class="card-desc">Kiểm soát chi tiết các thành phần hiển thị trên giao diện người dùng</p>

        <div class="switches-list">
          <!-- Switch 1: Hạt rơi -->
          <label class="switch-row">
            <div class="switch-info">
              <div class="switch-title">Hiệu ứng hạt rơi toàn màn hình (Canvas 60fps)</div>
              <div class="switch-desc">Tự động điều phối số lượng hạt tối ưu để chạy mượt mà trên cả điện thoại cũ</div>
            </div>
            <input type="checkbox" v-model="form.fallingEnabled" class="ui-toggle-checkbox" />
          </label>

          <!-- Switch 2: Phụ kiện trang trí -->
          <label class="switch-row">
            <div class="switch-info">
              <div class="switch-title">Phụ kiện trang trí Header &amp; Logo Tú Audio</div>
              <div class="switch-desc">Gắn mũ Noel/hoa mai trên logo, cành thông tuyết, đèn lồng, chuông vàng góc trang</div>
            </div>
            <input type="checkbox" v-model="form.decorEnabled" class="ui-toggle-checkbox" />
          </label>
        </div>

        <!-- Soạn thảo thông điệp Ticker -->
        <div class="ticker-editor-box">
          <label class="editor-label" for="custom-ticker-input">
            <span class="editor-icon">📢</span>
            <strong>Thông Điệp Chạy Chữ Trên Thanh Header (Ticker Message)</strong>
          </label>
          <div class="editor-desc">Nội dung sẽ chạy ở dải banner trên cùng của trang web để thu hút khách hàng</div>

          <textarea
            id="custom-ticker-input"
            v-model="form.customTicker"
            rows="3"
            class="ui-textarea"
            placeholder="Để trống sẽ tự động dùng câu chúc tiêu chuẩn của dịp lễ đang chọn..."
          ></textarea>

          <!-- Các nút gợi ý câu chúc mẫu nhanh -->
          <div class="template-chips">
            <span class="chip-label">Nạp nhanh câu mẫu:</span>
            <button
              type="button"
              class="btn-template-chip"
              @click="form.customTicker = '🎄 Mừng Giáng Sinh & Năm Mới — Trọn Bộ Dàn Hát Ấm Áp Gia Đình — Miễn Phí Cân Chỉnh 300km'"
            >
              🎄 Câu chúc Noel ấm áp
            </button>
            <button
              type="button"
              class="btn-template-chip"
              @click="form.customTicker = '🌸 Chúc Mừng Năm Mới — Rộn Ràng Hát Ca — Lắp Đặt & Cân Chỉnh Âm Học Tận Nhà Miễn Phí 300km'"
            >
              🌸 Câu chúc Tết tài lộc
            </button>
            <button
              type="button"
              class="btn-template-chip"
              @click="form.customTicker = '⚡ ĐẠI TIỆC SIÊU SALE ÂM THANH — Giảm Sốc Đến 10 Triệu/Bộ — Thử Dàn Tận Nhà Ưng Ý Mới Thanh Toán'"
            >
              ⚡ Đại tiệc Siêu Sale
            </button>
            <button
              type="button"
              class="btn-template-chip reset"
              @click="form.customTicker = ''"
            >
              🔄 Đặt lại mặc định
            </button>
          </div>
        </div>

        <!-- Hướng dẫn nhanh -->
        <div class="help-box">
          <div class="help-title">💡 Lưu ý quan trọng từ Tú Audio</div>
          <p class="help-text">
            Mọi thay đổi khi bấm <strong>Lưu &amp; Kích Hoạt Tức Thì</strong> sẽ được đồng bộ trực tiếp vào cơ sở dữ liệu Aiven PostgreSQL. Tất cả khách hàng đang xem web sẽ thấy giao diện cập nhật ngay lập tức mà không cần xóa cache trình duyệt.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useFestiveStore } from '../../stores/festiveStore'
import { showSuccess, showError } from '../../utils/toast'

const festiveStore = useFestiveStore()
const isSaving = ref(false)
const simCanvasRef = ref(null)

const form = reactive({
  theme: 'noel',
  fallingEnabled: true,
  decorEnabled: true,
  customTicker: ''
})

let simAnimId = null
let simParticles = []

const currentStatusLabel = computed(() => {
  return `Đang áp dụng: ${festiveStore.themeLabel}`
})

const simEffectiveTheme = computed(() => {
  if (form.theme !== 'auto') return form.theme
  const now = new Date()
  const month = now.getMonth() + 1
  const date = now.getDate()
  if ((month === 11 && date >= 15) || month === 12 || (month === 1 && date <= 5)) return 'noel'
  if (month === 1 || month === 2) return 'tet'
  if (month === 11) return 'sale'
  return 'noel'
})

const previewThemeTitle = computed(() => {
  switch (simEffectiveTheme.value) {
    case 'noel': return '🎄 Giáng Sinh & Noel (Tuyết rơi & Mũ Noel)'
    case 'tet': return '🌸 Tết Nguyên Đán (Hoa mai & Đèn lồng)'
    case 'sale': return '⚡ Đại Tiệc Siêu Sale (Confetti đa sắc)'
    default: return '☀️ Giao Diện Thường (Không hiệu ứng)'
  }
})

const simTickerMessage = computed(() => {
  if (form.customTicker && form.customTicker.trim()) return form.customTicker.trim()
  switch (simEffectiveTheme.value) {
    case 'noel': return '🎄 Mừng Giáng Sinh & Năm Mới — Trọn Bộ Dàn Hát Ấm Áp Gia Đình — Miễn Phí Lắp Đặt & Cân Chỉnh 300km'
    case 'tet': return '🌸 Chúc Mừng Năm Mới — Rộn Ràng Hát Ca — Lắp Đặt & Cân Chỉnh Âm Học Tận Nhà Miễn Phí 300km'
    case 'sale': return '⚡ ĐẠI TIỆC SIÊU SALE ÂM THANH — Giảm Sốc Đến 10 Triệu/Bộ — Thử Dàn Tận Nhà'
    default: return 'Lắp đặt & Cân chỉnh tận nhà miễn phí bán kính 300km quanh Hà Nội - Phú Thọ'
  }
})

// Khởi tạo hạt trong simulator
function createSimParticle(w, h) {
  const theme = simEffectiveTheme.value
  const x = Math.random() * w
  const y = Math.random() * -h * 0.5

  if (theme === 'tet') {
    return {
      type: Math.random() < 0.6 ? 'mai' : 'dao',
      x, y,
      size: Math.random() * 4 + 6,
      speedY: Math.random() * 0.8 + 0.6,
      speedX: Math.random() * 0.8 - 0.4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 2,
      opacity: Math.random() * 0.4 + 0.6
    }
  } else if (theme === 'noel') {
    const isCrystal = Math.random() < 0.35
    return {
      type: isCrystal ? 'crystal' : 'snow',
      x, y,
      size: isCrystal ? (Math.random() * 3 + 4) : (Math.random() * 2 + 1.5),
      speedY: Math.random() * 0.9 + 0.5,
      speedX: Math.random() * 0.6 - 0.3,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 1.5,
      opacity: Math.random() * 0.4 + 0.6
    }
  } else {
    const colors = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#ec4899']
    return {
      type: 'confetti',
      x, y,
      color: colors[Math.floor(Math.random() * colors.length)],
      width: Math.random() * 3 + 4,
      height: Math.random() * 5 + 6,
      speedY: Math.random() * 1.2 + 0.8,
      speedX: Math.random() * 0.8 - 0.4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 3,
      opacity: Math.random() * 0.4 + 0.6
    }
  }
}

function renderSim() {
  if (!simCanvasRef.value) return
  const canvas = simCanvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  for (let i = 0; i < simParticles.length; i++) {
    const p = simParticles[i]
    p.y += p.speedY
    p.x += p.speedX
    p.rotation += p.rotSpeed

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.globalAlpha = p.opacity

    if (p.type === 'snow') {
      ctx.beginPath()
      ctx.arc(0, 0, p.size, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
    } else if (p.type === 'crystal') {
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.2
      for (let j = 0; j < 6; j++) {
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(0, p.size)
        ctx.stroke()
        ctx.rotate(Math.PI / 3)
      }
    } else if (p.type === 'mai' || p.type === 'dao') {
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.fillStyle = p.type === 'mai' ? '#facc15' : '#f472b6'
      ctx.beginPath()
      ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2)
      ctx.fill()
    } else if (p.type === 'confetti') {
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height)
    }

    ctx.restore()

    if (p.y > h + 10 || p.x < -10 || p.x > w + 10) {
      simParticles[i] = createSimParticle(w, h)
      simParticles[i].y = -5
    }
  }

  simAnimId = requestAnimationFrame(renderSim)
}

function initSim() {
  if (!simCanvasRef.value) return
  const canvas = simCanvasRef.value
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width || 700
  canvas.height = rect.height || 260
  simParticles = Array.from({ length: 22 }, () => createSimParticle(canvas.width, canvas.height))
  if (simAnimId) cancelAnimationFrame(simAnimId)
  if (form.fallingEnabled && form.theme !== 'none') {
    simAnimId = requestAnimationFrame(renderSim)
  }
}

watch(
  () => [form.theme, form.fallingEnabled, form.decorEnabled],
  () => {
    setTimeout(initSim, 50)
  }
)

async function saveChanges() {
  isSaving.value = true
  const res = await festiveStore.saveSettings({
    theme: form.theme,
    fallingEnabled: form.fallingEnabled,
    decorEnabled: form.decorEnabled,
    customTicker: form.customTicker
  })

  isSaving.value = false
  if (res.success) {
    showSuccess('Đã lưu cấu hình dịp lễ hội thành công! Giao diện trang chủ và toàn hệ thống đã cập nhật tức thì.', 'Lưu Thành Công')
  } else {
    showError(res.message || 'Lỗi khi lưu cấu hình!', 'Lưu Cấu Hình Thất Bại')
  }
}

onMounted(async () => {
  await festiveStore.fetchSettings()
  form.theme = festiveStore.theme
  form.fallingEnabled = festiveStore.fallingEnabled
  form.decorEnabled = festiveStore.decorEnabled
  form.customTicker = festiveStore.customTicker

  setTimeout(initSim, 150)
})

onBeforeUnmount(() => {
  if (simAnimId) cancelAnimationFrame(simAnimId)
})
</script>

<style scoped>
.festive-admin-view {
  padding: 24px 28px 60px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* HEADER */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.header-badges {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.view-badge {
  background: #FEF3C7;
  color: #92400E;
  border: 1px solid #FCD34D;
  font-size: 11px;
  font-weight: 750;
  padding: 3px 9px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.view-status-pill {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 999px;
  background: #F1F5F9;
  color: #334155;
  border: 1px solid #CBD5E1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.view-status-pill.status-noel {
  background: #DCFCE7;
  color: #15803D;
  border-color: #86EFAC;
}

.view-status-pill.status-tet {
  background: #FEE2E2;
  color: #B91C1C;
  border-color: #FCA5A5;
}

.view-status-pill.status-sale {
  background: #FEF3C7;
  color: #B45309;
  border-color: #FDE68A;
}

.view-status-pill.status-auto {
  background: #DBEAFE;
  color: #1D4ED8;
  border-color: #93C5FD;
}

.view-status-pill.status-none {
  background: #F1F5F9;
  color: #64748B;
  border-color: #CBD5E1;
}

.view-title {
  margin: 0 0 6px;
  font-family: var(--font-display, inherit);
  font-size: 1.55rem;
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -0.01em;
  line-height: 1.25;
}

.view-subtitle {
  margin: 0;
  font-size: 0.88rem;
  color: #64748B;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-preview-web {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  color: #0F172A;
  border: 1.5px solid #CBD5E1;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.btn-preview-web:hover {
  background: #F8FAFC;
  border-color: #94A3B8;
  color: #2563EB;
  transform: translateY(-1px);
}

.btn-save-settings {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  color: #FFFFFF;
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(217, 119, 6, 0.35);
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.btn-save-settings:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(217, 119, 6, 0.45);
}

.btn-save-settings:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 2. KHUNG XEM TRƯỚC TRỰC QUAN (SIMULATOR) */
.preview-section-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 28px -6px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02);
}

.preview-header {
  background: #F8FAFC;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #E2E8F0;
}

.preview-title-box {
  display: flex;
  align-items: center;
  gap: 7px;
}

.preview-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.preview-dot.red { background: #EF4444; }
.preview-dot.yellow { background: #F59E0B; }
.preview-dot.green { background: #10B981; }

.preview-label {
  margin-left: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.preview-meta {
  font-size: 12.5px;
  color: #64748B;
}

.preview-meta strong {
  color: #B45309;
  background: #FEF3C7;
  padding: 2px 10px;
  border-radius: 6px;
  font-weight: 750;
  border: 1px solid #FDE68A;
}

.simulator-screen {
  position: relative;
  background: #ffffff;
  min-height: 260px;
  overflow: hidden;
  color: #0f172a;
}

.sim-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.sim-ticker-bar {
  background: linear-gradient(90deg, #1e3a8a, #2563eb);
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  padding: 6px 16px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
  z-index: 5;
}

.sim-ticker-bar.ticker-noel {
  background: linear-gradient(90deg, #14532d 0%, #1e3a8a 50%, #14532d 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.3);
}

.sim-ticker-bar.ticker-tet {
  background: linear-gradient(90deg, #991b1b 0%, #1e3a8a 50%, #991b1b 100%);
  border-bottom: 1px solid rgba(250, 204, 21, 0.4);
}

.sim-ticker-bar.ticker-sale {
  background: linear-gradient(90deg, #b91c1c 0%, #c2410c 50%, #b91c1c 100%);
  border-bottom: 1px solid rgba(250, 204, 21, 0.5);
}

.sim-header-bar {
  background: #ffffff;
  padding: 10px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e2e8f0;
  position: relative;
  z-index: 5;
}

.sim-logo-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sim-logo-emblem {
  position: relative;
  width: 32px;
  height: 32px;
  background: #090d16;
  border: 1px solid #fcb728;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #facc15;
  font-size: 11px;
  font-weight: 800;
}

.sim-hat {
  position: absolute;
  top: -8px;
  right: -6px;
  font-size: 15px;
}

.sim-blossom {
  position: absolute;
  top: -6px;
  right: -5px;
  font-size: 14px;
}

.sim-logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.sim-logo-text strong {
  font-size: 12px;
  color: #0f172a;
}
.sim-logo-text small {
  font-size: 9px;
  color: #64748b;
}

.sim-search-bar {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 11px;
  color: #64748b;
  width: 200px;
}

.sim-menu-pills {
  display: flex;
  gap: 6px;
}

.sim-pill {
  font-size: 10.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
}
.sim-pill.gold {
  background: #fef08a;
  color: #854d0e;
}
.sim-pill.blue {
  background: #dbeafe;
  color: #1e40af;
}

/* Phụ kiện góc giả lập */
.sim-corner-noel-left {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 18px;
}
.sim-corner-tet-left {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 18px;
}
.sim-corner-noel-right {
  position: absolute;
  top: 4px;
  right: 10px;
  font-size: 18px;
}
.sim-corner-tet-right {
  position: absolute;
  top: 4px;
  right: 10px;
  font-size: 18px;
}

.sim-hero-banner {
  padding: 30px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 140px;
}

.sim-hero-content {
  max-width: 500px;
}

.sim-tag {
  display: inline-block;
  background: #fef3c7;
  color: #92400e;
  font-size: 10px;
  font-weight: 750;
  padding: 2px 8px;
  border-radius: 999px;
  margin-bottom: 6px;
}

.sim-hero-content h2 {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px;
}

.sim-hero-content p {
  font-size: 11.5px;
  color: #64748b;
  margin: 0;
}

/* 3. GRID CẤU HÌNH */
.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 1024px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
}

.config-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 24px 26px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.04);
}

.card-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 4px;
  font-size: 16.5px;
  font-weight: 800;
  color: #0F172A;
}

.heading-icon {
  font-size: 20px;
}

.card-desc {
  margin: 0 0 20px;
  font-size: 13px;
  color: #64748B;
}

/* DANH SÁCH CHỌN CHỦ ĐỀ */
.theme-select-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.theme-select-card {
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 14px;
  padding: 16px 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  user-select: none;
}

.theme-select-card:hover {
  background: #FFFFFF;
  border-color: #CBD5E1;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  transform: translateY(-1px);
}

.theme-select-card.theme-noel.is-active {
  background: #F0FDF4;
  border-color: #22C55E;
  box-shadow: 0 0 0 1px #22C55E, 0 4px 16px rgba(34, 197, 94, 0.12);
}

.theme-select-card.theme-tet.is-active {
  background: #FEF2F2;
  border-color: #EF4444;
  box-shadow: 0 0 0 1px #EF4444, 0 4px 16px rgba(239, 68, 68, 0.12);
}

.theme-select-card.theme-sale.is-active {
  background: #FFFBEB;
  border-color: #F59E0B;
  box-shadow: 0 0 0 1px #F59E0B, 0 4px 16px rgba(245, 158, 11, 0.12);
}

.theme-select-card.theme-auto.is-active {
  background: #EFF6FF;
  border-color: #3B82F6;
  box-shadow: 0 0 0 1px #3B82F6, 0 4px 16px rgba(59, 130, 246, 0.12);
}

.theme-select-card.theme-none.is-active {
  background: #F1F5F9;
  border-color: #64748B;
  box-shadow: 0 0 0 1px #64748B, 0 4px 16px rgba(100, 116, 139, 0.12);
}

.theme-card-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.theme-icon {
  font-size: 28px;
  line-height: 1;
  margin-top: 2px;
}

.theme-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 14.5px;
  color: #0F172A;
  font-weight: 750;
}

.theme-chip {
  font-size: 11px;
  font-weight: 750;
  padding: 2px 8px;
  border-radius: 999px;
}
.theme-chip.chip-green { background: #DCFCE7; color: #15803D; }
.theme-chip.chip-red { background: #FEE2E2; color: #B91C1C; }
.theme-chip.chip-gold { background: #FEF3C7; color: #B45309; }
.theme-chip.chip-blue { background: #DBEAFE; color: #1D4ED8; }

.theme-detail {
  font-size: 12.5px;
  color: #64748B;
  line-height: 1.45;
}

.radio-circle {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #CBD5E1;
  background: #FFFFFF;
  position: relative;
  transition: all 0.2s;
  flex-shrink: 0;
}

.theme-noel .radio-circle.checked { border-color: #22C55E; }
.theme-noel .radio-circle.checked::after {
  content: '';
  position: absolute;
  inset: 3px;
  background: #22C55E;
  border-radius: 50%;
}

.theme-tet .radio-circle.checked { border-color: #EF4444; }
.theme-tet .radio-circle.checked::after {
  content: '';
  position: absolute;
  inset: 3px;
  background: #EF4444;
  border-radius: 50%;
}

.theme-sale .radio-circle.checked { border-color: #F59E0B; }
.theme-sale .radio-circle.checked::after {
  content: '';
  position: absolute;
  inset: 3px;
  background: #F59E0B;
  border-radius: 50%;
}

.theme-auto .radio-circle.checked { border-color: #3B82F6; }
.theme-auto .radio-circle.checked::after {
  content: '';
  position: absolute;
  inset: 3px;
  background: #3B82F6;
  border-radius: 50%;
}

.theme-none .radio-circle.checked { border-color: #64748B; }
.theme-none .radio-circle.checked::after {
  content: '';
  position: absolute;
  inset: 3px;
  background: #64748B;
  border-radius: 50%;
}

/* SWITCHES */
.switches-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 22px;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.switch-row:hover {
  background: #FFFFFF;
  border-color: #CBD5E1;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.switch-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.switch-title {
  font-size: 13.5px;
  font-weight: 750;
  color: #0F172A;
}

.switch-desc {
  font-size: 12px;
  color: #64748B;
}

.ui-toggle-checkbox {
  width: 20px;
  height: 20px;
  accent-color: #2563EB;
  cursor: pointer;
}

/* TICKER EDITOR */
.ticker-editor-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.editor-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  color: #0F172A;
  font-weight: 750;
}

.editor-desc {
  font-size: 12.5px;
  color: #64748B;
}

.ui-textarea {
  width: 100%;
  background: #F8FAFC;
  border: 1.5px solid #CBD5E1;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13.5px;
  color: #0F172A;
  outline: none;
  font-family: inherit;
  resize: vertical;
  line-height: 1.5;
  transition: all 0.2s;
}

.ui-textarea:focus {
  background: #FFFFFF;
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.template-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.chip-label {
  font-size: 12px;
  color: #64748B;
  font-weight: 600;
}

.btn-template-chip {
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  color: #334155;
  font-size: 12px;
  font-weight: 650;
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-template-chip:hover {
  background: #E2E8F0;
  color: #0F172A;
  border-color: #CBD5E1;
  transform: translateY(-1px);
}

.btn-template-chip.reset {
  color: #DC2626;
  background: #FEF2F2;
  border-color: #FECACA;
}

.btn-template-chip.reset:hover {
  background: #FEE2E2;
  border-color: #F87171;
}

.help-box {
  background: #FEF3C7;
  border-left: 4px solid #D97706;
  border-radius: 8px;
  padding: 14px 18px;
}

.help-title {
  font-size: 13px;
  font-weight: 800;
  color: #92400E;
  margin-bottom: 4px;
}

.help-text {
  font-size: 12.5px;
  color: #78350F;
  margin: 0;
  line-height: 1.5;
}
</style>
