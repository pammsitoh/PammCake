const fs = require("fs");
const path = require("path");
require("colors");
const { ask, select, confirm } = require("../utils/prompts");

const RENDER_METHODS = ["opaque", "alpha_test", "blend", "double_sided"];
const TERRAIN_FILE   = path.join("addon", "RP", "textures", "terrain_texture.json");

module.exports = {
    type: "block",
    label: "Block",
    description: "Custom block para el Behavior Pack",

    async wizard(rl, namespace) {
        const name = await ask(
            rl,
            "Block name",
            `identifier: ${namespace}:<name>`,
            null
        );
        if (!name) throw new Error("El nombre del bloque es requerido.");

        const textureKey = await ask(
            rl,
            "Texture key",
            "key en terrain_texture.json usada en material_instances",
            name
        );

        const renderIdx = await select(rl, "Render method", RENDER_METHODS, 0);

        const registerTexture = await confirm(
            rl,
            "¿Registrar la textura en terrain_texture.json ahora?",
            false
        );

        let texturePath = null;
        if (registerTexture) {
            texturePath = await ask(
                rl,
                "Texture path",
                "ruta relativa al RP",
                `textures/blocks/${textureKey}`
            );
        }

        return { name, textureKey, renderMethod: RENDER_METHODS[renderIdx], registerTexture, texturePath };
    },

    async create({ name, textureKey, renderMethod, registerTexture, texturePath }, namespace) {
        const identifier = `${namespace}:${name}`;
        const created = [];

        // ── BP/blocks/<name>.json ─────────────────────────────────────────────
        const bpDir  = path.join("addon", "BP", "blocks");
        const bpFile = path.join(bpDir, `${name}.json`);
        fs.mkdirSync(bpDir, { recursive: true });

        fs.writeFileSync(bpFile, JSON.stringify({
            format_version: "1.21.0",
            "minecraft:block": {
                description: { identifier },
                components: {
                    "minecraft:material_instances": {
                        "*": {
                            texture: textureKey,
                            render_method: renderMethod
                        }
                    }
                }
            }
        }, null, 4), "utf8");
        created.push(bpFile);

        // ── terrain_texture.json (opcional) ───────────────────────────────────
        if (registerTexture && texturePath) {
            let data;
            if (fs.existsSync(TERRAIN_FILE)) {
                data = JSON.parse(fs.readFileSync(TERRAIN_FILE, "utf8"));
            } else {
                fs.mkdirSync(path.dirname(TERRAIN_FILE), { recursive: true });
                data = {
                    resource_pack_name: "vanilla",
                    texture_name: "atlas.terrain",
                    texture_data: {}
                };
            }
            if (!data.texture_data) data.texture_data = {};
            if (!data.texture_data[textureKey]) {
                data.texture_data[textureKey] = { textures: texturePath };
                fs.writeFileSync(TERRAIN_FILE, JSON.stringify(data, null, 4), "utf8");
                created.push(TERRAIN_FILE);
            }
        }

        return created;
    }
};
