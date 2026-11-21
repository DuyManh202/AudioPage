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
            class="theme-select-card"
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
            class="theme-select-card"
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
            class="theme-select-card"
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
            class="theme-select-card"
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
            class="theme-select-card"
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
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1380px;
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
  margin-bottom: 6px;
}

.view-badge {
  background: rgba(250, 204, 21, 0.15);
  color: #facc15;
  border: 1px solid rgba(250, 204, 21, 0.3);
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
}

.view-status-pill {
  font-size: 12px;
  font-weight: 650;
  padding: 3px 10px;
  border-radius: 999px;
  background: #1e293b;
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.view-status-pill.status-noel {
  background: rgba(34, 197, 94, 0.18);
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.4);
}

.view-status-pill.status-tet {
  background: rgba(239, 68, 68, 0.18);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.4);
}

.view-title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 800;
  color: #f8fafc;
}

.view-subtitle {
  margin: 0;
  font-size: 13.5px;
  color: #94a3b8;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-preview-web {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #1e293b;
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 9px 16px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-preview-web:hover {
  background: #28374d;
  border-color: #60a5fa;
}

.btn-save-settings {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #facc15 0%, #ea580c 100%);
  color: #0f172a;
  border: none;
  padding: 10px 22px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(250, 204, 21, 0.35);
  transition: all 0.2s;
}

.btn-save-settings:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(250, 204, 21, 0.5);
}

.btn-save-settings:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 2. KHUNG XEM TRƯỚC TRỰC QUAN (SIMULATOR) */
.preview-section-card {
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

.preview-header {
  background: #090d16;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
.preview-dot.red { background: #ef4444; }
.preview-dot.yellow { background: #f59e0b; }
.preview-dot.green { background: #10b981; }

.preview-label {
  margin-left: 6px;
  font-size: 12.5px;
  font-weight: 650;
  color: #cbd5e1;
}

.preview-meta {
  font-size: 12px;
  color: #94a3b8;
}
.preview-meta strong {
  color: #facc15;
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
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.card-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 750;
  color: #f8fafc;
}

.heading-icon {
  font-size: 20px;
}

.card-desc {
  margin: 0 0 20px;
  font-size: 12.5px;
  color: #94a3b8;
}

/* DANH SÁCH CHỌN CHỦ ĐỀ */
.theme-select-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.theme-select-card {
  background: #1e293b;
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  transition: all 0.2s ease;
  user-select: none;
}

.theme-select-card:hover {
  background: #243247;
  border-color: rgba(250, 204, 21, 0.4);
  transform: translateY(-1px);
}

.theme-select-card.is-active {
  background: rgba(250, 204, 21, 0.08);
  border-color: #facc15;
  box-shadow: 0 0 16px rgba(250, 204, 21, 0.2);
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
  font-size: 14px;
  color: #f8fafc;
}

.theme-chip {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
}
.theme-chip.chip-green { background: #166534; color: #bbf7d0; }
.theme-chip.chip-red { background: #991b1b; color: #fecaca; }
.theme-chip.chip-gold { background: #854d0e; color: #fef08a; }
.theme-chip.chip-blue { background: #1e40af; color: #bfdbfe; }

.theme-detail {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.45;
}

.radio-circle {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #64748b;
  position: relative;
  transition: all 0.2s;
}

.radio-circle.checked {
  border-color: #facc15;
}

.radio-circle.checked::after {
  content: '';
  position: absolute;
  inset: 3px;
  background: #facc15;
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
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.switch-row:hover {
  background: #243247;
}

.switch-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.switch-title {
  font-size: 13.5px;
  font-weight: 650;
  color: #f8fafc;
}

.switch-desc {
  font-size: 11.5px;
  color: #94a3b8;
}

.ui-toggle-checkbox {
  width: 20px;
  height: 20px;
  accent-color: #facc15;
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
  color: #f8fafc;
}

.editor-desc {
  font-size: 12px;
  color: #94a3b8;
}

.ui-textarea {
  width: 100%;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13.5px;
  color: #f8fafc;
  outline: none;
  font-family: inherit;
  resize: vertical;
  line-height: 1.45;
  transition: border-color 0.2s;
}

.ui-textarea:focus {
  border-color: #facc15;
}

.template-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.chip-label {
  font-size: 11.5px;
  color: #94a3b8;
}

.btn-template-chip {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-template-chip:hover {
  background: #28374d;
  color: #facc15;
  border-color: #facc15;
}

.btn-template-chip.reset {
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.3);
}

.help-box {
  background: rgba(30, 41, 59, 0.6);
  border-left: 3px solid #facc15;
  border-radius: 0 8px 8px 0;
  padding: 12px 16px;
}

.help-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #facc15;
  margin-bottom: 4px;
}

.help-text {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
}
</style>
