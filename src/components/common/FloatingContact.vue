<template>
  <nav :class="['floating-contact', { 'mobile-open': isMobileOpen }]" aria-label="Liên hệ nhanh">
    <div class="contact-items">
      <a
        class="contact-link phone"
        :href="CONTACT_INFO.phoneHref"
        :aria-label="`Gọi hotline ${CONTACT_INFO.phone}`"
        :title="`Gọi Hotline ${CONTACT_INFO.phone}`"
      >
        <span class="link-icon phone-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path
              d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.11.37 2.31.56 3.58.56a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.27.19 2.47.56 3.58a1 1 0 0 1-.25 1.01l-2.19 2.2Z"
            />
          </svg>
        </span>
        <span class="link-copy">
          <strong>Hotline</strong>
          <b>{{ CONTACT_INFO.phone }}</b>
        </span>
      </a>

      <a
        class="contact-link zalo"
        :href="CONTACT_INFO.zaloUrl"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat Zalo 0984259898"
        title="Chat Zalo 0984259898"
      >
        <span class="link-icon zalo-icon" aria-hidden="true">Zalo</span>
        <span class="link-copy">Chat Zalo</span>
      </a>

      <a
        class="contact-link messenger"
        :href="CONTACT_INFO.messengerUrl"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Nhắn Messenger Tú Audio"
        title="Messenger Tú Audio"
      >
        <span class="link-icon messenger-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path
              d="M12 2C6.48 2 2 6.15 2 11.26c0 2.91 1.45 5.51 3.72 7.21V22l3.4-1.87c.91.25 1.88.39 2.88.39 5.52 0 10-4.15 10-9.26S17.52 2 12 2Zm1.08 12.46-2.55-2.72-4.97 2.72 5.47-5.81 2.61 2.72 4.91-2.72-5.47 5.81Z"
            />
          </svg>
        </span>
        <span class="link-copy">Messenger</span>
      </a>

      <a
        class="contact-link facebook"
        :href="CONTACT_INFO.facebookUrl"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Trang Facebook Tú Audio"
        title="Facebook Tú Audio"
      >
        <span class="link-icon facebook-icon" aria-hidden="true">f</span>
        <span class="link-copy">Fanpage FB</span>
      </a>

      <a
        class="contact-link directions"
        :href="CONTACT_INFO.mapUrl"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chỉ đường Google Maps đến Tú Audio"
        title="Chỉ đường Google Maps"
      >
        <span class="link-icon map-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
            />
          </svg>
        </span>
        <span class="link-copy">Chỉ Đường</span>
      </a>
    </div>

    <button
      type="button"
      class="mobile-contact-toggle"
      :aria-expanded="isMobileOpen ? 'true' : 'false'"
      aria-label="Mở hoặc đóng menu liên hệ nhanh"
      @click="isMobileOpen = !isMobileOpen"
    >
      <span v-if="isMobileOpen" class="toggle-close" aria-hidden="true">&times;</span>
      <span v-else class="toggle-chat" aria-hidden="true">💬</span>
      <span class="toggle-label">{{ isMobileOpen ? 'Đóng' : 'Chat' }}</span>
    </button>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { CONTACT_INFO } from '../../config/contact'

const isMobileOpen = ref(false)
</script>

<style scoped>
.floating-contact {
  position: fixed;
  right: 18px;
  bottom: 26px;
  z-index: 90;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.contact-items {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.mobile-contact-toggle {
  display: none;
}

.contact-link {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 144px;
  height: 44px;
  padding: 5px 14px 5px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid #CBD5E1;
  color: #0F172A;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.14);
  transition: transform 0.28s var(--ease-spring), border-color 0.25s, box-shadow 0.28s, background 0.25s;
}

.contact-link::after {
  content: '';
  position: absolute;
  top: -60%;
  left: -75%;
  width: 48%;
  height: 220%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
  transform: skewX(-24deg);
  transition: left 0.6s var(--ease-spring);
  pointer-events: none;
}

.contact-link:hover::after {
  left: 130%;
}

.contact-link:hover {
  transform: translateX(-5px) scale(1.02);
}

.contact-link:active {
  transform: translateX(-2px) scale(0.97);
}

.link-icon {
  width: 31px;
  height: 31px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.link-icon svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.link-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

/* Hotline (Amber-Gold Pulse) */
.phone {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.94), rgba(245, 158, 11, 0.94));
  border-color: rgba(255, 224, 138, 0.6);
  color: #080a10;
  animation: hotlineHalo 2.6s ease-in-out infinite;
}

@keyframes hotlineHalo {
  0%, 100% {
    box-shadow: 0 10px 26px rgba(249, 115, 22, 0.42), 0 0 0 0 rgba(252, 183, 40, 0.45);
  }
  50% {
    box-shadow: 0 12px 30px rgba(249, 115, 22, 0.58), 0 0 0 8px rgba(252, 183, 40, 0);
  }
}

.phone-icon {
  background: rgba(8, 10, 16, 0.16);
  color: #080a10;
}

.phone strong {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.85;
}

.phone b {
  font-family: var(--font-display);
  font-size: 0.84rem;
  font-weight: 800;
}

/* Messenger */
.messenger:hover {
  border-color: rgba(139, 92, 246, 0.68);
  box-shadow: 0 12px 28px rgba(139, 92, 246, 0.35);
}

.messenger-icon {
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  color: #fff;
}

/* Facebook */
.facebook:hover {
  border-color: rgba(59, 130, 246, 0.65);
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.35);
}

.facebook-icon {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: #fff;
  font-family: Arial, sans-serif;
  font-size: 1rem;
  font-weight: 900;
}

/* Zalo */
.zalo:hover {
  border-color: rgba(14, 165, 233, 0.7);
  box-shadow: 0 12px 28px rgba(14, 165, 233, 0.38);
}

.zalo-icon {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: #fff;
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: -0.02em;
}

/* Google Maps */
.directions:hover {
  border-color: rgba(34, 197, 94, 0.65);
  box-shadow: 0 12px 28px rgba(34, 197, 94, 0.32);
}

.map-icon {
  background: linear-gradient(135deg, #22c55e, #15803d);
  color: #fff;
}

@media (max-width: 768px) {
  .floating-contact {
    right: 12px;
    bottom: calc(82px + env(safe-area-inset-bottom));
    gap: 8px;
  }

  .contact-items {
    display: none;
    gap: 8px;
  }

  .floating-contact.mobile-open .contact-items {
    display: flex;
  }

  .contact-link {
    min-width: 148px;
    height: 44px;
    padding: 5px 14px 5px 7px;
    justify-content: flex-start;
  }

  .mobile-contact-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 46px;
    padding: 0 14px;
    border-radius: 999px;
    background: linear-gradient(135deg, #0ea5e9, #2563eb);
    border: 1px solid rgba(186, 230, 253, 0.55);
    color: #fff;
    font-size: 0.8rem;
    font-weight: 800;
    box-shadow: 0 10px 24px rgba(14, 165, 233, 0.45);
  }

  .floating-contact.mobile-open .mobile-contact-toggle {
    background: rgba(15, 20, 35, 0.96);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .toggle-close {
    font-size: 1.25rem;
    line-height: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .contact-link,
  .contact-link::after {
    transition: none;
    animation: none;
  }

  .phone {
    animation: none;
  }
}
</style>
