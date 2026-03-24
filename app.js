/* ====== STATE ====== */
const state = {
  data: null,
  activeWindow: null,
  playerWindow: false,
  videoView: 'icon',    // 'icon' | 'column' | 'list'
  gameView: 'column',   // 'icon' | 'column' | 'list'
  audioCtx: null,
  soundBuffers: {},   // preloaded MP3 buffers
  mapRendered: false,
  hasHover: window.matchMedia('(hover: hover)').matches,
  homeOpen: true,
};

const VIEW_CYCLE = ['icon', 'column', 'list'];

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
  dom.aboutBio = document.getElementById('about-bio');
  dom.overlay = document.getElementById('window-overlay');
  dom.windowVideos = document.getElementById('window-videos');
  dom.windowGames = document.getElementById('window-games');
  dom.windowMap = document.getElementById('window-map');
  dom.windowPlayer = document.getElementById('window-player');
  dom.videosContent = document.getElementById('videos-content');
  dom.gamesContent = document.getElementById('games-content');
  dom.mapContent = document.getElementById('map-content');
  dom.playerContent = document.getElementById('player-content');
  dom.playerTitle = document.getElementById('player-title');
  dom.toggleVideoView = document.getElementById('toggle-video-view');
  dom.toggleGameView = document.getElementById('toggle-game-view');
}

/* ====== INIT ====== */
document.addEventListener('DOMContentLoaded', async () => {
  cacheDom();
  await loadData();
  if (!state.data) return;
  applyTheme();
  renderHome();
  bindEvents();
  updateVistaIcons();
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
  }
}

/* ====== THEME FROM DATA ====== */
function applyTheme() {
  const t = state.data.theme;
  if (!t) return;
  const root = document.documentElement.style;
  if (t.bg) root.setProperty('--bg', t.bg);
  if (t.panelBg) root.setProperty('--panel-bg', t.panelBg);
  if (t.accent) root.setProperty('--accent', t.accent);
  if (t.accentLight) root.setProperty('--accent-light', t.accentLight);
  if (t.accentDark) root.setProperty('--accent-dark', t.accentDark);
  if (t.accentPale) root.setProperty('--accent-pale', t.accentPale);
  if (t.mapLand) root.setProperty('--map-land', t.mapLand);
  if (t.mapSea) root.setProperty('--map-sea', t.mapSea);
  if (t.textDark) root.setProperty('--text-dark', t.textDark);
  if (t.textLight) root.setProperty('--text-light', t.textLight);
  if (t.shadow) root.setProperty('--shadow', t.shadow);
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
  dom.homePanel.classList.remove('hidden');
  // Reset position if it was dragged
  dom.homePanel.style.position = '';
  dom.homePanel.style.left = '';
  dom.homePanel.style.top = '';
  state.homeOpen = true;
  playSound('open');
}

/* ====== WINDOW SYSTEM ====== */
const ANIM_MS = 150;

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  if (state.activeWindow && state.activeWindow !== id) {
    closeWindow(false);
  }

  dom.overlay.hidden = false;
  win.hidden = false;
  void win.offsetHeight;
  win.classList.add('open');

  state.activeWindow = id;

  // Window-specific open sounds
  const openSounds = { 'window-videos': 'openVideos', 'window-games': 'openGames', 'window-map': 'openMap' };
  playSound(openSounds[id] || 'open');

  if (id === 'window-videos') renderVideos();
  else if (id === 'window-games') renderGames();
  else if (id === 'window-map' && !state.mapRendered) { renderMap(); state.mapRendered = true; }
}

function closeWindow(withSound = true) {
  if (state.playerWindow) { closePlayer(withSound); return; }

  const id = state.activeWindow;
  if (!id) return;

  const win = document.getElementById(id);
  if (!win) return;

  win.classList.remove('open');
  if (withSound) playSound('close');

  setTimeout(() => {
    win.hidden = true;
    dom.overlay.hidden = true;
    // Reset drag position
    win.style.left = '';
    win.style.top = '';
    win.classList.remove('dragged');
  }, ANIM_MS);

  state.activeWindow = null;
}

