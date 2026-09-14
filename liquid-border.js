/**
 * Liquid Border Effect
 * Bouncy, buttery membrane between light and shadow.
 * Canvas paints both sides so no flat edge shows through.
 */

class LiquidBorder {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.points = [];
    this.mouse = { x: 0, y: 0, py: 0 };
    this.footer = null;

    // Bouncy, buttery physics
    this.config = {
      pointCount: 80,
      lineY: 30, // Middle of canvas
      tension: 0.04,
      damping: 0.82, // More bounce
      spread: 0.35,
      mouseRadius: 100,
      maxDisplacement: 18
    };

    this.init();
  }

  init() {
    this.footer = document.querySelector('.site-footer');
    if (!this.footer) return;

    this.createCanvas();
    this.createPoints();
    this.bindEvents();
    this.animate();
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: absolute;
      top: -30px;
      left: 0;
      width: 100%;
      height: 60px;
      pointer-events: none;
      z-index: 10;
    `;
    this.footer.style.position = 'relative';
    this.footer.style.overflow = 'visible';
    this.footer.insertBefore(this.canvas, this.footer.firstChild);
    this.ctx = this.canvas.getContext('2d');
    this.resize();
  }

  createPoints() {
    this.points = [];
    const width = this.footer.offsetWidth;
    const spacing = width / (this.config.pointCount - 1);

    for (let i = 0; i < this.config.pointCount; i++) {
      this.points.push({
        x: i * spacing,
        y: 0,
        vy: 0
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    // Mouse events
    window.addEventListener('mousemove', (e) => {
      this.mouse.py = this.mouse.y;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    // Touch events for mobile
    window.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      this.mouse.py = touch.clientY;
      this.mouse.x = touch.clientX;
      this.mouse.y = touch.clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      this.mouse.py = this.mouse.y;
      this.mouse.x = touch.clientX;
      this.mouse.y = touch.clientY;
    }, { passive: true });
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = this.footer.offsetWidth;
    this.canvas.width = width * dpr;
    this.canvas.height = 60 * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = width + 'px';

    const spacing = width / (this.config.pointCount - 1);
    this.points.forEach((p, i) => { p.x = i * spacing; });
  }

  update() {
    const { tension, damping, spread, mouseRadius, maxDisplacement, lineY } = this.config;

    const rect = this.canvas.getBoundingClientRect();
    const mx = this.mouse.x - rect.left;
    const my = this.mouse.y - rect.top;
    const vy = this.mouse.y - this.mouse.py;

    // Only interact when mouse is actually near the footer (within 80px vertically)
    const mouseNearFooter = this.mouse.y > rect.top - 80;

    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];

      const dx = mx - p.x;
      const dist = Math.abs(dx);

      if (mouseNearFooter && dist < mouseRadius) {
        const falloff = Math.exp(-(dist * dist) / (mouseRadius * mouseRadius * 0.4));

        // Check if mouse is crossing through the line
        const lineWorldY = rect.top + lineY + p.y;

        if (this.mouse.y > lineWorldY - 30 && this.mouse.y < lineWorldY + 50) {
          // Push based on how far mouse is past the line
          const penetration = (this.mouse.y - lineWorldY) / 30;
          p.vy += falloff * penetration * 1.2;
        }

        // Mouse velocity influence (buttery feel) - only when near
        p.vy += vy * falloff * 0.2;
      }

      // Spring back
      p.vy -= p.y * tension;

      // Damping (lower = more wobble)
      p.vy *= damping;

      // Update
      p.y += p.vy;

      // Bouncy clamp
      if (p.y > maxDisplacement) {
        p.y = maxDisplacement;
        p.vy *= -0.5;
      }
      if (p.y < -maxDisplacement * 0.5) {
        p.y = -maxDisplacement * 0.5;
        p.vy *= -0.4;
      }
    }

    // Wave spread
    for (let i = 1; i < this.points.length - 1; i++) {
      const avg = (this.points[i-1].y + this.points[i+1].y) / 2;
      this.points[i].vy += (avg - this.points[i].y) * spread;
    }
  }

  render() {
    const width = this.footer.offsetWidth;
    const height = 60;
    const { lineY } = this.config;

    this.ctx.clearRect(0, 0, width, height);

    // Build the curve path
    const buildCurve = () => {
      this.ctx.beginPath();
      this.ctx.moveTo(0, lineY + this.points[0].y);

      for (let i = 1; i < this.points.length; i++) {
        const p = this.points[i];
        const prev = this.points[i - 1];
        const cpx = (prev.x + p.x) / 2;
        const cpy = lineY + (prev.y + p.y) / 2;
        this.ctx.quadraticCurveTo(prev.x, lineY + prev.y, cpx, cpy);
      }

      const last = this.points[this.points.length - 1];
      this.ctx.lineTo(width, lineY + last.y);
    };

    // 1. Fill ABOVE the line with page background (white/paper)
    buildCurve();
    this.ctx.lineTo(width, 0);
    this.ctx.lineTo(0, 0);
    this.ctx.closePath();
    this.ctx.fillStyle = '#fefefe'; // Match your page background
    this.ctx.fill();

    // 2. Fill BELOW the line with footer color (green)
    buildCurve();
    this.ctx.lineTo(width, height);
    this.ctx.lineTo(0, height);
    this.ctx.closePath();
    this.ctx.fillStyle = '#10B981';
    this.ctx.fill();
  }

  animate() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.animate());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('home-locked')) {
    new LiquidBorder();
  }
});
