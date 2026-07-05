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

/* GSAP + Lenis load from a CDN and are optional: when absent (or motion is
   reduced) every feature below falls back to the CSS/IntersectionObserver
   behavior, so the site never depends on them. */
const hasGsap = typeof window.gsap !== "undefined";
const hasScrollTrigger = hasGsap && typeof window.ScrollTrigger !== "undefined";
const hasSplitText = hasGsap && typeof window.SplitText !== "undefined";
const hasLenis = typeof window.Lenis !== "undefined";
const finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const motionEnhanced = hasGsap && hasScrollTrigger && !reducedMotion;

/* Added before first paint so .gsap-enhanced CSS applies from the start. */
if (motionEnhanced) {
  document.documentElement.classList.add("gsap-enhanced");
}

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

  /* Drives the ambient background glow drift (body::before). */
  if (!reducedMotion) {
    document.documentElement.style.setProperty("--drift", progress.toFixed(4));
  }
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

  /* Inset by the link's own padding so the bar sits under the label. */
  const inset = parseFloat(getComputedStyle(activeNavLink).paddingLeft) || 0;
  const targetX = activeNavLink.offsetLeft + inset;
  const targetWidth = Math.max(0, activeNavLink.offsetWidth - inset * 2);
  const wasHidden = navIndicator.style.opacity !== "1";

  if (motionEnhanced) {
    if (wasHidden) {
      gsap.set(navIndicator, { opacity: 1, width: targetWidth, x: targetX });
      return;
    }

    /* Gooey stretch: the bar first grows to span both links, then snaps
       shut on the destination. */
    const currentX = Number(gsap.getProperty(navIndicator, "x")) || 0;
    const currentWidth = navIndicator.offsetWidth;
    const spanX = Math.min(currentX, targetX);
    const spanWidth = Math.max(currentX + currentWidth, targetX + targetWidth) - spanX;

    gsap
      .timeline()
      .to(navIndicator, { x: spanX, width: spanWidth, duration: 0.18, ease: "power2.in", overwrite: "auto" })
      .to(navIndicator, { x: targetX, width: targetWidth, duration: 0.4, ease: "power3.out" });
    return;
  }

  /* When appearing from hidden, jump into place instead of sweeping from x=0. */
  if (wasHidden) {
    navIndicator.style.transition = "none";
  }

  navIndicator.style.opacity = "1";
  navIndicator.style.width = `${targetWidth}px`;
  navIndicator.style.transform = `translateX(${targetX}px)`;

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

