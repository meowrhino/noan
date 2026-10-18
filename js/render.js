/*
 * NOAN PORTFOLIO — render.js
 * ══════════════════════════
 * Data loading, theming and all content rendering (home, about/bio, videos,
 * games, map, pfp gallery) plus the home-panel open/close.
 *
 * Dependency note: render.js deliberately does NOT import windows.js. Bio-link
 * clicks that open windows are wired via event delegation in main.js, so this
 * module has no dependency on the window system. It imports t() from i18n.js
 * (functions-only cycle, safe under hoisting).
 */
import { state, dom, thumbPath, videoPath, mapIconPath } from './state.js';
import { playSound } from './sound.js';
import { t } from './i18n.js';
import { loadData as loadSite } from './carga.js';

/* ====== DATA LOADING ====== */
export async function loadData() {
  try {
    state.data = await loadSite();
  } catch (e) {
    console.error('Failed to load the data', e);
    // en la vista previa, js/carga.js ya lo cuenta en pantalla, con el detalle
    if (!document.getElementById('errores-vista-previa')) document.body.innerHTML = '<p style="padding:2rem;text-align:center;font-family:system-ui;color:#3d3532">Failed to load. Please refresh.</p>';
  }
}

/* ====== THEME FROM DATA ====== */
const THEME_MAP = {
  bg:'--bg', panelBg:'--panel-bg', accent:'--accent', accentLight:'--accent-light',
  accentDark:'--accent-dark', accentPale:'--accent-pale', mapLand:'--map-land',
  mapSea:'--map-sea', textDark:'--text-dark', textLight:'--text-light', shadow:'--shadow',
  playerBg:'--player-bg'
};

export function applyTheme() {
  const t = state.data.theme;
  if (!t) return;
  const root = document.documentElement.style;
  for (const [key, prop] of Object.entries(THEME_MAP)) {
    if (t[key]) root.setProperty(prop, t[key]);
  }
}

/* ====== HOME RENDERING ====== */
export function renderHome() {
  const d = state.data;
  dom.portraitImg.src = d.about.portrait;
  dom.portraitImg.alt = d.about.name;

  // Hover variant of the portrait
  if (dom.portraitHover && d.assets?.portraitHover) {
    dom.portraitHover.src = d.assets.portraitHover;
  }

  // Set nav button icons from data.json
  const nav = d.assets?.navButtons;
  if (nav) {
    const btns = { videos: dom.btnVideos, games: dom.btnGames, map: dom.btnMap };
    for (const [key, el] of Object.entries(btns)) {
      if (!nav[key] || !el) continue;
      const icon = el.querySelector('.btn-icon');
      const iconHover = el.querySelector('.btn-icon-hover');
      if (icon) icon.src = nav[key].icon;
      if (iconHover) iconHover.src = nav[key].iconHover;
    }
  }

  // Set map background from data.json
  if (d.assets?.mapBackground) {
    const mapBg = document.querySelector('.map-bg');
    if (mapBg) mapBg.src = d.assets.mapBackground;
  }
}

/* ====== ABOUT BIO RENDERING ====== */
const BIO_LINKS = {
  'showreels': { window: 'window-videos', i18nKey: 'linkShowreels' },
  'game jams': { window: 'window-games', i18nKey: 'linkGameJams' },
  'map':       { window: 'window-map',   i18nKey: 'linkMap' },
};

export function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

export function renderAboutBio() {
  const bioField = state.data?.about?.bio;
  // Support legacy string bios (single language) and new {en,es,fr} objects
  const bioText = typeof bioField === 'string'
    ? bioField
    : (bioField?.[state.lang] || bioField?.en || '');

  const paragraphs = bioText.split('\n\n');
  const html = paragraphs.map(p => {
    let safe = escapeHTML(p);
    // {email:addr} → mailto link
    safe = safe.replace(/\{email:([^}]+)\}/g, (_, addr) =>
      `<a class="bio-link" href="mailto:${escapeHTML(addr)}">${escapeHTML(addr)}</a>`
    );
    // {key} → window-opening link, label looked up per language
    safe = safe.replace(/\{([^}]+)\}/g, (_, key) => {
      const entry = BIO_LINKS[key];
      if (!entry) return key;
      const label = t(entry.i18nKey);
      return `<a class="bio-link bio-nav" href="#" data-open="${entry.window}">${escapeHTML(label)}</a>`;
    });
    return `<p>${safe}</p>`;
  }).join('');
  dom.aboutBio.innerHTML = html;
}

/* ====== HOME PANEL OPEN/CLOSE ====== */
export function closeHome() {
  dom.homePanel.classList.add('hidden');
  dom.reopenBtn.hidden = false;
  state.homeOpen = false;
  playSound('closeHome');
}

export function openHome() {
  dom.reopenBtn.hidden = true;
  dom.homePanel.classList.remove('hidden', 'flipped');
  // Reset position if it was dragged
  dom.homePanel.style.position = '';
  dom.homePanel.style.left = '';
  dom.homePanel.style.top = '';
  dom.homePanel.classList.remove('dragged');
  state.homeOpen = true;
  bringHomeFront();
  playSound('openHome');
}

