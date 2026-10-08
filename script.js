/* =========================================================
   If You Were a…  |  Day 4  |  for Aakansha
   Edit CONFIG below to personalise. Everything else just works.
   ========================================================= */
const CONFIG = {
  name: "Aakansha",
  birthday: { month: 10, day: 31 },          // 31 October

  // Keep this path relative to index.html; the audio file is in the project root.
  songFile: "namz-nazm.mp3",
  songStartAt: 20,                            // seconds to skip (the long instrumental intro)
  songTitle: "Nazm Nazm",
  songArtist: "Arko",
  // Your own words, shown one by one while the song plays (no original lyrics).
  songLines: [
    "Soft, slow, and somehow always about you.",
    "you always feel like a poem I read twice.",
    "Quiet enough to hear, deep enough to stay.",
    "Best played on a night, thinking of you."
  ],

  secretMessage:
    "You found the moon. I want you to know this that I'm really glad you exist in my life. Everyday I thank the universe for bringing you to me. I love you, Akshu.",

  finalLine:
    "I could say you're a lily, a forest, a song or a city… but In reality, you're just Aakansha, my Aakansha. You're my world. And no list can hold that."
};

/* ---------- tiny helpers ---------- */
const $ = (id) => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const ease = (x) => 1 - Math.pow(1 - x, 3);
const TAU = Math.PI * 2;
function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
 
/* ---------- sound (all effects are synthesised, no files needed) ---------- */
const SFX = {
  ctx: null, master: null, rainNode: null, muted: false,
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  },
  noise(sec) {
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate * sec, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  },
  flip() {
    if (!this.ctx) return;
    const s = this.ctx.createBufferSource(); s.buffer = this.noise(0.25);
    const f = this.ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2200; f.Q.value = 0.8;
    const g = this.ctx.createGain(); const t = this.ctx.currentTime;
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t);
  },
  chime(base = 660) {
    if (!this.ctx) return;
    [1, 1.5, 2, 3].forEach((m, i) => {
      const o = this.ctx.createOscillator(); o.type = "sine"; o.frequency.value = base * m;
      const g = this.ctx.createGain(); const t = this.ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18 / (i + 1), t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 2.4);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 2.5);
    });
  },
  pink(sec) {
    const c = this.ctx, n = c.sampleRate * sec, b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852;
        b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926;
      }
    }
    return b;
  },
  /* Real-feeling rain = soft wash bed + distant rumble + lots of tiny random drops */
  rainOn() {
    if (!this.ctx || this.rainNode) return;
    const c = this.ctx, t = c.currentTime;
    const out = c.createGain(); out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(1, t + 2.5); out.connect(this.master);
    const srcs = [];
    // 1) bed: filtered pink noise (the "hiss" of thousands of drops)
    const bed = c.createBufferSource(); bed.buffer = this.pink(5); bed.loop = true;
    const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 500;
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 6500;
    const bedG = c.createGain(); bedG.gain.value = .5;
    bed.connect(hp); hp.connect(lp); lp.connect(bedG); bedG.connect(out);
    // slow swell so the intensity breathes
    const lfo = c.createOscillator(); lfo.frequency.value = .09;
    const lfoG = c.createGain(); lfoG.gain.value = .14; lfo.connect(lfoG); lfoG.connect(bedG.gain);
    // 2) low rumble / distance
    const rum = c.createBufferSource(); rum.buffer = this.pink(6); rum.loop = true;
    const rl = c.createBiquadFilter(); rl.type = "lowpass"; rl.frequency.value = 260;
    const rg = c.createGain(); rg.gain.value = .55; rum.connect(rl); rl.connect(rg); rg.connect(out);
    bed.start(); rum.start(); lfo.start(); srcs.push(bed, rum, lfo);
    // 3) individual drops hitting surfaces
    const drop = c.createBuffer(1, Math.floor(c.sampleRate * .06), c.sampleRate);
    const dd = drop.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1;
    const timer = setInterval(() => {
      if (!this.ctx) return;
      const now = c.currentTime, n = 6 + Math.floor(Math.random() * 10);
      for (let i = 0; i < n; i++) {
        const st = now + Math.random() * .22;
        const s = c.createBufferSource(); s.buffer = drop; s.playbackRate.value = .7 + Math.random() * .8;
        const bp = c.createBiquadFilter(); bp.type = "bandpass";
        const big = Math.random() < .12;                       // occasional heavier plink
        bp.frequency.value = big ? 900 + Math.random() * 900 : 2200 + Math.random() * 5000; bp.Q.value = 2 + Math.random() * 7;
        const g = c.createGain(); const pk = (big ? .22 : .05) + Math.random() * .1, dec = big ? .09 : .025 + Math.random() * .03;
        g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(pk, st + .002); g.gain.exponentialRampToValueAtTime(.0005, st + dec);
        const pan = c.createStereoPanner ? c.createStereoPanner() : null;
        s.connect(bp); bp.connect(g);
        if (pan) { pan.pan.value = Math.random() * 2 - 1; g.connect(pan); pan.connect(out); } else g.connect(out);
        s.start(st); s.stop(st + dec + .05);
      }
    }, 200);
    this.rainNode = { out, srcs, timer };
  },
  rainOff() {
    if (!this.rainNode) return;
    const { out, srcs, timer } = this.rainNode; const t = this.ctx.currentTime;
    clearInterval(timer);
    out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(0, t + 1.2);
    setTimeout(() => srcs.forEach((x) => { try { x.stop(); } catch (e) {} }), 1300);
    this.rainNode = null;
  },
  pop(pitch = 1) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(300 * pitch, t); o.frequency.exponentialRampToValueAtTime(90, t + .12);
    const g = c.createGain(); g.gain.setValueAtTime(.4, t); g.gain.exponentialRampToValueAtTime(.001, t + .15);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + .2);
    const s = c.createBufferSource(); s.buffer = this.noise(.1);
    const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1400;
    const g2 = c.createGain(); g2.gain.setValueAtTime(.25, t); g2.gain.exponentialRampToValueAtTime(.001, t + .09);
    s.connect(f); f.connect(g2); g2.connect(this.master); s.start(t);
  },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 1;
    $("song").muted = m;
    $("mute").textContent = m ? "Sound off" : "Sound on";
  }
};
 
/* ---------- ambient embers behind the deck ---------- */
(function embers() {
  const c = $("embers"), g = c.getContext("2d");
  let W, H, dots = [];
  function size() { W = c.width = innerWidth; H = c.height = innerHeight; }
  size(); addEventListener("resize", size);
  for (let i = 0; i < 55; i++) dots.push({ x: rand(0, 1), y: rand(0, 1), r: rand(.6, 2), v: rand(.01, .04), p: rand(0, TAU) });
  (function draw(t) {
    g.clearRect(0, 0, W, H);
    dots.forEach((d) => {
      d.y -= d.v * 0.016; if (d.y < -0.02) { d.y = 1.02; d.x = Math.random(); }
      const x = d.x * W + Math.sin(t / 1500 + d.p) * 14, y = d.y * H;
      const a = 0.35 + 0.35 * Math.sin(t / 700 + d.p);
      g.fillStyle = `rgba(217,140,80,${a})`; g.shadowColor = "#d96a2b"; g.shadowBlur = 10;
      g.beginPath(); g.arc(x, y, d.r, 0, TAU); g.fill();
    });
    requestAnimationFrame(draw);
  })(0);
})();
 
