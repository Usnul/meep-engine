import { CellMatcherNot } from "../../rules/logic/CellMatcherNot.js";
import { matcher_play_area } from "./matcher_play_area.js";

export const matcher_not_play_area = CellMatcherNot.from(matcher_play_area);
