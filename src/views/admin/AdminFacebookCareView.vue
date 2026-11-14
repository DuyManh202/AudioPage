<template>
  <div class="adm-page fb-care">
    <div class="adm-page-head">
      <div><h1 class="adm-page-title">Chăm sóc khách từ Facebook</h1><p class="adm-page-sub">Gom khách quan tâm, ghi lịch sử tư vấn và nhắc đội ngũ theo sát đến khi chốt đơn.</p></div>
      <button class="adm-btn adm-btn-gold" @click="showCreate = !showCreate">＋ Thêm khách Facebook</button>
    </div>

    <div :class="['connection', { online: messengerConnected }]"><span class="offline-dot"></span><div><strong>{{ messengerConnected ? 'Facebook Messenger đã cấu hình · Tự động đồng bộ' : 'Inbox Facebook chưa kết nối' }}</strong><small>{{ messengerConnected ? `Hội thoại từ Fanpage tự động đồng bộ mỗi 10 giây${lastSyncedAt ? ' · Cập nhật lúc ' + displayTime(lastSyncedAt) : ''}.` : 'Cấu hình Meta Page/API trên backend để đồng bộ inbox và gửi trả lời.' }}</small><small v-if="syncError" class="sync-warn">Lưu ý đồng bộ Meta: {{ syncError }}</small></div><button v-if="messengerConnected" class="adm-btn sync-btn" @click="forceSync" :disabled="syncBusy">{{ syncBusy ? 'Đang quét…' : '↻ Quét ngay' }}</button><span class="connection-tag">{{ messengerConnected ? 'Messenger' : 'CRM sẵn sàng' }}</span><span :class="['ai-tag', { active: aiEnabled }]">{{ aiEnabled ? 'AI đang bật' : 'AI chưa bật' }}</span></div>

    <section class="ads-card adm-card">
      <div class="ads-head"><div><h2>Quảng cáo đang chạy</h2><p>Số liệu hiệu quả trong 30 ngày gần nhất</p></div><button class="adm-btn" @click="loadAds" :disabled="adsBusy">{{ adsBusy ? 'Đang tải…' : '↻ Làm mới' }}</button></div>
      <p v-if="adsError" class="ads-error">{{ adsError }}</p>
      <div v-else-if="!adsConfigured" class="ads-empty">Cần cấu hình tài khoản quảng cáo và quyền đọc dữ liệu trên backend để hiển thị quảng cáo.</div>
      <div v-else-if="!ads.length" class="ads-empty">Không tìm thấy quảng cáo đang hoạt động.</div>
      <div v-else class="ads-table-wrap"><table class="ads-table"><thead><tr><th>Quảng cáo</th><th>Chiến dịch</th><th>Hiển thị</th><th>Nhấp</th><th>Chi tiêu (30 ngày)</th></tr></thead><tbody><tr v-for="ad in ads" :key="ad.id"><td><strong>{{ ad.name }}</strong><small>{{ ad.adsetName || ad.id }}</small></td><td>{{ ad.campaignName || '—' }}</td><td>{{ formatNumber(ad.impressions) }}</td><td>{{ formatNumber(ad.clicks) }}</td><td>{{ formatMoney(ad.spend) }}</td></tr></tbody></table></div>
    </section>

    <form v-if="showCreate" class="adm-card create-form" @submit.prevent="createCustomer">
      <h2>Thêm khách cần chăm sóc</h2>
      <div class="form-grid"><label>Tên khách *<input v-model="draft.customerName" required placeholder="Tên hiển thị Facebook"></label><label>Facebook ID / link hồ sơ<input v-model="draft.facebookId" placeholder="Tùy chọn"></label><label>Số điện thoại<input v-model="draft.phone" placeholder="Nếu khách đã cung cấp"></label><label>Sản phẩm quan tâm<input v-model="draft.interest" placeholder="Ví dụ: Dàn karaoke 29 triệu"></label><label>Nhắc chăm sóc lúc<input v-model="draft.followUpAt" type="datetime-local"></label><label>Ghi chú<textarea v-model="draft.notes" rows="2" placeholder="Nhu cầu, khu vực, vấn đề đang gặp"></textarea></label></div>
      <button class="adm-btn adm-btn-gold" :disabled="busy">{{ busy ? 'Đang lưu…' : 'Lưu hồ sơ' }}</button>
    </form>

    <div class="stats"><button v-for="item in statusOptions" :key="item.key" :class="['stat', { selected: filter === item.key }]" @click="filter = item.key"><span>{{ item.label }}</span><b>{{ item.key === 'ALL' ? customers.length : customers.filter(c => c.status === item.key).length }}</b></button><div class="search"><input v-model="keyword" placeholder="Tìm tên, số điện thoại, nhu cầu…"></div></div>

    <div class="workspace adm-card">
      <div class="customer-list"><div class="list-title">Danh sách khách <span>{{ visibleCustomers.length }}</span></div><button v-for="c in visibleCustomers" :key="c.id" :class="['customer-row', { active: selected?.id === c.id }]" @click="select(c)"><strong>{{ c.customerName }}</strong><small class="line-clamp">{{ c.interest || c.lastMessage || 'Chưa ghi nhu cầu' }}</small><small>{{ c.phone || c.facebookId || c.id }}</small><small v-if="c.sourceAdName || c.sourceAdId" class="source-small">Nguồn quảng cáo: {{ c.sourceAdName || c.sourceAdId }}</small><small v-else-if="c.sourceType">Nguồn: {{ c.sourceType }}</small><span :class="['status', c.status.toLowerCase()]">{{ labelFor(c.status) }}</span><em v-if="c.followUpAt">Nhắc: {{ displayDate(c.followUpAt) }}</em></button><p v-if="!visibleCustomers.length" class="empty">Chưa có khách. Hệ thống tự động đồng bộ tin nhắn từ Fanpage.</p></div>
      <section v-if="selected" class="detail">
        <div class="detail-head"><div><h2>{{ selected.customerName }}</h2><p>{{ selected.phone || 'Chưa có số điện thoại' }} <span v-if="selected.facebookId"> · {{ selected.facebookId }}</span></p></div><select v-model="edit.status" @change="save"><option v-for="s in statusOptions.slice(1)" :key="s.key" :value="s.key">{{ s.label }}</option></select></div>
        <div v-if="selected.sourceAdId || selected.sourceType" class="source-card"><strong>Nguồn khách từ quảng cáo</strong><span>{{ selected.sourceAdName || `Quảng cáo ID ${selected.sourceAdId || 'không có'}` }}</span><small v-if="selected.sourceCampaignName">Chiến dịch: {{ selected.sourceCampaignName }}</small><small v-if="selected.sourceType">Nguồn Meta: {{ selected.sourceType }}</small></div>
        <div class="edit-grid"><label>Nhu cầu<input v-model="edit.interest" @change="save"></label><label>Điện thoại<input v-model="edit.phone" @change="save"></label><label>Nhắc chăm sóc<input v-model="edit.followUpAt" type="datetime-local" @change="save"></label><label>Phụ trách<input v-model="edit.assignedTo" @change="save"></label></div>
        <label class="notes">Ghi chú khách hàng<textarea v-model="edit.notes" rows="3" @change="save"></textarea></label>
        <div class="history-head"><h3>Lịch sử tư vấn</h3><span>{{ messengerConnected ? 'Tin nhắn OUT sẽ gửi qua Messenger' : 'Ghi nhận nội bộ · Messenger chưa kết nối' }}</span></div>
        <div class="history"><div v-for="m in selected.messages" :key="m.id" :class="['message', m.direction === 'OUT' ? 'out' : 'in']"><small>{{ m.direction === 'OUT' ? 'Đã tư vấn' : 'Khách nhắn' }} · {{ displayDate(m.createdAt) }}</small><p>{{ m.body }}</p></div><p v-if="!selected.messages?.length" class="empty">Chưa có ghi nhận hội thoại.</p></div>
        <form class="message-form" @submit.prevent="addMessage"><select v-model="messageDirection"><option value="IN">Khách nhắn</option><option value="OUT">{{ messengerConnected ? 'Trả lời khách' : 'Đã tư vấn' }}</option></select><input v-model="messageBody" :placeholder="messageDirection === 'OUT' && messengerConnected ? 'Soạn tin nhắn gửi khách…' : 'Ghi nội dung trao đổi…'" required><button class="adm-btn adm-btn-gold" :disabled="busy">{{ busy ? 'Đang gửi…' : messageDirection === 'OUT' && messengerConnected ? 'Gửi Messenger' : 'Ghi lại' }}</button></form>
      </section>
      <section v-else class="placeholder"><div>💬</div><h2>Chọn hồ sơ khách hàng</h2><p>Thông tin và lịch sử chăm sóc sẽ hiển thị tại đây.</p></section>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { apiRequest } from '../../utils/api'
