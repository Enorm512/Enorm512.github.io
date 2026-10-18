// ---------------------------------------------------------------
// main.js : boot
// ---------------------------------------------------------------
'use strict';
window.addEventListener('load', async () => {
  await CG.init();
  CG.loadingStart();
  const canvas = document.getElementById('game');
  window.game = new Game(canvas);
  requestAnimationFrame(() => CG.loadingStop());
  // unlock audio: browsers (especially inside the CrazyGames iframe) only let audio start from a user
  // gesture, so keep trying on every key/click/touch until the context is actually running
  let unlocked = false;
  const unlock = () => {
    const g = window.game, a = g.audio;
    a.init(); a.resume();
    if (!a.ctx) return;
    const done = () => { if (unlocked) return; unlocked = true; console.log('[INSERT COIN] audio running'); if (g.state === 'attract') a.music.play('title'); };
    if (a.ctx.state === 'running') done();
    else a.ctx.resume().then(done).catch(err => console.warn('[INSERT COIN] audio resume failed', err));
  };
  for (const ev of ['keydown', 'pointerdown', 'touchstart', 'click']) window.addEventListener(ev, () => { if (!unlocked) unlock(); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && window.game) window.game.audio.resume(); });
});
