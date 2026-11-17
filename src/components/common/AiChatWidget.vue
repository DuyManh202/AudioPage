<template>
  <div class="ai-chat-root">
    <!-- Nút kích hoạt nổi (Floating Widget Button) -->
    <div v-if="!isOpen" class="ai-chat-launcher-wrapper">
      <!-- Bong bóng chào mời xuất hiện sau vài giây -->
      <Transition name="fade-pop">
        <div v-if="showGreetingBubble" class="ai-greeting-bubble" @click="openChat">
          <div class="greeting-text">
            <strong>Em Tú Audio xin chào!</strong>
            <p>Bác cần tư vấn âm thanh hoặc chỉnh vang số không ạ? 🎙️</p>
          </div>
          <button
            type="button"
            class="bubble-close-btn"
            title="Đóng lời chào"
            aria-label="Đóng lời chào"
            @click.stop="dismissGreeting"
          >
            &times;
          </button>
        </div>
      </Transition>

      <button
        type="button"
        class="ai-chat-trigger"
        :aria-expanded="isOpen"
        aria-label="Mở cửa sổ AI Chatbot Tú Audio"
        title="Trò chuyện cùng Trợ lý AI Tú Audio"
        @click="openChat"
      >
        <span class="avatar-ring">
          <span class="ai-avatar-icon">🎧</span>
          <span class="live-status-dot" title="Chuyên gia trực tuyến"></span>
        </span>
        <span class="trigger-label">
          <strong>Tú Audio AI</strong>
          <small>Chuyên Gia Tư Vấn</small>
        </span>
        <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
      </button>
    </div>

    <!-- Cửa sổ Chat Modal / Drawer -->
    <Transition name="chat-panel">
      <section
        v-if="isOpen"
        class="ai-chat-window"
        role="dialog"
        aria-label="Trợ lý AI Tú Audio"
      >
        <!-- Chat Header -->
        <header class="chat-header">
          <div class="chat-header-info">
            <span class="avatar-wrapper">
              <span class="ai-avatar-icon">🎧</span>
              <span class="live-status-dot"></span>
            </span>
            <div class="header-titles">
              <div class="title-row">
                <h3>Tú Audio AI</h3>
                <span class="online-pill">Online</span>
              </div>
              <p>Chuyên gia âm thanh karaoke Tú Audio</p>
            </div>
          </div>
          <div class="chat-header-actions">
            <a
              :href="CONTACT_INFO.phoneHref"
              class="header-action-btn phone-call-btn"
              title="Gọi Hotline 0984.259.898"
              aria-label="Gọi hotline"
            >
              📞
            </a>
            <button
              type="button"
              class="header-action-btn clear-btn"
              title="Làm mới cuộc trò chuyện"
              aria-label="Làm mới cuộc trò chuyện"
              @click="clearHistory"
            >
              🔄
            </button>
            <button
              type="button"
              class="header-action-btn close-btn"
              title="Thu nhỏ cửa sổ chat"
              aria-label="Đóng"
              @click="isOpen = false"
            >
              &times;
            </button>
          </div>
        </header>

        <!-- Quick Questions Chip Bar -->
        <div class="quick-chips-wrapper">
          <div class="quick-chips-scroll">
            <button
              v-for="chip in quickChips"
              :key="chip.label"
              type="button"
              class="chip-button"
              :disabled="loading"
              @click="sendQuickPrompt(chip.prompt)"
            >
              {{ chip.label }}
            </button>
          </div>
        </div>

        <!-- Chat Messages Container -->
        <div ref="messagesContainer" class="chat-messages">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="['message-row', msg.role === 'user' ? 'user-row' : 'bot-row']"
          >
            <div v-if="msg.role !== 'user'" class="bot-avatar-tiny">
              🎧
            </div>
            <div class="message-bubble-wrapper">
              <div class="message-bubble">
                <div class="message-text" v-html="formatMessage(msg.content)"></div>
                <div v-if="msg.leadCaptured" class="lead-captured-notice">
                  ✓ Em Tú đã nhận được số điện thoại. Em sẽ gọi/nhắn Zalo gửi clip test tiếng chi tiết cho bác ngay ạ!
                </div>
              </div>
              <span class="message-time">{{ msg.time }}</span>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div v-if="loading" class="message-row bot-row typing-row">
            <div class="bot-avatar-tiny">🎧</div>
            <div class="message-bubble typing-bubble">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-label">Em Tú đang soạn câu trả lời...</span>
            </div>
          </div>
        </div>

        <!-- Direct Contact Bar inside Chat -->
        <div class="direct-contact-bar">
          <span class="direct-label">Hỗ trợ nhanh:</span>
          <a :href="CONTACT_INFO.phoneHref" class="hotline-badge">
            📞 <b>0984.259.898</b>
          </a>
          <a :href="CONTACT_INFO.zaloUrl" target="_blank" rel="noopener noreferrer" class="zalo-badge">
            💬 Zalo
          </a>
        </div>

        <!-- Input Box -->
        <footer class="chat-input-area">
          <form class="chat-input-form" @submit.prevent="sendMessage">
            <input
              ref="inputField"
              v-model="inputMessage"
              type="text"
              class="chat-input"
              placeholder="Hỏi diện tích phòng, vang số, loa..."
              :disabled="loading"
              maxlength="500"
            />
            <button
              type="submit"
              class="send-btn"
              :disabled="loading || !inputMessage.trim()"
              aria-label="Gửi tin nhắn"
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
              </svg>
            </button>
          </form>
        </footer>
      </section>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { CONTACT_INFO } from '../../config/contact'
