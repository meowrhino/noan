/* ====== STATE ====== */
const state = {
  data: null,
  openWindows: new Set(),
  windowStack: [],       // ordered by focus, last = topmost
  nextZIndex: 100,
  audioCtx: null,
  soundBuffers: {},   // preloaded MP3 buffers
  mapRendered: false,
  hasHover: window.matchMedia('(hover: hover)').matches,
  homeOpen: true,
};

/* ====== ASSET PATHS (derived from id) ====== */
function thumbPath(id) { return `assets/thumbnails/${id}.png`; }
function videoPath(id) { return `assets/videos/${id}.webm`; }

/* ====== DOM REFS ====== */
const dom = {};

function cacheDom() {
  dom.homeScreen = document.getElementById('home-screen');
  dom.homePanel = document.getElementById('home-panel');
  dom.reopenBtn = document.getElementById('reopen-btn');
  dom.closeHome = document.getElementById('close-home');
  dom.btnVideos = document.getElementById('btn-videos');
  dom.btnGames = document.getElementById('btn-games');
  dom.btnMap = document.getElementById('btn-map');
  dom.portraitImg = document.getElementById('portrait-img');
  dom.portraitArea = document.getElementById('portrait-area');
  dom.aboutBio = document.getElementById('about-bio');
  dom.flipBackBtn = document.getElementById('flip-back-btn');
  dom.closeHomeBack = document.getElementById('close-home-back');
  dom.windowVideos = document.getElementById('window-videos');
  dom.windowGames = document.getElementById('window-games');
  dom.windowMap = document.getElementById('window-map');
  dom.videosContent = document.getElementById('videos-content');
  dom.gamesContent = document.getElementById('games-content');
  dom.mapContent = document.getElementById('map-content');
}

/* ====== INIT ====== */
document.addEventListener('DOMContentLoaded', async () => {
  cacheDom();
  await loadData();
  if (!state.data) return;
  applyTheme();
  renderHome();
  bindEvents();
  initDrag();
});

/* ====== DATA LOADING ====== */
async function loadData() {
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.data = await res.json();
  } catch (e) {
    console.error('Failed to load data.json', e);
    document.body.innerHTML = '<p style="padding:2rem;text-align:center;font-family:system-ui;color:#3d3532">Failed to load. Please refresh.</p>';
  }
}

/* ====== THEME FROM DATA ====== */
const THEME_MAP = {
  bg:'--bg', panelBg:'--panel-bg', accent:'--accent', accentLight:'--accent-light',
  accentDark:'--accent-dark', accentPale:'--accent-pale', mapLand:'--map-land',
  mapSea:'--map-sea', textDark:'--text-dark', textLight:'--text-light', shadow:'--shadow'
};

function applyTheme() {
  const t = state.data.theme;
  if (!t) return;
  const root = document.documentElement.style;
  for (const [key, prop] of Object.entries(THEME_MAP)) {
    if (t[key]) root.setProperty(prop, t[key]);
  }
}

/* ====== HOME RENDERING ====== */
function renderHome() {
  const d = state.data;
  dom.portraitImg.src = d.about.portrait;
  dom.portraitImg.alt = d.about.name;
  dom.aboutBio.textContent = d.about.bio;
}

/* ====== HOME PANEL OPEN/CLOSE ====== */
function closeHome() {
  dom.homePanel.classList.add('hidden');
  dom.reopenBtn.hidden = false;
  state.homeOpen = false;
  playSound('close');
}

function openHome() {
  dom.reopenBtn.hidden = true;
  dom.homePanel.classList.remove('hidden', 'flipped');
  // Reset position if it was dragged
  dom.homePanel.style.position = '';
  dom.homePanel.style.left = '';
  dom.homePanel.style.top = '';
  dom.homePanel.classList.remove('dragged');
  state.homeOpen = true;
  bringHomeFront();
  playSound('open');
}

/* ====== WINDOW SYSTEM ====== */
const ANIM_MS = 150;

function bringToFront(id) {
  const idx = state.windowStack.indexOf(id);
  if (idx !== -1) state.windowStack.splice(idx, 1);
  state.windowStack.push(id);
  const win = document.getElementById(id);
  if (win) win.style.zIndex = state.nextZIndex++;
}

