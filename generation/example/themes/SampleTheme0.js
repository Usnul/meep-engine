import { Theme } from "../../theme/Theme.js";
import { TerrainTheme } from "../../theme/TerrainTheme.js";
import { TerrainLayerRule } from "../../theme/TerrainLayerRule.js";
import { MarkerProcessingRule } from "../../markers/actions/MarkerProcessingRule.js";
import { MarkerNodeMatcherByType } from "../../markers/matcher/MarkerNodeMatcherByType.js";
import { MarkerNodeActionEntityPlacement } from "../../markers/actions/MarkerNodeActionEntityPlacement.js";
import { EntityBlueprint } from "../../../engine/ecs/EntityBlueprint.js";
import Mesh from "../../../engine/graphics/ecs/mesh/Mesh.js";
import { Transform } from "../../../engine/ecs/components/Transform.js";
import GridPosition from "../../../engine/grid/components/GridPosition.js";
import { matcher_tag_not_traversable } from "../rules/matcher_tag_not_traversable.js";
import { CellMatcherLayerBitMaskTest } from "../../rules/CellMatcherLayerBitMaskTest.js";
import { GridTags } from "../../GridTags.js";
import { CellFilterCellMatcher } from "../../filtering/CellFilterCellMatcher.js";
import { CellFilterSimplexNoise } from "../../filtering/complex/CellFilterSimplexNoise.js";
import { CellFilterFXAA } from "../../filtering/complex/CellFilterFXAA.js";
import { CellFilterMultiply } from "../../filtering/math/algebra/CellFilterMultiply.js";
import { CellFilterLerp } from "../../filtering/math/CellFilterLerp.js";
import { CellFilterConstant } from "../../filtering/core/CellFilterConstant.js";
import Tag from "../../../engine/ecs/components/Tag.js";
import HeadsUpDisplay from "../../../engine/ecs/gui/hud/HeadsUpDisplay.js";
import ViewportPosition from "../../../engine/ecs/gui/ViewportPosition.js";
import GUIElement from "../../../engine/ecs/gui/GUIElement.js";
import { MarkerNodeTransformerYRotateByFilterGradient } from "../../markers/transform/MarkerNodeTransformerYRotateByFilterGradient.js";
import { PI_HALF } from "../../../core/math/MathUtils.js";
import { CellFilterGaussianBlur } from "../../filtering/complex/CellFilterGaussianBlur.js";
import { CellProcessingRule } from "../../theme/cell/CellProcessingRule.js";
import { ContinuousGridCellActionSetTerrainHeight } from "../../grid/actions/ContinuousGridCellActionSetTerrainHeight.js";
import { MirGridLayers } from "../grid/MirGridLayers.js";
import { CellFilterReadGridLayer } from "../../filtering/CellFilterReadGridLayer.js";
import ClingToTerrain from "../../../engine/ecs/terrain/ecs/ClingToTerrain.js";
import { MarkerNodeTransformerYRotateByFilter } from "../../markers/transform/MarkerNodeTransformerYRotateByFilter.js";
import { CellFilterAngleToNormal } from "../../filtering/complex/CellFilterAngleToNormal.js";
import Vector3 from "../../../core/geom/Vector3.js";
import { CellFilterClamp } from "../../filtering/math/CellFilterClamp.js";
import { CellFilterOneMinus } from "../../filtering/math/CellFilterOneMinus.js";
import { CellFilterSmoothStep } from "../../filtering/math/CellFilterSmoothStep.js";
import { CellFilterInverseLerp } from "../../filtering/math/CellFilterInverseLerp.js";
import { CellFilterAdd } from "../../filtering/math/algebra/CellFilterAdd.js";
import { CellFilterNegate } from "../../filtering/math/algebra/CellFilterNegate.js";
import { MarkerNodeActionWeightedElement } from "../../markers/actions/probability/MarkerNodeActionWeightedElement.js";
import { MarkerNodeActionSelectWeighted } from "../../markers/actions/probability/MarkerNodeActionSelectWeighted.js";

