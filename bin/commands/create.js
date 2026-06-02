const fs     = require("fs");
const path   = require("path");
const figlet = require("figlet");
require("colors");
const { makeRL, select } = require("../../lib/src/utils/prompts");
const { readConfig }     = require("../../lib/src/utils/config");

// Auto-discover all creators from lib/src/creators/
const creatorsDir = path.join(__dirname, "../../lib/src/creators");
const creators = fs.readdirSync(creatorsDir)
    .filter(f => f.endsWith(".js"))
    .map(f => require(path.join(creatorsDir, f)));

exports.command = "create [type]";
exports.desc    = "Crear un nuevo elemento para el addon.";
exports.builder = {};

exports.handler = async function (argv) {
    // Resolve namespace: config.namespace → config.identifier → "example"
    let namespace = "example";
    try {
        const config = readConfig();
        namespace = config.namespace || config.identifier || "example";
    } catch {
        // Not inside a pcake project — use default namespace
    }

    const rl = makeRL();

    try {
        let creator;

        if (argv.type === "list") {
            console.log(`\n  ${"◆".magenta}  ${"Elementos disponibles:".bold}\n`);
            creators.forEach(c => {
                console.log(`     ${"·".magenta}  ${c.type.cyan.padEnd(20)} ${c.description.gray}`);
            });
            console.log("");
            rl.close();
            return;
        }

        if (argv.type) {
            creator = creators.find(c => c.type === argv.type);
            if (!creator) {
                const available = creators.map(c => c.type).join(", ");
                console.log(`\n  ${"✗".red}  Tipo "${argv.type}" no reconocido.`);
                console.log(`  ${"Disponibles:".gray} ${available.cyan}\n`);
                rl.close();
                return;
            }
        } else {
            const idx = await select(
                rl,
                "¿Qué quieres crear?",
                creators.map(c => `${c.label.white}  ${"·".gray} ${c.description.gray}`),
                0
            );
            creator = creators[idx];
        }

        const banner = figlet.textSync(`Pcake  ${creator.label}`, { font: "Small" });
        console.log(`\n${banner.brightMagenta}`);

        console.log(`  ${"─".repeat(46).gray}`);
        console.log(`  ${"namespace".gray.padEnd(12)} ${namespace.magenta}`);
        console.log(`  ${"─".repeat(46).gray}`);

        const answers = await creator.wizard(rl, namespace);
        rl.close();

        const result = await creator.create(answers, namespace);
        const files  = Array.isArray(result) ? result : [result];

        console.log("");
        files.forEach(f => console.log(`  ${"✓".green}  ${f.white}`));
        console.log("");

    } catch (err) {
        rl.close();
        console.error(`\n  ${"✗".red}  ${err.message.red}\n`);
        process.exitCode = 1;
    }
};
