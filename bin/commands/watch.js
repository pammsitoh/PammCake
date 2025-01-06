const fs = require("fs");
const chokidar = require("chokidar");
const fse = require("fs-extra");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const uuid = require("uuid");
const os = require("os");
const path = require("path");
const cakeManifest = require("../../lib/src/elements/CakeManifest");
const { MenuCompiler } = require("../../lib/src/compilers/MenuCompilers");

exports.command = "watch";
exports.desc = "Vigilar Cambios";
exports.builder = {
    resource: {
        type: "boolean",
        alias: "r",
        description: "package type",
    },
};
exports.handler = async function (argv) {
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

    const rutaDirectorioPrincipal = os.homedir();
    const rutaCarpetaUsuario = path.join(
        rutaDirectorioPrincipal,
        "AppData",
        "Local",
        "Packages",
        "Microsoft.MinecraftUWP_8wekyb3d8bbwe",
        "LocalState",
        "games",
        "com.mojang"
    );

    const bp_path = "./addon/BP";
    const rp_path = "./addon/RP";

    const editing_bp_path = path.join(
        rutaCarpetaUsuario,
        "development_behavior_packs",
        `${config.name}[${config.identifier}] - BP`
    );
    const editing_rp_path = path.join(
        rutaCarpetaUsuario,
        "development_resource_packs",
        `${config.name}[${config.identifier}] - RP`
    );

    // Función para sincronizar carpetas
    const syncFolders = async (source, target) => {
        try {
            await fse.emptyDir(target);
            await fse.copy(source, target);
            console.log(
                `█+█ Carpeta ${source} sincronizada con ${target}`.green
            );
        } catch (err) {
            // console.error(
            //     `[!] Error al sincronizar carpetas: ${err.message}`.red
            // );
        }
    };

    // Vigilar cambios en BP
    const bpWatcher = chokidar.watch(bp_path, { persistent: true });
    bpWatcher
        .on("add", (path) => syncFolders(bp_path, editing_bp_path))
        .on("change", (epath) => {
            syncFolders(bp_path, editing_bp_path)
            const stat = fs.statSync(epath, {});
            if(stat.isFile()) {
                const ext = path.extname(epath);
                if(ext != ".pcake") return;
                MenuCompiler()
            }
        })
        .on("unlink", (path) => syncFolders(bp_path, editing_bp_path));

    // Vigilar cambios en RP
    const rpWatcher = chokidar.watch(rp_path, { persistent: true });
    rpWatcher
        .on("add", (path) => syncFolders(rp_path, editing_rp_path))
        .on("change", (path) => syncFolders(rp_path, editing_rp_path))
        .on("unlink", (path) => syncFolders(rp_path, editing_rp_path));

    console.log("Vigilando cambios en las carpetas BP y RP...");
};
