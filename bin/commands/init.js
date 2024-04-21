const fs = require("fs");
const fse = require("fs-extra");
const skeletons = require("../../templates/skeletons");
const colors = require("colors");
const uuid = require("uuid");
const os = require('os');
const path = require('path');
const cakeManifest = require("../../lib/src/elements/CakeManifest");

exports.command = "init <project_name>";
exports.desc = "Incializar proyecto.";
exports.builder = {
    "basic": {
        type: "boolean",
        alias: "b",
        description: "Inicializar proyecto basico de PammCake"
    }
};
exports.handler = async function (argv) {

    function _goContinue() {
        const rutaDirectorioPrincipal = os.homedir();
        const rutaCarpetaUsuario = path.join(rutaDirectorioPrincipal, 'AppData', 'Local', 'Packages', 'Microsoft.MinecraftUWP_8wekyb3d8bbwe', 'LocalState', 'games', 'com.mojang');

        const defpath_bp = argv.basic ? path.join('addon', `BP`) : path.join(rutaCarpetaUsuario, 'development_behavior_packs', `${argv.project_name} - BP`);
        const defpath_rp = argv.basic ? path.join('addon', `RP`) : path.join(rutaCarpetaUsuario, 'development_resource_packs', `${argv.project_name} - RP`);

        fs.mkdir(defpath_bp,{},() => {
            const apath = defpath_bp;
            
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
                    const base = `pack.name=${argv.project_name} Behaviors\npack.description=§bInitialized with PCake \n\n#:pcake/>`;
        
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

        fs.mkdir(defpath_rp,{}, () => {
            const apath = defpath_rp;
            
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
    }

    if( argv.basic ) {
        await fse.copy(path.join(__dirname, "../../", "assets", "example_project"), "./", err => {
            if (err) {
                console.error('Error al crear el proyecto:', err);
            } else {
                console.log('El proyecto se ha creado exitosamente.');
                const pcake_new_config = {
                    name: argv.project_name,
                    identifier: "dev"
                }
                fs.writeFileSync("./pcake.config.json", JSON.stringify(pcake_new_config, null, 4));

                _goContinue();
            }
        });
    }

};
