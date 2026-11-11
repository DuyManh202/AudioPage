/**
 * Scroll-triggered reveal directive (`v-reveal`).
 * Usage: v-reveal or v-reveal="120" (delay in ms).
 * Elements reveal cleanly on intersection and stay visible under reduced-motion.
 */
export const vReveal = {
  mounted(el, binding) {
    const delay = Number(binding.value) || 0
    if (delay > 0) {
      el.style.setProperty('--reveal-delay', `${delay}ms`)
    }
    el.classList.add('reveal-item')

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-revealed')
      return
    }

    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.96) {
      requestAnimationFrame(() => {
        el.classList.add('is-revealed')
      })
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-revealed')
            observer.unobserve(el)
          }
        })
      },
      {
        threshold: 0.04,
        rootMargin: '80px 0px'
      }
    )

    el.__revealObserver = observer
    observer.observe(el)
  },
  unmounted(el) {
    if (el.__revealObserver) {
      el.__revealObserver.disconnect()
      delete el.__revealObserver
    }
  }
}
