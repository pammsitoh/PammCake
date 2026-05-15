const os = require('os');
const path = require('path');

/**
 * Devuelve la ruta a la carpeta com.mojang de Minecraft Bedrock en Windows.
 * Esta es la carpeta donde Minecraft guarda los packs de desarrollo.
 * @returns {string}
 */
const getMinecraftPath = () => {
    return path.join(
        os.homedir(),
        'AppData', 'Roaming', 'Minecraft Bedrock',
        'Users', 'Shared', 'games', 'com.mojang'
    );
};

module.exports = { getMinecraftPath };