function openPlayer(videoId) {
  const video = state.data.videos.find(v => v.id === videoId);
  if (!video) return;

  dom.playerTitle.textContent = video.title;

  dom.playerContent.innerHTML = '';
  const vid = document.createElement('video');
  vid.controls = true;
  vid.autoplay = true;
  const src = document.createElement('source');
  src.src = videoPath(video.id);
  src.type = 'video/webm';
  vid.appendChild(src);
  dom.playerContent.appendChild(vid);

  dom.windowPlayer.hidden = false;
  void dom.windowPlayer.offsetHeight;
  dom.windowPlayer.classList.add('open');
  state.playerWindow = true;
  playSound('open');
}

function closePlayer(withSound = true) {
  const vid = dom.playerContent.querySelector('video');
  if (vid) { vid.pause(); vid.removeAttribute('src'); vid.load(); }

  dom.windowPlayer.classList.remove('open');
  if (withSound) playSound('close');

  setTimeout(() => {
    dom.windowPlayer.hidden = true;
    dom.playerContent.innerHTML = '';
    dom.windowPlayer.style.left = '';
    dom.windowPlayer.style.top = '';
    dom.windowPlayer.classList.remove('dragged');
  }, ANIM_MS);

  state.playerWindow = false;
}

/* ====== VIDEOS ====== */
function renderVideos() {
  if (state.videoView === 'icon') renderVideosIcon();
  else if (state.videoView === 'column') renderVideosColumn();
  else renderVideosList();
}

function renderVideosIcon() {
  const vids = state.data.videos;
  dom.videosContent.innerHTML = `<div class="cards-grid">${vids.map(v => `
    <div class="card card-video" data-video-id="${v.id}">
      <div class="card-thumb">
        <img src="${thumbPath(v.id)}" alt="${v.title}" loading="lazy" onerror="this.style.display='none'">
      </div>
      <div class="card-info">
        <span class="card-title">${v.title}</span>
      </div>
    </div>
  `).join('')}</div>`;
}

function renderVideosColumn() {
  const vids = state.data.videos;
  dom.videosContent.innerHTML = `<div class="cards-column">${vids.map(v => `
    <div class="card card-video" data-video-id="${v.id}">
      <div class="card-thumb">
        <img src="${thumbPath(v.id)}" alt="${v.title}" loading="lazy" onerror="this.style.display='none'">
      </div>
      <div class="card-info">
        <span class="card-title">${v.title}</span>
      </div>
    </div>
  `).join('')}</div>`;
}

function renderVideosList() {
  const vids = state.data.videos;
  dom.videosContent.innerHTML = `<div class="cards-list">${vids.map(v => `
    <div class="list-item" data-video-id="${v.id}">
      <div class="list-thumb">
        <img src="${thumbPath(v.id)}" alt="${v.title}" loading="lazy" onerror="this.style.display='none'">
      </div>
      <div class="list-info">
        <span class="list-title">${v.title}</span>
      </div>
    </div>
  `).join('')}</div>`;
}

/* ====== GAMES ====== */
function renderGames() {
  if (state.gameView === 'icon') renderGamesIcon();
  else if (state.gameView === 'column') renderGamesColumn();
  else renderGamesList();
}

function renderGamesIcon() {
  const games = state.data.games;
  dom.gamesContent.innerHTML = `<div class="cards-grid">${games.map(g => `
    <div class="card card-game" data-game-id="${g.id}">
      <div class="card-thumb">
        <img src="${thumbPath(g.id)}" alt="${g.title}" loading="lazy" onerror="this.style.display='none'">
      </div>
      <div class="card-info">
        <span class="card-title">${g.title}</span>
      </div>
    </div>
  `).join('')}</div>`;
}

function renderGamesColumn() {
  const games = state.data.games;
  dom.gamesContent.innerHTML = `<div class="cards-column">${games.map(g => `
    <div class="card card-game" data-game-id="${g.id}">
      <div class="card-thumb">
        <img src="${thumbPath(g.id)}" alt="${g.title}" loading="lazy" onerror="this.style.display='none'">
      </div>
      <div class="card-info">
        <span class="card-title">${g.title}</span>
        <span class="card-desc-gray">${g.description || ''}</span>
      </div>
    </div>
  `).join('')}</div>`;
}

