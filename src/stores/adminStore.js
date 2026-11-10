import { defineStore } from 'pinia'
import initialProducts from '../data/products.json'
import initialCombos from '../data/combos.json'
import { apiRequest } from '../utils/api'
import { useProductStore } from './productStore'
import { useAuthStore } from './authStore'

const readArray = (key, fallback = []) => {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return Array.isArray(value) ? value : fallback
  } catch {
    return fallback
  }
}

const loadProducts = () => {
  try {
    const local = JSON.parse(localStorage.getItem('audioshop_products'))
    if (!local || !Array.isArray(local)) return initialProducts
    return local
  } catch (e) {
    return initialProducts
  }
}

const loadCombos = () => {
  try {
    const local = JSON.parse(localStorage.getItem('audioshop_combos'))
    if (!local || !Array.isArray(local)) return initialCombos
    return local
  } catch (e) {
    return initialCombos
  }
}

export const useAdminStore = defineStore('admin', {
  state: () => ({
    products: loadProducts(),
    combos: loadCombos(),
    leads: readArray('audioshop_leads'),
    tradeIns: readArray('audioshop_tradeins'),
    orders: readArray('audioshop_orders'),
    leadFilterStatus: 'ALL',
    leadSearchKeyword: '',
    isSyncing: false,
    dbConnected: false
  }),

  getters: {
    totalRevenueExpected: (state) => {
      const leadsRev = state.leads
        .filter(l => l.status === 'DA_CHOT')
        .reduce((sum, l) => sum + (l.dealValue || 0), 0)
      const ordersRev = state.orders
        .filter(o => o.status === 'HOAN_THANH')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
      return leadsRev + ordersRev
    },

    pendingTradeInsCount: (state) => state.tradeIns.filter(t => t.status === 'CHO_DINH_GIA').length,
    newOrdersCount: (state) => state.orders.filter(o => o.status === 'MOI').length,

    totalLeadsCount: (state) => state.leads.length,

    newLeadsCount: (state) => state.leads.filter(l => l.status === 'MOI').length,

    trialScheduledCount: (state) => state.leads.filter(l => l.status === 'HEN_THU_TAI_NHA').length,

    closedDealsCount: (state) => state.leads.filter(l => l.status === 'DA_CHOT').length,

    filteredLeads: (state) => {
      return state.leads.filter(lead => {
        const matchesStatus = state.leadFilterStatus === 'ALL' || lead.status === state.leadFilterStatus
        const kw = state.leadSearchKeyword.toLowerCase()
        const matchesSearch = !kw || 
          lead.name?.toLowerCase().includes(kw) ||
          lead.phone?.includes(kw) ||
          lead.address?.toLowerCase().includes(kw) ||
          lead.interest?.toLowerCase().includes(kw)
        return matchesStatus && matchesSearch
      })
    }
  },

  actions: {
    _persistProducts() {
      localStorage.setItem('audioshop_products', JSON.stringify(this.products))
    },

    _persistCombos() {
      localStorage.setItem('audioshop_combos', JSON.stringify(this.combos))
    },

    _persistLeads() {
      localStorage.setItem('audioshop_leads', JSON.stringify(this.leads))
    },

    _persistTradeIns() {
      localStorage.setItem('audioshop_tradeins', JSON.stringify(this.tradeIns))
    },

    _persistOrders() {
      localStorage.setItem('audioshop_orders', JSON.stringify(this.orders))
    },

    async fetchAllAdminData() {
      this.isSyncing = true
      try {
        const role = useAuthStore().currentUser.role
        const canSales = ['SUPER_ADMIN', 'SALES'].includes(role)
        const requests = [
          ['products', apiRequest('/products')],
          ['combos', apiRequest('/combos')]
        ]
        if (canSales) requests.push(
          ['leads', apiRequest('/admin/leads')],
          ['tradeIns', apiRequest('/admin/trade-ins')],
          ['orders', apiRequest('/admin/orders')]
        )
        const results = await Promise.allSettled(requests.map(([, request]) => request))
        const responseFor = (key) => {
          const index = requests.findIndex(([name]) => name === key)
          return index >= 0 && results[index].status === 'fulfilled' ? results[index].value : null
        }
        const leadsRes = responseFor('leads')
        const prodRes = responseFor('products')
        const comboRes = responseFor('combos')
        const tradeRes = responseFor('tradeIns')
        const orderRes = responseFor('orders')
        if (leadsRes?.success && Array.isArray(leadsRes.data)) {
          this.leads = leadsRes.data
          this._persistLeads()
        }
        if (prodRes?.success && Array.isArray(prodRes.data)) {
          this.products = prodRes.data
          this._persistProducts()
          useProductStore().products = prodRes.data
        }
        if (comboRes?.success && Array.isArray(comboRes.data)) {
          this.combos = comboRes.data
          this._persistCombos()
          useProductStore().combos = comboRes.data
        }
        if (tradeRes?.success && Array.isArray(tradeRes.data)) {
          this.tradeIns = tradeRes.data
          this._persistTradeIns()
        }
        if (orderRes?.success && Array.isArray(orderRes.data)) {
          this.orders = orderRes.data
          this._persistOrders()
        }
        this.dbConnected = results.every(result => result.status === 'fulfilled' && result.value?.success)
      } catch (err) {
        console.warn('[Admin API]: Chưa kết nối được API backend, dùng dữ liệu cache:', err.message)
      } finally {
        this.isSyncing = false
      }
    },

    // Thêm lead mới từ form website người dùng
    async addNewLead(leadData) {
      try {
        const res = await apiRequest('/leads', {
          method: 'POST',
          body: JSON.stringify({
            name: leadData.name,
            phone: leadData.phone,
            address: leadData.address || '',
            interest: leadData.interest || leadData.nameProduct || 'Tư vấn âm thanh',
            roomInfo: leadData.roomInfo || '',
            note: leadData.note || '',
            dealValue: leadData.price || 0
          })
        })
        if (res.success && res.data) {
          this.leads.unshift(res.data)
          this._persistLeads()
          return res.data
        }
      } catch (err) {
        // Fallback local nếu server offline
        if (!(err instanceof TypeError)) throw err
        const newLead = {
          id: `LOCAL-LD-${crypto.randomUUID()}`,
          createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          name: leadData.name,
          phone: leadData.phone,
          address: leadData.address || '',
          interest: leadData.interest || leadData.nameProduct || 'Tư vấn âm thanh',
          roomInfo: leadData.roomInfo || 'Chưa cung cấp',
          status: 'MOI',
          appointmentDate: '',
          note: leadData.note || '',
          deposit: 0,
          dealValue: leadData.price || 0
        }
        this.leads.unshift(newLead)
        this._persistLeads()
        return { ...newLead, localOnly: true }
      }
    },

    // Cập nhật trạng thái Lead
    async updateLeadStatus(leadId, newStatus) {
      const lead = this.leads.find(l => l.id === leadId)
      if (lead) {
        lead.status = newStatus
        this._persistLeads()
      }
      try {
        await apiRequest(`/admin/leads/${leadId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus })
        })
      } catch (err) {
        console.warn('Lỗi cập nhật trạng thái lên DB:', err.message)
      }
    },

    // Cập nhật chi tiết Lead
    async updateLeadDetails(leadId, patchData) {
      const lead = this.leads.find(l => l.id === leadId)
      if (lead) {
        Object.assign(lead, patchData)
        this._persistLeads()
      }
      try {
        await apiRequest(`/admin/leads/${leadId}`, {
          method: 'PATCH',
          body: JSON.stringify(patchData)
        })
      } catch (err) {
        console.warn('Lỗi cập nhật chi tiết Lead lên DB:', err.message)
      }
    },

    // Xóa Lead
    async deleteLead(leadId) {
      this.leads = this.leads.filter(l => l.id !== leadId)
      this._persistLeads()
      try {
        await apiRequest(`/admin/leads/${leadId}`, {
          method: 'DELETE'
        })
      } catch (err) {
        console.warn('Lỗi xóa Lead trên DB:', err.message)
      }
    },

    // Thêm Sản phẩm
    async addProduct(product) {
      try {
        const res = await apiRequest('/admin/products', {
          method: 'POST',
          body: JSON.stringify(product)
        })
        if (res.success && res.data) {
          this.products.unshift(res.data)
          this._persistProducts()
          useProductStore().products = this.products
          return
        }
      } catch (err) {
        console.warn('Lỗi thêm sản phẩm lên DB, lưu tạm vào cache:', err.message)
      }

      if (!product.id) {
        product.id = 'sp-' + Date.now()
      }
      this.products.unshift(product)
      this._persistProducts()
        useProductStore().products = this.products
    },

    // Cập nhật Sản phẩm
    async updateProduct(productId, updatedFields) {
      const idx = this.products.findIndex(p => p.id === productId)
      if (idx !== -1) {
        this.products[idx] = { ...this.products[idx], ...updatedFields }
        this._persistProducts()
        useProductStore().products = this.products
      }
      try {
        await apiRequest(`/admin/products/${productId}`, {
          method: 'PUT',
          body: JSON.stringify(updatedFields)
        })
      } catch (err) {
        console.warn('Lỗi cập nhật sản phẩm lên DB:', err.message)
      }
    },

    // Xóa Sản phẩm
    async deleteProduct(productId) {
      this.products = this.products.filter(p => p.id !== productId)
      this._persistProducts()
        useProductStore().products = this.products
      try {
        await apiRequest(`/admin/products/${productId}`, {
          method: 'DELETE'
        })
      } catch (err) {
        console.warn('Lỗi xóa sản phẩm trên DB:', err.message)
      }
    },

    // Cập nhật Combo
    async updateCombo(comboId, updatedFields) {
      const idx = this.combos.findIndex(c => c.id === comboId)
      if (idx !== -1) {
        this.combos[idx] = { ...this.combos[idx], ...updatedFields }
        this._persistCombos()
        useProductStore().combos = this.combos
      }
      try {
        await apiRequest(`/admin/combos/${comboId}`, {
          method: 'PUT',
          body: JSON.stringify(updatedFields)
        })
      } catch (err) {
        console.warn('Lỗi cập nhật gói dàn lên DB:', err.message)
      }
    },

    // Quản lý Thu cũ đổi mới
    async updateTradeIn(id, patchData) {
      const item = this.tradeIns.find(t => t.id === id)
      if (item) {
        Object.assign(item, patchData)
        this._persistTradeIns()
      }
      try {
        await apiRequest(`/admin/trade-ins/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(patchData)
        })
      } catch (err) {
        console.warn('Lỗi cập nhật Thu cũ đổi mới:', err.message)
      }
    },

    async deleteTradeIn(id) {
      this.tradeIns = this.tradeIns.filter(t => t.id !== id)
      this._persistTradeIns()
      try {
        await apiRequest(`/admin/trade-ins/${id}`, { method: 'DELETE' })
      } catch (err) {
        console.warn('Lỗi xóa yêu cầu Thu cũ:', err.message)
      }
    },

    // Quản lý Đơn đặt hàng lẻ
    async updateOrderStatus(orderId, status) {
      const ord = this.orders.find(o => o.id === orderId)
      if (ord) {
        ord.status = status
        this._persistOrders()
      }
      try {
        await apiRequest(`/admin/orders/${orderId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        })
      } catch (err) {
        console.warn('Lỗi cập nhật trạng thái đơn hàng:', err.message)
      }
    },

    async deleteOrder(orderId) {
      this.orders = this.orders.filter(o => o.id !== orderId)
      this._persistOrders()
      try {
        await apiRequest(`/admin/orders/${orderId}`, { method: 'DELETE' })
      } catch (err) {
        console.warn('Lỗi xóa đơn hàng:', err.message)
      }
    }
  }
})
