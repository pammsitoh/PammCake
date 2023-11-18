const skeletons = {

    manifest: {
        "format_version": 2,
        "header": {
            "description": "pack.description",
            "name": "pack.name",
            "uuid": "d7277291-8410-48be-8e3e-6627067e759c",
            "min_engine_version": [
                1,
                20,
                10
            ],
            "version": [
                1,
                0,
                0
            ]
        },
        "modules": [
            {
                "type": "data",
                "uuid": "63e45347-afc3-438b-adc4-6b5da56842ac",
                "version": [
                    1,
                    0,
                    0
                ]
            }
        ]
    },
    
    /**
     * @description Empty Template For Entities...
     */
    entity: {
        "format_version": "1.20.0",
        "minecraft:entity": {
            "description": {
                "identifier": "namespace:entity",
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
    },

    ac: {
        "format_version": "1.20.0",
        "animation_controllers": {
        }
    }
}

module.exports = skeletons;