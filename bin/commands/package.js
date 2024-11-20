const fs = require("fs-extra");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const uuid = require("uuid");
const os = require("os");
const path = require("path");
const cakeManifest = require("../../lib/src/elements/CakeManifest");
const archiver = require("archiver");
const PackageEntity = require("../../lib/src/packager/PackageEntity");

exports.command = "package <package_name>";
exports.desc = "Construir proyecto";
exports.builder = {
    zip: {
        type: "boolean",
        alias: "z",
        description: "zip mode",
    },
};
exports.handler = async function (argv) {
    if (argv.package_name == undefined || null) return;
    PackageElement(argv);
};

const PackageElement = (args) => {
    const package_path = path.join(
        "./packages/development/",
        args.package_name
    );
    const package_manifest = JSON.parse(
        fs.readFileSync(path.join(package_path, "manifest.json"))
    );

    if (package_manifest.type === "entity") {
        PackageEntity(package_manifest, args.package_name);
    }
};
