import { GridGenerator } from "../GridGenerator.js";
import { GridCellPlacementRule } from "../placement/GridCellPlacementRule.js";
import { GridPatternMatcher } from "../rules/cell/GridPatternMatcher.js";
import { GridCellRuleContainsTag } from "../rules/GridCellRuleContainsTag.js";
import { GridTags } from "../GridTags.js";
import { CellMatcherNot } from "../rules/CellMatcherNot.js";
import { GridCellActionPlaceMarker } from "../markers/GridCellActionPlaceMarker.js";
import { GridTaskCellularAutomata } from "../grid/tasks/GridTaskCellularAutomata.js";
import { GridTaskActionRuleSet } from "../grid/tasks/GridTaskCellActionRuleSet.js";
import { GridActionRuleSet } from "../markers/GridActionRuleSet.js";
import { GridTaskBuildSourceDistanceMap } from "../grid/tasks/GridTaskBuildSourceDistanceMap.js";
import { CellMatcherAnd } from "../rules/CellMatcherAnd.js";
import { GridCellActionPlaceTags } from "../placement/GridCellActionPlaceTags.js";
import { GridCellRuleContainsMarkerTypeWithinRadius } from "../rules/cell/GridCellRuleContainsMarkerTypeWithinRadius.js";
import { mir_matcher_attack_corridor } from "./rules/mir_matcher_attack_corridor.js";
import { mir_generator_place_bases } from "./generators/mir_generator_place_bases.js";
import { matcher_tag_traversable_unoccupied } from "./rules/matcher_tag_traversable_unoccupied.js";
import { mir_generator_place_starting_point } from "./generators/mir_generator_place_starting_point.js";
import { GridTaskConnectRooms } from "../grid/tasks/GridTaskConnectRooms.js";
import { matcher_tag_traversable } from "./rules/matcher_tag_traversable.js";
import { GridTaskGenerateRoads } from "../grid/tasks/road/GridTaskGenerateRoads.js";


export const SampleGenerator0 = new GridGenerator();


const pTreasureCorner = new GridPatternMatcher();

const MATCH_EMPTY = GridCellRuleContainsTag.from(GridTags.Traversable);
const MATCH_TREASURE = GridCellRuleContainsTag.from(GridTags.Treasure);
const MATCH_NOT_EMPTY = CellMatcherNot.from(MATCH_EMPTY);
const MATCH_STARTING_POINT = GridCellRuleContainsTag.from(GridTags.StartingPoint);
const MATCH_ENEMY = GridCellRuleContainsTag.from(GridTags.Enemy);

pTreasureCorner.addRule(1, 0, MATCH_NOT_EMPTY);
pTreasureCorner.addRule(0, 1, MATCH_NOT_EMPTY);

pTreasureCorner.addRule(0, 0, matcher_tag_traversable_unoccupied);

const pNoTreasureIn3 = new GridPatternMatcher();
pNoTreasureIn3.addRule(0, 0, CellMatcherNot.from(GridCellRuleContainsMarkerTypeWithinRadius.from('Treasure', 3)));

const chestPlacementRule = GridCellPlacementRule.from(CellMatcherAnd.from(pTreasureCorner, pNoTreasureIn3), [
    GridCellActionPlaceMarker.from('Treasure'),
    GridCellActionPlaceTags.from(GridTags.Treasure)
], 0.5);


const gMakeEmpty = GridTaskCellularAutomata.from(GridTags.Traversable, 3);

const gConnectRooms = GridTaskConnectRooms.from(matcher_tag_traversable);
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

const MATCH_ENEMY_IN_3 = GridCellRuleContainsMarkerTypeWithinRadius.from('Enemy', 3);

const MATCH_NO_ENEMY_IN_3 = CellMatcherNot.from(MATCH_ENEMY_IN_3);

const pNoEnemyIn3 = new GridPatternMatcher();

pNoEnemyIn3.addRule(0, 0, MATCH_NO_ENEMY_IN_3);

const ACTION_PLACE_ENEMY_MARKER = GridCellActionPlaceMarker.from('Enemy');
const ACTION_PLACE_ENEMY_TAG = GridCellActionPlaceTags.from(GridTags.Enemy | GridTags.Occupied);

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

gConnectRooms.addDependency(gBases);
gPlaceStartingPoint.addDependency(gBases);

gRuleSet1.addDependency(gBases);


const gRoads = new GridTaskGenerateRoads();

gRoads.addDependency(gConnectRooms);
gRoads.addDependency(gBases);

SampleGenerator0.addGenerator(gMakeEmpty);
SampleGenerator0.addGenerator(gConnectRooms);
SampleGenerator0.addGenerator(gRoads);
SampleGenerator0.addGenerator(gBases);
SampleGenerator0.addGenerator(gPlaceStartingPoint);
SampleGenerator0.addGenerator(gBuildDistanceMap);
SampleGenerator0.addGenerator(gRuleSet1);
SampleGenerator0.addGenerator(gRuleSet2);
SampleGenerator0.addGenerator(gRuleSetTreasureGuards);
