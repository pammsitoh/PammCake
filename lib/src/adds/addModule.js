const https = require('https');
const fs = require('fs');
const fse = require('fs-extra');
const { AddonManager } = require("gumaddon");
const path = require('path');

const GITHUB_REPO = 'pammsitoh/PammCakeModules';
const GITHUB_BRANCH = 'main';

const fetchGithub = (url) => {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'PammCake-CLI'
            }
        };
        https.get(url, options, (res) => {
            if (res.statusCode === 404) {
                return resolve(null);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
            }
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
};

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

const downloadFolder = async (apiUrl, localPath, addon) => {
    const contents = await fetchGithub(apiUrl);
    if (!contents) return false;

    let manifestData = null;

    if (!fs.existsSync(localPath)) {
        fs.mkdirSync(localPath, { recursive: true });
    }

    for (const item of contents) {
        const itemLocalPath = path.join(localPath, item.name);
        if (item.type === 'dir') {
            const subManifest = await downloadFolder(item.url, itemLocalPath, addon);
            if (subManifest) manifestData = subManifest;
        } else if (item.type === 'file') {
            if (item.name === "manifest.json") {
                addon.log(`  - Leyendo configuración del modulo...`);
                try {
                    const rawManifest = await fetchGithub(item.download_url);
                    if (typeof rawManifest === 'string') {
                        // Intentar extraer autor vía regex si no es un JSON válido
                        const match = rawManifest.match(/author\s*:\s*["'](.*?)["']/);
                        if (match) {
                            manifestData = { author: match[1] };
                        }
                    } else {
                        manifestData = rawManifest;
                    }
                } catch (e) {
                    addon.error(`Error al leer manifest.json: ${e.message}`);
                }
                continue;
            }
            addon.log(`  - Descargando ${item.name}...`);
            await downloadFile(item.download_url, itemLocalPath);
        }
    }
    return manifestData;
};

/**
 * 
 * @param {AddonManager} addon 
 * @param {String} module_name 
 */
const AddModule = async (addon, module_name) => {
    const install_path = path.join("scripts", "_pcake_modules", module_name);
    if(!fs.existsSync(path.join("scripts"))){
        addon.error(`No has configurado typeScript en tu proyecto. usa 'pcake add typescript'`);
        return false;
    }
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/modules/${module_name}?ref=${GITHUB_BRANCH}`;

    addon.log(`Buscando modulo '${module_name}' en el repositorio...`);

    try {
        const manifest = await downloadFolder(apiUrl, install_path, addon);
        if (manifest !== false) {
            if (manifest && manifest.author) {
                addon.log(`░▒▓│ Modulo creado por: @${manifest.author}`);
            }
            addon.success(`Modulo '${module_name}' instalado correctamente!`);
            process.exit();
        } else {
            addon.error(`El modulo '${module_name}' no existe en el repositorio.`);
            process.exit();
        }
    } catch (err) {
        addon.error(`Error al descargar el modulo: ${err.message}`);
    }
}

module.exports = AddModule;