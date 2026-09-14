// Fluid Ink Trail Effect
(function() {
  // Respect user motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const canvas = document.getElementById('ink-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Resize canvas to full window
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Mouse tracking with easing
  const mouse = { x: 0, y: 0 };
  const smoothMouse = { x: 0, y: 0 };
  const prevMouse = { x: 0, y: 0 };
  let isMoving = false;
  let moveTimeout;

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    isMoving = true;
    clearTimeout(moveTimeout);
    moveTimeout = setTimeout(() => { isMoving = false; }, 100);
  });

  // Ink blob particles
  class InkBlob {
    constructor(x, y, vx, vy) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.radius = Math.random() * 60 + 40;
      this.life = 1;
      this.decay = Math.random() * 0.008 + 0.004;
      // Deep red/maroon color palette
      const hue = Math.random() * 20 - 10; // -10 to 10 around red
      this.color = `hsla(${hue}, 70%, 45%, `;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.98;
      this.vy *= 0.98;
      this.life -= this.decay;
      this.radius *= 0.995;
    }

    draw() {
      if (this.life <= 0) return;

      const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.radius
      );

      const alpha = this.life * 0.4;
      gradient.addColorStop(0, this.color + alpha + ')');
      gradient.addColorStop(0.5, this.color + (alpha * 0.5) + ')');
      gradient.addColorStop(1, this.color + '0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const blobs = [];
  let frameCount = 0;

  function animate() {
    // Smooth mouse following
    smoothMouse.x += (mouse.x - smoothMouse.x) * 0.15;
    smoothMouse.y += (mouse.y - smoothMouse.y) * 0.15;

    // Clear with fade effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add new blobs when mouse moves
    if (isMoving && frameCount % 2 === 0) {
      const dx = smoothMouse.x - prevMouse.x;
      const dy = smoothMouse.y - prevMouse.y;
      const speed = Math.sqrt(dx * dx + dy * dy);

      if (speed > 2) {
        // Create blob with velocity based on mouse movement
        const blob = new InkBlob(
          smoothMouse.x + (Math.random() - 0.5) * 20,
          smoothMouse.y + (Math.random() - 0.5) * 20,
          dx * 0.1 + (Math.random() - 0.5) * 2,
          dy * 0.1 + (Math.random() - 0.5) * 2
        );
        blobs.push(blob);
      }
    }

    // Update and draw blobs
    for (let i = blobs.length - 1; i >= 0; i--) {
      blobs[i].update();
      blobs[i].draw();

      if (blobs[i].life <= 0) {
        blobs.splice(i, 1);
      }
    }

    // Limit blob count for performance
    while (blobs.length > 50) {
      blobs.shift();
    }

    prevMouse.x = smoothMouse.x;
    prevMouse.y = smoothMouse.y;
    frameCount++;

    requestAnimationFrame(animate);
  }

  // Initialize smooth mouse position
  smoothMouse.x = window.innerWidth / 2;
  smoothMouse.y = window.innerHeight / 2;
  prevMouse.x = smoothMouse.x;
  prevMouse.y = smoothMouse.y;

  animate();
})();
