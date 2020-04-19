import { BVHVisitor } from "./BVHVisitor.js";
import { traverseBinaryNodeUsingVisitor } from "./traverseBinaryNodeUsingVisitor.js";

export class ThreeFrustumsIntersectionBVHVisitor extends BVHVisitor {
    constructor() {
        super();

        /**
         * Collection of THREE.js Frustums
         * @private
         * @type {Frustum[]}
         */
        this.frustums = [];

        this.frustumCount = 0;

        /**
         *
         * @type {BVHVisitor}
         */
        this.collector = null;
    }

    /**
     *
     * @param {Frustum[]} frustums
     */
    setFrustums(frustums) {
        this.frustums = frustums;
        this.frustumCount = frustums.length;
    }

    visitLeaf(node) {

        const n = this.frustumCount;

        for (let i = 0; i < n; i++) {

            const degree = node.intersectFrustumDegree(this.frustums[i]);

            if (degree !== 0) {
                this.collector.visitLeaf(node);
                return;
            }
        }

    }

    visitBinary(node) {
        let flag = false;

        const n = this.frustumCount;

        for (let i = 0; i < n; i++) {

            const degree = node.intersectFrustumDegree(this.frustums[i]);

            if (degree === 2) {
                //completely inside
                traverseBinaryNodeUsingVisitor(node, this.collector);
                return false;
            } else if (degree === 1) {
                //partially inside, continue traversal
                flag = true;
            }

        }

        if (flag) {
            this.collector.visitBinary(n);

            return true;
        } else {
            return false;
        }
    }
}
