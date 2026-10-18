// ---------------------------------------------------------------
// audio.js : WebAudio synth. SFX and a step-sequenced soundtrack that
// evolves from 1983 beeps to chiptune to synthwave to glitch.
// The same 4-bar theme is re-orchestrated in every era.
// ---------------------------------------------------------------
'use strict';

const NOTE = n => 220 * Math.pow(2, n / 12);   // n semitones from A3
const CHORDS = [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]];   // Am F C G
const BASS_ROOT = [0, -4, 3, -2];
// theme: per bar, list of [step, semitone, lengthInSteps]
const THEME = [
  [[0, 12, 2], [2, 15, 2], [4, 19, 2], [6, 17, 2], [8, 15, 3], [12, 12, 2], [14, 10, 2]],
  [[0, 8, 3], [4, 12, 2], [6, 15, 2], [8, 19, 4], [12, 17, 2], [14, 15, 2]],
  [[0, 15, 2], [2, 19, 2], [4, 22, 2], [6, 19, 2], [8, 17, 3], [12, 15, 3]],
  [[0, 14, 2], [2, 17, 2], [4, 14, 3], [8, 10, 2], [10, 12, 2], [12, 14, 2], [14, 17, 2]],
];
const ERA_MUSIC = [
  { bpm: 104, tracks: ['beepBass', 'blip'] },
  { bpm: 128, tracks: ['chipBass', 'chipLead', 'kick', 'hat'] },
  { bpm: 136, tracks: ['chipBass', 'chipLead', 'pad', 'kick', 'snare', 'hat', 'arp'] },
  { bpm: 142, tracks: ['sawBass', 'bellLead', 'pad', 'kick', 'snare', 'hat', 'arp'] },
  { bpm: 150, tracks: ['sawBass', 'sawLead', 'pad', 'kick', 'snare', 'hat', 'arp'] },
  { bpm: 126, tracks: ['sideBass', 'superPad', 'neonLead', 'arp', 'kick', 'snare', 'hat'] },
  { bpm: 148, tracks: ['sideBass', 'superPad', 'chipLead', 'arp', 'kick', 'snare', 'hat'] },
  { bpm: 140, tracks: ['glitchBass', 'glitchLead', 'superPad', 'kick', 'snare', 'hat'] },
];

