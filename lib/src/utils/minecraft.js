const os = require('os');
const path = require('path');

/**
 * Devuelve la ruta a la carpeta com.mojang de Minecraft Bedrock Release en Windows.
 * @returns {string}
 */
const getMinecraftPath = () => {
    return path.join(
        os.homedir(),
        'AppData', 'Roaming', 'Minecraft Bedrock',
        'Users', 'Shared', 'games', 'com.mojang'
    );
};

/**
 * Devuelve la ruta a la carpeta com.mojang de Minecraft Bedrock Preview en Windows.
 * @returns {string}
 */
const getMinecraftPreviewPath = () => {
    return path.join(
        os.homedir(),
        'AppData', 'Roaming', 'Minecraft Bedrock Preview',
        'Users', 'Shared', 'games', 'com.mojang'
    );
};

/**
 * Devuelve la ruta correcta según si el proyecto es para Preview o Release.
 * @param {boolean} isPreview
 * @returns {string}
 */
const getMinecraftPathFor = (isPreview) => {
    return isPreview ? getMinecraftPreviewPath() : getMinecraftPath();
};

module.exports = { getMinecraftPath, getMinecraftPreviewPath, getMinecraftPathFor };
