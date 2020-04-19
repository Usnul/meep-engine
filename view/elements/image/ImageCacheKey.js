import { computeHashArray, computeHashIntegerArray } from "../../../core/math/MathUtils.js";
import { computeStringHash } from "../../../core/primitives/strings/StringUtils.js";
import { isArrayEqualStrict } from "../../../core/collection/ArrayUtils.js";
import { ObjectPoolFactory } from "../../../core/ObjectPoolFactory.js";
import { noop } from "../../../core/function/Functions.js";

export class ImageCacheKey {

    constructor() {
        /**
         * @type {string}
         */
        this.url = null;
        /**
         * @type {string[]}
         */
        this.classList = [];
    }

    /**
     *
     * @param {string} url
     * @param {string[]} classList
     */
    initialize(url, classList) {
        this.url = url;
        this.classList = classList;

        this.updateHash();
    }

    /**
     *
     * @param {HTMLImageElement} el
     */
    initializeFromElement(el) {
        //TODO take CSS changes into account

        const url = el.getAttribute('src');
        const l = el.classList.length;

        const classList = [];
        for (let i = 0; i < l; i++) {
            const c = el.classList[i];

            classList.push(c);
        }

        this.initialize(url, classList);
    }


    updateHash() {
        this.__hash = computeHashIntegerArray(
            computeStringHash(this.url),
            computeHashArray(this.classList, computeStringHash)
        );
    }

    hash() {
        return this.__hash;
    }

    /**
     *
     * @param {ImageCacheKey} other
     * @returns {boolean}
     */
    equals(other) {
        return this.url === other.url
            && isArrayEqualStrict(this.classList, other.classList)
            ;
    }

    /**
     *
     * @param {HTMLImageElement} el
     */
    static fromElement(el) {
        const key = new ImageCacheKey();

        key.initializeFromElement(el);

        return key;
    }
}

/**
 *
 * @type {ObjectPoolFactory<ImageCacheKey>}
 */
ImageCacheKey.pool = new ObjectPoolFactory(() => new ImageCacheKey(), noop, noop);
