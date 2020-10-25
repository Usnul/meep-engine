import { Transform } from "../transform/Transform.js";

export class AttachmentSocket {
    constructor() {
        /**
         *
         * @type {String}
         */
        this.id = "";

        /**
         * Transform of the socket relative to the entity
         * @readonly
         * @type {Transform}
         */
        this.transform = new Transform();
    }

    fromJSON(j) {

        this.id = j.id;

        if (j.transform !== undefined) {
            this.transform.fromJSON(j.transform);
        }
    }

    /**
     *
     * @param {AttachmentSocket} other
     */
    copy(other) {
        this.id = other.id;

        this.transform.copy(other.transform);
    }

    /**
     *
     * @return {AttachmentSocket}
     */
    clone() {
        const r = new AttachmentSocket();

        r.copy(this);

        return r;
    }

    /**
     *
     * @param j
     * @returns {AttachmentSocket}
     */
    static fromJSON(j) {
        const r = new AttachmentSocket();

        r.fromJSON(j);

        return r;
    }
}
