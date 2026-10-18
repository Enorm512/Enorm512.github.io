// ---------------------------------------------------------------
// game.js : main loop, states, collisions, scoring, era transitions,
// attract mode, game over, initials
// ---------------------------------------------------------------
'use strict';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ. ';
const OPTS_DEF = { music: 8, sfx: 8, scanlines: true, hitbox: false, beginner: false };
const OPTION_ITEMS = [
  { key: 'music', label: 'MUSIC VOLUME', type: 'range' },
  { key: 'sfx', label: 'SFX VOLUME', type: 'range' },
  { key: 'scanlines', label: 'SCANLINES', type: 'bool' },
  { key: 'hitbox', label: 'SHOW HITBOX', type: 'bool' },
  { key: 'beginner', label: 'BEGINNER MODE', type: 'bool', hint: '5 SHIPS, GENTLER RANK' },
  { key: 'fullscreen', label: 'FULLSCREEN', type: 'action' },
  { key: 'reset', label: 'RESET HI-SCORES', type: 'action' },
  { key: 'back', label: 'BACK', type: 'action' },
];
const DEFAULT_BOARD = [['ACE', 180000, '1997'], ['ZED', 120000, '1992'], ['KIM', 90000, '1992'], ['RAD', 70000, '1988'], ['MAX', 55000, '1988'], ['JOY', 40000, '1988'], ['BOB', 30000, '1983'], ['TNT', 22000, '1983'], ['PIX', 15000, '1983'], ['REX', 10000, '1983']].map(r => ({ name: r[0], score: r[1], era: r[2] }));

