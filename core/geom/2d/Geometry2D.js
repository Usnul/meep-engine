import AABB2 from "../AABB2.js";


const aabb_0 = new AABB2();
const aabb_1 = new AABB2();

/**
 * 2D version of a polygon collection
 */
export class Geometry2D {
    constructor() {

        /**
         * @example [x,y,      x,y,      x,y]
         * @type {number[]}
         */
        this.vertices = [];

        /**
         * Triplets of indices of vertices making up a polygon
         * @example [0,1,2,     3,4,5]
         * @type {number[]}
         */
        this.indices = [];

        /**
         * Bounding box
         * @type {AABB2}
         */
        this.aabb = new AABB2();
    }

    /**
     *
     * @param {Geometry2D} g0
     * @param {number[]} m0 Transform matrix for first geometry (m 3x3)
     * @param {Geometry2D} g1
     * @param {number[]} m1 Transform matrix for second geometry (m 3x3)
     * @returns {boolean}
     */
    static overlapExists(g0, m0, g1, m1) {
        // first check for AABB overlap

        aabb_0.copy(g0.aabb);
        aabb_0.applyMatrix3(m0);

        aabb_1.copy(g1.aabb);
        aabb_1.applyMatrix3(m1);

        if (!aabb_0.overlapExists(aabb_1)) {
            //no overlap
            return false;
        }

        //overlap between AABBs, test individual triangle pairs
    }
}


