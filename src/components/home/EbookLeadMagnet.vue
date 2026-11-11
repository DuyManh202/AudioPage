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
            <h4>{{ savedLocally ? '📄 Đã Mở Khóa Bản Tóm Tắt (Chế Độ Ngoại Tuyến)' : '🎉 Đã Mở Khóa Link Tải Ebook Thành Công!' }}</h4>
            <p v-if="savedLocally">
              Máy chủ đang bận nên số Zalo của Bác mới lưu tạm trên trình duyệt này. Bác có thể tải ngay bản tóm tắt bên dưới hoặc nhắn Zalo <strong>{{ CONTACT_INFO.phone }}</strong> để nhận bản PDF đầy đủ.
            </p>
            <p v-else>
              Bản tóm tắt đã được mở khóa. Kỹ sư Tú Audio cũng đã ghi nhận số Zalo của Bác để gửi kèm trọn bộ PDF &amp; video hướng dẫn thực tế.
            </p>
            <div class="ebook-success-actions">
              <button class="btn-primary" type="button" @click="downloadEbookSummary">
                📥 Tải Xuống Ngay (Tài Liệu Tóm Tắt TXT)
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
  const content = `CAM NANG: BI MAT AM THANH KARAOKE - TU AUDIO\n\n` +
    `1. Nguyen tac phoi ghep cong suat: Cong suat Cuc Day nen bang 1.5 den 2 lan cong suat RMS cua Loa de khong bao gio bi meo tieng hay chay treble.\n` +
    `2. Chon bass theo dien tich phong:\n` +
    `   - Phong < 20m2: Bass 25cm + Sub dien 30cm.\n` +
    `   - Phong 20 - 35m2: Loa Full Bass 30cm coil 75 + Sub hoi 40cm.\n` +
    `3. Tri hu rit hieu qua: Khong chia thang micro vao mat luoi loa, cat tan so cong huong phong bang Vang so DSP.\n\n` +
    `Lien he ky su Phung Van Tu (Tu Audio - Vinh Yen, Phu Tho) de duoc ho tro can chinh tu xa hoac thu dan tai nha trong ban kinh 300km.`

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
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
  background: var(--bg-dark-900);
}

.ebook-box {
  background: linear-gradient(135deg, rgba(25, 31, 52, 0.94), rgba(14, 17, 29, 0.98));
  border: 1px solid rgba(252, 183, 40, 0.36);
  border-radius: var(--radius-xl);
  padding: 44px;
  display: grid;
  grid-template-columns: minmax(0, 0.78fr) minmax(0, 1.45fr);
  gap: 44px;
  align-items: center;
  box-shadow: var(--shadow-elevated), var(--inner-highlight);
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
  background: radial-gradient(circle, rgba(40, 55, 252, 0.45), rgba(252, 183, 40, 0.16), transparent 72%);
  filter: blur(28px);
}

.book-cover {
  position: relative;
  width: 100%;
  max-width: 270px;
  background: linear-gradient(155deg, #2b3bff 0%, #161d56 58%, #0d1130 100%);
  border: 2px solid var(--color-primary);
  border-radius: 8px 18px 18px 8px;
  padding: 40px 26px 34px 32px;
  text-align: center;
  box-shadow: -16px 20px 36px rgba(0, 0, 0, 0.72), 0 0 28px rgba(40, 55, 252, 0.3);
  display: flex;
  flex-direction: column;
  gap: 14px;
  transform: rotateY(-10deg) rotateX(2deg);
  transition: transform 0.45s var(--ease-spring), box-shadow 0.45s;
}

.ebook-box:hover .book-cover {
  transform: rotateY(-2deg) rotateX(0deg) translateY(-4px);
  box-shadow: -8px 24px 44px rgba(0, 0, 0, 0.8), 0 0 38px rgba(252, 183, 40, 0.25);
}

.book-spine {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 10px;
  width: 2px;
  background: linear-gradient(180deg, rgba(252, 183, 40, 0.8), rgba(255, 255, 255, 0.25), rgba(252, 183, 40, 0.8));
}

.book-brand {
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: var(--color-primary);
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
  color: #fff;
  margin: 12px 0 10px;
}

.ebook-desc {
  color: var(--text-secondary);
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
  color: #e2e8f0;
}

.ebook-lessons li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.ebook-lessons .check {
  color: var(--color-primary);
  font-weight: 900;
}

.ebook-form-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ebook-error {
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.36);
  color: #fca5a5;
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
  background: var(--bg-dark-900);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-md);
  color: #fff;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.ebook-form input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(252, 183, 40, 0.14);
}

.ebook-success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.35);
  border-radius: var(--radius-md);
  padding: 18px;
}

.ebook-success h4 {
  color: #4ade80;
  margin-bottom: 6px;
}

.ebook-success p {
  font-size: 0.88rem;
  color: #cbd5e1;
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
