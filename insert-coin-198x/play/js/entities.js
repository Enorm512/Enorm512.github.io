// ---------------------------------------------------------------
// entities.js : Player, player bullets, enemy bullets, power-ups
// ---------------------------------------------------------------
'use strict';

const POWERUPS = {
  D: { name: 'DUAL CANNON', color: '#60c0ff', weapon: 'dual' },
  S: { name: 'SPREAD SHOT', color: '#ffe040', weapon: 'spread' },
  L: { name: 'LASER', color: '#ff40ff', weapon: 'laser' },
  M: { name: 'MISSILES', color: '#ff8040', addon: 'missile' },
  B: { name: 'SHIELD', color: '#40ffd0', addon: 'shield' },
  O: { name: 'DRONE', color: '#ffd040', addon: 'drone' },
  E: { name: 'EXTRA SHIP', color: '#ff4060', addon: 'life' },
  V: { name: 'OVERDRIVE +1', color: '#ffffff', addon: 'special' },
};
const WEAPON_TIME = 14, LASER_TIME = 9, MISSILE_TIME = 12, DRONE_TIME = 20;

class Player {
  constructor(g) { this.g = g; this.reset(); }
  reset() {
    this.x = W / 2; this.y = H - 30; this.alive = true; this.inv = 2.5; this.respawnT = 0; this.fireT = 0;
    this.weapon = null; this.weaponT = 0; this.weaponMax = 1; this.shield = false; this.drone = false; this.droneT = 0; this.missile = false; this.missileT = 0; this.missileFireT = 0;
    this.laserOn = false; this.laserSfxT = 0; this.dir = 0; this.engineT = 0; this.tilt = 0;
    this.stationaryT = 0; this.shotsFired = 0; this.leftTime = 0; this.rightTime = 0; this.grazeFlash = 0;
  }
  get r() { return 3.2; }
  get grazeRx() { return 12.5; }   // graze zone covers the whole ship plus a small margin
  get grazeRy() { return 13.5; }
  update(dt) {
    const g = this.g, inp = g.input, E = g.E;
    if (!this.alive) { this.respawnT -= dt; if (this.respawnT <= 0 && g.lives > 0) this.respawn(); return; }
    let dir = 0;
    if (inp.state.left) dir -= 1;
    if (inp.state.right) dir += 1;
    const speed = E.playerSpeed;
    if (inp.touchX !== null && dir === 0) {
      const d = inp.touchX - this.x;
      if (Math.abs(d) > 1.5) { this.x = approach(this.x, inp.touchX, speed * dt); dir = sign(d); }
    } else this.x += dir * speed * dt;
    this.x = clamp(this.x, 9, W - 9);
    this.dir = dir;
    this.tilt = approach(this.tilt, dir * 0.18, dt * 2);
    if (dir === 0) this.stationaryT += dt; else this.stationaryT = 0;
    if (this.x < W * 0.33) this.leftTime += dt; else if (this.x > W * 0.67) this.rightTime += dt;
    if (this.inv > 0) this.inv -= dt;
    if (this.grazeFlash > 0) this.grazeFlash -= dt;
    this.fireT -= dt; this.engineT += dt;
    this.laserOn = false;
    if (inp.state.fire) {
      if (this.weapon === 'laser') { this.laserOn = true; this.laserSfxT -= dt; if (this.laserSfxT <= 0) { this.laserSfxT = 0.09; g.audio.sfx('laser'); } }
      else this.tryFire();
    }
    if (this.weapon && (this.weaponT -= dt) <= 0) { this.weapon = null; g.fx.text(this.x, this.y - 20, 'WEAPON OFFLINE', { color: '#aaa', size: 0.8 }); }
    if (this.drone && (this.droneT -= dt) <= 0) this.drone = false;
    if (this.missile) {
      if ((this.missileT -= dt) <= 0) this.missile = false;
      this.missileFireT -= dt;
      if (this.missileFireT <= 0 && g.enemiesAlive() > 0) {
        this.missileFireT = 0.8;
        g.bullets.push(new Bullet(this.x - 7, this.y + 2, -40, -120, { kind: 'missile', dmg: 2, r: 3 }));
        g.bullets.push(new Bullet(this.x + 7, this.y + 2, 40, -120, { kind: 'missile', dmg: 2, r: 3 }));
      }
    }
    if (inp.pressed.special) g.useSpecial();
  }
  dronePos() { const a = this.engineT * 2.5; return { x: this.x + Math.cos(a) * 18, y: this.y - 4 + Math.sin(a) * 6 }; }
  tryFire() {
    const g = this.g, E = g.E;
    if (this.fireT > 0) return;
    let alive = 0; for (const b of g.bullets) if (b.kind === 'shot') alive++;
    if (alive >= E.shots) return;
    this.fireT = E.fireDelay * (this.weapon ? 0.92 : 1);
    const sp = E.bulletSpeed, y = this.y - 8;
    const shot = (x, y, vx, vy, o = {}) => g.bullets.push(new Bullet(x, y, vx, vy, Object.assign({ kind: 'shot' }, o)));
    if (this.weapon === 'dual') { shot(this.x - 4, y, 0, -sp); shot(this.x + 4, y, 0, -sp); }
    else if (this.weapon === 'spread') { for (const a of [-0.26, 0, 0.26]) shot(this.x, y, Math.sin(a) * sp, -Math.cos(a) * sp); }
    else shot(this.x, y, 0, -sp);
    if (this.drone) { const d = this.dronePos(); shot(d.x, d.y - 4, 0, -sp, { kind: 'option' }); }
    this.shotsFired++;
    g.audio.sfx('shoot');
  }
  applyPowerUp(type) {
    const g = this.g, P = POWERUPS[type];
    if (!P) return;
    if (P.weapon) { this.weapon = P.weapon; this.weaponMax = P.weapon === 'laser' ? LASER_TIME : WEAPON_TIME; this.weaponT = this.weaponMax; }
    else if (P.addon === 'missile') { this.missile = true; this.missileT = MISSILE_TIME; }
    else if (P.addon === 'shield') { this.shield = true; }
    else if (P.addon === 'drone') { this.drone = true; this.droneT = DRONE_TIME; }
    else if (P.addon === 'life') { g.addLife(); }
    else if (P.addon === 'special') { g.specials = Math.min(5, g.specials + 1); }
    g.fx.text(this.x, this.y - 22, P.name, { color: P.color, size: 0.9, life: 1.2 });
    g.audio.sfx('powerup'); g.rankUp(0.02);
  }
  hit() {
    const g = this.g;
    if (!this.alive || this.inv > 0) return false;
    if (this.shield) { this.shield = false; this.inv = 1.2; g.audio.sfx('shieldHit'); g.fx.explode(this.x, this.y, 1, '#40ffd0'); g.fx.text(this.x, this.y - 18, 'SHIELD LOST', { color: '#40ffd0', size: 0.8 }); return false; }
    this.die(); return true;
  }
  die() {
    const g = this.g;
    this.alive = false; this.respawnT = 1.8; this.laserOn = false;
    g.fx.explode(this.x, this.y, 2.2, '#ffffff'); g.fx.explode(this.x, this.y, 1.5, '#ff3040');
    g.fx.shake(6); g.fx.flash('#ffffff', 0.3);
    g.audio.sfx('playerDie');
    g.onPlayerDeath();
  }
  respawn() {
    const g = this.g;
    this.alive = true; this.inv = 2.6; this.x = W / 2; this.weapon = null; this.shield = false; this.drone = false; this.missile = false;
    g.audio.sfx('respawn');
    g.onPlayerRespawn();
  }
  draw(ctx) {
    const g = this.g, T = g.tier;
    if (!this.alive) return;
    if (this.inv > 0 && Math.floor(this.inv * 12) % 2 === 0 && this.inv < 2.4) ctx.globalAlpha = 0.35;
    // engine flame
    if (T >= 1) {
      const f = 0.6 + 0.4 * Math.sin(this.engineT * 40);
      const fl = T >= 4 ? 14 : 7;
      ctx.save();
      if (T >= 4) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.9; }
      for (const ox of [-4.5, 4.5]) {
        const sx = this.x + ox * SPRITE_SCALE[T] / 1.25, sy = this.y + 9 * SPRITE_SCALE[T] / 1.25;
        if (T <= 2 || T === 6) { ctx.fillStyle = '#40c8ff'; ctx.fillRect(Math.round(sx) - 1, Math.round(sy), 2, Math.round(fl * f)); ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(sx) - 1, Math.round(sy), 2, 2); }
        else { const gr = ctx.createLinearGradient(sx, sy, sx, sy + fl * f); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, '#40c8ff'); gr.addColorStop(1, 'rgba(64,200,255,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(sx - 2, sy); ctx.lineTo(sx + 2, sy); ctx.lineTo(sx, sy + fl * f); ctx.closePath(); ctx.fill(); }
      }
      ctx.restore();
    }
    const sx = T >= 3 ? Math.cos(this.tilt * 2.2) : 1;
    drawSprite(ctx, 'player', this.x, this.y, { tier: T, rs: g.rs, sx, rot: T >= 3 ? this.tilt * 0.4 : 0 });
    ctx.globalAlpha = 1;
    if (g.opts && g.opts.hitbox) {
      ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = '#80ffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(this.x, this.y, this.grazeRx, this.grazeRy, 0, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.9; ctx.fillStyle = '#ff2040'; ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, TAU); ctx.fill(); ctx.restore();
    }
    if (this.grazeFlash > 0) {
      ctx.save(); ctx.strokeStyle = '#80ffff'; ctx.lineWidth = 1.5; ctx.globalAlpha = Math.min(1, this.grazeFlash / 0.1);
      if (T >= 4) { ctx.shadowBlur = 8; ctx.shadowColor = '#80ffff'; }
      ctx.beginPath(); ctx.ellipse(this.x, this.y, this.grazeRx, this.grazeRy, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
    if (this.shield) {
      ctx.save(); ctx.strokeStyle = '#40ffd0'; ctx.lineWidth = T >= 3 ? 1.5 : 1; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(this.engineT * 10);
      if (T >= 4) { ctx.shadowBlur = 10; ctx.shadowColor = '#40ffd0'; }
      ctx.beginPath(); ctx.arc(this.x, this.y, 15, 0, TAU); ctx.stroke(); ctx.restore();
    }
    if (this.drone) { const d = this.dronePos(); drawSprite(ctx, 'option', d.x, d.y, { tier: T, rs: g.rs, rot: this.engineT * 4 }); }
    if (this.laserOn) {
      ctx.save();
      const w = T >= 4 ? 5 : 3;
      if (T >= 4) { ctx.shadowBlur = 16; ctx.shadowColor = '#ff40ff'; }
      ctx.fillStyle = T === 0 ? '#ffffff' : '#ff40ff'; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(this.engineT * 60);
      ctx.fillRect(this.x - w / 2, 0, w, this.y - 10);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(this.x - 1, 0, 2, this.y - 10);
      ctx.restore();
    }
  }
}

class Bullet {
  constructor(x, y, vx, vy, o = {}) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.dmg = o.dmg || 1; this.kind = o.kind || 'shot';
    this.r = o.r || 2.5; this.dead = false; this.age = 0; this.trailT = 0; this.pierce = o.pierce || 0; this.hits = 0;
  }
  update(dt, g) {
    this.age += dt;
    if (this.kind === 'missile') {
      let best = null, bd = 1e9;
      for (const e of g.enemies) { if (e.dead || e.y < -10) continue; const d = dist(this.x, this.y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
      if (g.boss && !g.boss.dead) { const d = dist(this.x, this.y, g.boss.x, g.boss.y); if (d < bd) { bd = d; best = g.boss; } }
      const sp = 170 + this.age * 120;
      let a = Math.atan2(this.vy, this.vx);
      if (best && this.age > 0.15) { const ta = angleTo(this.x, this.y, best.x, best.y); a += clamp(wrapAngle(ta - a), -5 * dt, 5 * dt); }
      this.vx = Math.cos(a) * sp; this.vy = Math.sin(a) * sp;
      this.trailT -= dt; if (this.trailT <= 0 && g.tier >= 2) { this.trailT = 0.03; g.fx.add({ kind: g.tier >= 4 ? 'smoke' : 'px', x: this.x, y: this.y, vx: 0, vy: 20, life: 0.3, color: g.tier >= 4 ? '#777' : '#ff8040', s: 1.5 }); }
    }
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.y < -12 || this.y > H + 12 || this.x < -12 || this.x > W + 12 || this.age > 4) this.dead = true;
  }
  draw(ctx, T) {
    if (this.kind === 'missile') {
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);
      ctx.fillStyle = '#ff8040'; ctx.fillRect(-1.5, -4, 3, 8); ctx.fillStyle = '#fff'; ctx.fillRect(-1.5, -4, 3, 2);
      ctx.restore(); return;
    }
    const col = this.kind === 'option' ? '#ffd040' : '#ffffff';
    if (T === 0) { ctx.fillStyle = col; ctx.fillRect(Math.round(this.x) - 1, Math.round(this.y) - 3, 2, 6); }
    else if (T <= 2 || T === 6) { ctx.fillStyle = this.kind === 'option' ? '#ffd040' : '#ffe060'; ctx.fillRect(Math.round(this.x) - 1, Math.round(this.y) - 3, 2, 7); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(this.x) - 1, Math.round(this.y) - 3, 2, 2); if (T === 6) { ctx.globalAlpha = 0.4; ctx.fillStyle = '#ffe060'; ctx.fillRect(Math.round(this.x) - 2, Math.round(this.y) - 1, 4, 10); ctx.globalAlpha = 1; } }
    else if (T === 3) { ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2); ctx.fillStyle = '#80ffff'; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(2, 3); ctx.lineTo(-2, 3); ctx.closePath(); ctx.fill(); ctx.restore(); }
    else {
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);
      const len = T >= 5 ? 14 : 10;
      const gr = ctx.createLinearGradient(0, -4, 0, len); gr.addColorStop(0, T >= 5 ? '#ffffff' : '#ffffff'); gr.addColorStop(0.3, T >= 5 ? '#60ffff' : '#ffe060'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      if (T >= 5) { ctx.shadowBlur = 8; ctx.shadowColor = '#60ffff'; }
      ctx.fillStyle = gr; ctx.fillRect(-1.2, -4, 2.4, len);
      ctx.restore();
    }
  }
}

