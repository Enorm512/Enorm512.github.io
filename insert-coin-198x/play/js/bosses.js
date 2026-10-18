// ---------------------------------------------------------------
// bosses.js : eight era bosses built from parts
// ---------------------------------------------------------------
'use strict';

// ---- boss part sprites ----
defSprite('b83core', mirror(['....11111', '..1111111', '.11111111', '111166111', '111166111', '111111111', '1.1222222', '1..122222', '11..11222', '.11..1111', '..11.1.1.', '...1...1.', '..1....1.', '.1......1', '1........']),
  ['#ff40a0', '#ffe040', '#40ffe0', '#601040', '#fff', '#ffffff'], ['#ff40a0', '#ffe040'], { hit: 0.85 });
defSprite('b83claw', mirror(['11....', '.11...', '..11..', '..111.', '.11211', '112221', '.11221', '..1111', '...111']),
  ['#ff40a0', '#ffe040', '#fff', '#601040', '#fff', '#fff'], ['#ff40a0', '#ffe040']);
defSprite('b88hull', mirror(['................1', '...............11', '..............112', '...........111122', '.........11111222', '......11111112222', '....1111222222222', '..111112224442222', '11111122244422222', '11111122222222222', '..111112222222222', '....1111111111111', '......1.1.1.1.1.1', '.......3...3...3.']),
  ['#8080a0', '#505070', '#ff6040', '#202030', '#fff', '#ffe040'], ['#8080a0', '#ff6040'], { hit: 0.9 });
defSprite('b88turret', mirror(['...11', '..122', '.1222', '12223', '.1222', '..122', '...11']),
  ['#c0c0d0', '#707090', '#ff4040', '#303040', '#fff', '#fff'], ['#c0c0d0', '#ff4040']);
defSprite('b88bridge', mirror(['....11', '..1166', '.11222', '112233', '112333', '112233', '.11222', '..1122', '....11']),
  ['#ffe040', '#ff8000', '#ff2020', '#604000', '#fff', '#80ffff'], ['#ffe040', '#ff2020']);
defSprite('b92head', mirror(['......1', '.....11', '....112', '...1122', '..11622', '.112222', '1122222', '1122222', '.112222', '..11222', '..11322', '...1133', '....113']),
  ['#50e050', '#208030', '#ffe040', '#104010', '#fff', '#ff4040'], ['#50e050', '#ffe040']);
defSprite('b92seg', mirror(['...111', '.11222', '.12222', '112223', '122233', '122333', '122233', '112223', '.12222', '.11222', '...111']),
  ['#50e050', '#208030', '#ffe040', '#104010', '#fff', '#ff4040'], ['#50e050', '#ffe040']);
defSprite('b92tail', mirror(['..111', '.1222', '.1222', '..122', '..122', '...12', '...12', '....1', '....1']),
  ['#50e050', '#208030', '#ffe040', '#104010', '#fff', '#ff4040'], ['#50e050', '#ffe040']);
defSprite('b97pod', mirror(['....1', '...11', '..112', '.1122', '11226', '.1122', '..112', '...11', '....1']),
  ['#c0c0e0', '#6060a0', '#ff8040', '#303060', '#fff', '#ff4040'], ['#c0c0e0', '#ff8040']);
defSprite('b97core', mirror(['....111', '..11222', '.112222', '.122223', '1122233', '1222336', '1223366', '1222336', '1122233', '.122223', '.112222', '..11222', '....111']),
  ['#9090c0', '#5050a0', '#ff6020', '#202050', '#fff', '#ff2020'], ['#9090c0', '#ff6020']);
defSprite('b05hull', mirror(['....................1', '...................11', '..................111', '.................1122', '...............111222', '.............11112222', '..........11112222222', '........1111222222222', '......111122244422222', '....11111222444222222', '..1111112222222222222', '111111122244422222222', '111111122244422222222', '111111122222222222222', '.11111112222222222222', '..1111111222222222222', '....11111111111111111', '......1.1.1.1.1.1.1.1', '.......3...3...3...3.']),
  ['#607890', '#3a4a60', '#ff6030', '#141c28', '#fff', '#60e0ff'], ['#607890', '#ff6030'], { hit: 0.9 });
defSprite('b05section', mirror(['.11111', '112222', '122444', '122444', '122444', '122222', '112222', '.11111', '..1..1']),
  ['#90a0b0', '#506070', '#ffa040', '#202830', '#fff', '#fff'], ['#90a0b0', '#ffa040']);
defSprite('b05core', mirror(['....111', '..11222', '.112333', '.123336', '1123366', '1233666', '1123366', '.123336', '.112333', '..11222', '....111']),
  ['#ffa040', '#ff6020', '#ffe060', '#602010', '#fff', '#ffffff'], ['#ffa040', '#ffe060']);
defSprite('b15core', mirror(['..........1', '.........11', '........112', '.......1122', '......11222', '.....112223', '....1122233', '...11222336', '..112223366', '.1122233666', '11222336666', '.1122233666', '..112223366', '...11222336', '....1122233', '.....112223', '......11222', '.......1122', '........112', '.........11', '..........1']),
  ['#ff20c0', '#8010a0', '#40ffe0', '#300840', '#fff', '#ffffff'], ['#ff20c0', '#40ffe0'], { hit: 0.7 });
defSprite('b15wing', ['1....................', '11...................', '111..................', '1111.................', '11221................', '112221...............', '1122221..............', '11222221.............', '112222221............', '1122222221...........', '11222222221..........', '.1122222222111.......', '..112222222222111....', '...1112222222222211..', '....11111111111111111'],
  ['#ff20c0', '#8010a0', '#40ffe0', '#300840', '#fff', '#ffffff'], ['#ff20c0', '#40ffe0'], { hit: 0.6 });
defSprite('b15tent', mirror(['...11', '.1122', '.1222', '12223', '12233', '12223', '.1222', '.1122', '...11']),
  ['#ff20c0', '#8010a0', '#40ffe0', '#300840', '#fff', '#ffffff'], ['#ff20c0', '#40ffe0']);
defSprite('b25body', mirror(['...........1', '..........11', '.........112', '........1122', '......111222', '....11112222', '..1111122222', '.11111222266', '111112222266', '111112222222', '111112222266', '.11111222266', '..1111122222', '....11112222', '......111222', '........1122', '.........112', '..........11', '...........1']),
  ['#40ffd0', '#108070', '#ffd040', '#083830', '#fff', '#ff4060'], ['#40ffd0', '#ffd040'], { hit: 0.75 });
defSprite('b25pod', mirror(['....1', '...11', '..112', '.1122', '.1226', '11226', '.1226', '.1122', '..112', '...11', '....1']),
  ['#40ffd0', '#108070', '#ffd040', '#083830', '#fff', '#ff4060'], ['#40ffd0', '#ffd040']);
