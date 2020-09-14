/**
 * Created by Alex on 14/06/2017.
 */


import Vector3 from "../../../../core/geom/Vector3.js";
import Vector4 from "../../../../core/geom/Vector4.js";

/**
 * @readonly
 * @enum {number}
 */
export const Trail2DFlags = {
    Spawning: 1
};

class Trail2D {
    constructor() {

        /**
         * Age at which trail segment disappears, in seconds
         * @type {number}
         */
        this.maxAge = 5;

        this.textureURL = null;

        /**
         * Trail width
         * @type {number}
         */
        this.width = 1;

        /**
         * Current simulated time since trail birth
         * @type {number}
         */
        this.time = 0;

        /**
         * Time elapsed since last update
         * @type {number}
         */
        this.timeSinceLastUpdate = 0;

        /**
         * @readonly
         * @type {Vector4}
         */
        this.color = new Vector4(1, 1, 1, 1);

        /**
         * World offset
         * @readonly
         * @type {Vector3}
         */
        this.offset = new Vector3();

        /**
         * transient
         * @type {RibbonX|null}
         */
        this.ribbon = null;

        /**
         * transient
         * @type {Material|null}
         */
        this.material = null;

        /**
         * transient
         * @type {LeafNode|null}
         */
        this.bvhLeaf = null;

        /**
         * @private
         * @type {Trail2DFlags|number}
         */
        this.flags = Trail2DFlags.Spawning;
    }

    /**
     *
     * @param {number|Trail2DFlags} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|Trail2DFlags} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|Trail2DFlags} flag
     * @param {boolean} value
     */
    writeFlag(flag, value) {
        if (value) {
            this.setFlag(flag);
        } else {
            this.clearFlag(flag);
        }
    }

    /**
     *
     * @param {number|Trail2DFlags} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }

    static fromJSON(json) {
        const r = new Trail2D();

        r.fromJSON(json);

        return r;
    }

    fromJSON(json) {
        if (typeof json.maxAge === "number") {
            this.maxAge = json.maxAge;
        }

        if (typeof json.width === "number") {
            this.width = json.width;
        }

        if (typeof json.textureURL === "string") {
            this.textureURL = json.textureURL;
        }

        if (json.offset !== undefined) {
            this.offset.fromJSON(json.offset);
        }

        if (json.color !== undefined) {
            this.color.fromJSON(json.color);
        }
    }

    toJSON() {
        return {
            maxAge: this.maxAge,
            width: this.width,
            color: this.color.toJSON(),
            textureURL: this.textureURL,
            offset: this.offset.toJSON()
        };
    }

    /**
     *
     * @param {Trail2D} other
     */
    equals(other) {
        return this.textureURL === other.textureURL
            && this.width === other.width
            && this.maxAge === other.maxAge
            && this.color.equals(other.color)
            && this.offset.equals(other.offset)
            ;
    }
}

Trail2D.typeName = "Trail2D";

Trail2D.serializable = false;

export default Trail2D;
