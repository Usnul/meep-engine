import { Theme } from "../Theme.js";
import { TerrainTheme } from "../TerrainTheme.js";
import { TerrainLayerRule } from "../TerrainLayerRule.js";
import { TagRuleContains } from "../../rules/TagRuleContains.js";
import { GridTags } from "../../GridTags.js";
import { TagRuleNot } from "../../rules/TagRuleNot.js";

export const SampleTheme0 = new Theme();


const terrainTheme = new TerrainTheme();

const tlrGround = new TerrainLayerRule();

tlrGround.layer = 0;
tlrGround.rule = new TagRuleContains();
tlrGround.rule.tags = GridTags.Empty;

const tlrRock = new TerrainLayerRule();
tlrRock.layer = 1;
const rockRule = new TagRuleNot();
rockRule.source = new TagRuleContains();
rockRule.source.tags = GridTags.Empty;

tlrRock.rule = rockRule;

terrainTheme.rules.push(tlrGround);
terrainTheme.rules.push(tlrRock);

SampleTheme0.terrain = terrainTheme;

