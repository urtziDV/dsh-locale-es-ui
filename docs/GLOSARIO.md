# Guía de traducción — pack de español para DeepSeek Harness (DSH)

Traduce **inglés → español neutro** (comprensible en España y Latinoamérica). Tono de «tú»,
directo y profesional. Los botones van en imperativo («Guardar», «Cancelar», «Reintentar»).

## Reglas obligatorias

1. **Misma estructura**: mismo namespace, mismas claves, mismos valores solo traducidos.
   Nunca añadas, quites ni renombres claves.
2. **Marcadores de posición intactos**: `{name}`, `{count}`, `{duration}`, `{code}`, `{message}`,
   `{n}`, `{turn}`, `{total}`, `{answered}`, `{error}`, etc. Se copian literalmente, sin traducir
   y sin cambiar mayúsculas ni llaves.
3. **Puntos suspensivos y símbolos**: conserva `…` y `···` tal cual.
4. **No traduzcas** (déjalos igual):
   - Nombres de producto: `DeepSeek`, `DSH`, `DeepSeek Harness`, `Harness`, `Session Log`.
   - Tecnología: `API`, `JSON`, `HTML`, `Markdown`, `CSS`, `URL`, `ID`, `UI`, `CLI`, `HTTP`, `SSE`,
     `MCP`, `PTC`, `OTel`, `npm`, `pnpm`, `git`, `Node.js`, `React`, `Vite`, `SQLite`, `CSV`,
     `YAML`, `JWT`, `OAuth`, `SDK`, `LLM`, `GPU`, `PDF`, `DOCX`, `XLSX`, `PPTX`, `PNG`, `SVG`.
   - Cadenas que son solo un patrón de formato (`"{m}/{d}"`, `"{y}-{m}-{d}"`, `"{hours}h {minutes}m"`).
     En estas, traduce únicamente las letras que sean palabras; si son solo símbolos, déjalas idénticas.
   - Rutas de archivo, nombres de archivo, nombres de teclas (`Ctrl`, `Shift`, `Alt`, `Cmd`, `Enter`,
     `Esc`, `Tab`), nombres de herramientas (`Bash`, `Read`, `Write`, `Glob`, `Grep`, `Task`, `WebFetch`).
   - Tokens de comando que se escriben en la línea de comandos (`compact`, `export`, `plan`, `resume`).
   - Etiquetas ya técnicas o abreviaturas visibles: `EXP` déjalo como `EXP`.
5. **Longitud**: las etiquetas de botones, chips y pestañas deben quedar cortas. Prefiere la opción
   más breve que suene natural («Guardar» antes que «Guardar los cambios» si el original es «Save»).
6. **Comillas**: usa comillas rectas `"` dentro del JSON y escápalas con `\"` si aparecen.
   No uses comillas tipográficas «» ni “” en los valores.
7. **JSON válido** en UTF-8, indentación de 2 espacios, sin comentarios ni texto adicional.

## Glosario (úsalo de forma consistente)

| Inglés | Español |
|---|---|
| OK | Aceptar |
| Cancel | Cancelar |
| Close | Cerrar |
| Save | Guardar |
| Saved | Guardado |
| Done | Listo |
| Copy | Copiar |
| Copied | Copiado |
| Retry | Reintentar |
| Loading | Cargando… |
| Failed / Failure | Error / Falló |
| Settings | Ajustes |
| General | General |
| Language | Idioma |
| Account | Cuenta |
| Models | Modelos |
| Model | Modelo |
| Provider | Proveedor |
| API key | Clave de API |
| Theme | Tema |
| Appearance | Apariencia |
| Shortcuts | Atajos |
| Built-in plugins | Plugins integrados |
| Plugin | Plugin (nunca «complemento») |
| Session | Sesión |
| New Session | Nueva sesión |
| Agent | Agente |
| Subagent | Subagente |
| Trajectory | Trayectoria |
| Workspace | Workspace (se mantiene) |
| Prompt | Prompt (se mantiene) |
| Shell | Shell (se mantiene) |
| Token / tokens | Token / tokens |
| Sandbox | Sandbox (se mantiene) |
| Tool | Herramienta |
| Tool call | Llamada a herramienta |
| Skill | Skill (se mantiene) |
| Goal | Objetivo |
| Plan | Plan |
| Feedback | Comentarios |
| Reference | Referencia |
| Approval | Aprobación |
| Job / Jobs | Trabajo / Trabajos |
| Command | Comando |
| Question | Pregunta |
| Answer | Responder / Respuesta |
| Read Only (permiso) | Solo lectura |
| Workspace Write (permiso) | Escritura en workspace |
| Full access | Acceso total |
| Auto review | Revisión automática |
| Turn | Turno |
| Message | Mensaje |
| Attachment | Adjunto |
| Deliverable | Entregable |
| Workflow | Flujo de trabajo |
| Schedule | Programación |
| Voice input | Entrada de voz |
| Terminal | Terminal |
| File | Archivo |
| Folder / Directory | Carpeta / Directorio |
| Search | Buscar |
| Download | Descargar |
| Upload | Subir |
| Enable / Disable | Activar / Desactivar |
| Enabled / Disabled | Activado / Desactivado |
| On / Off | Activado / Desactivado |
| Experimental | Experimental |
| Reasoning | Razonamiento |
| Compaction / Compact | Compactación / Compactar |
| Context | Contexto |
| Interrupted | Interrumpido |
| Cancelled | Cancelado |
| Pending | Pendiente |
| Expand / Collapse | Expandir / Contraer |
| Show more / Show less | Mostrar más / Mostrar menos |
| Filter | Filtrar |
| Refresh | Actualizar |
| Install / Uninstall | Instalar / Desinstalar |
| Update / Upgrade | Actualizar / Actualizar |
| Permission | Permiso |
| Workspace folder | Carpeta del workspace |
| Run | Ejecutar |
| Stop | Detener |
| Resume | Reanudar |
| Continue | Continuar |
| Apply | Aplicar |
| Reset | Restablecer |
| Restore | Restaurar |
| Default | Predeterminado |
| Custom | Personalizado |
| None | Ninguno |
| Never / Always | Nunca / Siempre |
| Unknown | Desconocido |
| Unavailable | No disponible |
| Required | Obligatorio |
| Optional | Opcional |
| Warning | Advertencia |
| Error | Error |
| Success | Correcto |
| Notice | Aviso |

## Ejemplos

- `"nav": "Built-in plugins"` → `"nav": "Plugins integrados"`
- `"session.new": "New Session"` → `"session.new": "Nueva sesión"`
- `"terminal.expand": "Show {n} more lines"` → `"terminal.expand": "Mostrar {n} líneas más"`
- `"chat.loadError": "Failed to load history: {message} ({code})"` →
  `"chat.loadError": "No se pudo cargar el historial: {message} ({code})"`
- `"clock.ymd": "{y}-{m}-{d}"` → `"{y}-{m}-{d}"` (sin cambios)
- `"auto.badge": "EXP"` → `"EXP"` (sin cambios)
