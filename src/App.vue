<template>
  <div class="audio-shop-app">
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
    <MobileActionBar v-if="!isAdminRoute" />
    <QuickOrderModal />
    <CartDrawer />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from './stores/productStore'
import AppHeader from './components/common/AppHeader.vue'
import AppFooter from './components/common/AppFooter.vue'
import MobileActionBar from './components/common/MobileActionBar.vue'
import FloatingContact from './components/common/FloatingContact.vue'
import QuickOrderModal from './components/cart/QuickOrderModal.vue'
import CartDrawer from './components/cart/CartDrawer.vue'

const route = useRoute()
const productStore = useProductStore()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))

onMounted(() => {
  productStore.refreshProducts()
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
