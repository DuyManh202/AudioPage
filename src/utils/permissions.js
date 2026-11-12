export const rolePermissions = {
  SUPER_ADMIN: ['dashboard', 'leads', 'facebook-care', 'orders', 'trade-ins', 'products', 'combos', 'users'],
  SALES: ['dashboard', 'leads', 'facebook-care', 'orders', 'trade-ins'],
  INVENTORY: ['products', 'combos']
}

export const canAccess = (role, permission) => rolePermissions[role]?.includes(permission) ?? false

export const adminHomeForRole = (role) => role === 'INVENTORY' ? '/admin/products' : '/admin/dashboard'
