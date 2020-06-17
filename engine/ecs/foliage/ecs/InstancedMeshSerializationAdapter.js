import { BinaryClassSerializationAdapter } from "../../storage/binary/BinaryClassSerializationAdapter.js";
import { Foliage2, FoliageLayer } from "./Foliage2.js";

export class InstancedMeshSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Foliage2;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Foliage2} value
     */
    serialize(buffer, value) {
        value.layers.toBinaryBuffer(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Foliage2} value
     */
    deserialize(buffer, value) {

        value.layers.fromBinaryBuffer(buffer, FoliageLayer);
    }
}
