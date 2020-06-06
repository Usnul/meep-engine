import { GridCellPlacementRule } from "../../placement/GridCellPlacementRule.js";
import { matcher_tag_traversable_unoccupied } from "../rules/matcher_tag_traversable_unoccupied.js";
import { CellMatcherNot } from "../../rules/logic/CellMatcherNot.js";
import { GridCellActionPlaceTags } from "../../placement/GridCellActionPlaceTags.js";
import { GridTags } from "../../GridTags.js";
import { GridCellActionPlaceMarker } from "../../markers/GridCellActionPlaceMarker.js";
import { GridTaskExecuteRuleTimes } from "../../grid/generation/GridTaskExecuteRuleTimes.js";
import { CellMatcherLayerBitMaskTest } from "../../rules/CellMatcherLayerBitMaskTest.js";
import { GridPatternMatcher } from "../../rules/cell/GridPatternMatcher.js";
import { MirGridLayers } from "../grid/MirGridLayers.js";

const MATCH_STARTING_POINT = CellMatcherLayerBitMaskTest.from(GridTags.StartingPoint, MirGridLayers.Tags);


const pattern = new GridPatternMatcher();

pattern.addRule(0, 0, matcher_tag_traversable_unoccupied);
pattern.addRule(0, 0, CellMatcherNot.from(MATCH_STARTING_POINT));
pattern.addRule(0, -1, CellMatcherLayerBitMaskTest.from(GridTags.Base, MirGridLayers.Tags));

const rule = GridCellPlacementRule.from(
    pattern,
    [
        GridCellActionPlaceTags.from(GridTags.StartingPoint | GridTags.Occupied, MirGridLayers.Tags),
        GridCellActionPlaceMarker.from({ type: 'Starting Point' })
    ]
);

rule.allowRotation = true;

export const mir_generator_place_starting_point = () => GridTaskExecuteRuleTimes.from(rule, 1);
