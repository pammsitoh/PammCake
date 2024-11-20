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

exports.command = "install <package_name>";
exports.desc = "Install a pcake package in addon project";
exports.builder = {};
exports.handler = async function (argv) {
    if (argv.package_name == undefined || null) return;
    ImportElement(argv);
};

const ImportElement = (args) => {
    const package_path = path.join("./packages/", args.package_name);

    const packPath = `${package_path}.pcakeg`;
    const project = new AdmZip(packPath);
    const manifestFile = project.getEntry("manifest.json");
    const package_manifest = JSON.parse(project.readFile(manifestFile));
    const manager = new PackageManager();

    // Ready!!...

    if (package_manifest.type == "entity") {
        manager.EntityInstaller();
    }
};
