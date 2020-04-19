import { BinaryClassSerializationAdapter } from "../../storage/binary/BinaryClassSerializationAdapter.js";
import HeadsUpDisplay from "./HeadsUpDisplay.js";

export class HeadsUpDisplaySerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = HeadsUpDisplay;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {HeadsUpDisplay} value
     */
    serialize(buffer, value) {
        value.worldOffset.toBinaryBuffer(buffer);
        buffer.writeUint8(value.flags );
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {HeadsUpDisplay} value
     */
    deserialize(buffer, value) {
        value.worldOffset.fromBinaryBuffer(buffer);
        value.flags = buffer.readUint8();
    }
}
