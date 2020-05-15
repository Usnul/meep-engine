import { Theme } from "../../theme/Theme.js";
import { TerrainTheme } from "../../theme/TerrainTheme.js";
import { TerrainLayerRule } from "../../theme/TerrainLayerRule.js";
import { CellFilterCellMatcher } from "../../filtering/CellFilterCellMatcher.js";
import { matcher_tag_traversable } from "../rules/matcher_tag_traversable.js";
import { matcher_tag_not_traversable } from "../rules/matcher_tag_not_traversable.js";

export const SampleTheme1 = new Theme();

const terrainTheme1 = new TerrainTheme();

const tlrGround1 = TerrainLayerRule.from(CellFilterCellMatcher.from(matcher_tag_traversable), 2);

const tlrRock1 = TerrainLayerRule.from(CellFilterCellMatcher.from(matcher_tag_not_traversable), 3);

terrainTheme1.rules.push(tlrGround1);
terrainTheme1.rules.push(tlrRock1);

SampleTheme1.terrain = terrainTheme1;
