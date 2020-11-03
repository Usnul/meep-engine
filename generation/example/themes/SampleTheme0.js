import { Theme } from "../../theme/Theme.js";
import { TerrainTheme } from "../../theme/TerrainTheme.js";
import { TerrainLayerRule } from "../../theme/TerrainLayerRule.js";
import { MarkerProcessingRule } from "../../markers/actions/MarkerProcessingRule.js";
import { MarkerNodeMatcherByType } from "../../markers/matcher/MarkerNodeMatcherByType.js";
import { MarkerNodeActionEntityPlacement } from "../../markers/actions/MarkerNodeActionEntityPlacement.js";
import { EntityBlueprint } from "../../../engine/ecs/EntityBlueprint.js";
import Mesh from "../../../engine/graphics/ecs/mesh/Mesh.js";
import { Transform } from "../../../engine/ecs/transform/Transform.js";
import GridPosition from "../../../engine/grid/components/GridPosition.js";
import { matcher_tag_not_traversable } from "../rules/matcher_tag_not_traversable.js";
import { CellMatcherLayerBitMaskTest } from "../../rules/CellMatcherLayerBitMaskTest.js";
import { GridTags } from "../../GridTags.js";
import { CellFilterCellMatcher } from "../../filtering/CellFilterCellMatcher.js";
import { CellFilterSimplexNoise } from "../../filtering/numeric/complex/CellFilterSimplexNoise.js";
import { CellFilterFXAA } from "../../filtering/numeric/complex/CellFilterFXAA.js";
import { CellFilterMultiply } from "../../filtering/numeric/math/algebra/CellFilterMultiply.js";
import { CellFilterLerp } from "../../filtering/numeric/math/CellFilterLerp.js";
import { CellFilterLiteralFloat } from "../../filtering/numeric/CellFilterLiteralFloat.js";
import Tag from "../../../engine/ecs/components/Tag.js";
import HeadsUpDisplay from "../../../engine/ecs/gui/hud/HeadsUpDisplay.js";
import ViewportPosition from "../../../engine/ecs/gui/position/ViewportPosition.js";
import GUIElement from "../../../engine/ecs/gui/GUIElement.js";
import { MarkerNodeTransformerYRotateByFilterGradient } from "../../markers/transform/MarkerNodeTransformerYRotateByFilterGradient.js";
import { PI_HALF } from "../../../core/math/MathUtils.js";
import { CellFilterGaussianBlur } from "../../filtering/numeric/complex/CellFilterGaussianBlur.js";
import { CellProcessingRule } from "../../theme/cell/CellProcessingRule.js";
import { ContinuousGridCellActionSetTerrainHeight } from "../../grid/actions/ContinuousGridCellActionSetTerrainHeight.js";
import { MirGridLayers } from "../grid/MirGridLayers.js";
import { CellFilterReadGridLayer } from "../../filtering/numeric/CellFilterReadGridLayer.js";
import ClingToTerrain from "../../../engine/ecs/terrain/ecs/ClingToTerrain.js";
import { MarkerNodeTransformerYRotateByFilter } from "../../markers/transform/MarkerNodeTransformerYRotateByFilter.js";
import { CellFilterAngleToNormal } from "../../filtering/numeric/complex/CellFilterAngleToNormal.js";
import Vector3 from "../../../core/geom/Vector3.js";
import { CellFilterClamp } from "../../filtering/numeric/math/CellFilterClamp.js";
import { CellFilterOneMinus } from "../../filtering/numeric/math/CellFilterOneMinus.js";
import { CellFilterSmoothStep } from "../../filtering/numeric/math/CellFilterSmoothStep.js";
import { CellFilterInverseLerp } from "../../filtering/numeric/math/CellFilterInverseLerp.js";
import { CellFilterAdd } from "../../filtering/numeric/math/algebra/CellFilterAdd.js";
import { CellFilterNegate } from "../../filtering/numeric/math/algebra/CellFilterNegate.js";
import { MarkerNodeActionWeightedElement } from "../../markers/actions/probability/MarkerNodeActionWeightedElement.js";
import { MarkerNodeActionSelectWeighted } from "../../markers/actions/probability/MarkerNodeActionSelectWeighted.js";
import { ParticleEmitter } from "../../../engine/graphics/particles/particular/engine/emitter/ParticleEmitter.js";
import { CellFilterCache } from "../../filtering/numeric/CellFilterCache.js";
import { SoundEmitter } from "../../../engine/sound/ecs/emitter/SoundEmitter.js";
import { SampleGroundMoistureFilter } from "../filters/SampleGroundMoistureFilter.js";
import GeneratedArmy from "../../../../model/game/ecs/component/generator/army/GeneratedArmy.js";
import { MirMarkerTypes } from "../../../../generator/MirMarkerTypes.js";

