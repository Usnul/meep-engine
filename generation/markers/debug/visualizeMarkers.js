import {
    BufferGeometry,
    Group,
    Line,
    LineBasicMaterial,
    Mesh as ThreeMesh,
    MeshLambertMaterial,
    TetrahedronBufferGeometry
} from "three";
import EntityBuilder from "../../../engine/ecs/EntityBuilder.js";
import Renderable from "../../../engine/ecs/components/Renderable.js";
import { Transform } from "../../../engine/ecs/transform/Transform.js";
import { obtainTerrain } from "../../../../model/game/scenes/SceneUtils.js";
import LabelView from "../../../view/common/LabelView.js";
import GUIElement from "../../../engine/ecs/gui/GUIElement.js";
import ViewportPosition from "../../../engine/ecs/gui/ViewportPosition.js";
import HeadsUpDisplay from "../../../engine/ecs/gui/hud/HeadsUpDisplay.js";

function formatValue(v) {

    if (typeof v === "number" && v % 1 !== 0) {
        return v.toPrecision(3);
    }

    return v;

}

/**
 *
 * @param {GridData} grid
 * @param {EntityComponentDataset} ecd
 */
export function visualizeMarkers(grid, ecd) {

    /**
     *
     * @type {MarkerNode[]}
     */
    const markers = [];

    grid.markers.getRawData(markers);

    const n = markers.length;

    const m0 = new MeshLambertMaterial({ color: 0xFFFFFF });
    const m1 = new MeshLambertMaterial({ color: 0xFF0000, transparent: true, opacity: 0.5 });

    const m3 = new MeshLambertMaterial({ color: 0xFF0000, transparent: true, opacity: 0.3 });

    const m_line = new LineBasicMaterial({
        color: 0xffffff,
        linewidth: 1,
        linecap: 'round', //ignored by WebGLRenderer
        linejoin: 'round' //ignored by WebGLRenderer
    });

    /**
     *
     * @type {Terrain}
     */
    const terrain = obtainTerrain(ecd);

    const geometry_0 = new TetrahedronBufferGeometry(0.05, 2);

    for (let i = 0; i < n; i++) {
        const markerNode = markers[i];

        const g = new Group();

        const mark_0 = new ThreeMesh(geometry_0, m0);

        const mark_1 = new ThreeMesh(geometry_0, m1);

        terrain.mapPointGrid2World(markerNode.position.x, markerNode.position.y, mark_1.position);

        mark_1.position.sub(markerNode.transform.position);

        const line_geometry = new BufferGeometry();
        line_geometry.setFromPoints([
            mark_0.position,
            mark_1.position
        ]);

        const mark_line = new Line(line_geometry, m_line);


        const mark_size = new ThreeMesh(geometry_0, m3);
        mark_size.scale.set(markerNode.size, markerNode.size, markerNode.size);


        g.add(mark_0);
        g.add(mark_1);
        g.add(mark_size);
        g.add(mark_line);

        const renderable = new Renderable(g);
        renderable.computeBoundsFromObject();

        const props = [];
        for (const propertyKey in markerNode.properties) {
            let propValue = formatValue(markerNode.properties[propertyKey]);

            props.push(`${propertyKey}:${propValue}`);
        }

        props.push(`# [x: ${formatValue(markerNode.position.x)}, y: ${formatValue(markerNode.position.y)}]`);
        props.push(`# [size: ${formatValue(markerNode.size)}]`);


        const v = new LabelView(props.join('\n'), { classList: ['__debug-plaque'] });
        v.css({
            position: 'absolute',
            whiteSpace: 'pre',
            left: 0,
            top: 0
        })

        const t = new Transform();

        t.position.copy(markerNode.transform.position);

        new EntityBuilder()
            .add(new HeadsUpDisplay())
            .add(new ViewportPosition())
            .add(GUIElement.fromView(v))
            .add(renderable)
            .add(t)
            .build(ecd);

    }

}
