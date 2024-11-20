const fs = require('fs');
const fse = require('fs-extra');
const { AddonManager } = require("gumaddon");
const path = require('path');

/**
 * 
 * @param {AddonManager} addon 
 * @param {String} module_name 
 */
const AddModule = async (addon, module_name) => {
    const module_path = path.join(__dirname, "../../modules/", module_name);
    const install_path = path.join("addon", "BP", "scripts", "_pcake_modules", module_name);

    addon.log("Verificando modulo");

    // Verificar si existe la carpeta antes de continuar...
    if(!fs.existsSync(module_path)) {
        addon.error("Ese modulo no existe en esta version de PammCake");
        return;
    };

    // Si existe continuar con la copia del modulo al addon...
    addon.log("Instalando Modulo...");
    await fse.copy(module_path, install_path).then( val => {
        addon.success("Modulo instalado correctamente!")
    }).catch( err => {
        if(!err) return;
        addon.error("Error al copiar...")
    })
}

module.exports = AddModule;