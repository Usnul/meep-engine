import { Theme } from "../Theme.js";
import { TerrainTheme } from "../TerrainTheme.js";
import { TerrainLayerRule } from "../TerrainLayerRule.js";
import { GridCellRuleContainsTag } from "../../rules/GridCellRuleContainsTag.js";
import { GridTags } from "../../GridTags.js";
import { GridCellRuleNot } from "../../rules/GridCellRuleNot.js";

export const SampleTheme2 = new Theme();

const terrainTheme1 = new TerrainTheme();

const tlrGround1 = new TerrainLayerRule();

tlrGround1.layer = 4;
tlrGround1.rule = new GridCellRuleContainsTag();
tlrGround1.rule.tags = GridTags.Empty;

const tlrRock1 = new TerrainLayerRule();
tlrRock1.layer = 5;
const rockRule1 = new GridCellRuleNot();
rockRule1.source = new GridCellRuleContainsTag();
rockRule1.source.tags = GridTags.Empty;

tlrRock1.rule = rockRule1;

terrainTheme1.rules.push(tlrGround1);
terrainTheme1.rules.push(tlrRock1);

SampleTheme2.terrain = terrainTheme1;