function bringHomeFront() {
  dom.homePanel.style.zIndex = state.nextZIndex++;
}

const CASCADE_GAP = 30;
let lastWindowPos = null; // {x, y} of last used window

function getNextWindowPos(w, h) {
  if (lastWindowPos && state.openWindows.size > 0) {
    return { x: lastWindowPos.x + CASCADE_GAP, y: lastWindowPos.y + CASCADE_GAP };
  }
  lastWindowPos = null;
  return { x: (window.innerWidth - w) / 2, y: (window.innerHeight - h) / 2 };
}

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // Already open? Just bring to front
  if (state.openWindows.has(id)) { bringToFront(id); return; }

  // Position relative to last window, or centered (skip on mobile — CSS handles it)
  const isMobile = window.matchMedia('(max-width: 480px)').matches;
  if (!isMobile) {
    const pos = getNextWindowPos(win.offsetWidth || 640, win.offsetHeight || 480);
    win.style.left = pos.x + 'px';
    win.style.top = pos.y + 'px';
    win.classList.add('dragged');
    lastWindowPos = pos;
  }

  win.hidden = false;
  void win.offsetHeight;
  win.classList.add('open');

  state.openWindows.add(id);
  bringToFront(id);

  // Window-specific open sounds
  const openSounds = { 'window-videos': 'openVideos', 'window-games': 'openGames', 'window-map': 'openMap' };
  playSound(openSounds[id] || 'open');

  if (id === 'window-videos') renderVideos();
  else if (id === 'window-games') renderGames();
  else if (id === 'window-map' && !state.mapRendered) { renderMap(); state.mapRendered = true; }
}

function closeWindowById(id, withSound = true) {
  if (!state.openWindows.has(id)) return;
  if (id.startsWith('window-player-')) { closePlayerById(id, withSound); return; }

  const win = document.getElementById(id);
  if (!win) return;

  win.classList.remove('open');
  win.classList.add('closing');
  const closeSounds = { 'window-videos': 'closeVideos', 'window-games': 'closeGames', 'window-map': 'closeMap' };
  if (withSound) playSound(closeSounds[id] || 'close');

  state.openWindows.delete(id);
  const idx = state.windowStack.indexOf(id);
  if (idx !== -1) state.windowStack.splice(idx, 1);

  setTimeout(() => {
    win.hidden = true;
    win.classList.remove('closing', 'dragged');
    win.style.left = '';
    win.style.top = '';
  }, ANIM_MS);
}

function closeTopWindow(withSound = true) {
  if (state.windowStack.length === 0) return;
  const topId = state.windowStack[state.windowStack.length - 1];
  closeWindowById(topId, withSound);
}

let playerCounter = 0;

