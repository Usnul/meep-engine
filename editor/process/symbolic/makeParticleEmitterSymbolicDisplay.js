import { make3DSymbolicDisplay } from "./make3DSymbolicDisplay.js";
import { Transform } from "../../../engine/ecs/components/Transform.js";
import { BoxBufferGeometry, DodecahedronBufferGeometry, Group, Mesh, MeshBasicMaterial } from "three";
import { EmissionShapeType } from "../../../engine/graphics/particles/particular/engine/emitter/ParticleLayer.js";
import { buildThreeJSHelperEntity } from "./buildThreeJSHelperEntity.js";
import { ParticleEmitter } from "../../../engine/graphics/particles/particular/engine/emitter/ParticleEmitter.js";

/**
 *
 * @param {Engine} engine
 */
export function makeParticleEmitterSymbolicDisplay(engine) {

    const wireframeMaterial = new MeshBasicMaterial({ wireframe: true, depthTest: true });

    const centerMaterial = new MeshBasicMaterial({ color: 0xFF0000, transparent: true, opacity: 0.2 });

    const sphereBufferGeometry = new DodecahedronBufferGeometry(1, 1);

    const boxGeometry = new BoxBufferGeometry(1, 1, 1, 1, 1, 1,);

    const centerGeometry = new BoxBufferGeometry(0.03, 0.03, 0.03, 1, 1, 1,);

    /**
     *
     * @param {ParticleEmitter} emitter
     * @param {Transform} transform
     * @param {number} entity
     * @param api
     */
    function factory([emitter, transform, entity], api) {

        const group = new Group();
        group.frustumCulled = false;

        const ecd = engine.entityManager.dataset;

        emitter.traverseLayers(layer => {
            const emissionShape = layer.emissionShape;

            const center = new Mesh(centerGeometry, centerMaterial);

            center.position.copy(layer.position);

            group.add(center);

            let geometry;

            if (emissionShape === EmissionShapeType.Box) {
                geometry = boxGeometry;
            } else if (emissionShape === EmissionShapeType.Sphere) {
                geometry = sphereBufferGeometry;
            }

            if (geometry !== undefined) {
                const mesh = new Mesh(geometry, wireframeMaterial);

                mesh.position.copy(layer.position);
                mesh.scale.copy(layer.scale);

                group.add(mesh);
            }

        });

        const builder = buildThreeJSHelperEntity(group);

        /**
         *
         * @type {Transform}
         */
        const t = builder.getComponent(Transform);

        t.copy(transform);

        return builder;
    }

    return make3DSymbolicDisplay({
        engine,
        components: [ParticleEmitter, Transform],
        factory
    });
}
