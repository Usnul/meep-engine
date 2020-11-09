import { BinaryClassUpgrader } from "../../storage/binary/BinaryClassUpgrader.js";
import { BinaryBuffer } from "../../../../core/binary/BinaryBuffer.js";

export class TerrainSerializationUpgrader_1_2 extends BinaryClassUpgrader {

    constructor() {
        super();

        this.__targetVersion = 2;
        this.__startVersion = 1;
    }

    upgrade(source, target) {
        const size_x = source.readUint32();
        const size_y = source.readUint32();

        target.writeUintVar(size_x);
        target.writeUintVar(size_y);

        BinaryBuffer.copyFloat32(source, target); // grid_scale

        const resolution = source.readUint16();
        target.writeUintVar(resolution);

        BinaryBuffer.copyUTF8String(source, target); // preview URL

        BinaryBuffer.copyFloat64(source, target); //preview offset X
        BinaryBuffer.copyFloat64(source, target); //preview offset Y
        BinaryBuffer.copyFloat64(source, target); //preview scale X
        BinaryBuffer.copyFloat64(source, target); //preview scale Y


        BinaryBuffer.copyUTF8String(source, target); // extra JSON

        const height_range = source.readFloat64(); // ignored


        // Read height map
        const height_sampler_width = source.readUint16();
        const height_sampler_height = source.readUint16();

        target.writeUintVar(height_sampler_width);
        target.writeUintVar(height_sampler_height);

        BinaryBuffer.copyBytes(source, target, height_sampler_width * height_sampler_height * 4); // copy heightmap data as Float32

        // read splat data
        const layer_count = source.readUint8();
        target.writeUintVar(layer_count);

        const splat_size_x = source.readUint16();
        const splat_size_y = source.readUint16();

        target.writeUintVar(splat_size_x);
        target.writeUintVar(splat_size_y);

        const splat_cell_count = splat_size_x * splat_size_y * layer_count;

        BinaryBuffer.copyBytes(source, target, splat_cell_count);

        // skip material indices, these are no longer used
        source.position += splat_size_x * splat_size_y * 4;

        // read layers

        const layers_resolution_x = source.readUint16();
        const layers_resolution_y = source.readUint16();

        target.writeUintVar(layers_resolution_x);
        target.writeUintVar(layers_resolution_y);

        for (let i = 0; i < layer_count; i++) {
            BinaryBuffer.copyUTF8String(source, target); // diffuse texture URL

            BinaryBuffer.copyFloat32(source, target); // size X
            BinaryBuffer.copyFloat32(source, target); // size Y

            target.writeUTF8String("{}"); // layer extra metadata
        }
    }
}