function createPlayerWindow(video) {
  const id = `window-player-${++playerCounter}`;

  const tpl = document.getElementById('tpl-player-window');
  const clone = tpl.content.cloneNode(true);
  const frame = clone.querySelector('.window-frame');
  frame.id = id;
  frame.querySelector('.window-title').textContent = video.title;

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

function openPlayer(videoId) {
  const video = state.data.videos.find(v => v.id === videoId);
  if (!video) return;

  const { frame, id } = createPlayerWindow(video);
  const content = frame.querySelector('.player-content');

  const vid = document.createElement('video');
  vid.controls = true;
  vid.autoplay = true;
  const src = document.createElement('source');
  src.src = videoPath(video.id);
  src.type = 'video/webm';
  vid.appendChild(src);
  content.appendChild(vid);

  // Position relative to last window, or centered (skip on mobile — CSS handles it)
  const isMobile = window.matchMedia('(max-width: 480px)').matches;
  if (!isMobile) {
    const pos = getNextWindowPos(800, 500);
    frame.style.left = pos.x + 'px';
    frame.style.top = pos.y + 'px';
    frame.classList.add('dragged');
    lastWindowPos = pos;
  }

  frame.hidden = false;
  void frame.offsetHeight;
  frame.classList.add('open');

  state.openWindows.add(id);
  bringToFront(id);
  playSound('open');
}

function closePlayerById(id, withSound = true) {
  const frame = document.getElementById(id);
  if (!frame) return;

  const vid = frame.querySelector('video');
  if (vid) { vid.pause(); vid.removeAttribute('src'); vid.load(); }

  frame.classList.remove('open');
  frame.classList.add('closing');
  if (withSound) playSound('close');

  state.openWindows.delete(id);
  const idx = state.windowStack.indexOf(id);
  if (idx !== -1) state.windowStack.splice(idx, 1);

  setTimeout(() => {
    frame.remove();
  }, ANIM_MS);
}

/* ====== VIDEOS (grid view) ====== */
function renderVideos() {
  const tpl = document.getElementById('tpl-video-card');
  const grid = document.createElement('div');
  grid.className = 'cards-grid';

  state.data.videos.forEach(v => {
    const clone = tpl.content.cloneNode(true);
    const card = clone.querySelector('.card');
    card.dataset.videoId = v.id;
    const img = clone.querySelector('img');
    img.src = thumbPath(v.id);
    img.alt = v.title;
    img.addEventListener('error', () => { img.style.display = 'none'; });
    clone.querySelector('.card-title').textContent = v.title;
    grid.appendChild(clone);
  });

  dom.videosContent.innerHTML = '';
  dom.videosContent.appendChild(grid);
}

/* ====== GAMES (column view) ====== */
function renderGames() {
  const tpl = document.getElementById('tpl-game-card');
  const column = document.createElement('div');
  column.className = 'cards-column';

  state.data.games.forEach(g => {
    const clone = tpl.content.cloneNode(true);
    const card = clone.querySelector('.card');
    card.dataset.gameId = g.id;
    const img = clone.querySelector('img');
    img.src = thumbPath(g.id);
    img.alt = g.title;
    img.addEventListener('error', () => { img.style.display = 'none'; });
    clone.querySelector('.card-title').textContent = g.title;
    clone.querySelector('.card-desc-gray').textContent = g.description || '';
    const role = clone.querySelector('.card-role');
    if (g.role) role.textContent = g.role;
    else role.remove();
    column.appendChild(clone);
  });

  dom.gamesContent.innerHTML = '';
  dom.gamesContent.appendChild(column);
}

/* ====== DRAGGABLE WINDOWS ====== */
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

function _moveDrag(clientX, clientY) {
  if (!_dragging) return;
  const x = clientX - _dragOffsetX;
  const y = clientY - _dragOffsetY;

  if (_dragging.id === 'home-panel' && _dragging.style.position !== 'fixed') {
    _dragging.style.position = 'fixed';
    _dragging.style.left = _dragging.getBoundingClientRect().left + 'px';
    _dragging.style.top = _dragging.getBoundingClientRect().top + 'px';
    _dragging.style.margin = '0';
    _dragging.style.zIndex = '100';
  }

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
      lastWindowPos = { x: _dragging.offsetLeft, y: _dragging.offsetTop };
    }
    _dragging.classList.remove('dragging');
    _dragging = null;
  }
}

