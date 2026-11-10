<template>
  <section class="calculator-section" id="room-calculator">
    <div class="container">
      <div class="calc-box">
        <div class="calc-header text-center">
          <span class="badge-blue">CÔNG CỤ ĐO ÂM HỌC NHANH</span>
          <h2>Dự Đoán Công Suất & Chọn Loa Theo Không Gian Phòng</h2>
          <p>
            Chọn đúng loa theo diện tích phòng giúp tiếng bass không bị ù rền, tiếng hát thoát và không bao giờ bị đuối công suất.
          </p>
        </div>

        <div class="calc-controls">
          <div class="control-group">
            <label>1. Diện Tích Phòng Khách Của Bác:</label>
            <div class="option-chips">
              <button 
                v-for="size in roomSizes" 
                :key="size.value"
                :class="['chip-btn', { active: selectedSize === size.value }]"
                @click="selectedSize = size.value"
              >
                {{ size.label }}
              </button>
            </div>
          </div>

          <div class="control-group">
            <label>2. Đặc Điểm Không Gian Phòng:</label>
            <div class="option-chips">
              <button 
                v-for="roomType in roomTypes" 
                :key="roomType.value"
                :class="['chip-btn', { active: selectedType === roomType.value }]"
                @click="selectedType = roomType.value"
              >
                {{ roomType.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Kết Quả Tính Toán -->
        <div class="calc-result">
          <div class="result-badge">Khuyến Nghị Chuyên Gia Tú Audio</div>
          <div class="result-grid">
            <div class="result-item">
              <span class="res-label">Đường Kính Bass Loa:</span>
              <span class="res-val highlight">{{ recommendation.bass }}</span>
              <span class="res-sub">{{ recommendation.bassNote }}</span>
            </div>
            <div class="result-item">
              <span class="res-label">Công Suất Cục Đẩy:</span>
              <span class="res-val">{{ recommendation.amplifier }}</span>
              <span class="res-sub">{{ recommendation.ampNote }}</span>
            </div>
            <div class="result-item">
              <span class="res-label">Loa Subwoofer Trầm:</span>
              <span class="res-val">{{ recommendation.sub }}</span>
              <span class="res-sub">{{ recommendation.subNote }}</span>
            </div>
          </div>

          <div class="recommend-action">
            <div class="best-match-text">
              Gợi ý phù hợp: <strong>{{ recommendation.bestPackage }}</strong>
            </div>
            <button class="btn-primary" @click="handleConsult">
              Tư Vấn Đúng Cấu Hình Này Cho Tôi
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCartStore } from '../../stores/cartStore'

const cartStore = useCartStore()

const roomSizes = [
  { label: 'Dưới 20m² (Nhỏ/Chung cư)', value: 'small' },
  { label: '20 - 35m² (Phòng khách phổ thông)', value: 'medium' },
  { label: '35 - 55m² (Phòng rộng/Biệt thự)', value: 'large' }
]

const roomTypes = [
  { label: 'Phòng kín khép kín', value: 'closed' },
  { label: 'Phòng thông phòng ăn / Cầu thang hở', value: 'open' }
]

const selectedSize = ref('medium')
const selectedType = ref('open')

const recommendation = computed(() => {
  if (selectedSize.value === 'small') {
    return {
      bass: 'Bass 25cm hoặc Bass 30cm công suất vừa',
      bassNote: 'Không nên chọn bass quá to tránh áp lực dồn phòng làm tức ngực',
      amplifier: '600W / Kênh (Đẩy 2 Kênh)',
      ampNote: 'Đủ kéo căng đôi loa mà không nóng máy',
      sub: 'Sub điện 30cm (như PF S12)',
      subNote: 'Tiếng trầm êm dịu, không rền sang phòng khác',
      bestPackage: 'Gói Dàn Karaoke 19 Triệu (hoặc Loa Full 25)'
    }
  } else if (selectedSize.value === 'medium') {
    if (selectedType.value === 'open') {
      return {
        bass: 'Bass 30cm Coil 75 (Loa Full 30 PF 12)',
        bassNote: 'Dải trung sáng, phóng xa bù vào khoảng không cầu thang hở',
        amplifier: '800W / Kênh (Đẩy 4 Kênh)',
        ampNote: '2 kênh đánh loa full 30, 2 kênh kéo sub hơi',
        sub: 'Sub hơi 40cm (PF S15)',
        subNote: 'Tiếng bass chắc nịch, không bị loãng tiếng',
        bestPackage: 'Gói Dàn Karaoke 29 Triệu Chuẩn Quán'
      }
    } else {
      return {
        bass: 'Bass 30cm (Loa Full 30 PF 12)',
        bassNote: 'Phủ đều âm thanh khắp phòng',
        amplifier: '600W - 800W / Kênh',
        ampNote: 'Độ méo tiếng < 0.05%',
        sub: 'Sub điện 30 hoặc Sub hơi 40',
        subNote: 'Tùy mức độ thích bass mạnh hay nhẹ',
        bestPackage: 'Gói Dàn Karaoke 19 Triệu hoặc 29 Triệu'
      }
    }
  } else {
    return {
      bass: '2 Đôi Loa Full 30 hoặc Loa Bass 40cm',
      bassNote: 'Không gian rộng cần 4 loa để phủ đều dải âm',
      amplifier: 'Đẩy 4 kênh ≥ 1000W / Kênh',
      ampNote: 'Đảm bảo headroom dự trữ dồi dào',
      sub: 'Sub hơi 50cm hoặc 2 Sub hơi 40',
      subNote: 'Dải trầm xuống sâu 25Hz - 30Hz',
      bestPackage: 'Cấu hình Dàn Karaoke Thiết Kế Riêng Theo Diện Tích'
    }
  }
})

const handleConsult = () => {
  cartStore.openQuickOrder({
    name: `Tư vấn cấu hình phòng ${selectedSize.value} - ${selectedType.value} (${recommendation.value.bestPackage})`
  })
}
</script>

<style scoped>
.calculator-section {
  padding: 60px 0;
  background: var(--bg-dark-800);
}

.calc-box {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 40px;
  max-width: 960px;
  margin: 0 auto;
}

.calc-header {
  margin-bottom: 32px;
}

.calc-header h2 {
  font-size: 1.8rem;
  color: #fff;
  margin: 10px 0;
}

.calc-header p {
  font-size: 0.92rem;
  color: #94a3b8;
  max-width: 650px;
  margin: 0 auto;
}

.calc-controls {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
}

.control-group label {
  display: block;
  font-size: 0.95rem;
  font-weight: 700;
  color: #cbd5e1;
  margin-bottom: 12px;
}

.option-chips {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.chip-btn {
  background: var(--bg-dark-900);
  border: 1px solid var(--border-color);
  color: #94a3b8;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  font-weight: 600;
  transition: all 0.2s;
}

.chip-btn:hover {
  border-color: var(--color-primary);
  color: #fff;
}

.chip-btn.active {
  background: rgba(252, 183, 40, 0.15);
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 700;
}

.calc-result {
  background: rgba(13, 15, 24, 0.9);
  border: 1px dashed rgba(252, 183, 40, 0.4);
  border-radius: var(--radius-md);
  padding: 28px;
  position: relative;
}

.result-badge {
  position: absolute;
  top: -12px;
  left: 20px;
  background: var(--color-primary);
  color: #000;
  font-size: 0.72rem;
  font-weight: 900;
  padding: 3px 10px;
  border-radius: 4px;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.res-label {
  font-size: 0.8rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
}

.res-val {
  font-size: 1.05rem;
  font-weight: 800;
  color: #fff;
}

.res-val.highlight {
  color: var(--color-primary);
}

.res-sub {
  font-size: 0.78rem;
  color: #94a3b8;
  line-height: 1.4;
}

.recommend-action {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.best-match-text {
  font-size: 1rem;
  color: #e2e8f0;
}

.best-match-text strong {
  color: var(--color-primary);
}

@media (max-width: 800px) {
  .result-grid {
    grid-template-columns: 1fr;
  }
}
</style>
