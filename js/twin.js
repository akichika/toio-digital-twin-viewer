/* twin.js — Digital-twin renderer (2D + 3D) and demo-cube physics.

   The renderer draws a list of "cube views" onto a top-down 2D mat and an
   optional orbit 3D scene, plus their motion trails. A cube view is anything
   exposing getState() → { x, y, angle, led, trail, showTrail, index, name,
   isDemo, onMat }. Real cubes (RealCube, see app.js) mirror BLE position;
   DemoCube (below) simulates motion so the UI works without hardware.
*/

const CUBE_COLORS = ['#0078FF', '#18B86B', '#D97706', '#DC2626'];
window.CUBE_COLORS = CUBE_COLORS;

/* 3D scale: _matTo3D divides mat coordinates by 10, so 1 THREE unit = 10 toio
   coordinate units ≈ 13.6 mm (a 32 mm cube ≈ 23.5 coord units).
   → cube footprint = 23.5 / 10 = 2.35 units; the simple-mat grid cell then
   reads ≈ 59 mm, so the 32 mm cube sits correctly against the ~60 mm grid. */
const U3_CUBE  = 2.35;   // cube footprint (32 mm)
const U3_H     = 1.79;   // cube height (≈ 24 mm, model proportions)
const U3_FLOAT = 3.67;   // hover height when off the mat (≈ 5 cm)
const U3_REST  = U3_H / 2 + 0.2;   // resting cube-centre height above mat
/* Motion-sensor Euler → THREE rotation sign/axis mapping (order 'YXZ').
   Signs chosen to match the on-mat heading convention; adjust here if a real
   cube's tilt appears mirrored on any axis. */
const ATT_SIGN = { pitch: 1, yaw: -1, roll: 1 };
const MODEL_URL = './models/toiocorecube_v003.gltf';

/* ── Mat configurations ─────────────────────────────────────────────────── */
const MAT_CONFIGS = {
  simple:   { xMin: 98, yMin: 142, xMax: 402, yMax: 358, label: () => t('ui.matSimple') },
  original: { xMin: 45, yMin: 45,  xMax: 455, yMax: 455, label: () => t('ui.matOriginal') },
};
function getMatConfig(type) { return MAT_CONFIGS[type] || MAT_CONFIGS.simple; }
window.MAT_CONFIGS = MAT_CONFIGS;

const TRAIL_MAX = 2000;

/* ── DemoCube ────────────────────────────────────────────────────────────
   Simulated cube. Same command surface as ToioDevice so remote control and
   click-to-move work identically on demo and real cubes. Integrated each
   frame by the renderer via step(dtMs). */
class DemoCube {
  constructor(index, ctx) {
    this.index  = index;
    this.isDemo = true;
    this.name   = `Demo ${index + 1}`;
    this._ctx   = ctx;                 // { getMat, notify }
    const defaults = [
      { x: 200, y: 250, angle: 0 },
      { x: 300, y: 250, angle: 180 },
      { x: 250, y: 200, angle: 90 },
      { x: 250, y: 300, angle: 270 },
    ];
    const d = defaults[index] || { x: 250, y: 250, angle: 0 };
    this._x = d.x; this._y = d.y; this._angle = d.angle;
    this._led   = null;
    this._trail = [];
    this.showTrail = true;
    this._drive = { l: 0, r: 0, until: 0 };
    this._tween = null;                // active moveTo/rotate animation
    this.battery = 100;
  }

  getState() {
    return {
      x: this._x, y: this._y, angle: this._angle, led: this._led,
      trail: this._trail, showTrail: this.showTrail, index: this.index,
      name: this.name, isDemo: true, onMat: true,
    };
  }
  get position() { return { x: Math.round(this._x), y: Math.round(this._y), angle: Math.round(this._angle) }; }

  _pushTrail() {
    const last = this._trail[this._trail.length - 1];
    if (!last || Math.hypot(this._x - last.x, this._y - last.y) > 1.2) {
      this._trail.push({ x: this._x, y: this._y });
      if (this._trail.length > TRAIL_MAX) this._trail.shift();
    }
  }
  clearTrail() { this._trail = []; }

