const button = document.querySelector('.themeToggle');
const root = document.documentElement;

function syncThemeLabel() {
  const isLight = root.dataset.theme === 'light';
  button.setAttribute('aria-label', `Cambiar a tema ${isLight ? 'oscuro' : 'claro'}`);
  button.setAttribute('aria-pressed', String(isLight));
  button.textContent = isLight ? 'Oscuro' : 'Claro';
}

button.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  try { localStorage.setItem('idpam-theme', root.dataset.theme); } catch {}
  syncThemeLabel();
});
syncThemeLabel();
