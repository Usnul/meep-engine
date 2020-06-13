import { GridGenerator } from "../GridGenerator.js";
import { GridCellPlacementRule } from "../placement/GridCellPlacementRule.js";
import { GridPatternMatcher } from "../rules/cell/GridPatternMatcher.js";
import { CellMatcherLayerBitMaskTest } from "../rules/CellMatcherLayerBitMaskTest.js";
import { GridTags } from "../GridTags.js";
import { CellMatcherNot } from "../rules/logic/CellMatcherNot.js";
import { GridCellActionPlaceMarker } from "../markers/GridCellActionPlaceMarker.js";
import { GridTaskCellularAutomata } from "../grid/generation/GridTaskCellularAutomata.js";
import { GridTaskActionRuleSet } from "../grid/generation/GridTaskCellActionRuleSet.js";
import { GridActionRuleSet } from "../markers/GridActionRuleSet.js";
import { GridTaskBuildSourceDistanceMap } from "../grid/generation/GridTaskBuildSourceDistanceMap.js";
import { CellMatcherAnd } from "../rules/logic/CellMatcherAnd.js";
import { GridCellActionPlaceTags } from "../placement/GridCellActionPlaceTags.js";
import { CellMatcherContainsMarkerWithinRadius } from "../rules/cell/CellMatcherContainsMarkerWithinRadius.js";
import { mir_matcher_attack_corridor } from "./rules/mir_matcher_attack_corridor.js";
import { mir_generator_place_bases } from "./generators/mir_generator_place_bases.js";
import { matcher_tag_traversable_unoccupied } from "./rules/matcher_tag_traversable_unoccupied.js";
import { mir_generator_place_starting_point } from "./generators/mir_generator_place_starting_point.js";
import { GridTaskConnectRooms } from "../grid/generation/GridTaskConnectRooms.js";
import { matcher_tag_traversable } from "./rules/matcher_tag_traversable.js";
import { GridTaskGenerateRoads } from "../grid/generation/road/GridTaskGenerateRoads.js";
import { mir_generator_place_road_decorators } from "./generators/mir_generator_place_road_decorators.js";
import { MarkerNodeMatcherByType } from "../markers/matcher/MarkerNodeMatcherByType.js";
import { mir_generator_place_buff_objects } from "./generators/mir_generator_place_buff_objects.js";
import { GridTaskDensityMarkerDistribution } from "../grid/generation/GridTaskDensityMarkerDistribution.js";
import { CellFilterSimplexNoise } from "../filtering/complex/CellFilterSimplexNoise.js";
import { NumericInterval } from "../../core/math/interval/NumericInterval.js";
import { CellFilterMultiply } from "../filtering/math/algebra/CellFilterMultiply.js";
import { CellFilterCellMatcher } from "../filtering/CellFilterCellMatcher.js";
import { CellFilterConstant } from "../filtering/core/CellFilterConstant.js";
import { MirGridLayers } from "./grid/MirGridLayers.js";
import { CellFilterLerp } from "../filtering/math/CellFilterLerp.js";
import { GridCellActionWriteFilterToLayer } from "../placement/GridCellActionWriteFilterToLayer.js";
import { CellMatcherAny } from "../rules/CellMatcherAny.js";
import { CellFilterGaussianBlur } from "../filtering/complex/CellFilterGaussianBlur.js";
import { GridCellActionSequence } from "../placement/GridCellActionSequence.js";
import { CellFilterStep } from "../filtering/math/CellFilterStep.js";
import { CellFilterReadGridLayer } from "../filtering/CellFilterReadGridLayer.js";
import { CellFilterAngleToNormal } from "../filtering/complex/CellFilterAngleToNormal.js";
import Vector3 from "../../core/geom/Vector3.js";
import { CellFilterOneMinus } from "../filtering/math/CellFilterOneMinus.js";
import { CellFilterSmoothStep } from "../filtering/math/CellFilterSmoothStep.js";
import { SampleNoise20_0 } from "./filters/SampleNoise20_0.js";
import { SampleGroundMoistureFilter } from "./filters/SampleGroundMoistureFilter.js";
import { GridTaskSequence } from "../grid/generation/GridTaskSequence.js";
import { CellFilterSubtract } from "../filtering/math/algebra/CellFilterSubtract.js";
import { CellFilterCache } from "../filtering/CellFilterCache.js";

