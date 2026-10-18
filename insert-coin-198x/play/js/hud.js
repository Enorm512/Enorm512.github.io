// ---------------------------------------------------------------
// hud.js : SCORE / HI-SCORE / LIVES / STAGE, combo, weapons, boss bar,
// banners. Styled per era.
// ---------------------------------------------------------------
'use strict';

class HUD {
  constructor(g) { this.g = g; }
  draw(ctx) {
    const g = this.g, T = g.tier, E = g.E, c = E.hud;
    const pixel = T <= 2 || T === 6;
    const txt = (s, x, y, o = {}) => drawText(ctx, s, x, y, Object.assign({ tier: T }, o));
    const blink = Math.floor(g.time * 2.5) % 2 === 0;
    // --- top row ---
    if (pixel) {
      if (blink || !g.player.alive) txt('1UP', 8, 3, { color: c.label });
      txt(fmtScore(g.score), 8, 12, { color: c.value });
      txt('HI-SCORE', W / 2, 3, { color: c.hi, align: 'center' });
      txt(fmtScore(Math.max(g.hi, g.score)), W / 2, 12, { color: c.value, align: 'center' });
      txt(E.year, W - 8, 3, { color: c.stage, align: 'right' });
    } else {
      txt('SCORE', 8, 2, { color: c.label, size: 0.8 });
      txt(fmtScore(g.score), 8, 10, { color: c.value, size: 1.25 });
      txt('BEST', W / 2, 2, { color: c.hi, size: 0.8, align: 'center' });
      txt(fmtScore(Math.max(g.hi, g.score)), W / 2, 10, { color: c.value, size: 1.1, align: 'center' });
      txt(E.year, W - 8, 2, { color: c.stage, size: 1.3, align: 'right' });
    }
    // --- multiplier / chain ---
    if (E.maxMult > 1) {
      const mx = W - 8, my = pixel ? 12 : 16;
      const mcol = g.mult >= 50 ? '#ff40ff' : g.mult >= 10 ? '#ff8040' : g.mult >= 5 ? '#ffe040' : '#80ff80';
      if (g.chain > 0) {
        txt('x' + g.mult, mx, my, { color: mcol, align: 'right', size: pixel ? 1 : 1.2, glow: T >= 4 ? 8 : 0 });
        const bw = 36, bx = mx - bw, by = my + (pixel ? 9 : 12);
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(bx, by, bw, 2);
        ctx.fillStyle = mcol; ctx.fillRect(bx, by, bw * clamp(g.comboT / g.comboWindow, 0, 1), 2);
        if (!pixel || T === 6) txt('CHAIN ' + g.chain, mx, by + 4, { color: '#aaa', align: 'right', size: 0.7 });
      }
    }
    // --- bottom row: lives (left), stage (right) ---
    const by = H - 11;
    for (let i = 0; i < Math.min(g.lives - 1, 6); i++) drawSprite(ctx, 'player', 11 + i * 12, by + 4, { tier: T, rs: g.rs, scale: 0.55 });
    if (pixel && T <= 2) {
      // stage flags
      const st = g.stageNumber; let x = W - 8;
      const tens = Math.floor(st / 5), ones = st % 5;
      for (let i = 0; i < ones; i++) { x -= 6; ctx.fillStyle = c.stage; ctx.fillRect(x, by, 1, 8); ctx.fillStyle = '#ff4040'; ctx.fillRect(x + 1, by, 4, 4); }
      for (let i = 0; i < tens; i++) { x -= 8; ctx.fillStyle = c.stage; ctx.fillRect(x, by, 1, 8); ctx.fillStyle = '#ffe040'; ctx.fillRect(x + 1, by, 6, 5); ctx.fillStyle = '#000'; ctx.fillRect(x + 3, by + 1, 2, 3); }
      txt('STAGE', x - 4, by + 1, { color: c.stage, align: 'right' });
    } else txt('STAGE ' + g.stageNumber, W - 8, by, { color: c.stage, align: 'right', size: pixel ? 1 : 0.9 });
    // --- specials ---
    for (let i = 0; i < g.specials; i++) {
      const sx = W / 2 - 24 + i * 9, sy = by + 4;
      ctx.fillStyle = T >= 4 ? '#ffffff' : '#ffe040';
      if (T >= 4) { ctx.save(); ctx.shadowBlur = 6; ctx.shadowColor = '#ffe040'; }
      ctx.beginPath(); ctx.moveTo(sx, sy - 4); ctx.lineTo(sx + 3, sy); ctx.lineTo(sx, sy + 4); ctx.lineTo(sx - 3, sy); ctx.closePath(); ctx.fill();
      if (T >= 4) ctx.restore();
    }
    if (g.specials > 0 && g.time < 12) txt('OVERDRIVE', W / 2 - 28, by - 8, { color: '#888', size: 0.7 });
    // --- weapon / addon timers ---
    const P = g.player; let wx = W / 2 + 24;
    const bar = (label, frac, color) => {
      txt(label, wx, by, { color, size: pixel ? 1 : 0.9 });
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(wx, by + 8, 18, 2); ctx.fillStyle = color; ctx.fillRect(wx, by + 8, 18 * clamp(frac, 0, 1), 2); wx += 22;
    };
    if (P.weapon) { const k = Object.keys(POWERUPS).find(k => POWERUPS[k].weapon === P.weapon); bar(k, P.weaponT / P.weaponMax, POWERUPS[k].color); }
    if (P.missile) bar('M', P.missileT / MISSILE_TIME, POWERUPS.M.color);
    if (P.drone) bar('O', P.droneT / DRONE_TIME, POWERUPS.O.color);
    // --- boss bar ---
    const boss = g.boss && g.boss.dying <= 0 ? g.boss : null;
    const mini = g.director.miniBoss && !g.director.miniBoss.dead ? g.director.miniBoss : null;
    if (boss || mini) {
      const frac = boss ? boss.hpFrac : mini.hp / mini.maxHp, name = boss ? boss.name : 'GUARDIAN';
      const bw = 140, bx = W / 2 - bw / 2, byy = pixel ? 32 : 36;
      txt(name, W / 2, byy - 9, { color: '#ff6060', align: 'center', size: 0.8 });
      ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, byy - 1, bw + 2, 5);
      ctx.fillStyle = '#400'; ctx.fillRect(bx, byy, bw, 3);
      ctx.fillStyle = frac < 0.3 ? '#ff2020' : '#ff6040'; ctx.fillRect(bx, byy, bw * clamp(frac, 0, 1), 3);
      if (T >= 5) { ctx.save(); ctx.shadowBlur = 8; ctx.shadowColor = '#ff4040'; ctx.strokeStyle = 'rgba(255,80,80,0.6)'; ctx.strokeRect(bx - 1, byy - 1, bw + 2, 5); ctx.restore(); }
    }
    // --- banner ---
    if (g.bannerT > 0) {
      const a = clamp(Math.min(g.bannerT, 0.4) / 0.4, 0, 1);
      ctx.save(); ctx.globalAlpha = a;
      const y = H * 0.38;
      if (g.bannerStyle === 'upgrade') { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, y - 8, W, 36); }
      txt(g.bannerText, W / 2, y, { color: g.bannerColor || '#ff4040', align: 'center', size: pixel ? 1.4 : 1.8, glow: T >= 4 ? 10 : 0 });
      if (g.bannerSub) txt(g.bannerSub, W / 2, y + (pixel ? 13 : 18), { color: '#ffffff', align: 'center', size: pixel ? 1 : 1.1 });
      ctx.restore();
    }
    if (g.audio.muted && Math.floor(g.time * 2) % 2 === 0) txt('MUTED - PRESS M', W / 2, by - 10, { color: '#ff6060', align: 'center', size: 0.8 });
    if (g.cheat) { txt('CHEAT', W / 2, by, { color: '#ff40ff', align: 'center', size: 0.8 }); ctx.fillStyle = '#333'; ctx.fillRect(W / 2 - 20, by + 9, 40, 2); ctx.fillStyle = '#ff40ff'; ctx.fillRect(W / 2 - 20, by + 9, 40 * g.rankLevel, 2); }
    // --- touch special button ---
    if (g.input.touchDevice && g.state === 'play') {
      const sb = g.input.specialButton;
      ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(sb.x, sb.y, sb.r, 0, TAU); ctx.stroke();
      txt('OD', sb.x, sb.y - 3, { color: '#fff', align: 'center', size: 0.9 }); ctx.restore();
    }
    // frame accents for later eras
    if (T === 5) { ctx.save(); ctx.strokeStyle = 'rgba(255,64,192,0.35)'; ctx.shadowBlur = 6; ctx.shadowColor = '#ff40c0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(4, 22); ctx.lineTo(W - 4, 22); ctx.moveTo(4, H - 16); ctx.lineTo(W - 4, H - 16); ctx.stroke(); ctx.restore(); }
    if (T === 7 && Math.random() < 0.03) { ctx.save(); ctx.globalAlpha = 0.6; txt(pick(['ERR', '??', 'SYS', '0x1F', 'NULL', 'LOOP']), rand(20, W - 20), rand(30, H - 30), { color: '#ff40ff', size: 0.8 }); ctx.restore(); }
  }
}
