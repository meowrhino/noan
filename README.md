# Noan Cittadino — Portfolio

Sitio estático (HTML + CSS + JS) sin build. Todo el contenido se edita desde `data.json` y los archivos en `assets/`.

## Cómo correr en local

Necesitás servirlo con un server (no abrir `index.html` directo, por el `fetch('data.json')`):

```bash
python3 -m http.server 8090
# luego abrir http://localhost:8090
```

## Estructura

```
index.html          ← estructura de la página
style.css           ← estilos
app.js              ← lógica (ventanas, sonidos, flip, etc.)
data.json           ← CONTENIDO (videos, juegos, bio, sociales, tema, sonidos)
assets/
  favicon.png
  icons/
    noan.png                    ← retrato
    btn-{videos,games,map}.png  ← botones nav (+ -hover.png)
    map/                         ← mapa + pins sociales
      map.png
      {instagram,linkedin,itch,soundcloud,discord,email}.png
  pfps/
    1.webp, 2.webp, ...   ← galería de PFP (click para pasar)
  sounds/                 ← efectos (ver data.json → soundEffects)
  thumbnails/             ← miniaturas de videos y juegos (nombre = id)
  videos/                 ← archivos .webm (nombre = id)
```

## Cómo editar contenido

### Añadir / editar un video (showreel)
1. Añadir el archivo: `assets/videos/mi-id.webm`
2. Añadir la miniatura: `assets/thumbnails/mi-id.png`
3. Añadir la entrada en `data.json` → `videos`:
```json
{ "id": "mi-id", "title": "Mi título bonito" }
```

> El `id` debe coincidir con el nombre de los archivos (sin extensión).
> Si falta el thumbnail, la card muestra solo el título.
> Si falta el video, el reproductor muestra "Video not available".

### Añadir / editar un juego
1. Añadir la miniatura: `assets/thumbnails/mi-juego.png`
2. Añadir la entrada en `data.json` → `games`:
```json
{
  "id": "mi-juego",
  "title": "Mi juego",
  "description": "Breve descripción",
  "role": "Mi rol en el proyecto",
  "itchUrl": "https://link-a-itch.io/..."
}
```

### Cambiar el texto de la bio
Editar `data.json` → `about.bio`. Dentro del texto se pueden usar estos marcadores:

- `{showreels}` → link que abre la ventana de videos
- `{game jams}` → link que abre la ventana de juegos
- `{map}` → link que abre el mapa social
- `{email:tu@mail.com}` → link `mailto:`

### Añadir fotos al PFP (galería del reverso)
Guardar imágenes numeradas en `assets/pfps/`:
```
assets/pfps/1.webp
assets/pfps/2.webp
assets/pfps/3.webp   ← nuevo
...
```
Se detectan automáticamente en orden hasta que falla la carga.

### Cambiar redes sociales / pins del mapa
Editar `data.json` → `social`. Cada entrada:
```json
{
  "id": "instagram",
  "label": "Instagram",
  "url": "https://...",
  "icon": "instagram",        // nombre de archivo en assets/icons/map/
  "mapX": 28,                  // posición horizontal del pin (0-100%)
  "mapY": 55                   // posición vertical del pin (0-100%)
}
```

### Cambiar colores / tema
Editar `data.json` → `theme`. Todos los colores se aplican como variables CSS:
`bg`, `panelBg`, `accent`, `accentLight`, `accentDark`, `accentPale`, `mapLand`, `mapSea`, `textDark`, `textLight`, `shadow`, `playerBg`.

### Cambiar un sonido
Reemplazar el MP3 en `assets/sounds/` (mismo nombre) o cambiar la ruta en `data.json` → `soundEffects`. Si algo falla, aparece un `console.warn` claro en el navegador.

## Verificar que todo funciona

Abrir el sitio y la consola del navegador:
- No debería haber errores en rojo
- Si falta algún archivo, aparece un warning con la ruta exacta
