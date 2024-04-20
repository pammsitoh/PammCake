const fs = require("fs");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const uuid = require("uuid");
const os = require('os');
const path = require('path');
const cakeManifest = require("../../lib/src/elements/CakeManifest");

exports.command = "init <project_name>";
exports.desc = "Incializar proyecto.";
exports.builder = {};
exports.handler = function (argv) {
    const rutaDirectorioPrincipal = os.homedir();
    const rutaCarpetaUsuario = path.join(rutaDirectorioPrincipal, 'AppData', 'Local', 'Packages', 'Microsoft.MinecraftUWP_8wekyb3d8bbwe', 'LocalState', 'games', 'com.mojang');

    fs.mkdir(path.join(rutaCarpetaUsuario, 'development_behavior_packs', `${argv.project_name} - BP`),{},() => {
        const apath = path.join(rutaCarpetaUsuario, 'development_behavior_packs', `${argv.project_name} - BP`);
        
        let file = new cakeManifest();
        file.base.modules[0].type = "data";
        file.setVersion([1, 0, 0]);

        if (!fs.existsSync(path.join(apath, "manifest.json"))) {
            fs.writeFileSync(path.join(apath, "manifest.json"), JSON.stringify(file.base, null, 4));
            createLang();
            console.log(`[√] Proyecto "${argv.project_name} - BP" Creado!`.green);
            return;
        }

        console.log(`<!> Se intento Crear "${argv.project_name} - BP" pero ya existe.`.red);

        function createLang() {
            fs.mkdir(path.join(apath, "texts"), () => {
                const base = `pack.name=${argv.project_name} Behaviors\npack.description=§dInitialized with PCake \n\n#:pcake/>`;
    
                fs.writeFileSync(
                    path.join(apath, "texts", "languages.json"),
                    JSON.stringify(["en_US"], null, 4)
                );
                fs.writeFileSync(path.join(apath, "texts", "en_US.lang"), base);
                fs.copyFileSync(
                    path.join(__dirname, "../../", "assets", "pack_icon.png"),
                    path.join(apath, "pack_icon.png")
                );
            });
        }
    });
    fs.mkdir(path.join(rutaCarpetaUsuario, 'development_resource_packs', `${argv.project_name} - RP`),{}, () => {
        const apath = path.join(rutaCarpetaUsuario, 'development_resource_packs', `${argv.project_name} - RP`);
        
        let file = new cakeManifest();
        file.base.modules[0].type = "resources";
        file.setVersion([1, 0, 0]);

        if (!fs.existsSync(path.join(apath, "manifest.json"))) {
            fs.writeFileSync(path.join(apath, "manifest.json"), JSON.stringify(file.base, null, 4));
            createLang();
            console.log(`[√] Proyecto "${argv.project_name} - RP" Creado!`.green);
            return;
        }

        console.log(`<!> Se intento Crear "${argv.project_name} - RP" pero ya existe.`.red);

        function createLang() {
            fs.mkdir(path.join(apath, "texts"), () => {
                const base = `pack.name=${argv.project_name} Resources\npack.description=§dInitialized with PCake \n\n#:pcake/>`;
    
                fs.writeFileSync(
                    path.join(apath, "texts", "languages.json"),
                    JSON.stringify(["en_US"], null, 4)
                );
                fs.writeFileSync(path.join(apath, "texts", "en_US.lang"), base);
                fs.copyFileSync(
                    path.join(__dirname, "../../", "assets", "pack_icon.png"),
                    path.join(apath, "pack_icon.png")
                );
            });
        }
    });

};
