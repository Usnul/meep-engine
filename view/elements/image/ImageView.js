/**
 * Created by Alex on 27/02/2017.
 */

import View from "../../View.js";
import { Cache } from "../../../core/Cache.js";
import { invokeObjectHash } from "../../../core/model/ObjectUtils.js";
import { invokeObjectEquals } from "../../../core/function/Functions.js";
import { HTMLElementCacheKey } from "./HTMLElementCacheKey.js";
import { KeyValuePair } from "../../../core/collection/KeyValuePair.js";

/**
 *
 * @type {Cache<HTMLElementCacheKey, HTMLImageElement[]>}
 */
const cache = new Cache({
    maxWeight: 100,
    keyHashFunction: invokeObjectHash,
    keyEqualityFunction: invokeObjectEquals
});


/**
 *
 * @param {HTMLElementCacheKey} key
 * @return {HTMLImageElement}
 */
function obtainImageElement(key) {
    const elements = cache.get(key);

    if (elements !== null) {

        // console.log('Re-using image from cache', key.toJSON());

        let element;
        if (elements.length === 1) {
            element = elements[0];
            cache.remove(key);
        } else {
            element = elements.pop();
        }

        return element;
    } else {
        return buildImageElement(key);
    }
}

/**
 *
 * @param {HTMLElementCacheKey} key
 * @return {HTMLImageElement}
 */
function buildImageElement(key) {
    const el = document.createElement('img');

    const styles = key.style;
    const stylesSize = styles.length;

    /**
     *
     * @type {CSSStyleDeclaration}
     */
    const styleDeclaration = el.style;

    for (let i = 0; i < stylesSize; i++) {
        const c = styles[i];

        styleDeclaration.setProperty(c.key, c.value);
    }

    const attributes = key.attributes;
    const attributeCount = attributes.length;

    for (let i = 0; i < attributeCount; i++) {
        const attribute = attributes[i];

        el.setAttribute(attribute.key, attribute.value);
    }

    return el;
}

class ImageView extends View {
    /**
     *
     * @param {String|ObservedString} url
     * @param {String[]} classList
     * @param {*} [attributes]
     */
    constructor(url, { classList = [], attributes = {} } = {}) {
        super();


        /**
         * @type {string}
         */
        let src;

        if (typeof url === "string") {
            src = url;
        } else if (typeof url === "object" && typeof url.getValue === "function") {
            src = url.getValue();

            if (url.onChanged !== undefined) {
                this.bindSignal(url.onChanged, this.__setSource, this);
            }
        }

        const cacheKey = HTMLElementCacheKey.pool.create();

        cacheKey.attributes = [
            new KeyValuePair('src', src),
            new KeyValuePair('class', classList.join(' '))
        ];

        for (const attributesKey in attributes) {
            const attributeValue = String(attributes[attributesKey]);

            const attribute = new KeyValuePair(attributesKey, attributeValue);

            cacheKey.attributes.push(attribute);
        }

        cacheKey.updateHash();


        this.el = obtainImageElement(cacheKey);

        HTMLElementCacheKey.pool.release(cacheKey);

        const classListSize = classList.length;

        for (let i = 0; i < classListSize; i++) {
            const c = classList[i];

            this.addClass(c);
        }

        this.size.onChanged.add(this.__setSize, this);

    }

    destroy() {
        super.destroy();

        const key = HTMLElementCacheKey.pool.create();
        key.initializeFromElement(this.el);

        let elements = cache.get(key);

        if (elements === null) {
            elements = [this.el];

            cache.put(key, elements);
        } else if (elements.length < 100) {
            elements.push(this.el);

            HTMLElementCacheKey.pool.release(key);
        }

    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @private
     */
    __setSize(x, y) {
        this.el.setAttribute('width', x);
        this.el.setAttribute('height', y);
    }

    /**
     *
     * @param {string} url
     * @private
     */
    __setSource(url) {
        this.el.setAttribute('src', url);
    }
}

export default ImageView;