/* ---------- stage engine ---------- */
const stage = { open: false, stop: null, S: null };
const canvas = $("stage-canvas"), g2 = canvas.getContext("2d");
 
function sizeStage() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  const w = innerWidth, h = innerHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  g2.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (stage.S) { stage.S.W = w; stage.S.H = h; }
}
addEventListener("resize", () => stage.open && sizeStage());
 
function run(S, draw) {
  let id, last = performance.now(), t = 0;
  (function f(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    draw(t, dt); id = requestAnimationFrame(f);
  })(last);
  return () => cancelAnimationFrame(id);
}
 
function openStage(card, onClose) {
  SFX.init();
  stage.open = true;
  $("stage").classList.remove("hidden");
  $("stage-overlay").innerHTML = "";
  $("stage-title").textContent = card.title;
  $("stage-caption").textContent = card.caption || "";
  $("stage-hint").textContent = card.hint || "";
  const S = stage.S = {
    g: g2, W: innerWidth, H: innerHeight,
    overlay: $("stage-overlay"),
    ptr: { x: innerWidth / 2, y: innerHeight / 2 },
    onTap: null,
    caption: (t) => ($("stage-caption").textContent = t),
    hint: (t) => ($("stage-hint").textContent = t),
    cleanups: []
  };
  sizeStage();
  stage.onClose = onClose;
  stage.stop = card.scene(S);
}
function closeStage() {
  if (!stage.open) return;
  stage.open = false;
  if (stage.stop) stage.stop();
  SFX.rainOff();
  const song = $("song"); if (!song.paused) song.pause();
  $("stage").classList.add("hidden");
  stage.S = null;
  if (stage.onClose) stage.onClose();
}
canvas.addEventListener("pointerdown", (e) => { if (stage.S) { stage.S.ptr = { x: e.clientX, y: e.clientY }; stage.S.onTap && stage.S.onTap(e.clientX, e.clientY); } });
canvas.addEventListener("pointermove", (e) => { if (stage.S) stage.S.ptr = { x: e.clientX, y: e.clientY }; });
$("close").addEventListener("click", closeStage);
$("mute").addEventListener("click", () => SFX.setMuted(!SFX.muted));
addEventListener("keydown", (e) => e.key === "Escape" && closeStage());
 
/* =========================================================
   SCENES
   ========================================================= */
 
/* 1. Lily: a dark violet lily slowly opens */
function sceneLily(S) {
  const fall = [];
  let spawnT = 0;
  const petal = (g, L, w) => {
    g.beginPath(); g.moveTo(0, 0);
    g.bezierCurveTo(w, -L * .25, w * .9, -L * .75, 0, -L);
    g.bezierCurveTo(-w * .9, -L * .75, -w, -L * .25, 0, 0); g.closePath();
  };
  S.onTap = (x, y) => { for (let i = 0; i < 8; i++) fall.push({ x, y, vx: rand(-40, 40), vy: rand(-60, 10), r: rand(0, TAU), vr: rand(-2, 2), s: rand(.5, 1) }); SFX.chime(520); };
  return run(S, (t, dt) => {
    const { g, W, H } = S; g.clearRect(0, 0, W, H);
    const bg = g.createRadialGradient(W / 2, H * .4, 10, W / 2, H * .4, H * .8);
    bg.addColorStop(0, "#1d0f33"); bg.addColorStop(1, "#050309"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const bloom = ease(Math.min(1, Math.max(0, (t - .8) / 5)));
    const cx = W / 2, cy = H * .4, L = Math.min(W, H * .8) * .3;
    // glow
    const gl = g.createRadialGradient(cx, cy, 0, cx, cy, L * 2.2);
    gl.addColorStop(0, `rgba(140,90,220,${.35 * bloom})`); gl.addColorStop(1, "transparent");
    g.fillStyle = gl; g.fillRect(0, 0, W, H);
    // stem
    g.strokeStyle = "#1f4a3a"; g.lineWidth = 6; g.lineCap = "round";
    g.beginPath(); g.moveTo(cx, H * .85); g.quadraticCurveTo(cx + Math.sin(t) * 6 + 18, H * .62, cx, cy + L * .15); g.stroke();
    // petals (back to front)
    const sway = Math.sin(t * .8) * .03;
    const set = [[-72, 1, .95], [72, 1, .95], [0, 1.05, 1], [-36, .9, .9], [36, .9, .9]];
    set.forEach(([deg, len, wid]) => {
      g.save(); g.translate(cx, cy); g.rotate(deg * Math.PI / 180 * bloom + sway);
      const l = L * len * (.82 + .18 * bloom), w = L * .3 * wid * (.5 + .5 * bloom);
      const gr = g.createLinearGradient(0, 0, 0, -l);
      gr.addColorStop(0, "#e9d6ff"); gr.addColorStop(.15, "#5a2d8c"); gr.addColorStop(.7, "#7b46b8"); gr.addColorStop(1, "#2a1048");
      g.fillStyle = gr; g.shadowColor = "rgba(150,100,230,.6)"; g.shadowBlur = 24; petal(g, l, w); g.fill();
      g.shadowBlur = 0; g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(0, -l * .05); g.lineTo(0, -l * .92); g.stroke();
      g.restore();
    });
    // stamens
    if (bloom > .5) {
      const a = (bloom - .5) * 2;
      for (let i = -2; i <= 3; i++) {
        const ang = (-90 + i * 14) * Math.PI / 180, len = L * .55 * a;
        const x = cx + Math.cos(ang) * len, y = cy + Math.sin(ang) * len;
        g.strokeStyle = "rgba(217,180,106,.8)"; g.lineWidth = 2;
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke();
        g.fillStyle = "#d9b46a"; g.beginPath(); g.arc(x, y, 3.5, 0, TAU); g.fill();
      }
    }
    // falling petals
    if (bloom > .95) { spawnT += dt; if (spawnT > .5) { spawnT = 0; fall.push({ x: cx + rand(-L, L), y: cy - L * .6, vx: rand(-15, 15), vy: rand(15, 35), r: rand(0, TAU), vr: rand(-1, 1), s: rand(.4, .8) }); } }
    for (let i = fall.length - 1; i >= 0; i--) {
      const p = fall[i]; p.vy += 60 * dt * (p.vy < 40 ? 1 : 0); p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = "rgba(140,90,210,.75)"; petal(g, 22 * p.s, 8 * p.s); g.fill(); g.restore();
      if (p.y > H + 30) fall.splice(i, 1);
    }
  });
}
 
/* 2. Season: rain, tap for snow */
function sceneSeason(S) {
  let mode = 0, mix = 0;
  const drops = Array.from({ length: 160 }, () => ({ x: rand(0, 1), y: rand(0, 1), v: rand(.9, 1.6), l: rand(10, 24) }));
  const flakes = Array.from({ length: 120 }, () => ({ x: rand(0, 1), y: rand(0, 1), v: rand(.04, .1), r: rand(1, 3.2), p: rand(0, TAU) }));
  const glass = Array.from({ length: 14 }, () => ({ x: rand(0, 1), y: rand(0, 1), r: rand(3, 7), v: rand(.01, .04), wait: rand(0, 3) }));
  SFX.rainOn();
  S.hint("Tap the screen to change the season.");
  S.caption("You're the rain that makes everyone slow down and breathe.");
  S.onTap = () => {
    mode = 1 - mode;
    if (mode) { SFX.rainOff(); S.caption("And you're the winter: quiet, soft, and warm in the right company."); S.hint("Tap again for the rain."); SFX.chime(780); }
    else { SFX.rainOn(); S.caption("You're the rain that makes everyone slow down and breathe."); S.hint("Tap the screen to change the season."); }
  };
  return run(S, (t, dt) => {
    const { g, W, H } = S; mix += ((mode ? 1 : 0) - mix) * Math.min(1, dt * 1.5);
    const bg = g.createLinearGradient(0, 0, 0, H);
    const m = (a, b) => Math.round(a + (b - a) * mix);
    bg.addColorStop(0, `rgb(${m(14, 30)},${m(22, 38)},${m(40, 62)})`); bg.addColorStop(1, `rgb(${m(4, 10)},${m(6, 12)},${m(14, 24)})`);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // rain
    g.strokeStyle = `rgba(170,200,255,${.45 * (1 - mix)})`; g.lineWidth = 1.2;
    drops.forEach((d) => {
      d.y += d.v * dt * 1.2; if (d.y > 1.05) { d.y = -.05; d.x = Math.random(); }
      const x = d.x * W, y = d.y * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + d.l); g.stroke();
    });
    // glass drops
    glass.forEach((d) => {
      if (d.wait > 0) { d.wait -= dt; } else { d.y += d.v * dt; if (d.y > 1) { d.y = rand(0, .2); d.x = Math.random(); d.wait = rand(1, 4); } }
      const x = d.x * W, y = d.y * H;
      g.fillStyle = `rgba(200,220,255,${.25 * (1 - mix)})`; g.beginPath(); g.ellipse(x, y, d.r * .7, d.r, 0, 0, TAU); g.fill();
    });
    // snow
    flakes.forEach((f) => {
      f.y += f.v * dt; if (f.y > 1.03) { f.y = -.03; f.x = Math.random(); }
      const x = f.x * W + Math.sin(t + f.p) * 18, y = f.y * H;
      g.fillStyle = `rgba(255,255,255,${.85 * mix})`; g.beginPath(); g.arc(x, y, f.r, 0, TAU); g.fill();
    });
  });
}
 
