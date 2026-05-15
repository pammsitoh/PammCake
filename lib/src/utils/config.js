const fs = require('fs');

/**
 * Lee y parsea el archivo pcake.config.json del directorio actual.
 * Lanza un error si el archivo no existe.
 * @returns {{ name: string, identifier: string }}
 */
const readConfig = () => {
    if (!fs.existsSync('./pcake.config.json')) {
        throw new Error('No se encontró pcake.config.json. ¿Estás dentro de un proyecto PammCake?');
    }
    return JSON.parse(fs.readFileSync('./pcake.config.json', 'utf8'));
};

/**
 * Devuelve true si existen las carpetas addon/BP y addon/RP.
 * @returns {boolean}
 */
const addonFoldersExist = () => {
    return fs.existsSync('./addon/BP') && fs.existsSync('./addon/RP');
};

module.exports = { readConfig, addonFoldersExist };
