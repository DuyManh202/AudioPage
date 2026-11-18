<template>
  <div class="admin-ai-view">
    <!-- Header -->
    <header class="view-header">
      <div>
        <div class="breadcrumb">
          <span>Tú Audio CRM</span>
          <span class="sep">/</span>
          <span class="current">Trợ Lý AI Chatbot</span>
        </div>
        <h1 class="view-title">Trung Tâm Điều Hành &amp; Thử Nghiệm AI Chatbot</h1>
        <p class="view-sub">
          Hệ thống AI chuyên gia âm thanh 24/7 (Google Gemini 2.5 Flash), tích hợp Guardrails cứng và tự động đẩy khách có SĐT lên Bản Đồ Khách Hàng.
        </p>
      </div>

      <div class="header-actions">
        <a href="/" target="_blank" class="adm-btn adm-btn-blue">
          <AdminIcon name="globe" :size="16" />
          <span>Mở Web Khách Hàng (Xem Widget)</span>
        </a>
        <router-link to="/admin/customer-map" class="adm-btn adm-btn-gold">
          <AdminIcon name="map" :size="16" />
          <span>Xem Bản Đồ Khách Hàng</span>
        </router-link>
      </div>
    </header>

    <!-- Stat Cards -->
    <section class="stat-grid">
      <div class="adm-card stat-card">
        <div class="stat-icon-wrapper blue">
          <AdminIcon name="bot" :size="24" />
        </div>
        <div>
          <span class="stat-label">Model Trí Tuệ Nhân Tạo</span>
          <strong class="stat-value">Gemini 2.5 Flash</strong>
          <small class="stat-desc">Tier 1 Standard · Phản hồi &lt; 1 giây</small>
        </div>
      </div>

      <div class="adm-card stat-card">
        <div class="stat-icon-wrapper green">
          <AdminIcon name="shield" :size="24" />
        </div>
        <div>
          <span class="stat-label">Bộ Lọc Guardrails Cứng</span>
          <strong class="stat-value">100% Trung Thực</strong>
          <small class="stat-desc">Khóa cứng địa chỉ, hotline, giá vang số</small>
        </div>
      </div>

      <div class="adm-card stat-card">
        <div class="stat-icon-wrapper amber">
          <AdminIcon name="map" :size="24" />
        </div>
        <div>
          <span class="stat-label">Đồng Bộ Bản Đồ &amp; CRM</span>
          <strong class="stat-value">Tự Động 100%</strong>
          <small class="stat-desc">Bắt SĐT, tra toạ độ tỉnh thành tức thì</small>
        </div>
      </div>

      <div class="adm-card stat-card">
        <div class="stat-icon-wrapper purple">
          <AdminIcon name="phone" :size="24" />
        </div>
        <div>
          <span class="stat-label">Hotline &amp; Zalo Cố Định</span>
          <strong class="stat-value">0984.259.898</strong>
          <small class="stat-desc">Phố Nguyễn Danh Phương, Vĩnh Yên</small>
        </div>
      </div>
    </section>

    <!-- Main Workspace -->
    <div class="ai-workspace-grid">
      <!-- Cột Trái: Console Thử Nghiệm Chat Trực Tiếp -->
      <section class="adm-card chat-tester-card">
        <div class="card-head">
          <div class="head-title">
            <span class="live-dot"></span>
            <strong>Cửa Sổ Thử Nghiệm Trực Tiếp (Test AI Console)</strong>
          </div>
          <button
            type="button"
            class="adm-btn adm-btn-sm"
            @click="clearTestChat"
          >
            Làm mới hội thoại
          </button>
        </div>

        <!-- Quick Scenarios Buttons -->
        <div class="test-scenarios">
          <span class="scenarios-title">Kịch bản thử nghiệm nhanh:</span>
          <div class="scenarios-list">
            <button
              v-for="sc in scenarios"
              :key="sc.label"
              type="button"
              class="scenario-chip"
              :disabled="loading"
              @click="runScenario(sc.prompt)"
            >
              {{ sc.label }}
            </button>
          </div>
        </div>

        <!-- Messages Box -->
        <div ref="testMessagesContainer" class="test-chat-box">
          <div
            v-for="(msg, idx) in testMessages"
            :key="idx"
            :class="['test-msg-row', msg.role === 'user' ? 'user' : 'bot']"
          >
            <div class="avatar-badge">
              {{ msg.role === 'user' ? 'Anh Tú' : 'AI' }}
            </div>
            <div class="test-msg-bubble">
              <div v-if="msg.guardrail" class="guardrail-tag">
                ✓ Khớp Guardrail Cố Định: {{ msg.guardrail }}
              </div>
              <div v-else-if="msg.role === 'assistant'" class="dynamic-tag">
                ✦ Google Gemini 3.8 Flash (AI Chuyên Gia Âm Thanh)
              </div>
              <div class="test-msg-text" v-html="formatText(msg.content)"></div>
              <span class="test-msg-time">{{ msg.time }}</span>
            </div>
          </div>

          <div v-if="loading" class="test-msg-row bot">
            <div class="avatar-badge">AI</div>
            <div class="test-msg-bubble typing">
              <span>Đang tính toán câu trả lời...</span>
            </div>
          </div>
        </div>

        <!-- Input Box -->
        <form class="test-input-form" @submit.prevent="sendTestMessage">
          <input
            v-model="inputTest"
            type="text"
            placeholder="Gõ thử câu hỏi kiểm tra bot (ví dụ: 'phòng 25m2 dùng loa gì', 'vang số k9 giá bao nhiêu')..."
            :disabled="loading"
          />
          <button
            type="submit"
            class="adm-btn adm-btn-blue"
            :disabled="loading || !inputTest.trim()"
          >
            {{ loading ? 'Đang gửi...' : 'Gửi Thử' }}
          </button>
        </form>
      </section>

      <!-- Cột Phải: Bảng Khóa Cứng Thông Tin & Giám Sát CSDL -->
      <section class="adm-card rules-card">
        <div class="card-head">
          <strong>Bộ Quy Tắc Guardrails Khóa Cứng Tuyệt Đối</strong>
        </div>

        <div class="rules-list">
          <div class="rule-item">
            <span class="rule-badge address">📍 ĐỊA CHỈ SHOWROOM</span>
            <p><strong>Phố Nguyễn Danh Phương, phường Hội Hợp, TP. Vĩnh Yên, Vĩnh Phúc</strong> (gần khu Quán Tiên, nhà có chỗ đỗ ô tô thoải mái). Giờ mở cửa: 8h00 - 21h00.</p>
            <small class="rule-note">Khóa chặn 100% không bịa số nhà sai (như số 220 hay tỉnh Phú Thọ).</small>
          </div>

          <div class="rule-item">
            <span class="rule-badge hotline">📞 HOTLINE &amp; ZALO</span>
            <p><strong>0984.259.898</strong> (Tư vấn kỹ thuật, setup vang từ xa, gửi clip test dàn thực tế).</p>
          </div>

          <div class="rule-item">
            <span class="rule-badge gear">🎛️ GIÁ VANG SỐ TIÊU BIỂU</span>
            <ul>
              <li><strong>Vang số CM x16+ chính hãng:</strong> 4.200.000đ (setup 4 cấu hình Echo/Reverb, tặng dây Canon).</li>
              <li><strong>Vang số cao cấp PF K9:</strong> 6.800.000đ (chip DSP 32-bit thế hệ mới, chống rú rít tuyệt đối).</li>
            </ul>
          </div>

          <div class="rule-item">
            <span class="rule-badge combo">🎵 CÁC GÓI DÀN KARAOKE HOT</span>
            <ul>
              <li><strong>Combo Gold Home (19.800.000đ):</strong> Phòng 20 - 30m2, đẩy công suất, vang setup sẵn, mic không dây, loa Full bass 30cm.</li>
              <li><strong>Combo Luxury Home (29.900.000đ):</strong> Phòng 30 - 45m2, cấu hình cao cấp chuẩn quán hát gia đình.</li>
            </ul>
          </div>

          <div class="rule-item">
            <span class="rule-badge crm">🗺️ ĐỒNG BỘ CRM &amp; BẢN ĐỒ</span>
            <p>Bất kỳ khi nào khách hàng nhập <strong>Số điện thoại</strong> trong khung chat, hệ thống tự động nhận diện tỉnh/thành, gán toạ độ GPS và cắm mốc đỏ ngay lập tức trên <strong>Bản Đồ Khách Hàng</strong>.</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import AdminIcon from '../../components/admin/AdminIcon.vue'