export const SampleTheme0 = new Theme();

const terrainTheme = new TerrainTheme();

const matcher_tag_road = CellMatcherLayerBitMaskTest.from(GridTags.Road, MirGridLayers.Tags);

const filterMoisture = CellFilterReadGridLayer.from(MirGridLayers.Moisture);

const filterRock = CellFilterClamp.from(
    CellFilterSmoothStep.from(
        CellFilterLiteralFloat.from(Math.PI / 5),
        CellFilterLiteralFloat.from(Math.PI / 3.5),
        CellFilterAngleToNormal.from(
            CellFilterReadGridLayer.from(MirGridLayers.Heights),
            Vector3.forward
        )
    ),
    CellFilterLiteralFloat.from(0),
    CellFilterLiteralFloat.from(1),
);

const NOISE_10_a = CellFilterSimplexNoise.from(30, 30);

const ROAD_FILTER = CellFilterCellMatcher.from(matcher_tag_road);
const ROAD_FILTER_AA = CellFilterCache.from(CellFilterFXAA.from(ROAD_FILTER));

const filterRoad =
    CellFilterMultiply.from(
        CellFilterCache.from(
            CellFilterGaussianBlur.from(ROAD_FILTER_AA, 1.2, 1.2, 5),
            6
        ),
        CellFilterLerp.from(
            CellFilterLiteralFloat.from(0.4),
            CellFilterLiteralFloat.from(1),
            NOISE_10_a
        )
    );

const filterNotRockAndNotRoad = CellFilterMultiply.from(
    CellFilterOneMinus.from(filterRoad),
    CellFilterOneMinus.from(filterRock)
);

const filterSand = CellFilterMultiply.from(
    CellFilterClamp.from(
        CellFilterAdd.from(
            CellFilterGaussianBlur.from(
                CellFilterSmoothStep.from(
                    CellFilterLiteralFloat.from(0),
                    CellFilterLiteralFloat.from(0.2),
                    CellFilterNegate.from(
                        CellFilterReadGridLayer.from(MirGridLayers.Heights)
                    )
                ),
                3,
                3
            ),
            CellFilterOneMinus.from(
                CellFilterClamp.from(
                    CellFilterInverseLerp.from(
                        CellFilterLiteralFloat.from(0),
                        CellFilterLiteralFloat.from(0.15),
                        filterMoisture
                    ),
                    CellFilterLiteralFloat.from(0),
                    CellFilterLiteralFloat.from(1)
                )
            )
        ),
        CellFilterLiteralFloat.from(0),
        CellFilterLiteralFloat.from(1)
    ),
    filterNotRockAndNotRoad
);

const TERRAIN_LAYER_GRASS = 0;
const TERRAIN_LAYER_ROCK = 1;
const TERRAIN_LAYER_SAND = 3;

terrainTheme.rules.push(TerrainLayerRule.from(
    CellFilterMultiply.from(
        CellFilterMultiply.from(
            CellFilterOneMinus.from(filterSand),
            CellFilterOneMinus.from(filterRock)
        ),
        filterNotRockAndNotRoad
    ),
    TERRAIN_LAYER_GRASS
));

terrainTheme.rules.push(TerrainLayerRule.from(
    filterRock,
    TERRAIN_LAYER_ROCK
));

terrainTheme.rules.push(TerrainLayerRule.from(
    filterSand,
    TERRAIN_LAYER_SAND
));

terrainTheme.rules.push(TerrainLayerRule.from(
    filterRoad,
    2,
));

terrainTheme.rules.push(TerrainLayerRule.from(
    CellFilterMultiply.from(
        ROAD_FILTER,
        CellFilterLerp.from(CellFilterLiteralFloat.from(1), CellFilterLiteralFloat.from(0.3), NOISE_10_a)
    ),
    TERRAIN_LAYER_GRASS,
));

