<template>
  <div class="tradein-page container">
    <div class="page-header text-center">
      <span class="badge-blue">CHƯƠNG TRÌNH ĐỘC QUYỀN TÚ AUDIO</span>
      <h1>Thu Cũ Đổi Mới — Lên Đời Dàn Karaoke Chuẩn Quán</h1>
      <p>
        Bác đang có đôi loa cũ, amply cũ rè tiếng hoặc vang cơ hát nặng? Gửi ngay ảnh thiết bị cũ để Kỹ sư Phùng Văn Tú định giá thu hồi sát thị trường và trừ thẳng vào tiền lên đời dàn mới!
      </p>
    </div>

    <div class="tradein-grid">
      <div class="steps-panel">
        <h3>Quy Trình Đổi Các 3 Bước Đơn Giản</h3>

        <div class="step-card">
          <div class="step-num">1</div>
          <div>
            <h4>Chụp Ảnh &amp; Gửi Thông Tin Dàn Cũ</h4>
            <p>Bác chụp mặt trước/sau của loa hoặc amply cũ rồi tải lên ở biểu mẫu bên cạnh.</p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-num">2</div>
          <div>
            <h4>Thẩm Định Giá Thu Hồi Trong 15 Phút</h4>
            <p>Anh Tú trực tiếp kiểm tra đời máy và báo mức trợ giá cao nhất qua Zalo cho Bác.</p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-num">3</div>
          <div>
            <h4>Đổi Tận Nhà — Ưng Ý Mới Thanh Toán</h4>
            <p>Đội kỹ thuật chở dàn mới đến lắp đặt tại phòng khách, cân chỉnh hay rồi mới nhận thiết bị cũ về.</p>
          </div>
        </div>

        <div class="trade-note">
          💡 <strong>Lưu ý:</strong> Áp dụng thu hồi đổi mới trong bán kính 300km quanh Phú Thọ - Hà Nội &amp; Các tỉnh Miền Bắc.
        </div>
      </div>

      <div class="form-panel">
        <div v-if="isSuccess" class="success-box">
          <div :class="['success-icon', { 'warn-icon': savedLocally }]">{{ savedLocally ? '!' : '✓' }}</div>
          <h3>{{ savedLocally ? 'Đã Lưu Tạm Yêu Cầu Trên Thiết Bị Này' : 'Đã Gửi Yêu Cầu Định Giá Thành Công!' }}</h3>
          <p v-if="savedLocally">
            Máy chủ hiện đang bận nên yêu cầu đổi thiết bị <strong>{{ submittedDevice }}</strong> mới lưu tạm trên trình duyệt của Bác, chưa chuyển tới cửa hàng. Bác vui lòng bấm nút bên dưới để gửi ảnh trực tiếp qua Zalo <strong>{{ CONTACT_INFO.phone }}</strong> cho anh Tú nhé!
          </p>
          <p v-else>
            Hệ thống đã tiếp nhận thông tin thiết bị <strong>{{ submittedDevice }}</strong>. Kỹ sư Phùng Văn Tú sẽ thẩm định và nhắn báo giá trợ giá đổi các qua Zalo của Bác trong ít phút.
          </p>
          <div class="success-actions">
            <a v-if="savedLocally" :href="CONTACT_INFO.zaloUrl" target="_blank" rel="noopener noreferrer" class="btn-primary full-width">
              💬 Gửi Ảnh Qua Zalo {{ CONTACT_INFO.phone }} Ngay
            </a>
            <button :class="[savedLocally ? 'btn-outline' : 'btn-primary', 'full-width']" type="button" @click="resetForm">
              {{ savedLocally ? 'Quay Lại Gửi Lại Lên Hệ Thống' : 'Gửi Thêm Thiết Bị Khác' }}
            </button>
          </div>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="trade-form">
          <h3>Gửi Thông Tin Thiết Bị Cần Đổi</h3>
          <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Họ &amp; Tên Của Bác:</label>
              <input type="text" v-model="form.customerName" placeholder="Ví dụ: Anh Minh..." required />
            </div>
            <div class="form-group flex-1">
              <label>Số Điện Thoại / Zalo:</label>
              <input type="tel" v-model="form.customerPhone" placeholder="Số Zalo nhận báo giá..." required />
            </div>
          </div>

          <div class="form-group">
            <label>Địa Chỉ Nhà (Tỉnh / Huyện):</label>
            <MapLocationPicker
              v-model="form.customerAddress"
              placeholder="Ví dụ: Từ Sơn, Bắc Ninh / Vĩnh Yên, Phú Thọ..."
              :required="true"
            />
          </div>

          <div class="form-group">
            <label>Tên Thiết Bị Cũ Hiện Có:</label>
            <input type="text" v-model="form.oldDeviceName" placeholder="Ví dụ: Đôi loa nằm BMB 450C + Amply Jarguar 203N..." required />
          </div>

          <div class="form-group">
            <label>Tình Trạng Thiết Bị (Zin hay đã sửa chữa?):</label>
            <textarea rows="2" v-model="form.conditionNote" placeholder="Ví dụ: Loa nguyên bản, amply hơi rè nhẹ chiết áp..."></textarea>
          </div>

          <div class="form-group">
            <label>Sản Phẩm / Gói Dàn Muốn Đổi Lên:</label>
            <select v-model="form.upgradeToItem">
              <option value="Dàn Karaoke 29 Triệu (Chuẩn Quán)">Dàn Karaoke 29 Triệu — Chuẩn Âm Hay Hơn Quán Hát</option>
              <option value="Dàn Karaoke 19 Triệu (Tiết Kiệm)">Dàn Karaoke 19 Triệu — Hay Như Quán Hát Tiết Kiệm</option>
              <option value="Combo Vang Số K9 + Micro CM 05">Combo Nâng Cấp: Vang Số K9 + Micro CM 05 (Trị hú rít)</option>
              <option value="Loa Full 30 PF 12 Pro">Đôi Loa Full 30 PF 12 Pro</option>
            </select>
          </div>

          <div class="form-group">
            <label>📸 Tải Ảnh Thiết Bị Cũ (Tùy chọn):</label>
            <label class="upload-dropzone">
              <input type="file" accept="image/*" @change="handleImageUpload" class="file-input" />
              <span class="upload-hint">Chọn ảnh từ máy tính hoặc chụp trực tiếp bằng điện thoại</span>
            </label>
            <div v-if="form.oldDeviceImages" class="image-preview">
              <img :src="form.oldDeviceImages" alt="Ảnh thiết bị cũ" />
              <button type="button" class="remove-img-btn" @click="form.oldDeviceImages = ''">&times; Xóa ảnh</button>
            </div>
          </div>

          <button type="submit" class="btn-primary full-width" :disabled="isSending">
            {{ isSending ? '⏳ Đang Gửi Hồ Sơ Định Giá...' : 'Gửi Định Giá Thu Cũ Đổi Mới Ngay' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { apiRequest } from '../utils/api'
import { CONTACT_INFO } from '../config/contact'
import MapLocationPicker from '../components/common/MapLocationPicker.vue'

const form = ref({
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  oldDeviceName: '',
  conditionNote: '',
  upgradeToItem: 'Dàn Karaoke 29 Triệu (Chuẩn Quán)',
  oldDeviceImages: ''
})

const isSending = ref(false)
const isSuccess = ref(false)
const savedLocally = ref(false)
const submitError = ref('')
const submittedDevice = ref('')

const handleImageUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (ev) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxW = 800
      const scale = Math.min(1, maxW / img.width)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      form.value.oldDeviceImages = canvas.toDataURL('image/jpeg', 0.7)
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
}

const handleSubmit = async () => {
  if (isSending.value) return
  const cleanPhone = form.value.customerPhone.trim()
  if (!/^\+?[0-9][0-9\s().-]{7,19}$/.test(cleanPhone)) {
    submitError.value = 'Số điện thoại chưa đúng định dạng. Bác vui lòng nhập số điện thoại 9 - 11 chữ số.'
    return
  }

  isSending.value = true
  submitError.value = ''
  savedLocally.value = false

  try {
    await apiRequest('/trade-ins', {
      method: 'POST',
      body: JSON.stringify({
        ...form.value,
        customerName: form.value.customerName.trim(),
        customerPhone: cleanPhone,
        customerAddress: form.value.customerAddress.trim(),
        oldDeviceName: form.value.oldDeviceName.trim()
      })
    })
    submittedDevice.value = form.value.oldDeviceName
    isSuccess.value = true
  } catch (err) {
    if (!err?.isNetworkError) {
      submitError.value = err.message || 'Không gửi được yêu cầu định giá. Bác vui lòng kiểm tra lại thông tin.'
      return
    }
    let localTradeIns = []
    try {
      const parsed = JSON.parse(localStorage.getItem('audioshop_tradeins'))
      if (Array.isArray(parsed)) localTradeIns = parsed
    } catch { /* ignore */ }
    localTradeIns.unshift({
      id: Date.now(),
      ...form.value,
      estimatedPrice: 0,
      status: 'CHO_DINH_GIA',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    })
    localStorage.setItem('audioshop_tradeins', JSON.stringify(localTradeIns))
    submittedDevice.value = form.value.oldDeviceName
    savedLocally.value = true
    isSuccess.value = true
  } finally {
    isSending.value = false
  }
}

const resetForm = () => {
  isSuccess.value = false
  savedLocally.value = false
  submitError.value = ''
  form.value = {
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    oldDeviceName: '',
    conditionNote: '',
    upgradeToItem: 'Dàn Karaoke 29 Triệu (Chuẩn Quán)',
    oldDeviceImages: ''
  }
}
</script>

<style scoped>
.tradein-page {
  padding: 42px 24px 80px;
}

.text-center {
  text-align: center;
}

.page-header {
  max-width: 780px;
  margin: 0 auto 42px;
}

.page-header h1 {
  font-size: clamp(1.7rem, 3.1vw, 2.3rem);
  font-weight: 900;
  color: #fff;
  margin: 12px 0 10px;
}

.page-header p {
  font-size: 0.96rem;
  color: var(--text-muted);
  line-height: 1.65;
}

.tradein-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.25fr);
  gap: 32px;
  align-items: start;
}

