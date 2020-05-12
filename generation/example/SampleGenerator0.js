import { GridGenerator } from "../GridGenerator.js";
import { GridCellPlacementRule } from "../placement/GridCellPlacementRule.js";
import { GridCellMatcher } from "../rules/cell/GridCellMatcher.js";
import { GridCellRuleContainsTag } from "../rules/GridCellRuleContainsTag.js";
import { GridTags } from "../GridTags.js";
import { GridCellRuleNot } from "../rules/GridCellRuleNot.js";
import { GridCellActionPlaceMarker } from "../markers/GridCellActionPlaceMarker.js";
import { GridTaskCellularAutomata } from "../grid/tasks/GridTaskCellularAutomata.js";
import { GridTaskActionRuleSet } from "../grid/tasks/GridTaskCellActionRuleSet.js";
import { GridActionRuleSet } from "../markers/GridActionRuleSet.js";
import { GridTaskExecuteRuleTimes } from "../grid/tasks/GridTaskExecuteRuleTimes.js";
import { GridTaskBuildSourceDistanceMap } from "../grid/tasks/GridTaskBuildSourceDistanceMap.js";
import { GridCellRuleAnd } from "../rules/GridCellRuleAnd.js";
import { GridCellActionPlaceTags } from "../placement/GridCellActionPlaceTags.js";
import { GridCellMatcherOr } from "../rules/cell/GridCellMatcherOr.js";
import { GridCellRuleContainsMarkerTypeWithinRadius } from "../rules/cell/GridCellRuleContainsMarkerTypeWithinRadius.js";
import { GridCellMatcherAnd } from "../rules/cell/GridCellMatcherAnd.js";


export const SampleGenerator0 = new GridGenerator();


const chestPlacementRule = new GridCellPlacementRule();

const pEmptyCorner = new GridCellMatcher();

const MATCH_EMPTY = GridCellRuleContainsTag.from(GridTags.Empty);
const MATCH_NOT_EMPTY = GridCellRuleNot.from(MATCH_EMPTY);
const MATCH_STARTING_POINT = GridCellRuleContainsTag.from(GridTags.StartingPoint);


pEmptyCorner.addRule(1, 0, MATCH_NOT_EMPTY);
pEmptyCorner.addRule(0, 1, MATCH_NOT_EMPTY);

pEmptyCorner.addRule(0, 0, MATCH_EMPTY);

chestPlacementRule.pattern = pEmptyCorner;
chestPlacementRule.probability = 0.1;
chestPlacementRule.actions.push(GridCellActionPlaceMarker.from('Treasure'));

const prStartingPoint = GridCellPlacementRule.from(MATCH_STARTING_POINT, [
    GridCellActionPlaceMarker.from('Starting Point')
]);


const gMakeEmpty = GridTaskCellularAutomata.from(GridTags.Empty, 3);

const gRuleSet1 = GridTaskActionRuleSet.from(GridActionRuleSet.from([chestPlacementRule, prStartingPoint]));

const pCorridor0 = new GridCellMatcher();

pCorridor0.addRule(0, 0, MATCH_EMPTY);

pCorridor0.addRule(0, -1, MATCH_EMPTY);
pCorridor0.addRule(0, 1, MATCH_EMPTY);

pCorridor0.addRule(-1, 0, MATCH_NOT_EMPTY);
pCorridor0.addRule(1, 0, MATCH_NOT_EMPTY);

const pCorridor1 = new GridCellMatcher();

pCorridor1.addRule(0, 0, MATCH_EMPTY);

pCorridor1.addRule(0, -1, MATCH_EMPTY);
pCorridor1.addRule(0, 1, MATCH_EMPTY);

pCorridor1.addRule(-2, 0, MATCH_NOT_EMPTY);
pCorridor1.addRule(2, 0, MATCH_NOT_EMPTY);

const MATCH_ENEMY_IN_3 = GridCellRuleContainsMarkerTypeWithinRadius.from('Enemy', 3);

const MATCH_NO_ENEMY_IN_3 = GridCellRuleNot.from(MATCH_ENEMY_IN_3);

const pNoEnemyIn3 = new GridCellMatcher();

pNoEnemyIn3.addRule(0, 0, MATCH_NO_ENEMY_IN_3);

const prEnemy = GridCellPlacementRule.from(
    GridCellMatcherAnd.from(
        GridCellMatcherOr.from(pCorridor0, pCorridor1),
        pNoEnemyIn3
    ),
    [
        GridCellActionPlaceMarker.from('Enemy')
    ]
);

const gRuleSet2 = GridTaskActionRuleSet.from(GridActionRuleSet.from([prEnemy]));

gRuleSet2.addDependency(gRuleSet1);

// Place starting point tag
const gPlaceStartingPoint = GridTaskExecuteRuleTimes.from(
    GridCellPlacementRule.from(
        GridCellRuleAnd.from(
            MATCH_EMPTY,
            GridCellRuleNot.from(MATCH_STARTING_POINT)
        ),
        [GridCellActionPlaceTags.from(GridTags.StartingPoint)]
    ),
    1
);

gPlaceStartingPoint.addDependency(gMakeEmpty);

const gBuildDistanceMap = GridTaskBuildSourceDistanceMap.from(MATCH_STARTING_POINT, MATCH_EMPTY);

gBuildDistanceMap.addDependency(gPlaceStartingPoint);

gRuleSet1.addDependency(gBuildDistanceMap);

SampleGenerator0.addGenerator(gMakeEmpty);
SampleGenerator0.addGenerator(gRuleSet1);
SampleGenerator0.addGenerator(gRuleSet2);
SampleGenerator0.addGenerator(gPlaceStartingPoint);
SampleGenerator0.addGenerator(gBuildDistanceMap);
