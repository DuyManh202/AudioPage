import { defineStore } from 'pinia'
import productsData from '../data/products.json'
import combosData from '../data/combos.json'
import categoriesData from '../data/categories.json'
import { apiRequest } from '../utils/api'

const LEGACY_VIDEO_RE = /ScMzIvxBSi4|kJQP7kiw5Fk/

const getStoredProducts = () => {
  try {
    const local = JSON.parse(localStorage.getItem('audioshop_products'))
    if (!local || !Array.isArray(local)) return productsData
    const defaultsById = new Map(productsData.map(p => [p.id, p]))
    return local.map(item => {
      const def = defaultsById.get(item.id)
      if (!def) return item
      const cleanVideo = LEGACY_VIDEO_RE.test(item.videoUrl || '') ? def.videoUrl : item.videoUrl
      const cleanTitle = LEGACY_VIDEO_RE.test(item.videoUrl || '') ? def.videoTitle : item.videoTitle
      const cleanDesc = typeof item.shortDesc === 'string'
        ? item.shortDesc.replace('dập tắt tiếng rít', 'triệt tiêu tiếng hú rít')
        : item.shortDesc
      return { ...item, videoUrl: cleanVideo, videoTitle: cleanTitle, shortDesc: cleanDesc }
    })
  } catch (e) {
    return productsData
  }
}

const getStoredCombos = () => {
  try {
    const local = JSON.parse(localStorage.getItem('audioshop_combos'))
    if (!local || !Array.isArray(local)) return combosData
    const defaultsById = new Map(combosData.map(c => [c.id, c]))
    return local.map(item => {
      const def = defaultsById.get(item.id)
      if (!def) return item
      const isLegacy = LEGACY_VIDEO_RE.test(item.videoUrl || '')
      return {
        ...def,
        ...item,
        totalRealValue: item.totalRealValue || def.totalRealValue,
        savedAmount: item.savedAmount || Math.max(0, (item.totalRealValue || def.totalRealValue || item.listPrice) - item.price),
        videoUrl: isLegacy ? def.videoUrl : item.videoUrl,
        videoTitle: isLegacy ? def.videoTitle : item.videoTitle
      }
    })
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
