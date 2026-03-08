// ================================================================
// RitmoUp Landing — Detecção de plataforma e redirecionamento
// ================================================================

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.ritmoup.app';
const APP_LINK_URL = 'https://app.ritmoup.com.br/login'; // App Link: abre o app se instalado
const PWA_URL = 'https://app.ritmoup.com.br/login';
const REGISTER_URL = 'https://app.ritmoup.com.br/register';

// Android: tenta abrir via App Link (abre o app se instalado),
// com fallback para Play Store após 1.5s se não estiver instalado
function openAndroid(e) {
    e.preventDefault();
    window.location.href = APP_LINK_URL;
    setTimeout(() => {
        if (!document.hidden) {
            window.location.href = PLAY_STORE_URL;
        }
    }, 1500);
}

// Detecta o SO do usuário
function getDevice() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
    if (/android/i.test(ua)) return 'android';
    return 'desktop';
}

// Aplica o redirecionamento correto nos botões CTA
function setupCTA() {
    const device = getDevice();
    const ctaPrimary = document.getElementById('cta-primary');
    const ctaLabel = document.getElementById('cta-label');
    const ctaFinal = document.getElementById('cta-final');
    const navComecar = document.getElementById('nav-comecar');
    const navEntrar = document.getElementById('nav-entrar');

    if (device === 'android') {
        // Android → App Link (abre app se instalado) com fallback para Play Store
        if (ctaLabel) ctaLabel.textContent = 'Abrir / Baixar App';
        if (ctaPrimary) { ctaPrimary.href = APP_LINK_URL; ctaPrimary.addEventListener('click', openAndroid); }
        if (ctaFinal) { ctaFinal.textContent = 'Abrir / Baixar App'; ctaFinal.href = APP_LINK_URL; ctaFinal.addEventListener('click', openAndroid); }
        if (navComecar) { navComecar.textContent = 'Abrir App'; navComecar.href = APP_LINK_URL; navComecar.addEventListener('click', openAndroid); }

    } else if (device === 'ios') {
        // iOS → PWA (login page — o banner de instalação aparece lá)
        if (ctaLabel) ctaLabel.textContent = 'Acessar no iPhone';
        if (ctaPrimary) ctaPrimary.href = PWA_URL;
        if (ctaFinal) { ctaFinal.textContent = 'Acessar no iPhone'; ctaFinal.href = PWA_URL; }
        if (navComecar) { navComecar.textContent = 'Acessar App'; navComecar.href = PWA_URL; }
        if (navEntrar) navEntrar.href = PWA_URL;

    } else {
        // Desktop → cadastro web
        if (ctaLabel) ctaLabel.textContent = 'Começar Gratuitamente';
        if (ctaPrimary) ctaPrimary.href = REGISTER_URL;
        if (ctaFinal) { ctaFinal.textContent = 'Criar Conta Grátis'; ctaFinal.href = REGISTER_URL; }
    }
}


// Navbar: fundo sólido ao rolar
function setupNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        navbar.style.borderBottomColor = window.scrollY > 60
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(255,255,255,0.05)';
    }, { passive: true });
}

// Scroll suave para links âncora
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const id = a.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

// Observer para animações
function setupAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once animated
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate-hidden');
    animatedElements.forEach(el => observer.observe(el));

    // Dynamic glow in Hero
    const hero = document.getElementById('inicio');
    const glow = document.querySelector('.hero-glow');
    if (hero && glow) {
        hero.addEventListener('mousemove', (e) => {
            const rect = hero.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Move glow towards mouse slowly
            glow.style.transform = `translate(calc(-50% + ${(x - rect.width / 2) * 0.1}px), ${(y - rect.height / 2) * 0.1}px)`;
        });
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    setupCTA();
    setupNavbar();
    setupSmoothScroll();
    setupAnimations();
});
