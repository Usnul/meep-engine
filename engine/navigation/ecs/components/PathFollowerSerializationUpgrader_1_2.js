import { BinaryClassUpgrader } from "../../../ecs/storage/binary/BinaryClassUpgrader.js";
import { BinaryBuffer } from "../../../../core/binary/BinaryBuffer.js";

export class PathFollowerSerializationUpgrader_1_2 extends BinaryClassUpgrader {
    constructor() {
        super();

        this.__startVersion = 1;
        this.__targetVersion = 2;
    }

    upgrade(source, target) {
        BinaryBuffer.copyUint8(source, target); // flags
        BinaryBuffer.copyFloat32(source, target); // speed
        BinaryBuffer.copyFloat32(source, target); // rotation speed

        BinaryBuffer.copyUint8(source, target); // rotation Alignment
        BinaryBuffer.copyUint8(source, target); // position Writing

        target.writeFloat32(100000); // max move distance
    }
}
