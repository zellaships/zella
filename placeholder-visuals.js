/**
 * Living Visual Systems
 * Slow organic blobs with mouse interaction
 */

(function() {
  'use strict';

  // Color themes - all using that beautiful blob aesthetic
  const themes = [
    { // Blurple
      bg: ['#e8e6ff', '#d4d0ff'],
      blobs: ['#5865F2', '#7983F5', '#8A64FF', '#6366F1'],
    },
    { // Emerald
      bg: ['#d1fae5', '#a7f3d0'],
      blobs: ['#10B981', '#34D399', '#059669', '#6EE7B7'],
    },
    { // Rose
      bg: ['#fce7f3', '#fbcfe8'],
      blobs: ['#EC4899', '#F472B6', '#DB2777', '#F9A8D4'],
    },
    { // Ocean
      bg: ['#dbeafe', '#bfdbfe'],
      blobs: ['#3B82F6', '#0EA5E9', '#2563EB', '#60A5FA'],
    },
    { // Aurora
      bg: ['#e0e7ff', '#c7d2fe'],
      blobs: ['#8B5CF6', '#A78BFA', '#7C3AED', '#C4B5FD'],
    }
  ];

  // Simplex noise for organic movement
  class Noise {
    constructor() {
      this.grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
      this.p = [];
      for (let i = 0; i < 256; i++) this.p[i] = Math.floor(Math.random() * 256);
      this.perm = new Array(512);
      for (let i = 0; i < 512; i++) this.perm[i] = this.p[i & 255];
    }

    dot(g, x, y) { return g[0] * x + g[1] * y; }

    noise(x, y) {
      const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
      let s = (x + y) * F2, i = Math.floor(x + s), j = Math.floor(y + s);
      let t = (i + j) * G2, x0 = x - (i - t), y0 = y - (j - t);
      let i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
      let x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
      let ii = i & 255, jj = j & 255;
      let gi0 = this.perm[ii + this.perm[jj]] % 12;
      let gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
      let gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;
      let n0 = 0, n1 = 0, n2 = 0;
      let t0 = 0.5 - x0 * x0 - y0 * y0; if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0); }
      let t1 = 0.5 - x1 * x1 - y1 * y1; if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1); }
      let t2 = 0.5 - x2 * x2 - y2 * y2; if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2); }
      return 70 * (n0 + n1 + n2);
    }
  }

  // Organic blob
  class Blob {
    constructor(x, y, size, color, noise) {
      this.x = x;
      this.y = y;
      this.originX = x;
      this.originY = y;
      this.size = size;
      this.color = color;
      this.noise = noise;
      this.vx = 0;
      this.vy = 0;
      this.noiseOffset = Math.random() * 1000;
      this.phase = Math.random() * Math.PI * 2;

      // Blob shape vertices
      this.numPoints = 6 + Math.floor(Math.random() * 3);
      this.points = [];
      for (let i = 0; i < this.numPoints; i++) {
        this.points.push({
          angle: (i / this.numPoints) * Math.PI * 2,
          radiusOffset: Math.random() * 0.4 - 0.2,
          phase: Math.random() * Math.PI * 2,
          speed: 0.008 + Math.random() * 0.012
        });
      }
    }

    update(time, width, height, mouseX, mouseY, mouseActive) {
      const t = time * 0.0003; // SLOW movement

      // Noise-based wandering
      const wanderX = this.noise.noise(this.noiseOffset + t, 0) * 0.15;
      const wanderY = this.noise.noise(0, this.noiseOffset + t) * 0.15;

      this.vx += wanderX;
      this.vy += wanderY;

      // Spring back to origin
      this.vx += (this.originX - this.x) * 0.002;
      this.vy += (this.originY - this.y) * 0.002;

      // Mouse interaction - gentle attraction/repulsion
      if (mouseActive) {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 150;

        if (dist < maxDist && dist > 0) {
          // Gentle push away from mouse
          const force = (1 - dist / maxDist) * 0.8;
          this.vx -= (dx / dist) * force;
          this.vy -= (dy / dist) * force;
        }
      }

      // Apply with heavy damping for slow movement
      this.vx *= 0.96;
      this.vy *= 0.96;
      this.x += this.vx;
      this.y += this.vy;

      // Soft bounds
      const margin = this.size;
      if (this.x < margin) this.vx += 0.1;
      if (this.x > width - margin) this.vx -= 0.1;
      if (this.y < margin) this.vy += 0.1;
      if (this.y > height - margin) this.vy -= 0.1;

      // Update blob shape
      for (const p of this.points) {
        p.currentRadius = 1 + p.radiusOffset + Math.sin(time * p.speed + p.phase) * 0.15;
      }
    }

    draw(ctx, time) {
      const pts = this.points.map(p => ({
        x: this.x + Math.cos(p.angle) * this.size * p.currentRadius,
        y: this.y + Math.sin(p.angle) * this.size * p.currentRadius
      }));

      // Outer glow
      const glow = ctx.createRadialGradient(this.x, this.y, this.size * 0.5, this.x, this.y, this.size * 2);
      glow.addColorStop(0, this.hexToRgba(this.color, 0.3));
      glow.addColorStop(0.5, this.hexToRgba(this.color, 0.1));
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      ctx.fill();

      // Main blob shape with smooth bezier curves
      const gradient = ctx.createRadialGradient(
        this.x - this.size * 0.3, this.y - this.size * 0.3, 0,
        this.x, this.y, this.size * 1.2
      );
      gradient.addColorStop(0, this.hexToRgba(this.color, 0.9));
      gradient.addColorStop(0.5, this.hexToRgba(this.color, 0.7));
      gradient.addColorStop(1, this.hexToRgba(this.color, 0.4));

      ctx.fillStyle = gradient;
      ctx.beginPath();

      // Smooth blob outline
      const first = pts[0];
      const last = pts[pts.length - 1];
      ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);

      for (let i = 0; i < pts.length; i++) {
        const curr = pts[i];
        const next = pts[(i + 1) % pts.length];
        const cpx = (curr.x + next.x) / 2;
        const cpy = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, cpx, cpy);
      }

      ctx.closePath();
      ctx.fill();
    }

    hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
  }

  // Main visual system
  class BlobSystem {
    constructor(canvas, index) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.theme = themes[index % themes.length];
      this.noise = new Noise();
      this.blobs = [];
      this.time = Math.random() * 10000;
      this.animationId = null;
      this.isVisible = false;

      // Mouse tracking
      this.mouseX = 0;
      this.mouseY = 0;
      this.mouseActive = false;

      this.resize();
      this.createBlobs();
      this.setupMouse();
    }

    setupMouse() {
      const parent = this.canvas.parentElement;

      parent.addEventListener('mouseenter', () => {
        this.mouseActive = true;
      });

      parent.addEventListener('mouseleave', () => {
        this.mouseActive = false;
      });

      parent.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
      });
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.width = rect.width;
      this.height = rect.height;
    }

    createBlobs() {
      this.blobs = [];
      const minDim = Math.min(this.width, this.height);

      // Create 3-5 blobs per card
      const count = 3 + Math.floor(Math.random() * 3);
      const colors = this.theme.blobs;

      for (let i = 0; i < count; i++) {
        const x = this.width * (0.2 + Math.random() * 0.6);
        const y = this.height * (0.2 + Math.random() * 0.6);
        const size = minDim * (0.25 + Math.random() * 0.2);
        const color = colors[i % colors.length];

        this.blobs.push(new Blob(x, y, size, color, this.noise));
      }
    }

    draw() {
      const ctx = this.ctx;

      // Gradient background with slow fade
      const grad = ctx.createLinearGradient(0, 0, this.width, this.height);
      grad.addColorStop(0, this.theme.bg[0]);
      grad.addColorStop(1, this.theme.bg[1]);
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.globalAlpha = 1;

      // Draw blobs (back to front by size)
      const sorted = [...this.blobs].sort((a, b) => b.size - a.size);
      for (const blob of sorted) {
        blob.draw(ctx, this.time);
      }
    }

    update() {
      this.time++;
      for (const blob of this.blobs) {
        blob.update(this.time, this.width, this.height, this.mouseX, this.mouseY, this.mouseActive);
      }
    }

    animate() {
      if (!this.isVisible) return;
      this.update();
      this.draw();
      this.animationId = requestAnimationFrame(() => this.animate());
    }

    start() {
      if (!this.isVisible) {
        this.isVisible = true;
        // Initial fill
        const grad = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        grad.addColorStop(0, this.theme.bg[0]);
        grad.addColorStop(1, this.theme.bg[1]);
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.animate();
      }
    }

    stop() {
      this.isVisible = false;
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }
  }

  // Initialize
  function init() {
    const containers = document.querySelectorAll('.cs-card-placeholder-img');
    if (!containers.length) return;

    const systems = [];

    containers.forEach((container, i) => {
      const canvas = document.createElement('canvas');
      canvas.className = 'placeholder-visual-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      container.appendChild(canvas);

      const system = new BlobSystem(canvas, i);
      systems.push(system);

      new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) system.start();
          else system.stop();
        });
      }, { threshold: 0.05, rootMargin: '50px' }).observe(container);
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        systems.forEach(s => {
          s.stop();
          s.resize();
          s.createBlobs();
          s.start();
        });
      }, 150);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
