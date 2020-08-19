import { BinaryClassUpgrader } from "../../storage/binary/BinaryClassUpgrader.js";
import { BinaryBuffer } from "../../../../core/binary/BinaryBuffer.js";

export class FogOfWarSerializationUpdater_0_1 extends BinaryClassUpgrader {
    constructor() {
        super();

        this.__startVersion = 0;
        this.__targetVersion = 1;
    }

    upgrade(source, target) {

        BinaryBuffer.copyFloat64(source, target); //scale

        source.readFloat64(); //height, deprecated

        const size_x = source.readFloat64();
        const size_y = source.readFloat64();

        target.writeUintVar(size_x);
        target.writeUintVar(size_y);

        target.writeUint32(0x191919FF); // write color

        // sampler
        const sampler_width = BinaryBuffer.copyUint16(source, target); // width
        const sampler_height = BinaryBuffer.copyUint16(source, target); // height

        const sampler_item_size = BinaryBuffer.copyUint8(source, target); // item size

        BinaryBuffer.copyUint8(source, target); // data type

        BinaryBuffer.copyBytes(source, target, sampler_height * sampler_width * sampler_item_size); // sampler data

        const table_type_count = BinaryBuffer.copyUint16(source, target);

        for (let i = 0; i < table_type_count; i++) {
            BinaryBuffer.copyUint8(source, target);
        }

        const table_bytes_per_record = BinaryBuffer.copyUint32(source, target); //record length

        const table_record_count = BinaryBuffer.copyUint32(source, target);

        const table_data_size = table_bytes_per_record * table_record_count;

        BinaryBuffer.copyBytes(source, target, table_data_size);
    }
}
