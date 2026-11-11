<template>
  <div class="combo-list-view">
    <div class="combo-banner-wrap">
      <div class="container combo-header-banner">
        <span class="badge-gold">CẤU HÌNH ĐỒNG BỘ CHUẨN KỸ THUẬT</span>
        <h1>Các Gói Dàn Karaoke Trọn Bộ Chuyên Nghiệp</h1>
        <p>
          Cam kết thiết bị chính hãng, công suất đồng bộ, không hú rít, giao và căn chỉnh trực tiếp tại nhà trong phạm vi 300km.
        </p>
      </div>
    </div>

    <ComboOffers />
  </div>
</template>

<script setup>
import ComboOffers from '../components/home/ComboOffers.vue'
</script>

<style scoped>
.combo-list-view {
  padding-bottom: 60px;
}

.combo-banner-wrap {
  background: radial-gradient(ellipse 70% 80% at 50% 0%, rgba(40, 55, 252, 0.16), transparent 70%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.combo-header-banner {
  padding: 46px 24px 32px;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.combo-header-banner h1 {
  font-size: clamp(1.7rem, 3.2vw, 2.4rem);
  font-weight: 900;
  color: #fff;
  margin: 14px 0 10px;
  line-height: 1.25;
}

.combo-header-banner p {
  font-size: 1rem;
  color: var(--text-muted);
  line-height: 1.6;
}

@media (max-width: 640px) {
  .combo-list-view {
    padding-bottom: 36px;
  }

  .combo-header-banner {
    padding: 28px 16px 22px;
  }
}
</style>
