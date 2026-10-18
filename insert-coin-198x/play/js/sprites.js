// ---------------------------------------------------------------
// sprites.js : bitmap sprites + era style renderer + pixel font
// One bitmap per species; the renderer re-draws it in 8 era styles:
//  tier0 1983 pixels (2 colors) | tier1 1988 pixels | tier2 1992 shaded pixels
//  tier3 1997 flat polygons    | tier4 2005 smooth+glow | tier5 2015 neon
//  tier6 2025 pixels+neon aura | tier7 20XX hologram
// ---------------------------------------------------------------
'use strict';

const SPRITE_SCALE = [1.25, 1.25, 1.25, 1.25, 1.25, 1.25, 1.25, 1.25];   // same enemy size in every era

function mirror(rows) { return rows.map(r => r + r.slice(0, -1).split('').reverse().join('')); }

const SPR = {};
function parseRows(rows) {
  const h = rows.length, w = rows[0].length;
  const g = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = rows[y][x];
    g[y * w + x] = (c === '.' || c === ' ' || c === undefined) ? 0 : parseInt(c, 16) || 0;
  }
  return { w, h, g };
}
// second animation frame: outer columns shifted down one cell (wing flap)
function flapFrame(rows) {
  const w = rows[0].length, h = rows.length;
  const grid = rows.map(r => r.split(''));
  const out = grid.map(r => r.slice());
  const edge = Math.max(2, Math.floor(w / 3));
  for (let x = 0; x < w; x++) {
    if (x >= edge && x < w - edge) continue;
    for (let y = 0; y < h; y++) out[y][x] = '.';
    for (let y = 0; y < h - 1; y++) out[y + 1][x] = grid[y][x];
  }
  return out.map(r => r.join(''));
}
function defSprite(name, rows, pal, pal83, opts = {}) {
  const frames = [parseRows(rows)];
  if (opts.flap) frames.push(parseRows(flapFrame(rows)));
  if (opts.frames) opts.frames.forEach(r => frames.push(parseRows(r)));
  SPR[name] = { name, w: frames[0].w, h: frames[0].h, frames, pal, pal83: pal83 || [pal[0], pal[2]], hit: opts.hit || 0.8 };
  return SPR[name];
}
// pal indices: 1 primary, 2 secondary, 3 accent, 4 dark, 5 white, 6 eye/glow
// 1983 palette collapses: 1,2,4 -> pal83[0] ; 3,5,6 -> pal83[1]

// ---- Player ship "VIPER" ----
defSprite('player', mirror([
  '.......1', '.......1', '......11', '......15', '......15', '.....115', '.....115',
  '1....122', '1...1122', '11..1122', '11.11122', '11111122', '11111122', '1111.112', '11....13', '.3....3.'
]), ['#e8e8ff', '#ff3040', '#40c8ff', '#6060a0', '#ffffff', '#ffd040'], ['#ffffff', '#ff3040'], { hit: 0.55 });

// ---- Enemy species ----
defSprite('drone', mirror(['1....', '.1...', '..111', '.1612', '11111', '1.112', '..1.1', '.1...']),
  ['#ff4040', '#ffb020', '#ff80c0', '#801020', '#fff', '#ffff60'], ['#ff4040', '#ffff60'], { flap: true });
defSprite('moth', mirror(['....1..', '.....1.', '..11.12', '.1111.2', '1111112', '1113112', '.113112', '..11.12', '...1..2', '......2']),
  ['#40a0ff', '#ffe040', '#ff60a0', '#203080', '#fff', '#ffff80'], ['#40a0ff', '#ffe040'], { flap: true });
defSprite('crab', mirror(['.1......', '..1.....', '..111111', '.1116111', '11111111', '1.112222', '1..1.1.1', '...1.1..', '..1.....']),
  ['#40e040', '#ffd020', '#ff4040', '#105020', '#fff', '#ffff80'], ['#40e040', '#ffd020'], { flap: true });
defSprite('commander', mirror(['......1', '.....11', '....1.1', '...1131', '..11611', '.112221', '1122222', '1.11211', '..1.1.1', '.1.....', '1......']),
  ['#c060ff', '#40ffe0', '#ffe040', '#401060', '#fff', '#ffffff'], ['#c060ff', '#ffe040']);
