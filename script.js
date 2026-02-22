document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    const iconMenu = mobileMenuBtn.querySelector('i');

    function toggleMenu() {
        mobileMenu.classList.toggle('active');
        if (mobileMenu.classList.contains('active')) {
            iconMenu.classList.remove('fa-bars');
            iconMenu.classList.add('fa-xmark');
        } else {
            iconMenu.classList.remove('fa-xmark');
            iconMenu.classList.add('fa-bars');
        }
    }

    mobileMenuBtn.addEventListener('click', toggleMenu);

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileMenu.classList.contains('active')) {
                toggleMenu();
            }
        });
    });

    // 2. Navbar Scroll Effect
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 3. FAQ Accordion Logic
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        questionBtn.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all others
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
                otherItem.querySelector('.faq-answer').style.maxHeight = null;
            });

            // Toggle current
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // 4. Intersection Observer for Scroll Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% is visible
    };

    const animateOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Stop observing once animated to avoid re-triggering
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
    elementsToAnimate.forEach(el => {
        animateOnScroll.observe(el);
    });

    // Optional: Update Footer Year Dynamically (Defaulted to 2026 as asked in footer, but good practice)
    const currentYear = new Date().getFullYear();
    const copyrightText = document.querySelector('.footer-bottom p');
    if (copyrightText && currentYear > 2026) {
        copyrightText.innerHTML = `&copy; ${currentYear} AtendeMEI. Todos os direitos reservados. Feito por <a href="https://codermaster.com.br" target="_blank" style="color:var(--primary); text-decoration:none; font-weight:600">Coder Master</a>.`;
    }

    // 5. Load Blog Posts
    const blogGrid = document.getElementById('blogGrid');
    if (blogGrid) {
        async function loadBlogPosts() {
            try {
                const response = await fetch('/api/posts');
                if (!response.ok) throw new Error('Falha ao carregar');
                const posts = await response.json();

                if (posts.length === 0) {
                    blogGrid.innerHTML = '<p style="text-align:center; grid-column: 1 / -1; color: var(--text-color);">Nenhum artigo publicado ainda.</p>';
                    return;
                }

                blogGrid.innerHTML = ''; // Limpa "Carregando"

                // Mostra apenas os ultimos 3 no index
                const recentPosts = posts.slice(0, 3);

                recentPosts.forEach((post, index) => {
                    const [year, month, day] = post.date.split('-');
                    const dataFormatada = `${day}/${month}/${year}`;

                    // Imagem default se não tiver
                    const imgSrc = post.image ? post.image : 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

                    const card = document.createElement('div');
                    card.className = `blog-card animate-on-scroll slide-up delay-${index + 1}`;

                    card.innerHTML = `
                        <div class="blog-card-img-wrapper">
                            <img src="${imgSrc}" alt="${post.title}" class="blog-card-img">
                        </div>
                        <div class="blog-card-content">
                            <span class="blog-card-date">${dataFormatada} • Por ${post.author}</span>
                            <h3 class="blog-card-title">${post.title}</h3>
                            <p class="blog-card-resume">${post.resume}</p>
                            <a href="post.html?id=${post.id}" class="blog-card-link">
                                Ler artigo completo <i class="fa-solid fa-arrow-right"></i>
                            </a>
                        </div>
                    `;
                    blogGrid.appendChild(card);
                });

                // Re-observar os novos cards animaveis
                document.querySelectorAll('.blog-card.animate-on-scroll').forEach(el => animateOnScroll.observe(el));

            } catch (error) {
                console.error("Erro no blog:", error);
                blogGrid.innerHTML = '<p style="text-align:center; grid-column: 1 / -1; color: var(--text-color);">Erro ao carregar os artigos. Tente novamente mais tarde.</p>';
            }
        }

        loadBlogPosts();
    }
});
