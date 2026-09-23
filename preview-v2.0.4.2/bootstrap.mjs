// Load the UI and engine explicitly; fail visibly rather than leaving empty team selectors.
const status = document.getElementById('startupStatus');
try {
  const app = await import('./app.mjs?v=quarterfix1');
  await app.init();
} catch (error) {
  status.dataset.error = 'true';
  status.setAttribute('role', 'alert');
  status.textContent = 'Simulator could not start: ' + (error?.message || String(error)) + '. Please reload this preview; no game has started.';
  console.error('POWER CRUNCH preview startup failed', error);
}
