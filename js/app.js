/* app.js — Digital Twin Viewer application glue.
   Wires BLE cubes + demo cubes into the twin renderer and remote control,
   and handles theme, language, PWA and all UI controls. */

/* ── RealCube: wraps a ToioDevice as a renderer cube view + command target ── */
class RealCube {
  constructor(device) {
    this.device = device;
    this.isDemo = false;
    this.index = 0;                 // assigned by the manager
    this.name = device.name;
    this._trail = [];
    this.showTrail = true;
    this._led = null;
    device.on('position', p => this._pushTrail(p));
    device.on('led', led => { this._led = (led.r || led.g || led.b) ? { ...led } : null; });
  }
  _pushTrail(p) {
    const last = this._trail[this._trail.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 1.2) {
      this._trail.push({ x: p.x, y: p.y });
      if (this._trail.length > 2000) this._trail.shift();
    }
  }
  clearTrail() { this._trail = []; }
  getState() {
    const p = this.device.position;
    return {
      x: p.x, y: p.y, angle: p.angle, led: this._led, trail: this._trail,
      showTrail: this.showTrail, index: this.index, name: this.name,
      isDemo: false, onMat: !!this.device._posValid,
    };
  }
  get position() { return this.device.position; }
  // Command delegation
  move(l, r, d) { return this.device.move(l, r, d); }
  stop() { return this.device.stop(); }
  moveTo(x, y, a, s) { return this.device.moveTo(x, y, a, s); }
  rotateTo(a, s) { return this.device.rotateTo(a, s); }
  moveRel(d, s) { return this.device.moveRel(d, s); }
  rotateRel(d, s) { return this.device.rotateRel(d, s); }
  setLED(r, g, b, d) { return this.device.setLED(r, g, b, d); }
  turnOffLED() { return this.device.turnOffLED(); }
  playSoundEffect(id) { return this.device.playSoundEffect(id); }
  getBattery() { return this.device.getBattery(); }
  disconnect() { return this.device.disconnect(); }
}

