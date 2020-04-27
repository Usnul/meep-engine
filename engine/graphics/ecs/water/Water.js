/**
 * Created by Alex on 17/02/2017.
 */


import Vector3 from "../../../../core/geom/Vector3.js";
import Vector1 from "../../../../core/geom/Vector1.js";
import { BinaryClassSerializationAdapter } from "../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";

class Water {
    constructor(options) {
        this.level = new Vector1(0);

        if (options !== undefined) {
            this.fromJSON(options);
        }

        this.color = new Vector3(0, 0.3, 0.5);

        /**
         *
         * @type {NodeWaterShader}
         */
        this.__shader = null;

        /**
         *
         * @type {Object3D}
         * @private
         */
        this.__threeObject = null;

        this.color.onChanged.add(this.writeColorToShader, this);
    }

    /**
     *
     * @param {Terrain} terrain
     * @param {number} waterSize
     */
    updateShaderForTerrain(terrain, waterSize) {
        const shader = this.__shader;

        if (shader === null) {
            return;
        }

        const tW = terrain.size.x * terrain.gridScale;
        const tH = terrain.size.y * terrain.gridScale;

        shader.heightTexture.value = terrain.heightTexture;

        shader.heightUv.value.set(
            -0.25,
            -0.25,
            (waterSize / tW),
            (waterSize / tH)
        );
    }

    writeColorToShader() {
        const r = this.color.x;
        const g = this.color.y;
        const b = this.color.z;

        this.__shader.color.value.setRGB(r, g, b);
    }

    fromJSON(json) {
        if (typeof json.level === 'number') {
            this.level.fromJSON(json.level);
        }
        if (typeof json.color === 'object') {
            this.color.fromJSON(json.color);
        }
    }

    toJSON() {
        return {
            level: this.level.toJSON(),
            color: this.color.toJSON()
        };
    }
}

Water.typeName = "Water";

export default Water;

export class WaterSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Water;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Water} value
     */
    serialize(buffer, value) {
        value.level.toBinaryBuffer(buffer);

        value.color.toBinaryBuffer(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Water} value
     */
    deserialize(buffer, value) {
        value.level.fromBinaryBuffer(buffer);

        value.color.fromBinaryBuffer(buffer);
    }
}