SampleTheme0.terrain = terrainTheme;

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Treasure'),
    transformers: [
        MarkerNodeTransformerYRotateByFilterGradient.from(
            CellFilterGaussianBlur.from(
                CellFilterLerp.from(
                    CellFilterCellMatcher.from(matcher_tag_not_traversable),
                    CellFilterSimplexNoise.from(2, 2),
                    CellFilterLiteralFloat.from(0.15)
                ),
                1.5,
                1.5,
            ),
            0
        )
    ],
    action: MarkerNodeActionEntityPlacement.from(
        {
            blueprint: EntityBlueprint.from([
                Mesh.fromJSON({
                    url: 'data/models/Fantasy Props/chest-wood.gltf',
                    castShadow: true,
                    receiveShadow: true
                }),
                Transform.fromJSON({}),
                GridPosition.fromJSON({}),
                ParticleEmitter.fromJSON({
                    "position": {
                        "x": 106.73611111111111,
                        "y": -6.605019546832523,
                        "z": 161.11111111111111
                    },
                    "scale": {
                        "x": 0.662797212600708,
                        "y": 0.662797212600708,
                        "z": 0.662797212600708
                    },
                    "rotation": {
                        "x": 0.03830398104616067,
                        "y": -0.6227358234290987,
                        "z": 0.07906005037206675,
                        "w": 0.7774846671730987
                    },
                    "parameters": [
                        {
                            "name": "scale",
                            "itemSize": 1,
                            "defaultTrackValue": {
                                "itemSize": 1,
                                "data": [
                                    1
                                ],
                                "positions": [
                                    0
                                ]
                            }
                        },
                        {
                            "name": "color",
                            "itemSize": 4,
                            "defaultTrackValue": {
                                "itemSize": 4,
                                "data": [
                                    1,
                                    1,
                                    1,
                                    1
                                ],
                                "positions": [
                                    0
                                ]
                            }
                        }
                    ],
                    "preWarm": false,
                    "readDepth": true,
                    "softDepth": true,
                    "velocityAlign": true,
                    "blendingMode": 1,
                    "layers": [
                        {
                            "imageURL": "data/textures/particle/UETools/x64/Star_02.png",
                            "particleLife": {
                                "min": 2,
                                "max": 3
                            },
                            "particleSize": {
                                "min": 0.169,
                                "max": 0.338
                            },
                            "particleRotation": {
                                "min": 0,
                                "max": 0
                            },
                            "particleRotationSpeed": {
                                "min": 0,
                                "max": 0
                            },
                            "emissionShape": 0,
                            "emissionFrom": 1,
                            "emissionRate": 4,
                            "emissionImmediate": 0,
                            "parameterTracks": [
                                {
                                    "name": "color",
                                    "track": {
                                        "itemSize": 4,
                                        "data": [
                                            0.9882352948188782,
                                            0.9529411792755127,
                                            0.0117647061124444,
                                            0.01785714365541935,
                                            0.9882352948188782,
                                            0.9529411792755127,
                                            0.0117647061124444,
                                            0.6071428656578064,
                                            0.9764705896377563,
                                            0.9803921580314636,
                                            0.8039215803146362,
                                            0.648809552192688,
                                            0.9764705896377563,
                                            0.9803921580314636,
                                            0.8039215803146362,
                                            0
                                        ],
                                        "positions": [
                                            0,
                                            0.20652173459529877,
                                            0.820652186870575,
                                            1
                                        ]
                                    }
                                }
                            ],
                            "position": {
                                "x": 0,
                                "y": 1,
                                "z": 0
                            },
                            "scale": {
                                "x": 1.7000000476837158,
                                "y": 1,
                                "z": 1.7000000476837158
                            },
                            "particleVelocityDirection": {
                                "direction": {
                                    "x": 0,
                                    "y": 1,
                                    "z": 0
                                },
                                "angle": 0
                            },
                            "particleSpeed": {
                                "min": 0.5,
                                "max": 0.5
                            }
                        },
                        {
                            "imageURL": "data/textures/particle/UETools/x64/Circle_04.png",
                            "particleLife": {
                                "min": 100000000000,
                                "max": 100000000000
                            },
                            "particleSize": {
                                "min": 2.4,
                                "max": 2.4
                            },
                            "particleRotation": {
                                "min": 0,
                                "max": 0
                            },
                            "particleRotationSpeed": {
                                "min": 0,
                                "max": 0
                            },
                            "emissionShape": 3,
                            "emissionFrom": 1,
                            "emissionRate": 0,
                            "emissionImmediate": 1,
                            "parameterTracks": [],
                            "position": {
                                "x": 0,
                                "y": 0.699999988079071,
                                "z": 0
                            },
                            "scale": {
                                "x": 1,
                                "y": 1,
                                "z": 1
                            },
                            "particleVelocityDirection": {
                                "direction": {
                                    "x": 0,
                                    "y": 1,
                                    "z": 0
                                },
                                "angle": 0
                            },
                            "particleSpeed": {
                                "min": 0,
                                "max": 0
                            }
                        }
                    ]
                })
            ]),
            transform: Transform.fromJSON({
                scale: { x: 0.5, y: 0.5, z: 0.5 },
                position: { x: 0, y: 0, z: 0 }
            })
        })
}));


