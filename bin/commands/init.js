const fs       = require("fs");
const fse      = require("fs-extra");
const path     = require("path");
const rl_mod   = require("readline");
const { exec } = require("child_process");
const { promisify } = require("util");
const { v4: uuidv4 } = require("uuid");
require("colors");
const CakeManifest = require("../../lib/src/elements/CakeManifest");

const execAsync = promisify(exec);

// ─── Spinner ──────────────────────────────────────────────────────────────────

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

class Spinner {
    constructor(text) {
        this._text  = text;
        this._idx   = 0;
        this._timer = null;
    }

    start(text) {
        if (text) this._text = text;
        process.stdout.write("\n");
        this._timer = setInterval(() => this._tick(), 80);
        this._tick();
        return this;
    }

    update(text) {
        this._text = text;
    }

    succeed(text) {
        this._clear();
        process.stdout.write(`  ${"✓".green}  ${(text || this._text).white}\n`);
    }

    fail(text) {
        this._clear();
        process.stdout.write(`  ${"✗".red}  ${(text || this._text).white}\n`);
    }

    _tick() {
        const frame = FRAMES[this._idx++ % FRAMES.length];
        rl_mod.clearLine(process.stdout, 0);
        rl_mod.cursorTo(process.stdout, 0);
        process.stdout.write(`  ${frame.cyan}  ${this._text.gray}`);
    }

    _clear() {
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
        rl_mod.clearLine(process.stdout, 0);
        rl_mod.cursorTo(process.stdout, 0);
    }
}

// ─── Prompt helpers ───────────────────────────────────────────────────────────

function makeRL() {
    return rl_mod.createInterface({ input: process.stdin, output: process.stdout });
}

/**
 * Pregunta de texto libre.
 * Muestra:
 *   ◆  Label  · hint
 *   ›  (default)
 */
function ask(rl, label, hint, defaultValue) {
    const hintPart = hint ? `  ${"·".gray} ${hint.gray}` : "";
    const defPart  = defaultValue ? `${"(".gray}${defaultValue.gray}${")".gray}  ` : "";
    console.log(`\n  ${"◆".cyan}  ${label.bold}${hintPart}`);
    return new Promise(resolve =>
        rl.question(`  ${"›".cyan}  ${defPart}`, answer => {
            resolve(answer.trim() || defaultValue || "");
        })
    );
}

/**
 * Selección numérica.
 * Muestra las opciones con ● para la predeterminada y ○ para el resto.
 */
async function select(rl, label, options, defaultIndex = 0) {
    console.log(`\n  ${"◆".cyan}  ${label.bold}`);
    console.log(`  ${"·".gray}  ${"type a number and press Enter".gray}\n`);
    options.forEach((opt, i) => {
        const isDefault = i === defaultIndex;
        const num    = String(i + 1).gray;
        const bullet = isDefault ? "●".cyan : "○".gray;
        const label2 = isDefault ? opt.white : opt.gray;
        console.log(`     ${num}  ${bullet}  ${label2}`);
    });
    console.log("");
    const raw = await new Promise(resolve =>
        rl.question(`  ${"›".cyan}  `, a => resolve(a.trim()))
    );
    const idx = parseInt(raw, 10) - 1;
    return idx >= 0 && idx < options.length ? idx : defaultIndex;
}

/**
 * Confirmación Yes/No.
 */
