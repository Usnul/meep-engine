import {
    AxesHelper,
    Group,
    Mesh as ThreeMesh,
    MeshBasicMaterial,
    Quaternion as ThreeQuaternion,
    SphereBufferGeometry
} from "three";
import { Transform } from "../../../engine/ecs/transform/Transform.js";
import { Attachment } from "../../../engine/ecs/attachment/Attachment.js";
import { BoneAttachmentSocket } from "../../../engine/ecs/sockets/BoneAttachmentSocket.js";
import { BoneAttachmentBinding } from "../../../engine/ecs/attachment/BoneAttachmentBinding.js";
import Mesh from "../../../engine/graphics/ecs/mesh/Mesh.js";
import { TransformAttachmentBinding } from "../../../engine/ecs/attachment/TransformAttachmentBinding.js";
import { make3DSymbolicDisplay } from "./make3DSymbolicDisplay.js";
import { AttachmentSockets } from "../../../engine/ecs/sockets/AttachmentSockets.js";
import { buildThreeJSHelperEntity } from "./buildThreeJSHelperEntity.js";
import { EventMeshSet } from "../../../engine/graphics/ecs/mesh/MeshSystem.js";

/**
 *
 * @param {Engine} engine
 * @return {ComponentSymbolicDisplay}
 */
export function makeSocketsSymbolicDisplay(engine) {

    const centerMaterial = new MeshBasicMaterial({
        color: 0x00FFFF,
        transparent: true,
        opacity: 0.2
    });

    const centerGeometry = new SphereBufferGeometry(0.05, 10, 10);

    /**
     *
     * @param {AttachmentSockets} sockets
     * @param {Transform} transform
     * @param {number} entity
     * @param {SymbolicDisplayInternalAPI} api
     */
    function factory([sockets, transform, entity], api) {

        const group = new Group();
        group.frustumCulled = false;

        const ecd = engine.entityManager.dataset;

        const rebuild = () => {

            ecd.removeEntityEventListener(entity, EventMeshSet, rebuild);

            api.update();

        };

        ecd.addEntityEventListener(entity, EventMeshSet, rebuild);

        sockets.elements.forEach(socket => {

            /**
             *
             * @type {AttachmentBinding}
             */
            let binding = null;
            let t = new Transform();

            const attachment = new Attachment();

            if (socket instanceof BoneAttachmentSocket) {
                binding = new BoneAttachmentBinding();

                /**
                 *
                 * @type {Mesh}
                 */
                const mesh = engine.entityManager.dataset.getComponent(entity, Mesh);

                const bone = mesh.getDescendantObjectByName(socket.boneName);

                binding.bone = bone;
            } else {
                binding = new TransformAttachmentBinding();
            }

            binding.attachment = attachment;

            binding.parentEntity = entity;
            binding.parentTransform = transform;
            binding.socket = socket;

            binding.attachedTransform = t;

            const socket_group = new Group();
            socket_group.frustumCulled = false;

            group.add(socket_group);

            const helper = new AxesHelper(2 * transform.scale.x);
            helper.frustumCulled = false;

            const mesh = new ThreeMesh(centerGeometry, centerMaterial);
            mesh.frustumCulled = false;

            socket_group.add(mesh);
            socket_group.add(helper);

            const q = new ThreeQuaternion();

            function update_transform() {
                binding.update();

                q.set(t.rotation.x, t.rotation.y, t.rotation.z, t.rotation.w);

                socket_group.position.set(t.position.x, t.position.y, t.position.z);
                socket_group.rotation.setFromQuaternion(q);

                socket_group.updateWorldMatrix(true, true);
            }

            api.onFrame(update_transform);


        });

        const builder = buildThreeJSHelperEntity(group, entity);

        api.emit(builder);
    }

    return make3DSymbolicDisplay({
        engine,
        components: [AttachmentSockets, Transform],
        factory
    });
}

