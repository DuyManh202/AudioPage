import { defineStore } from 'pinia'
import productsData from '../data/products.json'
import combosData from '../data/combos.json'
import categoriesData from '../data/categories.json'

export const useProductStore = defineStore('product', {
  state: () => ({
    products: productsData,
    combos: combosData,
    categories: categoriesData,
    selectedCategory: 'all',
    selectedRoomFilter: 'all',
    searchQuery: ''
  }),

  getters: {
    filteredProducts: (state) => {
      return state.products.filter(item => {
        const matchesCategory = state.selectedCategory === 'all' || item.category === state.selectedCategory
        const matchesSearch = !state.searchQuery || 
          item.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          item.shortDesc.toLowerCase().includes(state.searchQuery.toLowerCase())
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
    }
  }
})
