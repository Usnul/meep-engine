import { BinaryClassSerializationAdapter } from "../../../../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";
import { ParameterLookupTable } from "../../parameter/ParameterLookupTable.js";

export class ParameterLookupTableSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = ParameterLookupTable;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {ParameterLookupTable} value
     */
    serialize(buffer, value) {

        const itemCount = value.positions.length;

        const itemCountBitSize = Math.log2(itemCount);

        let itemCountByteSize;

        if (itemCountBitSize <= 8) {
            itemCountByteSize = 1;
        } else if (itemCountBitSize <= 16) {
            itemCountByteSize = 2;
        } else if (itemCountBitSize <= 32) {
            itemCountByteSize = 4;
        } else {
            throw new Error(`Item count is too high`);
        }

        const itemSize = value.itemSize;
        const header = itemSize | (itemCountByteSize << 4);

        buffer.writeUint8(header);


        //
        if (itemCountByteSize === 1) {
            buffer.writeUint8(itemCount);
        } else if (itemCountByteSize === 2) {
            buffer.writeUint16(itemCount);
        } else if (itemCountByteSize === 4) {
            buffer.writeUint32(itemCount);
        }

        const dataLength = itemCount * itemSize;

        let i;

        for (i = 0; i < dataLength; i++) {
            buffer.writeFloat32(value.data[i]);
        }

        for (i = 0; i < itemCount; i++) {
            buffer.writeFloat32(value.positions[i]);
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {ParameterLookupTable} value
     */
    deserialize(buffer, value) {
        const header = buffer.readUint8();

        value.itemSize = header & 0xF;

        const itemCountByteSize = (header >> 4) & 0xF;

        let itemCount;

        if (itemCountByteSize === 1) {
            itemCount = buffer.readUint8();
        } else if (itemCountByteSize === 2) {
            itemCount = buffer.readUint16();
        } else if (itemCountByteSize === 4) {
            itemCount = buffer.readUint32();
        } else {
            throw new Error(`Unsupported itemCountByteSize '${itemCountByteSize}'`);
        }

        const dataLength = itemCount * value.itemSize;

        const data = new Float32Array(dataLength);
        buffer.readFloat32Array(data, 0, dataLength);

        const positions = new Float32Array(itemCount);
        buffer.readFloat32Array(positions, 0, itemCount);

        value.write(data, positions);
    }
}