  /* Integrator — called by renderer each animation frame. */
  step(dtMs) {
    const dt = Math.min(0.05, dtMs / 1000);
    if (this._tween) { this._stepTween(dt); return; }
    const { l, r } = this._drive;
    if (!l && !r) return;
    if (performance.now() > this._drive.until) { this._drive = { l: 0, r: 0, until: 0 }; return; }
    const cfg  = this._ctx.getMat();
    const avg  = (l + r) / 2, diff = (l - r) / 2;
    const rad  = (this._angle - 90) * Math.PI / 180;
    const SCALE = 1.1;
    this._x += Math.cos(rad) * avg * dt * SCALE;
    this._y += Math.sin(rad) * avg * dt * SCALE;
    this._angle = ((this._angle + diff * dt * 3.2) % 360 + 360) % 360;
    this._x = Math.max(cfg.xMin, Math.min(cfg.xMax, this._x));
    this._y = Math.max(cfg.yMin, Math.min(cfg.yMax, this._y));
    this._pushTrail();
    this._ctx.notify();
  }

  _stepTween(dt) {
    const tw = this._tween;
    tw.t = Math.min(1, tw.t + dt / tw.dur);
    const e = tw.t;
    this._x = tw.sx + (tw.tx - tw.sx) * e;
    this._y = tw.sy + (tw.ty - tw.sy) * e;
    const da = ((tw.ta - tw.sa + 540) % 360) - 180;
    this._angle = ((tw.sa + da * e) % 360 + 360) % 360;
    this._pushTrail();
    this._ctx.notify();
    if (tw.t >= 1) { this._x = tw.tx; this._y = tw.ty; this._angle = ((tw.ta % 360) + 360) % 360; this._tween = null; tw.resolve && tw.resolve(); }
  }

  /* ── Command surface (mirrors ToioDevice) ─────────────────────────────── */
  async move(l, r, durationMs = 0) {
    this._tween = null;
    this._drive = { l, r, until: durationMs > 0 ? performance.now() + durationMs : Infinity };
    if (durationMs > 0) return new Promise(res => setTimeout(res, durationMs));
  }
  async stop() { this._drive = { l: 0, r: 0, until: 0 }; }

  moveTo(x, y, angle = null, speed = 80) {
    const dx = x - this._x, dy = y - this._y;
    const dist = Math.hypot(dx, dy);
    const face = dist > 1 ? (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360 : this._angle;
    const target = (angle === null || angle === undefined) ? face : angle;
    const dur = Math.max(0.25, dist / (speed * 1.1));
    return new Promise(resolve => {
      this._drive = { l: 0, r: 0, until: 0 };
      this._tween = { t: 0, dur, sx: this._x, sy: this._y, sa: this._angle, tx: x, ty: y, ta: target, resolve };
    });
  }
  rotateTo(angle, speed = 80) { return this.moveTo(this._x, this._y, ((angle % 360) + 360) % 360, speed); }
  moveRel(dist, speed = 80) {
    const rad = this._angle * Math.PI / 180;
    return this.moveTo(this._x + dist * Math.sin(rad), this._y - dist * Math.cos(rad), this._angle, speed);
  }
  rotateRel(d, speed = 80) { return this.rotateTo(((this._angle + d) % 360 + 360) % 360, speed); }

  async setLED(r, g, b, durationMs = 0) {
    this._led = { r, g, b }; this._ctx.notify();
    if (durationMs > 0) { await new Promise(res => setTimeout(res, durationMs)); this._led = null; this._ctx.notify(); }
  }
  async turnOffLED() { this._led = null; this._ctx.notify(); }

  async playSound(noteNo, durationMs = 400) { this._beep(440 * Math.pow(2, (noteNo - 69) / 12), durationMs); await new Promise(r => setTimeout(r, durationMs)); }
  async playSoundEffect(id) {
    const freqs = [523, 659, 523, 784, 988, 1047, 659, 400];
    this._beep(freqs[id % freqs.length] || 440, 180);
  }
  _beep(freq, ms) {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ac.createOscillator(), gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.frequency.value = freq; gain.gain.value = 0.15;
      osc.start(); setTimeout(() => { osc.stop(); ac.close(); }, ms);
    } catch (e) {}
  }
  async getBattery() { return this.battery; }
  async disconnect() {}
}
window.DemoCube = DemoCube;

/* ── TwinRenderer ───────────────────────────────────────────────────────── */
class TwinRenderer {
  constructor() {
    this._canvas2d = null;
    this._div3d    = null;
    this._mode     = '2d';
    this._matType  = 'simple';
    this._cubes    = [];               // array of { getState(), step?, ... }
    this._rafId    = null;
    this._dirty    = true;
    this._lastTs   = 0;
    this._onMatClick = null;

    // Three.js
    this._scene = this._camera = this._renderer = this._controls = null;
    this._meshes = []; this._trailLines = [];
    this._matMesh = this._gridHelper = this._matBorder = null;
    this._rotHandles = null; this._3dToolbar = null;
    this._ro = null;
    this._model = null;
    this._modelState = null;   // null | 'loading' | 'ready' | 'failed'
  }

