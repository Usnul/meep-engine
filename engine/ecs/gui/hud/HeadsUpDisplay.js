/**
 * User: Alex Goldring
 * Date: 22/6/2014
 * Time: 22:05
 */


import Vector3 from '../../../../core/geom/Vector3.js';
import { HeadsUpDisplayFlag } from "./HeadsUpDisplayFlag.js";

class HeadsUpDisplay {
    /**
     *
     * @param worldOffset
     */
    constructor({
                    worldOffset = new Vector3()
                } = {}) {

        /**
         *
         * @type {Vector3}
         */
        this.worldOffset = worldOffset;

        /**
         *
         * @type {number}
         */
        this.flags = HeadsUpDisplayFlag.TransformWorldOffset;
    }

    /**
     *
     * @param {number|HeadsUpDisplayFlag} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|HeadsUpDisplayFlag} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|HeadsUpDisplayFlag} flag
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
     * @param {number|HeadsUpDisplayFlag} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }

    toJSON() {
        return {
            worldOffset: this.worldOffset.toJSON(),
            transformWorldOffset: this.getFlag(HeadsUpDisplayFlag.TransformWorldOffset),
            transformPerspectiveRotation: this.getFlag(HeadsUpDisplayFlag.PerspectiveRotation)
        };
    }

    fromJSON({ worldOffset = Vector3.zero, transformWorldOffset = true, perspectiveRotation = false }) {
        this.worldOffset.fromJSON(worldOffset);
        this.writeFlag(HeadsUpDisplayFlag.TransformWorldOffset, transformWorldOffset);
        this.writeFlag(HeadsUpDisplayFlag.PerspectiveRotation, perspectiveRotation);
    }
}

HeadsUpDisplay.typeName = "HeadsUpDisplay";
HeadsUpDisplay.serializable = true;

export default HeadsUpDisplay;