class AudioSys {
  constructor() {
    this.ctx = null; this.era = 0; this.muted = !!Store.get('mute', false); this.seq = null; this.volMusic = 1; this.volSfx = 1;
    this.music = { start() { }, stop() { }, setIntensity() { }, play() { }, onEra() { } };   // replaced in init()
  }
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.8; this.master.connect(c.destination);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = 0.7; this.sfxBus.connect(this.master);
    this.musBus = c.createGain(); this.musBus.gain.value = 0.42; this.musBus.connect(this.master);
    this.delay = c.createDelay(1); this.delay.delayTime.value = 0.26;
    this.delayFb = c.createGain(); this.delayFb.gain.value = 0.35;
    this.delaySend = c.createGain(); this.delaySend.gain.value = 0;
    this.delaySend.connect(this.delay); this.delay.connect(this.delayFb); this.delayFb.connect(this.delay);
    const dl = c.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 2500;
    this.delay.connect(dl); dl.connect(this.master);
    const len = c.sampleRate;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.fileBus = c.createGain(); this.fileBus.gain.value = 0.5; this.fileBus.connect(this.master);
    this.seq = new Sequencer(this);
    this.music = new MusicPlayer(this); this.music.load();
    console.log('[INSERT COIN] audio context created, state=' + c.state);
    c.onstatechange = () => console.log('[INSERT COIN] audio state=' + c.state);
    this.setEra(this.era); this.setVolumes(this.volMusic, this.volSfx);
  }
  setVolumes(music, sfx) {
    this.volMusic = music; this.volSfx = sfx;
    if (!this.ctx) return;
    this.musBus.gain.setTargetAtTime(0.42 * music, this.now, 0.05);
    this.fileBus.gain.setTargetAtTime(0.5 * music, this.now, 0.05);
    this.sfxBus.gain.setTargetAtTime(0.7 * sfx, this.now, 0.05);
  }
  resume() { if (this.ctx && this.ctx.state !== 'running' && !this.adMuted) this.ctx.resume().catch(() => { }); }
  get now() { return this.ctx ? this.ctx.currentTime : 0; }
  get tier() { return ERAS[this.era].tier; }
  setEra(e) {
    this.era = e;
    if (!this.ctx) return;
    const t = ERAS[e].tier;
    this.delaySend.gain.setTargetAtTime(t >= 5 ? 0.35 : t >= 3 ? 0.22 : t >= 2 ? 0.1 : 0, this.now, 0.5);
    this.seq.setEra(e);
    this.music.onEra(e);
  }
  setAdMute(on) {
    this.adMuted = on;
    if (this.master) this.master.gain.setTargetAtTime(on || this.muted ? 0 : 0.8, this.now, 0.02);
    if (on && this.ctx) this.ctx.suspend(); else this.resume();
  }
  toggleMute() {
    this.muted = !this.muted; Store.set('mute', this.muted);
    if (this.master) this.master.gain.setTargetAtTime(this.muted || this.adMuted ? 0 : 0.8, this.now, 0.02);
    return this.muted;
  }
  // ---- primitives ----
  tone(o) {
    if (!this.ctx) return;
    const c = this.ctx, t = o.t === undefined ? c.currentTime : o.t;
    const osc = c.createOscillator(); osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(Math.max(20, o.f || 440), t);
    if (o.fEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.fEnd), t + (o.dur || 0.1));
    if (o.detune) osc.detune.value = o.detune;
    const g = c.createGain();
    const vel = o.vel === undefined ? 0.2 : o.vel, a = o.a || 0.004, d = o.d || 0.03, s = o.s === undefined ? 0.6 : o.s, r = o.r || 0.04, dur = o.dur || 0.1;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + a);
    g.gain.linearRampToValueAtTime(vel * s, t + a + d);
    g.gain.setValueAtTime(vel * s, t + Math.max(a + d, dur));
    g.gain.linearRampToValueAtTime(0.0001, t + Math.max(a + d, dur) + r);
    let node = osc;
    if (o.fl) {
      const flt = c.createBiquadFilter(); flt.type = o.flType || 'lowpass'; flt.Q.value = o.q || 1;
      flt.frequency.setValueAtTime(o.fl, t);
      if (o.flEnd) flt.frequency.exponentialRampToValueAtTime(Math.max(40, o.flEnd), t + dur);
      osc.connect(flt); node = flt;
    }
    node.connect(g); g.connect(o.dest || this.sfxBus);
    if (o.send) { const sg = c.createGain(); sg.gain.value = o.send; g.connect(sg); sg.connect(this.delaySend); }
    osc.start(t); osc.stop(t + Math.max(a + d, dur) + r + 0.02);
  }
  noise(o) {
    if (!this.ctx) return;
    const c = this.ctx, t = o.t === undefined ? c.currentTime : o.t;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    src.playbackRate.value = o.rate || 1;
    const g = c.createGain();
    const vel = o.vel === undefined ? 0.2 : o.vel, dur = o.dur || 0.1, a = o.a || 0.003;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = src;
    if (o.fl) {
      const flt = c.createBiquadFilter(); flt.type = o.flType || 'lowpass'; flt.Q.value = o.q || 0.8;
      flt.frequency.setValueAtTime(o.fl, t);
      if (o.flEnd) flt.frequency.exponentialRampToValueAtTime(Math.max(40, o.flEnd), t + dur);
      src.connect(flt); node = flt;
    }
    node.connect(g); g.connect(o.dest || this.sfxBus);
    if (o.send) { const sg = c.createGain(); sg.gain.value = o.send; g.connect(sg); sg.connect(this.delaySend); }
    src.start(t); src.stop(t + dur + 0.02);
  }
  // ---- sound effects (era aware) ----
  sfx(name, p = 1) {
    if (!this.ctx || this.muted) return;
    const T = this.tier, send = T >= 3 ? 0.3 : 0;
    switch (name) {
      case 'shoot':
        if (T === 0) this.tone({ type: 'square', f: 900, fEnd: 420, dur: 0.05, vel: 0.12, s: 0.4 });
        else if (T <= 2) this.tone({ type: 'square', f: 1300, fEnd: 300, dur: 0.07, vel: 0.12, s: 0.4 });
        else if (T <= 4) { this.tone({ type: 'sawtooth', f: 700, fEnd: 180, dur: 0.08, vel: 0.14, fl: 2200, flEnd: 300 }); this.noise({ dur: 0.03, vel: 0.06, fl: 4000, flType: 'highpass' }); }
        else { this.tone({ type: 'sawtooth', f: 520, fEnd: 140, dur: 0.09, vel: 0.14, fl: 3000, flEnd: 400, send: 0.1 }); this.tone({ type: 'sine', f: 1800, fEnd: 600, dur: 0.04, vel: 0.08 }); }
        break;
      case 'laser':
        this.tone({ type: T >= 5 ? 'sawtooth' : 'square', f: 90 + Math.random() * 20, dur: 0.05, vel: 0.07, fl: 900 });
        break;
      case 'hit':
        this.noise({ dur: 0.04, vel: 0.12, fl: 2500 }); if (T >= 2) this.tone({ type: 'square', f: 300, fEnd: 120, dur: 0.04, vel: 0.08 });
        break;
      case 'explode': {
        const sz = p;
        if (T === 0) { this.noise({ dur: 0.18 * sz, vel: 0.3, rate: 0.5 }); this.tone({ type: 'square', f: 220, fEnd: 40, dur: 0.15 * sz, vel: 0.18, s: 0.8 }); }
        else if (T <= 2) { this.noise({ dur: 0.28 * sz, vel: 0.35, fl: 3000, flEnd: 200 }); this.tone({ type: 'square', f: 160, fEnd: 30, dur: 0.2 * sz, vel: 0.16, s: 0.7 }); }
        else { this.noise({ dur: 0.4 * sz, vel: 0.4, fl: 4000, flEnd: 120, send }); this.tone({ type: 'sine', f: 130, fEnd: 28, dur: 0.35 * sz, vel: 0.35, s: 0.8 }); if (T >= 5) this.tone({ type: 'sawtooth', f: 90, fEnd: 40, dur: 0.2 * sz, vel: 0.12, fl: 400 }); }
        break;
      }
      case 'bigExplode':
        for (let i = 0; i < 4; i++) { const t = this.now + i * 0.13; this.noise({ t, dur: 0.6, vel: 0.35, fl: 2500, flEnd: 80, send }); this.tone({ t, type: 'sine', f: 110 - i * 15, fEnd: 25, dur: 0.5, vel: 0.35, s: 0.9 }); }
        if (T >= 3) this.noise({ t: this.now + 0.5, dur: 2.0, vel: 0.25, fl: 1200, flEnd: 60, send: 0.4 });
        break;
      case 'playerDie':
        for (let i = 0; i < 6; i++) this.tone({ t: this.now + i * 0.07, type: 'square', f: 600 - i * 80, fEnd: 300 - i * 40, dur: 0.06, vel: 0.14 });
        this.noise({ t: this.now + 0.1, dur: 0.9, vel: 0.35, fl: 2000, flEnd: 100, rate: 0.7 });
        break;
      case 'powerup':
        [0, 4, 7, 12].forEach((n, i) => this.tone({ t: this.now + i * 0.06, type: T >= 3 ? 'sine' : 'square', f: NOTE(12 + n), dur: 0.08, vel: 0.15, send }));
        break;
      case 'coin':
        this.tone({ type: 'square', f: 1046, dur: 0.07, vel: 0.2, s: 0.9 }); this.tone({ t: this.now + 0.08, type: 'square', f: 1568, dur: 0.25, vel: 0.2, s: 0.9, r: 0.1 });
        break;
      case 'extend':
        [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => this.tone({ t: this.now + i * 0.05, type: 'square', f: NOTE(12 + n), dur: 0.06, vel: 0.16, send }));
        break;
      case 'combo':
        this.tone({ type: T >= 3 ? 'triangle' : 'square', f: NOTE(19 + Math.min(p, 6) * 2), dur: 0.05, vel: 0.14, send }); this.tone({ t: this.now + 0.05, type: T >= 3 ? 'triangle' : 'square', f: NOTE(26 + Math.min(p, 6) * 2), dur: 0.09, vel: 0.14, send });
        break;
      case 'graze':
        this.tone({ type: 'sine', f: 2400, fEnd: 3200, dur: 0.025, vel: 0.07 });
        break;
      case 'bossHit':
        this.tone({ type: 'square', f: 240, fEnd: 90, dur: 0.05, vel: 0.1 }); this.noise({ dur: 0.05, vel: 0.1, fl: 1500, flType: 'bandpass', q: 3 });
        break;
      case 'shieldHit':
        this.tone({ type: 'triangle', f: 500, fEnd: 900, dur: 0.08, vel: 0.14 });
        break;
      case 'warning':
        for (let i = 0; i < 3; i++) { this.tone({ t: this.now + i * 0.5, type: 'sawtooth', f: 380, fEnd: 620, dur: 0.22, vel: 0.14, fl: 1500 }); this.tone({ t: this.now + i * 0.5 + 0.24, type: 'sawtooth', f: 620, fEnd: 380, dur: 0.22, vel: 0.14, fl: 1500 }); }
        break;
      case 'upgrade':
        this.noise({ dur: 1.6, vel: 0.25, fl: 200, flEnd: 6000 });
        this.tone({ type: 'square', f: 80, fEnd: 2400, dur: 1.5, vel: 0.12, s: 1 });
        [0, 7, 12, 19, 24].forEach((n, i) => this.tone({ t: this.now + 1.5 + i * 0.07, type: 'square', f: NOTE(12 + n), dur: 0.12, vel: 0.16, send: 0.3 }));
        break;
      case 'glitch':
        for (let i = 0; i < 8; i++) this.tone({ t: this.now + i * 0.04, type: 'square', f: 100 + Math.random() * 3000, dur: 0.03, vel: 0.1 });
        break;
      case 'special':
        this.noise({ dur: 1.0, vel: 0.18, fl: 5000, flEnd: 120, send });
        [0, 3, 7, 12].forEach(n => this.tone({ type: 'sawtooth', f: NOTE(n), dur: 0.8, vel: 0.045, fl: 2500, flEnd: 200, send }));
        break;
      case 'menu':
        this.tone({ type: 'square', f: 880, dur: 0.04, vel: 0.1 });
        break;
      case 'stageClear':
        [0, 4, 7, 12, 7, 12, 16, 19].forEach((n, i) => this.tone({ t: this.now + i * 0.08, type: 'square', f: NOTE(12 + n), dur: 0.1, vel: 0.14, send }));
        break;
      case 'respawn':
        [0, 12, 24].forEach((n, i) => this.tone({ t: this.now + i * 0.09, type: 'triangle', f: NOTE(n), dur: 0.1, vel: 0.14 }));
        break;
    }
  }
}

