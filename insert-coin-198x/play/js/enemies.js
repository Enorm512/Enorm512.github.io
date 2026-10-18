// ---------------------------------------------------------------
// enemies.js : Enemy class, species behaviors, mini-boss
// ---------------------------------------------------------------
'use strict';

const SPECIES = {
  drone: { hp: 1, score: 80, fire: 'single', dive: ['zigzag', 'straight'], formation: true },
  moth: { hp: 1, score: 100, fire: 'double', dive: ['loop', 'swoop'], formation: true },
  crab: { hp: 2, score: 150, fire: 'fan3', dive: ['straight', 'sine'], formation: true },
  commander: { hp: 3, score: 400, fire: 'fan3', dive: ['swoop', 'loop'], formation: true, leader: true },
  shielder: { hp: 2, score: 300, fire: 'single', dive: ['straight', 'zigzag'], formation: true, shield: 3 },
  bonus: { hp: 1, score: 1000, formation: false, free: 'bonus' },
  hunter: { hp: 2, score: 250, formation: false, free: 'hunter' },
  turret: { hp: 4, score: 300, formation: false, free: 'turret' },
  carrier: { hp: 10, score: 800, formation: false, free: 'carrier' },
  diver3d: { hp: 2, score: 300, formation: false, free: 'diver3d' },
  kamikaze: { hp: 1, score: 150, formation: false, free: 'kamikaze' },
  gunship: { hp: 8, score: 700, formation: false, free: 'gunship' },
  spiral: { hp: 6, score: 600, formation: false, free: 'spiral' },
  ring: { hp: 6, score: 600, formation: false, free: 'ring' },
  glitch: { hp: 4, score: 500, formation: false, free: 'glitch' },
  miniboss: { hp: 30, score: 3000, formation: false, free: 'miniboss' },
};

