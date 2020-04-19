import { BVHVisitor } from "./BVHVisitor.js";
import { computePointDistanceToPlane } from "../../geom/Plane.js";

export class ThreeClippingPlaneComputingBVHVisitor extends BVHVisitor {
    constructor() {
        super();

        /**
         * @private
         * @type {Frustum}
         */
        this.frustum = null;

        /**
         *
         * @type {Plane[]|null}
         * @private
         */
        this.__planes = null;

        /**
         *
         * @type {number}
         * @private
         */
        this.__planeCount = 0;

        /**
         *
         * @type {Vector3}
         * @private
         */
        this.__nearPlaneNormal = null;
        /**
         *
         * @type {number}
         * @private
         */
        this.__nearPlaneConstant = 0;

        this.near = 0;
        this.far = 0;
    }

    /**
     *
     * @param {Frustum} frustum
     */
    setFrustum(frustum) {
        this.frustum = frustum;
        const planes = frustum.planes;

        this.__planes = [
            planes[0],
            planes[1],
            planes[2],
            planes[3],
            planes[4]
        ];

        const nearPlane = planes[4];

        this.__nearPlaneNormal = nearPlane.normal;
        this.__nearPlaneConstant = nearPlane.constant;

        this.__planeCount = this.__planes.length;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {boolean}
     */
    __isInteresting(x, y, z) {

        const d = this.__distanceToNearPlane(x, y, z);

        //check if a corner is outside of near/far clipping planes
        return (d < this.near) || (d > this.far);
    }


    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @private
     */
    __traverseCorner(x, y, z) {
        const d = this.__distanceToNearPlane(x, y, z);

        if (d < this.near) {
            this.near = d;
        }

        if (d > this.far) {
            this.far = d;
        }
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @return {number}
     * @private
     */
    __distanceToNearPlane(x, y, z) {

        const n = this.__nearPlaneNormal;

        return computePointDistanceToPlane(x, y, z, n.x, n.y, n.z, this.__nearPlaneConstant);
    }


    visitLeaf(node) {

        //check planes first
        for (let i = 0; i < this.__planeCount; i++) {
            const clipPlane = this.__planes[i];

            if (node.isBelowPlane(clipPlane)) {
                return false;
            }

        }

        node.traverseCorners(this.__traverseCorner, this)
    }

    visitBinary(node) {
        //check planes first
        for (let i = 0; i < this.__planeCount; i++) {
            const clipPlane = this.__planes[i];

            if (node.isBelowPlane(clipPlane)) {
                return false;
            }

        }

        const _x0 = node.x0;
        const _y0 = node.y0;
        const _z0 = node.z0;
        const _x1 = node.x1;
        const _y1 = node.y1;
        const _z1 = node.z1;

        //if all corners lie between already set clipping planes - we don't need to check children
        return this.__isInteresting(_x0, _y0, _z0)
            || this.__isInteresting(_x0, _y0, _z1)
            || this.__isInteresting(_x0, _y1, _z0)
            || this.__isInteresting(_x0, _y1, _z1)
            || this.__isInteresting(_x1, _y0, _z0)
            || this.__isInteresting(_x1, _y0, _z1)
            || this.__isInteresting(_x1, _y1, _z0)
            || this.__isInteresting(_x1, _y1, _z1);
    }
}
