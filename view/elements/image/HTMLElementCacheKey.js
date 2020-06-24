import { computeHashArray, computeHashIntegerArray } from "../../../core/math/MathUtils.js";
import { computeStringHash } from "../../../core/primitives/strings/StringUtils.js";
import { isArrayEqual } from "../../../core/collection/ArrayUtils.js";
import { ObjectPoolFactory } from "../../../core/ObjectPoolFactory.js";
import { noop } from "../../../core/function/Functions.js";
import { KeyValuePair } from "../../../core/collection/KeyValuePair.js";

/**
 *
 * @param {KeyValuePair<string,string>} pair
 */
function computeStringPairHash(pair) {
    return computeHashIntegerArray(
        computeStringHash(pair.key),
        computeStringHash(pair.value)
    );
}

export class HTMLElementCacheKey {

    constructor() {

        /**
         *
         * @type {KeyValuePair[]}
         */
        this.attributes = [];

        /**
         *
         * @type {KeyValuePair[]}
         */
        this.style = [];
    }

    toJSON() {
        const attributes = {};
        const attributeCount = this.attributes.length;
        for (let i = 0; i < attributeCount; i++) {
            const attribute = this.attributes[i];
            attributes[attribute.key] = attribute.value;
        }

        const styles = {};

        const styleCount = this.style.length;
        for (let i = 0; i < styleCount; i++) {
            const style = this.style[i];

            styles[style.key] = style.value;
        }

        return {
            attributes,
            styles
        };
    }

    /**
     *
     * @param {HTMLImageElement} el
     */
    initializeFromElement(el) {
        const url = el.getAttribute('src');
        const l = el.classList.length;

        const classList = [];
        for (let i = 0; i < l; i++) {
            const c = el.classList[i];

            classList.push(c);
        }

        let i = 0;

        //read style

        /**
         *
         * @type {CSSStyleDeclaration}
         */
        const style = el.style;

        const styleCount = style.length;

        for (let i = 0; i < styleCount; i++) {
            /**
             *
             * @type {string}
             */
            const s = style.item(i);

            /**
             *
             * @type {KeyValuePair<String, String>}
             */
            const pair = new KeyValuePair(s, style.getPropertyValue(s));

            this.style[i] = pair;
        }

        this.style.splice(i, this.style.length - i);

        //read attributes
        const attributeNames = el.getAttributeNames();

        const attributeCount = attributeNames.length;

        for (i = 0; i < attributeCount; i++) {

            const attributeName = attributeNames[i];

            const value = el.getAttribute(attributeName);

            const pair = new KeyValuePair(attributeName, value);

            this.attributes[i] = pair;
        }

        this.attributes.splice(i, this.attributes.length - i);

        this.updateHash();
    }


    updateHash() {
        //compute style hash
        const styleHash = computeHashArray(this.style, computeStringPairHash);

        //compute attribute hash
        const attributeHash = computeHashArray(this.attributes, computeStringPairHash);

        this.__hash = computeHashIntegerArray(
            styleHash,
            attributeHash
        );
    }

    hash() {
        return this.__hash;
    }

    /**
     *
     * @param {HTMLElementCacheKey} other
     * @returns {boolean}
     */
    equals(other) {
        return isArrayEqual(this.style, other.style)
            && isArrayEqual(this.attributes, other.attributes)
            ;
    }

    /**
     *
     * @param {HTMLImageElement} el
     */
    static fromElement(el) {
        const key = new HTMLElementCacheKey();

        key.initializeFromElement(el);

        return key;
    }
}

/**
 *
 * @type {ObjectPoolFactory<HTMLElementCacheKey>}
 */
HTMLElementCacheKey.pool = new ObjectPoolFactory(
    () => new HTMLElementCacheKey(),
    noop,
    key => {
        key.attributes.splice(0, key.attributes.length);
        key.style.splice(0, key.style.length);
    }
);