export const SampleTheme0 = new Theme();

const terrainTheme = new TerrainTheme();

const matcher_tag_road = CellMatcherLayerBitMaskTest.from(GridTags.Road, MirGridLayers.Tags);

const filterMoisture = CellFilterReadGridLayer.from(MirGridLayers.Moisture);

const filterRock = CellFilterClamp.from(
    CellFilterSmoothStep.from(
        CellFilterConstant.from(Math.PI / 2.2),
        CellFilterConstant.from(Math.PI / 2),
        CellFilterAngleToNormal.from(
            CellFilterReadGridLayer.from(MirGridLayers.Heights),
            Vector3.forward
        )
    ),
    CellFilterConstant.from(0),
    CellFilterConstant.from(1),
);

const NOISE_10_a = CellFilterSimplexNoise.from(30, 30);

const ROAD_FILTER = CellFilterCellMatcher.from(matcher_tag_road);
const ROAD_FILTER_AA = CellFilterFXAA.from(ROAD_FILTER);

const filterRoad = CellFilterGaussianBlur.from(
    CellFilterMultiply.from(
        ROAD_FILTER_AA,
        CellFilterLerp.from(
            CellFilterConstant.from(0.6),
            CellFilterConstant.from(1),
            NOISE_10_a
        )
    ),
    1.2,
    1.2
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
                    CellFilterConstant.from(0),
                    CellFilterConstant.from(0.2),
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
                        CellFilterConstant.from(0),
                        CellFilterConstant.from(0.15),
                        filterMoisture
                    ),
                    CellFilterConstant.from(0),
                    CellFilterConstant.from(1)
                )
            )
        ),
        CellFilterConstant.from(0),
        CellFilterConstant.from(1)
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
        CellFilterLerp.from(CellFilterConstant.from(1), CellFilterConstant.from(0.3), NOISE_10_a)
    ),
    TERRAIN_LAYER_GRASS,
));

SampleTheme0.terrain = terrainTheme;

const ebpTreasure = new EntityBlueprint();
ebpTreasure.add(Mesh.fromJSON({
    url: 'data/models/Fantasy Props/chest-wood.gltf',
    castShadow: true,
    receiveShadow: true
}));
ebpTreasure.add(Transform.fromJSON({}));
ebpTreasure.add(GridPosition.fromJSON({}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Treasure'),
    transformers: [
        MarkerNodeTransformerYRotateByFilterGradient.from(
            CellFilterGaussianBlur.from(
                CellFilterLerp.from(
                    CellFilterCellMatcher.from(matcher_tag_not_traversable),
                    CellFilterSimplexNoise.from(2, 2),
                    CellFilterConstant.from(0.15)
                ),
                1.5,
                1.5,
            ),
            0
        )
    ],
    action: MarkerNodeActionEntityPlacement.from(ebpTreasure, Transform.fromJSON({
        scale: { x: 0.5, y: 0.5, z: 0.5 },
        position: { x: 0, y: 0, z: 0 }
    }))
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
    matcher: MarkerNodeMatcherByType.from('Starting Point'),
    action: MarkerNodeActionEntityPlacement.from(ebpStartingPoint, Transform.fromJSON({
        scale: { x: 0.5, y: 0.5, z: 0.5 },
        position: { x: 0, y: 0.5, z: 0 }
    }))
}));

const ebpEnemy = new EntityBlueprint();
ebpEnemy.add(Mesh.fromJSON({ url: 'data/models/snaps/cube_red.gltf', castShadow: true, receiveShadow: true }));
ebpEnemy.add(Transform.fromJSON({}));
ebpEnemy.add(GridPosition.fromJSON({}));

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
                CellFilterConstant.from(0.8)
            ),
            -PI_HALF
        )
    ],
    action: MarkerNodeActionEntityPlacement.from(ebpEnemy, Transform.fromJSON({
        scale: { x: 0.3, y: 0.5, z: 0.3 },
        position: { x: 0, y: 0.5, z: 0 }
    }))
}));