import { apiRequest } from '../../utils/api'

const loading = ref(false)
const inputTest = ref('')
const testMessagesContainer = ref(null)

const scenarios = [
  { label: '📍 Hỏi địa chỉ cửa hàng', prompt: 'Cửa hàng Tú Audio mình ở đâu vậy shop?' },
  { label: '📞 Hỏi số Hotline / Zalo', prompt: 'Cho tôi xin số điện thoại Zalo của anh Tú?' },
  { label: '⭐ Hỏi giá Vang số CM x16+ & PF K9', prompt: 'Vang số CM x16+ và PF K9 giá bao nhiêu?' },
  { label: '🎵 Hỏi giá Dàn Karaoke gia đình', prompt: 'Tú Audio có những gói combo dàn karaoke nào hot nhất?' },
  { label: '🛠️ Hỏi link tải phần mềm vang', prompt: 'Cho tôi xin link tải phần mềm căn chỉnh vang số?' },
  { label: '🏠 Hỏi tư vấn phòng 25m2', prompt: 'Phòng khách nhà tôi rộng 25m2, có cầu thang hở thì nên chọn loa gì hát hay?' },
  { label: '📝 Thử để lại số điện thoại (Auto Lead)', prompt: 'Tôi ở Bắc Ninh muốn mua vang số PF K9, sđt tôi 0987654321 gọi lại cho tôi nhé' }
]

