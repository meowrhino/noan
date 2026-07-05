/*
 * NOAN PORTFOLIO — sound.js
 * ═════════════════════════
 * ====== SOUND EFFECTS ======
 * All sounds are defined in data.json under "soundEffects" as key→path pairs.
 * Keys follow the pattern: action + target (e.g. "openVideos", "hoverMap", "flipPfpForward").
 * Multiple keys can point to the same MP3 file.
 * Sounds are preloaded into AudioBuffers on first user interaction.
 */
import { state } from './state.js';

export function initAudio() {
  if (state.audioCtx) return;
  try {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    preloadSounds();
  } catch (e) { /* no audio support */ }
}

export async function preloadSounds() {
  const sfx = state.data && state.data.soundEffects;
  if (!sfx) return;
  const ctx = state.audioCtx;
  // Load all sounds in parallel so a single slow file doesn't delay the rest.
  await Promise.all(Object.entries(sfx).map(async ([type, path]) => {
    if (!path) return;
    try {
      const res = await fetch(path);
      if (!res.ok) {
        console.warn(`Sound '${type}' failed to load (HTTP ${res.status}). Check that the file exists at: ${path}`);
        return;
      }
      const buf = await res.arrayBuffer();
      state.soundBuffers[type] = await ctx.decodeAudioData(buf);
    } catch (e) {
      console.warn(`Sound '${type}' failed to load. Check that the file exists at: ${path}`, e);
    }
  }));
}

export function playSound(type, options) {
  if (!state.audioCtx) return;

  if (!state.soundBuffers[type]) {
    const sfx = state.data?.soundEffects;
    if (sfx && sfx[type]) {
      // Key exists in data.json but buffer wasn't loaded — file issue
      console.warn(`Sound '${type}' is defined in data.json but failed to load. Check: ${sfx[type]}`);
    } else {
      // Key doesn't exist at all — missing from data.json
      console.warn(`Sound '${type}' not found. Add it to soundEffects in data.json.`);
    }
    return;
  }

  try {
    const source = state.audioCtx.createBufferSource();
    source.buffer = state.soundBuffers[type];
    if (options?.pitch && Number.isFinite(options.pitch)) {
      source.playbackRate.value = options.pitch;
    }
    source.connect(state.audioCtx.destination);
    source.start();
  } catch (e) { /* audio context suspended or unavailable */ }
}