const ebpBase = new EntityBlueprint();
ebpBase.add(Mesh.fromJSON({
    url: 'data/models/LowPolyTownshipSet/Large_house/model.gltf',
    dropShadow: true,
    receiveShadow: true
}));
ebpBase.add(Transform.fromJSON({}));
ebpBase.add(GridPosition.fromJSON({}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Base'),
    transformers: [MarkerNodeTransformerYRotateByFilter.from(CellFilterSimplexNoise.from(1, 1))],
    action: MarkerNodeActionEntityPlacement.from(ebpBase, Transform.fromJSON({
        scale: { x: 2.2, y: 2.2, z: 2.2 },
        position: { x: 0, y: 0, z: 0 }
    }))
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
    action: MarkerNodeActionEntityPlacement.from(ebpRoadJunction90, Transform.fromJSON({
        scale: { x: 0.1, y: 1, z: 0.1 },
        position: { x: 0, y: 1, z: 0 }
    }))
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
    action: MarkerNodeActionEntityPlacement.from(ebpBuffObject0, Transform.fromJSON({
        scale: { x: 0.4, y: 1, z: 0.4 },
        position: { x: 0, y: 1, z: 0 }
    }))
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
    action: MarkerNodeActionEntityPlacement.from(ebpBuffObjectDefense, Transform.fromJSON({
        scale: { x: 0.4, y: 1, z: 0.4 },
        position: { x: 0, y: 1, z: 0 }
    }))
}));

const ebpBuffObjectWell = new EntityBlueprint();
ebpBuffObjectWell.add(Mesh.fromJSON({
    url: 'data/models/LowPolyTownshipSet/Well/model.gltf',
    dropShadow: true,
    receiveShadow: true
}));
ebpBuffObjectWell.add(new Tag());
ebpBuffObjectWell.add(new HeadsUpDisplay());
ebpBuffObjectWell.add(new ViewportPosition());
ebpBuffObjectWell.add(GUIElement.fromJSON({
    parameters: {
        id: 'Well',
        classList: "__debug-plaque"
    },
    klass: 'view.LocalizedLabel'
}));
ebpBuffObjectWell.add(Transform.fromJSON({}));
ebpBuffObjectWell.add(GridPosition.fromJSON({}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Buff Object :: Well'),
    transformers: [
        MarkerNodeTransformerYRotateByFilter.from(CellFilterSimplexNoise.from(1.1, 1.1))
    ],
    action: MarkerNodeActionEntityPlacement.from(ebpBuffObjectWell, Transform.fromJSON({
        scale: { x: 0.005, y: 0.005, z: 0.005 },
        position: { x: 0, y: 0, z: 0 }
    }))
}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Buff Object :: Campfire'),
    action: MarkerNodeActionEntityPlacement.from(
        EntityBlueprint.from([
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
            GridPosition.fromJSON({})
        ]),
        Transform.fromJSON({
            scale: { x: 1, y: 1, z: 1 },
            position: { x: 0, y: 0, z: 0 }
        }))
}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Tree-0'),
    action: MarkerNodeActionEntityPlacement.from(
        EntityBlueprint.from([
            Mesh.fromJSON({
                url: 'data/models/LowPolyTownshipSet/Tree_2/Tree_2.gltf',
                dropShadow: true,
                receiveShadow: true
            }),
            Transform.fromJSON({}),
            new ClingToTerrain()
        ]),
        Transform.fromJSON({
            scale: { x: 1.2, y: 1.2, z: 1.2 },
            position: { x: 0, y: 0, z: 0 }
        }))
}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Tree-1'),
    action: MarkerNodeActionEntityPlacement.from(
        EntityBlueprint.from([
            Mesh.fromJSON({
                url: 'data/models/LowPolyTownshipSet/Tree_1/Tree_1.gltf',
                dropShadow: true,
                receiveShadow: true
            }),
            Transform.fromJSON({}),
            new ClingToTerrain()
        ]),
        Transform.fromJSON({
            scale: { x: 1, y: 1, z: 1 },
            position: { x: 0, y: 0, z: 0 }
        }))
}));

