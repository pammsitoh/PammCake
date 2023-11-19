const fs = require("fs");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const uuid = require("uuid");
const path = require("path");
const cakeManifest = require("../../lib/src/elements/CakeManifest");

exports.command = "init <name>";
exports.desc = "Crear nuevo proyecto";
exports.builder = {
    description: {
        type: "String",
        alias: "d",
        description: "the addon description",
    },
    version: {
        type: "String",
        alias: "v",
        description: "the addon version",
    },
    resource: {
        type: "boolean",
        alias: "r",
        description: "package type",
    },
};
exports.handler = function (argv) {
    let file = new cakeManifest();
    file.base.modules[0].type = argv.resource ? "resources" : "data";
    file.setVersion(argv.version != null || undefined ? argv.version.split(".").map((e) => parseInt(e)) : [1, 0, 0]);

    if (!fs.existsSync("manifest.json")) {
        fs.writeFileSync("manifest.json", JSON.stringify(file.base, null, 4));
        createLang();
        console.log(`[√] Proyecto "${argv.name}" Creado!`.green);
        return;
    }

    console.log(`<!> Ya existe un proyecto en esta ubicacion...`.red);

    function createLang() {
        fs.mkdir("./texts", () => {
            const base = `pack.name=${argv.name} ${
                argv.resource ? "Resources" : "Behaviors"
            }\npack.description=§dInitialized with PCake \n\n#:pcake/>`;

            fs.writeFileSync(
                "./texts/languages.json",
                JSON.stringify(["en_US"], null, 4)
            );
            fs.writeFileSync("./texts/en_US.lang", base);
            fs.copyFileSync(
                path.join(__dirname, "../../", "assets", "pack_icon.png"),
                "./pack_icon.png"
            );
        });
    }
};