// ---------------- music sequencer ----------------
class Sequencer {
  constructor(a) {
    this.a = a; this.era = 0; this.bpm = 104; this.step = 0; this.bar = 0; this.nextTime = 0; this.timer = null; this.playing = false;
    this.intensity = 0; this.tracks = ERA_MUSIC[0].tracks; this.pendingEra = null; this.fade = 1;
  }
  setEra(e) { this.pendingEra = e; if (!this.playing) this.applyEra(); }
  applyEra() { if (this.pendingEra === null) return; this.era = this.pendingEra; this.pendingEra = null; const m = ERA_MUSIC[this.era]; this.bpm = m.bpm; this.tracks = m.tracks; }
  start() {
    if (this.playing || !this.a.ctx) return;
    this.playing = true; this.step = 0; this.bar = 0; this.nextTime = this.a.now + 0.1;
    this.applyEra();
    this.timer = setInterval(() => this.tick(), 30);
  }
  stop() { this.playing = false; if (this.timer) clearInterval(this.timer); this.timer = null; }
  setIntensity(v) { this.intensity = v; }
  tick() {
    if (!this.a.ctx) return;
    const c = this.a.ctx;
    if (this.a.muted) { this.nextTime = Math.max(this.nextTime, c.currentTime); return; }
    while (this.nextTime < c.currentTime + 0.14) {
      if (this.step === 0 && this.pendingEra !== null) this.applyEra();
      this.playStep(this.step, this.bar, this.nextTime);
      this.nextTime += 60 / this.bpm / 4;
      this.step++; if (this.step >= 16) { this.step = 0; this.bar++; }
    }
  }
  playStep(s, bar, t) {
    const a = this.a, b4 = bar & 3, chord = CHORDS[b4], root = BASS_ROOT[b4], I = this.intensity;
    const dest = a.musBus, spb = 60 / this.bpm / 4;
    const theme = THEME[b4];
    const themeNote = () => theme.find(n => n[0] === s);
    const vb = 1;
    for (const tr of this.tracks) {
      switch (tr) {
        case 'beepBass':
          if (s === 0 || s === 8) a.tone({ t, dest, type: 'square', f: NOTE(root - 24), dur: 0.09, vel: 0.1 * vb, s: 0.5 });
          if ((s === 4 || s === 12) && I > 0.3) a.tone({ t, dest, type: 'square', f: NOTE(root - 12), dur: 0.05, vel: 0.07 });
          break;
        case 'blip': {
          if (((bar >> 2) & 1) === 0 || I > 0.5) { const n = themeNote(); if (n) a.tone({ t, dest, type: 'square', f: NOTE(n[1]), dur: spb * 0.8, vel: 0.07, s: 0.5 }); }
          break;
        }
        case 'chipBass':
          if (s % 2 === 0) a.tone({ t, dest, type: 'square', f: NOTE(root - 24 + ((s % 4 === 2) ? 12 : 0)), dur: spb * 1.6, vel: 0.09, s: 0.6, fl: 900 });
          break;
        case 'sawBass':
          if (s % 2 === 0 || I > 0.5) a.tone({ t, dest, type: 'sawtooth', f: NOTE(root - 24 + ((s % 8 === 6) ? 7 : 0)), dur: spb * 1.5, vel: 0.1, fl: 500 + I * 400, flEnd: 150, s: 0.7 });
          break;
        case 'sideBass': {
          const vel = (s % 4 === 0) ? 0.04 : 0.12;
          if (s % 2 === 0) a.tone({ t, dest, type: 'sawtooth', f: NOTE(root - 24), dur: spb * 1.8, vel, fl: 700, flEnd: 200, s: 0.8, a: 0.02 });
          if (s % 2 === 0) a.tone({ t, dest, type: 'square', f: NOTE(root - 36), dur: spb * 1.8, vel: vel * 0.6, fl: 300, s: 0.8, a: 0.02 });
          break;
        }
        case 'glitchBass': {
          const jump = ((bar * 7 + s * 3) % 11 === 0) ? 7 : 0;
          if (s % 2 === 0) a.tone({ t, dest, type: 'square', f: NOTE(root - 24 + jump), fEnd: s % 8 === 6 ? NOTE(root - 12) : undefined, dur: spb * 1.5, vel: 0.1, fl: 600, s: 0.7 });
          break;
        }
        case 'chipLead': {
          const n = themeNote(); if (n) { a.tone({ t, dest, type: 'square', f: NOTE(n[1]), dur: spb * n[2] * 0.9, vel: 0.075, s: 0.7, d: 0.08, send: 0.2 }); if (I > 0.6) a.tone({ t, dest, type: 'square', f: NOTE(n[1] - 12), dur: spb * n[2] * 0.9, vel: 0.04, s: 0.7 }); }
          break;
        }
        case 'bellLead': {
          const n = themeNote(); if (n) { a.tone({ t, dest, type: 'sine', f: NOTE(n[1] + 12), dur: spb * n[2], vel: 0.12, s: 0.3, d: 0.15, send: 0.4 }); a.tone({ t, dest, type: 'sine', f: NOTE(n[1] + 12) * 2.5, dur: spb * 0.5, vel: 0.05, s: 0.2, d: 0.05 }); }
          break;
        }
        case 'sawLead': {
          const n = themeNote(); if (n) a.tone({ t, dest, type: 'sawtooth', f: NOTE(n[1]), dur: spb * n[2] * 0.9, vel: 0.09, fl: 2600, flEnd: 700, s: 0.6, d: 0.1, send: 0.35, detune: 6 });
          break;
        }
        case 'neonLead': {
          const n = themeNote(); if (n) for (const dt of [-9, 0, 9]) a.tone({ t, dest, type: 'sawtooth', f: NOTE(n[1]), dur: spb * n[2] * 0.95, vel: 0.04, fl: 1800, flEnd: 900, s: 0.7, a: 0.02, d: 0.1, send: 0.45, detune: dt });
          break;
        }
        case 'glitchLead': {
          const n = themeNote();
          if (n) { const sh = ((bar * 5 + s) % 7 === 0) ? 7 : ((bar * 3 + s) % 9 === 0) ? -5 : 0; a.tone({ t, dest, type: sh ? 'sawtooth' : 'square', f: NOTE(n[1] + sh), fEnd: sh ? NOTE(n[1] + sh + 12) : undefined, dur: spb * n[2] * 0.8, vel: 0.08, s: 0.6, send: 0.5, fl: 3000 }); }
          break;
        }
        case 'pad':
          if (s === 0) for (const n of chord) a.tone({ t, dest, type: 'sawtooth', f: NOTE(n), dur: spb * 15, vel: 0.03, fl: 700, s: 0.9, a: 0.1, r: 0.2 });
          break;
        case 'superPad':
          if (s === 0) for (const n of chord) for (const dt of [-12, 0, 12]) a.tone({ t, dest, type: 'sawtooth', f: NOTE(n), dur: spb * 15, vel: 0.02, fl: 1300, s: 0.9, a: 0.15, r: 0.3, detune: dt, send: 0.2 });
          break;
        case 'arp': {
          if (s % 2 === 1 && I < 0.5) break;
          const n = chord[s % 3] + 12 + (s % 6 >= 3 ? 12 : 0);
          a.tone({ t, dest, type: this.era >= 5 ? 'triangle' : 'square', f: NOTE(n), dur: spb * 0.7, vel: 0.045, s: 0.3, send: 0.3 });
          break;
        }
        case 'kick':
          if (s % 4 === 0 || (I > 0.5 && s === 14) || (I > 0.8 && s === 7)) a.tone({ t, dest, type: 'sine', f: 160, fEnd: 38, dur: 0.12, vel: 0.5, s: 0.9, r: 0.05 });
          break;
        case 'snare':
          if (s === 4 || s === 12 || (I > 0.7 && s === 15)) { a.noise({ t, dest, dur: 0.14, vel: 0.22, fl: 1800, flType: 'highpass' }); a.tone({ t, dest, type: 'triangle', f: 200, fEnd: 120, dur: 0.06, vel: 0.2 }); }
          break;
        case 'hat':
          if (s % 2 === 0 || I > 0.4) a.noise({ t, dest, dur: s % 4 === 2 ? 0.07 : 0.03, vel: s % 4 === 2 ? 0.1 : 0.06, fl: 7000, flType: 'highpass' });
          break;
      }
    }
  }
}

