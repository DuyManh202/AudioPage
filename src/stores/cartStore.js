import { defineStore } from 'pinia'
import { apiRequest } from '../utils/api'

const loadCart = () => {
  try {
    const items = JSON.parse(localStorage.getItem('audioshop_cart'))
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: loadCart(),
    isCartOpen: false,
    isQuickOrderOpen: false,
    selectedProductForOrder: null
  }),

  getters: {
    totalItems: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: (state) => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  actions: {
    _persistCart() {
      localStorage.setItem('audioshop_cart', JSON.stringify(this.items))
    },

    addToCart(product, quantity = 1) {
      const existing = this.items.find(item => item.id === product.id)
      if (existing) {
        existing.quantity += quantity
      } else {
        this.items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity
        })
      }
      this._persistCart()
      this.isCartOpen = true
    },

    updateQuantity(productId, delta) {
      const existing = this.items.find(item => item.id === productId)
      if (!existing) return
      existing.quantity += delta
      if (existing.quantity <= 0) {
        this.removeFromCart(productId)
      } else {
        this._persistCart()
      }
    },

    removeFromCart(productId) {
      this.items = this.items.filter(item => item.id !== productId)
      this._persistCart()
    },

    clearCart() {
      this.items = []
      this._persistCart()
    },

    openCart() {
      this.isCartOpen = true
    },

    closeCart() {
      this.isCartOpen = false
    },

    openQuickOrder(product = null) {
      this.selectedProductForOrder = product
      this.isQuickOrderOpen = true
    },

    closeQuickOrder() {
      this.isQuickOrderOpen = false
      this.selectedProductForOrder = null
    },

    async submitOrder(orderForm) {
      const payload = {
        customerName: orderForm.customerName,
        customerPhone: orderForm.customerPhone,
        shippingAddress: orderForm.shippingAddress,
        paymentMethod: orderForm.paymentMethod || 'COD',
        note: orderForm.note || '',
        items: this.items,
        totalAmount: this.totalPrice
      }

      try {
        const res = await apiRequest('/orders', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        if (res.success) {
          this.clearCart()
          return res.data
        }
        throw new Error(res.message || 'Máy chủ chưa xác nhận đơn hàng.')
      } catch (err) {
        if (!err?.isNetworkError) throw err
        let localOrders = []
        try {
          const stored = JSON.parse(localStorage.getItem('audioshop_orders'))
          if (Array.isArray(stored)) localOrders = stored
        } catch { /* cache lỗi thì tạo danh sách mới */ }
        const newOrd = {
          id: `LOCAL-ORD-${crypto.randomUUID()}`,
          ...payload,
          status: 'MOI',
          createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
        }
        localOrders.unshift(newOrd)
        localStorage.setItem('audioshop_orders', JSON.stringify(localOrders))
        this.clearCart()
        return { ...newOrd, localOnly: true }
      }
    }
  }
})