/* 3. City: night ride on a bike */
function sceneCity(S) {
  const R = mulberry(7);
  const layer = (n, minH, maxH, color, speed, dim) => {
    const bs = []; let x = 0;
    for (let i = 0; i < n; i++) { const w = 50 + R() * 70, h = minH + R() * (maxH - minH); bs.push({ x, w, h, seed: R() * 99 }); x += w + R() * 10; }
    return { bs, total: x, color, speed, dim };
  };
  const layers = [layer(26, .18, .42, "#140b26", 14, .45), layer(24, .22, .5, "#0e0819", 45, .75), layer(18, .28, .58, "#09060f", 120, 1)];
  const rain = Array.from({ length: 90 }, () => ({ x: rand(0, 1), y: rand(0, 1), v: rand(1, 1.8) }));
  let rot = 0;
  S.hint("Ride along. Tap for a flash of lightning.");
  S.caption("You're the city that shows its best side after dark. Lights on, windows glowing, and a ride that never needs a destination.");
  let flash = 0;
  SFX.rainOn();
  S.onTap = () => { flash = 1; };
  return run(S, (t, dt) => {
    const { g, W, H } = S; const roadY = H * .66;
    const sky = g.createLinearGradient(0, 0, 0, roadY);
    sky.addColorStop(0, "#07040d"); sky.addColorStop(.7, "#231040"); sky.addColorStop(1, "#4b1d4f"); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // moon
    g.fillStyle = "rgba(255,246,220,.85)"; g.shadowColor = "#fff2c8"; g.shadowBlur = 40; g.beginPath(); g.arc(W * .8, H * .12, 18, 0, TAU); g.fill(); g.shadowBlur = 0;
    // buildings
    layers.forEach((L) => {
      const off = (t * L.speed) % L.total;
      for (let rep = -1; rep <= Math.ceil(W / L.total) + 1; rep++) {
        L.bs.forEach((b) => {
          const x = b.x - off + rep * L.total, h = b.h * H;
          if (x > W || x + b.w < 0) return;
          g.fillStyle = L.color; g.fillRect(x, roadY - h, b.w, h);
          const cols = Math.floor((b.w - 8) / 11), rows = Math.floor((h - 12) / 17);
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            const k = Math.sin(b.seed * 13.1 + r * 7.3 + c * 3.7) * 43758.5; const q = k - Math.floor(k);
            if (q < .5) continue;
            const tw = q > .92 ? .55 + .45 * Math.sin(t * 3 + q * 40) : 1;
            g.fillStyle = (q > .75 ? `rgba(120,200,255,` : `rgba(255,205,120,`) + (.8 * L.dim * tw) + ")";
            g.fillRect(x + 6 + c * 11, roadY - h + 8 + r * 17, 6, 9);
          }
        });
      }
    });
    // road
    const rd = g.createLinearGradient(0, roadY, 0, H); rd.addColorStop(0, "#1a1226"); rd.addColorStop(1, "#07050b");
    g.fillStyle = rd; g.fillRect(0, roadY, W, H - roadY);
    // street lights + reflections
    const gap = 300, loff = (t * 260) % gap;
    for (let x = -loff; x < W + gap; x += gap) {
      g.strokeStyle = "#0b0812"; g.lineWidth = 5; g.beginPath(); g.moveTo(x, roadY + 6); g.lineTo(x, roadY - H * .26); g.stroke();
      const lg = g.createRadialGradient(x, roadY - H * .26, 0, x, roadY - H * .26, 90);
      lg.addColorStop(0, "rgba(255,210,130,.75)"); lg.addColorStop(1, "transparent"); g.fillStyle = lg; g.fillRect(x - 100, roadY - H * .26 - 100, 200, 200);
      const rf = g.createLinearGradient(0, roadY, 0, H); rf.addColorStop(0, "rgba(255,200,120,.28)"); rf.addColorStop(1, "transparent");
      g.fillStyle = rf; g.fillRect(x - 8, roadY, 16, (H - roadY));
    }
    // lane dashes
    g.fillStyle = "rgba(239,230,216,.35)"; const doff = (t * 260) % 90;
    for (let x = -doff; x < W; x += 90) g.fillRect(x, roadY + (H - roadY) * .62, 44, 3);
    // bike
    const r = Math.min(W, H) * .045, bx = W * .42, by = roadY + (H - roadY) * .38 - r;
    rot += dt * 260 / r;
    const hl = g.createLinearGradient(bx + r * 2, by, bx + r * 12, by);
    hl.addColorStop(0, "rgba(255,240,200,.45)"); hl.addColorStop(1, "transparent");
    g.fillStyle = hl; g.beginPath(); g.moveTo(bx + r * 1.9, by - r * .3); g.lineTo(bx + r * 12, by - r * 2); g.lineTo(bx + r * 12, by + r * 1.8); g.closePath(); g.fill();
    g.strokeStyle = "#efe6d8"; g.lineWidth = 2.2; g.lineCap = "round";
    [bx - r * 1.7, bx + r * 1.7].forEach((wx) => {
      g.beginPath(); g.arc(wx, by, r, 0, TAU); g.stroke();
      g.lineWidth = 1; for (let i = 0; i < 6; i++) { const a = rot + i * Math.PI / 3; g.beginPath(); g.moveTo(wx, by); g.lineTo(wx + Math.cos(a) * r, by + Math.sin(a) * r); g.stroke(); }
      g.lineWidth = 2.2;
    });
    const Rr = [bx - r * 1.7, by], F = [bx + r * 1.7, by], B = [bx - r * .1, by], Sd = [bx - r * .8, by - r * 2], Hd = [bx + r * 1.1, by - r * 2.1];
    const ln = (a, b) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
    ln(Rr, B); ln(B, Sd); ln(Sd, Rr); ln(Sd, Hd); ln(B, Hd); ln(F, Hd);
    // rider (girl: slim silhouette, long flowing hair, jacket tail, red scarf)
    const sh = [bx + r * .1, by - r * 3.5], hip = [Sd[0] + r * .15, Sd[1] - r * .1];
    const head = [sh[0] + r * .3, sh[1] - r * .6];
    const ped = [B[0] + Math.cos(rot * .6) * r * .5, B[1] + Math.sin(rot * .6) * r * .5];
    const knee = [(hip[0] + ped[0]) / 2 + r * .55, (hip[1] + ped[1]) / 2];
    g.lineCap = "round"; g.lineJoin = "round";
    g.strokeStyle = "#000"; g.lineWidth = r * .46; ln(hip, sh);            // torso
    g.lineWidth = r * .26; ln(sh, Hd);                                        // arm
    g.lineWidth = r * .3; ln(hip, knee); ln(knee, ped);                        // leg
    // jacket tail flowing back
    g.fillStyle = "#000"; g.strokeStyle = "rgba(239,230,216,.3)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(hip[0] + r * .1, hip[1] - r * .5); g.lineTo(hip[0] - r * 1.5 + Math.sin(t * 8) * r * .1, hip[1] + r * .25 + Math.sin(t * 8 + 1) * r * .12); g.lineTo(hip[0] + r * .1, hip[1] + r * .3); g.closePath(); g.fill(); g.stroke();
    // long hair strands streaming behind
    [[0, 1, .38], [.16, .85, .3], [.3, .65, .24]].forEach(([oy, ln2, wd]) => {
      const top = [], bot = [];
      for (let i = 0; i <= 12; i++) {
        const k = i / 12, x = head[0] - r * .15 - k * r * 3.4 * ln2;
        const y = head[1] - r * .1 + oy * r + k * r * .9 + Math.sin(t * 7 - i * .7) * r * .16 * k * 2.2;
        const w = r * wd * (1 - k * .85);
        top.push([x, y - w * .5]); bot.push([x, y + w * .5]);
      }
      g.beginPath(); top.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); bot.reverse().forEach((p) => g.lineTo(p[0], p[1])); g.closePath();
      g.fillStyle = "#000"; g.fill(); g.strokeStyle = "rgba(239,230,216,.28)"; g.lineWidth = 1; g.stroke();
    });
    // head, with a small gold hair clip
    g.fillStyle = "#000"; g.strokeStyle = "rgba(239,230,216,.6)"; g.lineWidth = 1.2;
    g.beginPath(); g.arc(head[0], head[1], r * .4, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = "#d9b46a"; g.beginPath(); g.arc(head[0] - r * .08, head[1] - r * .3, r * .08, 0, TAU); g.fill();
    // scarf
    g.strokeStyle = "#a3122b"; g.lineWidth = r * .2; g.beginPath(); g.moveTo(sh[0] + r * .15, sh[1] - r * .15);
    for (let i = 1; i <= 6; i++) g.lineTo(sh[0] + r * .15 - i * r * .42, sh[1] - r * .15 + Math.sin(t * 9 - i * .8) * r * .14 * i * .4);
    g.stroke();
    // rain
    g.strokeStyle = "rgba(180,200,255,.28)"; g.lineWidth = 1;
    rain.forEach((d) => { d.y += d.v * dt * 1.4; if (d.y > 1) { d.y = 0; d.x = Math.random(); } g.beginPath(); g.moveTo(d.x * W, d.y * H); g.lineTo(d.x * W - 4, d.y * H + 16); g.stroke(); });
    if (flash > 0) { g.fillStyle = `rgba(210,220,255,${flash * .5})`; g.fillRect(0, 0, W, H); flash -= dt * 2.2; }
  });
}
 
