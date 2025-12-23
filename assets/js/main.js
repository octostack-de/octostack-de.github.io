// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80; // Header height
                const elementPosition = target.offsetTop - offset;
                window.scrollTo({
                    top: elementPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                if (mobileMenu) {
                    mobileMenu.classList.add('hidden');
                }
            }
        });
    });

    // Active section highlighting
    const sections = ['home', 'services', 'about', 'contact'];
    const navLinks = document.querySelectorAll('.nav-link');

    function updateActiveSection() {
        const scrollPosition = window.scrollY + 100;

        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                const { offsetTop, offsetHeight } = section;
                if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                    navLinks.forEach(link => {
                        link.classList.remove('text-primary-600');
                        link.classList.add('text-secondary-600');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.remove('text-secondary-600');
                            link.classList.add('text-primary-600');
                        }
                    });
                }
            }
        });
    }

    window.addEventListener('scroll', updateActiveSection);
    updateActiveSection();
});
