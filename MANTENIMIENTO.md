# Cómo mantener noancittadino.com

Guía paso a paso para añadir, modificar o borrar contenido de la web sin tocar código.

**Regla de oro:** todo se hace en **`data.json`** y archivos dentro de **`assets/`**. El código (`index.html`, `style.css`, `app.js`) no hay que tocarlo nunca.

---

## ⚠️ LÉEME PRIMERO

### Qué tocar y qué NO tocar
- ✅ **Sí puedes tocar:** `data.json`, los archivos dentro de `assets/` (imágenes, vídeos, sonidos)
- ❌ **Mejor no toques:** `index.html`, `style.css`, `app.js` (si no sabes qué estás haciendo, se puede romper algo)
- Si tocas algo por error, **no guardes**, cierra sin guardar y vuelve a abrir

### La web necesita un servidor para funcionar en local
No sirve abrir `index.html` con doble click. Hay que servirla con un servidor:
```bash
python3 -m http.server 8090
# luego abrir http://localhost:8090
```
(Esto es solo para probar en tu ordenador. En GitHub Pages funciona automático.)

### Formatos de imagen/vídeo
- **Imágenes:** preferiblemente `.webp` (más ligero que PNG/JPG). Tamaño recomendado 1000–2000px de ancho, peso < 300 KB.
- **Vídeos del showreel:** `.webm` con codec VP9. Sin audio si son miniaturas.
- **Thumbnails de videos/juegos:** `.png` transparente.

### Caché del navegador
Si cambias algo y al abrir la web sigues viendo lo viejo: es la caché.
**Refrescar con Ctrl+F5** (Windows) o **Cmd+Shift+R** (Mac).

---

## Cómo subir los cambios al sitio real

Todas las modificaciones que hagas en este repo se suben a la web con 3 acciones en GitHub:

### Desde la web de GitHub (lo más fácil)
1. Entra a https://github.com/[tu-usuario]/noan
2. Click en el archivo que quieres editar (ej. `data.json`) → botón lápiz ✏️
3. Edita, y al final de la página pulsa **Commit changes**

### Subir archivos nuevos (vídeos, imágenes, sonidos)
1. Entra a la carpeta donde va el archivo (ej. `assets/videos/`)
2. Pulsa **Add file → Upload files**
3. Arrastra el archivo y pulsa **Commit changes**

En pocos minutos GitHub Pages refresca la web automáticamente.

> Si usas VS Code o cualquier editor con git: `git add -A && git commit -m "update" && git push`

---

## Estructura del repo

```
noan/
├── index.html          ← Estructura (no tocar)
├── style.css           ← Estilos (no tocar)
├── app.js              ← Lógica (no tocar)
├── data.json           ← ⭐ El archivo que sí hay que tocar
├── robots.txt          ← Indexación buscadores
├── sitemap.xml         ← Mapa para Google
├── 404.html            ← Página "no encontrada"
├── MANTENIMIENTO.md    ← Este archivo
└── assets/
    ├── favicon.png
    ├── cursor/                   ← cursor personalizado (normal.svg, click.svg)
    ├── icons/
    │   ├── noan.png              ← retrato principal
    │   ├── noan-hover.png        ← retrato al pasar el ratón
    │   ├── btn-*.png             ← botones de navegación (videos/games/map)
    │   └── map/                  ← mapa + pins de redes sociales
    ├── pfps/                     ← galería de fotos del reverso (1.webp, 2.webp, …)
    ├── sounds/                   ← efectos de sonido (.mp3)
    ├── thumbnails/               ← miniaturas de videos y juegos
    └── videos/                   ← archivos .webm del showreel
```

---

## VIDEOS (showreel)

Cada video necesita **2 archivos + 1 entrada en `data.json`**.

### ➕ Añadir un video nuevo

Imagina que se llama **"Mi Video"** y su identificador (id) va a ser **`mi-video`** (sin espacios, sin tildes, sin mayúsculas).

**1. Sube los 2 archivos** con estos nombres exactos:
- `assets/videos/mi-video.webm` → el video completo
- `assets/thumbnails/mi-video.png` → miniatura que aparece en la card

**2. Añade el video a `data.json`** dentro de `videos`:
```json
{ "id": "mi-video", "title": "Mi título bonito" }
```
Recuerda poner una coma al final del video anterior.

| Campo | Qué es |
|---|---|
| `id` | Identificador interno. **Debe ser idéntico al nombre de los archivos.** Solo minúsculas, números y guiones. |
| `title` | Título visible en la card y en el reproductor |

> Si falta el thumbnail, la card muestra solo el título.
> Si falta el video, el reproductor muestra "Video not available".

### ✏️ Modificar un video
Abre `data.json`, busca el video, cambia el `title`. Si cambias el `id`, renombra también los archivos.

### ❌ Borrar un video
1. Borra su entrada del array `videos` en `data.json` (ojo con las comas).
2. Borra los archivos de `assets/videos/` y `assets/thumbnails/`.

---

## JUEGOS (game jams)

Cada juego necesita **1 thumbnail + 1 entrada en `data.json`**.

### ➕ Añadir un juego nuevo

