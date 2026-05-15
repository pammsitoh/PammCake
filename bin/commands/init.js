const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
require("colors");
const CakeManifest = require("../../lib/src/elements/CakeManifest");

exports.command = "init <project_name>";
exports.desc = "Inicializar proyecto en el directorio actual.";
exports.builder = {};

exports.handler = async function (argv) {
    try {
        // Copia los archivos del proyecto ejemplo al directorio actual
        await fse.copy(path.join(__dirname, "../../assets/example_project"), "./");

        // Crea el archivo de configuración con el nombre del proyecto
        fs.writeFileSync(
            "./pcake.config.json",
            JSON.stringify({ name: argv.project_name, identifier: "dev" }, null, 4)
        );

        // Crea las carpetas BP y RP dentro de ./addon/
        createPack(path.join("addon", "BP"), argv.project_name, "data",      "Behaviors", "§b");
        createPack(path.join("addon", "RP"), argv.project_name, "resources", "Resources", "§d");
    } catch (err) {
        console.error("Error al crear el proyecto:".red, err.message);
    }
};

/**
 * Crea una carpeta de pack (BP o RP) con su manifest.json, archivos de idioma e ícono.
 *
 * @param {string} packPath   - Ruta donde crear el pack (ej: "addon/BP")
 * @param {string} projectName - Nombre del proyecto
 * @param {"data" | "resources"} moduleType - Tipo de módulo del manifest
 * @param {string} packLabel  - "Behaviors" o "Resources"
 * @param {string} colorCode  - Código de color de Minecraft para la descripción (ej: "§b")
 */
function createPack(packPath, projectName, moduleType, packLabel, colorCode) {
    fs.mkdirSync(packPath, { recursive: true });

    if (fs.existsSync(path.join(packPath, "manifest.json"))) {
        console.log(`<!> "${projectName} - ${packLabel}" ya existe.`.red);
        return;
    }

    // Genera el manifest.json con UUIDs únicos
    const manifest = new CakeManifest();
    manifest.base.modules[0].type = moduleType;
    manifest.setVersion([1, 0, 0]);
    fs.writeFileSync(path.join(packPath, "manifest.json"), JSON.stringify(manifest.base, null, 4));

    // Crea los archivos de idioma
    const textsPath = path.join(packPath, "texts");
    fs.mkdirSync(textsPath, { recursive: true });
    fs.writeFileSync(path.join(textsPath, "languages.json"), JSON.stringify(["en_US"], null, 4));
    fs.writeFileSync(
        path.join(textsPath, "en_US.lang"),
        `pack.name=${projectName} ${packLabel}\npack.description=${colorCode}Initialized with PCake`
    );

    // Copia el ícono por defecto del pack
    fs.copyFileSync(
        path.join(__dirname, "../../assets/pack_icon.png"),
        path.join(packPath, "pack_icon.png")
    );

    console.log(`[√] "${projectName} - ${packLabel}" creado!`.green);
}