defSprite('shielder', mirror(['....111', '..11222', '.112222', '1126222', '1122222', '1112221', '.111111', '..11.11', '.1..1.1', '1....1.']),
  ['#ff8020', '#c04010', '#60e0ff', '#602000', '#fff', '#ffff40'], ['#ff8020', '#60e0ff']);
defSprite('bonus', mirror(['......11', '....1331', '..111111', '11161616', '..111111', '....1..1', '.....1.1']),
  ['#ffe040', '#ff8000', '#ff40ff', '#806000', '#fff', '#ffffff'], ['#ffe040', '#ff40ff'], { frames: [mirror(['......11', '....1331', '..111111', '11116161', '..111111', '....1..1', '.....1.1'])] });
defSprite('hunter', mirror(['1......', '1......', '11.....', '11....1', '111..11', '111.122', '1111222', '.116222', '..11222', '...1122', '....112', '.....13']),
  ['#e0e0e0', '#2060ff', '#ff4040', '#404060', '#fff', '#ff4040'], ['#e0e0e0', '#2060ff']);
defSprite('turret', mirror(['...111', '.11222', '.12222', '122232', '122333', '122232', '.12222', '.11222', '...111']),
  ['#a0a0a0', '#606070', '#ff6020', '#303040', '#fff', '#ff6020'], ['#a0a0a0', '#ff6020']);
defSprite('carrier', mirror(['........1', '......111', '....11222', '..1122222', '111224442', '111224442', '111222222', '.11121212', '..1111111', '....1..1.', '.....3..3']),
  ['#80a0c0', '#405070', '#60e0ff', '#102030', '#fff', '#60e0ff'], ['#80a0c0', '#60e0ff']);
defSprite('diver3d', mirror(['......1', '.....11', '.....12', '....112', '....122', '...1122', '...1222', '..11262', '.111222', '1111.11', '1.....3']),
  ['#f0f0f0', '#4060e0', '#ffa000', '#303060', '#fff', '#ff4060'], ['#f0f0f0', '#ffa000']);
defSprite('kamikaze', mirror(['....1', '....1', '...11', '...12', '..112', '..122', '.1122', '.1222', '11221', '1..13', '...3.']),
  ['#ff6000', '#ffe000', '#ff2020', '#602000', '#fff', '#fff'], ['#ff6000', '#ffe000']);
defSprite('gunship', mirror(['......11', '.....112', '....1122', '..111222', '.1112222', '11122622', '11122222', '11112222', '1.111222', '1..11122', '3...1..3']),
  ['#607080', '#304050', '#ff4080', '#101820', '#fff', '#ff4080'], ['#607080', '#ff4080']);
defSprite('spiral', mirror(['....111', '...1122', '..11222', '.112223', '.122233', '1122333', '1223336', '1122333', '.122233', '.112223', '..11222', '...1122', '....111']),
  ['#ff20c0', '#8010a0', '#ffe060', '#300840', '#fff', '#ffffff'], ['#ff20c0', '#ffe060']);
defSprite('ring', mirror(['......1', '.....13', '....133', '...1333', '..13333', '.133363', '..13333', '...1333', '....133', '.....13', '......1']),
  ['#20ffd0', '#108070', '#1060a0', '#083030', '#fff', '#ffffff'], ['#20ffd0', '#fff']);
defSprite('glitch', mirror(['1.....1', '.1...11', '..1.121', '...1222', '..11262', '.1.1222', '1..1222', '.1.1222', '..11262', '...1222', '..1.121', '.1...11', '1.....1']),
  ['#80ffff', '#ff40ff', '#ffffff', '#204060', '#fff', '#ffffff'], ['#80ffff', '#ff40ff']);

// Power-up pod
defSprite('pod', mirror(['..111', '.1222', '12222', '12222', '.1222', '..111']),
  ['#ffffff', '#2040a0', '#60c0ff', '#102040', '#fff', '#fff'], ['#fff', '#60c0ff']);
// Drone companion
defSprite('option', mirror(['..1', '.12', '112', '.12', '..1']),
  ['#ffd040', '#ff8000', '#fff', '#604000', '#fff', '#fff'], ['#ffd040', '#fff']);