import { apiRequest } from '../../utils/api'

const STORAGE_KEY = 'tuaudio_ai_chat_v1'

const isOpen = ref(false)
const showGreetingBubble = ref(false)
const unreadCount = ref(0)
const loading = ref(false)
const inputMessage = ref('')
const messagesContainer = ref(null)
const inputField = ref(null)

const quickChips = [
  { label: '📍 Địa chỉ showroom ở đâu?', prompt: 'Cửa hàng Tú Audio ở đâu vậy shop?' },
  { label: '⭐ Vang CM x16+ & PF K9', prompt: 'Vang số CM x16+ và PF K9 giá bao nhiêu?' },
  { label: '🎵 Dàn Karaoke 19.8Tr & 29.9Tr', prompt: 'Tư vấn cho tôi các gói combo dàn karaoke gia đình hot nhất?' },
  { label: '🛠️ Tải phần mềm vang số', prompt: 'Cho tôi xin link tải phần mềm căn chỉnh vang số?' },
  { label: '🔄 Thu cũ đổi mới lên đời', prompt: 'Tú Audio có chương trình thu cũ đổi mới loa và amply không?' }
]

const initialGreeting = {
  role: 'assistant',
  content: 'Dạ, em Tú Audio xin chào bác ạ! 👋\n\nBác đang tìm cấu hình dàn karaoke gia đình, cần nâng cấp vang số chống hú rít hay muốn căn chỉnh âm thanh ạ? Bác cứ nhắn phòng khách nhà bác rộng bao nhiêu m2 hoặc các thiết bị đang có, em tư vấn chuẩn âm học cho bác ngay nhé ạ!',
  time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const messages = ref([initialGreeting])

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const openChat = () => {
  isOpen.value = true
  showGreetingBubble.value = false
  unreadCount.value = 0
  scrollToBottom()
  nextTick(() => {
    inputField.value?.focus()
  })
}

const dismissGreeting = () => {
  showGreetingBubble.value = false
  sessionStorage.setItem('tuaudio_greeting_dismissed', 'true')
}

const clearHistory = () => {
  if (confirm('Bác có muốn làm mới cuộc trò chuyện với em Tú không ạ?')) {
    messages.value = [initialGreeting]
    localStorage.removeItem(STORAGE_KEY)
  }
}

const formatMessage = (text) => {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/(0984[\s.]?259[\s.]?898)/g, '<a href="tel:0984259898" class="text-link"><b>$1</b></a>')
}

const sendQuickPrompt = (prompt) => {
  inputMessage.value = prompt
  sendMessage()
}

