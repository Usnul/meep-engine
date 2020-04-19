import Vector3 from "../Vector3.js";

/**
 * Used for representing points on a 3D surface. Used for raycasting contacts
 */
export class SurfacePoint3 {
    constructor() {
        this.normal = new Vector3();
        this.position = new Vector3();
    }

    /**
     *
     * @param {SurfacePoint3} other
     */
    copy(other) {
        this.position.copy(other.position);
        this.normal.copy(other.normal);
    }
}
