// ---------------------------------------------------------------
// input.js : keyboard / touch / gamepad -> left, right, fire, special
// ---------------------------------------------------------------
'use strict';

class Input {
  constructor() {
    this.keys = {}; this.latch = {}; this.seq = []; this.cheatHit = false;
    this.state = { left: false, right: false, up: false, down: false, fire: false, special: false, start: false, pause: false, mute: false, skip: false, options: false, back: false, any: false };
    this.prev = Object.assign({}, this.state);
    this.pressed = Object.assign({}, this.state);
    this.touchX = null;          // logical x the ship should move toward (touch drag)
    this.touchFire = false;
    this.touchSpecial = false;
    this.touchTap = false;
    this.touchDevice = false;
    this.toLogical = (x, y) => ({ x, y });
    this.pointers = new Map();
    this.gamepadIndex = null;
    this.specialButton = { x: W - 30, y: H - 30, r: 16 };
    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      this.keys[e.code] = true; this.latch[e.code] = true;
      this.seq.push(e.code); if (this.seq.length > 10) this.seq.shift();
      if (this.seq.join() === ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'].join()) { this.cheatHit = true; this.seq = []; }
      if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
    window.addEventListener('gamepadconnected', e => { this.gamepadIndex = e.gamepad.index; });
  }
  attach(canvas) {
    const onDown = e => {
      this.touchDevice = e.pointerType !== 'mouse' || this.touchDevice;
      const p = this.toLogical(e.clientX, e.clientY);
      const sb = this.specialButton;
      if (dist(p.x, p.y, sb.x, sb.y) < sb.r + 6) { this.pointers.set(e.pointerId, { kind: 'special' }); this.touchSpecial = true; }
      else { this.pointers.set(e.pointerId, { kind: 'move', x: p.x }); this.touchX = p.x; this.touchFire = true; }
      this.touchTap = true; this.tapPos = p;
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    };
    const onMove = e => {
      const pt = this.pointers.get(e.pointerId);
      if (!pt || pt.kind !== 'move') return;
      const p = this.toLogical(e.clientX, e.clientY);
      pt.x = p.x; this.touchX = p.x;
    };
    const onUp = e => {
      const pt = this.pointers.get(e.pointerId);
      this.pointers.delete(e.pointerId);
      if (pt && pt.kind === 'move') {
        let other = null; for (const v of this.pointers.values()) if (v.kind === 'move') other = v;
        if (other) this.touchX = other.x; else { this.touchX = null; this.touchFire = false; }
      }
      if (pt && pt.kind === 'special') this.touchSpecial = false;
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }
  key(...codes) { for (const c of codes) if (this.keys[c] || this.latch[c]) return true; return false; }
  pollGamepad() {
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (const g of gps) if (g && g.connected) { gp = g; break; }
    if (!gp) return null;
    const ax = gp.axes[0] || 0;
    const b = i => gp.buttons[i] && gp.buttons[i].pressed;
    return {
      left: ax < -0.35 || b(14), right: ax > 0.35 || b(15), up: (gp.axes[1] || 0) < -0.5 || b(12), down: (gp.axes[1] || 0) > 0.5 || b(13),
      fire: b(0) || b(2) || b(7), special: b(1) || b(3) || b(5) || b(6), start: b(9), pause: b(9)
    };
  }
  update() {
    const k = this.keys, s = this.state;
    const gp = this.pollGamepad();
    s.left = this.key('ArrowLeft', 'KeyA') || (gp && gp.left);
    s.right = this.key('ArrowRight', 'KeyD') || (gp && gp.right);
    s.up = this.key('ArrowUp', 'KeyW') || (gp && gp.up);
    s.down = this.key('ArrowDown', 'KeyS') || (gp && gp.down);
    s.fire = this.key('KeyZ', 'Space', 'ControlLeft', 'ControlRight', 'KeyJ', 'Enter') || (gp && gp.fire) || this.touchFire;
    s.special = this.key('KeyX', 'ShiftLeft', 'ShiftRight', 'KeyK', 'KeyC') || (gp && gp.special) || this.touchSpecial;
    s.start = this.key('Enter', 'KeyZ', 'Space') || (gp && gp.start) || this.touchTap;
    s.pause = this.key('KeyP') || (gp && gp.pause);
    s.mute = this.key('KeyM');
    s.skip = this.key('KeyN');
    s.options = this.key('KeyO');
    s.back = this.key('Backspace');
    s.any = s.fire || s.special || s.start || s.left || s.right || this.touchTap;
    for (const n in s) { this.pressed[n] = s[n] && !this.prev[n]; this.prev[n] = s[n]; }
    this.touchTap = false; this.latch = {};
  }
}
