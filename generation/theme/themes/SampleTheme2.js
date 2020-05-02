import { Theme } from "../Theme.js";
import { TerrainTheme } from "../TerrainTheme.js";
import { TerrainLayerRule } from "../TerrainLayerRule.js";
import { TagRuleContains } from "../../rules/TagRuleContains.js";
import { GridTags } from "../../GridTags.js";
import { TagRuleNot } from "../../rules/TagRuleNot.js";

export const SampleTheme2 = new Theme();

const terrainTheme1 = new TerrainTheme();

const tlrGround1 = new TerrainLayerRule();

tlrGround1.layer = 4;
tlrGround1.rule = new TagRuleContains();
tlrGround1.rule.tags = GridTags.Empty;

const tlrRock1 = new TerrainLayerRule();
tlrRock1.layer = 5;
const rockRule1 = new TagRuleNot();
rockRule1.source = new TagRuleContains();
rockRule1.source.tags = GridTags.Empty;

tlrRock1.rule = rockRule1;

terrainTheme1.rules.push(tlrGround1);
terrainTheme1.rules.push(tlrRock1);

SampleTheme2.terrain = terrainTheme1;