defSprite('bxxbody', mirror(['1111111111', '1222222222', '1244444444', '1244444444', '1244466444', '1244444444', '1244666666', '1244444444', '1222222222', '1233333333', '1222222222', '1222222222', '1222252222', '1222222222', '1222222222', '1222222222', '1222222222', '1111111111', '11........']),
  ['#80ffff', '#203040', '#ff40ff', '#101820', '#fff', '#ffffff'], ['#80ffff', '#ff40ff'], { hit: 0.9 });

// bosses keep their original size now that regular sprites no longer grow per era
const BOSS_COMP = [1, 1, 1.2, 1.2, 1.2, 1.28, 1.28, 1.28];
class Boss {
  constructor(g, def) {
    this.g = g; this.def = def; this.name = def.name; this.x = W / 2; this.y = -90; this.t = 0; this.phase = 0;
    this.dead = false; this.dying = 0; this.intro = true; this.parts = []; this.tierOverride = null; this.d = {}; this.fireT = 1.5;
    this.color = def.color || '#ff8040'; this.startTime = g.time; this.introY = def.introY || 80; this.rot = 0; this.scale = 1; this.hitFlash = 0;
    this.lastHitT = 0;
    def.init(this, g);
  }
  addPart(o) {
    const p = Object.assign({ ox: 0, oy: 0, hp: 10, scale: 1, alive: true, core: false, rot: 0, flash: 0, sx: 1, sy: 1, value: 500, alpha: 1 }, o);
    p.scale *= BOSS_COMP[this.g.era] || 1;
    p.maxHp = p.hp; const q = spriteRadii(p.sprite, this.g.tier, p.scale * 1.05); p.rx = o.r || q.rx; p.ry = o.r || q.ry; p.r = Math.max(p.rx, p.ry);
    this.parts.push(p); return p;
  }
  partPos(p) { if (this.def.partPos) { const q = this.def.partPos(this, p); if (q) return q; } return { x: this.x + p.ox * this.scale, y: this.y + p.oy * this.scale }; }
  get core() { return this.parts.find(p => p.core); }
  get coreOpen() { return this.def.coreOpen ? this.def.coreOpen(this) : true; }
  get hpFrac() {
    let hp = 0, max = 0;
    for (const p of this.parts) { const w = p.core ? 2.5 : 1; hp += Math.max(0, p.hp) * w; max += p.maxHp * w; }
    return max ? hp / max : 0;
  }
  alivePartsNonCore() { return this.parts.filter(p => p.alive && !p.core); }
  update(dt) {
    const g = this.g;
    this.t += dt;
    for (const p of this.parts) if (p.flash > 0) p.flash -= dt;
    if (this.dying > 0) {
      this.dying -= dt; this.y += 6 * dt;
      if (this.dying <= 0) { this.dead = true; g.onBossDefeated(this); }
      return;
    }
    if (this.intro) {
      this.y = approach(this.y, this.introY, 55 * dt);
      if (Math.abs(this.y - this.introY) < 0.5) this.intro = false;
      if (this.def.introUpdate) this.def.introUpdate(this, g, dt);
      return;
    }
    this.def.update(this, g, dt);
  }
  // bullet collision: returns true if bullet consumed
  hitTest(b) {
    const g = this.g;
    const open = this.coreOpen;
    // test non-core parts first (those drawn in front), then core
    const order = this.parts.filter(p => p.alive && !p.core).concat(this.parts.filter(p => p.alive && p.core));
    for (const p of order) {
      if (p.vulnerable && !p.vulnerable(this, p)) continue;
      const q = this.partPos(p);
      if (hitEllipse(b.x - q.x, b.y - q.y, p.rx * this.scale, p.ry * this.scale, b.r)) {
        if (p.core && !open) { this.deflect(b, q); return true; }
        if (p.shielded) { this.deflect(b, q); return true; }
        this.damage(p, b.dmg * (this.def.damageMul ? this.def.damageMul(this, p) : 1));
        return true;
      }
    }
    // hull (non-part body): either passes damage to the core or blocks shots
    const d = this.def, hy = d.hullY || 0;
    const inHull = d.hullRx ? hitEllipse(b.x - this.x, b.y - (this.y + hy), d.hullRx * this.scale, d.hullRy * this.scale, b.r) : (d.hullR && dist(b.x, b.y, this.x, this.y) < d.hullR * this.scale);
    if (inHull) {
      if (d.hullDamage) { const c = this.core; if (c && c.alive) { this.damage(c, b.dmg * d.hullDamage(this)); return true; } }
      this.deflect(b, { x: b.x, y: b.y }); return true;
    }
    return false;
  }
  deflect(b, q) { this.g.audio.sfx('shieldHit'); this.g.fx.add({ kind: 'px', x: b.x, y: b.y, vx: rand(-30, 30), vy: 30, life: 0.15, color: '#80c0ff', s: 2 }); }
  damage(p, dmg) {
    const g = this.g;
    p.hp -= dmg; this.lastHitT = this.t;
    // brief white flash, rate-limited so sustained fire doesn't wash the boss out
    if (this.t - (p.lastFlashT || -1) > 0.3) { p.flash = 0.05; p.lastFlashT = this.t; }
    g.audio.sfx('bossHit');
    if (p.hp <= 0 && p.alive) {
      p.alive = false; const q = this.partPos(p);
      g.fx.explode(q.x, q.y, p.core ? 2.5 : 1.6, this.color); g.audio.sfx('explode', 1.5);
      g.addScore(p.value * (g.era + 1), q.x, q.y, { text: true });
      if (this.def.onPartDestroyed) this.def.onPartDestroyed(this, g, p);
      if (p.core) this.startDeath();
    }
  }
  collides(x, y, r) {
    for (const p of this.parts) { if (!p.alive) continue; const q = this.partPos(p); if (hitEllipse(x - q.x, y - q.y, p.rx * this.scale * 0.8, p.ry * this.scale * 0.8, r)) return true; }
    const d = this.def, hy = d.hullY || 0;
    if (d.hullRx && hitEllipse(x - this.x, y - (this.y + hy), d.hullRx * this.scale * 0.8, d.hullRy * this.scale * 0.8, r)) return true;
    if (d.hullR && dist(x, y, this.x, this.y) < d.hullR * this.scale * 0.8 + r) return true;
    return false;
  }
  startDeath() {
    const g = this.g;
    this.dying = 2.6; for (const p of this.parts) p.alive = p.alive && p.core;
    g.fx.bigExplosion(this.x, this.y, this.color, 2.4); g.audio.sfx('bigExplode'); g.fx.shake(10); g.fx.flash('#fff', 0.6);
    g.onBossDying(this);
  }
  drawPart(ctx, p, T) {
    if (!p.alive) return;
    const q = this.partPos(p);
    drawSprite(ctx, p.sprite, q.x, q.y, { tier: T, rs: this.g.rs, scale: p.scale * this.scale, rot: p.rot, variant: p.flash > 0 ? 'flash' : 'n', sx: p.sx, sy: p.sy, alpha: p.alpha });
  }
  draw(ctx) {
    const T = this.tierOverride === null ? this.g.tier : this.tierOverride;
    if (this.dying > 0) { ctx.globalAlpha = clamp(this.dying / 2.6, 0, 1) * (Math.floor(this.t * 20) % 2 ? 1 : 0.6); }
    if (this.def.draw) this.def.draw(this, this.g, ctx, T);
    else for (const p of this.parts) this.drawPart(ctx, p, T);
    ctx.globalAlpha = 1;
  }
}

