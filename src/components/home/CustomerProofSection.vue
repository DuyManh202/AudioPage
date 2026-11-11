<template>
  <section class="customer-proof-section" id="cong-trinh-thuc-te">
    <div class="container">
      <div class="proof-header text-center" v-reveal>
        <span class="badge-gold">NGƯỜI THẬT — VIỆC THẬT — QUAY MỘC 100%</span>
        <h2 class="section-title">Khách Hàng Hát Thử Thực Tế Tại Nhà</h2>
        <p class="section-desc">
          Nguyên lý cốt lõi tại Tú Audio: <strong>40% đến từ thiết bị chuẩn — 60% quyết định bởi phối ghép và kỹ thuật cân chỉnh vang số theo phòng khách thực tế.</strong>
        </p>
      </div>

      <div class="proof-layout" v-reveal="80">
        <div class="proof-player-card">
          <div class="video-frame">
            <iframe
              :src="activeEmbedUrl"
              :title="activeCase.title"
              loading="lazy"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
          <div class="active-case-info">
            <div class="case-meta-row">
              <span class="case-location">📍 {{ activeCase.location }}</span>
              <span class="case-config">{{ activeCase.configTag }}</span>
            </div>
            <h3>{{ activeCase.title }}</h3>
            <p>{{ activeCase.summary }}</p>
          </div>
        </div>

        <div class="proof-playlist">
          <div class="playlist-title">Chọn xem công trình thực tế trên kênh YouTube @tuaudio92:</div>
          <button
            v-for="(item, idx) in cases"
            :key="item.videoId"
            type="button"
            :class="['case-item-btn', { active: activeIndex === idx }]"
            @click="activeIndex = idx"
          >
            <span class="case-num">0{{ idx + 1 }}</span>
            <div class="case-copy">
              <strong>{{ item.shortTitle }}</strong>
              <span>{{ item.location }} • {{ item.configTag }}</span>
            </div>
            <span class="play-pill">▶ Xem</span>
          </button>

          <div class="guarantee-banner">
            <div class="g-icon">🛡️</div>
            <div class="g-text">
              <strong>Cam Kết Bảo Toàn Rủi Ro 100%</strong>
              <p>Kỹ sư chở dàn đến lắp đặt &amp; cân chỉnh tại nhà Bác (bán kính 300km). Hát thử không hay hơn quán hoặc không ưng ý: hoàn tiền 100%, vui vẻ chở về không mất 1 đồng phí.</p>
            </div>
          </div>

          <div class="playlist-cta-row">
            <button type="button" class="btn-primary" @click="openQuickConsult">
              📞 Đăng Ký Nghe Thử Tại Nhà
            </button>
            <a :href="CONTACT_INFO.youtubeUrl" target="_blank" rel="noopener noreferrer" class="btn-outline">
              ▶ Xem Kênh YouTube Tú Audio
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCartStore } from '../../stores/cartStore'
import { CONTACT_INFO } from '../../config/contact'

const cartStore = useCartStore()
const activeIndex = ref(0)

const cases = [
  {
    videoId: 'AwEJrll5EPk',
    shortTitle: 'Anh Ngọc (Vĩnh Phúc) — Đổi Cả Bộ Cũ Lên Dàn 29 Triệu',
    title: 'So sánh dàn karaoke gia đình với quán hát — Đổi cả bộ cũ lấy bộ mới cho anh Ngọc ở Vĩnh Phúc',
    location: 'Vĩnh Phúc',
    configTag: 'Combo 29 Triệu + Thu Cũ',
    summary: 'Phòng khách nhiều vách cứng dễ dội âm được cân chỉnh lại dải trung trầm trên vang số K9: tiếng mic nhẹ hơi, đứng gần loa không hú rít.'
  },
  {
    videoId: '9sh3YSPm57I',
    shortTitle: 'Cô Hồng (Phú Thọ) — Lắp Dàn Gia Đình 19,5 Triệu',
    title: 'Dàn Karaoke Gia Đình 19,5 Triệu Hay Như Quán Hát — Lắp tận nhà cô Hồng ở Phú Thọ',
    location: 'Phú Thọ',
    configTag: 'Combo Tiết Kiệm 19 Triệu',
    summary: 'Cấu hình gọn gàng cho phòng khách gia đình dưới 30m², cân bằng giữa nghe nhạc Bolero êm ái và hát karaoke gia đình.'
  },
  {
    videoId: 'wDECLtzYcQI',
    shortTitle: 'Dàn 40 Triệu Hát Nặng Mic — Xử Lý Cân Chỉnh Dứt Điểm',
    title: 'Dàn Karaoke Gia Đình gần 40tr hát vẫn nặng mic — Nâng cấp & cân chỉnh lại khác biệt rõ rệt',
    location: 'Miền Bắc',
    configTag: 'Xử Lý Phối Ghép & Vang Số',
    summary: 'Minh chứng thực tế: loa đắt tiền nhưng phối ghép lệch công suất hoặc chỉnh vang sai vẫn nặng mic; xử lý đúng điểm nghẽn giúp thoát tiếng ngay.'
  },
  {
    videoId: 'hK7F0a_2x-Q',
    shortTitle: 'Kiểm Chứng Độ Bền Sau 5 Năm Sử Dụng Thực Tế',
    title: 'Lắp Dàn Karaoke 5 Năm Rồi Mà Càng Ngày Càng Hay — Kiểm chứng độ bền linh kiện & hậu mãi',
    location: 'Khách hàng thân thiết',
    configTag: 'Độ Bền 5+ Năm',
    summary: 'Thiết bị đồng bộ đủ Headroom công suất giúp côn loa bền bỉ nhiều năm không nhão màng, kèm chế độ hỗ trợ kỹ thuật trọn đời từ Tú Audio.'
  }
]

