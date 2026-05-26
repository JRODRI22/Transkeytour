// ========================================
// GSAP INITIALIZATION
// ========================================

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Configuración global de GSAP
gsap.defaults({
    ease: "power2.out",
    duration: 0.8
});

// ========================================
// LOADING ANIMATION
// ========================================

window.addEventListener('load', () => {
    // Hero entrance animation
    const heroTimeline = gsap.timeline();
    
    heroTimeline
        .from('.hero-title .subtitle', {
            y: 50,
            opacity: 0,
            duration: 1
        })
        .from('.hero-title', {
            y: 80,
            opacity: 0,
            duration: 1.2,
            ease: "power3.out"
        }, "-=0.6")
        .from('.hero-description', {
            y: 30,
            opacity: 0,
            duration: 1
        }, "-=0.8")
        .from('.hero-badges .badge', {
            scale: 0,
            opacity: 0,
            stagger: 0.2,
            ease: "back.out(1.7)"
        }, "-=0.6")
        .from('.hero-cta .btn', {
            y: 30,
            opacity: 0,
            stagger: 0.15
        }, "-=0.4");
});

// ========================================
// PARALLAX EFFECT ON HERO
// ========================================

gsap.to('.hero::before', {
    yPercent: 50,
    ease: "none",
    scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1
    }
});

// ========================================
// SCROLL ANIMATIONS - Cards y Secciones
// ========================================

// Animación para las cards de salida
gsap.from('.salida-card', {
    scrollTrigger: {
        trigger: '.salidas-grid',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
    },
    y: 50,
    opacity: 0,
    stagger: 0.1,
    duration: 0.8
});

// Animación para "Qué Incluye"
gsap.from('.incluye-card', {
    scrollTrigger: {
        trigger: '.incluye-grid',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
    },
    scale: 0.8,
    opacity: 0,
    y: 50,
    stagger: {
        amount: 0.6,
        from: "start"
    },
    ease: "back.out(1.4)"
});

// Animación para Galería con efecto stagger
gsap.from('.galeria-item', {
    scrollTrigger: {
        trigger: '.galeria-grid',
        start: 'top 70%',
        toggleActions: 'play none none reverse'
    },
    scale: 0.5,
    opacity: 0,
    rotation: -5,
    stagger: {
        amount: 0.8,
        grid: "auto",
        from: "center"
    },
    ease: "power2.out",
    duration: 1
});

// Animación para Destinos
gsap.from('.destino-card', {
    scrollTrigger: {
        trigger: '.destinos-grid',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
    },
    y: 100,
    opacity: 0,
    stagger: 0.15,
    duration: 1,
    ease: "power3.out"
});

// Animación para Cards de Precio con Scale
gsap.from('.precio-card', {
    scrollTrigger: {
        trigger: '.precios-cards',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
    },
    scale: 0.7,
    opacity: 0,
    y: 50,
    stagger: 0.2,
    duration: 1,
    ease: "back.out(1.4)"
});

// Animación para Requisitos
gsap.from('.requisito-card', {
    scrollTrigger: {
        trigger: '.requisitos-grid',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
    },
    x: -50,
    opacity: 0,
    stagger: 0.1,
    duration: 0.8
});

// Animación para Formulario de Contacto
gsap.from('.contacto-form-wrapper', {
    scrollTrigger: {
        trigger: '.contacto-content',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
    },
    x: 100,
    opacity: 0,
    duration: 1,
    ease: "power3.out"
});

gsap.from('.contacto-info', {
    scrollTrigger: {
        trigger: '.contacto-content',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
    },
    x: -100,
    opacity: 0,
    duration: 1,
    ease: "power3.out"
});

// ========================================
// COUNTER ANIMATION PARA PRECIOS
// ========================================

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'));
    const duration = 2;
    
    gsap.to(element, {
        innerText: target,
        duration: duration,
        ease: "power1.out",
        snap: { innerText: 1 },
        onUpdate: function() {
            element.innerText = Math.floor(element.innerText).toLocaleString('es-CR');
        }
    });
}

// Counter del Hero (al cargar)
window.addEventListener('load', () => {
    const heroPrice = document.querySelector('.hero-price[data-hero-count]');
    if (heroPrice) {
        const target = parseInt(heroPrice.getAttribute('data-hero-count'));
        gsap.to(heroPrice, {
            innerText: target,
            duration: 2.5,
            delay: 1.5,
            ease: "power1.out",
            snap: { innerText: 1 },
            onUpdate: function() {
                heroPrice.innerText = Math.floor(heroPrice.innerText).toLocaleString('es-CR');
            }
        });
    }
});

