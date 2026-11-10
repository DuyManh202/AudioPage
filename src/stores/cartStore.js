import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    isQuickOrderOpen: false,
    selectedProductForOrder: null
  }),

  getters: {
    totalItems: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: (state) => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  actions: {
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
    },

    removeFromCart(productId) {
      this.items = this.items.filter(item => item.id !== productId)
    },

    clearCart() {
      this.items = []
    },

    openQuickOrder(product = null) {
      this.selectedProductForOrder = product
      this.isQuickOrderOpen = true
    },

    closeQuickOrder() {
      this.isQuickOrderOpen = false
      this.selectedProductForOrder = null
    }
  }
})
