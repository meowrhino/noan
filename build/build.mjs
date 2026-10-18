/* ============================================================
   build.mjs — data/site.json + projects/ + index.html → dist/, la web tal
   cual se publica.        node build/build.mjs

   La web es una sola página (las ventanas las pinta el JS). El build revisa
   los JSON y que esté cada fichero (miniaturas, vídeos, sonidos, iconos),
   escribe en el HTML lo que leen quien no ejecuta JS (la bio, los vídeos,
   los juegos y las redes), la imagen al compartir (1200×630, sharp) y las
   direcciones del sitio donde se publica.

   Si algo está mal (una coma, un campo mal escrito, un fichero que no está)
   para y dice qué, y no se publica nada: la web se queda como estaba.
   ============================================================ */

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugsOf } from '../js/house.js';
import { leerJSON, validar } from '../js/validar.js';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const OUT = join(ROOT, 'dist');
const at = (...p) => join(ROOT, ...p);
const fail = (msg) => { console.error(`\n✗ ${msg}\n\nNo se ha publicado nada: la web sigue como estaba.\n`); process.exit(1); };

/* ---------- leer y revisar ---------- */

const read = (rel) => {
  if (!existsSync(at(rel))) fail(`no encuentro ${rel}`);
  try { return leerJSON(readFileSync(at(rel), 'utf8'), rel); } catch (e) { fail(e.message); }
};
const schema = (t) => JSON.parse(readFileSync(at('schema', `${t}.json`), 'utf8'));
const site = read('data/site.json');
const errors = validar(site, schema('site'), 'data/site.json');
const projects = {};
const need = (rel, f) => { if (!existsSync(at(f))) errors.push(`${rel}: no encuentro ${f}`); };
for (const id of errors.length ? [] : slugsOf(site)) {
  const rel = `projects/${id}/project.json`;
  if (projects[id]) { errors.push(`data/site.json: "${id}" está dos veces en "lists"`); continue; }
  if (!existsSync(at(rel))) { errors.push(`data/site.json: "lists" dice "${id}", y no hay ningún ${rel}`); continue; }
  projects[id] = read(rel);
  errors.push(...validar(projects[id], schema('project'), rel));
  need(rel, `projects/${id}/thumbnail.webp`);
  if (site.lists.videos.includes(id)) need(rel, `projects/${id}/video.webm`);
}
if (!errors.length) {
  for (const [k, f] of Object.entries(site.soundEffects)) need(`data/site.json → soundEffects → ${k}`, f);
  for (const s of site.social) need(`data/site.json → social → ${s.id}`, `assets/icons/map/${s.icon}.png`);
  need('data/site.json → about', site.about.portrait);
}
if (errors.length) fail(errors.join('\n✗ '));
for (const d of readdirSync(at('projects'))) {
  if (existsSync(at('projects', d, 'project.json')) && !projects[d]) console.warn(`⚠ projects/${d} no está en data/site.json → lists: no se publica`);
}

/* Dónde se publica. Este repo ES la web (no hay copia de Noan), en GitHub
   Pages. shortcut: el dominio (noancittadino.com) está roto en Wix (ver
   NOAN_DOMINIO.md), así que se publica en meowrhino.github.io/noan/ sin
   indexar; cuando vuelva, DOMAIN = true, el dominio en Settings → Pages, y
   se publica en la raíz con el "url" de site.json, indexado. */
const DOMAIN = false;
const github = process.env.GITHUB_ACTIONS === 'true';
const repo = (process.env.GITHUB_REPOSITORY || '/').split('/')[1];
const SITE = DOMAIN || !github ? String(site.url || '').replace(/\/+$/, '') : `https://meowrhino.github.io/${repo}`;
const INDEX = DOMAIN && !!site.url;

/* ---------- la imagen al compartir, con sharp: el retrato sobre el fondo ---------- */

let og = null;
try {
  const sharp = (await import('sharp')).default;
  const cached = at('.cache', 'og', 'home.jpg');
  if (!(existsSync(cached) && statSync(cached).mtimeMs >= statSync(at(site.about.portrait)).mtimeMs)) {
    mkdirSync(dirname(cached), { recursive: true });
    const bg = site.theme.bg || '#ffffff';
    await sharp(at(site.about.portrait)).resize(1104, 534, { fit: 'contain', background: bg })
      .extend({ top: 48, bottom: 48, left: 48, right: 48, background: bg })
      .flatten({ background: bg }).jpeg({ quality: 85, mozjpeg: true }).toFile(cached);
  }
  og = cached;
} catch (e) {
  console.warn(`⚠ sin la imagen para compartir (${e.code || e.message}): sale el retrato tal cual. Se arregla con: npm ci`);
}

/* ---------- la página ---------- */

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const en = (v) => (typeof v === 'object' && v ? v.en ?? '' : v ?? '');
function swap(html, find, replace) {
  if (!find.test(html)) fail(`no encuentro ${find} en index.html: el build lo necesita para escribir la página.`);
  return html.replace(find, replace);
}

let html = readFileSync(at('index.html'), 'utf8');
html = swap(html, /<html lang="en">/, '<html lang="en" data-built>');
html = html.replaceAll('https://noancittadino.com', SITE);
html = swap(html, /<meta name="robots" content="[^"]*">/, `<meta name="robots" content="${INDEX ? 'index, follow' : 'noindex'}">`);
if (og) html = html.replaceAll(`${SITE}/${site.about.portrait}`, `${SITE}/og/home.jpg`);
// lo que lee quien no ejecuta JS (buscadores, vistas previas de enlaces)
const bio = en(site.about.bio).replace(/\{email:([^}]+)\}/g, '$1').replace(/\{([^}]+)\}/g, '$1');
html = swap(html, /(<body[^>]*>)/, `$1
  <noscript>
    <h1>${esc(site.about.name)}</h1>
    <p>${esc(bio)}</p>
    <h2>Videos</h2>
    <ul>${site.lists.videos.map((id) => `<li>${esc(projects[id].title)}</li>`).join('')}</ul>
    <h2>Games</h2>
    <ul>${site.lists.games.map((id) => `<li><a href="${esc(projects[id].itchUrl || '#')}">${esc(projects[id].title)}</a> — ${esc(en(projects[id].role))}</li>`).join('')}</ul>
    <p>${site.social.map((s) => `<a href="${esc(s.url)}">${esc(s.label)}</a>`).join(' · ')}</p>
  </noscript>`);

/* ---------- escribir dist/ ---------- */

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const f of ['style.css', 'js', 'fonts', 'assets', 'data', 'projects', '404.html']) cpSync(at(f), join(OUT, f), { recursive: true, filter: (x) => !x.endsWith('.DS_Store') });
writeFileSync(join(OUT, 'index.html'), html);
if (og) { mkdirSync(join(OUT, 'og'), { recursive: true }); cpSync(og, join(OUT, 'og', 'home.jpg')); }
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc></url>
</urlset>
`);
writeFileSync(join(OUT, 'robots.txt'), INDEX ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
writeFileSync(join(OUT, '.nojekyll'), '');

console.log(`✓ dist/: la web con ${site.lists.videos.length} vídeos y ${site.lists.games.length} juegos${INDEX ? ` · se indexa (${SITE})` : ' · sin indexar'}`);