/* ── Application ─────────────────────────────────────────────────────────── */
const App = {
  renderer: null,
  control: null,
  cubes: [],            // combined [RealCube | DemoCube]
  target: null,         // null = all, else index
  demoSeq: 0,

  init() {
    applyI18n();
    this.applyTheme(localStorage.getItem('theme') || 'light');

    this.renderer = new TwinRenderer();
    this.renderer.init(document.getElementById('twin-2d'), document.getElementById('twin-3d'));
    this.renderer.setCubes(this.cubes);
    this.renderer.onMatClick((x, y) => this.control.moveTo(x, y));
    this.renderer.applyThemeBackground();

    const demoCtx = { getMat: () => this.renderer._matCfg, notify: () => this.renderer.markDirty() };
    this._demoCtx = demoCtx;

    this.control = new RemoteControl({
      getTargets: () => this._targets(),
      getSpeed: () => parseInt(document.getElementById('speed').value) || 50,
      onSelectTarget: (idx) => this.selectTarget(idx),
    });

    this._wireUI();
    this._setupToio();
    this._setupPWA();
    this.renderCubeList();
    this.status(t('msg.ready'));
  },

  /* ── Targets ─────────────────────────────────────────────────────────── */
  _targets() {
    if (this.target === null) return this.cubes;
    const c = this.cubes[this.target];
    return c ? [c] : [];
  },
  selectTarget(idx) {
    this.target = (idx === null || idx < 0 || idx >= this.cubes.length) ? null : idx;
    this._renderTargetChips();
  },

  reindex() { this.cubes.forEach((c, i) => { c.index = i; }); },

  /* ── Cube lifecycle ──────────────────────────────────────────────────── */
  async connectReal() {
    if (!navigator.bluetooth) { alert(t('ui.notSupported')); return; }
    const btn = document.getElementById('btn-connect');
    btn.disabled = true; btn.dataset.busy = '1';
    try {
      const device = await toioManager.addCube();
      const rc = new RealCube(device);
      device.on('disconnect', () => this.removeCube(rc));
      this.cubes.push(rc); this.reindex();
      this.renderer.markDirty();
      this.renderCubeList();
      this.status(`${rc.name}${t('msg.connected')}`);
    } catch (e) {
      if (e && e.name !== 'NotFoundError') this.status(`${e.message || t('msg.failed')}`);
    } finally { btn.disabled = false; delete btn.dataset.busy; }
  },

  addDemo() {
    const demo = new DemoCube(this.cubes.length, this._demoCtx);
    demo.name = `${t('ui.demoTag')} ${++this.demoSeq}`;
    this.cubes.push(demo); this.reindex();
    this.renderer.markDirty();
    this.renderCubeList();
    this.status(t('msg.demoAdded'));
  },

  removeCube(cube) {
    const i = this.cubes.indexOf(cube);
    if (i < 0) return;
    this.cubes.splice(i, 1); this.reindex();
    if (this.target !== null && this.target >= this.cubes.length) this.target = null;
    this.renderer.markDirty();
    this.renderCubeList();
    this.status(`${cube.name}${t('msg.disconnected')}`);
  },

  disconnectCube(cube) {
    if (cube.isDemo) this.removeCube(cube);
    else { try { cube.disconnect(); } catch (e) {} /* removeCube fires on 'disconnect' */ }
  },

  clearAllTrails() { this.cubes.forEach(c => c.clearTrail()); this.renderer.markDirty(); },

  /* ── UI wiring ───────────────────────────────────────────────────────── */
  _wireUI() {
    document.getElementById('btn-connect').addEventListener('click', () => this.connectReal());
    document.getElementById('btn-demo').addEventListener('click', () => this.addDemo());

    // View toggle
    document.querySelectorAll('.view-btn').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      this.renderer.setMode(b.dataset.view);
    }));

    // Mat selector
    document.getElementById('mat-select').addEventListener('change', e => this.renderer.setMatType(e.target.value));

    // Trail / clear
    document.getElementById('btn-clear-trail').addEventListener('click', () => this.clearAllTrails());

    // Fullscreen
    document.getElementById('btn-fullscreen').addEventListener('click', () => this._toggleFullscreen());
    document.addEventListener('fullscreenchange', () => this.renderer.resize());

    // Theme cycle
    document.getElementById('btn-theme').addEventListener('click', () => {
      const order = ['light', 'dark', 'hc'];
      const cur = localStorage.getItem('theme') || 'light';
      this.applyTheme(order[(order.indexOf(cur) + 1) % order.length]);
    });

    // Language
    const langSel = document.getElementById('lang-select');
    if (langSel) { langSel.value = currentLang(); langSel.addEventListener('change', e => setLang(e.target.value)); }

    // About
    document.getElementById('btn-about').addEventListener('click', () => document.getElementById('about-dialog').showModal());
    document.getElementById('about-close').addEventListener('click', () => document.getElementById('about-dialog').close());

    // Speed display
    const speed = document.getElementById('speed');
    const speedVal = document.getElementById('speed-val');
    speed.addEventListener('input', () => { speedVal.textContent = speed.value; });
    speedVal.textContent = speed.value;

    // D-pad hold-to-drive
    this.control.bindDriveButton(document.getElementById('pad-fwd'), 'fwd+');
    this.control.bindDriveButton(document.getElementById('pad-back'), 'fwd-');
    this.control.bindDriveButton(document.getElementById('pad-left'), 'turn-');
    this.control.bindDriveButton(document.getElementById('pad-right'), 'turn+');
    document.getElementById('pad-stop').addEventListener('click', () => this.control.stopAll());

    // Spin buttons
    document.getElementById('btn-spin-l').addEventListener('click', () => this.control.spin(-90));
    document.getElementById('btn-spin-r').addEventListener('click', () => this.control.spin(90));

    // LED buttons
    document.querySelectorAll('.led-btn').forEach(b => b.addEventListener('click', () => {
      const [r, g, bl] = b.dataset.rgb.split(',').map(Number);
      this.control.setLED(r, g, bl);
    }));

    // Sound buttons
    document.querySelectorAll('.snd-btn').forEach(b => b.addEventListener('click', () => this.control.soundEffect(parseInt(b.dataset.snd))));
  },

  _toggleFullscreen() {
    const el = document.getElementById('stage');
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  },

  /* ── Cube list + target chips ────────────────────────────────────────── */
  renderCubeList() {
    const wrap = document.getElementById('cube-list');
    wrap.innerHTML = '';
    if (this.cubes.length === 0) {
      wrap.innerHTML = `<div class="empty-hint"><p>${t('ui.noCubes')}</p><p class="small">${t('ui.noCubesHint')}</p></div>`;
    } else {
      this.cubes.forEach((cube, i) => {
        const color = CUBE_COLORS[i % CUBE_COLORS.length];
        const s = cube.getState();
        const row = document.createElement('div');
        row.className = 'cube-row';
        row.style.setProperty('--cc', color);
        const tag = cube.isDemo ? `<span class="tag demo">${t('ui.demoTag')}</span>` : `<span class="tag real">${t('ui.realTag')}</span>`;
        const off = (!cube.isDemo && s.onMat === false) ? `<span class="offmat">${t('ui.offMat')}</span>` : '';
        row.innerHTML = `
          <span class="dot" style="background:${color}"></span>
          <span class="cname">#${i + 1} ${cube.name}</span>
          ${tag}${off}
          <span class="pos">X:${Math.round(s.x)} Y:${Math.round(s.y)} ${Math.round(s.angle)}°</span>
          <button class="mini trail ${cube.showTrail ? 'on' : ''}" title="${t('ui.trail')}">${t('ui.trail')}</button>
          <button class="mini disc" title="${t('ui.disconnect')}">✕</button>`;
        row.querySelector('.trail').addEventListener('click', () => { cube.showTrail = !cube.showTrail; this.renderer.markDirty(); this.renderCubeList(); });
        row.querySelector('.disc').addEventListener('click', () => this.disconnectCube(cube));
        wrap.appendChild(row);
      });
    }
    this._renderTargetChips();
    if (!this._statusPoll) this._statusPoll = setInterval(() => this._refreshCubeStats(), 250);
  },

  _refreshCubeStats() {
    if (this.cubes.length === 0) return;
    const rows = document.querySelectorAll('#cube-list .cube-row');
    this.cubes.forEach((cube, i) => {
      const row = rows[i]; if (!row) return;
      const s = cube.getState();
      const pos = row.querySelector('.pos');
      if (pos) pos.textContent = `X:${Math.round(s.x)} Y:${Math.round(s.y)} ${Math.round(s.angle)}°`;
      const off = row.querySelector('.offmat');
      const isOff = (!cube.isDemo && s.onMat === false);
      if (isOff && !off) { const sp = document.createElement('span'); sp.className = 'offmat'; sp.textContent = t('ui.offMat'); row.querySelector('.cname').after(sp); }
      if (!isOff && off) off.remove();
    });
  },

  _renderTargetChips() {
    const wrap = document.getElementById('target-chips');
    if (!wrap) return;
    let html = `<button class="chip ${this.target === null ? 'active' : ''}" data-t="all">${t('ui.targetAll')}</button>`;
    this.cubes.forEach((cube, i) => {
      const color = CUBE_COLORS[i % CUBE_COLORS.length];
      html += `<button class="chip ${this.target === i ? 'active' : ''}" data-t="${i}" style="--cc:${color}">#${i + 1}</button>`;
    });
    wrap.innerHTML = html;
    wrap.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {
      this.selectTarget(ch.dataset.t === 'all' ? null : parseInt(ch.dataset.t));
    }));
  },

  /* ── toio manager events ─────────────────────────────────────────────── */
  _setupToio() {
    toioManager.on('update', () => this.renderer.markDirty());
  },

  /* ── Theme ───────────────────────────────────────────────────────────── */
  applyTheme(theme) {
    localStorage.setItem('theme', theme);
    if (theme === 'light') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    const icons = { light: '☀', dark: '🌙', hc: '◑' };
    const names = { light: t('ui.themeLight'), dark: t('ui.themeDark'), hc: t('ui.themeHc') };
    const btn = document.getElementById('btn-theme');
    if (btn) { btn.textContent = icons[theme] || '☀'; btn.title = `${t('ui.theme')}: ${names[theme] || theme}`; }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#12141f' : theme === 'hc' ? '#000000' : '#0078FF';
    if (this.renderer) { this.renderer.applyThemeBackground(); this.renderer.markDirty(); }
  },

  /* ── PWA ─────────────────────────────────────────────────────────────── */
  _setupPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
    }
    let deferred = null;
    const btn = document.getElementById('btn-install');
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; if (btn) btn.hidden = false; });
    if (btn) btn.addEventListener('click', async () => {
      if (!deferred) return;
      deferred.prompt(); await deferred.userChoice; deferred = null; btn.hidden = true;
    });
    window.addEventListener('appinstalled', () => { if (btn) btn.hidden = true; });
  },

  /* ── Status line ─────────────────────────────────────────────────────── */
  status(msg) {
    const el = document.getElementById('status');
    if (el) el.textContent = msg;
  },
};

window.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;
