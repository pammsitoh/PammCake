const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const { AddonManager } = require("gumaddon");
require("colors");
const addScripts = require("./addScripts");

const execAsync = promisify(exec);

/**
 * Configura TypeScript en el proyecto:
 * 1. Agrega el módulo de scripting al manifest (reutilizando addScripts)
 * 2. Instala TypeScript como devDependency
 * 3. Genera tsconfig.json
 * 4. Crea scripts/index.ts como punto de entrada
 *
 * @param {AddonManager} addon
 */
const addTypescript = async (addon) => {
    try {
        // Reutiliza addScripts para configurar el manifest y crear scripts/index.js
        await addScripts(addon);

        // Agrega el script "save" al package.json del proyecto
        const packageData = JSON.parse(fs.readFileSync("./package.json", "utf8"));
        packageData.scripts.save = "pcake save";
        fs.writeFileSync("./package.json", JSON.stringify(packageData, null, 4), "utf8");

        // Instala TypeScript como dependencia de desarrollo
        addon.log("Installing TypeScript...");
        const { stdout, stderr } = await execAsync("npm install --save-dev typescript");
        if (stderr && stderr.trim()) addon.log(`[npm warning]:\n${stderr}`);
        addon.log(stdout);

        // Crea el tsconfig.json
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
            include: ["./scripts/**/*.ts"],
            exclude: ["node_modules", "**/*.spec.ts"],
        };
        fs.writeFileSync("./tsconfig.json", JSON.stringify(tsConfig, null, 4), "utf8");

        // Crea el archivo de entrada TypeScript
        fs.mkdirSync(path.join(".", "scripts"), { recursive: true });
        fs.writeFileSync(path.join(".", "scripts", "index.ts"), "// Type your code here...\n", "utf8");

        addon.success("[✓] TypeScript installed successfully.".green);
    } catch (error) {
        console.error(`[!] Error al agregar TypeScript: ${error.message}`.red);
    }
};

module.exports = addTypescript;
