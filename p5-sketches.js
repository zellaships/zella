/**
 * p5.js Generative Sketches for Case Study Placeholders
 * Each sketch is unique and responds to mouse interaction
 */

(function() {
  'use strict';

  // Color palette matching site design
  const colors = {
    ink: '#17140f',
    inkSoft: '#4a453c',
    accent: '#5865F2',
    accentSoft: '#7983F5',
    green: '#10B981',
    paper: '#f5f5f5'
  };

  // Sketch 1: Flowing Particles
  function sketch1(p) {
    let particles = [];
    let cols, rows;
    let flowField = [];
    let zoff = 0;
    const scale = 20;
    const particleCount = 300;

    p.setup = function() {
      const parent = document.getElementById('p5-sketch-1');
      if (!parent) return;
      const canvas = p.createCanvas(parent.offsetWidth, parent.offsetHeight);
      canvas.parent(parent);
      p.colorMode(p.HSB, 360, 100, 100, 100);

      cols = Math.floor(p.width / scale);
      rows = Math.floor(p.height / scale);

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          pos: p.createVector(p.random(p.width), p.random(p.height)),
          vel: p.createVector(0, 0),
          acc: p.createVector(0, 0),
          prevPos: p.createVector(0, 0),
          maxSpeed: 2
        });
      }
    };

    p.draw = function() {
      p.background(245, 5, 98, 8);

      let yoff = 0;
      for (let y = 0; y < rows; y++) {
        let xoff = 0;
        for (let x = 0; x < cols; x++) {
          const index = x + y * cols;
          const angle = p.noise(xoff, yoff, zoff) * p.TWO_PI * 2;
          const v = p5.Vector.fromAngle(angle);
          v.setMag(0.5);
          flowField[index] = v;
          xoff += 0.1;
        }
        yoff += 0.1;
      }
      zoff += 0.003;

      for (let particle of particles) {
        const x = Math.floor(particle.pos.x / scale);
        const y = Math.floor(particle.pos.y / scale);
        const index = x + y * cols;
        const force = flowField[index];

        if (force) {
          particle.acc.add(force);
        }

        // Mouse influence
        const mouseVec = p.createVector(p.mouseX, p.mouseY);
        const d = p5.Vector.dist(particle.pos, mouseVec);
        if (d < 100 && d > 0) {
          const repel = p5.Vector.sub(particle.pos, mouseVec);
          repel.normalize();
          repel.mult(2 / d);
          particle.acc.add(repel);
        }

        particle.vel.add(particle.acc);
        particle.vel.limit(particle.maxSpeed);
        particle.prevPos.set(particle.pos);
        particle.pos.add(particle.vel);
        particle.acc.mult(0);

        // Wrap
        if (particle.pos.x > p.width) { particle.pos.x = 0; particle.prevPos.x = 0; }
        if (particle.pos.x < 0) { particle.pos.x = p.width; particle.prevPos.x = p.width; }
        if (particle.pos.y > p.height) { particle.pos.y = 0; particle.prevPos.y = 0; }
        if (particle.pos.y < 0) { particle.pos.y = p.height; particle.prevPos.y = p.height; }

        p.stroke(230, 60, 70, 15);
        p.strokeWeight(1);
        p.line(particle.pos.x, particle.pos.y, particle.prevPos.x, particle.prevPos.y);
      }
    };
  }

  // Sketch 2: Geometric Grid
  function sketch2(p) {
    let t = 0;
    const gridSize = 8;

    p.setup = function() {
      const parent = document.getElementById('p5-sketch-2');
      if (!parent) return;
      const canvas = p.createCanvas(parent.offsetWidth, parent.offsetHeight);
      canvas.parent(parent);
      p.noFill();
      p.strokeWeight(1.5);
    };

    p.draw = function() {
      p.background(248, 248, 245);

      const cellW = p.width / gridSize;
      const cellH = p.height / gridSize;

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const x = i * cellW + cellW / 2;
          const y = j * cellH + cellH / 2;

          const d = p.dist(p.mouseX, p.mouseY, x, y);
          const influence = p.map(d, 0, 200, 1, 0, true);

          const n = p.noise(i * 0.3, j * 0.3, t * 0.5);
          const size = cellW * 0.6 * (0.5 + n * 0.5 + influence * 0.3);
          const rotation = n * p.PI + t * 0.2 + influence * 0.5;

          p.push();
          p.translate(x, y);
          p.rotate(rotation);

          const hue = p.map(n, 0, 1, 220, 260);
          p.stroke(p.color(`hsla(${hue}, 65%, 55%, 0.6)`));

          if ((i + j) % 3 === 0) {
            p.rect(-size/2, -size/2, size, size);
          } else if ((i + j) % 3 === 1) {
            p.ellipse(0, 0, size, size);
          } else {
            p.beginShape();
            for (let k = 0; k < 3; k++) {
              const angle = k * p.TWO_PI / 3 - p.PI / 2;
              p.vertex(p.cos(angle) * size/2, p.sin(angle) * size/2);
            }
            p.endShape(p.CLOSE);
          }
          p.pop();
        }
      }
      t += 0.01;
    };
  }

  // Sketch 3: Noise Terrain
  function sketch3(p) {
    let t = 0;

    p.setup = function() {
      const parent = document.getElementById('p5-sketch-3');
      if (!parent) return;
      const canvas = p.createCanvas(parent.offsetWidth, parent.offsetHeight);
      canvas.parent(parent);
      p.noFill();
    };

    p.draw = function() {
      p.background(250, 250, 248);

      const lines = 40;
      const points = 100;

      for (let i = 0; i < lines; i++) {
        p.beginShape();
        const baseY = p.map(i, 0, lines, 20, p.height - 20);

        for (let j = 0; j <= points; j++) {
          const x = p.map(j, 0, points, 0, p.width);

          const mouseInfluence = p.map(p.dist(p.mouseX, p.mouseY, x, baseY), 0, 150, 30, 0, true);
          const n = p.noise(j * 0.05, i * 0.1, t);
          const y = baseY + (n - 0.5) * 40 + mouseInfluence * p.sin(j * 0.1 + t * 2);

          p.vertex(x, y);
        }

        const alpha = p.map(i, 0, lines, 0.15, 0.5);
        p.stroke(88, 100, 255, alpha * 255);
        p.strokeWeight(1);
        p.endShape();
      }
      t += 0.008;
    };
  }

  // Sketch 4: Concentric Ripples
  function sketch4(p) {
    let ripples = [];
    let t = 0;

    p.setup = function() {
      const parent = document.getElementById('p5-sketch-4');
      if (!parent) return;
      const canvas = p.createCanvas(parent.offsetWidth, parent.offsetHeight);
      canvas.parent(parent);
      p.noFill();

      // Initial ripples
      for (let i = 0; i < 3; i++) {
        ripples.push({
          x: p.random(p.width * 0.2, p.width * 0.8),
          y: p.random(p.height * 0.2, p.height * 0.8),
          r: p.random(50),
          speed: p.random(0.3, 0.8)
        });
      }
    };

    p.draw = function() {
      p.background(248, 250, 252);

      // Add new ripple occasionally
      if (p.frameCount % 120 === 0 && ripples.length < 8) {
        ripples.push({
          x: p.random(p.width * 0.2, p.width * 0.8),
          y: p.random(p.height * 0.2, p.height * 0.8),
          r: 0,
          speed: p.random(0.3, 0.8)
        });
      }

      // Mouse creates ripple
      if (p.mouseIsPressed && ripples.length < 12) {
        ripples.push({
          x: p.mouseX,
          y: p.mouseY,
          r: 0,
          speed: 1
        });
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.r += rip.speed;

        const maxR = Math.max(p.width, p.height) * 0.8;
        const alpha = p.map(rip.r, 0, maxR, 180, 0);

        if (alpha <= 0) {
          ripples.splice(i, 1);
          continue;
        }

        p.strokeWeight(1.5);
        for (let j = 0; j < 4; j++) {
          const r = rip.r - j * 15;
          if (r > 0) {
            const a = alpha - j * 30;
            p.stroke(16, 185, 129, a);
            p.ellipse(rip.x, rip.y, r * 2, r * 2);
          }
        }
      }
      t += 0.02;
    };
  }

  // Sketch 5: Organic Growth
  function sketch5(p) {
    let branches = [];
    let t = 0;
    let growing = true;

    p.setup = function() {
      const parent = document.getElementById('p5-sketch-5');
      if (!parent) return;
      const canvas = p.createCanvas(parent.offsetWidth, parent.offsetHeight);
      canvas.parent(parent);
      resetGrowth();
    };

    function resetGrowth() {
      branches = [];
      growing = true;
      // Start from bottom center
      branches.push({
        x: p.width / 2,
        y: p.height,
        angle: -p.PI / 2,
        len: 0,
        maxLen: p.random(60, 100),
        thickness: 3,
        depth: 0,
        growing: true
      });
    }

    p.draw = function() {
      p.background(252, 251, 250, 15);

      let allDone = true;

      for (let branch of branches) {
        if (branch.growing && branch.len < branch.maxLen) {
          branch.len += 0.8;
          allDone = false;
        } else if (branch.growing) {
          branch.growing = false;

          // Spawn new branches
          if (branch.depth < 5 && branches.length < 150) {
            const numBranches = branch.depth < 2 ? 2 : (p.random() > 0.3 ? 2 : 1);
            for (let i = 0; i < numBranches; i++) {
              const spreadAngle = p.map(branch.depth, 0, 5, 0.4, 0.8);
              const newAngle = branch.angle + p.random(-spreadAngle, spreadAngle);
              branches.push({
                x: branch.x + p.cos(branch.angle) * branch.len,
                y: branch.y + p.sin(branch.angle) * branch.len,
                angle: newAngle,
                len: 0,
                maxLen: branch.maxLen * p.random(0.6, 0.8),
                thickness: branch.thickness * 0.7,
                depth: branch.depth + 1,
                growing: true
              });
            }
          }
        }

        // Draw branch
        const endX = branch.x + p.cos(branch.angle) * branch.len;
        const endY = branch.y + p.sin(branch.angle) * branch.len;

        const alpha = p.map(branch.depth, 0, 5, 200, 80);
        p.stroke(88, 100, 255, alpha);
        p.strokeWeight(branch.thickness);
        p.line(branch.x, branch.y, endX, endY);
      }

      // Reset when done
      if (allDone && branches.length > 0) {
        if (t > 180) {
          t = 0;
          resetGrowth();
        }
      }

      t++;
    };

    p.mousePressed = function() {
      if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
        resetGrowth();
      }
    };
  }

  // Initialize all sketches when DOM is ready
  function init() {
    // Check if containers exist
    const containers = [
      'p5-sketch-1',
      'p5-sketch-2',
      'p5-sketch-3',
      'p5-sketch-4',
      'p5-sketch-5'
    ];

    const existing = containers.filter(id => document.getElementById(id));
    if (existing.length === 0) return;

    // Create instances with intersection observer for performance
    const sketches = [sketch1, sketch2, sketch3, sketch4, sketch5];
    const instances = [];

    existing.forEach((id, i) => {
      const container = document.getElementById(id);
      if (!container) return;

      let instance = null;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !instance) {
            instance = new p5(sketches[i]);
            instances.push({ id, instance });
          } else if (!entry.isIntersecting && instance) {
            instance.remove();
            instance = null;
            const idx = instances.findIndex(inst => inst.id === id);
            if (idx > -1) instances.splice(idx, 1);
          }
        });
      }, { threshold: 0.1 });

      observer.observe(container);
    });

    // Handle resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        instances.forEach(({ instance }) => {
          if (instance && instance.resizeCanvas) {
            const parent = instance.canvas.parentElement;
            if (parent) {
              instance.resizeCanvas(parent.offsetWidth, parent.offsetHeight);
            }
          }
        });
      }, 200);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
