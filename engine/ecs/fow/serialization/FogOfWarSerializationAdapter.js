import { BinaryClassSerializationAdapter } from "../../storage/binary/BinaryClassSerializationAdapter.js";
import { deserializeRowFirstTable, serializeRowFirstTable } from "../../../../core/collection/table/RowFirstTable.js";
import { FogOfWar } from "../FogOfWar.js";

export class FogOfWarSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = FogOfWar;
        this.version = 1;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {FogOfWar} value
     */
    serialize(buffer, value) {
        buffer.writeFloat64(value.scale.getValue());

        buffer.writeUintVar(value.size.x);
        buffer.writeUintVar(value.size.y);

        const color_r = (value.color.x * 255) | 0;
        const color_g = (value.color.y * 255) | 0;
        const color_b = (value.color.z * 255) | 0;
        const color_a = (value.color.w * 255) | 0;

        const color = (color_r << 24)
            | (color_g << 16)
            | (color_b << 8)
            | (color_a << 0)
        ;

        buffer.writeUint32(color);

        value.sampler.toBinaryBuffer(buffer);

        //serialize reveal state
        serializeRowFirstTable(buffer, value.fadeMask);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {FogOfWar} value
     */
    deserialize(buffer, value) {
        value.scale.set(buffer.readFloat64());

        const size_x = buffer.readUintVar();
        const size_y = buffer.readUintVar();

        value.size.set(size_x, size_y);

        const color = buffer.readUint32();

        const color_r = (color >> 24) & 0xFF;
        const color_g = (color >> 16) & 0xFF;
        const color_b = (color >> 8) & 0xFF;
        const color_a = (color >> 0) & 0xFF;

        value.color.set(
            color_r / 255,
            color_g / 255,
            color_b / 255,
            color_a / 255
        );

        value.sampler.fromBinaryBuffer(buffer);

        //deserialize reveal state
        deserializeRowFirstTable(buffer, value.fadeMask);

        //
        value.textureNeedsUpdate = true;
        value.rebuildDistanceSampler();
    }
}
