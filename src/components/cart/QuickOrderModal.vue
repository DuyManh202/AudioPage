<template>
  <div v-if="cartStore.isQuickOrderOpen" class="modal-backdrop" @click.self="closeModal">
    <div class="modal-window">
      <button class="close-x" @click="closeModal">&times;</button>

      <div class="modal-header">
        <span class="badge-gold">TƯ VẤN TRỰC TIẾP TỪ ANH TÚ</span>
        <h3 class="modal-title">Đăng Ký Tư Vấn & Thử Dàn Tại Nhà</h3>
        <p class="modal-sub">
          Sản phẩm quan tâm: 
          <strong class="highlight">{{ selectedItemName }}</strong>
        </p>
      </div>

      <div v-if="isSubmitted" class="success-box">
        <div class="success-icon">✓</div>
        <h4>{{ savedLocally ? 'Đã lưu yêu cầu trên thiết bị này' : 'Đăng Ký Thành Công!' }}</h4>
        <p v-if="savedLocally">Máy chủ hiện không kết nối được. Yêu cầu đang nằm trong bộ nhớ trình duyệt này và chưa được gửi đến cửa hàng. Vui lòng thử gửi lại khi có kết nối.</p>
        <p v-else>Cảm ơn Bác. Kỹ sư Phùng Văn Tú sẽ trực tiếp liên hệ lại qua Zalo/Điện thoại trong vòng 15 phút để tư vấn phối ghép chi tiết.</p>
        <button class="btn-primary full-width" @click="closeModal">Đóng Cửa Sổ</button>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="modal-form">
        <p v-if="submitError" role="alert">{{ submitError }}</p>
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
          <input 
            type="text" 
            v-model="formData.address" 
            placeholder="Ví dụ: Vĩnh Yên, Hà Nội, Bắc Ninh, Thái Nguyên..." 
            required
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

        <button type="submit" class="btn-primary full-width">
          Xác Nhận Nhận Tư Vấn Miễn Phí
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCartStore } from '../../stores/cartStore'
import { useAdminStore } from '../../stores/adminStore'

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
  isSubmitting.value = true
  submitError.value = ''
  try {
    const lead = await adminStore.addNewLead({
      name: formData.value.name.trim(),
      phone: formData.value.phone.trim(),
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
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-window {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  max-width: 500px;
  width: 100%;
  padding: 32px;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
}

.close-x {
  position: absolute;
  top: 16px;
  right: 18px;
  background: transparent;
  color: #94a3b8;
  font-size: 1.6rem;
  line-height: 1;
}

.close-x:hover {
  color: #fff;
}

.modal-header {
  margin-bottom: 20px;
}

.modal-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #fff;
  margin: 8px 0 4px;
}

.modal-sub {
  font-size: 0.88rem;
  color: #94a3b8;
}

.highlight {
  color: var(--color-primary);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #cbd5e1;
}

.form-group input, .form-group textarea {
  background: var(--bg-dark-900);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  color: #fff;
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
}

.form-group input:focus, .form-group textarea:focus {
  border-color: var(--color-primary);
}

.form-guarantee {
  font-size: 0.78rem;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.03);
  padding: 8px 12px;
  border-radius: 4px;
}

.full-width {
  width: 100%;
}

.success-box {
  text-align: center;
  padding: 24px 0;
}

.success-icon {
  width: 56px;
  height: 56px;
  background: #22c55e;
  color: #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0 auto 16px;
}

.success-box h4 {
  font-size: 1.3rem;
  color: #fff;
  margin-bottom: 8px;
}

.success-box p {
  font-size: 0.9rem;
  color: #cbd5e1;
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
    padding-right: 12px;
    font-size: 1.2rem;
    line-height: 1.35;
  }

  .modal-form {
    gap: 13px;
  }

  .form-group input,
  .form-group textarea {
    min-height: 44px;
    font-size: 16px;
  }
}
</style>
