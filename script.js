const email = "nick.moeintaghavi@gmail.com";
const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const sections = [...document.querySelectorAll("main section[id]")];

document.querySelector("[data-year]").textContent = new Date().getFullYear();

navToggle.addEventListener("click", () => {
  const isOpen = header.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

document.querySelector("[data-copy-email]").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const label = button.querySelector("span");
  const previous = label.textContent;

  try {
    await navigator.clipboard.writeText(email);
    label.textContent = "Copied";
  } catch {
    label.textContent = email;
  }

  window.setTimeout(() => {
    label.textContent = previous;
  }, 1600);
});

document.querySelector("#contact-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const name = data.get("name").trim();
  const sender = data.get("email").trim();
  const message = data.get("message").trim();
  const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
  const body = encodeURIComponent(`${message}\n\nFrom: ${name}\nEmail: ${sender}`);
  const status = form.querySelector(".form-status");

  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  status.textContent = "Opening your email app.";
});

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

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index * 35, 180)}ms`;
  revealObserver.observe(element);
});

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

const canvas = document.querySelector("#system-canvas");
const context = canvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let width = 0;
let height = 0;
let nodes = [];
let animationFrame = 0;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.offsetWidth;
  height = canvas.offsetHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const nodeCount = width < 720 ? 22 : 36;
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
  context.clearRect(0, 0, width, height);

  const gradient = context.createLinearGradient(width * 0.3, 0, width, height);
  gradient.addColorStop(0, "rgba(59, 130, 246, 0.14)");
  gradient.addColorStop(0.56, "rgba(139, 92, 246, 0.11)");
  gradient.addColorStop(1, "rgba(45, 212, 191, 0.08)");
  context.fillStyle = gradient;
  context.fillRect(width * 0.36, 0, width * 0.64, height);

  nodes.forEach((node, index) => {
    if (!reducedMotion) {
      node.x += node.vx;
      node.y += node.vy;

      if (Math.abs(node.x - node.baseX) > 24) node.vx *= -1;
      if (Math.abs(node.y - node.baseY) > 18) node.vy *= -1;
    }

    for (let nextIndex = index + 1; nextIndex < nodes.length; nextIndex += 1) {
      const next = nodes[nextIndex];
      const dx = node.x - next.x;
      const dy = node.y - next.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 155) {
        const alpha = (1 - distance / 155) * 0.2;
        context.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(node.x, node.y);
        context.lineTo(next.x, next.y);
        context.stroke();
      }
    }
  });

  nodes.forEach((node, index) => {
    const pulse = reducedMotion ? 0 : Math.sin(time / 650 + index) * 0.55;
    context.beginPath();
    context.arc(node.x, node.y, Math.max(1.8, node.size + pulse), 0, Math.PI * 2);
    context.fillStyle = node.lane === 0 ? "rgba(45, 212, 191, 0.72)" : "rgba(96, 165, 250, 0.82)";
    context.fill();

    context.beginPath();
    context.arc(node.x, node.y, node.size + 8, 0, Math.PI * 2);
    context.strokeStyle = node.lane === 0 ? "rgba(45, 212, 191, 0.16)" : "rgba(139, 92, 246, 0.12)";
    context.stroke();
  });

  if (!reducedMotion) {
    animationFrame = requestAnimationFrame(drawNetwork);
  }
}

window.addEventListener("resize", () => {
  cancelAnimationFrame(animationFrame);
  resizeCanvas();
  if (!reducedMotion) {
    animationFrame = requestAnimationFrame(drawNetwork);
  }
});

resizeCanvas();
if (!reducedMotion) {
  animationFrame = requestAnimationFrame(drawNetwork);
}