class Enemy {
  constructor(g, sp, o = {}) {
    this.g = g; this.sp = sp; this.def = SPECIES[sp]; this.sprite = o.sprite || sp;
    this.scale = o.scale || 1;
    this.hp = Math.max(1, Math.round(this.def.hp * g.E.hpMul * g.loopMul * g.rankHp * (o.hpMul || 1))); this.maxHp = this.hp;
    this.x = o.x === undefined ? W / 2 : o.x; this.y = o.y === undefined ? -20 : o.y;
    this.home = o.home || null;
    this.path = o.path || null; this.pathD = 0; this.speed = o.speed || 130;
    this.state = this.path ? 'enter' : (this.def.formation ? 'return' : 'free');
    this.t = 0; this.fireT = rand(0.8, 2.5); this.flash = 0; this.frame = 0; this.animT = 0;
    this.shield = this.def.shield || 0; this.dead = false; this.value = this.def.score; this.hidden = !!o.hidden;
    this.alpha = 1; this.rot = 0; this.depth = 1; this.vx = 0; this.vy = 0; this.d = {}; this.waveId = o.waveId || 0;
    this.setRadii();
    const BULLET_COLORS = { turret: '#ff9030', gunship: '#ff4080', carrier: '#60e0ff', hunter: '#60a0ff' };   // bright colours for species whose body colour is dark
    this.bulletColor = g.tier === 0 ? '#ffffff' : (BULLET_COLORS[this.sp] || SPR[this.sprite].pal[1]);
    this.gone = false; this.entered = false; this.lifeT = 0;
    if (this.def.free && FREE[this.def.free].init) FREE[this.def.free].init(this, g);
  }
  setRadii() { const q = spriteRadii(this.sprite, this.g.tier, this.scale * this.depth); this.rx = q.rx; this.ry = q.ry; this.r = Math.max(q.rx, q.ry); }
  homePos() { return this.g.director.slotPos(this.home.col, this.home.row); }
  update(dt) {
    const g = this.g;
    this.t += dt; this.lifeT += dt; this.animT += dt; if (this.animT > 0.3) { this.animT = 0; this.frame ^= 1; }
    if (this.flash > 0) this.flash -= dt;
    this.setRadii();
    switch (this.state) {
      case 'enter': {
        this.pathD += this.speed * dt;
        const p = this.path.at(this.pathD); this.x = p.x; this.y = p.y;
        if (this.pathD >= this.path.len) { this.state = this.def.formation ? 'return' : 'free'; this.entered = true; }
        this.maybeFireIdle(dt, 0.25);
        break;
      }
      case 'return': {
        const h = this.homePos();
        const d = dist(this.x, this.y, h.x, h.y);
        const sp = Math.max(this.speed, 100) * dt;
        if (d <= sp) { this.x = h.x; this.y = h.y; this.state = 'formation'; this.entered = true; }
        else { this.x += (h.x - this.x) / d * sp; this.y += (h.y - this.y) / d * sp; }
        break;
      }
      case 'formation': {
        const h = this.homePos(); this.x = h.x; this.y = h.y;
        this.maybeFireIdle(dt, g.E.id >= 3 ? 0.08 : g.E.id >= 1 ? 0.06 : 0.03);
        break;
      }
      case 'dive': {
        this.pathD += this.speed * dt;
        const p = this.path.at(this.pathD);
        const dx = p.x - this.x, dy = p.y - this.y;
        if (g.tier >= 2 && (dx || dy)) this.rot = Math.atan2(dy, dx) - Math.PI / 2;
        this.x = p.x; this.y = p.y;
        this.diveFire(dt);
        if (this.pathD >= this.path.len) {
          this.rot = 0;
          if (!this.def.formation) { this.dead = true; this.gone = true; break; }
          if (this.y > H) { const h = this.homePos(); this.x = h.x; this.y = -16; }
          this.state = 'return'; this.speed = 110;
        }
        break;
      }
      case 'free': FREE[this.def.free].update(this, g, dt); break;
    }
  }
  maybeFireIdle(dt, rate) {
    const g = this.g;
    if (!g.player.alive || this.y > g.player.y - 30 || this.y < 0) return;
    this.fireT -= dt * rate * g.E.diveRate * g.rankFire * g.loopMul;
    if (this.fireT <= 0) { this.fireT = rand(2, 5); PAT.aimed(g, this.x, this.y + 4, g.E.enemyBulletSpeed * 0.9, this.bulletOpts()); }
  }
  // early eras: aimed shots scatter a little so they land near the ship rather than on it
  bulletOpts(extra = {}) { return Object.assign({ color: this.bulletColor, kind: this.g.E.bullet, offset: this.g.E.id <= 2 ? rand(-0.12, 0.12) : 0 }, extra); }
  startDive() {
    if (this.state !== 'formation') return false;
    this.state = 'dive'; this.path = DIVES[pick(this.def.dive)](this, this.g); this.pathD = 0;
    this.speed = 95 + this.g.E.id * 12 + (this.g.loop - 1) * 15;
    this.d.fired = 0; this.d.nextFire = 0.25;
    return true;
  }
  diveFire(dt) {
    const g = this.g, prog = this.pathD / this.path.len;
    if (prog < this.d.nextFire || this.y > g.player.y - 20 || !g.player.alive) return;
    this.d.nextFire += g.E.id <= 1 ? 0.42 : 0.3;
    const sp = g.E.enemyBulletSpeed, o = this.bulletOpts();
    switch (this.def.fire) {
      case 'single': PAT.aimed(g, this.x, this.y + 4, sp, o); break;
      case 'double': PAT.aimed(g, this.x - 4, this.y + 4, sp, o); PAT.aimed(g, this.x + 4, this.y + 4, sp, o); break;
      case 'fan3': PAT.fan(g, this.x, this.y + 4, sp, 3, 0.5, o); break;
    }
  }
  hit(dmg, fromBelow = true) {
    const g = this.g;
    if (this.dead) return false;
    if (this.shield > 0 && fromBelow) {
      this.shield -= 1; this.flash = 0.06; g.audio.sfx('shieldHit');
      if (this.shield === 0) g.fx.text(this.x, this.y - 12, 'SHIELD DOWN', { color: '#60e0ff', size: 0.75, life: 0.6 });
      return false;
    }
    this.hp -= dmg;
    if (this.t - (this.lastFlashT || -1) > (this.scale > 1.5 ? 0.3 : 0)) { this.flash = 0.07; this.lastFlashT = this.t; }
    if (this.hp <= 0) { this.die(); return true; }
    g.audio.sfx(this.scale > 1.5 ? 'bossHit' : 'hit');
    return false;
  }
  die() { this.dead = true; this.g.onEnemyKilled(this); }
  draw(ctx) {
    const g = this.g, T = g.tier;
    if (this.hidden) ctx.globalAlpha = 0.12 + 0.1 * Math.sin(this.t * 9);
    else if (this.alpha < 1) ctx.globalAlpha = this.alpha;
    if (this.def.free && FREE[this.def.free].drawUnder) FREE[this.def.free].drawUnder(this, g, ctx);
    let sx;
    if (T === 3 && this.state === 'dive') sx = 0.55 + 0.45 * Math.abs(Math.cos(this.t * 5));
    const gx = (T === 7 && Math.random() < 0.05) ? rand(-3, 3) : 0;
    drawSprite(ctx, this.sprite, this.x + gx, this.y, { tier: T, rs: g.rs, frame: this.frame, variant: this.flash > 0 ? 'flash' : 'n', rot: this.rot, scale: this.scale * this.depth, sx });
    if (this.shield > 0) {
      ctx.save(); ctx.strokeStyle = this.flash > 0 ? '#fff' : '#60e0ff'; ctx.lineWidth = this.shield; ctx.globalAlpha = 0.9;
      if (T >= 4) { ctx.shadowBlur = 6; ctx.shadowColor = '#60e0ff'; }
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r + 4, 0.25, Math.PI - 0.25); ctx.stroke(); ctx.restore();
    }
    if (this.scale > 1.5 && this.state === 'free') {
      const w = 40, hx = this.x - w / 2, hy = this.y - this.r - 8;
      ctx.fillStyle = '#000'; ctx.fillRect(hx - 1, hy - 1, w + 2, 4);
      ctx.fillStyle = '#ff4040'; ctx.fillRect(hx, hy, w * clamp(this.hp / this.maxHp, 0, 1), 2);
    }
    ctx.globalAlpha = 1;
  }
}

