/**
 * Created by Alex on 27/02/2017.
 */

import View from "../../View.js";
import { Cache } from "../../../core/Cache.js";
import { invokeObjectHash } from "../../../core/model/ObjectUtils.js";
import { invokeObjectEquals } from "../../../core/function/Functions.js";
import { ImageCacheKey } from "./ImageCacheKey.js";

/**
 *
 * @type {Cache<ImageCacheKey, HTMLImageElement[]>}
 */
const cache = new Cache({
    maxWeight: 100,
    keyHashFunction: invokeObjectHash,
    keyEqualityFunction: invokeObjectEquals
});


/**
 *
 * @param {ImageCacheKey} key
 * @return {HTMLImageElement}
 */
function obtainImageElement(key) {
    const elements = cache.get(key);

    if (elements !== null) {

        // console.log('Re-using image', key.url);

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
 * @param {ImageCacheKey} key
 * @return {HTMLImageElement}
 */
function buildImageElement(key) {
    const el = document.createElement('img');

    const classList = key.classList;
    const classListSize = classList.length;

    for (let i = 0; i < classListSize; i++) {
        const c = classList[i];

        el.classList.add(c);
    }

    el.setAttribute('src', key.url);

    return el;
}

class ImageView extends View {
    /**
     *
     * @param {String|ObservedString} url
     * @param {String[]} classList
     */
    constructor(url, { classList = [] } = {}) {
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

        const cacheKey = ImageCacheKey.pool.create();
        cacheKey.initialize(src, classList);

        this.el = obtainImageElement(cacheKey);

        ImageCacheKey.pool.release(cacheKey);

        const classListSize = classList.length;

        for (let i = 0; i < classListSize; i++) {
            const c = classList[i];

            this.addClass(c);
        }

        this.size.onChanged.add(this.__setSize, this);

    }

    destroy() {
        super.destroy();

        const key = ImageCacheKey.pool.create();
        key.initializeFromElement(this.el);

        let elements = cache.get(key);

        if (elements === null) {
            elements = [this.el];

            cache.put(key, elements);
        } else if (elements.length < 100) {
            elements.push(this.el);

            ImageCacheKey.pool.release(key);
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