.steps-panel {
  min-width: 0;
  background: linear-gradient(180deg, rgba(24, 29, 48, 0.9), rgba(15, 18, 32, 0.96));
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--radius-xl);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--shadow-card), var(--inner-highlight);
}

.steps-panel h3 {
  font-size: 1.2rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 4px;
}

.step-card {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  min-width: 0;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: var(--radius-md);
  padding: 16px;
}

.step-card > div:last-child {
  min-width: 0;
}

.step-num {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--gradient-gold);
  color: #080a10;
  font-family: var(--font-display);
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-card h4 {
  font-size: 0.96rem;
  color: #fff;
  margin-bottom: 4px;
}

.step-card p {
  font-size: 0.84rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.trade-note {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.28);
  color: #dbeafe;
  padding: 13px 15px;
  border-radius: var(--radius-md);
  font-size: 0.84rem;
  line-height: 1.5;
}

.form-panel {
  min-width: 0;
  background: linear-gradient(180deg, rgba(24, 29, 48, 0.92), rgba(15, 18, 32, 0.98));
  border: 1px solid rgba(252, 183, 40, 0.28);
  border-radius: var(--radius-xl);
  padding: 30px;
  box-shadow: var(--shadow-elevated), var(--inner-highlight);
}

.trade-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.trade-form h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 4px;
}

