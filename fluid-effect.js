// Magnetic Scatter Text Effect + Soft Glow Trail with Scroll Color Shift
(function() {
  console.log('🎨 Fluid effect: Script loaded');

  // ===== RESPECT USER MOTION PREFERENCES =====
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // ===== CHECK PAGE TYPE =====
  const isHomePage = document.body.classList.contains('home-locked');
  const canvas = document.getElementById('ink-canvas');

  console.log('🎨 Fluid effect: isHomePage =', isHomePage, 'canvas =', canvas);

  // ===== NON-HOME PAGES: Text-clip glow effect (glow only visible inside text) =====
  if (!isHomePage) {
    // Hide canvas on non-home pages
    if (canvas) {
      canvas.style.display = 'none';
    }

    // ALL non-home pages get the text-clip blurple effect
    // Get all headings in main, then filter out ones inside explore section
    const allHeadings = document.querySelectorAll('main h1, main h2, main h3');
    const textElements = Array.from(allHeadings).filter(el => {
      // Exclude elements inside the explore section entirely
      return !el.closest('.cs-explore--brutalist');
    });

    console.log('🎨 Text elements for glow effect:', textElements.length);

    if (!textElements.length) return;

    let mouseX = -1000;
    let mouseY = -1000;
    let currentHue = 250; // blurple

    // Track mouse
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Scroll changes hue (keep in blurple range)
    document.addEventListener('wheel', (e) => {
      currentHue += e.deltaY * 0.1;
      if (currentHue > 280) currentHue = 220;
      if (currentHue < 220) currentHue = 280;
    });

    // Animation loop
    function animateTextGlow() {
      textElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const relX = mouseX - rect.left;
        const relY = mouseY - rect.top;

        // Blurple inside letters, black outside
        const gradient = `radial-gradient(circle 120px at ${relX}px ${relY}px, hsl(${currentHue}, 85%, 55%) 0%, hsl(${currentHue}, 70%, 40%) 50%, #000 80%)`;
        el.style.cssText = `
          background: ${gradient} !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
        `;
      });
      requestAnimationFrame(animateTextGlow);
    }
    animateTextGlow();

    return; // Exit early, don't run homepage effects
  }

  // ===== HOMEPAGE ONLY: Soft Glow Trail with ORB =====
  let trailMouse = { x: -1000, y: -1000 };
  let smoothMouse = { x: -1000, y: -1000 };
  let targetMouse = { x: -1000, y: -1000 };
  let speed = 0;
  let lastX = -1000, lastY = -1000;
  let mouseOnPage = false;

  // Color hue controlled by scroll (180 = turquoise, 210 = vibrant blue, 235 = blurple)
  let currentHue = 195;
  let targetHue = 195;

  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      function resize() {
        canvas.width = window.innerWidth * window.devicePixelRatio;
        canvas.height = window.innerHeight * window.devicePixelRatio;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
      resize();
      window.addEventListener('resize', resize);

      const trail = [];
      const maxTrail = 60;

      document.addEventListener('mousemove', (e) => {
        targetMouse.x = e.clientX;
        targetMouse.y = e.clientY;
        if (!mouseOnPage) {
          // First mouse event - snap to position instead of animating from far away
          smoothMouse.x = e.clientX;
          smoothMouse.y = e.clientY;
          trailMouse.x = e.clientX;
          trailMouse.y = e.clientY;
          lastX = e.clientX;
          lastY = e.clientY;
          mouseOnPage = true;
        }
      });

      document.addEventListener('mouseleave', () => {
        mouseOnPage = false;
        targetMouse.x = -1000;
        targetMouse.y = -1000;
      });

      document.addEventListener('wheel', (e) => {
        targetHue += e.deltaY * 0.1;
        if (targetHue > 230) targetHue = 180;
        if (targetHue < 180) targetHue = 230;
      });

      function hslColor(h, s, l, a) {
        const invertedHue = (h + 180) % 360;
        return `hsla(${invertedHue}, ${s}%, ${l}%, ${a})`;
      }

      function animateTrail() {
        // Skip animation if user prefers reduced motion
        if (prefersReducedMotion) return;

        ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

        // Only draw when mouse is on page
        if (!mouseOnPage) {
          trail.length = 0; // Clear trail when mouse leaves
          requestAnimationFrame(animateTrail);
          return;
        }

        smoothMouse.x += (targetMouse.x - smoothMouse.x) * 0.18;
        smoothMouse.y += (targetMouse.y - smoothMouse.y) * 0.18;
        trailMouse.x = smoothMouse.x;
        trailMouse.y = smoothMouse.y;

        currentHue += (targetHue - currentHue) * 0.08;

        const dx = trailMouse.x - lastX;
        const dy = trailMouse.y - lastY;
        speed = Math.sqrt(dx * dx + dy * dy);
        lastX = trailMouse.x;
        lastY = trailMouse.y;

        trail.push({ x: trailMouse.x, y: trailMouse.y, hue: currentHue });
        while (trail.length > maxTrail) {
          trail.shift();
        }

        if (trail.length > 1) {
          for (let i = 0; i < trail.length; i++) {
            const point = trail[i];
            const progress = i / trail.length;
            const h = point.hue;

            const baseSize = 20 + progress * 35;
            const size = baseSize + Math.min(speed * 0.2, 10);
            const alpha = progress * 0.12;

            const outerGlow = ctx.createRadialGradient(
              point.x, point.y, 0,
              point.x, point.y, size * 1.5
            );
            outerGlow.addColorStop(0, hslColor(h, 95, 70, alpha * 0.5));
            outerGlow.addColorStop(0.4, hslColor(h, 90, 65, alpha * 0.25));
            outerGlow.addColorStop(1, hslColor(h, 85, 60, 0));

            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size * 1.5, 0, Math.PI * 2);
            ctx.fill();

            const innerGlow = ctx.createRadialGradient(
              point.x, point.y, 0,
              point.x, point.y, size
            );
            innerGlow.addColorStop(0, hslColor(h, 100, 65, alpha * 0.6));
            innerGlow.addColorStop(0.5, hslColor(h, 95, 60, alpha * 0.3));
            innerGlow.addColorStop(1, hslColor(h, 90, 55, 0));

            ctx.fillStyle = innerGlow;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        const tipSize = 30 + Math.min(speed * 0.3, 12);
        const h = currentHue;

        const halo = ctx.createRadialGradient(
          trailMouse.x, trailMouse.y, 0,
          trailMouse.x, trailMouse.y, tipSize * 1.8
        );
        halo.addColorStop(0, hslColor(h, 95, 65, 0.2));
        halo.addColorStop(0.3, hslColor(h, 90, 60, 0.1));
        halo.addColorStop(0.6, hslColor(h, 85, 55, 0.04));
        halo.addColorStop(1, hslColor(h, 80, 50, 0));

        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(trailMouse.x, trailMouse.y, tipSize * 1.8, 0, Math.PI * 2);
        ctx.fill();

        const core = ctx.createRadialGradient(
          trailMouse.x, trailMouse.y, 0,
          trailMouse.x, trailMouse.y, tipSize
        );
        core.addColorStop(0, hslColor(h, 100, 60, 0.28));
        core.addColorStop(0.3, hslColor(h, 95, 55, 0.15));
        core.addColorStop(0.6, hslColor(h, 90, 50, 0.06));
        core.addColorStop(1, hslColor(h, 85, 45, 0));

        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(trailMouse.x, trailMouse.y, tipSize, 0, Math.PI * 2);
        ctx.fill();

        const dot = ctx.createRadialGradient(
          trailMouse.x, trailMouse.y, 0,
          trailMouse.x, trailMouse.y, 6
        );
        dot.addColorStop(0, hslColor(h, 100, 55, 0.18));
        dot.addColorStop(0.5, hslColor(h, 95, 50, 0.08));
        dot.addColorStop(1, hslColor(h, 90, 45, 0));

        ctx.fillStyle = dot;
        ctx.beginPath();
        ctx.arc(trailMouse.x, trailMouse.y, 6, 0, Math.PI * 2);
        ctx.fill();

        requestAnimationFrame(animateTrail);
      }
      animateTrail();
    }
  }

  // ===== MAGNETIC SCATTER TEXT (HOME PAGE ONLY) =====
  if (!isHomePage) return; // Only scatter text on homepage

  const heroText = document.querySelector('.essay-wide h1');
  if (!heroText) return;

  const text = heroText.textContent;
  const mouse = { x: -1000, y: -1000 };

  const words = text.split(' ');
  let html = words.map(word => {
    const letters = word.split('').map(char =>
      `<span class="hero-letter">${char}</span>`
    ).join('');
    return `<span class="hero-word">${letters}</span>`;
  }).join(' ');

  heroText.innerHTML = html;

  const letterElements = heroText.querySelectorAll('.hero-letter');

  const style = document.createElement('style');
  style.textContent = `
    .essay-wide h1 {
      line-height: 1.4;
    }
    .hero-word {
      display: inline-block;
      white-space: nowrap;
    }
    .hero-letter {
      display: inline-block;
      will-change: transform;
      cursor: default;
    }
  `;
  document.head.appendChild(style);

  const letters = [];
  letterElements.forEach((el) => {
    letters.push({
      el: el,
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      rotation: 0,
      targetRotation: 0
    });
  });

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  const radius = 60;
  const strength = 80;

  function animate() {
    // Skip animation if user prefers reduced motion
    if (prefersReducedMotion) return;

    letters.forEach((letter) => {
      const rect = letter.el.getBoundingClientRect();
      const letterX = rect.left + rect.width / 2 - letter.x;
      const letterY = rect.top + rect.height / 2 - letter.y;

      const deltaX = mouse.x - letterX;
      const deltaY = mouse.y - letterY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < radius && distance > 0) {
        const force = Math.pow((radius - distance) / radius, 2);
        const angle = Math.atan2(deltaY, deltaX);

        letter.targetX = -Math.cos(angle) * force * strength;
        letter.targetY = -Math.sin(angle) * force * strength;
        letter.targetRotation = (Math.random() - 0.5) * force * 30;
      } else {
        letter.targetX = 0;
        letter.targetY = 0;
        letter.targetRotation = 0;
      }

      letter.x += (letter.targetX - letter.x) * 0.08;
      letter.y += (letter.targetY - letter.y) * 0.08;
      letter.rotation += (letter.targetRotation - letter.rotation) * 0.08;

      letter.el.style.transform = `translate(${letter.x}px, ${letter.y}px) rotate(${letter.rotation}deg)`;
    });

    requestAnimationFrame(animate);
  }

  animate();
})();
