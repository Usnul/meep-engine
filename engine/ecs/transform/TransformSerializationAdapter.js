import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";
import { Transform } from "./Transform.js";

export class TransformSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Transform;
        this.version = 1;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Transform} value
     */
    serialize(buffer, value) {

        const positionX = value.position.x;
        const positionY = value.position.y;
        const positionZ = value.position.z;

        const encodedRotation = value.rotation.encodeToUint32();

        buffer.writeFloat64(positionX);
        buffer.writeFloat64(positionY);
        buffer.writeFloat64(positionZ);

        buffer.writeUint32(encodedRotation);

        value.scale.toBinaryBufferFloat32_EqualityEncoded(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Transform} value
     */
    deserialize(buffer, value) {
        const positionX = buffer.readFloat64();
        const positionY = buffer.readFloat64();
        const positionZ = buffer.readFloat64();

        const encodedRotation = buffer.readUint32();

        value.scale.fromBinaryBufferFloat32_EqualityEncoded(buffer);

        value.position.set(positionX, positionY, positionZ);

        value.rotation.decodeFromUint32(encodedRotation);
    }
}
