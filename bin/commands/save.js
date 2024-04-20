const fs = require("fs-extra");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const uuid = require("uuid");
const os = require('os');
const path = require("path");
const cakeManifest = require("../../lib/src/elements/CakeManifest");

exports.command = "save";
exports.desc = "Guardar proyecto para pruebas";
exports.builder = {
    resource: {
        type: "boolean",
        alias: "r",
        description: "package type",
    },
};
exports.handler = async function (argv) {
    const pcake_file = fs.readFileSync('./pcake.config.json', { encoding: 'utf8' });
    const config = JSON.parse(pcake_file);
    if(!fs.existsSync("./addon/BP") || !fs.existsSync("./addon/RP")) {
        console.log(`[!] Asegurate de que tanto la carpeta "BP" y "RP" existan en tu proyecto.`.red);
        return
    };

    const rutaDirectorioPrincipal = os.homedir();
    const rutaCarpetaUsuario = path.join(rutaDirectorioPrincipal, 'AppData', 'Local', 'Packages', 'Microsoft.MinecraftUWP_8wekyb3d8bbwe', 'LocalState', 'games', 'com.mojang');

    if('name' in config && 'identifier' in config) {
        await fs.remove(path.join(rutaCarpetaUsuario, 'development_behavior_packs', `${config.name}[${config.identifier}] - BP`)).then(() => {
            fs.copy("./addon/BP", path.join(rutaCarpetaUsuario, 'development_behavior_packs', `${config.name}[${config.identifier}] - BP`));
        });
        await fs.remove(path.join(rutaCarpetaUsuario, 'development_resource_packs', `${config.name}[${config.identifier}] - RP`)).then(() => {
            fs.copy("./addon/RP", path.join(rutaCarpetaUsuario, 'development_resource_packs', `${config.name}[${config.identifier}] - RP`));
        });
    }
};