export const SampleGenerator0 = new GridGenerator();


const pTreasureCorner = new GridPatternMatcher();

const MATCH_EMPTY = CellMatcherLayerBitMaskTest.from(GridTags.Traversable, MirGridLayers.Tags);
const MATCH_TREASURE = CellMatcherLayerBitMaskTest.from(GridTags.Treasure, MirGridLayers.Tags);
const MATCH_NOT_EMPTY = CellMatcherNot.from(MATCH_EMPTY);
const MATCH_STARTING_POINT = CellMatcherLayerBitMaskTest.from(GridTags.StartingPoint, MirGridLayers.Tags);
const MATCH_ENEMY = CellMatcherLayerBitMaskTest.from(GridTags.Enemy, MirGridLayers.Tags);

pTreasureCorner.addRule(1, 0, MATCH_NOT_EMPTY);
pTreasureCorner.addRule(0, 1, MATCH_NOT_EMPTY);

pTreasureCorner.addRule(0, 0, matcher_tag_traversable_unoccupied);

const pNoTreasureIn3 = new GridPatternMatcher();
pNoTreasureIn3.addRule(0, 0, CellMatcherNot.from(CellMatcherContainsMarkerWithinRadius.from(
    MarkerNodeMatcherByType.from('Treasure'), 3
)));

const chestPlacementRule = GridCellPlacementRule.from(CellMatcherAnd.from(pTreasureCorner, pNoTreasureIn3), [
    GridCellActionPlaceMarker.from({ type: 'Treasure', size: 0.5 }),
    GridCellActionPlaceTags.from(GridTags.Treasure, MirGridLayers.Tags)
], 0.5);


const aMakePlayArea = GridCellActionSequence.from([
    GridCellActionPlaceTags.from(GridTags.Traversable | GridTags.PlayArea, MirGridLayers.Tags)
]);

const gMakeEmpty = GridTaskCellularAutomata.from(
    aMakePlayArea,
    3
);

const gConnectRooms = GridTaskConnectRooms.from(
    matcher_tag_traversable,
    aMakePlayArea
);

gConnectRooms.addDependency(gMakeEmpty);

const gRuleSet1 = GridTaskActionRuleSet.from(GridActionRuleSet.from([chestPlacementRule]));


const pNearTreasure = new GridPatternMatcher();
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

const pNoEnemyIn3 = new GridPatternMatcher();

pNoEnemyIn3.addRule(0, 0, MATCH_NO_ENEMY_IN_3);

const ACTION_PLACE_ENEMY_MARKER = GridCellActionPlaceMarker.from({
    type: 'Enemy',
    size: 0.5
});
const ACTION_PLACE_ENEMY_TAG = GridCellActionPlaceTags.from(GridTags.Enemy | GridTags.Occupied, MirGridLayers.Tags);

const prTreasureGuards = GridCellPlacementRule.from(
    pNearTreasure,
    [
        ACTION_PLACE_ENEMY_MARKER,
        ACTION_PLACE_ENEMY_TAG
    ]
);


const gRuleSetTreasureGuards = GridTaskActionRuleSet.from(GridActionRuleSet.from([prTreasureGuards]));
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

const gRuleSet2 = GridTaskActionRuleSet.from(GridActionRuleSet.from([prEnemyTreasureGuard, prEnemyCorridorGuard]));

gRuleSet2.addDependency(gRuleSetTreasureGuards);

