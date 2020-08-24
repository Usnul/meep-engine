import { GridGenerator } from "../GridGenerator.js";
import { GridCellPlacementRule } from "../placement/GridCellPlacementRule.js";
import { CellMatcherGridPattern } from "../rules/cell/CellMatcherGridPattern.js";
import { CellMatcherLayerBitMaskTest } from "../rules/CellMatcherLayerBitMaskTest.js";
import { GridTags } from "../GridTags.js";
import { CellMatcherNot } from "../rules/logic/CellMatcherNot.js";
import { GridCellActionPlaceMarker } from "../markers/GridCellActionPlaceMarker.js";
import { GridTaskCellularAutomata } from "../grid/generation/discrete/GridTaskCellularAutomata.js";
import { GridTaskActionRuleSet } from "../grid/generation/discrete/GridTaskCellActionRuleSet.js";
import { GridActionRuleSet } from "../markers/GridActionRuleSet.js";
import { GridTaskBuildSourceDistanceMap } from "../grid/generation/discrete/layer/GridTaskBuildSourceDistanceMap.js";
import { CellMatcherAnd } from "../rules/logic/CellMatcherAnd.js";
import { GridCellActionPlaceTags } from "../placement/action/GridCellActionPlaceTags.js";
import { CellMatcherContainsMarkerWithinRadius } from "../rules/cell/CellMatcherContainsMarkerWithinRadius.js";
import { mir_matcher_attack_corridor } from "./rules/mir_matcher_attack_corridor.js";
import { mir_generator_place_bases } from "./generators/mir_generator_place_bases.js";
import { matcher_tag_traversable_unoccupied } from "./rules/matcher_tag_traversable_unoccupied.js";
import { mir_generator_place_starting_point } from "./generators/mir_generator_place_starting_point.js";
import { GridTaskConnectRooms } from "../grid/generation/discrete/GridTaskConnectRooms.js";
import { matcher_tag_traversable } from "./rules/matcher_tag_traversable.js";
import { GridTaskGenerateRoads } from "../grid/generation/road/GridTaskGenerateRoads.js";
import { mir_generator_place_road_decorators } from "./generators/mir_generator_place_road_decorators.js";
import { MarkerNodeMatcherByType } from "../markers/matcher/MarkerNodeMatcherByType.js";
import { mir_generator_place_buff_objects } from "./generators/mir_generator_place_buff_objects.js";
import { GridTaskDensityMarkerDistribution } from "../grid/generation/GridTaskDensityMarkerDistribution.js";
import { CellFilterSimplexNoise } from "../filtering/numeric/complex/CellFilterSimplexNoise.js";
import { NumericInterval } from "../../core/math/interval/NumericInterval.js";
import { CellFilterMultiply } from "../filtering/numeric/math/algebra/CellFilterMultiply.js";
import { CellFilterCellMatcher } from "../filtering/CellFilterCellMatcher.js";
import { CellFilterLiteralFloat } from "../filtering/numeric/CellFilterLiteralFloat.js";
import { MirGridLayers } from "./grid/MirGridLayers.js";
import { CellFilterLerp } from "../filtering/numeric/math/CellFilterLerp.js";
import { GridCellActionWriteFilterToLayer } from "../placement/action/GridCellActionWriteFilterToLayer.js";
import { CellMatcherAny } from "../rules/CellMatcherAny.js";
import { CellFilterGaussianBlur } from "../filtering/numeric/complex/CellFilterGaussianBlur.js";
import { GridCellActionSequence } from "../placement/action/util/GridCellActionSequence.js";
import { CellFilterStep } from "../filtering/numeric/math/CellFilterStep.js";
import { CellFilterReadGridLayer } from "../filtering/numeric/CellFilterReadGridLayer.js";
import { CellFilterAngleToNormal } from "../filtering/numeric/complex/CellFilterAngleToNormal.js";
import Vector3 from "../../core/geom/Vector3.js";
import { CellFilterOneMinus } from "../filtering/numeric/math/CellFilterOneMinus.js";
import { CellFilterSmoothStep } from "../filtering/numeric/math/CellFilterSmoothStep.js";
import { SampleNoise20_0 } from "./filters/SampleNoise20_0.js";
import { SampleGroundMoistureFilter } from "./filters/SampleGroundMoistureFilter.js";
import { GridTaskSequence } from "../grid/generation/GridTaskSequence.js";
import { CellFilterSubtract } from "../filtering/numeric/math/algebra/CellFilterSubtract.js";
import { CellFilterCache } from "../filtering/numeric/CellFilterCache.js";
import { CellFilterInverseLerp } from "../filtering/numeric/math/CellFilterInverseLerp.js";
import { CellFilterClamp } from "../filtering/numeric/math/CellFilterClamp.js";
import { MarkerNodeTransformerYRotateByFilter } from "../markers/transform/MarkerNodeTransformerYRotateByFilter.js";
import { GridPatternMatcherCell } from "../rules/cell/GridPatternMatcherCell.js";
import { MarkerNodeTransformerRecordProperty } from "../markers/transform/MarkerNodeTransformerRecordProperty.js";
import { CellFilterAdd } from "../filtering/numeric/math/algebra/CellFilterAdd.js";
import { CellFilterDivide } from "../filtering/numeric/math/algebra/CellFilterDivide.js";
import { CellFilterCubicFunction } from "../filtering/numeric/math/poly/CellFilterCubicFunction.js";
import { CellFilterMax2 } from "../filtering/numeric/math/CellFilterMax2.js";
import { matcher_not_play_area } from "./rules/matcher_not_play_area.js";

