const fs = require("fs");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const uuid = require("uuid");
const os = require('os');
const path = require('path');

exports.command = "list <type>";
exports.desc = "Ver Lista De Addons En Desarrollo.";
exports.builder = {};
exports.handler = function (argv) {
    const rutaDirectorioPrincipal = os.homedir();
    const rutaCarpetaUsuario = path.join(rutaDirectorioPrincipal, 'AppData', 'Local', 'Packages', 'Microsoft.MinecraftUWP_8wekyb3d8bbwe', 'LocalState', 'games', 'com.mojang');

    const files = fs.readdirSync(path.join(rutaCarpetaUsuario, argv.type == 'resources' ? 'development_resource_packs' : 'development_behavior_packs'));
    files.forEach((f) => {
        console.log(f.magenta);
    });
    console.log(`Total de addons: ${files.length}`.green);
};
