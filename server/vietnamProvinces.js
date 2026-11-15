// Approximate administrative-center coordinates used when a customer only
// mentions a province. Such pins are intentionally labeled as estimates.
export const VIETNAM_PROVINCES = [
  { name: 'An Giang', displayName: 'An Giang', lat: 10.38, lng: 105.44, aliases: ['An Giang', 'Kien Giang'] },
  { name: 'Bac Ninh', displayName: 'Bắc Ninh', lat: 21.18, lng: 106.07, aliases: ['Bac Ninh', 'Bac Giang'] },
  { name: 'Ca Mau', displayName: 'Cà Mau', lat: 9.18, lng: 105.15, aliases: ['Ca Mau', 'Bac Lieu'] },
  { name: 'Can Tho', displayName: 'Cần Thơ', lat: 10.03, lng: 105.78, aliases: ['Can Tho', 'Soc Trang', 'Hau Giang'] },
  { name: 'Cao Bang', displayName: 'Cao Bằng', lat: 22.67, lng: 106.25, aliases: ['Cao Bang'] },
  { name: 'Da Nang', displayName: 'Đà Nẵng', lat: 16.05, lng: 108.22, aliases: ['Da Nang', 'Quang Nam'] },
  { name: 'Dak Lak', displayName: 'Đắk Lắk', lat: 12.67, lng: 108.04, aliases: ['Dak Lak', 'Phu Yen'] },
  { name: 'Dien Bien', displayName: 'Điện Biên', lat: 21.39, lng: 103.02, aliases: ['Dien Bien'] },
  { name: 'Dong Nai', displayName: 'Đồng Nai', lat: 10.95, lng: 106.82, aliases: ['Dong Nai', 'Binh Phuoc'] },
  { name: 'Dong Thap', displayName: 'Đồng Tháp', lat: 10.46, lng: 105.63, aliases: ['Dong Thap', 'Tien Giang'] },
  { name: 'Gia Lai', displayName: 'Gia Lai', lat: 13.98, lng: 108.00, aliases: ['Gia Lai', 'Binh Dinh'] },
  { name: 'Ha Noi', displayName: 'Hà Nội', lat: 21.03, lng: 105.85, aliases: ['Ha Noi'] },
  { name: 'Ha Tinh', displayName: 'Hà Tĩnh', lat: 18.35, lng: 105.90, aliases: ['Ha Tinh'] },
  { name: 'Hai Phong', displayName: 'Hải Phòng', lat: 20.85, lng: 106.68, aliases: ['Hai Phong', 'Hai Duong'] },
  { name: 'Ho Chi Minh City', displayName: 'TP. Hồ Chí Minh', lat: 10.78, lng: 106.70, aliases: ['Ho Chi Minh City', 'Ho Chi Minh', 'TP HCM', 'TPHCM', 'Sai Gon', 'Binh Duong', 'Ba Ria Vung Tau'] },
  { name: 'Hue', displayName: 'TP. Huế', lat: 16.46, lng: 107.59, aliases: ['Hue', 'Thua Thien Hue'] },
  { name: 'Hung Yen', displayName: 'Hưng Yên', lat: 20.65, lng: 106.05, aliases: ['Hung Yen', 'Thai Binh'] },
  { name: 'Khanh Hoa', displayName: 'Khánh Hòa', lat: 12.24, lng: 109.19, aliases: ['Khanh Hoa', 'Ninh Thuan'] },
  { name: 'Lai Chau', displayName: 'Lai Châu', lat: 22.39, lng: 103.47, aliases: ['Lai Chau'] },
  { name: 'Lam Dong', displayName: 'Lâm Đồng', lat: 11.94, lng: 108.44, aliases: ['Lam Dong', 'Dak Nong', 'Binh Thuan'] },
  { name: 'Lang Son', displayName: 'Lạng Sơn', lat: 21.85, lng: 106.76, aliases: ['Lang Son'] },
  { name: 'Lao Cai', displayName: 'Lào Cai', lat: 22.48, lng: 103.98, aliases: ['Lao Cai', 'Yen Bai'] },
  { name: 'Nghe An', displayName: 'Nghệ An', lat: 18.67, lng: 105.68, aliases: ['Nghe An'] },
  { name: 'Ninh Binh', displayName: 'Ninh Bình', lat: 20.25, lng: 105.97, aliases: ['Ninh Binh', 'Ha Nam', 'Nam Dinh'] },
  { name: 'Phu Tho', displayName: 'Phú Thọ', lat: 21.32, lng: 105.40, aliases: ['Phu Tho', 'Vinh Phuc', 'Hoa Binh'] },
  { name: 'Quang Ngai', displayName: 'Quảng Ngãi', lat: 15.12, lng: 108.80, aliases: ['Quang Ngai', 'Kon Tum'] },
  { name: 'Quang Ninh', displayName: 'Quảng Ninh', lat: 20.96, lng: 107.04, aliases: ['Quang Ninh'] },
  { name: 'Quang Tri', displayName: 'Quảng Trị', lat: 16.82, lng: 107.10, aliases: ['Quang Tri', 'Quang Binh'] },
  { name: 'Son La', displayName: 'Sơn La', lat: 21.33, lng: 103.91, aliases: ['Son La'] },
  { name: 'Tay Ninh', displayName: 'Tây Ninh', lat: 11.31, lng: 106.10, aliases: ['Tay Ninh', 'Long An'] },
  { name: 'Thai Nguyen', displayName: 'Thái Nguyên', lat: 21.59, lng: 105.85, aliases: ['Thai Nguyen', 'Bac Kan'] },
  { name: 'Thanh Hoa', displayName: 'Thanh Hóa', lat: 19.81, lng: 105.78, aliases: ['Thanh Hoa'] },
  { name: 'Tuyen Quang', displayName: 'Tuyên Quang', lat: 21.82, lng: 105.21, aliases: ['Tuyen Quang', 'Ha Giang'] },
  { name: 'Vinh Long', displayName: 'Vĩnh Long', lat: 10.25, lng: 105.97, aliases: ['Vinh Long', 'Ben Tre', 'Tra Vinh'] }
]

export function normalizeVietnamText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function findProvince(value, { requireContext = false } = {}) {
  const text = normalizeVietnamText(value)
  if (!text) return null
  if (requireContext && !/(^| )(o|tai|que|tinh|thanh pho|em o|anh o|chi o|nha em|nha minh|dia chi|giao ve|ship ve)( |$)/.test(text)) return null
  const candidates = VIETNAM_PROVINCES.flatMap(province =>
    province.aliases.map(alias => ({ province, alias: normalizeVietnamText(alias) }))
  ).sort((a, b) => b.alias.length - a.alias.length)
  const found = candidates.find(({ alias }) => ` ${text} `.includes(` ${alias} `))
  return found?.province || null
}
