const fs = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");
require("colors");
const logger = require("../../lib/src/lib/Loggers");
const { getMinecraftPathFor } = require("../../lib/src/utils/minecraft");
const { readConfig, addonFoldersExist } = require("../../lib/src/utils/config");

exports.command = "save";
exports.desc = "Guardar proyecto en Minecraft para pruebas";
exports.builder = {
    server: {
        type: "boolean",
        alias: "s",
        description: "Guarda el addon en ./server/ en lugar del Minecraft local",
    },
};

exports.handler = async function (argv) {
    compileTsIfNeeded();

    if (!addonFoldersExist()) {
        console.log(`[!] Asegúrate de que existan las carpetas "addon/BP" y "addon/RP".`.red);
        return;
    }

    const config = readConfig();

    // Elige el destino: la carpeta ./server/ o la instalación local de Minecraft
    const isPreview = config.is_preview === true;
    if (isPreview) logger.Warn("⚠ Guardando en Minecraft Preview...");
    const basePath = argv.server ? "./server" : getMinecraftPathFor(isPreview);
    await copyAddonTo(config, basePath);

    logger.Success("Proyecto guardado con éxito.");
};

/**
 * Compila TypeScript si existe un tsconfig.json en el proyecto.
 */
const compileTsIfNeeded = () => {
    if (!fs.existsSync("./tsconfig.json")) return;

    try {
        logger.Log("Compilando TypeScript...");
        execSync("tsc", { stdio: "inherit" });
        logger.Success("TypeScript compilado con éxito.");
    } catch {
        logger.Error("Error al compilar TypeScript.");
    }
};

/**
 * Copia las carpetas BP y RP al destino indicado.
 * Primero elimina la versión anterior para evitar archivos obsoletos.
 *
 * @param {{ name: string, identifier: string }} config - Configuración del proyecto
 * @param {string} basePath - Ruta base donde están las carpetas development_*_packs
 */
const copyAddonTo = async (config, basePath) => {
    const packName = `${config.name}[${config.identifier}]`;

    const bpDest = path.join(basePath, "development_behavior_packs", `${packName} - BP`);
    const rpDest = path.join(basePath, "development_resource_packs", `${packName} - RP`);

    await fs.remove(bpDest);
    await fs.copy("./addon/BP", bpDest);

    await fs.remove(rpDest);
    await fs.copy("./addon/RP", rpDest);
};