async function confirm(rl, label, defaultYes = true) {
    const hint = (defaultYes ? "Y/n" : "y/N").gray;
    console.log(`\n  ${"◆".cyan}  ${label.bold}  ${hint}`);
    const raw = await new Promise(resolve =>
        rl.question(`  ${"›".cyan}  `, a => resolve(a.trim().toLowerCase()))
    );
    return raw ? raw.startsWith("y") : defaultYes;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

exports.command = "init [project_name]";
exports.desc    = "Inicializar un nuevo proyecto de addon.";
exports.builder = {};

exports.handler = async function (argv) {

    // ── Banner ────────────────────────────────────────────────────────────────
    console.log("");
    console.log("  ╭────────────────────────────────────────────╮".magenta);
    console.log("  │                                            │".magenta);
    console.log("  │    ◈  PCake  ·  Minecraft Bedrock Addon   │".magenta);
    console.log("  │                                            │".magenta);
    console.log("  ╰────────────────────────────────────────────╯".magenta);

    const rl = makeRL();
    let projectName, identifier, scriptChoice, installDeps;

    try {

        // 1 ─ Project name
        projectName = argv.project_name
            || await ask(rl, "Project name", null, null);

        if (!projectName) {
            console.log(`\n  ${"✗".red}  A project name is required.\n`);
            rl.close();
            return;
        }

        // 2 ─ Identifier
        const defaultId = projectName.toLowerCase().replace(/\s+/g, "_");
        identifier = await ask(
            rl,
            "Identifier",
            "namespace used in your content IDs",
            defaultId
        );

        // 3 ─ Scripting
        scriptChoice = await select(rl, "Scripting support", [
            "None  —  just BP & RP packs",
            "JavaScript",
            "TypeScript  " + "(recommended)".gray,
        ], 0);

        // 4 ─ Install deps
        installDeps = await confirm(rl, "Install dependencies now?", true);

    } catch (err) {
        rl.close();
        throw err;
    }

    rl.close();

    // ── Summary ───────────────────────────────────────────────────────────────
    const SCRIPT_LABELS = ["None", "JavaScript", "TypeScript"];
    console.log(`\n  ${"─".repeat(46).gray}`);
    console.log(`  ${"project".gray.padEnd(12)} ${projectName.white}`);
    console.log(`  ${"namespace".gray.padEnd(12)} ${identifier.white}`);
    console.log(`  ${"scripting".gray.padEnd(12)} ${SCRIPT_LABELS[scriptChoice].white}`);
    console.log(`  ${"deps".gray.padEnd(12)} ${(installDeps ? "yes" : "no").white}`);
    console.log(`  ${"─".repeat(46).gray}`);

    // ── Create ────────────────────────────────────────────────────────────────
    try {

        // Base files
        const spinBase = new Spinner("Copying base files...").start();
        await fse.copy(path.join(__dirname, "../../assets/example_project"), "./");
        fs.writeFileSync(
            "./pcake.config.json",
            JSON.stringify({ name: projectName, identifier }, null, 4)
        );
        spinBase.succeed("Base files ready");

        // Packs
        const spinPacks = new Spinner("Creating BP & RP packs...").start();
        createPack(path.join("addon", "BP"), projectName, "data",      "Behaviors", "§b");
        createPack(path.join("addon", "RP"), projectName, "resources", "Resources", "§d");
        spinPacks.succeed("Behavior & Resource packs created");

        // JavaScript
        if (scriptChoice === 1) {
            const spinJS = new Spinner("Configuring JavaScript scripting...").start();
            addScriptModule(path.join("addon", "BP", "manifest.json"));
            fs.mkdirSync(path.join("addon", "BP", "scripts"), { recursive: true });
            fs.writeFileSync(
                path.join("addon", "BP", "scripts", "index.js"),
                "// your code here...\n",
                "utf8"
            );
            spinJS.succeed("JavaScript scripting ready");
        }

        // TypeScript
        if (scriptChoice === 2) {
            const spinTS = new Spinner("Configuring TypeScript...").start();

            addScriptModule(path.join("addon", "BP", "manifest.json"));

            const tsConfig = {
                compilerOptions: {
                    module: "ES2020",
                    target: "ES2021",
                    moduleResolution: "Bundler",
                    allowSyntheticDefaultImports: true,
                    outDir: "./addon/BP",
                    rootDir: ".",
                    strict: true,
                    esModuleInterop: true,
                    skipLibCheck: true,
                    resolveJsonModule: true,
                },
                include:  ["./scripts/**/*.ts"],
                exclude:  ["node_modules", "**/*.spec.ts"],
            };

            fs.writeFileSync("./tsconfig.json", JSON.stringify(tsConfig, null, 4), "utf8");
            fs.mkdirSync("./scripts", { recursive: true });
            fs.writeFileSync("./scripts/index.ts", "// your code here...\n", "utf8");

            const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));
            pkg.scripts        = pkg.scripts || {};
            pkg.scripts.build  = "tsc && pcake build addon";
            fs.writeFileSync("./package.json", JSON.stringify(pkg, null, 4), "utf8");

            spinTS.succeed("TypeScript configured");
        }

        // Dependencies
        if (installDeps) {
            const spinDeps = new Spinner("Installing dependencies...").start();

            await execAsync("npm install @minecraft/server");
            if (scriptChoice === 2) {
                await execAsync("npm install --save-dev typescript");
            }

            spinDeps.succeed("Dependencies installed");
        }

        // ── Done ──────────────────────────────────────────────────────────────
        console.log(`\n  ${"─".repeat(46).gray}\n`);
        console.log(`  ${"◈  Done!  Your project is ready.".green.bold}\n`);
        console.log(`  ${"Next steps:".bold}`);
        if (!installDeps) console.log(`  ${"·  npm install".cyan}`);
        console.log(`  ${"·  pcake watch".cyan.padEnd(25)} ${"start developing".gray}`);
        console.log(`  ${"·  pcake save".cyan.padEnd(25)} ${"copy addon to Minecraft".gray}`);
        console.log("");

    } catch (err) {
        console.error(`\n  ${"✗".red}  ${err.message.red}\n`);
    }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Inserta el módulo de scripting y la dependencia @minecraft/server
 * directamente en el manifest.json del BP.
 * @param {string} manifestPath
 */
function addScriptModule(manifestPath) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    manifest.modules.push({
        type: "script",
        uuid: uuidv4(),
        version: [1, 0, 0],
        language: "javascript",
        entry: "scripts/index.js",
    });

    if (!manifest.dependencies) manifest.dependencies = [];
    manifest.dependencies.push({
        module_name: "@minecraft/server",
        version: "2.4.0",
    });

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4), "utf8");
}

/**
 * Crea una carpeta de pack (BP o RP) con manifest.json,
 * archivos de idioma e ícono.
 *
 * @param {string} packPath
 * @param {string} projectName
 * @param {"data"|"resources"} moduleType
 * @param {string} packLabel
 * @param {string} colorCode
 */
function createPack(packPath, projectName, moduleType, packLabel, colorCode) {
    fs.mkdirSync(packPath, { recursive: true });

    if (fs.existsSync(path.join(packPath, "manifest.json"))) {
        return; // ya existe, el spinner padre reportará
    }

    const manifest = new CakeManifest();
    manifest.base.modules[0].type = moduleType;
    manifest.setVersion([1, 0, 0]);
    fs.writeFileSync(
        path.join(packPath, "manifest.json"),
        JSON.stringify(manifest.base, null, 4)
    );

    const textsPath = path.join(packPath, "texts");
    fs.mkdirSync(textsPath, { recursive: true });
    fs.writeFileSync(
        path.join(textsPath, "languages.json"),
        JSON.stringify(["en_US"], null, 4)
    );
    fs.writeFileSync(
        path.join(textsPath, "en_US.lang"),
        `pack.name=${projectName} ${packLabel}\npack.description=${colorCode}Initialized with PCake`
    );

    fs.copyFileSync(
        path.join(__dirname, "../../assets/pack_icon.png"),
        path.join(packPath, "pack_icon.png")
    );
}
