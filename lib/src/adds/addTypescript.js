const { exec } = require("child_process");
const fs = require("fs");
const { AddonManager } = require("gumaddon");
const path = require("path");
const { promisify } = require("util");
const uuid = require("uuid");

const execAsync = promisify(exec);

/** @param {AddonManager} addon */
const addTypescript = async (addon) => {
    try {
        const manifestFile = await addon.getBehavior().getManifest();
        const manifest = JSON.parse(manifestFile);

        const newModule = {
            type: "script",
            uuid: uuid.v4(),
            version: [1, 0, 0],
            language: "javascript",
            entry: "scripts/index.js",
        };

        const newDependency = {
            module_name: "@minecraft/server",
            version: "2.4.0",
        };

        manifest.modules.push(newModule);

        if (manifest.hasOwnProperty("dependencies")) {
            manifest.dependencies.push(newDependency);
        } else {
            manifest.dependencies = [newDependency];
        }

        addon.getBehavior().create("scripts/index.js", "//code here...");

        await addon
            .getBehavior()
            .setManifest(JSON.stringify(manifest, null, 4));
        addon.log("Scripts added to the project!!");

        // Typescript specific setup

        const packageJson = fs.readFileSync("./package.json", { encoding: "utf8" });
        const packageData = JSON.parse(packageJson);

        packageData.scripts.save = "tsc && pcake save";
        fs.writeFileSync("./package.json", JSON.stringify(packageData, null, 4), { encoding: "utf8" });

        addon.log("Installing TypeScript...");
        const { stdout, stderr } = await execAsync("npm install --save-dev typescript");

        if(stderr && stderr.trim()) {
            addon.log(`[npm warning]:\n${stderr}`);
        }

        addon.log(stdout);

        // Continuar con el tsconfig...
        const tsConfig = {
            "compilerOptions": {
                "module": "ES2020",
                "target": "ES2021",
                "moduleResolution": "Bundler",
                "allowSyntheticDefaultImports": true,
                "outDir": "./addon/BP",
                "rootDir": ".",
                "strict": true,
                "esModuleInterop": true,
                "skipLibCheck": true,
                "resolveJsonModule": true
            },
            "include": [
                "./scripts/**/*.ts"
            ],
            "exclude": [
                "node_modules",
                "**/*.spec.ts"
            ]
        };

        fs.writeFileSync("./tsconfig.json", JSON.stringify(tsConfig, null, 4), { encoding: "utf8" });

        fs.mkdirSync(path.join(".", "scripts"), { recursive: true });
        fs.writeFileSync(
            path.join(".", "scripts", "index.ts"),
            `// Type your code here...\n`,
            { encoding: "utf8" }
        );

        addon.success(`[✓] TypeScript installed successfully.`.green);

    } catch (error) {
        console.error(`[!] Error al agregar scripts: ${error.message}`.red);
    }
};

module.exports = addTypescript;
