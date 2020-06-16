import { EditorProcess } from "./EditorProcess.js";
import { ParticleEmitter } from "../../engine/graphics/particles/particular/engine/emitter/ParticleEmitter.js";
import { Transform } from "../../engine/ecs/components/Transform.js";
import EntityBuilder from "../../engine/ecs/EntityBuilder.js";
import Renderable from "../../engine/ecs/components/Renderable.js";
import {
    BufferGeometry,
    CameraHelper,
    DirectionalLightHelper,
    Float32BufferAttribute,
    Group,
    Line,
    LineBasicMaterial,
    PointLightHelper,
    SpotLightHelper,
    Sprite,
    SpriteMaterial
} from "three";
import { SignalBinding } from "../../core/events/signal/SignalBinding.js";
import RenderSystem from "../../engine/ecs/systems/RenderSystem.js";
import EditorEntity from "../ecs/EditorEntity.js";
import { Camera } from "../../engine/graphics/ecs/camera/Camera.js";
import { Light } from "../../engine/graphics/ecs/light/Light.js";
import { max2, min2 } from "../../core/math/MathUtils.js";
import GridPosition from "../../engine/grid/components/GridPosition.js";
import { obtainTerrain } from "../../../model/game/scenes/SceneUtils.js";
import Vector3 from "../../core/geom/Vector3.js";
import { EventType } from "../../engine/ecs/EntityManager.js";
import Task from "../../core/process/task/Task.js";
import TaskSignal from "../../core/process/task/TaskSignal.js";
import Path from "../../engine/navigation/ecs/components/Path.js";
import { SurfacePoint3 } from "../../core/geom/3d/SurfacePoint3.js";
import { ComponentSymbolicDisplay } from "./symbolic/ComponentSymbolicDisplay.js";
import { make3DSymbolicDisplay } from "./symbolic/make3DSymbolicDisplay.js";
import { buildThreeJSHelperEntity } from "./symbolic/buildThreeJSHelperEntity.js";
import { makeSocketsSymbolicDisplay } from "./symbolic/makeSocketsSymbolicDisplay.js";
import { makeParticleEmitterSymbolicDisplay } from "./symbolic/makeParticleEmitterSymbolicDisplay.js";
import { ProcessState } from "../../core/process/ProcessState.js";
import { assert } from "../../core/assert.js";
import { makeSoundEmitterSymbolicDisplay } from "./symbolic/makeSoundEmitterSymbolicDisplay.js";
import { SoundEmitter } from "../../engine/sound/ecs/emitter/SoundEmitter.js";

/**
 *
 * @param {!Transform} source
 * @param {!Transform} target
 * @param {SignalBinding[]} bindings
 * @param {boolean} [syncPosition=true]
 * @param {boolean} [syncRotation=true]
 * @param {boolean} [syncScale=true]
 */
function synchronizeTransform(source, target, bindings, syncPosition = true, syncRotation = true, syncScale = true) {
    function synchronizePosition(x, y, z) {
        target.position.set(x, y, z);
    }

    function synchronizeScale(x, y, z) {
        target.scale.set(x, y, z);
    }

    function synchronizeRotation(x, y, z, w) {
        target.rotation.set(x, y, z, w);
    }


    if (syncPosition) {
        const position = source.position;

        bindings.push(new SignalBinding(position.onChanged, synchronizePosition));

        synchronizePosition(position.x, position.y, position.z);
    }

    if (syncRotation) {
        const rotation = source.rotation;

        bindings.push(new SignalBinding(rotation.onChanged, synchronizeRotation));

        synchronizeRotation(rotation.x, rotation.y, rotation.z, rotation.w);
    }


    if (syncScale) {
        const scale = source.scale;
        bindings.push(new SignalBinding(scale.onChanged, synchronizeScale));

        synchronizePosition(scale.x, scale.y, scale.z);
    }

}

/**
 * @template C,T
 * @param {Engine} engine
 * @param {string} iconURL
 * @param {C} ComponentClass
 * @returns {ComponentSymbolicDisplay}
 */
function makePositionedIconDisplaySymbol(engine, iconURL, ComponentClass) {
    assert.defined(engine, 'engine');
    assert.ok(engine.isEngine, 'engine.isEngine');

    const entityManager = engine.entityManager;

    const assetManager = engine.assetManager;

    const spriteMaterial = new SpriteMaterial();
    spriteMaterial.depthTest = false;
    spriteMaterial.transparent = true;
    spriteMaterial.depthWrite = false;

    assetManager.promise(iconURL, 'texture').then(asset => {

        spriteMaterial.map = asset.create();
        spriteMaterial.needsUpdate = true;
    });

    return make3DSymbolicDisplay({
        engine,
        factory([component, transform, entity], api) {

            const entityDataset = entityManager.dataset;

            const b = new EntityBuilder();

            const sprite = new Sprite(spriteMaterial);
            sprite.frustumCulled = false;
            sprite.matrixAutoUpdate = false;

            const cR = new Renderable(sprite);
            const cT = new Transform();


            //sprite size
            cT.scale.set(1, 1, 1);
            cR.boundingBox.setBounds(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5);

            synchronizeTransform(transform, cT, api.bindings, true, false, false);

            b.add(cR);
            b.add(cT);
            b.add(new EditorEntity({ referenceEntity: entity }));

            b.build(entityDataset);

            return b;
        },
        components: [ComponentClass, Transform]
    });
}


