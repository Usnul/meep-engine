import { CellMatcherNot } from "../../rules/logic/CellMatcherNot.js";
import { matcher_tag_traversable } from "./matcher_tag_traversable.js";

export const matcher_tag_not_traversable = CellMatcherNot.from(matcher_tag_traversable);
