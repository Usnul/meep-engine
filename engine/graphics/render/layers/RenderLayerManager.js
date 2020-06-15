import List from "../../../../core/collection/List.js";
import RenderLayer from "./RenderLayer.js";
import { Stack } from "../../../../core/collection/Stack.js";
import { RenderLayerManagerState } from "./RenderLayerManagerState.js";

class RenderLayerManager {
    constructor() {
        /**
         * @private
         * @type {Stack<RenderLayerManagerState>}
         */
        this.__stateStack = new Stack();

        /**
         *
         * @type {List<RenderLayer>}
         */
        this.layers = new List();
    }

    /**
     * Hide all layers
     */
    hideAll() {
        const layers = this.layers;
        const n = layers.length;

        for (let i = 0; i < n; i++) {
            const renderLayer = layers.get(i);

            renderLayer.state.visible = false;
        }
    }

    /**
     *
     * @returns {RenderLayerManagerState}
     */
    pushState() {
        // console.warn('RenderLayerManager.pushState');

        const state = new RenderLayerManagerState();

        state.read(this);

        this.__stateStack.push(state);

        return state;
    }

    popState() {
        // console.warn('RenderLayerManager.popState');

        if (this.__stateStack.isEmpty()) {
            return;
        }

        /**
         *
         * @type {RenderLayerManagerState}
         */
        const state = this.__stateStack.pop();

        state.write(this);
    }


    /**
     *
     * @param {string} name
     * @return {RenderLayer}
     */
    create(name) {
        const result = new RenderLayer();

        result.name = name;

        this.add(result);

        return result;
    }

    /**
     *
     * @param {RenderLayer} layer
     */
    add(layer) {

        const name = layer.name;

        const existingLayer = this.getLayerByName(name);

        if (existingLayer !== undefined) {
            throw new Error(`RenderLayer named '${name}' already exists`);
        }


        this.layers.add(layer);

    }

    /**
     *
     * @param {RenderLayer} layer
     * @returns {boolean}
     */
    remove(layer) {
        return this.layers.removeOneOf(layer);
    }

    /**
     *
     * @param {string} name
     * @returns {RenderLayer|undefined}
     */
    getLayerByName(name) {
        return this.layers.find(function (layer) {
            return layer.name === name;
        });
    }

    /**
     *
     * @param {function(RenderLayer)} visitor
     * @param {*} [thisArg]
     */
    traverse(visitor, thisArg) {
        this.layers.forEach(visitor, thisArg);
    }

    /**
     * @template {T}
     * @param {function(RenderLayer):T} mapper
     * @returns {T[]}
     */
    map(mapper) {
        return this.layers.map(mapper);
    }
}

export { RenderLayerManager };
