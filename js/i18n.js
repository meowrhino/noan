/*
 * NOAN PORTFOLIO — i18n.js
 * ════════════════════════
 * ====== I18N ======
 * Languages and strings live in data.json under "i18n.<code>".
 * Translatable static elements use [data-i18n="<key>"] attributes in index.html.
 * Dynamic content (bio, game cards) re-renders on language change via applyLang().
 * The selected language is persisted in localStorage.
 *
 * Dependency note: i18n imports render.js for the re-render on language change,
 * and render.js imports t() from here. This is a functions-only cycle, safe under
 * ES module hoisting (neither reads the other's exports at top-level).
 */
import { state, SUPPORTED_LANGS, dom } from './state.js';
import { playSound } from './sound.js';
import { renderAboutBio, renderGames } from './render.js';

export function t(key) {
  const dict = state.data?.i18n?.[state.lang] || state.data?.i18n?.en || {};
  return dict[key] != null ? dict[key] : key;
}

export function setLang(code) {
  if (!SUPPORTED_LANGS.includes(code)) return;
  if (code === state.lang) return;
  state.lang = code;
  try { localStorage.setItem('lang', code); } catch (e) { /* private mode */ }
  applyLang();
  playSound('changeView');
}

export function cycleLang() {
  const idx = SUPPORTED_LANGS.indexOf(state.lang);
  const next = SUPPORTED_LANGS[(idx + 1) % SUPPORTED_LANGS.length];
  setLang(next);
}

export function applyLang() {
  document.documentElement.lang = state.lang;

  // Static elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });

  // Single language toggle: shows the current language code
  if (dom.langBtn) dom.langBtn.textContent = state.lang.toUpperCase();

  // Re-render dynamic content that depends on language
  renderAboutBio();
  if (state.openWindows.has('window-games')) renderGames();
}