/* 4. Forest: fireflies and mist */
function sceneForest(S) {
  const R = mulberry(21);
  const rows = [0, 1, 2].map((i) => Array.from({ length: 14 }, () => ({ x: R(), h: .22 + R() * .3 + i * .05, w: .05 + R() * .04 })));
  const flies = Array.from({ length: 45 }, () => ({ x: rand(0, 1), y: rand(.35, .85), p: rand(0, TAU), s: rand(.2, .6) }));
  const mist = Array.from({ length: 6 }, (_, i) => ({ x: rand(0, 1), y: .55 + i * .06, v: rand(.01, .03) * (i % 2 ? 1 : -1) }));
  S.hint("Tap to call more fireflies.");
  S.onTap = (x, y) => { for (let i = 0; i < 8; i++) flies.push({ x: x / S.W + rand(-.05, .05), y: y / S.H + rand(-.05, .05), p: rand(0, TAU), s: rand(.2, .6) }); if (flies.length > 140) flies.splice(0, 8); };
  const pine = (g, x, base, h, w, col) => {
    g.fillStyle = col;
    for (let k = 0; k < 4; k++) { const y0 = base - h * (k * .22), ww = w * (1 - k * .2); g.beginPath(); g.moveTo(x, y0 - h * .4); g.lineTo(x - ww, y0); g.lineTo(x + ww, y0); g.closePath(); g.fill(); }
    g.fillRect(x - 3, base, 6, 14);
  };
  return run(S, (t) => {
    const { g, W, H } = S;
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#050b0c"); bg.addColorStop(.6, "#0b1f1c"); bg.addColorStop(1, "#030706");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const mg = g.createRadialGradient(W * .7, H * .1, 5, W * .7, H * .1, H * .5); mg.addColorStop(0, "rgba(200,230,210,.25)"); mg.addColorStop(1, "transparent"); g.fillStyle = mg; g.fillRect(0, 0, W, H);
    const cols = ["#0a1a18", "#07130f", "#040a08"];
    rows.forEach((row, i) => row.forEach((p) => {
      const x = p.x * W + Math.sin(t * .5 + p.x * 9) * 3 * (i + 1);
      pine(g, x, H * (.62 + i * .1), p.h * H * .9, p.w * W * 1.3, cols[i]);
    }));
    mist.forEach((m, i) => {
      m.x += m.v * .016; if (m.x > 1.3) m.x = -.3; if (m.x < -.3) m.x = 1.3;
      const gr = g.createRadialGradient(m.x * W, m.y * H, 0, m.x * W, m.y * H, W * .5);
      gr.addColorStop(0, "rgba(170,210,200,.11)"); gr.addColorStop(1, "transparent"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    });
    flies.forEach((f) => {
      const x = (f.x + Math.sin(t * f.s + f.p) * .03) * W, y = (f.y + Math.cos(t * f.s * 1.3 + f.p) * .025) * H;
      const a = .35 + .65 * Math.max(0, Math.sin(t * 1.6 + f.p));
      const gr = g.createRadialGradient(x, y, 0, x, y, 14); gr.addColorStop(0, `rgba(230,255,150,${a})`); gr.addColorStop(1, "transparent");
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, 14, 0, TAU); g.fill();
    });
  });
}
 
