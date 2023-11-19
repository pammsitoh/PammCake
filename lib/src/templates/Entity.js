/**
 * @description JSON Entity Template
 */
const EntityTemplate = {
    "format_version": "1.20.0",
    "minecraft:entity": {
        "description": {
            "identifier": "<identifier>",
            "is_spawnable": true,
            "is_summonable": true
        },
        "component_groups": {
            "despawn":{
                "minecraft:instant_despawn":{}
            }
        },
        "components": {},
        "events": {
            "despawn": {
                "add": {
                    "component_groups": [
                        "despawn"
                    ]
                }
            }
        }
    }
}

module.exports = EntityTemplate;