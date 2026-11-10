import { defineStore } from 'pinia'
import productsData from '../data/products.json'
import combosData from '../data/combos.json'
import categoriesData from '../data/categories.json'
import { apiRequest } from '../utils/api'

const getStoredProducts = () => {
  try {
    const local = JSON.parse(localStorage.getItem('audioshop_products'))
    if (!local || !Array.isArray(local)) return productsData
    return local
  } catch (e) {
    return productsData
  }
}

const getStoredCombos = () => {
  try {
    const local = JSON.parse(localStorage.getItem('audioshop_combos'))
    if (!local || !Array.isArray(local)) return combosData
    return local
  } catch (e) {
    return combosData
  }
}

export const useProductStore = defineStore('product', {
  state: () => ({
    products: getStoredProducts(),
    combos: getStoredCombos(),
    categories: categoriesData,
    selectedCategory: 'all',
    selectedRoomFilter: 'all',
    searchQuery: '',
    isLoading: false,
    isLiveConnected: false
  }),

  getters: {
    filteredProducts: (state) => {
      return state.products.filter(item => {
        const matchesCategory = state.selectedCategory === 'all' || item.category === state.selectedCategory
        const matchesSearch = !state.searchQuery || 
          item.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          item.shortDesc?.toLowerCase().includes(state.searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
      })
    },

    featuredSpeakers: (state) => {
      return state.products.filter(item => item.category === 'loa-full' || item.category === 'loa-sub')
    },

    getProductById: (state) => {
      return (id) => state.products.find(item => item.id === id || item.slug === id)
    },

    getComboById: (state) => {
      return (id) => state.combos.find(item => item.id === id)
    }
  },

  actions: {
    setCategory(catId) {
      this.selectedCategory = catId
    },
    setSearchQuery(query) {
      this.searchQuery = query
    },

    async fetchProducts() {
      this.isLoading = true
      try {
        const res = await apiRequest('/products')
        if (res.success && Array.isArray(res.data)) {
          this.products = res.data
          localStorage.setItem('audioshop_products', JSON.stringify(res.data))
          this.isLiveConnected = true
        }
      } catch (err) {
        // Giữ dữ liệu cache/local nếu backend chưa bật
        console.warn('[API Fallback]: Đang dùng dữ liệu local cho products')
      } finally {
        this.isLoading = false
      }
    },

    async fetchCombos() {
      try {
        const res = await apiRequest('/combos')
        if (res.success && Array.isArray(res.data)) {
          this.combos = res.data
          localStorage.setItem('audioshop_combos', JSON.stringify(res.data))
          this.isLiveConnected = true
        }
      } catch (err) {
        console.warn('[API Fallback]: Đang dùng dữ liệu local cho combos')
      }
    },

    async refreshProducts() {
      await Promise.all([this.fetchProducts(), this.fetchCombos()])
    }
  }
})
