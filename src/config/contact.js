/**
 * Thông tin liên hệ & thanh toán chính thức của Tú Audio.
 */
export const CONTACT_INFO = {
  phone: '0984259898',
  phoneDisplay: '0984 259 898',
  phoneHref: 'tel:0984259898',
  zaloUrl: 'https://zalo.me/0984259898',
  facebookUrl: 'https://www.facebook.com/tuaudio.vn',
  messengerUrl: 'https://m.me/113264562724469',
  youtubeUrl: 'https://www.youtube.com/@tuaudio92',
  mapUrl: 'https://maps.app.goo.gl/gJbMJ9T1jf4scAEYA',
  bankCode: 'ICB',
  bankName: 'VietinBank',
  bankAccount: '109004908801',
  bankOwner: 'PHUNG VAN TU'
}

export function buildVietQrUrl(amount = 0, addInfo = '') {
  const params = new URLSearchParams()
  if (Number(amount) > 0) params.set('amount', String(Math.round(Number(amount))))
  if (addInfo) params.set('addInfo', addInfo.slice(0, 50))
  params.set('accountName', CONTACT_INFO.bankOwner)
  return `https://img.vietqr.io/image/${CONTACT_INFO.bankCode}-${CONTACT_INFO.bankAccount}-compact2.png?${params.toString()}`
}
