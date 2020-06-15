/**
 * Created by Alex on 11/10/2016.
 */


import { BinaryNode } from '../../../../core/bvh2/BinaryNode.js';
import { RenderPassType } from "../RenderPassType.js";
import { VisibilitySet } from "../visibility/VisibilitySet.js";
import { BVHVisitor } from "../../../../core/bvh2/traversal/BVHVisitor.js";
import { noop } from "../../../../core/function/Functions.js";
import { ThreeFrustumsIntersectionBVHVisitor } from "../../../../core/bvh2/traversal/ThreeFrustumsIntersectionBVHVisitor.js";
import { traverseBinaryNodeUsingVisitor } from "../../../../core/bvh2/traversal/traverseBinaryNodeUsingVisitor.js";
import { ThreeClippingPlaneComputingBVHVisitor } from "../../../../core/bvh2/traversal/ThreeClippingPlaneComputingBVHVisitor.js";
import { RenderLayerState } from "./RenderLayerState.js";

function passThrough(object) {
    return object;
}

class VisibleLeafCollector extends BVHVisitor {
    constructor() {
        super();

        /**
         *
         * @type {Function[]}
         */
        this.filters = [];
        this.filterCount = 0;

        this.callback = noop;
        this.callbackContext = null;

        this.reader = passThrough;

        this.count = 0;
    }

    initialize() {
        this.filterCount = this.filters.length;
        this.count = 0;
    }

    visitLeaf(leaf) {
        const numFilters = this.filterCount;

        const filters = this.filters;

        for (let i = 0; i < numFilters; i++) {
            const filterFunction = filters[i];

            const visibilityFlag = filterFunction(leaf);

            if (!visibilityFlag) {
                //not visible, skip
                return;
            }
        }

        const object = leaf.object;

        if (object !== null) {
            this.count++;
            const renderable = this.reader(object);
            this.callback.call(this.callbackContext, renderable, leaf);
        }
    }
}

class RenderLayer {
    constructor() {
        /**
         *
         * @type {BinaryNode}
         */
        this.bvh = new BinaryNode();
        this.bvh.setNegativelyInfiniteBounds();

        /**
         *
         * @type {RenderLayerState}
         */
        this.state = new RenderLayerState();

        /**
         *
         * @type {String|null}
         */
        this.name = null;

        /**
         * Layer is managed externally, visibility will not be updated in the rendering engine
         * @deprecated
         * @type {boolean}
         */
        this.managed = false;

        /**
         *
         * @type {function(*): Object3D}
         */
        this.extractRenderable = passThrough;

        /**
         *
         * @type {VisibilitySet}
         */
        this.visibleSet = new VisibilitySet();

        /**
         *
         * @type {RenderPassType|number}
         */
        this.renderPass = RenderPassType.Opaque;

        /**
         * @private
         * @type {VisibleLeafCollector}
         */
        this.visibilityCollector = new VisibleLeafCollector();
        /**
         * @private
         * @type {ThreeFrustumsIntersectionBVHVisitor}
         */
        this.bvhVisibilityVisitor = new ThreeFrustumsIntersectionBVHVisitor();
        this.bvhVisibilityVisitor.collector = this.visibilityCollector;


    }

    /**
     * @deprecated
     * @returns {boolean}
     */
    get visible() {
        return this.state.visible;
    }

    /**
     * @deprecated
     * @param {boolean} v
     */
    set visible(v) {
        this.state.visible = v;
    }

    /**
     * Compute near and far clipping planes for a camera given a frustum.
     * Note: near plane is frustum.planes[4], far plane is frustum.planes[5]
     * @param {Frustum} frustum
     * @param {number} near
     * @param {number} far
     * @param {function(near:number, far:number)} callback
     * @param [thisArg]
     */
    computeNearFarClippingPlanes(frustum, near, far, callback, thisArg) {

        bvh_visitor_ClippingPlanes.setFrustum(frustum);
        bvh_visitor_ClippingPlanes.near = near;
        bvh_visitor_ClippingPlanes.far = far;

        traverseBinaryNodeUsingVisitor(this.bvh, bvh_visitor_ClippingPlanes);

        callback.call(thisArg, bvh_visitor_ClippingPlanes.near, bvh_visitor_ClippingPlanes.far);

    }

    /**
     *
     * @param {Frustum[]} frustums
     * @param {function[]} filters
     * @param {function(Object3D, NodeDescription)} callback
     * @param {*} [callbackContext]
     */
    buildVisibleSet(frustums, filters, callback, callbackContext) {
        const reader = this.extractRenderable;


        if (typeof reader === "function") {
            this.visibilityCollector.callback = callback;
            this.visibilityCollector.callbackContext = callbackContext;

            this.visibilityCollector.filters = filters;
            this.visibilityCollector.reader = reader;

            this.visibilityCollector.initialize();

            this.bvhVisibilityVisitor.setFrustums(frustums);

            traverseBinaryNodeUsingVisitor(this.bvh, this.bvhVisibilityVisitor);

            this.visibilityCollector.finalize();

        }

    }
}

const bvh_visitor_ClippingPlanes = new ThreeClippingPlaneComputingBVHVisitor();


export default RenderLayer;
