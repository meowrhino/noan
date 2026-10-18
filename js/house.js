/* house.js — la forma de la casa (data/site.json y projects/<id>/project.json)
   → la del data.json de antes, que es la que lee el resto del JS. La usan
   js/carga.js y el build. No toca el disco.

   Cada vídeo y cada juego tiene su carpeta en projects/ (project.json,
   thumbnail.webp y, los vídeos, video.webm); lists dice cuáles salen y en
   qué orden. */

export const slugsOf = (site) => [...site.lists.videos, ...site.lists.games];

export function toOld(site, projects) {
  const { $schema, url, lists, ...rest } = site;
  const item = (id) => { const { $schema: _, ...p } = projects[id]; return { id, ...p }; };
  return { ...rest, videos: lists.videos.map(item), games: lists.games.map(item) };
}