class EBullet {
  constructor(x, y, vx, vy, o = {}) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.r = o.r || 2; this.kind = o.kind || 'dot'; this.color = o.color || '#ffffff';
    this.age = 0; this.grazed = false; this.dead = false; this.homing = o.homing || 0; this.life = o.life || 6; this.flipAt = o.flipAt; this.accel = o.accel || 0; this.scored = false;
  }
  update(dt, g) {
    this.age += dt;
    if (this.homing && g.player.alive) {
      const a = Math.atan2(this.vy, this.vx), ta = angleTo(this.x, this.y, g.player.x, g.player.y);
      const sp = Math.hypot(this.vx, this.vy); const na = a + clamp(wrapAngle(ta - a), -this.homing * dt, this.homing * dt);
      this.vx = Math.cos(na) * sp; this.vy = Math.sin(na) * sp;
    }
    if (this.accel) { this.vx *= 1 + this.accel * dt; this.vy *= 1 + this.accel * dt; }
    if (this.flipAt !== undefined && this.y > this.flipAt) { this.vy = -Math.abs(this.vy) * 0.8; this.flipAt = undefined; }
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.y < -20 || this.y > H + 20 || this.x < -20 || this.x > W + 20 || this.age > this.life) this.dead = true;
  }
  draw(ctx, T, g) {
    const x = this.x, y = this.y;
    switch (this.kind) {
      case 'dot': ctx.fillStyle = this.color; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 2, 2, 4); break;
      case 'pellet': ctx.fillStyle = '#000'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5); ctx.fillStyle = this.color; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 1, 1); break;
      case 'poly': ctx.save(); ctx.translate(x, y); ctx.rotate(this.age * 6); ctx.fillStyle = this.color; ctx.beginPath(); ctx.moveTo(0, -3.5); ctx.lineTo(3, 0); ctx.lineTo(0, 3.5); ctx.lineTo(-3, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.7; ctx.stroke(); ctx.restore(); break;
      case 'trail': {
        ctx.save(); ctx.strokeStyle = this.color; ctx.globalAlpha = 0.45; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - this.vx * 0.07, y - this.vy * 0.07); ctx.lineTo(x, y); ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 1.2, 0, TAU); ctx.fill(); ctx.restore(); break;
      }
      case 'neon': {
        const gl = g.fx.glow(this.color, 12);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.9;
        ctx.drawImage(gl, x - 7, y - 7, 14, 14);
        ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill(); ctx.restore(); break;
      }
      case 'holo': {
        ctx.save(); ctx.translate(x, y); ctx.rotate(this.age * 4); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(this.age * 40);
        ctx.strokeStyle = this.color; ctx.lineWidth = 0.9; ctx.shadowBlur = 4; ctx.shadowColor = this.color;
        ctx.strokeRect(-2.2, -2.2, 4.4, 4.4); ctx.fillStyle = '#fff'; ctx.fillRect(-0.8, -0.8, 1.6, 1.6); ctx.restore(); break;
      }
    }
  }
}

class PowerUp {
  constructor(x, y, type) { this.x = x; this.y = y; this.type = type; this.t = 0; this.dead = false; this.vy = 32; }
  update(dt) { this.t += dt; this.y += this.vy * dt; this.x += Math.sin(this.t * 2) * 20 * dt; if (this.y > H + 12) this.dead = true; }
  draw(ctx, g) {
    const T = g.tier, P = POWERUPS[this.type];
    drawSprite(ctx, 'pod', this.x, this.y, { tier: T, rs: g.rs, scale: 1.4, variant: Math.floor(this.t * 6) % 4 === 0 ? 'flash' : 'n' });
    drawText(ctx, this.type, this.x + (T <= 2 || T === 6 ? 0.5 : 0), this.y - 3.5, { tier: T, color: T <= 2 ? '#000' : P.color, align: 'center', size: T <= 2 || T === 6 ? 1 : 1.1 });
  }
}
