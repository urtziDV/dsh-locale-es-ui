# Contribuir

Gracias por mejorar el español de DeepSeek Harness. Todo lo que hace este paquete vive en
`data/` y se compila a `lib/client.js` con las herramientas de `tools/`.

## Corregir o mejorar una cadena

1. Busca la clave en `data/es.json` (por ejemplo `"settings.models": { "welcomeTitle": … }`).
2. Cambia solo el valor en español; **no toques las claves**.
3. Reconstruye y comprueba:

   ```sh
   npm run build     # data/ -> lib/client.js + cordis.patch.yml
   npm test          # paridad de claves, marcadores, comillas y el bundle
   ```

4. Abre un PR con el cambio en `data/es.json` y, si `npm run build` lo regeneró,
   también `lib/client.js` (es un artefacto versionado a propósito: es lo que descarga el
   navegador).

## Reglas de traducción

- **Marcadores intactos**: `{count}`, `{path}`, `{version}`… deben seguir apareciendo
  exactamente igual. `npm test` falla si no.
- **No traduzcas**: nombres de producto (DeepSeek, DSH, Harness, Session Log), tecnología
  (API, JSON, HTML, Markdown, YAML, CLI, MCP, PTC…), rutas, nombres de herramientas (Bash,
  Read, Write…), tokens de comando (`compact`, `export`, `plan`) ni cadenas que son solo un
  formato (`{y}-{m}-{d}`).
- **Comillas rectas**: `"` escapadas, nunca «» ni “”.
- **Etiquetas cortas**: el español ocupa más; en botones, chips y pestañas usa la opción
  más breve que suene natural.
- Glosario completo y decisiones de terminología: [`docs/GLOSARIO.md`](docs/GLOSARIO.md).

## Cuando DSH cambia (claves nuevas o renombradas)

`data/en.json` es el corpus inglés de referencia y `npm test` comprueba la paridad en los
dos sentidos, así que una versión nueva de DSH hace fallar la validación en vez de dejar
huecos silenciosos. Para reextraerlo desde tu instalación:

```sh
npm run extract -- "C:\Users\tu-usuario\AppData\Local\Programs\DeepSeek Harness\resources\app.asar"
```

Eso reescribe `data/en.json` con los namespaces y las claves de ese build; después copia a
`data/es.json` las claves nuevas (las que falten caen al inglés en tiempo de ejecución, así
que la interfaz nunca se rompe) y traduce.

## Publicar (mantenedores)

```sh
npm version patch        # o minor/major: sube la versión y crea el tag
git push --follow-tags   # el workflow Publish publica con provenance
```
