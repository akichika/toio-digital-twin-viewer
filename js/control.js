/* control.js — Keyboard + on-screen remote control ("RC" driving).

   Translates held keys / buttons into differential-drive motor commands and
   sends them to the currently targeted cube backend(s). A backend is any
   object exposing move(l, r, durMs), stop(), moveTo(), rotateRel(), setLED(),
   turnOffLED(), playSoundEffect() — satisfied by both ToioDevice (real) and
   DemoCube (simulated). */

const MOTOR_MAX = 115;
const KEEPALIVE_MS = 400;   // re-send drive vector so motion never stalls

class RemoteControl {
  constructor({ getTargets, getSpeed, onSelectTarget }) {
    this._getTargets = getTargets;         // () => [backend]
    this._getSpeed   = getSpeed;           // () => number (0..MOTOR_MAX)
    this._onSelectTarget = onSelectTarget; // (index|null) => void
    this._keys = new Set();                // logical drive inputs from keyboard
    this._btns = new Set();                // logical drive inputs from buttons
    this._lastVec = null;                  // last-sent {l,r}
    this._keepTimer = null;
    this._installKeyboard();
  }

  /* ── Keyboard ──────────────────────────────────────────────────────────── */
  _installKeyboard() {
    const isTyping = (e) => {
      const el = e.target;
      return el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    };
    const map = {
      ArrowUp: 'fwd+', KeyW: 'fwd+',
      ArrowDown: 'fwd-', KeyS: 'fwd-',
      ArrowLeft: 'turn-', KeyA: 'turn-',
      ArrowRight: 'turn+', KeyD: 'turn+',
    };
    window.addEventListener('keydown', e => {
      if (isTyping(e)) return;
      if (e.code === 'Space') { e.preventDefault(); this.stopAll(); this._keys.clear(); this._update(); return; }
      if (/^Digit[0-9]$/.test(e.code)) {
        const n = parseInt(e.code.slice(5));
        this._onSelectTarget(n === 0 ? null : n - 1);
        return;
      }
      const m = map[e.code];
      if (m) { e.preventDefault(); if (!this._keys.has(m)) { this._keys.add(m); this._update(); } }
    });
    window.addEventListener('keyup', e => {
      const m = map[e.code];
      if (m) { this._keys.delete(m); this._update(); }
    });
    // Safety: releasing focus / tab hidden → stop
    window.addEventListener('blur', () => { this._keys.clear(); this._btns.clear(); this._update(); });
  }

  /* ── On-screen buttons ─────────────────────────────────────────────────── */
  /** Bind a hold-to-drive button (pointerdown → drive, pointerup → release). */
  bindDriveButton(el, input) {
    const down = (e) => { e.preventDefault(); this._btns.add(input); this._update(); el.classList.add('active'); el.setPointerCapture?.(e.pointerId); };
    const up   = (e) => { this._btns.delete(input); this._update(); el.classList.remove('active'); };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
  }

  /* ── Drive vector ──────────────────────────────────────────────────────── */
  _activeInputs() { return new Set([...this._keys, ...this._btns]); }

  _computeVec() {
    const a = this._activeInputs();
    let fwd = 0, turn = 0;
    if (a.has('fwd+')) fwd += 1;
    if (a.has('fwd-')) fwd -= 1;
    if (a.has('turn+')) turn += 1;
    if (a.has('turn-')) turn -= 1;
    if (!fwd && !turn) return null;
    const s = Math.max(0, Math.min(MOTOR_MAX, this._getSpeed()));
    const clamp = v => Math.max(-MOTOR_MAX, Math.min(MOTOR_MAX, Math.round(v)));
    // Pure turn spins in place; forward+turn curves.
    const turnComp = fwd ? s * 0.7 : s;
    return { l: clamp(fwd * s + turn * turnComp), r: clamp(fwd * s - turn * turnComp) };
  }

  _update() {
    const vec = this._computeVec();
    if (!vec) {
      if (this._lastVec) { this.stopAll(); this._lastVec = null; }
      this._stopKeepAlive();
      return;
    }
    this._lastVec = vec;
    this._send(vec);
    this._startKeepAlive();
  }

  _send(vec) {
    for (const b of this._getTargets()) { try { b.move(vec.l, vec.r, 0); } catch (e) {} }
  }
  stopAll() {
    for (const b of this._getTargets()) { try { b.stop(); } catch (e) {} }
  }

  _startKeepAlive() {
    if (this._keepTimer) return;
    this._keepTimer = setInterval(() => { if (this._lastVec) this._send(this._lastVec); }, KEEPALIVE_MS);
  }
  _stopKeepAlive() { if (this._keepTimer) { clearInterval(this._keepTimer); this._keepTimer = null; } }

  /* ── Discrete actions ──────────────────────────────────────────────────── */
  spin(deg) { for (const b of this._getTargets()) { try { b.rotateRel(deg, Math.max(30, this._getSpeed())); } catch (e) {} } }
  setLED(r, g, b) {
    for (const back of this._getTargets()) {
      try { if (r === 0 && g === 0 && b === 0) back.turnOffLED(); else back.setLED(r, g, b, 0); } catch (e) {}
    }
  }
  soundEffect(id) { for (const b of this._getTargets()) { try { b.playSoundEffect(id); } catch (e) {} } }
  moveTo(x, y) { for (const b of this._getTargets()) { try { b.moveTo(x, y, null, Math.max(20, this._getSpeed())); } catch (e) {} } }
}
window.RemoteControl = RemoteControl;
