/*
 * NOAN PORTFOLIO — main.js (entry point)
 * ══════════════════════════════════════
 * Architecture (native ES modules, no build step):
 *   - state.js    STATE + DOM refs + asset-path helpers + shared constants.
 *   - sound.js    SOUND: MP3s preloaded into AudioBuffers on first interaction.
 *   - i18n.js     I18N: t/setLang/cycleLang/applyLang (strings in data.json).
 *   - render.js   DATA load, theme, and all content rendering + home open/close
 *                 + pfp gallery. Does NOT import windows.js (see below).
 *   - windows.js  WINDOW SYSTEM: openWindow/close, z-index stacking, player
 *                 windows, focus move-in/restore-out, welcome/how-to.
 *   - drag.js     Draggable windows + edge-clamp + resize re-clamp.
 *   - main.js     Entry: DOMContentLoaded init sequence, cross-module event
 *                 bindings (bindEvents) and the custom cursor.
 *
 * Cross-module event wiring lives HERE (bindEvents) rather than inside render.js,
 * so render.js stays free of any dependency on the window system. Bio-link clicks
 * that open windows, nav buttons, Escape-to-close, etc. are all delegated below.
 */
import { state, dom, cacheDom } from './state.js';
import { initAudio, playSound } from './sound.js';
import { cycleLang, applyLang } from './i18n.js';
import {
  loadData, applyTheme, renderHome, initPfpGallery,
  closeHome, openHome,
} from './render.js';
import {
  openWindow, closeWindowById, closeTopWindow, openPlayer,
  bringToFront, bringHomeFront, initHowTo,
} from './windows.js';
import { initDrag } from './drag.js';

/* ====== INIT ====== */
document.addEventListener('DOMContentLoaded', async () => {
  cacheDom();
  await loadData();
  if (!state.data) return;
  applyTheme();
  renderHome();
  bindEvents();
  initDrag();
  initHowTo();
  initPfpGallery();
  initCursor();
  applyLang();
});

/*
 * ====== CUSTOM CURSOR ======
 * The visual cursor swap (normal ↔ click) is handled by CSS via the
 * `body.cursor-down` class. JS only toggles the class on mousedown/up.
 * The same mousedown handler fires the global click-sound, but only when
 * the click hits empty/background area — interactive elements (buttons,
 * portrait, pins, windows, etc.) have their own sounds and would otherwise
 * double up. Pitch is randomized so rapid clicks don't sound mechanical.
 */
function initCursor() {
  // Elements with their own click sound — skip globalClick to avoid doubling up.
  const INTERACTIVE = 'button, a, .window-frame, .portrait-area, .map-pin, .pfp-gallery, .welcome-window';
  document.addEventListener('mousedown', (e) => {
    document.body.classList.add('cursor-down');
    if (e.target.closest(INTERACTIVE)) return;
    playSound('globalClick', { pitch: 0.85 + Math.random() * 0.3 });
  });
  const release = () => document.body.classList.remove('cursor-down');
  document.addEventListener('mouseup', release);
  document.addEventListener('mouseleave', release);
  document.addEventListener('blur', release);
}

/* ====== EVENT BINDING ====== */
function bindEvents() {
  // Init audio early (pointerdown fires before click, giving preload a head start)
  document.addEventListener('pointerdown', () => initAudio(), { once: true });

  // Nav buttons
  dom.btnVideos.addEventListener('click', () => openWindow('window-videos'));
  dom.btnGames.addEventListener('click', () => openWindow('window-games'));
  dom.btnMap.addEventListener('click', () => openWindow('window-map'));

  // Hover sounds (only on pointer devices) — different pitch per button
  if (state.hasHover) {
    dom.btnVideos.addEventListener('mouseenter', () => playSound('hoverVideos'));
    dom.btnGames.addEventListener('mouseenter', () => playSound('hoverGames'));
    dom.btnMap.addEventListener('mouseenter', () => playSound('hoverMap'));
    dom.portraitArea.addEventListener('mouseenter', () => playSound('hoverHome'));
  }

  // Close buttons for window frames
  document.querySelectorAll('.window-frame .close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const frame = btn.closest('.window-frame');
      closeWindowById(frame.id, true);
    });
  });

  // Click on window frame brings it to front
  document.querySelectorAll('.window-frame').forEach(frame => {
    frame.addEventListener('mousedown', () => {
      if (state.openWindows.has(frame.id)) bringToFront(frame.id);
    });
  });

  // Home panel: click to bring to front (but not when clicking nav buttons)
  dom.homePanel.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.nav-btn')) bringHomeFront();
  });

  // Close home panel (both front and back close buttons)
  dom.closeHome.addEventListener('click', (e) => {
    e.stopPropagation();
    closeHome();
  });
  dom.closeHomeBack.addEventListener('click', (e) => {
    e.stopPropagation();
    closeHome();
  });

  // Flip: click on the portrait to flip to about section
  dom.homePanel.addEventListener('click', (e) => {
    if (e.target.closest('.nav-btn')) return;
    if (dom.homePanel.classList.contains('flipped')) {
      if (e.target.closest('#flip-back-btn') || (!e.target.closest('#pfp-gallery') && !e.target.closest('.bio-link'))) {
        dom.homePanel.classList.remove('flipped');
        playSound('flipHomeBack');
      }
    } else {
      if (e.target.closest('#portrait-img')) {
        dom.homePanel.classList.add('flipped');
        playSound('flipHomeForward');
      }
    }
  });

  // Reopen button
  dom.reopenBtn.addEventListener('click', () => {
    openHome();
  });

  // Escape key closes topmost window
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeTopWindow(true);
  });

  // Event delegation for video cards (click + keyboard)
  function handleVideoCard(e) {
    const card = e.target.closest('[data-video-id]');
    if (!card) return;
    openPlayer(card.dataset.videoId);
  }
  dom.videosContent.addEventListener('click', handleVideoCard);
  dom.videosContent.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleVideoCard(e); }
  });

  // Event delegation for game cards (click + keyboard)
  function handleGameCard(e) {
    const card = e.target.closest('[data-game-id]');
    if (!card) return;
    playSound('changeView');
    const game = state.data.games.find(g => g.id === card.dataset.gameId);
    if (game && game.itchUrl) {
      window.open(game.itchUrl, '_blank', 'noopener,noreferrer');
    }
  }
  dom.gamesContent.addEventListener('click', handleGameCard);
  dom.gamesContent.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleGameCard(e); }
  });

  // Hover sounds on map pins (delegated via capture)
  if (state.hasHover) {
    dom.mapContent.addEventListener('mouseenter', (e) => {
      if (e.target.closest('.map-pin')) playSound('hoverPin');
    }, true);
  }

  // Bio links → open corresponding windows
  dom.aboutBio.addEventListener('click', (e) => {
    const link = e.target.closest('.bio-link[data-open]');
    if (!link) return;
    e.preventDefault();
    openWindow(link.dataset.open);
    // No extra sound here — openWindow() already plays one
  });

  // Language toggle: cycles EN → ES → FR → EN
  if (dom.langBtn) {
    dom.langBtn.addEventListener('click', cycleLang);
  }
}
