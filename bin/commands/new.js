const fs = require("fs");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const path = require("path");
const { Success } = require("../../lib/src/lib/Loggers");
const cakeEntity = require("../../lib/src/elements/CakeEntity");
const cakeAnimationController = require("../../lib/src/elements/CakeAnimationController");

exports.command = "new <name>";
exports.desc = "Crear un nuevo archivo";
exports.builder = {
    type: {
        type: "String",
        alias: "t",
        description: "Tipo de archivo",
    },
    identifier: {
        type: "String",
        alias: "i",
        description: "Identifier",
    },
};
exports.handler = function (argv) {
    if (argv.type === "entity") {
        fs.mkdir("./entities", () => {
            let file = new cakeEntity();
            if (argv.identifier != null || undefined) {
                file.base["minecraft:entity"].description.identifier =
                    argv.identifier;
            } else {
                file.base[
                    "minecraft:entity"
                ].description.identifier = `pcake:${argv.name}`;
            }
            fs.writeFileSync(
                "./entities/" + argv.name + ".json",
                JSON.stringify(file.base, null, 4)
            );
            Success(`Entidad "${file.base["minecraft:entity"].description.identifier}" fue creada`)
        });
    }else if (argv.type === "function") {
        fs.mkdir(
            path.dirname("./functions/" + argv.name + ".mcfunction"),
            { recursive: true },
            () => {
                fs.writeFileSync(
                    "./functions/" + argv.name + ".mcfunction",
                    ""
                );
                Success(`Function "${argv.name}" fue creada!`);
            }
        );
    }else if(argv.type === "animation_controller" || "ac") {

        let ac = new cakeAnimationController( argv.name );

        fs.mkdir(
            path.dirname("./animation_controllers/" + argv.name + ".json"),
            { recursive: true },
            () => {
                fs.writeFileSync(
                    "./animation_controllers/" + argv.name + ".json",
                    JSON.stringify(ac.base, null, 4)
                );
                Success(`Animation Controller "${argv.name}" Creado!`);
            }
        );
    }else return;
};
