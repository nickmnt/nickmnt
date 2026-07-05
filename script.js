const email = "nick.moeintaghavi@gmail.com";
const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const sections = [...document.querySelectorAll("main section[id]")];
const year = document.querySelector("[data-year]");
const copyEmailButton = document.querySelector("[data-copy-email]");
const copyStatus = document.querySelector("[data-copy-status]");
const hero = document.querySelector(".hero");
const pointer = { x: 0, y: 0, active: false };
const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (year) {
  year.textContent = new Date().getFullYear();
}

/* ---------- Header scroll progress ---------- */

function setPageProgress() {
  if (!header) return;

  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
  header.style.setProperty("--scroll-progress", progress.toFixed(4));
  header.classList.toggle("is-scrolled", window.scrollY > 12);
}

window.addEventListener("scroll", setPageProgress, { passive: true });
setPageProgress();

/* ---------- Mobile navigation ---------- */

function setNavOpen(isOpen) {
  if (!header || !navToggle) return;

  header.classList.toggle("nav-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
}

if (header && navToggle) {
  navToggle.addEventListener("click", () => {
    setNavOpen(!header.classList.contains("nav-open"));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.classList.contains("nav-open")) {
      setNavOpen(false);
      navToggle.focus();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (header.classList.contains("nav-open") && !header.contains(event.target)) {
      setNavOpen(false);
    }
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setNavOpen(false);
    setActiveNavLink(link);
  });
});

/* ---------- Sliding nav indicator ---------- */

const navIndicator = document.querySelector(".nav-indicator");
let activeNavLink = null;

function positionNavIndicator() {
  if (!navIndicator) return;

  if (!activeNavLink) {
    navIndicator.style.opacity = "0";
    return;
  }

  /* When appearing from hidden, jump into place instead of sweeping from x=0. */
  const wasHidden = navIndicator.style.opacity !== "1";
  if (wasHidden) {
    navIndicator.style.transition = "none";
  }

  /* Inset by the link's own padding so the bar sits under the label. */
  const inset = parseFloat(getComputedStyle(activeNavLink).paddingLeft) || 0;
  navIndicator.style.opacity = "1";
  navIndicator.style.width = `${Math.max(0, activeNavLink.offsetWidth - inset * 2)}px`;
  navIndicator.style.transform = `translateX(${activeNavLink.offsetLeft + inset}px)`;

  if (wasHidden) {
    void navIndicator.offsetWidth;
    navIndicator.style.transition = "";
  }
}

function setActiveNavLink(link) {
  navLinks.forEach((candidate) => {
    candidate.classList.toggle("is-active", candidate === link);
  });
  activeNavLink = link || null;
  positionNavIndicator();
}

window.addEventListener("resize", positionNavIndicator);

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(positionNavIndicator);
}

/* ---------- Hero entrance ---------- */

/* Double rAF guarantees the hidden state paints once before the transition runs. */
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.body.classList.add("is-loaded");
  });
});

/* ---------- Proof strip count-up ---------- */

const proofStrip = document.querySelector(".proof-strip");
const statValues = [...document.querySelectorAll(".proof-strip [data-count]")];

function animateCount(element) {
  const target = Number(element.dataset.count);
  if (!Number.isFinite(target)) return;

  const duration = 1200;
  const start = performance.now();

  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    element.textContent = String(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

if ("IntersectionObserver" in window && proofStrip && statValues.length > 0 && !reducedMotion) {
  const statObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        statValues.forEach(animateCount);
        statObserver.disconnect();
      });
    },
    { threshold: 0.4 }
  );

  statObserver.observe(proofStrip);
}

/* ---------- Copy email ---------- */

if (copyEmailButton) {
  copyEmailButton.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const label = button.querySelector("span");
    const iconUse = button.querySelector("use");
    const previous = label ? label.textContent : "";

    try {
      await navigator.clipboard.writeText(email);
      if (label) label.textContent = "Copied";
      if (iconUse) iconUse.setAttribute("href", "#icon-check");
      button.classList.add("is-copied");
      if (copyStatus) copyStatus.textContent = "Email copied to clipboard.";
    } catch {
      if (label) label.textContent = email;
      if (copyStatus) copyStatus.textContent = email;
    }

    window.setTimeout(() => {
      if (label) label.textContent = previous;
      if (iconUse) iconUse.setAttribute("href", "#icon-copy");
      button.classList.remove("is-copied");
      if (copyStatus) copyStatus.textContent = "";
    }, 1800);
  });
}

/* ---------- Reveal on scroll ---------- */