const ebpStartingPoint = new EntityBlueprint();
ebpStartingPoint.add(Mesh.fromJSON({
    url: 'data/models/snaps/cube_green.gltf',
    castShadow: true,
    receiveShadow: true
}));
ebpStartingPoint.add(Transform.fromJSON({}));
ebpStartingPoint.add(GridPosition.fromJSON({}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from(MirMarkerTypes.StartingPoint),
    action: MarkerNodeActionEntityPlacement.from({
        blueprint: ebpStartingPoint,
        transform: Transform.fromJSON({
            scale: { x: 0.5, y: 0.5, z: 0.5 },
            position: { x: 0, y: 0.5, z: 0 }
        })
    })
}));

const bpEnemy = EntityBlueprint.from([
    Mesh.fromJSON({
        url: 'data/models/snaps/cube_red.gltf',
        castShadow: true,
        receiveShadow: true
    }),
    Transform.fromJSON({}),
    GridPosition.fromJSON({}),
    ParticleEmitter.fromJSON({
        "position": {
            "x": 98.68055555555556,
            "y": -8.027018978786145,
            "z": 130.90277777777777
        },
        "scale": {
            "x": 0.7010682225227356,
            "y": 0.7010682225227356,
            "z": 0.7010682225227356
        },
        "rotation": {
            "x": -0.026957150015659802,
            "y": 0.9057820884686629,
            "z": -0.06290001670320629,
            "w": -0.41818142973010747
        },
        "parameters": [
            {
                "name": "scale",
                "itemSize": 1,
                "defaultTrackValue": {
                    "itemSize": 1,
                    "data": [
                        1
                    ],
                    "positions": [
                        0
                    ]
                }
            },
            {
                "name": "color",
                "itemSize": 4,
                "defaultTrackValue": {
                    "itemSize": 4,
                    "data": [
                        1,
                        1,
                        1,
                        1
                    ],
                    "positions": [
                        0
                    ]
                }
            }
        ],
        "preWarm": false,
        "readDepth": true,
        "softDepth": true,
        "velocityAlign": false,
        "blendingMode": 0,
        "layers": [
            {
                "imageURL": "data/textures/particle/UETools/Spiral_08.png",
                "particleLife": {
                    "min": 999999999,
                    "max": 999999999
                },
                "particleSize": {
                    "min": 2,
                    "max": 2
                },
                "particleRotation": {
                    "min": 0,
                    "max": 0
                },
                "particleRotationSpeed": {
                    "min": -1,
                    "max": -1
                },
                "emissionShape": 3,
                "emissionFrom": 1,
                "emissionRate": 0,
                "emissionImmediate": 1,
                "parameterTracks": [
                    {
                        "name": "color",
                        "track": {
                            "itemSize": 4,
                            "data": [
                                1,
                                0.3607843220233917,
                                0.0117647061124444,
                                1
                            ],
                            "positions": [
                                0
                            ]
                        }
                    }
                ],
                "position": {
                    "x": 0,
                    "y": 1,
                    "z": 0
                },
                "scale": {
                    "x": 1,
                    "y": 1,
                    "z": 1
                },
                "particleVelocityDirection": {
                    "direction": {
                        "x": 0,
                        "y": 1,
                        "z": 0
                    },
                    "angle": 0
                },
                "particleSpeed": {
                    "min": 0,
                    "max": 0
                }
            }
        ]
    })
]);

bpEnemy.addJSON(GeneratedArmy, {
    value: '$power'
});

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Enemy'),
    transformers: [
        MarkerNodeTransformerYRotateByFilterGradient.from(
            CellFilterLerp.from(
                CellFilterGaussianBlur.from(
                    CellFilterCellMatcher.from(matcher_tag_not_traversable)
                    ,
                    2,
                    2
                ),
                CellFilterSimplexNoise.from(50, 50),
                CellFilterLiteralFloat.from(0.8)
            ),
            -PI_HALF
        )
    ],
    action: MarkerNodeActionEntityPlacement.from(
        {
            blueprint: bpEnemy,
            transform: Transform.fromJSON({
                scale: { x: 0.3, y: 0.5, z: 0.3 },
                position: { x: 0, y: 0.5, z: 0 }
            })
        }
    )
}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Base'),
    transformers: [MarkerNodeTransformerYRotateByFilter.from(CellFilterSimplexNoise.from(1, 1))],
    action: MarkerNodeActionEntityPlacement.from({
        blueprint: EntityBlueprint.from([
            Mesh.fromJSON({
                url: 'data/models/LowPolyTownshipSet/Large_house/model.gltf',
                dropShadow: true,
                receiveShadow: true
            }),
            Transform.fromJSON({}),
            GridPosition.fromJSON({}),
            SoundEmitter.fromJSON({
                isPositioned: true,
                channel: 'ambient',
                distanceMin: 6,
                distanceMax: 35,
                tracks: [
                    {
                        url: "data/sounds/ambient/Universal Sound FX/AMBIENCES/Villages/AMBIENCES_Medieval_Village_loop_stereo.ogg",
                        loop: true,
                    }
                ]
            })
        ]),
        transform: Transform.fromJSON({
            scale: { x: 2.2, y: 2.2, z: 2.2 },
            position: { x: 0, y: 0, z: 0 }
        })
    })
}));

