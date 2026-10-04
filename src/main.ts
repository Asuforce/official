import '../style.css'

function initNav(): void {
  const nav = document.getElementById('site-nav')
  const navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-link')
  const sections = document.querySelectorAll<HTMLElement>('section[id]')

  if (!nav) return

  // Scrolled state — show background
  const onScroll = (): void => {
    nav.classList.toggle('is-scrolled', window.scrollY > 10)
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // Active link — fires when a section crosses the vertical midpoint of the viewport
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const id = entry.target.id
        navLinks.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`)
        })
      }
    },
    { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
  )

  sections.forEach((section) => observer.observe(section))
}

function initMobileMenu(): void {
  const toggle = document.getElementById('menu-toggle')
  const menu = document.getElementById('nav-links')

  if (!toggle || !menu) return

  const close = (): void => {
    toggle.setAttribute('aria-expanded', 'false')
    menu.classList.remove('is-open')
  }

  const open = (): void => {
    toggle.setAttribute('aria-expanded', 'true')
    menu.classList.add('is-open')
  }

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true'
    expanded ? close() : open()
  })

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      close()
      toggle.focus()
    }
  })

  // Close links click
  menu.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => {
    link.addEventListener('click', close)
  })

  // Reset on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 640) close()
  }, { passive: true })
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

function scramble(el: HTMLElement): void {
  const final = el.textContent ?? ''
  el.setAttribute('aria-label', final)
  const glyphs = '01/<>#_'
  let frame = 0
  const timer = window.setInterval(() => {
    frame++
    el.textContent = [...final]
      .map((ch, i) => (i < frame / 2 ? ch : glyphs[Math.floor(Math.random() * glyphs.length)]))
      .join('')
    if (frame / 2 >= final.length) {
      window.clearInterval(timer)
      el.textContent = final
    }
  }, 35)
}

function initScrollAnimations(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
        const title = entry.target.querySelector<HTMLElement>('.section-title')
        if (title && !reducedMotion.matches) scramble(title)
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  )

  document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el))
}

function initField(): void {
  const hero = document.getElementById('about')
  const canvas = document.querySelector<HTMLCanvasElement>('.hero-field')
  const ctx = canvas?.getContext('2d')
  if (!hero || !canvas || !ctx) return

  const STEP = 16
  const REACH = 120
  const pulses: { x: number; y: number; v: number }[] = []
  const base = document.createElement('canvas')
  let width = 0
  let height = 0
  let pointer: { x: number; y: number } | null = null
  let frameId = 0

  const dot = (x: number, y: number, v: number): void => {
    ctx.fillStyle = `rgba(240, 192, 48, ${v})`
    const size = 2 + v * 2.5
    ctx.fillRect(x - size / 2, y - size / 2, size, size)
  }

  const spawn = (): void => {
    const x = Math.floor((Math.random() * width) / STEP) * STEP + STEP / 2
    const y = Math.floor((Math.random() * height) / STEP) * STEP + STEP / 2
    pulses.push({ x, y, v: 1 })
  }

  const draw = (): void => {
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(base, 0, 0, width, height)
    for (const p of pulses) dot(p.x, p.y, p.v)
    if (!pointer) return
    ctx.strokeStyle = 'rgba(240, 192, 48, 0.7)'
    ctx.beginPath()
    ctx.moveTo(pointer.x - 10, pointer.y)
    ctx.lineTo(pointer.x + 10, pointer.y)
    ctx.moveTo(pointer.x, pointer.y - 10)
    ctx.lineTo(pointer.x, pointer.y + 10)
    ctx.stroke()
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.fillStyle = 'rgba(240, 192, 48, 0.9)'
    const pad = (n: number): string => String(Math.round(n)).padStart(4, '0')
    ctx.fillText(`X${pad(pointer.x)} Y${pad(pointer.y)}`, pointer.x + 16, pointer.y - 12)
    const x0 = Math.floor((pointer.x - REACH) / STEP)
    const x1 = Math.ceil((pointer.x + REACH) / STEP)
    const y0 = Math.floor((pointer.y - REACH) / STEP)
    const y1 = Math.ceil((pointer.y + REACH) / STEP)
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const x = cx * STEP + STEP / 2
        const y = cy * STEP + STEP / 2
        const near = 1 - Math.hypot(x - pointer.x, y - pointer.y) / REACH
        if (near > 0) dot(x, y, near)
      }
    }
  }

  const step = (): void => {
    const births = Math.max(1, Math.round((width * height) / (STEP * STEP * 900)))
    for (let i = 0; i < births; i++) spawn()
    for (let i = pulses.length - 1; i >= 0; i--) {
      pulses[i].v *= 0.972
      if (pulses[i].v < 0.05) pulses.splice(i, 1)
    }
    draw()
    frameId = requestAnimationFrame(step)
  }

  const resize = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = hero.getBoundingClientRect()
    width = rect.width
    height = rect.height
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    base.width = canvas.width
    base.height = canvas.height
    const baseCtx = base.getContext('2d')
    if (!baseCtx) return
    baseCtx.scale(dpr, dpr)
    baseCtx.fillStyle = 'rgba(70, 120, 235, 0.42)'
    for (let y = STEP / 2; y < height; y += STEP) {
      for (let x = STEP / 2; x < width; x += STEP) baseCtx.fillRect(x - 1, y - 1, 2, 2)
    }
    pulses.length = 0
    if (reducedMotion.matches) {
      for (let i = 0; i < 160; i++) {
        spawn()
        pulses[i].v = 0.2 + Math.random() * 0.6
      }
    }
    draw()
  }

  new ResizeObserver(resize).observe(hero)

  if (reducedMotion.matches) return

  hero.addEventListener('pointermove', (e) => {
    const rect = hero.getBoundingClientRect()
    pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, { passive: true })
  hero.addEventListener('pointerleave', () => { pointer = null })

  new IntersectionObserver(([entry]) => {
    cancelAnimationFrame(frameId)
    if (entry.isIntersecting) frameId = requestAnimationFrame(step)
  }).observe(hero)
}

document.addEventListener('DOMContentLoaded', () => {
  initNav()
  initMobileMenu()
  initScrollAnimations()
  initField()
})