  get _matCfg() { return getMatConfig(this._matType); }
  setCubes(arr) { this._cubes = arr; this._dirty = true; }
  onMatClick(fn) { this._onMatClick = fn; }

  init(canvas2d, div3d) {
    this._canvas2d = canvas2d;
    this._div3d = div3d;
    this._ro = new ResizeObserver(() => {
      this._resizeCanvas();
      if (this._mode === '3d' && this._renderer) this._resize3D();
    });
    const inner = canvas2d.parentElement;
    if (inner) this._ro.observe(inner);
    this._resizeCanvas();
    this._initPointer(canvas2d);
    this._startRaf();
  }

  markDirty() { this._dirty = true; }

  /** Sync the 3D scene background with the current theme's --twin-bg color. */
  applyThemeBackground() {
    const hex = getComputedStyle(document.documentElement).getPropertyValue('--twin-bg').trim() || '#F0F2F7';
    this._bgColor = hex;
    if (this._scene) { try { this._scene.background = new THREE.Color(hex); } catch (e) {} }
  }

  /* ── Pointer: click to move the target cube(s) ─────────────────────────── */
  _initPointer(canvas) {
    const toMat = (e) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.width / dpr, H = canvas.height / dpr;
      const x = (e.clientX - rect.left) * (W / rect.width);
      const y = (e.clientY - rect.top) * (H / rect.height);
      const PAD = Math.min(20, Math.min(W, H) * 0.04);
      const { offX, offY, areaW, areaH } = this._matArea(W, H, PAD);
      const cfg = this._matCfg;
      const mx = cfg.xMin + (x - offX) / areaW * (cfg.xMax - cfg.xMin);
      const my = cfg.yMin + (y - offY) / areaH * (cfg.yMax - cfg.yMin);
      if (mx < cfg.xMin - 5 || mx > cfg.xMax + 5 || my < cfg.yMin - 5 || my > cfg.yMax + 5) return null;
      return { x: Math.round(mx), y: Math.round(my) };
    };
    let downPt = null;
    canvas.addEventListener('pointerdown', e => { downPt = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('pointerup', e => {
      if (!downPt) return;
      const moved = Math.hypot(e.clientX - downPt.x, e.clientY - downPt.y);
      downPt = null;
      if (moved > 6) return;             // ignore drags
      const m = toMat(e);
      if (m && this._onMatClick) this._onMatClick(m.x, m.y);
    });
  }

  /* ── Sizing / RAF ──────────────────────────────────────────────────────── */
  _resizeCanvas() {
    const el = this._canvas2d; if (!el) return;
    const p = el.parentElement; if (!p) return;
    const w = p.clientWidth, h = p.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    const tw = Math.round(w * dpr), th = Math.round(h * dpr);
    if (el.width !== tw || el.height !== th) {
      el.width = tw; el.height = th;
      el.style.width = w + 'px'; el.style.height = h + 'px';
    }
    this._dirty = true;
  }
  resize() { setTimeout(() => { this._resizeCanvas(); if (this._mode === '3d' && this._renderer) this._resize3D(); }, 50); }

  _startRaf() {
    const tick = (ts) => {
      const dt = this._lastTs ? ts - this._lastTs : 16;
      this._lastTs = ts;
      // Step demo cubes
      for (const c of this._cubes) if (typeof c.step === 'function') c.step(dt);
      if (this._mode === '2d' && this._dirty) { this._draw2D(); this._dirty = false; }
      if (this._mode === '3d' && this._renderer) { this._update3D(); this._renderer.render(this._scene, this._camera); }
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  setMode(mode) {
    this._mode = mode;
    if (mode === '3d') {
      this._canvas2d.style.display = 'none';
      this._div3d.style.display = 'block';
      if (!this._renderer) this._init3D(); else { this._resize3D(); this._sync3DCubes(); }
    } else {
      this._canvas2d.style.display = 'block';
      this._div3d.style.display = 'none';
      this._dirty = true;
    }
  }
  setMatType(type) {
    this._matType = type;
    this._dirty = true;
    if (this._mode === '3d' && this._renderer) this._buildMatPlane();
  }

  /* ─────────────────────────────── 2D ─────────────────────────────────── */
  _matArea(W, H, PAD) {
    const cfg = this._matCfg;
    const matAspect = (cfg.xMax - cfg.xMin) / (cfg.yMax - cfg.yMin);
    const drawW = W - 2 * PAD, drawH = H - 2 * PAD;
    let areaW, areaH, offX, offY;
    if (matAspect > drawW / drawH) { areaW = drawW; areaH = drawW / matAspect; offX = PAD; offY = PAD + (drawH - areaH) / 2; }
    else { areaH = drawH; areaW = drawH * matAspect; offY = PAD; offX = PAD + (drawW - areaW) / 2; }
    return { offX, offY, areaW, areaH };
  }
  _matToCanvas(mx, my, W, H, PAD) {
    const cfg = this._matCfg;
    const { offX, offY, areaW, areaH } = this._matArea(W, H, PAD);
    return {
      cx: offX + (mx - cfg.xMin) / (cfg.xMax - cfg.xMin) * areaW,
      cy: offY + (my - cfg.yMin) / (cfg.yMax - cfg.yMin) * areaH,
    };
  }
  _cubeSize(W, H, PAD) {
    const cfg = this._matCfg;
    const { areaW, areaH } = this._matArea(W, H, PAD);
    const pxPerUnit = (areaW / (cfg.xMax - cfg.xMin) + areaH / (cfg.yMax - cfg.yMin)) / 2;
    return Math.max(6, 23.5 * pxPerUnit);   // 32mm cube ≈ 23.5 coord units
  }
  _css(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  _draw2D() {
    const cv = this._canvas2d, ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = cv.width / dpr, H = cv.height / dpr;
    if (!W || !H) return;
    ctx.save(); ctx.scale(dpr, dpr);
    const PAD = Math.min(20, Math.min(W, H) * 0.04);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this._css('--twin-bg', '#F0F2F7');
    ctx.fillRect(0, 0, W, H);

    this._drawMat(ctx, W, H, PAD);

    // Trails
    for (const cube of this._cubes) {
      const s = cube.getState();
      if (!s.showTrail || s.trail.length < 2) continue;
      const color = CUBE_COLORS[s.index % CUBE_COLORS.length];
      ctx.beginPath();
      ctx.strokeStyle = color + '55';
      ctx.lineWidth = 2;
      const p0 = this._matToCanvas(s.trail[0].x, s.trail[0].y, W, H, PAD);
      ctx.moveTo(p0.cx, p0.cy);
      for (const p of s.trail) { const { cx, cy } = this._matToCanvas(p.x, p.y, W, H, PAD); ctx.lineTo(cx, cy); }
      ctx.stroke();
    }

    // Cubes
    const sz = this._cubeSize(W, H, PAD);
    for (const cube of this._cubes) this._drawCube(ctx, cube.getState(), sz, W, H, PAD);
    ctx.restore();
  }

  _drawMat(ctx, W, H, PAD) {
    const cfg = this._matCfg;
    const { offX, offY, areaW, areaH } = this._matArea(W, H, PAD);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.10)'; ctx.shadowBlur = 6;
    ctx.fillStyle = this._css('--twin-mat', '#FAFAF8');
    ctx.fillRect(offX, offY, areaW, areaH);
    ctx.restore();

    // Grid
    const grid = this._css('--twin-grid', 'rgba(150,157,190,0.35)');
    ctx.strokeStyle = grid; ctx.lineWidth = 0.5;
    const cols = this._matType === 'original' ? 9 : 7;
    const rows = this._matType === 'original' ? 9 : 5;
    for (let c = 0; c <= cols; c++) { const x = offX + areaW * c / cols; ctx.beginPath(); ctx.moveTo(x, offY); ctx.lineTo(x, offY + areaH); ctx.stroke(); }
    for (let r = 0; r <= rows; r++) { const y = offY + areaH * r / rows; ctx.beginPath(); ctx.moveTo(offX, y); ctx.lineTo(offX + areaW, y); ctx.stroke(); }

    // Center cross (simple mat only)
    if (this._matType === 'simple') {
      const c = this._matToCanvas((cfg.xMin + cfg.xMax) / 2, (cfg.yMin + cfg.yMax) / 2, W, H, PAD);
      ctx.strokeStyle = this._css('--twin-grid-strong', '#BBC0CF'); ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(c.cx - 10, c.cy); ctx.lineTo(c.cx + 10, c.cy);
      ctx.moveTo(c.cx, c.cy - 10); ctx.lineTo(c.cx, c.cy + 10);
      ctx.stroke(); ctx.setLineDash([]);
    }

    // Border + corner labels
    ctx.strokeStyle = this._css('--twin-border', '#9DA4B8'); ctx.lineWidth = 1.5;
    ctx.strokeRect(offX, offY, areaW, areaH);
    ctx.font = `${Math.max(6, Math.min(9, areaW * 0.020))}px monospace`;
    ctx.fillStyle = this._css('--twin-label', '#AAB0C4');
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(`(${cfg.xMin},${cfg.yMin})`, offX + 3, offY + 3);
    ctx.textAlign = 'right'; ctx.fillText(`(${cfg.xMax},${cfg.yMin})`, offX + areaW - 3, offY + 3);
    ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(`(${cfg.xMin},${cfg.yMax})`, offX + 3, offY + areaH - 3);
    ctx.textAlign = 'right'; ctx.fillText(`(${cfg.xMax},${cfg.yMax})`, offX + areaW - 3, offY + areaH - 3);
  }

  _drawCube(ctx, s, sz, W, H, PAD) {
    const { cx, cy } = this._matToCanvas(s.x, s.y, W, H, PAD);
    const color = CUBE_COLORS[s.index % CUBE_COLORS.length];

    if (s.led) {
      const { r, g, b } = s.led;
      const grad = ctx.createRadialGradient(cx, cy, sz * 0.4, cx, cy, sz * 2.2);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.5)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, sz * 2.2, 0, Math.PI * 2); ctx.fill();
    }

    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(s.angle * Math.PI / 180);
    const half = sz / 2, r2 = sz * 0.15;
    ctx.globalAlpha = s.onMat === false ? 0.4 : 1;
    ctx.beginPath(); ctx.roundRect(-half, -half, sz, sz, r2);
    ctx.fillStyle = this._css('--twin-cube', '#ffffff'); ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    ctx.fill(); ctx.stroke();
    if (s.led) { ctx.beginPath(); ctx.roundRect(-half, -half, sz, sz, r2); ctx.fillStyle = `rgba(${s.led.r},${s.led.g},${s.led.b},0.35)`; ctx.fill(); }
    ctx.beginPath();
    ctx.moveTo(0, -half + 2); ctx.lineTo(-sz * 0.16, -half + sz * 0.3); ctx.lineTo(sz * 0.16, -half + sz * 0.3);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    ctx.restore();

    // Label
    const labelX = cx + sz * 0.62, labelY = cy - sz * 0.55;
    ctx.save();
    ctx.font = `bold ${Math.max(8, sz * 0.34)}px 'Fira Code', monospace`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const label = `#${s.index + 1} (${Math.round(s.x)},${Math.round(s.y)}) ${Math.round(s.angle)}°`;
    const lw = ctx.measureText(label).width + 7, lh = Math.max(10, sz * 0.44) + 5;
    ctx.fillStyle = this._css('--twin-label-bg', 'rgba(255,255,255,0.88)');
    ctx.beginPath(); ctx.roundRect(labelX - 3, labelY - 2, lw, lh, 3); ctx.fill();
    ctx.fillStyle = color; ctx.fillText(label, labelX, labelY);
    ctx.restore();
  }

  /* ─────────────────────────────── 3D ─────────────────────────────────── */
  _init3D() {
    if (!window.THREE) { console.warn('Three.js not loaded'); return; }
    const W = this._div3d.clientWidth || 400, H = this._div3d.clientHeight || 400;
    this._scene = new THREE.Scene();
    this._camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    this._renderer = new THREE.WebGLRenderer({ antialias: true });
    this._renderer.setSize(W, H); this._renderer.setPixelRatio(window.devicePixelRatio);
    this._div3d.appendChild(this._renderer.domElement);
    if (window.THREE.OrbitControls) {
      this._controls = new THREE.OrbitControls(this._camera, this._renderer.domElement);
      this._controls.enableDamping = true; this._controls.dampingFactor = 0.1;
    }
    this._scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6); dir.position.set(10, 20, 10); this._scene.add(dir);
    this._buildMatPlane();
    this._meshes = []; this._trailLines = [];
    this._resetCamera();
    this._sync3DCubes();
    this._buildRotationHandles();
    this.applyThemeBackground();
    this._loadModel();
  }

