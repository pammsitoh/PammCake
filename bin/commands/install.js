const fs = require("fs-extra");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const uuid = require("uuid");
const os = require('os');
const path = require("path");
const cakeManifest = require("../../lib/src/elements/CakeManifest");
const archiver = require("archiver");
const PackageEntity = require("../../lib/src/packager/PackageEntity");
const AdmZip = require("adm-zip");

exports.command = "install <package_name>";
exports.desc = "Install a pcake package in addon project";
exports.builder = {};
exports.handler = async function (argv) {
    if(argv.package_name == undefined || null) return;
    ImportElement(argv);
};

const ImportElement = (args) => {
    const package_path = path.join('./packages/', args.package_name);

    const packPath = `${package_path}.pcakeg`
    const project = new AdmZip(packPath);
    const manifestFile = project.getEntry("manifest.json");
    const package_manifest = JSON.parse(project.readFile(manifestFile));

    // Ready!

    fs.mkdir(`./addon/BP/entities/${package_manifest.name}[pcake]/`, { recursive: true });
    fs.mkdir(`./addon/RP/entity/${package_manifest.name}[pcake]/`, { recursive: true })

    // Extract Entity Behaviour File...
    const entityFile = project.getEntry("entity.json");
    let entityFileContent = JSON.parse(project.readFile(entityFile).toString('utf-8'));
    entityFileContent['minecraft:entity'].description.identifier = package_manifest.identifier || "NULL";
    fs.writeFileSync(`./addon/BP/entities/${package_manifest.name}[pcake]/root.json`, JSON.stringify(entityFileContent, null, 4), 'utf-8');

    // Extract Entity Client File...
    const entityClientFile = project.getEntry("assets/client.json");
    let entityClientFileContent = JSON.parse(project.readFile(entityClientFile).toString('utf-8'));
    entityClientFileContent['minecraft:client_entity'].description.identifier = package_manifest.identifier || "NULL";
    fs.writeFileSync(`./addon/RP/entity/${package_manifest.name}[pcake]/root_client.json`, JSON.stringify(entityClientFileContent, null, 4), 'utf-8');
}