import { CellMatcherGridPattern } from "../../rules/cell/CellMatcherGridPattern.js";
import { matcher_tag_not_traversable } from "./matcher_tag_not_traversable.js";
import { matcher_tag_traversable_unoccupied } from "./matcher_tag_traversable_unoccupied.js";
import { CellMatcherOr } from "../../rules/logic/CellMatcherOr.js";
import { GridPatternMatcherCell } from "../../rules/cell/GridPatternMatcherCell.js";

const pCorridor_1 = CellMatcherGridPattern.from([
    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, 0, 0),

    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, -1, 0),
    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, 1, 0),

    GridPatternMatcherCell.from(matcher_tag_not_traversable, 0, -1),
    GridPatternMatcherCell.from(matcher_tag_not_traversable, 0, 1),
]);

const pCorridor_2 = CellMatcherGridPattern.from([
    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, 0, 0),
    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, 0, 1),

    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, -1, 0),
    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, 1, 0),

    GridPatternMatcherCell.from(matcher_tag_not_traversable, 0, -1),
    GridPatternMatcherCell.from(matcher_tag_not_traversable, 0, 2),
]);

const pCorridor_3 = CellMatcherGridPattern.from([
    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, 0, -1),
    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, 0, 0),
    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, 0, 1),

    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, -1, 0),
    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, 1, 0),

    GridPatternMatcherCell.from(matcher_tag_not_traversable, 0, -2),
    GridPatternMatcherCell.from(matcher_tag_not_traversable, 0, 2),
]);

const pCorridor_diagonal_3 = CellMatcherGridPattern.from([
    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, -1, -1),
    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, -1, 0),
    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, -1, 1),

    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, 0, -1),
    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, 0, 0),
    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, 0, 1),

    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, 1, -1),
    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, 1, 0),
    GridPatternMatcherCell.from(matcher_tag_traversable_unoccupied, 1, 1),

    GridPatternMatcherCell.from(matcher_tag_not_traversable, -2, -2),
    GridPatternMatcherCell.from(matcher_tag_not_traversable, 2, 2),
]);


export const mir_matcher_attack_corridor = CellMatcherOr.from(
    CellMatcherOr.from(
        pCorridor_1,
        pCorridor_2,
    ),
    CellMatcherOr.from(
        pCorridor_3,
        pCorridor_diagonal_3
    )
);
