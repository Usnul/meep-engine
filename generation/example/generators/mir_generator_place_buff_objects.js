import { GridPatternMatcher } from "../../rules/cell/GridPatternMatcher.js";
import { matcher_tag_traversable_unoccupied } from "../rules/matcher_tag_traversable_unoccupied.js";
import { CellMatcherNot } from "../../rules/CellMatcherNot.js";
import { GridCellRuleContainsMarkerWithinRadius } from "../../rules/cell/GridCellRuleContainsMarkerWithinRadius.js";
import { TypeMarkerNodeMatcher } from "../../markers/matcher/TypeMarkerNodeMatcher.js";
import { GridCellActionPlaceTags } from "../../placement/GridCellActionPlaceTags.js";
import { GridTags } from "../../GridTags.js";
import { bitwiseAnd } from "../../../core/binary/operations/bitwiseAnd.js";
import { GridCellActionPlaceMarker } from "../../markers/GridCellActionPlaceMarker.js";
import { GridCellPlacementRule } from "../../placement/GridCellPlacementRule.js";
import { GridTaskActionRuleSet } from "../../grid/tasks/GridTaskCellActionRuleSet.js";
import { GridActionRuleSet } from "../../markers/GridActionRuleSet.js";
import { GridCellActionPlaceMarkerGroup } from "../../markers/GridCellActionPlaceMarkerGroup.js";
import { matcher_tag_not_traversable } from "../rules/matcher_tag_not_traversable.js";

const pMatcher = new GridPatternMatcher();

pMatcher.addRule(0, 1, matcher_tag_not_traversable);
pMatcher.addRule(0, 0, matcher_tag_traversable_unoccupied);
pMatcher.addRule(0, -1, matcher_tag_traversable_unoccupied);
pMatcher.addRule(0, -2, matcher_tag_traversable_unoccupied);


//no other bases nearby
pMatcher.addRule(0, 0, CellMatcherNot.from(
    GridCellRuleContainsMarkerWithinRadius.from(TypeMarkerNodeMatcher.from('Buff Object'), 14)
));

const placeTags = new GridCellActionPlaceTags();

placeTags.resize(1, 1);
placeTags.fill(GridTags.Occupied);


const clearTags = new GridCellActionPlaceTags();

clearTags.resize(1, 1);
clearTags.fill(~GridTags.Traversable);
clearTags.operation = bitwiseAnd;

const placeMarker = GridCellActionPlaceMarker.from('Buff Object');
placeMarker.addTag('Buff');

const placeRoadConnector0 = GridCellActionPlaceMarker.from('Road Connector');
placeRoadConnector0.offset.set(0, -1);
placeRoadConnector0.properties.connectivity = 0.3;

const placeRoadMarkers = GridCellActionPlaceMarkerGroup.from([placeRoadConnector0]);


const rule = GridCellPlacementRule.from(pMatcher, [
    placeTags,
    clearTags,
    placeMarker,
    placeRoadMarkers
], 0.1);

rule.allowRotation = true;

/**
 *
 * @returns {GridTaskActionRuleSet}
 */
export const mir_generator_place_buff_objects = () => GridTaskActionRuleSet.from(GridActionRuleSet.from([rule]));
