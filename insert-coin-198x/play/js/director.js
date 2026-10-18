// ---------------------------------------------------------------
// director.js : stage / wave scripting, formation slots, dive timing
// Each era = 2 stages: A (3 waves + mini-boss), B (3 waves + era boss)
// ---------------------------------------------------------------
'use strict';

class Director {
  constructor(g) { this.g = g; this.reset(); }
  reset() {
    this.stage = 0; this.waves = []; this.waveIdx = -1; this.state = 'idle'; this.timer = 0; this.queue = [];
    this.diveT = 2; this.waveId = 0; this.cols = 10; this.waveDeath = false; this.miniBoss = null; this.waveT = 0; this.stageDeath = false;
  }
  get sub() { return this.stage % STAGES_PER_ERA; }
  slotPos(col, row) {
    const g = this.g, E = g.E;
    const sp = 21;
    const breathe = 1 + 0.07 * Math.sin(g.time * 0.6);
    const sway = Math.sin(g.time * 0.75) * 10;
    return { x: W / 2 + (col - (this.cols - 1) / 2) * sp * breathe + sway, y: 50 + row * sp * 0.92 + Math.sin(g.time * 1.3 + col * 0.5) * (E.tier >= 1 ? 1.5 : 0) };
  }
  startStage(idx) {
    const g = this.g;
    this.stage = idx; g.applyStage(idx);
    this.waves = this.buildWaves(); this.waveIdx = -1; this.state = 'between'; this.timer = 1.6; this.stageDeath = false; this.miniBoss = null;
    g.onStageStart(idx);
  }
  buildWaves() {
    const g = this.g, era = g.era, sub = this.sub, loop = g.loop, E = g.E;
    const waves = [];
    for (let w = 0; w < 3; w++) {
      const diff = era * 0.6 + sub * 0.6 + w * 0.35 + (loop - 1) * 1.6;
      const rows = [];
      if (era >= 1) rows.push({ sp: 'commander', n: clamp(1 + Math.floor(diff / 1.6), 1, 4) });
      rows.push({ sp: 'crab', n: clamp(3 + Math.floor(diff * 0.8), 3, 8) });
      if (era >= 1 && (w + sub) % 2 === 1) rows.push({ sp: 'shielder', n: clamp(2 + Math.floor(diff / 2), 2, 6) });
      rows.push({ sp: 'moth', n: clamp(4 + Math.floor(diff), 4, 10) });
      rows.push({ sp: 'drone', n: clamp(5 + Math.floor(diff * 1.1), 5, 10) });
      // later eras: fewer formation bodies, more free hunters
      const trim = era >= 7 ? 0.6 : era >= 6 ? 0.7 : era >= 4 ? 0.8 : 1;
      const form = [];
      rows.forEach((r, ri) => { const n = Math.max(2, Math.round(r.n * trim)); for (let c = 0; c < n; c++) form.push({ sp: r.sp, col: (this.cols - n) / 2 + c, row: ri }); });
      // entry groups of up to 8, each with its own path
      const names = pick([['loopLeft', 'loopRight', 'topLeft', 'topRight', 'sideLeft', 'sideRight'], ['topRight', 'topLeft', 'spiral', 'loopRight', 'loopLeft', 'straight'], ['sideRight', 'sideLeft', 'loopLeft', 'loopRight', 'spiral', 'straight']]);
      const groups = [];
      for (let i = 0; i < form.length; i += 8) groups.push({ members: form.slice(i, i + 8), entry: names[groups.length % names.length], delay: groups.length * 1.9 });
      // free flyers
      const free = [], pool = E.pool;
      const add = (sp, at, n = 1, extra) => { for (let i = 0; i < n; i++) free.push(Object.assign({ sp, at: at + i * 0.7 }, extra)); };
      if (pool.includes('bonus') && Math.random() < 0.6) add('bonus', rand(6, 14));
      if (pool.includes('hunter') && (w >= 1 || era >= 4)) add('hunter', 6 + rand(3), 1 + (w === 2 && era >= 4 && era < 6 ? 1 : 0));
      if (pool.includes('turret') && w >= 1) add('turret', 4, era >= 4 && era < 6 ? 1 + sub : 1);
      if (pool.includes('carrier') && w === 2) add('carrier', 4);
      if (pool.includes('diver3d')) add('diver3d', 8 + rand(2), era >= 6 ? 1 : 1 + w);
      if (pool.includes('kamikaze')) add('kamikaze', 4 + rand(3), era >= 7 ? 1 : (era >= 5 ? 1 : 2) + w);
      if (pool.includes('gunship') && w >= 1) add('gunship', 6);
      if (pool.includes('spiral') && (w + sub) % 2 === 0 && (era < 7 || w === 2)) add('spiral', 5);
      if (pool.includes('ring') && (w + sub) % 2 === 1 && (era < 7 || w === 2)) add('ring', 5);
      if (pool.includes('glitch')) add('glitch', 6 + w * 3, 1);
      if (era >= 1 && Math.random() < 0.25) free.push({ sp: 'bonus', at: rand(3, 10), hidden: true });
      if (loop > 1) add(pick(pool.filter(s => !SPECIES[s].formation && s !== 'bonus') .concat(['hunter'])), 9, loop - 1);
      waves.push({ groups, free, total: form.length });
    }
    return waves;
  }
  nextWave() {
    const g = this.g;
    this.waveIdx++;
    if (this.waveIdx >= this.waves.length) { this.spawnBoss(); return; }
    const w = this.waves[this.waveIdx];
    this.waveId++; this.waveT = 0; this.waveDeath = false; this.queue = [];
    const wid = this.waveId, era = g.era;
    for (const grp of w.groups) {
      grp.members.forEach((m, j) => {
        this.queue.push({
          at: grp.delay + j * 0.17, fn: () => {
            const h = this.slotPos(m.col, m.row);
            const e = new Enemy(g, m.sp, { path: ENTRY[grp.entry](h.x, h.y), home: { col: m.col, row: m.row }, speed: 150 + era * 12 + (g.loop - 1) * 20, waveId: wid });
            g.enemies.push(e);
          }
        });
      });
    }
    for (const f of w.free) this.queue.push({ at: f.at, fn: () => { const e = new Enemy(g, f.sp, { waveId: wid, hidden: f.hidden }); g.enemies.push(e); } });
    this.queue.sort((a, b) => a.at - b.at);
    this.state = 'wave'; this.diveT = 3.2;
    g.onWaveStart(this.waveIdx);
  }
  spawnBoss() {
    const g = this.g;
    this.state = 'boss';
    if (this.sub === 0) { this.miniBoss = makeMiniBoss(g); g.enemies.push(this.miniBoss); g.banner('WARNING', 'GUARDIAN APPROACHING', 2.2); }
    else { g.boss = makeBoss(g, g.era); g.banner('WARNING', g.E.bossName, 2.6); }
    g.audio.sfx('warning'); g.audio.music.setIntensity(1);
    g.onBossStart();
  }
  update(dt) {
    const g = this.g;
    switch (this.state) {
      case 'between': this.timer -= dt; if (this.timer <= 0) this.nextWave(); break;
      case 'wave': {
        this.waveT += dt;
        while (this.queue.length && this.queue[0].at <= this.waveT) this.queue.shift().fn();
        let form = [], aliveWave = 0;
        for (const e of g.enemies) { if (e.dead) continue; if (e.waveId === this.waveId) aliveWave++; if (e.state === 'formation') form.push(e); }
        this.diveT -= dt;
        if (this.diveT <= 0 && form.length && g.player.alive) {
          const few = aliveWave <= 3;
          const n = few ? 1 : clamp(1 + Math.floor(g.E.id / 2), 1, 3);
          const leaders = form.filter(e => e.def.leader);
          const chosen = [];
          if (leaders.length && Math.random() < 0.4) {
            const L = pick(leaders); chosen.push(L);
            const others = form.filter(e => e !== L).sort((a, b) => dist(a.x, a.y, L.x, L.y) - dist(b.x, b.y, L.x, L.y));
            chosen.push(...others.slice(0, 2));
          } else for (let i = 0; i < n; i++) { const e = pick(form); if (!chosen.includes(e)) chosen.push(e); }
          chosen.forEach(e => e.startDive());
          this.diveT = (few ? 1.2 : 2.6) / (g.E.diveRate * g.rankDive * (0.8 + g.loop * 0.2));
        }
        if (!this.queue.length && aliveWave === 0) {
          if (!this.waveDeath) g.onPerfectWave(this.waveIdx);
          this.state = 'between'; this.timer = 1.1;
        }
        break;
      }
      case 'boss': {
        if (this.miniBoss) { if (this.miniBoss.dead) { this.miniBoss = null; this.state = 'clear'; this.timer = 2.0; g.onStageClear(); } }
        else if (g.boss && g.boss.dead) { g.boss = null; this.state = 'clear'; this.timer = 1.2; g.onStageClear(); }
        break;
      }
      case 'clear': this.timer -= dt; if (this.timer <= 0) this.startStage(this.stage + 1); break;
    }
  }
}
