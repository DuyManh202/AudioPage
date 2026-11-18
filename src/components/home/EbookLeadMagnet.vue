<template>
  <section class="ebook-section" id="nhan-ebook">
    <div class="container">
      <div class="ebook-box" v-reveal>
        <div class="ebook-visual">
          <div class="book-stage">
            <div class="book-glow" aria-hidden="true"></div>
            <div class="book-cover">
              <div class="book-spine" aria-hidden="true"></div>
              <span class="book-brand">TÚ AUDIO</span>
              <h3>BÍ MẬT ÂM THANH KARAOKE</h3>
              <p class="book-sub">Cẩm Nang Chống Mua Hớ &amp; Phối Ghép Chuẩn Phòng Hát</p>
              <span class="book-free-tag">MIỄN PHÍ 100%</span>
            </div>
          </div>
        </div>

        <div class="ebook-content">
          <span class="badge-gold">QUÀ TẶNG KIẾN THỨC TOÀN QUỐC</span>
          <h2>Đừng Chi Tiền Oan Trước Khi Đọc Cuốn Ebook Này!</h2>
          <p class="ebook-desc">
            Tổng hợp kinh nghiệm thực chiến 10 năm cân chỉnh hàng nghìn phòng hát gia đình của kỹ sư Phùng Văn Tú. Dù Bác chưa mua dàn hay đã có dàn bị hú rít, cuốn sách này sẽ giúp Bác tự kiểm định chất âm.
          </p>

          <ul class="ebook-lessons">
            <li><span class="check">✓</span> Công thức tính công suất Đẩy - Loa để đánh 10 năm không cháy treble</li>
            <li><span class="check">✓</span> 5 mẹo kê loa và xử lý vang số trị dứt điểm tiếng hú rít phòng khách</li>
            <li><span class="check">✓</span> Cách phân biệt hàng bãi thật, hàng mới chuẩn và hàng nhái kém chất lượng</li>
          </ul>

          <div v-if="isSent" class="ebook-success">
            <h4>{{ savedLocally ? '📄 Đã Mở Bản Tóm Tắt (Chế Độ Ngoại Tuyến)' : '🎉 Tài Liệu Tóm Tắt Đã Sẵn Sàng!' }}</h4>
            <p v-if="savedLocally">
              Máy chủ đang bận nên thông tin của Bác mới lưu tạm trên trình duyệt này. Bác có thể tải bản tóm tắt bên dưới; để nhận tài liệu PDF đầy đủ, hãy nhắn Zalo cho Tú Audio.
            </p>
            <p v-else>
              Bác có thể tải bản tóm tắt ngay bên dưới. Muốn nhận tài liệu PDF đầy đủ, hãy nhắn Zalo cho Tú Audio.
            </p>
            <div class="ebook-success-actions">
              <button class="btn-primary" type="button" @click="downloadEbookSummary">
                📥 Tải Bản Tóm Tắt Ngay (TXT)
              </button>
              <a :href="CONTACT_INFO.zaloUrl" target="_blank" rel="noopener noreferrer" class="btn-outline">
                💬 Nhắn Zalo Nhận Bản Đầy Đủ
              </a>
            </div>
          </div>

          <form v-else @submit.prevent="handleGetEbook" class="ebook-form-wrap">
            <p v-if="submitError" class="ebook-error" role="alert">{{ submitError }}</p>
            <div class="ebook-form">
              <input
                type="text"
                v-model="form.name"
                placeholder="Tên của Bác (Ví dụ: Bác Hùng)..."
                required
              />
              <input
                type="tel"
                v-model="form.phone"
                placeholder="Số Zalo nhận sách (10 số)..."
                required
              />
              <button type="submit" class="btn-primary" :disabled="isSending">
                {{ isSending ? '⏳ Đang Gửi...' : 'Nhận Ebook Miễn Phí Ngay' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import { CONTACT_INFO } from '../../config/contact'

const adminStore = useAdminStore()
const form = ref({ name: '', phone: '' })
const isSending = ref(false)
const isSent = ref(false)
const savedLocally = ref(false)
const submitError = ref('')

const handleGetEbook = async () => {
  const cleanName = form.value.name.trim()
  const cleanPhone = form.value.phone.trim()
  if (!cleanName || !cleanPhone || isSending.value) return
  if (!/^\+?[0-9][0-9\s().-]{7,19}$/.test(cleanPhone)) {
    submitError.value = 'Vui lòng nhập đúng số điện thoại Zalo (từ 9 - 11 chữ số).'
    return
  }

  isSending.value = true
  submitError.value = ''

  try {
    const res = await adminStore.addNewLead({
      name: cleanName,
      phone: cleanPhone,
      address: 'Toàn quốc (Online)',
      interest: 'Nhận Ebook PDF "Bí Mật Âm Thanh Karaoke"',
      note: 'Khách đăng ký nhận tài liệu mồi Ebook miễn phí từ trang chủ.',
      price: 0
    })
    savedLocally.value = Boolean(res?.localOnly)
    isSent.value = true
  } catch (err) {
    submitError.value = err.message || 'Không gửi được thông tin lúc này. Bác vui lòng kiểm tra lại số điện thoại.'
  } finally {
    isSending.value = false
  }
}

const downloadEbookSummary = () => {
  const content = `CẨM NANG TÓM TẮT: BÍ MẬT ÂM THANH KARAOKE - TÚ AUDIO\n\n` +
    `1. Phối ghép công suất\n` +
    `Chọn cục đẩy có công suất phù hợp với loa và trở kháng thực tế. Tránh để đẩy quá yếu phải hoạt động liên tục ở mức lớn vì tín hiệu méo có thể làm hỏng loa treble. Hãy đối chiếu công suất RMS, trở kháng và khuyến nghị của nhà sản xuất trước khi ghép.\n\n` +
    `2. Chọn cấu hình theo phòng\n` +
    `- Phòng nhỏ dưới 20m²: thường cân nhắc loa bass 25-30cm; chỉ thêm sub khi nhu cầu nghe cần dải trầm sâu hơn.\n` +
    `- Phòng 20-35m²: loa bass 30cm là cấu hình phổ biến; phòng thông tầng hoặc thông bếp cần được khảo sát kỹ hơn.\n` +
    `- Phòng lớn trên 35m²: cần tính cả thể tích và độ mở của không gian, vị trí đặt loa và mức âm lượng mong muốn.\n\n` +
    `3. Hạn chế hú rít\n` +
    `Không hướng micro vào mặt loa; tăng âm lượng từ từ; đặt loa và micro cách nhau hợp lý. Cân chỉnh vang số để xử lý các tần số cộng hưởng vừa đủ, tránh cắt quá mạnh làm giọng hát mỏng và thiếu tự nhiên.\n\n` +
    `Đây là tài liệu tham khảo ban đầu. Cấu hình phù hợp còn tùy diện tích, kết cấu phòng và thiết bị đang có.\n` +
    `Liên hệ Tú Audio qua Zalo ${CONTACT_INFO.phoneDisplay} để được tư vấn và khảo sát cấu hình.`

  const blob = new Blob(['\uFEFF', content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'Bi-Mat-Am-Thanh-Karaoke-TuAudio.txt'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.ebook-section {
  padding: 68px 0;
  background: var(--bg-page);
}

.ebook-box {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1.5px solid #fcd34d;
  border-radius: var(--radius-xl);
  padding: 44px;
  display: grid;
  grid-template-columns: minmax(0, 0.78fr) minmax(0, 1.45fr);
  gap: 44px;
  align-items: center;
  box-shadow: var(--shadow-elevated);
}

.book-stage {
  position: relative;
  display: flex;
  justify-content: center;
  perspective: 1000px;
}

.book-glow {
  position: absolute;
  inset: 10%;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.22), rgba(245, 158, 11, 0.14), transparent 72%);
  filter: blur(28px);
}

.book-cover {
  position: relative;
  width: 100%;
  max-width: 270px;
  background: linear-gradient(155deg, #2563eb 0%, #1e3a8a 62%, #172554 100%);
  border: 2px solid #f59e0b;
  border-radius: 8px 18px 18px 8px;
  padding: 40px 26px 34px 32px;
  text-align: center;
  box-shadow: -14px 18px 34px rgba(15, 23, 42, 0.24), 0 0 24px rgba(37, 99, 235, 0.16);
  display: flex;
  flex-direction: column;
  gap: 14px;
  transform: rotateY(-10deg) rotateX(2deg);
  transition: transform 0.45s var(--ease-spring), box-shadow 0.45s;
}

.ebook-box:hover .book-cover {
  transform: rotateY(-2deg) rotateX(0deg) translateY(-4px);
  box-shadow: -8px 22px 40px rgba(15, 23, 42, 0.28), 0 0 30px rgba(245, 158, 11, 0.2);
}

.book-spine {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 10px;
  width: 2px;
  background: linear-gradient(180deg, rgba(252, 211, 77, 0.85), rgba(255, 255, 255, 0.35), rgba(252, 211, 77, 0.85));
}

.book-brand {
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: #fde047;
}

.book-cover h3 {
  font-size: 1.45rem;
  font-weight: 900;
  line-height: 1.25;
  color: #fff;
}

.book-sub {
  font-size: 0.8rem;
  color: #dbeafe;
  line-height: 1.45;
}

.book-free-tag {
  align-self: center;
  background: var(--gradient-gold);
  color: #080a10;
  font-size: 0.74rem;
  font-weight: 900;
  padding: 5px 14px;
  border-radius: 999px;
  margin-top: 4px;
}

.ebook-content h2 {
  font-size: clamp(1.5rem, 2.8vw, 2rem);
  font-weight: 900;
  color: #0f172a;
  margin: 12px 0 10px;
}

.ebook-desc {
  color: #334155;
  font-size: 0.94rem;
  line-height: 1.65;
  margin-bottom: 18px;
}

.ebook-lessons {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-bottom: 24px;
  font-size: 0.88rem;
  color: #1e293b;
}

.ebook-lessons li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.ebook-lessons .check {
  color: #16a34a;
  font-weight: 900;
}

.ebook-form-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ebook-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.83rem;
}

.ebook-success-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ebook-form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px;
}

.ebook-form input {
  min-width: 0;
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-md);
  color: #0f172a;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.ebook-form input:focus {
  background: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
}

.ebook-success {
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: var(--radius-md);
  padding: 18px;
}

.ebook-success h4 {
  color: #15803d;
  margin-bottom: 6px;
}

.ebook-success p {
  font-size: 0.88rem;
  color: #166534;
  margin-bottom: 14px;
}

@media (max-width: 960px) {
  .ebook-box {
    grid-template-columns: 1fr;
    gap: 28px;
    padding: 28px 20px;
  }

  .book-cover {
    transform: none;
  }

  .ebook-form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .ebook-section {
    padding: 44px 0;
  }

  .ebook-form input {
    min-height: 44px;
    font-size: 16px;
  }
}
</style>
