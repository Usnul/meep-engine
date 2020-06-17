import { BinaryClassUpgrader } from "../storage/binary/BinaryClassUpgrader.js";

export class TransformSerializationUpgrader_0_1 extends BinaryClassUpgrader {
    constructor() {
        super();

        this.__startVersion = 0;
        this.__targetVersion = 1;
    }

    upgrade(source, target) {

        const positionX = source.readFloat64();
        const positionY = source.readFloat64();
        const positionZ = source.readFloat64();

        const encodedRotation = source.readUint32();

        const scaleX = source.readFloat32();
        const scaleY = source.readFloat32();
        const scaleZ = source.readFloat32();


        //
        target.writeFloat64(positionX);
        target.writeFloat64(positionY);
        target.writeFloat64(positionZ);

        target.writeUint32(encodedRotation);

        let scaleHeader = 0;

        if (scaleX === scaleY) {
            scaleHeader |= 1;
        }

        if (scaleY === scaleZ) {
            scaleHeader |= 2;
        }

        if (scaleX === scaleZ) {
            scaleHeader |= 4;
        }

        target.writeUint8(scaleHeader);

        if ((scaleHeader & 7) === 7) {
            //all scale components are the same
            target.writeFloat32(scaleX);
        } else if (scaleHeader === 1) {
            //X and Y are the same, Z is different
            target.writeFloat32(scaleX);
            target.writeFloat32(scaleZ);
        } else if (scaleHeader === 2) {
            //Y and Z are the same, X is different
            target.writeFloat32(scaleX);
            target.writeFloat32(scaleY);
        } else if (scaleHeader === 4) {
            //X and Z are the same, Y is different
            target.writeFloat32(scaleX);
            target.writeFloat32(scaleY);
        } else {
            //scale components are different
            target.writeFloat32(scaleX);
            target.writeFloat32(scaleY);
            target.writeFloat32(scaleZ);
        }
    }
}
