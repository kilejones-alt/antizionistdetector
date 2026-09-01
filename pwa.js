(() => {
  'use strict';
  if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    });
  }

  const hint = document.getElementById('installHint');
  if (!hint) return;
  const ua = navigator.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua)) {
    hint.textContent = 'iPhone/iPad: open this app in Safari, tap Share, then Add to Home Screen.';
  } else if (/android/i.test(ua)) {
    hint.textContent = 'Samsung/Android: open the browser menu and choose Install app or Add to Home screen.';
  } else if (/^file:/.test(window.location.protocol)) {
    hint.textContent = 'Laptop: this local copy works directly. Use START_HERE.html to enable installation and offline updates through a local or HTTPS server.';
  } else {
    hint.textContent = 'Laptop: use the browser install icon or the Install app button when available.';
  }
})();
