const { AddonManager } = require("gumaddon");
const uuid = require("uuid");

/** @param {AddonManager} addon */
const addScripts = async (addon) => {
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
            version: "1.11.0",
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
    } catch (error) {
        console.error(`[!] Error al agregar scripts: ${error.message}`.red);
    }
};

module.exports = addScripts;