if ("IntersectionObserver" in window) {
  document.documentElement.classList.add("supports-reveal");

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  const staggerCounters = new Map();

  document.querySelectorAll(".reveal").forEach((element) => {
    const group = element.closest("section") || document.body;
    const indexInGroup = staggerCounters.get(group) || 0;
    staggerCounters.set(group, indexInGroup + 1);
    element.style.transitionDelay = `${Math.min(indexInGroup * 70, 350)}ms`;
    revealObserver.observe(element);
  });

  /* Timeline line draw is keyed off its own is-visible state. */
  document.querySelectorAll(".timeline").forEach((element) => {
    revealObserver.observe(element);
  });

  /* Skill chips cascade within their row once it reveals. */
  document.querySelectorAll(".skills-row dd").forEach((dd) => {
    [...dd.querySelectorAll(".chip")].forEach((chip, index) => {
      chip.style.setProperty("--chip-delay", `${index * 35}ms`);
    });
  });
}

/* ---------- Active nav highlighting ---------- */

if ("IntersectionObserver" in window && navLinks.length > 0) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const match = navLinks.find((link) => link.getAttribute("href") === `#${entry.target.id}`) || null;
        setActiveNavLink(match);
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach((section) => navObserver.observe(section));
}

/* ---------- Hero canvas (particle network) ---------- */

const canvas = document.querySelector("#system-canvas");
const context = canvas ? canvas.getContext("2d") : null;

const LINK_DISTANCE = 150;
const POINTER_RADIUS = 230;
const POINTER_LINK_RADIUS = 190;
const WRAP_MARGIN = 40;

let width = 0;
let height = 0;
let particles = [];
let pulses = [];
let animationFrame = 0;
let networkRunning = false;
let heroInView = !hero;
let lastFrameTime = 0;
let lastPulseTime = 0;
const smoothPointer = { x: -1, y: -1, inCanvas: false };

if (!reducedMotion) {
  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
}

/* Pre-rendered radial glow — much cheaper than shadowBlur per particle. */
const glowSprite = document.createElement("canvas");
{
  const spriteSize = 64;
  glowSprite.width = spriteSize;
  glowSprite.height = spriteSize;
  const spriteContext = glowSprite.getContext("2d");
  const glow = spriteContext.createRadialGradient(
    spriteSize / 2, spriteSize / 2, 0,
    spriteSize / 2, spriteSize / 2, spriteSize / 2
  );
  glow.addColorStop(0, "rgba(190, 255, 244, 0.85)");
  glow.addColorStop(0.25, "rgba(45, 212, 191, 0.5)");
  glow.addColorStop(1, "rgba(45, 212, 191, 0)");
  spriteContext.fillStyle = glow;
  spriteContext.fillRect(0, 0, spriteSize, spriteSize);
}

function createParticles() {
  const area = width * height;
  const divisor = width < 720 ? 17000 : 14000;
  const count = Math.max(16, Math.min(110, Math.round(area / divisor)));

  particles = Array.from({ length: count }, () => {
    /* z is depth: far (0.3) particles are smaller, dimmer, slower. */
    const z = 0.3 + Math.random() * 0.7;
    const angle = Math.random() * Math.PI * 2;
    const speed = (0.1 + Math.random() * 0.22) * z;

    return {
      /* sqrt biases density toward the right, where the overlay is lightest. */
      x: width * Math.sqrt(Math.random()),
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      z,
      size: (1.1 + Math.random() * 1.6) * z,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.5 + Math.random() * 1.1,
      bright: Math.random() < 0.14,
      renderX: 0,
      renderY: 0,
    };
  });

  pulses = [];
}

function resizeCanvas() {
  if (!canvas || !context) return;

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const previousWidth = width;
  width = canvas.offsetWidth;
  height = canvas.offsetHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  /* Height-only resizes (mobile URL bar show/hide) keep the existing particles
     so the field doesn't visibly jump mid-scroll. */
  if (width !== previousWidth || particles.length === 0) {
    createParticles();
  }

  drawNetwork(0);
}

