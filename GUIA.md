# Cómo mantener noancittadino.com

> **Regla de oro: solo se tocan `data/site.json`, `projects/` y las imágenes y sonidos de `assets/`.**
> Lo demás es el código.

## Qué hay

```
data/site.json             la bio, los colores, las redes (pines del mapa), los sonidos, los
                           textos de la interfaz y qué vídeos y juegos salen, en qué orden ("lists")
projects/<nombre>/         un vídeo o un juego, una carpeta:
  project.json               su título (y, los juegos, descripción, rol y enlace a itch.io)
  thumbnail.webp             la miniatura
  video.webm                 el vídeo (solo los vídeos)
assets/                    los iconos, el retrato, las fotos del reverso (pfps), los sonidos, el cursor
```

## La primera vez: preparar VS Code

1. En VS Code: **Archivo → Nueva ventana** → **Clonar repositorio Git…** → **Clonar desde GitHub**.
2. Instala **Live Server** cuando VS Code lo proponga. Abajo a la derecha sale **Go Live**: es la
   vista previa, y si algo está mal lo dice en pantalla.

**VS Code te ayuda con los campos**: si pasas el ratón por encima de uno te dice qué es, y si
escribes uno mal lo subraya en rojo. Lo sabe por la primera línea de cada JSON (`"$schema": …`):
**no la borres**.

## Subir los cambios

Pestaña **Control de código fuente** → escribe qué has hecho → **Confirmar** → **Sincronizar**. En
un par de minutos está en la web (la bolita de GitHub: amarilla, publicando; verde, ya está; roja,
algo no cuadra). Antes de empezar a tocar, **Sincronizar** también.