function makeDraggable(bar, frame) {
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

function initDrag() {
  // Bind existing titlebars
  document.querySelectorAll('.window-titlebar').forEach(bar => {
    const frame = bar.closest('.window-frame') || bar.closest('#home-panel');
    if (frame) makeDraggable(bar, frame);
  });

  // Reset dragged windows when entering mobile layout
  window.matchMedia('(max-width: 480px)').addEventListener('change', (e) => {
    if (e.matches) {
      document.querySelectorAll('.window-frame.dragged').forEach(f => {
        f.style.left = '';
        f.style.top = '';
        f.classList.remove('dragged');
      });
    }
  });

  // Global move/end listeners (only need once)
  document.addEventListener('mousemove', (e) => _moveDrag(e.clientX, e.clientY));
  document.addEventListener('mouseup', _endDrag);
  document.addEventListener('touchmove', (e) => {
    if (!_dragging) return;
    e.preventDefault();
    const t = e.touches[0];
    _moveDrag(t.clientX, t.clientY);
  }, { passive: false });
  document.addEventListener('touchend', _endDrag);
}

/* ====== MAP ====== */
function renderMap() {
  const tpl = document.getElementById('tpl-map-pin');
  const container = dom.mapContent.querySelector('.map-container');

  state.data.social.forEach(s => {
    const clone = tpl.content.cloneNode(true);
    const pin = clone.querySelector('.map-pin');
    pin.href = s.url;
    pin.setAttribute('aria-label', s.label);
    pin.style.left = s.mapX + '%';
    pin.style.top = s.mapY + '%';

    // Insert icon from PNG
    const img = document.createElement('img');
    img.src = `assets/icons/map/${s.icon}.png`;
    img.alt = s.label;
    pin.insertBefore(img, pin.firstChild);

    clone.querySelector('.map-pin-label').textContent = s.label;
    container.appendChild(clone);
  });
}


/* ====== SOUND EFFECTS ====== */
function initAudio() {
  if (state.audioCtx) return;
  try {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    preloadSounds();
  } catch (e) { /* no audio support */ }
}

async function preloadSounds() {
  const sfx = state.data && state.data.soundEffects;
  if (!sfx) return;
  const ctx = state.audioCtx;
  for (const [type, path] of Object.entries(sfx)) {
    if (!path) continue;
    try {
      const res = await fetch(path);
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      state.soundBuffers[type] = await ctx.decodeAudioData(buf);
    } catch (e) {
      console.warn(`Failed to load sound: ${type}`, e);
    }
  }
}

function playSound(type) {
  if (!state.audioCtx) return;
  const ctx = state.audioCtx;

  // Use MP3 if available
  if (state.soundBuffers[type]) {
    try {
      const source = ctx.createBufferSource();
      source.buffer = state.soundBuffers[type];
      source.connect(ctx.destination);
      source.start();
    } catch (e) { /* audio context suspended or unavailable */ }
    return;
  }

  // Fallback: synthesized sounds (match prefixes like 'openVideos', 'closeGames', etc.)
  const now = ctx.currentTime;

  if (type.startsWith('open') || type.startsWith('close')) {
    const isOpen = type.startsWith('open');
    const freqs = isOpen ? [440, 554, 660] : [660, 554, 440];
    const step = isOpen ? 0.06 : 0.05;
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * step);
      g.gain.setValueAtTime(0.08, now + i * step);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * step + 0.12);
      osc.connect(g).connect(ctx.destination);
      osc.start(now + i * step);
      osc.stop(now + i * step + 0.12);
    });
    return;
  }

  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.connect(gain);

  if (type.startsWith('hover')) {
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.start(now); osc.stop(now + 0.06);
  } else if (type === 'click') {
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now); osc.stop(now + 0.1);
  }
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

  // Flip: click portrait to show about
  dom.portraitArea.addEventListener('click', () => {
    dom.homePanel.classList.add('flipped');
    playSound('changeView');
  });

  // Flip back: click back button to return to front
  dom.flipBackBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dom.homePanel.classList.remove('flipped');
    playSound('changeView');
  });

  // Reopen button
  dom.reopenBtn.addEventListener('click', () => {
    playSound('changeView');
    openHome();
  });

  // Escape key closes topmost window
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeTopWindow(true);
  });

  // Event delegation for video cards
  dom.videosContent.addEventListener('click', (e) => {
    const card = e.target.closest('[data-video-id]');
    if (!card) return;
    playSound('click');
    openPlayer(card.dataset.videoId);
  });

  // Event delegation for game cards
  dom.gamesContent.addEventListener('click', (e) => {
    const card = e.target.closest('[data-game-id]');
    if (!card) return;
    playSound('click');
    const game = state.data.games.find(g => g.id === card.dataset.gameId);
    if (game && game.itchUrl) {
      const isMobile = window.innerWidth < 768;
      if (isMobile) window.location.href = game.itchUrl;
      else window.open(game.itchUrl, '_blank', 'noopener,noreferrer');
    }
  });

  // Hover sounds on map pins (delegated via capture)
  if (state.hasHover) {
    dom.mapContent.addEventListener('mouseenter', (e) => {
      if (e.target.closest('.map-pin')) playSound('hoverPin');
    }, true);
  }

}