const ebpRoadJunction90 = new EntityBlueprint();
ebpRoadJunction90.add(Mesh.fromJSON({
    url: 'data/models/snaps/cube_blue.gltf',
    dropShadow: true,
    receiveShadow: true
}));
ebpRoadJunction90.add(Transform.fromJSON({}));
ebpRoadJunction90.add(GridPosition.fromJSON({}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Road Junction Decorator 90'),
    action: MarkerNodeActionEntityPlacement.from({
        blueprint: ebpRoadJunction90,
        transform: Transform.fromJSON({
            scale: { x: 0.1, y: 1, z: 0.1 },
            position: { x: 0, y: 1, z: 0 }
        })
    })
}));

const ebpBuffObject0 = new EntityBlueprint();
ebpBuffObject0.add(Mesh.fromJSON({
    url: 'data/models/snaps/cube_white.gltf',
    dropShadow: true,
    receiveShadow: true
}));
ebpBuffObject0.add(new Tag());
ebpBuffObject0.add(new HeadsUpDisplay());
ebpBuffObject0.add(new ViewportPosition());
ebpBuffObject0.add(GUIElement.fromJSON({
    parameters: {
        id: 'Attack',
        classList: "__debug-plaque"
    },
    klass: 'view.LocalizedLabel'
}));
ebpBuffObject0.add(Transform.fromJSON({}));
ebpBuffObject0.add(GridPosition.fromJSON({}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Buff Object :: Attack Power Increase'),
    action: MarkerNodeActionEntityPlacement.from({
        blueprint: ebpBuffObject0,
        transform: Transform.fromJSON({
            scale: { x: 0.4, y: 1, z: 0.4 },
            position: { x: 0, y: 1, z: 0 }
        })
    })
}));

