const cakeEntity = require('./src/elements/CakeEntity');
const cakeManifest = require('./src/elements/CakeManifest');
const { Success, Error, Log } = require('./src/lib/Loggers');
const EntityTemplate = require('./src/templates/Entity');
const ManifestTemplate = require('./src/templates/Manifest');
const getTemplate = require('./src/templates/TemplateCake');

exports.pcake = {
    cakeEntity,
    cakeManifest,
    Success,
    Error,
    Log,
    EntityTemplate,
    ManifestTemplate,
    getTemplate
}