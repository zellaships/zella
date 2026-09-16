// Zella — shared behavior
// NOTE: the case-study gate below is a UX prototype only. It checks the
// code in the browser, which means it is NOT secure (anyone can view
// source and see the code). When this moves to a real build, the same
// gate UI should call a server route / middleware that checks the code
// before the case study content is ever sent to the browser.

// Prevent browser scroll restoration - run immediately
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Register Service Worker for caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('SW registered:', reg.scope))
      .catch((err) => console.log('SW registration failed:', err));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Also scroll to top after DOM loads in case it shifted
  window.scrollTo(0, 0);

  // Progressive image loading with blur-up effect
  const lazyImages = document.querySelectorAll('img[data-src]');
  if (lazyImages.length > 0) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;

          // Preload the full image
          const fullImage = new Image();
          fullImage.onload = () => {
            img.src = src;
            img.classList.add('loaded');
            img.removeAttribute('data-src');
          };
          fullImage.src = src;

          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '100px 0px', // Start loading 100px before entering viewport
      threshold: 0.01
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  }

  // Mobile nav toggle with overlay
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('nav.doors');

  // Create overlay if it doesn't exist
  let navOverlay = document.querySelector('.nav-overlay');
  if (!navOverlay && nav) {
    navOverlay = document.createElement('div');
    navOverlay.className = 'nav-overlay';
    navOverlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(navOverlay);
  }

  function closeNav() {
    nav.classList.remove('open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    document.body.classList.remove('nav-open');
    if (navOverlay) navOverlay.classList.remove('open');
  }

  function openNav() {
    nav.classList.add('open');
    navToggle.classList.add('active');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('nav-open');
    if (navOverlay) navOverlay.classList.add('open');
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      if (nav.classList.contains('open')) {
        closeNav();
      } else {
        openNav();
      }
    });

    // Close nav when clicking overlay
    if (navOverlay) {
      navOverlay.addEventListener('click', closeNav);
    }

    // Close nav when clicking a link
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeNav);
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        closeNav();
      }
    });
  }

  const gateForm = document.querySelector('[data-gate-form]');
  if (gateForm) {
    const input = gateForm.querySelector('input');
    const error = document.querySelector('[data-gate-error]');
    const content = document.querySelector('[data-cs-content]');
    const gate = document.querySelector('[data-gate]');
    const ACCESS_CODE = '123'; // placeholder — swap per project later

    gateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (input.value.trim() === ACCESS_CODE) {
        gate.style.display = 'none';
        content.classList.add('unlocked');
        const scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        window.scrollTo({ top: 0, behavior: scrollBehavior });
      } else {
        error.classList.add('show');
        input.value = '';
        input.focus();
        setTimeout(() => error.classList.remove('show'), 1600);
      }
    });
  }

  // Simple click-to-expand for artifact placeholders (case studies)
  document.querySelectorAll('.artifact-frame').forEach((frame) => {
    frame.addEventListener('click', () => {
      frame.style.transform = frame.style.transform === 'scale(1.03)' ? '' : 'scale(1.03)';
    });
  });

  // Artist page: sticky year nav + scroll-spy
  const yearLinks = document.querySelectorAll('[data-goto]');
  const yearSections = document.querySelectorAll('[data-year-section]');

  if (yearLinks.length && yearSections.length) {
    yearLinks.forEach((link) => {
      link.addEventListener('click', () => {
        const target = document.getElementById(link.dataset.goto);
        const scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        if (target) target.scrollIntoView({ behavior: scrollBehavior });
      });
    });

    const setActive = (id) => {
      yearLinks.forEach((l) => l.classList.toggle('active', l.dataset.goto === id));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );

    yearSections.forEach((section) => observer.observe(section));
    setActive(yearSections[0].id);
  }

  // Click-and-drag scrolling + popup for art gallery
  const artScroll = document.querySelector('.art-scroll');
  const artContainers = document.querySelectorAll('.art-item .art-frame-img, .art-item .art-video');

  // Shared drag state
  let isDragging = false;
  let hasDragged = false;
  let startY = 0;
  let scrollTop = 0;

  if (artScroll) {
    artScroll.addEventListener('mousedown', (e) => {
      if (e.target.closest('a')) return;
      isDragging = true;
      hasDragged = false;
      startY = e.clientY;
      scrollTop = window.scrollY;
      artScroll.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dy = e.clientY - startY;
      if (Math.abs(dy) > 5) {
        hasDragged = true;
      }
      window.scrollTo(0, scrollTop - dy);
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        artScroll.classList.remove('dragging');
      }
    });
  }

  // Art popup - only opens on click (not drag)
  if (artContainers.length) {
    const allMedia = [];
    artContainers.forEach((container) => {
      const media = container.querySelector('img, video');
      if (media) allMedia.push(media);
    });

    let currentIndex = 0;

    const overlay = document.createElement('div');
    overlay.className = 'art-popup-overlay';
    overlay.innerHTML = `
      <button class="art-popup-close" aria-label="Close"></button>
      <button class="art-popup-nav art-popup-prev" aria-label="Previous"></button>
      <div class="art-popup-content"></div>
      <button class="art-popup-nav art-popup-next" aria-label="Next"></button>
    `;
    document.body.appendChild(overlay);

    const content = overlay.querySelector('.art-popup-content');
    const closeBtn = overlay.querySelector('.art-popup-close');
    const prevBtn = overlay.querySelector('.art-popup-prev');
    const nextBtn = overlay.querySelector('.art-popup-next');

    const showMedia = (index) => {
      currentIndex = index;
      const mediaEl = allMedia[index];
      content.innerHTML = '';

      if (mediaEl.tagName === 'VIDEO') {
        const video = document.createElement('video');
        video.src = mediaEl.querySelector('source')?.src || mediaEl.src;
        video.autoplay = true;
        video.loop = true;
        video.muted = false;
        video.playsInline = true;
        video.controls = true;
        content.appendChild(video);
      } else if (mediaEl.tagName === 'IMG') {
        const img = document.createElement('img');
        img.src = mediaEl.src;
        img.alt = mediaEl.alt || '';
        content.appendChild(img);
      }

      prevBtn.style.visibility = index > 0 ? 'visible' : 'hidden';
      nextBtn.style.visibility = index < allMedia.length - 1 ? 'visible' : 'hidden';
    };

    const openPopup = (mediaEl) => {
      const index = allMedia.indexOf(mediaEl);
      if (index === -1) return;
      showMedia(index);
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closePopup = () => {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      const video = content.querySelector('video');
      if (video) video.pause();
    };

    const goNext = () => {
      if (currentIndex < allMedia.length - 1) {
        const video = content.querySelector('video');
        if (video) video.pause();
        showMedia(currentIndex + 1);
      }
    };

    const goPrev = () => {
      if (currentIndex > 0) {
        const video = content.querySelector('video');
        if (video) video.pause();
        showMedia(currentIndex - 1);
      }
    };

    // Only open popup if we didn't drag
    artContainers.forEach((container) => {
      container.addEventListener('click', (e) => {
        if (hasDragged) {
          hasDragged = false;
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        const media = container.querySelector('img, video');
        if (media) openPopup(media);
      });
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closePopup();
    });

    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goPrev();
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goNext();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePopup();
    });

    content.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('active')) return;
      if (e.key === 'Escape') closePopup();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    });
  }

  // Draggable scroll for browser frame previews
  const draggableViewports = document.querySelectorAll('.browser-viewport');
  draggableViewports.forEach(viewport => {
    const img = viewport.querySelector('.scroll-img-drag');
    if (!img) return;

    let isDragging = false;
    let startY = 0;
    let scrollTop = 0;
    let currentTranslate = 0;

    const getTranslateY = () => {
      const style = window.getComputedStyle(img);
      const matrix = new DOMMatrix(style.transform);
      return matrix.m42;
    };

    const clampTranslate = (value) => {
      const maxScroll = img.offsetHeight - viewport.offsetHeight;
      return Math.max(-maxScroll, Math.min(0, value));
    };

    viewport.addEventListener('mousedown', (e) => {
      isDragging = true;
      startY = e.clientY;
      currentTranslate = getTranslateY();
      viewport.classList.add('is-dragging');
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startY;
      const newTranslate = clampTranslate(currentTranslate + deltaY);
      img.style.transform = `translateY(${newTranslate}px)`;
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        viewport.classList.remove('is-dragging');
      }
    });

    // Touch support
    viewport.addEventListener('touchstart', (e) => {
      isDragging = true;
      startY = e.touches[0].clientY;
      currentTranslate = getTranslateY();
      viewport.classList.add('is-dragging');
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const deltaY = e.touches[0].clientY - startY;
      const newTranslate = clampTranslate(currentTranslate + deltaY);
      img.style.transform = `translateY(${newTranslate}px)`;
    }, { passive: true });

    viewport.addEventListener('touchend', () => {
      isDragging = false;
      viewport.classList.remove('is-dragging');
    });
  });

  // Case study image lightbox with flow navigation
  const flowFrames = document.querySelectorAll('.cs-flow-frame img, .cs-image-full img, .cs-image-grid img, .cs-split-image img');
  if (flowFrames.length) {
    // Build array of all images with their whisper text and flow grouping
    const allImages = [];
    flowFrames.forEach((img, index) => {
      // Find whisper text - could be sibling or parent's sibling
      let whisperText = '';
      const flowItem = img.closest('.cs-flow-item');
      const splitImage = img.closest('.cs-split-image');
      const imageFullWrapper = img.closest('.cs-image-full');

      if (flowItem) {
        const whisper = flowItem.querySelector('.cs-whisper');
        if (whisper) whisperText = whisper.textContent;
      } else if (splitImage) {
        const whisper = splitImage.querySelector('.cs-whisper');
        if (whisper) whisperText = whisper.textContent;
      } else if (imageFullWrapper) {
        const whisper = imageFullWrapper.querySelector('.cs-whisper');
        if (whisper) whisperText = whisper.textContent;
      }

      // Determine flow group (images in same .cs-flow-row)
      const flowRow = img.closest('.cs-flow-row');

      allImages.push({
        img,
        src: img.src,
        alt: img.alt || '',
        whisper: whisperText,
        flowRow: flowRow,
        index
      });
    });

    // Create lightbox overlay with navigation
    const lightbox = document.createElement('div');
    lightbox.className = 'cs-lightbox';
    lightbox.innerHTML = `
      <button class="cs-lightbox-close" aria-label="Close">&times;</button>
      <button class="cs-lightbox-prev" aria-label="Previous">&lsaquo;</button>
      <div class="cs-lightbox-content">
        <img src="" alt="">
        <p class="cs-lightbox-caption"></p>
        <div class="cs-lightbox-counter"></div>
      </div>
      <button class="cs-lightbox-next" aria-label="Next">&rsaquo;</button>
    `;
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector('img');
    const lightboxCaption = lightbox.querySelector('.cs-lightbox-caption');
    const lightboxCounter = lightbox.querySelector('.cs-lightbox-counter');
    const closeBtn = lightbox.querySelector('.cs-lightbox-close');
    const prevBtn = lightbox.querySelector('.cs-lightbox-prev');
    const nextBtn = lightbox.querySelector('.cs-lightbox-next');

    let currentFlowImages = [];
    let currentFlowIndex = 0;

    const showImage = (flowImages, index) => {
      currentFlowImages = flowImages;
      currentFlowIndex = index;
      const item = flowImages[index];

      lightboxImg.src = item.src;
      lightboxImg.alt = item.alt;
      lightboxCaption.textContent = item.whisper;
      lightboxCaption.style.display = item.whisper ? 'block' : 'none';

      // Show/hide navigation and counter for flows
      const isFlow = flowImages.length > 1;
      prevBtn.style.display = isFlow ? 'flex' : 'none';
      nextBtn.style.display = isFlow ? 'flex' : 'none';
      lightboxCounter.style.display = isFlow ? 'block' : 'none';

      if (isFlow) {
        lightboxCounter.textContent = `${index + 1} / ${flowImages.length}`;
        prevBtn.style.opacity = index > 0 ? '1' : '0.3';
        nextBtn.style.opacity = index < flowImages.length - 1 ? '1' : '0.3';
      }
    };

    const openLightbox = (imgData) => {
      // Find all images in the same flow row (if any)
      let flowImages = [imgData];
      let startIndex = 0;

      if (imgData.flowRow) {
        flowImages = allImages.filter(item => item.flowRow === imgData.flowRow);
        startIndex = flowImages.findIndex(item => item.index === imgData.index);
      }

      showImage(flowImages, startIndex);
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    };

    const goNext = () => {
      if (currentFlowIndex < currentFlowImages.length - 1) {
        showImage(currentFlowImages, currentFlowIndex + 1);
      }
    };

    const goPrev = () => {
      if (currentFlowIndex > 0) {
        showImage(currentFlowImages, currentFlowIndex - 1);
      }
    };

    // Click to open
    allImages.forEach(imgData => {
      imgData.img.style.cursor = 'zoom-in';
      imgData.img.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openLightbox(imgData);
      });
    });

    // Navigation handlers
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goPrev();
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goNext();
    });

    // Close handlers
    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    });

    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50;

    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].clientX;
      const swipeDistance = touchEndX - touchStartX;

      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          goPrev(); // Swipe right = previous
        } else {
          goNext(); // Swipe left = next
        }
      }
    }, { passive: true });

    // Trackpad pinch-zoom support - zoom only affects the image
    let currentZoom = 1;
    const minZoom = 1;
    const maxZoom = 4;

    const resetZoom = () => {
      currentZoom = 1;
      lightboxImg.style.transform = 'scale(1)';
      lightboxImg.style.cursor = 'zoom-in';
    };

    // Reset zoom when changing images
    const originalShowImage = showImage;
    showImage = (flowImages, index) => {
      resetZoom();
      originalShowImage(flowImages, index);
    };

    // Wheel event with ctrlKey = trackpad pinch zoom
    lightbox.addEventListener('wheel', (e) => {
      if (!lightbox.classList.contains('active')) return;

      // ctrlKey indicates pinch-zoom gesture on trackpad
      if (e.ctrlKey) {
        e.preventDefault();

        const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
        currentZoom = Math.min(maxZoom, Math.max(minZoom, currentZoom * zoomDelta));

        lightboxImg.style.transform = `scale(${currentZoom})`;
        lightboxImg.style.cursor = currentZoom > 1 ? 'zoom-out' : 'zoom-in';
      }
    }, { passive: false });

    // Click image to toggle zoom
    lightboxImg.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentZoom > 1) {
        resetZoom();
      } else {
        currentZoom = 2;
        lightboxImg.style.transform = 'scale(2)';
        lightboxImg.style.cursor = 'zoom-out';
      }
    });

    // Reset zoom on close
    const originalCloseLightbox = closeLightbox;
    closeLightbox = () => {
      resetZoom();
      originalCloseLightbox();
    };
  }

  // Card glow effect (featured + regular case study cards + designer sidebar)
  const glowElements = document.querySelectorAll('.cs-featured-card, .cs-card, .designer-intro-sidebar, .cs-meta, .cs-hero-metrics');
  if (glowElements.length) {
    // Create a single glow element
    const glow = document.createElement('div');
    glow.className = 'cs-card-glow';
    document.body.appendChild(glow);

    glowElements.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        glow.style.left = `${e.clientX}px`;
        glow.style.top = `${e.clientY}px`;
        glow.style.opacity = '1';
      });

      el.addEventListener('mouseleave', () => {
        glow.style.opacity = '0';
      });
    });
  }

  // ============================================
  // Protected Content Gate (obfuscated)
  // ============================================
  const _0x = 'zv_'; // prefix
  const _k = _0x + 'a' + 'x'; // storage key

  // Hash function for password verification
  const _h = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      h = ((h << 5) - h) + c;
      h = h & h;
    }
    return h.toString(36);
  };

  // Expected hash (not the actual password)
  const _ph = '-dreq7x';

  // Session token generator
  const _st = () => {
    const d = new Date().toDateString();
    return _h(d + navigator.userAgent.slice(0, 20));
  };

  // Decode function
  const _d = (s) => atob(s);

  // Encoded content paths (base64)
  const _c = [
    { h: 'case-study-along.html', i: 'YXNzZXRzL2ltYWdlcy9jemktYXNzZXRzL2Fsb25nLXNob3djYXNlLnBuZw==', t: ['Product Design', 'Responsive', 'Ed Tech'], n: 'Along Mentoring Tool', s: true },
    { h: 'case-study-czi.html', i: 'YXNzZXRzL2ltYWdlcy9jemktYXNzZXRzL2Rhc2hib2FyZC1uZXctY3JvcC5qcGc=', t: ['Product Design', 'Data Visualization', 'Design Systems'], n: 'Chan Zuckerberg Initiative', s: true },
    { h: 'case-study-mru.html', i: 'YXNzZXRzL2ltYWdlcy9tcnUtYXNzZXRzL3Rvb2xraXQtZmxpcGJvb2suZ2lm', t: ['Design Strategy', 'Civic Design', 'Toolkit'], n: 'Mediation Response Unit Toolkit', s: false },
    { h: 'case-study-ipg.html', i: 'YXNzZXRzL2ltYWdlcy9wYWdlcy9pcGctcGhvbmUtdGlnaHQuanBn', t: ['Enterprise UX', 'Workflow Design', 'Mobile Design'], n: 'Interpublic Group', s: false },
    { h: 'case-study-xq.html', i: 'YXNzZXRzL2ltYWdlcy9wYWdlcy94cS1jb3ZlcnMtY3JvcC5qcGc=', t: ['Movement Design', 'Engagement Strategy', 'Design Strategy'], n: 'XQ Institute', s: false }
  ];

  // Verify unlock with session token
  const isUnlocked = () => {
    const stored = localStorage.getItem(_k);
    if (!stored) return false;
    try {
      const data = JSON.parse(stored);
      // Verify token matches current session characteristics
      return data.v === 1 && data.t === _st();
    } catch {
      return false;
    }
  };

  // Build grid with decoded paths
  const _bg = () => {
    return _c.map(x => `
      <a class="cs-card" href="${x.h}">
        <div class="cs-card-image${x.s ? ' cs-card-scroll' : ''}">
          <img src="${_d(x.i)}" alt="${x.n}"${x.s ? ' class="scroll-img"' : ''} loading="lazy">
        </div>
        <ul class="cs-card-tags">
          ${x.t.map(tag => `<li>${tag}</li>`).join('')}
        </ul>
        <h2 class="cs-card-title">${x.n}</h2>
      </a>
    `).join('');
  };

  // Store unlock with session token
  const _su = () => {
    localStorage.setItem(_k, JSON.stringify({ v: 1, t: _st() }));
  };

  const unlockDesignerPage = () => {
    const gateSection = document.getElementById('csGateSection');
    const grid = document.getElementById('csGrid');
    const placeholderSection = document.querySelector('.cs-gate-section');

    if (gateSection) {
      gateSection.classList.add('unlocked');
    }

    // Hide placeholder cards section
    if (placeholderSection) {
      placeholderSection.classList.add('unlocked');
    }

    if (grid) {
      grid.innerHTML = _bg();
      grid.classList.add('unlocked');

      // Add drag-to-scroll for scrolling tiles
      const scrollCards = grid.querySelectorAll('.cs-card-scroll');
      scrollCards.forEach(card => {
        const img = card.querySelector('.scroll-img');
        if (!img) return;

        let isDragging = false;
        let startY = 0;
        let currentTranslate = 0;

        const getTranslateY = () => {
          const style = window.getComputedStyle(img);
          const matrix = new DOMMatrix(style.transform);
          return matrix.m42;
        };

        const clampTranslate = (value) => {
          const maxScroll = img.offsetHeight - card.offsetHeight;
          return Math.max(-maxScroll, Math.min(0, value));
        };

        card.addEventListener('mousedown', (e) => {
          isDragging = true;
          startY = e.clientY;
          currentTranslate = getTranslateY();
          card.classList.add('is-dragging');
          e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          const deltaY = e.clientY - startY;
          const newTranslate = clampTranslate(currentTranslate + deltaY);
          img.style.transform = `translateY(${newTranslate}px)`;
        });

        document.addEventListener('mouseup', () => {
          if (isDragging) {
            isDragging = false;
            card.classList.remove('is-dragging');
          }
        });

        // Touch support
        card.addEventListener('touchstart', (e) => {
          isDragging = true;
          startY = e.touches[0].clientY;
          currentTranslate = getTranslateY();
          card.classList.add('is-dragging');
        }, { passive: true });

        card.addEventListener('touchmove', (e) => {
          if (!isDragging) return;
          const deltaY = e.touches[0].clientY - startY;
          const newTranslate = clampTranslate(currentTranslate + deltaY);
          img.style.transform = `translateY(${newTranslate}px)`;
        }, { passive: true });

        card.addEventListener('touchend', () => {
          isDragging = false;
          card.classList.remove('is-dragging');
        });
      });
    }
  };

  const unlockCaseStudyPage = () => {
    const pageGate = document.querySelector('.cs-page-gate');
    if (pageGate) {
      pageGate.classList.add('unlocked');
    }
  };

  // Check unlock status on page load
  if (isUnlocked()) {
    unlockDesignerPage();
    unlockCaseStudyPage();
  }

  // Designer page gate form
  const csGateForm = document.getElementById('csGateForm');
  if (csGateForm) {
    const input = document.getElementById('csPassword');
    const error = document.getElementById('csGateError');

    csGateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = input.value;

      // Hash comparison instead of plain text
      if (_h(value) === _ph) {
        _su();
        // Inline success message
        error.textContent = '';
        csGateForm.classList.add('success');
        csGateForm.classList.remove('error');
        input.value = '';
        input.placeholder = 'Unlocked';
        input.disabled = true;

        setTimeout(() => {
          unlockDesignerPage();
          csGateForm.classList.remove('success');
          input.placeholder = 'Password';
          input.disabled = false;
        }, 1000);
      } else {
        // Inline error message
        csGateForm.classList.add('shake', 'error');
        csGateForm.classList.remove('success');
        input.value = '';
        input.placeholder = 'Incorrect password';

        setTimeout(() => {
          csGateForm.classList.remove('shake');
        }, 400);

        setTimeout(() => {
          csGateForm.classList.remove('error');
          input.placeholder = 'Password';
          input.focus();
        }, 1500);
      }
    });

    // Click on locked placeholder cards scrolls to password
    const placeholderCards = document.querySelectorAll('.cs-card-placeholder');
    placeholderCards.forEach(card => {
      card.addEventListener('click', () => {
        const gateSection = document.getElementById('csGateSection');
        if (gateSection) {
          gateSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => input.focus(), 400);
        }
      });
    });
  }

  // Case study page protection
  const isCaseStudyPage = document.body.classList.contains('case-study');
  if (isCaseStudyPage && !isUnlocked()) {
    const pageGate = document.createElement('div');
    pageGate.className = 'cs-page-gate';
    pageGate.innerHTML = `
      <div class="cs-gate-box">
        <span class="cs-gate-label">Protected Work</span>
        <form class="cs-gate-form-inline" id="csPageGateForm">
          <input type="password" id="csPagePassword" placeholder="Password" autocomplete="off" spellcheck="false">
          <button type="submit" aria-label="Submit">→</button>
        </form>
        <span class="cs-gate-error" id="csPageGateError"></span>
      </div>
    `;
    document.body.appendChild(pageGate);

    const pageForm = document.getElementById('csPageGateForm');
    const pageInput = document.getElementById('csPagePassword');
    const pageError = document.getElementById('csPageGateError');

    pageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = pageInput.value;

      if (_h(value) === _ph) {
        _su();
        // Show success state before unlocking
        pageError.textContent = '';
        pageForm.classList.add('success');
        pageInput.value = '✓ Unlocked';
        pageInput.disabled = true;

        setTimeout(() => {
          pageGate.classList.add('unlocked');
          pageForm.classList.remove('success');
          pageInput.value = '';
          pageInput.disabled = false;
        }, 800);
      } else {
        pageError.textContent = 'Incorrect password';
        pageForm.classList.add('shake');
        pageInput.value = '';
        pageInput.focus();

        setTimeout(() => {
          pageForm.classList.remove('shake');
          pageError.textContent = '';
        }, 1200);
      }
    });

    setTimeout(() => pageInput.focus(), 100);
  }

  // Dynamic underline hover effect - line appears from mouse entry point
  const underlineLinks = document.querySelectorAll('nav.doors a, .footer-link');
  underlineLinks.forEach(link => {
    link.addEventListener('mouseenter', (e) => {
      const rect = link.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = (x / rect.width) * 100;
      link.style.setProperty('--underline-origin', `${percent}% 50%`);
    });
  });

  // PDF Library tabs
  const libraryTabs = document.querySelectorAll('.cs-library-tab');
  const pdfViewer = document.getElementById('libraryPdfViewer');
  const pdfFullscreen = document.getElementById('libraryPdfFullscreen');
  const pdfDownload = document.getElementById('libraryPdfDownload');

  if (libraryTabs.length && pdfViewer) {
    const pdfMap = {
      '01': 'assets/files/XQ-College-Pathfinder-01-Discovering-Your-Path-To-College.pdf',
      '02': 'assets/files/XQ-College-Pathfinder-02-Building-Your-Support-Network.pdf',
      '03': 'assets/files/XQ-College-Pathfinder-03-Navigating-Your-Academic-Journey.pdf',
      '04': 'assets/files/XQ-College-Pathfinder-04-Paying-for-College.pdf',
      '05': 'assets/files/XQ-College-Pathfinder-05-Applying-to-College.pdf'
    };

    libraryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const guideNum = tab.dataset.guide;
        const pdfPath = pdfMap[guideNum];

        if (!pdfPath) return;

        // Update active state
        libraryTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        // Update PDF viewer
        pdfViewer.src = pdfPath + '#toolbar=0&navpanes=0';

        // Update PDF control links
        if (pdfFullscreen) pdfFullscreen.href = pdfPath;
        if (pdfDownload) pdfDownload.href = pdfPath;
      });
    });
  }

  // ============================================
  // Reading Progress Bar + Reading Time
  // ============================================
  const progressBar = document.querySelector('.reading-progress');
  const progressFill = document.querySelector('.reading-progress-bar');
  const readingTime = document.querySelector('.reading-time');

  if (progressBar && progressFill) {
    // Calculate reading time based on word count
    const mainContent = document.querySelector('main');
    if (mainContent && readingTime) {
      const text = mainContent.innerText || mainContent.textContent;
      const wordCount = text.trim().split(/\s+/).length;
      const minutes = Math.ceil(wordCount / 200); // ~200 words per minute
      readingTime.textContent = `${minutes} min read`;
    }

    let ticking = false;

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      progressFill.style.width = `${progress}%`;

      // Show/hide based on scroll position
      if (scrollTop > 100) {
        progressBar.classList.add('visible');
        if (readingTime) readingTime.classList.add('visible');
      } else {
        progressBar.classList.remove('visible');
        if (readingTime) readingTime.classList.remove('visible');
      }

      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });

    // Initial check
    updateProgress();
  }
});
