<template>
  <div :class="['brand-logo-component', `theme-${theme}`, { 'icon-only': iconOnly }]">
    <!-- EMBLEM ICON WRAPPER -->
    <div class="logo-emblem-wrap">
      <svg
        class="logo-emblem-svg"
        :style="{ width: `${height}px`, height: `${height}px` }"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Tú Audio Logo Symbol"
      >
        <defs>
          <linearGradient :id="`emblemBg_${uniqueId}`" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#090d16"/>
          </linearGradient>
          <linearGradient :id="`emblemGold_${uniqueId}`" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="45%" stop-color="#fcb728"/>
            <stop offset="100%" stop-color="#d97706"/>
          </linearGradient>
          <linearGradient :id="`emblemBlue_${uniqueId}`" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#60a5fa"/>
            <stop offset="60%" stop-color="#2837fc"/>
            <stop offset="100%" stop-color="#1d4ed8"/>
          </linearGradient>
        </defs>

        <!-- Khung viền góc bo sang trọng -->
        <rect x="2" y="2" width="44" height="44" rx="12" :fill="`url(#emblemBg_${uniqueId})`" :stroke="`url(#emblemGold_${uniqueId})`" stroke-width="1.6"/>

        <!-- Sóng âm thanh 2 cánh -->
        <path d="M 6 24 A 18 18 0 0 1 10 13" fill="none" stroke="#60a5fa" stroke-width="1.4" stroke-linecap="round" opacity="0.5"/>
        <path d="M 42 24 A 18 18 0 0 1 38 13" fill="none" stroke="#fcb728" stroke-width="1.4" stroke-linecap="round" opacity="0.5"/>
        <path d="M 9 24 A 14 14 0 0 0 12 32" fill="none" stroke="#60a5fa" stroke-width="1.4" stroke-linecap="round" opacity="0.35"/>
        <path d="M 39 24 A 14 14 0 0 0 36 32" fill="none" stroke="#fcb728" stroke-width="1.4" stroke-linecap="round" opacity="0.35"/>

        <!-- Monogram Chữ T (Màu Xanh Electric Blue) -->
        <path d="M 12 15 L 24 15 C 24.8 15 24.8 16.5 24 18 L 20 18 L 20 32 C 20 33 18.5 33 18.5 32 L 18.5 18 L 12 18 C 11.2 18 11.2 15 12 15 Z" :fill="`url(#emblemBlue_${uniqueId})`"/>

        <!-- Monogram Chữ A (Màu Vàng Gold) -->
        <path d="M 28 14 L 35.5 32 C 35.9 32.8 34.3 33.4 33.7 32.3 L 31.5 27 L 24.5 27 L 22.3 32.3 C 21.7 33.4 20.1 32.8 20.5 32 L 28 14 Z M 28 18.5 L 25.7 24.5 L 30.3 24.5 Z" :fill="`url(#emblemGold_${uniqueId})`"/>

        <!-- Điểm sáng trung tâm âm học -->
        <circle cx="28" cy="22.5" r="1.4" fill="#ffffff" opacity="0.95"/>
      </svg>

      <!-- Phụ kiện đội trên Logo theo dịp (TGDD Style) -->
      <template v-if="festiveStore.shouldShowDecor">
        <!-- Dịp Noel: Mũ ông già Noel đội nghiêng ngộ nghĩnh trên logo -->
        <div v-if="festiveStore.effectiveTheme === 'noel'" class="festive-logo-hat" title="Giáng Sinh An Lành">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <path d="M 3 16 Q 10 3 17 8 Q 21 11 20 14" fill="#dc2626"/>
            <circle cx="20" cy="14" r="3" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.6"/>
            <rect x="2" y="15" width="17" height="5" rx="2.5" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.6"/>
          </svg>
        </div>

        <!-- Dịp Tết: Bông hoa mai vàng tươi tắn đính góc logo -->
        <div v-else-if="festiveStore.effectiveTheme === 'tet'" class="festive-logo-blossom" title="Tết Rộn Ràng">
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
            <circle cx="7" cy="10" r="3.6" fill="#facc15"/>
            <circle cx="13" cy="10" r="3.6" fill="#facc15"/>
            <circle cx="10" cy="7" r="3.6" fill="#facc15"/>
            <circle cx="10" cy="13" r="3.6" fill="#facc15"/>
            <circle cx="12" cy="12" r="3.6" fill="#facc15"/>
            <circle cx="10" cy="10" r="2.2" fill="#ea580c"/>
          </svg>
        </div>
      </template>
    </div>

    <!-- WORDMARK & SLOGAN -->
    <div v-if="!iconOnly" class="logo-typography">
      <div class="logo-name-row">
        <span class="logo-text-tu">TÚ</span>
        <span class="logo-text-audio">AUDIO</span>
      </div>
      <div class="logo-tagline-row">
        <span class="tagline-txt">{{ tagline || 'ÂM THANH CHUẨN PHÒNG HÁT' }}</span>
        <span class="eq-bars" aria-hidden="true">
          <i></i><i></i><i></i><i></i>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useFestiveStore } from '../../stores/festiveStore'

