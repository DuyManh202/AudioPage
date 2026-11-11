/**
 * Tiện ích gọi RESTful API Backend của AudioShop (Aiven PostgreSQL)
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api/v1' : '')).replace(/\/+$/, '')

export async function apiRequest(endpoint, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('Chưa cấu hình máy chủ API. Hãy đặt VITE_API_URL trỏ đến backend Render rồi build lại frontend.')
  }

  const token = localStorage.getItem('audioshop_token') || sessionStorage.getItem('audioshop_token')

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    })
  } catch {
    const netError = new Error('Không kết nối được máy chủ API. Hãy kiểm tra kết nối mạng hoặc thử lại sau giây lát.')
    netError.isNetworkError = true
    throw netError
  }

  const responseText = await response.text()
  let data = {}
  if (responseText) {
    try {
      data = JSON.parse(responseText)
    } catch {
      if (responseText.trimStart().startsWith('<')) {
        throw new Error('Máy chủ API đang trả về trang HTML thay vì JSON. Hãy kiểm tra VITE_API_URL và cấu hình backend.')
      }
      throw new Error('Máy chủ API trả về dữ liệu không hợp lệ.')
    }
  }

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