/* 5. Color: black that holds every colour (slow ink in the dark) */
function sceneBlack(S) {
  S.overlay.innerHTML = '<div class="black-word">Black</div>';
  S.hint("Tap to drop a little colour.");
  const cols = ["163,18,43", "107,63,160", "217,180,106", "20,110,125", "190,60,120"];
  const blobs = cols.map((c, i) => ({ c, ax: rand(.15, .35), ay: rand(.1, .25), fx: rand(.06, .14), fy: rand(.05, .12), px: rand(0, TAU), py: rand(0, TAU), cx: rand(.25, .75), cy: rand(.25, .7), r: rand(.35, .6) }));
  const dust = Array.from({ length: 80 }, () => ({ x: rand(0, 1), y: rand(0, 1), v: rand(.005, .02), r: rand(.5, 1.6), p: rand(0, TAU) }));
  const drops = [];
  S.onTap = (x, y) => { drops.push({ x, y, r: 0, c: cols[Math.floor(rand(0, cols.length))] }); SFX.chime(300 + rand(0, 200)); };
  return run(S, (t, dt) => {
    const { g, W, H } = S; const M = Math.max(W, H);
    g.globalCompositeOperation = "source-over"; g.fillStyle = "#030206"; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "lighter";
    blobs.forEach((b) => {
      const x = (b.cx + Math.sin(t * b.fx + b.px) * b.ax) * W, y = (b.cy + Math.cos(t * b.fy + b.py) * b.ay) * H;
      const gr = g.createRadialGradient(x, y, 0, x, y, M * b.r);
      gr.addColorStop(0, `rgba(${b.c},.20)`); gr.addColorStop(.5, `rgba(${b.c},.07)`); gr.addColorStop(1, `rgba(${b.c},0)`);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    });
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]; d.r += 260 * dt; const a = Math.max(0, .35 - d.r / 1400);
      const gr = g.createRadialGradient(d.x, d.y, d.r * .3, d.x, d.y, d.r + 1);
      gr.addColorStop(0, `rgba(${d.c},0)`); gr.addColorStop(1, `rgba(${d.c},${a})`); g.fillStyle = gr; g.beginPath(); g.arc(d.x, d.y, d.r, 0, TAU); g.fill();
      if (a <= 0) drops.splice(i, 1);
    }
    g.globalCompositeOperation = "source-over";
    // darken the centre a touch so it still reads as black
    const dk = g.createRadialGradient(W / 2, H * .4, 0, W / 2, H * .4, M * .7); dk.addColorStop(0, "rgba(2,1,4,.55)"); dk.addColorStop(1, "rgba(2,1,4,0)");
    g.fillStyle = dk; g.fillRect(0, 0, W, H);
    // fine gold dust rising
    dust.forEach((d) => {
      d.y -= d.v * dt; if (d.y < -.02) { d.y = 1.02; d.x = Math.random(); }
      const a = .15 + .5 * Math.pow(Math.max(0, Math.sin(t * .9 + d.p)), 2);
      g.fillStyle = `rgba(230,200,140,${a})`; g.beginPath(); g.arc(d.x * W + Math.sin(t * .4 + d.p) * 8, d.y * H, d.r, 0, TAU); g.fill();
    });
  });
}
 