// ------------- free-flight behaviors -------------
const leaveDown = (e, dt, sp = 90) => { e.y += sp * dt; if (e.y > H + 30) { e.dead = true; e.gone = true; } };
const FREE = {
  bonus: {
    init(e, g) { e.d.dir = Math.random() < 0.5 ? 1 : -1; e.x = e.d.dir > 0 ? -16 : W + 16; e.y = rand(36, 90); e.d.baseY = e.y; e.speed = 70 + g.E.id * 8; },
    update(e, g, dt) {
      e.x += e.d.dir * e.speed * dt; e.y = e.d.baseY + Math.sin(e.t * 3) * 12;
      if ((e.d.dir > 0 && e.x > W + 18) || (e.d.dir < 0 && e.x < -18)) { e.dead = true; e.gone = true; }
    }
  },
  hunter: {
    init(e, g) { e.x = rand(30, W - 30); e.y = -16; e.d.ty = rand(60, 130); e.d.burst = 0; e.d.bt = 0; e.fireT = 1.5; },
    update(e, g, dt) {
      if (e.lifeT > 10) { leaveDown(e, dt, 120); return; }
      e.y = approach(e.y, e.d.ty, 80 * dt);
      const tx = g.player.x;
      e.vx = approach(e.vx, clamp((tx - e.x) * 2.5, -120, 120), 300 * dt); e.x = clamp(e.x + e.vx * dt, 10, W - 10);
      e.rot = g.tier >= 2 ? clamp(e.vx / 400, -0.3, 0.3) : 0;
      e.fireT -= dt;
      if (e.fireT <= 0) { e.fireT = (g.E.id >= 4 ? 2.6 : 2.9) / g.loopMul; e.d.burst = g.E.id >= 4 ? 3 : 2; e.d.bt = 0; }
      if (e.d.burst > 0) { e.d.bt -= dt; if (e.d.bt <= 0) { e.d.bt = 0.13; e.d.burst--; g.spawnEBullet(e.x, e.y + 8, 0, g.E.enemyBulletSpeed * 1.3, e.bulletOpts()); } }
    }
  },
  turret: {
    init(e, g) { e.x = rand(24, W - 24); e.y = -24; e.vy = 17; e.d.rockR = 16; e.d.rockRot = rand(TAU); e.fireT = 1.4; e.d.aim = Math.PI / 2; },
    update(e, g, dt) {
      e.y += e.vy * dt; e.d.rockRot += 0.2 * dt;
      if (e.y > H + 30) { e.dead = true; e.gone = true; return; }
      const ta = angleTo(e.x, e.y, g.player.x, g.player.y);
      e.d.aim += clamp(wrapAngle(ta - e.d.aim), -2 * dt, 2 * dt);
      e.fireT -= dt;
      if (e.fireT <= 0 && e.y > 10 && g.player.alive) { e.fireT = (g.E.id >= 4 ? 1.1 : 1.6) / g.loopMul; const a = e.d.aim; g.spawnEBullet(e.x + Math.cos(a) * 10, e.y + Math.sin(a) * 10, Math.cos(a) * g.E.enemyBulletSpeed, Math.sin(a) * g.E.enemyBulletSpeed, e.bulletOpts()); }
    },
    drawUnder(e, g, ctx) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.d.rockRot);
      ctx.fillStyle = g.tier >= 4 ? '#4a4858' : '#6a5a50'; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const an = i / 8 * TAU, r = e.d.rockR * (0.8 + 0.2 * Math.sin(i * 2.7)); ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
      ctx.closePath(); ctx.fill(); if (g.tier <= 2) { ctx.strokeStyle = '#000'; ctx.stroke(); }
      ctx.restore();
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.d.aim); ctx.fillStyle = e.flash > 0 ? '#fff' : '#ff6020'; ctx.fillRect(0, -1.5, 12, 3); ctx.restore();
    }
  },
  carrier: {
    init(e, g) { e.x = rand(60, W - 60); e.y = -24; e.vx = Math.random() < 0.5 ? 28 : -28; e.d.spawnT = 2; e.d.spawned = 0; e.fireT = 3; },
    update(e, g, dt) {
      if (e.lifeT > 22) { leaveDown(e, dt, 50); return; }
      e.y = approach(e.y, 58, 50 * dt);
      e.x += e.vx * dt; if (e.x < 40 || e.x > W - 40) e.vx = -e.vx;
      e.d.spawnT -= dt;
      if (e.d.spawnT <= 0 && e.d.spawned < 6 && e.y > 30) {
        e.d.spawnT = 2.6 / g.loopMul; e.d.spawned++;
        const d = new Enemy(g, 'drone', { x: e.x, y: e.y + 10, waveId: e.waveId });
        d.state = 'dive'; d.path = DIVES.straight(d, g); d.pathD = 0; d.speed = 120; d.d.nextFire = 0.3; d.def = Object.assign({}, SPECIES.drone, { formation: false });
        g.enemies.push(d); g.fx.explode(e.x, e.y + 10, 0.4, '#60e0ff');
      }
      e.fireT -= dt; if (e.fireT <= 0 && g.player.alive) { e.fireT = 3.0; PAT.fan(g, e.x, e.y + 10, g.E.enemyBulletSpeed, 4, 0.9, e.bulletOpts()); }
    }
  },
  diver3d: {
    init(e, g) { e.depth = 0.08; e.d.vx = W / 2 + rand(-20, 20); e.d.vy = 90; e.d.tx = rand(30, W - 30); e.d.ty = rand(60, 120); e.alpha = 0.6; },
    update(e, g, dt) {
      if (e.depth < 1) {
        e.depth = Math.min(1, e.depth + dt * 0.45); e.alpha = 0.5 + e.depth * 0.5;
        const k = easeIn(e.depth);
        e.x = lerp(e.d.vx, e.d.tx, k); e.y = lerp(e.d.vy, e.d.ty, k);
        if (e.depth >= 1) { e.state = 'dive'; e.path = DIVES[pick(['straight', 'zigzag'])](e, g); e.pathD = 0; e.speed = 130 + g.E.id * 8; e.d.nextFire = 0.2; e.def = Object.assign({}, e.def, { fire: 'fan3' }); }
      }
    }
  },
  kamikaze: {
    init(e, g) { e.x = rand(16, W - 16); e.y = -14; e.d.wait = 0.5; e.d.launched = false; },
    update(e, g, dt) {
      if (!e.d.launched) {
        e.y = approach(e.y, 20, 60 * dt); e.d.wait -= dt; e.alpha = Math.floor(e.t * 16) % 2 ? 1 : 0.4;
        if (e.d.wait <= 0) { e.d.launched = true; e.alpha = 1; const a = angleTo(e.x, e.y, g.player.x, g.player.y); const sp = 230 + g.E.id * 15; e.vx = Math.cos(a) * sp; e.vy = Math.sin(a) * sp; e.rot = a - Math.PI / 2; }
        return;
      }
      e.x += e.vx * dt; e.y += e.vy * dt;
      if (g.tier >= 4) g.fx.add({ kind: 'trail', x: e.x, y: e.y, vx: 0, vy: 0, life: 0.25, color: '#ff8040', s: 3 });
      if (e.y > H + 20 || e.x < -20 || e.x > W + 20) { e.dead = true; e.gone = true; }
    }
  },
  gunship: {
    init(e, g) { e.x = rand(50, W - 50); e.y = -24; e.d.bx = e.x; e.fireT = 1.5; e.d.ft2 = 0.8; },
    update(e, g, dt) {
      if (e.lifeT > 18) { leaveDown(e, dt, 60); return; }
      e.y = approach(e.y, 72, 50 * dt); e.x = e.d.bx + Math.sin(e.t * 0.8) * 50;
      e.fireT -= dt; if (e.fireT <= 0 && g.player.alive) { e.fireT = 2.4 / g.loopMul; PAT.fan(g, e.x, e.y + 10, g.E.enemyBulletSpeed * 1.05, 4, 0.8, e.bulletOpts()); }
      e.d.ft2 -= dt; if (e.d.ft2 <= 0 && g.player.alive) { e.d.ft2 = 1.1; PAT.aimed(g, e.x + (Math.random() < 0.5 ? -10 : 10), e.y + 6, g.E.enemyBulletSpeed * 1.25, e.bulletOpts()); }
      if (g.tier >= 4 && Math.random() < 0.5) g.fx.add({ kind: 'trail', x: e.x + rand(-6, 6), y: e.y - 8, vx: 0, vy: -30, life: 0.3, color: '#ff4080', s: 2 });
    }
  },
  spiral: {
    init(e, g) { e.x = rand(50, W - 50); e.y = -24; e.d.ty = rand(60, 110); e.d.a = rand(TAU); e.d.ft = 1.0; e.vx = rand(-15, 15); e.d.burst = 0; e.d.rest = 0; },
    update(e, g, dt) {
      if (e.lifeT > 15) { leaveDown(e, dt, 60); return; }
      e.y = approach(e.y, e.d.ty, 50 * dt); e.x = clamp(e.x + e.vx * dt, 20, W - 20); e.rot = e.d.a;
      if (e.y < e.d.ty - 1 || !g.player.alive) return;
      // fires in bursts: ~1.6 s of spray, then a 1.3 s rest (spins slowly while resting)
      if (e.d.rest > 0) { e.d.rest -= dt; e.d.a += 0.6 * dt; return; }
      e.d.burst += dt;
      if (e.d.burst > 1.3) { e.d.burst = 0; e.d.rest = 1.6; return; }
      e.d.ft -= dt;
      if (e.d.ft <= 0) {
        e.d.ft = 0.2 / Math.min(1.5, g.loopMul); e.d.a += 0.38;
        const sp = g.E.enemyBulletSpeed * 0.62;
        for (const off of [0, Math.PI]) g.spawnEBullet(e.x, e.y, Math.cos(e.d.a + off) * sp, Math.sin(e.d.a + off) * sp, e.bulletOpts());
      }
    }
  },
  ring: {
    init(e, g) { e.x = rand(50, W - 50); e.y = -24; e.d.ty = rand(60, 120); e.fireT = 1.6; e.d.phase = 0; e.vx = rand(-20, 20); e.d.shots = 0; },
    update(e, g, dt) {
      if (e.lifeT > 15) { leaveDown(e, dt, 60); return; }
      e.y = approach(e.y, e.d.ty, 50 * dt); e.x = clamp(e.x + e.vx * dt, 20, W - 20); e.rot = e.t * 1.5;
      if (e.y < e.d.ty - 1) return;      // wind-up: no fire until in position
      e.fireT -= dt;
      if (e.fireT <= 0 && g.player.alive) {
        // two rings 2.4 s apart, then a 3 s rest
        e.d.shots++; e.fireT = (e.d.shots % 2 === 0 ? 3.0 : 2.4) / g.loopMul; e.d.phase += 0.3;
        const gap = angleTo(e.x, e.y, g.player.x, g.player.y) + rand(-0.6, 0.6);
        PAT.ring(g, e.x, e.y, g.E.enemyBulletSpeed * 0.7, 12, e.d.phase, e.bulletOpts({ gapAt: gap, gapWidth: 0.6 }));
      }
    }
  },
  glitch: {
    init(e, g) { e.x = rand(30, W - 30); e.y = rand(40, 140); e.d.tp = 1.2; e.fireT = 0.8; },
    update(e, g, dt) {
      if (e.lifeT > 14) { e.dead = true; e.gone = true; g.fx.explode(e.x, e.y, 0.6, '#80ffff'); return; }
      e.d.tp -= dt;
      e.alpha = e.d.tp < 0.2 ? Math.floor(e.t * 30) % 2 : 1;
      if (e.d.tp <= 0) { e.d.tp = 1.5; g.fx.explode(e.x, e.y, 0.5, '#ff40ff'); e.x = rand(30, W - 30); e.y = rand(40, 150); g.fx.explode(e.x, e.y, 0.5, '#80ffff'); g.audio.sfx('glitch'); }
      e.fireT -= dt;
      if (e.fireT <= 0 && g.player.alive) { e.fireT = 2.0; for (let i = 0; i < 2; i++) { const a = rand(TAU), sp = g.E.enemyBulletSpeed * 0.75; g.spawnEBullet(e.x, e.y, Math.cos(a) * sp, Math.sin(a) * sp, e.bulletOpts({ homing: 1.0, life: 3 })); } }
    }
  },
  miniboss: {
    init(e, g) { e.x = W / 2; e.y = -40; e.d.cycle = 0; e.fireT = 2; e.d.spT = 4; e.vx = 40; },
    update(e, g, dt) {
      e.y = approach(e.y, 64, 45 * dt);
      e.x += e.vx * dt; if (e.x < 50 || e.x > W - 50) e.vx = -e.vx;
      if (g.tier >= 2) e.rot = Math.sin(e.t) * 0.08;
      if (e.y < 60 || !g.player.alive) return;
      const low = e.hp < e.maxHp * 0.5;
      e.fireT -= dt * (low ? 1.5 : 1);
      if (e.fireT <= 0) {
        e.fireT = 2.0 / g.loopMul; const sp = g.E.enemyBulletSpeed, o = e.bulletOpts();
        const c = e.d.cycle++ % 3;
        if (c === 0) PAT.fan(g, e.x, e.y + 14, sp, 5 + g.E.id, 0.9, o);
        else if (c === 1) PAT.ring(g, e.x, e.y, sp * 0.75, 10 + g.E.id * 2, e.t, Object.assign({}, o, { gapAt: Math.PI / 2 + rand(-1, 1), gapWidth: 0.4 }));
        else { for (let i = 0; i < 3; i++) setTimeout(() => { if (!e.dead) PAT.aimed(g, e.x, e.y + 14, sp * 1.3, o); }, i * 120); }
      }
      e.d.spT -= dt;
      if (e.d.spT <= 0 && g.E.id >= 1) { e.d.spT = 5; for (const s of [-1, 1]) { const d = new Enemy(g, 'drone', { x: e.x + s * 20, y: e.y, waveId: e.waveId }); d.state = 'dive'; d.path = DIVES.zigzag(d, g); d.speed = 110; d.def = Object.assign({}, SPECIES.drone, { formation: false }); d.d.nextFire = 0.3; g.enemies.push(d); } }
    }
  }
};

const MINIBOSS_SPRITE = ['crab', 'commander', 'carrier', 'diver3d', 'gunship', 'spiral', 'ring', 'glitch'];
function makeMiniBoss(g) {
  const sprite = MINIBOSS_SPRITE[g.era];
  const e = new Enemy(g, 'miniboss', { sprite, scale: 2.4, hpMul: 1 + g.era * 0.5 });
  e.value = 3000 * (g.era + 1);
  e.bulletColor = g.tier === 0 ? '#ffffff' : SPR[sprite].pal[2];
  return e;
}
