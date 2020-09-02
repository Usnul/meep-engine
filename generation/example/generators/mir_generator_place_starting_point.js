import { GridCellPlacementRule } from "../../placement/GridCellPlacementRule.js";
import { matcher_tag_traversable_unoccupied } from "../rules/matcher_tag_traversable_unoccupied.js";
import { CellMatcherNot } from "../../rules/logic/CellMatcherNot.js";
import { GridCellActionPlaceTags } from "../../placement/action/GridCellActionPlaceTags.js";
import { GridTags } from "../../GridTags.js";
import { GridCellActionPlaceMarker } from "../../markers/GridCellActionPlaceMarker.js";
import { GridTaskExecuteRuleTimes } from "../../grid/generation/GridTaskExecuteRuleTimes.js";
import { CellMatcherLayerBitMaskTest } from "../../rules/CellMatcherLayerBitMaskTest.js";
import { CellMatcherGridPattern } from "../../rules/cell/CellMatcherGridPattern.js";
import { MirGridLayers } from "../grid/MirGridLayers.js";
import { GridCellActionTransformNearbyMarkers } from "../../placement/GridCellActionTransformNearbyMarkers.js";
import { MarkerNodeMatcherByType } from "../../markers/matcher/MarkerNodeMatcherByType.js";
import { MarkerNodeTransformerRecordProperty } from "../../markers/transform/MarkerNodeTransformerRecordProperty.js";
import { CellFilterLiteralFloat } from "../../filtering/numeric/CellFilterLiteralFloat.js";
import { MirMarkerTypes } from "../../../../generator/MirMarkerTypes.js";
import { MarkerNodeTransformerRemoveTag } from "../../markers/transform/MarkerNodeTransformerRemoveTag.js";
import { MirMarkerTags } from "../../../../generator/MirMarkerTags.js";

const MATCH_STARTING_POINT = CellMatcherLayerBitMaskTest.from(GridTags.StartingPoint, MirGridLayers.Tags);


const pattern = new CellMatcherGridPattern();

pattern.addRule(0, 0, matcher_tag_traversable_unoccupied);
pattern.addRule(0, 0, CellMatcherNot.from(MATCH_STARTING_POINT));
pattern.addRule(0, -1, CellMatcherLayerBitMaskTest.from(GridTags.Base, MirGridLayers.Tags));

const rule = GridCellPlacementRule.from(
    pattern,
    [
        GridCellActionPlaceTags.from(GridTags.StartingPoint | GridTags.Occupied, MirGridLayers.Tags),
        GridCellActionPlaceMarker.from({ type: MirMarkerTypes.StartingPoint }),
        // transfer ownership of any base within some distance to the player
        GridCellActionTransformNearbyMarkers.from(5, MarkerNodeMatcherByType.from(MirMarkerTypes.Base), [
            MarkerNodeTransformerRecordProperty.from('team', CellFilterLiteralFloat.from(0)),
            MarkerNodeTransformerRemoveTag.from(MirMarkerTags.Encounter)
        ])
    ]
);

rule.allowRotation = true;

export const mir_generator_place_starting_point = () => GridTaskExecuteRuleTimes.from(rule, 1);
