/*
 * NOAN PORTFOLIO — windows.js
 * ═══════════════════════════
 * ====== WINDOW SYSTEM ======
 * Windows use a monotonically increasing z-index (state.nextZIndex++) so the most
 * recently focused window is always on top. windowStack[] tracks order for Escape-to-close.
 * ANIM_MS must match the CSS pop-in/pop-out animation duration (0.15s).
 *
 * Also owns: focus move-in/restore-out, the cascade anchor (lastWindowPos), the
 * video player windows, and the welcome / how-to window.
 *
 * Dependency notes:
 *   - Imports render.js for renderVideos/renderGames/renderMap (openWindow lazily
 *     renders window content). render.js does NOT import back — no cycle there.
 *   - Imports makeDraggable from drag.js; drag.js imports bringToFront +
 *     setLastWindowPos from here. That cross-import is functions-only and safe
 *     under ES module hoisting.
 */
import { state, dom, ANIM_MS, videoPath } from './state.js';
import { playSound } from './sound.js';
import { renderVideos, renderGames, renderMap } from './render.js';
import { makeDraggable } from './drag.js';

/*
 * Focus management (no full focus-trap — just move-in/restore-out):
 *   _focusWindowContainer(frame, id) — call right after a window becomes
 *     visible. Remembers document.activeElement so focus can return there,
 *     then moves focus onto the window's own container (tabindex="-1").
 *   _restoreFocus(id) — call when a window closes. Refocuses whatever
 *     opened it, if that element is still attached to the DOM.
 */
function _focusWindowContainer(frame, id) {
  if (!frame) return;
  state.focusReturn.set(id, document.activeElement);
  frame.focus({ preventScroll: true });
}

function _restoreFocus(id) {
  const opener = state.focusReturn.get(id);
  state.focusReturn.delete(id);
  if (opener && document.body.contains(opener) && typeof opener.focus === 'function') {
    opener.focus({ preventScroll: true });
  }
}

export function bringToFront(id) {
  const idx = state.windowStack.indexOf(id);
  if (idx !== -1) state.windowStack.splice(idx, 1);
  state.windowStack.push(id);
  const win = document.getElementById(id);
  if (win) win.style.zIndex = state.nextZIndex++;
}

export function bringHomeFront() {
  dom.homePanel.style.zIndex = state.nextZIndex++;
}

const CASCADE_GAP = 30;
let lastWindowPos = null; // {x, y} of last used window

// Exposed so drag.js can update the cascade anchor after dragging a window-frame.
export function setLastWindowPos(pos) {
  lastWindowPos = pos;
}

export function getNextWindowPos(w, h) {
  let x, y;
  if (lastWindowPos && state.openWindows.size > 0) {
    x = lastWindowPos.x + CASCADE_GAP;
    y = lastWindowPos.y + CASCADE_GAP;
  } else {
    lastWindowPos = null;
    x = (window.innerWidth - w) / 2;
    y = (window.innerHeight - h) / 2;
  }
  // Clamp to viewport so windows don't spawn off-screen on mobile
  x = Math.max(0, Math.min(x, window.innerWidth - 40));
  y = Math.max(0, Math.min(y, window.innerHeight - 40));
  return { x, y };
}

export function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // Already open? Just bring to front
  if (state.openWindows.has(id)) { bringToFront(id); return; }

  // Position relative to last window, or centered
  const pos = getNextWindowPos(win.offsetWidth || 640, win.offsetHeight || 480);
  win.style.left = pos.x + 'px';
  win.style.top = pos.y + 'px';
  win.classList.add('dragged');
  lastWindowPos = pos;

  win.hidden = false;
  void win.offsetHeight;
  win.classList.add('open');

  state.openWindows.add(id);
  bringToFront(id);
  _focusWindowContainer(win, id);

  // Window-specific open sounds
  const openSounds = { 'window-videos': 'openVideos', 'window-games': 'openGames', 'window-map': 'openMap' };
  playSound(openSounds[id]);

  if (id === 'window-videos') renderVideos();
  else if (id === 'window-games') renderGames();
  else if (id === 'window-map' && !state.mapRendered) { renderMap(); state.mapRendered = true; }
}

export function closeWindowById(id, withSound = true) {
  if (!state.openWindows.has(id)) return;
  if (id.startsWith('window-player-')) { closePlayerById(id, withSound); return; }
  if (id === 'welcome-window') { dismissWelcome(); return; }

  const win = document.getElementById(id);
  if (!win) return;

  win.classList.remove('open');
  win.classList.add('closing');
  const closeSounds = { 'window-videos': 'closeVideos', 'window-games': 'closeGames', 'window-map': 'closeMap' };
  if (withSound) playSound(closeSounds[id]);

  state.openWindows.delete(id);
  const idx = state.windowStack.indexOf(id);
  if (idx !== -1) state.windowStack.splice(idx, 1);
  _restoreFocus(id);

  setTimeout(() => {
    win.hidden = true;
    win.classList.remove('closing', 'dragged');
    win.style.left = '';
    win.style.top = '';
  }, ANIM_MS);
}

export function closeTopWindow(withSound = true) {
  if (state.windowStack.length === 0) return;
  const topId = state.windowStack[state.windowStack.length - 1];
  closeWindowById(topId, withSound);
}

/* ====== VIDEO PLAYER WINDOWS ====== */
let playerCounter = 0;

