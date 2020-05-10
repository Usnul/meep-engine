import { Theme } from "../Theme.js";
import { TerrainTheme } from "../TerrainTheme.js";
import { TerrainLayerRule } from "../TerrainLayerRule.js";
import { TagRuleContains } from "../../rules/TagRuleContains.js";
import { GridTags } from "../../GridTags.js";
import { TagRuleNot } from "../../rules/TagRuleNot.js";
import { MarkerProcessingRule } from "../../markers/actions/MarkerProcessingRule.js";
import { TypeMarkerNodeMatcher } from "../../markers/matcher/TypeMarkerNodeMatcher.js";
import { MarkerNodeActionEntityPlacement } from "../../markers/actions/MarkerNodeActionEntityPlacement.js";
import { EntityBlueprint } from "../../../engine/ecs/EntityBlueprint.js";
import Mesh from "../../../engine/graphics/ecs/mesh/Mesh.js";
import { Transform } from "../../../engine/ecs/components/Transform.js";
import GridPosition from "../../../engine/grid/components/GridPosition.js";

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


const ebpTreasure = new EntityBlueprint();
ebpTreasure.add(Mesh.fromJSON({ url: 'data/models/snaps/cube_yellow.gltf' }));
ebpTreasure.add(Transform.fromJSON({}));
ebpTreasure.add(GridPosition.fromJSON({}));

const nrTreasure = new MarkerProcessingRule();

nrTreasure.consume = true;
nrTreasure.matcher = TypeMarkerNodeMatcher.from('Treasure');
nrTreasure.actions.push(MarkerNodeActionEntityPlacement.from(ebpTreasure));

SampleTheme0.nodes.add(nrTreasure)
