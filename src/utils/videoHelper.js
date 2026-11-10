/**
 * Tiện ích xử lý URL Video (YouTube embed, Shorts, video MP4)
 */

export function getEmbedVideoUrl(url) {
  if (!url) return ''
  const trimmed = url.trim()

  // Xử lý link YouTube thông thường: https://www.youtube.com/watch?v=ID
  const watchMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`
  }

  // Xử lý YouTube Shorts: https://www.youtube.com/shorts/ID
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([^"&?\/\s]{11})/)
  if (shortsMatch && shortsMatch[1]) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}`
  }

  // Nếu đã là link embed
  if (trimmed.includes('youtube.com/embed/')) {
    return trimmed
  }

  return trimmed
}

export function isDirectVideo(url) {
  if (!url) return false
  return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')
}
