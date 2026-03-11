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
            res.on('end', () => resolve(JSON.parse(data)));
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

    if (!fs.existsSync(localPath)) {
        fs.mkdirSync(localPath, { recursive: true });
    }

    for (const item of contents) {
        const itemLocalPath = path.join(localPath, item.name);
        if (item.type === 'dir') {
            await downloadFolder(item.url, itemLocalPath, addon);
        } else if (item.type === 'file') {
            addon.log(`  - Descargando ${item.name}...`);
            await downloadFile(item.download_url, itemLocalPath);
        }
    }
    return true;
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
        const success = await downloadFolder(apiUrl, install_path, addon);
        if (success) {
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