import { System } from "../System.js";
import { Attachment } from "./Attachment.js";
import { Transform } from "../transform/Transform.js";
import { AttachmentSockets } from "../sockets/AttachmentSockets.js";
import { assert } from "../../../core/assert.js";
import Mesh from "../../graphics/ecs/mesh/Mesh.js";
import { BoneAttachmentBinding } from "./BoneAttachmentBinding.js";
import { TransformAttachmentBinding } from "./TransformAttachmentBinding.js";
import { MeshSystem } from "../../graphics/ecs/mesh/MeshSystem.js";

/**
 * @readonly
 * @enum {number}
 */
const WaitingType = {
    Entity: 0,
    Socket: 1,
    Mesh: 2,
    Transform: 3
};

class WaitingEntry {
    /**
     *
     * @param {number} entity
     * @param {WaitingType} type
     */
    constructor(entity, type) {
        /**
         *
         * @type {number}
         */
        this.entity = entity;
        /**
         *
         * @type {WaitingType}
         */
        this.type = type;
    }
}


export class AttachmentSystem extends System {
    constructor() {
        super();

        this.componentClass = Attachment;

        this.dependencies = [Attachment, Transform];

        /**
         *
         * @type {number[]}
         */
        this.waiting = [];

        /**
         *
         * @type {Map<number,AttachmentBinding>}
         */
        this.bindings = new Map();

        /**
         *
         * @type {Map<number, AttachmentBinding[]>}
         */
        this.parentBindingIndex = new Map();
    }

    /**
     * Are we waiting for something?
     * @param {number} entity
     * @returns {boolean}
     */
    isWaiting(entity) {
        return this.waiting.indexOf(entity) !== -1;
    }

    /**
     * Attachment is missing something, wait for it
     * @param {number} entity
     */
    wait(entity) {

        if (this.isWaiting(entity)) {
            //already waiting, do nothing
            return;
        }

        this.waiting.push(entity);
    }

    /**
     * Removed all wait records for a given entity
     * @param {number} entity
     * @returns {number} number of removed records
     */
    clearAllWaitRecordsFor(entity) {
        let removedCount = 0;


        const waiting = this.waiting;

        let numRecords = waiting.length;

        for (let i = 0; i < numRecords; i++) {
            const entity = waiting[i];

            if (entity === entity) {
                waiting.splice(i, 1);
                removedCount++;

                //update iterator
                i--;
                numRecords--;
            }
        }

        return removedCount;
    }


    /**
     *
     * @param {Attachment} attachment
     * @param {Transform} transform
     * @param {number} entity
     */
    link(attachment, transform, entity) {
        this.wait(entity);
        this.processWaiting();
    }

    processWaiting() {
        const em = this.entityManager;

        if (em === null) {
            return;
        }

        /**
         *
         * @type {EntityComponentDataset}
         */
        const ecd = em.dataset;

        if (ecd === null) {
            return;
        }

        const waiting = this.waiting;

        let numRecords = waiting.length;

        for (let i = 0; i < numRecords; i++) {
            const entity = waiting[i];


            /**
             *
             * @type {Attachment}
             */
            const attachment = ecd.getComponent(entity, Attachment);

            /**
             *
             * @type {number}
             */
            const parent = attachment.parent;

            if (!ecd.entityExists(parent)) {
                continue;
            }


            /**
             *
             * @type {AttachmentSockets}
             */
            const sockets = ecd.getComponent(parent, AttachmentSockets);

            if (sockets === undefined) {
                //no sockets
                continue;
            }


            const parentTransform = ecd.getComponent(parent, Transform);
            if (parentTransform === undefined) {
                //no parent transform
                continue;
            }


            /**
             *
             * @type {AttachmentSocket|BoneAttachmentSocket}
             */
            const attachmentSocket = sockets.get(attachment.socket);
            if (attachmentSocket === undefined) {
                //socket doesn't exist
                continue;
            }


            let binding;

            if (attachmentSocket.isBoneAttachmentSocket) {

                const boneName = attachmentSocket.boneName;

                assert.typeOf(boneName, 'string', 'boneName');

                //try to get the bone
                const mesh = ecd.getComponent(parent, Mesh);

                if (mesh === undefined || !mesh.isLoaded) {
                    continue;
                }


                const skeletonBone = mesh.getDescendantObjectByName(boneName);

                if (skeletonBone === null) {
                    console.warn(`bone '${boneName}' not found`);

                    //keep in the waiting list
                    continue;
                }

                binding = new BoneAttachmentBinding();

                binding.bone = skeletonBone;

            } else {
                //it's a transform socket
                binding = new TransformAttachmentBinding();
            }

            binding.parentTransform = parentTransform;
            binding.parentEntity = parent;

            binding.attachedEntity = entity;
            binding.attachedTransform = ecd.getComponent(entity, Transform);

            binding.socket = attachmentSocket;
            binding.attachment = attachment;


            this.bindings.set(entity, binding);

            if (attachment.immediate) {
                binding.update();
            }

            let parentBindings = this.parentBindingIndex.get(parent);

            if (parentBindings === undefined) {
                parentBindings = [];
                this.parentBindingIndex.set(parent, parentBindings);
            }

            parentBindings.push(binding);


            //update iterator
            this.waiting.splice(i, 1);

            i--;
            numRecords--;
        }

    }

    /**
     *
     * @param {Attachment} attachment
     * @param {Transform} transform
     * @param {number} entity
     */
    unlink(attachment, transform, entity) {

        //clear wait queue
        this.clearAllWaitRecordsFor(entity);

        //remove potential binding
        this.bindings.delete(entity);

        const parent = attachment.parent;

        const parentBindings = this.parentBindingIndex.get(parent);

        if (parentBindings !== undefined) {
            const bindingCount = parentBindings.length;

            for (let i = 0; i < bindingCount; i++) {
                const attachmentBinding = parentBindings[i];

                if (attachmentBinding.attachment === attachment) {

                    if (bindingCount === 1) {
                        // last binding, remove bucket
                        this.parentBindingIndex.delete(parent);
                    } else {
                        // remove binding from the bucket
                        parentBindings.splice(i, 1);
                    }

                    break;
                }
            }

        }
    }

    /**
     *
     * @param {Mesh} mesh
     * @param {number} entity
     */
    visitVisibleMesh(mesh, entity) {
        const bindings = this.parentBindingIndex.get(entity);

        if (bindings !== undefined) {
            const n = bindings.length;

            for (let i = 0; i < n; i++) {
                const binding = bindings[i];

                binding.update();
            }
        }
    }

    update(timeDelta) {
        //process wait queue
        this.processWaiting();

        /**
         *
         * @type {MeshSystem}
         */
        const meshSystem = this.entityManager.getSystem(MeshSystem);

        meshSystem.traverseVisible(this.visitVisibleMesh, this);

    }
}

/**
 *
 * @param {AttachmentBinding} binding
 */
function updateBinding(binding) {
    binding.update();
}
