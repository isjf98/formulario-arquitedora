// ── ARQUITEDORA — JavaScript (Navegação Fluida, Scroll & Animações) ──

// Smooth scroll to target section with pulse animation
function scrollToSection(sectionId) {
  const target = document.getElementById(sectionId);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Highlight target title on click navigation
    const title = target.querySelector('h1');
    if (title) {
      title.classList.remove('pulse-glow');
      void title.offsetWidth; // trigger reflow
      title.classList.add('pulse-glow');
    }

    if (history.pushState) {
      history.pushState(null, null, '#' + sectionId);
    } else {
      location.hash = '#' + sectionId;
    }
  }
}

// Smooth scroll to top (Hero Header / Menu Grid)
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (history.pushState) {
    history.pushState(null, null, window.location.pathname);
  }
}

// Fixed Back-to-Menu button visibility on scroll
window.addEventListener('scroll', () => {
  const btn = document.getElementById('btnFixedMenu');
  if (btn) {
    if (window.scrollY > 350) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }
});

// Handle browser Back / Forward buttons smoothly
window.addEventListener('popstate', () => {
  const hash = location.hash.replace('#', '');
  if (hash) {
    const target = document.getElementById(hash);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// ── SCROLL REVEAL INTERSECTION OBSERVER ──
document.addEventListener('DOMContentLoaded', () => {
  // Elements to reveal on scroll
  const revealElements = document.querySelectorAll(
    '.site-section h1, .site-section p, .service-icon-large, .sobre-image-area, .contato-icon-area, .project-showcase, .observacoes-section, .btn-formulario'
  );

  revealElements.forEach(el => el.classList.add('reveal-on-scroll'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealElements.forEach(el => observer.observe(el));
});




// ── LIGHTBOX MODAL DE PROJETOS COM CARROSSEL DE NAVEGAÇÃO COMPLETO ──
let currentGalleryImages = [];
let currentImageIndex = 0;

function openLightbox(src, alt, evt) {
  let modal = document.getElementById('globalLightboxModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'globalLightboxModal';
    modal.className = 'lightbox-modal';
    modal.innerHTML = `
      <span class="lightbox-close" onclick="closeLightbox()">&times;</span>
      <div class="lightbox-counter" id="globalLightboxCounter"></div>
      <button class="lightbox-nav lightbox-prev" id="lightboxPrevBtn" onclick="prevLightboxImage(event)">&lsaquo;</button>
      <div class="lightbox-image-container">
        <img src="" alt="" class="lightbox-content" id="globalLightboxImg">
        <div class="lightbox-caption" id="globalLightboxCaption"></div>
      </div>
      <button class="lightbox-nav lightbox-next" id="lightboxNextBtn" onclick="nextLightboxImage(event)">&rsaquo;</button>
    `;
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('lightbox-image-container')) closeLightbox();
    });
    
    document.addEventListener('keydown', (e) => {
      const activeModal = document.getElementById('globalLightboxModal');
      if (!activeModal || !activeModal.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevLightboxImage(e);
      if (e.key === 'ArrowRight') nextLightboxImage(e);
    });
  }

  let eventObj = evt || window.event;
  let triggerEl = eventObj ? (eventObj.currentTarget || eventObj.target) : null;
  
  if (!triggerEl && src) {
    const allImgs = Array.from(document.querySelectorAll('img[onclick*="openLightbox"]'));
    triggerEl = allImgs.find(i => i.src === src || i.getAttribute('src') === src);
  }

  const activeSection = triggerEl ? triggerEl.closest('.site-section, .page, .inner-page, section') : document.body;
  const sectionImgs = Array.from(activeSection.querySelectorAll('img[onclick*="openLightbox"]'));

  if (sectionImgs.length > 0) {
    currentGalleryImages = sectionImgs.map(i => ({ 
      src: i.src, 
      alt: i.alt || i.getAttribute('alt') || '' 
    }));
    currentImageIndex = currentGalleryImages.findIndex(i => i.src === src);
    if (currentImageIndex === -1) currentImageIndex = 0;
  } else {
    currentGalleryImages = [{ src: src, alt: alt || '' }];
    currentImageIndex = 0;
  }

  updateLightboxView();
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function updateLightboxView() {
  const img = document.getElementById('globalLightboxImg');
  const caption = document.getElementById('globalLightboxCaption');
  const counter = document.getElementById('globalLightboxCounter');
  const prevBtn = document.getElementById('lightboxPrevBtn');
  const nextBtn = document.getElementById('lightboxNextBtn');

  if (currentGalleryImages.length > 0) {
    const item = currentGalleryImages[currentImageIndex];
    img.src = item.src;
    img.alt = item.alt || '';
    caption.textContent = item.alt || '';

    if (currentGalleryImages.length > 1) {
      counter.textContent = `${currentImageIndex + 1} / ${currentGalleryImages.length}`;
      counter.style.display = 'block';
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    } else {
      counter.style.display = 'none';
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    }
  }
}

function prevLightboxImage(e) {
  if (e) e.stopPropagation();
  if (currentGalleryImages.length <= 1) return;
  currentImageIndex = (currentImageIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
  updateLightboxView();
}

function nextLightboxImage(e) {
  if (e) e.stopPropagation();
  if (currentGalleryImages.length <= 1) return;
  currentImageIndex = (currentImageIndex + 1) % currentGalleryImages.length;
  updateLightboxView();
}

function closeLightbox() {
  const modal = document.getElementById('globalLightboxModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}
