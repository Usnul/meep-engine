import { make3DSymbolicDisplay } from "./make3DSymbolicDisplay.js";
import { Transform } from "../../../engine/ecs/transform/Transform.js";
import { SoundEmitter } from "../../../engine/sound/ecs/emitter/SoundEmitter.js";
import { makeHelperSphereGeometry } from "./makeHelperSphereGeometry.js";
import { Group, Line, LineBasicMaterial } from "three";
import { buildThreeJSHelperEntity } from "./buildThreeJSHelperEntity.js";

/**
 *
 * @param {Engine} engine
 */
export function makeSoundEmitterSymbolicDisplay(engine) {

    const sphereGeometry = makeHelperSphereGeometry(1, 64);

    const material_distance_max = new LineBasicMaterial({
        depthTest: true,
        depthWrite: true,
        transparent: true,
        linewidth: 1,
        fog: false,
        color: '#ffff00',
        opacity: 0.5
    });

    const material_distance_min = new LineBasicMaterial({
        depthTest: true,
        depthWrite: true,
        transparent: true,
        linewidth: 1,
        fog: false,
        color: '#ffaa00'
    });

    /**
     *
     * @param {SoundEmitter} emitter
     * @param {Transform} transform
     * @param {number} entity
     * @param {SymbolicDisplayInternalAPI} api
     * @returns {EntityBuilder}
     */
    function factory([emitter, transform, entity], api) {

        const group = new Group();
        group.frustumCulled = false;


        const mDistanceMax = new Line(sphereGeometry, material_distance_max);
        mDistanceMax.scale.setScalar(emitter.distanceMax);
        //draw on top of everything else
        mDistanceMax.renderOrder = 9999;

        const mDistanceMin = new Line(sphereGeometry, material_distance_min);
        mDistanceMin.scale.setScalar(emitter.distanceMin);
        //draw on top of everything else
        mDistanceMin.renderOrder = 9999;

        group.add(mDistanceMin);
        group.add(mDistanceMax);

        const builder = buildThreeJSHelperEntity(group);

        /**
         *
         * @type {Transform}
         */
        const t = builder.getComponent(Transform);

        function update() {
            t.position.copy(transform.position);
            t.rotation.copy(transform.rotation);
        }

        update();

        api.bind(transform.position.onChanged, update);
        api.bind(transform.rotation.onChanged, update);
        api.bind(transform.scale.onChanged, update);

        api.emit(builder);
    }

    return make3DSymbolicDisplay({
        engine,
        components: [SoundEmitter, Transform],
        factory
    });
}
