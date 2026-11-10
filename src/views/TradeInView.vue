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
      <!-- Bên Trái: Quy trình 3 bước -->
      <div class="steps-panel">
        <h3>Quy Trình Đổi Các 3 Bước Đơn Giản</h3>

        <div class="step-card">
          <div class="step-num">1</div>
          <div>
            <h4>Chụp Ảnh & Gửi Thông Tin Dàn Cũ</h4>
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
          💡 <strong>Lưu ý:</strong> Áp dụng thu hồi đổi mới trong bán kính 300km quanh Phú Thọ - Hà Nội & Các tỉnh Miền Bắc.
        </div>
      </div>

      <!-- Bên Phải: Biểu mẫu gửi ảnh định giá -->
      <div class="form-panel">
        <div v-if="isSuccess" class="success-box">
          <div class="success-icon">✓</div>
          <h3>Đã Gửi Yêu Cầu Định Giá Thành Công!</h3>
          <p>
            Hệ thống đã tiếp nhận thông tin thiết bị <strong>{{ submittedDevice }}</strong>. Kỹ sư Phùng Văn Tú sẽ thẩm định và nhắn báo giá trợ giá đổi các qua Zalo của Bác trong ít phút.
          </p>
          <button class="btn-primary full-width" @click="resetForm">Gửi Thêm Thiết Bị Khác</button>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="trade-form">
          <h3>Gửi Thông Tin Thiết Bị Cần Đổi</h3>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Họ & Tên Của Bác:</label>
              <input type="text" v-model="form.customerName" placeholder="Ví dụ: Anh Minh..." required />
            </div>
            <div class="form-group flex-1">
              <label>Số Điện Thoại / Zalo:</label>
              <input type="tel" v-model="form.customerPhone" placeholder="Số Zalo nhận báo giá..." required />
            </div>
          </div>

          <div class="form-group">
            <label>Địa Chỉ Nhà (Tỉnh / Huyện):</label>
            <input type="text" v-model="form.customerAddress" placeholder="Ví dụ: Từ Sơn, Bắc Ninh / Vĩnh Yên, Phú Thọ..." required />
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
            <input type="file" accept="image/*" @change="handleImageUpload" class="file-input" />
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
const submittedDevice = ref('')

const handleImageUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return

  // Nén nhẹ ảnh trước khi chuyển sang Base64 để gửi nhanh
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
  isSending.value = true
  try {
    await apiRequest('/trade-ins', {
      method: 'POST',
      body: JSON.stringify(form.value)
    })
  } catch (err) {
    // Fallback local
    const localTradeIns = JSON.parse(localStorage.getItem('audioshop_tradeins')) || []
    localTradeIns.unshift({
      id: Date.now(),
      ...form.value,
      estimatedPrice: 0,
      status: 'CHO_DINH_GIA',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    })
    localStorage.setItem('audioshop_tradeins', JSON.stringify(localTradeIns))
  } finally {
    submittedDevice.value = form.value.oldDeviceName
    isSending.value = false
    isSuccess.value = true
  }
}

const resetForm = () => {
  isSuccess.value = false
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
  padding: 50px 20px 80px;
}

.text-center {
  text-align: center;
}

.page-header {
  max-width: 780px;
  margin: 0 auto 48px;
}

.page-header h1 {
  font-size: 2.2rem;
  font-weight: 900;
  color: #fff;
  margin: 12px 0;
}

.page-header p {
  font-size: 0.98rem;
  color: #94a3b8;
  line-height: 1.6;
}

.tradein-grid {
  display: grid;
  grid-template-columns: 1fr 1.25fr;
  gap: 36px;
}

.steps-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.steps-panel h3 {
  font-size: 1.3rem;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.step-card {
  display: flex;
  gap: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 20px;
  border-radius: var(--radius-md);
}

.step-num {
  width: 36px;
  height: 36px;
  background: var(--color-primary);
  color: #000;
  font-weight: 900;
  font-size: 1.1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-card h4 {
  color: #fff;
  font-size: 1rem;
  margin-bottom: 4px;
}

.step-card p {
  color: #94a3b8;
  font-size: 0.85rem;
  line-height: 1.5;
}

.trade-note {
  background: rgba(40, 55, 252, 0.1);
  border-left: 3px solid var(--color-secondary);
  padding: 14px 16px;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.form-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 32px;
}

.trade-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.trade-form h3 {
  font-size: 1.3rem;
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

.form-group label {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  color: #cbd5e1;
  margin-bottom: 6px;
}

.form-group input, .form-group select, .form-group textarea {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg-dark-900);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 0.9rem;
  outline: none;
}

.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  border-color: var(--color-primary);
}

.file-input {
  padding: 8px !important;
  cursor: pointer;
}

.image-preview {
  margin-top: 10px;
  position: relative;
  width: 180px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.image-preview img {
  width: 100%;
  display: block;
}

.remove-img-btn {
  width: 100%;
  background: rgba(239, 68, 68, 0.9);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px;
}

.full-width {
  width: 100%;
}

.success-box {
  text-align: center;
  padding: 40px 10px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.success-icon {
  width: 60px;
  height: 60px;
  background: #22c55e;
  color: #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 900;
}

@media (max-width: 900px) {
  .tradein-grid {
    grid-template-columns: 1fr;
  }
  .form-row {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .tradein-page {
    padding: 30px 0 48px;
  }

  .page-header {
    margin-bottom: 28px;
  }

  .page-header h1 {
    font-size: clamp(1.6rem, 7vw, 2rem);
  }

  .form-panel {
    padding: 18px 14px;
  }

  .step-card {
    padding: 16px;
  }
}
</style>
