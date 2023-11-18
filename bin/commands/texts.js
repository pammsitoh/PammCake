const fs = require("fs");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const uuid = require("uuid");

exports.command = "texts";
exports.desc =
    "Obtiene todos los textos y los escribe en el archivo de traduccion elegido";
exports.builder = {
    lang: {
        type: "string",
        alias: "lang",
        description: "get all language texts",
    },
};
exports.handler = function (argv) {
    let finalText = fs.readFileSync(`./texts/en_US.lang`, { encoding: "utf8" });
    let editingText = "";
    const files = getAllFiles();
    console.log(files);

    for (const file of files) {
        const content = JSON.parse(
            fs.readFileSync(`./entities/${file}`, { encoding: `utf8` })
        );

        editingText =
            editingText +
            `\nentity.${content["minecraft:entity"].description.identifier}.name=${file}`;
        fs.writeFileSync(`./texts/en_US.lang`, finalText.replace("#:pcake/>", editingText));
    }

    function getAllFiles() {
        editingText = editingText + `# [ ENTITIES ] >>>`;

        return fs
            .readdirSync("./entities", { recursive: true })
            .filter((f) => f.includes(".json"));
    }
};
