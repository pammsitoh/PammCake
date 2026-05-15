const AnimationControllerTemplate = require("./AnimationController");
const EntityTemplate = require("./Entity");
const ManifestTemplate = require("./Manifest");

const templates = {
    manifest: ManifestTemplate,
    entity: EntityTemplate,
    animation_controller: AnimationControllerTemplate,
};

const TemplateManager = {
    /**
     * Devuelve una copia profunda del template pedido.
     * Usamos JSON.parse/stringify para clonar el objeto,
     * así cada instancia tiene su propio objeto y no comparten el mismo.
     * @param {"manifest" | "entity" | "animation_controller"} type
     * @returns {object}
     */
    getTemplate: (type) => {
        return JSON.parse(JSON.stringify(templates[type]));
    },
};

module.exports = TemplateManager;