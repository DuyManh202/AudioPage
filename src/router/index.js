import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '../stores/authStore'
import { adminHomeForRole } from '../utils/permissions'

const routes = [
  // Khách hàng / Public Website
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/san-pham',
    name: 'ProductList',
    component: () => import('../views/ProductListView.vue')
  },
  {
    path: '/san-pham/:id',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetailView.vue')
  },
  {
    path: '/dan-karaoke',
    name: 'ComboList',
    component: () => import('../views/ComboListView.vue')
  },
  {
    path: '/thu-cu-doi-moi',
    name: 'TradeIn',
    component: () => import('../views/TradeInView.vue')
  },

  // Trang Đăng Nhập Quản Trị (Đứng độc lập, không dùng AdminLayout)
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/admin/AdminLoginView.vue')
  },

  // Khu Vực Quản Trị / Admin Dashboard (Bảo vệ bằng Auth Guard)
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: () => adminHomeForRole(useAuthStore().currentUser.role)
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/admin/AdminDashboardView.vue'),
        meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'SALES'] }
      },
      {
        path: 'leads',
        name: 'AdminLeads',
        component: () => import('../views/admin/AdminLeadsView.vue'),
        meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'SALES'] }
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('../views/admin/AdminOrdersView.vue'),
        meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'SALES'] }
      },
      {
        path: 'trade-ins',
        name: 'AdminTradeIns',
        component: () => import('../views/admin/AdminTradeInsView.vue'),
        meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'SALES'] }
      },
      {
        path: 'products',
        name: 'AdminProducts',
        component: () => import('../views/admin/AdminProductsView.vue'),
        meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'INVENTORY'] }
      },
      {
        path: 'combos',
        name: 'AdminCombos',
        component: () => import('../views/admin/AdminCombosView.vue'),
        meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'INVENTORY'] }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/admin/AdminUsersView.vue'),
        meta: { requiresAuth: true, roles: ['SUPER_ADMIN'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// Navigation Guard bảo vệ các trang quản trị
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Kiểm tra nếu route yêu cầu đăng nhập
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth) || 
    (to.path.startsWith('/admin') && to.path !== '/admin/login')

  if (requiresAuth && !authStore.isAuthenticated) {
    // Chưa đăng nhập -> Chuyển về trang Login kèm query redirect
    next({ 
      path: '/admin/login', 
      query: { redirect: to.fullPath } 
    })
  } else if (to.path === '/admin/login' && authStore.isAuthenticated) {
    // Đã đăng nhập rồi mà cố vào lại Login -> Chuyển thẳng vào Dashboard
    next('/admin/dashboard')
  } else if (to.matched.some(record => record.meta.roles && !record.meta.roles.includes(authStore.currentUser.role))) {
    next(adminHomeForRole(authStore.currentUser.role))
  } else {
    next()
  }
})

export default router
