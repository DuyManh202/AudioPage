/**
 * Hệ Thống Định Nghĩa Quyền Hạn Chi Tiết & Phân Quyền Sâu Tú Audio CRM
 */

export const PERMISSION_GROUPS = [
  {
    id: 'dashboard',
    label: 'Tổng Quan & Doanh Số',
    icon: 'dashboard',
    permissions: [
      { key: 'dashboard.view', label: 'Xem bảng tổng quan & doanh số', desc: 'Cho phép xem biểu đồ, chỉ số doanh thu và trạng thái đơn hàng' },
      { key: 'dashboard.export', label: 'Xuất báo cáo tổng quan', desc: 'Cho phép tải xuống số liệu thống kê tổng hợp' }
    ]
  },
  {
    id: 'orders',
    label: 'Đơn Hàng & Mua Lẻ',
    icon: 'orders',
    permissions: [
      { key: 'orders.view', label: 'Xem danh sách & chi tiết đơn', desc: 'Xem toàn bộ đơn hàng khách đặt và lịch sử mua lẻ' },
      { key: 'orders.create', label: 'Tạo đơn hàng mới', desc: 'Tạo đơn đặt mua tại chỗ cho khách hàng' },
      { key: 'orders.edit', label: 'Sửa thông tin đơn hàng', desc: 'Chỉnh sửa thông tin liên hệ, địa chỉ giao hàng và ghi chú' },
      { key: 'orders.status_update', label: 'Cập nhật tiến độ giao hàng', desc: 'Đổi trạng thái: Chờ xử lý, Đang đóng gói, Đang giao, Đã hoàn tất' },
      { key: 'orders.delete', label: 'Hủy & xóa đơn hàng', desc: 'Quyền nhạy cảm: Xóa bỏ đơn hàng khỏi cơ sở dữ liệu' },
      { key: 'orders.export', label: 'Xuất Excel đơn hàng', desc: 'Tải danh sách đơn hàng ra tệp bảng tính Excel/CSV' }
    ]
  },
  {
    id: 'leads',
    label: 'Khách Tư Vấn & Thử Dàn',
    icon: 'leads',
    permissions: [
      { key: 'leads.view', label: 'Xem danh sách khách tư vấn', desc: 'Xem thông tin khách để lại SĐT trên trang web' },
      { key: 'leads.create', label: 'Thêm khách tiềm năng mới', desc: 'Chủ động nhập tay thông tin khách hàng vào CRM' },
      { key: 'leads.edit', label: 'Cập nhật chăm sóc & Đổi trạng thái', desc: 'Ghi chú cuộc gọi, hẹn lịch thử dàn và đổi trạng thái chốt đơn' },
      { key: 'leads.delete', label: 'Xóa khách tư vấn', desc: 'Quyền xóa lead khỏi hệ thống quản lý' },
      { key: 'leads.export', label: 'Xuất Excel danh sách Leads', desc: 'Tải toàn bộ số điện thoại và nhu cầu khách ra Excel' }
    ]
  },
  {
    id: 'tradeins',
    label: 'Thu Cũ Đổi Mới',
    icon: 'trade-ins',
    permissions: [
      { key: 'tradeins.view', label: 'Xem hồ sơ thu cũ đổi mới', desc: 'Xem thông tin thiết bị cũ, hình ảnh và dàn âm thanh khách muốn nâng cấp' },
      { key: 'tradeins.edit', label: 'Thẩm định giá & Duyệt thu cũ', desc: 'Cập nhật định giá thiết bị cũ và tiến hành duyệt hồ sơ đổi dàn' },
      { key: 'tradeins.delete', label: 'Xóa hồ sơ thu cũ', desc: 'Xóa thông tin yêu cầu đổi mới khỏi hệ thống' }
    ]
  },
  {
    id: 'products',
    label: 'Kho Loa & Thiết Bị',
    icon: 'products',
    permissions: [
      { key: 'products.view', label: 'Xem danh mục kho loa & giá', desc: 'Xem chi tiết các dòng loa, amply, vang số, mic' },
      { key: 'products.create', label: 'Thêm thiết bị mới vào kho', desc: 'Đăng tải sản phẩm mới kèm hình ảnh, cấu hình' },
      { key: 'products.edit', label: 'Cập nhật tồn kho & thông số', desc: 'Sửa mô tả kỹ thuật, thông số củ loa, số lượng tồn kho' },
      { key: 'products.price_edit', label: 'Sửa giá bán & giá khuyến mãi', desc: 'Quyền quan trọng: Cho phép đổi giá niêm yết và giá Sale' },
      { key: 'products.delete', label: 'Xóa thiết bị khỏi kho', desc: 'Xóa vĩnh viễn thiết bị khỏi danh mục bán lẻ' }
    ]
  },
  {
    id: 'combos',
    label: 'Cấu Hình Gói Dàn Combo',
    icon: 'combos',
    permissions: [
      { key: 'combos.view', label: 'Xem danh sách gói dàn', desc: 'Xem các bộ dàn karaoke mẫu theo từng tầm giá' },
      { key: 'combos.create', label: 'Tạo gói dàn karaoke mới', desc: 'Phối ghép thiết bị và niêm yết combo dàn mới' },
      { key: 'combos.edit', label: 'Sửa cấu hình & giá gói dàn', desc: 'Thay đổi các model thành phần, quà tặng kèm và giá combo' },
      { key: 'combos.delete', label: 'Xóa gói dàn combo', desc: 'Xóa gói dàn khỏi danh mục hiển thị' }
    ]
  },
  {
    id: 'customermap',
    label: 'Bản Đồ Số Khách Hàng',
    icon: 'map',
    permissions: [
      { key: 'customermap.view', label: 'Xem bản đồ định vị số', desc: 'Xem phân bổ khách hàng và các dàn đã lắp đặt toàn quốc' }
    ]
  },
  {
    id: 'facebookcare',
    label: 'Chăm Sóc Fanpage & AI',
    icon: 'message',
    permissions: [
      { key: 'facebookcare.view', label: 'Xem tin nhắn Messenger', desc: 'Xem hộp thư khách hàng nhắn từ trang Facebook Tú Audio' },
      { key: 'facebookcare.reply', label: 'Trực tiếp nhắn tin trả lời khách', desc: 'Soạn và gửi tin nhắn phản hồi khách qua Fanpage' },
      { key: 'aichat.view', label: 'Sử dụng Trợ lý tư vấn AI', desc: 'Tra cứu gợi ý cấu hình dàn và kịch bản chốt khách từ AI' }
    ]
  },
  {
    id: 'users',
    label: 'Tài Khoản & Phân Quyền',
    icon: 'users',
    permissions: [
      { key: 'users.view', label: 'Xem danh sách nhân sự', desc: 'Xem thông tin liên hệ và trạng thái của các tài khoản' },
      { key: 'users.create', label: 'Tạo tài khoản nhân sự mới', desc: 'Chủ động cấp tài khoản đăng nhập cho nhân viên' },
      { key: 'users.permissions', label: 'Phân quyền sâu từng tài khoản', desc: 'Toàn quyền tích chọn cấp/hủy quyền hạn chi tiết cho từng nhân viên' },
      { key: 'users.approve', label: 'Phê duyệt tài khoản mới', desc: 'Duyệt và phân quyền hồ sơ nhân sự tự đăng ký từ bên ngoài' },
      { key: 'users.delete', label: 'Khóa / Xóa tài khoản nhân sự', desc: 'Vô hiệu hóa hoặc xóa tài khoản nhân viên khỏi hệ thống' }
    ]
  },
  {
    id: 'auditlogs',
    label: 'Lịch Sử Thao Tác',
    icon: 'history',
    permissions: [
      { key: 'logs.view', label: 'Xem nhật ký lịch sử thao tác', desc: 'Tra cứu ai đã làm gì, vào thời điểm nào trên toàn hệ thống' },
      { key: 'logs.export', label: 'Xuất nhật ký thao tác ra Excel', desc: 'Tải toàn bộ dòng log sự kiện ra file bảng tính' }
    ]
  }
]

