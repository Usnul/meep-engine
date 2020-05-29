import { BinaryClassSerializationAdapter } from "../../storage/binary/BinaryClassSerializationAdapter.js";
import Terrain from "../ecs/Terrain.js";
import { assert } from "../../../../core/assert.js";
import { TerrainLayer } from "../ecs/layers/TerrainLayer.js";
import { objectKeyByValue } from "../../../../core/model/ObjectUtils.js";
import { GridTransformKind } from "../ecs/GridTransformKind.js";

export class TerrainSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Terrain;
        this.version = 1;

        /**
         *
         * @type {TerrainSystem}
         */
        this.system = null;
    }

    initialize(system) {
        this.system = system;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Terrain} value
     */
    serialize(buffer, value) {
        buffer.writeUint32(value.size.x);
        buffer.writeUint32(value.size.y);

        buffer.writeFloat32(value.gridScale);
        buffer.writeUint16(value.resolution);

        buffer.writeUTF8String(value.preview.url);
        buffer.writeFloat64(value.preview.offset.x);
        buffer.writeFloat64(value.preview.offset.y);

        buffer.writeFloat64(value.preview.scale.x);
        buffer.writeFloat64(value.preview.scale.y);

        //extra metadata
        const extra = {
            gridTransform: objectKeyByValue(GridTransformKind, value.gridTransformKind)
        };

        if (value.lightMapURL !== null) {
            extra.lightMapURL = value.lightMapURL;
        }

        buffer.writeUTF8String(JSON.stringify(extra));

        buffer.writeFloat64(value.heightRange);

        //height map
        buffer.writeUint16(value.samplerHeight.width);
        buffer.writeUint16(value.samplerHeight.height);

        const heightBytes = new Uint8Array(value.samplerHeight.data.buffer);

        assert.equal(heightBytes.length, value.samplerHeight.width * value.samplerHeight.height * 4, `Incorrect height data size`);

        buffer.writeBytes(heightBytes, 0, heightBytes.length);

        const layerCount = value.layers.count();

        buffer.writeUint8(layerCount);


        //splats
        buffer.writeUint16(value.splat.size.x);
        buffer.writeUint16(value.splat.size.y);

        const weightData = value.splat.weightData;
        const materialData = value.splat.materialData;

        buffer.writeBytes(weightData, 0, weightData.length);
        buffer.writeBytes(materialData, 0, materialData.length);

        //layers
        buffer.writeUint16(value.layers.resolution.x);
        buffer.writeUint16(value.layers.resolution.y);

        for (let i = 0; i < layerCount; i++) {
            const terrainLayer = value.layers.get(i);

            buffer.writeUTF8String(terrainLayer.textureDiffuseURL);

            buffer.writeFloat32(terrainLayer.size.x);
            buffer.writeFloat32(terrainLayer.size.y);

        }
    }


    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Terrain} value
     */
    deserialize(buffer, value) {

        const size_x = buffer.readUint32();
        const size_y = buffer.readUint32();

        const grid_scale = buffer.readFloat32();
        const resolution = buffer.readUint16();

        const preview_url = buffer.readUTF8String();

        const preview_offset_x = buffer.readFloat64();
        const preview_offset_y = buffer.readFloat64();

        const preview_scale_x = buffer.readFloat64();
        const preview_scale_y = buffer.readFloat64();

        const extra = buffer.readUTF8String();

        const height_range = buffer.readFloat64();

        value.size.set(size_x, size_y);
        value.gridScale = grid_scale;
        value.resolution = resolution;

        value.preview.url = preview_url;
        value.preview.offset.set(preview_offset_x, preview_offset_y);
        value.preview.scale.set(preview_scale_x, preview_scale_y);

        const extraMetadata = JSON.parse(extra);

        if (extraMetadata.legacy_v0 !== undefined) {
            value.__legacyMaterialSpec = extraMetadata.legacy_v0.material;
            value.__legacyHeightSamplerURL = extraMetadata.legacy_v0.height_map_url;
        }

        if (extraMetadata.lightMapURL !== undefined) {
            value.lightMapURL = extraMetadata.lightMapURL;
        } else {
            value.lightMapURL = null;
        }

        if (extraMetadata.gridTransform !== undefined) {
            value.gridTransformKind = GridTransformKind[extraMetadata.gridTransform];
        } else {
            value.gridTransformKind = GridTransformKind.Legacy;
        }

        value.heightRange = height_range;

        // Read height map
        const height_sampler_width = buffer.readUint16();
        const height_sampler_height = buffer.readUint16();

        value.samplerHeight.resize(height_sampler_width, height_sampler_height);

        const heightUint8Array = new Uint8Array(value.samplerHeight.data.buffer);

        buffer.readBytes(heightUint8Array, 0, heightUint8Array.length);

        const layer_count = buffer.readUint8();

        // Read splats
        const splat_size_x = buffer.readUint16();
        const splat_size_y = buffer.readUint16();

        value.splat.resize(splat_size_x, splat_size_y, layer_count);

        const weightData = value.splat.weightData;

        buffer.readBytes(weightData, 0, weightData.length);

        const materialData = value.splat.materialData;
        buffer.readBytes(materialData, 0, materialData.length);

        // Read layers
        const layers_resolution_x = buffer.readUint16();
        const layers_resolution_y = buffer.readUint16();

        value.layers.resolution.set(layers_resolution_x, layers_resolution_y);


        value.layers.clear();

        for (let i = 0; i < layer_count; i++) {

            const layer = new TerrainLayer();

            layer.textureDiffuseURL = buffer.readUTF8String();

            const size_x = buffer.readFloat32();
            const size_y = buffer.readFloat32();

            layer.size.set(size_x, size_y);

            value.layers.addLayer(layer);

        }

        value.build(this.system.assetManager);
    }
}
