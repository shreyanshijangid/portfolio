/* ─────────────────────────────────────────
   GSAP SETUP
───────────────────────────────────────── */
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/* ─────────────────────────────────────────
   CANVAS & FRAME SCRUBBER
───────────────────────────────────────── */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
const TOTAL_FRAMES = 240;
const frames = [];
let loadedCount = 0;

// Lerp state
let currentFrameIdx = 0;
let targetFrameIdx = 0;
const lerpFactor = 0.08;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawFrame(Math.round(currentFrameIdx));
}

function drawFrame(index) {
  const img = frames[index];
  if (!img || !img.complete) return;

  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  const scale = Math.max(cw / iw, ch / ih);
  const sw = iw * scale;
  const sh = ih * scale;
  const sx = (cw - sw) / 2;
  const sy = (ch - sh) / 2;

  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, sx, sy, sw, sh);
}

function preloadFrames() {
  const loaderPercent = document.getElementById('load-percent');
  const progressRing = document.querySelector('.loader-ring .progress');
  const circumference = 301.6; // 2 * PI * r (r=48)

  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    const num = String(i).padStart(3, '0');
    img.src = `/frames/ezgif-frame-${num}.jpg`;
    
    const handleLoad = () => {
      loadedCount++;
      const percent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
      loaderPercent.textContent = percent;
      
      const offset = circumference - (percent / 100) * circumference;
      progressRing.style.strokeDashoffset = offset;

      if (loadedCount === TOTAL_FRAMES) {
        gsap.to('#loader', {
          opacity: 0,
          pointerEvents: 'none',
          duration: 1,
          delay: 0.5,
          onComplete: initApp
        });
      }
    };

    img.onload = handleLoad;
    img.onerror = () => {
      console.warn(`Frame ${num} failed to load`);
      handleLoad();
    };
    frames[i - 1] = img;
  }
}

/* ─────────────────────────────────────────
   PARALLAX PARTICLES
───────────────────────────────────────── */
const pCanvas = document.getElementById('particles-canvas');
const pCtx = pCanvas.getContext('2d');
let particles = [];

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * window.innerWidth;
    this.y = window.innerHeight + Math.random() * 100;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = -(Math.random() * 1 + 0.5);
    this.size = Math.random() * 1.5 + 0.5;
    this.alpha = Math.random() * 0.5 + 0.2;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.y < -10) this.reset();
  }
  draw() {
    pCtx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
    pCtx.beginPath();
    pCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    pCtx.fill();
  }
}

function initParticles() {
  pCanvas.width = window.innerWidth;
  pCanvas.height = window.innerHeight;
  particles = [];
  for (let i = 0; i < 60; i++) {
    particles.push(new Particle());
  }
}

function animateParticles() {
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateParticles);
}

/* ─────────────────────────────────────────
   CUSTOM CURSOR
───────────────────────────────────────── */
const cursor = document.getElementById('cursor');
let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function animateCursor() {
  const lerpC = 0.15;
  cursorX += (mouseX - cursorX) * lerpC;
  cursorY += (mouseY - cursorY) * lerpC;
  
  cursor.style.transform = `translate3d(${cursorX - 6}px, ${cursorY - 6}px, 0)`;
  requestAnimationFrame(animateCursor);
}

document.querySelectorAll('a, button, .menu-toggle').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('link-hover'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('link-hover'));
});

/* ─────────────────────────────────────────
   ANIMATION LOOP (FOR LERP)
───────────────────────────────────────── */
function updateFrameScrubber() {
  if (Math.abs(targetFrameIdx - currentFrameIdx) > 0.01) {
    currentFrameIdx += (targetFrameIdx - currentFrameIdx) * lerpFactor;
    drawFrame(Math.round(currentFrameIdx));
  }
  requestAnimationFrame(updateFrameScrubber);
}

