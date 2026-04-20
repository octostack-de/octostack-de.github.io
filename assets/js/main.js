document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');
    const closeIcon = document.getElementById('close-icon');
    const navLinks = document.querySelectorAll('.nav-link');

    // ---- Mobile menu ----

    function openMenu() {
        mobileMenu.classList.remove('hidden');
        menuIcon.classList.add('hidden');
        closeIcon.classList.remove('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
        const firstLink = mobileMenu.querySelector('a');
        if (firstLink) firstLink.focus();
    }

    function closeMenu() {
        mobileMenu.classList.add('hidden');
        menuIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.focus();
    }

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            const isOpen = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
            if (isOpen) closeMenu(); else openMenu();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' &&
                mobileMenuBtn.getAttribute('aria-expanded') === 'true') {
                closeMenu();
            }
        });

        document.addEventListener('click', function(e) {
            if (mobileMenuBtn.getAttribute('aria-expanded') !== 'true') return;
            if (!header.contains(e.target)) closeMenu();
        });
    }

    // ---- Smooth scroll with dynamic header offset ----

    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));

            const offset = header.offsetHeight;
            const elementPosition = target.offsetTop - offset;
            window.scrollTo({ top: elementPosition, behavior: 'smooth' });

            if (mobileMenuBtn &&
                mobileMenuBtn.getAttribute('aria-expanded') === 'true') {
                closeMenu();
            }
        });
    });

    // ---- Scroll-spy via IntersectionObserver ----

    const NAV_SECTIONS = ['home', 'how', 'services', 'about', 'contact'];

    function setActiveNavLink(sectionId) {
        navLinks.forEach(function(link) {
            const isActive = link.getAttribute('href') === '#' + sectionId;
            link.classList.toggle('text-ink-800', isActive);
            link.classList.toggle('text-ink-700', !isActive);
        });
    }

    if (navLinks.length > 0 && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        setActiveNavLink(entry.target.id);
                    }
                });
            },
            { rootMargin: '-30% 0px -70% 0px', threshold: 0 }
        );

        NAV_SECTIONS.forEach(function(id) {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
    }
});
