const { DespawnModule } = require("../easy_modules/entity/DespawnModule");
const fs = require("fs");
const path = require("path");

class EntityCompiler {
    constructor( entities_path ) {
        this.compilable_files = [];
        this.project_path = entities_path;
    }

    loadCompilables( callback ) {
        fs.readdir( this.project_path, (err, files) => {
            console.log(JSON.stringify(files));
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                console.log(file);
                const content = this.getFile( file );
                if(content["minecraft:entity"].description.hasOwnProperty("modules")) {
                    this.compilable_files.push(file);
                }
            }
            callback();
        });
    }

    getFile( name ) {
        console.log("reading -█> " + name);
        return JSON.parse(fs.readFileSync(path.join(this.project_path, name)));
    }

    /** @description Save files with new content... */
    saveFile( name, content ) {
        fs.writeFileSync(path.join(this.project_path, name), content);
    }

    compile( file ) {
        let content = this.getFile(file);
        const modules = content["minecraft:entity"].description.modules;
        modules.forEach( module => {
            switch (module) {
                case "despawn":
                    content["minecraft:entity"].component_groups[DespawnModule.name] = DespawnModule.group;
                    content["minecraft:entity"].events[DespawnModule.name] = {
                        "add": {
                            "component_groups": [
                                DespawnModule.name
                            ]
                        }
                    }
                    this.saveFile(file, JSON.stringify(content, null, 4));
                    break;
                case "rare_functions":
                    const keys = Object.keys(content["minecraft:entity"].component_groups);
                    for(const key of keys) {
                        const args = key.split("%");
                        if(args[0] == "f") {
                            const the_func = args[1].split("->");
                            const thedata = the_func[1].split(":");
                            const data = {
                                name: thedata[0],
                                value: thedata[1]
                            }

                            for (let i = 0; i < data.value; i++) {
                                content["minecraft:entity"].component_groups[`${data.name}_${i}`] = content["minecraft:entity"].component_groups[key];
                            }
                            delete content["minecraft:entity"].component_groups[key];
                        }
                    }
                    this.saveFile(file, JSON.stringify(content, null, 4));
                    break;

                default:
                    break;
            }
        });
    }

    startCompiler() {
        for(const file of this.compilable_files) {
            this.compile( file );
        }
    }
}
module.exports = { EntityCompiler };