  _buildMatPlane() {
    if (!this._scene) return;
    if (this._matMesh) { this._scene.remove(this._matMesh); this._matMesh.geometry.dispose(); }
    if (this._gridHelper) { this._scene.remove(this._gridHelper); this._gridHelper.geometry.dispose(); }
    if (this._matBorder) { this._scene.remove(this._matBorder); this._matBorder.geometry.dispose(); }
    const cfg = this._matCfg;
    const W3 = (cfg.xMax - cfg.xMin) / 10, H3 = (cfg.yMax - cfg.yMin) / 10;
    const mat = new THREE.MeshLambertMaterial({ color: this._matType === 'original' ? 0xEEF5FF : 0xFAFAF8, side: THREE.DoubleSide });
    this._matMesh = new THREE.Mesh(new THREE.PlaneGeometry(W3, H3), mat);
    this._matMesh.rotation.x = -Math.PI / 2; this._scene.add(this._matMesh);
    this._gridHelper = this._buildRectGrid(W3, H3);
    this._scene.add(this._gridHelper);
    const bGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(W3, H3));
    this._matBorder = new THREE.LineSegments(bGeo, new THREE.LineBasicMaterial({ color: 0xAAB0C4 }));
    this._matBorder.rotation.x = -Math.PI / 2; this._matBorder.position.y = 0.02; this._scene.add(this._matBorder);
  }
  _buildRectGrid(W3, H3) {
    const xDivs = this._matType === 'original' ? 9 : 7;
    const yDivs = this._matType === 'original' ? 9 : 5;
    const verts = [], Y = 0.015;
    for (let i = 0; i <= xDivs; i++) { const x = -W3 / 2 + i / xDivs * W3; verts.push(x, Y, -H3 / 2, x, Y, H3 / 2); }
    for (let j = 0; j <= yDivs; j++) { const z = -H3 / 2 + j / yDivs * H3; verts.push(-W3 / 2, Y, z, W3 / 2, Y, z); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xC8CDD8, transparent: true, opacity: 0.6 }));
  }
  _resize3D() {
    if (!this._renderer) return;
    const W = this._div3d.clientWidth || 400, H = this._div3d.clientHeight || 400;
    this._camera.aspect = W / H; this._camera.updateProjectionMatrix(); this._renderer.setSize(W, H);
  }
  _matTo3D(mx, my) {
    const cfg = this._matCfg;
    return { x: (mx - (cfg.xMin + cfg.xMax) / 2) / 10, z: (my - (cfg.yMin + cfg.yMax) / 2) / 10 };
  }

  /* Build a per-cube group: fallback box (+outline), colored base ring and
     heading arrow, and — once loaded — a clone of the official toio model. */
  _makeCubeGroup(idx) {
    const g = new THREE.Group();
    const col = parseInt(CUBE_COLORS[idx % CUBE_COLORS.length].replace('#', ''), 16);

    const box = new THREE.Mesh(new THREE.BoxGeometry(U3_CUBE, U3_H, U3_CUBE), new THREE.MeshLambertMaterial({ color: 0xfafafa }));
    box.name = 'box';
    const outline = new THREE.Mesh(new THREE.BoxGeometry(U3_CUBE + 0.22, U3_H + 0.22, U3_CUBE + 0.22), new THREE.MeshBasicMaterial({ color: col, side: THREE.BackSide }));
    outline.name = 'outline'; box.add(outline); g.add(box);

    // Glowing colored wireframe cage (outer frame) — makes the white cube legible
    const cage = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(U3_CUBE * 1.03, U3_H * 1.03, U3_CUBE * 1.03)),
      new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.95 }));
    cage.name = 'cage'; g.add(cage);

    // Colored square base frame — follows the cube footprint (identity + LED),
    // aligned to the cube's faces and visible even when tilted.
    const o = U3_CUBE * 0.62, inr = U3_CUBE * 0.52;
    const sq = new THREE.Shape();
    sq.moveTo(-o, -o); sq.lineTo(o, -o); sq.lineTo(o, o); sq.lineTo(-o, o); sq.lineTo(-o, -o);
    const hole = new THREE.Path();
    hole.moveTo(-inr, -inr); hole.lineTo(-inr, inr); hole.lineTo(inr, inr); hole.lineTo(inr, -inr); hole.lineTo(-inr, -inr);
    sq.holes.push(hole);
    const ring = new THREE.Mesh(new THREE.ShapeGeometry(sq), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }));
    ring.name = 'ring'; ring.rotation.x = -Math.PI / 2; ring.position.y = -U3_H / 2 + 0.05; g.add(ring);

    // Heading arrow at the base, pointing "front" (−Z at yaw 0)
    const shape = new THREE.Shape();
    shape.moveTo(0, U3_CUBE * 0.5); shape.lineTo(-U3_CUBE * 0.22, U3_CUBE * 0.18); shape.lineTo(U3_CUBE * 0.22, U3_CUBE * 0.18); shape.closePath();
    const arrow = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }));
    arrow.name = 'arrow'; arrow.rotation.x = -Math.PI / 2; arrow.position.y = -U3_H / 2 + 0.06; g.add(arrow);

    if (this._modelState === 'ready' && this._model) {
      const m = this._model.clone(true); m.name = 'model'; g.add(m); box.visible = false;
    }
    return g;
  }

  _sync3DCubes() {
    if (!this._scene) return;
    while (this._meshes.length < this._cubes.length) {
      const g = this._makeCubeGroup(this._meshes.length);
      this._scene.add(g); this._meshes.push(g);
    }
    while (this._meshes.length > this._cubes.length) { const m = this._meshes.pop(); this._scene.remove(m); }
    while (this._trailLines.length < this._cubes.length) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
      geo.setDrawRange(0, 0);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ transparent: true, opacity: 0.6 }));
      line.visible = false; this._scene.add(line); this._trailLines.push(line);
    }
    while (this._trailLines.length > this._cubes.length) { const l = this._trailLines.pop(); this._scene.remove(l); l.geometry.dispose(); }

    this._cubes.forEach((cube, i) => {
      const s = cube.getState(); const g = this._meshes[i]; if (!g) return;
      const { x, z } = this._matTo3D(s.x, s.y);
      g.position.x = x; g.position.z = z;

      const floating = (s.onMat === false);
      g.position.y = U3_REST + (floating ? U3_FLOAT : 0);
      if (floating && s.attitude) {
        // Off mat: reflect the motion-sensor attitude (Euler, degrees)
        const d = Math.PI / 180, a = s.attitude;
        g.rotation.order = 'YXZ';
        g.rotation.set(ATT_SIGN.pitch * a.pitch * d, ATT_SIGN.yaw * a.yaw * d, ATT_SIGN.roll * a.roll * d);
      } else {
        g.rotation.set(0, -(s.angle) * Math.PI / 180, 0);   // on mat: flat, yaw only
      }

      const box = g.getObjectByName('box'), outline = g.getObjectByName('outline');
      const ring = g.getObjectByName('ring'), arrow = g.getObjectByName('arrow'), cage = g.getObjectByName('cage');
      const baseCol = parseInt(CUBE_COLORS[i % CUBE_COLORS.length].replace('#', ''), 16);
      if (s.led) {
        const { r, g: gg, b } = s.led;
        if (box && box.visible) { box.material.color.setRGB(0.92 + r / 3200, 0.92 + gg / 3200, 0.92 + b / 3200); box.material.emissive.setRGB(r / 600, gg / 600, b / 600); }
        if (outline) outline.material.color.setRGB(r / 255, gg / 255, b / 255);
        if (ring) ring.material.color.setRGB(r / 255, gg / 255, b / 255);
        if (arrow) arrow.material.color.setRGB(r / 255, gg / 255, b / 255);
        if (cage) cage.material.color.setRGB(r / 255, gg / 255, b / 255);
      } else {
        if (box) { box.material.color.setHex(0xfafafa); box.material.emissive.setHex(0x000000); }
        if (outline) outline.material.color.setHex(baseCol);
        if (ring) ring.material.color.setHex(baseCol);
        if (arrow) arrow.material.color.setHex(baseCol);
        if (cage) cage.material.color.setHex(baseCol);
      }

      const line = this._trailLines[i];
      if (line) {
        if (s.showTrail && s.trail.length >= 2) {
          line.material.color.set(baseCol); line.visible = true;
          const pts = [];
          s.trail.forEach(p => { const q = this._matTo3D(p.x, p.y); pts.push(q.x, 0.04, q.z); });
          const buf = new Float32Array(pts);
          line.geometry.setAttribute('position', new THREE.BufferAttribute(buf, 3));
          line.geometry.setDrawRange(0, pts.length / 3);
          line.geometry.attributes.position.needsUpdate = true;
        } else line.visible = false;
      }
    });
  }

  /* ── toio Core Cube model (CC BY-ND 4.0, toio spec) ────────────────────── */
  _loadModel() {
    if (this._modelState) return;
    if (!window.THREE || !THREE.GLTFLoader) { this._modelState = 'failed'; return; }
    this._modelState = 'loading';
    new THREE.GLTFLoader().load(MODEL_URL,
      (gltf) => { this._model = this._prepModel(gltf.scene); this._modelState = 'ready'; this._rebuildVisuals(); },
      undefined,
      (err) => { console.warn('toio model load failed:', err); this._modelState = 'failed'; });
  }

  /** Orient (smallest extent = up), centre and scale the model to the cube size. */
  _prepModel(scene) {
    const inner = scene;
    let box = new THREE.Box3().setFromObject(inner);
    const size = new THREE.Vector3(); box.getSize(size);
    // The cube is shorter than it is wide → the smallest axis is "up".
    const dims = [['x', size.x], ['y', size.y], ['z', size.z]].sort((a, b) => a[1] - b[1]);
    if (dims[0][0] === 'z') inner.rotation.x = -Math.PI / 2;
    else if (dims[0][0] === 'x') inner.rotation.z = Math.PI / 2;
    inner.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(inner);
    box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);
    const footprint = Math.max(size.x, size.z) || 1;
    const scale = U3_CUBE / footprint;
    const tpl = new THREE.Group();
    inner.position.sub(center);        // centre at origin
    tpl.add(inner);
    tpl.scale.setScalar(scale);
    // Fixed orientation correction for this model: first yaw 90°, then flip
    // 180° (upside-down). Applied in world space, in that order.
    tpl.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);   // yaw 90°
    tpl.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), Math.PI);       // flip 180° (upright)
    tpl.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), Math.PI);       // yaw 180° (front/back)
    return tpl;
  }

  /** Swap fallback boxes for model clones once the model is available. */
  _rebuildVisuals() {
    if (this._modelState !== 'ready' || !this._model) return;
    for (const g of this._meshes) {
      if (g.getObjectByName('model')) continue;
      const box = g.getObjectByName('box'); if (box) box.visible = false;
      const m = this._model.clone(true); m.name = 'model'; g.add(m);
    }
  }
  _update3D() { if (this._controls) this._controls.update(); this._sync3DCubes(); }

  /* ── 3D camera controls ────────────────────────────────────────────────── */
  _resetCamera() {
    if (!this._camera) return;
    const cfg = this._matCfg;
    const size3 = Math.max(cfg.xMax - cfg.xMin, cfg.yMax - cfg.yMin) / 10;
    const dist3 = size3 * 0.8;
    this._camera.position.set(0, dist3, dist3); this._camera.lookAt(0, 0, 0);
    if (this._controls) { this._controls.target.set(0, 0, 0); this._controls.update(); }
  }
  _rotateCamera(dTheta, dPhi) {
    if (!this._camera) return;
    const target = this._controls ? this._controls.target : new THREE.Vector3();
    const offset = this._camera.position.clone().sub(target);
    const sph = new THREE.Spherical().setFromVector3(offset);
    sph.theta += dTheta; sph.phi = Math.max(0.05, Math.min(Math.PI * 0.92, sph.phi + dPhi));
    offset.setFromSpherical(sph);
    this._camera.position.copy(target).add(offset); this._camera.lookAt(target);
    if (this._controls) this._controls.update();
  }
  _buildRotationHandles() {
    if (this._rotHandles) this._rotHandles.remove();
    const rh = document.createElement('div');
    rh.className = 'twin3d-rot';
    rh.innerHTML = `
      <button class="twin3d-rot-btn" data-dt="-0.4" data-dp="0">◀</button>
      <div class="twin3d-rot-col">
        <button class="twin3d-rot-btn" data-dt="0" data-dp="-0.3">▲</button>
        <button class="twin3d-rot-btn twin3d-rot-center" data-reset="1" title="${t('ui.resetView')}">⌖</button>
        <button class="twin3d-rot-btn" data-dt="0" data-dp="0.3">▼</button>
      </div>
      <button class="twin3d-rot-btn" data-dt="0.4" data-dp="0">▶</button>`;
    rh.querySelectorAll('.twin3d-rot-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (btn.dataset.reset) { this._resetCamera(); return; }
        this._rotateCamera(parseFloat(btn.dataset.dt) || 0, parseFloat(btn.dataset.dp) || 0);
      });
    });
    this._div3d.appendChild(rh); this._rotHandles = rh;
  }
}
window.TwinRenderer = TwinRenderer;
