const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const archiver = require("archiver");
const { UICompileDir } = require("../../lib/src/compilers/UICompiler");

exports.command = "build <project_name>";
exports.desc = "Construir y empaquetar el addon";
exports.builder = {
    zip: {
        type: "boolean",
        alias: "z",
        description: "Exportar como .zip en lugar de .mcaddon",
    },
    fast: {
        type: "boolean",
        alias: "f",
        description: "Build rápido: exporta directamente desde la carpeta de Minecraft",
    },
};

exports.handler = async function (argv) {
    if (argv.fast) {
        fastBuild(argv);
    } else {
        prodBuild(argv);
    }
};

/**
 * Build de producción: empaqueta ./addon/BP y ./addon/RP en un archivo .mcaddon.
 * Los .pcakeui se compilan a un staging temporal; nunca quedan en el proyecto.
 * Guarda el resultado en ./.build/
 */
const prodBuild = (argv) => {
    if (!fs.existsSync("./pcake.config.json")) {
        console.error("[!] No se encontró pcake.config.json.");
        return;
    }

    if (!fs.existsSync("./.build/")) {
        fs.mkdirSync("./.build/");
    }

    // Staging temporal: copia de RP sin .pcakeui + compilados
    const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), "pcake-build-"));
    const rpStage = path.join(tmpDir, "RP");

    fs.copySync("./addon/RP", rpStage, {
        filter: (src) => !src.endsWith(".pcakeui"),
    });
    UICompileDir("./addon/RP", rpStage);

    const outputPath = `./.build/build.${argv.zip ? "zip" : "mcaddon"}`;
    const folders = [
        ["./addon/BP", "BP"],
        [rpStage,      "RP"],
    ];

    createArchive(outputPath, folders, () => fs.removeSync(tmpDir));
};

/**
 * Build rápido: exporta el addon que ya está instalado en Minecraft.
 * Útil para distribuir rápidamente sin pasar por ./addon.
 */
const fastBuild = (argv) => {
    const minecraftPath = path.join(
        os.homedir(),
        "AppData", "Local", "Packages",
        "Microsoft.MinecraftUWP_8wekyb3d8bbwe",
        "LocalState", "games", "com.mojang"
    );

    const outputPath = `./exported.${argv.zip ? "zip" : "mcaddon"}`;
    const folders = [
        [path.join(minecraftPath, "development_behavior_packs", `${argv.project_name} - BP`), "BP"],
        [path.join(minecraftPath, "development_resource_packs", `${argv.project_name} - RP`), "RP"],
    ];

    createArchive(outputPath, folders);
};

/**
 * Crea un archivo zip/mcaddon con las carpetas indicadas.
 *
 * @param {string} outputPath - Ruta del archivo de salida (ej: "./build/addon.mcaddon")
 * @param {[string, string][]} folders - Array de pares [rutaCarpeta, nombreDentroDelZip]
 */
const createArchive = (outputPath, folders, onClose = undefined) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const output = fs.createWriteStream(outputPath);

    output.on("close", () => {
        console.log("Archivo creado correctamente.");
        if (onClose) onClose();
    });
    archive.on("error", (err) => console.error("Error al crear el archivo:", err));

    archive.pipe(output);

    for (const [folderPath, folderName] of folders) {
        archive.directory(folderPath, folderName);
        console.log(`Carpeta "${folderName}" agregada.`);
    }

    archive.finalize();
};
