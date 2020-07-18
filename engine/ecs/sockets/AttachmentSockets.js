import List from "../../../core/collection/list/List.js";
import { AttachmentSocket } from "./AttachmentSocket.js";
import { AttachmentSocketType } from "./AttachmentSocketType.js";
import { BoneAttachmentSocket } from "./BoneAttachmentSocket.js";

export class AttachmentSockets {
    constructor() {
        /**
         *
         * @type {List<AttachmentSocket>}
         */
        this.elements = new List();
    }

    /**
     *
     * @param {String} id Socket id
     * @returns {AttachmentSocket|undefined}
     */
    get(id) {
        return this.elements.find(s => s.id === id);
    }

    /**
     *
     * @param {AttachmentSocket} socket
     * @returns {boolean}
     */
    add(socket) {

        if (this.get(socket.id) === undefined) {
            //socket already registered with that ID
            this.elements.add(socket);

            return true;
        } else {
            return false;
        }
    }

    fromJSON({ elements }) {

        const sockets = elements.map(AttachmentSockets.fromSocketJSON);

        this.elements.reset();
        this.elements.addAll(sockets);
    }

    /**
     *
     * @param {AttachmentSockets} other
     */
    copy(other) {
        this.elements.reset();

        const elements = other.elements;
        const n = elements.length;

        for (let i = 0; i < n; i++) {
            const attachmentSocket = elements.get(i);

            const socketClone = attachmentSocket.clone();

            this.elements.add(socketClone);
        }
    }

    /**
     *
     * @return {AttachmentSockets}
     */
    clone() {
        const r = new AttachmentSockets();

        r.copy(this);

        return r;
    }

    /**
     *
     * @param e
     * @returns {BoneAttachmentSocket|AttachmentSocket}
     */
    static fromSocketJSON(e) {
        if (e.type === AttachmentSocketType.Transform) {
            return AttachmentSocket.fromJSON(e);
        } else {
            return BoneAttachmentSocket.fromJSON(e);
        }
    }

    /**
     *
     * @param j
     * @returns {AttachmentSockets}
     */
    static fromJSON(j) {
        const r = new AttachmentSockets();

        r.fromJSON(j);

        return r;
    }
}

AttachmentSockets.serializable = false;

AttachmentSockets.typeName = "AttachmentSockets";
