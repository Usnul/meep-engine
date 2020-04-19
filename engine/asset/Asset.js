/**
 *
 * @param {string} path
 * @param {string} type
 * @constructor
 */
import { computeStringHash } from "../../core/primitives/strings/StringUtils.js";
import { computeHashIntegerArray } from "../../core/math/MathUtils.js";
import { assert } from "../../core/assert.js";

export class AssetDescription {
    /**
     *
     * @param {string} path
     * @param {string} type
     * @constructor
     */
    constructor(path, type) {
        assert.typeOf(path, 'string', 'path');
        assert.typeOf(type, 'string', 'type');

        /**
         * @type {string}
         */
        this.path = path;
        /**
         * @type {string}
         */
        this.type = type;
    }

    /**
     *
     * @param {AssetDescription} other
     * @returns {boolean}
     */
    equals(other) {
        return this.path === other.path && this.type === other.type;
    }

    /**
     *
     * @returns {number}
     */
    hash() {
        return computeHashIntegerArray(
            computeStringHash(this.path),
            computeStringHash(this.type)
        );
    }
}


export class Asset {
    /**
     * @template T
     * @param {function():T} [factory]
     * @param {number} [byteSize] byte size of the asset in RAM
     * @constructor
     */
    constructor(factory, byteSize) {
        /**
         *
         * @type {function(): T}
         */
        this.factory = factory;

        /**
         *
         * @type {number}
         */
        this.byteSize = byteSize;

        /**
         *
         * @type {Array.<AssetDescription>}
         */
        this.dependencies = [];

        /**
         *
         * @type {AssetDescription}
         */
        this.description = null;
    }

    /**
     *
     * @returns {T}
     */
    create() {
        return this.factory();
    }
}
