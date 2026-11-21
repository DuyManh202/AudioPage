<template>
  <Transition name="festive-modal-fade">
    <div v-if="festiveStore.isAdminModalOpen" class="festive-modal-backdrop" @click.self="closeModal">
      <div class="festive-modal-dialog">
        <!-- HEADER -->
        <div class="festive-modal-header">
          <div class="header-title-box">
            <span class="header-icon">🎉</span>
            <div>
              <h3 class="header-title">Cấu Hình Hiệu Ứng Lễ Hội &amp; Sự Kiện</h3>
              <p class="header-sub">Tự động trang trí hoa mai/đào rơi, tuyết giáng sinh, cành đào, mũ noel trên logo</p>
            </div>
          </div>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Đóng">&times;</button>
        </div>

        <!-- BODY -->
        <div class="festive-modal-body">
          <!-- 1. CHỌN DỊP LỄ HỘI -->
          <div class="setting-section">
            <label class="section-label">1. Chọn Dịp Sự Kiện / Lễ Hội Đang Diễn Ra</label>
            <div class="theme-grid">
              <!-- GIÁNG SINH / NOEL -->
              <div
                class="theme-card"
                :class="{ 'is-selected': tempSettings.theme === 'noel' }"
                @click="tempSettings.theme = 'noel'"
              >
                <div class="card-badge" style="background: #166534;">🎄 Mùa Hiện Tại</div>
                <div class="card-icon">🎄</div>
                <div class="card-title">Giáng Sinh / Noel</div>
                <div class="card-desc">Bông tuyết trắng &amp; tinh thể rơi lung linh, mũ Noel đội trên logo Tú Audio, cành thông tuyết, chuông vàng giáng sinh</div>
              </div>

              <!-- TẾT NGUYÊN ĐÁN -->
              <div
                class="theme-card"
                :class="{ 'is-selected': tempSettings.theme === 'tet' }"
                @click="tempSettings.theme = 'tet'"
              >
                <div class="card-icon">🌸</div>
                <div class="card-title">Tết Nguyên Đán</div>
                <div class="card-desc">Hoa mai &amp; hoa đào rơi nhẹ, cành mai may mắn, lồng đèn đỏ Phúc Lộc, hoa trên logo</div>
              </div>

              <!-- ĐẠI TIỆC SIÊU SALE -->
              <div
                class="theme-card"
                :class="{ 'is-selected': tempSettings.theme === 'sale' }"
                @click="tempSettings.theme = 'sale'"
              >
                <div class="card-icon">⚡</div>
                <div class="card-title">Đại Tiệc Siêu Sale</div>
                <div class="card-desc">Pháo giấy kim tuyến ngũ sắc (Confetti) xoay lật rơi 3D, dải ribbon đỏ vàng siêu sale</div>
              </div>

              <!-- TỰ ĐỘNG THEO LỊCH -->
              <div
                class="theme-card"
                :class="{ 'is-selected': tempSettings.theme === 'auto' }"
                @click="tempSettings.theme = 'auto'"
              >
                <div class="card-icon">🤖</div>
                <div class="card-title">Tự Động (Lịch Năm)</div>
                <div class="card-desc">Tự động nhận diện: T12 Noel, T1-T2 Tết, T11 Siêu Sale theo đúng chu kỳ hàng năm</div>
              </div>

              <!-- TẮT HIỆU ỨNG -->
              <div
                class="theme-card card-off"
                :class="{ 'is-selected': tempSettings.theme === 'none' }"
                @click="tempSettings.theme = 'none'"
              >
                <div class="card-icon">☀️</div>
                <div class="card-title">Tắt Hiệu Ứng</div>
                <div class="card-desc">Giao diện thường ngày, không rơi hạt hay trang trí phụ kiện</div>
              </div>
            </div>
          </div>

          <!-- 2. TÙY CHỌN BẬT / TẮT CHI TIẾT -->
          <div class="setting-section">
            <label class="section-label">2. Tùy Chọn Chi Tiết</label>
            <div class="toggles-list">
              <label class="toggle-item">
                <input type="checkbox" v-model="tempSettings.fallingEnabled" class="custom-checkbox" />
                <div class="toggle-info">
                  <span class="toggle-title">Bật hiệu ứng rơi hạt toàn màn hình (Canvas 60fps)</span>
                  <span class="toggle-sub">Tự động điều tiết 16 hạt trên điện thoại, 32 hạt trên máy tính để đảm bảo không giật lag</span>
                </div>
              </label>

              <label class="toggle-item">
                <input type="checkbox" v-model="tempSettings.decorEnabled" class="custom-checkbox" />
                <div class="toggle-info">
                  <span class="toggle-title">Bật phụ kiện trang trí Header &amp; Logo (Cành mai / Mũ noel / Đèn lồng)</span>
                  <span class="toggle-sub">Trang trí tinh tế ở các góc, không che khuất chữ hay các nút chức năng</span>
                </div>
              </label>
            </div>
          </div>

          <!-- 3. THÔNG ĐIỆP CHẠY CHỮ TRÊN TOP BANNER -->
          <div class="setting-section">
            <label class="section-label" for="custom-ticker-input">
              3. Thông Điệp Chạy Chữ Trên Thanh Header (Ticker Message)
            </label>
            <input
              id="custom-ticker-input"
              type="text"
              v-model="tempSettings.customTicker"
              class="form-input"
              placeholder="Để trống sẽ tự động dùng câu chúc chuẩn của từng dịp lễ..."
            />
            <div class="input-hint">
              Ví dụ: <em>🌸 Chúc Mừng Năm Mới — Rộn Ràng Hát Ca — Lắp Đặt &amp; Cân Chỉnh Miễn Phí 300km</em>
            </div>
          </div>
        </div>

        <!-- FOOTER ACTIONS -->
        <div class="festive-modal-footer">
          <div class="preview-status">
            Đang áp dụng: <strong>{{ festiveStore.themeLabel }}</strong>
          </div>
          <div class="action-buttons">
            <button type="button" class="btn-cancel" @click="closeModal">Đóng</button>
            <button
              type="button"
              class="btn-save"
              :disabled="festiveStore.isSaving"
              @click="handleSave"
            >
              {{ festiveStore.isSaving ? 'Đang lưu...' : 'Lưu & Kích Hoạt Tức Thì' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useFestiveStore } from '../../stores/festiveStore'
import { showSuccess, showError } from '../../utils/toast'

const festiveStore = useFestiveStore()

const tempSettings = reactive({
  theme: 'noel',
  fallingEnabled: true,
  decorEnabled: true,
  customTicker: ''
})

watch(
  () => festiveStore.isAdminModalOpen,
  (isOpen) => {
    if (isOpen) {
      tempSettings.theme = festiveStore.theme
      tempSettings.fallingEnabled = festiveStore.fallingEnabled
      tempSettings.decorEnabled = festiveStore.decorEnabled
      tempSettings.customTicker = festiveStore.customTicker
    }
  }
)

function closeModal() {
  festiveStore.isAdminModalOpen = false
}

async function handleSave() {
  const res = await festiveStore.saveSettings({
    theme: tempSettings.theme,
    fallingEnabled: tempSettings.fallingEnabled,
    decorEnabled: tempSettings.decorEnabled,
    customTicker: tempSettings.customTicker
  })

  if (res.success) {
    showSuccess('Đã cập nhật cấu hình hiệu ứng dịp lễ hội thành công! Trang web đã hiển thị ngay lập tức.', 'Cập Nhật Thành Công')
    closeModal()
  } else {
    showError(res.message || 'Lỗi khi lưu cấu hình!', 'Lưu Cấu Hình Thất Bại')
  }
}
</script>

<style scoped>
.festive-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(9, 13, 22, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999999;
  padding: 16px;
}

.festive-modal-dialog {
  background: #0f172a;
  border: 1px solid rgba(250, 204, 21, 0.35);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(250, 204, 21, 0.15);
  border-radius: 20px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: dialogPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes dialogPop {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

.festive-modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #111827;
}

.header-title-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 28px;
}

.header-title {
  margin: 0;
  font-size: 17px;
  font-weight: 750;
  color: #f8fafc;
}

.header-sub {
  margin: 2px 0 0;
  font-size: 12.5px;
  color: #94a3b8;
}

.btn-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 28px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #f8fafc;
}

