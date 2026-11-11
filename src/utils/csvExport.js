/**
 * Tiện ích xuất bảng dữ liệu ra file CSV chuẩn UTF-8 BOM (mở trực tiếp bằng Microsoft Excel không lỗi dấu tiếng Việt).
 */
export function exportRowsToCsv(filename, headers, rows) {
  const escapeCell = (value) => {
    const raw = value === null || value === undefined ? '' : String(value)
    if (/[",\r\n]/.test(raw)) {
      return `"${raw.replace(/"/g, '""')}"`
    }
    return raw
  }

  const headerLine = headers.map((h) => escapeCell(h.label)).join(',')
  const bodyLines = rows.map((row) =>
    headers.map((h) => escapeCell(typeof h.get === 'function' ? h.get(row) : row[h.key])).join(',')
  )

  const csvContent = '\uFEFF' + [headerLine, ...bodyLines].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
