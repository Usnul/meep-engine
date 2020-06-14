import { Transform2GridPositionMode } from "./Transform2GridPositionMode.js";

export class Transform2GridPosition {
    constructor() {
        /**
         *
         * @type {Transform2GridPositionFlags|number}
         */
        this.flags = 0;

        /**
         *
         * @type {number}
         */
        this.mode = Transform2GridPositionMode.Continuous;
    }

    /**
     *
     * @param {number|Transform2GridPositionFlags} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|Transform2GridPositionFlags} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|Transform2GridPositionFlags} flag
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
     * @param {number|Transform2GridPositionFlags} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }
}

Transform2GridPosition.typeName = 'Transform2GridPosition';

Transform2GridPosition.serializable = false;
