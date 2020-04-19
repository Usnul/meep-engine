/**
 * User: Alex Goldring
 * Date: 1/6/2014
 * Time: 08:37
 */


import Vector3 from '../../../core/geom/Vector3.js';
import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";

/**
 * @readonly
 * @enum {String}
 */
export const SteeringEvents = {
    DestinationReached: "steeringDestinationReached"
};

/**
 * @readonly
 * @enum {number}
 */
export const SteeringFlags = {
    Active: 1
};

class Steering {
    constructor() {
        this.maxSpeed = 1;

        /**
         * @readonly
         * @type {Vector3}
         */
        this.destination = new Vector3();

        this.targetMargin = new Vector3(0.001, 0.001, 0.001);

        this.rotationSpeed = Math.PI / 2;

        /**
         *
         * @type {number}
         */
        this.flags = 0;
    }

    /**
     *
     * @param {number|SteeringFlags} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|SteeringFlags} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|SteeringFlags} flag
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
     * @param {number|SteeringFlags} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }

    fromJSON(json) {
        if (json.maxSpeed !== undefined) {
            this.maxSpeed = json.maxSpeed;
        }
        if (json.rotationSpeed !== undefined) {
            this.rotationSpeed = json.rotationSpeed;
        }
        if (json.targetMargin !== undefined) {
            this.targetMargin.fromJSON(json.targetMargin);
        }
    }

    toJSON() {
        return {
            maxSpeed: this.maxSpeed,
            rotationSpeed: this.rotationSpeed,
            targetMargin: this.targetMargin.toJSON()
        };
    }
}

Steering.typeName = "Steering";

export default Steering;

export class SteeringSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Steering;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Steering} value
     */
    serialize(buffer, value) {
        buffer.writeFloat32(value.maxSpeed);
        buffer.writeFloat32(value.rotationSpeed);

        value.destination.toBinaryBufferFloat32(buffer);
        value.targetMargin.toBinaryBufferFloat32_EqualityEncoded(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Steering} value
     */
    deserialize(buffer, value) {
        value.maxSpeed = buffer.readFloat32();
        value.rotationSpeed = buffer.readFloat32();

        value.destination.fromBinaryBufferFloat32(buffer);
        value.targetMargin.fromBinaryBufferFloat32_EqualityEncoded(buffer);
    }
}
