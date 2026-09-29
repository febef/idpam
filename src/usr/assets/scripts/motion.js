const motionButton = document.querySelector('.motionToggle');
const motionClass = 'motion-paused';

function storedMotionPreference() {
  try { return localStorage.getItem('idpam-motion'); } catch { return null; }
}

function setMotionPaused(paused, persist = true) {
  document.body.classList.toggle(motionClass, paused);
  motionButton?.setAttribute('aria-pressed', String(paused));
  if (motionButton) motionButton.textContent = paused ? 'Resume motion' : 'Pause motion';
  if (persist) {
    try { localStorage.setItem('idpam-motion', paused ? 'paused' : 'running'); } catch {}
  }
}

const storedPreference = storedMotionPreference();
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
setMotionPaused(storedPreference ? storedPreference === 'paused' : reducedMotion, false);

motionButton?.addEventListener('click', () => {
  setMotionPaused(!document.body.classList.contains(motionClass));
});