const customers = ref([]), selected = ref(null), showCreate = ref(false), busy = ref(false), syncBusy = ref(false), error = ref(''), keyword = ref(''), filter = ref('ALL'), messageBody = ref(''), messageDirection = ref('OUT'), messengerConnected = ref(false), aiEnabled = ref(false), lastSyncedAt = ref(''), syncError = ref(''), ads = ref([]), adsBusy = ref(false), adsError = ref(''), adsConfigured = ref(false)
const statusOptions = [{ key: 'ALL', label: 'Tất cả' }, { key: 'MOI', label: 'Mới' }, { key: 'DANG_TU_VAN', label: 'Đang tư vấn' }, { key: 'CHO_PHAN_HOI', label: 'Chờ phản hồi' }, { key: 'DA_CHOT', label: 'Đã chốt' }, { key: 'DA_HUY', label: 'Đã dừng' }]
const blank = () => ({ customerName: '', facebookId: '', phone: '', interest: '', notes: '', followUpAt: '' })
const draft = reactive(blank()), edit = reactive({})
let careTimer = null, adsTimer = null
const labelFor = value => statusOptions.find(x => x.key === value)?.label || value
const displayDate = value => value ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : ''
const displayTime = value => value ? new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''
const formatNumber = value => new Intl.NumberFormat('vi-VN').format(value || 0)
const formatMoney = value => `${new Intl.NumberFormat('vi-VN').format(value || 0)} đ`
const visibleCustomers = computed(() => customers.value.filter(c => (filter.value === 'ALL' || c.status === filter.value) && `${c.customerName} ${c.phone} ${c.interest} ${c.lastMessage || ''} ${c.facebookId} ${c.sourceAdName || ''} ${c.sourceCampaignName || ''} ${c.sourceAdId || ''}`.toLowerCase().includes(keyword.value.toLowerCase())))
const isEditingDetail = () => typeof document !== 'undefined' && Boolean(document.activeElement?.closest('.detail .edit-grid, .detail .notes, .detail .detail-head'))
async function load({ silent = false, force = false } = {}) {
  try {
    const r = await apiRequest(force ? '/admin/facebook-care?sync=force' : '/admin/facebook-care')
    customers.value = r.data || []
    messengerConnected.value = Boolean(r.connected)
    aiEnabled.value = Boolean(r.aiEnabled)
    if (r.lastSyncedAt) lastSyncedAt.value = r.lastSyncedAt
    syncError.value = r.syncError || ''
    if (selected.value) {
      const updated = customers.value.find(c => c.id === selected.value.id) || null
      if (updated && silent && isEditingDetail()) selected.value = updated
      else select(updated)
    } else if (customers.value.length && !silent) {
      select(customers.value[0])
    }
  } catch (e) {
    if (!silent) error.value = e.message
  }
}
async function forceSync() { syncBusy.value = true; error.value = ''; try { await load({ force: true }) } finally { syncBusy.value = false } }
async function loadAds() { adsBusy.value = true; adsError.value = ''; try { const r = await apiRequest('/admin/facebook-ads'); ads.value = r.data || []; adsConfigured.value = Boolean(r.configured) } catch (e) { adsError.value = e.message; adsConfigured.value = e.status !== 503 } finally { adsBusy.value = false } }
function select(c) { selected.value = c; if (c) Object.assign(edit, { status: c.status, interest: c.interest, phone: c.phone, notes: c.notes, followUpAt: c.followUpAt, assignedTo: c.assignedTo }) }
async function createCustomer() { busy.value = true; error.value = ''; try { const r = await apiRequest('/admin/facebook-care', { method: 'POST', body: JSON.stringify(draft) }); customers.value.unshift(r.data); select(r.data); Object.assign(draft, blank()); showCreate.value = false } catch (e) { error.value = e.message } finally { busy.value = false } }
async function save() { if (!selected.value) return; try { const r = await apiRequest(`/admin/facebook-care/${selected.value.id}`, { method: 'PATCH', body: JSON.stringify(edit) }); Object.assign(selected.value, r.data) } catch (e) { error.value = e.message } }
async function addMessage() { if (!messageBody.value.trim()) return; busy.value = true; try { const customerId = selected.value.id; const endpoint = messageDirection.value === 'OUT' && messengerConnected.value ? `/admin/facebook-care/${customerId}/send` : `/admin/facebook-care/${customerId}/messages`; await apiRequest(endpoint, { method: 'POST', body: JSON.stringify({ body: messageBody.value, direction: messageDirection.value }) }); messageBody.value = ''; await load({ silent: true }); select(customers.value.find(c => c.id === customerId) || selected.value) } catch (e) { error.value = e.message } finally { busy.value = false } }
const onVisible = () => { if (document.visibilityState === 'visible' && !busy.value && !syncBusy.value) load({ silent: true }) }
onMounted(() => {
  load(); loadAds()
  careTimer = setInterval(() => { if (document.visibilityState === 'visible' && !busy.value && !syncBusy.value) load({ silent: true }) }, 10000)
  adsTimer = setInterval(() => { if (document.visibilityState === 'visible' && !adsBusy.value) loadAds() }, 180000)
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', onVisible)
})
onBeforeUnmount(() => {
  if (careTimer) clearInterval(careTimer)
  if (adsTimer) clearInterval(adsTimer)
  document.removeEventListener('visibilitychange', onVisible)
  window.removeEventListener('focus', onVisible)
})
</script>

