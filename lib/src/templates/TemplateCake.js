const EntityTemplate = require("./Entity");
const ManifestTemplate = require("./Manifest");

/**
 * 
 * @param {String} type 
 * @returns {EntityTemplate | ManifestTemplate}
 */
const getTemplate = ( type ) =>{
    const types = {
        "manifest": ManifestTemplate,
        "entity": EntityTemplate
    }

    return types[type]
}

module.exports = getTemplate;