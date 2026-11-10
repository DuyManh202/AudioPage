/**
 * Tiện ích gọi RESTful API Backend của AudioShop (Aiven PostgreSQL)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('audioshop_token') || sessionStorage.getItem('audioshop_token')

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  })

  const data = await response.json()
  if (!response.ok) {
    const error = new Error(data.message || 'Lỗi kết nối máy chủ')
    error.status = response.status
    if (response.status === 401 && !endpoint.startsWith('/admin/auth/login')) {
      for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem('audioshop_user')
        storage.removeItem('audioshop_token')
      }
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.assign(`/admin/login?redirect=${redirect}`)
      }
    }
    throw error
  }
  return data
}
