import { BinaryClassSerializationAdapter } from "../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";
import { SoundEmitter } from "./SoundEmitter.js";
import { SoundTrack } from "./SoundTrack.js";

export class SoundEmitterSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = SoundEmitter;
        this.version = 2;
    }


    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {SoundEmitter} value
     */
    serialize(buffer, value) {
        buffer.writeUint8(value.flags);
        buffer.writeUint8(value.attenuation);

        buffer.writeUTF8String(value.channel);

        buffer.writeFloat32(value.volume.getValue());
        buffer.writeFloat32(value.distanceMin);
        buffer.writeFloat32(value.distanceMax);

        const tracks = value.tracks;
        const trackCount = tracks.length;

        buffer.writeUintVar(trackCount);

        for (let i = 0; i < trackCount; i++) {
            const soundTrack = tracks.get(i);

            buffer.writeUint8(soundTrack.flags);
            buffer.writeUTF8String(soundTrack.url);
            buffer.writeFloat64(soundTrack.time);
            buffer.writeFloat32(soundTrack.volume);
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {SoundEmitter} value
     */
    deserialize(buffer, value) {

        const flags = buffer.readUint8();
        const attenuation = buffer.readUint8();

        const channel = buffer.readUTF8String();

        const volume = buffer.readFloat32();
        const distanceMin = buffer.readFloat32();
        const distanceMax = buffer.readFloat32();


        value.flags = flags;
        value.attenuation = attenuation;
        value.channel = channel;
        value.volume.set(volume);
        value.distanceMin = distanceMin;
        value.distanceMax = distanceMax;

        const trackCount = buffer.readUintVar();

        value.tracks.reset();

        for (let i = 0; i < trackCount; i++) {
            const track = new SoundTrack();

            track.flags = buffer.readUint8();
            track.url = buffer.readUTF8String();
            track.time = buffer.readFloat64();
            track.volume = buffer.readFloat32();

            value.tracks.add(track);
        }
    }

}
