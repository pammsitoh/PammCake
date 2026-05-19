const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const chokidar = require("chokidar");
const { execSync, exec } = require("child_process");
const { promisify } = require("util");
require("colors");

const { MenuCompiler } = require("../../lib/src/compilers/MenuCompilers");
const { CopyGuyCompile } = require("../../lib/src/compilers/CopyGuy");
const { UICompileDir } = require("../../lib/src/compilers/UICompiler");
const { toolConnect } = require("../../lib");
const { getMinecraftPath } = require("../../lib/src/utils/minecraft");
const { readConfig, addonFoldersExist } = require("../../lib/src/utils/config");

const execAsync = promisify(exec);

exports.command = "watch";
exports.desc = "Vigilar cambios y sincronizar con Minecraft automáticamente";
exports.builder = {};

exports.handler = async function (argv) {
    if (!addonFoldersExist()) {
        console.log(`[!] Asegúrate de que existan las carpetas "addon/BP" y "addon/RP".`.red);
        return;
    }

    const config = readConfig();
    const minecraftPath = getMinecraftPath();
    const packName = `${config.name}[${config.identifier}]`;
    const hasTs = fs.existsSync("./tsconfig.json");

    const BP_SRC = "./addon/BP";
    const RP_SRC = "./addon/RP";
    const TS_SRC = "./scripts";
    const BP_DEST = path.join(minecraftPath, "development_behavior_packs", `${packName} - BP`);
    const RP_DEST = path.join(minecraftPath, "development_resource_packs", `${packName} - RP`);

    // Helper de log con el prefijo de PCake
    const log = (message) => console.log(`${"█▓▒░".magenta} ${message}`);

    // --- WebSocket con Minecraft ---

    toolConnect.startWSServer(8080);
    toolConnect.on("connection", () => {
        toolConnect.subscribe("PlayerMessage");
        toolConnect.sendCommand('tellraw @a {"rawtext":[{"text":"§a█▓▒░ PCake Conectado..."}]}');
    });

    // --- TypeScript ---

    /**
     * Compila TypeScript con `tsc` (bloqueante).
     * Retorna true si tuvo éxito, false si hubo errores.
     *
     * Flujo con el watcher de BP:
     *   - Si la compilación es exitosa → tsc escribe nuevos .js en addon/BP/scripts/
     *     → el watcher de BP los detecta → sincroniza automáticamente.
     *   - Si falla → no se escriben nuevos archivos → no hay sync
     *     → Minecraft conserva el último código que funcionaba.
     */
    const compileTsIfNeeded = () => {
        if (!hasTs) return true;

        try {
            execSync("tsc", { stdio: "pipe" });
            log("TypeScript compilado con éxito.".green);
            return true;
        } catch (err) {
            const lines = (err.stdout ? err.stdout.toString() : err.message)
                .split("\n")
                .filter((l) => l.trim());

            log("Error de TypeScript:".red);
            lines.slice(0, 5).forEach((l) => console.log(`  ${l}`.yellow));
            if (lines.length > 5) console.log(`  ...y ${lines.length - 5} errores más`.gray);

            toolConnect.sendCommand('tellraw @a {"rawtext":[{"text":"§4[TS ERROR] Revisa la terminal."}]}');
            lines.slice(0, 3).forEach((line) => {
                const clean = line.replace(/\\/g, "/").replace(/"/g, "'").trim();
                toolConnect.sendCommand(`tellraw @a {"rawtext":[{"text":"§6${clean}"}]}`);
            });

            return false;
        }
    };

    // --- Sincronización ---

    /**
     * Sincroniza una carpeta de origen a destino y envía reload a Minecraft.
     *
     * @param {string} source        - Carpeta origen (ej: "./addon/BP")
     * @param {string} target        - Carpeta destino en Minecraft
     * @param {string} label         - Nombre para el log ("BP" o "RP")
     * @param {string} reloadCommand - Comando de reload a enviar ("reload" o "reload all")
     */
    const syncFolders = async (source, target, label, reloadCommand = "reload all", filter = undefined) => {
        try {
            const opts = { overwrite: true };
            if (filter) opts.filter = filter;
            await fse.copy(source, target, opts);

            const time = new Date().toLocaleTimeString();
            log(`[${time}] ${label} sincronizado.`.green);

            toolConnect.sendCommand('tellraw @a {"rawtext":[{"text":"§8░ Reload ░"}]}');
            toolConnect.sendCommand(reloadCommand);
        } catch (err) {
            log(`Error al sincronizar ${label}: ${err.message}`.red);
        }
    };

    // Devuelve el comando de reload según si el archivo está en BP/scripts/ o no.
    const getBPReloadCommand = (changedFile) => {
        const rel = path.relative(path.join(BP_SRC, "scripts"), changedFile);
        const isInScripts = !rel.startsWith("..") && !path.isAbsolute(rel);
        return isInScripts ? "reload" : "reload all";
    };

    // --- Git commits remotos ---

    let lastCommitSha = null;

    const checkGitCommits = async () => {
        if (!fs.existsSync(".git")) return;

        try {
            let branch = "main";
            try {
                const { stdout } = await execAsync("git symbolic-ref --short refs/remotes/origin/HEAD");
                branch = stdout.trim().split("/").pop();
            } catch { /* sin remoto configurado → usamos "main" */ }

            await execAsync(`git fetch origin ${branch}`);

            const { stdout: logOut } = await execAsync(`git log origin/${branch} -1 --format="%H|%an|%s"`);
            const trimmed = logOut.trim();
            if (!trimmed) return;

            const [sha, author, message] = trimmed.split("|");

            if (lastCommitSha && lastCommitSha !== sha) {
                log(`[Git] Nuevo commit de ${author}: ${message}`.cyan);
                toolConnect.sendCommand(
                    `tellraw @a {"rawtext":[{"text":"§d[Git] §e@${author}§d: §7${message}"}]}`
                );
            }

            lastCommitSha = sha;
        } catch { /* sin conexión o sin git, ignorar */ }
    };

    // --- Inicio ---

    // Compilación y sync inicial (antes de empezar a vigilar cambios).
    // Nota: el sync de startup copia los archivos SIN enviar "reload" a Minecraft,
    // porque en este momento el jugador puede estar en el mundo con scripts activos.
    // El "reload" solo se envía cuando el desarrollador guarda un archivo (watcher).
    const nopcakeui = (src) => !src.endsWith(".pcakeui");

    const startupSync = async (source, target, label, filter = undefined) => {
        try {
            await fse.emptyDir(target);
            const opts = {};
            if (filter) opts.filter = filter;
            await fse.copy(source, target, opts);
            log(`[startup] ${label} listo.`.gray);
        } catch (err) {
            log(`Error en sync inicial de ${label}: ${err.message}`.red);
        }
    };

    compileTsIfNeeded();
    await startupSync(BP_SRC, BP_DEST, "BP");
    await startupSync(RP_SRC, RP_DEST, "RP", nopcakeui);
    const uiCount = UICompileDir(RP_SRC, RP_DEST);
    if (uiCount > 0) log(`UICompiler: ${uiCount} archivo(s) .pcakeui compilado(s).`.gray);

    checkGitCommits();
    setInterval(checkGitCommits, 5 * 60 * 1000); // revisar git cada 5 minutos

    // --- Watchers ---

    // ignoreInitial: true → no dispara eventos para los archivos ya existentes al arrancar.
    // Sin esto, cada archivo en addon/BP y addon/RP dispararía un "add" al iniciar.

    // Watcher de BP
    chokidar
        .watch(BP_SRC, { persistent: true, ignoreInitial: true })
        .on("add",    (f) => syncFolders(BP_SRC, BP_DEST, "BP", getBPReloadCommand(f)))
        .on("change", (f) => {
            // Ejecutar compiladores especiales según la extensión
            const ext = path.extname(f);
            if (ext === ".pcakemenu")     MenuCompiler();
            if (ext === ".pcakecopyguy")  CopyGuyCompile(f);

            syncFolders(BP_SRC, BP_DEST, "BP", getBPReloadCommand(f));
        })
        .on("unlink", (f) => syncFolders(BP_SRC, BP_DEST, "BP", getBPReloadCommand(f)));

    // Recompila todos los .pcakeui del RP y regenera screen files + _ui_defs.json
    const recompileUI = () => {
        const n = UICompileDir(RP_SRC, RP_DEST);
        if (n > 0) log(`UICompiler: ${n} archivo(s) .pcakeui compilado(s).`.cyan);
    };

    // Watcher de RP
    chokidar
        .watch(RP_SRC, { persistent: true, ignoreInitial: true })
        .on("add",    (f) => {
            if (f.endsWith(".pcakeui")) recompileUI();
            else syncFolders(RP_SRC, RP_DEST, "RP", "reload all", nopcakeui);
        })
        .on("change", (f) => {
            if (f.endsWith(".pcakeui")) recompileUI();
            else syncFolders(RP_SRC, RP_DEST, "RP", "reload all", nopcakeui);
        })
        .on("unlink", (f) => {
            if (f.endsWith(".pcakeui")) recompileUI();
            else syncFolders(RP_SRC, RP_DEST, "RP", "reload all", nopcakeui);
        });

    // Watcher de TypeScript
    // Solo compila — el watcher de BP se encarga del sync cuando detecta los .js generados.
    if (hasTs) {
        chokidar
            .watch(TS_SRC, { persistent: true, ignoreInitial: true })
            .on("change", (changedFile) => {
                if (changedFile.endsWith(".ts")) compileTsIfNeeded();
            });
    }

    // Banner de inicio
    console.log("");
    log("PammCake Watch iniciado".bold);
    log(`Pack:      ${packName}`.gray);
    log(`BP:        ${BP_SRC}  →  ${BP_DEST}`.gray);
    log(`RP:        ${RP_SRC}  →  ${RP_DEST}`.gray);
    if (hasTs) log(`TypeScript: activo (${TS_SRC})`.gray);
    log(`UICompiler: activo (*.pcakeui → *.json en RP/ui/)`.gray);
    log(`WebSocket:  ws://localhost:8080  (usa /connect localhost:8080 en Minecraft)`.gray);
    console.log("");
};
