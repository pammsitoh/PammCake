# PCakeUI — Sistema de UI para Minecraft Bedrock

PCakeUI es un lenguaje de marcado que compila a [JSON-UI](https://wiki.bedrock.dev/json-ui/json-ui-intro.html) de Minecraft Bedrock. Permite diseñar interfaces con sintaxis similar a HTML en lugar de escribir JSON-UI a mano.

---

## Archivos `.pcakeui`

Coloca tus archivos `.pcakeui` dentro de `addon/RP/ui/`. El compilador los transforma automáticamente al hacer `pcake watch` o `pcake build`. Los `.pcakeui` **nunca** se copian al pack de Minecraft ni al `.mcaddon` — solo los `.json` compilados.

---

## Estructura básica

Cada archivo tiene tres secciones:

```xml
<!-- 1. Namespace propio del archivo -->
<namespace name="mi_hud" />

<!-- 2. Definición de elementos -->
<label name="mi_texto" text="Hola" anchor="top_left" />

<!-- 3. Inyección en una pantalla de Minecraft -->
<modify screen="hud_screen" target="root_panel" operation="insert_front">
    <ref name="mi_texto" extends="mi_hud.mi_texto" />
</modify>
```

---

## Namespace

```xml
<namespace name="mi_hud" />
```

Define el namespace del archivo. Todos los elementos definidos en él pertenecen a ese namespace. El `<modify>` genera un archivo separado (`hud_screen.json`) con `namespace: hud_screen` para que Minecraft pueda parchear la pantalla correctamente.

---

## Tipos de control

Los siguientes tags se convierten en `"type": "tag"` en el JSON:

| Tag             | Descripción                        |
|-----------------|------------------------------------|
| `panel`         | Contenedor genérico                |
| `stack_panel`   | Contenedor con layout automático   |
| `grid`          | Contenedor en cuadrícula           |
| `scroll_view`   | Panel con scroll                   |
| `label`         | Texto                              |
| `image`         | Imagen / textura                   |
| `button`        | Botón interactivo                  |
| `toggle`        | Interruptor on/off                 |
| `slider`        | Barra deslizante                   |
| `text_edit_box` | Campo de texto editable            |
| `dropdown`      | Lista desplegable                  |
| `input_panel`   | Panel que captura input            |
| `screen`        | Pantalla completa                  |
| `custom`        | Control personalizado              |

Cualquier otro tag (como `ref`) no añade `type` al JSON.

---

## Atributos

### Herencia

```xml
<panel name="mi_panel" extends="otro_namespace.otro_panel" />
```

Genera la clave `mi_panel@otro_namespace.otro_panel` en el JSON.

### Anchor

```xml
<label anchor="top_left" />
```

Expande automáticamente a `anchor_from` y `anchor_to` con el mismo valor.

Valores válidos: `top_left`, `top_middle`, `top_right`, `left_middle`, `center`, `right_middle`, `bottom_left`, `bottom_middle`, `bottom_right`.

### Size y offset

```xml
<panel size="[200, 50]" offset="[0, 8]" />
<panel size="100% 100%" />
```

Se convierten en arrays JSON: `[200, 50]`, `["100%", "100%"]`.

Aplica también a: `max_size`, `min_size`, `clip_offset`, `clip_size`.

### Color

```xml
<image color="#2266CC" />
<label color="#FF4444" />
```

Los colores hex se convierten a arrays RGB normalizados (0–1) que requiere Minecraft:
`#2266CC` → `[0.1333, 0.4, 0.8]`

Con canal alpha: `#FF000080` → `[1, 0, 0, 0.502]`

Aplica también a: `shadow_color`, `background_color`, `select_color`.

### Booleanos

```xml
<label shadow="true" visible="false" />
```

Se convierten al tipo boolean de JSON. Aplica a: `shadow`, `visible`, `enabled`, `clips_children`, `allow_clipping`, `propagate_alpha`, `use_child_anchors`, `ignored`, `fill`.

### Bindings

```xml
<label bind:text="#player_health" />
```

El prefijo `bind:` establece el valor del atributo Y añade una entrada al array `bindings` del elemento. Útil para conectar valores dinámicos del juego.

Bindings vanilla disponibles (ejemplos): `#player_health`, `#player_hunger`, `#player_experience_level`.

---

## Elementos anidados

Los hijos de un elemento van al array `controls` del JSON automáticamente:

```xml
<panel name="contenedor" anchor="top_right" offset="[-8, 8]" size="[140, 80]">
    <image name="fondo" texture="textures/ui/Black" anchor="center" size="100% 100%" />
    <label name="titulo" text="§bMi HUD" anchor="top_middle" offset="[0, 6]" shadow="true" />
</panel>
```

---

## Modify

```xml
<modify screen="hud_screen" target="root_panel" operation="insert_front">
    <ref name="mi_elemento" extends="mi_hud.mi_elemento" />
</modify>
```

| Atributo    | Default          | Descripción                                      |
|-------------|------------------|--------------------------------------------------|
| `screen`    | `hud_screen`     | Pantalla de Minecraft a parchear                 |
| `target`    | `root_panel`     | Elemento dentro de esa pantalla                  |
| `operation` | `insert_front`   | `insert_front`, `insert_back`, `remove`, `replace` |

El compilador agrega **todos** los `<modify>` de todos los `.pcakeui` en un único archivo por pantalla (`hud_screen.json`, etc.). Múltiples archivos pueden inyectar en la misma pantalla sin conflictos.

---

## Archivos generados

Para un archivo `addon/RP/ui/mi_hud.pcakeui` con `<namespace name="mi_hud" />` y un `<modify screen="hud_screen">`, el compilador genera:

```
addon/RP/ui/
  mi_hud.json        ← definiciones de elementos (namespace: mi_hud)
  hud_screen.json    ← modificaciones a la pantalla (auto-generado)
  _ui_defs.json      ← lista de todos los .json (auto-gestionado)
```

`_ui_defs.json` y los archivos de pantalla se regeneran solos cada vez que guardas un `.pcakeui`. No los edites a mano.

---

## Ejemplo completo

```xml
<namespace name="nicebrain_hud" />

<panel name="hud_root"
    anchor="top_right"
    offset="[-8, 8]"
    size="[140, 80]"
>
    <image name="bg"
        texture="textures/ui/Black"
        anchor="center"
        size="100% 100%"
        color="#0A0A0A"
    />

    <image name="top_bar"
        texture="textures/ui/White"
        anchor="top_middle"
        offset="[0, 0]"
        size="100% 2"
        color="#2266CC"
    />

    <label name="title"
        text="§l§bNiceBrain§r §8HUD"
        anchor="top_middle"
        offset="[0, 6]"
        shadow="true"
    />

    <stack_panel name="stats"
        anchor="top_left"
        offset="[6, 24]"
        size="[128, 52]"
        orientation="vertical"
    >
        <label name="s_status" text="§7■ §fStatus §7» §aActive" shadow="true" />
        <label name="s_level"  text="§7■ §fLevel  §7» §e42"     shadow="true" />
        <label name="s_score"  text="§7■ §fScore  §7» §61,337"  shadow="true" />
    </stack_panel>
</panel>

<modify screen="hud_screen" target="root_panel" operation="insert_front">
    <ref name="nicebrain_root" extends="nicebrain_hud.hud_root" />
</modify>
```

---

## Datos dinámicos

Para mostrar datos que cambian en tiempo real usa `bind:`:

```xml
<!-- Valores expuestos por el juego (funcionan directo) -->
<label name="hp"    bind:text="#player_health" />
<label name="nivel" bind:text="#player_experience_level" />
```

Para datos **completamente custom desde scripts**, Minecraft no tiene un canal directo de script → UI. Las alternativas son:
- **Scoreboards** — el script actualiza un objetivo, el UI lo lee via bindings de colección.
- **Actionbar** — `#action_bar_text`, simple pero reemplaza el actionbar vanilla.

---

## Integración con `pcake watch` y `pcake build`

| Evento                         | Acción                                                  |
|--------------------------------|---------------------------------------------------------|
| Guardar un `.pcakeui`          | Recompila todos los `.pcakeui`, regenera screen files y `_ui_defs.json` |
| Eliminar un `.pcakeui`         | Recompila y actualiza todos los archivos generados      |
| `pcake build`                  | Compila a staging temporal, nunca escribe en `addon/RP` |
