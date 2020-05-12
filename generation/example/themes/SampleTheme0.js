import { Theme } from "../../theme/Theme.js";
import { TerrainTheme } from "../../theme/TerrainTheme.js";
import { TerrainLayerRule } from "../../theme/TerrainLayerRule.js";
import { MarkerProcessingRule } from "../../markers/actions/MarkerProcessingRule.js";
import { TypeMarkerNodeMatcher } from "../../markers/matcher/TypeMarkerNodeMatcher.js";
import { MarkerNodeActionEntityPlacement } from "../../markers/actions/MarkerNodeActionEntityPlacement.js";
import { EntityBlueprint } from "../../../engine/ecs/EntityBlueprint.js";
import Mesh from "../../../engine/graphics/ecs/mesh/Mesh.js";
import { Transform } from "../../../engine/ecs/components/Transform.js";
import GridPosition from "../../../engine/grid/components/GridPosition.js";
import { matcher_tag_not_traversable } from "../rules/matcher_tag_not_traversable.js";
import { matcher_tag_traversable } from "../rules/matcher_tag_traversable.js";
import { GridCellRuleContainsTag } from "../../rules/GridCellRuleContainsTag.js";
import { GridTags } from "../../GridTags.js";

export const SampleTheme0 = new Theme();

const terrainTheme = new TerrainTheme();

terrainTheme.rules.push(TerrainLayerRule.from(matcher_tag_traversable, 0));
terrainTheme.rules.push(TerrainLayerRule.from(matcher_tag_not_traversable, 1));
terrainTheme.rules.push(TerrainLayerRule.from(GridCellRuleContainsTag.from(GridTags.Occupied), 2));

SampleTheme0.terrain = terrainTheme;


const ebpTreasure = new EntityBlueprint();
ebpTreasure.add(Mesh.fromJSON({ url: 'data/models/snaps/cube_yellow.gltf', castShadow: true, receiveShadow: true }));
ebpTreasure.add(Transform.fromJSON({}));
ebpTreasure.add(GridPosition.fromJSON({}));

const nrTreasure = new MarkerProcessingRule();

nrTreasure.consume = true;
nrTreasure.matcher = TypeMarkerNodeMatcher.from('Treasure');

nrTreasure.actions.push(MarkerNodeActionEntityPlacement.from(ebpTreasure, Transform.fromJSON({
    scale: { x: 0.25, y: 0.25, z: 0.5 },
    position: { x: 0, y: 0.25, z: 0 }
})));

SampleTheme0.nodes.add(nrTreasure);


const ebpStartingPoint = new EntityBlueprint();
ebpStartingPoint.add(Mesh.fromJSON({
    url: 'data/models/snaps/cube_green.gltf',
    castShadow: true,
    receiveShadow: true
}));
ebpStartingPoint.add(Transform.fromJSON({}));
ebpStartingPoint.add(GridPosition.fromJSON({}));

const nrStartingPoint = new MarkerProcessingRule();

nrStartingPoint.consume = true;
nrStartingPoint.matcher = TypeMarkerNodeMatcher.from('Starting Point');

nrStartingPoint.actions.push(MarkerNodeActionEntityPlacement.from(ebpStartingPoint, Transform.fromJSON({
    scale: { x: 0.5, y: 0.5, z: 0.5 },
    position: { x: 0, y: 0.5, z: 0 }
})));

SampleTheme0.nodes.add(nrStartingPoint);

const ebpEnemy = new EntityBlueprint();
ebpEnemy.add(Mesh.fromJSON({ url: 'data/models/snaps/cube_red.gltf', castShadow: true, receiveShadow: true }));
ebpEnemy.add(Transform.fromJSON({}));
ebpEnemy.add(GridPosition.fromJSON({}));

const nrEnemy = new MarkerProcessingRule();

nrEnemy.consume = true;
nrEnemy.matcher = TypeMarkerNodeMatcher.from('Enemy');

nrEnemy.actions.push(MarkerNodeActionEntityPlacement.from(ebpEnemy, Transform.fromJSON({
    scale: { x: 0.3, y: 0.5, z: 0.3 },
    position: { x: 0, y: 0.5, z: 0 }
})));

SampleTheme0.nodes.add(nrEnemy);

const ebpBase = new EntityBlueprint();
ebpBase.add(Mesh.fromJSON({ url: 'data/models/snaps/cube_blue.gltf' }));
ebpBase.add(Transform.fromJSON({}));
ebpBase.add(GridPosition.fromJSON({}));

const nrBase = new MarkerProcessingRule();

nrBase.consume = true;
nrBase.matcher = TypeMarkerNodeMatcher.from('Base');

nrBase.actions.push(MarkerNodeActionEntityPlacement.from(ebpBase, Transform.fromJSON({
    scale: { x: 1, y: 0.1, z: 1 },
    position: { x: 0, y: 0.1, z: 0 }
})));

SampleTheme0.nodes.add(nrBase);