/* 5b. Food: she's a cheesecake. Every bite is sweeter. */
function sceneCheesecake(S) {
  // Side-on slice: crust, filling and glaze are one column, so each bite cuts through ALL layers together.
  const OW = 300, OH = 160, BASE = 142, off = document.createElement("canvas");
  off.width = OW * 2; off.height = OH * 2; const o = off.getContext("2d");
  const LEFT = 20, RIGHT = 280, TOP = 30;
  const CUTS = [232, 190, 148, 106, 64, 8];          // x where each bite leaves the slice edge
  const LINES = [
    "You're a cheesecake: sweet, soft, and a little jiggly when you laugh.",
    "First bite: soft and sweet, exactly like it looked.",
    "Second bite: somehow sweeter. There's more to you than the first taste.",
    "Third bite: now it's the little details that make it better.",
    "Fourth bite: it keeps getting sweeter, the more I know you.",
    "Fifth bite: and still, all I want is more and more of you.",
    "The plate is empty and the only thought is: one more slice."
  ];
  let bites = 0, slices = 1, jig = 0, jv = 6, wait = 0;
  const bits = [], icons = [];
  const meter = () => { const f = $("sweetfill"); if (f) f.style.width = Math.min(100, 12 + bites * 15) + "%"; const n = $("sweetn"); if (n) n.textContent = "slice " + slices; };
  S.overlay.innerHTML = '<div class="sweet"><span>Sweetness</span><div class="sweet-bar"><i id="sweetfill"></i></div><span id="sweetn"></span></div>';
  meter(); S.caption(LINES[0]); S.hint("Tap to take a bite.");
 
  function bake() {
    o.setTransform(2, 0, 0, 2, 0, 0); o.globalCompositeOperation = "source-over"; o.clearRect(0, 0, OW, OH);
    o.lineJoin = "round"; o.lineCap = "round";
    // filling
    const fg = o.createLinearGradient(LEFT, 0, RIGHT, 0);
    fg.addColorStop(0, "#f2d9a0"); fg.addColorStop(.12, "#fff1cf"); fg.addColorStop(.88, "#fff1cf"); fg.addColorStop(1, "#f2d9a0");
    o.fillStyle = fg; o.fillRect(LEFT, TOP + 10, RIGHT - LEFT, 92);
    o.fillStyle = "rgba(190,150,80,.22)";                                         // vanilla specks
    for (let i = 0; i < 90; i++) { o.beginPath(); o.arc(LEFT + 6 + (i * 71) % 248, TOP + 24 + (i * 37) % 72, .9, 0, TAU); o.fill(); }
    // crust
    const cg = o.createLinearGradient(0, BASE - 26, 0, BASE); cg.addColorStop(0, "#b5793a"); cg.addColorStop(1, "#6c4220");
    o.fillStyle = cg; o.beginPath(); o.moveTo(LEFT, BASE - 26); o.lineTo(RIGHT, BASE - 26); o.lineTo(RIGHT, BASE - 6); o.quadraticCurveTo(RIGHT, BASE, RIGHT - 6, BASE); o.lineTo(LEFT + 6, BASE); o.quadraticCurveTo(LEFT, BASE, LEFT, BASE - 6); o.closePath(); o.fill();
    o.fillStyle = "rgba(50,25,8,.4)"; for (let i = 0; i < 70; i++) { o.beginPath(); o.arc(LEFT + 4 + (i * 53) % 252, BASE - 22 + (i * 29) % 18, 1.2, 0, TAU); o.fill(); }
    // glaze with drips
    const gg = o.createLinearGradient(0, TOP, 0, TOP + 40); gg.addColorStop(0, "#e03049"); gg.addColorStop(1, "#8a0f24");
    o.fillStyle = gg; o.beginPath(); o.moveTo(LEFT - 2, TOP + 8);
    o.quadraticCurveTo(LEFT - 2, TOP, LEFT + 8, TOP); o.lineTo(RIGHT - 8, TOP); o.quadraticCurveTo(RIGHT + 2, TOP, RIGHT + 2, TOP + 8);
    for (let x = RIGHT; x >= LEFT; x -= 26) { const d = 12 + ((x * 7) % 22); o.lineTo(x, TOP + 12); o.quadraticCurveTo(x - 3, TOP + 12 + d, x - 8, TOP + 12 + d * .8); o.quadraticCurveTo(x - 13, TOP + 12, x - 16, TOP + 12); }
    o.lineTo(LEFT - 2, TOP + 12); o.closePath(); o.fill();
    o.fillStyle = "rgba(255,255,255,.3)"; o.beginPath(); o.ellipse(150, TOP + 5, 90, 2.4, 0, 0, TAU); o.fill();
    // strawberries on top
    [[62, 20, 14], [140, 16, 15], [214, 20, 13]].forEach(([x, y, r]) => {
      o.fillStyle = "#e0314a"; o.beginPath(); o.arc(x, y, r, 0, TAU); o.fill();
      o.fillStyle = "rgba(255,230,230,.55)"; o.beginPath(); o.ellipse(x - r * .35, y - r * .3, r * .22, r * .14, -.6, 0, TAU); o.fill();
      o.fillStyle = "#2e7d4a"; o.beginPath(); o.ellipse(x, y - r * .85, r * .55, r * .22, 0, 0, TAU); o.fill();
    });
    // bite: removes every layer to the right of the cut, with a scalloped tooth-mark edge
    if (bites > 0) {
      const cx = CUTS[bites - 1], R = 20;
      o.globalCompositeOperation = "destination-out"; o.fillStyle = "#000";
      o.fillRect(cx + R * .4, 0, OW, OH);
      for (let y = 0; y <= BASE + 6; y += 24) { o.beginPath(); o.arc(cx + R * .4, y + ((y / 24) % 2) * 6, R * (.9 + .15 * ((y / 24) % 2)), 0, TAU); o.fill(); }
      o.globalCompositeOperation = "source-over";
    }
  }
  bake();
 
  S.onTap = () => {
    if (wait > 0) { jv += 5; return; }
    if (bites < CUTS.length) {
      const bx = Math.max(CUTS[bites], LEFT + 10); bites++; bake(); meter(); jv += 8;
      const sc = Math.min(S.W * .78, 380) / OW, cx = S.W / 2 - OW * sc / 2, cy = S.H * .5 - BASE * sc;
      for (let i = 0; i < 16; i++) bits.push({ x: cx + bx * sc, y: cy + rand(40, 120) * sc, vx: rand(-40, 70), vy: rand(-90, 0), life: 1, c: Math.random() < .5 ? "#a8723a" : "#fff0cc" });
      for (let i = 0; i < 4; i++) icons.push({ x: cx + bx * sc + rand(-20, 20), y: cy + 60 * sc, life: 1, ch: Math.random() < .5 ? "♥" : "✦" });
      SFX.pop(1 + bites * .06); SFX.chime(480 + bites * 80);
      S.caption(LINES[Math.min(bites, LINES.length - 1)]);
      if (bites === CUTS.length) { S.hint("…"); wait = 3.4; } else S.hint("Tap for another bite.");
    }
  };
  return run(S, (t, dt) => {
    const { g, W, H } = S;
    if (wait > 0) { wait -= dt; if (wait <= 0) { bites = 0; slices++; bake(); meter(); jv = 8; S.caption("A fresh slice. Of course she's back for more. So is everyone."); S.hint("Tap to take a bite."); } }
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#2b0f26"); bg.addColorStop(1, "#0a050e"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i++) {
      const x = ((i * 0.137 + t * .004 * (1 + i % 3)) % 1.2 - .1) * W, y = (.1 + (i * .29) % .5) * H, r = 18 + (i * 13) % 40;
      g.fillStyle = `rgba(255,${150 + i * 6},170,${.05 + .03 * Math.sin(t + i)})`; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    const sc = Math.min(W * .78, 380) / OW, cx = W / 2, by = H * .5;
    const glow = g.createRadialGradient(cx, by - 40 * sc, 10, cx, by - 40 * sc, 260 * sc); glow.addColorStop(0, "rgba(255,190,150,.22)"); glow.addColorStop(1, "transparent"); g.fillStyle = glow; g.fillRect(0, 0, W, H);
    // plate
    const pg = g.createLinearGradient(0, by, 0, by + 40 * sc); pg.addColorStop(0, "#f5ecff"); pg.addColorStop(1, "#8f7fb0");
    g.fillStyle = "rgba(0,0,0,.45)"; g.beginPath(); g.ellipse(cx, by + 14 * sc, 190 * sc, 34 * sc, 0, 0, TAU); g.fill();
    g.fillStyle = pg; g.beginPath(); g.ellipse(cx, by + 4 * sc, 185 * sc, 32 * sc, 0, 0, TAU); g.fill();
    g.fillStyle = "#e4d8f2"; g.beginPath(); g.ellipse(cx, by + 2 * sc, 140 * sc, 22 * sc, 0, 0, TAU); g.fill();
    // jiggle
    jv += (-90 * jig - 3.2 * jv) * dt; jig += jv * dt; const j = jig + Math.sin(t * 2.3) * .03;
    g.save(); g.translate(cx, by); g.transform(1 + j * .035, 0, j * .06, 1 - j * .06, 0, 0);
    g.drawImage(off, -OW * sc / 2, -BASE * sc, OW * sc, OH * sc);
    g.restore();
    for (let i = bits.length - 1; i >= 0; i--) { const p = bits[i]; p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * .9; if (p.life <= 0 || p.y > by + 6 * sc) { bits.splice(i, 1); continue; } g.fillStyle = p.c; g.globalAlpha = p.life; g.fillRect(p.x, p.y, 3, 3); g.globalAlpha = 1; }
    g.font = "20px serif"; g.textAlign = "center";
    for (let i = icons.length - 1; i >= 0; i--) { const p = icons[i]; p.y -= 50 * dt; p.life -= dt * .7; if (p.life <= 0) { icons.splice(i, 1); continue; } g.fillStyle = `rgba(255,150,180,${p.life})`; g.fillText(p.ch, p.x, p.y); }
    g.textAlign = "start";
  });
}
 