function renderGamesList() {
  const games = state.data.games;
  dom.gamesContent.innerHTML = `<div class="cards-list">${games.map(g => `
    <div class="list-item" data-game-id="${g.id}">
      <div class="list-thumb">
        <img src="${thumbPath(g.id)}" alt="${g.title}" loading="lazy" onerror="this.style.display='none'">
      </div>
      <div class="list-info">
        <span class="list-title">${g.title}</span>
        <span class="list-desc">${g.role}</span>
      </div>
    </div>
  `).join('')}</div>`;
}

/* ====== PLACEHOLDERS (cached) ====== */
const PLACEHOLDER = `<svg class="card-thumb-placeholder" viewBox="0 0 40 40" fill="none" stroke="#ccc" stroke-width="2"><rect x="4" y="4" width="32" height="32"/><path d="M16 14l8 6-8 6z" fill="#ccc"/></svg>`;
const PLACEHOLDER_SM = `<svg style="width:24px;height:24px;opacity:0.2" viewBox="0 0 40 40" fill="none" stroke="#999" stroke-width="2"><rect x="4" y="4" width="32" height="32"/><path d="M16 14l8 6-8 6z" fill="#999"/></svg>`;

/* ====== VIEW TOGGLE ====== */
function updateVistaIcons() {
  const vGrid = dom.toggleVideoView.querySelector('.icon-grid');
  const vCol = dom.toggleVideoView.querySelector('.icon-column');
  const vList = dom.toggleVideoView.querySelector('.icon-lista');
  vGrid.classList.toggle('active', state.videoView === 'icon');
  vCol.classList.toggle('active', state.videoView === 'column');
  vList.classList.toggle('active', state.videoView === 'list');

  const gGrid = dom.toggleGameView.querySelector('.icon-grid');
  const gCol = dom.toggleGameView.querySelector('.icon-column');
  const gList = dom.toggleGameView.querySelector('.icon-lista');
  gGrid.classList.toggle('active', state.gameView === 'icon');
  gCol.classList.toggle('active', state.gameView === 'column');
  gList.classList.toggle('active', state.gameView === 'list');
}

function nextView(current) {
  const i = VIEW_CYCLE.indexOf(current);
  return VIEW_CYCLE[(i + 1) % VIEW_CYCLE.length];
}

/* ====== DRAGGABLE WINDOWS ====== */
function initDrag() {
  const titlebars = document.querySelectorAll('.window-titlebar');
  let dragging = null;
  let offsetX = 0, offsetY = 0;

  titlebars.forEach(bar => {
    bar.addEventListener('mousedown', (e) => {
      // Don't drag if clicking a button
      if (e.target.closest('button')) return;

      const frame = bar.closest('.window-frame') || bar.closest('#home-panel');
      if (!frame) return;

      dragging = frame;
      const rect = frame.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      frame.classList.add('dragging');
      e.preventDefault();
    });
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;

    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;

    // For home-panel, switch to fixed positioning on first drag
    if (dragging.id === 'home-panel' && dragging.style.position !== 'fixed') {
      const rect = dragging.getBoundingClientRect();
      dragging.style.position = 'fixed';
      dragging.style.left = rect.left + 'px';
      dragging.style.top = rect.top + 'px';
      dragging.style.margin = '0';
      dragging.style.zIndex = '50';
    }

    dragging.style.left = x + 'px';
    dragging.style.top = y + 'px';

    // For window-frames, remove the centering transform
    if (dragging.classList.contains('window-frame')) {
      dragging.classList.add('dragged');
    }
  });

  document.addEventListener('mouseup', () => {
    if (dragging) {
      dragging.classList.remove('dragging');
      dragging = null;
    }
  });
}

