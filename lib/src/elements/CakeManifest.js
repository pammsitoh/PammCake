const { v4 } = require("uuid");
const getTemplate = require("../templates/TemplateCake");
const TemplateManager = require("../templates/TemplateCake");

class cakeManifest {
    constructor() {
        this.base = TemplateManager.getTemplate("manifest");
        
        this.base.header.uuid = v4();
        this.base.modules[0].uuid = v4();
    }

    /**
     * 
     * @param {String} name
     * @description sets the name of the pack.
     * 
     */
    setName( name ) {
        this.base.header.name = name;
    }

    /**
     * 
     * @param {String} description 
     * @description sets the description of the pack.
     * 
     */
    setDescription( description ) {
        this.base.header.description = description;
    }

    /**
     * 
     * @param {String} version
     * @description sets the pack version.
     *  
     */
    setVersion( version ) {
        this.base.header.version = version;
    }

    /**
     * 
     * @param {Object} module 
     */
    addModule( module ) {
        this.base.modules.push( module );
    }

    /**
     * 
     * @param {String} module_name 
     * @param {String} version 
     */
    addScriptModule( module_name, version ) {
        this.base.dependencies.push(
            {
                module_name: module_name,
                version: version
            }
        );
    }
}

module.exports = cakeManifest;