const ebpBuffObjectDefense = new EntityBlueprint();
ebpBuffObjectDefense.add(Mesh.fromJSON({
    url: 'data/models/snaps/cube_white.gltf',
    dropShadow: true,
    receiveShadow: true
}));
ebpBuffObjectDefense.add(new Tag());
ebpBuffObjectDefense.add(new HeadsUpDisplay());
ebpBuffObjectDefense.add(new ViewportPosition());
ebpBuffObjectDefense.add(GUIElement.fromJSON({
    parameters: {
        id: 'Defense',
        classList: "__debug-plaque"
    },
    klass: 'view.LocalizedLabel'
}));
ebpBuffObjectDefense.add(Transform.fromJSON({}));
ebpBuffObjectDefense.add(GridPosition.fromJSON({}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Buff Object :: Defense Increase'),
    action: MarkerNodeActionEntityPlacement.from({
        blueprint: ebpBuffObjectDefense,
        transform: Transform.fromJSON({
            scale: { x: 0.4, y: 1, z: 0.4 },
            position: { x: 0, y: 1, z: 0 }
        })
    })
}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Buff Object :: Well'),
    transformers: [
        MarkerNodeTransformerYRotateByFilter.from(CellFilterSimplexNoise.from(1.1, 1.1))
    ],
    action: MarkerNodeActionEntityPlacement.from(
        {
            blueprint: EntityBlueprint.from([
                Mesh.fromJSON({
                    url: 'data/models/LowPolyTownshipSet/Well/model.gltf',
                    dropShadow: true,
                    receiveShadow: true
                }),
                Transform.fromJSON({}),
                GridPosition.fromJSON({}),
                new Tag(),
                new HeadsUpDisplay(),
                new ViewportPosition(),
                GUIElement.fromJSON({
                    parameters: {
                        id: 'Well',
                        classList: "__debug-plaque"
                    },
                    klass: 'view.LocalizedLabel'
                }),
                ParticleEmitter.fromJSON({
                    "position": {
                        "x": 92.47767720491711,
                        "y": -6.869804537333128,
                        "z": 237.8283880265284
                    },
                    "scale": {
                        "x": 0.0037936652079224586,
                        "y": 0.0037936652079224586,
                        "z": 0.0037936652079224586
                    },
                    "rotation": {
                        "x": -0.0006912089747605077,
                        "y": 0.30620557581890523,
                        "z": -0.0006912089747605077,
                        "w": 0.9519649099613489
                    },
                    "parameters": [
                        {
                            "name": "scale",
                            "itemSize": 1,
                            "defaultTrackValue": {
                                "itemSize": 1,
                                "data": [
                                    1
                                ],
                                "positions": [
                                    0
                                ]
                            }
                        },
                        {
                            "name": "color",
                            "itemSize": 4,
                            "defaultTrackValue": {
                                "itemSize": 4,
                                "data": [
                                    1,
                                    1,
                                    1,
                                    1
                                ],
                                "positions": [
                                    0
                                ]
                            }
                        }
                    ],
                    "preWarm": false,
                    "readDepth": true,
                    "softDepth": true,
                    "velocityAlign": false,
                    "blendingMode": 1,
                    "layers": [
                        {
                            "imageURL": "data/textures/particle/travnik/glowing_sphere2/glowing_sphere_64.png",
                            "particleLife": {
                                "min": 3,
                                "max": 5
                            },
                            "particleSize": {
                                "min": 0.1,
                                "max": 0.2
                            },
                            "particleRotation": {
                                "min": 0,
                                "max": 0
                            },
                            "particleRotationSpeed": {
                                "min": 0,
                                "max": 0
                            },
                            "emissionShape": 0,
                            "emissionFrom": 1,
                            "emissionRate": 3,
                            "emissionImmediate": 0,
                            "parameterTracks": [
                                {
                                    "name": "color",
                                    "track": {
                                        "itemSize": 4,
                                        "data": [
                                            0.01568627543747425,
                                            0.5215686559677124,
                                            0.9882352948188782,
                                            0,
                                            0.01568627543747425,
                                            0.5215686559677124,
                                            0.9882352948188782,
                                            0.9900000095367432,
                                            0.01568627543747425,
                                            0.5215686559677124,
                                            0.9882352948188782,
                                            0.5450000166893005,
                                            0.01568627543747425,
                                            0.5215686559677124,
                                            0.9882352948188782,
                                            0.004999999888241291
                                        ],
                                        "positions": [
                                            0,
                                            0.336448609828949,
                                            0.8177570104598999,
                                            1
                                        ]
                                    }
                                },
                                {
                                    "name": "scale",
                                    "track": {
                                        "itemSize": 1,
                                        "data": [
                                            0.9993333220481873
                                        ],
                                        "positions": [
                                            0.5
                                        ]
                                    }
                                }
                            ],
                            "position": {
                                "x": 0,
                                "y": 300,
                                "z": 0
                            },
                            "scale": {
                                "x": 300,
                                "y": 300,
                                "z": 300
                            },
                            "particleVelocityDirection": {
                                "direction": {
                                    "x": 0,
                                    "y": 1,
                                    "z": 0
                                },
                                "angle": 3
                            },
                            "particleSpeed": {
                                "min": 0.03,
                                "max": 0.1
                            }
                        }
                    ]
                })
            ]),
            transform: Transform.fromJSON({
                scale: { x: 0.005, y: 0.005, z: 0.005 },
                position: { x: 0, y: 0, z: 0 }
            })
        })
}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Buff Object :: Campfire'),
    action: MarkerNodeActionEntityPlacement.from(
        {
            blueprint: EntityBlueprint.from([
                Mesh.fromJSON({
                    url: 'data/models/MOBA and Tower Defense/Campfire.gltf',
                    dropShadow: true,
                    receiveShadow: true
                }),
                new HeadsUpDisplay(),
                new ViewportPosition(),
                GUIElement.fromJSON({
                    parameters: {
                        id: 'Campfire',
                        classList: "__debug-plaque"
                    },
                    klass: 'view.LocalizedLabel'
                }),
                Transform.fromJSON({}),
                GridPosition.fromJSON({}),
                ParticleEmitter.fromJSON({
                    "position": {
                        "x": 62.6424314119665,
                        "y": -6.534322529929943,
                        "z": 245.9431982357952
                    },
                    "scale": {
                        "x": 0.8654883503913879,
                        "y": 0.8654883503913879,
                        "z": 0.8654883503913879
                    },
                    "rotation": {
                        "x": 0.03248682181374386,
                        "y": -0.1403154218763832,
                        "z": 0.07395936029937433,
                        "w": 0.9868060608935284
                    },
                    "parameters": [
                        {
                            "name": "scale",
                            "itemSize": 1,
                            "defaultTrackValue": {
                                "itemSize": 1,
                                "data": [
                                    1
                                ],
                                "positions": [
                                    0
                                ]
                            }
                        },
                        {
                            "name": "color",
                            "itemSize": 4,
                            "defaultTrackValue": {
                                "itemSize": 4,
                                "data": [
                                    1,
                                    1,
                                    1,
                                    1
                                ],
                                "positions": [
                                    0
                                ]
                            }
                        }
                    ],
                    "preWarm": true,
                    "readDepth": true,
                    "softDepth": true,
                    "velocityAlign": false,
                    "blendingMode": 0,
                    "layers": [
                        {
                            "imageURL": "data/textures/particle/UETools/x64/Smoke_14.png",
                            "particleLife": {
                                "min": 6,
                                "max": 7
                            },
                            "particleSize": {
                                "min": 0.23,
                                "max": 0.23
                            },
                            "particleRotation": {
                                "min": 0,
                                "max": 6.3
                            },
                            "particleRotationSpeed": {
                                "min": 0,
                                "max": 0
                            },
                            "emissionShape": 3,
                            "emissionFrom": 1,
                            "emissionRate": 2,
                            "emissionImmediate": 0,
                            "parameterTracks": [
                                {
                                    "name": "scale",
                                    "track": {
                                        "itemSize": 1,
                                        "data": [
                                            2,
                                            2.5999999046325684,
                                            2.9000000953674316
                                        ],
                                        "positions": [
                                            0,
                                            0.5,
                                            1
                                        ]
                                    }
                                },
                                {
                                    "name": "color",
                                    "track": {
                                        "itemSize": 4,
                                        "data": [
                                            0.15294118225574493,
                                            0.15294118225574493,
                                            0.15294118225574493,
                                            0,
                                            0.364705890417099,
                                            0.364705890417099,
                                            0.364705890417099,
                                            0.4821428656578064,
                                            0.4117647111415863,
                                            0.4117647111415863,
                                            0.4117647111415863,
                                            0.3392857015132904,
                                            0.47058823704719543,
                                            0.47058823704719543,
                                            0.47058823704719543,
                                            0.125,
                                            0.6666666865348816,
                                            0.6666666865348816,
                                            0.6666666865348816,
                                            0
                                        ],
                                        "positions": [
                                            0,
                                            0.15217390656471252,
                                            0.5,
                                            0.875,
                                            1
                                        ]
                                    }
                                }
                            ],
                            "position": {
                                "x": 0,
                                "y": 0,
                                "z": 0
                            },
                            "scale": {
                                "x": 1,
                                "y": 1,
                                "z": 1
                            },
                            "particleVelocityDirection": {
                                "direction": {
                                    "x": 0,
                                    "y": 1,
                                    "z": 0
                                },
                                "angle": 0.17481119672686515
                            },
                            "particleSpeed": {
                                "min": 0.315,
                                "max": 0.48500000000000004
                            }
                        }
                    ]
                })
            ]),
            transform: Transform.fromJSON({
                scale: { x: 1, y: 1, z: 1 },
                position: { x: 0, y: 0, z: 0 }
            })
        })
}));

