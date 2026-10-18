// ---------------------------------------------------------------
// INSERT COIN 198X - util.js : constants and helpers
// ---------------------------------------------------------------
'use strict';
const W = 256, H = 336;            // logical playfield size
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[(Math.random() * arr.length) | 0];
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const angleTo = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
const sign = v => v < 0 ? -1 : 1;
const easeOut = t => 1 - (1 - t) * (1 - t);
const easeIn = t => t * t;
const easeInOut = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const wrapAngle = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
const approach = (v, target, step) => v < target ? Math.min(v + step, target) : Math.max(v - step, target);

class RNG {
  constructor(seed) { this.s = (seed >>> 0) || 0x9e3779b9; }
  next() { let x = this.s; x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; this.s = x; return x / 4294967296; }
  range(a, b) { return a + this.next() * (b - a); }
  int(a, b) { return Math.floor(this.range(a, b + 1)); }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  chance(p) { return this.next() < p; }
}

function fmtScore(n) {
  n = Math.floor(n);
  return n.toLocaleString('en-US');
}
function pad(n, len) { let s = String(n); while (s.length < len) s = '0' + s; return s; }

// Color helpers
function hexToRgb(h) {
  if (h[0] === '#') h = h.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbStr(r, g, b, a = 1) { return `rgba(${r | 0},${g | 0},${b | 0},${a})`; }
function shade(hex, f) { // f>0 lighten, f<0 darken
  const [r, g, b] = hexToRgb(hex);
  if (f >= 0) return rgbStr(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
  return rgbStr(r * (1 + f), g * (1 + f), b * (1 + f));
}
function withAlpha(hex, a) { const [r, g, b] = hexToRgb(hex); return rgbStr(r, g, b, a); }
function mixHex(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbStr(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }

// Catmull-Rom path through points, resampled to constant-speed polyline.
class Path {
  constructor(points, samples = 64) {
    this.pts = [];
    this.len = 0;
    this.cum = [0];
    const p = points;
    if (p.length < 2) { this.pts = p.slice(); return; }
    const out = [];
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[Math.max(i - 1, 0)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(i + 2, p.length - 1)];
      const segs = Math.max(2, Math.round(samples / (p.length - 1)));
      for (let s = 0; s < segs; s++) {
        const t = s / segs, t2 = t * t, t3 = t2 * t;
        out.push({
          x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
        });
      }
    }
    out.push({ x: p[p.length - 1].x, y: p[p.length - 1].y });
    this.pts = out;
    for (let i = 1; i < out.length; i++) { this.len += dist(out[i - 1].x, out[i - 1].y, out[i].x, out[i].y); this.cum.push(this.len); }
  }
  // position at distance d along path
  at(d) {
    const pts = this.pts, cum = this.cum;
    if (d <= 0) return { x: pts[0].x, y: pts[0].y };
    if (d >= this.len) { const q = pts[pts.length - 1]; return { x: q.x, y: q.y }; }
    let lo = 0, hi = cum.length - 1;
    while (lo < hi - 1) { const m = (lo + hi) >> 1; if (cum[m] <= d) lo = m; else hi = m; }
    const t = (d - cum[lo]) / Math.max(1e-6, cum[hi] - cum[lo]);
    return { x: lerp(pts[lo].x, pts[hi].x, t), y: lerp(pts[lo].y, pts[hi].y, t) };
  }
}

// simple object pool-free array compaction helper
function compact(arr) { let j = 0; for (let i = 0; i < arr.length; i++) { if (!arr[i].dead) arr[j++] = arr[i]; } arr.length = j; }

// Storage helpers
const Store = {
  get(k, def) { try { const v = localStorage.getItem('ic198x_' + k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem('ic198x_' + k, JSON.stringify(v)); } catch (e) { } }
};