// bringHomeFront lives in windows.js (z-index strategy). To avoid importing the
// whole window system into render.js just for one z-index bump, inline the same
// one-liner here; both use the shared monotonic state.nextZIndex counter.
function bringHomeFront() {
  dom.homePanel.style.zIndex = state.nextZIndex++;
}

/* ====== VIDEOS (grid view) ====== */
export function renderVideos() {
  const tpl = document.getElementById('tpl-video-card');
  const grid = document.createElement('div');
  grid.className = 'cards-grid';

  state.data.videos.forEach(v => {
    const clone = tpl.content.cloneNode(true);
    const card = clone.querySelector('.card');
    card.dataset.videoId = v.id;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Watch: ${v.title}`);
    const img = clone.querySelector('img');
    img.src = thumbPath(v.id);
    img.alt = v.title;
    img.addEventListener('error', () => {
      img.style.display = 'none';
      card.classList.add('thumb-error');
    });
    clone.querySelector('.card-title').textContent = v.title;
    grid.appendChild(clone);
  });

  dom.videosContent.innerHTML = '';
  dom.videosContent.appendChild(grid);
}

/* ====== GAMES (column view) ====== */
export function localized(field) {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  return field[state.lang] || field.en || '';
}

export function renderGames() {
  const tpl = document.getElementById('tpl-game-card');
  const column = document.createElement('div');
  column.className = 'cards-column';

  state.data.games.forEach(g => {
    const clone = tpl.content.cloneNode(true);
    const card = clone.querySelector('.card');
    card.dataset.gameId = g.id;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Open: ${g.title}`);
    const img = clone.querySelector('img');
    img.src = thumbPath(g.id);
    img.alt = g.title;
    img.addEventListener('error', () => {
      img.style.display = 'none';
      card.classList.add('thumb-error');
    });
    clone.querySelector('.card-title').textContent = g.title;
    clone.querySelector('.card-desc-gray').textContent = localized(g.description);
    const role = clone.querySelector('.card-role');
    const roleText = localized(g.role);
    if (roleText) role.textContent = roleText;
    else role.remove();
    column.appendChild(clone);
  });

  dom.gamesContent.innerHTML = '';
  dom.gamesContent.appendChild(column);
}

/* ====== MAP ====== */
export function renderMap() {
  const tpl = document.getElementById('tpl-map-pin');
  const container = dom.mapContent.querySelector('.map-container');

  state.data.social.forEach(s => {
    const clone = tpl.content.cloneNode(true);
    const pin = clone.querySelector('.map-pin');
    pin.href = s.url;
    pin.setAttribute('aria-label', s.label);
    pin.style.left = s.mapX + '%';
    pin.style.top = s.mapY + '%';
    pin.addEventListener('click', () => playSound('clickPin'));

    // Insert icon from PNG
    const img = document.createElement('img');
    img.src = mapIconPath(s.icon);
    img.alt = s.label;
    img.addEventListener('error', () => { img.style.display = 'none'; });
    pin.insertBefore(img, pin.firstChild);

    clone.querySelector('.map-pin-label').textContent = s.label;
    container.appendChild(clone);
  });
}

/* ====== PFP GALLERY (flip-through images) ====== */
export function initPfpGallery() {
  const container = dom.pfpGallery;
  if (!container) return;

  // Probe for sequential images: 1.webp, 2.webp, ...
  const images = [];
  let idx = 0;

  function buildGallery() {
    if (images.length === 0) { container.style.display = 'none'; return; }

    container.innerHTML = `
      <div class="pfp-flipper">
        <div class="pfp-face pfp-front"><img src="${images[0]}" alt="Profile photo"></div>
        <div class="pfp-face pfp-back"><img src="" alt="Profile photo"></div>
      </div>`;

    const flipper = container.querySelector('.pfp-flipper');
    const frontImg = container.querySelector('.pfp-front img');
    const backImg = container.querySelector('.pfp-back img');
    let flipped = false;

    container.addEventListener('click', () => {
      if (images.length <= 1) return;
      const nextIdx = (idx + 1) % images.length;
      // Flip direction: forward (Y+180) for sequential images,
      // reverse (Y-180) when wrapping back to the first image,
      // so the card always appears to spin in the logical direction.
      const goingForward = nextIdx !== 0;

      // Load next image on the hidden face
      if (flipped) {
        frontImg.src = images[nextIdx];
      } else {
        backImg.src = images[nextIdx];
      }

      // Toggle flip direction
      flipped = !flipped;
      if (goingForward) {
        flipper.classList.remove('flip-reverse');
        flipper.classList.toggle('flipped', flipped);
      } else {
        // Reverse animation when going back to first
        flipper.classList.add('flip-reverse');
        flipper.classList.toggle('flipped', flipped);
      }

      idx = nextIdx;
      playSound(goingForward ? 'flipPfpForward' : 'flipPfpBack');
    });
  }

  function probe(n) {
    const img = new Image();
    img.onload = () => {
      images.push(`assets/pfps/${n}.webp`);
      probe(n + 1);
    };
    img.onerror = () => buildGallery();
    img.src = `assets/pfps/${n}.webp`;
  }

  probe(1);
}
