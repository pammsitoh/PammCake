const fs = require("fs-extra");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const uuid = require("uuid");
const os = require('os');
const path = require("path");
const cakeManifest = require("../../lib/src/elements/CakeManifest");

const { execSync } = require("child_process");
const logger = require("../../lib/src/lib/Loggers");

exports.command = "save";
exports.desc = "Guardar proyecto para pruebas";
exports.builder = {
    resource: {
        type: "boolean",
        alias: "r",
        description: "package type",
    },
    server: {
        type: "boolean",
        alias: "s",
        description: "save addon in development server"
    }
};

const runTsc = () => {
    if (fs.existsSync("./tsconfig.json")) {
        try {
            logger.Log(`Compilando TypeScript...`.yellow);
            execSync("tsc", { stdio: "inherit" });
            logger.Success(`TypeScript compilado con éxito.`.green);
        } catch (err) {
            logger.Error(`Error al compilar TypeScript.`.red);
        }
    }
};

exports.handler = async function (argv) {
    runTsc();
    if(argv.server) {
        saveInServer();
        return;
    }

    const pcake_file = fs.readFileSync('./pcake.config.json', { encoding: 'utf8' });
    const config = JSON.parse(pcake_file);
    if(!fs.existsSync("./addon/BP") || !fs.existsSync("./addon/RP")) {
        console.log(`[!] Asegurate de que tanto la carpeta "BP" y "RP" existan en tu proyecto.`.red);
        return
    };

    const rutaDirectorioPrincipal = os.homedir();
    // path.join(rutaDirectorioPrincipal, 'AppData', 'Roaming', 'Minecraft Bedrock', 'Users', 'Shared', 'games', 'com.mojang')
    const rutaCarpetaUsuario = path.join(rutaDirectorioPrincipal, 'AppData', 'Roaming', 'Minecraft Bedrock', 'Users', 'Shared', 'games', 'com.mojang');

    if('name' in config && 'identifier' in config) {
        await fs.remove(path.join(rutaCarpetaUsuario, 'development_behavior_packs', `${config.name}[${config.identifier}] - BP`)).then(() => {
            fs.copy("./addon/BP", path.join(rutaCarpetaUsuario, 'development_behavior_packs', `${config.name}[${config.identifier}] - BP`));
        });
        await fs.remove(path.join(rutaCarpetaUsuario, 'development_resource_packs', `${config.name}[${config.identifier}] - RP`)).then(() => {
            fs.copy("./addon/RP", path.join(rutaCarpetaUsuario, 'development_resource_packs', `${config.name}[${config.identifier}] - RP`));
        });
    }

    logger.Success(`Proyecto guardado con éxito.`);
};

const saveInServer = async () => {
    const pcake_file = fs.readFileSync('./pcake.config.json', { encoding: 'utf8' });
    const config = JSON.parse(pcake_file);
    if(!fs.existsSync("./addon/BP") || !fs.existsSync("./addon/RP")) {
        console.log(`[!] Asegurate de que tanto la carpeta "BP" y "RP" existan en tu proyecto.`.red);
        return
    };

    const rutaCarpetaUsuario = path.join("./server");

    if('name' in config && 'identifier' in config) {
        await fs.remove(path.join(rutaCarpetaUsuario, 'development_behavior_packs', `${config.name}[${config.identifier}] - BP`)).then(() => {
            fs.copy("./addon/BP", path.join(rutaCarpetaUsuario, 'development_behavior_packs', `${config.name}[${config.identifier}] - BP`));
        });
        await fs.remove(path.join(rutaCarpetaUsuario, 'development_resource_packs', `${config.name}[${config.identifier}] - RP`)).then(() => {
            fs.copy("./addon/RP", path.join(rutaCarpetaUsuario, 'development_resource_packs', `${config.name}[${config.identifier}] - RP`));
        });
    }
};