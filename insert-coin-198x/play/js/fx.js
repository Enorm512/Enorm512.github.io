// ---------------------------------------------------------------
// fx.js : particles, explosions (era styled), popups, shake, flash, lights
// ---------------------------------------------------------------
'use strict';

class FX {
  constructor(g) {
    this.g = g; this.p = []; this.texts = []; this.rings = []; this.lights = [];
    this.shakeA = 0; this.shakeT = 0; this.flashA = 0; this.flashC = '#fff';
    this.glowCache = new Map();
  }
  glow(color, r) {
    const key = color + '|' + r;
    let c = this.glowCache.get(key);
    if (!c) {
      c = document.createElement('canvas'); c.width = c.height = r * 2;
      const x = c.getContext('2d');
      const gr = x.createRadialGradient(r, r, 0, r, r, r);
      gr.addColorStop(0, color); gr.addColorStop(0.35, withAlpha(color.startsWith('#') ? color : '#ffffff', 0.45)); gr.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gr; x.fillRect(0, 0, r * 2, r * 2);
      this.glowCache.set(key, c);
    }
    return c;
  }
  add(o) { o.life = o.life || 0.5; o.max = o.life; this.p.push(o); return o; }
  explode(x, y, size = 1, color = '#ff8040', opts = {}) {
    const T = this.g.tier;
    const cols = [color, '#ffffff', '#ffe060', shade(color, 0.4)];
    if (T === 0) {
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; this.add({ kind: 'px', x, y, vx: Math.cos(a) * 45 * size, vy: Math.sin(a) * 45 * size, life: 0.3 + size * 0.1, color: i % 2 ? color : '#ffffff', s: 1 }); }
      this.rings.push({ kind: 'px83', x, y, r: 1, vr: 36 * size, life: 0.28, max: 0.28, color });
    } else if (T <= 2) {
      const n = Math.round(12 * size) + (T === 2 ? 6 : 0);
      for (let i = 0; i < n; i++) { const a = rand(TAU), sp = rand(20, 80) * size; this.add({ kind: 'px', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.25, 0.6), color: pick(cols), s: rand() < 0.3 ? 2 : 1 }); }
      this.rings.push({ kind: 'px', x, y, r: 1, vr: 50 * size, life: 0.3, max: 0.3, color });
      if (T === 2) this.rings.push({ kind: 'flash', x, y, r: 6 * size, vr: 20, life: 0.12, max: 0.12, color: '#fff' });
    } else if (T === 3) {
      for (let i = 0; i < 7 * size; i++) { const a = rand(TAU), sp = rand(30, 90) * size; this.add({ kind: 'shard', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: rand(TAU), vr: rand(-8, 8), life: rand(0.4, 0.8), color: pick(cols), s: rand(2, 4) * size }); }
      this.rings.push({ kind: 'line', x, y, r: 2, vr: 70 * size, life: 0.3, max: 0.3, color: '#fff' });
      this.rings.push({ kind: 'flash', x, y, r: 8 * size, vr: 30, life: 0.1, max: 0.1, color: '#fff' });
    } else {
      const n = Math.round(14 * size);
      for (let i = 0; i < n; i++) { const a = rand(TAU), sp = rand(40, 160) * size; this.add({ kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.15, 0.4), color: pick(cols), s: 1 }); }
      for (let i = 0; i < 8 * size; i++) { const a = rand(TAU), sp = rand(10, 50) * size; this.add({ kind: 'ember', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.4, 0.9), color: pick([color, '#ffd060']), s: rand(2, 4) * size }); }
      if (T !== 5) for (let i = 0; i < 4 * size; i++) { const a = rand(TAU), sp = rand(5, 25); this.add({ kind: 'smoke', x: x + rand(-4, 4), y: y + rand(-4, 4), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 10, life: rand(0.5, 1.1), color: '#444', s: rand(4, 8) * size }); }
      this.rings.push({ kind: T >= 5 ? 'neon' : 'shock', x, y, r: 2, vr: 110 * size, life: 0.35, max: 0.35, color: T >= 5 ? color : '#fff' });
      this.lights.push({ x, y, r: 50 * size, life: 0.35, max: 0.35, color });
      if (T === 7) for (let i = 0; i < 5; i++) this.add({ kind: 'glitch', x: x + rand(-20, 20) * size, y: y + rand(-12, 12) * size, vx: 0, vy: 0, life: rand(0.08, 0.3), color: pick(['#80ffff', '#ff40ff', '#fff']), s: rand(2, 12) * size, h: rand(1, 3) });
      if (size >= 1.5) this.shake(size * 1.5);
    }
  }
  bigExplosion(x, y, color, dur = 2.2) {
    // sequence of explosions over time (boss death)
    const n = Math.round(dur / 0.1);
    for (let i = 0; i < n; i++) {
      const t = i * 0.1;
      this.add({ kind: 'timer', x, y, life: t + 0.001, cb: () => { this.explode(x + rand(-40, 40), y + rand(-30, 30), rand(1, 2.2), i % 3 ? color : '#ffffff'); if (this.g.tier >= 3) this.shake(3); } });
    }
  }
  text(x, y, str, o = {}) { y = Math.max(y, 44); x = clamp(x, 30, W - 30); this.texts.push({ x, y, str, color: o.color || '#fff', size: o.size || 1, life: o.life || 0.9, max: o.life || 0.9, rise: o.rise === undefined ? 18 : o.rise, big: o.big }); }
  shake(a) { if (this.g.tier < 3) a *= 0.5; this.shakeA = Math.max(this.shakeA, a); this.shakeT = 0.3; }
  flash(color = '#fff', a = 0.5) { this.flashC = color; this.flashA = Math.max(this.flashA, a); }
  shakeOffset() {
    if (this.shakeT <= 0 || this.shakeA <= 0) return { x: 0, y: 0 };
    const k = this.shakeA * (this.shakeT / 0.3);
    return { x: rand(-k, k), y: rand(-k, k) };
  }
  clear() { this.p.length = 0; this.texts.length = 0; this.rings.length = 0; this.lights.length = 0; }
  update(dt) {
    for (const p of this.p) {
      p.life -= dt;
      if (p.kind === 'timer') { if (p.life <= 0) { p.cb(); p.dead = true; } continue; }
      if (p.life <= 0) { p.dead = true; continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'smoke') { p.vx *= 0.96; p.vy *= 0.96; p.s += 12 * dt; }
      if (p.kind === 'ember') { p.vx *= 0.97; p.vy *= 0.97; p.vy += 8 * dt; }
      if (p.kind === 'spark') { p.vx *= 0.93; p.vy *= 0.93; }
      if (p.kind === 'shard') { p.rot += p.vr * dt; p.vy += 30 * dt; }
      if (p.kind === 'star') { p.vx *= 0.9; p.vy *= 0.9; }
    }
    compact(this.p);
    for (const r of this.rings) { r.life -= dt; r.r += r.vr * dt; if (r.life <= 0) r.dead = true; }
    compact(this.rings);
    for (const l of this.lights) { l.life -= dt; if (l.life <= 0) l.dead = true; }
    compact(this.lights);
    for (const t of this.texts) { t.life -= dt; t.y -= t.rise * dt; if (t.life <= 0) t.dead = true; }
    compact(this.texts);
    if (this.shakeT > 0) { this.shakeT -= dt; if (this.shakeT <= 0) this.shakeA = 0; }
    if (this.flashA > 0) this.flashA = Math.max(0, this.flashA - dt * 2.5);
  }
  drawLights(ctx) {
    if (this.g.tier < 4 || !this.lights.length) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const l of this.lights) {
      const a = l.life / l.max;
      const r = l.r * (1.2 - a * 0.4);
      ctx.globalAlpha = a * 0.55;
      ctx.drawImage(this.glow(l.color, 64), l.x - r, l.y - r, r * 2, r * 2);
    }
    ctx.restore();
  }
  draw(ctx) {
    const T = this.g.tier, rs = this.g.rs;
    ctx.save();
    for (const r of this.rings) {
      const a = r.life / r.max;
      if (r.kind === 'px83') {
        ctx.fillStyle = r.color;
        const rr = Math.round(r.r);
        for (let i = 0; i < 8; i++) { const an = i / 8 * TAU + 0.4; ctx.fillRect(Math.round(r.x + Math.cos(an) * rr), Math.round(r.y + Math.sin(an) * rr), 2, 2); }
      } else if (r.kind === 'px') {
        ctx.strokeStyle = r.color; ctx.lineWidth = 2; ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(Math.round(r.x), Math.round(r.y), r.r, 0, TAU); ctx.stroke();
      } else if (r.kind === 'flash') {
        ctx.fillStyle = r.color; ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.fill();
      } else if (r.kind === 'line') {
        ctx.strokeStyle = r.color; ctx.lineWidth = 1; ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke();
      } else if (r.kind === 'shock') {
        ctx.strokeStyle = r.color; ctx.lineWidth = 3 * a + 0.5; ctx.globalAlpha = a * 0.8;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke();
      } else if (r.kind === 'neon') {
        ctx.strokeStyle = r.color; ctx.lineWidth = 2.5 * a + 0.5; ctx.globalAlpha = a;
        ctx.shadowBlur = 12; ctx.shadowColor = r.color;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
    ctx.globalAlpha = 1;
    const additive = T >= 4;
    if (additive) ctx.globalCompositeOperation = 'lighter';
    for (const p of this.p) {
      const a = p.life / p.max;
      switch (p.kind) {
        case 'px':
          ctx.fillStyle = p.color; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); break;
        case 'shard':
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.globalAlpha = a;
          ctx.beginPath(); ctx.moveTo(-p.s, p.s * 0.6); ctx.lineTo(p.s, 0); ctx.lineTo(-p.s * 0.5, -p.s * 0.7); ctx.closePath(); ctx.fill(); ctx.restore(); break;
        case 'spark':
          ctx.strokeStyle = p.color; ctx.globalAlpha = a; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.stroke(); break;
        case 'ember': {
          ctx.globalAlpha = a; const r = p.s * (0.5 + a * 0.5);
          ctx.drawImage(this.glow(p.color, 16), p.x - r, p.y - r, r * 2, r * 2); break;
        }
        case 'smoke':
          ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a * 0.35; ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill();
          if (additive) ctx.globalCompositeOperation = 'lighter'; break;
        case 'glitch':
          ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = p.color; ctx.globalAlpha = 0.8; ctx.fillRect(p.x, p.y, p.s, p.h);
          if (additive) ctx.globalCompositeOperation = 'lighter'; break;
        case 'trail':
          ctx.globalAlpha = a * 0.6; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * a, 0, TAU); ctx.fill(); break;
        case 'star':
          ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.s, p.s); break;
      }
    }
    ctx.restore();
    // popups
    for (const t of this.texts) {
      const a = Math.min(1, t.life / 0.3);
      ctx.save(); ctx.globalAlpha = a;
      drawText(ctx, t.str, t.x, t.y, { tier: T, color: t.color, size: t.size, align: 'center', glow: T >= 4 ? 6 : 0 });
      ctx.restore();
    }
  }
}
