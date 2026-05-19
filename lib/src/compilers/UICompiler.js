"use strict";
const fs   = require("fs");
const path = require("path");

// ──────────────────────────────────────────────
// Parser
// ──────────────────────────────────────────────

class UIParser {
    constructor(source) {
        this.src = source;
        this.pos = 0;
    }

    parse() {
        const nodes = [];
        while (this.pos < this.src.length) {
            this.skipSpace();
            if (this.pos >= this.src.length) break;
            const node = this.parseNode();
            if (node) nodes.push(node);
        }
        return nodes;
    }

    skipSpace() {
        while (this.pos < this.src.length && /\s/.test(this.src[this.pos])) this.pos++;
    }

    parseNode() {
        if (this.src.startsWith("<!--", this.pos)) {
            const end = this.src.indexOf("-->", this.pos + 4);
            this.pos  = end === -1 ? this.src.length : end + 3;
            return null;
        }
        if (this.src[this.pos] === "<" && this.src[this.pos + 1] !== "/") {
            return this.parseElement();
        }
        this.pos++;
        return null;
    }

    parseElement() {
        this.pos++; // skip '<'
        const tag   = this.readName();
        const attrs = this.readAttrs();
        this.skipSpace();

        // Self-closing: <tag ... />
        if (this.src[this.pos] === "/" && this.src[this.pos + 1] === ">") {
            this.pos += 2;
            return { tag, attrs, children: [] };
        }

        if (this.src[this.pos] === ">") this.pos++;

        const children = [];
        while (this.pos < this.src.length) {
            this.skipSpace();
            if (this.pos >= this.src.length) break;
            // Closing tag </tag>
            if (this.src[this.pos] === "<" && this.src[this.pos + 1] === "/") {
                const end = this.src.indexOf(">", this.pos);
                this.pos  = end === -1 ? this.src.length : end + 1;
                break;
            }
            const child = this.parseNode();
            if (child) children.push(child);
        }

        return { tag, attrs, children };
    }

    readName() {
        let name = "";
        while (this.pos < this.src.length && /[a-zA-Z0-9_:-]/.test(this.src[this.pos])) {
            name += this.src[this.pos++];
        }
        return name;
    }

    readAttrs() {
        const attrs = {};
        while (this.pos < this.src.length) {
            this.skipSpace();
            const ch = this.src[this.pos];
            if (ch === ">" || (ch === "/" && this.src[this.pos + 1] === ">")) break;
            const name = this.readAttrName();
            if (!name) { this.pos++; continue; }
            this.skipSpace();
            if (this.src[this.pos] === "=") {
                this.pos++;
                this.skipSpace();
                attrs[name] = this.readAttrValue();
            } else {
                attrs[name] = true;
            }
        }
        return attrs;
    }

    readAttrName() {
        let name = "";
        // colons allowed for bind:property syntax
        while (this.pos < this.src.length && /[a-zA-Z0-9_:.-]/.test(this.src[this.pos])) {
            name += this.src[this.pos++];
        }
        return name;
    }

    readAttrValue() {
        const quote = this.src[this.pos];
        if (quote !== '"' && quote !== "'") return "";
        this.pos++;
        let value = "";
        while (this.pos < this.src.length && this.src[this.pos] !== quote) {
            value += this.src[this.pos++];
        }
        this.pos++; // closing quote
        return value;
    }
}

// ──────────────────────────────────────────────
// Value helpers
// ──────────────────────────────────────────────

const CONTROL_TYPES = new Set([
    "panel", "stack_panel", "grid", "scroll_view", "label", "image",
    "button", "toggle", "slider", "text_edit_box", "dropdown",
    "custom", "screen", "input_panel", "carousel_text",
    "grid_item", "collection_panel",
]);

const ARRAY_PROPS   = new Set(["size", "offset", "max_size", "min_size", "clip_offset", "clip_size"]);
const COLOR_PROPS   = new Set(["color", "shadow_color", "background_color", "select_color"]);
const BOOLEAN_PROPS = new Set(["shadow", "visible", "enabled", "clips_children",
    "allow_clipping", "propagate_alpha", "use_child_anchors", "ignored", "fill"]);