.festive-modal-body {
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.section-label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #facc15;
  margin-bottom: 12px;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.theme-card {
  position: relative;
  background: #1e293b;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 16px 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.22s ease;
  user-select: none;
}

.theme-card:hover {
  border-color: rgba(250, 204, 21, 0.5);
  transform: translateY(-2px);
  background: #233148;
}

.theme-card.is-selected {
  border-color: #facc15;
  background: rgba(250, 204, 21, 0.08);
  box-shadow: 0 0 16px rgba(250, 204, 21, 0.25);
}

.card-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #dc2626;
  color: #ffffff;
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 999px;
}

.card-icon {
  font-size: 26px;
  margin-bottom: 8px;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 4px;
}

.card-desc {
  font-size: 11.5px;
  color: #94a3b8;
  line-height: 1.4;
}

.card-off {
  opacity: 0.85;
}

.toggles-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toggle-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle-item:hover {
  background: #243247;
}

.custom-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #facc15;
  margin-top: 2px;
  cursor: pointer;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.toggle-title {
  font-size: 13.5px;
  font-weight: 600;
  color: #f8fafc;
}

.toggle-sub {
  font-size: 12px;
  color: #94a3b8;
}

.form-input {
  width: 100%;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13.5px;
  color: #f8fafc;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #facc15;
}

.input-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 6px;
}

.festive-modal-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: #111827;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.preview-status {
  font-size: 13px;
  color: #94a3b8;
}

.preview-status strong {
  color: #facc15;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-save {
  background: linear-gradient(135deg, #facc15 0%, #ea580c 100%);
  border: none;
  color: #0f172a;
  padding: 9px 20px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 750;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(250, 204, 21, 0.4);
  transition: all 0.2s;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(250, 204, 21, 0.6);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal Transition */
.festive-modal-fade-enter-active,
.festive-modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.festive-modal-fade-enter-from,
.festive-modal-fade-leave-to {
  opacity: 0;
}
</style>
