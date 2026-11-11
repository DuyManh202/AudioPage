<template>
  <Transition name="drawer-slide">
    <div v-if="cartStore.isCartOpen" class="cart-backdrop" @click.self="cartStore.closeCart">
      <div class="cart-drawer">
        <div class="cart-header">
          <h3>
            <span aria-hidden="true">🛒</span>
            Giỏ Hàng Thiết Bị
            <span class="header-count">({{ cartStore.totalItems }})</span>
          </h3>
          <button class="close-btn" type="button" @click="cartStore.closeCart" aria-label="Đóng giỏ hàng">&times;</button>
        </div>

        <div v-if="orderSuccess" class="order-success-box">
          <div class="success-icon">{{ orderSuccess.localOnly ? '!' : '✓' }}</div>
          <h4>{{ orderSuccess.localOnly ? 'Đơn hàng tạm lưu trên máy của Bác' : 'Đặt Hàng Thành Công!' }}</h4>
          <p>Mã đơn của Bác: <strong>{{ orderSuccess.id }}</strong></p>
          <p class="sub" v-if="orderSuccess.localOnly">
            Máy chủ tạm thời gián đoạn kết nối nên cửa hàng chưa nhận được đơn tự động. Bác vui lòng nhắn Zalo <strong>{{ CONTACT_INFO.phone }}</strong> để kỹ sư xác nhận đơn ngay.
          </p>
          <p class="sub" v-else>Kỹ sư Tú Audio sẽ gọi điện xác nhận cấu hình cài sẵn trước khi gửi hàng đi.</p>

          <div v-if="!orderSuccess.localOnly && submittedOrderMeta.paymentMethod === 'BANK'" class="vietqr-box">
            <span class="qr-badge">QUÉT MÃ VIETQR CHUYỂN KHOẢN NHANH</span>
            <img :src="vietQrUrl" alt="Mã VietQR chuyển khoản Tú Audio" class="qr-img" loading="lazy" />
            <div class="qr-details">
              <div>Ngân hàng: <strong>{{ CONTACT_INFO.bank.bankName }}</strong></div>
              <div>Chủ TK: <strong>{{ CONTACT_INFO.bank.accountName }}</strong></div>
              <div class="stk-line">
                <span>STK: <strong>{{ CONTACT_INFO.bank.accountNo }}</strong></span>
                <button type="button" class="copy-stk-btn" @click="copyAccountNo">
                  {{ copiedStk ? '✓ Đã chép' : 'Sao chép' }}
                </button>
              </div>
              <div>Số tiền: <strong class="gold-text">{{ formatCurrency(submittedOrderMeta.totalAmount) }}</strong></div>
              <div>Nội dung CK: <strong>{{ qrTransferNote }}</strong></div>
            </div>
          </div>

          <div class="success-actions">
            <a
              v-if="orderSuccess.localOnly"
              :href="CONTACT_INFO.zaloUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-secondary full-width"
            >
              💬 Nhắn Zalo {{ CONTACT_INFO.phone }} Xác Nhận Đơn
            </a>
            <button class="btn-primary full-width" type="button" @click="resetAndClose">Tiếp Tục Xem Thiết Bị</button>
          </div>
        </div>

        <div v-else-if="cartStore.items.length === 0" class="empty-cart">
          <div class="empty-icon">🔊</div>
          <p>Giỏ hàng của Bác đang trống.</p>
          <router-link to="/san-pham" class="btn-primary" @click="cartStore.closeCart">
            Xem Kho Loa &amp; Thiết Bị
          </router-link>
        </div>

        <div v-else class="cart-body">
          <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>

          <div class="cart-items-list">
            <div v-for="item in cartStore.items" :key="item.id" class="cart-item">
              <img :src="item.image" :alt="item.name" class="item-img" />
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-price">{{ formatCurrency(item.price) }}</div>
                <div class="qty-controls">
                  <button type="button" @click="cartStore.updateQuantity(item.id, -1)" aria-label="Giảm số lượng">-</button>
                  <span>{{ item.quantity }}</span>
                  <button type="button" @click="cartStore.updateQuantity(item.id, 1)" aria-label="Tăng số lượng">+</button>
                </div>
              </div>
              <button class="remove-btn" type="button" @click="cartStore.removeFromCart(item.id)" title="Xóa" aria-label="Xóa sản phẩm">🗑️</button>
            </div>
          </div>

          <div class="cart-summary">
            <div class="total-row">
              <span>Tổng Thanh Toán:</span>
              <strong class="total-val">{{ formatCurrency(cartStore.totalPrice) }}</strong>
            </div>
            <p class="ship-note">🚚 Miễn phí vận chuyển &amp; Cài đặt sẵn thông số chuẩn trước khi giao.</p>
          </div>

          <form @submit.prevent="handleCheckout" class="checkout-form">
            <h4>Thông Tin Giao Hàng</h4>
            <input type="text" v-model="form.customerName" placeholder="Họ tên của Bác..." required />
            <input type="tel" v-model="form.customerPhone" placeholder="Số điện thoại / Zalo..." required />
            <MapLocationPicker
              v-model="form.shippingAddress"
              placeholder="Địa chỉ nhận hàng..."
              :required="true"
            />
            <select v-model="form.paymentMethod">
              <option value="COD">Thanh toán khi nhận &amp; Kiểm tra hàng (COD)</option>
              <option value="BANK">Chuyển khoản ngân hàng (Tự động tạo mã VietQR)</option>
            </select>

            <div v-if="form.paymentMethod === 'BANK'" class="bank-preview-note">
              <div>🏦 <strong>{{ CONTACT_INFO.bank.bankName }}</strong> — STK: <strong>{{ CONTACT_INFO.bank.accountNo }}</strong></div>
              <div>Chủ TK: <strong>{{ CONTACT_INFO.bank.accountName }}</strong> (Mã QR tự động hiện ngay sau khi bấm đặt đơn)</div>
            </div>

            <textarea rows="2" v-model="form.note" placeholder="Ghi chú thêm (Ví dụ: Cài sẵn 4 chế độ vang số)..."></textarea>

            <button type="submit" class="btn-primary full-width" :disabled="isSubmitting">
              {{ isSubmitting ? '⏳ Đang Gửi Đơn...' : 'Xác Nhận Đặt Mua Ngay' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCartStore } from '../../stores/cartStore'
import { formatCurrency } from '../../utils/formatters'
import { CONTACT_INFO, buildVietQrUrl } from '../../config/contact'
import MapLocationPicker from '../common/MapLocationPicker.vue'

const cartStore = useCartStore()
const isSubmitting = ref(false)
const orderSuccess = ref(null)
const submitError = ref('')
const copiedStk = ref(false)
const submittedOrderMeta = ref({
  paymentMethod: 'COD',
  totalAmount: 0,
  customerPhone: ''
})

const form = ref({
  customerName: '',
  customerPhone: '',
  shippingAddress: '',
  paymentMethod: 'COD',
  note: ''
})

const qrTransferNote = computed(() => {
  const idPart = orderSuccess.value?.id || 'TUAUDIO'
  const phonePart = submittedOrderMeta.value.customerPhone || ''
  return `${idPart} ${phonePart}`.trim()
})

const vietQrUrl = computed(() => {
  return buildVietQrUrl(submittedOrderMeta.value.totalAmount, qrTransferNote.value)
})

const copyAccountNo = async () => {
  try {
    await navigator.clipboard.writeText(CONTACT_INFO.bank.accountNo)
    copiedStk.value = true
    setTimeout(() => { copiedStk.value = false }, 2200)
  } catch {
    copiedStk.value = false
  }
}

const handleCheckout = async () => {
  if (isSubmitting.value) return
  const cleanPhone = String(form.value.customerPhone || '').replace(/[^\d+]/g, '')
  if (cleanPhone.length < 9 || cleanPhone.length > 13) {
    submitError.value = 'Số điện thoại chưa đúng định dạng (cần từ 9 đến 11 chữ số).'
    return
  }

  isSubmitting.value = true
  submitError.value = ''
  const snapshotTotal = cartStore.totalPrice
  const snapshotMethod = form.value.paymentMethod
  try {
    const result = await cartStore.submitOrder({
      ...form.value,
      customerPhone: cleanPhone
    })
    submittedOrderMeta.value = {
      paymentMethod: snapshotMethod,
      totalAmount: snapshotTotal,
      customerPhone: cleanPhone
    }
    orderSuccess.value = result
  } catch (error) {
    submitError.value = error.message || 'Không thể gửi đơn hàng. Vui lòng thử lại.'
  } finally {
    isSubmitting.value = false
  }
}

const resetAndClose = () => {
  orderSuccess.value = null
  submitError.value = ''
  copiedStk.value = false
  form.value = { customerName: '', customerPhone: '', shippingAddress: '', paymentMethod: 'COD', note: '' }
  cartStore.closeCart()
}
</script>

<style scoped>
.cart-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 6, 12, 0.76);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.cart-drawer {
  width: 100%;
  max-width: 450px;
  height: 100%;
  background: linear-gradient(180deg, #131727 0%, #0d101c 100%);
  border-left: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: -20px 0 60px rgba(0, 0, 0, 0.65);
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow-y: auto;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 16px;
  margin-bottom: 18px;
}

.cart-header h3 {
  font-size: 1.15rem;
  font-weight: 800;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-count {
  color: var(--color-primary);
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: #cbd5e1;
  font-size: 1.5rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.18);
  color: #fca5a5;
}

.empty-cart,
.order-success-box {
  text-align: center;
  padding: 60px 16px;
}

.empty-icon {
  font-size: 3.4rem;
  margin-bottom: 14px;
}

.empty-cart p {
  color: var(--text-muted);
  margin-bottom: 22px;
}

.success-icon {
  width: 58px;
  height: 58px;
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

.order-success-box h4 {
  font-size: 1.25rem;
  color: #fff;
  margin-bottom: 8px;
}

.order-success-box .sub {
  font-size: 0.86rem;
  color: var(--text-muted);
  margin: 10px 0 18px;
}

.vietqr-box {
  background: rgba(15, 20, 35, 0.9);
  border: 1px solid rgba(252, 183, 40, 0.35);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 18px;
  text-align: center;
}

.qr-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #080a10;
  background: var(--gradient-gold);
  padding: 4px 10px;
  border-radius: 999px;
  margin-bottom: 12px;
}

.qr-img {
  width: 210px;
  max-width: 100%;
  border-radius: 10px;
  background: #fff;
  padding: 6px;
  margin: 0 auto 12px;
  display: block;
}

.qr-details {
  text-align: left;
  font-size: 0.82rem;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stk-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.copy-stk-btn {
  background: rgba(252, 183, 40, 0.16);
  border: 1px solid rgba(252, 183, 40, 0.45);
  color: var(--color-primary);
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
}

.gold-text {
  color: var(--color-primary);
}

.success-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bank-preview-note {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #bfdbfe;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  line-height: 1.45;
}

.submit-error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.84rem;
}

.cart-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.cart-items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
}