// ---------------- file-based music (music/tracks.json) ----------------
// Loops each track by scheduling overlapping playthroughs with a short crossfade,
// switches tracks on era change / boss, and falls back to the Sequencer when a
// file is missing or cannot be decoded.
class MusicPlayer {
  constructor(a) {
    this.a = a; this.tracks = null; this.loaded = false; this.buffers = {}; this.failed = {};
    this.key = null; this.mode = null; this.era = 0; this.active = null; this.timer = null; this.pending = null; this.gen = 0;
  }
  async load() {
    try {
      const r = await fetch('music/tracks.json'); if (!r.ok) throw new Error(r.status); this.tracks = await r.json();
      // Safari / iOS cannot decode Vorbis: use the MP3 copies there
      const probe = document.createElement('audio');
      const ogg = probe.canPlayType && probe.canPlayType('audio/ogg; codecs="vorbis"');
      if (!ogg) for (const k in this.tracks) if (this.tracks[k].mp3) this.tracks[k].file = this.tracks[k].mp3;
    }
    catch (e) { this.tracks = null; }
    this.loaded = true;
    if (this.pending) { const m = this.pending; this.pending = null; this.play(m); }
  }
  async getBuffer(key) {
    if (this.buffers[key]) return this.buffers[key];
    if (this.failed[key] || !this.tracks || !this.tracks[key]) return null;
    try {
      const r = await fetch('music/' + this.tracks[key].file); if (!r.ok) throw new Error(r.status);
      const buf = await this.a.ctx.decodeAudioData(await r.arrayBuffer());
      this.buffers[key] = buf; return buf;
    } catch (e) { console.warn('music: cannot load ' + key, e); this.failed[key] = true; return null; }
  }
  keyFor(mode) { return mode === 'title' ? 'title' : mode === 'boss' ? (this.era <= 5 ? 'boss_a' : 'boss_b') : 'era' + this.era; }
  onEra(e) { this.era = e; if (this.mode === 'stage' || this.mode === 'boss') this.play(this.mode); }
  // facade used by the game (same verbs as the sequencer)
  start() { this.play(this.mode && this.mode !== 'title' ? this.mode : 'stage'); }
  stop(fade = 0.6) { this.mode = null; this.key = null; this.gen++; this.fadeOut(fade); this.a.seq.stop(); }
  setIntensity(v) { this.a.seq.setIntensity(v); this.play(v >= 1 ? 'boss' : 'stage'); }
  async play(mode) {
    this.mode = mode;
    if (!this.a.ctx) return;
    if (!this.loaded) { this.pending = mode; return; }
    const key = this.keyFor(mode);
    if (this.key === key && this.active) return;
    const gen = ++this.gen;
    const buf = await this.getBuffer(key);
    if (gen !== this.gen || this.mode !== mode) return;
    if (!buf) { this.fadeOut(0.5); this.key = null; if (mode === 'title') this.a.seq.stop(); else this.a.seq.start(); return; }
    this.a.seq.stop();
    this.fadeOut(1.2);
    this.key = key;
    const c = this.a.ctx, t = this.tracks[key], now = c.currentTime;
    const g = c.createGain(); g.connect(this.a.fileBus);
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(t.gain || 1, now + 1.0);
    const act = { key, buf, gain: g, sources: [], nextAt: now + 0.05, loopLen: Math.max(1, t.loopEnd - t.loopStart), t };
    this.active = act;
    this.schedule(act);
    if (!this.timer) this.timer = setInterval(() => this.tick(), 200);
  }
  schedule(act) {
    const c = this.a.ctx, xf = 0.6, t = act.t;
    const src = c.createBufferSource(); src.buffer = act.buf;
    const sg = c.createGain(); src.connect(sg); sg.connect(act.gain);
    const t0 = act.nextAt, t1 = t0 + act.loopLen;
    if (act.sources.length) { sg.gain.setValueAtTime(0.0001, t0); sg.gain.exponentialRampToValueAtTime(1, t0 + xf); }
    else sg.gain.setValueAtTime(1, t0);
    sg.gain.setValueAtTime(1, t1 - xf); sg.gain.exponentialRampToValueAtTime(0.0001, t1);
    src.start(t0, t.loopStart, act.loopLen + 0.05);
    act.sources.push(src); if (act.sources.length > 3) act.sources.shift();
    act.nextAt = t1 - xf;
  }
  tick() { const a = this.active; if (!a || !this.a.ctx) return; if (a.nextAt < this.a.ctx.currentTime + 1.5) this.schedule(a); }
  fadeOut(d) {
    const a = this.active; if (!a) return; this.active = null;
    const c = this.a.ctx, now = c.currentTime, gp = a.gain.gain;
    gp.cancelScheduledValues(now); gp.setValueAtTime(Math.max(gp.value, 0.0001), now); gp.exponentialRampToValueAtTime(0.0001, now + d);
    for (const s of a.sources) { try { s.stop(now + d + 0.05); } catch (e) { } }
  }
}
