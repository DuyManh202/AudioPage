export const rolePermissions = {
  SUPER_ADMIN: ['dashboard', 'leads', 'facebook-care', 'customer-map', 'orders', 'trade-ins', 'products', 'combos', 'users', 'ai-chat'],
  SALES: ['dashboard', 'leads', 'facebook-care', 'customer-map', 'orders', 'trade-ins', 'ai-chat'],
  INVENTORY: ['products', 'combos']
}

export const canAccess = (role, permission) => rolePermissions[role]?.includes(permission) ?? false

export const adminHomeForRole = (role) => role === 'INVENTORY' ? '/admin/products' : '/admin/dashboard'
