import { CellMatcherNot } from "../../rules/CellMatcherNot.js";
import { matcher_tag_occupied } from "./matcher_tag_occupied.js";

export const matcher_tag_unoccupied = CellMatcherNot.from(matcher_tag_occupied);
