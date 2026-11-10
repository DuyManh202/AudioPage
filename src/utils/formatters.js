/**
 * Tiện ích định dạng tiền tệ và thông số âm thanh
 */

export function formatCurrency(amount) {
  if (typeof amount !== 'number') return '0 đ'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount).replace('₫', 'đ')
}

export function formatShortPrice(amount) {
  if (typeof amount !== 'number') return '0'
  if (amount >= 1000000) {
    const million = amount / 1000000
    return Number.isInteger(million) ? `${million} triệu` : `${million.toFixed(1).replace('.', ',')} triệu`
  }
  return formatCurrency(amount)
}
