/* The Lama apps: family landing page.

   Everything here is decoration on top of a page that reads the same without
   it. The Lamas follow the brand's character rules: they never speak, are
   never redrawn and only move as a whole between constructed poses (through
   lama-antics.js, vendored unchanged from the brand repository). Scenes run
   only while they are on screen, and not at all with reduced motion.

   The legal pages load this script too: they use the appearance toggle, the
   language switch and the contact address, then stop before the scenes. */
(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");
  const dataNode = document.getElementById("site-data");
  const data = dataNode ? JSON.parse(dataNode.textContent) : null;
  const LAMA = root.dataset.assets + "lama/";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const prefersDark = matchMedia("(prefers-color-scheme: dark)");

  const rand = (low, high) => low + Math.random() * (high - low);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const SVG = "http://www.w3.org/2000/svg";
  const make = (tag, className, html) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html) node.innerHTML = html;
    return node;
  };
  const controllers = [];

  function attachLama(element, colors, extra = {}) {
    if (!window.LamaAntics || !element) return null;
    const controller = window.LamaAntics.attach(element, { base: LAMA, colors, ...extra });
    if (controller) controllers.push(controller);
    return controller;
  }

  /* Appearance: in dark appearance every Lama pushes its shades up. ------ */
  let chosenTheme = null;
  const themeListeners = [];
  function swapShades(dark) {
    $$(".hero-lama .pose.proud, .scene-lama .pose.proud").forEach((img) => {
      img.src = LAMA + (dark ? "lama-proud-shades-up.svg" : "lama-proud.svg");
    });
    $$(".hero-lama .pose.hello, .scene-lama .pose.hello").forEach((img) => {
      img.src = LAMA + (dark ? "lama-standing-nod-shades-up.svg" : "lama-standing-nod.svg");
    });
  }
  function setTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === "dark";
    $$("[data-theme-toggle]").forEach((button) => {
      button.setAttribute("aria-pressed", String(dark));
    });
    $$("[data-shades-label]").forEach((label) => { label.textContent = dark ? "shades: up" : "shades: on"; });
    swapShades(dark);
    themeListeners.forEach((listener) => listener(theme));
  }
  $$("[data-theme-toggle]").forEach((button) => button.addEventListener("click", () => {
    chosenTheme = root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(chosenTheme);
  }));
  prefersDark.addEventListener("change", (event) => {
    if (!chosenTheme) setTheme(event.matches ? "dark" : "light");
  });

  /* Language: English in the markup, German from the generated dictionary.
     The choice is shared with every devmil.de site under one key. -------- */
  const LANGUAGES = ["en", "de"];
  const LANGUAGE_KEY = "preferred-language";
  const languageListeners = [];
  function storedLanguage() {
    try {
      const value = localStorage.getItem(LANGUAGE_KEY);
      return LANGUAGES.includes(value) ? value : null;
    } catch (error) {
      return null;
    }
  }
  function storeLanguage(lang) {
    try { localStorage.setItem(LANGUAGE_KEY, lang); } catch (error) { /* storage unavailable: keep the choice for this page only */ }
  }
  let language = root.lang === "de" ? "de" : "en";
  const t = (key) => (data && data.i18n[language][key]) || key;
  function setLanguage(lang) {
    language = lang;
    root.lang = lang;
    const words = data.i18n[lang];
    $$("[data-t]").forEach((node) => { node.textContent = words[node.dataset.t]; });
    $$("[data-ta]").forEach((node) => {
      node.dataset.ta.split(" ").forEach((pair) => {
        const [name, key] = pair.split(":");
        node.setAttribute(name, words[key]);
      });
    });
    $$("[data-legal]").forEach((link) => { link.href = (lang === "de" ? "de/" : "") + link.dataset.legal + ".html"; });
    $$(".lang-switch [data-lang]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.lang === lang)));
    languageListeners.forEach((listener) => listener(lang));
  }
  $$(".lang-switch").forEach((group) => {
    group.hidden = false;
    $$("[data-lang]", group).forEach((control) => control.addEventListener("click", () => {
      storeLanguage(control.dataset.lang);
      // Legal pages are static per language: the link opens the counterpart.
      if (data && control.tagName === "BUTTON") setLanguage(control.dataset.lang);
    }));
  });
  if (data) {
    const browser = (navigator.language || "").toLowerCase().startsWith("de") ? "de" : "en";
    const initial = storedLanguage() || browser;
    if (initial !== "en") setLanguage(initial);
  }

  /* The contact address: assembled only on click, never in the markup. --- */
  $$(".contact-email").forEach((el) => {
    const a = document.createElement("a");
    a.href = "#";
    a.textContent = el.textContent;
    a.addEventListener("click", (event) => {
      event.preventDefault();
      const d = el.dataset;
      window.location.href = "mail" + "to:" + d.user + "@" + d.domain + "." + d.tld;
    });
    el.replaceChildren(a);
  });

  if (!data) {
    setTheme(root.dataset.theme);
    return;
  }
  const allColors = [...Object.values(data.apps).map((app) => app.colors[0]), "#FFF8EB"];

  /* Scroll reveals --------------------------------------------------------- */
  if ("IntersectionObserver" in window) {
    const revealer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach((node) => revealer.observe(node));
  } else {
    $$(".reveal").forEach((node) => node.classList.add("is-in"));
  }

  function whileVisible(element, start, stop, threshold = 0.25) {
    if (!("IntersectionObserver" in window)) return start();
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !document.hidden) start(); else stop();
    }, { threshold }).observe(element);
  }

  /* The hero Lama and the herd on the meadow --------------------------------- */
  const herdLamas = $$(".herd-lama");
  function herdWave() {
    herdLamas.forEach((lama, index) => {
      const body = $(".herd-body", lama);
      setTimeout(() => body.animate([
        { transform: "none" },
        { transform: "scale(1.04, .94)", offset: 0.2 },
        { transform: "translateY(-30%) scale(.97, 1.04)", offset: 0.5 },
        { transform: "scale(1.03, .97)", offset: 0.8 },
        { transform: "none" },
      ], { duration: 560, easing: "ease-out" }), index * 110);
    });
  }

  const heroLama = $("#hero-lama");
  const hero = attachLama(heroLama, allColors, {
    taps: {
      rollCall: async (a) => {
        a.pose("hello");
        herdWave();
        await a.move("hop");
        await a.wait(500);
        a.pose(null);
      },
    },
    idle: {
      readTheLogs: async (a) => {
        a.pose("hello");
        await a.wait(1800);
        a.pose(null);
        await a.move("hop");
      },
      callTheHerd: async (a) => {
        a.pose("hello");
        await a.move("dip");
        herdWave();
        await a.wait(700);
        a.pose(null);
      },
    },
  });

  /* The terminal types its status once, the first time it is seen. */
  const terminal = $(".terminal");
  if (terminal && !reduced.matches && "IntersectionObserver" in window) {
    const lines = $$(".t-line", terminal);
    const command = $(".t-cmd", terminal);
    const typed = command.lastChild.textContent;
    terminal.classList.add("is-typing");
    const watcher = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting) return;
      watcher.disconnect();
      command.lastChild.textContent = "";
      command.classList.add("is-typed");
      for (const char of typed) {
        command.lastChild.textContent += char;
        await sleep(rand(40, 110));
      }
      await sleep(260);
      for (const line of lines.slice(1)) {
        line.classList.add("is-typed");
        await sleep(line.classList.contains("t-row") ? 90 : 160);
      }
      terminal.classList.remove("is-typing");
    });
    watcher.observe(terminal);
  }

  /* The herd wanders a little, grazes and hops while the hero is on screen. */
  const herdState = herdLamas.map(() => ({ x: 0, facing: 1 }));
  let herdTimer = 0;
  function herdTick() {
    const index = Math.floor(Math.random() * herdLamas.length);
    const lama = herdLamas[index];
    const body = $(".herd-body", lama);
    const state = herdState[index];
    const action = pick(["hop", "graze", "graze", "turn", "walk", "walk"]);
    const at = (x, facing, lift = 0) => `translate(${x}px, ${lift}%) scaleX(${facing})`;
    if (action === "graze") {
      lama.classList.add("is-grazing");
      setTimeout(() => lama.classList.remove("is-grazing"), rand(1400, 2600));
    } else if (action === "turn") {
      const next = -state.facing;
      body.animate([{ transform: at(state.x, state.facing) }, { transform: at(state.x, 0.1, -8) }, { transform: at(state.x, next) }], { duration: 320, fill: "forwards" });
      state.facing = next;
    } else if (action === "walk") {
      const target = clamp(state.x + rand(-26, 26), -30, 30);
      const facing = target < state.x ? 1 : -1;
      const steps = 3;
      const frames = [];
      for (let i = 0; i <= steps * 2; i += 1) {
        const x = state.x + ((target - state.x) * i) / (steps * 2);
        frames.push({ transform: at(x, facing, i % 2 ? -7 : 0) });
      }
      body.animate(frames, { duration: 900, fill: "forwards", easing: "linear" });
      state.x = target;
      state.facing = facing;
    } else {
      body.animate([
        { transform: at(state.x, state.facing) },
        { transform: at(state.x, state.facing, -22) },
        { transform: at(state.x, state.facing) },
      ], { duration: 520, easing: "ease-out", fill: "forwards" });
    }
    herdTimer = setTimeout(herdTick, rand(700, 1900));
  }
  if (!reduced.matches) {
    whileVisible($(".hero"), () => { if (!herdTimer) herdTimer = setTimeout(herdTick, 800); }, () => { clearTimeout(herdTimer); herdTimer = 0; }, 0.05);
  }

  /* Scene runner: timers, animations and frames stop with the scene. -------- */
  const STOPPED = Symbol("stopped");
  function runner(stage, setup) {
    let running = false;
    const timers = new Set();
    const animations = new Set();
    const waits = new Set();
    const frames = new Set();
    const ctx = {
      get running() { return running; },
      later(fn, ms) {
        const id = setTimeout(() => { timers.delete(id); if (running) fn(); }, Math.max(0, ms));
        timers.add(id);
      },
      wait(ms) {
        return new Promise((resolve, reject) => {
          const entry = { reject };
          entry.id = setTimeout(() => { waits.delete(entry); resolve(); }, ms);
          waits.add(entry);
        });
      },
      animate(element, keyframes, options) {
        const animation = element.animate(keyframes, options);
        animations.add(animation);
        animation.finished.catch(() => {}).then(() => animations.delete(animation));
        return animation;
      },
      frame(fn) {
        const entry = {};
        const step = (time) => {
          if (!running || fn(time) === false) { frames.delete(entry); return; }
          entry.id = requestAnimationFrame(step);
        };
        entry.id = requestAnimationFrame(step);
        frames.add(entry);
      },
      unit: () => stage.clientWidth / 100,
    };
    const scene = setup(ctx);
    const start = () => {
      if (running || reduced.matches) return;
      running = true;
      Promise.resolve(scene.start()).catch((error) => { if (error !== STOPPED && error?.name !== "AbortError") throw error; });
    };
    const stop = () => {
      if (!running) return;
      running = false;
      timers.forEach(clearTimeout);
      timers.clear();
      waits.forEach((entry) => { clearTimeout(entry.id); entry.reject(STOPPED); });
      waits.clear();
      frames.forEach((entry) => cancelAnimationFrame(entry.id));
      frames.clear();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      if (scene.stop) scene.stop();
    };
    whileVisible(stage, start, stop);
    document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
    return scene;
  }

  /* The Lama's box in stage pixels, unaffected by its antics. */
  function lamaBox(lama) {
    return { x: lama.offsetLeft, y: lama.offsetTop, w: lama.offsetWidth };
  }
  const isNapping = (antics) => antics && antics.running && antics.running() === "nap";

  /* A thing slides left to right along the floor and passes under the Lama's
     feet. Returns when it reaches the feet and when it has left them, in ms
     from now. [from, to] is the part of the thing that must not touch. */
  function contact(stage, lama, width, from, to, speed, delay) {
    const box = lamaBox(lama);
    const feetLeft = box.x + 0.21 * box.w;
    const feetRight = box.x + 0.86 * box.w;
    const x0 = -width;
    return {
      enter: delay + (feetLeft - (x0 + to * width)) / speed,
      exit: delay + (feetRight - (x0 + from * width)) / speed,
    };
  }
  function slide(ctx, stage, node, width, speed, delay) {
    const end = stage.clientWidth + 4;
    return ctx.animate(node, [
      { transform: `translateX(${-width}px)` },
      { transform: `translateX(${end}px)` },
    ], { duration: (end + width) / speed, delay, easing: "linear", fill: "backwards" });
  }
  /* A jump whose time in the air is centred on the contact window. */
  function jumpOver(ctx, antics, window, spec = {}) {
    if (!antics) return;
    const length = window.exit - window.enter;
    const air = Math.max(spec.minAir || 520, length * (spec.margin || 1.5));
    const lead = 200;
    const takeoff = window.enter - (air - length) / 2;
    ctx.later(() => {
      /* ProcessLama dozes through its beats; everyone else wakes up. */
      if (spec.doze && isNapping(antics)) return;
      antics.react(async (a) => {
        const jump = a.jump({ lead, air, height: spec.height || 0.3, style: spec.style || "hop" });
        if (spec.onPeak) { await a.wait(lead + air / 2); spec.onPeak(a); }
        await jump;
      }, spec.name || "jump");
    }, takeoff - lead);
  }

  /* ProcessLama: a live pulse line and a tiny process monitor. ------------- */
  function processLama(stage, antics, ctx) {
    const beats = $(".pl-beats", stage);
    const lama = $(".scene-lama", stage);
    const list = $(".pl-top", stage);
    const processes = [
      ["graze", 12.4], ["hay-indexer", 6.2], ["herd-sync", 2.3], ["shadesd", 1.1], ["jumpd", 0.4], ["spitd", 0],
    ].map(([name, cpu]) => {
      const row = make("li", "", `<span>${name}</span><span>0.0 %</span>`);
      list.appendChild(row);
      return { name, cpu, row, value: row.lastChild };
    });
    const jumpd = processes.find((process) => process.name === "jumpd");
    function render() {
      processes.sort((a, b) => b.cpu - a.cpu).forEach((process, index) => {
        list.appendChild(process.row);
        process.row.hidden = index > 3;
        process.value.textContent = `${process.cpu.toFixed(1)} %`;
        process.row.style.setProperty("--heat", Math.round(Math.min(40, process.cpu)));
      });
    }
    render();
    function tick() {
      processes.forEach((process) => {
        if (process === jumpd) process.cpu = Math.max(0.3, process.cpu * 0.45);
        else if (process.name !== "spitd") process.cpu = clamp(process.cpu + rand(-1.8, 1.8), 0.2, 24);
      });
      render();
      ctx.later(tick, 1000);
    }
    const SPEED = () => stage.clientWidth / 3000;
    function beat(delay) {
      const width = 12 * ctx.unit();
      const node = make("span", "pl-beat", '<svg viewBox="0 0 24 20" preserveAspectRatio="none"><path vector-effect="non-scaling-stroke" d="M0 10H7L9 5 11 18 13 1 16 10H24"/></svg>');
      beats.appendChild(node);
      slide(ctx, stage, node, width, SPEED(), delay).finished.then(() => node.remove(), () => node.remove());
      return contact(stage, lama, width, 0.29, 0.67, SPEED(), delay);
    }
    function pattern() {
      const double = Math.random() < 0.22;
      const first = beat(0);
      const window = double ? { enter: first.enter, exit: beat(420).exit } : first;
      const fumble = !double && Math.random() < 0.1;
      if (fumble) {
        ctx.later(() => { if (antics && !isNapping(antics)) antics.react((a) => a.move("trip"), "trip"); }, window.enter - 80);
      } else {
        jumpOver(ctx, antics, window, {
          doze: true,
          height: double ? 0.42 : 0.3,
          style: double ? pick(["flip", "tuck", "frontflip"]) : pick(["hop", "hop", "tuck", "kick", "twist"]),
          onPeak: () => { jumpd.cpu = rand(70, 99); render(); },
        });
      }
      ctx.later(pattern, rand(1700, 2600) + (double ? 700 : 0));
    }
    return {
      start() { tick(); pattern(); },
      stop() { beats.replaceChildren(); },
    };
  }

  /* MailLama: letters go in, trackers get butted out. ------------------------ */
  function mailLama(stage, antics, ctx) {
    const box = $(".ml-letters", stage);
    const lama = $(".scene-lama", stage);
    const envelope = $(".ml-envelope", stage);
    const inboxCount = $(".ml-inbox", stage);
    const blockedCount = $(".ml-blocked", stage);
    let inbox = 0;
    let blocked = 0;
    let sent = 0;
    const LETTER = '<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="4" fill="#FFF8EB"/><path d="M4 5l16 12L36 5" fill="none" stroke="#6D4AFF" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
    const TRACKER = '<svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="4" fill="#17171E" stroke="#F0EF52" stroke-width="1.5"/><circle cx="20" cy="14" r="7.5" fill="#FFF8EB"/><circle cx="21" cy="14" r="3.6" fill="#17171E"/><circle cx="22.4" cy="12.6" r="1.2" fill="#FFF8EB"/></svg>';
    const place = (x, y, u, spin = 0, scale = 1) => `translate(${x - 4 * u}px, ${y - 2.8 * u}px) rotate(${spin}deg) scale(${scale})`;
    function send() {
      sent += 1;
      const tracker = sent > 2 && Math.random() < 0.32;
      const u = ctx.unit();
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const lb = lamaBox(lama);
      const headX = lb.x + 0.27 * lb.w;
      const headY = lb.y + 0.2 * lb.w;
      const hitY = headY - 0.46 * lb.w - 2 * u;
      const envTop = H - 14 * u - 22.4 * u;
      const mouth = [6 * u + 16 * u, envTop + 9.6 * u];
      const points = [
        [W + 6 * u, hitY - 12 * u, 0],
        [headX, hitY, -8],
        [mouth[0] + 12 * u, hitY + 4 * u, -14],
        [mouth[0], mouth[1], -4],
      ];
      const lengths = [0];
      for (let i = 1; i < points.length; i += 1) {
        lengths.push(lengths[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
      }
      const total = lengths[lengths.length - 1];
      const duration = total / (W / 2600);
      const node = make("span", "ml-letter", tracker ? TRACKER : LETTER);
      box.appendChild(node);
      const frames = points.map(([x, y, spin], i) => ({ transform: place(x, y, u, spin, i === 3 ? 0.4 : 1), offset: lengths[i] / total, opacity: i === 3 ? 0.2 : 1 }));
      const flight = ctx.animate(node, frames, { duration, easing: "linear", fill: "forwards" });
      if (!tracker) {
        flight.finished.then(() => {
          node.remove();
          inbox += 1;
          inboxCount.textContent = inbox;
          envelope.classList.remove("ml-gulp");
          void envelope.getBoundingClientRect();
          envelope.classList.add("ml-gulp");
          if (antics && !antics.busy() && Math.random() < 0.25) antics.react((a) => a.move("hop"), "pleased");
        }, () => node.remove());
        return;
      }
      const hit = (lengths[1] / total) * duration;
      jumpOver(ctx, antics, { enter: hit - 120, exit: hit + 120 }, {
        minAir: 560, height: 0.36, style: pick(["hop", "kick"]),
        onPeak: (a) => a.bits("spark", 6, a.HEAD, { reach: 30, size: 7, duration: 600 }),
      });
      ctx.later(() => {
        flight.cancel();
        const [x, y] = points[1];
        ctx.animate(node, [
          { transform: place(x, y, u, -8) },
          { transform: place(x + 16 * u, y - 20 * u, u, 260, 0.9), offset: 0.45 },
          { transform: place(W + 20 * u, -20 * u, u, 720, 0.6), opacity: 0 },
        ], { duration: 800, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" }).finished.then(() => node.remove(), () => node.remove());
        blocked += 1;
        blockedCount.textContent = blocked;
      }, hit);
    }
    function loop() {
      send();
      ctx.later(loop, rand(1500, 2600));
    }
    return {
      start() { loop(); },
      stop() { box.replaceChildren(); },
    };
  }

  /* GitLama: commits run along the trunk; merges get a flip. ---------------- */
  function gitLama(stage, antics, ctx) {
    const box = $(".gl-commits", stage);
    const lama = $(".scene-lama", stage);
    const log = $(".gl-msg", stage);
    const sha = $(".gl-sha", stage);
    const text = $(".gl-text", stage);
    const MESSAGES = [
      "Polish the shades", "Remove the second L", "Add more hay to the cache", "Make the tail flick 12% sassier",
      "Teach the Lama to moonwalk", "Stop the Lama from eating the README", "Align ears to the 120-unit grid",
      "Rename spit() to share()", "Bump herd to five", "Revert \"Give the Lama a hat\"", "Fix hop timing on slow beats",
      "Graze the backlog", "Tighten the brow bar", "Document the nap schedule",
    ];
    const MERGES = ["Merge branch 'lamerge'", "Merge branch 'feature/shades' into main", "Merge branch 'more-hay'"];
    let count = 0;
    const hex = () => Array.from({ length: 7 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
    function commit(message) {
      sha.textContent = hex();
      text.textContent = message;
      log.classList.remove("is-new");
      void log.getBoundingClientRect();
      log.classList.add("is-new");
    }
    const SPEED = () => stage.clientWidth / 3200;
    function send() {
      count += 1;
      const merge = count % 5 === 0;
      const width = 5 * ctx.unit();
      const node = make("span", `gl-commit${merge ? " is-merge" : ""}`);
      box.appendChild(node);
      slide(ctx, stage, node, width, SPEED(), 0).finished.then(() => node.remove(), () => node.remove());
      const window = contact(stage, lama, width, 0, 1, SPEED(), 0);
      jumpOver(ctx, antics, window, {
        height: merge ? 0.45 : 0.3,
        minAir: merge ? 900 : 520,
        margin: merge ? 2 : 1.5,
        style: merge ? pick(["flip", "frontflip", "spin"]) : pick(["hop", "hop", "tuck", "kick"]),
        onPeak: (a) => {
          commit(merge ? pick(MERGES) : pick(MESSAGES));
          if (merge) a.bits("confetti", 14, a.HEAD, { angle: -Math.PI / 2, spread: 1, reach: 50, fall: 40, turn: 300, duration: 1200 });
        },
      });
      if (Math.random() < 0.45) {
        const branch = make("span", "gl-commit is-branch");
        box.appendChild(branch);
        slide(ctx, stage, branch, width, SPEED() * 0.8, rand(500, 900)).finished.then(() => branch.remove(), () => branch.remove());
      }
      ctx.later(send, rand(1800, 2700) + (merge ? 500 : 0));
    }
    return {
      start() { send(); },
      stop() { box.replaceChildren(); },
    };
  }

  /* ShotLama: the Lama poses for every capture; captures land in cards. ----- */
  function shotLama(stage, antics, ctx) {
    const lama = $(".scene-lama", stage);
    const corners = $(".sl-corners", stage);
    const flash = $(".sl-flash", stage);
    const cards = $(".sl-cards", stage);
    let busy = false;
    function card() {
      const shot = make("div", "sl-shot");
      shot.appendChild(corners.cloneNode(true));
      const copy = lama.cloneNode(true);
      if (antics) antics.snapshot(copy);
      shot.appendChild(copy);
      const node = make("div", "sl-card");
      node.appendChild(shot);
      cards.appendChild(node);
      const scale = node.clientWidth / stage.clientWidth;
      shot.style.transform = `scale(${scale})`;
      node.addEventListener("click", () => {
        node.animate([{ transform: "none" }, { transform: "translateX(140%) rotate(12deg)", opacity: 0 }], { duration: 320, easing: "ease-in", fill: "forwards" })
          .finished.then(() => node.remove());
      });
      while (cards.children.length > 3) cards.firstElementChild.remove();
      if (!reduced.matches) {
        const from = stage.getBoundingClientRect();
        const to = node.getBoundingClientRect();
        const dx = from.left + from.width / 2 - (to.left + to.width / 2);
        const dy = from.top + from.height / 2 - (to.top + to.height / 2);
        node.animate([
          { transform: `translate(${dx}px, ${dy}px) scale(${(from.width * 0.7) / to.width})`, opacity: 0.4 },
          { transform: "none", opacity: 1 },
        ], { duration: 560, easing: "cubic-bezier(.34,1.3,.64,1)" });
      }
    }
    async function capture() {
      if (busy) return;
      busy = true;
      stage.classList.add("is-capturing");
      if (!reduced.matches && antics) {
        const lead = 220;
        const air = 680;
        antics.react(async (a) => {
          const jump = a.jump({ lead, air, height: 0.36, style: pick(["flip", "frontflip", "tuck", "spin", "kick", "twist"]) });
          await jump;
        }, "pose");
        await sleep(lead + air / 2);
        flash.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: 300, easing: "ease-out" });
        antics.freeze(380);
      } else {
        await sleep(200);
      }
      card();
      await sleep(420);
      stage.classList.remove("is-capturing");
      busy = false;
    }
    const button = $(`[data-action="${stage.dataset.scene}"]`, stage.closest(".app"));
    if (button) button.addEventListener("click", capture);
    function loop() {
      capture();
      ctx.later(loop, rand(6500, 9000));
    }
    return {
      start() { ctx.later(loop, 1800); },
    };
  }

  /* NoteLama: the pen writes, the Lama watches, the page turns. ------------- */
  function noteLama(stage, antics, ctx) {
    const svg = $(".nl-book", stage);
    const rules = $(".nl-rules", svg);
    const ink = $(".nl-ink", svg);
    const pen = $(".nl-pen", svg);
    const turnPage = $(".nl-turn", svg);
    const LINES = 4;
    const line = (side, k, t) => side === "left"
      ? [44 + 140 * t, 224 + 14.5 * k - 6 * Math.sin(Math.PI * t) - 4 * t]
      : [216 + 140 * t, 220 + 14.5 * k - 6 * Math.sin(Math.PI * t) + 4 * t];
    const path = (d, parent) => {
      const node = document.createElementNS(SVG, "path");
      node.setAttribute("d", d);
      parent.appendChild(node);
      return node;
    };
    for (const side of ["left", "right"]) {
      for (let k = 0; k < LINES; k += 1) {
        let d = "";
        for (let i = 0; i <= 12; i += 1) {
          const [x, y] = line(side, k, i / 12);
          d += `${i ? "L" : "M"}${x.toFixed(1)} ${(y + 2).toFixed(1)}`;
        }
        path(d, rules);
      }
    }
    /* A line of handwriting: one path per word. SVG restarts a dash
       pattern at every subpath, so each word must be its own path for the
       ink to follow the pen. */
    function scribble(side, k) {
      const words = [];
      let t = rand(0, 0.04);
      const end = rand(0.62, 0.98);
      while (t < end) {
        const word = rand(0.08, 0.22);
        let phase = rand(0, Math.PI);
        let d = "";
        for (let s = t; s < Math.min(end, t + word); s += 0.006) {
          const [x, y] = line(side, k, s);
          phase += rand(0.7, 1.15);
          const tall = Math.random() < 0.05 ? -5 : 0;
          d += `${d ? "L" : "M"}${x.toFixed(1)} ${(y - 2.4 - 2.4 * Math.sin(phase) + tall).toFixed(1)}`;
        }
        if (d) words.push(d);
        t += word + rand(0.03, 0.05);
      }
      return words;
    }
    function writeWord(stroke) {
      const length = stroke.getTotalLength();
      stroke.style.strokeDasharray = `${length}px ${length}px`;
      stroke.style.strokeDashoffset = `${length}px`;
      stroke.style.visibility = "";
      const duration = length * 9;
      ctx.animate(stroke, [{ strokeDashoffset: `${length}px` }, { strokeDashoffset: "0px" }], { duration, easing: "linear", fill: "forwards" });
      const started = performance.now();
      return new Promise((resolve) => {
        ctx.frame((now) => {
          const progress = Math.min(1, (now - started) / duration);
          const point = stroke.getPointAtLength(progress * length);
          pen.setAttribute("transform", `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)}) rotate(24)`);
          if (progress >= 1) { stroke.style.strokeDashoffset = "0px"; resolve(); return false; }
          return true;
        });
      });
    }
    async function write(side, k, instant) {
      const strokes = scribble(side, k).map((d) => {
        const stroke = path(d, ink);
        stroke.dataset.side = side;
        if (!instant) stroke.style.visibility = "hidden";
        return stroke;
      });
      if (instant) return;
      for (const stroke of strokes) {
        await writeWord(stroke);
        await ctx.wait(rand(60, 140));
      }
    }
    const flipFrames = () => {
      const frames = [];
      for (let i = 0; i <= 16; i += 1) {
        const theta = (Math.PI * i) / 16;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        frames.push({ transform: `matrix(${cos.toFixed(4)}, ${(-0.3 * sin).toFixed(4)}, 0, 1, ${(200 * (1 - cos)).toFixed(2)}, ${(60 * sin).toFixed(2)})` });
      }
      return frames;
    };
    async function turn() {
      pen.style.opacity = "0";
      const duration = 1500;
      /* The Lama crouches first; then the page lifts under it. */
      const crouch = 260;
      if (antics) {
        antics.face("right");
        jumpOver(ctx, antics, { enter: crouch + duration * 0.08, exit: crouch + duration * 0.88 }, { minAir: 900, margin: 1.15, height: 0.62, style: pick(["hop", "tuck", "flip"]) });
      }
      await ctx.wait(crouch);
      turnPage.style.opacity = "1";
      $$("path[data-side='right']", ink).forEach((node) => ctx.animate(node, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" }));
      await ctx.animate(turnPage, flipFrames(), { duration, easing: "ease-in-out" }).finished;
      ink.replaceChildren();
      turnPage.style.opacity = "0";
      pen.style.opacity = "1";
    }
    /* A page already half written, so the scene never starts empty. */
    write("left", 0, true);
    write("left", 1, true);
    pen.setAttribute("transform", "translate(120 244) rotate(24)");
    let side = "left";
    let k = 2;
    return {
      async start() {
        for (;;) {
          if (antics && !antics.busy()) antics.face(side);
          await write(side, k);
          await ctx.wait(rand(250, 600));
          k += 1;
          if (k === LINES) {
            k = 0;
            if (side === "left") side = "right";
            else { side = "left"; await turn(); await ctx.wait(400); }
          }
        }
      },
      stop() { if (antics) antics.face(null); },
    };
  }

  const SCENES = { mimameidr: processLama, crossproton: mailLama, northspline: gitLama, shotlama: shotLama, nibluma: noteLama };
  $$("[data-scene]").forEach((stage) => {
    const id = stage.dataset.scene;
    const antics = attachLama($(".scene-lama", stage), data.apps[id].colors);
    runner(stage, (ctx) => SCENES[id](stage, antics, ctx));
  });

  /* Anatomy: build a Lama from circles ------------------------------------- */
  const buildStage = $("[data-build-stage]");
  const buildSteps = $$(".build-steps li");
  let buildTimers = [];
  function build() {
    buildTimers.forEach(clearTimeout);
    buildStage.classList.remove("is-step-1", "is-step-2", "is-step-3", "is-done");
    buildSteps.forEach((step) => step.classList.remove("is-on"));
    void buildStage.getBoundingClientRect();
    const steps = reduced.matches ? [0, 0, 0, 0] : [60, 2000, 3900, 4800];
    const at = (index, fn) => buildTimers.push(setTimeout(fn, steps[index]));
    [1, 2, 3].forEach((n, index) => at(index, () => {
      buildStage.classList.add(`is-step-${n}`);
      buildSteps.forEach((step) => step.classList.toggle("is-on", step.dataset.step === String(n)));
    }));
    at(3, () => buildStage.classList.add("is-done"));
  }
  if ("IntersectionObserver" in window) {
    const once = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { build(); once.disconnect(); }
    }, { threshold: 0.45 });
    once.observe(buildStage);
  } else {
    build();
  }
  $("[data-build-again]").addEventListener("click", build);

  /* Meridian studio --------------------------------------------------------- */
  const mock = $("[data-mock]");
  const chips = $$(".chip");
  const modes = $$(".segmented [data-mode]");
  const fact = (name) => $(`[data-f="${name}"]`);
  let studioBrand = chips[0].dataset.brand;
  let studioMode = root.dataset.theme;
  function renderStudio() {
    const brand = data.brands[studioBrand];
    const colors = brand[studioMode];
    Object.entries(colors).forEach(([name, value]) => mock.style.setProperty(`--m-${name}`, value));
    mock.style.setProperty("--m-row", `${brand.row}px`);
    mock.style.setProperty("--m-r", `${brand.radius}px`);
    mock.style.setProperty("--m-rl", `${brand.radiusLg}px`);
    const content = data.studio[studioBrand][language];
    $("[data-m-title]", mock).textContent = brand.app;
    $(".m-island-head strong", mock).textContent = content.title;
    $(".m-island-head small", mock).textContent = brand.app;
    $(".m-button", mock).textContent = content.button;
    $("[data-m-rows]", mock).replaceChildren(...content.rows.map(([label, value], index) => {
      const row = make("div", `m-row${index === 1 ? " is-selected" : ""}`);
      row.append(make("i"), make("b"), make("span"));
      row.children[1].textContent = label;
      row.children[2].textContent = value;
      return row;
    }));
    const set = (name, value) => {
      const node = fact(name);
      if (node.textContent === value) return;
      node.textContent = value;
      node.closest("dd").classList.remove("is-new");
      void node.getBoundingClientRect();
      node.closest("dd").classList.add("is-new");
    };
    set("meridian", `${brand.meridian}`);
    set("accent", `${brand.accentName} ${colors.accent}`);
    set("density", `${t(`density.${brand.density}`)} · ${t("studio.rows").replace("{row}", brand.row)}`);
    set("radius", `${brand.radius} px`);
    set("face", brand.face || t("studio.face_platform"));
    fact("accent-swatch").style.background = colors.accent;
    chips.forEach((chip) => chip.setAttribute("aria-pressed", String(chip.dataset.brand === studioBrand)));
    modes.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mode === studioMode)));
  }
  chips.forEach((chip) => chip.addEventListener("click", () => { studioBrand = chip.dataset.brand; renderStudio(); }));
  modes.forEach((button) => button.addEventListener("click", () => { studioMode = button.dataset.mode; renderStudio(); }));
  themeListeners.push((theme) => { studioMode = theme; renderStudio(); });
  languageListeners.push(renderStudio);
  /* Each herd Lama on the meadow also tints the studio when visited. */
  herdLamas.forEach((lama) => lama.addEventListener("click", () => { studioBrand = lama.dataset.herd; renderStudio(); }));
  renderStudio();

  /* The stampede ------------------------------------------------------------ */
  function stampede() {
    if ($(".stampede")) return;
    const layer = make("div", "stampede");
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
    const ids = Object.keys(data.apps);
    const width = window.innerWidth;
    const runs = [];
    const count = reduced.matches ? ids.length : Math.min(34, Math.round(width / 40));
    for (let i = 0; i < count; i += 1) {
      const size = reduced.matches ? 72 : rand(46, 128);
      const img = make("img");
      img.src = `${LAMA}herd-${ids[i % ids.length]}.svg`;
      img.alt = "";
      img.style.cssText = `width:${size}px;height:${size}px;bottom:${rand(-size * 0.06, 70 - size * 0.3)}px;z-index:${Math.round(size)}`;
      layer.appendChild(img);
      if (reduced.matches) {
        img.style.left = `${12 + i * 16}%`;
        runs.push(img.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 2400, fill: "both" }).finished);
        continue;
      }
      const span = width + size * 2;
      const hops = Math.round(rand(7, 11));
      const frames = [];
      for (let step = 0; step <= hops * 2; step += 1) {
        const up = step % 2 === 1;
        frames.push({ transform: `translate(${-(step / (hops * 2)) * span}px, ${up ? -size * rand(0.25, 0.45) : 0}px) ${up ? "rotate(-6deg)" : ""}` });
      }
      runs.push(img.animate(frames, { duration: rand(2600, 4200) * (1 + (128 - size) / 260), delay: rand(0, 2400), easing: "linear", fill: "backwards" }).finished);
    }
    if (!reduced.matches) {
      const dust = make("div", "dust");
      layer.appendChild(dust);
      dust.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 6500, fill: "both" });
      $("main").animate([
        { transform: "none" }, { transform: "translate(1px, -1px)" }, { transform: "translate(-1px, 1px)" }, { transform: "none" },
      ], { duration: 140, iterations: 18, delay: 400 });
      controllers.forEach((controller) => {
        const box = controller.box();
        if (box.bottom > 0 && box.top < window.innerHeight) controller.play("herd");
      });
    }
    Promise.all(runs).then(() => layer.remove());
  }
  $("[data-stampede]").addEventListener("click", stampede);

  const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  let keys = [];
  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.target.closest("input, textarea, select")) return;
    keys = [...keys, event.key.toLowerCase()].slice(-KONAMI.length);
    if (keys.join(",").endsWith("l,a,m,a") || keys.join(",") === KONAMI.join(",")) {
      keys = [];
      stampede();
    }
  });

  setTheme(root.dataset.theme);
})();