export const SampleGenerator0 = new GridGenerator();


const pTreasureCorner = new CellMatcherGridPattern();

const MATCH_EMPTY = CellMatcherLayerBitMaskTest.from(GridTags.Traversable, MirGridLayers.Tags);
const MATCH_TREASURE = CellMatcherLayerBitMaskTest.from(GridTags.Treasure, MirGridLayers.Tags);
const MATCH_NOT_EMPTY = CellMatcherNot.from(MATCH_EMPTY);
const MATCH_STARTING_POINT = CellMatcherLayerBitMaskTest.from(GridTags.StartingPoint, MirGridLayers.Tags);
const MATCH_ENEMY = CellMatcherLayerBitMaskTest.from(GridTags.Enemy, MirGridLayers.Tags);

pTreasureCorner.addRule(1, 0, MATCH_NOT_EMPTY);
pTreasureCorner.addRule(0, 1, MATCH_NOT_EMPTY);

pTreasureCorner.addRule(0, 0, matcher_tag_traversable_unoccupied);

const pNoTreasureIn3 = new CellMatcherGridPattern();
pNoTreasureIn3.addRule(0, 0, CellMatcherNot.from(CellMatcherContainsMarkerWithinRadius.from(
    MarkerNodeMatcherByType.from('Treasure'), 3
)));

const chestPlacementRule = GridCellPlacementRule.from(CellMatcherAnd.from(pTreasureCorner, pNoTreasureIn3), [
    GridCellActionPlaceMarker.from({ type: 'Treasure', size: 0.5 }),
    GridCellActionPlaceTags.from(GridTags.Treasure, MirGridLayers.Tags)
], CellFilterLiteralFloat.from(0.5));


const aMakePlayArea = GridCellActionSequence.from([
    GridCellActionPlaceTags.from(GridTags.Traversable | GridTags.PlayArea, MirGridLayers.Tags)
]);

const gMakeEmpty = GridTaskCellularAutomata.from({
    action: aMakePlayArea,
    margin: 3
});

const gConnectRooms = GridTaskConnectRooms.from({
    matcher: matcher_tag_traversable,
    action: aMakePlayArea
});

gConnectRooms.addDependency(gMakeEmpty);

