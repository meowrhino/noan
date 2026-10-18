# noan

El portfolio de Noan Cittadino (compositor, productor y diseñador de sonido para videojuegos): un
escritorio con ventanas que se arrastran (about, vídeos, juegos, mapa de redes), sonidos en cada
gesto y tres idiomas (en, es, fr). Hecho por [meowrhino.studio](https://meowrhino.studio) con la
receta del estudio ([meowrhino/JAMstack](https://github.com/meowrhino/JAMstack)). Para Noan:
[GUIA.md](GUIA.md). Si el build falla: [CLAUDE.md](CLAUDE.md). El dominio:
[NOAN_DOMINIO.md](NOAN_DOMINIO.md).

```
noan/
├── data/site.json      # bio, colores, redes (pines del mapa), sonidos, textos de la interfaz;
│                       #   "lists": qué vídeos y juegos salen y en qué orden
├── projects/<id>/      # un vídeo o un juego: project.json, thumbnail.webp (y video.webm)
├── assets/             # iconos, retrato, pfps, sonidos, cursor
├── schema/             # qué campos lleva cada JSON (VS Code, el build y la vista previa)
├── build/build.mjs     # → dist/: revisa todo, escribe lo que se lee sin JS y la og:image
├── js/carga.js         # lee los JSON (y los revisa en la vista previa)
├── js/house.js         # la forma de la casa → la del data.json de antes
├── js/                 # main, render, windows, drag, sound, i18n, state, validar
└── fonts/              # Lexend en woff2 (sin Google Fonts)
```

## Cómo funciona

- **Este repo es la web**: no hay copia de Noan. La Action (`.github/workflows/deploy.yml`) corre
  el build y publica `dist/` en GitHub Pages (no Cloudflare: hay vídeos de más de 25 MB).
- **El dominio** (noancittadino.com) está roto en Wix: mientras tanto se publica en
  meowrhino.github.io/noan/ sin indexar. Cuando vuelva, `DOMAIN = true` en `build/build.mjs` y el
  dominio en Settings → Pages.
- **Vista previa**: Live Server sobre la carpeta. Sin `data-built` en `<html>`, `js/carga.js`
  revisa los JSON con `schema/` y enseña en pantalla lo que pararía el build.
