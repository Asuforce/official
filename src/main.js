import '../style.css';
function initNav() {
    const nav = document.getElementById('site-nav');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    if (!nav)
        return;
    // Scrolled state — show background
    const onScroll = () => {
        nav.classList.toggle('is-scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    // Active link — fires when a section crosses the vertical midpoint of the viewport
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting)
                continue;
            const id = entry.target.id;
            navLinks.forEach((link) => {
                link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
            });
        }
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
    sections.forEach((section) => observer.observe(section));
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
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting)
                continue;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
}
document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initMobileMenu();
    initScrollAnimations();
});
