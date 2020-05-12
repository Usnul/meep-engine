import { Theme } from "../../theme/Theme.js";
import { TerrainTheme } from "../../theme/TerrainTheme.js";
import { TerrainLayerRule } from "../../theme/TerrainLayerRule.js";
import { GridCellRuleContainsTag } from "../../rules/GridCellRuleContainsTag.js";
import { GridTags } from "../../GridTags.js";
import { CellMatcherNot } from "../../rules/CellMatcherNot.js";

export const SampleTheme2 = new Theme();

const terrainTheme1 = new TerrainTheme();

const tlrGround1 = new TerrainLayerRule();

tlrGround1.layer = 4;
tlrGround1.rule = new GridCellRuleContainsTag();
tlrGround1.rule.tags = GridTags.Traversable;

const tlrRock1 = new TerrainLayerRule();
tlrRock1.layer = 5;
const rockRule1 = new CellMatcherNot();
rockRule1.source = new GridCellRuleContainsTag();
rockRule1.source.tags = GridTags.Traversable;

tlrRock1.rule = rockRule1;

terrainTheme1.rules.push(tlrGround1);
terrainTheme1.rules.push(tlrRock1);

SampleTheme2.terrain = terrainTheme1;
