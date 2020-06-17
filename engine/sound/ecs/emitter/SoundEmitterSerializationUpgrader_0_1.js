import { BinaryClassUpgrader } from "../../../ecs/storage/binary/BinaryClassUpgrader.js";
import { BinaryBuffer } from "../../../../core/binary/BinaryBuffer.js";

export class SoundEmitterSerializationUpgrader_0_1 extends BinaryClassUpgrader {
    constructor() {
        super();

        this.__startVersion = 0;
        this.__targetVersion = 1;
    }

    upgrade(source, target) {

        let flags = source.readUint8();

        if (flags === 1) {
            flags |= 2; //enable attenuation
        }

        target.writeUint8(flags);

        //write attenuation type
        target.writeUint8(1);

        BinaryBuffer.copyUTF8String(source, target); //channel name

        const volume = source.readFloat64();
        target.writeFloat32(volume);

        //read tracks
        const trackCount = source.readUint32();

        const trackData = [];

        for (let i = 0; i < trackCount; i++) {
            const url = source.readUTF8String();
            const loop = source.readUint8();
            const time = source.readFloat32();

            const channel = source.readUTF8String(); //ignored

            const playing = source.readUint8();
            const startWhenReady = source.readUint8();

            const flags = loop | (playing << 1) | (startWhenReady << 2);

            trackData.push({
                url,
                flags,
                time
            });
        }

        const distanceMin = source.readFloat64();
        const distanceMax = source.readFloat64();
        const distanceRolloff = source.readFloat64(); //ignored

        //write distances
        target.writeFloat32(distanceMin);
        target.writeFloat32(distanceMax);

        //write tracks
        target.writeUintVar(trackCount);

        for (let i = 0; i < trackCount; i++) {
            const trackDatum = trackData[i];

            target.writeUint8(trackDatum.flags);
            target.writeUTF8String(trackDatum.url);
            target.writeFloat64(trackDatum.time);
        }
    }
}
