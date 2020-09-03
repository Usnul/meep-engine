import { BufferGeometry, Float32BufferAttribute, Group, Line, LineBasicMaterial } from "three";
import Vector3 from "../../../core/geom/Vector3.js";
import { min2 } from "../../../core/math/MathUtils.js";
import Renderable from "../../../engine/ecs/components/Renderable.js";
import { buildThreeJSHelperEntity } from "./buildThreeJSHelperEntity.js";
import { make3DSymbolicDisplay } from "./make3DSymbolicDisplay.js";
import Path from "../../../engine/navigation/ecs/components/Path.js";

/**
 *
 * @return {ComponentSymbolicDisplay}
 * @param {Engine} engine
 */
export function makePathSymbolicDisplay(engine) {

    /**
     *
     * @param {Path} path
     * @param {number} q
     * @returns {BufferGeometry}
     */
    function buildPathGeometry(path, q) {
        const geometry = new BufferGeometry();

        const vertices = [];

        const v3 = new Vector3();

        const length = path.computeLength();
        const minStep = (length / path.getPointCount()) / 10;
        const step = min2(q, minStep);

        const p = path.clone();
        p.reset();

        let i = 0;

        for (let c = 0; c < length; c += step) {
            p.getCurrentPosition(v3);
            p.move(step);


            vertices[i++] = v3.x;
            vertices[i++] = v3.y;
            vertices[i++] = v3.z;
        }

        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));

        return geometry;
    }

    /**
     *
     * @param {Path} path
     * @param entity
     * @param api
     * @return {EntityBuilder}
     */
    function factory([path, entity], api) {
        const pathObjectMaterial = new LineBasicMaterial({ color: 0xFF0000, opacity: 0.4 });
        pathObjectMaterial.depthTest = false;

        const q = 0.01;

        const pathObject = new Line(buildPathGeometry(path, q), pathObjectMaterial);
        pathObject.castShadow = true;


        function update() {
            pathObject.geometry = buildPathGeometry(path, q);

            b.getComponent(Renderable).computeBoundsFromObject();
        }

        for (let i = 0; i < path.getPointCount(); i++) {
            const p = new Vector3();

            path.getPosition(i, p);


            api.bind(p.onChanged, () => {
                update();
            });

        }


        const group = new Group();
        group.frustumCulled = false;

        group.add(pathObject);

        const b = buildThreeJSHelperEntity(group);

        const r = b.getComponent(Renderable);

        r.matrixAutoUpdate = false;

        return b;
    }

    return make3DSymbolicDisplay({
        engine,
        components: [Path],
        factory
    })
}
