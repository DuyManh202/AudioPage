import { computed, onBeforeUnmount, ref, unref, watch } from 'vue'
import { apiRequest } from '../utils/api'

export function useApiDateFilter(endpoint, fallbackRows) {
  const fromDate = ref('')
  const toDate = ref('')
  const apiRows = ref(null)
  const isLoading = ref(false)
  const error = ref('')
  const isActive = computed(() => Boolean(fromDate.value || toDate.value))
  const rows = computed(() => isActive.value ? (apiRows.value || []) : unref(fallbackRows))

  let debounceTimer
  let requestId = 0

  watch([fromDate, toDate], () => {
    const requestVersion = ++requestId
    clearTimeout(debounceTimer)
    error.value = ''

    if (!isActive.value) {
      apiRows.value = null
      isLoading.value = false
      return
    }

    if (fromDate.value && toDate.value && fromDate.value > toDate.value) {
      apiRows.value = []
      isLoading.value = false
      error.value = 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'
      return
    }

    isLoading.value = true
    debounceTimer = setTimeout(async () => {
      const params = new URLSearchParams()
      if (fromDate.value) params.set('from', fromDate.value)
      if (toDate.value) params.set('to', toDate.value)

      try {
        const result = await apiRequest(`${endpoint}?${params.toString()}`)
        if (requestVersion !== requestId) return
        if (!result.success || !Array.isArray(result.data)) {
          throw new Error('Máy chủ trả về dữ liệu ngày không hợp lệ.')
        }
        apiRows.value = result.data
      } catch (err) {
        if (requestVersion !== requestId) return
        apiRows.value = []
        error.value = err.message || 'Không tải được dữ liệu theo ngày từ máy chủ.'
      } finally {
        if (requestVersion === requestId) isLoading.value = false
      }
    }, 250)
  })

  const clearDates = () => {
    fromDate.value = ''
    toDate.value = ''
  }

  onBeforeUnmount(() => {
    clearTimeout(debounceTimer)
    requestId += 1
  })

  return { fromDate, toDate, rows, isActive, isLoading, error, clearDates }
}
