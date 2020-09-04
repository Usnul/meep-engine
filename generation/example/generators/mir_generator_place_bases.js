import { GridTaskActionRuleSet } from "../../grid/generation/discrete/GridTaskCellActionRuleSet.js";
import { GridCellPlacementRule } from "../../placement/GridCellPlacementRule.js";
import { CellMatcherGridPattern } from "../../rules/cell/CellMatcherGridPattern.js";
import { GridActionRuleSet } from "../../markers/GridActionRuleSet.js";
import { GridCellActionPlaceTags } from "../../placement/action/GridCellActionPlaceTags.js";
import { GridTags } from "../../GridTags.js";
import { GridCellActionPlaceMarker } from "../../markers/GridCellActionPlaceMarker.js";
import { CellMatcherNot } from "../../rules/logic/CellMatcherNot.js";
import { CellMatcherContainsMarkerWithinRadius } from "../../rules/cell/CellMatcherContainsMarkerWithinRadius.js";
import { matcher_tag_traversable_unoccupied } from "../rules/matcher_tag_traversable_unoccupied.js";
import { bitwiseAnd } from "../../../core/binary/operations/bitwiseAnd.js";
import { GridCellActionPlaceMarkerGroup } from "../../markers/GridCellActionPlaceMarkerGroup.js";
import { MarkerNodeMatcherByType } from "../../markers/matcher/MarkerNodeMatcherByType.js";
import { MirGridLayers } from "../grid/MirGridLayers.js";
import { CellFilterLiteralFloat } from "../../filtering/numeric/CellFilterLiteralFloat.js";
import { MarkerNodeEmitterGridCellAction } from "../../markers/emitter/MarkerNodeEmitterGridCellAction.js";
import { MarkerNodeEmitterPredicated } from "../../markers/emitter/MarkerNodeEmitterPredicated.js";
import { GridDataNodePredicateNot } from "../../markers/predicate/GridDataNodePredicateNot.js";
import { GridDataNodePredicateOverlaps } from "../../markers/predicate/GridDataNodePredicateOverlaps.js";
import { MarkerNodeMatcherAny } from "../../markers/matcher/MarkerNodeMatcherAny.js";
import { MarkerNodeEmitterFromAction } from "../../markers/emitter/MarkerNodeEmitterFromAction.js";
import { Transform } from "../../../engine/ecs/transform/Transform.js";
import { MarkerNodeTransformerOffsetPosition } from "../../markers/transform/MarkerNodeTransformerOffsetPosition.js";
import { MarkerNodeTransformerRecordUniqueRandomEnum } from "../../markers/transform/MarkerNodeTransformerRecordUniqueRandomEnum.js";
import { MirMarkerTypes } from "../../../../generator/MirMarkerTypes.js";
import { MirMarkerTags } from "../../../../generator/MirMarkerTags.js";

const pMatcher = new CellMatcherGridPattern();

pMatcher.addRule(0, 0, matcher_tag_traversable_unoccupied);
pMatcher.addRule(1, 0, matcher_tag_traversable_unoccupied);
pMatcher.addRule(0, 1, matcher_tag_traversable_unoccupied);
pMatcher.addRule(1, 1, matcher_tag_traversable_unoccupied);


//no other bases nearby
pMatcher.addRule(0, 0, CellMatcherNot.from(
    CellMatcherContainsMarkerWithinRadius.from(MarkerNodeMatcherByType.from(MirMarkerTypes.Base), 25)
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

const name_set = [];

for (let i = 0; i < 100; i++) {
    name_set.push(`base-${i}`);
}

const rule = GridCellPlacementRule.from({
    matcher: pMatcher, actions: [
        placeTags,
        clearTags,
        MarkerNodeEmitterGridCellAction.from(
            MarkerNodeEmitterPredicated.from({
                predicate: GridDataNodePredicateNot.from(GridDataNodePredicateOverlaps.from(MarkerNodeMatcherAny.INSTANCE)),
                source: MarkerNodeEmitterFromAction.from([
                    GridCellActionPlaceMarker.from({
                        type: MirMarkerTypes.Base,
                        size: 0.5,
                        tags: ['Town', MirMarkerTags.Encounter],
                        properties: {
                            // assign to enemy team
                            team: 1
                        },
                        transform: Transform.fromJSON({
                            position: {
                                x: 0.5,
                                y: 0,
                                z: 0.5
                            }
                        }),
                        transformers: [

                            MarkerNodeTransformerRecordUniqueRandomEnum.from(
                                'name',
                                name_set
                            )
                        ]
                    }),
                    GridCellActionPlaceMarker.from({
                        type: 'Virtual',
                        size: 0.5,
                        transformers: [
                            MarkerNodeTransformerOffsetPosition.from(1, 0)
                        ]
                    }),
                    GridCellActionPlaceMarker.from({
                        type: 'Virtual',
                        size: 0.5,
                        transformers: [
                            MarkerNodeTransformerOffsetPosition.from(0, 1)
                        ]
                    }),
                    GridCellActionPlaceMarker.from({
                        type: 'Virtual',
                        size: 0.5,
                        transformers: [
                            MarkerNodeTransformerOffsetPosition.from(1, 1)
                        ]
                    })
                ])
            })
        ),
        placeRoadConnectors
    ], probability: CellFilterLiteralFloat.from(0.1)
});

rule.allowRotation = false;

/**
 *
 * @returns {GridTaskActionRuleSet}
 */
export const mir_generator_place_bases = () => GridTaskActionRuleSet.from({ rules: GridActionRuleSet.from({ rules: [rule] }) });
