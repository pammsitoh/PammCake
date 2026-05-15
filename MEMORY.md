# PammCake — Memoria de Sesión

## Goal
Desarrollar PammCake CLI para Minecraft Bedrock con `pcake watch` (sync automático + WebSocket) y `pcake agent` (watch + Claude Code controlado desde el chat de Minecraft).

## Constraints & Preferences
- El addon del usuario usa Script API (`@minecraft/server`)
- Minecraft requiere WebSockets no-encriptados (switch "Require Encrypted WebSockets" desactivado)
- Claude Code corre sin pedir permisos, limitado a `--allowedTools Edit,Read,Write` (sin Bash)
- Output de Claude visible en terminal de pcake; solo mensajes `●` van al chat de Minecraft
- `npm link` activo para desarrollo local

---

## Progreso acumulado

### watch.js
- Eliminado debounce (`DEBOUNCE_MS = 200`) — sync inmediato
- Reemplazado `emptyDir` + `copy` por `fse.copy(..., { overwrite: true })` — evita carpeta vacía mientras Minecraft tiene el pack cargado
- `syncFolders` usa `reload all` por defecto; excepción: cambios en `addon/BP/scripts/` usan `reload`
- Helper `getBPReloadCommand(changedFile)` con `path.relative` para detectar si el archivo está en scripts
- Todos los watchers de BP usan `getBPReloadCommand(f)` en `add`, `change`, `unlink`

### lib/src/connect/main.js
- Agregado `ws.on('error')` y `wss.on('error')`
- `handleMessage` corregido: `eventName` se lee de `header` primero, luego `body`
- Flujo completo: `subscribe("PlayerMessage")` + `tellraw` bienvenida + `reload all` en sync

### agent.js (bin/commands/agent.js)
- Creado desde cero: watch completo + Claude Code via `node-pty` en background
- `node-pty` instalado como dependencia
- Claude spawnea via `cmd.exe` (Windows) / `sh` (Unix); comando `claude --allowedTools Edit,Read,Write` enviado tras 800ms
- Claude se auto-reinicia si termina (`onExit` → `setTimeout(spawnClaude, 2000)`)
- Handler `!ai <mensaje>` desde Minecraft: envía el texto al PTY de Claude
- Rate limiting en `sendToMinecraft`: cola `sendQueue` + `setTimeout(flushQueue, 100ms)`
- **Fix palabras pegadas**: buffer de líneas completas en `onData`
- **Fix detección `●`**:
  - `ANSI_REGEX` actualizado a `/\x1B\[[0-9;?!>]*[a-zA-Z@]|\x1B\][^\x07]*(?:\x07|\x1B\\)|\x1B[A-Za-z=>]/g` — cubre secuencias privadas como `[?2026h`
  - Split cambiado de `split("\n")` a `split(/[\r\n]/)` — el TUI de Claude usa `\r` solo para sobrescribir líneas; sin esto todo era una línea gigante
- Líneas con `●` → `§6[Claude]: <msg>` en Minecraft; el resto solo en terminal

---

## Decisiones clave
| Decisión | Motivo |
|---|---|
| `fse.copy` sin `emptyDir` previo | Evita crash de Minecraft al detectar carpeta vacía |
| `reload all` general / `reload` solo en scripts | `reload` es suficiente para scripts JS; `reload all` recarga assets |
| Claude via shell interactivo (`cmd.exe []`) | `node-pty` en Windows no puede ejecutar `.cmd` directamente |
| `--allowedTools Edit,Read,Write` | Sin Bash para evitar acceso arbitrario al sistema |
| Solo líneas `●` a Minecraft | Evita flood con output interno del TUI de Claude |
| `split(/[\r\n]/)` en PTY buffer | Claude TUI usa `\r` solo; `split("\n")` dejaba todo en una línea |

---

## Contexto crítico

### Estructura PlayerMessage (Minecraft actual)
```json
{
  "header": { "eventName": "PlayerMessage", "messagePurpose": "event", "version": 17104896 },
  "body":   { "message": "...", "sender": "...", "receiver": "", "type": "chat" }
}
```

### Constantes relevantes en agent.js
```js
const AI_PREFIX   = "!ai ";
const ANSI_REGEX  = /\x1B\[[0-9;?!>]*[a-zA-Z@]|\x1B\][^\x07]*(?:\x07|\x1B\\)|\x1B[A-Za-z=>]/g;
const NOISE_REGEX = /^[─━═╌┄┈\-=*#~\s▋▌▍▎▏▐░▒▓█⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]+$/;
```

---

## Archivos relevantes
| Archivo | Descripción |
|---|---|
| `bin/commands/watch.js` | Sync automático BP/RP + WebSocket + TypeScript + git polling |
| `bin/commands/agent.js` | Igual que watch + Claude Code via node-pty + handler `!ai` |
| `lib/src/connect/main.js` | Clase `ToolConnect` (WebSocket server) |
| `lib/index.js` | Exporta `toolConnect` y `ToolConnect` |
| `lib/src/utils/minecraft.js` | `getMinecraftPath()` |
| `lib/src/utils/config.js` | `readConfig()`, `addonFoldersExist()` |
| `package.json` | Versión `1.2.7`, deps: `ws`, `chokidar`, `fs-extra`, `node-pty` |

---

## Next Steps
- (ninguno pendiente — esperar feedback de prueba con el fix de detección `●`)