.form-row {
  display: flex;
  gap: 14px;
}

.flex-1 {
  flex: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.form-group input[type="text"],
.form-group input[type="tel"],
.form-group select,
.form-group textarea {
  width: 100%;
  background: var(--bg-dark-900);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-sm);
  padding: 10px 13px;
  color: #fff;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(252, 183, 40, 0.14);
}

.upload-dropzone {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 100%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.025);
  border: 1.5px dashed rgba(252, 183, 40, 0.38);
  border-radius: var(--radius-md);
  padding: 14px;
  cursor: pointer;
}

.file-input {
  width: 100%;
  max-width: 100%;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.upload-hint {
  font-size: 0.76rem;
  color: var(--text-muted);
}

.image-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  background: var(--bg-dark-900);
  padding: 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.image-preview img {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 6px;
}

.remove-img-btn {
  background: rgba(239, 68, 68, 0.18);
  color: #fca5a5;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
}

.full-width {
  width: 100%;
}

.success-box {
  text-align: center;
  padding: 28px 12px;
}

.success-icon {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: #06130b;
  font-size: 1.8rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.success-icon.warn-icon {
  background: linear-gradient(135deg, #facc15, #f59e0b);
  color: #080a10;
}

.success-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.submit-error {
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.36);
  color: #fca5a5;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.84rem;
}

.success-box h3 {
  color: #fff;
  margin-bottom: 10px;
}

.success-box p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 22px;
}

@media (max-width: 920px) {
  .tradein-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .tradein-page {
    padding: 24px 16px 48px;
  }

  .steps-panel,
  .form-panel {
    padding: 20px 16px;
  }

  .form-row {
    flex-direction: column;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    min-height: 44px;
    font-size: 16px;
  }
}
</style>
