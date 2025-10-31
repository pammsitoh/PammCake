const fs = require("fs-extra");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const uuid = require("uuid");
const os = require("os");
const path = require("path");
const cakeManifest = require("../../lib/src/elements/CakeManifest");
const { EntityCompiler } = require("../../lib/src/compilers/EntityCompiler");
const { MenuCompiler } = require("../../lib/src/compilers/MenuCompilers");
const { AddonManager } = require("gumaddon");
const EntityTemplate = require("../../lib/src/templates/Entity");

exports.command = "create <file_name>";
exports.desc = "Guardar proyecto para pruebas";
exports.builder = {
    entity: {
        type: "boolean",
        alias: "e",
        description: "type of entity to create",
    },
    template: {
        type: "string",
        alias: "t",
        description: "template to use for the entity",
    },
};
exports.handler = async function (argv) {
    if(!argv.file_name) return;
    const pcake_file = fs.readFileSync("./pcake.config.json", {
        encoding: "utf8",
    });
    const config = JSON.parse(pcake_file);
    if (!fs.existsSync("./addon/BP") || !fs.existsSync("./addon/RP")) {
        console.log(
            `[!] Asegurate de que tanto la carpeta "BP" y "RP" existan en tu proyecto.`
                .red
        );
        return;
    }

    // Code here...
    const addon = new AddonManager("./addon");
    const fileName = argv.file_name;
    
    // IF ENTITY
    if(argv.entity) {
        let content = {};

        if(!argv.template) {
            content = EntityTemplate
        }

        addon.getBehavior().create(`entities/${fileName}.json`, JSON.stringify(content, null, 4));
        addon.success(`Entity ${fileName} created successfully!`);
        return;
    }
};
