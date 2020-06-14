import { BinaryClassUpgrader } from "../../../ecs/storage/binary/BinaryClassUpgrader.js";
import { PathFollowerFlags } from "./PathFollower.js";

export class PathFollowerSerializationUpgrader_0_1 extends BinaryClassUpgrader {
    constructor() {
        super();

        this.__startVersion = 0;
        this.__targetVersion = 1;
    }

    upgrade(source, target) {

        const active = source.readUint8() !== 0;
        const speed = source.readFloat64();
        const rotationAlignment = source.readUint8();
        const rotationSpeed = source.readFloat64();

        target.writeUint8(active ? PathFollowerFlags.Active : 0);

        target.writeFloat32(speed);
        target.writeFloat32(rotationSpeed);

        target.writeUint8(rotationAlignment);
        target.writeUint8(7); //position writing
    }
}
