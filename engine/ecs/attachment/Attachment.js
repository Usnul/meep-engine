import { Transform } from "../transform/Transform.js";

export class Attachment {
    constructor() {
        /**
         * Parent entity to which attachment is made
         * @type {number}
         */
        this.parent = -1;

        /**
         * Socket on the parent entity to which attachment is made
         * @type {String}
         */
        this.socket = null;

        /**
         *
         * @type {Transform}
         */
        this.transform = new Transform();

        /**
         *
         * @type {boolean}
         */
        this.immediate = false;
    }

    fromJSON({ parent, socket, transform, immediate = false }) {
        this.parent = parent;
        this.socket = socket;

        if (transform !== undefined) {
            this.transform.fromJSON(transform);
        }

        this.immediate = immediate;
    }

    /**
     *
     * @param j
     * @returns {Attachment}
     */
    static fromJSON(j) {
        const r = new Attachment();
        r.fromJSON(j);
        return r;
    }
}

Attachment.typeName = "Attachment";

Attachment.serializable = false;
