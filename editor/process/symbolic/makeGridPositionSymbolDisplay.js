import Task from "../../../core/process/task/Task.js";
import TaskSignal from "../../../core/process/task/TaskSignal.js";
import EntityBuilder from "../../../engine/ecs/EntityBuilder.js";
import { BufferGeometry, Float32BufferAttribute, Line, LineBasicMaterial } from "three";
import { obtainTerrain } from "../../../../model/game/scenes/SceneUtils.js";
import Renderable from "../../../engine/ecs/components/Renderable.js";
import { SurfacePoint3 } from "../../../core/geom/3d/SurfacePoint3.js";
import Vector3 from "../../../core/geom/Vector3.js";
import { max2, min2 } from "../../../core/math/MathUtils.js";
import { Transform } from "../../../engine/ecs/transform/Transform.js";
import EditorEntity from "../../ecs/EditorEntity.js";
import { EventType } from "../../../engine/ecs/EntityManager.js";
import { make3DSymbolicDisplay } from "./make3DSymbolicDisplay.js";
import GridPosition from "../../../engine/grid/components/GridPosition.js";
import { ProcessState } from "../../../core/process/ProcessState.js";

/**
 *
 * @param {Engine} engine
 */
export function makeGridPositionSymbolDisplay(engine) {

    /**
     *
     * @type {EntityManager}
     */
    const em = engine.entityManager;

    const updateQueue = [];

    const tTerrainWaiter = new Task({
        name: 'terrain-waiter',
        cycleFunction() {
            if (updateQueue.length === 0) {
                return TaskSignal.Yield;
            }

            const f = updateQueue.shift();

            f();

            return TaskSignal.Continue;
        }
    });

    /**
     *
     * @param {GridPosition} gridPosition
     * @param {Transform} transform
     * @returns {EntityBuilder}
     */
    function makeHelper(gridPosition, transform) {
        const builder = new EntityBuilder();

        // TODO replace with {@link VisualSymbolLine}

        const lineMaterial = new LineBasicMaterial({ color: 0xFFFFFF });
        lineMaterial.depthTest = false;

        const lineGeometry = new BufferGeometry();

        const positionAttribute = new Float32BufferAttribute(new Float32Array(6), 3);
        lineGeometry.setAttribute('position', positionAttribute);


        //find terrain
        const terrain = obtainTerrain(em.dataset);

        const line = new Line(lineGeometry, lineMaterial);

        line.updateMatrixWorld();
        line.frustumCulled = false;

        const renderable = new Renderable(line);
        renderable.matrixAutoUpdate = false;

        const contact = new SurfacePoint3();

        const p0 = transform.position;
        const p1 = new Vector3();

        /**
         *
         * @returns {boolean}
         */
        function updateGridPosition() {

            //get grid position in the world
            terrain.mapPointGrid2World(gridPosition.x, gridPosition.y, p1);

            return terrain.raycastFirstSync(contact, p1.x, -(terrain.heightRange + 1), p1.z, 0, 1, 0);

        }

        function updateGeometry() {
            const c = contact.position;

            positionAttribute.setXYZ(0, p0.x, p0.y, p0.z);
            positionAttribute.setXYZ(1, c.x, c.y, c.z);

            positionAttribute.needsUpdate = true;
        }

        function updateBounds() {
            const c = contact.position;

            const x0 = min2(p0.x, c.x),
                y0 = min2(p0.y, c.y),
                z0 = min2(p0.z, c.z),
                x1 = max2(p0.x, c.x),
                y1 = max2(p0.y, c.y),
                z1 = max2(p0.z, c.z);

            renderable.boundingBox.setBounds(x0, y0, z0, x1, y1, z1);

            renderable.bvh.resize(x0, y0, z0, x1, y1, z1);
        }

        function attemptUpdate() {
            if (updateGridPosition()) {
                updateGeometry();
                updateBounds();
            } else if (updateQueue.indexOf(attemptUpdate) === -1) {
                updateQueue.push(attemptUpdate);
            }
        }

        attemptUpdate();

        builder
            .add(renderable)
            .add(new Transform())
            .add(new EditorEntity());

        builder.addEventListener(EventType.EntityRemoved, () => {
            p0.onChanged.remove(attemptUpdate);
            gridPosition.onChanged.remove(attemptUpdate);
        });

        builder.on.built.add(() => {
            p0.onChanged.add(attemptUpdate);
            gridPosition.onChanged.add(attemptUpdate);

            attemptUpdate();
        });

        return builder;
    }

    const display = make3DSymbolicDisplay({
        engine,
        components: [GridPosition, Transform],
        factory([gridPosition, transform, entity], api) {

            api.emit(makeHelper(gridPosition, transform));

        }
    });


    display.__state.onChanged.add((s0, s1) => {
        if (s0 === ProcessState.Running) {
            //started
            engine.executor.run(tTerrainWaiter);
        } else if (s1 === ProcessState.Running) {
            //stopepd
            engine.executor.removeTask(tTerrainWaiter);

            //purge update queue
            updateQueue.splice(0, updateQueue.length);
        }
    });

    return display;
}
