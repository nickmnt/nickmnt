const email = "nick.moeintaghavi@gmail.com";
const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const sections = [...document.querySelectorAll("main section[id]")];
const year = document.querySelector("[data-year]");
const copyEmailButton = document.querySelector("[data-copy-email]");
const copyStatus = document.querySelector("[data-copy-status]");
const hero = document.querySelector(".hero");
const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* GSAP + Lenis load from a CDN and are optional: when absent (or motion is
   reduced) every feature below falls back to the CSS/IntersectionObserver
   behavior, so the site never depends on them. */
let hasGsap = typeof window.gsap !== "undefined";
let hasScrollTrigger = hasGsap && typeof window.ScrollTrigger !== "undefined";
let hasSplitText = hasGsap && typeof window.SplitText !== "undefined";
let hasLenis = typeof window.Lenis !== "undefined";
const finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
let motionEnhanced = hasGsap && hasScrollTrigger && !reducedMotion;
let lenis = null;
let lastNativeScrollAt = 0;
let lastPageProgressScrollY = window.scrollY;

/* Added before first paint so .gsap-enhanced CSS applies from the start. */
if (motionEnhanced) {
  document.documentElement.classList.add("gsap-enhanced");
}

if (year) {
  year.textContent = new Date().getFullYear();
}

/* ---------- Header scroll progress ---------- */

let lastProgress = -1;
let lastDriftProgress = -1;
let headerScrolled = null;

function setPageProgress() {
  if (!header) return;

  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
  const roundedProgress = Math.round(progress * 10000) / 10000;
  const isScrolled = window.scrollY > 12;

  if (roundedProgress !== lastProgress) {
    header.style.setProperty("--scroll-progress", roundedProgress.toFixed(4));
    lastProgress = roundedProgress;
  }

  if (isScrolled !== headerScrolled) {
    header.classList.toggle("is-scrolled", isScrolled);
    headerScrolled = isScrolled;
  }

  /* Drives the ambient background glow drift (body::before). */
  if (!reducedMotion) {
    const driftProgress = Math.round(progress * 10000) / 10000;
    if (driftProgress !== lastDriftProgress) {
      document.documentElement.style.setProperty("--drift", driftProgress.toFixed(4));
      lastDriftProgress = driftProgress;
    }
  }
}

let progressFrame = 0;

function schedulePageProgress() {
  const currentScrollY = window.scrollY;
  if (!lenis && Math.abs(currentScrollY - lastPageProgressScrollY) > 1) {
    lastNativeScrollAt = performance.now();
  }
  lastPageProgressScrollY = currentScrollY;

  if (progressFrame) return;
  progressFrame = requestAnimationFrame(() => {
    progressFrame = 0;
    setPageProgress();
  });
}

window.addEventListener("scroll", schedulePageProgress, { passive: true });
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

/* ---------- Active nav highlighting ---------- */

function setActiveNavLink(link) {
  navLinks.forEach((candidate) => {
    candidate.classList.toggle("is-active", candidate === link);
  });
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

/* ==================================================================
   Motion enhancement (GSAP + ScrollTrigger + Lenis)
   Optional layer: without the CDN scripts or with reduced motion,
   everything above already provides the complete experience.
   ================================================================== */

function initSmoothScroll() {
  if (!hasLenis || lenis) return;
  if (window.scrollY > 2 || (lastNativeScrollAt > 0 && performance.now() - lastNativeScrollAt < 600)) return;

  lenis = new Lenis({
    lerp: 0.12,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    syncTouch: false,
    autoRaf: false,
  });

  lenis.on("scroll", () => {
    ScrollTrigger.update();
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
      lenis.scrollTo(target, { offset: -96, duration: 0.85 });
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
  gsap.set(".hero-kicker", { autoAlpha: 0, y: 12 });
  gsap.set(".hero-copy", { autoAlpha: 0, y: 24 });
  gsap.set(".hero-actions .button", { autoAlpha: 0, y: 16, transition: "none" });
  gsap.set(".proof-strip li", { autoAlpha: 0, y: 18 });

  /* Split after fonts settle so line breaks are measured correctly; the
     cap keeps a slow font from stalling the entrance. */
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const ready = Promise.race([fontsReady, new Promise((resolve) => window.setTimeout(resolve, 600))]);

  ready.then(() => {
    /* The credential line leads: it settles as the headline rises under it. */
    gsap.to(".hero-kicker", { autoAlpha: 1, y: 0, duration: 0.6, ease: "power4.out" });

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

/* ----- Hero scroll exit: content drifts up and fades gently. ----- */

function initHeroScrollExit() {
  const scrollOut = { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.5 };

  gsap.to(".hero-content", { yPercent: -6, autoAlpha: 0.35, ease: "none", scrollTrigger: scrollOut });

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
  if (!document.body.classList.contains("is-loaded")) {
    initHeroIntro();
  } else {
    heroIntroStarted = true;
  }
  initHeroScrollExit();
  initSectionHeadings();
  initSectionNumbers();
  initTimelineDraw();
  initSkillChips();
  initPanelParallax();
  initMagneticButtons();
  initCardGlow();
}

const motionScriptUrls = {
  gsap: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js",
  scrollTrigger: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js",
  splitText: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js",
  lenis: "https://cdn.jsdelivr.net/npm/lenis@1.3.25/dist/lenis.min.js",
};

let motionLoadStarted = false;

function preconnectMotionHost() {
  if (document.querySelector('link[href="https://cdn.jsdelivr.net"]')) return;

  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = "https://cdn.jsdelivr.net";
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function loadMotionEnhancements() {
  if (motionLoadStarted || reducedMotion) return;
  motionLoadStarted = true;
  preconnectMotionHost();

  try {
    await loadScript(motionScriptUrls.gsap);
    await Promise.all([
      loadScript(motionScriptUrls.scrollTrigger),
      loadScript(motionScriptUrls.splitText).catch(() => null),
      loadScript(motionScriptUrls.lenis).catch(() => null),
    ]);
  } catch {
    return;
  }

  hasGsap = typeof window.gsap !== "undefined";
  hasScrollTrigger = hasGsap && typeof window.ScrollTrigger !== "undefined";
  hasSplitText = hasGsap && typeof window.SplitText !== "undefined";
  hasLenis = typeof window.Lenis !== "undefined";
  motionEnhanced = hasGsap && hasScrollTrigger && !reducedMotion;

  if (!motionEnhanced) return;
  document.documentElement.classList.add("gsap-enhanced");
  initMotion();
}

function scheduleMotionEnhancements() {
  if (reducedMotion) return;

  window.addEventListener("load", () => window.setTimeout(loadMotionEnhancements, 0), { once: true });
}

if (motionEnhanced) {
  initMotion();
} else {
  scheduleMotionEnhancements();
}