/* 6. Song: vinyl + audio (skips the intro) */
function sceneSong(S) {
  const song = $("song");
  if (!song.getAttribute("src")) song.src = CONFIG.songFile;
  song.loop = false;
  S.overlay.innerHTML = `
    <div class="player">
      <div class="vinyl" id="vinyl"></div>
      <div class="track">${CONFIG.songTitle} <span style="opacity:.6;font-size:1rem">· ${CONFIG.songArtist}</span></div>
      <div class="seek"><i id="seekbar"></i></div>
      <button class="btn small playbtn" id="playbtn">Play</button>
      <div class="lyric" id="lyric"></div>
    </div>`;
  const vinyl = $("vinyl"), btn = $("playbtn"), bar = $("seekbar"), lyric = $("lyric");
  let li = 0, lt = 0, missing = false;
  S.hint("");
  const start = () => {
    SFX.init();
    if (song.currentTime < CONFIG.songStartAt) { try { song.currentTime = CONFIG.songStartAt; } catch (e) {} }
    song.play().then(() => { vinyl.classList.add("playing"); btn.textContent = "Pause"; }).catch(() => { missing = true; });
  };
  const toggle = () => { if (song.paused) start(); else { song.pause(); vinyl.classList.remove("playing"); btn.textContent = "Play"; } };
  btn.onclick = toggle;
  song.onerror = () => { missing = true;};
  song.onended = () => { song.currentTime = CONFIG.songStartAt; song.play(); };
  lyric.textContent = CONFIG.songLines[0];
  S.caption("Soft, slow and a little poetic. Press play.");
  setTimeout(start, 400);
  const notes = Array.from({ length: 24 }, () => ({ x: rand(0, 1), y: rand(0, 1), v: rand(.02, .06), p: rand(0, TAU) }));
  return run(S, (t, dt) => {
    const { g, W, H } = S;
    const bg = g.createRadialGradient(W / 2, H * .3, 10, W / 2, H * .3, H); bg.addColorStop(0, "#2a1048"); bg.addColorStop(1, "#050309");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    notes.forEach((n) => { n.y -= n.v * dt; if (n.y < -.05) { n.y = 1.05; n.x = Math.random(); } g.fillStyle = `rgba(217,180,106,${.2 + .2 * Math.sin(t + n.p)})`; g.font = "20px serif"; g.fillText("♪", n.x * W + Math.sin(t + n.p) * 12, n.y * H); });
    const dur = song.duration || 0;
    if (dur) bar.style.width = (Math.max(0, song.currentTime - CONFIG.songStartAt) / Math.max(1, dur - CONFIG.songStartAt) * 100) + "%";
    if (!song.paused) { lt += dt; if (lt > 5) { lt = 0; li = (li + 1) % CONFIG.songLines.length; lyric.style.opacity = 0; setTimeout(() => { lyric.textContent = CONFIG.songLines[li]; lyric.style.opacity = 1; }, 500); } }
  });
}
 
/* 7. Alice: survivor mode */
function sceneAlice(S) {
  S.overlay.innerHTML = '<div class="scan"></div><div class="alice-title">ALICE</div>';
  S.hint("Move your finger or mouse. The target follows.");
  const ash = Array.from({ length: 70 }, () => ({ x: rand(0, 1), y: rand(0, 1), v: rand(.02, .08), r: rand(.6, 2) }));
  const rings = []; let tx = S.W / 2, ty = S.H * .35;
  S.onTap = (x, y) => { rings.push({ x, y, r: 0 }); SFX.chime(200); };
  return run(S, (t, dt) => {
    const { g, W, H } = S;
    const bg = g.createRadialGradient(W / 2, H * .35, 20, W / 2, H * .35, H * .9); bg.addColorStop(0, "#3a0710"); bg.addColorStop(1, "#050102");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    ash.forEach((a) => { a.y += a.v * dt; if (a.y > 1.02) { a.y = -.02; a.x = Math.random(); } g.fillStyle = "rgba(255,120,90,.45)"; g.beginPath(); g.arc(a.x * W + Math.sin(t + a.x * 20) * 10, a.y * H, a.r, 0, TAU); g.fill(); });
    tx += (S.ptr.x - tx) * Math.min(1, dt * 6); ty += (S.ptr.y - ty) * Math.min(1, dt * 6);
    // radar sweep
    g.save(); g.translate(tx, ty); g.rotate(t * 2);
    const sw = g.createLinearGradient(0, 0, 90, 0); sw.addColorStop(0, "rgba(255,60,70,.5)"); sw.addColorStop(1, "transparent");
    g.fillStyle = sw; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 90, 0, .5); g.closePath(); g.fill(); g.restore();
    g.strokeStyle = "rgba(255,70,80,.85)"; g.lineWidth = 1.6;
    [30, 60, 90].forEach((r, i) => { g.beginPath(); g.arc(tx, ty, r + Math.sin(t * 3 + i) * 2, 0, TAU); g.stroke(); });
    g.beginPath(); g.moveTo(tx - 110, ty); g.lineTo(tx - 20, ty); g.moveTo(tx + 20, ty); g.lineTo(tx + 110, ty); g.moveTo(tx, ty - 110); g.lineTo(tx, ty - 20); g.moveTo(tx, ty + 20); g.lineTo(tx, ty + 110); g.stroke();
    for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.r += 380 * dt; g.strokeStyle = `rgba(255,90,90,${Math.max(0, 1 - r.r / 300)})`; g.lineWidth = 2; g.beginPath(); g.arc(r.x, r.y, r.r, 0, TAU); g.stroke(); if (r.r > 300) rings.splice(i, 1); }
    // heartbeat that never flatlines
    const y0 = H * .72; g.strokeStyle = "rgba(255,70,80,.9)"; g.lineWidth = 2; g.beginPath();
    for (let x = 0; x <= W; x += 3) {
      const ph = ((x / 160) - t * 1.2) % 1, p = ph < 0 ? ph + 1 : ph;
      let y = 0; if (p > .4 && p < .45) y = -50; else if (p >= .45 && p < .5) y = 36; else if (p >= .5 && p < .53) y = -14;
      x ? g.lineTo(x, y0 + y) : g.moveTo(x, y0 + y);
    }
    g.stroke();
  });
}
 
