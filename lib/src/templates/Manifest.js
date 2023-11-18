const ManifestTemplate = {
    "format_version": 2,
    "header": {
        "description": "pack.description",
        "name": "pack.name",
        "uuid": "<UUID>",
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
            "type": "<TYPE>",
            "uuid": "<UUID>",
            "version": [
                1,
                0,
                0
            ]
        }
    ]
}

module.exports = ManifestTemplate;