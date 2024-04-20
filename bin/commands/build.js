const fs = require("fs-extra");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const uuid = require("uuid");
const os = require('os');
const path = require("path");
const cakeManifest = require("../../lib/src/elements/CakeManifest");
const archiver = require("archiver");

exports.command = "build <project_name>";
exports.desc = "Construir proyecto";
exports.builder = {
    zip: {
        type: "boolean",
        alias: "z",
        description: "zip mode",
    },
    fast: {
        type: "boolean",
        alias: "f",
        description: "fast build"
    }
};
exports.handler = async function (argv) {
    if(argv.fast) {
        FastBuild(argv);
        return;
    }
    ProdBuild(argv);
};

const ProdBuild = ( argv ) => {
    if(!fs.existsSync("./pcake.config.json")) return;
    const pcake_file = fs.readFileSync('./pcake.config.json', { encoding: 'utf8' });
    const config = JSON.parse(pcake_file);
    
    // Proceso de compilado...

    // Compress Process...
    const resultPath = `./.build/build.${argv.zip ? 'zip' : 'mcaddon'}`

    const zipFile = archiver('zip', {
        zlib: { level: 9 }
    })

    const fileOutput = fs.createWriteStream(resultPath);

    // Maneja eventos de finalización y errores
    fileOutput.on('close', function() {
        console.log('Archivo zip creado correctamente.');
    });

    zipFile.on('error', function(err) {
        console.error('Error al crear el archivo zip:', err);
    });

    // Conecta el objeto Archiver con la salida del archivo
    zipFile.pipe(fileOutput);

    function addFolderToZip(folder, folder_name) {
        zipFile.directory(folder, folder_name);
        console.log(`Carpeta "${folder_name}" agregada al archivo zip.`);
    }

    addFolderToZip('./addon/BP', 'BP');
    addFolderToZip('./addon/RP', 'RP');

    zipFile.finalize();
}

const FastBuild = ( argv ) => {
    const rutaDirectorioPrincipal = os.homedir();
    const rutaCarpetaUsuario = path.join(rutaDirectorioPrincipal, 'AppData', 'Local', 'Packages', 'Microsoft.MinecraftUWP_8wekyb3d8bbwe', 'LocalState', 'games', 'com.mojang');
    // Proceso de compilado...
    

    // Compress Process...
    const resultPath = `./exported.${argv.zip ? 'zip' : 'mcaddon'}`

    const zipFile = archiver('zip', {
        zlib: { level: 9 }
    })

    const fileOutput = fs.createWriteStream(resultPath);

    // Maneja eventos de finalización y errores
    fileOutput.on('close', function() {
        console.log('Archivo zip creado correctamente.');
    });

    zipFile.on('error', function(err) {
        console.error('Error al crear el archivo zip:', err);
    });

    // Conecta el objeto Archiver con la salida del archivo
    zipFile.pipe(fileOutput);

    function addFolderToZip(folder, folder_name) {
        zipFile.directory(folder, folder_name);
        console.log(`Carpeta "${folder_name}" agregada al archivo zip.`);
    }

    addFolderToZip(path.join(rutaCarpetaUsuario, 'development_behavior_packs', `${argv.project_name} - BP`), 'BP');
    addFolderToZip(path.join(rutaCarpetaUsuario, 'development_resource_packs', `${argv.project_name} - RP`), 'RP');

    zipFile.finalize();
}