/* 8. Zodiac: Scorpius */
function sceneZodiac(S) {
  const P = [[.2, .16], [.28, .27], [.36, .34], [.44, .44], [.5, .54], [.52, .64], [.58, .74], [.68, .8], [.78, .78], [.84, .68], [.82, .58], [.75, .54], [.33, .17], [.27, .42]];
  const E = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [1, 12], [2, 13]];
  const bgStars = Array.from({ length: 140 }, () => ({ x: rand(0, 1), y: rand(0, 1), r: rand(.4, 1.5), p: rand(0, TAU) }));
  let t0 = 0, tt = 0;
  S.hint("Tap to redraw the constellation.");
  S.onTap = () => { t0 = tt; };
  return run(S, (t) => {
    tt = t; const { g, W, H } = S; const lt = t - t0;
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#04030a"); bg.addColorStop(1, "#150a2a"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    bgStars.forEach((s) => { g.fillStyle = `rgba(255,255,255,${.3 + .5 * Math.abs(Math.sin(t * .8 + s.p))})`; g.beginPath(); g.arc(s.x * W, s.y * H, s.r, 0, TAU); g.fill(); });
    const pos = (i) => [W * (.1 + P[i][0] * .8), H * (.08 + P[i][1] * .6)];
    const prog = Math.max(0, (lt - .5) / .55);
    g.strokeStyle = "rgba(217,180,106,.75)"; g.lineWidth = 1.6; g.shadowColor = "#d9b46a"; g.shadowBlur = 10;
    E.forEach(([a, b], i) => {
      const k = Math.min(1, Math.max(0, prog - i)); if (k <= 0) return;
      const [x1, y1] = pos(a), [x2, y2] = pos(b);
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k); g.stroke();
    });
    g.shadowBlur = 0;
    P.forEach((_, i) => {
      const reach = E.findIndex(([a, b]) => a === i || b === i);
      if (prog < reach - .01 && i !== 0) return;
      const [x, y] = pos(i);
      if (i === 3) {
        const pr = 1 + .25 * Math.sin(t * 3);
        const gr = g.createRadialGradient(x, y, 0, x, y, 40 * pr); gr.addColorStop(0, "rgba(255,60,70,.9)"); gr.addColorStop(1, "transparent");
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, 40 * pr, 0, TAU); g.fill();
        g.fillStyle = "#ff4d5a"; g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill();
        g.fillStyle = "#efe6d8"; g.font = "italic 16px 'Cormorant Garamond',serif"; g.fillText("Antares", x + 14, y + 4);
      } else { g.fillStyle = "#fff"; g.shadowColor = "#fff"; g.shadowBlur = 8; g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill(); g.shadowBlur = 0; }
    });
  });
}
 
/* Final: her name */
function sceneFinal(S) {
  const now = new Date(); let target = new Date(now.getFullYear(), CONFIG.birthday.month - 1, CONFIG.birthday.day);
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (target < today0) target = new Date(now.getFullYear() + 1, target.getMonth(), target.getDate());
  const days = Math.round((target - today0) / 864e5);
  const msg = days === 0 ? "It's today. Happy birthday 🎃🖤" : `${days} day${days === 1 ? "" : "s"} to 31 October 🎃🖤`;
  S.overlay.innerHTML = `<div class="final-name">${CONFIG.name}</div><div class="count">${msg}</div>`;
  S.hint(""); SFX.chime(523); setTimeout(() => SFX.chime(784), 700);
  const ps = [];
  const burst = (x, y) => { const c = Math.random() < .5 ? "217,180,106" : "190,40,70"; for (let i = 0; i < 40; i++) { const a = rand(0, TAU), v = rand(40, 200); ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c }); } };
  S.onTap = (x, y) => burst(x, y);
  let nt = 0;
  return run(S, (t, dt) => {
    const { g, W, H } = S;
    const bg = g.createRadialGradient(W / 2, H * .35, 10, W / 2, H * .35, H); bg.addColorStop(0, "#2d0c24"); bg.addColorStop(1, "#050207"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    nt += dt; if (nt > 1.1) { nt = 0; burst(rand(W * .15, W * .85), rand(H * .1, H * .5)); }
    for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; p.vy += 90 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * .6; if (p.life <= 0) { ps.splice(i, 1); continue; } g.fillStyle = `rgba(${p.c},${p.life})`; g.beginPath(); g.arc(p.x, p.y, 2, 0, TAU); g.fill(); }
  });
}
 
/* =========================================================
   DECK
   ========================================================= */
const CARDS = [
  { id: "lily", q: "flower", sigil: "✿", title: "A Lily", icon: "🌸", scene: sceneLily, hint: "Watch it open. Tap to scatter petals.",
    caption: "You're a lily: calm and elegant on the outside, with a whole universe quietly blooming underneath." },
  { id: "season", q: "season", sigil: "☂", title: "Rain & Winter", icon: "🌧️", scene: sceneSeason, hint: "", caption: "" },
  { id: "city", q: "mood", sigil: "☾", title: "A City at Night", icon: "🌃", scene: sceneCity, hint: "", caption: "" },
  { id: "forest", q: "place", sigil: "♣", title: "A Forest", icon: "🌲", scene: sceneForest, hint: "",
    caption: "You're a forest: quiet, deep, and a little magical once someone walks in and finds peace." },
  { id: "food", q: "food", sigil: "❦", title: "Cheesecake", icon: "🍰", scene: sceneCheesecake, hint: "", caption: "" },
  { id: "color", q: "color", sigil: "◐", title: "Black", icon: "🖤", scene: sceneBlack, hint: "",
    caption: "Black isn't empty. It's every colour, held back until it matters." },
  { id: "song", q: "song", sigil: "♪", icon: "🎵", scene: sceneSong, hint: "", caption: "" },
  { id: "alice", q: "movie character", sigil: "✦", title: "Alice", icon: "🧬", scene: sceneAlice, hint: "",
    caption: "You're Alice: the one who gets knocked down, gets back up, and walks out of the wreckage still standing." },
  { id: "zodiac", q: "star sign", sigil: "♏", title: "Scorpius", icon: "🦂", scene: sceneZodiac, hint: "",
    caption: "You're a Scorpio: born under Scorpius, with a red star called Antares for a heart." },
  { id: "final", q: "", sigil: "?", title: "And finally…", icon: "🖤", scene: sceneFinal, hint: "", caption: CONFIG.finalLine, final: true }
];
 
const seen = new Set();
const grid = $("grid");
const cardEls = {};
 
CARDS.forEach((c) => {
  const el = document.createElement("button");
  el.className = "card" + (c.final ? " final locked" : "");
  el.setAttribute("aria-label", c.final ? "Final card (locked until all others are turned)" : "Turn card: if you were a " + c.q);
  el.innerHTML = `
    <div class="card-inner">
      <div class="face back">
        <div class="sigil">${c.final ? "?" : c.icon}</div>
        <div class="q">${c.final ? "one more…" : "if you were a<br><b>" + c.q + "</b>"}</div>
      </div>
      <div class="face front">
        <div class="icon">${c.icon}</div>
        ${c.final ? "" : '<div class="qsmall">if you were a ' + c.q + '</div>'}
        <div class="name">${c.title}</div>
        <div class="again">tap to revisit</div>
      </div>
    </div>`;
  el.addEventListener("click", () => onCard(c, el));
  grid.appendChild(el); cardEls[c.id] = el;
});
 
function onCard(c, el) {
  if (el.classList.contains("locked")) return;
  SFX.init(); SFX.flip();
  const already = el.classList.contains("flipped");
  el.classList.add("flipped");
  const go = () => openStage(c, () => {
    if (!c.final) { seen.add(c.id); updateProgress(); }
  });
  already ? go() : setTimeout(go, 750);
}
 
function updateProgress() {
  const total = CARDS.length - 1;
  $("progress").textContent = seen.size >= total ? "All turned. One card is left." : `${seen.size} of ${total} turned`;
  if (seen.size >= total) { const f = cardEls.final; f.classList.remove("locked"); f.classList.add("ready"); }
}
 
/* intro, moon easter egg */
$("begin").addEventListener("click", () => {
  SFX.init(); SFX.chime(440);
  $("intro").classList.add("hidden"); $("deck").classList.remove("hidden");
});
$("moon").addEventListener("click", () => {
  SFX.init(); SFX.chime(880);
  $("secret-text").textContent = CONFIG.secretMessage; $("secret").classList.remove("hidden");
});
$("secret-close").addEventListener("click", () => $("secret").classList.add("hidden"));