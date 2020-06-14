import { BinaryClassSerializationAdapter } from "../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";
import PathFollower from "./PathFollower.js";

export class PathFollowerSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = PathFollower;
        this.version = 2;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {PathFollower} value
     */
    serialize(buffer, value) {
        buffer.writeUint8(value.flags);
        buffer.writeFloat32(value.speed.getValue());
        buffer.writeFloat32(value.rotationSpeed.getValue());

        value.rotationAlignment.toBinaryBuffer(buffer);
        value.positionWriting.toBinaryBuffer(buffer);

        buffer.writeFloat32(value.maxMoveDistance);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {PathFollower} value
     */
    deserialize(buffer, value) {
        value.flags = buffer.readUint8();
        value.speed.set(buffer.readFloat32());
        value.rotationSpeed.set(buffer.readFloat32());

        value.rotationAlignment.fromBinaryBuffer(buffer);
        value.positionWriting.fromBinaryBuffer(buffer);

        value.maxMoveDistance = buffer.readFloat32();
    }
}
