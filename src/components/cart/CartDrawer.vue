<template>
  <div v-if="cartStore.isCartOpen" class="cart-backdrop" @click.self="cartStore.closeCart">
    <div class="cart-drawer">
      <div class="cart-header">
        <h3>🛒 Giỏ Hàng Thiết Bị ({{ cartStore.totalItems }})</h3>
        <button class="close-btn" @click="cartStore.closeCart">&times;</button>
      </div>

      <div v-if="orderSuccess" class="order-success-box">
        <div class="success-icon">✓</div>
        <h4>{{ orderSuccess.localOnly ? 'Đơn hàng chỉ lưu trên thiết bị này' : 'Đặt Hàng Thành Công!' }}</h4>
        <p>Mã đơn của Bác: <strong>{{ orderSuccess.id }}</strong></p>
        <p class="sub" v-if="orderSuccess.localOnly">Máy chủ không kết nối được, cửa hàng chưa nhận đơn này. Vui lòng liên hệ cửa hàng hoặc thử gửi lại khi có kết nối.</p>
        <p class="sub" v-else>Kỹ sư Tú Audio sẽ gọi điện xác nhận cấu hình cài sẵn trước khi gửi hàng đi.</p>
        <button class="btn-primary full-width" @click="resetAndClose">Tiếp Tục Xem Thiết Bị</button>
      </div>

      <div v-else-if="cartStore.items.length === 0" class="empty-cart">
        <div class="empty-icon">🔊</div>
        <p>Giỏ hàng của Bác đang trống.</p>
        <router-link to="/san-pham" class="btn-primary" @click="cartStore.closeCart">
          Xem Kho Loa & Thiết Bị
        </router-link>
      </div>

      <div v-else class="cart-body">
        <p v-if="submitError" role="alert">{{ submitError }}</p>
        <div class="cart-items-list">
          <div v-for="item in cartStore.items" :key="item.id" class="cart-item">
            <img :src="item.image" :alt="item.name" class="item-img" />
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-price">{{ formatCurrency(item.price) }}</div>
              <div class="qty-controls">
                <button @click="cartStore.updateQuantity(item.id, -1)">-</button>
                <span>{{ item.quantity }}</span>
                <button @click="cartStore.updateQuantity(item.id, 1)">+</button>
              </div>
            </div>
            <button class="remove-btn" @click="cartStore.removeFromCart(item.id)" title="Xóa">🗑️</button>
          </div>
        </div>

        <div class="cart-summary">
          <div class="total-row">
            <span>Tổng Thanh Toán:</span>
            <strong class="total-val">{{ formatCurrency(cartStore.totalPrice) }}</strong>
          </div>
          <p class="ship-note">🚚 Miễn phí vận chuyển & Cài đặt sẵn thông số chuẩn trước khi giao.</p>
        </div>

        <form @submit.prevent="handleCheckout" class="checkout-form">
          <h4>Thông Tin Giao Hàng</h4>
          <input type="text" v-model="form.customerName" placeholder="Họ tên của Bác..." required />
          <input type="tel" v-model="form.customerPhone" placeholder="Số điện thoại / Zalo..." required />
          <input type="text" v-model="form.shippingAddress" placeholder="Địa chỉ nhận hàng..." required />
          <select v-model="form.paymentMethod">
            <option value="COD">Thanh toán khi nhận & Kiểm tra hàng (COD)</option>
            <option value="BANK">Chuyển khoản ngân hàng</option>
          </select>
          <textarea rows="2" v-model="form.note" placeholder="Ghi chú thêm (Ví dụ: Cài sẵn 4 chế độ vang số)..."></textarea>

          <button type="submit" class="btn-primary full-width" :disabled="isSubmitting">
            {{ isSubmitting ? '⏳ Đang Gửi Đơn...' : 'Xác Nhận Đặt Mua Ngay' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCartStore } from '../../stores/cartStore'
import { formatCurrency } from '../../utils/formatters'

const cartStore = useCartStore()
const isSubmitting = ref(false)
const orderSuccess = ref(null)
const submitError = ref('')

const form = ref({
  customerName: '',
  customerPhone: '',
  shippingAddress: '',
  paymentMethod: 'COD',
  note: ''
})

const handleCheckout = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  submitError.value = ''
  try {
    orderSuccess.value = await cartStore.submitOrder(form.value)
  } catch (error) {
    submitError.value = error.message || 'Không thể gửi đơn hàng. Vui lòng thử lại.'
  } finally {
    isSubmitting.value = false
  }
}

const resetAndClose = () => {
  orderSuccess.value = null
  submitError.value = ''
  form.value = { customerName: '', customerPhone: '', shippingAddress: '', paymentMethod: 'COD', note: '' }
  cartStore.closeCart()
}
</script>

<style scoped>
.cart-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.cart-drawer {
  width: 100%;
  max-width: 440px;
  height: 100%;
  background: var(--bg-dark-800);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow-y: auto;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 20px;
}

.cart-header h3 {
  font-size: 1.2rem;
  color: #fff;
}

.close-btn {
  background: transparent;
  color: #94a3b8;
  font-size: 1.8rem;
  line-height: 1;
}

.empty-cart, .order-success-box {
  text-align: center;
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.empty-icon {
  font-size: 3rem;
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
}

.sub {
  font-size: 0.85rem;
  color: #94a3b8;
}

.cart-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

.cart-items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-item {
  display: flex;
  gap: 12px;
  align-items: center;
  background: var(--bg-card);
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.item-img {
  width: 58px;
  height: 58px;
  border-radius: 6px;
  object-fit: cover;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 2px;
}

.item-price {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--color-primary);
  margin-bottom: 6px;
}

.qty-controls {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-dark-900);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 2px 8px;
}

.qty-controls button {
  background: transparent;
  color: #fff;
  font-weight: 800;
  font-size: 0.95rem;
}

.qty-controls span {
  font-size: 0.85rem;
  font-weight: 700;
}

.remove-btn {
  background: transparent;
  font-size: 1rem;
  opacity: 0.7;
}

.remove-btn:hover {
  opacity: 1;
}

.cart-summary {
  background: rgba(13, 15, 24, 0.8);
  padding: 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.total-val {
  font-size: 1.35rem;
  color: var(--color-primary);
}

.ship-note {
  font-size: 0.78rem;
  color: #22c55e;
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
  margin-bottom: 4px;
}

.checkout-form input, .checkout-form select, .checkout-form textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-dark-900);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 0.88rem;
  outline: none;
}

.checkout-form input:focus, .checkout-form select:focus, .checkout-form textarea:focus {
  border-color: var(--color-primary);
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
    gap: 9px;
    padding: 10px;
  }

  .item-img {
    width: 48px;
    height: 48px;
    flex: 0 0 48px;
  }

  .item-name {
    overflow-wrap: anywhere;
  }

  .total-val {
    font-size: 1.15rem;
  }

  .checkout-form input,
  .checkout-form select,
  .checkout-form textarea {
    min-height: 44px;
    font-size: 16px;
  }
}
</style>