function createPlayerWindow(video) {
  const id = `window-player-${++playerCounter}`;

  const tpl = document.getElementById('tpl-player-window');
  const clone = tpl.content.cloneNode(true);
  const frame = clone.querySelector('.window-frame');
  frame.id = id;
  frame.querySelector('.window-title').textContent = video.title;
  frame.setAttribute('aria-label', video.title);

  document.body.appendChild(clone);
  // Re-query from DOM since clone fragment is emptied after append
  const attached = document.getElementById(id);

  // Bind close button
  attached.querySelector('.close-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    closePlayerById(id, true);
  });

  // Bind focus on click
  attached.addEventListener('mousedown', () => {
    if (state.openWindows.has(id)) bringToFront(id);
  });

  // Make titlebar draggable
  makeDraggable(attached.querySelector('.window-titlebar'), attached);

  return { frame: attached, id };
}

export function openPlayer(videoId) {
  const video = state.data.videos.find(v => v.id === videoId);
  if (!video) return;

  const { frame, id } = createPlayerWindow(video);
  const content = frame.querySelector('.player-content');

  const vid = document.createElement('video');
  vid.controls = true;
  vid.autoplay = true;
  vid.addEventListener('error', () => {
    vid.style.display = 'none';
    const msg = document.createElement('p');
    msg.className = 'player-error';
    msg.textContent = 'Video not available';
    content.appendChild(msg);
  });
  const src = document.createElement('source');
  const vPath = videoPath(video.id);
  src.src = vPath;
  const ext = vPath.split('.').pop().toLowerCase();
  src.type = ext === 'mp4' ? 'video/mp4' : ext === 'mov' ? 'video/quicktime' : 'video/webm';
  vid.appendChild(src);
  content.appendChild(vid);

  // Position relative to last window, or centered
  const pos = getNextWindowPos(800, 500);
  frame.style.left = pos.x + 'px';
  frame.style.top = pos.y + 'px';
  frame.classList.add('dragged');
  lastWindowPos = pos;

  frame.hidden = false;
  void frame.offsetHeight;
  frame.classList.add('open');

  state.openWindows.add(id);
  bringToFront(id);
  _focusWindowContainer(frame, id);
  playSound('openPlayer');
}

export function closePlayerById(id, withSound = true) {
  const frame = document.getElementById(id);
  if (!frame) return;

  const vid = frame.querySelector('video');
  if (vid) { vid.pause(); vid.removeAttribute('src'); vid.load(); }

  frame.classList.remove('open');
  frame.classList.add('closing');
  if (withSound) playSound('closePlayer');

  state.openWindows.delete(id);
  const idx = state.windowStack.indexOf(id);
  if (idx !== -1) state.windowStack.splice(idx, 1);
  _restoreFocus(id);

  setTimeout(() => {
    frame.remove();
  }, ANIM_MS);
}

/* ====== HOW-TO / WELCOME ====== */
export function showWelcomeWindow() {
  const win = dom.welcomeWindow;
  win.hidden = false;
  // Clear any prior inline position so the browser can measure the real size
  win.style.left = '';
  win.style.top = '';
  win.classList.add('dragged', 'open');
  // Register in window system so Escape / click-to-focus work
  state.openWindows.add('welcome-window');
  bringToFront('welcome-window');
  // Use offsetWidth/Height (layout size) so the pop-in scale animation
  // doesn't skew the measurement. Center on the home panel (or viewport
  // if home is hidden) so the welcome shares the same center as noan.
  const winW = win.offsetWidth;
  const winH = win.offsetHeight;
  const home = dom.homePanel;
  const anchor = (home && !home.classList.contains('hidden'))
    ? home.getBoundingClientRect()
    : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  win.style.left = Math.max(8, anchor.left + (anchor.width - winW) / 2) + 'px';
  win.style.top = Math.max(8, anchor.top + (anchor.height - winH) / 2) + 'px';
  _focusWindowContainer(win, 'welcome-window');
}

export function dismissWelcome() {
  const win = dom.welcomeWindow;
  win.classList.remove('open');
  win.classList.add('closing');
  playSound('closeWelcome');
  state.openWindows.delete('welcome-window');
  const idx = state.windowStack.indexOf('welcome-window');
  if (idx !== -1) state.windowStack.splice(idx, 1);
  _restoreFocus('welcome-window');
  setTimeout(() => { win.hidden = true; win.classList.remove('closing'); }, ANIM_MS);
  dom.howtoBtn.hidden = false;
}

export function hasSeenHowTo() {
  try {
    return localStorage.getItem('howtoSeen') === '1';
  } catch (e) { /* private mode / disabled storage */ }
  return false;
}

export function markHowToSeen() {
  try { localStorage.setItem('howtoSeen', '1'); } catch (e) { /* private mode */ }
}

export function initHowTo() {
  // Show on first visit only; afterwards just surface the "how to" button.
  if (hasSeenHowTo()) {
    dom.howtoBtn.hidden = false;
  } else {
    showWelcomeWindow();
  }

  dom.welcomeDismiss.addEventListener('click', (e) => {
    e.stopPropagation();
    markHowToSeen();
    dismissWelcome();
  });

  // Make welcome window titlebar draggable
  makeDraggable(dom.welcomeWindow.querySelector('.window-titlebar'), dom.welcomeWindow);

  // Howto button reopens the welcome window
  dom.howtoBtn.addEventListener('click', () => {
    if (dom.welcomeWindow.hidden) {
      dom.howtoBtn.hidden = true;
      playSound('openWelcome');
      showWelcomeWindow();
    } else {
      dom.welcomeWindow.style.zIndex = state.nextZIndex++;
    }
  });
}
