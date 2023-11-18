const fs = require("fs");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const path = require("path");
const { Success } = require("../../lib/src/lib/Loggers");
const cakeEntity = require("../../lib/src/elements/CakeEntity");

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
                console.log(`Function "${argv.name}" fue creada!`.yellow);
            }
        );
    }else if(argv.type === "animation_controller" || argv.type === "ac") {

        let ac = skeletons.ac;
        ac.animation_controllers[`controller.animation.${argv.name}`] = {
            "initial_state": "default",
            "states": {
                "default": {
                    "transitions": [
                        {
                            "state_1": "query.is_baby"
                        }
                    ]
                },
                "state_1": {}
            }
        }

        fs.mkdir(
            path.dirname("./animation_controllers/" + argv.name + ".json"),
            { recursive: true },
            () => {
                fs.writeFileSync(
                    "./animation_controllers/" + argv.name + ".json",
                    JSON.stringify(ac, null, 4)
                );
                console.log(`Animation Controller "${argv.name}" Creado!`.yellow);
            }
        );
    }else return;
};
