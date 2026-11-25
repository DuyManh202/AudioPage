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

    <!-- Bảng Điều Khiển Bật / Tắt AI Chatbot Trực Tuyến -->
    <section class="ai-control-panel adm-card">
      <div class="control-panel-header">
        <div class="control-header-left">
          <span class="control-icon">⚡</span>
          <div>
            <h2 class="control-title">Trung Tâm Bật / Tắt AI Chatbot</h2>
            <p class="control-sub">Chủ động Bật hoặc Tắt tính năng AI tự động trên từng kênh của Tú Audio</p>
          </div>
        </div>
        <div class="control-header-status">
          <span class="gemini-pill" :class="{ active: geminiConfigured }">
            {{ geminiConfigured ? `🟢 Gemini AI: Sẵn Sàng (${activeModel})` : '🔴 Gemini AI: Chưa cấu hình Token' }}
          </span>
          <button type="button" class="token-config-btn" @click="showTokenModal = true">
            🔑 {{ hasKey ? (maskedKey ? maskedKey : 'Đổi Token') : 'Nhập Token AI' }}
          </button>
        </div>
      </div>

      <div class="ai-switches-grid">
        <!-- Switch 1: AI Website -->
        <div class="ai-switch-card" :class="{ active: webAiEnabled }">
          <div class="switch-content">
            <div class="switch-badge-row">
              <span class="status-indicator-chip" :class="webAiEnabled ? 'chip-on' : 'chip-off'">
                {{ webAiEnabled ? '● ĐANG BẬT' : '○ ĐÃ TẮT' }}
              </span>
              <span class="switch-channel-tag">Kênh: Website Amek.io.vn</span>
            </div>
            <h3 class="switch-name">Chatbot AI Trên Website</h3>
            <p class="switch-desc">
              Khi BẬT: Khách truy cập web sẽ thấy nút chat tròn nổi ở góc dưới, có thể hỏi giá dàn, cấu hình và xin tư vấn 24/7.<br>
              Khi TẮT: Widget chat trên website sẽ tự động ẩn hoàn toàn.
            </p>
          </div>
          <div class="switch-action-wrap">
            <button
              type="button"
              class="modern-toggle-btn"
              :class="{ checked: webAiEnabled }"
              :disabled="savingKey === 'web'"
              @click="toggleWebAi"
              :title="webAiEnabled ? 'Bấm để Tắt AI Website' : 'Bấm để Bật AI Website'"
            >
              <span class="toggle-knob"></span>
            </button>
            <span class="toggle-label-text">{{ webAiEnabled ? 'BẬT' : 'TẮT' }}</span>
          </div>
        </div>

        <!-- Switch 2: AI Fanpage Facebook -->
        <div class="ai-switch-card" :class="{ active: facebookAiEnabled }">
          <div class="switch-content">
            <div class="switch-badge-row">
              <span class="status-indicator-chip" :class="facebookAiEnabled ? 'chip-on' : 'chip-off'">
                {{ facebookAiEnabled ? '● ĐANG BẬT' : '○ ĐÃ TẮT' }}
              </span>
              <span class="switch-channel-tag">Kênh: Fanpage Messenger</span>
            </div>
            <h3 class="switch-name">AI Tự Động Trả Lời Fanpage</h3>
            <p class="switch-desc">
              Khi BẬT: AI Gemini sẽ tự động phản hồi ngay lập tức khi khách gửi tin nhắn đầu tiên tới Fanpage, hỗ trợ tư vấn và xin SĐT.<br>
              Khi TẮT: AI sẽ không tự động gửi bất kỳ tin nhắn nào, nhường quyền hoàn toàn cho anh Tú và nhân sự trực tiếp chat.
            </p>
          </div>
          <div class="switch-action-wrap">
            <button
              type="button"
              class="modern-toggle-btn"
              :class="{ checked: facebookAiEnabled }"
              :disabled="savingKey === 'fb'"
              @click="toggleFacebookAi"
              :title="facebookAiEnabled ? 'Bấm để Tắt AI Fanpage' : 'Bấm để Bật AI Fanpage'"
            >
              <span class="toggle-knob"></span>
            </button>
            <span class="toggle-label-text">{{ facebookAiEnabled ? 'BẬT' : 'TẮT' }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal Nhập / Đổi Gemini API Key -->
    <div v-if="showTokenModal" class="token-modal-backdrop" @click="showTokenModal = false">
      <div class="token-modal-card" @click.stop>
        <div class="modal-head">
          <div class="head-left">
            <span class="modal-icon">🔑</span>
            <div>
              <h3>Cấu Hình Google Gemini API Key</h3>
              <p>Token được lưu an toàn trong CSDL PostgreSQL, dùng cho cả Web & Fanpage</p>
            </div>
          </div>
          <button type="button" class="modal-close-btn" @click="showTokenModal = false">✕</button>
        </div>

        <form class="token-modal-form" @submit.prevent="saveApiKey">
          <div v-if="hasKey" class="current-token-info">
            <span class="token-tag">Token hiện tại:</span>
            <code>{{ maskedKey }}</code>
          </div>
          <label class="token-input-label">
            <span>{{ hasKey ? 'Nhập Token mới (để thay thế):' : 'Dán Google Gemini API Key vào đây:' }}</span>
            <input 
              v-model="inputApiKey" 
              type="text" 
              placeholder="VD: AIzaSy... hoặc AQ.Ab8RN..." 
              required
            />
          </label>
          <div class="modal-actions">
            <button type="button" class="adm-btn adm-btn-light" @click="showTokenModal = false">Hủy bỏ</button>
            <button type="submit" class="adm-btn adm-btn-blue" :disabled="savingToken">
              {{ savingToken ? 'Đang lưu…' : 'Lưu Token Ngay' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Thanh Điều Hướng Chức Năng (Tabs) -->
    <div class="ai-tabs-nav">
      <button
        type="button"
        class="ai-tab-btn"
        :class="{ active: activeTab === 'training' }"
        @click="activeTab = 'training'"
      >
        <span class="tab-icon">🎯</span>
        <span class="tab-title">Đào Tạo Tâm Lý Khách Hàng (AI Training Hub)</span>
        <span class="tab-badge">{{ trainingRules.length }} kịch bản</span>
      </button>

      <button
        type="button"
        class="ai-tab-btn"
        :class="{ active: activeTab === 'testing' }"
        @click="activeTab = 'testing'"
      >
        <span class="tab-icon">💬</span>
        <span class="tab-title">Cửa Sổ Thử Nghiệm Chat Trực Tiếp</span>
      </button>
    </div>

    <!-- TAB 1: KHU VỰC ĐÀO TẠO TÂM LÝ KHÁCH HÀNG (AI TRAINING HUB) -->
    <div v-if="activeTab === 'training'" class="training-hub-wrapper">
      <!-- Toolbar & Thống Kê Nhanh -->
      <div class="training-toolbar adm-card">
        <div class="toolbar-info">
          <div class="toolbar-title-wrap">
            <span class="toolbar-icon">🧠</span>
            <div>
              <h2 class="toolbar-title">Bộ Não Đọc Vị Tâm Lý &amp; Kịch Bản Chốt Sale AI</h2>
              <p class="toolbar-desc">
                Huấn luyện AI cách đọc vị nỗi đau tâm lý từng khách hàng (hú rít, mua đi bán lại, cần thợ tại nhà, dò giá...),
                xuất chiêu đúng tâm lý và khéo léo xin số Zalo/điện thoại theo chuẩn phong cách chuyên gia âm thanh Tú Audio.
              </p>
            </div>
          </div>
          <div class="training-stats">
            <span class="stat-pill active">
              🟢 Đang kích hoạt: <strong>{{ activeRulesCount }}/{{ trainingRules.length }}</strong> kịch bản
            </span>
            <span class="stat-pill info">
              ⚡ Tự động nạp: <strong>Gemini 3.8 Flash</strong>
            </span>
          </div>
        </div>

        <div class="toolbar-actions">
          <button
            type="button"
            class="adm-btn adm-btn-purple"
            :disabled="generatingAiScript"
            @click="openAiGenerateModal"
          >
            <span v-if="generatingAiScript">⏳ AI Đang Soạn...</span>
            <span v-else>✨ AI Tự Động Soạn Kịch Bản</span>
          </button>
          <button
            type="button"
            class="adm-btn adm-btn-gold"
            :disabled="trainingInFlight"
            @click="triggerRetrainAi"
          >
            <span v-if="trainingInFlight">⏳ Đang nạp kiến thức...</span>
            <span v-else>⚡ Huấn Luyện AI Tức Thì</span>
          </button>
          <button
            type="button"
            class="adm-btn adm-btn-blue"
            @click="openCreateRuleModal"
          >
            + Thêm Kịch Bản Tâm Lý Mới
          </button>
        </div>
      </div>

      <!-- Danh Sách Kịch Bản Tâm Lý -->
      <div v-if="loadingTraining" class="loading-box adm-card">
        <span>Đang tải các kịch bản tâm lý từ máy chủ...</span>
      </div>

      <div v-else-if="!trainingRules.length" class="empty-box adm-card">
        <p>Chưa có kịch bản tâm lý nào. Bấm nút <strong>"+ Thêm Kịch Bản Tâm Lý Mới"</strong> để bắt đầu đào tạo!</p>
      </div>

      <div v-else class="rules-grid">
        <div
          v-for="rule in trainingRules"
          :key="rule.id"
          class="training-rule-card adm-card"
          :class="{ inactive: !rule.is_active }"
        >
          <div class="rule-card-header">
            <div class="rule-header-left">
              <span class="persona-tag" :class="getPersonaClass(rule.persona_type)">
                {{ getPersonaLabel(rule.persona_type) }}
              </span>
              <h3 class="rule-card-title">{{ rule.title }}</h3>
            </div>
            <div class="rule-header-right">
              <button
                type="button"
                class="rule-toggle-btn"
                :class="{ active: rule.is_active }"
                @click="toggleRuleActive(rule)"
                :title="rule.is_active ? 'Bấm để tạm dừng kịch bản này' : 'Bấm để kích hoạt kịch bản này'"
              >
                <span class="toggle-dot"></span>
                <span class="toggle-text">{{ rule.is_active ? 'ĐANG BẬT' : 'ĐÃ TẮT' }}</span>
              </button>
            </div>
          </div>

          <!-- Nội Dung Đòn Bẩy Tâm Lý -->
          <div class="rule-section">
            <span class="section-label">🎯 Nỗi Đau &amp; Đòn Bẩy Tâm Lý Cốt Lõi:</span>
            <p class="trigger-text">{{ rule.psychological_trigger }}</p>
          </div>

          <!-- Từ Khóa Nhận Diện -->
          <div v-if="rule.customer_keywords" class="rule-section">
            <span class="section-label">🔍 Dấu Hiệu / Từ Khóa Khách Thường Nhắn:</span>
            <div class="keywords-wrap">
              <span v-for="kw in parseKeywords(rule.customer_keywords)" :key="kw" class="kw-tag">
                {{ kw }}
              </span>
            </div>
          </div>

          <!-- Câu Trả Lời Mẫu Chuẩn Anh Tú -->
          <div class="rule-section response-box">
            <span class="section-label">💬 Câu Trả Lời Mẫu Chuẩn Phong Cách Anh Tú:</span>
            <blockquote class="suggested-quote">
              "{{ rule.suggested_response }}"
            </blockquote>
          </div>

          <!-- Thao Tác -->
          <div class="rule-card-footer">
            <small class="rule-id">Mã: {{ rule.id }}</small>
            <div class="rule-actions">
              <button
                type="button"
                class="action-btn edit-btn"
                @click="openEditRuleModal(rule)"
              >
                ✏️ Chỉnh Sửa
              </button>
              <button
                type="button"
                class="action-btn delete-btn"
                @click="deleteRule(rule)"
              >
                🗑️ Xóa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: KHU VỰC THỬ NGHIỆM TRỰC TIẾP (TESTING CONSOLE) -->
    <div v-else class="testing-workspace-wrapper">
    <!-- Stat Cards -->
    <section class="stat-grid">
      <div class="adm-card stat-card">
        <div class="stat-icon-wrapper blue">
          <AdminIcon name="bot" :size="24" />
        </div>
        <div>
          <span class="stat-label">Model Trí Tuệ Nhân Tạo</span>
          <strong class="stat-value">{{ activeModel }}</strong>
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

    <!-- Modal Thêm / Chỉnh Sửa Kịch Bản Tâm Lý -->
    <div v-if="showRuleModal" class="adm-modal-backdrop" @click.self="showRuleModal = false">
      <div class="adm-modal training-modal">
        <div class="modal-head">
          <h3>{{ isEditingRule ? 'Chỉnh Sửa Kịch Bản Tâm Lý' : 'Thêm Kịch Bản Tâm Lý Mới' }}</h3>
          <button type="button" class="close-btn" @click="showRuleModal = false">✕</button>
        </div>
        <form @submit.prevent="saveRule">
          <!-- Hộp AI Tự Động Soạn Kịch Bản -->
          <div class="ai-generator-banner">
            <div class="ai-banner-title">
              <span class="ai-badge-sparkle">✨ AI TỰ ĐỘNG SOẠN KỊCH BẢN</span>
              <span class="ai-banner-sub">Gemini 3.8 Flash tự động bắt bệnh tâm lý, tìm từ khóa &amp; viết câu trả lời</span>
            </div>
            <div class="ai-banner-input-group">
              <input
                v-model="aiPromptInput"
                type="text"
                placeholder="Nhập ý tưởng (VD: Khách sợ ồn hàng xóm, chê đắt, hỏi loa kéo...) hoặc để trống để AI tự sáng tạo"
                :disabled="generatingAiScript"
                @keydown.enter.prevent="handleAutoGenerateScript"
              />
              <button
                type="button"
                class="adm-btn adm-btn-purple ai-gen-btn"
                :disabled="generatingAiScript"
                @click="handleAutoGenerateScript"
              >
                <span v-if="generatingAiScript">⏳ Đang viết...</span>
                <span v-else>✨ AI Viết Ngay</span>
              </button>
            </div>
            <div class="ai-quick-suggestions">
              <span class="quick-title">Gợi ý nhanh:</span>
              <button type="button" class="quick-chip" @click="applyQuickTopic('Khách ở chung cư sợ làm phiền hàng xóm')">Chung cư sợ ồn</button>
              <button type="button" class="quick-chip" @click="applyQuickTopic('Khách chê giá cao hơn chỗ khác')">Chê giá cao</button>
              <button type="button" class="quick-chip" @click="applyQuickTopic('Khách muốn vang số ghép với amply cũ')">Vang ghép Amply cũ</button>
              <button type="button" class="quick-chip" @click="applyQuickTopic('Khách sợ mua phải hàng nhái bãi Trung Quốc')">Sợ hàng nhái</button>
            </div>
          </div>

          <label class="form-field">
            <span>Tiêu đề kịch bản:</span>
            <input
              v-model="ruleForm.title"
              type="text"
              placeholder="VD: 1. Khách đau khổ vì hú rít, hát mệt..."
              required
            />
          </label>

          <label class="form-field">
            <span>Nhóm tâm lý khách hàng (Persona):</span>
            <select v-model="ruleForm.persona_type" required>
              <option v-for="pt in PERSONA_TYPES" :key="pt.value" :value="pt.value">
                {{ pt.label }}
              </option>
            </select>
          </label>

          <label class="form-field">
            <span>Nỗi đau cốt lõi &amp; Đòn bẩy tâm lý:</span>
            <textarea
              v-model="ruleForm.psychological_trigger"
              rows="3"
              placeholder="Phân tích tâm lý khách hàng và cách AI bẻ gãy sự phòng thủ..."
              required
            ></textarea>
          </label>

          <label class="form-field">
            <span>Dấu hiệu nhận diện / Từ khóa khách thường nhắn (cách nhau bởi dấu phẩy):</span>
            <input
              v-model="ruleForm.customer_keywords"
              type="text"
              placeholder="VD: hú rít, nặng mic, hát mệt, mua đi bán lại, chán..."
            />
          </label>

          <label class="form-field">
            <span>Câu trả lời mẫu chuẩn phong cách anh Tú:</span>
            <textarea
              v-model="ruleForm.suggested_response"
              rows="4"
              placeholder="Câu trả lời 1-2 câu ngắn, thấu cảm và khéo léo xin số Zalo/điện thoại..."
              required
            ></textarea>
          </label>

          <div class="form-checkbox-row">
            <label class="checkbox-label">
              <input v-model="ruleForm.is_active" type="checkbox" />
              <span>Kích hoạt kịch bản này ngay cho AI (Website, Messenger, Comment)</span>
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="adm-btn adm-btn-light" @click="showRuleModal = false">Hủy bỏ</button>
            <button type="submit" class="adm-btn adm-btn-blue" :disabled="savingRule">
              {{ savingRule ? 'Đang lưu…' : (isEditingRule ? 'Cập Nhật Kịch Bản' : 'Lưu Kịch Bản Mới') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import AdminIcon from '../../components/admin/AdminIcon.vue'
import { apiRequest } from '../../utils/api'
import { useAdminStore } from '../../stores/adminStore'

const adminStore = useAdminStore()
const loading = ref(false)
const inputTest = ref('')
const testMessagesContainer = ref(null)

const activeTab = ref('training')

const PERSONA_TYPES = [
  { value: 'HU_RIT_THAT_VONG', label: '1. Đau khổ vì hú rít / mua đi bán lại', class: 'red' },
  { value: 'NANG_CAP_DO_CU', label: '2. Nâng cấp đồ cũ / Ghép thêm món', class: 'amber' },
  { value: 'DICH_VU_TAN_NHA', label: '3. Muốn làm tại nhà / Ghép chuyến', class: 'blue' },
  { value: 'DO_GIA_SO_HO', label: '4. Dò giá / Sợ mua hớ / Sợ hàng nhái', class: 'purple' },
  { value: 'KHACH_MOI_TRON_BO', label: '5. Khách mới tinh sắm dàn gia đình', class: 'green' },
  { value: 'CHUYEN_SAU', label: '6. Tình huống kỹ thuật chuyên sâu khác', class: 'slate' }
]

const trainingRules = ref([])
const loadingTraining = ref(false)
const trainingInFlight = ref(false)
const showRuleModal = ref(false)
const isEditingRule = ref(false)
const savingRule = ref(false)
const generatingAiScript = ref(false)
const aiPromptInput = ref('')

const ruleForm = ref({
  id: '',
  title: '',
  persona_type: 'HU_RIT_THAT_VONG',
  psychological_trigger: '',
  customer_keywords: '',
  suggested_response: '',
  is_active: true
})

const handleAutoGenerateScript = async () => {
  generatingAiScript.value = true
  try {
    const res = await apiRequest('/admin/ai-training/auto-generate', {
      method: 'POST',
      body: JSON.stringify({
        topic: aiPromptInput.value.trim(),
        personaType: ruleForm.value.persona_type
      })
    })

    if (res?.data) {
      if (res.data.title) ruleForm.value.title = res.data.title
      if (res.data.persona_type) ruleForm.value.persona_type = res.data.persona_type
      if (res.data.psychological_trigger) ruleForm.value.psychological_trigger = res.data.psychological_trigger
      if (res.data.customer_keywords) ruleForm.value.customer_keywords = res.data.customer_keywords
      if (res.data.suggested_response) ruleForm.value.suggested_response = res.data.suggested_response
      adminStore.showNotice('✨ AI đã tự động soạn thảo xong toàn bộ kịch bản tâm lý!', 'success')
    } else {
      adminStore.showNotice(res?.message || 'Không thể tạo kịch bản từ AI', 'warning')
    }
  } catch (err) {
    adminStore.showNotice(err.message || 'Lỗi khi gọi AI soạn kịch bản', 'error')
  } finally {
    generatingAiScript.value = false
  }
}

const applyQuickTopic = (topic) => {
  aiPromptInput.value = topic
  handleAutoGenerateScript()
}

const openAiGenerateModal = () => {
  openCreateRuleModal()
  aiPromptInput.value = ''
  handleAutoGenerateScript()
}

const activeRulesCount = computed(() => trainingRules.value.filter(r => r.is_active).length)

const getPersonaLabel = (type) => {
  const p = PERSONA_TYPES.find(item => item.value === type)
  return p ? p.label : type
}

const getPersonaClass = (type) => {
  const p = PERSONA_TYPES.find(item => item.value === type)
  return p ? p.class : 'slate'
}

const parseKeywords = (keywords) => {
  if (!keywords) return []
  return keywords.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
}

const loadTrainingRules = async () => {
  loadingTraining.value = true
  try {
    const res = await apiRequest('/admin/ai-training')
    if (res?.data) {
      trainingRules.value = res.data
    }
  } catch (err) {
    adminStore.showNotice(err.message || 'Không thể tải danh sách kịch bản tâm lý', 'error')
  } finally {
    loadingTraining.value = false
  }
}

const openCreateRuleModal = () => {
  isEditingRule.value = false
  ruleForm.value = {
    id: '',
    title: '',
    persona_type: 'HU_RIT_THAT_VONG',
    psychological_trigger: '',
    customer_keywords: '',
    suggested_response: '',
    is_active: true
  }
  showRuleModal.value = true
}

const openEditRuleModal = (rule) => {
  isEditingRule.value = true
  ruleForm.value = {
    id: rule.id,
    title: rule.title,
    persona_type: rule.persona_type,
    psychological_trigger: rule.psychological_trigger,
    customer_keywords: rule.customer_keywords || '',
    suggested_response: rule.suggested_response,
    is_active: Boolean(rule.is_active)
  }
  showRuleModal.value = true
}

const saveRule = async () => {
  savingRule.value = true
  try {
    if (isEditingRule.value && ruleForm.value.id) {
      const res = await apiRequest(`/admin/ai-training/${encodeURIComponent(ruleForm.value.id)}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: ruleForm.value.title,
          personaType: ruleForm.value.persona_type,
          psychologicalTrigger: ruleForm.value.psychological_trigger,
          customerKeywords: ruleForm.value.customer_keywords,
          suggestedResponse: ruleForm.value.suggested_response,
          isActive: ruleForm.value.is_active
        })
      })
      adminStore.showNotice(res.message || 'Cập nhật kịch bản thành công!', 'success')
    } else {
      const res = await apiRequest('/admin/ai-training', {
        method: 'POST',
        body: JSON.stringify({
          title: ruleForm.value.title,
          personaType: ruleForm.value.persona_type,
          psychologicalTrigger: ruleForm.value.psychological_trigger,
          customerKeywords: ruleForm.value.customer_keywords,
          suggestedResponse: ruleForm.value.suggested_response,
          isActive: ruleForm.value.is_active
        })
      })
      adminStore.showNotice(res.message || 'Thêm kịch bản tâm lý mới thành công!', 'success')
    }
    showRuleModal.value = false
    await loadTrainingRules()
  } catch (err) {
    adminStore.showNotice(err.message || 'Không thể lưu kịch bản', 'error')
  } finally {
    savingRule.value = false
  }
}

const toggleRuleActive = async (rule) => {
  const next = !rule.is_active
  try {
    await apiRequest(`/admin/ai-training/${encodeURIComponent(rule.id)}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: next })
    })
    rule.is_active = next
    adminStore.showNotice(`Đã ${next ? 'BẬT' : 'TẮT'} kịch bản "${rule.title}"!`, 'success')
  } catch (err) {
    adminStore.showNotice(err.message || 'Không thể thay đổi trạng thái', 'error')
  }
}

const deleteRule = async (rule) => {
  if (!confirm(`Anh có chắc chắn muốn xóa kịch bản "${rule.title}" không?`)) return
  try {
    await apiRequest(`/admin/ai-training/${encodeURIComponent(rule.id)}`, {
      method: 'DELETE'
    })
    adminStore.showNotice('Đã xóa kịch bản thành công!', 'success')
    await loadTrainingRules()
  } catch (err) {
    adminStore.showNotice(err.message || 'Không thể xóa kịch bản', 'error')
  }
}

const triggerRetrainAi = async () => {
  trainingInFlight.value = true
  try {
    const res = await apiRequest('/admin/ai-training/train', {
      method: 'POST'
    })
    adminStore.showNotice(res.message || 'Đã nạp kiến thức tâm lý thành công vào toàn bộ hệ thống AI!', 'success')
  } catch (err) {
    adminStore.showNotice(err.message || 'Lỗi nạp kiến thức', 'error')
  } finally {
    trainingInFlight.value = false
  }
}

const webAiEnabled = ref(true)
const facebookAiEnabled = ref(true)
const geminiConfigured = ref(false)
const hasKey = ref(false)
const maskedKey = ref('')
const activeModel = ref('gemini-3.8-flash')
const showTokenModal = ref(false)
const inputApiKey = ref('')
const savingToken = ref(false)
const savingKey = ref('')

const loadAiSettings = async () => {
  try {
    const res = await apiRequest('/admin/ai-settings')
    if (res?.data) {
      webAiEnabled.value = Boolean(res.data.webAiEnabled)
      facebookAiEnabled.value = Boolean(res.data.facebookAiEnabled)
      geminiConfigured.value = Boolean(res.data.geminiConfigured)
      hasKey.value = Boolean(res.data.hasKey)
      maskedKey.value = res.data.maskedKey || ''
      activeModel.value = res.data.model || 'gemini-3.8-flash'
    }
  } catch (err) {
    adminStore.showNotice(err.message || 'Chưa tải được cài đặt AI', 'error')
  }
}

const saveApiKey = async () => {
  if (!inputApiKey.value.trim()) return
  savingToken.value = true
  try {
    await apiRequest('/admin/ai-settings', {
      method: 'POST',
      body: JSON.stringify({ apiKey: inputApiKey.value.trim() })
    })
    inputApiKey.value = ''
    showTokenModal.value = false
    await loadAiSettings()
    adminStore.showNotice('Đã lưu Google Gemini API Key vào CSDL thành công!', 'success')
  } catch (err) {
    adminStore.showNotice(err.message || 'Không thể lưu Token', 'error')
  } finally {
    savingToken.value = false
  }
}

const toggleWebAi = async () => {
  const next = !webAiEnabled.value
  savingKey.value = 'web'
  try {
    await apiRequest('/admin/ai-settings', {
      method: 'POST',
      body: JSON.stringify({ webAiEnabled: next })
    })
    webAiEnabled.value = next
    adminStore.showNotice(`Đã ${next ? 'BẬT' : 'TẮT'} Chatbot AI trên Website!`, 'success')
  } catch (err) {
    adminStore.showNotice(err.message || 'Không thể cập nhật cấu hình', 'error')
  } finally {
    savingKey.value = ''
  }
}

const toggleFacebookAi = async () => {
  const next = !facebookAiEnabled.value
  savingKey.value = 'fb'
  try {
    await apiRequest('/admin/ai-settings', {
      method: 'POST',
      body: JSON.stringify({ facebookAiEnabled: next })
    })
    facebookAiEnabled.value = next
    adminStore.showNotice(`Đã ${next ? 'BẬT' : 'TẮT'} AI tự động trả lời trên Fanpage Facebook!`, 'success')
  } catch (err) {
    adminStore.showNotice(err.message || 'Không thể cập nhật cấu hình', 'error')
  } finally {
    savingKey.value = ''
  }
}

onMounted(() => {
  loadAiSettings()
  loadTrainingRules()
})

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

/* Control Panel */
.ai-control-panel {
  padding: 20px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.05);
}

.control-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.control-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-icon {
  font-size: 1.8rem;
  background: #fef3c7;
  border-radius: 12px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.control-sub {
  font-size: 0.8rem;
  color: #64748b;
  margin: 2px 0 0;
}

.control-header-status {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.token-config-btn {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.token-config-btn:hover {
  background: #e2e8f0;
}

.token-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.token-modal-card {
  background: #ffffff;
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  padding: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}

.head-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.modal-icon {
  font-size: 1.8rem;
  background: #e0f2fe;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-head h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #0f172a;
}

.modal-head p {
  margin: 3px 0 0;
  font-size: 0.78rem;
  color: #64748b;
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #94a3b8;
}

.current-token-info {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.token-tag {
  font-size: 0.76rem;
  font-weight: 700;
  color: #64748b;
}

.current-token-info code {
  font-size: 0.82rem;
  color: #0f172a;
  font-family: monospace;
  font-weight: 700;
}

.token-input-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 20px;
}

.token-input-label input {
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.88rem;
  outline: none;
  font-family: monospace;
}

.token-input-label input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.gemini-pill {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 999px;
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.gemini-pill.active {
  background: #dcfce7;
  color: #166534;
  border-color: #bbf7d0;
}

.ai-switches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.ai-switch-card {
  padding: 16px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;
}

.ai-switch-card.active {
  background: #f0fdf4;
  border-color: #86efac;
}

.switch-content {
  flex: 1;
}

.switch-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.status-indicator-chip {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
}

.status-indicator-chip.chip-on {
  background: #22c55e;
  color: #ffffff;
}

.status-indicator-chip.chip-off {
  background: #94a3b8;
  color: #ffffff;
}

.switch-channel-tag {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
}

.switch-name {
  font-size: 0.96rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
}

.switch-desc {
  font-size: 0.78rem;
  color: #64748b;
  margin: 0;
  line-height: 1.45;
}

.switch-action-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.modern-toggle-btn {
  width: 52px;
  height: 30px;
  background: #cbd5e1;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  position: relative;
  transition: background 0.25s ease;
  padding: 3px;
}

.modern-toggle-btn.checked {
  background: #22c55e;
}

.modern-toggle-btn .toggle-knob {
  display: block;
  width: 24px;
  height: 24px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.25s ease;
}

.modern-toggle-btn.checked .toggle-knob {
  transform: translateX(22px);
}

.toggle-label-text {
  font-size: 0.72rem;
  font-weight: 800;
  color: #64748b;
}

.modern-toggle-btn.checked + .toggle-label-text {
  color: #166534;
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

/* =========================================================
   TABS CHUYỂN ĐỔI CHỨC NĂNG
========================================================= */
.ai-tabs-nav {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.ai-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: #f8fafc;
  color: #475569;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ai-tab-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.ai-tab-btn.active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
}

.tab-badge {
  font-size: 0.72rem;
  background: rgba(0, 0, 0, 0.12);
  padding: 2px 7px;
  border-radius: 12px;
}

.ai-tab-btn.active .tab-badge {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

/* =========================================================
   TRAINING HUB TOOLBAR & CARDS
========================================================= */
.training-hub-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.training-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  padding: 20px 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}

.toolbar-title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.toolbar-icon {
  font-size: 2rem;
  line-height: 1;
}

.toolbar-title {
  margin: 0 0 6px;
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.toolbar-desc {
  margin: 0;
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.5;
  max-width: 720px;
}

.training-stats {
  display: flex;
  gap: 12px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.stat-pill {
  font-size: 0.8rem;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
}

.stat-pill.active {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.stat-pill.info {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* Rules Grid */
.rules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
  gap: 20px;
}

.training-rule-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.training-rule-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
}

.training-rule-card.inactive {
  opacity: 0.6;
  background: #f8fafc;
}

.rule-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.rule-header-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.persona-tag {
  display: inline-block;
  align-self: flex-start;
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 6px;
}

.persona-tag.red { background: #fee2e2; color: #991b1b; }
.persona-tag.amber { background: #fef3c7; color: #92400e; }
.persona-tag.blue { background: #e0f2fe; color: #0369a1; }
.persona-tag.purple { background: #f3e8ff; color: #6b21a8; }
.persona-tag.green { background: #dcfce7; color: #166534; }
.persona-tag.slate { background: #f1f5f9; color: #334155; }

.rule-card-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.rule-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid #cbd5e1;
  background: #f1f5f9;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
}

.rule-toggle-btn .toggle-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.rule-toggle-btn.active {
  background: #ecfdf5;
  border-color: #6ee7b7;
  color: #065f46;
}

.rule-toggle-btn.active .toggle-dot {
  background: #10b981;
}

.rule-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-label {
  font-size: 0.76rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.trigger-text {
  margin: 0;
  font-size: 0.86rem;
  color: #1e293b;
  line-height: 1.5;
  background: #f8fafc;
  padding: 8px 12px;
  border-radius: 8px;
  border-left: 3px solid #0284c7;
}

.keywords-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.kw-tag {
  font-size: 0.74rem;
  padding: 2px 8px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #475569;
  border: 1px dashed #cbd5e1;
}

.response-box {
  background: #faf5ff;
  padding: 12px 14px;
  border-radius: 10px;
  border-left: 3px solid #9333ea;
}

.suggested-quote {
  margin: 4px 0 0;
  font-size: 0.88rem;
  color: #581c87;
  font-style: italic;
  line-height: 1.55;
  font-weight: 500;
}

.rule-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.rule-id {
  font-family: monospace;
  font-size: 0.74rem;
  color: #94a3b8;
}

.rule-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.action-btn.edit-btn {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #cbd5e1;
}

.action-btn.edit-btn:hover {
  background: #e2e8f0;
}

.action-btn.delete-btn {
  background: #fff1f2;
  color: #be123c;
  border-color: #fecdd3;
}

.action-btn.delete-btn:hover {
  background: #ffe4e6;
}

/* Training Modal */
.training-modal {
  max-width: 680px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
}

.form-checkbox-row {
  margin: 10px 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.88rem;
  color: #1e293b;
  font-weight: 600;
}

.loading-box, .empty-box {
  padding: 40px;
  text-align: center;
  color: #64748b;
  font-size: 0.95rem;
}

/* AI Generator Banner */
.ai-generator-banner {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(79, 70, 229, 0.06) 100%);
  border: 1px solid rgba(139, 92, 246, 0.35);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 18px;
}

.ai-banner-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.ai-badge-sparkle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
}

.ai-banner-sub {
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 500;
}

.ai-banner-input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.ai-banner-input-group input {
  flex: 1;
  padding: 9px 12px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  font-size: 0.88rem;
  background: #ffffff;
  transition: all 0.2s ease;
}

.ai-banner-input-group input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
}

.ai-gen-btn {
  white-space: nowrap;
  font-weight: 600;
  padding: 9px 18px;
  font-size: 0.85rem;
}

.ai-quick-suggestions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.quick-title {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.quick-chip {
  padding: 3px 10px;
  font-size: 0.76rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
  font-weight: 500;
}

.quick-chip:hover {
  background: #f5f3ff;
  border-color: #8b5cf6;
  color: #7c3aed;
  transform: translateY(-1px);
}

.adm-btn-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: #fff;
  border: none;
  box-shadow: 0 2px 6px rgba(109, 40, 217, 0.25);
}

.adm-btn-purple:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .rules-grid {
    grid-template-columns: 1fr;
  }
  .training-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