/* ====== MAP ====== */
function renderMap() {
  const social = state.data.social;
  const land = getVar('--map-land');
  const sea = getVar('--map-sea');

  const mapSvg = `
    <svg viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="450" fill="${sea}"/>
      <path d="M8 12 Q15 8 20 14 L25 10 Q35 6 40 12 L590 10 Q596 15 592 20 L594 430 Q590 440 580 438 L20 442 Q10 440 12 430 Z" fill="${sea}" stroke="#b8b0a0" stroke-width="1.5"/>
      <path d="M80 80 Q120 50 180 70 Q200 40 240 60 Q260 50 280 70 Q290 90 270 110 Q300 130 280 160 Q260 180 220 170 Q200 200 160 180 Q130 190 110 160 Q80 150 70 120 Q60 100 80 80Z" fill="${land}" opacity="0.85"/>
      <path d="M320 100 Q370 60 430 80 Q470 70 500 100 Q530 120 520 160 Q540 200 510 230 Q480 250 440 240 Q400 260 360 230 Q330 210 340 170 Q310 140 320 100Z" fill="${land}" opacity="0.75"/>
      <path d="M150 260 Q200 230 260 250 Q300 240 340 270 Q370 300 350 340 Q330 370 280 360 Q240 380 200 350 Q160 340 150 300 Q140 280 150 260Z" fill="${land}" opacity="0.8"/>
      <path d="M420 280 Q460 260 500 280 Q530 300 520 340 Q510 370 470 370 Q440 380 420 350 Q400 320 420 280Z" fill="${land}" opacity="0.7"/>
      <ellipse cx="100" cy="230" rx="25" ry="18" fill="${land}" opacity="0.6"/>
      <ellipse cx="480" cy="200" rx="20" ry="14" fill="${land}" opacity="0.55"/>
      <ellipse cx="300" cy="400" rx="30" ry="15" fill="${land}" opacity="0.5"/>
      <line x1="550" y1="30" x2="550" y2="70" stroke="#b8b0a0" stroke-width="1" opacity="0.4"/>
      <line x1="530" y1="50" x2="570" y2="50" stroke="#b8b0a0" stroke-width="1" opacity="0.4"/>
      <text x="550" y="25" text-anchor="middle" fill="#b8b0a0" font-size="10" opacity="0.5">N</text>
    </svg>
  `;

  dom.mapContent.innerHTML = `<div class="map-container">${mapSvg}</div>`;

  const container = dom.mapContent.querySelector('.map-container');
  social.forEach(s => {
    const pin = document.createElement('a');
    pin.href = s.url;
    pin.target = '_blank';
    pin.rel = 'noopener noreferrer';
    pin.className = 'map-pin';
    pin.setAttribute('aria-label', s.label);
    pin.style.left = s.mapX + '%';
    pin.style.top = s.mapY + '%';
    pin.innerHTML = socialIcon(s.icon) + `<span class="map-pin-label">${s.label}</span>`;
    container.appendChild(pin);
  });
}

function getVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function socialIcon(type) {
  const icons = {
    instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>`,
    linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7.5 0h3.8v2.2h.05c.53-1 1.83-2.2 3.77-2.2 4.03 0 4.78 2.65 4.78 6.1V24h-4v-8.7c0-2.08-.04-4.75-2.9-4.75-2.9 0-3.35 2.27-3.35 4.6V24H8V8z"/></svg>`,
    itch: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.13 1.34C2.08 2.04 1 3.89 1 5.02v1.09c0 1.37.71 2.56 1.82 2.98.08.03.16.05.24.07.93.23 1.82-.2 2.39-.82.56.62 1.35 1.05 2.26 1.05.9 0 1.67-.41 2.23-1.02.56.6 1.33 1.02 2.23 1.02.9 0 1.7-.43 2.26-1.05.57.62 1.46 1.05 2.39.82.08-.02.16-.04.24-.07C18.29 8.67 19 7.48 19 6.11V5.02c0-1.13-1.08-2.98-2.13-3.68C15.73.64 12.1.5 10 .5S4.27.64 3.13 1.34zM10 10.8c-.43.5-1.05.83-1.74.83-.54 0-1.08-.2-1.51-.58-.43.38-.97.58-1.5.58-.78 0-1.48-.39-1.93-.99C2.6 12.72 1 16.86 1 18.58 1 21.76 4.42 23.5 10 23.5s9-1.74 9-4.92c0-1.72-1.6-5.86-2.32-7.94-.45.6-1.15.99-1.93.99-.53 0-1.07-.2-1.5-.58-.43.38-.97.58-1.51.58-.69 0-1.31-.33-1.74-.83z"/></svg>`,
    soundcloud: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 18V13h1v5H1zm2.5-6.5V18H5v-6.5H3.5zM6 10v8h1.5v-8H6zm2.5-1v9H10v-9H8.5zM11 7v11h1.5V7H11zm3 0c2.5 0 4.5 1.8 4.9 4.1.4-.1.7-.1 1.1-.1 2.2 0 4 1.8 4 4s-1.8 4-4 4h-6V7z"/></svg>`,
    discord: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.25a18.27 18.27 0 0 0-5.49 0 12.64 12.64 0 0 0-.62-1.25.08.08 0 0 0-.08-.04 19.74 19.74 0 0 0-4.89 1.52.07.07 0 0 0-.03.03C1.02 8.93.34 13.35.7 17.72a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.22-2a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1-.01-.13c.13-.09.25-.19.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.07 0a.07.07 0 0 1 .08.01c.12.1.25.2.37.29a.08.08 0 0 1 0 .13c-.6.35-1.22.65-1.87.9a.08.08 0 0 0-.04.1c.36.7.77 1.37 1.22 2a.08.08 0 0 0 .08.03 19.83 19.83 0 0 0 6-3.03.08.08 0 0 0 .03-.05c.42-4.37-.71-8.75-2.98-13.36a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.15 0-2.1-1.06-2.1-2.36s.93-2.36 2.1-2.36c1.18 0 2.12 1.07 2.1 2.36 0 1.3-.93 2.36-2.1 2.36zm7.77 0c-1.15 0-2.1-1.06-2.1-2.36s.93-2.36 2.1-2.36c1.18 0 2.12 1.07 2.1 2.36 0 1.3-.92 2.36-2.1 2.36z"/></svg>`,
    email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg>`,
  };
  return icons[type] || '';
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
    const source = ctx.createBufferSource();
    source.buffer = state.soundBuffers[type];
    source.connect(ctx.destination);
    source.start();
    return;
  }

  // Fallback: synthesized sounds
  const now = ctx.currentTime;

  if (type === 'open' || type === 'close') {
    const freqs = type === 'open' ? [440, 554, 660] : [660, 554, 440];
    const step = type === 'open' ? 0.06 : 0.05;
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

  if (type === 'hover') {
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
  // Init audio on first interaction
  document.addEventListener('click', () => initAudio(), { once: true });

  // Nav buttons (each has its own click + open sound)
  dom.btnVideos.addEventListener('click', () => { playSound('clickVideos'); openWindow('window-videos'); });
  dom.btnGames.addEventListener('click', () => { playSound('clickGames'); openWindow('window-games'); });
  dom.btnMap.addEventListener('click', () => { playSound('clickMap'); openWindow('window-map'); });

  // Hover sounds (only on pointer devices)
  if (state.hasHover) {
    [dom.btnVideos, dom.btnGames, dom.btnMap].forEach(btn => {
      btn.addEventListener('mouseenter', () => playSound('hover'));
    });
  }

  // Close buttons for window frames
  document.querySelectorAll('.window-frame .close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const frame = btn.closest('.window-frame');
      if (frame.id === 'window-player') closePlayer(true);
      else closeWindow(true);
    });
  });

  // Close home panel
  dom.closeHome.addEventListener('click', (e) => {
    e.stopPropagation();
    closeHome();
  });

  // Reopen button
  dom.reopenBtn.addEventListener('click', () => {
    openHome();
  });

  // Overlay closes window
  dom.overlay.addEventListener('click', () => closeWindow(true));

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.playerWindow) closePlayer(true);
      else if (state.activeWindow) closeWindow(true);
    }
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

  // Hover sounds on map pins (delegated)
  if (state.hasHover) {
    dom.mapContent.addEventListener('mouseenter', (e) => {
      if (e.target.closest('.map-pin')) playSound('hover');
    }, true);
  }

  // View toggles (3-way cycle: icon → column → list)
  dom.toggleVideoView.addEventListener('click', (e) => {
    e.stopPropagation();
    playSound('click');
    state.videoView = nextView(state.videoView);
    updateVistaIcons();
    renderVideos();
  });

  dom.toggleGameView.addEventListener('click', (e) => {
    e.stopPropagation();
    playSound('click');
    state.gameView = nextView(state.gameView);
    updateVistaIcons();
    renderGames();
  });
}