// ---------------- boss definitions ----------------
const BOSS_DEFS = [
  // ===== 1983: MOTHER BRAIN =====
  {
    name: 'MOTHER BRAIN', color: '#ff40a0', introY: 86,
    init(b, g) {
      b.addPart({ sprite: 'b83core', core: true, hp: 36 * g.loopMul, scale: 2.2, value: 5000 });
      const claws = [[-42, -8], [42, -8], [-34, 26], [34, 26]];
      claws.forEach(([ox, oy], i) => b.addPart({ sprite: 'b83claw', ox, oy, hp: 7 * g.loopMul, scale: 1.8, value: 800, name: 'claw', sx: ox < 0 ? 1 : -1, baseX: ox, baseY: oy }));
      b.d.lungeT = 4; b.d.ringT = 3;
    },
    coreOpen: b => b.alivePartsNonCore().length === 0,
    update(b, g, dt) {
      b.x = W / 2 + Math.sin(b.t * 0.5) * 55;
      b.y = b.introY + Math.sin(b.t * 0.9) * 6;
      const claws = b.alivePartsNonCore();
      b.fireT -= dt;
      if (b.fireT <= 0 && g.player.alive) {
        b.fireT = (claws.length ? 1.1 : 0.7) / g.loopMul;
        if (claws.length) { const c = pick(claws); const q = b.partPos(c); PAT.aimed(g, q.x, q.y + 8, g.E.enemyBulletSpeed, { color: '#ffe040', kind: 'dot' }); }
        else PAT.fan(g, b.x, b.y + 20, g.E.enemyBulletSpeed * 1.1, 3, 0.6, { color: '#ffe040', kind: 'dot' });
      }
      if (!claws.length) { b.d.ringT -= dt; if (b.d.ringT <= 0) { b.d.ringT = 3.2; PAT.ring(g, b.x, b.y, g.E.enemyBulletSpeed * 0.8, 10, b.t, { color: '#40ffe0', kind: 'dot', gapAt: Math.PI / 2, gapWidth: 0.5 }); } }
      // lunge
      b.d.lungeT -= dt;
      for (const c of b.parts) {
        if (c.core || !c.alive) continue;
        if (c.lunge !== undefined) {
          c.lunge += dt / 1.6;
          const k = Math.sin(Math.min(1, c.lunge) * Math.PI);
          c.oy = c.baseY + k * 90; c.ox = lerp(c.baseX, g.player.x - b.x, k * 0.6);
          if (c.lunge >= 1) { c.lunge = undefined; c.ox = c.baseX; c.oy = c.baseY; }
        }
      }
      if (b.d.lungeT <= 0 && claws.length) { b.d.lungeT = 4.5 / g.loopMul; pick(claws).lunge = 0; }
    }
  },
  // ===== 1988: DREADNOUGHT =====
  {
    name: 'DREADNOUGHT', color: '#ff6040', introY: 76, hullRx: 44, hullRy: 18, hullY: 8,
    // the whole hull is a target: hull hits damage the bridge at half strength while turrets live, full after
    hullDamage: b => b.alivePartsNonCore().length ? 0.5 : 1,
    init(b, g) {
      b.addPart({ sprite: 'b88bridge', core: true, ox: 0, oy: -6, hp: 30 * g.loopMul, scale: 1.8, value: 6000 });
      [[-38, 12], [0, 20], [38, 12]].forEach(([ox, oy], i) => b.addPart({ sprite: 'b88turret', ox, oy, hp: 6 * g.loopMul, scale: 1.6, value: 900, idx: i }));
      b.d.launchT = 5; b.d.ringT = 2; b.d.turn = 0;
    },
    coreOpen: b => b.alivePartsNonCore().length === 0,
    update(b, g, dt) {
      b.x = W / 2 + Math.sin(b.t * 0.4) * 60; b.y = b.introY + Math.sin(b.t * 0.7) * 4;
      const turrets = b.alivePartsNonCore();
      b.fireT -= dt;
      if (b.fireT <= 0 && g.player.alive) {
        b.fireT = (turrets.length ? 1.0 : 0.6) / g.loopMul;
        if (turrets.length) { const tr = turrets[b.d.turn++ % turrets.length]; const q = b.partPos(tr); PAT.fan(g, q.x, q.y + 6, g.E.enemyBulletSpeed, 3, 0.45, { color: '#ff4040', kind: 'pellet' }); }
        else { PAT.aimed(g, b.x, b.y + 4, g.E.enemyBulletSpeed * 1.3, { color: '#ffe040', kind: 'pellet' }); }
      }
      if (!turrets.length) { b.d.ringT -= dt; if (b.d.ringT <= 0) { b.d.ringT = 2.6; PAT.ring(g, b.x, b.y, g.E.enemyBulletSpeed * 0.85, 12, b.t * 2, { color: '#80ffff', kind: 'pellet', gapAt: angleTo(b.x, b.y, g.player.x, g.player.y) + rand(-1, 1), gapWidth: 0.45 }); } }
      b.d.launchT -= dt;
      if (b.d.launchT <= 0) {
        b.d.launchT = 6 / g.loopMul;
        for (const s of [-1, 1]) { const d = new Enemy(g, 'drone', { x: b.x + s * 24, y: b.y + 24 }); d.state = 'dive'; d.path = DIVES.zigzag(d, g); d.speed = 115; d.def = Object.assign({}, SPECIES.drone, { formation: false }); d.d.nextFire = 0.3; g.enemies.push(d); }
      }
    },
    draw(b, g, ctx, T) {
      drawSprite(ctx, 'b88hull', b.x, b.y + 8, { tier: T, rs: g.rs, scale: 2.4 * BOSS_COMP[1] });
      for (const p of b.parts) b.drawPart(ctx, p, T);
    }
  },
  // ===== 1992: OUROBOROS =====
  {
    name: 'OUROBOROS', color: '#50e050', introY: 60,
    init(b, g) {
      b.addPart({ sprite: 'b92head', core: true, hp: 48 * g.loopMul, scale: 1.9, value: 7000 });
      for (let i = 0; i < 9; i++) b.addPart({ sprite: 'b92seg', hp: 5 * g.loopMul, scale: 1.6, value: 400, seg: i + 1 });
      b.addPart({ sprite: 'b92tail', hp: 5 * g.loopMul, scale: 1.6, value: 400, seg: 10 });
      b.d.hist = []; b.d.path = new Path([{ x: W / 2, y: -40 }, { x: 40, y: 60 }, { x: 200, y: 150 }, { x: 60, y: 200 }, { x: 220, y: 70 }, { x: 130, y: 40 }, { x: 30, y: 140 }, { x: 150, y: 220 }, { x: 240, y: 120 }, { x: W / 2, y: -40 }], 200);
      b.d.pd = 0; b.d.segT = 0; b.introY = -40;
    },
    partPos(b, p) {
      if (p.core) return null;
      const spacing = 12 * b.scale;
      const idx = Math.round(p.seg * spacing / 2);
      const h = b.d.hist; const i = Math.min(h.length - 1, idx);
      if (i < 0) return { x: b.x, y: b.y - p.seg * spacing };
      return h[i];
    },
    damageMul: (b, p) => (p.core && b.alivePartsNonCore().length <= 3) ? 2 : 1,
    update(b, g, dt) {
      const sp = 95 + (g.loopMul - 1) * 30;
      b.d.pd += sp * dt; if (b.d.pd >= b.d.path.len) b.d.pd -= b.d.path.len;
      const p = b.d.path.at(b.d.pd);
      const dx = p.x - b.x, dy = p.y - b.y;
      if (dx || dy) b.core.rot = Math.atan2(dy, dx) + Math.PI / 2;
      b.x = p.x; b.y = p.y;
      b.d.hist.unshift({ x: b.x, y: b.y }); if (b.d.hist.length > 140) b.d.hist.length = 140;
      for (const q of b.parts) if (!q.core) { const pos = b.partPos(q); const nxt = b.d.hist[Math.max(0, Math.round(q.seg * 12 * b.scale / 2) - 2)]; if (nxt) q.rot = Math.atan2(nxt.y - pos.y, nxt.x - pos.x) + Math.PI / 2; }
      b.fireT -= dt;
      if (b.fireT <= 0 && g.player.alive && b.y > 0) { b.fireT = 1.4 / g.loopMul; for (let i = 0; i < 3; i++) setTimeout(() => { if (!b.dead && b.dying <= 0) PAT.aimed(g, b.x, b.y, g.E.enemyBulletSpeed * 1.2, { color: '#ffe040', kind: 'pellet' }); }, i * 110); }
      b.d.segT -= dt;
      if (b.d.segT <= 0 && g.player.alive) { b.d.segT = 0.9 / g.loopMul; const segs = b.alivePartsNonCore(); if (segs.length) { const s = pick(segs); const q = b.partPos(s); if (q.y > 0 && q.y < H - 80) PAT.aimed(g, q.x, q.y, g.E.enemyBulletSpeed, { color: '#50e050', kind: 'pellet' }); } }
    },
    draw(b, g, ctx, T) {
      const order = b.parts.slice().sort((p, q) => (q.seg || 0) - (p.seg || 0));
      for (const p of order) b.drawPart(ctx, p, T);
    }
  },
  // ===== 1997: ORBITAL CITADEL =====
  {
    name: 'ORBITAL CITADEL', color: '#ff8040', introY: 96,
    init(b, g) {
      b.addPart({ sprite: 'b97core', core: true, hp: 52 * g.loopMul, scale: 2.0, value: 8000 });
      for (let i = 0; i < 6; i++) b.addPart({ sprite: 'b97pod', hp: 8 * g.loopMul, scale: 1.5, value: 700, idx: i });
      b.d.rot = 0; b.d.sweep = -1; b.d.sweepT = 4; b.d.podT = 0;
    },
    partPos(b, p) {
      if (p.core) return null;
      const a = b.d.rot + p.idx * TAU / 6, R = 58 * b.scale;
      return { x: b.x + Math.cos(a) * R, y: b.y + Math.sin(a) * R * 0.35, depth: Math.sin(a) };
    },
    coreOpen: b => b.alivePartsNonCore().length <= 1,
    update(b, g, dt) {
      b.d.rot += dt * 0.9;
      b.scale = 0.85 + 0.2 * Math.sin(b.t * 0.45);   // toward / away from camera
      b.x = W / 2 + Math.sin(b.t * 0.3) * 30;
      b.core.rot = b.t * 0.5;
      for (const p of b.parts) if (!p.core) { const q = b.partPos(p); const dep = q.depth; p.sx = 0.6 + 0.4 * (dep * 0.5 + 0.5); p.alpha = 0.55 + 0.45 * (dep * 0.5 + 0.5); p.vulnerable = () => b.partPos(p).depth > 0; }
      b.d.podT -= dt;
      if (b.d.podT <= 0 && g.player.alive) {
        b.d.podT = 1.1 / g.loopMul;
        const front = b.alivePartsNonCore().filter(p => b.partPos(p).depth > 0.2);
        if (front.length) { const p = pick(front); const q = b.partPos(p); PAT.aimed(g, q.x, q.y, g.E.enemyBulletSpeed * 1.1, { color: '#ff8040', kind: 'poly' }); }
      }
      if (b.coreOpen) {
        b.d.sweepT -= dt;
        if (b.d.sweep < 0 && b.d.sweepT <= 0) { b.d.sweep = 0; b.d.sweepDir = Math.random() < 0.5 ? 1 : -1; b.d.sweepT = 3.5; b.d.st = 0; }
        if (b.d.sweep >= 0) {
          b.d.st -= dt;
          if (b.d.st <= 0) { b.d.st = 0.06; const a = Math.PI / 2 + b.d.sweepDir * (b.d.sweep - 0.5) * 2.2; const sp = g.E.enemyBulletSpeed * 1.6; g.spawnEBullet(b.x, b.y, Math.cos(a) * sp, Math.sin(a) * sp, { color: '#ff2020', kind: 'poly' }); b.d.sweep += 0.035; if (b.d.sweep >= 1) b.d.sweep = -1; }
        }
        b.fireT -= dt; if (b.fireT <= 0) { b.fireT = 2.2; PAT.ring(g, b.x, b.y, g.E.enemyBulletSpeed * 0.8, 12, b.t, { color: '#ffe040', kind: 'poly', gapAt: Math.PI / 2 + rand(-0.8, 0.8), gapWidth: 0.5 }); }
      }
    },
    draw(b, g, ctx, T) {
      const back = b.parts.filter(p => !p.core && p.alive && b.partPos(p).depth <= 0), front = b.parts.filter(p => !p.core && p.alive && b.partPos(p).depth > 0);
      for (const p of back) b.drawPart(ctx, p, T);
      ctx.save(); ctx.strokeStyle = 'rgba(200,200,255,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(b.x, b.y, 58 * b.scale, 58 * b.scale * 0.35, 0, 0, TAU); ctx.stroke(); ctx.restore();
      b.drawPart(ctx, b.core, T);
      if (!b.coreOpen) { ctx.save(); ctx.strokeStyle = 'rgba(120,200,255,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(b.x, b.y, b.core.r * b.scale + 4, 0, TAU); ctx.stroke(); ctx.restore(); }
      for (const p of front) b.drawPart(ctx, p, T);
    }
  },
  // ===== 2005: LEVIATHAN CARRIER =====
  {
    name: 'LEVIATHAN CARRIER', color: '#ff6030', introY: 82, hullRx: 58, hullRy: 24, hullY: 2,
    // hull hits reach the core at half strength while hangar sections live, full once they are gone
    hullDamage: b => b.alivePartsNonCore().filter(p => !p.cannon).length ? 0.5 : 1,
    init(b, g) {
      b.addPart({ sprite: 'b05core', core: true, ox: 0, oy: 8, hp: 50 * g.loopMul, scale: 1.7, value: 9000 });
      [[-27, -4], [27, -4], [-15, 14], [15, 14]].forEach(([ox, oy], i) => b.addPart({ sprite: 'b05section', ox, oy, hp: 9 * g.loopMul, scale: 1.5, value: 1000, idx: i, spawnT: 2 + i * 1.3, burning: false }));
      [[-52, 10], [52, 10]].forEach(([ox, oy]) => b.addPart({ sprite: 'b88turret', ox, oy, hp: 8 * g.loopMul, scale: 1.7, value: 1200, cannon: true }));
      b.d.wallT = 5;
    },
    coreOpen: b => b.alivePartsNonCore().filter(p => !p.cannon).length === 0,
    onPartDestroyed(b, g, p) { if (!p.cannon && !p.core) { p.burning = true; g.fx.shake(8); } },
    update(b, g, dt) {
      b.x = W / 2 + Math.sin(b.t * 0.35) * 45; b.y = b.introY + Math.sin(b.t * 0.6) * 5;
      for (const p of b.parts) {
        if (p.core) continue;
        const q = b.partPos(p);
        if (p.burning && Math.random() < dt * 25) g.fx.add({ kind: 'ember', x: q.x + rand(-8, 8), y: q.y + rand(-6, 6), vx: rand(-10, 10), vy: rand(-40, -10), life: rand(0.3, 0.8), color: pick(['#ff6030', '#ffc040']), s: rand(2, 4) });
        if (p.burning && Math.random() < dt * 6) g.fx.add({ kind: 'smoke', x: q.x, y: q.y, vx: rand(-5, 5), vy: -15, life: 1, color: '#333', s: 5 });
        if (!p.alive) continue;
        if (!p.cannon) {
          p.spawnT -= dt;
          if (p.spawnT <= 0 && g.player.alive) { p.spawnT = 5 / g.loopMul; const k = new Enemy(g, 'kamikaze', { x: q.x, y: q.y }); k.x = q.x; k.y = q.y; k.d.wait = 0.6; g.enemies.push(k); g.fx.explode(q.x, q.y + 6, 0.4, '#60e0ff'); }
        } else {
          p.ft = (p.ft || rand(0.5, 1.5)) - dt;
          if (p.ft <= 0 && g.player.alive) { p.ft = 1.7 / g.loopMul; PAT.fan(g, q.x, q.y + 8, g.E.enemyBulletSpeed, 4, 0.5, { color: '#ff4080', kind: 'trail' }); }
        }
      }
      if (b.coreOpen) {
        b.fireT -= dt;
        if (b.fireT <= 0 && g.player.alive) { b.fireT = 0.9 / g.loopMul; PAT.fan(g, b.x, b.y + 20, g.E.enemyBulletSpeed * 1.2, 5, 0.7, { color: '#ffe060', kind: 'trail' }); }
        b.d.wallT -= dt;
        if (b.d.wallT <= 0) { b.d.wallT = 4.5; PAT.wall(g, b.y + 30, g.player.x + rand(-40, 40), 22, g.E.enemyBulletSpeed * 0.8, { color: '#ff6030', kind: 'trail' }); }
      }
    },
    draw(b, g, ctx, T) {
      drawSprite(ctx, 'b05hull', b.x, b.y, { tier: T, rs: g.rs, scale: 2.5 * BOSS_COMP[4] });
      if (b.coreOpen) { ctx.save(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(b.x - 30, b.y - 10); ctx.lineTo(b.x - 10, b.y + 2); ctx.lineTo(b.x + 14, b.y - 6); ctx.lineTo(b.x + 32, b.y + 8); ctx.stroke(); ctx.restore(); }
      for (const p of b.parts) if (!p.core) b.drawPart(ctx, p, T);
      b.drawPart(ctx, b.core, T);
    }
  },
  // ===== 2015: HIVE EMPRESS =====
  {
    name: 'HIVE EMPRESS', color: '#ff20c0', introY: 92,
    init(b, g) {
      b.addPart({ sprite: 'b15core', core: true, hp: 85 * g.loopMul, scale: 2.0, value: 12000 });
      b.addPart({ sprite: 'b15wing', ox: -62, oy: -14, hp: 24 * g.loopMul, scale: 2.2, value: 2000, wing: -1, sx: 1 });
      b.addPart({ sprite: 'b15wing', ox: 62, oy: -14, hp: 24 * g.loopMul, scale: 2.2, value: 2000, wing: 1, sx: -1 });
      for (let t = 0; t < 6; t++) for (let s = 0; s < 4; s++) b.addPart({ sprite: 'b15tent', hp: 4 * g.loopMul, scale: 1.4 - s * 0.15, value: 300, tent: t, seg: s });
      b.d.spA = 0; b.d.spT = 0; b.d.ringT = 2.5; b.d.wallT = 7; b.d.tipT = 1.5; b.d.spBurst = 0; b.d.spRest = 1.0;
    },
    partPos(b, p) {
      if (p.tent === undefined) return null;
      const baseA = Math.PI * 0.15 + (p.tent / 5) * Math.PI * 0.7;
      const sway = Math.sin(b.t * 1.6 + p.tent) * 0.35;
      let x = b.x + Math.cos(baseA) * 26, y = b.y + Math.sin(baseA) * 26;
      for (let s = 0; s <= p.seg; s++) { const a = baseA + sway * (s + 1) * 0.6 + Math.sin(b.t * 2.2 + s + p.tent) * 0.25; x += Math.cos(a) * 16; y += Math.sin(a) * 16; }
      return { x, y };
    },
    damageMul: (b, p) => (p.core && b.parts.some(q => q.wing && q.alive)) ? 0.5 : 1,
    update(b, g, dt) {
      b.x = W / 2 + Math.sin(b.t * 0.25) * 25; b.y = b.introY + Math.sin(b.t * 0.5) * 8;
      const frac = b.core.hp / b.core.maxHp, ph = frac < 0.3 ? 2 : frac < 0.6 ? 1 : 0;
      b.phase = ph;
      for (const p of b.parts) if (p.wing) p.sy = 1 + Math.sin(b.t * 1.2) * 0.08;
      const sp = g.E.enemyBulletSpeed;
      // spiral arms from core: 1.5 s bursts with a rest between them
      if (b.d.spRest > 0) b.d.spRest -= dt;
      else {
        b.d.spBurst += dt;
        if (b.d.spBurst > 1.5) { b.d.spBurst = 0; b.d.spRest = ph === 2 ? 1.2 : 1.8; }
        b.d.spT -= dt;
        if (b.d.spT <= 0 && g.player.alive) {
          b.d.spT = (ph === 2 ? 0.15 : 0.2) / Math.min(1.4, g.loopMul); b.d.spA += 0.42;
          const arms = ph === 2 ? 3 : 2;
          for (let k = 0; k < arms; k++) { const a = b.d.spA + k * TAU / arms; g.spawnEBullet(b.x, b.y + 10, Math.cos(a) * sp * 0.55, Math.sin(a) * sp * 0.55, { color: '#ff40c0', kind: 'neon' }); }
        }
      }
      b.d.tipT -= dt;
      if (b.d.tipT <= 0 && g.player.alive) {
        b.d.tipT = (2.4 - ph * 0.4) / g.loopMul;
        const tips = b.parts.filter(p => p.alive && p.seg === 3);
        if (tips.length) { const p = pick(tips); const q = b.partPos(p); PAT.fan(g, q.x, q.y, sp * 0.9, 3, 0.5, { color: '#40ffe0', kind: 'neon' }); }
      }
      b.d.ringT -= dt;
      if (b.d.ringT <= 0 && g.player.alive) { b.d.ringT = (3.8 - ph * 0.6) / g.loopMul; PAT.ring(g, b.x, b.y, sp * 0.7, 12 + ph * 3, b.t, { color: '#ffffff', kind: 'neon', gapAt: angleTo(b.x, b.y, g.player.x, g.player.y) + rand(-0.7, 0.7), gapWidth: 0.42 }); }
      if (ph >= 1) { b.d.wallT -= dt; if (b.d.wallT <= 0) { b.d.wallT = 6.5; PAT.wall(g, b.y + 40, g.player.x + rand(-30, 30), 20, sp * 0.7, { color: '#ff20c0', kind: 'neon' }); } }
    },
    draw(b, g, ctx, T) {
      for (const p of b.parts) if (p.tent !== undefined) b.drawPart(ctx, p, T);
      for (const p of b.parts) if (p.wing) b.drawPart(ctx, p, T);
      b.drawPart(ctx, b.core, T);
    }
  },
  // ===== 2025: THE ADAPTER =====
  {
    name: 'THE ADAPTER', color: '#40ffd0', introY: 84,
    init(b, g) {
      b.addPart({ sprite: 'b25body', core: true, hp: 115 * g.loopMul, scale: 2.1, value: 15000 });
      b.addPart({ sprite: 'b25pod', ox: -48, oy: 10, hp: 16 * g.loopMul, scale: 1.6, value: 1500, pod: true, regenT: 0 });
      b.addPart({ sprite: 'b25pod', ox: 48, oy: 10, hp: 16 * g.loopMul, scale: 1.6, value: 1500, pod: true, regenT: 0 });
      b.d.mode = 'SCAN'; b.d.evalT = 3; b.d.modeT = 0; b.d.tiers = [1, 2, 3, 4, 5, 6, 0]; b.d.ti = 0; b.d.snap = null; b.d.shieldT = 0; b.d.a = 0;
      b.tierOverride = 6;
    },
    coreOpen: b => b.d.shieldT <= 0,
    update(b, g, dt) {
      b.x = W / 2 + Math.sin(b.t * 0.4) * 50; b.y = b.introY + Math.sin(b.t * 0.8) * 6;
      const sp = g.E.enemyBulletSpeed, P = g.player;
      for (const p of b.parts) if (p.pod && !p.alive) { p.regenT += dt; if (p.regenT > 14) { p.regenT = 0; p.alive = true; p.hp = p.maxHp; g.fx.explode(b.partPos(p).x, b.partPos(p).y, 0.8, '#40ffd0'); } }
      if (b.d.shieldT > 0) b.d.shieldT -= dt;
      b.d.evalT -= dt;
      if (b.d.evalT <= 0) {
        b.d.evalT = 7;
        const s = b.d.snap, n = { still: P.stationaryT, left: P.leftTime, right: P.rightTime, shots: P.shotsFired, t: g.time };
        let mode = 'PREDICT';
        if (s) {
          const dtT = n.t - s.t, shots = (n.shots - s.shots) / dtT, edge = ((n.left - s.left) + (n.right - s.right)) / dtT;
          if (P.stationaryT > 1.5) mode = 'LOCK';
          else if (edge > 0.6) mode = 'PURGE';
          else if (shots > 6) mode = 'REFLECT';
        }
        b.d.snap = n; b.d.mode = mode; b.d.modeT = 0;
        b.tierOverride = b.d.tiers[b.d.ti++ % b.d.tiers.length];
        g.fx.explode(b.x, b.y, 1.2, '#ffffff'); g.audio.sfx('glitch'); g.fx.flash('#40ffd0', 0.25);
        g.fx.text(b.x, b.y - 50, { LOCK: 'TARGET LOCKED', PURGE: 'EDGE PURGE', REFLECT: 'REFLECTOR UP', PREDICT: 'PREDICTING' }[mode], { color: '#40ffd0', size: 1.1, life: 1.4 });
        if (mode === 'REFLECT') b.d.shieldT = 3.5;
      }
      b.d.modeT += dt; b.fireT -= dt;
      if (!g.player.alive || b.fireT > 0) return;
      const o = { color: '#40ffd0', kind: g.E.bullet };
      switch (b.d.mode) {
        case 'LOCK': b.fireT = 0.28 / g.loopMul; PAT.aimed(g, b.x, b.y + 16, sp * 1.4, o); if (Math.random() < 0.3) PAT.aimed(g, b.x, b.y + 16, sp * 0.8, Object.assign({}, o, { homing: 2.5, color: '#ff4060' })); break;
        case 'PURGE': b.fireT = 1.3 / g.loopMul; PAT.wall(g, b.y + 30, W / 2 + rand(-30, 30), 24, sp * 0.8, o); for (const p of b.parts) if (p.pod && p.alive) { const q = b.partPos(p); PAT.fan(g, q.x, q.y, sp, 3, 0.6, o); } break;
        case 'REFLECT': b.fireT = 1.1 / g.loopMul; PAT.ring(g, b.x, b.y, sp * 0.75, 14, b.d.a += 0.4, Object.assign({}, o, { color: '#ffd040', gapAt: Math.PI / 2 + rand(-1, 1), gapWidth: 0.4 })); break;
        default: { b.fireT = 0.7 / g.loopMul; const px = clamp(P.x + P.dir * g.E.playerSpeed * 0.45, 10, W - 10); const a = angleTo(b.x, b.y, px, P.y); for (const off of [-0.25, 0, 0.25]) g.spawnEBullet(b.x, b.y + 16, Math.cos(a + off) * sp * 1.2, Math.sin(a + off) * sp * 1.2, o); }
      }
    },
    draw(b, g, ctx, T) {
      for (const p of b.parts) b.drawPart(ctx, p, T);
      if (b.d.shieldT > 0) { ctx.save(); ctx.strokeStyle = '#ffd040'; ctx.lineWidth = 2; ctx.globalAlpha = 0.5 + 0.4 * Math.sin(b.t * 20); ctx.shadowBlur = 12; ctx.shadowColor = '#ffd040'; ctx.beginPath(); ctx.arc(b.x, b.y, b.core.r * b.scale + 6, 0, TAU); ctx.stroke(); ctx.restore(); }
    }
  },
  // ===== 20XX: THE CABINET =====
  {
    name: 'THE CABINET', color: '#80ffff', introY: 90,
    init(b, g) {
      b.addPart({ sprite: 'bxxbody', core: true, hp: 520 * g.loopMul, scale: 2.2, value: 25000 });
      for (let i = 0; i < 4; i++) b.addPart({ sprite: 'b97pod', hp: 10 * g.loopMul, scale: 1.4, value: 800, orb: i, alive: false });
      b.d.phase = -1; b.d.phases = [0, 2, 3, 5, 7]; b.d.a = 0; b.d.tp = 3; b.d.spT = 0; b.d.droneT = 1; b.d.chainT = 0; b.d.flipT = 2.0; b.d.ringT = 2; b.d.wallT = 3; b.d.sweep = -1; b.d.sweepT = 2.5; b.d.desperate = false; b.d.spBurst = 0; b.d.spRest = 0;
      b.tierOverride = 0;
    },
    partPos(b, p) { if (p.orb === undefined) return null; const a = b.t * 1.4 + p.orb * TAU / 4; return { x: b.x + Math.cos(a) * 50, y: b.y + Math.sin(a) * 22 + 8 }; },
    damageMul: (b, p) => (p.core && b.d.phase === 2 && b.parts.some(q => q.orb !== undefined && q.alive)) ? 0.6 : 1,
    update(b, g, dt) {
      const frac = b.core.hp / b.core.maxHp;
      const ph = frac > 0.8 ? 0 : frac > 0.6 ? 1 : frac > 0.4 ? 2 : frac > 0.2 ? 3 : 4;
      if (ph !== b.d.phase) {
        b.d.phase = ph; b.tierOverride = b.d.phases[ph];
        g.audio.sfx('glitch'); g.fx.flash('#ffffff', 0.5); g.fx.explode(b.x, b.y, 1.5, '#ff40ff');
        g.fx.text(b.x, b.y - 60, ['SYSTEM-83', 'SYSTEM-92', 'SYSTEM-97', 'SYSTEM-15', 'SYSTEM-??'][ph], { color: '#80ffff', size: 1.2, life: 1.5 });
        if (ph === 2) for (const p of b.parts) if (p.orb !== undefined) { p.alive = true; p.hp = p.maxHp; }
      }
      const sp = g.E.enemyBulletSpeed, P = g.player;
      // near death: the cabinet loses signal, phases in and out, invulnerable and silent for a few seconds
      if (!b.d.glitched && b.core.hp <= 30) {
        b.d.glitched = true; b.d.glitchT = 3.5; b.core.shielded = true;
        for (const eb of g.ebullets) eb.dead = true;                       // nothing in the air during the breather
        for (const e of g.enemies) if (!e.dead && e.sp === 'drone') { e.dead = true; g.fx.explode(e.x, e.y, 0.6, '#80ffff'); }
        g.audio.sfx('glitch'); g.fx.flash('#80ffff', 0.3);
        g.fx.text(b.x, b.y - 60, 'SIGNAL LOST', { color: '#ff40ff', size: 1.2, life: 2 });
      }
      if (b.d.glitchT > 0) {
        b.d.glitchT -= dt;
        b.core.alpha = (Math.sin(b.t * 28) > 0 ? 0.85 : 0.15) * (Math.random() < 0.1 ? 0.3 : 1);
        b.d.gtp = (b.d.gtp || 0) - dt;
        if (b.d.gtp <= 0) { b.d.gtp = 0.45; g.fx.explode(b.x, b.y, 0.6, '#80ffff'); b.x = rand(60, W - 60); b.y = rand(60, 130); g.audio.sfx('glitch'); }
        if (b.d.glitchT <= 0) { b.core.shielded = false; b.core.alpha = 1; b.d.desperate = true; g.fx.text(b.x, b.y - 60, 'SIGNAL RESTORED', { color: '#80ffff', size: 1, life: 1.5 }); }
        return;
      }
      if (ph === 4) { b.d.tp -= dt; if (b.d.tp <= 0) { b.d.tp = 1.8; g.fx.explode(b.x, b.y, 1, '#80ffff'); b.x = rand(60, W - 60); b.y = rand(60, 130); g.fx.explode(b.x, b.y, 1, '#ff40ff'); g.audio.sfx('glitch'); } }
      else { b.x = W / 2 + Math.sin(b.t * 0.45) * 60; b.y = b.introY + Math.sin(b.t * 0.7) * 6; }
      b.fireT -= dt;
      if (!P.alive) return;
      switch (ph) {
        case 0: // 1983 style: dots + drone dives
          if (b.fireT <= 0) { b.fireT = 0.75 / g.loopMul; PAT.fan(g, b.x, b.y + 20, sp, 3, 0.5, { color: '#ffffff', kind: 'dot' }); }
          b.d.droneT -= dt; if (b.d.droneT <= 0) { b.d.droneT = 2.4; for (const sx of [-1, 1]) { const d = new Enemy(g, 'drone', { x: b.x + sx * 16, y: b.y + 20 }); d.state = 'dive'; d.path = DIVES.zigzag(d, g); d.speed = 125; d.def = Object.assign({}, SPECIES.drone, { formation: false }); d.d.nextFire = 0.3; g.enemies.push(d); } }
          break;
        case 1: // 1992 style: serpent chain bullets
          b.d.chainT -= dt;
          if (b.d.chainT <= 0) { b.d.chainT = 0.1; b.d.a += 0.3; const a = Math.PI / 2 + Math.sin(b.d.a) * 0.9; g.spawnEBullet(b.x, b.y + 20, Math.cos(a) * sp, Math.sin(a) * sp, { color: '#50e050', kind: 'pellet' }); }
          if (b.fireT <= 0) { b.fireT = 1.1; PAT.aimed(g, b.x, b.y + 20, sp * 1.3, { color: '#ffe040', kind: 'pellet' }); }
          b.d.ringT -= dt; if (b.d.ringT <= 0) { b.d.ringT = 3.2; PAT.ring(g, b.x, b.y, sp * 0.8, 10, b.t, { color: '#50e050', kind: 'pellet', gapAt: angleTo(b.x, b.y, P.x, P.y) + rand(-0.8, 0.8), gapWidth: 0.5 }); }
          break;
        case 2: // 1997: orbiting pods
          if (b.fireT <= 0) { b.fireT = 0.6 / g.loopMul; const orbs = b.parts.filter(p => p.orb !== undefined && p.alive); if (orbs.length) { const q = b.partPos(pick(orbs)); PAT.aimed(g, q.x, q.y, sp * 1.2, { color: '#ff8040', kind: 'poly' }); } else PAT.ring(g, b.x, b.y, sp * 0.8, 12, b.t, { color: '#ff8040', kind: 'poly', gapAt: Math.PI / 2, gapWidth: 0.5 }); }
          // sweeping beam, as the 1997 citadel
          b.d.sweepT -= dt;
          if (b.d.sweep < 0 && b.d.sweepT <= 0) { b.d.sweep = 0; b.d.sweepDir = Math.random() < 0.5 ? 1 : -1; b.d.sweepT = 4.5; b.d.st = 0; }
          if (b.d.sweep >= 0) { b.d.st -= dt; if (b.d.st <= 0) { b.d.st = 0.07; const a = Math.PI / 2 + b.d.sweepDir * (b.d.sweep - 0.5) * 2.0; g.spawnEBullet(b.x, b.y + 10, Math.cos(a) * sp * 1.5, Math.sin(a) * sp * 1.5, { color: '#ff2020', kind: 'poly' }); b.d.sweep += 0.04; if (b.d.sweep >= 1) b.d.sweep = -1; } }
          break;
        case 3: // 2015: spirals
          if (b.d.spRest > 0) b.d.spRest -= dt;
          else {
            b.d.spBurst += dt; if (b.d.spBurst > 1.4) { b.d.spBurst = 0; b.d.spRest = 1.4; }
            b.d.spT -= dt;
            if (b.d.spT <= 0) { b.d.spT = 0.16; b.d.a += 0.5; for (let k = 0; k < 3; k++) { const a = b.d.a + k * TAU / 3; g.spawnEBullet(b.x, b.y, Math.cos(a) * sp * 0.6, Math.sin(a) * sp * 0.6, { color: '#ff20c0', kind: 'neon' }); } }
          }
          if (b.fireT <= 0) { b.fireT = 2.2; PAT.ring(g, b.x, b.y, sp * 0.8, 16, b.t, { color: '#ffffff', kind: 'neon', gapAt: angleTo(b.x, b.y, P.x, P.y) + rand(-0.6, 0.6), gapWidth: 0.4 }); }
          b.d.wallT -= dt; if (b.d.wallT <= 0) { b.d.wallT = 4.5; PAT.wall(g, b.y + 40, P.x + rand(-30, 30), 24, sp * 0.7, { color: '#ff20c0', kind: 'neon' }); }
          break;
        case 4: // 20XX: rule-breaking bullets
          if (b.fireT <= 0) { b.fireT = (b.d.desperate ? 0.5 : 0.65) / g.loopMul; for (let i = 0; i < (b.d.desperate ? 3 : 2); i++) { const a = rand(TAU); g.spawnEBullet(b.x, b.y, Math.cos(a) * sp * 0.9, Math.sin(a) * sp * 0.9, { color: i ? '#80ffff' : '#ff40ff', kind: 'holo', homing: 1.8, life: 3 }); } }
          if (b.d.desperate) { b.d.droneT -= dt; if (b.d.droneT <= 0) { b.d.droneT = 3; const d = new Enemy(g, 'glitch', {}); d.x = b.x; d.y = b.y + 30; g.enemies.push(d); } }
          // reverse-gravity wall: telegraphed by a flickering bar along the bottom edge for 0.7 s
          b.d.flipT -= dt;
          if (b.d.flipT <= 0.7 && !b.d.wallWarned) { b.d.wallWarned = true; g.audio.sfx('glitch'); g.fx.text(W / 2, H - 40, 'ERR: GRAVITY', { color: '#ff40ff', size: 1, life: 1.2, rise: 0 }); }
          if (b.d.flipT <= 0) { b.d.flipT = b.d.desperate ? 2.3 : 3.0; b.d.wallWarned = false; PAT.wall(g, H - 10, P.x, 34, -sp * 0.55, { color: '#ff40ff', kind: 'holo' }); }
          break;
      }
    },
    draw(b, g, ctx, T) {
      for (const p of b.parts) if (p.orb !== undefined) b.drawPart(ctx, p, T);
      if (b.d.phase === 4 && b.d.wallWarned && b.d.flipT > 0) {
        ctx.save(); ctx.globalAlpha = Math.floor(b.t * 16) % 2 ? 0.9 : 0.35; ctx.fillStyle = '#ff40ff';
        if (g.tier >= 4) { ctx.shadowBlur = 10; ctx.shadowColor = '#ff40ff'; }
        ctx.fillRect(0, H - 22, W, 3); ctx.restore();
      }
      if (b.d.phase === 4 && Math.random() < 0.3) {
        // rule breaking: sliced render
        for (let i = 0; i < 3; i++) { ctx.save(); const sy = b.y - 40 + i * 27; ctx.beginPath(); ctx.rect(0, sy, W, 27); ctx.clip(); b.drawPart(ctx, b.core, T); ctx.restore(); }
        return;
      }
      b.drawPart(ctx, b.core, T);
      // screen glow on the cabinet
      ctx.save(); ctx.globalAlpha = 0.25 + 0.15 * Math.sin(b.t * 8); ctx.fillStyle = ['#ff4040', '#50e050', '#ff8040', '#ff20c0', '#80ffff'][b.d.phase] || '#fff';
      ctx.fillRect(b.x - 24, b.y - 32, 48, 22); ctx.restore();
    }
  }
];

function makeBoss(g, era) { return new Boss(g, BOSS_DEFS[era]); }
