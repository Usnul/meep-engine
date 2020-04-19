/**
 * Created by Alex on 27/05/2016.
 * @copyright Alex Goldring 2016
 */


import View from "../View.js";
import { assert } from "../../core/assert.js";
import { noop, returnTrue } from "../../core/function/Functions.js";
import { Cache } from "../../core/Cache.js";

/**
 * @template T
 */
export class CacheKey {
    /**
     * @template T
     * @param {T} thing
     */
    constructor(thing) {
        /**
         *
         * @type {T}
         */
        this.thing = thing;

        /**
         * @type {number}
         */
        this.__hash = thing.hash();
    }

    /**
     *
     * @return {number}
     */
    hash() {
        return this.thing.hash();
    }

    /**
     *
     * @param {T} other
     * @return {boolean}
     */
    equals(other) {
        return this.thing.equals(other);
    }
}

export class ListView extends View {
    /**
     * List representation
     * @template E
     * @param {List<E>} model List to be represented
     * @param {string[]} [classList] collection of CSS classes
     * @param {function(E):View} elementFactory factory function, takes a list element and returns a view
     * @param {function(E, View, number, ListView<E>)} [addHook] hook function to be called when a view is created
     * @param {function(E, View, number, ListView<E>)} [removeHook] hook function to be called when a view is created
     * @param {function(E):boolean} [filter]
     * @param {number} [cacheSize]
     * @param {boolean} [useCache]
     * @constructor
     */
    constructor(model, {
        classList = [],
        elementFactory,
        addHook = noop,
        removeHook = noop,
        filter = returnTrue,
        cacheSize = 100,
        useCache = false
    }) {
        super();

        /**
         * @private
         * @type {Cache<E, View>}
         */
        this.__cache = new Cache({
            maxWeight: cacheSize
        });

        /**
         *
         * @type {boolean}
         * @private
         */
        this.__useCache = useCache;

        assert.typeOf(elementFactory, 'function', 'elementFactory');

        /**
         *
         * @type {List<E>}
         */
        this.model = model;

        this.elementFactory = elementFactory;
        this.filter = filter;

        this.hooks = {
            add: addHook,
            remove: removeHook
        };

        this.el = document.createElement('div');

        this.addClass('ui-list-view');

        classList.forEach((className) => {
            this.addClass(className);
        });


        this.bindSignal(model.on.added, this.insertOne, this);
        this.bindSignal(model.on.removed, this.removeOne, this);

        /**
         *
         * @type {Map<E, View>}
         */
        this.viewMapping = new Map();

        // initialization
        this.on.linked.add(() => {
            const l = model.length;

            for (let i = 0; i < l; i++) {
                const el = model.get(i);

                if (!this.filter(el)) {
                    continue;
                }

                this.addOne(el, i);
            }

        });

        // cleanup
        this.on.unlinked.add(() => {
            model.forEach(this.removeOne, this);
        });
    }

    /**
     *
     * @param {E} el
     * @returns {View}
     */
    acquireView(el) {
        if (this.__useCache) {

            let view = this.__cache.get(el);

            if (view === null) {

                view = this.elementFactory(el);

            } else {

                this.__cache.remove(el);

            }

            return view;

        } else {

            return this.elementFactory(el);

        }
    }

    /**
     * @private
     * @param el
     * @param index
     */
    insertOne(el, index) {
        if (!this.filter(el)) {
            return;
        }

        const elementView = this.addOne(el, index);

        if (this.model.length !== index + 1) {
            //this is not the last element in the list, we need to patch it into the right place inside the DOM
            const nextElement = this.model.get(index + 1);
            const nextChild = this.getChildByElement(nextElement);

            this.el.insertBefore(elementView.el, nextChild.el);
        }

    }

    /**
     * @private
     * @param {E} el
     * @param {number} index
     * @returns {View}
     */
    addOne(el, index) {
        /**
         * @type {View}
         */
        const elementView = this.acquireView(el);

        assert.notEqual(elementView, undefined, 'elementFactory produced undefined instead of a view');
        assert.notEqual(elementView, null, 'elementFactory produced a null instead of a view');

        this.viewMapping.set(el, elementView);

        this.addChild(elementView);

        this.hooks.add(el, elementView, index, self);

        return elementView;
    }

    /**
     * @private
     * @param {E} el
     * @param {number} index
     */
    removeOne(el, index) {
        const children = this.children;

        const i = this.getChildIndexByElement(el);

        //clear mapping
        this.viewMapping.delete(el);

        if (i === -1) {

            if (this.filter(el)) {
                //element fits the filter, but was not in the mapping
                console.error('Failed to find view for element ', el);
            }

        } else {

            const child = children[i];

            this.removeChild(child);

            if (this.__useCache) {
                this.__cache.put(el, child);
            }

            this.hooks.remove(el, child, index, this);
        }
    }

    /**
     *
     * @param {E} el
     * @returns {number} -1 if not found
     */
    getChildIndexByElement(el) {
        const view = this.viewMapping.get(el);

        if (view === undefined) {
            return -1;
        }

        return this.children.indexOf(view);
    }

    /**
     *
     * @param {E} el
     * @returns {View|null}
     */
    getChildByElement(el) {
        return this.viewMapping.get(el);
    }
}

export default ListView;