const gRuleSet1 = GridTaskActionRuleSet.from({ rules: GridActionRuleSet.from({ rules: [chestPlacementRule] }) });


const pNearTreasure = new CellMatcherGridPattern();
pNearTreasure.addRule(0, 0,
    CellMatcherAnd.from(
        matcher_tag_traversable_unoccupied,
        CellMatcherNot.from(MATCH_ENEMY)
    )
);

pNearTreasure.addRule(1, 1, MATCH_TREASURE);
pNearTreasure.addRule(2, 2, MATCH_NOT_EMPTY);

const MATCH_ENEMY_IN_3 = CellMatcherContainsMarkerWithinRadius.from(MarkerNodeMatcherByType.from('Enemy'), 3);

const MATCH_NO_ENEMY_IN_3 = CellMatcherNot.from(MATCH_ENEMY_IN_3);

const pNoEnemyIn3 = new CellMatcherGridPattern();

pNoEnemyIn3.addRule(0, 0, MATCH_NO_ENEMY_IN_3);


const ACTION_PLACE_ENEMY_MARKER = GridCellActionPlaceMarker.from({
    type: 'Enemy',
    size: 0.5,
    transformers: [
        MarkerNodeTransformerRecordProperty.from(
            'power',
            CellFilterAdd.from(
                CellFilterMultiply.from(
                    CellFilterCubicFunction.from(
                        CellFilterMax2.from(
                            CellFilterSubtract.from(
                                CellFilterMultiply.from(
                                    CellFilterDivide.from(
                                        CellFilterReadGridLayer.from(MirGridLayers.DistanceFromStart),
                                        //increase level by 1 for each X tiles distance
                                        CellFilterLiteralFloat.from(20)
                                    ),
                                    //add a bit of noise to difficulty distribution
                                    CellFilterMultiply.from(
                                        CellFilterSmoothStep.from(
                                            CellFilterLiteralFloat.from(20),
                                            CellFilterLiteralFloat.from(50),
                                            CellFilterReadGridLayer.from(MirGridLayers.DistanceFromStart)
                                        ),
                                        CellFilterLerp.from(
                                            CellFilterLiteralFloat.from(0.9),
                                            CellFilterLiteralFloat.from(2),
                                            CellFilterMultiply.from(
                                                CellFilterSimplexNoise.from(111.1134, 111.1134, 12319518),
                                                CellFilterSimplexNoise.from(25.4827, 25.4827, 4512371)
                                            )
                                        )
                                    )
                                ),
                                CellFilterLiteralFloat.from(1)
                            ),
                            CellFilterLiteralFloat.from(0)
                        ),
                        0,
                        1, //linear factor
                        0.05, //quadratic factor (good for estimating branching)
                        0.01 //cubic factor
                    ),
                    CellFilterLiteralFloat.from(100)
                ),
                CellFilterLiteralFloat.from(50)
            )
        )
    ]
});
const ACTION_PLACE_ENEMY_TAG = GridCellActionPlaceTags.from(GridTags.Enemy | GridTags.Occupied, MirGridLayers.Tags);

const prTreasureGuards = GridCellPlacementRule.from(
    pNearTreasure,
    [
        ACTION_PLACE_ENEMY_MARKER,
        ACTION_PLACE_ENEMY_TAG
    ]
);


const gRuleSetTreasureGuards = GridTaskActionRuleSet.from({ rules: GridActionRuleSet.from({ rules: [prTreasureGuards] }) });
gRuleSetTreasureGuards.addDependency(gRuleSet1);


const prEnemyTreasureGuard = GridCellPlacementRule.from(
    CellMatcherAnd.from(
        pNearTreasure,
        pNoEnemyIn3
    ),
    [
        ACTION_PLACE_ENEMY_MARKER,
        ACTION_PLACE_ENEMY_TAG
    ]
);


const prEnemyCorridorGuard = GridCellPlacementRule.from(
    CellMatcherAnd.from(
        mir_matcher_attack_corridor,
        pNoEnemyIn3
    ),
    [
        ACTION_PLACE_ENEMY_MARKER,
        ACTION_PLACE_ENEMY_TAG
    ]
);

