import List from "../../../../core/collection/List.js";
import { assert } from "../../../../core/assert.js";
import { InputBinding } from "../ism/InputBinding.js";


export class Input {
    constructor() {
        /**
         *
         * @type {List<InputBinding>}
         */
        this.bindings = new List();
    }

    /**
     *
     * @param {string} path
     * @param {string} event
     * @returns {boolean}
     */
    exists(path, event) {
        assert.typeOf(path, 'string', "path");
        assert.typeOf(event, 'string', "event");

        return this.bindings.some(b => b.path === path && b.event === event);
    }

    /**
     *
     * @param {string} path
     * @param {string} event
     * @returns {boolean}
     */
    bind(path, event) {
        assert.typeOf(path, 'string', path);
        assert.typeOf(event, 'string', path);

        if (this.exists(path, event)) {
            //binding exists
            return false;
        }

        const binding = new InputBinding();

        binding.set(path, event);

        this.bindings.add(binding);

        return true;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    toBinaryBuffer(buffer) {
        this.bindings.toBinaryBuffer(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBuffer(buffer) {
        this.bindings.fromBinaryBuffer(buffer, InputBinding);
    }
}

/**
 * @readonly
 * @type {string}
 */
Input.typeName = "Input";

/**
 * @readonly
 * @type {boolean}
 * TODO make serializable when the rest of the engine is ready for it
 */
Input.serializable = false;
