const getTemplate = require("../templates/TemplateCake");

class cakeAnimationController {
    constructor( name ){
        this.name = name;
        this.base = getTemplate("animation_controller");

        this.started();
    }

    /** @param {String} version */
    setFormatVersion( version ) {
        this.base.format_version = version;
    }

    started() {
        this.base.animation_controllers[`controller.animation.${this.name}`] = {
            "initial_state": "default",
            "states": {
                "default": {
                    "transitions": [
                        {
                            "state_1": "query.is_baby"
                        }
                    ]
                },
                "state_1": {}
            }
        }
    }
}

module.exports = cakeAnimationController;