// ---------------- marching squares ----------------
const MSP = { TL: [0, 0], TR: [1, 0], BR: [1, 1], BL: [0, 1], MT: [.5, 0], MR: [1, .5], MB: [.5, 1], ML: [0, .5] };
const MS = [
  { p: [], e: [] },
  { p: [['ML', 'MB', 'BL']], e: [['ML', 'MB']] },
  { p: [['MB', 'MR', 'BR']], e: [['MB', 'MR']] },
  { p: [['ML', 'MR', 'BR', 'BL']], e: [['ML', 'MR']] },
  { p: [['MT', 'TR', 'MR']], e: [['MT', 'MR']] },
  { p: [['MT', 'TR', 'MR'], ['ML', 'MB', 'BL']], e: [['MT', 'MR'], ['ML', 'MB']] },
  { p: [['MT', 'TR', 'BR', 'MB']], e: [['MT', 'MB']] },
  { p: [['MT', 'TR', 'BR', 'BL', 'ML']], e: [['MT', 'ML']] },
  { p: [['TL', 'MT', 'ML']], e: [['MT', 'ML']] },
  { p: [['TL', 'MT', 'MB', 'BL']], e: [['MT', 'MB']] },
  { p: [['TL', 'MT', 'ML'], ['MB', 'MR', 'BR']], e: [['MT', 'ML'], ['MB', 'MR']] },
  { p: [['TL', 'MT', 'MR', 'BR', 'BL']], e: [['MT', 'MR']] },
  { p: [['TL', 'TR', 'MR', 'ML']], e: [['ML', 'MR']] },
  { p: [['TL', 'TR', 'MR', 'MB', 'BL']], e: [['MR', 'MB']] },
  { p: [['TL', 'TR', 'BR', 'MB', 'ML']], e: [['MB', 'ML']] },
  { p: [['TL', 'TR', 'BR', 'BL']], e: [] },
];
// Build fill + edge Path2D for a frame. Coordinates in cell units; cell (x,y) spans x..x+1.
function buildContour(frame) {
  const { w, h, g } = frame;
  const filled = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : (g[y * w + x] ? 1 : 0);
  const fill = new Path2D(), edges = new Path2D();
  const segs = [];
  for (let j = -1; j < h; j++) for (let i = -1; i < w; i++) {
    const idx = filled(i, j) * 8 + filled(i + 1, j) * 4 + filled(i + 1, j + 1) * 2 + filled(i, j + 1);
    if (!idx) continue;
    const c = MS[idx];
    const ox = i + 0.5, oy = j + 0.5;
    for (const poly of c.p) {
      poly.forEach((k, n) => { const q = MSP[k]; if (n === 0) fill.moveTo(ox + q[0], oy + q[1]); else fill.lineTo(ox + q[0], oy + q[1]); });
      fill.closePath();
    }
    for (const e of c.e) {
      const a = MSP[e[0]], b = MSP[e[1]];
      edges.moveTo(ox + a[0], oy + a[1]); edges.lineTo(ox + b[0], oy + b[1]);
      segs.push([ox + a[0], oy + a[1], ox + b[0], oy + b[1]]);
    }
  }
  return { fill, edges, segs };
}

// ---------------- sprite cache + renderer ----------------
const spriteCache = new Map();
function getSpriteImage(name, frame, tier, variant, cell) {
  const def = SPR[name];
  if (!def) throw new Error('no sprite ' + name);
  frame = frame % def.frames.length;
  if (tier <= 2 || tier === 6) cell = Math.max(1, Math.round(cell));
  const key = name + '|' + frame + '|' + tier + '|' + variant + '|' + cell.toFixed(2);
  let img = spriteCache.get(key);
  if (!img) { img = renderSprite(def, def.frames[frame], tier, variant, cell); spriteCache.set(key, img); }
  return img;
}