const initialTestMessage = {
  role: 'assistant',
  content: 'Chào anh Tú! Em là Trợ lý AI Chuyên Gia Tú Audio (sử dụng Gemini 3.8 Flash). Anh có thể gõ bất kỳ câu hỏi nào bên dưới hoặc bấm vào các nút kịch bản nhanh để kiểm tra câu trả lời thực tế của em ạ!',
  time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const testMessages = ref([initialTestMessage])

const scrollToBottom = async () => {
  await nextTick()
  if (testMessagesContainer.value) {
    testMessagesContainer.value.scrollTop = testMessagesContainer.value.scrollHeight
  }
}

const clearTestChat = () => {
  testMessages.value = [initialTestMessage]
}

const formatText = (text) => {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
}

const runScenario = (prompt) => {
  inputTest.value = prompt
  sendTestMessage()
}

const sendTestMessage = async () => {
  const text = inputTest.value.trim()
  if (!text || loading.value) return

  const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  testMessages.value.push({
    role: 'user',
    content: text,
    time
  })

  inputTest.value = ''
  loading.value = true
  scrollToBottom()

  try {
    const historyPayload = testMessages.value.slice(-6).map(m => ({
      role: m.role,
      content: m.content
    }))

    const res = await apiRequest('/ai-chat', {
      method: 'POST',
      body: JSON.stringify({
        message: text,
        history: historyPayload
      })
    })

    testMessages.value.push({
      role: 'assistant',
      content: res.reply || 'Không nhận được phản hồi từ AI.',
      guardrail: res.guardrail || null,
      leadCaptured: Boolean(res.leadCaptured),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    })
  } catch (err) {
    testMessages.value.push({
      role: 'assistant',
      content: `Lỗi kết nối API: ${err.message}`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}
</script>

<style scoped>
.admin-ai-view {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* Header */
.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 4px;
}

.breadcrumb .sep {
  color: #cbd5e1;
}

.breadcrumb .current {
  color: #0f172a;
  font-weight: 600;
}

.view-title {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.view-sub {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #64748b;
  max-width: 760px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Stat Cards */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 14px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon-wrapper.blue { background: rgba(37, 99, 235, 0.12); color: #2563eb; }
.stat-icon-wrapper.green { background: rgba(34, 197, 94, 0.12); color: #16a34a; }
.stat-icon-wrapper.amber { background: rgba(245, 158, 11, 0.12); color: #d97706; }
.stat-icon-wrapper.purple { background: rgba(147, 51, 234, 0.12); color: #9333ea; }

.stat-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-value {
  display: block;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 1px 0 2px;
}

.stat-desc {
  display: block;
  font-size: 0.73rem;
  color: #94a3b8;
}

/* Workspace 2 columns */
.ai-workspace-grid {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 20px;
}

.chat-tester-card,
.rules-card {
  display: flex;
  flex-direction: column;
}

.card-head {
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.head-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
}

.live-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}

/* Scenarios */
.test-scenarios {
  padding: 12px 18px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.scenarios-title {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 8px;
}

.scenarios-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.scenario-chip {
  background: #fff;
  border: 1px solid #cbd5e1;
  color: #1e293b;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.scenario-chip:hover:not(:disabled) {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
  transform: translateY(-1px);
}

.scenario-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Chat Messages Box */
.test-chat-box {
  flex: 1;
  min-height: 380px;
  max-height: 480px;
  overflow-y: auto;
  padding: 16px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.test-msg-row {
  display: flex;
  gap: 10px;
  max-width: 88%;
}

.test-msg-row.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.test-msg-row.bot {
  align-self: flex-start;
}

.avatar-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 800;
  flex-shrink: 0;
}

.user .avatar-badge {
  background: #2563eb;
  color: #fff;
}

.bot .avatar-badge {
  background: #0f172a;
  color: #38bdf8;
  border: 1px solid #38bdf8;
}

.test-msg-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.84rem;
  line-height: 1.45;
}

.user .test-msg-bubble {
  background: #2563eb;
  color: #fff;
  border-top-right-radius: 2px;
}

.bot .test-msg-bubble {
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #0f172a;
  border-top-left-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.guardrail-tag {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 800;
  color: #15803d;
  background: #dcfce7;
  padding: 2px 8px;
  border-radius: 6px;
  margin-bottom: 6px;
}

.dynamic-tag {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 800;
  color: #1d4ed8;
  background: #dbeafe;
  padding: 2px 8px;
  border-radius: 6px;
  margin-bottom: 6px;
}

.test-msg-time {
  display: block;
  font-size: 0.65rem;
  color: #94a3b8;
  margin-top: 4px;
}

.user .test-msg-time {
  color: #bfdbfe;
  text-align: right;
}

/* Input Form */
.test-input-form {
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 10px;
}

.test-input-form input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
}

.test-input-form input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

/* Rules Section */
.rules-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  max-height: 570px;
}

.rule-item {
  padding: 12px 14px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.rule-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.rule-badge.address { background: #fee2e2; color: #b91c1c; }
.rule-badge.hotline { background: #fef3c7; color: #92400e; }
.rule-badge.gear { background: #e0e7ff; color: #4338ca; }
.rule-badge.combo { background: #fce7f3; color: #be185d; }
.rule-badge.crm { background: #dcfce7; color: #166534; }

.rule-item p {
  margin: 0 0 4px;
  font-size: 0.84rem;
  line-height: 1.45;
  color: #1e293b;
}

.rule-item ul {
  margin: 0;
  padding-left: 18px;
  font-size: 0.82rem;
  line-height: 1.45;
  color: #334155;
}

.rule-note {
  display: block;
  font-size: 0.72rem;
  color: #64748b;
  margin-top: 4px;
  font-style: italic;
}

@media (max-width: 900px) {
  .ai-workspace-grid {
    grid-template-columns: 1fr;
  }
}
</style>