const activeCase = computed(() => cases[activeIndex.value] || cases[0])
const activeEmbedUrl = computed(() => `https://www.youtube.com/embed/${activeCase.value.videoId}?rel=0`)

const openQuickConsult = () => {
  cartStore.openQuickOrder({
    id: 'tu-van-thu-dan-tai-nha',
    name: 'Đăng ký lắp thử & cân chỉnh dàn karaoke tại nhà',
    price: 29600000
  })
}
</script>

<style scoped>
.customer-proof-section {
  padding: 68px 0;
  background: #EEF3FA;
  border-top: 1px solid #DCE4F0;
  border-bottom: 1px solid #DCE4F0;
}

.proof-header {
  max-width: 780px;
  margin: 0 auto 38px;
}

.text-center {
  text-align: center;
}

.section-title {
  font-size: clamp(1.55rem, 2.8vw, 2.15rem);
  font-weight: 900;
  color: #0F172A;
  margin: 12px 0 10px;
}

.section-desc {
  color: #334155;
  font-size: 0.95rem;
  line-height: 1.65;
}

.section-desc strong {
  color: #1D4ED8;
}

.proof-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}

.proof-player-card {
  background: #FFFFFF;
  border: 1px solid #DCE4F0;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-elevated);
}

.video-frame {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #0F172A;
}

.video-frame iframe {
  width: 100%;
  height: 100%;
}

.active-case-info {
  padding: 20px 22px 24px;
}

.case-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.case-location,
.case-config {
  font-size: 0.76rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 999px;
}

.case-location {
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  color: #1D4ED8;
}

.case-config {
  background: #FEF3C7;
  border: 1px solid #FCD34D;
  color: #92400E;
}

.active-case-info h3 {
  font-size: 1.12rem;
  font-weight: 800;
  color: #0F172A;
  line-height: 1.38;
  margin-bottom: 8px;
}

.active-case-info p {
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.6;
}

.proof-playlist {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.playlist-title {
  font-size: 0.84rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 2px;
}

.case-item-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: #FFFFFF;
  border: 1px solid #DCE4F0;
  color: #0F172A;
  box-shadow: 0 4px 12px -6px rgba(15, 23, 42, 0.06);
  transition: border-color 0.2s, background 0.2s, transform 0.2s;
}

.case-item-btn:hover {
  border-color: #93C5FD;
  background: #F8FAFC;
  transform: translateX(2px);
}

.case-item-btn.active {
  background: linear-gradient(135deg, #FFFBEB, #FFFFFF);
  border: 1.5px solid #F59E0B;
  box-shadow: 0 8px 22px -10px rgba(245, 158, 11, 0.3);
}

.case-num {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 800;
  color: #D97706;
  flex-shrink: 0;
}

.case-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.case-copy strong {
  font-size: 0.88rem;
  color: #0F172A;
  line-height: 1.35;
}

.case-copy span {
  font-size: 0.76rem;
  color: #64748B;
}

.play-pill {
  font-size: 0.74rem;
  font-weight: 800;
  padding: 5px 10px;
  border-radius: 999px;
  background: #F1F5F9;
  color: #334155;
  flex-shrink: 0;
}

.case-item-btn.active .play-pill {
  background: var(--gradient-gold);
  color: #080a10;
}

.guarantee-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #F0FDF4;
  border: 1px solid #86EFAC;
  border-radius: var(--radius-md);
  padding: 14px 16px;
  margin-top: 4px;
}

.g-icon {
  font-size: 1.4rem;
  line-height: 1;
  flex-shrink: 0;
}

.g-text strong {
  display: block;
  font-size: 0.88rem;
  color: #15803D;
  margin-bottom: 4px;
}

.g-text p {
  font-size: 0.8rem;
  color: #166534;
  line-height: 1.5;
}

.playlist-cta-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 4px;
}

@media (max-width: 992px) {
  .proof-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .customer-proof-section {
    padding: 46px 0;
  }

  .active-case-info {
    padding: 16px;
  }

  .playlist-cta-row {
    grid-template-columns: 1fr;
  }
}
</style>
