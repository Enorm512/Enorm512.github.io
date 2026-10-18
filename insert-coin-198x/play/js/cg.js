// ---------------------------------------------------------------
// cg.js : CrazyGames SDK v3 wrapper. Every call is a safe no-op when the
// SDK script is missing (offline, other portals, local play).
// ---------------------------------------------------------------
'use strict';

const CG = {
  ready: false, env: 'none', adRunning: false,
  // only pull in the CrazyGames SDK when the game is actually hosted there (or ?cg=1 for local testing)
  get wanted() { return /crazygames\.com$|\.crazygames\.|crazygames/.test(location.hostname) || /[?&]cg=1/.test(location.search); },
  loadScript() {
    return new Promise(resolve => {
      if (!this.wanted) return resolve(false);
      if (window.CrazyGames && window.CrazyGames.SDK) return resolve(true);
      const s = document.createElement('script'); s.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
      s.onload = () => resolve(true); s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  },
  async init() {
    try {
      await this.loadScript();
      if (window.CrazyGames && window.CrazyGames.SDK) {
        await window.CrazyGames.SDK.init();
        this.ready = true; this.env = window.CrazyGames.SDK.environment || 'unknown';
      }
    } catch (e) { this.ready = false; }
    return this.ready;
  },
  get embedded() { return this.ready && this.env !== 'local' && this.env !== 'disabled'; },
  call(fn) { if (!this.ready) return; try { fn(window.CrazyGames.SDK); } catch (e) { } },
  loadingStart() { this.call(s => s.game.loadingStart()); },
  loadingStop() { this.call(s => s.game.loadingStop()); },
  gameplayStart() { this.call(s => s.game.gameplayStart()); },
  gameplayStop() { this.call(s => s.game.gameplayStop()); },
  happytime() { this.call(s => s.game.happytime()); },
  // midgame ad: mutes audio while it plays, always calls onDone exactly once
  midgameAd(onMute, onDone) {
    let done = false;
    const finish = () => { if (done) return; done = true; this.adRunning = false; onMute(false); onDone(); };
    if (!this.ready) { finish(); return; }
    try {
      this.adRunning = true;
      window.CrazyGames.SDK.ad.requestAd('midgame', {
        adStarted: () => onMute(true),
        adFinished: finish,
        adError: finish,
      });
    } catch (e) { finish(); }
  },
};
