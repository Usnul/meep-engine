import { CellMatcherAnd } from "../../rules/logic/CellMatcherAnd.js";
import { matcher_tag_traversable } from "./matcher_tag_traversable.js";
import { matcher_tag_unoccupied } from "./matcher_tag_unoccupied.js";

export const matcher_tag_traversable_unoccupied = CellMatcherAnd.from(matcher_tag_traversable, matcher_tag_unoccupied);
