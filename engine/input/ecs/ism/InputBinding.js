import { assert } from "../../../../core/assert.js";

export class InputBinding {
    constructor() {
        /**
         *
         * @type {string}
         */
        this.path = "";
        /**
         *
         * @type {string}
         */
        this.event = "";
    }

    /**
     *
     * @param {string} path
     * @param {string} event
     */
    set(path, event) {
        assert.typeOf(path, 'string', path);
        assert.typeOf(event, 'string', path);

        this.path = path;
        this.event = event;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    toBinaryBuffer(buffer) {
        buffer.writeUTF8String(this.path);
        buffer.writeUTF8String(this.event);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBuffer(buffer) {
        this.path = buffer.readUTF8String();
        this.event = buffer.readUTF8String();
    }
}
