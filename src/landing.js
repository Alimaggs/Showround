// Small enhancements for the landing page. Everything here is optional: with
// scripting off the page still reads top to bottom, the audience line shows
// its first entry, and a noscript link opens the demo tour directly.

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The demo is a full tour with its own copy of three.js, so it is held back
// until the page itself has finished loading rather than competing with it.
function loadDemo() {
  const frame = document.querySelector('#demo-tour')
  if (!frame || frame.src) return
  frame.addEventListener('load', () => {
    document.querySelector('#demo-loading')?.classList.add('is-hidden')
    frame.classList.add('is-ready')
  }, { once: true })
  frame.src = frame.dataset.src
}

if (document.readyState === 'complete') loadDemo()
else window.addEventListener('load', loadDemo, { once: true })

// Audience line under the headline.
const audiences = ['estate agents', 'schools', 'wedding venues', 'holiday lets', 'museums', 'showrooms']
const rotator = document.querySelector('#rotator')
if (rotator && !reducedMotion) {
  let index = 0
  setInterval(() => {
    rotator.classList.add('is-leaving')
    setTimeout(() => {
      index = (index + 1) % audiences.length
      rotator.textContent = audiences[index]
      rotator.classList.remove('is-leaving')
    }, 260)
  }, 2200)
}

// Fade sections in as they scroll into view. The class on <html> is what
// hides them to begin with, so nothing is hidden unless this script has run.
const revealable = document.querySelectorAll('[data-reveal]')
if (revealable.length && !reducedMotion && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('reveal-on')
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('is-visible')
      observer.unobserve(entry.target)
    })
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
  revealable.forEach((element) => observer.observe(element))
}

// Only one answer open at a time, so the list never becomes a wall of text.
const answers = document.querySelectorAll('.faq details')
answers.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return
    answers.forEach((other) => { if (other !== item) other.open = false })
  })
})