/* ─────────────────────────────────────────
   APP INITIALIZATION
───────────────────────────────────────── */
function initApp() {
  resizeCanvas();
  initParticles();
  animateParticles();
  animateCursor();
  updateFrameScrubber();
  
  // Hero Entrance
  const heroTl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1.2 } });
  heroTl
    .from('.hero-eyebrow', { opacity: 0, y: 30 }, 0.3)
    .from('.hero-headline .name-first', { opacity: 0, y: 60, stagger: 0.1 }, 0.6)
    .from('.hero-headline .name-last', { opacity: 0, y: 60 }, 0.8)
    .from('.hero-sub', { opacity: 0, y: 30 }, 1.1)
    .from('.hero-ctas', { opacity: 0, y: 30 }, 1.3)
    .from('.scroll-indicator', { opacity: 0 }, 1.5);

  // Scroll Trigger for frame index
  ScrollTrigger.create({
    trigger: 'body',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      targetFrameIdx = self.progress * (TOTAL_FRAMES - 1);
      // Update progress bar
      document.getElementById('scroll-progress').style.width = (self.progress * 100) + '%';
    }
  });

  // Specific Section Animations
  // About
  gsap.fromTo('.about-card', 
    { x: 60, opacity: 0 },
    {
      scrollTrigger: { trigger: '.about-right', start: 'top 85%', toggleActions: 'play none none none' },
      x: 0, opacity: 1, duration: 1.2, ease: 'power3.out'
    }
  );

  // Skills
  gsap.fromTo('.skill-card', 
    { y: 50, opacity: 0 },
    {
      scrollTrigger: { trigger: '.skills-grid', start: 'top 85%', toggleActions: 'play none none none' },
      y: 0, opacity: 1, stagger: 0.12, duration: 1, ease: 'power3.out'
    }
  );

  // Projects
  gsap.fromTo('.project-card', 
    { y: 60, opacity: 0 },
    {
      scrollTrigger: { trigger: '.projects-list', start: 'top 85%', toggleActions: 'play none none none' },
      y: 0, opacity: 1, stagger: 0.2, duration: 1.2, ease: 'power3.out'
    }
  );

  // Hackathons (Battles)
  gsap.fromTo('.timeline-item', 
    { x: -40, opacity: 0 },
    {
      scrollTrigger: { trigger: '.timeline', start: 'top 85%', toggleActions: 'play none none none' },
      x: 0, opacity: 1, stagger: 0.15, duration: 1, ease: 'power3.out'
    }
  );

  // Hackathons (Clearances)
  gsap.fromTo('.cert-pill', 
    { x: 40, opacity: 0 },
    {
      scrollTrigger: { trigger: '.cert-stack', start: 'top 85%', toggleActions: 'play none none none' },
      x: 0, opacity: 1, stagger: 0.12, duration: 1, ease: 'power3.out'
    }
  );

  // Adventures
  gsap.fromTo('.activity-card, .interest-tag', 
    { y: 50, opacity: 0 },
    {
      scrollTrigger: { trigger: '.adventures-activities', start: 'top 85%', toggleActions: 'play none none none' },
      y: 0, opacity: 1, stagger: 0.1, duration: 1, ease: 'power3.out'
    }
  );

  // Generic fade for section headings
  gsap.utils.toArray('.section-title, .section-label, .about-left > p, .stat-pills').forEach(el => {
    gsap.fromTo(el, 
      { y: 30, opacity: 0 },
      {
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
        y: 0, opacity: 1, duration: 1, ease: 'power3.out'
      }
    );
  });

  // Navbar Logic
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Intersection Observer for active link
  const observerOptions = { threshold: 0.5 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        document.querySelectorAll('.nav-link').forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, observerOptions);

  document.querySelectorAll('section').forEach(section => observer.observe(section));

  // Smooth Scroll for Nav Links
  document.querySelectorAll('.nav-link, .nav-logo, .hero-ctas a, .scroll-indicator a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      gsap.to(window, {
        duration: 1.2,
        scrollTo: targetId,
        ease: 'power3.inOut'
      });
    });
  });
}

/* ─────────────────────────────────────────
   LISTENERS
───────────────────────────────────────── */
window.addEventListener('resize', () => {
  resizeCanvas();
  pCanvas.width = window.innerWidth;
  pCanvas.height = window.innerHeight;
});

// Start Preloading
preloadFrames();
