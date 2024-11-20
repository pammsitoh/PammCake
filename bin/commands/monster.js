const fs = require("fs-extra");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const uuid = require("uuid");
const os = require("os");
const path = require("path");
const cakeManifest = require("../../lib/src/elements/CakeManifest");
const archiver = require("archiver");
const PackageEntity = require("../../lib/src/packager/PackageEntity");
const AdmZip = require("adm-zip");

exports.command = "monster <monster_file>";
exports.desc = "Create a bunch of files with a monster file";
exports.builder = {};
exports.handler = async function (argv) {
    if (argv.monster_file == undefined || null) return;
    if (!fs.existsSync(path.join(argv.monster_file))) return;

    const readed_monster_data = fs.readFileSync(argv.monster_file).toString();
    const monster_data = JSON.parse(readed_monster_data);

    for (const monty of monster_data.monsters) {
        const _modified = JSON.parse(
            readed_monster_data.replace(/#monstername#/g, monty)
        );

        // Escribir la entidad
        if (_modified.hasOwnProperty("server")) {
            fs.writeFileSync(
                path.join("addon", "BP", "entities", `${monty}.json`),
                JSON.stringify(_modified.server, null, 4)
            );
        }

        // Escribir la entidad cliente
        if (_modified.hasOwnProperty("client")) {
            fs.writeFileSync(
                path.join("addon", "RP", "entity", `${monty}.client.json`),
                JSON.stringify(_modified.client, null, 4)
            );
        }

        // Escribir attachables
        if (_modified.hasOwnProperty("attachable")) {
            fs.writeFileSync(
                path.join(
                    "addon",
                    "RP",
                    "attachables",
                    `${monty}.attachable.json`
                ),
                JSON.stringify(_modified.attachable, null, 4)
            );
        }
    }
};
