import { Matrix4, Quaternion as ThreeQuaternion } from "three";
import Vector3 from "../../../core/geom/Vector3.js";
import { AttachmentBinding } from "./AttachmentBinding.js";

const socketM4 = new Matrix4();

const threeQuaternion = new ThreeQuaternion();

const pScale = new Vector3();
const pPosition = new Vector3();

const attachmentM4 = new Matrix4();

export class BoneAttachmentBinding extends AttachmentBinding {
    constructor() {
        super();

        /**
         *
         * @type {Bone}
         */
        this.bone = null;
    }

    update() {
        const socketTransform = this.socket.transform;

        threeQuaternion.copy(socketTransform.rotation);

        socketM4.compose(socketTransform.position, threeQuaternion, socketTransform.scale);

        const pM = this.bone.matrixWorld;

        const attachment = this.attachment;
        const aT = attachment.transform;

        threeQuaternion.copy(aT.rotation);

        attachmentM4.compose(aT.position, threeQuaternion, aT.scale);

        socketM4.multiplyMatrices(pM, socketM4);
        socketM4.multiply(attachmentM4);
        socketM4.decompose(pPosition, threeQuaternion, pScale);

        const t = this.attachedTransform;

        t.rotation.copy(threeQuaternion);

        t.scale.copy(pScale);

        t.position.copy(pPosition);
    }
}
