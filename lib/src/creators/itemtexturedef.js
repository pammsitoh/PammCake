const fs = require("fs");
const path = require("path");
require("colors");
const { ask } = require("../utils/prompts");

const TEXTURE_FILE = path.join("addon", "RP", "textures", "item_texture.json");

module.exports = {
    type: "itemtexturedef",
    label: "Item texture def",
    description: "Registrar una textura en item_texture.json del RP",

    async wizard(rl, namespace) {
        const key = await ask(
            rl,
            "Texture key",
            "nombre usado en minecraft:icon  ej. my_sword",
            null
        );
        if (!key) throw new Error("La key de la textura es requerida.");

        const texturePath = await ask(
            rl,
            "Texture path",
            "ruta relativa al RP  ej. textures/items/my_sword",
            `textures/items/${key}`
        );

        return { key, texturePath };
    },

    async create({ key, texturePath }) {
        let data;

        if (fs.existsSync(TEXTURE_FILE)) {
            data = JSON.parse(fs.readFileSync(TEXTURE_FILE, "utf8"));
        } else {
            fs.mkdirSync(path.dirname(TEXTURE_FILE), { recursive: true });
            data = {
                resource_pack_name: "vanilla",
                texture_name: "atlas.items",
                texture_data: {}
            };
        }

        if (!data.texture_data) data.texture_data = {};

        if (data.texture_data[key]) {
            throw new Error(`La key "${key}" ya existe en item_texture.json.`);
        }

        data.texture_data[key] = { textures: texturePath };

        fs.writeFileSync(TEXTURE_FILE, JSON.stringify(data, null, 4), "utf8");

        return TEXTURE_FILE;
    }
};