.item-img {
  width: 58px;
  height: 58px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  flex-shrink: 0;
  background: #0d101c;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 3px;
}

.item-price {
  font-size: 0.86rem;
  font-weight: 800;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.qty-controls {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-dark-900);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 2px 6px;
}

.qty-controls button {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-weight: 800;
}

.qty-controls span {
  font-size: 0.84rem;
  font-weight: 800;
  min-width: 18px;
  text-align: center;
}

.remove-btn {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cart-summary {
  background: rgba(252, 183, 40, 0.06);
  padding: 15px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(252, 183, 40, 0.22);
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.total-val {
  font-family: var(--font-display);
  font-size: 1.38rem;
  color: var(--color-primary);
}

.ship-note {
  font-size: 0.78rem;
  color: #4ade80;
}

.checkout-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
}

.checkout-form h4 {
  font-size: 0.95rem;
  color: #fff;
  margin-bottom: 2px;
}

.checkout-form input,
.checkout-form select,
.checkout-form textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-dark-900);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 0.88rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.checkout-form input:focus,
.checkout-form select:focus,
.checkout-form textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(252, 183, 40, 0.14);
}

.full-width {
  width: 100%;
}

@media (max-width: 640px) {
  .cart-drawer {
    max-width: none;
    padding: 18px 16px max(18px, env(safe-area-inset-bottom));
  }

  .empty-cart,
  .order-success-box {
    padding: 36px 12px;
  }

  .cart-item {
    align-items: flex-start;
    gap: 10px;
    padding: 10px;
  }

  .item-img {
    width: 48px;
    height: 48px;
  }

  .item-name {
    overflow-wrap: anywhere;
  }

  .total-val {
    font-size: 1.18rem;
  }

  .checkout-form input,
  .checkout-form select,
  .checkout-form textarea {
    min-height: 44px;
    font-size: 16px;
  }
}
</style>
