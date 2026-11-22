/**
 * Tiện ích xử lý URL Video (YouTube embed, Shorts, video MP4)
 */

export function getEmbedVideoUrl(url, autoplay = false) {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()

  // Xử lý link YouTube thông thường: watch?v=ID hoặc youtu.be/ID hoặc shorts/ID
  const match = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/)
  if (match && match[1]) {
    const videoId = match[1]
    const params = [
      'rel=0',
      'enablejsapi=1',
      'playsinline=1'
    ]
    if (autoplay) {
      params.push('autoplay=1')
    }
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.join('&')}`
  }

  // Nếu đã là link embed
  if (trimmed.includes('youtube.com/embed/')) {
    let clean = trimmed.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/')
    if (autoplay && !clean.includes('autoplay=')) {
      clean += (clean.includes('?') ? '&' : '?') + 'autoplay=1'
    }
    return clean
  }

  return trimmed
}

export function isDirectVideo(url) {
  if (!url || typeof url !== 'string') return false
  const clean = url.trim().split('?')[0].toLowerCase()
  return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.ogg')
}

export function getYoutubeThumbnail(url) {
  if (!url) return ''
  const trimmed = url.trim()
  const match = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/)
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
  }
  return ''
}
