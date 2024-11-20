const fs = require("fs-extra");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const uuid = require("uuid");
const os = require("os");
const path = require("path");
const AdmZip = require("adm-zip");
const { argv } = require("process");
const { AddonManager } = require("gumaddon");
const addScripts = require("../../lib/src/adds/addScripts");
const AddModule = require("../../lib/src/adds/addModule");

const MINECRAFT_PACKAGE_PATH = path.join(
    os.homedir(),
    "AppData",
    "Local",
    "Packages",
    "Microsoft.MinecraftUWP_8wekyb3d8bbwe",
    "LocalState",
    "games",
    "com.mojang"
);

exports.command = "add <thing>";
exports.desc = "Add a pcake package in addon project";
exports.builder = {};
exports.handler = async function (argv) {
    if (!argv.thing) return;
    try {
        await addElement(argv);
    } catch (error) {
        console.error(`[!] Error: ${error.message}`.red);
    }
};

const addElement = async (args) => {
    const addon = new AddonManager("./addon");

    try {
        const pcakeFileContent = await fs.readFile(
            "./pcake.config.json",
            "utf8"
        );
        const config = JSON.parse(pcakeFileContent);

        if (!fs.existsSync("./addon/BP") || !fs.existsSync("./addon/RP")) {
            console.log(
                `[!] Asegúrate de que tanto la carpeta "BP" y "RP" existan en tu proyecto.`
                    .red
            );
            return;
        }

        if (args.thing === "scripts") {
            await addScripts(addon);
        } else {
            await AddModule(addon, args.thing);
        }
    } catch (error) {
        console.error(
            `[!] Error al leer el archivo de configuración: ${error.message}`
                .red
        );
    }
};
