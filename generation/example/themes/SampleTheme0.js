import { Theme } from "../../theme/Theme.js";
import { TerrainTheme } from "../../theme/TerrainTheme.js";
import { TerrainLayerRule } from "../../theme/TerrainLayerRule.js";
import { MarkerProcessingRule } from "../../markers/actions/MarkerProcessingRule.js";
import { MarkerNodeMatcherByType } from "../../markers/matcher/MarkerNodeMatcherByType.js";
import { MarkerNodeActionEntityPlacement } from "../../markers/actions/MarkerNodeActionEntityPlacement.js";
import { EntityBlueprint } from "../../../engine/ecs/EntityBlueprint.js";
import Mesh from "../../../engine/graphics/ecs/mesh/Mesh.js";
import { Transform } from "../../../engine/ecs/components/Transform.js";
import GridPosition from "../../../engine/grid/components/GridPosition.js";
import { matcher_tag_not_traversable } from "../rules/matcher_tag_not_traversable.js";
import { matcher_tag_traversable } from "../rules/matcher_tag_traversable.js";
import { GridCellRuleContainsTag } from "../../rules/GridCellRuleContainsTag.js";
import { GridTags } from "../../GridTags.js";
import { CellMatcherAnd } from "../../rules/CellMatcherAnd.js";
import { CellMatcherNot } from "../../rules/CellMatcherNot.js";
import { CellFilterCellMatcher } from "../../filtering/CellFilterCellMatcher.js";
import { CellFilterSimplexNoise } from "../../filtering/CellFilterSimplexNoise.js";
import { CellFilterFXAA } from "../../filtering/CellFilterFXAA.js";
import { CellFilterMultiply } from "../../filtering/algebra/CellFilterMultiply.js";
import { CellFilterLerp } from "../../filtering/CellFilterLerp.js";
import { CellFilterConstant } from "../../filtering/CellFilterConstant.js";
import Tag from "../../../engine/ecs/components/Tag.js";
import HeadsUpDisplay from "../../../engine/ecs/gui/hud/HeadsUpDisplay.js";
import ViewportPosition from "../../../engine/ecs/gui/ViewportPosition.js";
import GUIElement from "../../../engine/ecs/gui/GUIElement.js";

export const SampleTheme0 = new Theme();

const terrainTheme = new TerrainTheme();

const matcher_tag_road = GridCellRuleContainsTag.from(GridTags.Road);

terrainTheme.rules.push(TerrainLayerRule.from(
    CellFilterCellMatcher.from(
        CellMatcherAnd.from(matcher_tag_traversable, CellMatcherNot.from(matcher_tag_road))
    ),
    0
));

terrainTheme.rules.push(TerrainLayerRule.from(
    CellFilterCellMatcher.from(matcher_tag_not_traversable),
    1
));

const NOISE_10_a = CellFilterSimplexNoise.from(30, 30);

const ROAD_FILTER = CellFilterCellMatcher.from(matcher_tag_road);
const ROAD_FILTER_AA = CellFilterFXAA.from(ROAD_FILTER);

terrainTheme.rules.push(TerrainLayerRule.from(
    CellFilterMultiply.from(
        ROAD_FILTER,
        CellFilterLerp.from(CellFilterConstant.from(0.3), CellFilterConstant.from(1), NOISE_10_a)
    ),
    2,
));

terrainTheme.rules.push(TerrainLayerRule.from(
    CellFilterMultiply.from(
        ROAD_FILTER,
        CellFilterLerp.from(CellFilterConstant.from(1), CellFilterConstant.from(0.3), NOISE_10_a)
    ),
    0,
));

SampleTheme0.terrain = terrainTheme;


const ebpTreasure = new EntityBlueprint();
ebpTreasure.add(Mesh.fromJSON({ url: 'data/models/snaps/cube_yellow.gltf', castShadow: true, receiveShadow: true }));
ebpTreasure.add(Transform.fromJSON({}));
ebpTreasure.add(GridPosition.fromJSON({}));

const nrTreasure = new MarkerProcessingRule();

nrTreasure.consume = true;
nrTreasure.matcher = MarkerNodeMatcherByType.from('Treasure');

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
nrStartingPoint.matcher = MarkerNodeMatcherByType.from('Starting Point');

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
nrEnemy.matcher = MarkerNodeMatcherByType.from('Enemy');

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
nrBase.matcher = MarkerNodeMatcherByType.from('Base');

nrBase.actions.push(MarkerNodeActionEntityPlacement.from(ebpBase, Transform.fromJSON({
    scale: { x: 1, y: 0.1, z: 1 },
    position: { x: 0, y: 0.1, z: 0 }
})));

SampleTheme0.nodes.add(nrBase);

const ebpRoadJunction90 = new EntityBlueprint();
ebpRoadJunction90.add(Mesh.fromJSON({ url: 'data/models/snaps/cube_blue.gltf' }));
ebpRoadJunction90.add(Transform.fromJSON({}));
ebpRoadJunction90.add(GridPosition.fromJSON({}));

const nrRoadJunction90 = new MarkerProcessingRule();

nrRoadJunction90.consume = true;
nrRoadJunction90.matcher = MarkerNodeMatcherByType.from('Road Junction Decorator 90');

