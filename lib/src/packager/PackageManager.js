class PackageManager {
    constructor( project, manifest) {
        this.manifest = manifest;
        this.project = project;
    }

    /**
     * @description Install a package of type "Entity"
     */
    EntityInstaller() {
        const project = this.project;
        const package_manifest = this.manifest;

        // Ready
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
}