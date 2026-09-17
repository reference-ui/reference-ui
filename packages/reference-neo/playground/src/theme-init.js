// Playground theme stamp: reads ?theme= and restamps data-color-mode on
// <html> before first paint. Classic script on purpose — a module would
// defer past paint and flash the wrong canvas. No imports, no exports.
try {
  if (new URLSearchParams(window.location.search).get('theme') === 'light') {
    document.documentElement.setAttribute('data-color-mode', 'light');
  }
} catch (_) {}
