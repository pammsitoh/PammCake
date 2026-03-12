const cakeEntity = require('./src/elements/CakeEntity');
const cakeFunction = require('./src/elements/CakeFunction');
const cakeManifest = require('./src/elements/CakeManifest');
const EntityTemplate = require('./src/templates/Entity');
const ManifestTemplate = require('./src/templates/Manifest');
const TemplateManager = require('./src/templates/TemplateCake');
const { toolConnect, ToolConnect } = require('./src/connect/main');

module.exports = {
    cakeEntity,
    cakeManifest,
    cakeFunction,
    EntityTemplate,
    ManifestTemplate,
    TemplateManager,
    toolConnect,
    ToolConnect
}