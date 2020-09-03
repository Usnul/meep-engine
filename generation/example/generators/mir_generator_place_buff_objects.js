import { CellMatcherGridPattern } from "../../rules/cell/CellMatcherGridPattern.js";
import { matcher_tag_traversable_unoccupied } from "../rules/matcher_tag_traversable_unoccupied.js";
import { CellMatcherNot } from "../../rules/logic/CellMatcherNot.js";
import { CellMatcherContainsMarkerWithinRadius } from "../../rules/cell/CellMatcherContainsMarkerWithinRadius.js";
import { GridCellActionPlaceTags } from "../../placement/action/GridCellActionPlaceTags.js";
import { GridTags } from "../../GridTags.js";
import { bitwiseAnd } from "../../../core/binary/operations/bitwiseAnd.js";
import { GridCellActionPlaceMarker } from "../../markers/GridCellActionPlaceMarker.js";
import { GridCellPlacementRule } from "../../placement/GridCellPlacementRule.js";
import { GridTaskActionRuleSet } from "../../grid/generation/discrete/GridTaskCellActionRuleSet.js";
import { GridActionRuleSet } from "../../markers/GridActionRuleSet.js";
import { GridCellActionPlaceMarkerGroup } from "../../markers/GridCellActionPlaceMarkerGroup.js";
import { matcher_tag_not_traversable } from "../rules/matcher_tag_not_traversable.js";
import { MarkerNodeMatcherContainsTag } from "../../markers/matcher/MarkerNodeMatcherContainsTag.js";
import { CellMatcherAnd } from "../../rules/logic/CellMatcherAnd.js";
import { MarkerNodeMatcherByType } from "../../markers/matcher/MarkerNodeMatcherByType.js";
import { CellMatcherOr } from "../../rules/logic/CellMatcherOr.js";
import { RuleSelectionPolicyType } from "../../markers/RuleSelectionPolicyType.js";
import { MarkerNodeMatcherAnd } from "../../markers/matcher/MarkerNodeMatcherAnd.js";
import { MirGridLayers } from "../grid/MirGridLayers.js";
import { CellFilterLiteralFloat } from "../../filtering/numeric/CellFilterLiteralFloat.js";
import { MirMarkerTypes } from "../../../../generator/MirMarkerTypes.js";
import { GridPatternMatcherCell } from "../../rules/cell/GridPatternMatcherCell.js";

const TAG_MAJOR = 'Major Buff';
const TAG_MINOR = 'Minor Buff';


const BUFF_OBJECT_TYPE_ATTACK_POWER = 'Buff Object :: Attack Power Increase';

const BUFF_OBJECT_TYPE_DEFENSE = 'Buff Object :: Defense Increase';

const BUFF_OBJECT_TYPE_WELL = 'Buff Object :: Well';
const BUFF_OBJECT_TYPE_CAMPFIRE = 'Buff Object :: Campfire';

const pMatcherNextToWall = new CellMatcherGridPattern();

pMatcherNextToWall.addRule(0, 1, matcher_tag_not_traversable);
pMatcherNextToWall.addRule(0, 0, matcher_tag_traversable_unoccupied);
pMatcherNextToWall.addRule(0, -1, matcher_tag_traversable_unoccupied);
pMatcherNextToWall.addRule(0, -2, matcher_tag_traversable_unoccupied);


const mBuffObjectNearby = CellMatcherContainsMarkerWithinRadius.from(MarkerNodeMatcherContainsTag.from(MirMarkerTypes.BuffObject), 6);

const mNoBuffObjectsNearby = CellMatcherNot.from(
    mBuffObjectNearby
);

const mNoMajorBuffObjectNearby = CellMatcherNot.from(
    CellMatcherContainsMarkerWithinRadius.from(
        MarkerNodeMatcherAnd.from(
            MarkerNodeMatcherContainsTag.from(MirMarkerTypes.BuffObject),
            MarkerNodeMatcherContainsTag.from(TAG_MAJOR)
        ), 21
    )
);

const mNoMinorBuffObjectNearby = CellMatcherNot.from(
    CellMatcherContainsMarkerWithinRadius.from(
        MarkerNodeMatcherAnd.from(
            MarkerNodeMatcherContainsTag.from(MirMarkerTypes.BuffObject),
            MarkerNodeMatcherContainsTag.from(TAG_MINOR)
        ), 7
    )
);

pMatcherNextToWall.addRule(0, 0, mNoBuffObjectsNearby);

const placeTags = new GridCellActionPlaceTags();

placeTags.layerId = MirGridLayers.Tags;
placeTags.resize(1, 1);
placeTags.fill(GridTags.Occupied);


const clearTags = new GridCellActionPlaceTags();

