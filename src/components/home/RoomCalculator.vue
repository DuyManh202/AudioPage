<template>
  <section class="calculator-section" id="room-calculator">
    <div class="container">
      <div class="calc-box" v-reveal>
        <div class="calc-header text-center">
          <span class="badge-blue">CÔNG CỤ ĐO ÂM HỌC NHANH</span>
          <h2>Dự Đoán Công Suất &amp; Chọn Loa Theo Không Gian Phòng</h2>
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
                type="button"
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
                type="button"
                :class="['chip-btn', { active: selectedType === roomType.value }]"
                @click="selectedType = roomType.value"
              >
                {{ roomType.label }}
              </button>
            </div>
          </div>
        </div>

        <Transition name="fade-slide" mode="out-in">
          <div class="calc-result" :key="`${selectedSize}-${selectedType}`">
            <div class="result-top-bar">
              <div class="result-badge">
                <span class="eq-bars" aria-hidden="true">
                  <span></span><span></span><span></span><span></span>
                </span>
                Khuyến Nghị Chuyên Gia Tú Audio
              </div>
              <div class="headroom-meter">
                <span class="meter-label">Ngưỡng công suất đề xuất: {{ headroomLevel }}%</span>
                <div class="meter-track">
                  <div class="meter-fill" :style="{ width: `${headroomLevel}%` }"></div>
                </div>
              </div>
            </div>

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
              <button class="btn-primary" type="button" @click="handleConsult">
                Tư Vấn Đúng Cấu Hình Này Cho Tôi
              </button>
            </div>
          </div>
        </Transition>
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

const headroomLevel = computed(() => {
  if (selectedSize.value === 'small') return selectedType.value === 'open' ? 62 : 52
  if (selectedSize.value === 'medium') return selectedType.value === 'open' ? 80 : 72
  return selectedType.value === 'open' ? 98 : 90
})

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
  const sizeLabel = roomSizes.find(s => s.value === selectedSize.value)?.label || selectedSize.value
  const typeLabel = roomTypes.find(t => t.value === selectedType.value)?.label || selectedType.value
  cartStore.openQuickOrder({
    name: `Tư vấn cấu hình phòng ${sizeLabel} — ${typeLabel} (${recommendation.value.bestPackage})`
  })
}
</script>

<style scoped>
.calculator-section {
  padding: 68px 0;
  background: linear-gradient(180deg, #EAF1FB 0%, #F4F7FB 100%);
  border-top: 1px solid #DCE4F0;
  border-bottom: 1px solid #DCE4F0;
}

.calc-box {
  background: #FFFFFF;
  border: 1.5px solid #BFDBFE;
  border-radius: var(--radius-xl);
  padding: 38px;
  box-shadow: var(--shadow-elevated);
}

.text-center {
  text-align: center;
}

.calc-header {
  max-width: 680px;
  margin: 0 auto 30px;
}

.calc-header h2 {
  font-size: clamp(1.5rem, 2.8vw, 2rem);
  font-weight: 900;
  color: #0F172A;
  margin: 12px 0 8px;
}

.calc-header p {
  color: #475569;
  font-size: 0.94rem;
}

.calc-controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-bottom: 28px;
}

.control-group {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: var(--radius-lg);
  padding: 18px;
}

.control-group label {
  display: block;
  font-size: 0.88rem;
  font-weight: 800;
  color: #0F172A;
  margin-bottom: 12px;
}

.option-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-btn {
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  color: #334155;
  font-size: 0.84rem;
  font-weight: 600;
  padding: 9px 15px;
  border-radius: 11px;
  transition: all 0.24s var(--ease-spring);
}

.chip-btn:hover {
  border-color: #2563EB;
  color: #1D4ED8;
  transform: translateY(-2px);
}

.chip-btn:active {
  transform: scale(0.97);
}

.chip-btn.active {
  background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
  border-color: #2563EB;
  color: #1D4ED8;
  font-weight: 800;
  box-shadow: 0 6px 18px -6px rgba(37, 99, 235, 0.28);
}

.calc-result {
  background: #F8FAFC;
  border: 1.5px solid #F59E0B;
  border-radius: var(--radius-lg);
  padding: 24px;
}

.result-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 18px;
}

.result-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #FEF3C7;
  border: 1px solid #FCD34D;
  color: #92400E;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 5px 12px;
  border-radius: 999px;
}

.headroom-meter {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 240px;
}

.meter-label {
  font-size: 0.75rem;
  color: #475569;
  font-weight: 600;
  white-space: nowrap;
}

.meter-track {
  flex: 1;
  min-width: 90px;
  height: 7px;
  border-radius: 999px;
  background: #E2E8F0;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #2563EB 0%, #F59E0B 70%, #EA580C 100%);
  transition: width 0.45s var(--ease-spring);
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}

.result-item {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: var(--radius-md);
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  box-shadow: 0 4px 12px -6px rgba(15, 23, 42, 0.06);
}

.res-label {
  font-size: 0.76rem;
  font-weight: 700;
  color: #64748B;
  text-transform: uppercase;
}

.res-val {
  font-size: 1rem;
  font-weight: 800;
  color: #0F172A;
}

.res-val.highlight {
  color: #1D4ED8;
}

.res-sub {
  font-size: 0.79rem;
  color: #475569;
  line-height: 1.45;
}

.recommend-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  padding-top: 16px;
  border-top: 1px solid #E2E8F0;
}

.best-match-text {
  font-size: 0.94rem;
  color: #334155;
}

.best-match-text strong {
  color: #DC2626;
}

@media (max-width: 860px) {
  .calc-controls,
  .result-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .calculator-section {
    padding: 44px 0;
  }

  .calc-box {
    padding: 22px 16px;
  }

  .calc-result {
    padding: 18px 14px;
  }

  .headroom-meter {
    width: 100%;
    min-width: 0;
  }

  .chip-btn {
    flex: 1 1 auto;
    min-height: 40px;
  }

  .recommend-action {
    flex-direction: column;
    align-items: stretch;
  }

  .recommend-action .btn-primary {
    width: 100%;
  }
}
</style>
