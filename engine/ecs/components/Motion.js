/**
 * User: Alex Goldring
 * Date: 7/4/2014
 * Time: 20:41
 */
import Vector3 from '../../../core/geom/Vector3.js';
import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";


class Motion {
    constructor() {
        /**
         * @readonly
         * @type {Vector3}
         */
        this.velocity = new Vector3();
    }

    toJSON() {
        return {
            velocity: this.velocity.toJSON()
        };
    }

    fromJSON(json) {
        this.velocity.fromJSON(json.velocity);
    }
}


Motion.typeName = "Motion";

export default Motion;


export class MotionSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Motion;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Motion} value
     */
    serialize(buffer, value) {
        value.velocity.toBinaryBufferFloat32(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Motion} value
     */
    deserialize(buffer, value) {
        value.velocity.fromBinaryBufferFloat32(buffer);
    }
}
