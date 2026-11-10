<template>
  <div class="combo-list-view">
    <div class="container combo-header-banner">
      <span class="badge-gold">CẤU HÌNH ĐỒNG BỘ CHUẨN KỸ THUẬT</span>
      <h1>Các Gói Dàn Karaoke Trọn Bộ Chuyên Nghiệp</h1>
      <p>
        Cam kết thiết bị chính hãng, công suất đồng bộ, không hú rít, giao và căn chỉnh trực tiếp tại nhà trong phạm vi 300km.
      </p>
    </div>

    <ComboOffers />
  </div>
</template>

<script setup>
import ComboOffers from '../components/home/ComboOffers.vue'
</script>

<style scoped>
.combo-list-view {
  padding-bottom: 80px;
}

.combo-header-banner {
  padding: 40px 20px 10px;
  text-align: center;
  max-width: 780px;
  margin: 0 auto;
}

.combo-header-banner h1 {
  font-size: 2.2rem;
  font-weight: 900;
  color: #fff;
  margin: 12px 0 10px;
}

.combo-header-banner p {
  font-size: 1rem;
  color: #94a3b8;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .combo-list-view {
    padding-bottom: 48px;
  }

  .combo-header-banner {
    padding: 28px 12px 8px;
  }

  .combo-header-banner h1 {
    font-size: clamp(1.6rem, 7vw, 2rem);
    line-height: 1.25;
  }
}
</style>