/* Fallback count-up: when GSAP is present the hero timeline drives this instead. */
if ("IntersectionObserver" in window && proofStrip && statValues.length > 0 && !reducedMotion && !motionEnhanced) {
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
      if (copyStatus) {
        copyStatus.textContent = "Email copied to clipboard.";
        copyStatus.classList.add("is-shown");
      }
    } catch {
      if (label) label.textContent = email;
      if (copyStatus) {
        copyStatus.textContent = email;
        copyStatus.classList.add("is-shown");
      }
    }

    window.setTimeout(() => {
      if (label) label.textContent = previous;
      if (iconUse) iconUse.setAttribute("href", "#icon-copy");
      button.classList.remove("is-copied");
      if (copyStatus) {
        copyStatus.classList.remove("is-shown");
        /* Clear the text only after the fade-out finishes. */
        window.setTimeout(() => {
          copyStatus.textContent = "";
        }, 300);
      }
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
    /* Section headings and the about panel are GSAP-owned when enhanced. */
    if (motionEnhanced && element.matches(".section-heading, .about-panel")) return;

    const group = element.closest("section") || document.body;
    const indexInGroup = staggerCounters.get(group) || 0;
    staggerCounters.set(group, indexInGroup + 1);
    element.style.transitionDelay = `${Math.min(indexInGroup * 70, 350)}ms`;
    revealObserver.observe(element);
  });

  if (!motionEnhanced) {
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
/* Cursor lens: stateless render-space displacement — the field parts around
   the pointer and springs back. Nothing feeds into velocity, so particles
   can never gather or clump under a held cursor. */
const LENS_RADIUS = 210;
const LENS_STRENGTH = 26;
/* Torch: existing links and stars near the cursor brighten, instead of the
   old spoke lines that re-wired the constellation to the pointer. */
const TORCH_RADIUS = 240;
const WRAP_MARGIN = 40;

let width = 0;
let height = 0;
let particles = [];
let farStars = [];
let pulses = [];
let meteors = [];
let animationFrame = 0;
let networkRunning = false;
let heroInView = !hero;
let lastFrameTime = 0;
let lastPulseTime = 0;
let lastMeteorTime = 0;
let nextMeteorDelay = 3200 + Math.random() * 3800;
/* Lens strength eased 0..1 so the cursor effect fades in and out softly. */
let lensLevel = 0;
const smoothPointer = { x: -1, y: -1, inCanvas: false };

/* Scroll "energy" (0..1) fed by Lenis while smooth-scrolling; stays 0 when
   Lenis is absent so the field behaves exactly as before. */
let scrollEnergy = 0;
let scrollDirection = 1;

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
      /* Eased lens offset so stars glide away from the cursor and glide
         back, instead of snapping to the displaced position. */
      lensX: 0,
      lensY: 0,
    };
  });

  /* Distant starfield behind the constellation: tiny, dim, unlinked, and
     parallax-free, so the linked field reads as the near layer of a deep
     sky instead of floating on a flat wash. */
  const farCount = Math.round(count * 1.7);
  farStars = Array.from({ length: farCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 0.35 + Math.random() * 0.75,
    phase: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.2 + Math.random() * 0.55,
    drift: 0.006 + Math.random() * 0.015,
    violet: Math.random() < 0.12,
  }));

  pulses = [];
  meteors = [];
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
  /* Lens eases toward on/off so the parting appears and recovers softly. */
  const lensTarget = smoothPointer.inCanvas && finePointer ? 1 : 0;
  lensLevel += (lensTarget - lensLevel) * Math.min(1, 0.07 * dt);

  /* Subtle whole-field parallax from the cursor, scaled by depth. */
  const parallaxX = smoothPointer.inCanvas ? (smoothPointer.x / width - 0.5) * 18 : 0;
  const parallaxY = smoothPointer.inCanvas ? (smoothPointer.y / height - 0.5) * 12 : 0;

  particles.forEach((particle) => {
    /* Gentle sinusoidal steering keeps drift organic instead of linear. */
    particle.vx += Math.cos(time / 1400 + particle.phase) * 0.002 * dt;
    particle.vy += Math.sin(time / 1700 + particle.phase) * 0.002 * dt;

    /* Scroll velocity nudges the field counter to the page motion so the
       network feels physically coupled to scrolling. */
    if (scrollEnergy > 0.001) {
      particle.vy -= scrollDirection * scrollEnergy * 0.02 * particle.z * dt;
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

    /* Lens: displacement lives in render space only (no velocity feedback,
       so no gathering), and each star eases toward its displaced position
       so it glides aside and drifts back instead of teleporting. */
    let pushX = 0;
    let pushY = 0;

    if (lensLevel > 0.004) {
      const dx = particle.renderX - smoothPointer.x;
      const dy = particle.renderY - smoothPointer.y;
      const distance = Math.hypot(dx, dy);

      if (distance > 0.001 && distance < LENS_RADIUS) {
        const falloff = 1 - distance / LENS_RADIUS;
        const push = LENS_STRENGTH * falloff * falloff * lensLevel * (0.45 + 0.55 * particle.z);
        pushX = (dx / distance) * push;
        pushY = (dy / distance) * push;
      }
    }

    const glide = Math.min(1, 0.07 * dt);
    particle.lensX += (pushX - particle.lensX) * glide;
    particle.lensY += (pushY - particle.lensY) * glide;
    particle.renderX += particle.lensX;
    particle.renderY += particle.lensY;
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

function drawFarStars(time, dt) {
  farStars.forEach((star) => {
    if (!reducedMotion) {
      star.x += star.drift * dt;
      if (star.x > width + 2) star.x = -2;
    }

    const twinkle = reducedMotion
      ? 0.7
      : 0.45 + 0.55 * Math.sin((time / 1000) * star.twinkleSpeed + star.phase);

    context.globalAlpha = 0.34 * twinkle;
    context.fillStyle = star.violet ? "rgba(196, 181, 253, 0.9)" : "rgba(186, 232, 228, 0.9)";
    context.beginPath();
    context.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    context.fill();
  });

  context.globalAlpha = 1;
}

function drawLinks() {
  /* Links glow brighter while the page is being scrolled, then settle. */
  const energyBoost = 1 + scrollEnergy * 0.5;
  const torchOn = lensLevel > 0.02;

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
      let alpha = Math.min(
        0.85,
        Math.pow(1 - distance / LINK_DISTANCE, 1.4) * 0.5 * (0.4 + 0.6 * depth) * energyBoost
      );

      /* Torch: links already in the constellation illuminate near the
         cursor — it reveals the network rather than re-wiring it. */
      let torch = 0;
      if (torchOn) {
        const midDist = Math.hypot(
          (a.renderX + b.renderX) * 0.5 - smoothPointer.x,
          (a.renderY + b.renderY) * 0.5 - smoothPointer.y
        );
        if (midDist < TORCH_RADIUS) {
          torch = (1 - midDist / TORCH_RADIUS) * lensLevel;
          alpha = Math.min(0.9, alpha + torch * torch * 0.45);
        }
      }

      context.strokeStyle =
        torch > 0.35
          ? `rgba(125, 240, 220, ${alpha.toFixed(3)})`
          : `rgba(45, 212, 191, ${alpha.toFixed(3)})`;
      context.lineWidth = 0.5 + depth * 0.7 + torch * 0.4;
      context.beginPath();
      context.moveTo(a.renderX, a.renderY);
      context.lineTo(b.renderX, b.renderY);
      context.stroke();
    }
  }
}

function drawParticles(time) {
  const torchOn = lensLevel > 0.02;

  particles.forEach((particle) => {
    const twinkle = reducedMotion
      ? 0.8
      : 0.6 + 0.4 * Math.sin((time / 1000) * particle.twinkleSpeed + particle.phase);

    /* Stars caught in the cursor torch brighten and swell slightly. */
    let torch = 0;
    if (torchOn) {
      const distance = Math.hypot(
        particle.renderX - smoothPointer.x,
        particle.renderY - smoothPointer.y
      );
      if (distance < TORCH_RADIUS) {
        torch = (1 - distance / TORCH_RADIUS) * lensLevel;
      }
    }

    const alpha = Math.min(1, (0.3 + 0.7 * particle.z) * twinkle * (1 + torch * 0.9));
    const size = particle.size * (1 + torch * 0.3);
    const glowRadius = size * (particle.bright ? 9 : 5.5) * (1 + torch * 0.4);

    context.globalAlpha = Math.min(1, alpha * (particle.bright ? 0.85 : 0.5) * (1 + torch * 0.5));
    context.drawImage(
      glowSprite,
      particle.renderX - glowRadius,
      particle.renderY - glowRadius,
      glowRadius * 2,
      glowRadius * 2
    );

    context.globalAlpha = Math.min(1, alpha + 0.15);
    context.beginPath();
    context.arc(particle.renderX, particle.renderY, size, 0, Math.PI * 2);
    context.fillStyle = particle.bright ? "rgba(190, 255, 244, 0.95)" : "rgba(125, 240, 220, 0.8)";
    context.fill();
  });

  context.globalAlpha = 1;
}

/* Occasional meteor: a fast gradient streak with a glowing head, spawned
   on a randomized 7-16s cadence. Two can coexist at most in practice. */
function spawnMeteor(time) {
  const direction = Math.random() < 0.5 ? 1 : -1;
  const tilt = 0.35 + Math.random() * 0.3;
  const speed = 6.5 + Math.random() * 3.5;

  meteors.push({
    x: width * (0.15 + Math.random() * 0.7),
    y: height * (0.05 + Math.random() * 0.38),
    vx: Math.cos(tilt) * speed * direction,
    vy: Math.sin(tilt) * speed,
    life: 0,
    duration: 42 + Math.random() * 26,
    trail: 90 + Math.random() * 70,
  });

  lastMeteorTime = time;
  nextMeteorDelay = 7000 + Math.random() * 9000;
}

function drawMeteors(dt) {
  meteors = meteors.filter((meteor) => meteor.life < meteor.duration);

  meteors.forEach((meteor) => {
    meteor.life += dt;
    meteor.x += meteor.vx * dt;
    meteor.y += meteor.vy * dt;

    const t = Math.min(1, meteor.life / meteor.duration);
    const fade = Math.sin(Math.PI * t);
    const speed = Math.hypot(meteor.vx, meteor.vy);
    const tailX = meteor.x - (meteor.vx / speed) * meteor.trail * fade;
    const tailY = meteor.y - (meteor.vy / speed) * meteor.trail * fade;

    const streak = context.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
    streak.addColorStop(0, `rgba(220, 255, 248, ${(0.85 * fade).toFixed(3)})`);
    streak.addColorStop(0.4, `rgba(125, 240, 220, ${(0.3 * fade).toFixed(3)})`);
    streak.addColorStop(1, "rgba(125, 240, 220, 0)");

    context.strokeStyle = streak;
    context.lineWidth = 1.3;
    context.beginPath();
    context.moveTo(meteor.x, meteor.y);
    context.lineTo(tailX, tailY);
    context.stroke();

    context.globalAlpha = fade * 0.9;
    context.drawImage(glowSprite, meteor.x - 7, meteor.y - 7, 14, 14);
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
  drawFarStars(time, dt);

  if (!reducedMotion) {
    updatePointer(dt);
    updateParticles(dt, time);
    scrollEnergy *= Math.pow(0.95, dt);

    if (networkRunning && time - lastPulseTime > 750 && pulses.length < 5) {
      spawnPulse(time);
    }

    if (networkRunning && time - lastMeteorTime > nextMeteorDelay) {
      spawnMeteor(time);
    }
  } else {
    particles.forEach((particle) => {
      particle.renderX = particle.x;
      particle.renderY = particle.y;
    });
  }

  drawLinks();
  drawParticles(time);

  if (!reducedMotion) {
    drawPulses(dt);
    drawMeteors(dt);
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

/* ---------- Hero aurora (WebGL domain-warped noise shader) ----------
   A single fullscreen triangle running an fbm "liquid aurora" in the brand
   palette. Mouse light, scroll energy, and click ripples feed in as
   uniforms. Optional layer: no WebGL means the canvas hides itself and the
   CSS gradients + particle network carry the hero unchanged. */

const auroraCanvas = document.querySelector("#aurora-canvas");
let auroraGL = null;
let auroraUniforms = null;
let auroraRunning = false;
let auroraFrame = 0;
let auroraEpoch = 0;
let auroraLastTime = 0;
const auroraMouse = { x: 0.5, y: 0.5, level: 0 };
const auroraClick = { x: 0.5, y: 0.5, start: -1 };
/* Flow phase integrated on the CPU (starts mid-flow). Multiplying raw time
   by a scroll-varying speed inside the shader made the whole field jump the
   moment scrolling started; integration keeps speed changes continuous. */
let auroraPhase = 2.1;

const AURORA_VERTEX = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const AURORA_FRAGMENT = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_phase;
uniform vec2 u_mouse;
uniform float u_mouse_level;
uniform float u_energy;
uniform vec3 u_click;
uniform float u_scroll;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rotate = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = rotate * p * 2.03;
    amplitude *= 0.55;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;

  /* screenSt: fixed to the viewport (mouse light, click ripple, vignette).
     st: "sky" space, offset by scroll so the aurora trails the page and
     reads as a distant layer instead of cropping at the fold. */
  vec2 screenSt = vec2(uv.x * aspect, uv.y);
  vec2 st = vec2(screenSt.x, screenSt.y + u_scroll * 0.3);

  vec2 p = st * 1.6;
  float t = u_phase;

  /* Click ripple: an expanding ring that warps the noise field. */
  float ring = 0.0;
  if (u_click.z >= 0.0 && u_click.z < 3.5) {
    float clickDist = distance(screenSt, vec2(u_click.x * aspect, u_click.y));
    float band = clickDist - u_click.z * 0.55;
    ring = exp(-u_click.z * 1.7) * exp(-band * band * 70.0);
  }
  p += ring * 0.4;

  /* Two rounds of domain warping give the flow its silk folds. */
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t * 0.75));
  vec2 r = vec2(
    fbm(p + 2.2 * q + vec2(1.7, 9.2) + t * 0.45),
    fbm(p + 2.4 * q + vec2(8.3, 2.8) - t * 0.35)
  );
  float f = fbm(p + 2.4 * r);

  vec3 abyss = vec3(0.012, 0.02, 0.034);
  vec3 indigo = vec3(0.05, 0.085, 0.16);
  vec3 sea = vec3(0.028, 0.125, 0.135);
  vec3 teal = vec3(0.08, 0.34, 0.31);
  vec3 mint = vec3(0.176, 0.831, 0.749);
  vec3 violet = vec3(0.3, 0.21, 0.52);

  vec3 color = mix(abyss, indigo, smoothstep(0.15, 0.95, q.y) * 0.8);
  color = mix(color, sea, smoothstep(0.3, 0.9, f) * 0.9);
  color = mix(color, teal, smoothstep(0.55, 1.0, f) * 0.55);

  /* Aurora curtain: a waving band with a sharp lower edge that blooms
     upward, mint at the base shading to violet at altitude (real auroras
     go green low, purple high). Scroll energy makes it flare. */
  float bandY = 0.56 + 0.21 * fbm(vec2(st.x * 1.2 + q.x, t * 0.5));
  float dy = st.y - bandY;
  float curtain = smoothstep(-0.045, 0.05, dy) * exp(-max(dy, 0.0) * 3.0);

  /* Vertical ray structure drifting slowly sideways. */
  float rays = fbm(vec2(st.x * 3.4 - q.y * 1.8, t * 0.55));
  rays = 0.25 + 0.75 * smoothstep(0.32, 0.85, rays);

  vec3 auroraColor = mix(mint, violet, clamp(dy * 2.4, 0.0, 1.0));
  color += auroraColor * curtain * rays * (0.56 + u_energy * 0.2);

  /* Atmospheric backscatter hugging the curtain's lower edge. */
  color += teal * exp(-abs(dy + 0.05) * 9.0) * 0.14;

  /* Fine bright filaments threaded through the flow; brighten with scroll. */
  float filaments = smoothstep(0.72, 0.98, fbm(p * 2.1 + r * 1.6 + vec2(0.0, t * 0.8)));
  color += mint * filaments * (0.14 + u_energy * 0.12);

  /* Standing glow upper-right, where the overlay leaves the art exposed. */
  float beacon = exp(-distance(st, vec2(aspect * 0.74, 0.62)) * 2.1);
  color += teal * beacon * (0.36 + 0.1 * sin(u_time * 0.4));
  color += mint * beacon * beacon * 0.14;

  /* Soft light trailing the cursor. */
  float mouseDist = distance(screenSt, vec2(u_mouse.x * aspect, u_mouse.y));
  color += teal * exp(-mouseDist * 2.2) * 0.35 * u_mouse_level;
  color += mint * exp(-mouseDist * 5.0) * 0.12 * u_mouse_level;

  color += mint * ring * 0.7;

  /* Leaving the hero dims the sky so the exit feels graded, not cropped. */
  color *= 1.0 - u_scroll * 0.45;

  /* Vignette, then a hair of dither to stop banding on the dark ramps. */
  float vignette = smoothstep(1.5, 0.35, distance(uv, vec2(0.5, 0.55)));
  color *= 0.6 + 0.4 * vignette;
  color += (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) / 255.0;

  gl_FragColor = vec4(color, 1.0);
}`;

function compileAuroraShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function setupAurora() {
  if (!auroraCanvas || auroraGL) return;

  const gl = auroraCanvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });

  if (!gl) {
    auroraCanvas.style.display = "none";
    return;
  }

  const vertex = compileAuroraShader(gl, gl.VERTEX_SHADER, AURORA_VERTEX);
  const fragment = compileAuroraShader(gl, gl.FRAGMENT_SHADER, AURORA_FRAGMENT);
  if (!vertex || !fragment) {
    auroraCanvas.style.display = "none";
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    auroraCanvas.style.display = "none";
    return;
  }

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  auroraUniforms = {
    resolution: gl.getUniformLocation(program, "u_resolution"),
    time: gl.getUniformLocation(program, "u_time"),
    phase: gl.getUniformLocation(program, "u_phase"),
    mouse: gl.getUniformLocation(program, "u_mouse"),
    mouseLevel: gl.getUniformLocation(program, "u_mouse_level"),
    energy: gl.getUniformLocation(program, "u_energy"),
    click: gl.getUniformLocation(program, "u_click"),
    scroll: gl.getUniformLocation(program, "u_scroll"),
  };

  auroraGL = gl;
  auroraEpoch = performance.now();
}

function renderAurora(now) {
  const gl = auroraGL;
  if (!gl) return;

  const dt = auroraLastTime === 0 ? 1 : Math.min(2.5, (now - auroraLastTime) / 16.667);
  auroraLastTime = now;

  /* Mouse light eased toward the pointer, in uv space (y up). */
  if (!reducedMotion && pointer.active) {
    const rect = auroraCanvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const targetX = (pointer.x - rect.left) / rect.width;
      const targetY = 1 - (pointer.y - rect.top) / rect.height;
      const ease = Math.min(1, 0.09 * dt);
      auroraMouse.x += (targetX - auroraMouse.x) * ease;
      auroraMouse.y += (targetY - auroraMouse.y) * ease;
    }
  }
  const targetLevel = !reducedMotion && pointer.active ? 1 : 0;
  auroraMouse.level += (targetLevel - auroraMouse.level) * Math.min(1, 0.05 * dt);

  const clickAge = auroraClick.start < 0 ? -1 : Math.min(10, (now - auroraClick.start) / 1000);

  /* Scroll energy speeds the flow up smoothly (integrated, never jumps). */
  auroraPhase += ((dt * 16.667) / 1000) * (0.05 + scrollEnergy * 0.05);

  /* 0 at the top of the page, 1 once the hero has scrolled past. */
  const heroScroll = hero
    ? Math.min(1, Math.max(0, window.scrollY / Math.max(1, hero.offsetHeight)))
    : 0;

  gl.uniform2f(auroraUniforms.resolution, auroraCanvas.width, auroraCanvas.height);
  gl.uniform1f(auroraUniforms.time, (now - auroraEpoch) / 1000);
  gl.uniform1f(auroraUniforms.phase, auroraPhase);
  gl.uniform2f(auroraUniforms.mouse, auroraMouse.x, auroraMouse.y);
  gl.uniform1f(auroraUniforms.mouseLevel, auroraMouse.level);
  gl.uniform1f(auroraUniforms.energy, scrollEnergy);
  gl.uniform3f(auroraUniforms.click, auroraClick.x, auroraClick.y, clickAge);
  gl.uniform1f(auroraUniforms.scroll, heroScroll);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  if (auroraRunning && !reducedMotion) {
    auroraFrame = requestAnimationFrame(renderAurora);
  }
}

function resizeAurora() {
  if (!auroraGL || !auroraCanvas) return;

  /* The field is low-frequency, so half resolution (capped) upscales
     invisibly and keeps the fragment cost tiny. */
  const cssWidth = Math.max(1, auroraCanvas.offsetWidth);
  const cssHeight = Math.max(1, auroraCanvas.offsetHeight);
  const scale = Math.min(0.5, 900 / cssWidth);
  auroraCanvas.width = Math.max(1, Math.round(cssWidth * scale));
  auroraCanvas.height = Math.max(1, Math.round(cssHeight * scale));
  auroraGL.viewport(0, 0, auroraCanvas.width, auroraCanvas.height);

  /* Reduced motion gets a single still frame from mid-flow. */
  if (reducedMotion) {
    renderAurora(auroraEpoch + 42000);
  }
}

function startAurora() {
  if (!auroraGL || reducedMotion || auroraRunning) return;

  auroraRunning = true;
  auroraLastTime = 0;
  auroraFrame = requestAnimationFrame(renderAurora);
}

function stopAurora() {
  auroraRunning = false;
  auroraLastTime = 0;
  cancelAnimationFrame(auroraFrame);
  auroraFrame = 0;
}

if (auroraCanvas) {
  auroraCanvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    stopAurora();
    auroraGL = null;
  });

  auroraCanvas.addEventListener("webglcontextrestored", () => {
    setupAurora();
    resizeAurora();
    if (heroInView && !document.hidden) {
      startAurora();
    }
  });
}

/* Clicking anywhere in the hero drops a ripple into the field. */
if (hero && !reducedMotion) {
  hero.addEventListener("pointerdown", (event) => {
    if (!auroraGL) return;

    const rect = auroraCanvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    auroraClick.x = (event.clientX - rect.left) / rect.width;
    auroraClick.y = 1 - (event.clientY - rect.top) / rect.height;
    auroraClick.start = performance.now();
  });
}

window.addEventListener("resize", () => {
  const shouldRestart = networkRunning;

  stopNetwork();
  resizeCanvas();
  resizeAurora();
  if (shouldRestart) {
    startNetwork();
  }
});

document.addEventListener("visibilitychange", () => {
  stopNetwork();
  stopAurora();

  if (!document.hidden && heroInView) {
    resizeCanvas();
    startNetwork();
    startAurora();
  }
});

resizeCanvas();
setupAurora();
resizeAurora();

if ("IntersectionObserver" in window && hero) {
  const heroCanvasObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        heroInView = entry.isIntersecting;

        if (entry.isIntersecting && !document.hidden) {
          resizeCanvas();
          startNetwork();
          startAurora();
        } else {
          stopNetwork();
          stopAurora();
        }
      });
    },
    { threshold: 0.08 }
  );

  heroCanvasObserver.observe(hero);
} else {
  startNetwork();
  startAurora();
}

/* ==================================================================
   Motion enhancement (GSAP + ScrollTrigger + Lenis)
   Optional layer: without the CDN scripts or with reduced motion,
   everything above already provides the complete experience.
   ================================================================== */

let lenis = null;

function initSmoothScroll() {
  if (!hasLenis) return;

  lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
    autoRaf: false,
  });

  lenis.on("scroll", (event) => {
    ScrollTrigger.update();

    /* Feed scroll velocity into the hero particle field. */
    scrollEnergy = Math.min(1, Math.abs(event.velocity) / 60);
    scrollDirection = event.direction || (event.velocity >= 0 ? 1 : -1);
  });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* In-page anchors route through Lenis so they respect its easing.
     The skip link stays instant for keyboard users. */
  document.querySelectorAll('a[href^="#"]:not(.skip-link)').forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      const target = hash && hash.length > 1 ? document.querySelector(hash) : null;
      if (!target) return;

      event.preventDefault();
      history.pushState(null, "", hash);
      lenis.scrollTo(target, { offset: -96, duration: 1.2 });
    });
  });
}

/* ----- Hero entrance: masked split-headline rise, then a follow-through
   cascade over the copy, actions, and proof stats. ----- */

/* Hand-rolled word splitter used when the SplitText plugin didn't load.
   Mirrors the wrapper classes SplitText is configured with below. */
function wrapWords(element) {
  const words = [];

  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
        return;
      }
      if (child.nodeType !== Node.TEXT_NODE || !child.textContent.trim()) return;

      const fragment = document.createDocumentFragment();
      child.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.appendChild(document.createTextNode(part));
          return;
        }
        const mask = document.createElement("span");
        mask.className = "split-mask";
        const word = document.createElement("span");
        word.className = "split-word";
        word.textContent = part;
        mask.appendChild(word);
        fragment.appendChild(mask);
        words.push(word);
      });
      node.replaceChild(fragment, child);
    });
  };

  walk(element);
  return words;
}

function animateStatCounts() {
  statValues.forEach((element) => {
    const target = Number(element.dataset.count);
    if (!Number.isFinite(target)) return;

    gsap.fromTo(
      element,
      { textContent: 0 },
      { textContent: target, duration: 1.4, ease: "power3.out", snap: { textContent: 1 } }
    );
  });
}

let heroIntroStarted = false;

function playHeroFollowThrough() {
  if (heroIntroStarted) return;
  heroIntroStarted = true;

  gsap
    .timeline({ defaults: { ease: "power4.out" }, delay: 0.35 })
    .to(".hero-copy", { autoAlpha: 1, y: 0, duration: 0.7 })
    .to(
      ".hero-actions .button",
      { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06, clearProps: "all" },
      "-=0.45"
    )
    .to(
      ".proof-strip li",
      { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, onStart: animateStatCounts },
      "-=0.35"
    );
}

function initHeroIntro() {
  const title = document.querySelector("#hero-title");
  if (!title) return;

  /* Hidden states are applied here at runtime (pre-paint) rather than in
     static CSS, so a CDN failure can never leave content invisible. The
     buttons get transition: none so their CSS hover transition doesn't
     fight the tween; clearProps restores it afterwards. */
  gsap.set(title, { autoAlpha: 0 });
  gsap.set(".hero-copy", { autoAlpha: 0, y: 24 });
  gsap.set(".hero-actions .button", { autoAlpha: 0, y: 16, transition: "none" });
  gsap.set(".proof-strip li", { autoAlpha: 0, y: 18 });

  /* Split after fonts settle so line breaks are measured correctly; the
     cap keeps a slow font from stalling the entrance. */
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const ready = Promise.race([fontsReady, new Promise((resolve) => window.setTimeout(resolve, 600))]);

  ready.then(() => {
    if (hasSplitText) {
      SplitText.create(title, {
        type: "lines,words",
        mask: "lines",
        autoSplit: true,
        wordsClass: "split-word",
        onSplit(self) {
          gsap.set(title, { autoAlpha: 1 });
          const rise = gsap.from(self.words, {
            yPercent: 110,
            duration: 0.9,
            ease: "power4.out",
            stagger: 0.045,
          });
          playHeroFollowThrough();
          /* Returning the tween lets autoSplit clean up and replay it if a
             late font load or resize changes the line breaks. */
          return rise;
        },
      });
    } else {
      const words = wrapWords(title);
      gsap.set(title, { autoAlpha: 1 });
      gsap.from(words, { yPercent: 110, duration: 0.9, ease: "power4.out", stagger: 0.045 });
      playHeroFollowThrough();
    }
  });
}

/* ----- Hero scroll exit: content drifts up and fades while the particle
   canvas counter-drifts, giving the fold gentle depth. No pinning. ----- */

function initHeroScrollExit() {
  const scrollOut = { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.5 };

  gsap.to(".hero-content", { yPercent: -6, autoAlpha: 0.35, ease: "none", scrollTrigger: scrollOut });
  gsap.to("#system-canvas", { yPercent: 12, ease: "none", scrollTrigger: { ...scrollOut } });

  /* The cue is the first thing to go once scrolling starts. fromTo with
     immediateRender off, so ScrollTrigger refreshes restore it to visible
     instead of re-capturing the CSS entrance's hidden state. */
  gsap.fromTo(
    ".scroll-cue",
    { autoAlpha: 1 },
    {
      autoAlpha: 0,
      ease: "none",
      immediateRender: false,
      scrollTrigger: { trigger: ".hero", start: "top top", end: "20% top", scrub: 0.4 },
    }
  );
}

/* ----- Section choreography: masked heading reveals, ghost number
   parallax, scroll-drawn timeline, chip cascades, panel drift. ----- */

function initSectionHeadings() {
  const headings = [...document.querySelectorAll(".section-heading, .contact-copy")];
  if (headings.length === 0) return;

  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const ready = Promise.race([fontsReady, new Promise((resolve) => window.setTimeout(resolve, 600))]);

  ready.then(() => {
    headings.forEach((heading) => {
      const title = heading.querySelector("h2");
      if (!title) return;

      const eyebrow = heading.querySelector(".eyebrow");
      const copy = heading.querySelector("h2 ~ p");
      /* Word masks (not line masks) reflow naturally on resize, so no
         re-split is needed for the section headings. */
      const words = hasSplitText
        ? SplitText.create(title, { type: "words", mask: "words", wordsClass: "split-word" }).words
        : wrapWords(title);

      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        scrollTrigger: { trigger: heading, start: "top 82%", once: true },
        /* Reuses the existing CSS that draws the eyebrow's accent line. */
        onStart: () => heading.classList.add("is-visible"),
      });

      if (eyebrow) {
        tl.from(eyebrow, { autoAlpha: 0, y: 14, duration: 0.5 }, 0);
      }
      tl.from(words, { yPercent: 110, duration: 0.8, stagger: 0.035 }, 0.05);
      if (copy) {
        tl.from(copy, { autoAlpha: 0, y: 20, duration: 0.6 }, "-=0.45");
      }
    });
  });
}

function initSectionNumbers() {
  document.querySelectorAll(".section-num").forEach((num) => {
    gsap.fromTo(
      num,
      { yPercent: 24 },
      {
        yPercent: -24,
        ease: "none",
        scrollTrigger: {
          trigger: num.closest("section") || num,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.8,
        },
      }
    );
  });
}

function initTimelineDraw() {
  document.querySelectorAll(".timeline").forEach((timeline) => {
    gsap.fromTo(
      timeline,
      { "--line-scale": 0 },
      {
        "--line-scale": 1,
        ease: "none",
        scrollTrigger: { trigger: timeline, start: "top 75%", end: "bottom 65%", scrub: 0.6 },
      }
    );
  });
}

function initSkillChips() {
  document.querySelectorAll(".skills-row").forEach((row) => {
    const chips = row.querySelectorAll(".chip");
    if (chips.length === 0) return;

    /* transition: none during the tween, restored by clearProps, so the
       chips' CSS hover transition can't fight the cascade. */
    gsap.set(chips, { transition: "none" });
    gsap.from(chips, {
      y: 14,
      scale: 0.9,
      autoAlpha: 0,
      duration: 0.5,
      ease: "back.out(1.7)",
      stagger: 0.03,
      clearProps: "all",
      scrollTrigger: { trigger: row, start: "top 85%", once: true },
    });
  });
}

function initPanelParallax() {
  const aboutPanel = document.querySelector(".about-panel");
  if (aboutPanel) {
    /* GSAP owns both the entrance and the drift here, so inline transforms
       never fight the CSS reveal (disabled under .gsap-enhanced). */
    const wideLayout = window.matchMedia("(min-width: 761px)").matches;
    gsap.from(aboutPanel, {
      autoAlpha: 0,
      x: wideLayout ? 32 : 0,
      y: wideLayout ? 0 : 18,
      duration: 0.9,
      ease: "power4.out",
      scrollTrigger: { trigger: aboutPanel, start: "top 85%", once: true },
      /* Reuses the existing CSS stagger for the panel's inner blocks. */
      onStart: () => aboutPanel.classList.add("is-visible"),
    });

    gsap.fromTo(
      aboutPanel,
      { yPercent: 5 },
      {
        yPercent: -5,
        ease: "none",
        scrollTrigger: { trigger: "#about", start: "top bottom", end: "bottom top", scrub: 0.8 },
      }
    );
  }

  const fitCard = document.querySelector(".fit-card");
  if (fitCard) {
    gsap.fromTo(
      fitCard,
      { yPercent: 6 },
      {
        yPercent: -6,
        ease: "none",
        scrollTrigger: { trigger: "#contact", start: "top bottom", end: "bottom top", scrub: 0.8 },
      }
    );
  }
}

/* ----- Micro-interactions (fine pointers only) ----- */

function initMagneticButtons() {
  if (!finePointer) return;

  const magnets = document.querySelectorAll(".hero-actions .button, .contact-actions .button, .header-cta");

  magnets.forEach((button) => {
    button.classList.add("is-magnetic");

    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const pullX = gsap.utils.clamp(-5, 5, (event.clientX - (rect.left + rect.width / 2)) * 0.18);
      const pullY = gsap.utils.clamp(-5, 5, (event.clientY - (rect.top + rect.height / 2)) * 0.18);

      /* -2 keeps the hover lift the CSS used to provide. */
      gsap.to(button, { x: pullX, y: pullY - 2, duration: 0.4, ease: "power3.out", overwrite: "auto" });
    });

    button.addEventListener("pointerleave", () => {
      gsap.to(button, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.5)", overwrite: "auto" });
    });
  });
}

function initCardGlow() {
  if (!finePointer) return;

  document.querySelectorAll(".experience-card, .about-panel, .fit-card, .skills-row").forEach((card) => {
    let frame = 0;

    card.addEventListener("pointermove", (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        card.style.setProperty("--my", `${event.clientY - rect.top}px`);
      });
    });
  });
}

function initMotion() {
  gsap.registerPlugin(ScrollTrigger);
  if (hasSplitText) {
    gsap.registerPlugin(SplitText);
  }
  ScrollTrigger.config({ ignoreMobileResize: true });

  initSmoothScroll();
  initHeroIntro();
  initHeroScrollExit();
  initSectionHeadings();
  initSectionNumbers();
  initTimelineDraw();
  initSkillChips();
  initPanelParallax();
  initMagneticButtons();
  initCardGlow();
}

if (motionEnhanced) {
  initMotion();
}