prEnemyCorridorGuard.probability = 0.5;

const gRuleSet2 = GridTaskActionRuleSet.from({ rules: GridActionRuleSet.from({ rules: [prEnemyTreasureGuard, prEnemyCorridorGuard] }) });

gRuleSet2.addDependency(gRuleSetTreasureGuards);

// Place starting point tag
const gPlaceStartingPoint = mir_generator_place_starting_point();

gPlaceStartingPoint.addDependency(gConnectRooms);

const gBuildDistanceMap = GridTaskBuildSourceDistanceMap.from({ source: MATCH_STARTING_POINT, pass: MATCH_EMPTY });

gBuildDistanceMap.addDependency(gPlaceStartingPoint);

gRuleSet1.addDependency(gBuildDistanceMap);

const gBases = mir_generator_place_bases();
gBases.addDependency(gMakeEmpty);

const gBuffObjects = mir_generator_place_buff_objects();
gBuffObjects.addDependency(gBases);

gConnectRooms.addDependency(gBases);
gConnectRooms.addDependency(gBuffObjects);

gPlaceStartingPoint.addDependency(gBases);

gRuleSet1.addDependency(gBases);


const gRoads = new GridTaskGenerateRoads();

gRoads.addDependency(gConnectRooms);
gRoads.addDependency(gBases);
gRoads.addDependency(gBuffObjects);

const gRoadDecorators = mir_generator_place_road_decorators();

gRoadDecorators.addDependency(gRoads);

/**
 *
 * @type {GridTaskActionRuleSet}
 */
const gDrawLayerMoisture = GridTaskActionRuleSet.from({
    rules: GridActionRuleSet.from({
        rules: [
            GridCellPlacementRule.from(
                CellMatcherAny.INSTANCE,
                [GridCellActionWriteFilterToLayer.from(MirGridLayers.Moisture, SampleGroundMoistureFilter)]
            )
        ]
    })
});

//trees
const fReadHeight = CellFilterReadGridLayer.from(MirGridLayers.Heights);

const fTreeArea = CellFilterCache.from(
    CellFilterMultiply.from(
        CellFilterMultiply.from(
            SampleNoise20_0,
            CellFilterClamp.from(
                CellFilterInverseLerp.from(
                    CellFilterLiteralFloat.from(0.1),
                    CellFilterLiteralFloat.from(0.5),
                    CellFilterReadGridLayer.from(MirGridLayers.Moisture)
                ),
                CellFilterLiteralFloat.from(0),
                CellFilterLiteralFloat.from(1)
            )
        ),
        CellFilterMultiply.from(
            CellFilterMultiply.from(
                //filter out areas that are below height of 0
                CellFilterStep.from(
                    CellFilterLiteralFloat.from(0),
                    fReadHeight
                ),
                //filter areas that are playable
                CellFilterCellMatcher.from(
                    matcher_not_play_area
                )
            ),
            // Filter areas with sharp slopes
            CellFilterOneMinus.from(
                CellFilterSmoothStep.from(
                    CellFilterLiteralFloat.from(Math.PI / 9),
                    CellFilterLiteralFloat.from(Math.PI / 5),
                    CellFilterAngleToNormal.from(fReadHeight, Vector3.forward)
                )
            )
        )
    )
);

const fFlatlandTrees = CellFilterCache.from(
    CellFilterMultiply.from(
        fTreeArea,
        CellFilterClamp.from(
            CellFilterInverseLerp.from(
                CellFilterLiteralFloat.from(0.2),
                CellFilterLiteralFloat.from(0),
                CellFilterCache.from(
                    CellFilterGaussianBlur.from(
                        CellFilterAngleToNormal.from(fReadHeight),
                        2.3,
                        2.3
                    )
                )
            ),
            CellFilterLiteralFloat.from(0),
            CellFilterLiteralFloat.from(1)
        )
    )
);