/**
 *
 * @param {Engine} engine
 * @returns {ComponentSymbolicDisplay}
 */
function makeLightSymbolicDisplay(engine) {

    /**
     *
     * @param {Light} light
     */
    function makeHelper(light) {
        const threeObject = light.__threeObject;

        if (threeObject === null) {
            console.warn('Light object is not initialized', light);
            return null;
        }
        if (threeObject === undefined) {
            console.error('Light object is undefined', light);
            return null;
        }

        switch (light.type.getValue()) {
            case Light.Type.SPOT:
                return new SpotLightHelper(threeObject);
            case  Light.Type.POINT:
                return new PointLightHelper(threeObject);
            case Light.Type.DIRECTION:
                return new DirectionalLightHelper(threeObject);

            default:
                return null;
        }
    }

    return make3DSymbolicDisplay({
        engine,

        factory([light, transform, entity], api) {

            const helper = makeHelper(light);

            if (helper === null) {
                //no helper for this light type
                return;
            }

            const entityBuilder = buildThreeJSHelperEntity(helper);

            const r = entityBuilder.getComponent(Renderable);

            r.matrixAutoUpdate = false;

            api.bind(light.type.onChanged, api.update, api);

            return entityBuilder;
        },

        components: [Light, Transform]
    });
}

/**
 *
 * @return {ComponentSymbolicDisplay}
 * @param {Engine} engine
 */
function makePathSymbolicDisplay(engine) {

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

/**
 *
 * @returns {ComponentSymbolicDisplay}
 * @param {Engine} engine
 */
function makeCameraSymbolicDisplay(engine) {

    return make3DSymbolicDisplay({
        engine,
        factory([camera, transform, entity], api) {
            const helper = new CameraHelper(camera.object);

            const entityBuilder = buildThreeJSHelperEntity(helper);

            const r = entityBuilder.getComponent(Renderable);

            r.matrixAutoUpdate = false;

            return entityBuilder;
        },
        components: [Camera, Transform]
    });
}

/**
 *
 * @param {Engine} engine
 */
function makeGridPositionSymbolDisplay(engine) {

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
        factory([gridPosition, transform, entity]) {
            return makeHelper(gridPosition, transform);
        }
    });


    display.state.onChanged.add((s0, s1) => {
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

class SymbolicDisplayProcess extends EditorProcess {
    constructor() {
        super();

        this.name = SymbolicDisplayProcess.Id;

        const self = this;
        this.requiredSystems = [{
            klass: RenderSystem,
            factory: function () {
                return new RenderSystem(self.editor.engine.graphics);
            }
        }];

        this.displays = [];

        this.spawnedSystems = [];
    }

    initialize(editor) {
        super.initialize(editor);

        const engine = editor.engine;

        assert.defined(engine, 'engine');

        /**
         *
         * @type {ComponentSymbolicDisplay[]}
         */
        this.displays = [
            makePositionedIconDisplaySymbol(engine, "data/textures/icons/editor/particles.png", ParticleEmitter),
            makePositionedIconDisplaySymbol(engine, "data/textures/icons/editor/camera.png", Camera),
            makePositionedIconDisplaySymbol(engine, "data/textures/icons/editor/light.png", Light),
            makePositionedIconDisplaySymbol(engine, "data/textures/icons/editor/sound.png", SoundEmitter),

            makeCameraSymbolicDisplay(engine),
            makeLightSymbolicDisplay(engine),
            makeGridPositionSymbolDisplay(engine),
            makePathSymbolicDisplay(engine),
            makeSocketsSymbolicDisplay(engine),
            makeParticleEmitterSymbolicDisplay(engine),
            makeSoundEmitterSymbolicDisplay(engine)
        ];

        this.displays.forEach(d => d.initialize(editor));
    }

    startup() {
        super.startup();


        const self = this;

        const entityManager = this.editor.engine.entityManager;

        this.requiredSystems.forEach(systemDescriptor => {

            const foundSystem = entityManager.systems.find(system => system instanceof systemDescriptor.klass);

            if (foundSystem === undefined) {
                const system = systemDescriptor.factory();

                self.spawnedSystems.push(system);

                entityManager.addSystem(system);
            }
        });

        this.displays.forEach(d => d.startup());
    }

    shutdown() {
        super.shutdown();

        const entityManager = this.editor.engine.entityManager;


        this.displays.forEach(d => d.shutdown());


        this.spawnedSystems.forEach(s => {
            entityManager.removeSystem(s);
        });

        this.spawnedSystems = [];
    }
}

SymbolicDisplayProcess.Id = 'symbolic-display-process';

export { SymbolicDisplayProcess };
