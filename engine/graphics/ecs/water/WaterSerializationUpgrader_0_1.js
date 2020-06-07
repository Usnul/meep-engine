import { BinaryClassUpgrader } from "../../../ecs/storage/binary/BinaryClassUpgrader.js";

export class WaterSerializationUpgrader_0_1 extends BinaryClassUpgrader {
    constructor() {
        super();

        this.__startVersion = 0;
        this.__targetVersion = 1;
    }

    upgrade(source, target) {
        const level = source.readFloat64();

        const colorR = source.readFloat64();
        const colorG = source.readFloat64();
        const colorB = source.readFloat64();

        target.writeFloat64(level);

        //water color
        target.writeUint24(
            (((colorR * 255) & 0xFF) >> 16)
            | (((colorG * 255) & 0xFF) >> 8)
            | ((colorB * 255) & 0xFF)
        );

        //shore depth transition
        target.writeFloat32(0.7);
        target.writeFloat32(2);

        //shore color
        target.writeUint24(0x95cad9);

        //wave speed
        target.writeFloat32(1.8);

        //wave amplitude
        target.writeFloat32(0.3);

        //wave frequency
        target.writeFloat32(1);

        /**
         * Scattering
         */
        target.writeFloat32(1.2);
    }
}