// Bộ quyền mẫu theo vai trò (Role Templates)
export const ROLE_TEMPLATES = {
  SUPER_ADMIN: ['*'],
  SALES: [
    'dashboard.view',
    'orders.view', 'orders.create', 'orders.edit', 'orders.status_update', 'orders.export',
    'leads.view', 'leads.create', 'leads.edit', 'leads.export',
    'tradeins.view', 'tradeins.edit',
    'customermap.view',
    'products.view',
    'combos.view',
    'facebookcare.view', 'facebookcare.reply',
    'aichat.view'
  ],
  INVENTORY: [
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'combos.view', 'combos.create', 'combos.edit', 'combos.delete',
    'orders.view', 'orders.status_update'
  ]
}

/**
 * Kiểm tra xem một người dùng có quyền cụ thể hay không
 * @param {Object|string} userOrRole - Đối tượng user (có role và permissions) hoặc chuỗi role
 * @param {string} permissionKey - Mã quyền cần kiểm tra (ví dụ: 'orders.create')
 * @returns {boolean}
 */
export const hasPermission = (userOrRole, permissionKey) => {
  if (!userOrRole) return false

  let role = typeof userOrRole === 'string' ? userOrRole : userOrRole.role
  let permissions = Array.isArray(userOrRole?.permissions) ? userOrRole.permissions : null

  if (role === 'SUPER_ADMIN') return true
  if (permissions && permissions.includes('*')) return true

  // Nếu user có mảng quyền tùy chỉnh cụ thể
  if (permissions && permissions.length > 0) {
    return permissions.includes(permissionKey)
  }

  // Fallback về quyền mặc định của vai trò
  const defaultPerms = ROLE_TEMPLATES[role] || []
  return defaultPerms.includes(permissionKey)
}

/**
 * Kiểm tra quyền truy cập vào Menu cấp 1 trên thanh điều hướng
 */
export const canAccessMenu = (userOrRole, menuKey) => {
  if (!userOrRole) return false
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole.role
  if (role === 'SUPER_ADMIN') return true

  const menuToPermMap = {
    'dashboard': ['dashboard.view'],
    'leads': ['leads.view'],
    'facebook-care': ['facebookcare.view'],
    'customer-map': ['customermap.view'],
    'orders': ['orders.view'],
    'trade-ins': ['tradeins.view'],
    'products': ['products.view'],
    'combos': ['combos.view'],
    'users': ['users.view', 'users.permissions', 'users.approve'],
    'audit-logs': ['logs.view'],
    'ai-chat': ['aichat.view'],
    'festive-effects': ['dashboard.view']
  }

  const requiredPerms = menuToPermMap[menuKey] || []
  if (!requiredPerms.length) return true
  return requiredPerms.some(perm => hasPermission(userOrRole, perm))
}

export const canAccess = (userOrRole, permOrMenu) => {
  return hasPermission(userOrRole, permOrMenu) || canAccessMenu(userOrRole, permOrMenu)
}

/**
 * Lấy trang chủ mặc định khi đăng nhập theo quyền
 */
export const adminHomeForRole = (userOrRole) => {
  if (!userOrRole) return '/admin/login'
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole.role
  if (role === 'INVENTORY' && !canAccessMenu(userOrRole, 'dashboard')) {
    return '/admin/products'
  }
  return '/admin/dashboard'
}
