import { defineStore } from 'pinia'
import initialProducts from '../data/products.json'
import initialCombos from '../data/combos.json'
import { apiRequest } from '../utils/api'
import { useProductStore } from './productStore'
import { useAuthStore } from './authStore'

const LEGACY_VIDEO_RE = /ScMzIvxBSi4|kJQP7kiw5Fk/

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
    const defaultsById = new Map(initialProducts.map(p => [p.id, p]))
    return local.map(item => {
      const def = defaultsById.get(item.id)
      if (!def) return item
      const isLegacy = LEGACY_VIDEO_RE.test(item.videoUrl || '')
      return {
        ...item,
        videoUrl: isLegacy ? def.videoUrl : item.videoUrl,
        videoTitle: isLegacy ? def.videoTitle : item.videoTitle
      }
    })
  } catch {
    return initialProducts
  }
}

const loadCombos = () => {
  try {
    const local = JSON.parse(localStorage.getItem('audioshop_combos'))
    if (!local || !Array.isArray(local)) return initialCombos
    const defaultsById = new Map(initialCombos.map(c => [c.id, c]))
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
  } catch {
    return initialCombos
  }
}

let noticeTimer = null

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
    dbConnected: false,
    adminNotice: null
  }),

  getters: {
    totalRevenueExpected: (state) => {
      const leadsRev = state.leads
        .filter(l => l.status === 'DA_CHOT')
        .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0)
      const ordersRev = state.orders
        .filter(o => o.status === 'HOAN_THANH')
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
      return leadsRev + ordersRev
    },

    pendingTradeInsCount: (state) => state.tradeIns.filter(t => t.status === 'CHO_DINH_GIA').length,
    newOrdersCount: (state) => state.orders.filter(o => o.status === 'MOI').length,
    completedOrdersCount: (state) => state.orders.filter(o => o.status === 'HOAN_THANH').length,

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
    showNotice(text, type = 'success') {
      this.adminNotice = { text, type, id: Date.now() }
      if (noticeTimer) clearTimeout(noticeTimer)
      noticeTimer = setTimeout(() => {
        this.adminNotice = null
      }, 4200)
    },

    clearNotice() {
      if (noticeTimer) clearTimeout(noticeTimer)
      this.adminNotice = null
    },

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

    async fetchAllAdminData(silent = true) {
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

        const allOk = results.every(result => result.status === 'fulfilled' && result.value?.success)
        this.dbConnected = allOk
        if (!silent) {
          if (allOk) {
            this.showNotice('Đã đồng bộ dữ liệu mới nhất từ Aiven PostgreSQL.', 'success')
          } else {
            this.showNotice('Một số phân hệ chưa kết nối được máy chủ, đang hiển thị bản lưu tạm.', 'warning')
          }
        }
      } catch (err) {
        this.dbConnected = false
        console.warn('[Admin API]: Chưa kết nối được API backend, dùng dữ liệu cache:', err.message)
        if (!silent) {
          this.showNotice(err.message || 'Không kết nối được máy chủ dữ liệu.', 'error')
        }
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
        throw new Error(res.message || 'Chưa ghi nhận được thông tin đăng ký.')
      } catch (err) {
        if (!err?.isNetworkError) throw err
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
      const prevStatus = lead?.status
      if (lead) {
        lead.status = newStatus
        this._persistLeads()
      }
      try {
        const res = await apiRequest(`/admin/leads/${leadId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus })
        })
        if (res?.data && lead) {
          Object.assign(lead, res.data)
          this._persistLeads()
        }
        this.showNotice('Đã lưu trạng thái khách hàng lên CSDL.', 'success')
      } catch (err) {
        if (lead && prevStatus !== undefined) {
          lead.status = prevStatus
          this._persistLeads()
        }
        this.showNotice(err.message || 'Không lưu được trạng thái khách hàng.', 'error')
      }
    },

    // Cập nhật chi tiết Lead
    async updateLeadDetails(leadId, patchData) {
      const lead = this.leads.find(l => l.id === leadId)
      const backup = lead ? { ...lead } : null
      if (lead) {
        Object.assign(lead, patchData)
        this._persistLeads()
      }
      try {
        const res = await apiRequest(`/admin/leads/${leadId}`, {
          method: 'PATCH',
          body: JSON.stringify(patchData)
        })
        if (res?.data && lead) {
          Object.assign(lead, res.data)
          this._persistLeads()
        }
        this.showNotice('Đã cập nhật hồ sơ khách hàng.', 'success')
        return true
      } catch (err) {
        if (lead && backup) {
          Object.assign(lead, backup)
          this._persistLeads()
        }
        this.showNotice(err.message || 'Không lưu được thông tin khách hàng.', 'error')
        throw err
      }
    },

    // Xóa Lead (SUPER_ADMIN)
    async deleteLead(leadId) {
      const backup = [...this.leads]
      this.leads = this.leads.filter(l => l.id !== leadId)
      this._persistLeads()
      try {
        await apiRequest(`/admin/leads/${leadId}`, { method: 'DELETE' })
        this.showNotice('Đã xóa bản ghi khách hàng khỏi CSDL.', 'success')
      } catch (err) {
        this.leads = backup
        this._persistLeads()
        this.showNotice(err.message || 'Không xóa được khách hàng.', 'error')
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
          this.showNotice(`Đã thêm thiết bị "${res.data.name}" lên CSDL.`, 'success')
          return res.data
        }
      } catch (err) {
        if (!err?.isNetworkError) {
          this.showNotice(err.message || 'Không thể thêm thiết bị.', 'error')
          throw err
        }
        if (!product.id) product.id = 'sp-' + Date.now()
        this.products.unshift(product)
        this._persistProducts()
        useProductStore().products = this.products
        this.showNotice('Mất kết nối máy chủ: Đã lưu tạm thiết bị vào trình duyệt.', 'warning')
        return product
      }
    },

    // Cập nhật Sản phẩm
    async updateProduct(productId, updatedFields) {
      const idx = this.products.findIndex(p => p.id === productId)
      const backup = idx !== -1 ? { ...this.products[idx] } : null
      if (idx !== -1) {
        this.products[idx] = { ...this.products[idx], ...updatedFields }
        this._persistProducts()
        useProductStore().products = this.products
      }
      try {
        const res = await apiRequest(`/admin/products/${productId}`, {
          method: 'PUT',
          body: JSON.stringify(updatedFields)
        })
        if (res?.data && idx !== -1) {
          this.products[idx] = res.data
          this._persistProducts()
          useProductStore().products = this.products
        }
        this.showNotice('Đã lưu thông tin thiết bị lên CSDL.', 'success')
        return true
      } catch (err) {
        if (idx !== -1 && backup) {
          this.products[idx] = backup
          this._persistProducts()
          useProductStore().products = this.products
        }
        this.showNotice(err.message || 'Không cập nhật được thiết bị.', 'error')
        throw err
      }
    },

    // Xóa Sản phẩm
    async deleteProduct(productId) {
      const backup = [...this.products]
      this.products = this.products.filter(p => p.id !== productId)
      this._persistProducts()
      useProductStore().products = this.products
      try {
        await apiRequest(`/admin/products/${productId}`, { method: 'DELETE' })
        this.showNotice('Đã xóa thiết bị khỏi kho.', 'success')
      } catch (err) {
        this.products = backup
        this._persistProducts()
        useProductStore().products = this.products
        this.showNotice(err.message || 'Không xóa được thiết bị.', 'error')
      }
    },

    // Cập nhật Combo (Trọn bộ 19tr / 29tr)
    async updateCombo(comboId, updatedFields) {
      const idx = this.combos.findIndex(c => c.id === comboId)
      const backup = idx !== -1 ? JSON.parse(JSON.stringify(this.combos[idx])) : null

      if (idx !== -1) {
        const nextPrice = Number(updatedFields.price ?? this.combos[idx].price)
        const nextReal = Number(updatedFields.totalRealValue ?? this.combos[idx].totalRealValue ?? updatedFields.listPrice ?? this.combos[idx].listPrice)
        this.combos[idx] = {
          ...this.combos[idx],
          ...updatedFields,
          savedAmount: Math.max(0, nextReal - nextPrice)
        }
        this._persistCombos()
        useProductStore().combos = [...this.combos]
      }

      try {
        const res = await apiRequest(`/admin/combos/${comboId}`, {
          method: 'PUT',
          body: JSON.stringify(updatedFields)
        })
        if (res?.data && idx !== -1) {
          this.combos[idx] = {
            ...this.combos[idx],
            ...res.data,
            price: Number(res.data.price ?? this.combos[idx].price),
            fastActionPrice: Number(res.data.fastActionPrice ?? res.data.fast_action_price ?? this.combos[idx].fastActionPrice),
            totalRealValue: Number(res.data.totalRealValue ?? res.data.total_real_value ?? this.combos[idx].totalRealValue),
            listPrice: Number(res.data.listPrice ?? res.data.list_price ?? this.combos[idx].listPrice),
            savedAmount: Number(res.data.savedAmount ?? res.data.saved_amount ?? this.combos[idx].savedAmount)
          }
          this._persistCombos()
          useProductStore().combos = [...this.combos]
        }
        this.showNotice('Đã lưu cấu hình gói dàn lên Website & Aiven PostgreSQL.', 'success')
        return true
      } catch (err) {
        if (idx !== -1 && backup) {
          this.combos[idx] = backup
          this._persistCombos()
          useProductStore().combos = [...this.combos]
        }
        this.showNotice(err.message || 'Không lưu được cấu hình gói dàn.', 'error')
        throw err
      }
    },

    // Quản lý Thu cũ đổi mới
    async updateTradeIn(id, patchData) {
      const item = this.tradeIns.find(t => t.id === id)
      const backup = item ? { ...item } : null
      if (item) {
        Object.assign(item, patchData)
        this._persistTradeIns()
      }
      try {
        await apiRequest(`/admin/trade-ins/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(patchData)
        })
        this.showNotice('Đã lưu thẩm định Thu cũ đổi mới.', 'success')
      } catch (err) {
        if (item && backup) {
          Object.assign(item, backup)
          this._persistTradeIns()
        }
        this.showNotice(err.message || 'Không cập nhật được yêu cầu Thu cũ.', 'error')
      }
    },

    async deleteTradeIn(id) {
      const backup = [...this.tradeIns]
      this.tradeIns = this.tradeIns.filter(t => t.id !== id)
      this._persistTradeIns()
      try {
        await apiRequest(`/admin/trade-ins/${id}`, { method: 'DELETE' })
        this.showNotice('Đã xóa yêu cầu Thu cũ đổi mới.', 'success')
      } catch (err) {
        this.tradeIns = backup
        this._persistTradeIns()
        this.showNotice(err.message || 'Không xóa được yêu cầu Thu cũ.', 'error')
      }
    },

    // Quản lý Đơn đặt hàng lẻ
    async updateOrderStatus(orderId, status) {
      const ord = this.orders.find(o => o.id === orderId)
      const prev = ord?.status
      if (ord) {
        ord.status = status
        this._persistOrders()
      }
      try {
        await apiRequest(`/admin/orders/${orderId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        })
        this.showNotice('Đã cập nhật trạng thái đơn hàng.', 'success')
      } catch (err) {
        if (ord && prev !== undefined) {
          ord.status = prev
          this._persistOrders()
        }
        this.showNotice(err.message || 'Không cập nhật được trạng thái đơn hàng.', 'error')
      }
    },

    async deleteOrder(orderId) {
      const backup = [...this.orders]
      this.orders = this.orders.filter(o => o.id !== orderId)
      this._persistOrders()
      try {
        await apiRequest(`/admin/orders/${orderId}`, { method: 'DELETE' })
        this.showNotice('Đã xóa đơn hàng khỏi CSDL.', 'success')
      } catch (err) {
        this.orders = backup
        this._persistOrders()
        this.showNotice(err.message || 'Không xóa được đơn hàng.', 'error')
      }
    }
  }
})
