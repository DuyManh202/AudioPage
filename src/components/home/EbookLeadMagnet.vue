<template>
  <section class="ebook-section" id="nhan-ebook">
    <div class="container">
      <div class="ebook-box">
        <div class="ebook-visual">
          <div class="book-cover">
            <span class="book-brand">TÚ AUDIO</span>
            <h3>BÍ MẬT ÂM THANH KARAOKE</h3>
            <p class="book-sub">Cẩm Nang Chống Mua Hớ & Phối Ghép Chuẩn Phòng Hát</p>
            <span class="book-free-tag">MIỄN PHÍ 100%</span>
          </div>
        </div>

        <div class="ebook-content">
          <span class="badge-gold">QUÀ TẶNG KIẾN THỨC TOÀN QUỐC</span>
          <h2>Đừng Chi Tiền Oan Trước Khi Đọc Cuốn Ebook Này!</h2>
          <p class="ebook-desc">
            Tổng hợp kinh nghiệm thực chiến 10 năm cân chỉnh hàng nghìn phòng hát gia đình của kỹ sư Phùng Văn Tú. Dù Bác chưa mua dàn hay đã có dàn bị hú rít, cuốn sách này sẽ giúp Bác tự kiểm định chất âm.
          </p>

          <ul class="ebook-lessons">
            <li>✓ Công thức tính công suất Đẩy - Loa để đánh 10 năm không cháy treble</li>
            <li>✓ 5 mẹo kê loa và xử lý vang số trị dứt điểm tiếng hú rít phòng khách</li>
            <li>✓ Cách phân biệt hàng bãi thật, hàng mới chuẩn và hàng nhái kém chất lượng</li>
          </ul>

          <div v-if="isSent" class="ebook-success">
            <h4>🎉 Đã Gửi Link Tải Ebook Thành Công!</h4>
            <p>Bản PDF đã được mở khóa. Kỹ sư Tú Audio cũng đã ghi nhận số Zalo của Bác để gửi kèm video hướng dẫn thực tế.</p>
            <button class="btn-primary" @click="downloadEbookSummary">
              📥 Tải Xuống Ngay (Tài Liệu Tóm Tắt PDF/TXT)
            </button>
          </div>

          <form v-else @submit.prevent="handleGetEbook" class="ebook-form">
            <input 
              type="text" 
              v-model="form.name" 
              placeholder="Tên của Bác (Ví dụ: Bác Hùng)..." 
              required 
            />
            <input 
              type="tel" 
              v-model="form.phone" 
              placeholder="Số Zalo nhận sách..." 
              required 
            />
            <button type="submit" class="btn-primary" :disabled="isSending">
              {{ isSending ? '⏳ Đang Gửi...' : 'Nhận Ebook Miễn Phí Ngay' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useAdminStore } from '../../stores/adminStore'

const adminStore = useAdminStore()
const form = ref({ name: '', phone: '' })
const isSending = ref(false)
const isSent = ref(false)

const handleGetEbook = async () => {
  if (!form.value.name || !form.value.phone) return
  isSending.value = true

  await adminStore.addNewLead({
    name: form.value.name,
    phone: form.value.phone,
    address: 'Toàn quốc (Online)',
    interest: 'Nhận Ebook PDF "Bí Mật Âm Thanh Karaoke"',
    note: 'Khách đăng ký nhận tài liệu mồi Ebook miễn phí từ trang chủ.',
    price: 0
  })

  isSending.value = false
  isSent.value = true
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
  padding: 60px 0;
  background: var(--bg-dark-900);
}

.ebook-box {
  background: linear-gradient(135deg, #161a2c, #0f121e);
  border: 1px solid rgba(252, 183, 40, 0.35);
  border-radius: var(--radius-lg);
  padding: 40px;
  display: grid;
  grid-template-columns: 0.75fr 1.5fr;
  gap: 40px;
  align-items: center;
}

.book-cover {
  background: linear-gradient(145deg, #2837FC, #111538);
  border: 2px solid var(--color-primary);
  border-radius: 10px 16px 16px 10px;
  padding: 36px 24px;
  text-align: center;
  box-shadow: -10px 12px 28px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
}

.book-brand {
  font-size: 0.85rem;
  font-weight: 900;
  color: var(--color-primary);
  letter-spacing: 2px;
}

.book-cover h3 {
  font-size: 1.5rem;
  font-weight: 900;
  color: #fff;
  line-height: 1.3;
}

.book-sub {
  font-size: 0.85rem;
  color: #cbd5e1;
}

.book-free-tag {
  background: var(--color-primary);
  color: #000;
  font-weight: 900;
  font-size: 0.8rem;
  padding: 5px 12px;
  border-radius: 20px;
  align-self: center;
}

.ebook-content h2 {
  font-size: 1.75rem;
  color: #fff;
  margin: 10px 0 12px;
}

.ebook-desc {
  font-size: 0.92rem;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 16px;
}

.ebook-lessons {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.88rem;
  color: #cbd5e1;
  margin-bottom: 24px;
}

.ebook-form {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.ebook-form input {
  flex: 1;
  min-width: 180px;
  padding: 11px 14px;
  background: var(--bg-dark-900);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 0.9rem;
  outline: none;
}

.ebook-form input:focus {
  border-color: var(--color-primary);
}

.ebook-success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  padding: 18px;
  border-radius: var(--radius-md);
}

.ebook-success h4 {
  color: #4ade80;
  margin-bottom: 6px;
}

.ebook-success p {
  font-size: 0.85rem;
  color: #cbd5e1;
  margin-bottom: 12px;
}

@media (max-width: 850px) {
  .ebook-box {
    grid-template-columns: 1fr;
  }
}
</style>
