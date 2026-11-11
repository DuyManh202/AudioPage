<template>
  <Transition name="modal-fade">
    <div v-if="cartStore.isQuickOrderOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-window">
        <button class="close-x" type="button" @click="closeModal" aria-label="Đóng cửa sổ">&times;</button>

        <div class="modal-header">
          <span class="badge-gold">TƯ VẤN TRỰC TIẾP TỪ ANH TÚ</span>
          <h3 class="modal-title">Đăng Ký Tư Vấn &amp; Thử Dàn Tại Nhà</h3>
          <p class="modal-sub">
            Sản phẩm quan tâm:
            <strong class="highlight">{{ selectedItemName }}</strong>
          </p>
        </div>

        <div v-if="isSubmitted" class="success-box">
          <div class="success-icon">{{ savedLocally ? '!' : '✓' }}</div>
          <h4>{{ savedLocally ? 'Đã lưu yêu cầu trên thiết bị này' : 'Đăng Ký Thành Công!' }}</h4>
          <p v-if="savedLocally">
            Máy chủ hiện đang bận kết nối. Bác có thể bấm nhắn Zalo trực tiếp bên dưới để kỹ sư Tú Audio hỗ trợ ngay lập tức.
          </p>
          <p v-else>
            Cảm ơn Bác. Kỹ sư Phùng Văn Tú sẽ trực tiếp liên hệ lại qua Zalo/Điện thoại trong vòng 15 phút để tư vấn phối ghép chi tiết.
          </p>
          <div class="modal-success-actions">
            <a
              v-if="savedLocally"
              :href="CONTACT_INFO.zaloUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-secondary full-width"
            >
              💬 Nhắn Zalo {{ CONTACT_INFO.phone }} Ngay
            </a>
            <button class="btn-primary full-width" type="button" @click="closeModal">Đóng Cửa Sổ</button>
          </div>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="modal-form">
          <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>
          <div class="form-group">
            <label>Họ và Tên của Bác:</label>
            <input
              type="text"
              v-model="formData.name"
              placeholder="Ví dụ: Bác Tuấn, Anh Hoàng..."
              required
            />
          </div>

          <div class="form-group">
            <label>Số Điện Thoại / Zalo để gửi cấu hình:</label>
            <input
              type="tel"
              v-model="formData.phone"
              placeholder="Số điện thoại nhận tư vấn & video test"
              required
            />
          </div>

          <div class="form-group">
            <label>Địa Chỉ Lắp Đặt (Khu Vực Miền Bắc):</label>
            <MapLocationPicker
              v-model="formData.address"
              placeholder="Ví dụ: Vĩnh Yên, Hà Nội, Bắc Ninh, Thái Nguyên..."
              :required="true"
            />
          </div>

          <div class="form-group">
            <label>Ghi Chú Nhu Cầu Cụ Thể:</label>
            <textarea
              v-model="formData.note"
              rows="2"
              placeholder="Ví dụ: Nhà em phòng 30m2, muốn thử dàn 29tr tại nhà / Đang có đôi loa cũ muốn thu cũ đổi mới..."
            ></textarea>
          </div>

          <div class="form-guarantee">
            🛡️ Cam kết: Thông tin bảo mật 100% - Mang dàn đến tận nhà nghe thử ưng mới lấy.
          </div>

          <button type="submit" class="btn-primary full-width" :disabled="isSubmitting">
            {{ isSubmitting ? '⏳ Đang Gửi Yêu Cầu...' : 'Xác Nhận Nhận Tư Vấn Miễn Phí' }}
          </button>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCartStore } from '../../stores/cartStore'
import { useAdminStore } from '../../stores/adminStore'
import { CONTACT_INFO } from '../../config/contact'
import MapLocationPicker from '../common/MapLocationPicker.vue'

const cartStore = useCartStore()
const adminStore = useAdminStore()

const formData = ref({
  name: '',
  phone: '',
  address: '',
  note: ''
})

const isSubmitted = ref(false)
const savedLocally = ref(false)
const submitError = ref('')
const isSubmitting = ref(false)

const selectedItemName = computed(() => {
  return cartStore.selectedProductForOrder?.name || 'Tư vấn giải pháp âm thanh toàn diện'
})

const closeModal = () => {
  cartStore.closeQuickOrder()
  isSubmitted.value = false
  savedLocally.value = false
  submitError.value = ''
  isSubmitting.value = false
  formData.value = { name: '', phone: '', address: '', note: '' }
}

const handleSubmit = async () => {
  if (!formData.value.name.trim() || !formData.value.phone.trim() || isSubmitting.value) return
  const cleanPhone = String(formData.value.phone || '').replace(/[^\d+]/g, '')
  if (cleanPhone.length < 9 || cleanPhone.length > 13) {
    submitError.value = 'Số điện thoại chưa đúng định dạng (cần từ 9 đến 11 chữ số).'
    return
  }
  isSubmitting.value = true
  submitError.value = ''
  try {
    const lead = await adminStore.addNewLead({
      name: formData.value.name.trim(),
      phone: cleanPhone,
      address: formData.value.address.trim(),
      note: formData.value.note,
      interest: selectedItemName.value,
      price: cartStore.selectedProductForOrder?.price || 0
    })
    savedLocally.value = Boolean(lead?.localOnly)
    isSubmitted.value = Boolean(lead)
    if (!lead) submitError.value = 'Chưa nhận được xác nhận lưu yêu cầu. Vui lòng thử lại.'
  } catch (error) {
    submitError.value = error.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 6, 12, 0.78);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-window {
  background: linear-gradient(180deg, #161b2d 0%, #101422 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  max-width: 560px;
  max-height: 92vh;
  overflow-y: auto;
  width: 100%;
  padding: 28px;
  position: relative;
  animation: modalPop 0.28s var(--ease-spring);
}

@keyframes modalPop {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.close-x {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: #cbd5e1;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;
}

.close-x:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.modal-header {
  margin-bottom: 20px;
}

.modal-title {
  font-size: 1.32rem;
  font-weight: 800;
  color: #fff;
  margin: 12px 0 6px;
  padding-right: 32px;
}

.modal-sub {
  font-size: 0.88rem;
  color: var(--text-muted);
}

.highlight {
  color: var(--color-primary);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.submit-error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.84rem;
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

.form-group input,
.form-group textarea {
  background: var(--bg-dark-900);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  color: #fff;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(252, 183, 40, 0.14);
}

.form-guarantee {
  font-size: 0.78rem;
  color: var(--text-secondary);
  background: rgba(252, 183, 40, 0.06);
  border: 1px solid rgba(252, 183, 40, 0.18);
  padding: 9px 12px;
  border-radius: var(--radius-sm);
}

.full-width {
  width: 100%;
}

.modal-success-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.success-box {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: #06130b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0 auto 16px;
  box-shadow: 0 0 26px rgba(34, 197, 94, 0.4);
}

.success-box h4 {
  font-size: 1.3rem;
  color: #fff;
  margin-bottom: 8px;
}

.success-box p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 24px;
}

@media (max-width: 640px) {
  .modal-backdrop {
    align-items: flex-end;
    padding: 8px;
    padding-bottom: max(8px, env(safe-area-inset-bottom));
  }

  .modal-window {
    width: 100%;
    max-height: calc(100dvh - 16px);
    overflow-y: auto;
    padding: 24px 18px 20px;
    border-radius: 18px 18px 12px 12px;
  }

  .modal-title {
    font-size: 1.18rem;
    line-height: 1.35;
  }

  .form-group input,
  .form-group textarea {
    min-height: 44px;
    font-size: 16px;
  }
}
</style>