const sendMessage = async () => {
  const text = inputMessage.value.trim()
  if (!text || loading.value) return

  const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  messages.value.push({
    role: 'user',
    content: text,
    time: currentTime
  })

  inputMessage.value = ''
  loading.value = true
  scrollToBottom()

  try {
    const historyPayload = messages.value.slice(-6).map(m => ({
      role: m.role,
      content: m.content
    }))

    const data = await apiRequest('/ai-chat', {
      method: 'POST',
      body: JSON.stringify({
        message: text,
        history: historyPayload
      })
    })

    const replyText = data.reply || 'Dạ, em Tú Audio đây ạ! Cảm ơn bác đã nhắn tin. Bác cho em xin số điện thoại hoặc gọi qua hotline 0984.259.898 để em hỗ trợ tư vấn chi tiết nhất nhé ạ!'

    messages.value.push({
      role: 'assistant',
      content: replyText,
      leadCaptured: Boolean(data.leadCaptured),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    })

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value.slice(-15)))
    } catch {
      // ignore
    }
  } catch (err) {
    messages.value.push({
      role: 'assistant',
      content: 'Dạ, em Tú Audio xin chào bác! Bác có thể gọi trực tiếp hoặc kết bạn Zalo số hotline 0984.259.898 để em tư vấn trực tiếp và gửi clip test dàn chi tiết cho bác ngay nhé ạ!',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

onMounted(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        messages.value = parsed
      }
    }
  } catch {
    // ignore
  }

  const dismissed = sessionStorage.getItem('tuaudio_greeting_dismissed')
  if (!dismissed) {
    setTimeout(() => {
      if (!isOpen.value) {
        showGreetingBubble.value = true
      }
    }, 3500)
  }
})
</script>

<style scoped>
.ai-chat-root {
  position: relative;
  z-index: 95;
  font-family: var(--sans, system-ui, -apple-system, sans-serif);
}