SampleTheme0.nodes.add(MarkerProcessingRule.from({
    matcher: MarkerNodeMatcherByType.from('Mushroom-0'),
    action: MarkerNodeActionSelectWeighted.from([
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                EntityBlueprint.from([
                    Mesh.fromJSON({
                        url: 'data/models/MOBA and Tower Defense/Mushroom3B.gltf',
                        dropShadow: true,
                        receiveShadow: true
                    }),
                    Transform.fromJSON({}),
                    new ClingToTerrain()
                ]),
                Transform.fromJSON({
                    scale: { x: 1.41, y: 1.41, z: 1.41 },
                    position: { x: 0, y: 0, z: 0 }
                })),
            CellFilterMultiply.from(
                CellFilterSimplexNoise.from(20, 20, 507),
                CellFilterSimplexNoise.from(30, 30, 1000)
            )
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                EntityBlueprint.from([
                    Mesh.fromJSON({
                        url: 'data/models/MOBA and Tower Defense/Mushroom4B.gltf',
                        dropShadow: true,
                        receiveShadow: true
                    }),
                    Transform.fromJSON({}),
                    new ClingToTerrain()
                ]),
                Transform.fromJSON({
                    scale: { x: 2.2, y: 2.2, z: 2.2 },
                    position: { x: 0, y: 0, z: 0 }
                })),
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
                EntityBlueprint.from([
                    Mesh.fromJSON({
                        url: 'data/models/MOBA and Tower Defense/Mushroom3A.gltf',
                        dropShadow: true,
                        receiveShadow: true
                    }),
                    Transform.fromJSON({}),
                    new ClingToTerrain()
                ]),
                Transform.fromJSON({
                    scale: { x: 1, y: 1, z: 1 },
                    position: { x: 0, y: 0, z: 0 }
                })),
            CellFilterMultiply.from(
                CellFilterSimplexNoise.from(20, 20, 507),
                CellFilterSimplexNoise.from(30, 30, 1000)
            )
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                EntityBlueprint.from([
                    Mesh.fromJSON({
                        url: 'data/models/MOBA and Tower Defense/Mushroom4A.gltf',
                        dropShadow: true,
                        receiveShadow: true
                    }),
                    Transform.fromJSON({}),
                    new ClingToTerrain()
                ]),
                Transform.fromJSON({
                    scale: { x: 1.3, y: 1.3, z: 1.3 },
                    position: { x: 0, y: 0, z: 0 }
                })),
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
                EntityBlueprint.from([
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
                Transform.fromJSON({
                    scale: { x: 10, y: 10, z: 10 },
                    position: { x: 0, y: 0, z: 0 }
                })),
            CellFilterConstant.from(1)
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                EntityBlueprint.from([
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
                Transform.fromJSON({
                    scale: { x: 12, y: 12, z: 12 },
                    position: { x: 0, y: 0, z: 0 }
                })),
            CellFilterConstant.from(1)
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                EntityBlueprint.from([
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
                Transform.fromJSON({
                    scale: { x: 12, y: 12, z: 12 },
                    position: { x: 0, y: 0, z: 0 }
                })),
            CellFilterConstant.from(1)
        ),
        MarkerNodeActionWeightedElement.from(
            MarkerNodeActionEntityPlacement.from(
                EntityBlueprint.from([
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
                Transform.fromJSON({
                    scale: { x: 12, y: 12, z: 12 },
                    position: { x: 0, y: 0, z: 0 }
                })),
            CellFilterConstant.from(1)
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
    CellFilterConstant.from(1),
    aHeight
))
