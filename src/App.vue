<template>
  <div class="audio-shop-app">
    <!-- Thanh tải & trạng thái hệ thống toàn diện -->
    <SystemProgressBar />

    <!-- Thông báo hệ thống có CSS đẹp mắt (System Toast) -->
    <SystemToast />

    <!-- Hiệu ứng sự kiện theo mùa / dịp lễ hội -->
    <FestiveEffects v-if="!isAdminRoute" />

    <AppHeader v-if="!isAdminRoute" />
    <main :class="['main-content', { 'admin-mode': isAdminRoute }]">
      <router-view v-slot="{ Component }">
        <Transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>
    <AppFooter v-if="!isAdminRoute" />
    <FloatingContact v-if="!isAdminRoute" />
    <AiChatWidget v-if="!isAdminRoute" />
    <MobileActionBar v-if="!isAdminRoute" />
    <QuickOrderModal v-if="!isAdminRoute" />
    <CartDrawer v-if="!isAdminRoute" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from './stores/productStore'
import { useFestiveStore } from './stores/festiveStore'
import AppHeader from './components/common/AppHeader.vue'
import AppFooter from './components/common/AppFooter.vue'
import MobileActionBar from './components/common/MobileActionBar.vue'
import FloatingContact from './components/common/FloatingContact.vue'
import AiChatWidget from './components/common/AiChatWidget.vue'
import QuickOrderModal from './components/cart/QuickOrderModal.vue'
import CartDrawer from './components/cart/CartDrawer.vue'
import SystemProgressBar from './components/common/SystemProgressBar.vue'
import FestiveEffects from './components/common/FestiveEffects.vue'
import SystemToast from './components/common/SystemToast.vue'

const route = useRoute()
const productStore = useProductStore()
const festiveStore = useFestiveStore()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))

onMounted(() => {
  productStore.refreshProducts()
  festiveStore.fetchSettings()
})
</script>

<style scoped>
.audio-shop-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}

.main-content.admin-mode {
  padding: 0;
  display: flex;
  flex-direction: column;
}
</style>
