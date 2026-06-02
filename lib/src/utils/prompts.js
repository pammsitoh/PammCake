const rl_mod = require("readline");
require("colors");

function makeRL() {
    return rl_mod.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(rl, label, hint, defaultValue) {
    const hintPart = hint ? `  ${"·".gray} ${hint.gray}` : "";
    const defPart  = defaultValue ? `${"(".gray}${defaultValue.gray}${")".gray}  ` : "";
    console.log(`\n  ${"◆".magenta}  ${label.bold}${hintPart}`);
    return new Promise(resolve =>
        rl.question(`  ${"›".magenta}  ${defPart}`, answer => {
            resolve(answer.trim() || defaultValue || "");
        })
    );
}

async function select(rl, label, options, defaultIndex = 0) {
    console.log(`\n  ${"◆".magenta}  ${label.bold}`);
    console.log(`  ${"·".gray}  ${"↑ ↓ para mover  ·  Enter para confirmar".gray}\n`);

    let current = defaultIndex;
    const lineCount = options.length;

    const render = (isFirst) => {
        if (!isFirst) {
            rl_mod.moveCursor(process.stdout, 0, -lineCount);
            rl_mod.clearScreenDown(process.stdout);
        }
        options.forEach((opt, i) => {
            const isSelected = i === current;
            const bullet = isSelected ? "●".magenta : "○".gray;
            const text   = isSelected ? opt.white   : opt.gray;
            process.stdout.write(`     ${bullet}  ${text}\n`);
        });
    };

    render(true);

    return new Promise((resolve) => {
        rl.pause();
        rl_mod.emitKeypressEvents(process.stdin);
        process.stdin.resume(); // evita que el proceso muera con stdin pausado
        if (process.stdin.isTTY) process.stdin.setRawMode(true);

        const cleanup = () => {
            process.stdin.removeListener("keypress", onKey);
            if (process.stdin.isTTY) process.stdin.setRawMode(false);
            process.stdin.pause();
            rl.resume();
            process.stdout.write("\n");
        };

        const onKey = (_, key) => {
            if (!key) return;
            if (key.name === "up") {
                current = (current - 1 + options.length) % options.length;
                render(false);
            } else if (key.name === "down") {
                current = (current + 1) % options.length;
                render(false);
            } else if (key.name === "return") {
                cleanup();
                resolve(current);
            } else if (key.ctrl && key.name === "c") {
                cleanup();
                process.exit(0);
            }
        };

        process.stdin.on("keypress", onKey);
    });
}

async function confirm(rl, label, defaultYes = true) {
    const hint = (defaultYes ? "Y/n" : "y/N").gray;
    console.log(`\n  ${"◆".magenta}  ${label.bold}  ${hint}`);
    const raw = await new Promise(resolve =>
        rl.question(`  ${"›".magenta}  `, a => resolve(a.trim().toLowerCase()))
    );
    return raw ? raw.startsWith("y") : defaultYes;
}

module.exports = { makeRL, ask, select, confirm };
