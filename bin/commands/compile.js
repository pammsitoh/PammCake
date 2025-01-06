const fs = require("fs-extra");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const uuid = require("uuid");
const os = require("os");
const path = require("path");
const cakeManifest = require("../../lib/src/elements/CakeManifest");
const { EntityCompiler } = require("../../lib/src/compilers/EntityCompiler");
const { MenuCompiler } = require("../../lib/src/compilers/MenuCompilers");

exports.command = "compile <compile_type>";
exports.desc = "Guardar proyecto para pruebas";
exports.builder = {
    type: {
        type: "boolean",
        alias: "t",
        description: "package type",
    },
};
exports.handler = async function (argv) {
    if(!argv.compile_type) return;
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

    switch (argv.compile_type) {
        case "menus":
            MenuCompiler();
            break;
    
        default:
            break;
    }
};