class Game {
  constructor(canvas) {
    this.canvas = canvas; this.sctx = canvas.getContext('2d');
    this.scenes = {};
    this.input = new Input(); this.input.attach(canvas); this.input.toLogical = (x, y) => this.toLogical(x, y);
    this.audio = new AudioSys();
    this.fx = new FX(this); this.bg = new Background(this); this.hud = new HUD(this); this.director = new Director(this);
    this.player = new Player(this);
    this.bullets = []; this.ebullets = []; this.enemies = []; this.powerups = []; this.boss = null;
    this.state = 'attract'; this.time = 0; this.era = 0; this.tier = 0; this.rs = 1; this.loop = 1; this.transition = null; this.rankLevel = 0.25;
    this.hi = Store.get('hi', 180000); this.board = Store.get('board', DEFAULT_BOARD);
    this.score = 0; this.lives = 3; this.specials = 2; this.chain = 0; this.mult = 1; this.maxCombo = 1; this.comboT = 0; this.comboWindow = 2.6;
    this.extendIdx = 0; this.maxEra = 0; this.grazeCount = 0; this.stageNumber = 1; this.stageDamage = false; this.dropCounter = 0; this.laserHitT = 0;
    this.bannerT = 0; this.bannerText = ''; this.bannerSub = ''; this.bannerColor = '#ff4040'; this.bannerStyle = '';
    this.attractT = 0; this.attractTier = 0; this.paused = false; this.gameOverT = 0; this.initials = { chars: [0, 0, 0], pos: 0 }; this.rank = null; this.lastEntry = null;
    this.scanCache = null; this.chromaT = 0;
    this.opts = Object.assign({}, OPTS_DEF, Store.get('opts', {})); this.optionsOpen = false; this.optIdx = 0; this.resetArmed = false;
    this.eraStats = []; this.endingDelay = 0; this.ending = null;
    this.audio.setVolumes(this.opts.music / 10, this.opts.sfx / 10);
    this.resize(); window.addEventListener('resize', () => this.resize());
    this.last = performance.now(); this.lastFrame = this.last;
    requestAnimationFrame(t => this.frame(t));
    // watchdog: if requestAnimationFrame stalls while the page is visible (occluded window,
    // embedded pane), keep the game ticking from a timer so music and input stay responsive
    setInterval(() => { if (!document.hidden && performance.now() - this.lastFrame > 250) this.tick(performance.now()); }, 100);
  }
  get E() { return ERAS[this.era]; }
  get loopMul() { return 1 + (this.loop - 1) * 0.5; }
  // ---- arcade rank: hidden dynamic difficulty 0..1 ----
  // rises while you survive and score, drops when you die. Scales enemy bullet speed, dives, fire rate, health.
  get rankBullet() { return 0.85 + 0.35 * this.rankLevel; }
  get rankDive() { return 0.75 + 0.55 * this.rankLevel; }
  get rankHp() { return 0.9 + 0.25 * this.rankLevel; }
  get rankFire() { return 0.7 + 0.6 * this.rankLevel; }
  rankUp(v) { this.rankLevel = clamp(this.rankLevel + v, 0, this.opts.beginner ? 0.7 : 1); }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const ww = window.innerWidth, wh = window.innerHeight;
    const scale = Math.min(ww / W, (wh - (wh > 520 ? 26 : 0)) / H);
    this.canvas.style.width = Math.floor(W * scale) + 'px'; this.canvas.style.height = Math.floor(H * scale) + 'px';
    this.canvas.width = Math.round(W * scale * dpr); this.canvas.height = Math.round(H * scale * dpr);
    this.screenScale = this.canvas.width / W; this.scanCache = null;
  }
  toLogical(cx, cy) { const r = this.canvas.getBoundingClientRect(); return { x: (cx - r.left) / r.width * W, y: (cy - r.top) / r.height * H }; }
  sceneFor(tier, slot) {
    const rs = clamp(Math.ceil(this.screenScale), 2, 4);
    const key = slot + rs;
    let s = this.scenes[key];
    if (!s) { const c = document.createElement('canvas'); c.width = W * rs; c.height = H * rs; s = this.scenes[key] = { canvas: c, ctx: c.getContext('2d'), rs }; }
    return s;
  }
  // ---------------- run control ----------------
  startGame() {
    this.audio.init(); this.audio.resume();
    this.state = 'play'; this.score = 0; this.lives = this.opts.beginner ? 5 : 3; this.specials = 2; this.eraStats = []; this.endingDelay = 0; this.ending = null; this.chain = 0; this.mult = 1; this.maxCombo = 1; this.comboT = 0;
    this.extendIdx = 0; this.maxEra = 0; this.loop = 1; this.grazeCount = 0; this.dropCounter = 0; this.time = 0; this.bannerT = 0; this.transition = null; this.paused = false; this.cheat = false; this.rankLevel = this.opts.beginner ? 0.1 : 0.25;
    this.bullets.length = 0; this.ebullets.length = 0; this.enemies.length = 0; this.powerups.length = 0; this.boss = null;
    this.fx.clear(); this.bg.structures.length = 0;
    this.applyEra(0); this.player.reset(); this.director.reset(); this.director.startStage(0);
    this.audio.music.start(); this.audio.sfx('coin');
    CG.gameplayStart();
  }
  applyStage(idx) {
    const era = Math.floor(idx / STAGES_PER_ERA) % ERAS.length;
    this.loop = Math.floor(idx / (STAGES_PER_ERA * ERAS.length)) + 1;
    this.stageNumber = idx + 1;
    if (era !== this.era) this.applyEra(era);
    this.maxEra = Math.max(this.maxEra, era + (this.loop - 1) * ERAS.length);
  }
  applyEra(e) {
    this.era = e; this.tier = ERAS[e].tier; this.audio.setEra(e);
    if (this.state === 'play') this.eraStats.push({ year: ERAS[e].year, time: 0, deaths: 0, scoreStart: this.score });
  }
  warmSprites(tier) {
    const rs = clamp(Math.ceil(this.screenScale), 2, 4);
    const names = ['player', 'pod', 'option'].concat(ERAS.find(E => E.tier === tier).pool);
    for (const n of names) for (let f = 0; f < SPR[n].frames.length; f++) getSpriteImage(n, f, tier, 'n', SPRITE_SCALE[tier] * rs);
  }
  onStageStart(idx) {
    this.stageDamage = false; this.audio.music.setIntensity(0);
    const sub = this.director.sub;
    if (!this.transition) this.banner('STAGE ' + (idx + 1), sub === 0 ? this.E.year + ' - ' + this.E.name : '', 1.8, this.E.hud.stage);
    if (sub === 1) { try { this.warmSprites(ERAS[(this.era + 1) % ERAS.length].tier); } catch (e) { } }
  }
  onWaveStart() { }
  onBossStart() { }
  onPerfectWave() { const pts = 1000 * (this.era + 1) * this.loop; this.addScore(pts); this.fx.text(W / 2, H * 0.55, 'FORMATION CLEARED +' + fmtScore(pts), { color: '#80ff80', size: 0.9, life: 1.2, rise: 10 }); }
  onStageClear() {
    this.audio.music.setIntensity(0); this.audio.sfx('stageClear');
    if (!this.stageDamage) { this.rankUp(0.06); const pts = 5000 * (this.era + 1) * this.loop; this.addScore(pts); this.fx.text(W / 2, H * 0.5, 'NO DAMAGE +' + fmtScore(pts), { color: '#ffe040', size: 1, life: 1.8, rise: 8 }); }
    if (this.director.sub === 1) {
      this.specials = Math.min(5, this.specials + 1);
      if (this.era === ERAS.length - 1) { this.director.state = 'idle'; this.endingDelay = 2.8; }
      else this.startTransition(this.era + 1, false);
    }
  }
  startTransition(nextEra, reboot) {
    this.transition = { t: 0, dur: 3.2, from: this.tier, reboot };
    this.applyEra(nextEra);
    // the two hardest generations hand you a shield on arrival
    if (nextEra >= 6 && this.player.alive) { this.player.shield = true; this.fx.text(this.player.x, this.player.y - 24, 'SHIELD ONLINE', { color: '#40ffd0', size: 0.9, life: 1.8 }); }
    this.audio.sfx('upgrade');
    const E = ERAS[nextEra];
    if (reboot) this.banner('SYSTEM REBOOT', 'LOOP ' + (this.loop + 1) + ' - ' + E.year + ' ' + E.name, 4, '#ff40ff', 'upgrade');
    else if (nextEra === 7) this.banner('UNKNOWN HARDWARE DETECTED', 'SYSTEM-?? ONLINE', 4, '#80ffff', 'upgrade');
    else this.banner('HARDWARE UPGRADE', E.year + ' - ' + E.name, 4, '#40ff80', 'upgrade');
  }
  banner(text, sub, dur = 2, color = '#ff4040', style = '') { this.bannerText = text; this.bannerSub = sub; this.bannerT = dur; this.bannerColor = color; this.bannerStyle = style; }
  // ---------------- scoring ----------------
  addScore(pts, x, y, o = {}) {
    pts = Math.round(pts);
    this.score += pts;
    if (o.text && x !== undefined) this.fx.text(x, y, fmtScore(pts), { color: this.mult > 1 ? '#ffe040' : '#fff', size: 0.8, life: 0.7 });
    if (this.score > this.hi && !this.cheat) this.hi = this.score;
    while (this.extendIdx < EXTEND_SCORES.length && this.score >= EXTEND_SCORES[this.extendIdx]) { this.extendIdx++; this.addLife(); }
  }
  addLife() { this.lives++; this.fx.text(this.player.x, this.player.y - 30, 'EXTRA SHIP', { color: '#ff4060', size: 1.1, life: 1.6 }); this.audio.sfx('extend'); }
  onEnemyKilled(e) {
    this.chain++; this.comboT = this.comboWindow; this.rankUp(0.0015);
    const prev = this.mult; this.mult = multForChain(this.chain, this.E.maxMult);
    if (this.mult > prev) { this.fx.text(this.player.x, this.player.y - 28, 'x' + this.mult + '!', { color: '#ffe040', size: 1.3, life: 1 }); this.audio.sfx('combo', MULT_STEPS.findIndex(s => s[1] === this.mult)); }
    this.maxCombo = Math.max(this.maxCombo, this.mult);
    const big = e.scale > 1.5;
    this.addScore(e.value * this.mult * this.loop, e.x, e.y - 6, { text: true });
    this.fx.explode(e.x, e.y, big ? 2.6 : 1, SPR[e.sprite].pal[0]); this.audio.sfx('explode', big ? 2 : 1);
    if (big) { this.fx.shake(8); this.fx.flash('#fff', 0.25); }
    if (e.hidden) { this.fx.text(e.x, e.y - 16, 'HIDDEN +' + fmtScore(3000 * (this.era + 1)), { color: '#ff40ff', size: 0.9, life: 1.2 }); this.addScore(3000 * (this.era + 1)); }
    else if (e.sp === 'bonus') this.fx.text(e.x, e.y - 16, 'BONUS', { color: '#ffe040', size: 0.9 });
    if (this.E.upgrades) {
      this.dropCounter++;
      const chance = big ? 1 : ['carrier', 'gunship', 'commander', 'spiral', 'ring'].includes(e.sp) ? 0.45 : 0.05;
      if (Math.random() < chance || this.dropCounter >= 24) { this.dropCounter = 0; this.spawnPowerUp(e.x, e.y); }
    } else if (big) this.spawnPowerUp(e.x, e.y, 'V');
  }
  spawnPowerUp(x, y, type) {
    if (!type) {
      if (this.lives < 3 && Math.random() < 0.08) type = 'E';
      else if (Math.random() < 0.06) type = 'V';
      else type = pick(['D', 'S', 'L', 'M', 'B', 'O', 'D', 'S', 'M', 'B']);
    }
    this.powerups.push(new PowerUp(x, y, type));
  }
  useSpecial() {
    if (this.specials <= 0 || !this.player.alive || this.state !== 'play') return;
    this.specials--; this.audio.sfx('special'); this.fx.flash('#fff', 0.7); this.fx.shake(10);
    this.player.inv = Math.max(this.player.inv, 1.6);
    let n = 0;
    for (const b of this.ebullets) { b.dead = true; n++; this.fx.add({ kind: this.tier >= 4 ? 'spark' : 'px', x: b.x, y: b.y, vx: rand(-60, 60), vy: rand(-60, 60), life: 0.3, color: '#fff', s: 1 }); }
    this.ebullets.length = 0;
    if (n) this.addScore(n * 10 * this.mult);
    for (const e of this.enemies) if (!e.dead && e.y > -10) e.hit(10, false);
    if (this.boss && this.boss.dying <= 0 && !this.boss.intro) for (const p of this.boss.parts) if (p.alive && (!p.core || this.boss.coreOpen) && !p.shielded) this.boss.damage(p, 8);
    for (let i = 0; i < 12; i++) this.fx.rings.push({ kind: this.tier >= 5 ? 'neon' : this.tier >= 3 ? 'shock' : 'px', x: this.player.x, y: this.player.y, r: 2 + i * 8, vr: 320, life: 0.5, max: 0.5, color: '#ffffff' });
    this.fx.text(W / 2, H / 2, 'OVERDRIVE', { color: '#fff', size: 1.6, life: 1 });
  }
  onPlayerDeath() {
    this.chain = 0; this.mult = 1; this.comboT = 0; this.stageDamage = true; this.director.waveDeath = true; this.lives--;
    this.rankUp(-0.25);
    const cs = this.eraStats[this.eraStats.length - 1]; if (cs) cs.deaths++;
    this.ebullets.length = 0;
  }
  onPlayerRespawn() { }
  onBossDying(b) {
    let n = this.ebullets.length; this.ebullets.length = 0; if (n) this.addScore(n * 10 * this.mult);
    this.audio.music.setIntensity(0);
  }
  onBossDefeated(b) {
    const t = this.time - b.startTime;
    const bonus = Math.max(0, Math.round(70 - t)) * 200 * (this.era + 1) * this.loop;
    if (bonus > 0) { this.addScore(bonus); this.fx.text(W / 2, H * 0.42, 'SPEED BONUS +' + fmtScore(bonus), { color: '#80ff80', size: 1, life: 2, rise: 6 }); }
    this.fx.text(W / 2, H * 0.42 + 14, b.name + ' DESTROYED', { color: '#fff', size: 0.9, life: 2, rise: 6 });
    CG.happytime();
  }
  onGraze(b) {
    this.grazeCount++; this.player.grazeFlash = 0.15;
    this.addScore(25 * this.mult);
    this.comboT = Math.min(this.comboWindow, this.comboT + 0.5);
    this.audio.sfx('graze');
    this.fx.add({ kind: this.tier >= 4 ? 'spark' : 'px', x: b.x, y: b.y, vx: rand(-40, 40), vy: rand(-40, 40), life: 0.2, color: '#80ffff', s: 1 });
    if (this.grazeCount % 5 === 0) this.fx.text(this.player.x, this.player.y - 16, 'GRAZE', { color: '#80ffff', size: 0.8, life: 0.6 });
  }
  spawnEBullet(x, y, vx, vy, o = {}) {
    const sp = (1 + (this.loop - 1) * 0.12) * this.rankBullet;
    this.ebullets.push(new EBullet(x, y, vx * sp, vy * sp, Object.assign({ kind: this.E.bullet }, o)));
  }
  enemiesAlive() { let n = 0; for (const e of this.enemies) if (!e.dead) n++; if (this.boss && !this.boss.dead) n++; return n; }
  gameOver() {
    this.state = 'gameover'; this.gameOverT = 0; this.audio.music.stop(1.5);
    CG.gameplayStop();
    this.adWait = true;
    CG.midgameAd(on => this.audio.setAdMute(on), () => { this.adWait = false; });
    Store.set('hi', this.hi);
    const idx = this.cheat ? -1 : this.board.findIndex(e => this.score > e.score);
    this.rank = idx === -1 ? null : idx;
    this.initials = { chars: [0, 0, 0], pos: 0 };
    this.bannerT = 0;
  }
  enableCheat() {
    if (this.state !== 'play') this.startGame();
    this.cheat = true; this.lives = 9;
    this.audio.sfx('extend');
    this.fx.text(W / 2, H * 0.6, 'CHEAT MODE - 9 SHIPS', { color: '#ff40ff', size: 1.1, life: 2.5, rise: 4 });
    this.fx.text(W / 2, H * 0.6 + 14, 'N = NEXT STAGE  (NO HI-SCORE)', { color: '#aaa', size: 0.8, life: 2.5, rise: 4 });
  }
  // ---------------- ending (after The Cabinet) ----------------
  beginEnding() {
    this.state = 'ending'; this.ending = { t: 0 };
    this.bullets.length = 0; this.ebullets.length = 0; this.enemies.length = 0; this.powerups.length = 0; this.boss = null;
    const bonus = 100000 * this.loop; this.addScore(bonus);
    this.audio.sfx('upgrade'); this.audio.music.play('title');
    this.fx.flash('#fff', 0.8);
  }
  finishEnding() {
    this.state = 'play'; this.ending = null;
    this.startTransition(0, true);
    this.director.startStage(this.director.stage + 1);
    this.audio.music.play('stage');
  }
  drawEnding(ctx) {
    const tier = this.tier, pixel = tier <= 2 || tier === 6, t = this.ending.t;
    const txt = (s, x, y, o) => drawText(ctx, s, x, y, Object.assign({ tier }, o));
    if (t < 3) {
      ctx.fillStyle = `rgba(0,0,0,${0.3 + 0.2 * Math.sin(t * 30)})`; ctx.fillRect(0, 0, W, H);
      if (Math.floor(t * 8) % 2 === 0) txt('SYSTEM OVERFLOW', W / 2, H * 0.4, { color: '#ff40ff', align: 'center', size: pixel ? 1.6 : 2 });
      txt('THE CABINET HAS EVOLVED BEYOND ITS PROGRAM', W / 2, H * 0.4 + 20, { color: '#80ffff', align: 'center', size: pixel ? 0.8 : 0.75 });
      return;
    }
    const a = clamp((t - 3) / 0.6, 0, 1);
    ctx.fillStyle = `rgba(0,0,0,${0.78 * a})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = a;
    let y = 36;
    txt('LOOP ' + this.loop + ' COMPLETE', W / 2, y, { color: '#ffe040', align: 'center', size: pixel ? 1.6 : 2, glow: tier >= 4 ? 10 : 0 }); y += pixel ? 18 : 22;
    txt('40 YEARS OF ARCADE SURVIVED', W / 2, y, { color: '#fff', align: 'center', size: pixel ? 0.9 : 0.9 }); y += 18;
    const cols = [W / 2 - 92, W / 2 - 46, W / 2 + 6, W / 2 + 92];
    txt('ERA', cols[0], y, { color: '#888', size: 0.8 }); txt('TIME', cols[1], y, { color: '#888', size: 0.8 }); txt('LOST', cols[2], y, { color: '#888', size: 0.8 }); txt('SCORE', cols[3], y, { color: '#888', size: 0.8, align: 'right' }); y += 11;
    const stats = this.eraStats.slice(-ERAS.length);
    stats.forEach((s, i) => {
      const next = stats[i + 1]; const sc = (next ? next.scoreStart : this.score - 100000 * this.loop) - s.scoreStart;
      const m = Math.floor(s.time / 60), sec = Math.floor(s.time % 60);
      const col = s.deaths === 0 ? '#80ff80' : '#ddd';
      txt(s.year, cols[0], y, { color: col, size: 0.9 }); txt(m + ':' + pad(sec, 2), cols[1], y, { color: col, size: 0.9 });
      txt(String(s.deaths), cols[2], y, { color: col, size: 0.9 }); txt(fmtScore(Math.max(0, sc)), cols[3], y, { color: col, size: 0.9, align: 'right' });
      y += 11;
    });
    y += 6;
    txt('ALL ERAS BONUS  +' + fmtScore(100000 * this.loop), W / 2, y, { color: '#ffe040', align: 'center', size: 0.9 }); y += 13;
    txt('TOTAL  ' + fmtScore(this.score), W / 2, y, { color: '#fff', align: 'center', size: pixel ? 1.2 : 1.3 }); y += 20;
    if (t > 5 && Math.floor(t * 2) % 2 === 0) txt('PRESS FIRE - NEW GAME+  (LOOP ' + (this.loop + 1) + ')', W / 2, y, { color: '#80ffff', align: 'center', size: pixel ? 0.9 : 0.9 });
    txt('THE MACHINE REBOOTS. FASTER. MEANER.', W / 2, y + 14, { color: '#777', align: 'center', size: 0.8 });
    ctx.restore();
  }
  // ---------------- options ----------------
  openOptions() { this.optionsOpen = true; this.optIdx = 0; this.resetArmed = false; this.audio.init(); this.audio.sfx('menu'); }
  closeOptions() { this.optionsOpen = false; this.resetArmed = false; Store.set('opts', this.opts); this.audio.sfx('menu'); }
  applyOpts() { this.audio.setVolumes(this.opts.music / 10, this.opts.sfx / 10); Store.set('opts', this.opts); }
  get optionItems() { return CG.embedded ? OPTION_ITEMS.filter(i => i.key !== 'fullscreen') : OPTION_ITEMS; }
  updateOptions(inp) {
    const ITEMS = this.optionItems, it = ITEMS[this.optIdx];
    if (inp.pressed.back || inp.pressed.options) { this.closeOptions(); return; }
    if (inp.pressed.up) { this.optIdx = (this.optIdx + ITEMS.length - 1) % ITEMS.length; this.resetArmed = false; this.audio.sfx('menu'); }
    if (inp.pressed.down) { this.optIdx = (this.optIdx + 1) % ITEMS.length; this.resetArmed = false; this.audio.sfx('menu'); }
    if (this.input.touchDevice && inp.pressed.start && inp.tapPos) {
      const row = Math.floor((inp.tapPos.y - 70) / 16); inp.tapPos = null;
      if (row >= 0 && row < ITEMS.length) { if (row === this.optIdx) this.activate(it, 1); else { this.optIdx = row; this.resetArmed = false; } return; }
    }
    if (it.type === 'range') {
      if (inp.pressed.left) { this.opts[it.key] = Math.max(0, this.opts[it.key] - 1); this.applyOpts(); this.audio.sfx('menu'); }
      if (inp.pressed.right) { this.opts[it.key] = Math.min(10, this.opts[it.key] + 1); this.applyOpts(); this.audio.sfx('menu'); }
    } else if (it.type === 'bool') {
      if (inp.pressed.left || inp.pressed.right || inp.pressed.fire) this.activate(it, 1);
    } else if (inp.pressed.fire) this.activate(it, 1);
  }
  activate(it) {
    if (it.type === 'bool') { this.opts[it.key] = !this.opts[it.key]; this.applyOpts(); this.audio.sfx('menu'); return; }
    if (it.key === 'back') { this.closeOptions(); return; }
    if (it.key === 'fullscreen') {
      const el = document.documentElement;
      if (document.fullscreenElement) { document.exitFullscreen && document.exitFullscreen(); }
      else if (el.requestFullscreen) el.requestFullscreen().catch(() => { });
      this.audio.sfx('coin'); return;
    }
    if (it.key === 'reset') {
      if (!this.resetArmed) { this.resetArmed = true; this.audio.sfx('menu'); return; }
      this.board = DEFAULT_BOARD.map(e => Object.assign({}, e)); this.hi = this.board[0].score; this.lastEntry = null;
      Store.set('board', this.board); Store.set('hi', this.hi); this.resetArmed = false; this.audio.sfx('extend');
    }
  }
  drawOptions(ctx) {
    const tier = this.tier, pixel = tier <= 2 || tier === 6;
    const txt = (s, x, y, o) => drawText(ctx, s, x, y, Object.assign({ tier }, o));
    ctx.fillStyle = 'rgba(0,0,0,0.92)'; ctx.fillRect(0, 0, W, H);
    txt('OPTIONS', W / 2, 36, { color: '#ffe040', align: 'center', size: pixel ? 1.6 : 2, glow: tier >= 4 ? 10 : 0 });
    this.optionItems.forEach((it, i) => {
      const y = 70 + i * 16, sel = i === this.optIdx, col = sel ? '#fff' : '#aaa';
      if (sel) txt('>', W / 2 - 100, y, { color: '#ff4040' });
      let label = it.label; if (it.key === 'reset' && this.resetArmed) label = 'RESET HI-SCORES - SURE?';
      txt(label, W / 2 - 90, y, { color: col, size: 0.95 });
      if (it.type === 'range') {
        const v = this.opts[it.key];
        for (let k = 0; k < 10; k++) { ctx.fillStyle = k < v ? (sel ? '#ffe040' : '#bbb') : '#333'; ctx.fillRect(W / 2 + 30 + k * 6, y + 1, 4, 6); }
      } else if (it.type === 'bool') txt(this.opts[it.key] ? 'ON' : 'OFF', W / 2 + 90, y, { color: this.opts[it.key] ? '#80ff80' : '#888', align: 'right', size: 0.95 });
      if (sel && it.hint) txt(it.hint, W / 2 - 90, y + 9, { color: '#666', size: 0.7 });
    });
    txt('UP/DOWN SELECT   LEFT/RIGHT CHANGE', W / 2, H - 52, { color: '#777', align: 'center', size: 0.8 });
    txt('FIRE OK   O OR BACKSPACE BACK', W / 2, H - 40, { color: '#777', align: 'center', size: 0.8 });
  }
  // dev helpers: game.jumpStage(n) / game.god = true
  jumpStage(n) {
    if (this.state !== 'play') this.startGame();
    this.bullets.length = 0; this.ebullets.length = 0; this.enemies.length = 0; this.powerups.length = 0; this.boss = null; this.transition = null;
    this.director.reset(); this.director.startStage(n);
  }
  commitInitials() {
    const name = this.initials.chars.map(i => ALPHABET[i]).join('');
    const entry = { name, score: this.score, era: ERAS[this.maxEra % ERAS.length].year + (this.loop > 1 ? '+' : '') + (this.opts.beginner ? 'b' : '') };
    this.board.splice(this.rank, 0, entry); this.board.length = Math.min(this.board.length, 10);
    Store.set('board', this.board); this.lastEntry = entry; CG.happytime();
    this.state = 'attract'; this.attractT = 0; this.attractTier = this.tier; this.attractHold = 1.0;
    this.audio.music.play('title');
  }
  // ---------------- loop ----------------
  frame(t) { this.tick(t); requestAnimationFrame(tt => this.frame(tt)); }
  tick(t) {
    this.lastFrame = t;
    let dt = (t - this.last) / 1000; this.last = t; dt = Math.min(dt, 0.05);
    try { this.update(dt); this.render(); } catch (err) { console.error(err); }
  }
  update(dt) {
    const inp = this.input; inp.update();
    if (inp.pressed.mute) { this.audio.init(); this.audio.toggleMute(); }
    if (inp.cheatHit) { inp.cheatHit = false; this.enableCheat(); }
    if (this.optionsOpen) { this.updateOptions(inp); return; }
    if (inp.pressed.options && (this.state === 'attract' || (this.state === 'play' && this.paused))) { this.openOptions(); return; }
    if (this.cheat && this.state === 'play' && inp.pressed.skip) this.jumpStage(this.director.stage + 1);
    switch (this.state) {
      case 'attract':
        this.attractT += dt;
        if (this.attractHold > 0) { this.attractHold -= dt; }
        else { this.attractTier = Math.floor(this.attractT / 3) % 8; }
        this.tier = this.attractTier; this.bg.update(dt); this.fx.update(dt);
        if (inp.pressed.start && inp.tapPos && this.input.touchDevice && inp.tapPos.y < 26 && inp.tapPos.x > W - 70) { this.openOptions(); inp.tapPos = null; break; }
        if (inp.pressed.fire || inp.pressed.start) this.startGame();
        break;
      case 'ending':
        this.ending.t += dt; this.bg.update(dt); this.fx.update(dt);
        if (this.ending.t > 5 && (inp.pressed.fire || inp.pressed.start)) this.finishEnding();
        break;
      case 'play':
        if (inp.pressed.pause) { this.paused = !this.paused; if (this.audio.ctx) { if (this.paused) this.audio.ctx.suspend(); else this.audio.ctx.resume(); } if (this.paused) CG.gameplayStop(); else CG.gameplayStart(); }
        if (!this.paused) this.updatePlay(dt);
        break;
      case 'gameover':
        this.gameOverT += dt; this.fx.update(dt); this.bg.update(dt);
        if (this.adWait && this.gameOverT > 12 && !CG.adRunning) this.adWait = false;   // safety: never block restart on a stalled ad request
        if (this.gameOverT > 0.8 && !this.adWait && (inp.pressed.fire || inp.pressed.start)) {
          if (this.rank !== null) this.state = 'initials';
          else this.startGame();
        }
        break;
      case 'initials': {
        const I = this.initials;
        if (inp.pressed.left) { I.chars[I.pos] = (I.chars[I.pos] + ALPHABET.length - 1) % ALPHABET.length; this.audio.sfx('menu'); }
        if (inp.pressed.right) { I.chars[I.pos] = (I.chars[I.pos] + 1) % ALPHABET.length; this.audio.sfx('menu'); }
        if (inp.pressed.up) { I.chars[I.pos] = (I.chars[I.pos] + 1) % ALPHABET.length; }
        if (inp.pressed.down) { I.chars[I.pos] = (I.chars[I.pos] + ALPHABET.length - 1) % ALPHABET.length; }
        if (inp.pressed.special && I.pos > 0) { I.pos--; this.audio.sfx('menu'); }
        if (inp.pressed.fire || inp.pressed.start) { this.audio.sfx('coin'); I.pos++; if (I.pos >= 3) this.commitInitials(); }
        break;
      }
    }
  }
  updatePlay(dt) {
    this.time += dt;
    if (this.transition) { this.transition.t += dt; if (this.transition.t >= this.transition.dur) this.transition = null; }
    if (this.bannerT > 0) this.bannerT -= dt;
    { const cs = this.eraStats[this.eraStats.length - 1]; if (cs) cs.time += dt; }
    if (this.endingDelay > 0) { this.endingDelay -= dt; if (this.endingDelay <= 0) { this.beginEnding(); return; } }
    this.bg.update(dt); this.director.update(dt); this.player.update(dt);
    for (const b of this.bullets) b.update(dt, this); compact(this.bullets);
    for (const b of this.ebullets) b.update(dt, this); compact(this.ebullets);
    for (const e of this.enemies) if (!e.dead) e.update(dt); compact(this.enemies);
    if (this.boss) this.boss.update(dt);
    for (const p of this.powerups) p.update(dt); compact(this.powerups);
    this.fx.update(dt);
    if (this.chain > 0) { this.comboT -= dt; if (this.comboT <= 0) { this.chain = 0; this.mult = 1; } }
    if (this.player.alive) this.rankUp(dt * 0.004);
    this.collisions(dt);
    if (this.lives <= 0 && !this.player.alive && this.player.respawnT <= 0) this.gameOver();
    if (this.tier === 7) this.chromaT -= dt;
  }
  collisions(dt) {
    const P = this.player;
    for (const b of this.bullets) {
      if (b.dead) continue;
      for (const e of this.enemies) {
        if (e.dead || e.y < -8 || e.depth < 0.5) continue;
        if (hitEllipse(b.x - e.x, b.y - e.y, e.rx, e.ry, b.r)) { e.hit(b.dmg, b.vy < 0 && b.y > e.y - 2); b.hits++; if (b.hits > b.pierce) { b.dead = true; break; } }
      }
      if (!b.dead && this.boss && this.boss.dying <= 0 && this.boss.hitTest(b)) { b.dead = true; continue; }
      if (!b.dead) for (const s of this.bg.structures) {
        if (s.dead) continue;
        if (b.x > s.x - s.w / 2 && b.x < s.x + s.w / 2 && b.y > s.y && b.y < s.y + s.h) { s.hp -= b.dmg; b.dead = true; this.fx.add({ kind: 'px', x: b.x, y: b.y, vx: rand(-30, 30), vy: -30, life: 0.2, color: '#ffd080', s: 2 }); if (s.hp <= 0) { s.dead = true; this.fx.explode(s.x, s.y + s.h / 2, 1.3, '#ffa060'); this.addScore(50 * this.mult, s.x, s.y, { text: true }); this.audio.sfx('explode', 0.8); } break; }
      }
    }
    if (P.alive && P.laserOn) {
      this.laserHitT -= dt;
      if (this.laserHitT <= 0) {
        this.laserHitT = 0.1; const lx = P.x; const fake = { x: lx, y: 0, r: 2.5, dmg: 1, vy: -1 };
        for (const e of this.enemies) if (!e.dead && e.y < P.y && e.y > -8 && Math.abs(e.x - lx) < e.rx + 2) { e.hit(1, false); this.fx.add({ kind: this.tier >= 4 ? 'spark' : 'px', x: lx, y: e.y, vx: rand(-50, 50), vy: rand(-50, 50), life: 0.15, color: '#ff80ff', s: 1 }); }
        if (this.boss && this.boss.dying <= 0) for (const p of this.boss.parts) { if (!p.alive) continue; const q = this.boss.partPos(p); if (Math.abs(q.x - lx) < p.rx * this.boss.scale) { fake.y = q.y; this.boss.hitTest(fake); } }
        for (const s of this.bg.structures) if (!s.dead && Math.abs(s.x - lx) < s.w / 2 && s.y < P.y) { s.hp -= 1; if (s.hp <= 0) { s.dead = true; this.fx.explode(s.x, s.y + s.h / 2, 1.3, '#ffa060'); this.addScore(50 * this.mult); } }
      }
    }
    if (P.alive) {
      for (const b of this.ebullets) {
        if (b.dead) continue;
        const d = dist(b.x, b.y, P.x, P.y);
        if (d < P.r + b.r) { b.dead = true; if (!this.god) P.hit(); if (!P.alive) break; }
        else if (!b.grazed && P.inv <= 0 && hitEllipse(b.x - P.x, b.y - P.y, P.grazeRx, P.grazeRy, b.r)) { b.grazed = true; this.onGraze(b); }
      }
    }
    if (P.alive && P.inv <= 0) {
      for (const e of this.enemies) {
        if (e.dead || e.hidden || e.y < 0 || e.depth < 0.9) continue;
        if (hitEllipse(P.x - e.x, P.y - e.y, e.rx * 0.85, e.ry * 0.85, P.r + 1)) { if (e.scale <= 1.5) e.hit(99, false); if (!this.god) P.hit(); break; }
      }
      if (P.alive && !this.god && this.boss && this.boss.dying <= 0 && this.boss.collides(P.x, P.y, P.r)) P.hit();
    }
    if (P.alive) for (const p of this.powerups) { if (!p.dead && dist(p.x, p.y, P.x, P.y) < 13) { p.dead = true; P.applyPowerUp(p.type); this.addScore(500 * this.mult); } }
  }
  // ---------------- render ----------------
  renderWorld(tier, slot) {
    const S = this.sceneFor(tier, slot), ctx = S.ctx;
    const saveTier = this.tier; this.tier = tier; this.rs = S.rs;
    ctx.setTransform(S.rs, 0, 0, S.rs, 0, 0);
    ctx.imageSmoothingEnabled = tier >= 3;
    this.bg.draw(ctx, tier);
    this.fx.drawLights(ctx);
    for (const p of this.powerups) p.draw(ctx, this);
    for (const e of this.enemies) if (!e.dead && e.state === 'formation') e.draw(ctx);
    for (const e of this.enemies) if (!e.dead && e.state !== 'formation') e.draw(ctx);
    if (this.boss) this.boss.draw(ctx);
    this.player.draw(ctx);
    for (const b of this.bullets) b.draw(ctx, tier);
    for (const b of this.ebullets) b.draw(ctx, tier, this);
    this.fx.draw(ctx);
    this.hud.draw(ctx);
    if (this.state === 'gameover') this.drawGameOver(ctx);
    if (this.state === 'initials') this.drawInitials(ctx);
    if (this.state === 'ending') this.drawEnding(ctx);
    if (this.paused) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H); drawText(ctx, 'PAUSE', W / 2, H / 2 - 4, { tier, color: '#fff', align: 'center', size: 1.6 }); drawText(ctx, 'P RESUME  -  O OPTIONS  -  M MUTE', W / 2, H / 2 + 14, { tier, color: '#aaa', align: 'center', size: 0.9 }); }
    if (this.optionsOpen) this.drawOptions(ctx);
    this.tier = saveTier;
    return S;
  }
  blit(S, y0 = 0, y1 = 1) {
    const c = this.canvas, sctx = this.sctx;
    sctx.save();
    sctx.beginPath(); sctx.rect(0, c.height * y0, c.width, c.height * (y1 - y0)); sctx.clip();
    sctx.imageSmoothingEnabled = S.rs !== 1;
    sctx.imageSmoothingQuality = 'high';
    sctx.drawImage(S.canvas, 0, 0, S.canvas.width, S.canvas.height, 0, 0, c.width, c.height);
    sctx.restore();
  }
  render() {
    const c = this.canvas, sctx = this.sctx;
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    const sh = this.fx.shakeOffset();
    sctx.save(); sctx.translate(sh.x * this.screenScale, sh.y * this.screenScale);
    if (this.state === 'ending') {
      const tier = this.ending.t < 3 ? Math.floor(this.ending.t * 6) % 8 : this.tier;
      const S = this.renderWorld(tier, 'A');
      this.blit(S);
      if (this.ending.t < 3) { sctx.globalAlpha = 0.5; sctx.fillStyle = '#fff'; for (let i = 0; i < 10; i++) sctx.fillRect(rand(c.width), rand(c.height), rand(10, 120) * this.screenScale, 1.5 * this.screenScale); sctx.globalAlpha = 1; }
      sctx.restore();
      this.postFX(tier);
      return;
    }
    if (this.state === 'attract') {
      const S = this.renderAttract(this.attractTier);
      this.blit(S);
      sctx.restore();
      this.postFX(this.attractTier);
      return;
    }
    if (this.transition) {
      const k = easeInOut(clamp(this.transition.t / this.transition.dur, 0, 1));
      const A = this.renderWorld(this.transition.from, 'A');
      const B = this.renderWorld(this.tier, 'B');
      this.blit(B, 0, k); this.blit(A, k, 1);
      const y = k * c.height;
      sctx.fillStyle = this.transition.reboot ? '#ff40ff' : '#ffffff'; sctx.globalAlpha = 0.9; sctx.fillRect(0, y - 2, c.width, 4);
      sctx.globalAlpha = 0.5;
      for (let i = 0; i < 12; i++) sctx.fillRect(rand(c.width), y + rand(-16, 16) * this.screenScale, rand(10, 80) * this.screenScale, 1.5 * this.screenScale);
      sctx.globalAlpha = 1;
    } else {
      const S = this.renderWorld(this.tier, 'A');
      this.blit(S);
      if (this.tier === 7 && this.chromaT < 0) {
        sctx.save(); sctx.globalCompositeOperation = 'screen'; sctx.globalAlpha = 0.35;
        sctx.drawImage(S.canvas, 3 * this.screenScale, 0, c.width, c.height);
        sctx.drawImage(S.canvas, -3 * this.screenScale, 0, c.width, c.height);
        sctx.restore();
        if (this.chromaT < -0.12) this.chromaT = rand(0.3, 1.5);
      }
    }
    sctx.restore();
    this.postFX(this.tier);
  }
  postFX(tier) {
    const c = this.canvas, sctx = this.sctx;
    // scanlines
    const alpha = tier <= 2 ? 0.28 : tier <= 4 ? 0.1 : tier === 6 ? 0.14 : tier === 7 ? 0.08 : 0;
    if (alpha > 0 && this.opts.scanlines) {
      if (!this.scanCache) {
        const sc = document.createElement('canvas'); sc.width = 4; sc.height = Math.max(2, Math.round(this.screenScale));
        const x = sc.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 4, 1);
        this.scanCache = sctx.createPattern(sc, 'repeat');
      }
      sctx.save(); sctx.globalAlpha = alpha; sctx.fillStyle = this.scanCache; sctx.fillRect(0, 0, c.width, c.height); sctx.restore();
    }
    if (tier >= 3 || tier === 0) {
      const g = sctx.createRadialGradient(c.width / 2, c.height / 2, c.height * 0.35, c.width / 2, c.height / 2, c.height * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, tier === 0 ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)');
      sctx.fillStyle = g; sctx.fillRect(0, 0, c.width, c.height);
    }
    if (this.fx.flashA > 0) { sctx.save(); sctx.globalAlpha = this.fx.flashA; sctx.fillStyle = this.fx.flashC; sctx.fillRect(0, 0, c.width, c.height); sctx.restore(); }
  }
  // ---------------- screens ----------------
  renderAttract(tier) {
    const S = this.sceneFor(tier, 'A'), ctx = S.ctx;
    const saveTier = this.tier; this.tier = tier; this.rs = S.rs;
    ctx.setTransform(S.rs, 0, 0, S.rs, 0, 0);
    ctx.imageSmoothingEnabled = tier >= 3;
    this.bg.draw(ctx, tier);
    const E = ERAS.find(e => e.tier === tier), c = E.hud;
    const t = this.attractT;
    const txt = (s, x, y, o) => drawText(ctx, s, x, y, Object.assign({ tier }, o));
    const pixel = tier <= 2 || tier === 6;
    // logo
    const ly = 34;
    const glitch = (t % 3) < 0.25 && tier === 7 ? rand(-3, 3) : 0;
    txt('INSERT COIN', W / 2 + glitch, ly, { color: c.label, align: 'center', size: pixel ? 2 : 2.6, glow: tier >= 4 ? 14 : 0 });
    txt('198X', W / 2 - glitch, ly + (pixel ? 18 : 24), { color: c.value, align: 'center', size: pixel ? 3.2 : 4.2, glow: tier >= 4 ? 18 : 0 });
    txt(E.year + '  ' + E.name, W / 2, ly + (pixel ? 46 : 56), { color: c.stage, align: 'center', size: pixel ? 1 : 1 });
    // ship + enemy roster
    const ry = 112;
    txt('- SCORE TABLE -', W / 2, ry - 13, { color: '#fff', align: 'center', size: pixel ? 1 : 0.9 });
    const roster = [['drone', '80'], ['moth', '100'], ['crab', '150'], ['commander', '400'], ['bonus', '1000']];
    roster.forEach(([sp, pts], i) => {
      const yy = ry + i * 14;
      drawSprite(ctx, sp, W / 2 - 46, yy + 4, { tier, rs: S.rs, frame: Math.floor(t * 3) % 2 });
      txt(pts + ' PTS', W / 2 - 28, yy, { color: '#ddd', size: pixel ? 1 : 0.9 });
    });
    drawSprite(ctx, 'player', W / 2 + 62, ry + 28, { tier, rs: S.rs, scale: 1.2 });
    txt('YOU', W / 2 + 62, ry + 46, { color: '#aaa', align: 'center', size: 0.8 });
    // leaderboard (all 10)
    const by = 196;
    txt('BEST PILOTS', W / 2, by - 11, { color: c.hi, align: 'center', size: pixel ? 1 : 0.9 });
    for (let i = 0; i < 10; i++) {
      const e = this.board[i]; if (!e) break;
      const yy = by + i * 9, hl = this.lastEntry && e === this.lastEntry && Math.floor(t * 4) % 2 === 0;
      const col = hl ? '#ffe040' : (i === 0 ? '#fff' : '#bbb');
      txt((i + 1) + '.', W / 2 - 70, yy, { color: col, size: 0.9 });
      txt(e.name, W / 2 - 50, yy, { color: col, size: 0.9 });
      txt(fmtScore(e.score), W / 2 + 34, yy, { color: col, align: 'right', size: 0.9 });
      txt(e.era, W / 2 + 70, yy, { color: col, align: 'right', size: 0.9 });
    }
    // prompt
    if (Math.floor(t * 2) % 2 === 0) txt(this.input.touchDevice ? 'TAP TO START' : 'PRESS FIRE TO START', W / 2, 292, { color: '#fff', align: 'center', size: pixel ? 1 : 1.1, glow: tier >= 4 ? 8 : 0 });
    txt(this.input.touchDevice ? 'DRAG MOVE   HOLD FIRE   OD BUTTON' : 'ARROWS MOVE  SPACE FIRE  SHIFT OVERDRIVE', W / 2, 304, { color: '#888', align: 'center', size: pixel ? 1 : 0.8 });
    txt(this.input.touchDevice ? 'TAP TOP-RIGHT FOR OPTIONS' : 'O = OPTIONS', W / 2, 314, { color: '#666', align: 'center', size: pixel ? 1 : 0.8 });
    txt('A PLAYABLE HISTORY OF THE ARCADE 1983 - 20XX', W / 2, H - 9, { color: '#555', align: 'center', size: pixel ? 0.8 : 0.7 });
    if (this.audio.muted) txt('MUTED', W - 6, H - 10, { color: '#a44', align: 'right', size: 0.8 });
    if (this.optionsOpen) this.drawOptions(ctx);
    this.tier = saveTier;
    return S;
  }
  drawGameOver(ctx) {
    const tier = this.tier, pixel = tier <= 2 || tier === 6;
    const a = clamp(this.gameOverT / 0.6, 0, 1);
    ctx.fillStyle = `rgba(0,0,0,${0.7 * a})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = a;
    const txt = (s, x, y, o) => drawText(ctx, s, x, y, Object.assign({ tier }, o));
    let y = 70;
    txt('GAME OVER', W / 2, y, { color: '#ff4040', align: 'center', size: pixel ? 2 : 2.4, glow: tier >= 4 ? 12 : 0 }); y += pixel ? 30 : 36;
    const rows = [['SCORE', fmtScore(this.score)], ['BEST', fmtScore(this.hi)], ['MAX COMBO', 'x' + this.maxCombo], ['ERA REACHED', ERAS[this.maxEra % ERAS.length].year + (this.loop > 1 ? '  LOOP ' + this.loop : '')], ['STAGE', String(this.stageNumber)], ['GRAZES', String(this.grazeCount)], ['LOCAL RANK', this.rank === null ? '--' : '#' + (this.rank + 1)]];
    for (const [k, v] of rows) { txt(k, W / 2 - 4, y, { color: '#aaa', align: 'right', size: pixel ? 1 : 0.95 }); txt(v, W / 2 + 6, y, { color: k === 'LOCAL RANK' && this.rank !== null ? '#ffe040' : '#fff', size: pixel ? 1 : 0.95 }); y += pixel ? 13 : 14; }
    if (this.gameOverT > 0.8 && Math.floor(this.gameOverT * 2) % 2 === 0) txt(this.rank !== null ? 'PRESS FIRE - NEW RECORD' : 'PRESS FIRE', W / 2, y + 16, { color: '#fff', align: 'center', size: pixel ? 1 : 1.1 });
    ctx.restore();
  }
  drawInitials(ctx) {
    const tier = this.tier, pixel = tier <= 2 || tier === 6;
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H);
    const txt = (s, x, y, o) => drawText(ctx, s, x, y, Object.assign({ tier }, o));
    txt('NEW RECORD', W / 2, 90, { color: '#ffe040', align: 'center', size: pixel ? 2 : 2.2, glow: tier >= 4 ? 10 : 0 });
    txt('RANK #' + (this.rank + 1) + '   ' + fmtScore(this.score), W / 2, 118, { color: '#fff', align: 'center', size: pixel ? 1 : 1 });
    txt('ENTER YOUR INITIALS', W / 2, 140, { color: '#aaa', align: 'center', size: pixel ? 1 : 0.9 });
    const I = this.initials;
    for (let i = 0; i < 3; i++) {
      const x = W / 2 - 22 + i * 22, cur = i === I.pos, ch = ALPHABET[I.chars[i]];
      txt(ch === ' ' ? '_' : ch, x, 160, { color: cur && Math.floor(performance.now() / 160) % 2 === 0 ? '#ff4040' : '#fff', align: 'center', size: pixel ? 2 : 2.4 });
      if (cur) { txt('<', x - 14, 166, { color: '#888', align: 'center' }); txt('>', x + 14, 166, { color: '#888', align: 'center' }); }
    }
    txt('LEFT/RIGHT CHANGE   FIRE CONFIRM', W / 2, 200, { color: '#777', align: 'center', size: pixel ? 1 : 0.85 });
  }
}