**1. Sube el thumbnail:**
- `assets/thumbnails/mi-juego.png`

**2. Añade el juego a `data.json`** dentro de `games`. La descripción y el rol son objetos con una entrada por idioma:
```json
{
  "id": "mi-juego",
  "title": "Mi juego",
  "description": {
    "en": "Short description",
    "es": "Breve descripción",
    "fr": "Brève description"
  },
  "role": {
    "en": "My role",
    "es": "Mi rol",
    "fr": "Mon rôle"
  },
  "itchUrl": "https://link-a-itch.io/..."
}
```
> Si te falta una traducción, usa el mismo texto en otro idioma (mejor que dejarlo vacío). El `title` es nombre propio del juego, no se traduce.

### ✏️ Modificar / ❌ Borrar un juego
Igual que con los videos: editar el objeto en `data.json`, o borrarlo del array y borrar el thumbnail.

---

## ABOUT (bio)

### ✏️ Cambiar el texto de la bio
La bio es un objeto con una entrada por idioma. Editar `data.json` → `about.bio.en` / `.es` / `.fr`.

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
Se detectan automáticamente en orden hasta que falla la carga. No hay que tocar `data.json`.

### ❌ Borrar una foto
Renombra las posteriores para no dejar huecos. Si borras la `3.webp`, la `4.webp` pasa a ser la `3.webp`, etc.

---

## REDES SOCIALES / PINS DEL MAPA

Se editan desde `data.json` → `social`. Cada entrada:
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
2. Añade la entrada al array `social` en `data.json` con el `icon: "mired"`

---

## COLORES / TEMA

Editar `data.json` → `theme`. Todos los colores se aplican automáticamente como variables CSS.

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

Cada interacción tiene su efecto en `assets/sounds/`. El mapeo está en `data.json` → `soundEffects`.

### ✏️ Cambiar un sonido
Reemplaza el `.mp3` en `assets/sounds/` (mismo nombre) o cambia la ruta en `data.json` → `soundEffects`.

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
- **Bio** → `data.json` → `about.bio.en` / `.es` / `.fr`
- **Descripciones de juegos y rol** → `data.json` → cada juego tiene `description.{lang}` y `role.{lang}`
- **Strings de UI** (títulos de ventana, botones, mensaje "How to") → `data.json` → `i18n.{lang}.{key}`

### ➕ Añadir un idioma nuevo (ej. italiano `it`)
1. En `app.js`, busca la línea `const SUPPORTED_LANGS = ['en', 'es', 'fr'];` y añade el nuevo código: `['en', 'es', 'fr', 'it']`.
2. En `data.json` → `i18n` añade un bloque `"it": { ... }` con todas las claves traducidas (puedes copiar el bloque `en` y traducir uno a uno).
3. En `data.json` → `about.bio` añade `"it": "..."`.
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

La info SEO global está en el `<head>` de `index.html`. Solo hay que tocarla si cambia algo significativo:
- `<title>` — aparece en la pestaña del navegador y en Google
- `<meta name="description">` — aparece en los resultados de búsqueda
- OG tags — cómo se ve al compartir en WhatsApp/Facebook/Twitter
- JSON-LD — info estructurada para Google (nombre, profesión, redes)

Archivos SEO en la raíz:
- `robots.txt` — permite indexar todo
- `sitemap.xml` — le dice a Google qué páginas existen

Para que Google indexe la web:
1. Ir a [Google Search Console](https://search.google.com/search-console)
2. Añadir la propiedad del dominio
3. Subir el sitemap: `https://noancittadino.com/sitemap.xml`

---

## ⚠️ Errores comunes

| Síntoma | Causa probable |
|---|---|
| La web no carga nada | Error de sintaxis en `data.json` — una coma de más, una comilla sin cerrar. Valida con https://jsonlint.com |
| Un video no se ve | Nombre de archivo no coincide con `id`. Recuerda: **minúsculas, sin espacios, sin tildes**. |
| Un thumbnail no aparece | Falta el archivo en `assets/thumbnails/` o el nombre no coincide con el `id`. |
| Los cambios no se ven | Caché del navegador. Ctrl+F5 (Windows) o Cmd+Shift+R (Mac). |
| "Video not available" en el reproductor | Falta el archivo `.webm` en `assets/videos/` con ese `id`. |
| No se oyen los sonidos | Falta el archivo en `assets/sounds/` o hay un typo en el path de `data.json`. Abre la consola del navegador (F12) para ver el warning exacto. |
| Una foto del PFP no aparece | La extensión debe ser `.webp` y los números no pueden saltar (1, 2, 3, 4... sin huecos). |

---

## Verificar que todo funciona

Abre el sitio y la consola del navegador (F12 o Cmd+Opt+I):
- No debería haber errores en rojo
- Si falta algún archivo, aparece un warning con la ruta exacta

---

## Ante cualquier duda

Guarda copia de `data.json` antes de hacer cambios grandes. Si algo se rompe, restaurando ese archivo vuelve todo a estar OK.

La web la hizo **manu (@meowrhino)**. Si algo se rompe y no sabes arreglarlo, contacta.