/* Nút Trigger nổi phía dưới góc trái */
.ai-chat-launcher-wrapper {
  position: fixed;
  left: 22px;
  bottom: 26px;
  z-index: 95;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

/* Bong bóng chào hỏi */
.ai-greeting-bubble {
  position: relative;
  background: rgba(15, 23, 42, 0.94);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 14px;
  padding: 10px 30px 10px 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  max-width: 260px;
  color: #fff;
  transition: transform 0.25s ease, border-color 0.25s;
}

.ai-greeting-bubble:hover {
  transform: translateY(-2px);
  border-color: rgba(96, 165, 250, 0.7);
}

.greeting-text strong {
  display: block;
  font-size: 0.82rem;
  color: #60a5fa;
  margin-bottom: 2px;
}

.greeting-text p {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.35;
  color: #cbd5e1;
}

.bubble-close-btn {
  position: absolute;
  top: 6px;
  right: 8px;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.bubble-close-btn:hover {
  color: #fff;
}

/* Nút kích hoạt chính */
.ai-chat-trigger {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 50px;
  padding: 4px 18px 4px 6px;
  border-radius: 999px;
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  border: 1px solid rgba(147, 197, 253, 0.45);
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.4), 0 0 0 0 rgba(37, 99, 235, 0.5);
  color: #fff;
  cursor: pointer;
  position: relative;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
  animation: triggerPulse 3s infinite;
}

@keyframes triggerPulse {
  0%, 100% {
    box-shadow: 0 10px 28px rgba(37, 99, 235, 0.4), 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 14px 34px rgba(37, 99, 235, 0.6), 0 0 0 8px rgba(59, 130, 246, 0);
  }
}

.ai-chat-trigger:hover {
  transform: translateY(-3px) scale(1.02);
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
}

.avatar-ring {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  border: 2px solid #60a5fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-avatar-icon {
  font-size: 1.15rem;
}

.live-status-dot {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid #0f172a;
}

.trigger-label {
  display: flex;
  flex-direction: column;
  text-align: left;
  line-height: 1.2;
}

.trigger-label strong {
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.trigger-label small {
  font-size: 0.7rem;
  color: #bfdbfe;
  font-weight: 500;
}

.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  border-radius: 999px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid #fff;
}

/* Cửa sổ chat */
.ai-chat-window {
  position: fixed;
  left: 22px;
  bottom: 84px;
  width: 380px;
  max-width: calc(100vw - 36px);
  height: 560px;
  max-height: calc(100vh - 110px);
  background: #0f172a;
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 20px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 100;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Header */
.chat-header {
  padding: 12px 16px;
  background: linear-gradient(135deg, #0b1329, #172554);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.avatar-wrapper {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #1e293b;
  border: 2px solid #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-titles {
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.title-row h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: #fff;
  white-space: nowrap;
}

.online-pill {
  font-size: 0.62rem;
  font-weight: 700;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.header-titles p {
  margin: 2px 0 0;
  font-size: 0.7rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.85rem;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}

.header-action-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

.phone-call-btn {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.35);
  color: #fbbf24;
}

.phone-call-btn:hover {
  background: rgba(245, 158, 11, 0.3);
  color: #fff;
}

.close-btn {
  font-size: 1.25rem;
  line-height: 1;
}

/* Quick chips */
.quick-chips-wrapper {
  background: #090e1c;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 8px 12px;
}

.quick-chips-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.quick-chips-scroll::-webkit-scrollbar {
  display: none;
}

.chip-button {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #93c5fd;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 5px 11px;
  border-radius: 999px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.chip-button:hover:not(:disabled) {
  background: rgba(37, 99, 235, 0.35);
  border-color: #60a5fa;
  color: #fff;
  transform: translateY(-1px);
}

.chip-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Messages area */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: radial-gradient(circle at top, #131d38 0%, #0b1120 100%);
}

.chat-messages::-webkit-scrollbar {
  width: 5px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 999px;
}

.message-row {
  display: flex;
  gap: 8px;
  max-width: 90%;
}

.user-row {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.bot-row {
  align-self: flex-start;
}

.bot-avatar-tiny {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #1e3a8a;
  border: 1px solid #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
  margin-top: 4px;
}

.message-bubble-wrapper {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.user-row .message-bubble-wrapper {
  align-items: flex-end;
}

.bot-row .message-bubble-wrapper {
  align-items: flex-start;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 0.83rem;
  line-height: 1.45;
  word-break: break-word;
}

.user-row .message-bubble {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  border-top-right-radius: 4px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.bot-row .message-bubble {
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
  border-top-left-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.message-text :deep(.text-link) {
  color: #f59e0b;
  text-decoration: underline;
}

.lead-captured-notice {
  margin-top: 8px;
  padding: 6px 9px;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.35);
  border-radius: 8px;
  color: #4ade80;
  font-size: 0.74rem;
  font-weight: 600;
  line-height: 1.3;
}

.message-time {
  font-size: 0.65rem;
  color: #64748b;
  padding: 0 4px;
}

/* Typing row */
.typing-bubble {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #60a5fa;
  animation: typingBounce 1.2s infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingBounce {
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  40% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

.typing-label {
  font-size: 0.73rem;
  color: #94a3b8;
  margin-left: 4px;
}

/* Direct Contact Bar inside chat */
.direct-contact-bar {
  background: rgba(15, 23, 42, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 7px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.74rem;
}

.direct-label {
  color: #94a3b8;
}

.hotline-badge {
  background: rgba(245, 158, 11, 0.18);
  border: 1px solid rgba(245, 158, 11, 0.45);
  color: #fbbf24;
  padding: 2px 8px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 700;
  transition: background 0.2s;
}

.hotline-badge:hover {
  background: rgba(245, 158, 11, 0.35);
  color: #fff;
}

.zalo-badge {
  background: rgba(14, 165, 233, 0.18);
  border: 1px solid rgba(14, 165, 233, 0.45);
  color: #38bdf8;
  padding: 2px 8px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 700;
  transition: background 0.2s;
}

.zalo-badge:hover {
  background: rgba(14, 165, 233, 0.35);
  color: #fff;
}

/* Input Area */
.chat-input-area {
  padding: 10px 12px;
  background: #090e1c;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.chat-input-form {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 999px;
  padding: 4px 6px 4px 14px;
  transition: border-color 0.2s;
}

.chat-input-form:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.chat-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 0.82rem;
}

.chat-input::placeholder {
  color: #64748b;
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.2s, opacity 0.2s;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.08);
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Transitions */
.chat-panel-enter-active,
.chat-panel-leave-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.chat-panel-enter-from,
.chat-panel-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.fade-pop-enter-active,
.fade-pop-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-pop-enter-from,
.fade-pop-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}

/* Mobile responsive */
@media (max-width: 640px) {
  .ai-chat-launcher-wrapper {
    left: 14px;
    bottom: calc(76px + env(safe-area-inset-bottom));
  }

  .ai-chat-window {
    left: 8px;
    right: 8px;
    bottom: calc(76px + env(safe-area-inset-bottom));
    width: auto;
    max-width: none;
    height: 75vh;
    max-height: 520px;
  }
}
</style>
