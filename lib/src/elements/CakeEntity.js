const getTemplate = require("../templates/TemplateCake");


// * Entity File Reference
class cakeEntity {
    constructor() {
        this.base = getTemplate("entity");
    }

    isSpawnable() {
        return this.base["minecraft:entity"].description.is_spawnable;
    }

    isSummonable() {
        return this.base["minecraft:entity"].description.is_summonable;
    }

    getIdentifier() {
        return this.base["minecraft:entity"].description.identifier;
    }

    getFormatVersion() {
        return this.base.format_version;
    }

    getComponentGroups() {
        return this.base["minecraft:entity"].component_groups;
    }

    getComponents() {
        return this.base["minecraft:entity"].components;
    }

    getEvents() {
        return this.base["minecraft:entity"].events;
    }

    setSpawnable(value) {
        this.base["minecraft:entity"].description.is_spawnable = value;
    }

    setSummonable(value) {
        this.base["minecraft:entity"].description.is_summonable = value;
    }

    setIdentifier( identifier ) {
        this.base["minecraft:entity"].description.identifier = identifier;
    }

    setFormatVersion( version ) {
        this.base.format_version = version;
    }
}

module.exports = cakeEntity;