function renderSprite(def, fr, tier, variant, cell) {
  const glow = (tier >= 4) ? cell * 3 : 0;
  const padC = 2;
  const padPx = padC * cell + glow;
  const cw = Math.ceil(fr.w * cell + padPx * 2), ch = Math.ceil(fr.h * cell + padPx * 2);
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d');
  g.translate(padPx, padPx);
  g.scale(cell, cell);
  const flash = variant === 'flash';
  const dark = variant === 'dark';
  const pal = def.pal;
  const color = idx => {
    if (flash) return '#ffffff';
    if (dark) return '#000000';
    if (tier === 0) return (idx === 3 || idx === 5 || idx === 6) ? def.pal83[1] : def.pal83[0];
    return pal[idx - 1] || pal[0];
  };
  const { w, h, g: grid } = fr;
  const cellAt = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : grid[y * w + x];
  const drawCells = (fn) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = grid[y * w + x]; if (v) fn(x, y, v); }
  };
  const rect = (x, y, c, grow = 0.02) => { g.fillStyle = c; g.fillRect(x - grow, y - grow, 1 + grow * 2, 1 + grow * 2); };
  const finish = () => ({ canvas: cv, ox: padPx + fr.w * cell / 2, oy: padPx + fr.h * cell / 2, cell, w: fr.w, h: fr.h });

  if (tier === 0 || tier === 1) {
    drawCells((x, y, v) => rect(x, y, color(v)));
    return finish();
  }
  if (tier === 2) {
    // 16-bit: outline + shaded pixels
    if (!flash) {
      g.fillStyle = '#000';
      for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
        if (cellAt(x, y)) continue;
        if (cellAt(x - 1, y) || cellAt(x + 1, y) || cellAt(x, y - 1) || cellAt(x, y + 1)) g.fillRect(x, y, 1, 1);
      }
    }
    drawCells((x, y, v) => {
      let c = color(v);
      if (!flash && !dark) {
        if (!cellAt(x, y - 1) || !cellAt(x - 1, y)) c = shade(pal[v - 1] || pal[0], 0.35);
        else if (!cellAt(x, y + 1) || !cellAt(x + 1, y)) c = shade(pal[v - 1] || pal[0], -0.35);
      }
      rect(x, y, c);
    });
    return finish();
  }
  if (tier === 6) {
    // 2025: crisp pixels with neon aura
    const { edges } = buildContour(fr);
    if (!flash && !dark) {
      g.save();
      g.strokeStyle = withAlpha(pal[0], 0.9); g.lineWidth = 0.25; g.lineJoin = 'round';
      g.shadowBlur = cell * 2.5; g.shadowColor = pal[0];
      g.stroke(edges); g.stroke(edges);
      g.restore();
    }
    drawCells((x, y, v) => {
      let c = color(v);
      if (!flash && !dark && !cellAt(x, y - 1)) c = shade(pal[v - 1] || pal[0], 0.3);
      rect(x, y, c);
    });
    return finish();
  }

  // polygon based tiers (3,4,5,7): smooth silhouette mask derived from the bitmap
  const { fill, segs } = buildContour(fr);
  const mask = makeMask(fill, cw, ch, cell, padPx, tier === 3 ? 0.45 : 0.55);
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (flash || dark) { g.drawImage(tintMask(mask, flash ? '#ffffff' : '#000000'), 0, 0); return finish(); }
  const body = document.createElement('canvas'); body.width = cw; body.height = ch;
  const b = body.getContext('2d');
  b.translate(padPx, padPx); b.scale(cell, cell);
  const innerCells = (alpha = 1, dim = 0) => {
    drawCells((x, y, v) => { if (v !== 1) { let c = color(v); if (dim) c = mixHex(pal[v - 1] || pal[0], '#000000', dim); b.globalAlpha = alpha; b.fillStyle = c; b.fillRect(x - 0.05, y - 0.05, 1.1, 1.1); } });
    b.globalAlpha = 1;
  };
  const applyMask = () => { b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'destination-in'; b.drawImage(mask, 0, 0); b.globalCompositeOperation = 'source-over'; };
  if (tier === 3) {
    // 1997 flat-shaded polygons
    const grad = b.createLinearGradient(0, 0, w, h); const base = pal[0];
    grad.addColorStop(0, shade(base, 0.45)); grad.addColorStop(0.34, shade(base, 0.45)); grad.addColorStop(0.34, base); grad.addColorStop(0.67, base); grad.addColorStop(0.67, shade(base, -0.4)); grad.addColorStop(1, shade(base, -0.4));
    b.fillStyle = grad; b.fillRect(-2, -2, w + 4, h + 4);
    innerCells();
    b.strokeStyle = 'rgba(255,255,255,0.2)'; b.lineWidth = 0.08; b.beginPath();
    for (let i = 0; i < segs.length; i += 2) { const sg = segs[i]; b.moveTo(w / 2, h / 2); b.lineTo((sg[0] + sg[2]) / 2, (sg[1] + sg[3]) / 2); }
    b.stroke();
    applyMask();
    g.drawImage(body, 0, 0);
    g.drawImage(band(mask, 'rgba(255,255,255,0.6)', cell * 0.16), 0, 0);
    return finish();
  }
  if (tier === 4) {
    // 2005 smooth shading + glow
    const grad = b.createRadialGradient(w * 0.35, h * 0.3, 0.5, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    grad.addColorStop(0, shade(pal[0], 0.5)); grad.addColorStop(0.5, pal[0]); grad.addColorStop(1, shade(pal[0], -0.55));
    b.fillStyle = grad; b.fillRect(-2, -2, w + 4, h + 4);
    innerCells();
    const spec = b.createLinearGradient(0, 0, 0, h); spec.addColorStop(0, 'rgba(255,255,255,0.35)'); spec.addColorStop(0.45, 'rgba(255,255,255,0)'); spec.addColorStop(1, 'rgba(0,0,0,0.25)');
    b.fillStyle = spec; b.fillRect(-2, -2, w + 4, h + 4);
    applyMask();
    g.save(); g.shadowBlur = glow; g.shadowColor = withAlpha(pal[0], 0.7); g.drawImage(body, 0, 0); g.restore();
    g.drawImage(body, 0, 0);
    g.drawImage(band(mask, 'rgba(0,0,0,0.4)', cell * 0.12), 0, 0);
    return finish();
  }
  if (tier === 5) {
    // 2015 neon: dark body, glowing outline
    b.fillStyle = mixHex(pal[3] || '#000', '#000000', 0.5); b.fillRect(-2, -2, w + 4, h + 4);
    innerCells(0.9, 0.45);
    applyMask();
    g.drawImage(body, 0, 0);
    const neon = band(mask, pal[0], cell * 0.42), core = band(mask, '#ffffff', cell * 0.14);
    g.save(); g.shadowBlur = glow; g.shadowColor = pal[0]; g.drawImage(neon, 0, 0); g.drawImage(neon, 0, 0);
    g.shadowBlur = glow * 0.4; g.drawImage(core, 0, 0);
    g.shadowBlur = glow * 0.8; g.shadowColor = pal[5] || '#fff';
    g.translate(padPx, padPx); g.scale(cell, cell);
    drawCells((x, y, v) => { if (v === 6 || v === 3) { g.fillStyle = v === 6 ? (pal[5] || '#fff') : pal[2]; g.fillRect(x + 0.1, y + 0.1, 0.8, 0.8); } });
    g.restore();
    return finish();
  }
  // tier 7: hologram
  b.fillStyle = withAlpha(pal[0], 0.2); b.fillRect(-2, -2, w + 4, h + 4);
  b.fillStyle = withAlpha(pal[0], 0.3); for (let y = 0; y < h; y += 0.5) b.fillRect(-2, y, w + 4, 0.2);
  drawCells((x, y, v) => { if (v !== 1) { b.fillStyle = withAlpha(pal[v - 1] || pal[0], 0.8); b.beginPath(); b.arc(x + 0.5, y + 0.5, 0.3, 0, TAU); b.fill(); } });
  applyMask();
  g.drawImage(body, 0, 0);
  const lg = g.createLinearGradient(0, 0, cw, ch); lg.addColorStop(0, pal[0]); lg.addColorStop(1, pal[1]);
  const hb = band(mask, lg, cell * 0.28);
  g.save(); g.shadowBlur = glow; g.shadowColor = pal[0]; g.drawImage(hb, 0, 0); g.drawImage(hb, 0, 0); g.restore();
  return finish();
}

