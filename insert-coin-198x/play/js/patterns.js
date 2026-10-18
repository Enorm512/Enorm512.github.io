// ---------------------------------------------------------------
// patterns.js : entry flight paths, dive paths, bullet patterns
// ---------------------------------------------------------------
'use strict';

const flipPts = pts => pts.map(p => ({ x: W - p.x, y: p.y }));

const ENTRY = {
  loopLeft: (tx, ty) => new Path([{ x: -16, y: 30 }, { x: 60, y: 95 }, { x: 150, y: 165 }, { x: 115, y: 225 }, { x: 50, y: 190 }, { x: 70, y: 130 }, { x: tx, y: ty }], 90),
  loopRight: (tx, ty) => new Path(flipPts([{ x: -16, y: 30 }, { x: 60, y: 95 }, { x: 150, y: 165 }, { x: 115, y: 225 }, { x: 50, y: 190 }, { x: 70, y: 130 }]).concat([{ x: tx, y: ty }]), 90),
  topLeft: (tx, ty) => new Path([{ x: 90, y: -16 }, { x: 60, y: 80 }, { x: 40, y: 200 }, { x: 100, y: 250 }, { x: 160, y: 200 }, { x: tx, y: ty }], 90),
  topRight: (tx, ty) => new Path(flipPts([{ x: 90, y: -16 }, { x: 60, y: 80 }, { x: 40, y: 200 }, { x: 100, y: 250 }, { x: 160, y: 200 }]).concat([{ x: tx, y: ty }]), 90),
  sideLeft: (tx, ty) => new Path([{ x: -16, y: 230 }, { x: 70, y: 250 }, { x: 170, y: 200 }, { x: 200, y: 120 }, { x: tx, y: ty }], 80),
  sideRight: (tx, ty) => new Path(flipPts([{ x: -16, y: 230 }, { x: 70, y: 250 }, { x: 170, y: 200 }, { x: 200, y: 120 }]).concat([{ x: tx, y: ty }]), 80),
  straight: (tx, ty) => new Path([{ x: tx + 30, y: -16 }, { x: tx - 20, y: ty * 0.5 }, { x: tx, y: ty }], 40),
  spiral: (tx, ty) => new Path([{ x: W / 2, y: -16 }, { x: W / 2 + 70, y: 90 }, { x: W / 2, y: 190 }, { x: W / 2 - 70, y: 120 }, { x: W / 2, y: 60 }, { x: tx, y: ty }], 90),
};
const ENTRY_NAMES = Object.keys(ENTRY);

// Dive paths. e = enemy, g = game. Returns Path in absolute coordinates.
const DIVES = {
  zigzag(e, g) {
    const s = e.x < W / 2 ? 1 : -1, px = g.player.x;
    return new Path([{ x: e.x, y: e.y }, { x: e.x + 45 * s, y: e.y + 60 }, { x: px - 45 * s, y: e.y + 140 }, { x: px + 25 * s, y: H - 60 }, { x: px - 20 * s, y: H + 30 }], 60);
  },
  straight(e, g) {
    const s = e.x < W / 2 ? 1 : -1, px = g.player.x;
    return new Path([{ x: e.x, y: e.y }, { x: lerp(e.x, px, 0.5) + 25 * s, y: (e.y + H) / 2 }, { x: px, y: H + 30 }], 30);
  },
  loop(e, g) {
    const s = e.x < W / 2 ? 1 : -1, px = g.player.x;
    return new Path([{ x: e.x, y: e.y }, { x: e.x + 28 * s, y: e.y + 28 }, { x: e.x, y: e.y + 56 }, { x: e.x - 28 * s, y: e.y + 28 }, { x: e.x, y: e.y }, { x: e.x + 20 * s, y: e.y + 90 }, { x: px, y: H * 0.72 }, { x: px + 35 * s, y: H + 30 }], 80);
  },
  sine(e, g) {
    const px = g.player.x; const pts = [{ x: e.x, y: e.y }];
    for (let i = 1; i <= 5; i++) { const t = i / 5; pts.push({ x: lerp(e.x, px, t) + (i % 2 ? 45 : -45), y: lerp(e.y, H + 30, t) }); }
    return new Path(pts, 60);
  },
  swoop(e, g) {
    const s = e.x < W / 2 ? 1 : -1, px = g.player.x;
    return new Path([{ x: e.x, y: e.y }, { x: e.x - 30 * s, y: e.y + 60 }, { x: px, y: H - 90 }, { x: px + 55 * s, y: H - 50 }, { x: px + 95 * s, y: H - 120 }, { x: e.x + 40 * s, y: -30 }], 80);
  },
};

// ---- bullet patterns (spawn through g.spawnEBullet) ----
const PAT = {
  aimed(g, x, y, speed, o = {}) {
    const a = angleTo(x, y, g.player.x, g.player.y) + (o.offset || 0);
    g.spawnEBullet(x, y, Math.cos(a) * speed, Math.sin(a) * speed, o);
  },
  fan(g, x, y, speed, count, spread, o = {}) {
    const base = o.aim === false ? Math.PI / 2 : angleTo(x, y, g.player.x, g.player.y);
    for (let i = 0; i < count; i++) {
      const a = base + (count === 1 ? 0 : (i / (count - 1) - 0.5) * spread);
      g.spawnEBullet(x, y, Math.cos(a) * speed, Math.sin(a) * speed, o);
    }
  },
  ring(g, x, y, speed, count, phase = 0, o = {}) {
    for (let i = 0; i < count; i++) {
      const a = phase + i / count * TAU;
      if (o.gapAt !== undefined && Math.abs(wrapAngle(a - o.gapAt)) < (o.gapWidth || 0.5)) continue;
      g.spawnEBullet(x, y, Math.cos(a) * speed, Math.sin(a) * speed, o);
    }
  },
  wall(g, y, gapX, gapW, speed, o = {}) {
    for (let x = 8; x < W; x += 12) {
      if (Math.abs(x - gapX) < gapW) continue;
      g.spawnEBullet(x, y, 0, speed, o);
    }
  },
  burst(g, x, y, speed, n, o = {}) {
    for (let i = 0; i < n; i++) { const a = rand(TAU), sp = speed * rand(0.5, 1); g.spawnEBullet(x, y, Math.cos(a) * sp, Math.sin(a) * sp, o); }
  },
};
