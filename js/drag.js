/*
 * NOAN PORTFOLIO — drag.js
 * ════════════════════════
 * ====== DRAGGABLE WINDOWS ======
 * makeDraggable() wires a titlebar to its frame. Global move/end listeners are
 * registered once on document (initDrag) and early-return when idle. Dragged
 * positions are clamped so a titlebar never ends up fully off-screen, and are
 * re-clamped on resize/rotation.
 *
 * Dependency note: drag imports bringToFront from windows.js (functions-only
 * cycle, safe) and setLastWindowPos so a dragged window-frame updates the
 * cascade anchor used by the next opened window.
 */
import { state, dom } from './state.js';
import { bringToFront, setLastWindowPos } from './windows.js';

let _dragging = null;
let _dragOffsetX = 0, _dragOffsetY = 0;

function _startDrag(frame, clientX, clientY) {
  _dragging = frame;
  const rect = frame.getBoundingClientRect();
  _dragOffsetX = clientX - rect.left;
  _dragOffsetY = clientY - rect.top;
  frame.classList.add('dragging');
  if (frame.classList.contains('window-frame') && state.openWindows.has(frame.id)) {
    bringToFront(frame.id);
  }
}

/*
 * Clamp a proposed (x, y) top-left position so the titlebar (height
 * TITLEBAR_SIZE) always stays fully visible vertically, and at least
 * MIN_VISIBLE_X px of the window's width stays reachable horizontally.
 * Works for both .window-frame elements and #home-panel once dragged.
 */
const TITLEBAR_SIZE = 36; // must match --titlebar-size in style.css
const MIN_VISIBLE_X = 60;

function _clampDragPos(x, y, w, h) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const minX = MIN_VISIBLE_X - w; // keep at least MIN_VISIBLE_X px on screen
  const maxX = vw - MIN_VISIBLE_X;
  const minY = 0;
  const maxY = vh - TITLEBAR_SIZE;
  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY),
  };
}

function _moveDrag(clientX, clientY) {
  if (!_dragging) return;
  let x = clientX - _dragOffsetX;
  let y = clientY - _dragOffsetY;

  if (_dragging.id === 'home-panel' && _dragging.style.position !== 'fixed') {
    _dragging.style.position = 'fixed';
    _dragging.style.left = _dragging.getBoundingClientRect().left + 'px';
    _dragging.style.top = _dragging.getBoundingClientRect().top + 'px';
    _dragging.style.margin = '0';
    _dragging.style.zIndex = state.nextZIndex++;
  }

  const w = _dragging.offsetWidth;
  const h = _dragging.offsetHeight;
  const clamped = _clampDragPos(x, y, w, h);
  x = clamped.x;
  y = clamped.y;

  _dragging.style.left = x + 'px';
  _dragging.style.top = y + 'px';

  if (_dragging.classList.contains('window-frame')) {
    _dragging.classList.add('dragged');
  }
}

function _endDrag() {
  if (_dragging) {
    // Update lastWindowPos if this was a window-frame
    if (_dragging.classList.contains('window-frame')) {
      setLastWindowPos({ x: _dragging.offsetLeft, y: _dragging.offsetTop });
    }
    _dragging.classList.remove('dragging');
    _dragging = null;
  }
}

export function makeDraggable(bar, frame) {
  bar.addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) return;
    _startDrag(frame, e.clientX, e.clientY);
    e.preventDefault();
  });
  bar.addEventListener('touchstart', (e) => {
    if (e.target.closest('button')) return;
    const t = e.touches[0];
    _startDrag(frame, t.clientX, t.clientY);
  }, { passive: true });
}

export function initDrag() {
  // Bind existing titlebars
  document.querySelectorAll('.window-titlebar').forEach(bar => {
    const frame = bar.closest('.window-frame') || bar.closest('#home-panel');
    if (frame) makeDraggable(bar, frame);
  });

  // Global move/end listeners registered once on document.
  // They check _dragging and return early when idle, so the overhead is negligible.
  // This avoids add/remove churn on every drag start/end.
  document.addEventListener('mousemove', (e) => _moveDrag(e.clientX, e.clientY));
  document.addEventListener('mouseup', _endDrag);
  document.addEventListener('touchmove', (e) => {
    if (!_dragging) return;
    e.preventDefault();
    const t = e.touches[0];
    _moveDrag(t.clientX, t.clientY);
  }, { passive: false });
  document.addEventListener('touchend', _endDrag);

  // Re-clamp any freely-positioned (.dragged) windows after a resize/rotation
  // so a titlebar dragged near an edge doesn't end up off-screen. Lightly
  // debounced since 'resize' can fire rapidly while dragging a desktop window
  // or rotating a device.
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(_reclampDraggedWindows, 120);
  });
}

function _reclampDraggedWindows() {
  // .window-frame elements once dragged carry .dragged (inline left/top, transform:none).
  // #home-panel instead switches to position:fixed the first time it's dragged
  // (see _moveDrag) — it never gets a .dragged class of its own.
  const els = document.querySelectorAll('.window-frame.dragged');
  els.forEach(el => {
    if (el.hidden) return;
    const x = el.offsetLeft;
    const y = el.offsetTop;
    const clamped = _clampDragPos(x, y, el.offsetWidth, el.offsetHeight);
    if (clamped.x !== x) el.style.left = clamped.x + 'px';
    if (clamped.y !== y) el.style.top = clamped.y + 'px';
  });

  const home = dom.homePanel;
  if (home && home.style.position === 'fixed' && !home.classList.contains('hidden')) {
    const x = home.offsetLeft;
    const y = home.offsetTop;
    const clamped = _clampDragPos(x, y, home.offsetWidth, home.offsetHeight);
    if (clamped.x !== x) home.style.left = clamped.x + 'px';
    if (clamped.y !== y) home.style.top = clamped.y + 'px';
  }
}