Formatos: imágenes en `.webp` con [imgToWeb](https://meowrhino.github.io/imgToWeb/) (en Chrome o
Firefox), vídeos en `.webm` con [videoToWeb](https://meowrhino.github.io/videoToWeb/), sonidos en `.mp3`.

---

## VIDEOS (showreel)

### ➕ Añadir un vídeo
1. Copia una carpeta de vídeo de `projects/` (`projects/hilda/` → `projects/nuevo/`; minúsculas,
   sin espacios ni acentos, con guiones).
2. Pon dentro su `video.webm` y su `thumbnail.webp`.
3. En `project.json`, el `title`.
4. En `data/site.json` → `lists` → `videos`, añade `"nuevo"` donde quieras que salga.

### ❌ Quitar un vídeo
Quítalo de `lists` → `videos` (y, si quieres, borra su carpeta).

---

## JUEGOS (game jams)

### ➕ Añadir un juego
1. Copia una carpeta de juego de `projects/` (`projects/ups/` → `projects/nuevo/`).
2. Pon dentro su `thumbnail.webp`.
3. En `project.json`: `title`, `description` y `role` (por idioma: `en`, `es`, `fr`) e `itchUrl`.
4. En `data/site.json` → `lists` → `games`, añade `"nuevo"` donde quieras que salga.

---

## ABOUT (bio)

### ✏️ Cambiar el texto de la bio
La bio es un objeto con una entrada por idioma. Editar `data/site.json` → `about.bio.en` / `.es` / `.fr`.

Dentro del texto se pueden usar estos marcadores que se convierten en links (la palabra entre llaves es siempre la misma — `{showreels}`, `{game jams}`, `{map}` — el texto que se muestra se traduce automáticamente según el idioma activo):
- `{showreels}` → link que abre la ventana de videos
- `{game jams}` → link que abre la ventana de juegos
- `{map}` → link que abre el mapa social (se muestra como "map" / "mapa" / "carte")
- `{email:tu@mail.com}` → link `mailto:`

Ejemplo:
```json
"bio": {
  "en": "My name is Noan... Check out my {showreels} and {game jams}! Email me at {email:nooanmusic@gmail.com}",
  "es": "Soy Noan... Echale un vistazo a mis {showreels} y {game jams}! Mail: {email:nooanmusic@gmail.com}",
  "fr": "Je m'appelle Noan... Jetez un œil a mes {showreels} et {game jams} ! Mail : {email:nooanmusic@gmail.com}"
}
```

### ✏️ Cambiar el retrato
- Versión normal: reemplaza `assets/icons/noan.png` (mismo nombre).
- Versión hover (al pasar el ratón): reemplaza `assets/icons/noan-hover.png` (mismo nombre).

---

## PFPs (galería del reverso)

Las fotos que aparecen al clicar el retrato. Están en `assets/pfps/` numeradas.

### ➕ Añadir una foto
Guárdala con el siguiente número disponible en `assets/pfps/`:
```
assets/pfps/1.webp
assets/pfps/2.webp
assets/pfps/3.webp   ← nueva
```
Se detectan automáticamente en orden hasta que falla la carga. No hay que tocar `data/site.json`.

### ❌ Borrar una foto
Renombra las posteriores para no dejar huecos. Si borras la `3.webp`, la `4.webp` pasa a ser la `3.webp`, etc.

---

## REDES SOCIALES / PINS DEL MAPA

Se editan desde `data/site.json` → `social`. Cada entrada:
```json
{
  "id": "instagram",
  "label": "Instagram",
  "url": "https://...",
  "icon": "instagram",
  "mapX": 28,
  "mapY": 55
}
```

| Campo | Qué es |
|---|---|
| `id` | Identificador interno |
| `label` | Texto visible al pasar el ratón sobre el pin |
| `url` | Dirección a donde lleva el link |
| `icon` | Nombre del archivo del pin en `assets/icons/map/` (sin extensión) |
| `mapX` | Posición horizontal del pin en el mapa (0 = izq, 100 = der) |
| `mapY` | Posición vertical del pin (0 = arriba, 100 = abajo) |

### ➕ Añadir una red nueva
1. Sube el icono a `assets/icons/map/mired.png`
2. Añade la entrada al array `social` en `data/site.json` con el `icon: "mired"`

---

## COLORES / TEMA

Editar `data/site.json` → `theme`. Todos los colores se aplican automáticamente como variables CSS.

| Variable | Uso |
|---|---|
| `bg` | Fondo general de la página |
| `panelBg` | Fondo del panel central |
| `accent` | Color de acento (botones, enlaces) |
| `accentLight` | Variante clara del acento |
| `accentDark` | Variante oscura del acento |
| `accentPale` | Versión pálida del acento |
| `mapLand` | Color de la tierra en el mapa |
| `mapSea` | Color del mar en el mapa |
| `textDark` | Color de texto sobre fondos claros |
| `textLight` | Color de texto sobre fondos oscuros |
| `shadow` | Color de las sombras |
| `playerBg` | Fondo del reproductor de video |

Formato hexadecimal (`#c47a4a`). Usa https://colorpicker.me para escoger.

---

## SONIDOS

Cada interacción tiene su efecto en `assets/sounds/`. El mapeo está en `data/site.json` → `soundEffects`.

### ✏️ Cambiar un sonido
Reemplaza el `.mp3` en `assets/sounds/` (mismo nombre) o cambia la ruta en `data/site.json` → `soundEffects`.

Si algo falla, aparece un `console.warn` claro en el navegador.

### Lista de sonidos mapeados
- `openHome` / `closeHome` — abrir/cerrar pantalla principal
- `openVideos` / `closeVideos` — abrir/cerrar ventana de videos
- `openGames` / `closeGames` — abrir/cerrar ventana de juegos
- `openMap` / `closeMap` — abrir/cerrar mapa
- `openPlayer` / `closePlayer` — abrir/cerrar reproductor
- `openWelcome` / `closeWelcome` — abrir/cerrar ventana "How To"
- `hoverVideos` / `hoverGames` / `hoverMap` / `hoverPin` / `hoverHome` — hover sobre elementos
- `clickPin` — click en un pin del mapa
- `changeView` / `flipHome*` / `flipPfp*` — transiciones (flip del retrato, etc.)
- `globalClick` — sonido global que suena en CADA click (con pitch aleatorio para no ser repetitivo)

---

## CURSOR PERSONALIZADO

El cursor del ratón es un SVG personalizado con dos estados (normal y al hacer click).

### ✏️ Cambiar el dibujo del cursor
Reemplaza:
- `assets/cursor/normal.svg` ← cursor en reposo
- `assets/cursor/click.svg` ← cursor mientras se pulsa el botón

Dentro del SVG, fíjate en el atributo `width=` y `height=` (sale en la primera línea, ej. `width="48"`). Cuanto más grande, más grande se ve el cursor. Tope del navegador: 128×128.

### ✏️ Cambiar el "hotspot" (el punto donde clica el cursor)
En `style.css`, busca:
```css
body { cursor: url('assets/cursor/normal.svg') 16 16, auto; }
body.cursor-down { cursor: url('assets/cursor/click.svg') 16 16, auto; }
```
Los dos números (`16 16`) son las coordenadas X,Y de la "punta" del cursor dentro del dibujo. Si el cursor parece descuadrado al clicar (clica al lado de donde apunta), ajusta esos números.

---

## IDIOMAS / TRADUCCIONES

La web está en **EN / ES / FR**, con un botón abajo a la derecha que cicla entre los tres. El idioma por defecto se detecta del navegador del usuario (si tiene el navegador en español → ES, en francés → FR, resto → EN). La elección manual se recuerda con `localStorage`.

### ✏️ Editar las traducciones
- **Bio** → `data/site.json` → `about.bio.en` / `.es` / `.fr`
- **Descripciones de juegos y rol** → `data/site.json` → cada juego tiene `description.{lang}` y `role.{lang}`
- **Strings de UI** (títulos de ventana, botones, mensaje "How to") → `data/site.json` → `i18n.{lang}.{key}`

### ➕ Añadir un idioma nuevo (ej. italiano `it`)
1. En `js/state.js`, busca la línea `export const SUPPORTED_LANGS = ['en', 'es', 'fr'];` y añade el nuevo código: `['en', 'es', 'fr', 'it']`. (También conviene añadirlo en la lista `supported` del pequeño script que hay dentro de `index.html`, en la cabecera.)
2. En `data/site.json` → `i18n` añade un bloque `"it": { ... }` con todas las claves traducidas (puedes copiar el bloque `en` y traducir uno a uno).
3. En `data/site.json` → `about.bio` añade `"it": "..."`.
4. En cada juego, añade `description.it` y `role.it`.

Si te dejas una traducción, el sistema cae automáticamente al inglés en ese campo (no se rompe nada).

### Strings de UI traducibles
| Clave | Dónde aparece |
|---|---|
| `windowAbout` / `windowVideos` / `windowGames` / `windowMap` / `windowHowTo` | Títulos de las ventanas |
| `btnReopen` | Botón "noan" cuando cierras la ventana principal |
| `btnHowto` | Botón "how to" cuando cierras la ventana de bienvenida |
| `welcome` | Texto del cartel de bienvenida |
| `creditsDrawings` / `creditsWeb` | Prefijos de los créditos del reverso |
| `linkShowreels` / `linkGameJams` / `linkMap` | Etiqueta de los links dentro de la bio |

---

## SEO

El título, la descripción y lo que sale al compartir están en el `<head>` de `index.html`. La
imagen al compartir la hace el build con el retrato. Las direcciones, el `robots.txt` y el
`sitemap.xml` también los escribe el build (mientras el dominio no funcione, la web no se indexa:
ver `NOAN_DOMINIO.md`).

---

## Si sale en rojo

La web no se rompe: se queda como estaba hasta que se arregla. En GitHub, pincha la bolita roja,
luego **Details**, y lee el último mensaje, que dice el fichero y qué pasa (en la vista previa,
**Go Live**, sale en pantalla):

- **"no es un JSON válido, línea 12"** → casi siempre **una coma**: que falta entre dos cosas, o
  que sobra después de la última. O unas comillas sin cerrar.
- **"\"titel\" no es un campo de aquí (¿mal escrito?). Los que hay: title, description…"** → un
  campo mal escrito: cópialo de la lista que sale en el mensaje.
- **"no encuentro projects/nuevo/video.webm"** (o `thumbnail.webp`, o un sonido) → el fichero no
  se llama así o no se ha subido.
- **"\"lists\" dice \"nuevo\", y no hay ningún projects/nuevo/project.json"** → el nombre de la
  lista y el de la carpeta no son iguales.

---

La web la hizo **manu (@meowrhino)**. Si algo se rompe y no sabes arreglarlo, contacta.
