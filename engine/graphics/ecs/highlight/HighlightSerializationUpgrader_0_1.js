import { BinaryClassUpgrader } from "../../../ecs/storage/binary/BinaryClassUpgrader.js";

export class HighlightSerializationUpgrader_0_1 extends BinaryClassUpgrader {
    constructor() {
        super();

        this.__startVersion = 0;
        this.__targetVersion = 1;
    }

    upgrade(source, target) {
        const r = source.readFloat32();
        const g = source.readFloat32();
        const b = source.readFloat32();
        const a = source.readFloat32();

        //element count
        target.writeUintVar(1);

        //color
        target.writeFloat32(r);
        target.writeFloat32(g);
        target.writeFloat32(b);

        //opacity
        target.writeFloat32(a);
    }
}