// Activar counters de precios al hacer scroll
ScrollTrigger.create({
    trigger: '.precios',
    start: 'top 60%',
    onEnter: () => {
        document.querySelectorAll('.amount[data-count]').forEach(animateCounter);
    },
    once: true
});

// ========================================
// SECTION TITLES ANIMATION
// ========================================

gsap.utils.toArray('.section-title').forEach(title => {
    gsap.from(title, {
        scrollTrigger: {
            trigger: title,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 50,
        duration: 1
    });
});

gsap.utils.toArray('.section-subtitle').forEach(subtitle => {
    gsap.from(subtitle, {
        scrollTrigger: {
            trigger: subtitle,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.2
    });
});

// ========================================
// LIGHTBOX PARA GALERÍA
// ========================================

const lightboxImages = [
    {
        src: 'https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=1600',
        caption: 'Playas Paradisíacas de Bocas del Toro'
    },
    {
        src: 'https://images.pexels.com/photos/1320684/pexels-photo-1320684.jpeg?auto=compress&cs=tinysrgb&w=1600',
        caption: 'Snorkeling en Aguas Cristalinas'
    },
    {
        src: 'https://images.pexels.com/photos/1007427/pexels-photo-1007427.jpeg?auto=compress&cs=tinysrgb&w=1600',
        caption: 'Estrellas de Mar en Playa de las Estrellas'
    },
    {
        src: 'https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg?auto=compress&cs=tinysrgb&w=1600',
        caption: 'Tours en Lancha por el Caribe'
    },
    {
        src: 'https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg?auto=compress&cs=tinysrgb&w=1600',
        caption: 'Atardeceres Únicos'
    },
    {
        src: 'https://images.pexels.com/photos/2587054/pexels-photo-2587054.jpeg?auto=compress&cs=tinysrgb&w=1600',
        caption: 'Vida Marina Espectacular'
    }
];

let currentLightboxIndex = 0;

function openLightbox(index) {
    currentLightboxIndex = index;
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    const caption = document.getElementById('lightbox-caption');
    
    img.src = lightboxImages[index].src;
    caption.textContent = lightboxImages[index].caption;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function changeLightboxImage(direction) {
    currentLightboxIndex += direction;
    
    if (currentLightboxIndex < 0) {
        currentLightboxIndex = lightboxImages.length - 1;
    } else if (currentLightboxIndex >= lightboxImages.length) {
        currentLightboxIndex = 0;
    }
    
    const img = document.getElementById('lightbox-img');
    const caption = document.getElementById('lightbox-caption');
    
    img.style.opacity = '0';
    setTimeout(() => {
        img.src = lightboxImages[currentLightboxIndex].src;
        caption.textContent = lightboxImages[currentLightboxIndex].caption;
        img.style.opacity = '1';
    }, 150);
}

// Teclas del teclado para el lightbox
document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox.classList.contains('active')) {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            changeLightboxImage(-1);
        } else if (e.key === 'ArrowRight') {
            changeLightboxImage(1);
        }
    }
});

// ========================================
// MENÚ MÓVIL
// ========================================

const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        
        // Animación del botón hamburguesa
        const spans = mobileMenuToggle.querySelectorAll('span');
        if (navLinks.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });

    // Cerrar menú al hacer click en un enlace
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const spans = mobileMenuToggle.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        });
    });
}

// ========================================
// NAVBAR AL SCROLL
// ========================================

const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
    }
    
    lastScroll = currentScroll;
});

// ========================================
// SMOOTH SCROLL PARA ENLACES
// ========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const navbarHeight = navbar.offsetHeight;
            const targetPosition = target.offsetTop - navbarHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ========================================
// ANIMACIÓN AL SCROLL (Intersection Observer)
// ========================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.8s ease-out forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Elementos a animar
const elementsToAnimate = document.querySelectorAll(`
    .incluye-card,
    .destino-card,
    .precio-card,
    .salida-card,
    .requisito-card
`);

elementsToAnimate.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.animationDelay = `${index * 0.1}s`;
    observer.observe(el);
});

// ========================================
// FORMULARIO DE CONTACTO
// ========================================