function parseSize(val) {
    if (!val || typeof val !== "string") return val;
    const s = val.trim();

    // Already a JSON array: "[180, 18]"
    if (s.startsWith("[")) {
        try { return JSON.parse(s); } catch { /* fall through */ }
    }

    // "100% 100%"  or  "180 18"  or  "180, 18"
    const parts = s.split(/[\s,]+/).filter(Boolean);
    if (parts.length >= 2) {
        return parts.slice(0, 2).map(p => {
            if (p.includes("%")) return p;
            const n = Number(p);
            return isNaN(n) ? p : n;
        });
    }
    return s;
}

function hexToRgb(hex) {
    const c = hex.replace(/^#/, "");
    if (c.length !== 6 && c.length !== 8) return hex;
    const round = n => Math.round(n * 10000) / 10000;
    const r = round(parseInt(c.slice(0, 2), 16) / 255);
    const g = round(parseInt(c.slice(2, 4), 16) / 255);
    const b = round(parseInt(c.slice(4, 6), 16) / 255);
    if (c.length === 8) {
        const a = round(parseInt(c.slice(6, 8), 16) / 255);
        return [r, g, b, a];
    }
    return [r, g, b];
}

function parseColor(val) {
    if (!val || typeof val !== "string") return val;
    if (val.startsWith("#")) return hexToRgb(val);
    if (val.startsWith("[")) {
        try { return JSON.parse(val); } catch { /* pass through */ }
    }
    return val;
}

// ──────────────────────────────────────────────
// Transformer
// ──────────────────────────────────────────────

function transformElement(node) {
    const { tag, attrs, children } = node;
    const name       = attrs.name     || "unnamed";
    const extendsRef = attrs.extends  || null;
    const elementKey = extendsRef ? `${name}@${extendsRef}` : name;

    const props    = {};
    const bindings = [];

    if (CONTROL_TYPES.has(tag)) props.type = tag;

    for (const [key, val] of Object.entries(attrs)) {
        if (key === "name" || key === "extends") continue;

        // bind:property="#source"  →  set prop + add binding
        if (key.startsWith("bind:")) {
            const prop = key.slice(5);
            props[prop] = val;
            bindings.push({ binding_name: val });
            continue;
        }

        // anchor="top_left"  →  anchor_from + anchor_to
        if (key === "anchor") {
            props.anchor_from = val;
            props.anchor_to   = val;
            continue;
        }

        if (ARRAY_PROPS.has(key))   { props[key] = parseSize(val);               continue; }
        if (COLOR_PROPS.has(key))   { props[key] = parseColor(val);              continue; }
        if (BOOLEAN_PROPS.has(key)) { props[key] = val === "true" || val === true; continue; }

        props[key] = val;
    }

    const controls = [];
    for (const child of children) {
        if (child.tag === "namespace" || child.tag === "modify") continue;
        const r = transformElement(child);
        controls.push({ [r.key]: r.props });
    }

    if (controls.length > 0) props.controls = controls;
    if (bindings.length > 0) props.bindings = bindings;

    return { key: elementKey, props };
}

// screenMods shape: { screenName: { targetElement: [modEntry, ...] } }
function transform(ast) {
    const elements   = {};
    const screenMods = {};

    const nsNode = ast.find(n => n.tag === "namespace");
    if (nsNode) elements.namespace = nsNode.attrs.name || "";

    for (const node of ast) {
        if (node.tag === "namespace") continue;

        if (node.tag === "modify") {
            const screen    = node.attrs.screen    || "hud_screen";
            const target    = node.attrs.target    || "root_panel";
            const operation = node.attrs.operation || "insert_front";
            const value     = node.children
                .filter(c => c.tag !== "namespace" && c.tag !== "modify")
                .map(c => {
                    const r = transformElement(c);
                    return { [r.key]: Object.keys(r.props).length ? r.props : {} };
                });

            if (!screenMods[screen])         screenMods[screen]         = {};
            if (!screenMods[screen][target]) screenMods[screen][target] = [];
            screenMods[screen][target].push({ array_name: "controls", operation, value });
            continue;
        }

        const r = transformElement(node);
        elements[r.key] = r.props;
    }

    return { elements, screenMods };
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

/**
 * Compila un .pcakeui: escribe sus definiciones de elementos en outputPath
 * y devuelve los screenMods para que el llamador los agregue al pool global.
 *
 * @returns {{ [screen: string]: { [target: string]: object[] } }}
 */
function UICompile(inputPath, outputPath) {
    try {
        const source              = fs.readFileSync(inputPath, "utf-8");
        const { elements, screenMods } = transform(new UIParser(source).parse());
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(elements, null, 2), "utf-8");
        return screenMods;
    } catch (err) {
        console.error(`[UICompiler] Error en ${path.basename(inputPath)}: ${err.message}`);
        return {};
    }
}

function _scanJsonFiles(dir) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) { results.push(..._scanJsonFiles(full)); continue; }
        if (entry.name.endsWith(".json")) results.push(full);
    }
    return results;
}