const matcher_non_play_area_3x3 = CellMatcherGridPattern.from([
    GridPatternMatcherCell.from(matcher_not_play_area, -1, -1),
    GridPatternMatcherCell.from(matcher_not_play_area, 0, -1),
    GridPatternMatcherCell.from(matcher_not_play_area, 1, -1),
    GridPatternMatcherCell.from(matcher_not_play_area, -1, 0),
    GridPatternMatcherCell.from(matcher_not_play_area, 0, 0),
    GridPatternMatcherCell.from(matcher_not_play_area, 1, 0),
    GridPatternMatcherCell.from(matcher_not_play_area, -1, 1),
    GridPatternMatcherCell.from(matcher_not_play_area, 0, 1),
    GridPatternMatcherCell.from(matcher_not_play_area, 1, 1),
]);

const filterNonPlayableArea_3x3 = CellFilterCellMatcher.from(matcher_non_play_area_3x3);

const gFoliageLarge = GridTaskSequence.from([
    GridTaskDensityMarkerDistribution.from(
        CellFilterCache.from(
            CellFilterMultiply.from(
                CellFilterMultiply.from(
                    fFlatlandTrees,
                    //trees take up quite a bit of space, make sure they are far enough from play area
                    filterNonPlayableArea_3x3
                ),
                CellFilterLiteralFloat.from(10)
            )
        ),
        GridCellActionPlaceMarker.from({
            type: 'Tree-Flatland-Large',
            size: 0.5,
            transformers: [
                MarkerNodeTransformerYRotateByFilter.from(
                    CellFilterMultiply.from(
                        CellFilterSimplexNoise.from(
                            3.1234, 3.1234, 90127151
                        ),
                        CellFilterLiteralFloat.from(123421)
                    )
                )
            ]
        }),
        new NumericInterval(2.7, 3.4)
    ),
    GridTaskDensityMarkerDistribution.from(
        CellFilterMultiply.from(
            fFlatlandTrees,
            CellFilterLiteralFloat.from(20)
        ),
        GridCellActionPlaceMarker.from({
            type: 'Tree-Flatland-Small',
            size: 0.5,
            transformers: [
                MarkerNodeTransformerYRotateByFilter.from(
                    CellFilterMultiply.from(
                        CellFilterSimplexNoise.from(
                            3.1234, 3.1234, 90127151
                        ),
                        CellFilterLiteralFloat.from(123421)
                    )
                )
            ]
        }),
        new NumericInterval(1.7, 2)
    )
]);

const fSharpSlope = CellFilterCache.from(
    CellFilterSmoothStep.from(
        CellFilterLiteralFloat.from(Math.PI / 5),
        CellFilterLiteralFloat.from(Math.PI / 3.5),
        CellFilterAngleToNormal.from(
            CellFilterReadGridLayer.from(MirGridLayers.Heights),
            Vector3.forward
        )
    )
);

const filterMushroom = fTreeArea;

const gFoliageSmall = GridTaskSequence.from([
    GridTaskDensityMarkerDistribution.from(
        CellFilterMultiply.from(
            filterMushroom,
            CellFilterLiteralFloat.from(0.02)
        ),
        GridCellActionPlaceMarker.from({
            type: 'Mushroom-1',
            size: 0.5,
            transformers: []
        }),
        new NumericInterval(0.3, 0.37),
        42
    ),
    GridTaskDensityMarkerDistribution.from(
        CellFilterMultiply.from(
            filterMushroom,
            CellFilterLiteralFloat.from(0.05)
        ),
        GridCellActionPlaceMarker.from({
            type: 'Mushroom-0',
            size: 0.5,
            transformers: []
        }),
        new NumericInterval(0.17, 0.25),
        9000234
    ),
    GridTaskDensityMarkerDistribution.from(
        CellFilterCache.from(
            CellFilterMultiply.from(
                CellFilterMultiply.from(
                    CellFilterSubtract.from(
                        CellFilterGaussianBlur.from(
                            fSharpSlope,
                            3,
                            3
                        ),
                        fSharpSlope
                    ),
                    CellFilterCellMatcher.from(matcher_not_play_area)
                ),
                CellFilterLiteralFloat.from(0.15)
            )
        ),
        GridCellActionPlaceMarker.from({
            type: 'Stone-0',
            size: 0.5,
            transformers: []
        }),
        new NumericInterval(0.15, 0.35),
        9000234
    )
]);


