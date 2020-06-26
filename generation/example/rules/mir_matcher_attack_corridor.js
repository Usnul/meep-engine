import { CellMatcherGridPattern } from "../../rules/cell/CellMatcherGridPattern.js";
import { matcher_tag_not_traversable } from "./matcher_tag_not_traversable.js";
import { matcher_tag_traversable_unoccupied } from "./matcher_tag_traversable_unoccupied.js";
import { CellMatcherOr } from "../../rules/logic/CellMatcherOr.js";

//
const pCorridor0 = new CellMatcherGridPattern();

pCorridor0.addRule(0, 0, matcher_tag_traversable_unoccupied);

pCorridor0.addRule(0, -1, matcher_tag_traversable_unoccupied);
pCorridor0.addRule(0, 1, matcher_tag_traversable_unoccupied);

pCorridor0.addRule(-1, 0, matcher_tag_not_traversable);
pCorridor0.addRule(1, 0, matcher_tag_not_traversable);

//
const pCorridor1 = new CellMatcherGridPattern();

pCorridor1.addRule(0, 0, matcher_tag_traversable_unoccupied);

pCorridor1.addRule(0, -1, matcher_tag_traversable_unoccupied);
pCorridor1.addRule(0, 1, matcher_tag_traversable_unoccupied);

pCorridor1.addRule(-2, 0, matcher_tag_not_traversable);
pCorridor1.addRule(2, 0, matcher_tag_not_traversable);

//
const pCorridorDiagonal1 = new CellMatcherGridPattern();

pCorridorDiagonal1.addRule(0, 0, matcher_tag_traversable_unoccupied);

pCorridorDiagonal1.addRule(0, -1, matcher_tag_traversable_unoccupied);
pCorridorDiagonal1.addRule(0, 1, matcher_tag_traversable_unoccupied);

pCorridorDiagonal1.addRule(-1, -1, matcher_tag_not_traversable);
pCorridorDiagonal1.addRule(1, 1, matcher_tag_not_traversable);


//
const pCorridorDiagonal2 = new CellMatcherGridPattern();

pCorridorDiagonal2.addRule(0, 0, matcher_tag_traversable_unoccupied);

pCorridorDiagonal2.addRule(0, -1, matcher_tag_traversable_unoccupied);
pCorridorDiagonal2.addRule(0, 1, matcher_tag_traversable_unoccupied);

pCorridorDiagonal2.addRule(1, -1, matcher_tag_not_traversable);
pCorridorDiagonal2.addRule(-1, 1, matcher_tag_not_traversable);

//
const pCorridorLargeDiagonal1 = new CellMatcherGridPattern();

pCorridorLargeDiagonal1.addRule(0, 0, matcher_tag_traversable_unoccupied);

pCorridorLargeDiagonal1.addRule(1, 0, matcher_tag_traversable_unoccupied);
pCorridorLargeDiagonal1.addRule(2, 0, matcher_tag_traversable_unoccupied);
pCorridorLargeDiagonal1.addRule(-1, 0, matcher_tag_traversable_unoccupied);
pCorridorLargeDiagonal1.addRule(-2, 0, matcher_tag_traversable_unoccupied);

pCorridorLargeDiagonal1.addRule(2, -2, matcher_tag_not_traversable);
pCorridorLargeDiagonal1.addRule(-2, 2, matcher_tag_not_traversable);

//
const pCorridorLargeDiagonal2 = new CellMatcherGridPattern();

pCorridorLargeDiagonal2.addRule(0, 0, matcher_tag_traversable_unoccupied);

pCorridorLargeDiagonal2.addRule(2, 0, matcher_tag_traversable_unoccupied);
pCorridorLargeDiagonal2.addRule(1, 0, matcher_tag_traversable_unoccupied);
pCorridorLargeDiagonal2.addRule(-1, 0, matcher_tag_traversable_unoccupied);
pCorridorLargeDiagonal2.addRule(-2, 0, matcher_tag_traversable_unoccupied);

pCorridorLargeDiagonal2.addRule(-2, -2, matcher_tag_not_traversable);
pCorridorLargeDiagonal2.addRule(2, 2, matcher_tag_not_traversable);


export const mir_matcher_attack_corridor = CellMatcherOr.from(pCorridor0,
    CellMatcherOr.from(pCorridor1,
        CellMatcherOr.from(
            CellMatcherOr.from(pCorridorDiagonal1, pCorridorDiagonal2),
            CellMatcherOr.from(pCorridorLargeDiagonal1, pCorridorLargeDiagonal2)
        )
    )
);