clearTags.layerId = MirGridLayers.Tags;
clearTags.resize(1, 1);
clearTags.fill(~GridTags.Traversable);
clearTags.operation = bitwiseAnd;

const placeRoadConnector0 = GridCellActionPlaceMarker.from({ type: 'Road Connector' });
placeRoadConnector0.offset.set(0, -1);
placeRoadConnector0.properties.connectivity = 0.1;

const placeRoadMarkers = GridCellActionPlaceMarkerGroup.from([placeRoadConnector0]);


const ruleAttackPower = GridCellPlacementRule.from(
    {
        matcher: CellMatcherAnd.from(
            mNoMajorBuffObjectNearby,
            CellMatcherAnd.from(
                pMatcherNextToWall,
                CellMatcherNot.from(
                    CellMatcherContainsMarkerWithinRadius.from(MarkerNodeMatcherByType.from(BUFF_OBJECT_TYPE_ATTACK_POWER), 42)
                )
            )
        ), actions: [
            placeTags,
            clearTags,
            GridCellActionPlaceMarker.from({
                type: BUFF_OBJECT_TYPE_ATTACK_POWER,
                size: 0.52,
                tags: [MirMarkerTypes.BuffObject, TAG_MAJOR]
            }),
            placeRoadMarkers
        ], probability: CellFilterLiteralFloat.from(0.1)
    });

ruleAttackPower.allowRotation = true;

const ruleDefense = GridCellPlacementRule.from(
    {
        matcher: CellMatcherAnd.from(
            mNoMajorBuffObjectNearby,
            CellMatcherAnd.from(
                pMatcherNextToWall,
                CellMatcherNot.from(
                    CellMatcherContainsMarkerWithinRadius.from(MarkerNodeMatcherByType.from(BUFF_OBJECT_TYPE_DEFENSE), 42)
                )
            )
        ), actions: [
            placeTags,
            clearTags,
            GridCellActionPlaceMarker.from({
                type: BUFF_OBJECT_TYPE_DEFENSE,
                size: 0.52,
                tags: [MirMarkerTypes.BuffObject, TAG_MAJOR]
            }),
            placeRoadMarkers
        ], probability: CellFilterLiteralFloat.from(0.1)
    });

const matchCorner = CellMatcherGridPattern.from([
    GridPatternMatcherCell.from(matcher_tag_not_traversable, 0, -1),
    GridPatternMatcherCell.from(matcher_tag_not_traversable, 1, -1),
    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, 0, 0),
    GridPatternMatcherCell.from(matcher_tag_not_traversable, 1, 0),
]);

const ruleWell = GridCellPlacementRule.from({
    matcher: CellMatcherAnd.from(
        matchCorner,
        CellMatcherAnd.from(
            mNoMinorBuffObjectNearby,
            CellMatcherNot.from(
                CellMatcherOr.from(
                    mBuffObjectNearby,
                    CellMatcherContainsMarkerWithinRadius.from(MarkerNodeMatcherByType.from(BUFF_OBJECT_TYPE_WELL), 21)
                )
            )
        )
    ),
    actions: [
        placeTags,
        clearTags,
        GridCellActionPlaceMarker.from({
            type: BUFF_OBJECT_TYPE_WELL,
            size: 0.52,
            tags: [MirMarkerTypes.BuffObject, TAG_MINOR]
        })
    ],
    probability: CellFilterLiteralFloat.from(0.1)
});

const ruleCampfire = GridCellPlacementRule.from({
    matcher: CellMatcherAnd.from(
        matchCorner,

        CellMatcherAnd.from(
            mNoMinorBuffObjectNearby,
            CellMatcherNot.from(
                CellMatcherOr.from(
                    mBuffObjectNearby,
                    CellMatcherContainsMarkerWithinRadius.from(MarkerNodeMatcherByType.from(BUFF_OBJECT_TYPE_CAMPFIRE), 21)
                )
            )
        )
    ),
    actions: [

        placeTags,
        clearTags,

        GridCellActionPlaceMarker.from({
            type: BUFF_OBJECT_TYPE_CAMPFIRE,
            size: 0.52,
            tags: [MirMarkerTypes.BuffObject, TAG_MINOR]
        })

    ],
    probability: CellFilterLiteralFloat.from(0.1)
});

/**
 *
 * @returns {GridTaskActionRuleSet}
 */
export const mir_generator_place_buff_objects = () => GridTaskActionRuleSet.from({
    rules: GridActionRuleSet.from({
        rules: [
            ruleAttackPower,
            ruleDefense,
            ruleWell,
            ruleCampfire
        ],
        policy: RuleSelectionPolicyType.Random
    })
});