//heights

const mHeightArea = new CellMatcherGridPattern();

mHeightArea.addRule(0, -2, matcher_not_play_area);

mHeightArea.addRule(-1, -1, matcher_not_play_area);
mHeightArea.addRule(0, -1, matcher_not_play_area);
mHeightArea.addRule(1, -1, matcher_not_play_area);

mHeightArea.addRule(-2, 0, matcher_not_play_area);
mHeightArea.addRule(-1, 0, matcher_not_play_area);
mHeightArea.addRule(0, 0, matcher_not_play_area);
mHeightArea.addRule(1, 0, matcher_not_play_area);
mHeightArea.addRule(2, 0, matcher_not_play_area);

mHeightArea.addRule(-1, 1, matcher_not_play_area);
mHeightArea.addRule(0, 1, matcher_not_play_area);
mHeightArea.addRule(1, 1, matcher_not_play_area);

mHeightArea.addRule(0, 2, matcher_not_play_area);

const gHeights = GridTaskActionRuleSet.from({
    rules: GridActionRuleSet.from(
        {
            rules: [
                GridCellPlacementRule.from(
                    CellMatcherAny.INSTANCE,
                    [
                        GridCellActionWriteFilterToLayer.from(
                            MirGridLayers.Heights,

                            CellFilterLerp.from(
                                CellFilterLiteralFloat.from(0),
                                CellFilterLerp.from(
                                    CellFilterLiteralFloat.from(-2),
                                    CellFilterLiteralFloat.from(7),
                                    CellFilterMultiply.from(
                                        CellFilterSimplexNoise.from(30, 30),
                                        CellFilterSimplexNoise.from(13, 13)
                                    )
                                ),
                                CellFilterGaussianBlur.from(
                                    CellFilterCache.from(
                                        CellFilterCellMatcher.from(
                                            mHeightArea
                                        )
                                    ),
                                    1.5,
                                    1.5
                                )
                            )
                        )
                    ]
                )
            ]
        }
    ), resolution: 1
});


gHeights.addDependency(gConnectRooms);

gFoliageLarge.addDependencies([
    gMakeEmpty,
    gConnectRooms,
    gHeights,
    gDrawLayerMoisture,
    gRuleSet1,
    gRuleSet2,
    gRuleSetTreasureGuards,
    gBuffObjects,
    gBases
]);

gFoliageSmall.addDependencies([gFoliageLarge]);

gDrawLayerMoisture.addDependencies([gHeights]);

SampleGenerator0.addGenerator(gHeights);
SampleGenerator0.addGenerator(gDrawLayerMoisture);
SampleGenerator0.addGenerator(gMakeEmpty);
SampleGenerator0.addGenerator(gConnectRooms);
SampleGenerator0.addGenerator(gRoads);
SampleGenerator0.addGenerator(gRoadDecorators);
SampleGenerator0.addGenerator(gBases);
SampleGenerator0.addGenerator(gBuffObjects);
SampleGenerator0.addGenerator(gPlaceStartingPoint);
SampleGenerator0.addGenerator(gBuildDistanceMap);
SampleGenerator0.addGenerator(gRuleSet1);
SampleGenerator0.addGenerator(gRuleSet2);
SampleGenerator0.addGenerator(gRuleSetTreasureGuards);
SampleGenerator0.addGenerator(gFoliageLarge);
SampleGenerator0.addGenerator(gFoliageSmall);
