import { BinaryClassUpgrader } from "../../../ecs/storage/binary/BinaryClassUpgrader.js";
import { BinaryBuffer } from "../../../../core/binary/BinaryBuffer.js";

export class SoundEmitterSerializationUpgrader_1_2 extends BinaryClassUpgrader {
    constructor() {
        super();

        this.__startVersion = 1;
        this.__targetVersion = 2;
    }

    upgrade(source, target) {
        BinaryBuffer.copyUint8(source,target); //flags
        BinaryBuffer.copyUint8(source,target); //attenuation
        BinaryBuffer.copyUTF8String(source,target); //channel
        BinaryBuffer.copyFloat32(source,target); //volume
        BinaryBuffer.copyFloat32(source,target); //distance min
        BinaryBuffer.copyFloat32(source,target); //distance max

        const trackCount = BinaryBuffer.copyUintVar(source,target);

        for (let i = 0; i < trackCount; i++) {
            BinaryBuffer.copyUint8(source,target); //flags
            BinaryBuffer.copyUTF8String(source,target); //url
            BinaryBuffer.copyFloat64(source,target); //time

            target.writeFloat32(1); //volume
        }
    }
}
