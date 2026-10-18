/*
 * NOAN PORTFOLIO — state.js
 * ═════════════════════════
 * Shared runtime state, DOM refs and small pure helpers used across every module.
 * This module holds NO cross-module imports so it can be safely imported from
 * anywhere without creating cycles.
 *
 * Notes:
 *   - `dom` is filled by cacheDom() on DOMContentLoaded — do NOT read dom.* at
 *     module top-level, only inside functions that run after init.
 *   - `state.data` is null until loadData() (in render.js) resolves.
 */

/* ====== LANGUAGE ====== */
export const SUPPORTED_LANGS = ['en', 'es', 'fr'];

/*
 * Initial language resolution:
 *   1. Prior choice in localStorage wins (user picked it explicitly).
 *   2. Otherwise, fall back to the browser's preferred language if supported.
 *   3. Otherwise, English.
 */
export function detectInitialLang() {
  try {
    const stored = localStorage.getItem('lang');
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  } catch (e) { /* private mode / disabled storage */ }
  const browserLang = (navigator.language || '').toLowerCase().slice(0, 2);
  if (SUPPORTED_LANGS.includes(browserLang)) return browserLang;
  return 'en';
}

/* ====== STATE ====== */
export const state = {
  data: null,
  openWindows: new Set(),
  windowStack: [],       // ordered by focus, last = topmost
  nextZIndex: 100,
  audioCtx: null,
  soundBuffers: {},   // preloaded MP3 buffers
  mapRendered: false,
  hasHover: window.matchMedia('(hover: hover)').matches,
  homeOpen: true,
  lang: detectInitialLang(),
  focusReturn: new Map(), // windowId -> element to refocus when it closes
};

/* ====== SHARED CONSTANTS ====== */
// ANIM_MS must match the CSS pop-in/pop-out animation duration (0.15s).
export const ANIM_MS = 150;

/* ====== ASSET PATHS (derived from id: each video and game has its folder in projects/) ====== */
export function thumbPath(id) {
  return `projects/${id}/thumbnail.webp`;
}
export function videoPath(id) {
  return `projects/${id}/video.webm`;
}
export function mapIconPath(icon) {
  return `assets/icons/map/${icon}.png`;
}

/* ====== DOM REFS ====== */
export const dom = {};

export function cacheDom() {
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
  dom.howtoBtn = document.getElementById('howto-btn');
  dom.welcomeWindow = document.getElementById('welcome-window');
  dom.welcomeDismiss = document.getElementById('welcome-dismiss');
  dom.pfpGallery = document.getElementById('pfp-gallery');
  dom.portraitHover = document.getElementById('portrait-img-hover');
  dom.langBtn = document.getElementById('lang-btn');
}
