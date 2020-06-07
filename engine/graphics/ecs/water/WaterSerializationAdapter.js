import { BinaryClassSerializationAdapter } from "../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";
import Water from "./Water.js";

export class WaterSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Water;
        this.version = 1;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Water} value
     */
    serialize(buffer, value) {
        buffer.writeFloat64(value.level.getValue());

        buffer.writeUint24(value.color.toUint());

        buffer.writeFloat32(value.shoreDepthTransition.min);
        buffer.writeFloat32(value.shoreDepthTransition.max);

        buffer.writeUint24(value.shoreColor.toUint());

        buffer.writeFloat32(value.waveSpeed.getValue());

        buffer.writeFloat32(value.waveAmplitude.getValue());

        buffer.writeFloat32(value.waveFrequency.getValue());

        buffer.writeFloat32(value.scattering.getValue());
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Water} value
     */
    deserialize(buffer, value) {

        const level = buffer.readFloat64();
        const color = buffer.readUint24();

        const shoreDepthTransition_min = buffer.readFloat32();
        const shoreDepthTransition_max = buffer.readFloat32();

        const shoreColor = buffer.readUint24();

        const waveSpeed = buffer.readFloat32();
        const waveAmplitude = buffer.readFloat32();
        const waveFrequency = buffer.readFloat32();
        const scattering = buffer.readFloat32();

        value.level.set(level);
        value.color.fromUint(color);
        value.shoreDepthTransition.set(shoreDepthTransition_min, shoreDepthTransition_max);
        value.shoreColor.fromUint(shoreColor);
        value.waveSpeed.set(waveSpeed);
        value.waveAmplitude.set(waveAmplitude);
        value.waveFrequency.set(waveFrequency);
        value.scattering.set(scattering);
    }
}
