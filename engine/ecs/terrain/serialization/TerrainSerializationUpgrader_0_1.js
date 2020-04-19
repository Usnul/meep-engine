import { BinaryClassUpgrader } from "../../storage/binary/BinaryClassUpgrader.js";

export class TerrainSerializationUpgrader_0_1 extends BinaryClassUpgrader {
    constructor() {
        super();

        this.__targetVersion = 1;
        this.__startVersion = 0;
    }

    upgrade(source, target) {

        //read
        const size_x = source.readFloat64();
        const size_y = source.readFloat64();

        const height_range = source.readFloat64();

        const height_map_url = source.readUTF8String();

        const grid_scale = source.readFloat64();

        const grid_resolution = source.readFloat64();

        const material_description = source.readUTF8String();

        const preview_url = source.readUTF8String();

        const preview_offset_x = source.readFloat64();
        const preview_offset_y = source.readFloat64();

        const preview_scale_x = source.readFloat64();
        const preview_scale_y = source.readFloat64();

        //write
        target.writeUint32(size_x);
        target.writeUint32(size_y);

        target.writeFloat32(grid_scale);
        target.writeUint16(grid_resolution);

        target.writeUTF8String(preview_url);

        target.writeFloat64(preview_offset_x);
        target.writeFloat64(preview_offset_y);

        target.writeFloat64(preview_scale_x);
        target.writeFloat64(preview_scale_y);

        const parsedMaterialDescription = JSON.parse(material_description);
        const extra = {
            legacy_v0: {
                material: parsedMaterialDescription,
                height_map_url: height_map_url
            }
        };

        if (parsedMaterialDescription.textures.light !== undefined) {
            extra.lightMapURL = parsedMaterialDescription.textures.light;
        }

        target.writeUTF8String(JSON.stringify(extra));

        target.writeFloat64(height_range);

        //write height map
        target.writeUint16(1); //width
        target.writeUint16(1); //height

        target.writeFloat32(0); //write a single height value

        target.writeUint8(0); //number of layers

        //write splats
        target.writeUint16(1); //width
        target.writeUint16(1); //height

        //write splat weights
        //nothing to write

        //write splat materials
        target.writeUint8(0);
        target.writeUint8(1);
        target.writeUint8(2);
        target.writeUint8(3);

        //write terrain layers
        target.writeUint16(1); //layers resolution X
        target.writeUint16(1); //layers resolution Y

    }
}
