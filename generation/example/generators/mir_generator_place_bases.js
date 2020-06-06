import { GridTaskActionRuleSet } from "../../grid/generation/GridTaskCellActionRuleSet.js";
import { GridCellPlacementRule } from "../../placement/GridCellPlacementRule.js";
import { GridPatternMatcher } from "../../rules/cell/GridPatternMatcher.js";
import { GridActionRuleSet } from "../../markers/GridActionRuleSet.js";
import { GridCellActionPlaceTags } from "../../placement/GridCellActionPlaceTags.js";
import { GridTags } from "../../GridTags.js";
import { GridCellActionPlaceMarker } from "../../markers/GridCellActionPlaceMarker.js";
import { CellMatcherNot } from "../../rules/logic/CellMatcherNot.js";
import { CellMatcherContainsMarkerWithinRadius } from "../../rules/cell/CellMatcherContainsMarkerWithinRadius.js";
import { matcher_tag_traversable_unoccupied } from "../rules/matcher_tag_traversable_unoccupied.js";
import { bitwiseAnd } from "../../../core/binary/operations/bitwiseAnd.js";
import { GridCellActionPlaceMarkerGroup } from "../../markers/GridCellActionPlaceMarkerGroup.js";
import { MarkerNodeMatcherByType } from "../../markers/matcher/MarkerNodeMatcherByType.js";
import { MirGridLayers } from "../grid/MirGridLayers.js";

const pMatcher = new GridPatternMatcher();

pMatcher.addRule(0, 0, matcher_tag_traversable_unoccupied);
pMatcher.addRule(1, 0, matcher_tag_traversable_unoccupied);
pMatcher.addRule(0, 1, matcher_tag_traversable_unoccupied);
pMatcher.addRule(1, 1, matcher_tag_traversable_unoccupied);


//no other bases nearby
pMatcher.addRule(0, 0, CellMatcherNot.from(
    CellMatcherContainsMarkerWithinRadius.from(MarkerNodeMatcherByType.from('Base'), 25)
));

const placeTags = new GridCellActionPlaceTags();

placeTags.layerId = MirGridLayers.Tags;
placeTags.resize(2, 2);
placeTags.fill(GridTags.Base | GridTags.Occupied);


const clearTags = new GridCellActionPlaceTags();

clearTags.layerId = MirGridLayers.Tags;
clearTags.resize(2, 2);
clearTags.fill(~GridTags.Traversable);
clearTags.operation = bitwiseAnd;

const placeMarker = GridCellActionPlaceMarker.from({ type: 'Base' });
placeMarker.addTag('Town');

placeMarker.transform.position.set(0.5, 0.1, -0.5);

const placeRoadConnector0 = GridCellActionPlaceMarker.from({ type: 'Road Connector' });
placeRoadConnector0.offset.set(-1, 0);

const placeRoadConnector1 = GridCellActionPlaceMarker.from({ type: 'Road Connector' });
placeRoadConnector1.offset.set(2, 1);

const placeRoadConnector2 = GridCellActionPlaceMarker.from({ type: 'Road Connector' });
placeRoadConnector2.offset.set(1, -1);

const placeRoadConnector3 = GridCellActionPlaceMarker.from({ type: 'Road Connector' });
placeRoadConnector3.offset.set(0, 2);

const placeRoadConnectors = GridCellActionPlaceMarkerGroup.from([
    placeRoadConnector0,
    placeRoadConnector1,
    placeRoadConnector2,
    placeRoadConnector3
]);

const rule = GridCellPlacementRule.from(pMatcher, [
    placeTags,
    clearTags,
    placeMarker,
    placeRoadConnectors
], 0.1);

rule.allowRotation = false;

/**
 *
 * @returns {GridTaskActionRuleSet}
 */
export const mir_generator_place_bases = () => GridTaskActionRuleSet.from(GridActionRuleSet.from([rule]));
