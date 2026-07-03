/* =========================================================================
   WILL YOU GO ON A DATE WITH ME? — script.js
   Vanilla JS only. Organized into small modules:
   Utils · State · BackgroundHearts · CursorTrail · Confetti · HeartBurst ·
   Runaway · Pages · Schedule · Activity · Music · Init
   ========================================================================= */
(function () {
  "use strict";

  /* ------------------------------ CONFIG ------------------------------ */
  // Put your WhatsApp number here, digits only, in international format —
  // no "+", no spaces, no dashes. Example: for +233 24 123 4567, use
  // "233241234567". This is the number the finished date details get sent to.
  const WHATSAPP_NUMBER = "233550368322"; // <-- replace with your real number

  /* ----------------------------- UTILS ----------------------------- */
  const Utils = {
    qs: (sel, ctx) => (ctx || document).querySelector(sel),
    qsa: (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel)),
    clamp: (v, min, max) => Math.min(Math.max(v, min), max),
    random: (min, max) => Math.random() * (max - min) + min,
    randomInt: (min, max) => Math.floor(Utils.random(min, max + 1)),
    pick: (arr) => arr[Utils.randomInt(0, arr.length - 1)],
    prefersReducedMotion: () =>
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    isCoarsePointer: () =>
      window.matchMedia && window.matchMedia("(hover: none), (pointer: coarse)").matches,
  };

  /* ----------------------------- STATE ----------------------------- */
  const STORAGE_KEY = "dateInviteState";
  const State = {
    data: { currentPage: "question", date: "", time: "", activity: "" },
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) this.data = Object.assign(this.data, JSON.parse(raw));
      } catch (e) {
        /* localStorage unavailable — carry on with defaults */
      }
    },
    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        /* ignore quota / privacy-mode errors */
      }
    },
    reset() {
      this.data = { currentPage: "question", date: "", time: "", activity: "" };
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    },
  };

  /* ----------------------- ACCESSIBLE LIVE REGION -------------------- */
  const liveRegion = document.getElementById("live-region");
  let announceTimer = null;
  function announce(msg) {
    if (!liveRegion) return;
    liveRegion.textContent = "";
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      liveRegion.textContent = msg;
    }, 60);
  }

  /* ------------------------ BACKGROUND HEARTS ------------------------ */
  const BackgroundHearts = {
    glyphs: ["❤️", "💗", "💕", "🩷"],
    init(count) {
      const container = document.getElementById("bg-hearts");
      if (!container) return;
      const n = Utils.prefersReducedMotion() ? 0 : count;
      for (let i = 0; i < n; i++) {
        const heart = document.createElement("span");
        heart.className = "bg-heart";
        heart.setAttribute("aria-hidden", "true");
        heart.textContent = Utils.pick(this.glyphs);
        heart.style.setProperty("--left", Utils.random(0, 100).toFixed(1) + "%");
        heart.style.setProperty("--size", Utils.random(0.9, 2.4).toFixed(2) + "rem");
        heart.style.setProperty("--dur", Utils.random(11, 24).toFixed(1) + "s");
        heart.style.setProperty("--delay", "-" + Utils.random(0, 22).toFixed(1) + "s");
        heart.style.setProperty("--op", Utils.random(0.22, 0.55).toFixed(2));
        heart.style.setProperty("--sway", Utils.random(-32, 32).toFixed(0) + "px");
        container.appendChild(heart);
      }
    },
  };

  /* ---------------------------- CANVAS FX ---------------------------- */
  function setupCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);
    return ctx;
  }

  /* ------------------------------ CONFETTI ---------------------------- */
  const Confetti = (function () {
    const canvas = document.getElementById("confetti-canvas");
    const ctx = setupCanvas(canvas);
    const colors = ["#ff6f9c", "#ef2d56", "#ffd166", "#ffffff", "#ffb3c9"];
    let particles = [];
    let rafId = null;
    const gravity = 0.16;

    function spawn(x, y, count) {
      for (let i = 0; i < count; i++) {
        const angle = Utils.random(0, Math.PI * 2);
        const speed = Utils.random(3, 9);
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Utils.random(2, 5),
          size: Utils.random(6, 12),
          color: Utils.pick(colors),
          shape: Math.random() > 0.5 ? "rect" : "circle",
          rotation: Utils.random(0, 360),
          vrot: Utils.random(-8, 8),
          life: Utils.randomInt(70, 120),
          maxLife: 120,
        });
      }
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    function tick() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((p) => {
        p.vy += gravity;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vrot;
        p.life--;
      });
      particles = particles.filter((p) => p.life > 0 && p.y < window.innerHeight + 40);

      particles.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Utils.clamp(p.life / 40, 0, 1);
        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      });

      if (particles.length > 0) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    }

    return {
      burst(x, y, count) {
        if (Utils.prefersReducedMotion()) return;
        spawn(x, y, count || 110);
      },
      rain(count) {
        if (Utils.prefersReducedMotion()) return;
        const n = count || 90;
        for (let i = 0; i < n; i++) {
          setTimeout(() => spawn(Utils.random(0, window.innerWidth), -20, 1), i * 12);
        }
      },
    };
  })();

  /* ---------------------------- CURSOR TRAIL --------------------------- */
  (function initCursorTrail() {
    const canvas = document.getElementById("trail-canvas");
    if (!canvas || Utils.isCoarsePointer() || Utils.prefersReducedMotion()) return;
    const canHover =
      window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover) return;

    const ctx = setupCanvas(canvas);
    let particles = [];
    let rafId = null;
    let lastSpawn = 0;

    function tick() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((p) => {
        p.life--;
        p.y -= 0.5;
        p.x += p.drift;
      });
      particles = particles.filter((p) => p.life > 0);
      particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Utils.clamp(p.life / p.maxLife, 0, 1);
        ctx.font = p.size + "px sans-serif";
        ctx.fillText("❤", p.x - p.size / 2, p.y + p.size / 2);
        ctx.restore();
      });
      if (particles.length > 0) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    }

    window.addEventListener("pointermove", (e) => {
      const now = performance.now();
      if (now - lastSpawn < 45) return; // throttle spawn rate
      lastSpawn = now;
      particles.push({
        x: e.clientX,
        y: e.clientY,
        size: Utils.random(10, 16),
        life: 22,
        maxLife: 22,
        drift: Utils.random(-0.4, 0.4),
      });
      if (!rafId) rafId = requestAnimationFrame(tick);
    });
  })();

  /* ------------------------------ HEART BURST -------------------------- */
  const HeartBurst = {
    glyphs: ["❤️", "💖", "💕", "💗", "💓"],
    explode(x, y, count) {
      if (Utils.prefersReducedMotion()) {
        count = Math.min(count || 14, 4);
      }
      const n = count || 16;
      for (let i = 0; i < n; i++) {
        const el = document.createElement("span");
        el.className = "heart-particle";
        el.setAttribute("aria-hidden", "true");
        el.textContent = Utils.pick(this.glyphs);
        const angle = Utils.random(0, Math.PI * 2);
        const dist = Utils.random(70, 220);
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist - 50;
        el.style.setProperty("--dx", dx.toFixed(0) + "px");
        el.style.setProperty("--dy", dy.toFixed(0) + "px");
        el.style.setProperty("--rot", Utils.randomInt(-80, 80) + "deg");
        el.style.left = x + "px";
        el.style.top = y + "px";
        el.style.fontSize = Utils.random(1, 2.1).toFixed(2) + "rem";
        document.body.appendChild(el);
        el.addEventListener("animationend", () => el.remove());
        setTimeout(() => el.remove(), 1200); // safety cleanup
      }
    },
  };

  /* ------------------------------ RUNAWAY BUTTON ------------------------------ */
  const Runaway = (function () {
    const taunts = [
      "nice try 😏",
      "not so fast 😜",
      "catch me if you can 🏃‍♀️",
      "almost had me 😉",
      "nope, try again",
      "too slow 🐢",
      "so close! 😄",
    ];
    let dodgeCount = 0;

    function showBubble(x, y) {
      if (Utils.prefersReducedMotion()) return;
      if (Math.random() > 0.55) return; // don't show every single time
      const bubble = document.createElement("div");
      bubble.className = "dodge-bubble";
      bubble.textContent = Utils.pick(taunts);
      bubble.style.left = x + "px";
      bubble.style.top = y + "px";
      bubble.style.transform = "translateX(-50%)";
      document.body.appendChild(bubble);
      setTimeout(() => bubble.remove(), 1000);
    }

    function reposition(el) {
      // Confine movement to the card that contains this button, not the
      // whole page — this is the button's whole "world" to hide in.
      const container = el.closest(".glass-card") || document.body;
      const margin = 14;
      const w = el.offsetWidth || 120;
      const h = el.offsetHeight || 52;

      if (!el.classList.contains("dodging")) {
        // lock in current on-screen position (relative to the card) before
        // switching to absolute positioning, so the first jump animates
        // smoothly instead of teleporting
        const containerRect = container.getBoundingClientRect();
        const btnRect = el.getBoundingClientRect();
        el.classList.add("dodging");
        el.style.left = btnRect.left - containerRect.left + "px";
        el.style.top = btnRect.top - containerRect.top + "px";
        void el.offsetWidth; // force reflow so the jump below animates
      }

      const maxX = Math.max(margin, container.clientWidth - w - margin);
      const maxY = Math.max(margin, container.clientHeight - h - margin);
      const x = Utils.random(margin, maxX);
      const y = Utils.random(margin, maxY);
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.style.transform = `rotate(${Utils.randomInt(-8, 8)}deg)`;
      setTimeout(() => {
        el.style.transform = "";
      }, 320);

      const containerRect = container.getBoundingClientRect();
      showBubble(containerRect.left + x + w / 2, containerRect.top + y - 30);

      dodgeCount++;
      if (dodgeCount % 3 === 1) announce("It got away again!");
    }

    function clampToContainer(el) {
      if (!el.classList.contains("dodging")) return;
      const container = el.closest(".glass-card") || document.body;
      const margin = 14;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const maxX = Math.max(margin, container.clientWidth - w - margin);
      const maxY = Math.max(margin, container.clientHeight - h - margin);
      const curX = parseFloat(el.style.left) || 0;
      const curY = parseFloat(el.style.top) || 0;
      el.style.left = Utils.clamp(curX, margin, maxX) + "px";
      el.style.top = Utils.clamp(curY, margin, maxY) + "px";
    }

    function distanceToRect(px, py, rect) {
      const cx = Utils.clamp(px, rect.left, rect.right);
      const cy = Utils.clamp(py, rect.top, rect.bottom);
      return Math.hypot(px - cx, py - cy);
    }

    function init(el, options) {
      const opts = options || {};
      const threshold = opts.threshold || 100;
      let ticking = false;

      // Desktop: dodge when the cursor gets close
      window.addEventListener("pointermove", (e) => {
        if (Utils.isCoarsePointer()) return;
        if (!el.closest(".page").classList.contains("active")) return;
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const rect = el.getBoundingClientRect();
          const dist = distanceToRect(e.clientX, e.clientY, rect);
          if (dist < threshold) reposition(el);
        });
      });

      // Touch: jump away the instant a tap begins, before it can register as a click
      el.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          reposition(el);
        },
        { passive: false }
      );

      // Universal safety net: whatever slips through never actually "activates" the button
      el.addEventListener("click", (e) => {
        e.preventDefault();
        reposition(el);
      });

      // Keyboard: Enter/Space dodges instead of activating, so keyboard users get the same joke
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          reposition(el);
        }
      });

      window.addEventListener("resize", () => clampToContainer(el));
    }

    function reset(el) {
      el.classList.remove("dodging");
      el.style.left = "";
      el.style.top = "";
      el.style.transform = "";
    }

    return { init, reset };
  })();

  /* -------------------------------- MUSIC -------------------------------- */
  const Music = (function () {
    let audioCtx = null;
    let masterGain = null;
    let playing = false;

    function ensureGraph() {
      if (audioCtx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0;

      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;
      masterGain.connect(filter).connect(audioCtx.destination);

      // soft major-chord pad: three sine oscillators
      [261.63, 329.63, 392.0].forEach((freq) => {
        const osc = audioCtx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        const g = audioCtx.createGain();
        g.gain.value = 0.09;
        osc.connect(g).connect(filter);
        osc.start();
      });

      // slow LFO drifting the filter for gentle ambient movement
      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.06;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 220;
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();
    }

    function toggle(button, icon) {
      ensureGraph();
      if (!audioCtx) return;
      if (audioCtx.state === "suspended") audioCtx.resume();
      playing = !playing;
      const target = playing ? 0.55 : 0;
      const now = audioCtx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.linearRampToValueAtTime(target, now + 0.8);
      button.setAttribute("aria-pressed", String(playing));
      icon.textContent = playing ? "🔊" : "🔈";
    }

    return { toggle };
  })();

  /* -------------------------------- PAGES -------------------------------- */
  const Pages = (function () {
    function getPage(name) {
      return Utils.qs(`.page[data-page="${name}"]`);
    }

    function markInert(pageEl, isInert) {
      if (!pageEl) return;
      if (isInert) {
        pageEl.setAttribute("inert", "");
        pageEl.setAttribute("aria-hidden", "true");
      } else {
        pageEl.removeAttribute("inert");
        pageEl.removeAttribute("aria-hidden");
      }
    }

    function goTo(name) {
      const next = getPage(name);
      if (!next) return;
      const current = Utils.qs(".page.active");
      if (current === next) return;

      if (current) {
        current.classList.remove("active");
        markInert(current, true);
      }
      markInert(next, false);
      void next.offsetWidth; // reflow so the CSS transition plays
      next.classList.add("active");

      State.data.currentPage = name;
      State.save();

      onEnter(name);

      const heading = Utils.qs("h1", next);
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
        announce("Page changed: " + heading.textContent.replace(/\s+/g, " ").trim());
      }
    }

    function onEnter(name) {
      if (name === "success") {
        Schedule.renderSummary();
        setTimeout(() => Confetti.rain(90), 150);
      }
      if (name === "farewell") {
        setTimeout(() => Confetti.rain(60), 100);
      }
    }

    function initInertState() {
      Utils.qsa(".page").forEach((p) => markInert(p, !p.classList.contains("active")));
    }

    return { goTo, initInertState, getPage };
  })();

  /* ------------------------------- SCHEDULE ------------------------------- */
  const Schedule = (function () {
    const activityLabels = {
      dinner: "🍕 Dinner",
      coffee: "☕ Coffee",
      movie: "🎬 Movie",
      icecream: "🍦 Ice Cream",
      bowling: "🎳 Bowling",
      walk: "🌅 Walk",
      surprise: "🎡 Surprise Me",
    };

    function formatDate(dateStr) {
      if (!dateStr) return "—";
      const [y, m, d] = dateStr.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    function formatTime(timeStr) {
      if (!timeStr) return "Anytime, 6–10pm 💕";
      const [h, m] = timeStr.split(":").map(Number);
      const dt = new Date();
      dt.setHours(h, m, 0, 0);
      return dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    }

    // Times must fall within the 6pm–10pm window when provided; the field
    // itself is optional, so an empty value is always considered valid.
    const TIME_MIN = "18:00";
    const TIME_MAX = "22:00";
    function isTimeInRange(timeStr) {
      if (!timeStr) return true;
      return timeStr >= TIME_MIN && timeStr <= TIME_MAX;
    }

    function renderSummary() {
      const dateEl = document.getElementById("summary-date");
      const timeEl = document.getElementById("summary-time");
      const activityEl = document.getElementById("summary-activity");
      if (dateEl) dateEl.textContent = formatDate(State.data.date);
      if (timeEl) timeEl.textContent = formatTime(State.data.time);
      if (activityEl)
        activityEl.textContent = activityLabels[State.data.activity] || "Surprise Me 🎡";
    }

    function init() {
      const dateInput = document.getElementById("date-input");
      const timeInput = document.getElementById("time-input");
      const errorEl = document.getElementById("schedule-error");
      const continueBtn = document.getElementById("btn-schedule-continue");

      if (dateInput) {
        const today = new Date();
        const iso =
          today.getFullYear() +
          "-" +
          String(today.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(today.getDate()).padStart(2, "0");
        dateInput.min = iso;
        if (State.data.date) dateInput.value = State.data.date;
      }
      if (timeInput && State.data.time) timeInput.value = State.data.time;

      function clearFieldError(field) {
        field.closest(".field").classList.remove("shake");
      }
      [dateInput, timeInput].forEach((input) => {
        if (input) input.addEventListener("input", () => clearFieldError(input));
      });

      if (continueBtn) {
        continueBtn.addEventListener("click", () => {
          const dateVal = dateInput ? dateInput.value : "";
          const timeVal = timeInput ? timeInput.value : "";
          const dateField = dateInput && dateInput.closest(".field");
          const timeField = timeInput && timeInput.closest(".field");
          if (dateField) dateField.classList.remove("shake");
          if (timeField) timeField.classList.remove("shake");

          const dateMissing = !dateVal;
          const timeOutOfRange = !isTimeInRange(timeVal);

          if (dateMissing || timeOutOfRange) {
            if (dateMissing) {
              void dateField.offsetWidth;
              dateField.classList.add("shake");
            }
            if (timeOutOfRange) {
              void timeField.offsetWidth;
              timeField.classList.add("shake");
            }

            if (dateMissing && timeOutOfRange) {
              errorEl.textContent =
                "Pick a date — and if you add a time, keep it between 6 and 10pm 💌";
            } else if (dateMissing) {
              errorEl.textContent = "Pick a date so I know when to come get you 💌";
            } else {
              errorEl.textContent =
                "I'm only free between 6 and 10pm — pick a time in that window, or leave it blank 💕";
            }

            (dateMissing ? dateInput : timeInput).focus();
            return;
          }

          errorEl.textContent = "";
          State.data.date = dateVal;
          State.data.time = timeVal;
          State.save();
          Pages.goTo("activity");
        });
      }
    }

    return { init, renderSummary, formatDate, formatTime, activityLabel: (v) => activityLabels[v] || "Surprise Me 🎡" };
  })();

  /* ------------------------------- WHATSAPP -------------------------------- */
  const WhatsApp = (function () {
    function isConfigured() {
      return /^\d{8,15}$/.test(WHATSAPP_NUMBER);
    }

    function buildMessage() {
      const date = Schedule.formatDate(State.data.date);
      const time = Schedule.formatTime(State.data.time);
      const activity = Schedule.activityLabel(State.data.activity);
      return (
        "Hey! 💌 I said YES to our date!\n\n" +
        "📅 Date: " + date + "\n" +
        "🕰️ Time: " + time + "\n" +
        "💫 Doing: " + activity + "\n\n" +
        "Can't wait! ❤️"
      );
    }

    function send() {
      if (!isConfigured()) return false;
      const url =
        "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(buildMessage());
      window.open(url, "_blank", "noopener");
      return true;
    }

    return { send, isConfigured, buildMessage };
  })();

  /* ------------------------------- ACTIVITY -------------------------------- */
  const Activity = (function () {
    function init() {
      const grid = document.getElementById("option-grid");
      const continueBtn = document.getElementById("btn-activity-continue");
      if (!grid) return;
      const cards = Utils.qsa(".option-card", grid);

      function select(card) {
        cards.forEach((c) => {
          c.classList.remove("selected");
          c.setAttribute("aria-checked", "false");
          c.tabIndex = -1;
        });
        card.classList.add("selected");
        card.setAttribute("aria-checked", "true");
        card.tabIndex = 0;
        State.data.activity = card.dataset.value;
        State.save();
        if (continueBtn) continueBtn.disabled = false;
      }

      cards.forEach((card, i) => {
        card.tabIndex = i === 0 ? 0 : -1;
        card.addEventListener("click", () => select(card));
        card.addEventListener("keydown", (e) => {
          const idx = cards.indexOf(card);
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            const next = cards[(idx + 1) % cards.length];
            next.focus();
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            const prev = cards[(idx - 1 + cards.length) % cards.length];
            prev.focus();
          } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            select(card);
          }
        });
        if (State.data.activity && card.dataset.value === State.data.activity) {
          select(card);
        }
      });

      if (continueBtn) {
        continueBtn.disabled = !State.data.activity;
        continueBtn.addEventListener("click", () => {
          if (!State.data.activity) return;
          Pages.goTo("success");
        });
      }
    }
    return { init };
  })();

  /* --------------------------------- INIT ---------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    State.load();
    BackgroundHearts.init(18);
    Pages.initInertState();
    Schedule.init();
    Activity.init();

    // Resume on the page the user last left, if any selections exist
    if (State.data.currentPage && State.data.currentPage !== "question") {
      Pages.goTo(State.data.currentPage);
    }

    /* ---- Page 1: The Question ---- */
    const btnYes = document.getElementById("btn-yes");
    const btnNo = document.getElementById("btn-no");
    if (btnYes) {
      btnYes.addEventListener("click", (e) => {
        const rect = btnYes.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        HeartBurst.explode(x, y, 18);
        Confetti.burst(x, y, 130);
        setTimeout(() => Pages.goTo("twist"), 450);
      });
    }
    if (btnNo) Runaway.init(btnNo, { threshold: 110 });

    /* ---- Page 2: Plot Twist ---- */
    const btnOkay = document.getElementById("btn-okay");
    if (btnOkay) btnOkay.addEventListener("click", () => Pages.goTo("schedule"));

    /* ---- Page 5: Success ---- */
    const btnCantWait = document.getElementById("btn-cant-wait");
    if (btnCantWait) {
      btnCantWait.addEventListener("click", () => {
        const rect = btnCantWait.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        HeartBurst.explode(x, y, 20);
        Confetti.burst(x, y, 120);
        setTimeout(() => Pages.goTo("callback"), 450);
      });
    }

    /* ---- Page 6: Callback ---- */
    const btnWont = document.getElementById("btn-wont");
    const btnMaybe = document.getElementById("btn-maybe");
    if (btnWont) {
      btnWont.addEventListener("click", () => {
        const rect = btnWont.getBoundingClientRect();
        HeartBurst.explode(rect.left + rect.width / 2, rect.top + rect.height / 2, 14);
        WhatsApp.send(); // opens WhatsApp with the date details ready to send, if configured
        Pages.goTo("farewell");
      });
    }
    if (btnMaybe) Runaway.init(btnMaybe, { threshold: 110 });

    const btnSendWhatsapp = document.getElementById("btn-send-whatsapp");
    const whatsappNote = document.getElementById("whatsapp-note");
    if (btnSendWhatsapp) {
      btnSendWhatsapp.addEventListener("click", () => {
        const sent = WhatsApp.send();
        if (whatsappNote) {
          whatsappNote.textContent = sent
            ? ""
            : "Add your number to WHATSAPP_NUMBER near the top of script.js to turn this on 💕";
        }
      });
    }

    /* ---- Page 7: Farewell / Restart ---- */
    const btnRestart = document.getElementById("btn-restart");
    if (btnRestart) {
      btnRestart.addEventListener("click", () => {
        State.reset();
        [btnNo, btnMaybe].forEach((btn) => btn && Runaway.reset(btn));
        const dateInput = document.getElementById("date-input");
        const timeInput = document.getElementById("time-input");
        if (dateInput) dateInput.value = "";
        if (timeInput) timeInput.value = "";
        Utils.qsa(".option-card").forEach((c) => {
          c.classList.remove("selected");
          c.setAttribute("aria-checked", "false");
        });
        const continueBtn = document.getElementById("btn-activity-continue");
        if (continueBtn) continueBtn.disabled = true;
        document.getElementById("schedule-error").textContent = "";
        Pages.goTo("question");
      });
    }

    /* ---- Music toggle ---- */
    const musicBtn = document.getElementById("music-toggle");
    const musicIcon = musicBtn ? musicBtn.querySelector(".music-icon") : null;
    if (musicBtn && musicIcon) {
      musicBtn.addEventListener("click", () => Music.toggle(musicBtn, musicIcon));
    }

    /* ---- Loader ---- */
    const loader = document.getElementById("loader");
    window.addEventListener("load", () => {
      setTimeout(() => {
        if (loader) {
          loader.classList.add("loader-hidden");
          setTimeout(() => loader.remove(), 700);
        }
        const activeHeading = Utils.qs(".page.active h1");
        if (activeHeading) {
          activeHeading.setAttribute("tabindex", "-1");
        }
      }, 900);
    });
  });
})();