<style scoped>
.fb-care{--ink:#172033;--muted:#64748b}.ads-card{padding:16px 18px}.ads-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.ads-head h2{font-size:.95rem;margin:0}.ads-head p{font-size:.74rem;color:#64748b;margin-top:4px}.ads-empty,.ads-error{padding:14px;color:#64748b;font-size:.8rem}.ads-error{color:#b91c1c}.ads-table-wrap{overflow:auto}.ads-table{width:100%;border-collapse:collapse;font-size:.78rem}.ads-table th,.ads-table td{text-align:left;padding:9px 10px;border-bottom:1px solid #e2e8f0;white-space:nowrap}.ads-table th{color:#64748b;font-size:.7rem}.ads-table td strong,.ads-table td small{display:block}.ads-table td small{color:#94a3b8;font-size:.68rem;margin-top:3px}.source-small{color:#7c3aed!important}.source-card{display:grid;gap:4px;margin-top:14px;padding:12px 14px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:9px;color:#5b21b6;font-size:.78rem}.source-card small{color:#7c6aa6}.connection{display:flex;align-items:center;gap:10px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 17px;color:#9a3412}.connection>div{flex:1;min-width:0}.connection strong,.connection small{display:block}.connection small{font-size:.78rem;color:#9a6044;margin-top:3px}.sync-warn{color:#b45309!important;font-weight:600}.sync-btn{font-size:.75rem;padding:6px 10px;white-space:nowrap}.line-clamp{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.offline-dot{width:10px;height:10px;border-radius:50%;background:#f97316;flex:none}.connection-tag{font-size:.75rem;font-weight:700;background:#ffedd5;padding:6px 9px;border-radius:20px;white-space:nowrap}.create-form{padding:20px}.create-form h2,.detail h2{font-size:1rem;margin-bottom:14px}.form-grid,.edit-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:14px}.form-grid label,.edit-grid label,.notes{display:grid;gap:5px;font-size:.76rem;color:#64748b;font-weight:650}.form-grid input,.form-grid textarea,.edit-grid input,.notes textarea,.detail-head select,.message-form input,.message-form select,.search input{width:100%;border:1px solid #dbe2ec;border-radius:8px;padding:9px 10px;font:inherit;color:#172033;background:white}.stats{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.stat{border:1px solid #e2e8f0;background:white;border-radius:10px;padding:9px 13px;display:flex;gap:9px;align-items:center;color:#475569;cursor:pointer}.stat b{color:#172033}.stat.selected{border-color:#2563eb;background:#eff6ff}.search{margin-left:auto;min-width:260px}.workspace{display:grid;grid-template-columns:minmax(230px,300px) 1fr;min-height:520px;overflow:hidden}.customer-list{border-right:1px solid #e2e8f0;padding:14px;max-height:690px;overflow:auto}.list-title{font-size:.82rem;font-weight:800;padding:2px 4px 12px;display:flex;justify-content:space-between}.customer-row{position:relative;width:100%;text-align:left;border:1px solid transparent;background:#fff;border-radius:10px;padding:11px 10px;margin-bottom:5px;display:grid;gap:4px;cursor:pointer;color:#172033}.customer-row:hover,.customer-row.active{background:#f1f5f9;border-color:#cbd5e1}.customer-row strong{font-size:.86rem;padding-right:64px}.customer-row small,.customer-row em{font-size:.72rem;color:#64748b;font-style:normal}.customer-row .status{position:absolute;right:9px;top:10px}.status{font-size:.66rem;padding:3px 6px;border-radius:10px;background:#e2e8f0;color:#475569}.status.moi{background:#fee2e2;color:#b91c1c}.status.dang_tu_van{background:#dbeafe;color:#1d4ed8}.status.cho_phan_hoi{background:#fef3c7;color:#92400e}.status.da_chot{background:#dcfce7;color:#166534}.detail{padding:21px;min-width:0}.detail-head{display:flex;justify-content:space-between;align-items:start;gap:12px;border-bottom:1px solid #e2e8f0;padding-bottom:14px}.detail-head h2{margin:0 0 5px}.detail-head p{font-size:.78rem;color:#64748b}.detail-head select{width:auto;min-width:150px}.edit-grid{grid-template-columns:repeat(4,minmax(0,1fr));margin:16px 0}.notes textarea{resize:vertical}.history-head{display:flex;justify-content:space-between;align-items:baseline;margin:20px 0 10px}.history-head h3{font-size:.9rem}.history-head span{font-size:.7rem;color:#94a3b8}.history{height:220px;overflow:auto;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:9px}.message{max-width:82%;padding:9px 11px;border-radius:10px;background:white;border:1px solid #e2e8f0}.message.out{align-self:flex-end;background:#eff6ff;border-color:#bfdbfe}.message small{color:#64748b;font-size:.67rem}.message p{font-size:.83rem;margin-top:4px;white-space:pre-wrap}.message-form{display:flex;gap:8px;margin-top:10px}.message-form select{width:130px}.message-form input{flex:1}.placeholder{display:grid;place-content:center;text-align:center;color:#64748b}.placeholder div{font-size:2rem}.placeholder h2{font-size:1rem;color:#334155;margin-top:10px}.empty{padding:18px;color:#94a3b8;font-size:.8rem;text-align:center}.error{color:#b91c1c}@media(max-width:800px){.workspace{grid-template-columns:1fr}.customer-list{max-height:260px;border-right:0;border-bottom:1px solid #e2e8f0}.form-grid,.edit-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.search{margin:0;width:100%}}@media(max-width:520px){.form-grid,.edit-grid{grid-template-columns:1fr}.detail-head,.history-head{align-items:flex-start;flex-direction:column}.message-form{flex-wrap:wrap}.message-form input{min-width:100%;order:1}.message-form button{order:2}}
.connection.online{background:#f0fdf4;border-color:#bbf7d0;color:#166534}.connection.online small{color:#4d7c5b}.connection.online .offline-dot{background:#22c55e}.connection.online .connection-tag{background:#dcfce7}.ai-tag{margin-left:0;font-size:.75rem;font-weight:700;background:#e2e8f0;color:#475569;padding:6px 9px;border-radius:20px;white-space:nowrap}.ai-tag.active{background:#dbeafe;color:#1d4ed8}@media(max-width:520px){.connection{align-items:flex-start;flex-wrap:wrap}.sync-btn{margin-left:20px}}
</style>
