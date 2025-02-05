const fs = require("fs");
const path = require("path");

const MenuCompiler = () => {
    const menus_path = "./addon/BP/scripts/menus";
    const _EXT = "pcakemenu"
    
    if(!fs.existsSync(menus_path)) return;

    let pcake_files = []

    const files = fs.readdirSync(menus_path, {
        encoding: "utf-8",
        withFileTypes: true
    })

    for(const file of files) {
        if(!file.isFile()) continue;
        const ext = file.name.includes('.') ? file.name.split('.').pop() : '';

        if(ext != _EXT) continue;
        pcake_files.push(file);
    }

    for(const pfile of pcake_files) {
        const content = fs.readFileSync(path.join(menus_path, pfile.name), {});
        
        const divided = content.toString().split("\n");

        if(divided[0].startsWith("title:") && divided[1].startsWith("body:")) {
            let data = {
                title: divided[0].replace("title: ", "").replace(/[\r\n]/g, ''),
                body: divided[1].replace("body: ", "").replace(/[\r\n]/g, ''),
                buttons: [],
                buttonActions: []
            }

            for(const posbutton of divided) {
                if(!posbutton.startsWith("-")) continue;
                const index = divided.indexOf(posbutton);
                const toSave = `    .button("${posbutton.replaceAll("- ", "").replace(/[\r\n]/g, '')}")\n`;
                const runOnNextLine = ( idx ) => {
                    if(divided[idx + 1]?.startsWith("    $cmd")) {
                        const command = divided[idx + 1].replace("    $cmd ", "");
                        data.buttonActions.push(`        result.selection == ${data.buttons.indexOf(toSave)} ? player.runCommandAsync("${command}") : null`.replace(/[\r\n]/g, ''));
                        runOnNextLine(idx + 1);
                    }
                }
                data.buttons.push(toSave);
                runOnNextLine(index);
            }

            const newContent = `import { ActionFormData } from "@minecraft/server-ui"\n\nexport const ${data.title.replaceAll(" ","")} = ( player ) => {\n    const menu = new ActionFormData()\n    .title("${data.title}")\n    .body("${data.body}")\n\n    // BUTTONS\n${data.buttons.join("")}\n\n    // SHOW THE FORM\n    .show(player).then( result => {\n        if(result.canceled) return;\n${data.buttonActions.join("\n")}\n    })\n}`;

            // SAVE FILE COMPILED.
            fs.writeFileSync(path.join(menus_path, pfile.name.replaceAll(".pcakemenu","") + ".js"), newContent, {encoding: "utf-8"});
            //fs.rmSync(path.join(menus_path, pfile.name));
        }
    }
}

module.exports = { MenuCompiler };
