const https = require('https');
const fs = require('fs');
const path = require('path');
const logger = require('../lib/Loggers');

const GITHUB_REPO = 'pammsitoh/PammCakeModules';
const GITHUB_BRANCH = 'main';
const ASSET_PACKS = ['BP', 'RP'];

const startSpinner = (message) => {
    const frames = ['◰', '◳', '◲', '◱'];
    let index = 0;

    const interval = setInterval(() => {
        process.stdout.write(`\r${frames[index]} ${message}`);
        index = (index + 1) % frames.length;
    }, 80);

    return {
        stop: () => {
            clearInterval(interval);
            process.stdout.write('\r\x1b[K');
        }
    };
};

const getGithubContentsUrl = (moduleName, subPath = '') => {
    const cleanSubPath = subPath ? `/${subPath}` : '';
    return `https://api.github.com/repos/${GITHUB_REPO}/contents/modules/${moduleName}${cleanSubPath}?ref=${GITHUB_BRANCH}`;
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
                resolve(null);
                return;
            }

            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
                return;
            }

            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

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

const downloadFile = (url, destinationPath) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destinationPath);

        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
                return;
            }

            res.pipe(file);
            file.on('finish', () => file.close(resolve));
        }).on('error', (err) => {
            fs.unlink(destinationPath, () => reject(err));
        });
    });
};

const getManifestAuthor = async (manifestItem) => {
    const spinner = startSpinner('  - Leyendo configuración del modulo...');

    try {
        const rawManifest = await fetchGithub(manifestItem.download_url);

        if (typeof rawManifest === 'string') {
            const match = rawManifest.match(/author\s*:\s*["'](.*?)["']/);
            return match ? { author: match[1] } : null;
        }

        return rawManifest;
    } catch (error) {
        logger.Error(`Error al leer manifest.json: ${error.message}`);
        return null;
    } finally {
        spinner.stop();
    }
};

const downloadFolder = async (apiUrl, localPath, options = {}) => {
    const contents = await fetchGithub(apiUrl);
    if (!contents) return false;

    if (!fs.existsSync(localPath)) {
        fs.mkdirSync(localPath, { recursive: true });
    }

    let manifestData = null;

    for (const item of contents) {
        const itemLocalPath = path.join(localPath, item.name);

        if (item.type === 'dir') {
            if (options.skipDirectories && options.skipDirectories.includes(item.name)) {
                continue;
            }

            const subManifestData = await downloadFolder(item.url, itemLocalPath, options);
            if (subManifestData) {
                manifestData = subManifestData;
            }
            continue;
        }

        if (item.type !== 'file') {
            continue;
        }

        if (item.name === 'manifest.json') {
            const parsedManifest = await getManifestAuthor(item);
            if (parsedManifest) {
                manifestData = parsedManifest;
            }
            continue;
        }

        const spinner = startSpinner(`  - Descargando ${item.name}...`);
        await downloadFile(item.download_url, itemLocalPath);
        spinner.stop();
    }

    return manifestData;
};

const installModuleAssets = async (moduleName) => {
    for (const pack of ASSET_PACKS) {
        const packApiUrl = getGithubContentsUrl(moduleName, `assets/${pack}`);
        const packTargetPath = path.join('addon', pack);
        const result = await downloadFolder(packApiUrl, packTargetPath);

        if (result !== false) {
            logger.Log(`░▒▓│ Assets ${pack} copiados a addon/${pack}`);
        }
    }
};

const hasScriptsFolder = () => fs.existsSync(path.join('scripts'));

/**
 * @param {AddonManager} addon
 * @param {String} module_name
 */
const AddModule = async (addon, module_name) => {
    const installPath = path.join('scripts', '_pcake_modules', module_name);

    if (!hasScriptsFolder()) {
        logger.Error(`No has configurado typeScript en tu proyecto. usa 'pcake add typescript'`);
        return false;
    }

    const moduleApiUrl = getGithubContentsUrl(module_name);
    const spinner = startSpinner(`Buscando modulo '${module_name}' en el repositorio...`);

    try {
        const manifest = await downloadFolder(moduleApiUrl, installPath, {
            skipDirectories: ['assets']
        });
        spinner.stop();

        if (manifest === false) {
            logger.Error(`El modulo '${module_name}' no existe en el repositorio.`);
            process.exit();
            return;
        }

        if (manifest && manifest.author) {
            logger.Log(`░▒▓│ Modulo creado por: @${manifest.author}`);
        }

        await installModuleAssets(module_name);

        logger.Success(`Modulo '${module_name}' instalado correctamente!`);
        process.exit();
    } catch (error) {
        spinner.stop();
        logger.Error(`Error al descargar el modulo: ${error.message}`);
    }
};

module.exports = AddModule;