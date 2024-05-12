const fs = require("fs-extra");
const archiver = require("archiver");
const logger = require("../lib/Loggers");

const PackageEntity = ( manifest, package_name ) => {
    const resultPath = `./packages/${manifest.name}.pcakeg`
    const zipFile = archiver('zip', {
        zlib: { level: 9 }
    });

    const packageOutput = fs.createWriteStream(resultPath);

    // Maneja eventos de finalización y errores
    packageOutput.on('close', function() {
        logger.Success('Paquete creado correctamente.');
    });

    zipFile.on('error', function(err) {
        logger.Error('Error al crear el archivo:' + err);
    });

    // Conecta el objeto Archiver con la salida del archivo
    zipFile.pipe(packageOutput);
    function addFolderToZip(folder, folder_name) {
        zipFile.directory(folder, folder_name);
        logger.Success(`Carpeta "${folder_name}" agregada al archivo zip.`);
    }
    addFolderToZip(`./packages/development/${package_name}/`, false);
    zipFile.finalize();
}

module.exports = PackageEntity;