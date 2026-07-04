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
  });
});

/* ---------- Copy email ---------- */

if (copyEmailButton) {
  copyEmailButton.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const label = button.querySelector("span");
    const previous = label ? label.textContent : "";

    try {
      await navigator.clipboard.writeText(email);
      if (label) label.textContent = "Copied";
      if (copyStatus) copyStatus.textContent = "Email copied to clipboard.";
    } catch {
      if (label) label.textContent = email;
      if (copyStatus) copyStatus.textContent = email;
    }

    window.setTimeout(() => {
      if (label) label.textContent = previous;
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
}

/* ---------- Active nav highlighting ---------- */

if ("IntersectionObserver" in window && navLinks.length > 0) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach((section) => navObserver.observe(section));
}

/* ---------- Hero canvas (network) ---------- */

const canvas = document.querySelector("#system-canvas");
const context = canvas ? canvas.getContext("2d") : null;
const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let width = 0;
let height = 0;
let nodes = [];
let animationFrame = 0;
let networkRunning = false;
let heroInView = !hero;

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

function resizeCanvas() {
  if (!canvas || !context) return;

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.offsetWidth;
  height = canvas.offsetHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const nodeCount = width < 720 ? 14 : 26;
  nodes = Array.from({ length: nodeCount }, (_, index) => {
    const lane = index % 6;
    return {
      x: width * (0.42 + Math.random() * 0.54),
      y: height * (0.12 + Math.random() * 0.76),
      baseX: 0,
      baseY: 0,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.16,
      size: lane === 0 ? 3.2 : 2.1 + Math.random() * 1.7,
      lane,
    };
  }).map((node) => ({ ...node, baseX: node.x, baseY: node.y }));

  drawNetwork(0);
}

function drawNetwork(time) {
  if (!context) return;

  context.clearRect(0, 0, width, height);

  const gradient = context.createLinearGradient(width * 0.3, 0, width, height);
  gradient.addColorStop(0, "rgba(45, 212, 191, 0.07)");
  gradient.addColorStop(0.6, "rgba(45, 212, 191, 0.03)");
  gradient.addColorStop(1, "rgba(125, 240, 220, 0.05)");
  context.fillStyle = gradient;
  context.fillRect(width * 0.36, 0, width * 0.64, height);

  const canvasRect = pointer.active ? canvas.getBoundingClientRect() : null;
  const pointerX = canvasRect ? pointer.x - canvasRect.left : -1;
  const pointerY = canvasRect ? pointer.y - canvasRect.top : -1;
  const pointerInCanvas = pointer.active && pointerX >= 0 && pointerX <= width && pointerY >= 0 && pointerY <= height;

  nodes.forEach((node, index) => {
    if (!reducedMotion) {
      node.x += node.vx;
      node.y += node.vy;

      if (Math.abs(node.x - node.baseX) > 24) node.vx *= -1;
      if (Math.abs(node.y - node.baseY) > 18) node.vy *= -1;

      const dx = node.x - pointerX;
      const dy = node.y - pointerY;
      const pointerDistance = Math.hypot(dx, dy);

      if (pointerInCanvas && pointerDistance < 170) {
        const force = (1 - pointerDistance / 170) * 0.4;
        node.x += (dx / Math.max(1, pointerDistance)) * force;
        node.y += (dy / Math.max(1, pointerDistance)) * force;
      }

      node.x += (node.baseX - node.x) * 0.006;
      node.y += (node.baseY - node.y) * 0.006;
    }

    for (let nextIndex = index + 1; nextIndex < nodes.length; nextIndex += 1) {
      const next = nodes[nextIndex];
      const dx = node.x - next.x;
      const dy = node.y - next.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 150) {
        const alpha = (1 - distance / 150) * 0.14;
        context.strokeStyle = `rgba(45, 212, 191, ${alpha})`;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(node.x, node.y);
        context.lineTo(next.x, next.y);
        context.stroke();
      }
    }
  });

  nodes.forEach((node, index) => {
    const pulse = reducedMotion ? 0 : Math.sin(time / 900 + index) * 0.4;
    context.beginPath();
    context.arc(node.x, node.y, Math.max(1.6, node.size + pulse), 0, Math.PI * 2);
    context.fillStyle = node.lane === 0 ? "rgba(125, 240, 220, 0.6)" : "rgba(45, 212, 191, 0.5)";
    context.fill();
  });

  if (!reducedMotion && networkRunning) {
    animationFrame = requestAnimationFrame(drawNetwork);
  }
}

function startNetwork() {
  if (!canvas || !context || reducedMotion || networkRunning) return;

  networkRunning = true;
  animationFrame = requestAnimationFrame(drawNetwork);
}

function stopNetwork() {
  networkRunning = false;
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