const filterAridArea = CellFilterClamp.from(
    CellFilterInverseLerp.from(
        CellFilterLiteralFloat.from(0.5),
        CellFilterLiteralFloat.from(0.1),
        SampleGroundMoistureFilter
    ),
    CellFilterLiteralFloat.from(0),
    CellFilterLiteralFloat.from(1)
);

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Tree-Flatland-Large'),
    action: MarkerNodeActionSelectWeighted.from([
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Tree_01.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 23, y: 23, z: 23 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterSimplexNoise.from(30, 30, 1000)
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Tree_02.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 21, y: 21, z: 21 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterSimplexNoise.from(30, 30, 8000512)
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Tree_03.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 20, y: 20, z: 20 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterMultiply.from(
                CellFilterSimplexNoise.from(37, 30, 5817512),
                filterAridArea
            )
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Tree_04.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 27, y: 27, z: 27 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterSimplexNoise.from(30, 33, 23985417)
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Tree_05.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 24, y: 24, z: 24 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterMultiply.from(
                CellFilterSimplexNoise.from(27, 33, 7512839),
                filterAridArea
            )
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Tree_06.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 20, y: 20, z: 20 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterSimplexNoise.from(27, 33, 681230)
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Tree_07.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 22, y: 22, z: 22 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterMultiply.from(
                CellFilterSimplexNoise.from(27, 33, 9124715712),
                filterAridArea
            )
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Tree_08.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 23, y: 23, z: 23 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterSimplexNoise.from(27, 33, 1581273)
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Tree_09.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 26, y: 26, z: 26 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterSimplexNoise.from(27, 33, 1912851723)
        )
    ])
}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Tree-Flatland-Small'),
    action: MarkerNodeActionSelectWeighted.from([
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Tree_Small_01.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 32, y: 32, z: 32 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterSimplexNoise.from(30, 30, 1000)
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Tree_Small_02.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 31, y: 31, z: 31 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterSimplexNoise.from(30, 30, 8000512)
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Tree_Small_03.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 31, y: 31, z: 31 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterMultiply.from(
                CellFilterSimplexNoise.from(27, 33, 9124715712),
                filterAridArea
            )
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Tree_Small_04.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 27, y: 27, z: 27 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterSimplexNoise.from(30, 33, 23985417)
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Tree_Small_05.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 24, y: 24, z: 24 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterSimplexNoise.from(27, 33, 7512839)
        )
    ])
}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Tree-1'),
    action: MarkerNodeActionEntityPlacement.from(
        {
            blueprint: EntityBlueprint.from([
                Mesh.fromJSON({
                    url: 'data/models/LowPolyTownshipSet/Tree_1/Tree_1.gltf',
                    dropShadow: true,
                    receiveShadow: true
                }),
                Transform.fromJSON({}),
                new ClingToTerrain()
            ]),
            transform: Transform.fromJSON({
                scale: { x: 1, y: 1, z: 1 },
                position: { x: 0, y: 0, z: 0 }
            })
        })
}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Mushroom-0'),
    action: MarkerNodeActionSelectWeighted.from([
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Mushroom3B.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 1.41, y: 1.41, z: 1.41 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterMultiply.from(
                CellFilterSimplexNoise.from(20, 20, 507),
                CellFilterSimplexNoise.from(30, 30, 1000)
            )
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Mushroom4B.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 2.2, y: 2.2, z: 2.2 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterSimplexNoise.from(30, 30, 10050)
        )
    ]),
    transformers: [
        MarkerNodeTransformerYRotateByFilter.from(CellFilterSimplexNoise.from(1.1, 1.1))
    ]
}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Mushroom-1'),
    action: MarkerNodeActionSelectWeighted.from([
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Mushroom3A.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 1, y: 1, z: 1 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterMultiply.from(
                CellFilterSimplexNoise.from(20, 20, 507),
                CellFilterSimplexNoise.from(30, 30, 1000)
            )
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/MOBA and Tower Defense/Mushroom4A.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        new ClingToTerrain()
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 1.3, y: 1.3, z: 1.3 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterSimplexNoise.from(30, 30, 10050)
        )
    ]),
    transformers: [
        MarkerNodeTransformerYRotateByFilter.from(CellFilterSimplexNoise.from(1.1, 1.1))
    ]
}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Stone-0'),
    action: MarkerNodeActionSelectWeighted.from([
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/LowPolyTownshipSet/Rocks/Rock_1.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        ClingToTerrain.fromJSON({
                            normalAlign: true
                        })
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 10, y: 10, z: 10 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterLiteralFloat.from(1)
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/LowPolyTownshipSet/Rocks/Rock_2.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        ClingToTerrain.fromJSON({
                            normalAlign: true
                        })
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 12, y: 12, z: 12 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterLiteralFloat.from(2)
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/LowPolyTownshipSet/Rocks/Rock_3.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        ClingToTerrain.fromJSON({
                            normalAlign: true
                        })
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 12, y: 12, z: 12 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterLiteralFloat.from(0.7)
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                {
                    blueprint: EntityBlueprint.from([
                        Mesh.fromJSON({
                            url: 'data/models/LowPolyTownshipSet/Rocks/Rock_4.gltf',
                            dropShadow: true,
                            receiveShadow: true
                        }),
                        Transform.fromJSON({}),
                        ClingToTerrain.fromJSON({
                            normalAlign: true
                        })
                    ]),
                    transform: Transform.fromJSON({
                        scale: { x: 12, y: 12, z: 12 },
                        position: { x: 0, y: 0, z: 0 }
                    })
                }),
            CellFilterLiteralFloat.from(1)
        )
    ]),
    transformers: [
        MarkerNodeTransformerYRotateByFilter.from(CellFilterSimplexNoise.from(1.1, 1.1))
    ]
}));


//HEIGHT
// ====================

const aHeight = new ContinuousGridCellActionSetTerrainHeight();

aHeight.target = CellFilterReadGridLayer.from(MirGridLayers.Heights);

SampleTheme0.cells.add(CellProcessingRule.from(
    CellFilterLiteralFloat.from(1),
    aHeight
))