/**
 * Regenera ui/_ui_defs.json dentro de destRp con todos los .json
 * encontrados en destRp/ui/. Se llama automáticamente al compilar.
 */
function UIUpdateDefs(destRp) {
    const uiDir    = path.join(destRp, "ui");
    const defsPath = path.join(uiDir, "_ui_defs.json");
    const defs     = _scanJsonFiles(uiDir)
        .filter(f => f !== defsPath)
        .map(f => path.relative(destRp, f).replace(/\\/g, "/"))
        .sort();
    try {
        if (!fs.existsSync(uiDir)) fs.mkdirSync(uiDir, { recursive: true });
        fs.writeFileSync(defsPath, JSON.stringify({ ui_defs: defs }, null, 2), "utf-8");
    } catch (err) {
        console.error(`[UICompiler] Error actualizando _ui_defs.json: ${err.message}`);
    }
}

/**
 * Genera un archivo JSON-UI por cada pantalla que tenga modificaciones
 * (p.ej. hud_screen.json) dentro de destRp/ui/.
 * Cada archivo usa el namespace de la propia pantalla para que Minecraft
 * pueda parchear root_panel y compañía correctamente.
 *
 * @param {string} destRp
 * @param {{ [screen: string]: { [target: string]: object[] } }} allScreenMods
 */
function UIGenerateScreenFiles(destRp, allScreenMods) {
    const uiDir = path.join(destRp, "ui");
    if (!fs.existsSync(uiDir)) fs.mkdirSync(uiDir, { recursive: true });

    for (const [screen, targets] of Object.entries(allScreenMods)) {
        const screenJson = { namespace: screen };
        for (const [target, mods] of Object.entries(targets)) {
            screenJson[target] = { modifications: mods };
        }
        const outPath = path.join(uiDir, `${screen}.json`);
        try {
            fs.writeFileSync(outPath, JSON.stringify(screenJson, null, 2), "utf-8");
        } catch (err) {
            console.error(`[UICompiler] Error escribiendo ${screen}.json: ${err.message}`);
        }
    }
}

/**
 * Compila todos los .pcakeui encontrados en srcRp hacia destRp,
 * conservando la misma estructura de carpetas. Genera automáticamente
 * los archivos de pantalla (hud_screen.json, etc.) y _ui_defs.json.
 *
 * Los archivos fuente (.pcakeui) NUNCA se escriben en destRp.
 *
 * @param {string} srcRp  - Raíz del RP fuente  (ej: "./addon/RP")
 * @param {string} destRp - Raíz del RP destino (ej: ruta en Minecraft o staging)
 * @returns {number} Cantidad de archivos compilados.
 */
function UICompileDir(srcRp, destRp) {
    if (!fs.existsSync(srcRp)) return 0;
    let count = 0;
    const allScreenMods = {};

    const mergeScreenMods = (screenMods) => {
        for (const [screen, targets] of Object.entries(screenMods)) {
            if (!allScreenMods[screen]) allScreenMods[screen] = {};
            for (const [target, mods] of Object.entries(targets)) {
                if (!allScreenMods[screen][target]) allScreenMods[screen][target] = [];
                allScreenMods[screen][target].push(...mods);
            }
        }
    };

    const scan = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) { scan(full); continue; }
            if (!entry.name.endsWith(".pcakeui")) continue;
            const relative = path.relative(srcRp, full);
            const outPath  = path.join(destRp, relative).replace(/\.pcakeui$/, ".json");
            const screenMods = UICompile(full, outPath);
            mergeScreenMods(screenMods);
            count++;
        }
    };

    scan(srcRp);
    UIGenerateScreenFiles(destRp, allScreenMods);
    UIUpdateDefs(destRp);
    return count;
}

module.exports = { UICompile, UICompileDir, UIUpdateDefs, UIGenerateScreenFiles };
