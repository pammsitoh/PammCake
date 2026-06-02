const fs = require("fs");
const path = require("path");
require("colors");
const { ask, confirm } = require("../utils/prompts");

module.exports = {
    type: "entity",
    label: "Entity",
    description: "Entidad con archivos BP y RP (+ render controller opcional)",

    async wizard(rl, namespace) {
        const name = await ask(
            rl,
            "Entity name",
            `identifier: ${namespace}:<name>`,
            null
        );
        if (!name) throw new Error("El nombre de la entidad es requerido.");

        const renderController = await confirm(
            rl,
            "¿Crear un render controller dedicado?",
            false
        );

        return { name, renderController };
    },

    async create({ name, renderController }, namespace) {
        const identifier = `${namespace}:${name}`;
        const rcKey = `controller.render.${namespace}_${name}`;
        const created = [];

        // ── BP/entities/<name>.json ───────────────────────────────────────────
        const bpDir  = path.join("addon", "BP", "entities");
        const bpFile = path.join(bpDir, `${name}.json`);
        fs.mkdirSync(bpDir, { recursive: true });

        fs.writeFileSync(bpFile, JSON.stringify({
            format_version: "1.21.0",
            "minecraft:entity": {
                description: {
                    identifier,
                    is_spawnable: true,
                    is_summonable: true,
                    is_experimental: false
                },
                component_groups: {},
                components: {},
                events: {}
            }
        }, null, 4), "utf8");
        created.push(bpFile);

        // ── RP/entity/<name>.entity.json ──────────────────────────────────────
        const rpDir  = path.join("addon", "RP", "entity");
        const rpFile = path.join(rpDir, `${name}.entity.json`);
        fs.mkdirSync(rpDir, { recursive: true });

        fs.writeFileSync(rpFile, JSON.stringify({
            format_version: "1.10.0",
            "minecraft:client_entity": {
                description: {
                    identifier,
                    materials: { default: "entity_alphatest" },
                    textures:  { default: `textures/entity/${name}` },
                    geometry:  { default: `geometry.${name}` },
                    render_controllers: [rcKey],
                    spawn_egg: {
                        base_color: "#000000",
                        overlay_color: "#ffffff"
                    }
                }
            }
        }, null, 4), "utf8");
        created.push(rpFile);

        // ── RP/render_controllers/<name>.render_controllers.json (opcional) ───
        if (renderController) {
            const rcDir  = path.join("addon", "RP", "render_controllers");
            const rcFile = path.join(rcDir, `${name}.render_controllers.json`);
            fs.mkdirSync(rcDir, { recursive: true });

            fs.writeFileSync(rcFile, JSON.stringify({
                format_version: "1.8.0",
                render_controllers: {
                    [rcKey]: {
                        geometry:  "Geometry.default",
                        materials: [{ "*": "Material.default" }],
                        textures:  ["Texture.default"]
                    }
                }
            }, null, 4), "utf8");
            created.push(rcFile);
        }

        return created;
    }
};