const festiveStore = useFestiveStore()

const props = defineProps({
  theme: {
    type: String,
    default: 'light' // 'light' hoặc 'dark'
  },
  iconOnly: {
    type: Boolean,
    default: false
  },
  height: {
    type: Number,
    default: 42
  },
  tagline: {
    type: String,
    default: ''
  }
})

const uniqueId = computed(() => Math.random().toString(36).substring(2, 9))
</script>

<style scoped>
.brand-logo-component {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  user-select: none;
  transition: transform 0.2s ease;
}

.brand-logo-component:hover {
  transform: scale(1.02);
}

.logo-emblem-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.festive-logo-hat {
  position: absolute;
  top: -9px;
  right: -7px;
  z-index: 5;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
  animation: hatWiggle 3.2s ease-in-out infinite alternate;
  transform-origin: bottom center;
  pointer-events: none;
}

.festive-logo-blossom {
  position: absolute;
  top: -7px;
  right: -6px;
  z-index: 5;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  animation: blossomTwinkle 2.5s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes hatWiggle {
  0% { transform: rotate(-5deg) scale(1); }
  100% { transform: rotate(5deg) scale(1.08); }
}

@keyframes blossomTwinkle {
  0% { transform: scale(0.95); opacity: 0.9; }
  100% { transform: scale(1.1); opacity: 1; }
}

.logo-emblem-svg {
  flex-shrink: 0;
  display: block;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.15));
}

.logo-typography {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.1;
}

.logo-name-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.logo-text-tu {
  font-family: 'Montserrat', 'Inter', system-ui, sans-serif;
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: -0.01em;
}

.logo-text-audio {
  font-family: 'Montserrat', 'Inter', system-ui, sans-serif;
  font-size: 1.25rem;
  font-weight: 900;
  background: linear-gradient(135deg, #fcb728 0%, #d97706 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.04em;
}

.logo-tagline-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.tagline-txt {
  font-family: 'Montserrat', 'Inter', system-ui, sans-serif;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

/* EQ BARS ANIMATION */
.eq-bars {
  display: inline-flex;
  align-items: flex-end;
  gap: 1.5px;
  height: 8px;
}

.eq-bars i {
  width: 2px;
  background: #fcb728;
  border-radius: 1px;
}

.eq-bars i:nth-child(1) { height: 4px; }
.eq-bars i:nth-child(2) { height: 7px; }
.eq-bars i:nth-child(3) { height: 8px; }
.eq-bars i:nth-child(4) { height: 5px; }

/* THEME LIGHT (cho nền trắng/sáng của AppHeader) */
.theme-light .logo-text-tu {
  color: #0f172a;
}

.theme-light .tagline-txt {
  color: #475569;
}

/* THEME DARK (cho nền đen/tối của AppFooter, Admin Sidebar, v.v.) */
.theme-dark .logo-text-tu {
  color: #ffffff;
}

.theme-dark .tagline-txt {
  color: #94a3b8;
}

/* KHI CHỈ HIỆN ICON */
.icon-only {
  gap: 0;
}
</style>
