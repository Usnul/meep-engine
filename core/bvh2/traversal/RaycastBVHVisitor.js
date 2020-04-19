import { BVHVisitor } from "./BVHVisitor.js";

export class RaycastBVHVisitor extends BVHVisitor {
    constructor() {
        super();

        this.originX = 0;
        this.originY = 0;
        this.originZ = 0;

        this.directionX = 0;
        this.directionY = 0;
        this.directionZ = 0;

        /**
         *
         * @type {BVHVisitor}
         */
        this.collector = null;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setOrigin(x, y, z) {
        this.originX = x;
        this.originY = y;
        this.originZ = z;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setDirection(x, y, z) {
        this.directionX = x;
        this.directionY = y;
        this.directionZ = z;
    }

    visitLeaf(node) {

        const b = node.intersectRay(this.originX, this.originY, this.originZ, this.directionX, this.directionY, this.directionZ);


        if (b) {
            this.collector.visitLeaf(node);
        }

    }

    visitBinary(node) {
        const b = node.intersectRay(this.originX, this.originY, this.originZ, this.directionX, this.directionY, this.directionZ);

        if (b) {
            this.collector.visitBinary(node);
        }

        return b;
    }
}