function updatePointer(dt) {
  if (!canvas) return;

  if (!pointer.active) {
    smoothPointer.inCanvas = false;
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const targetX = pointer.x - rect.left;
  const targetY = pointer.y - rect.top;

  if (smoothPointer.x < 0) {
    smoothPointer.x = targetX;
    smoothPointer.y = targetY;
  } else {
    const ease = Math.min(1, 0.12 * dt);
    smoothPointer.x += (targetX - smoothPointer.x) * ease;
    smoothPointer.y += (targetY - smoothPointer.y) * ease;
  }

  smoothPointer.inCanvas =
    smoothPointer.x >= -WRAP_MARGIN &&
    smoothPointer.x <= width + WRAP_MARGIN &&
    smoothPointer.y >= 0 &&
    smoothPointer.y <= height;
}

function updateParticles(dt, time) {
  /* Subtle whole-field parallax from the cursor, scaled by depth. */
  const parallaxX = smoothPointer.inCanvas ? (smoothPointer.x / width - 0.5) * 18 : 0;
  const parallaxY = smoothPointer.inCanvas ? (smoothPointer.y / height - 0.5) * 12 : 0;

  particles.forEach((particle) => {
    /* Gentle sinusoidal steering keeps drift organic instead of linear. */
    particle.vx += Math.cos(time / 1400 + particle.phase) * 0.002 * dt;
    particle.vy += Math.sin(time / 1700 + particle.phase) * 0.002 * dt;

    if (smoothPointer.inCanvas) {
      const dx = smoothPointer.x - particle.x;
      const dy = smoothPointer.y - particle.y;
      const distance = Math.hypot(dx, dy);

      if (distance > 0.001 && distance < POINTER_RADIUS) {
        /* Drawn softly toward the cursor; pushed back when too close so the
           field orbits instead of clumping. */
        const strength = distance < 48 ? -0.05 : 0.014 * (1 - distance / POINTER_RADIUS);
        particle.vx += (dx / distance) * strength * particle.z * dt;
        particle.vy += (dy / distance) * strength * particle.z * dt;
      }
    }

    const speed = Math.hypot(particle.vx, particle.vy);
    const maxSpeed = 0.55 * particle.z;
    if (speed > maxSpeed) {
      particle.vx = (particle.vx / speed) * maxSpeed;
      particle.vy = (particle.vy / speed) * maxSpeed;
    }

    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;

    if (particle.x < -WRAP_MARGIN) particle.x = width + WRAP_MARGIN;
    if (particle.x > width + WRAP_MARGIN) particle.x = -WRAP_MARGIN;
    if (particle.y < -WRAP_MARGIN) particle.y = height + WRAP_MARGIN;
    if (particle.y > height + WRAP_MARGIN) particle.y = -WRAP_MARGIN;

    particle.renderX = particle.x + parallaxX * particle.z;
    particle.renderY = particle.y + parallaxY * particle.z;
  });
}

function spawnPulse(time) {
  if (particles.length < 2) return;

  const source = particles[Math.floor(Math.random() * particles.length)];
  let partner = null;
  let closest = LINK_DISTANCE;

  particles.forEach((candidate) => {
    if (candidate === source) return;
    const distance = Math.hypot(candidate.x - source.x, candidate.y - source.y);
    if (distance > 24 && distance < closest) {
      closest = distance;
      partner = candidate;
    }
  });

  if (partner) {
    pulses.push({
      from: source,
      to: partner,
      progress: 0,
      duration: 900 + Math.random() * 700,
    });
    lastPulseTime = time;
  }
}

function drawAmbientWash() {
  const glow = context.createRadialGradient(
    width * 0.72, height * 0.38, 0,
    width * 0.72, height * 0.38, Math.max(width, height) * 0.72
  );
  glow.addColorStop(0, "rgba(45, 212, 191, 0.07)");
  glow.addColorStop(0.5, "rgba(45, 212, 191, 0.025)");
  glow.addColorStop(1, "rgba(45, 212, 191, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);
}

function drawLinks() {
  for (let i = 0; i < particles.length; i += 1) {
    const a = particles[i];

    for (let j = i + 1; j < particles.length; j += 1) {
      const b = particles[j];
      const dx = a.renderX - b.renderX;
      const dy = a.renderY - b.renderY;
      if (Math.abs(dx) > LINK_DISTANCE || Math.abs(dy) > LINK_DISTANCE) continue;

      const distance = Math.hypot(dx, dy);
      if (distance >= LINK_DISTANCE) continue;

      const depth = Math.min(a.z, b.z);
      const alpha = Math.pow(1 - distance / LINK_DISTANCE, 1.4) * 0.5 * (0.4 + 0.6 * depth);
      context.strokeStyle = `rgba(45, 212, 191, ${alpha.toFixed(3)})`;
      context.lineWidth = 0.5 + depth * 0.7;
      context.beginPath();
      context.moveTo(a.renderX, a.renderY);
      context.lineTo(b.renderX, b.renderY);
      context.stroke();
    }
  }
}

function drawPointerLinks() {
  if (!smoothPointer.inCanvas) return;

  particles.forEach((particle) => {
    const dx = particle.renderX - smoothPointer.x;
    const dy = particle.renderY - smoothPointer.y;
    const distance = Math.hypot(dx, dy);

    if (distance < POINTER_LINK_RADIUS) {
      const alpha = Math.pow(1 - distance / POINTER_LINK_RADIUS, 1.8) * 0.45;
      context.strokeStyle = `rgba(125, 240, 220, ${alpha.toFixed(3)})`;
      context.lineWidth = 0.8;
      context.beginPath();
      context.moveTo(particle.renderX, particle.renderY);
      context.lineTo(smoothPointer.x, smoothPointer.y);
      context.stroke();
    }
  });
}

function drawParticles(time) {
  particles.forEach((particle) => {
    const twinkle = reducedMotion
      ? 0.8
      : 0.6 + 0.4 * Math.sin((time / 1000) * particle.twinkleSpeed + particle.phase);
    const alpha = (0.3 + 0.7 * particle.z) * twinkle;
    const glowRadius = particle.size * (particle.bright ? 9 : 5.5);

    context.globalAlpha = alpha * (particle.bright ? 0.85 : 0.5);
    context.drawImage(
      glowSprite,
      particle.renderX - glowRadius,
      particle.renderY - glowRadius,
      glowRadius * 2,
      glowRadius * 2
    );

    context.globalAlpha = Math.min(1, alpha + 0.15);
    context.beginPath();
    context.arc(particle.renderX, particle.renderY, particle.size, 0, Math.PI * 2);
    context.fillStyle = particle.bright ? "rgba(190, 255, 244, 0.95)" : "rgba(125, 240, 220, 0.8)";
    context.fill();
  });

  context.globalAlpha = 1;
}

function drawPulses(dt) {
  pulses = pulses.filter((pulse) => pulse.progress < 1);

  pulses.forEach((pulse) => {
    pulse.progress += (dt * 16.667) / pulse.duration;
    const t = Math.min(1, pulse.progress);
    /* Ease in-out travel with a sine fade so pulses appear and vanish softly. */
    const eased = t * t * (3 - 2 * t);
    const x = pulse.from.renderX + (pulse.to.renderX - pulse.from.renderX) * eased;
    const y = pulse.from.renderY + (pulse.to.renderY - pulse.from.renderY) * eased;
    const alpha = Math.sin(Math.PI * t);

    context.globalAlpha = alpha * 0.9;
    context.drawImage(glowSprite, x - 10, y - 10, 20, 20);
    context.globalAlpha = alpha;
    context.beginPath();
    context.arc(x, y, 1.6, 0, Math.PI * 2);
    context.fillStyle = "rgba(220, 255, 248, 0.95)";
    context.fill();
  });

  context.globalAlpha = 1;
}

function drawNetwork(time) {
  if (!context) return;

  /* Normalize to a 60fps step so motion speed is refresh-rate independent. */
  const dt = lastFrameTime === 0 ? 1 : Math.min(2.5, (time - lastFrameTime) / 16.667);
  lastFrameTime = time;

  context.clearRect(0, 0, width, height);
  drawAmbientWash();

  if (!reducedMotion) {
    updatePointer(dt);
    updateParticles(dt, time);

    if (networkRunning && time - lastPulseTime > 750 && pulses.length < 5) {
      spawnPulse(time);
    }
  } else {
    particles.forEach((particle) => {
      particle.renderX = particle.x;
      particle.renderY = particle.y;
    });
  }

  drawLinks();
  drawPointerLinks();
  drawParticles(time);

  if (!reducedMotion) {
    drawPulses(dt);
  }

  if (!reducedMotion && networkRunning) {
    animationFrame = requestAnimationFrame(drawNetwork);
  }
}

function startNetwork() {
  if (!canvas || !context || reducedMotion || networkRunning) return;

  networkRunning = true;
  lastFrameTime = 0;
  animationFrame = requestAnimationFrame(drawNetwork);
}

function stopNetwork() {
  networkRunning = false;
  lastFrameTime = 0;
  cancelAnimationFrame(animationFrame);
  animationFrame = 0;
}

window.addEventListener("resize", () => {
  const shouldRestart = networkRunning;

  stopNetwork();
  resizeCanvas();
  if (shouldRestart) {
    startNetwork();
  }
});

document.addEventListener("visibilitychange", () => {
  stopNetwork();

  if (!document.hidden && heroInView) {
    resizeCanvas();
    startNetwork();
  }
});

resizeCanvas();

if ("IntersectionObserver" in window && hero) {
  const heroCanvasObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        heroInView = entry.isIntersecting;

        if (entry.isIntersecting && !document.hidden) {
          resizeCanvas();
          startNetwork();
        } else {
          stopNetwork();
        }
      });
    },
    { threshold: 0.08 }
  );

  heroCanvasObserver.observe(hero);
} else {
  startNetwork();
}
