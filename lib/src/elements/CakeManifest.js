const { v4 } = require("uuid");
const getTemplate = require("../templates/TemplateCake");
const TemplateManager = require("../templates/TemplateCake");

class cakeManifest {
    constructor() {
        this.base = TemplateManager.getTemplate("manifest");
        
        this.base.header.uuid = v4();
        this.base.modules[0].uuid = v4();
    }

    setName( name ) {
        this.base.header.name = name;
    }

    setDescription( description ) {
        this.base.header.description = description;
    }

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