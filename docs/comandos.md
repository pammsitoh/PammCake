# Documentación de comandos (PammCake / `pcake`)

Esta documentación describe únicamente los comandos solicitados: `add`, `init`, `save`, `watch`.

> CLI: el binario publicado por el paquete es `pcake` (ver `package.json`).

## Requisitos y supuestos

- Sistema operativo: **Windows**. Actualmente los comandos `init`, `save` y `watch` usan rutas del estilo `~/AppData/Roaming/Minecraft Bedrock/...`.
- Ejecuta los comandos desde la **raíz del proyecto**, donde existan:
  - `pcake.config.json`
  - `addon/BP` y `addon/RP` (Behavior Pack y Resource Pack)

### Archivo `pcake.config.json`

Los comandos `save` y `watch` usan este archivo para formar el nombre del pack de desarrollo.

Campos relevantes:

- `name`: nombre del addon/proyecto
- `identifier`: identificador corto (se usa para diferenciar instalaciones)

El nombre final que se copia a Minecraft queda con este formato:

- Behavior Pack: `${name}[${identifier}] - BP`
- Resource Pack: `${name}[${identifier}] - RP`

Ejemplo:

```json
{
  "name": "MiAddon",
  "identifier": "dev"
}
```

---

## `pcake init`

Inicializa un proyecto base (a partir de un ejemplo) y crea los manifiestos/lenguajes de BP y RP.

### Uso

```bash
pcake init <project_name> -b
```

### Argumentos

- `<project_name>`: nombre del proyecto. Se usa para el nombre del pack y para los textos de idioma.

### Opciones

- `-b`, `--basic`: crea un proyecto base en la carpeta actual y genera `addon/BP` y `addon/RP`.
- `-s`, `--studio`: **opción declarada**, pero actualmente **no está implementada** en el handler.

### Qué crea/modifica

Cuando usas `-b`:

- Copia el ejemplo desde `assets/example_project/` a la carpeta actual.
- Genera `pcake.config.json` con:
  - `name = <project_name>`
  - `identifier = "dev"`
- Crea:
  - `addon/BP/manifest.json`
  - `addon/RP/manifest.json`
  - `addon/*/texts/languages.json`
  - `addon/*/texts/en_US.lang`
  - `addon/*/pack_icon.png`

### Salida esperada

- Mensajes del tipo: `Proyecto "<name> - BP" Creado!` y `Proyecto "<name> - RP" Creado!`.

### Notas importantes

- Sin `-b`, actualmente el comando no ejecuta la inicialización (esto puede cambiar si se implementa el flujo no-básico).

---

## `pcake add`

Agrega componentes al proyecto (scripts, configuración de TypeScript o módulos internos de PammCake).

### Uso

```bash
pcake add <thing>
```

### Argumentos

- `<thing>`:
  - `scripts`: agrega módulo `script` a `manifest.json` del BP y crea `addon/BP/scripts/index.js`.
  - `typescript`: hace lo anterior y además configura TypeScript.
  - cualquier otro valor: se trata como un nombre de módulo interno y se copia a `addon/BP/scripts/_pcake_modules/<thing>`.

### Comportamiento

- Requiere que existan `addon/BP` y `addon/RP`.
- Intenta leer `pcake.config.json` (si falla, aborta con error).

#### `pcake add scripts`

- Modifica el `manifest.json` del **Behavior Pack**:
  - agrega un módulo `script` con `uuid` nuevo
  - agrega (o crea) `dependencies` con `@minecraft/server` versión `2.4.0`
- Crea `addon/BP/scripts/index.js` con un placeholder.

#### `pcake add typescript`

Además de lo anterior:

- Instala TypeScript como devDependency:
  - Ejecuta `npm install --save-dev typescript`
- Actualiza `package.json`:
  - agrega/actualiza el script `save` a: `tsc && pcake save`
- Crea `tsconfig.json` (compila a `./addon/BP`).
- Crea `scripts/index.ts`.

#### `pcake add <module>`

- Busca el módulo en `lib/modules/<module>`.
- Si existe, copia el contenido a: `addon/BP/scripts/_pcake_modules/<module>`.
- Si no existe, informa que el módulo no está disponible en esta versión.

### Ejemplos

```bash
pcake add scripts
pcake add typescript
pcake add easydata
```

---

## `pcake save`

Copia el contenido local (`addon/BP` y `addon/RP`) a las carpetas de desarrollo de Minecraft Bedrock.

### Uso

```bash
pcake save [--server]
```

### Opciones

- `-s`, `--server`: guarda en una carpeta local `./server/` en lugar de `AppData/.../com.mojang`.
- `-r`, `--resource`: **opción declarada**, pero actualmente **no se utiliza** en el código.

### Comportamiento

- Requiere:
  - `pcake.config.json` con `name` y `identifier`
  - `addon/BP` y `addon/RP`

#### Guardado normal (sin `--server`)

- Copia a:
  - `%USERPROFILE%/AppData/Roaming/Minecraft Bedrock/Users/Shared/games/com.mojang/development_behavior_packs/${name}[${identifier}] - BP`
  - `%USERPROFILE%/AppData/Roaming/Minecraft Bedrock/Users/Shared/games/com.mojang/development_resource_packs/${name}[${identifier}] - RP`

Antes de copiar, elimina el destino si existe.

#### Guardado a servidor local (`--server`)

- Copia a:
  - `./server/development_behavior_packs/${name}[${identifier}] - BP`
  - `./server/development_resource_packs/${name}[${identifier}] - RP`

> Nota: el comando asume que esas carpetas existen o pueden crearse durante la copia.

### Ejemplos

```bash
pcake save
pcake save --server
```

---

## `pcake watch`

Vigila cambios en `addon/BP` y `addon/RP` y sincroniza automáticamente hacia las carpetas de desarrollo de Minecraft.

### Uso

```bash
pcake watch
```

### Opciones

- `-r`, `--resource`: **opción declarada**, pero actualmente **no se utiliza** en el código.

### Comportamiento

- Requiere:
  - `pcake.config.json` con `name` y `identifier`
  - `addon/BP` y `addon/RP`

- Al detectar cambios, sincroniza carpetas con esta estrategia:
  1) vacía el destino (`emptyDir`)
  2) copia todo desde el origen

- Destinos:
  - BP: `%USERPROFILE%/AppData/Roaming/Minecraft Bedrock/Users/Shared/games/com.mojang/development_behavior_packs/${name}[${identifier}] - BP`
  - RP: `%USERPROFILE%/AppData/Roaming/Minecraft Bedrock/Users/Shared/games/com.mojang/development_resource_packs/${name}[${identifier}] - RP`

### Compilaciones especiales (BP)

Cuando cambias un archivo dentro de `addon/BP`, si el archivo es un **archivo** y su extensión es:

- `.pcakemenu`: ejecuta `MenuCompiler()`
- `.pcakecopyguy`: ejecuta `CopyGuyCompile(<ruta_del_archivo>)`

### Ejemplo

```bash
pcake watch
```

### Notas de rendimiento

- En proyectos grandes, vaciar y recopi ar todo en cada cambio puede ser costoso; si necesitas sincronización incremental, habría que ajustar la estrategia de copia.
