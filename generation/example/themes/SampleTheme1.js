import { Theme } from "../../theme/Theme.js";
import { TerrainTheme } from "../../theme/TerrainTheme.js";
import { TerrainLayerRule } from "../../theme/TerrainLayerRule.js";
import { GridCellRuleContainsTag } from "../../rules/GridCellRuleContainsTag.js";
import { GridTags } from "../../GridTags.js";
import { GridCellRuleNot } from "../../rules/GridCellRuleNot.js";

export const SampleTheme1 = new Theme();

const terrainTheme1 = new TerrainTheme();

const tlrGround1 = new TerrainLayerRule();

tlrGround1.layer = 2;
tlrGround1.rule = new GridCellRuleContainsTag();
tlrGround1.rule.tags = GridTags.Empty;

const tlrRock1 = new TerrainLayerRule();
tlrRock1.layer = 3;
const rockRule1 = new GridCellRuleNot();
rockRule1.source = new GridCellRuleContainsTag();
rockRule1.source.tags = GridTags.Empty;

tlrRock1.rule = rockRule1;

terrainTheme1.rules.push(tlrGround1);
terrainTheme1.rules.push(tlrRock1);

SampleTheme1.terrain = terrainTheme1;
