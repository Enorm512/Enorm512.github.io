// ---------------------------------------------------------------
// eras.js : the 8 hardware generations the cabinet evolves through
// ---------------------------------------------------------------
'use strict';

const ERAS = [
  {
    id: 0, year: '1983', name: 'CLASSIC ARCADE', sub: 'SYSTEM-83 BOARD', tier: 0, rs: 4,
    maxMult: 1, shots: 3, fireDelay: 0.22, bulletSpeed: 250, playerSpeed: 105,
    hud: { label: '#ff2a2a', value: '#ffffff', hi: '#ff2a2a', stage: '#00e0ff' },
    pool: ['drone', 'moth', 'crab'], bullet: 'dot', upgrades: false,
    enemyBulletSpeed: 85, diveRate: 0.9, hpMul: 1, bossName: 'MOTHER BRAIN'
  },
  {
    id: 1, year: '1988', name: 'ADVANCED 8-BIT', sub: 'SYSTEM-88 BOARD', tier: 1, rs: 4,
    maxMult: 2, shots: 3, fireDelay: 0.2, bulletSpeed: 250, playerSpeed: 115,
    hud: { label: '#ffb000', value: '#ffffff', hi: '#ff5050', stage: '#60d0ff' },
    pool: ['drone', 'moth', 'crab', 'commander', 'shielder', 'bonus'], bullet: 'pellet', upgrades: false,
    enemyBulletSpeed: 90, diveRate: 0.95, hpMul: 1, bossName: 'DREADNOUGHT'
  },
  {
    id: 2, year: '1992', name: '16-BIT GENERATION', sub: 'SYSTEM-92 BOARD', tier: 2, rs: 4,
    maxMult: 5, shots: 4, fireDelay: 0.16, bulletSpeed: 270, playerSpeed: 125,
    hud: { label: '#ffd040', value: '#ffffff', hi: '#ff70a0', stage: '#80e0ff' },
    pool: ['drone', 'moth', 'crab', 'commander', 'shielder', 'bonus', 'hunter', 'turret', 'carrier'], bullet: 'pellet', upgrades: true,
    enemyBulletSpeed: 100, diveRate: 1.1, hpMul: 1.0, bossName: 'OUROBOROS'
  },
  {
    id: 3, year: '1997', name: 'EARLY 3D ARCADE', sub: 'SYSTEM-97 3D BOARD', tier: 3, rs: 4,
    maxMult: 10, shots: 5, fireDelay: 0.14, bulletSpeed: 290, playerSpeed: 130,
    hud: { label: '#80ff80', value: '#ffffff', hi: '#ffe060', stage: '#60ffe0' },
    pool: ['drone', 'moth', 'crab', 'commander', 'shielder', 'bonus', 'hunter', 'carrier', 'diver3d'], bullet: 'poly', upgrades: true,
    enemyBulletSpeed: 108, diveRate: 1.25, hpMul: 1.15, bossName: 'ORBITAL CITADEL'
  },
  {
    id: 4, year: '2005', name: 'MODERN ARCADE', sub: 'SYSTEM-05 HD BOARD', tier: 4, rs: 4,
    maxMult: 25, shots: 7, fireDelay: 0.12, bulletSpeed: 320, playerSpeed: 140,
    hud: { label: '#ff9020', value: '#ffffff', hi: '#ffe060', stage: '#60c0ff' },
    pool: ['drone', 'moth', 'crab', 'commander', 'shielder', 'bonus', 'hunter', 'carrier', 'diver3d', 'kamikaze', 'gunship'], bullet: 'trail', upgrades: true,
    enemyBulletSpeed: 112, diveRate: 1.35, hpMul: 1.4, bossName: 'LEVIATHAN CARRIER'
  },
  {
    id: 5, year: '2015', name: 'NEON BULLET ARCADE', sub: 'SYSTEM-15 GPU BOARD', tier: 5, rs: 4,
    maxMult: 50, shots: 9, fireDelay: 0.1, bulletSpeed: 340, playerSpeed: 150,
    hud: { label: '#ff40c0', value: '#ffffff', hi: '#40ffe0', stage: '#ffe040' },
    pool: ['drone', 'moth', 'crab', 'commander', 'shielder', 'bonus', 'hunter', 'carrier', 'diver3d', 'kamikaze', 'gunship', 'spiral', 'ring'], bullet: 'neon', upgrades: true,
    enemyBulletSpeed: 105, diveRate: 1.45, hpMul: 1.7, bossName: 'HIVE EMPRESS'
  },
  {
    id: 6, year: '2025', name: 'MODERN RETRO', sub: 'SYSTEM-25 NEO BOARD', tier: 6, rs: 4,
    maxMult: 100, shots: 10, fireDelay: 0.09, bulletSpeed: 360, playerSpeed: 155,
    hud: { label: '#40ffd0', value: '#ffffff', hi: '#ff60a0', stage: '#ffd040' },
    pool: ['drone', 'moth', 'crab', 'commander', 'shielder', 'bonus', 'hunter', 'carrier', 'diver3d', 'kamikaze', 'gunship', 'spiral', 'ring'], bullet: 'neon', upgrades: true,
    enemyBulletSpeed: 110, diveRate: 1.45, hpMul: 1.8, bossName: 'THE ADAPTER'
  },
  {
    id: 7, year: '20XX', name: 'UNKNOWN HARDWARE', sub: 'SYSTEM-?? BOARD', tier: 7, rs: 4,
    maxMult: 100, shots: 12, fireDelay: 0.08, bulletSpeed: 380, playerSpeed: 160,
    hud: { label: '#80ffff', value: '#ffffff', hi: '#ff40ff', stage: '#ffffff' },
    pool: ['drone', 'moth', 'crab', 'commander', 'shielder', 'bonus', 'hunter', 'carrier', 'diver3d', 'kamikaze', 'gunship', 'spiral', 'ring', 'glitch'], bullet: 'holo', upgrades: true,
    enemyBulletSpeed: 108, diveRate: 1.4, hpMul: 1.9, bossName: 'THE CABINET'
  }
];

// chain length -> multiplier (capped by era.maxMult)
const MULT_STEPS = [[0, 1], [6, 2], [15, 5], [30, 10], [50, 25], [80, 50], [120, 100]];
function multForChain(chain, cap) {
  let m = 1;
  for (const [c, v] of MULT_STEPS) if (chain >= c) m = v;
  return Math.min(m, cap);
}
function nextMultChain(chain, cap) {
  for (const [c, v] of MULT_STEPS) if (c > chain && v <= cap) return c;
  return null;
}

const STAGES_PER_ERA = 2;    // stage A (waves + mini-boss), stage B (waves + era boss)
const EXTEND_SCORES = [30000, 100000, 250000, 500000, 1000000, 2000000, 4000000];