const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Obtener valores del formulario
        const formData = {
            nombre: document.getElementById('nombre').value,
            telefono: document.getElementById('telefono').value,
            email: document.getElementById('email').value,
            personas: document.getElementById('personas').value,
            mensaje: document.getElementById('mensaje').value
        };
        
        // Crear mensaje para WhatsApp
        const whatsappMessage = `
*Nueva Solicitud - Transkeytour Bocas Tours*

👤 *Nombre:* ${formData.nombre}
📱 *Teléfono:* ${formData.telefono}
📧 *Email:* ${formData.email}
👥 *Personas:* ${formData.personas}

💬 *Mensaje:*
${formData.mensaje || 'Sin mensaje adicional'}

📅 *Tour:* Bocas del Toro 16-19 Julio 2026
        `.trim();
        
        // Codificar mensaje para URL
        const encodedMessage = encodeURIComponent(whatsappMessage);
        
        // Aquí deberías poner tu número de WhatsApp (ejemplo: 50612345678)
        // Formato: código país + número sin espacios ni guiones
        const phoneNumber = '50612345678'; // CAMBIA ESTE NÚMERO
        
        // Abrir WhatsApp
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        
        // Mostrar mensaje de confirmación
        showNotification('¡Gracias! Te estamos redirigiendo a WhatsApp para finalizar tu reserva.');
        
        // Reset form
        contactForm.reset();
    });
}

// ========================================
// NOTIFICACIONES
// ========================================

function showNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #00B4D8, #0096C7);
        color: white;
        padding: 1rem 2rem;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 180, 216, 0.3);
        z-index: 10000;
        animation: slideInRight 0.5s ease-out;
        max-width: 400px;
        font-weight: 500;
    `;
    notification.textContent = message;
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Remover después de 4 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease-out';
        setTimeout(() => notification.remove(), 500);
    }, 4000);
}

// Agregar estilos de animación para notificaciones
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyles);

// ========================================
// CONTADOR DE CUPOS (Opcional - Simulado)
// ========================================

let cuposRestantes = 15; // Cambia según tus cupos reales

function actualizarCupos() {
    const cuposElements = document.querySelectorAll('.cupos-restantes');
    cuposElements.forEach(el => {
        el.textContent = cuposRestantes;
        
        // Cambiar color si quedan pocos cupos
        if (cuposRestantes <= 5) {
            el.style.color = '#F72585';
        }
    });
}

// Simular reservas (solo para demo - quitar en producción)
setInterval(() => {
    if (cuposRestantes > 0 && Math.random() > 0.7) {
        cuposRestantes--;
        actualizarCupos();
    }
}, 30000); // Cada 30 segundos

// ========================================
// PRELOADER (Opcional)
// ========================================

window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// ========================================
// SCROLL TO TOP BUTTON (Opcional)
// ========================================

function createScrollTopButton() {
    const button = document.createElement('button');
    button.innerHTML = '↑';
    button.className = 'scroll-top-btn';
    button.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 55px;
        height: 55px;
        border-radius: 50%;
        background: linear-gradient(135deg, #00B4D8, #0096C7);
        color: white;
        border: none;
        font-size: 1.75rem;
        cursor: pointer;
        opacity: 0;
        transform: scale(0);
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        z-index: 1000;
        box-shadow: 0 4px 20px rgba(0, 180, 216, 0.4);
    `;
    
    document.body.appendChild(button);
    
    // GSAP ScrollTrigger para mostrar/ocultar
    ScrollTrigger.create({
        start: 'top -500',
        end: 99999,
        toggleClass: {className: 'visible', targets: button},
        onUpdate: (self) => {
            if (self.direction === -1 && window.scrollY > 500) {
                gsap.to(button, {
                    opacity: 1,
                    scale: 1,
                    duration: 0.3
                });
            } else if (self.direction === 1 && window.scrollY < 500) {
                gsap.to(button, {
                    opacity: 0,
                    scale: 0,
                    duration: 0.3
                });
            }
        }
    });
    
    button.addEventListener('click', () => {
        gsap.to(window, {
            scrollTo: 0,
            duration: 1.5,
            ease: "power3.inOut"
        });
    });
    
    button.addEventListener('mouseenter', () => {
        gsap.to(button, {
            scale: 1.15,
            boxShadow: '0 8px 30px rgba(0, 180, 216, 0.5)',
            duration: 0.3
        });
    });
    
    button.addEventListener('mouseleave', () => {
        gsap.to(button, {
            scale: 1,
            boxShadow: '0 4px 20px rgba(0, 180, 216, 0.4)',
            duration: 0.3
        });
    });
}

createScrollTopButton();

// ========================================
// LAZY LOADING PARA IMÁGENES (Si agregas imágenes)
// ========================================

const lazyImages = document.querySelectorAll('img[data-src]');

const lazyImageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            lazyImageObserver.unobserve(img);
        }
    });
});

lazyImages.forEach(img => lazyImageObserver.observe(img));

// ========================================
// INICIALIZACIÓN
// ========================================

console.log('%c🌴 Transkeytour Bocas Tours 🌴', 'color: #00B4D8; font-size: 24px; font-weight: bold;');
console.log('%cWeb desarrollada con ❤️', 'color: #F72585; font-size: 14px;');
