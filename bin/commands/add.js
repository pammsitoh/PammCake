const fs = require("fs-extra");
require("colors");
const { AddonManager } = require("gumaddon");
const addScripts = require("../../lib/src/adds/addScripts");
const AddModule = require("../../lib/src/adds/addModule");
const addTypescript = require("../../lib/src/adds/addTypescript");

exports.command = "add <thing>";
exports.desc = "Agregar un paquete o módulo al proyecto";
exports.builder = {};

exports.handler = async function (argv) {
    if (!argv.thing) return;

    const addon = new AddonManager("./addon");

    if (!fs.existsSync("./addon/BP") || !fs.existsSync("./addon/RP")) {
        console.log(`[!] Asegúrate de que existan las carpetas "addon/BP" y "addon/RP".`.red);
        return;
    }

    try {
        if (argv.thing === "scripts") {
            await addScripts(addon);
        } else if (argv.thing === "typescript") {
            await addTypescript(addon);
        } else {
            await AddModule(addon, argv.thing);
        }
    } catch (error) {
        console.error(`[!] Error: ${error.message}`.red);
    }
};
