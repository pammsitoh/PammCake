const fs = require("fs");
const path = require("path");
require("colors");
const { ask, select } = require("../utils/prompts");

const CATEGORIES = ["items", "equipment", "nature", "construction"];

module.exports = {
    type: "item",
    label: "Item",
    description: "Custom item para el Behavior Pack",

    async wizard(rl, namespace) {
        const name = await ask(
            rl,
            "Item name",
            `identifier: ${namespace}:<name>`,
            null
        );
        if (!name) throw new Error("El nombre del item es requerido.");

        const catIdx = await select(rl, "Menu category", CATEGORIES, 0);

        const displayName = await ask(
            rl,
            "Display name",
            "visible en el inventario · Enter para omitir",
            null
        );

        const icon = await ask(
            rl,
            "Icon texture",
            "nombre de la textura en item_texture.json",
            "diamond"
        );

        return { name, category: CATEGORIES[catIdx], displayName, icon };
    },

    async create({ name, category, displayName, icon }, namespace) {
        const identifier = `${namespace}:${name}`;

        // ── BP: items/<name>.json ─────────────────────────────────────────────
        const bpDir  = path.join("addon", "BP", "items");
        const bpFile = path.join(bpDir, `${name}.json`);
        fs.mkdirSync(bpDir, { recursive: true });

        const template = {
            format_version: "1.21.0",
            "minecraft:item": {
                description: {
                    identifier,
                    menu_category: { category }
                },
                components: {
                    "minecraft:icon": {
                        textures: { default: icon }
                    }
                }
            }
        };

        fs.writeFileSync(bpFile, JSON.stringify(template, null, 4), "utf8");

        // ── RP: en_US.lang (append if the file exists) ────────────────────────
        if (displayName) {
            const langFile = path.join("addon", "RP", "texts", "en_US.lang");
            if (fs.existsSync(langFile)) {
                fs.appendFileSync(langFile, `\nitem.${identifier}=${displayName}`, "utf8");
            }
        }

        return bpFile;
    }W
};
