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
import { getSkeletonBoneByName } from "../../../engine/graphics/ecs/mesh/SkeletonUtils.js";
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
     * @param api
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

                const mesh = engine.entityManager.dataset.getComponent(entity, Mesh);

                const bone = getSkeletonBoneByName(mesh, socket.boneName);

                binding.bone = bone;
            } else {
                binding = new TransformAttachmentBinding();
            }

            binding.attachment = attachment;

            binding.parentEntity = entity;
            binding.parentTransform = transform;
            binding.socket = socket;

            binding.attachedTransform = t;

            const helper = new AxesHelper(2 * transform.scale.x);

            const mesh = new ThreeMesh(centerGeometry, centerMaterial);

            helper.add(mesh);

            const q = new ThreeQuaternion();

            api.onFrame(() => {
                binding.update();

                q.set(t.rotation.x, t.rotation.y, t.rotation.z, t.rotation.w);

                helper.position.set(t.position.x, t.position.y, t.position.z);
                helper.rotation.setFromQuaternion(q);
            });

            group.add(helper);

        });

        const builder = buildThreeJSHelperEntity(group);

        return builder;
    }

    return make3DSymbolicDisplay({ engine, components: [AttachmentSockets, Transform], factory });
}

