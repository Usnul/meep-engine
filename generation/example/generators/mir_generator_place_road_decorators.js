import { GridTaskActionRuleSet } from "../../grid/tasks/GridTaskCellActionRuleSet.js";
import { GridActionRuleSet } from "../../markers/GridActionRuleSet.js";
import { GridCellPlacementRule } from "../../placement/GridCellPlacementRule.js";
import { GridPatternMatcher } from "../../rules/cell/GridPatternMatcher.js";
import { GridCellRuleContainsTag } from "../../rules/GridCellRuleContainsTag.js";
import { GridTags } from "../../GridTags.js";
import { CellMatcherAnd } from "../../rules/CellMatcherAnd.js";
import { CellMatcherNot } from "../../rules/CellMatcherNot.js";
import { GridCellActionPlaceMarker } from "../../markers/GridCellActionPlaceMarker.js";
import { matcher_tag_traversable_unoccupied } from "../rules/matcher_tag_traversable_unoccupied.js";
import { GridCellRuleContainsMarkerWithinRadius } from "../../rules/cell/GridCellRuleContainsMarkerWithinRadius.js";
import { MarkerNodeMatcherByType } from "../../markers/matcher/MarkerNodeMatcherByType.js";
import { MarkerNodeMatcherContainsTag } from "../../markers/matcher/MarkerNodeMatcherContainsTag.js";
import { MarkerNodeMatcherAny } from "../../markers/matcher/MarkerNodeMatcherAny.js";


const matcher_tag_road = GridCellRuleContainsTag.from(GridTags.Road);

const matchBend90 = new GridPatternMatcher();

matchBend90.addRule(0, 0, CellMatcherAnd.from(
    matcher_tag_traversable_unoccupied,
    CellMatcherNot.from(matcher_tag_road)
));

const TAG_ROAD_DECORATOR = 'Road Decorator';

matchBend90.addRule(0, 0,
    CellMatcherAnd.from(
        CellMatcherAnd.from(
            CellMatcherNot.from(GridCellRuleContainsMarkerWithinRadius.from(MarkerNodeMatcherByType.from('Road Connector'), 2)),
            CellMatcherNot.from(GridCellRuleContainsMarkerWithinRadius.from(MarkerNodeMatcherContainsTag.from(TAG_ROAD_DECORATOR), 3))
        ),
        CellMatcherNot.from(GridCellRuleContainsMarkerWithinRadius.from(MarkerNodeMatcherAny.INSTANCE, 0.5))
    )
);

matchBend90.addRule(-1, 0, matcher_tag_road);
matchBend90.addRule(-2, 0, matcher_tag_road);
matchBend90.addRule(0, -1, matcher_tag_road);
matchBend90.addRule(-1, -1, matcher_tag_road);

const placeMarker = GridCellActionPlaceMarker.from('Road Junction Decorator 90');
placeMarker.addTag(TAG_ROAD_DECORATOR);

const ruleBend90 = GridCellPlacementRule.from(matchBend90, [
    placeMarker
], 0.1);


/**
 *
 * @returns {GridTaskActionRuleSet}
 */
export const mir_generator_place_road_decorators = () => GridTaskActionRuleSet.from(GridActionRuleSet.from([ruleBend90]));
