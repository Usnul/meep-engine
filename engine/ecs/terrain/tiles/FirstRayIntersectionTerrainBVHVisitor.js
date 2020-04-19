import { BVHVisitor } from "../../../../core/bvh2/traversal/BVHVisitor.js";
import { SurfacePoint3 } from "../../../../core/geom/3d/SurfacePoint3.js";

export class FirstRayIntersectionTerrainBVHVisitor extends BVHVisitor {
    constructor() {
        super();

        this.closest = new SurfacePoint3();
        this.closestDistance = Number.POSITIVE_INFINITY;

        /**
         *
         * @type {SurfacePoint3}
         * @private
         */
        this.__tempContact = new SurfacePoint3();

        this.originX = 0;
        this.originY = 0;
        this.originZ = 0;

        this.directionX = 0;
        this.directionY = 0;
        this.directionZ = 0;
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

    initialize() {
        this.closestDistance = Number.POSITIVE_INFINITY;
    }

    visitLeaf(node) {

        /**
         * @type {TerrainTile}
         */
        const tile = node.object;

        if (tile.isBuilt) {
            const hitDetected = tile.raycastFirstSync(this.__tempContact, this.originX, this.originY, this.originZ, this.directionX, this.directionY, this.directionZ);

            if (hitDetected) {
                const d = this.__tempContact.position._distanceSqrTo(this.originX, this.originY, this.originZ);
                if (d < this.closestDistance) {
                    this.closestDistance = d;
                    this.closest.copy(this.__tempContact);
                }
            }
        }
    }
}