nrRoadJunction90.actions.push(MarkerNodeActionEntityPlacement.from(ebpRoadJunction90, Transform.fromJSON({
    scale: { x: 0.1, y: 1, z: 0.1 },
    position: { x: 0, y: 1, z: 0 }
})));

SampleTheme0.nodes.add(nrRoadJunction90);

const ebpBuffObject0 = new EntityBlueprint();
ebpBuffObject0.add(Mesh.fromJSON({ url: 'data/models/snaps/cube_lilac.gltf' }));
ebpBuffObject0.add(new Tag());
ebpBuffObject0.add(new HeadsUpDisplay());
ebpBuffObject0.add(new ViewportPosition());
ebpBuffObject0.add(GUIElement.fromJSON({
    parameters: {
        id: 'Attack',
        classList: "__debug-plaque"
    },
    klass: 'view.LocalizedLabel'
}));
ebpBuffObject0.add(Transform.fromJSON({}));
ebpBuffObject0.add(GridPosition.fromJSON({}));

const nrBuffObject = new MarkerProcessingRule();

nrBuffObject.consume = true;
nrBuffObject.matcher = MarkerNodeMatcherByType.from('Buff Object :: Attack Power Increase');

nrBuffObject.actions.push(MarkerNodeActionEntityPlacement.from(ebpBuffObject0, Transform.fromJSON({
    scale: { x: 0.4, y: 1, z: 0.4 },
    position: { x: 0, y: 1, z: 0 }
})));

SampleTheme0.nodes.add(nrBuffObject);

const ebpBuffObjectDefense = new EntityBlueprint();
ebpBuffObjectDefense.add(Mesh.fromJSON({ url: 'data/models/snaps/cube_lilac.gltf' }));
ebpBuffObjectDefense.add(new Tag());
ebpBuffObjectDefense.add(new HeadsUpDisplay());
ebpBuffObjectDefense.add(new ViewportPosition());
ebpBuffObjectDefense.add(GUIElement.fromJSON({
    parameters: {
        id: 'Defense',
        classList: "__debug-plaque"
    },
    klass: 'view.LocalizedLabel'
}));
ebpBuffObjectDefense.add(Transform.fromJSON({}));
ebpBuffObjectDefense.add(GridPosition.fromJSON({}));

const nrBuffObjectDefense = new MarkerProcessingRule();

nrBuffObjectDefense.consume = true;
nrBuffObjectDefense.matcher = MarkerNodeMatcherByType.from('Buff Object :: Defense Increase');

nrBuffObjectDefense.actions.push(MarkerNodeActionEntityPlacement.from(ebpBuffObjectDefense, Transform.fromJSON({
    scale: { x: 0.4, y: 1, z: 0.4 },
    position: { x: 0, y: 1, z: 0 }
})));

SampleTheme0.nodes.add(nrBuffObjectDefense);

const ebpBuffObjectWell = new EntityBlueprint();
ebpBuffObjectWell.add(Mesh.fromJSON({ url: 'data/models/snaps/cube_lilac.gltf' }));
ebpBuffObjectWell.add(new Tag());
ebpBuffObjectWell.add(new HeadsUpDisplay());
ebpBuffObjectWell.add(new ViewportPosition());
ebpBuffObjectWell.add(GUIElement.fromJSON({
    parameters: {
        id: 'Well',
        classList: "__debug-plaque"
    },
    klass: 'view.LocalizedLabel'
}));
ebpBuffObjectWell.add(Transform.fromJSON({}));
ebpBuffObjectWell.add(GridPosition.fromJSON({}));

const nrBuffObjectWell = new MarkerProcessingRule();

nrBuffObjectWell.consume = true;
nrBuffObjectWell.matcher = MarkerNodeMatcherByType.from('Buff Object :: Well');

nrBuffObjectWell.actions.push(MarkerNodeActionEntityPlacement.from(ebpBuffObjectWell, Transform.fromJSON({
    scale: { x: 0.4, y: 1, z: 0.4 },
    position: { x: 0, y: 1, z: 0 }
})));

SampleTheme0.nodes.add(nrBuffObjectWell);

const ebpBuffObjectCampfire = new EntityBlueprint();
ebpBuffObjectCampfire.add(Mesh.fromJSON({ url: 'data/models/snaps/cube_lilac.gltf' }));
ebpBuffObjectCampfire.add(new Tag());
ebpBuffObjectCampfire.add(new HeadsUpDisplay());
ebpBuffObjectCampfire.add(new ViewportPosition());
ebpBuffObjectCampfire.add(GUIElement.fromJSON({
    parameters: {
        id: 'Campfire',
        classList: "__debug-plaque"
    },
    klass: 'view.LocalizedLabel'
}));
ebpBuffObjectCampfire.add(Transform.fromJSON({}));
ebpBuffObjectCampfire.add(GridPosition.fromJSON({}));

const nrBuffObjectCampfire = new MarkerProcessingRule();

nrBuffObjectCampfire.consume = true;
nrBuffObjectCampfire.matcher = MarkerNodeMatcherByType.from('Buff Object :: Campfire');

nrBuffObjectCampfire.actions.push(MarkerNodeActionEntityPlacement.from(ebpBuffObjectCampfire, Transform.fromJSON({
    scale: { x: 0.4, y: 1, z: 0.4 },
    position: { x: 0, y: 1, z: 0 }
})));

SampleTheme0.nodes.add(nrBuffObjectCampfire);
