const fs = require("fs");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const uuid = require("uuid");

exports.command = "aclink <controller> <entity>";
exports.desc = "Enlaza un animation_controller con una entidad";
exports.builder = {};
exports.handler = function (argv) {
    const files = getAllFiles();
    console.log(files);

    for (const file of files) {
        const content = JSON.parse(
            fs.readFileSync(`./entities/${file}`, { encoding: `utf8` })
        );

        if (content["minecraft:entity"].description.identifier == argv.entity) {
            content["minecraft:entity"].description.animations = {}
                content["minecraft:entity"].description.animations || {};
            content["minecraft:entity"].description.scripts =
                content["minecraft:entity"].description.scripts || {};
            content["minecraft:entity"].description.scripts.animate =
                content["minecraft:entity"].description.scripts.animate || [];

            content["minecraft:entity"].description.animations[
                `#:pcake/>${argv.controller}`
            ] = argv.controller;
            if (
                !content["minecraft:entity"].description.scripts.animate.some(
                    (a) => a == `#:pcake/>${argv.controller}`
                )
            ) {
                content["minecraft:entity"].description.scripts.animate.push(
                    `#:pcake/>${argv.controller}`
                );
            }

            fs.writeFileSync(
                `./entities/${file}`,
                JSON.stringify(content, null, 4)
            );
        }
    }

    function getAllFiles() {
        return fs
            .readdirSync("./entities", { recursive: true })
            .filter((f) => f.includes(".json"));
    }
};