// ---- silhouette helpers (blur + threshold = rounded corners) ----
function makeMask(fill, cw, ch, cell, padPx, blurCells) {
  const tmp = document.createElement('canvas'); tmp.width = cw; tmp.height = ch;
  const tx = tmp.getContext('2d'); tx.translate(padPx, padPx); tx.scale(cell, cell); tx.fillStyle = '#fff'; tx.fill(fill);
  const m = document.createElement('canvas'); m.width = cw; m.height = ch;
  const mx = m.getContext('2d');
  if ('filter' in mx) { mx.filter = 'blur(' + (blurCells * cell).toFixed(2) + 'px)'; mx.drawImage(tmp, 0, 0); mx.filter = 'none'; }
  else mx.drawImage(tmp, 0, 0);
  const id = mx.getImageData(0, 0, cw, ch), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const on = d[i + 3] > 115; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = on ? 255 : 0; }
  mx.putImageData(id, 0, 0);
  return m;
}
function tintMask(mask, style) {
  const c = document.createElement('canvas'); c.width = mask.width; c.height = mask.height; const x = c.getContext('2d');
  x.drawImage(mask, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = style; x.fillRect(0, 0, c.width, c.height); return c;
}
function morph(mask, r, erode) {
  const c = document.createElement('canvas'); c.width = mask.width; c.height = mask.height; const x = c.getContext('2d');
  x.drawImage(mask, 0, 0); x.globalCompositeOperation = erode ? 'destination-in' : 'source-over';
  const n = 12; for (let i = 0; i < n; i++) { const a = i / n * TAU; x.drawImage(mask, Math.cos(a) * r, Math.sin(a) * r); }
  return c;
}
function band(mask, style, width) {
  const outer = morph(mask, width / 2, false), inner = morph(mask, width / 2, true);
  const x = outer.getContext('2d');
  x.globalCompositeOperation = 'destination-out'; x.drawImage(inner, 0, 0);
  x.globalCompositeOperation = 'source-in'; x.fillStyle = style; x.fillRect(0, 0, outer.width, outer.height);
  return outer;
}

// Draw a sprite centered at logical (x,y). ctx is scaled by rs (device px per logical unit).
// opts: tier, frame, variant, rot, scale, alpha, sx/sy (3D wobble), rs
function drawSprite(ctx, name, x, y, o) {
  const tier = o.tier | 0, rs = o.rs || 1, scale = (o.scale || 1);
  const cell = SPRITE_SCALE[tier] * rs * scale;
  const img = getSpriteImage(name, o.frame || 0, tier, o.variant || 'n', cell);
  const inv = 1 / rs;
  let px = x, py = y;
  if (tier <= 2) { px = Math.round(px); py = Math.round(py); }
  ctx.save();
  ctx.translate(px, py);
  if (o.rot) ctx.rotate(o.rot);
  if (o.sx !== undefined || o.sy !== undefined) ctx.scale(o.sx === undefined ? 1 : o.sx, o.sy === undefined ? 1 : o.sy);
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  ctx.drawImage(img.canvas, -img.ox * inv, -img.oy * inv, img.canvas.width * inv, img.canvas.height * inv);
  ctx.restore();
}
// logical sprite size (w,h) at tier
function spriteSize(name, tier, scale = 1) {
  const d = SPR[name], s = SPRITE_SCALE[tier] * scale;
  return { w: d.w * s, h: d.h * s };
}
// elliptical hitbox radii (half width / half height) for collisions
function spriteRadii(name, tier, scale = 1) {
  const d = SPR[name], s = SPRITE_SCALE[tier] * scale;
  return { rx: d.w * s * 0.5 * d.hit, ry: d.h * s * 0.5 * d.hit };
}
// ellipse-vs-circle overlap test
function hitEllipse(dx, dy, rx, ry, r = 0) { const a = rx + r, b = ry + r; return (dx * dx) / (a * a) + (dy * dy) / (b * b) < 1; }
// hitbox radius for collisions (smaller axis)
function spriteRadius(name, tier, scale = 1) {
  const d = SPR[name], s = SPRITE_SCALE[tier] * scale;
  return Math.min(d.w, d.h) * s * 0.5 * d.hit;
}

// ---------------- 5x7 pixel font ----------------
const FONT = {};
(function () {
  const def = (ch, rows) => FONT[ch] = rows;
  def('A', ['.111.', '1...1', '1...1', '11111', '1...1', '1...1', '1...1']);
  def('B', ['1111.', '1...1', '1...1', '1111.', '1...1', '1...1', '1111.']);
  def('C', ['.1111', '1....', '1....', '1....', '1....', '1....', '.1111']);
  def('D', ['1111.', '1...1', '1...1', '1...1', '1...1', '1...1', '1111.']);
  def('E', ['11111', '1....', '1....', '1111.', '1....', '1....', '11111']);
  def('F', ['11111', '1....', '1....', '1111.', '1....', '1....', '1....']);
  def('G', ['.1111', '1....', '1....', '1.111', '1...1', '1...1', '.1111']);
  def('H', ['1...1', '1...1', '1...1', '11111', '1...1', '1...1', '1...1']);
  def('I', ['11111', '..1..', '..1..', '..1..', '..1..', '..1..', '11111']);
  def('J', ['....1', '....1', '....1', '....1', '1...1', '1...1', '.111.']);
  def('K', ['1...1', '1..1.', '1.1..', '11...', '1.1..', '1..1.', '1...1']);
  def('L', ['1....', '1....', '1....', '1....', '1....', '1....', '11111']);
  def('M', ['1...1', '11.11', '1.1.1', '1.1.1', '1...1', '1...1', '1...1']);
  def('N', ['1...1', '11..1', '1.1.1', '1..11', '1...1', '1...1', '1...1']);
  def('O', ['.111.', '1...1', '1...1', '1...1', '1...1', '1...1', '.111.']);
  def('P', ['1111.', '1...1', '1...1', '1111.', '1....', '1....', '1....']);
  def('Q', ['.111.', '1...1', '1...1', '1...1', '1.1.1', '1..1.', '.11.1']);
  def('R', ['1111.', '1...1', '1...1', '1111.', '1.1..', '1..1.', '1...1']);
  def('S', ['.1111', '1....', '1....', '.111.', '....1', '....1', '1111.']);
  def('T', ['11111', '..1..', '..1..', '..1..', '..1..', '..1..', '..1..']);
  def('U', ['1...1', '1...1', '1...1', '1...1', '1...1', '1...1', '.111.']);
  def('V', ['1...1', '1...1', '1...1', '1...1', '1...1', '.1.1.', '..1..']);
  def('W', ['1...1', '1...1', '1...1', '1.1.1', '1.1.1', '11.11', '1...1']);
  def('X', ['1...1', '1...1', '.1.1.', '..1..', '.1.1.', '1...1', '1...1']);
  def('Y', ['1...1', '1...1', '.1.1.', '..1..', '..1..', '..1..', '..1..']);
  def('Z', ['11111', '....1', '...1.', '..1..', '.1...', '1....', '11111']);
  def('0', ['.111.', '1...1', '1..11', '1.1.1', '11..1', '1...1', '.111.']);
  def('1', ['..1..', '.11..', '..1..', '..1..', '..1..', '..1..', '.111.']);
  def('2', ['.111.', '1...1', '....1', '...1.', '..1..', '.1...', '11111']);
  def('3', ['11111', '...1.', '..1..', '...1.', '....1', '1...1', '.111.']);
  def('4', ['...1.', '..11.', '.1.1.', '1..1.', '11111', '...1.', '...1.']);
  def('5', ['11111', '1....', '1111.', '....1', '....1', '1...1', '.111.']);
  def('6', ['..11.', '.1...', '1....', '1111.', '1...1', '1...1', '.111.']);
  def('7', ['11111', '....1', '...1.', '..1..', '.1...', '.1...', '.1...']);
  def('8', ['.111.', '1...1', '1...1', '.111.', '1...1', '1...1', '.111.']);
  def('9', ['.111.', '1...1', '1...1', '.1111', '....1', '...1.', '.11..']);
  def(' ', ['.....', '.....', '.....', '.....', '.....', '.....', '.....']);
  def('.', ['.....', '.....', '.....', '.....', '.....', '.11..', '.11..']);
  def(',', ['.....', '.....', '.....', '.....', '.....', '..1..', '.1...']);
  def(':', ['.....', '.11..', '.11..', '.....', '.11..', '.11..', '.....']);
  def('-', ['.....', '.....', '.....', '.111.', '.....', '.....', '.....']);
  def('!', ['..1..', '..1..', '..1..', '..1..', '..1..', '.....', '..1..']);
  def('?', ['.111.', '1...1', '....1', '..11.', '..1..', '.....', '..1..']);
  def('x', ['.....', '.....', '1...1', '.1.1.', '..1..', '.1.1.', '1...1']);
  def('#', ['.1.1.', '.1.1.', '11111', '.1.1.', '11111', '.1.1.', '.1.1.']);
  def('/', ['....1', '....1', '...1.', '..1..', '.1...', '1....', '1....']);
  def('>', ['1....', '.1...', '..1..', '...1.', '..1..', '.1...', '1....']);
  def('<', ['....1', '...1.', '..1..', '.1...', '..1..', '...1.', '....1']);
  def('+', ['.....', '..1..', '..1..', '11111', '..1..', '..1..', '.....']);
  def('=', ['.....', '.....', '11111', '.....', '11111', '.....', '.....']);
  def('(', ['..1..', '.1...', '1....', '1....', '1....', '.1...', '..1..']);
  def(')', ['..1..', '...1.', '....1', '....1', '....1', '...1.', '..1..']);
  def("'", ['..1..', '..1..', '.....', '.....', '.....', '.....', '.....']);
  def('%', ['11..1', '11.1.', '..1..', '..1..', '.1.11', '1..11', '.....']);
  def('_', ['.....', '.....', '.....', '.....', '.....', '.....', '11111']);
  def('*', ['.....', '1.1.1', '.111.', '11111', '.111.', '1.1.1', '.....']);
})();

// Pixel text: size = logical units per cell (default 1). Returns width.
function textWidth(str, size = 1) { return str.length * 6 * size - size; }
function drawPixelText(ctx, str, x, y, o = {}) {
  const size = o.size || 1, color = o.color || '#fff';
  str = String(str);
  if (!o.lower) str = str.toUpperCase().replace(/X(?=\d)/g, 'x');
  let w = textWidth(str, size);
  if (o.align === 'center') x -= w / 2; else if (o.align === 'right') x -= w;
  x = Math.round(x); y = Math.round(y);
  if (o.glow) { ctx.save(); ctx.shadowBlur = o.glow; ctx.shadowColor = color; }
  ctx.fillStyle = color;
  for (let i = 0; i < str.length; i++) {
    const gl = FONT[str[i]] || FONT[str[i].toUpperCase()] || FONT['?'];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (gl[r][c] === '1') ctx.fillRect(x + c * size, y + r * size, size, size);
    x += 6 * size;
  }
  if (o.glow) ctx.restore();
  return w;
}
// Era-aware text: pixel font for tiers 0-2,6; vector font otherwise.
function drawText(ctx, str, x, y, o = {}) {
  const tier = o.tier === undefined ? 0 : o.tier;
  const size = o.size || 1;
  if (tier <= 2 || tier === 6) return drawPixelText(ctx, str, x, y, o);
  const px = 8 * size;
  let font;
  if (tier === 3) font = `bold ${px}px "Arial Narrow", "Arial", sans-serif`;
  else if (tier === 4) font = `bold italic ${px}px "Arial Black", "Arial", sans-serif`;
  else if (tier === 5) font = `bold ${px}px "Segoe UI", "Helvetica", sans-serif`;
  else font = `${px}px "Consolas", "Lucida Console", monospace`;
  ctx.save();
  ctx.font = font; ctx.textBaseline = 'top'; ctx.textAlign = o.align || 'left';
  ctx.fillStyle = o.color || '#fff';
  if (o.glow || tier >= 4) { ctx.shadowBlur = o.glow || 6; ctx.shadowColor = o.color || '#fff'; }
  const s = String(str).toUpperCase();
  ctx.fillText(s, x, y - 1);
  const w = ctx.measureText(s).width;
  ctx.restore();
  return w;
}
