// ---------------------------------------------------------------
// background.js : one backdrop per era
// 0 blinking pixel stars | 1 parallax + nebula | 2 planet, station, asteroids
// 3 3D tunnel + rotating station | 4 nebula, light, destructible structures
// 5 neon grid + sun | 6 procedural pixel nebula | 7 reality distortion
// ---------------------------------------------------------------
'use strict';

class Background {
  constructor(g) {
    this.g = g; this.t = 0;
    this.layers = [];
    const cols83 = ['#ffffff', '#ff4040', '#40ff40', '#4080ff', '#ffff40', '#ff40ff', '#40ffff'];
    for (let l = 0; l < 3; l++) {
      const arr = [];
      for (let i = 0; i < 48; i++) arr.push({ x: rand(W), y: rand(H), c: pick(cols83), blink: rand(TAU), bs: rand(2, 6), s: l === 2 ? 2 : 1 });
      this.layers.push(arr);
    }
    this.speeds = [18, 40, 75];
    this.nebula = {}; this.planetT = 0; this.asteroids = []; this.structures = [];
    this.station = { x: -200, t: 0 };
    this.tunnel = 0; this.stationRot = 0;
    this.stars3d = [];
    for (let i = 0; i < 60; i++) this.stars3d.push({ x: rand(-1, 1), y: rand(-1, 1), z: rand(0.1, 1) });
    this.glitchBands = [];
    this.penrose = 0;
    this.noiseCanvas = null;
  }
  // -------- helpers --------
  nebulaCanvas(tier) {
    if (this.nebula[tier]) return this.nebula[tier];
    const c = document.createElement('canvas'); c.width = W; c.height = H * 2;
    const x = c.getContext('2d');
    const rng = new RNG(1234 + tier * 77);
    const palettes = { 1: ['#1a0a40', '#301060', '#0a2040'], 2: ['#201050', '#102848', '#3a1030'], 4: ['#30102a', '#101c48', '#0a3030', '#3a2010'], 5: ['#300838', '#0a1848', '#20083a'], 6: ['#0e1030', '#1a0a30', '#082028'], 7: ['#001820', '#200020', '#001028'] };
    const pal = palettes[tier] || ['#101030'];
    if (tier === 1) {
      // dithered pixel clouds
      for (let i = 0; i < 8; i++) {
        const cx = rng.range(0, W), cy = rng.range(0, H * 2), r = rng.range(30, 70), col = rng.pick(pal);
        x.fillStyle = col;
        for (let yy = -r; yy < r; yy += 3) for (let xx = -r; xx < r; xx += 3) {
          const d = Math.hypot(xx, yy) / r; if (d > 1) continue;
          if (rng.next() < (1 - d) * (1 - d) * 0.9 && ((xx / 3 + yy / 3) & 1) === 0) x.fillRect(Math.round(cx + xx), Math.round(cy + yy), 3, 3);
        }
      }
    } else if (tier === 6) {
      // value noise, blocky 4px
      const blk = 4, gw = Math.ceil(W / blk), gh = Math.ceil(H * 2 / blk);
      const grid = (sx, sy, seed) => { const r = new RNG(seed); const g = []; for (let j = 0; j <= sy; j++) { const row = []; for (let i = 0; i <= sx; i++) row.push(r.next()); g.push(row); } return g; };
      const octs = [[8, 10, grid(8, 10, 5), 1], [16, 20, grid(16, 20, 9), 0.5], [32, 40, grid(32, 40, 17), 0.25]];
      for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
        let v = 0, tot = 0;
        for (const [sx, sy, gr, w] of octs) {
          const fx = i / gw * sx, fy = j / gh * sy, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
          const a = gr[iy][ix], b = gr[iy][Math.min(ix + 1, sx)], c2 = gr[Math.min(iy + 1, sy)][ix], d = gr[Math.min(iy + 1, sy)][Math.min(ix + 1, sx)];
          v += lerp(lerp(a, b, tx), lerp(c2, d, tx), ty) * w; tot += w;
        }
        v /= tot;
        const q = Math.floor(v * 6) / 6;
        if (q > 0.45) { x.fillStyle = mixHex(pal[(i + j) % 3 === 0 ? 1 : 0], '#60a0ff', (q - 0.45) * 0.8); x.globalAlpha = (q - 0.4) * 0.9; x.fillRect(i * blk, j * blk, blk, blk); }
      }
      x.globalAlpha = 1;
    } else {
      for (let i = 0; i < 12; i++) {
        const cx = rng.range(0, W), cy = rng.range(0, H * 2), r = rng.range(40, 110);
        const gr = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        gr.addColorStop(0, withAlpha(rng.pick(pal), 0.75)); gr.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = gr; x.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
    }
    this.nebula[tier] = c; return c;
  }
  drawNebula(ctx, tier, speed, alpha = 1) {
    const c = this.nebulaCanvas(tier);
    const off = (this.t * speed) % (H * 2);
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.drawImage(c, 0, off - H * 2); ctx.drawImage(c, 0, off);
    ctx.restore();
  }
  // -------- update --------
  update(dt) {
    this.t += dt;
    const T = this.g.tier;
    const spdMul = T === 0 ? 0.5 : 1 + T * 0.15;
    for (let l = 0; l < 3; l++) for (const s of this.layers[l]) { s.y += this.speeds[l] * spdMul * dt; if (s.y > H) { s.y -= H; s.x = rand(W); } }
    this.tunnel += dt * 0.5; this.stationRot += dt * 0.6; this.penrose += dt * 0.3;
    if (T === 2 || T === 4) {
      if (this.asteroids.length < (T === 2 ? 7 : 4) && Math.random() < dt * 0.5) this.asteroids.push({ x: rand(W), y: -20, r: rand(4, 11), rot: rand(TAU), vr: rand(-1, 1), vy: rand(15, 35), vx: rand(-6, 6) });
      for (const a of this.asteroids) { a.y += a.vy * dt; a.x += a.vx * dt; a.rot += a.vr * dt; if (a.y > H + 20) a.dead = true; }
      compact(this.asteroids);
      this.station.t += dt;
      if (T === 2 && this.station.t > 18) { this.station.t = 0; this.station.x = -220; }
      if (this.station.x < W + 220) this.station.x += 14 * dt;
    }
    if (T >= 4 && T <= 7) {
      if (this.structures.length < 5 && Math.random() < dt * 0.35) {
        const side = Math.random() < 0.5;
        this.structures.push({ x: side ? rand(4, 30) : rand(W - 30, W - 4), y: -30, w: rand(10, 18), h: rand(16, 34), hp: 3, vy: 22, color: pick(['#3a4a60', '#504060', '#405a50']), crack: 0 });
      }
      for (const s of this.structures) { s.y += s.vy * dt; if (s.y > H + 40) s.dead = true; }
      compact(this.structures);
    } else this.structures.length = 0;
    for (const s of this.stars3d) { s.z -= dt * 0.35; if (s.z <= 0.05) { s.z = 1; s.x = rand(-1, 1); s.y = rand(-1, 1); } }
    if (T === 7) {
      if (Math.random() < dt * 1.2) this.glitchBands.push({ y: rand(H), h: rand(2, 14), life: rand(0.05, 0.25), inv: Math.random() < 0.5 });
      for (const b of this.glitchBands) { b.life -= dt; if (b.life <= 0) b.dead = true; }
      compact(this.glitchBands);
    }
  }
  // -------- draw --------
  draw(ctx, T) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    switch (T) {
      case 0: this.drawStars83(ctx); break;
      case 1: this.drawNebula(ctx, 1, 6, 0.55); this.drawStarsLayers(ctx, 2, 1); break;
      case 2: this.drawNebula(ctx, 2, 8, 0.8); this.drawStarsLayers(ctx, 3, 2); this.drawPlanet92(ctx); this.drawStation92(ctx); this.drawAsteroids(ctx, 2); break;
      case 3: this.drawTunnel(ctx); this.drawStars3d(ctx); this.drawPlanet97(ctx); this.drawStation97(ctx); break;
      case 4: this.drawNebula(ctx, 4, 12, 0.9); this.drawStarsLayers(ctx, 3, 4); this.drawPlanet05(ctx); this.drawAsteroids(ctx, 4); this.drawStructures(ctx, 4); break;
      case 5: this.drawNebula(ctx, 5, 10, 0.8); this.drawSun15(ctx); this.drawGrid15(ctx); this.drawStarsLayers(ctx, 3, 5); this.drawStructures(ctx, 5); break;
      case 6: this.drawNebula(ctx, 6, 9, 0.9); this.drawStarsLayers(ctx, 3, 6); this.drawPlanet25(ctx); this.drawStructures(ctx, 6); break;
      case 7: this.drawNebula(ctx, 7, 14, 0.9); this.drawWarpGrid(ctx); this.drawStars3d(ctx); this.drawPenrose(ctx); this.drawStructures(ctx, 7); this.drawGlitchBands(ctx); break;
    }
  }
  drawStars83(ctx) {
    for (const s of this.layers[0]) {
      if (Math.sin(this.t * s.bs + s.blink) < -0.3) continue;
      ctx.fillStyle = s.c; ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
    }
    for (const s of this.layers[1]) { if (Math.sin(this.t * s.bs + s.blink) < 0.2) continue; ctx.fillStyle = s.c; ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); }
  }
  drawStarsLayers(ctx, n, T) {
    for (let l = 0; l < n; l++) {
      // later eras: stars stay small, dim dots so they never read as projectiles
      const alpha = (T >= 4 ? [0.25, 0.4, 0.55] : [0.45, 0.75, 1])[l];
      for (const s of this.layers[l]) {
        const tw = 0.6 + 0.4 * Math.sin(this.t * s.bs + s.blink);
        ctx.globalAlpha = alpha * tw;
        ctx.fillStyle = T >= 4 ? '#b0b8d0' : (l === 0 ? '#8090b0' : s.c);
        if (T >= 4) ctx.fillRect(s.x, s.y, l === 2 ? 1.5 : 1, l === 2 ? 1.5 : 1);
        else if (T >= 3) ctx.fillRect(s.x, s.y, s.s, s.s);
        else ctx.fillRect(Math.round(s.x), Math.round(s.y), s.s, s.s);
      }
    }
    ctx.globalAlpha = 1;
  }
  drawAsteroids(ctx, T) {
    for (const a of this.asteroids) {
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot);
      ctx.fillStyle = T === 2 ? '#6a5a50' : '#5a5560';
      ctx.beginPath();
      for (let i = 0; i < 7; i++) { const an = i / 7 * TAU; const r = a.r * (0.75 + 0.25 * Math.sin(i * 2.3)); ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = T === 2 ? '#8a7a68' : '#7a7580'; ctx.fillRect(-a.r * 0.4, -a.r * 0.4, a.r * 0.4, a.r * 0.3);
      if (T === 2) { ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke(); }
      ctx.restore();
    }
  }
  drawPlanet92(ctx) {
    const cx = W - 40, cy = 90 + Math.sin(this.t * 0.05) * 10, r = 34;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
    ctx.fillStyle = '#3060b0'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    const bands = ['#4070c0', '#2a50a0', '#5080d0', '#204890'];
    for (let i = 0; i < 10; i++) { const y = cy - r + i * (r * 2 / 10); ctx.fillStyle = bands[i % 4]; ctx.fillRect(cx - r, Math.round(y), r * 2, 4); }
    // rotating continents (pixel blobs)
    ctx.fillStyle = '#40a060';
    for (let i = 0; i < 6; i++) { const a = this.t * 0.25 + i * 1.1; const px = cx + Math.cos(a) * r * 0.8; if (Math.sin(a) < 0) continue; const py = cy + Math.sin(i * 1.7) * r * 0.6; ctx.fillRect(Math.round(px - 6), Math.round(py - 3), 12, 6); ctx.fillRect(Math.round(px - 3), Math.round(py - 6), 6, 12); }
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.arc(cx + 12, cy + 6, r, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
  }
  drawStation92(ctx) {
    const x = this.station.x, y = 150;
    if (x < -220 || x > W + 220) return;
    ctx.save(); ctx.translate(Math.round(x), y);
    ctx.fillStyle = '#283040';
    ctx.fillRect(-100, -6, 200, 12);
    for (let i = -4; i <= 4; i++) { ctx.fillRect(i * 22 - 8, -18, 16, 36); }
    ctx.fillStyle = '#404c60'; for (let i = -4; i <= 4; i++) { ctx.fillRect(i * 22 - 6, -16, 12, 4); ctx.fillRect(i * 22 - 6, 12, 12, 4); }
    ctx.fillStyle = '#80f0ff'; for (let i = -9; i <= 9; i++) if ((i + Math.floor(this.t * 4)) % 3 === 0) ctx.fillRect(i * 10, -2, 3, 2);
    ctx.fillStyle = '#1a2030'; ctx.fillRect(-30, -30, 60, 60); ctx.fillStyle = '#303c50'; ctx.fillRect(-26, -26, 52, 8); ctx.fillStyle = '#ff6040'; ctx.fillRect(-4, -34, 8, 4);
    ctx.restore();
  }
  // ---- 1997 ----
  drawTunnel(ctx) {
    const vx = W / 2 + Math.sin(this.t * 0.3) * 30, vy = 120 + Math.cos(this.t * 0.2) * 20;
    const N = 10;
    ctx.lineWidth = 1;
    for (let i = 0; i < N; i++) {
      const d = ((i + this.tunnel) % N) / N;
      const s = 0.02 + d * d * 1.5;
      const hw = W * 0.8 * s, hh = H * 0.8 * s;
      const a = d * 0.6;
      ctx.strokeStyle = `rgba(${Math.round(80 + 100 * d)},${Math.round(60 + 60 * d)},${Math.round(200)},${a})`;
      ctx.strokeRect(vx - hw, vy - hh, hw * 2, hh * 2);
    }
    ctx.strokeStyle = 'rgba(120,100,220,0.25)';
    ctx.beginPath();
    for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]]) { ctx.moveTo(vx, vy); ctx.lineTo(cx + (cx - vx) * 2, cy + (cy - vy) * 2); }
    ctx.stroke();
  }
  drawStars3d(ctx) {
    const vx = W / 2, vy = H * 0.4;
    for (const s of this.stars3d) {
      const sx = vx + s.x / s.z * W * 0.6, sy = vy + s.y / s.z * H * 0.6;
      if (sx < 0 || sx > W || sy < 0 || sy > H) continue;
      const sz = (1 - s.z) * 2.5 + 0.5;
      ctx.fillStyle = `rgba(255,255,255,${0.3 + (1 - s.z) * 0.7})`;
      ctx.fillRect(sx, sy, sz, sz);
    }
  }
  drawPlanet97(ctx) {
    const cx = 48, cy = 70 + Math.sin(this.t * 0.1) * 6, r = 28;
    const n = 10;
    for (let band = 0; band < 4; band++) {
      ctx.fillStyle = ['#8a6a40', '#b08050', '#705030', '#c09060'][band];
      ctx.beginPath();
      for (let i = 0; i <= n; i++) { const a = i / n * TAU; ctx.lineTo(cx + Math.cos(a) * r * (1 - band * 0.22), cy + Math.sin(a) * r * (1 - band * 0.22)); }
      ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); for (let i = 0; i <= n; i++) { const a = i / n * TAU; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.6, r * 0.35, -0.3, 0, TAU); ctx.strokeStyle = 'rgba(200,180,255,0.5)'; ctx.stroke();
  }
  drawStation97(ctx) {
    const cx = W - 52, cy = 92, R = 30, N = 8;
    const panels = [];
    for (let i = 0; i < N; i++) {
      const a = this.stationRot + i / N * TAU;
      panels.push({ x: cx + Math.cos(a) * R, depth: Math.sin(a), a });
    }
    panels.sort((p, q) => p.depth - q.depth);
    for (const p of panels) {
      const s = 0.55 + 0.45 * (p.depth * 0.5 + 0.5);
      const w = 9 * s, h = 14 * s;
      const sh = 0.45 + 0.55 * (p.depth * 0.5 + 0.5);
      ctx.fillStyle = `rgb(${Math.round(90 * sh)},${Math.round(110 * sh)},${Math.round(160 * sh)})`;
      ctx.fillRect(p.x - w / 2, cy - h / 2, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.8; ctx.strokeRect(p.x - w / 2, cy - h / 2, w, h);
      if (p.depth < 0) { ctx.fillStyle = '#304060'; ctx.beginPath(); ctx.arc(cx, cy, 9, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.stroke(); }
    }
    ctx.strokeStyle = 'rgba(150,170,230,0.5)'; ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.28, 0, 0, TAU); ctx.stroke();
  }
  // ---- 2005 ----
  drawPlanet05(ctx) {
    const cx = W + 10, cy = 60 + Math.sin(this.t * 0.07) * 8, r = 70;
    const g1 = ctx.createRadialGradient(cx - 20, cy - 20, 5, cx, cy, r);
    g1.addColorStop(0, '#ff9060'); g1.addColorStop(0.6, '#a03030'); g1.addColorStop(1, '#300810');
    ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    const g2 = ctx.createRadialGradient(cx, cy, r * 0.95, cx, cy, r * 1.25);
    g2.addColorStop(0, 'rgba(255,120,80,0.5)'); g2.addColorStop(1, 'rgba(255,120,80,0)');
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(cx, cy, r * 1.25, 0, TAU); ctx.fill();
  }
  drawStructures(ctx, T) {
    for (const s of this.structures) {
      ctx.save();
      if (T >= 5) { ctx.shadowBlur = 8; ctx.shadowColor = T === 7 ? '#80ffff' : '#ff40c0'; }
      ctx.fillStyle = T === 7 ? 'rgba(80,255,255,0.15)' : s.color;
      ctx.fillRect(s.x - s.w / 2, s.y, s.w, s.h);
      ctx.strokeStyle = T === 7 ? '#80ffff' : (T >= 5 ? '#ff60d0' : 'rgba(255,255,255,0.3)'); ctx.lineWidth = 1;
      ctx.strokeRect(s.x - s.w / 2, s.y, s.w, s.h);
      ctx.fillStyle = T >= 5 ? '#ffe060' : '#ffd080';
      for (let i = 0; i < 3; i++) ctx.fillRect(s.x - s.w / 2 + 2, s.y + 3 + i * 6, s.w - 4, 1.5);
      if (s.hp < 3) { ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.moveTo(s.x - s.w / 2, s.y + s.h * 0.3); ctx.lineTo(s.x, s.y + s.h * 0.5); ctx.lineTo(s.x + s.w / 2, s.y + s.h * 0.4); ctx.stroke(); }
      ctx.restore();
    }
  }
  // ---- 2015 ----
  drawSun15(ctx) {
    const cx = W / 2, cy = H * 0.5, r = 70;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
    const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    g.addColorStop(0, '#ffe060'); g.addColorStop(0.5, '#ff40a0'); g.addColorStop(1, '#8020c0');
    ctx.globalAlpha = 0.55; ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = '#000';
    for (let i = 0; i < 8; i++) { const y = cy + i * 10 - 10 + (this.t * 8 % 10); ctx.fillRect(cx - r, y, r * 2, 1 + i * 0.8); }
    ctx.restore();
  }
  drawGrid15(ctx) {
    const hy = H * 0.58;
    ctx.save(); ctx.globalAlpha = 0.28;
    ctx.strokeStyle = '#ff40ff'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const d = ((i + this.t * 0.9) % 12) / 12;
      const y = hy + d * d * (H - hy);
      ctx.moveTo(0, y); ctx.lineTo(W, y);
    }
    const vx = W / 2;
    for (let i = -8; i <= 8; i++) { ctx.moveTo(vx + i * 8, hy); ctx.lineTo(vx + i * 60, H); }
    ctx.stroke();
    ctx.restore();
  }
  // ---- 2025 ----
  drawPlanet25(ctx) {
    const cx = 44, cy = 84 + Math.sin(this.t * 0.08) * 6, r = 30;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
    ctx.fillStyle = '#204060'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    for (let yy = -r; yy < r; yy += 3) for (let xx = -r; xx < r; xx += 3) {
      const v = Math.sin((xx + this.t * 10) * 0.12) * Math.cos(yy * 0.15 + xx * 0.03);
      if (v > 0.3) { ctx.fillStyle = v > 0.7 ? '#60e0a0' : '#309070'; ctx.fillRect(cx + xx, cy + yy, 3, 3); }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.arc(cx + 12, cy + 8, r, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.shadowBlur = 14; ctx.shadowColor = '#40ffd0'; ctx.strokeStyle = 'rgba(64,255,208,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r + 1, 0, TAU); ctx.stroke(); ctx.restore();
  }
  // ---- 20XX ----
  drawWarpGrid(ctx) {
    ctx.save(); ctx.globalAlpha = 0.18; ctx.strokeStyle = '#80ffff'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = 0; y <= H; y += 24) {
      ctx.moveTo(0, y);
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, y + Math.sin(x * 0.05 + this.t * 2 + y * 0.02) * 6);
    }
    for (let x = 0; x <= W; x += 24) {
      ctx.moveTo(x, 0);
      for (let y = 0; y <= H; y += 8) ctx.lineTo(x + Math.sin(y * 0.05 - this.t * 1.5 + x * 0.02) * 6, y);
    }
    ctx.stroke(); ctx.restore();
  }
  drawPenrose(ctx) {
    const cx = W / 2, cy = 110, r = 40, a0 = this.penrose;
    ctx.save(); ctx.globalAlpha = 0.5; ctx.lineWidth = 1.2;
    for (let k = 0; k < 3; k++) {
      const a = a0 + k * TAU / 3, b = a + TAU / 3;
      const grad = ctx.createLinearGradient(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(b) * r, cy + Math.sin(b) * r);
      grad.addColorStop(0, '#80ffff'); grad.addColorStop(1, '#ff40ff');
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.lineTo(cx + Math.cos(b) * r, cy + Math.sin(b) * r);
      ctx.lineTo(cx + Math.cos(b) * r * 0.7, cy + Math.sin(b) * r * 0.7);
      ctx.lineTo(cx + Math.cos(a + 0.3) * r * 0.75, cy + Math.sin(a + 0.3) * r * 0.75);
      ctx.stroke();
    }
    ctx.restore();
  }
  drawGlitchBands(ctx) {
    for (const b of this.glitchBands) {
      ctx.fillStyle = b.inv ? 'rgba(255,255,255,0.08)' : 'rgba(255,64,255,0.12)';
      ctx.fillRect(0, b.y, W, b.h);
    }
  }
}
