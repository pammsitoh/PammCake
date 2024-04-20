const TemplateManager = require("../templates/TemplateCake");

// * Entity File Reference
class cakeEntity {
    constructor() {
        this.base = TemplateManager.getTemplate("entity");
    }

    /** 
     * 
     * @returns {Boolean}
     * @description is spawnable? :O
     * 
     */
    isSpawnable() {
        return this.base["minecraft:entity"].description.is_spawnable;
    }

    /** 
     * @returns {Boolean}
     * @description is Summonable? :P
     */
    isSummonable() {
        return this.base["minecraft:entity"].description.is_summonable;
    }

    /** 
     * @returns {String}
     * @description Obtains the entity identifier.
     */
    getIdentifier() {
        return this.base["minecraft:entity"].description.identifier;
    }

    /** 
     * @returns {String}
     * @description Obtains the entity format version.
     */
    getFormatVersion() {
        return this.base.format_version;
    }

    /** @returns {Object} */
    getComponentGroups() {
        return this.base["minecraft:entity"].component_groups;
    }

    /** @returns {Object} */
    getComponents() {
        return this.base["minecraft:entity"].components;
    }

    /** @returns {Object} */
    getEvents() {
        return this.base["minecraft:entity"].events;
    }

    /** 
     * @param {boolean} value
     */
    setSpawnable(value) {
        this.base["minecraft:entity"].description.is_spawnable = value;
    }

    /** 
     * @param {boolean} value
     */
    setSummonable(value) {
        this.base["minecraft:entity"].description.is_summonable = value;
    }

    /** 
     * @param {String} identifier
     */
    setIdentifier( identifier ) {
        this.base["minecraft:entity"].description.identifier = identifier;
    }

    /** 
     * @param {String} version
     */
    setFormatVersion( version ) {
        this.base.format_version = version;
    }
}

module.exports = cakeEntity;