import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/jetbrains-mono/400.css';
import '../style.css';
function initTheme() {
    const root = document.documentElement;
    const toggle = document.getElementById('theme-toggle');
    const meta = document.querySelector('meta[name="theme-color"]');
    const apply = (theme) => {
        root.setAttribute('data-theme', theme);
        toggle?.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
        meta?.setAttribute('content', getComputedStyle(document.body).backgroundColor);
        window.dispatchEvent(new Event('themechange'));
    };
    apply(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    toggle?.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        apply(next);
        try {
            localStorage.setItem('theme', next);
        }
        catch {
            // Storage can be blocked; the choice then lasts for this visit only.
        }
    });
}
function initNav() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    const pageEnd = document.getElementById('page-end');
    const lastId = sections[sections.length - 1]?.id;
    let midId = sections[0]?.id;
    let atEnd = false;
    const ghost = document.querySelector('.ghost-follow');
    const moon = document.querySelector('.moon');
    const render = () => {
        const activeId = atEnd ? lastId : midId;
        navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('href') === `#${activeId}`);
        });
        if (ghost && activeId)
            ghost.dataset.pose = atEnd ? 'moon' : activeId;
        moon?.classList.toggle('is-landed', atEnd);
    };
    // Active link: the section crossing the vertical midpoint of the viewport
    const mid = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting)
                midId = entry.target.id;
        }
        render();
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
    sections.forEach((section) => mid.observe(section));
    // At the very bottom the last section can no longer reach the midpoint; the end of the page coming into view marks it
    if (pageEnd) {
        new IntersectionObserver(([entry]) => {
            atEnd = entry.isIntersecting;
            render();
        }).observe(pageEnd);
    }
}
function initGaze() {
    const ghost = document.querySelector('.ghost-follow');
    if (!ghost || !window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches)
        return;
    const reach = 7;
    window.addEventListener('pointermove', (e) => {
        if (ghost.dataset.pose === 'moon')
            return;
        const box = ghost.getBoundingClientRect();
        const dx = e.clientX - (box.left + box.width / 2);
        const dy = e.clientY - (box.top + box.height / 2);
        const len = Math.hypot(dx, dy) || 1;
        const pull = Math.min(1, len / 400);
        ghost.style.setProperty('--gx', String((dx / len) * pull * reach));
        ghost.style.setProperty('--gy', String((dy / len) * pull * reach));
    }, { passive: true });
}
function initMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('nav-links');
    if (!toggle || !menu)
        return;
    const close = () => {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
    };
    const open = () => {
        toggle.setAttribute('aria-expanded', 'true');
        menu.classList.add('is-open');
    };
    toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        expanded ? close() : open();
    });
    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
            close();
            toggle.focus();
        }
    });
    // Close links click
    menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', close);
    });
    // Reset on resize to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 640)
            close();
    }, { passive: true });
}
function initReveal() {
    const targets = document.querySelectorAll('[data-reveal]');
    targets.forEach((el) => {
        const siblings = el.parentElement?.querySelectorAll(':scope > [data-reveal]');
        el.style.setProperty('--i', String(siblings ? Array.prototype.indexOf.call(siblings, el) : 0));
    });
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting)
                continue;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach((el) => observer.observe(el));
}
function initStars() {
    const canvas = document.querySelector('.starfield');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx)
        return;
    // Fixed seed and normalized coordinates keep the sky identical across loads and resizes
    let seed = 0x9e3779b9;
    const random = () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const stars = Array.from({ length: 190 }, () => {
        const bright = random() < 0.1;
        return {
            x: random(),
            y: random(),
            r: bright ? 0.9 + random() * 0.4 : 0.45 + random() * 0.35,
            a: bright ? 0.6 + random() * 0.3 : 0.22 + random() * 0.28,
        };
    });
    const draw = () => {
        const rgb = getComputedStyle(document.documentElement).getPropertyValue('--star').trim().replace(/\s+/g, ', ');
        const gain = Number(getComputedStyle(document.documentElement).getPropertyValue('--star-a')) || 1;
        const dpr = window.devicePixelRatio || 1;
        const { innerWidth: w, innerHeight: h } = window;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        for (const s of stars) {
            ctx.fillStyle = `rgba(${rgb}, ${s.a * gain})`;
            ctx.beginPath();
            ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
            ctx.fill();
        }
    };
    let frame = 0;
    window.addEventListener('resize', () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(draw);
    }, { passive: true });
    window.addEventListener('themechange', draw);
    draw();
}
initTheme();
initNav();
initMobileMenu();
initReveal();
initStars();
initGaze();
