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
const { CopyGuyCompile } = require("../../lib/src/compilers/CopyGuy");
const { toolConnect } = require("../../lib");
const { execSync, exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

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

    const runTsc = () => {
        if (fs.existsSync("./tsconfig.json")) {
            try {
                console.log(`█▓▒░ Compilando TypeScript...`.yellow);
                execSync("tsc", { stdio: "pipe" });
                console.log(`█▓▒░ TypeScript compilado con éxito.`.green);
                displayMessage();
            } catch (err) {
                console.log(`█▓▒░ Error al compilar TypeScript.`.red);
                
                const errorLog = err.stdout ? err.stdout.toString() : err.message;
                const lines = errorLog.split('\n').filter(l => l.trim() !== '');
                
                toolConnect.sendCommand('tellraw @a {"rawtext":[{"text":"§9█▓▒░ §4[TS ERROR]\n"}]}');
                
                lines.slice(0, 3).forEach(line => {
                    const cleanLine = line.replace(/\\/g, '/').replace(/"/g, "'").trim();
                    toolConnect.sendCommand(`tellraw @a {"rawtext":[{"text":"§6[LOG] §f${cleanLine}"}]}`);
                });

                if (lines.length > 3) {
                    toolConnect.sendCommand(`tellraw @a {"rawtext":[{"text":"§7... y ${lines.length - 3} errores más en la terminal."}]}`);
                }
            }
        }
    };

    let lastCommitSha = null;
    const checkGitHubCommits = async () => {
        if (!fs.existsSync(".git")) return;
        
        try {
            // Intentar obtener la rama actual del remoto
            let branch = "main";
            try {
                const { stdout: head } = await execAsync("git symbolic-ref --short refs/remotes/origin/HEAD");
                branch = head.trim().split("/").pop();
            } catch (e) {
                // Fallback a main si no se puede determinar
            }

            // Hacer fetch asíncrono para no bloquear el proceso
            await execAsync(`git fetch origin ${branch}`);

            // Obtener el último commit del remoto (SHA|Autor|Mensaje)
            const { stdout: log } = await execAsync(`git log origin/${branch} -1 --format="%H|%an|%s"`);
            const logTrimmed = log.trim();
            
            if (logTrimmed) {
                const [sha, author, message] = logTrimmed.split("|");

                if (lastCommitSha && lastCommitSha !== sha) {
                    const msg = `§d█▓▒░ [Git] Nuevo commit por §e@${author}§d:\n :heart: §7${message}`;
                    console.log(`█▓▒░ [Git]: Nuevo commit por ${author}: ${message}`.cyan);
                    toolConnect.sendCommand(`tellraw @a {"rawtext":[{"text":"${msg}"}]}`);
                }
                lastCommitSha = sha;
            }

        } catch (err) {
            // Silently fail if git commands fail
        }
    };
    
    toolConnect.startWSServer(8080);
    toolConnect.on('connection', () => {
        toolConnect.subscribe('PlayerMessage')
        toolConnect.sendCommand('tellraw @a {"rawtext":[{"text":"§a█▓▒░ :crafting_table: PCake Conectado..."}]}')
    })

    const displayMessage = () => {
        console.clear();
        console.log(
            `█▓▒░ Carpeta sincronizada...`.magenta
        );
        console.log(
            `█▓▒░ Puedes usar "connect localhost:8080" para tener herramientas de desarrollo.`.magenta
        );

        toolConnect.sendCommand('tellraw @a {"rawtext":[{"text":"§8░ Reload ░"}]}')
        toolConnect.sendCommand('reload');
    }
    
    const config = JSON.parse(pcake_file);
    if (!fs.existsSync("./addon/BP") || !fs.existsSync("./addon/RP")) {
        console.log(
            `[!] Asegurate de que tanto la carpeta "BP" y "RP" existan en tu proyecto.`
                .red
        );
        return;
    }

    const rutaDirectorioPrincipal = os.homedir();
    const rutaCarpetaUsuario = path.join(rutaDirectorioPrincipal, 'AppData', 'Roaming', 'Minecraft Bedrock', 'Users', 'Shared', 'games', 'com.mojang');

    const bp_path = "./addon/BP";
    const rp_path = "./addon/RP";
    const ts_path = "./scripts";

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
            displayMessage();
        } catch (err) {
            // console.error(
            //     `[!] Error al sincronizar carpetas: ${err.message}`.red
            // );
        }
    };

    // Compilación inicial si existe TypeScript
    runTsc();

    // Verificación inicial de Git y luego cada 5 minutos (más seguro y eficiente)
    checkGitHubCommits();
    setInterval(checkGitHubCommits, 1000 * 60 * 5);

    // Vigilar cambios en BP
    const bpWatcher = chokidar.watch(bp_path, { persistent: true });
    bpWatcher
        .on("add", (path) => syncFolders(bp_path, editing_bp_path))
        .on("change", (epath) => {
            syncFolders(bp_path, editing_bp_path)
            const stat = fs.statSync(epath, {});
            if(stat.isFile()) {
                const ext = path.extname(epath);

                switch (ext) {
                    case ".pcakemenu":
                        MenuCompiler();
                        break;

                    case ".pcakecopyguy":
                        CopyGuyCompile(epath);
                        break;
                
                    default:
                        break;
                }
            }
        })
        .on("unlink", (path) => syncFolders(bp_path, editing_bp_path));

    // Vigilar cambios en RP
    const rpWatcher = chokidar.watch(rp_path, { persistent: true });
    rpWatcher
        .on("add", (path) => syncFolders(rp_path, editing_rp_path))
        .on("change", (path) => syncFolders(rp_path, editing_rp_path))
        .on("unlink", (path) => syncFolders(rp_path, editing_rp_path));

    // Vigilar cambios en TypeScript si existe
    if (fs.existsSync("./tsconfig.json")) {
        const tsWatcher = chokidar.watch(ts_path, { persistent: true });
        tsWatcher.on("change", (path) => {
            if (path.endsWith(".ts")) {
                runTsc();
            }
        });
        console.log("█▓▒░ Vigilando cambios en TypeScript...");
    }

    console.log("█▓▒░ Vigilando cambios en las carpetas BP y RP...");
};
