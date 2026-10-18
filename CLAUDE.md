# noan, para Claude

La web de Noan Cittadino (compositor y diseñador de sonido), hecho por meowrhino con la receta del estudio
([meowrhino/JAMstack](https://github.com/meowrhino/JAMstack)). Con manu se
habla en castellano, y lo de Noan (`GUIA.md`, los mensajes del build)
también. Cómo está hecha: [README.md](README.md).

## Si el build falla (la web no se ha publicado)

Cuando falla, la web se queda como estaba. Para arreglarlo:

1. **El error**, en uno de estos sitios:
   - En nuestra copia (`meowrhino/noan`), la Action abre un issue con la
     etiqueta `build` y el mensaje dentro: `gh issue list --label build` y
     `gh issue view <n>`. El registro entero: `gh run list -L 3` y
     `gh run view <id> --log-failed`.
2. **Reprodúcelo aquí**: `npm ci && node build/build.mjs`. Es el mismo build que
   en la nube y dice lo mismo: cada línea con ✗ trae el fichero y qué pasa.
3. **Arréglalo donde dice**, casi siempre en `data/site.json` o en
   `projects/<nombre>/project.json`:
   - "no es un JSON válido, línea 12": una coma de más o de menos, o unas
     comillas sin cerrar, en esa línea o la de antes.
   - "\"x\" no es un campo de aquí (¿mal escrito?)" o "tiene que ser…": no cuadra con
     su esquema (`schema/`). El mensaje dice qué campos hay o cómo tiene que
     ser; se arregla el dato, no el esquema.
   - "no encuentro projects/<nombre>/video.webm" (o thumbnail.webp, o un sonido): el
     fichero no está o se llama de otra forma. Pregunta si falta subirlo; si no, quita la
     vídeo o el juego de la lista y dilo.
   - "\"lists\" dice \"x\", y no hay ningún projects/x/project.json": el nombre de
     la lista y el de la carpeta no son iguales.
4. **Comprueba**: `node build/build.mjs` sin ✗ (los ⚠ no paran nada).

No cambies el build, `js/house.js` ni el resto del JS para que pase: si el dato
está bien y el build se queja, es un fallo del build, y hay que decírselo a
manu. No borres vídeos ni juegos.

Commit y push solo cuando te lo pidan: mensaje en castellano diciendo qué se
arregla. Al publicarse, la Action cierra el issue sola.
