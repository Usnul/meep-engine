import { make3DSymbolicDisplay } from "./make3DSymbolicDisplay.js";
import { Transform } from "../../../engine/ecs/transform/Transform.js";
import { BoxBufferGeometry, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial } from "three";
import { EmissionShapeType } from "../../../engine/graphics/particles/particular/engine/emitter/ParticleLayer.js";
import { buildThreeJSHelperEntity } from "./buildThreeJSHelperEntity.js";
import { ParticleEmitter } from "../../../engine/graphics/particles/particular/engine/emitter/ParticleEmitter.js";
import { makeHelperSphereGeometry } from "./makeHelperSphereGeometry.js";

/**
 *
 * @param {Engine} engine
 */
export function makeParticleEmitterSymbolicDisplay(engine) {

    const wireframeMaterial = new MeshBasicMaterial({ wireframe: true, depthTest: true });

    const lineMaterial = new LineBasicMaterial({
        depthTest: true,
        depthWrite: false,
        transparent: true,
        linewidth: 1,
        fog: false,
        color: '#FFFFFF',
        opacity: 0.5
    });

    const centerMaterial = new MeshBasicMaterial({ color: 0xFF0000, transparent: true, opacity: 0.2 });

    const sphereBufferGeometry = makeHelperSphereGeometry(0.5, 64);

    const boxGeometry = new BoxBufferGeometry(1, 1, 1, 1, 1, 1,);

    const centerGeometry = new BoxBufferGeometry(0.03, 0.03, 0.03, 1, 1, 1,);

    /**
     *
     * @param {ParticleEmitter} emitter
     * @param {Transform} transform
     * @param {number} entity
     * @param {SymbolicDisplayInternalAPI} api
     * @returns {EntityBuilder}
     */
    function factory([emitter, transform, entity], api) {

        const group = new Group();
        group.frustumCulled = false;

        emitter.traverseLayers(layer => {
            const emissionShape = layer.emissionShape;

            const center = new Mesh(centerGeometry, centerMaterial);

            center.position.copy(layer.position);

            group.add(center);

            let geometry;
            let mesh;

            if (emissionShape === EmissionShapeType.Box) {

                geometry = boxGeometry;
                mesh = new Mesh(geometry, wireframeMaterial);

            } else if (emissionShape === EmissionShapeType.Sphere) {

                geometry = sphereBufferGeometry;
                mesh = new Line(geometry, lineMaterial);

            }

            function updateScale() {
                center.scale.set(
                    1 / transform.scale.x,
                    1 / transform.scale.y,
                    1 / transform.scale.z
                );

                mesh.scale.set(
                    layer.scale.x,
                    layer.scale.y,
                    layer.scale.z
                );
            }

            function updatePosition() {
                mesh.position.copy(layer.position.x);
            }

            if (mesh !== undefined) {

                updateScale();
                updatePosition();

                group.add(mesh);

                api.bind(layer.position.onChanged, updatePosition);

                api.bind(layer.scale.onChanged, updateScale);
                api.bind(transform.scale.onChanged, updateScale);
            }

        });

        const builder = buildThreeJSHelperEntity(group);

        /**
         *
         * @type {Transform}
         */
        const t = builder.getComponent(Transform);

        api.bindTransform(transform, t);

        return builder;
    }

    return make3DSymbolicDisplay({
        engine,
        components: [ParticleEmitter, Transform],
        factory
    });
}