// Place starting point tag
const gPlaceStartingPoint = mir_generator_place_starting_point();

gPlaceStartingPoint.addDependency(gConnectRooms);

const gBuildDistanceMap = GridTaskBuildSourceDistanceMap.from(MATCH_STARTING_POINT, MATCH_EMPTY);

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
const gDrawLayerMoisture = GridTaskActionRuleSet.from(GridActionRuleSet.from([
    GridCellPlacementRule.from(
        CellMatcherAny.INSTANCE,
        [GridCellActionWriteFilterToLayer.from(MirGridLayers.Moisture, SampleGroundMoistureFilter)]
    )
]));

//trees
const fReadHeight = CellFilterReadGridLayer.from(MirGridLayers.Heights);

const matcher_play_area = CellMatcherLayerBitMaskTest.from(GridTags.PlayArea, MirGridLayers.Tags);
const matcher_not_play_area = CellMatcherNot.from(matcher_play_area);

const fTreeArea = CellFilterCache.from(
    CellFilterMultiply.from(
        CellFilterMultiply.from(
            SampleNoise20_0,
            CellFilterReadGridLayer.from(MirGridLayers.Moisture)
        ),
        CellFilterMultiply.from(
            CellFilterMultiply.from(
                //filter out areas that are below height of 0
                CellFilterStep.from(
                    CellFilterConstant.from(0),
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
                    CellFilterConstant.from(Math.PI / 2.4),
                    CellFilterConstant.from(Math.PI / 2.1),
                    CellFilterAngleToNormal.from(fReadHeight, Vector3.forward)
                )
            )
        )
    )
);

const gFoliageLarge = GridTaskSequence.from([
    GridTaskDensityMarkerDistribution.from(
        CellFilterMultiply.from(
            fTreeArea,
            CellFilterConstant.from(0.05)
        ),
        GridCellActionPlaceMarker.from({
            type: 'Tree-0',
            size: 0.565,
            transformers: []
        }),
        new NumericInterval(1.21, 1.4)
    ),
    GridTaskDensityMarkerDistribution.from(
        fTreeArea,
        GridCellActionPlaceMarker.from({
            type: 'Tree-1',
            size: 0.5,
            transformers: []
        }),
        new NumericInterval(0.77, 1.2)
    )
]);

const fSharpSlope = CellFilterCache.from(
    CellFilterSmoothStep.from(
        CellFilterConstant.from(Math.PI / 2.2),
        CellFilterConstant.from(Math.PI / 2),
        CellFilterAngleToNormal.from(
            CellFilterReadGridLayer.from(MirGridLayers.Heights),
            Vector3.forward
        )
    )
);

const gFoliageSmall = GridTaskSequence.from([
    GridTaskDensityMarkerDistribution.from(
        CellFilterMultiply.from(
            fTreeArea,
            CellFilterConstant.from(0.02)
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
            fTreeArea,
            CellFilterConstant.from(0.05)
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
                CellFilterConstant.from(0.1)
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

const mHeightArea = new GridPatternMatcher();

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

const gHeights = GridTaskActionRuleSet.from(GridActionRuleSet.from(
    [
        GridCellPlacementRule.from(
            CellMatcherAny.INSTANCE,
            [
                GridCellActionWriteFilterToLayer.from(
                    MirGridLayers.Heights,

                    CellFilterLerp.from(
                        CellFilterConstant.from(0),
                        CellFilterLerp.from(
                            CellFilterConstant.from(-2),
                            CellFilterConstant.from(7),
                            CellFilterMultiply.from(
                                CellFilterSimplexNoise.from(30, 30),
                                CellFilterSimplexNoise.from(13, 13)
                            )
                        ),
                        CellFilterGaussianBlur.from(
                            CellFilterCellMatcher.from(
                                mHeightArea
                            ),
                            1.5,
                            1.5
                        )
                    )
                )
            ]
        )
    ]
), 1);


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
