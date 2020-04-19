import Vector3 from "../../../core/geom/Vector3.js";
import { Matrix4, Quaternion as ThreeQuaternion } from "three";
import { AttachmentBinding } from "./AttachmentBinding.js";
import Quaternion from "../../../core/geom/Quaternion.js";

const socketM4 = new Matrix4();

const threeQuaternion = new ThreeQuaternion();

const pScale = new Vector3();
const pPosition = new Vector3();

const attachmentM4 = new Matrix4();

const parentM4 = new Matrix4();

export class TransformAttachmentBinding extends AttachmentBinding {
    constructor() {
        super();

    }

    update() {
        const socketTransform = this.socket.transform;

        threeQuaternion.copy(socketTransform.rotation);

        socketM4.compose(socketTransform.position, threeQuaternion, socketTransform.scale);

        const parentTransform = this.parentTransform;

        threeQuaternion.copy(parentTransform.rotation);

        parentM4.compose(parentTransform.position, threeQuaternion, parentTransform.scale);

        const attachment = this.attachment;
        const aT = attachment.transform;

        threeQuaternion.copy(aT.rotation);

        attachmentM4.compose(aT.position, threeQuaternion, aT.scale);

        socketM4.multiplyMatrices(parentM4, socketM4);
        socketM4.multiply(attachmentM4);
        socketM4.decompose(pPosition, threeQuaternion, pScale);

        const t = this.attachedTransform;

        if (Number.isNaN(threeQuaternion.x)) {
            t.rotation.copy(Quaternion.identity);
        } else {
            t.rotation.copy(threeQuaternion);
        }

        t.scale.copy(pScale);

        t.position.copy(pPosition);
    }

    link() {
        this.parentTransform.position.onChanged.add(this.update, this);
        this.parentTransform.rotation.onChanged.add(this.update, this);
        this.parentTransform.scale.onChanged.add(this.update, this);
    }

    unlink() {
        this.parentTransform.position.onChanged.remove(this.update, this);
        this.parentTransform.rotation.onChanged.remove(this.update, this);
        this.parentTransform.scale.onChanged.remove(this.update, this);
    }
}
