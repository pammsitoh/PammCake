const https = require('https');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const logger = require('../lib/Loggers');

const GITHUB_REPO = 'pammsitoh/PammCakeModules';
const GITHUB_BRANCH = 'main';

const startSpinner = (message) => {
    const frames = ['◰','◳','◲','◱'];
    let i = 0;
    const interval = setInterval(() => {
        process.stdout.write(`\r${frames[i]} ${message}`);
        i = (i + 1) % frames.length;
    }, 80);
    return {
        stop: () => {
            clearInterval(interval);
            process.stdout.write('\r\x1b[K'); // Limpiar la línea del spinner
        }
    };
};

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

const downloadFolder = async (apiUrl, localPath) => {
    const contents = await fetchGithub(apiUrl);
    if (!contents) return false;

    let manifestData = null;

    if (!fs.existsSync(localPath)) {
        fs.mkdirSync(localPath, { recursive: true });
    }

    for (const item of contents) {
        const itemLocalPath = path.join(localPath, item.name);
        if (item.type === 'dir') {
            const subManifest = await downloadFolder(item.url, itemLocalPath);
            if (subManifest) manifestData = subManifest;
        } else if (item.type === 'file') {
            if (item.name === "manifest.json") {
                const spinner = startSpinner(`  - Leyendo configuración del modulo...`);
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
                    logger.Error(`Error al leer manifest.json: ${e.message}`);
                }
                spinner.stop();
                continue;
            }
            const spinner = startSpinner(`  - Descargando ${item.name}...`);
            await downloadFile(item.download_url, itemLocalPath);
            spinner.stop();
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
        logger.Error(`No has configurado typeScript en tu proyecto. usa 'pcake add typescript'`);
        return false;
    }
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/modules/${module_name}?ref=${GITHUB_BRANCH}`;

    const spinner = startSpinner(`Buscando modulo '${module_name}' en el repositorio...`);

    try {
        const manifest = await downloadFolder(apiUrl, install_path);
        spinner.stop();

        if (manifest !== false) {
            if (manifest && manifest.author) {
                logger.Log(`░▒▓│ Modulo creado por: @${manifest.author}`);
            }
            logger.Success(`Modulo '${module_name}' instalado correctamente!`);
            process.exit();
        } else {
            logger.Error(`El modulo '${module_name}' no existe en el repositorio.`);
            process.exit();
        }
    } catch (err) {
        spinner.stop();
        logger.Error(`Error al descargar el modulo: ${err.message}`);
    }
}

module.exports = AddModule;