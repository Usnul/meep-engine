/**
 * Created by Alex on 17/02/2017.
 */


import Vector1 from "../../../../core/geom/Vector1.js";
import { ClampToEdgeWrapping, DataTexture, FloatType, LinearFilter, RedFormat } from "three";
import { NumericInterval } from "../../../../core/math/interval/NumericInterval.js";
import { Color } from "../../../../core/color/Color.js";

class Water {
    constructor(options) {
        this.level = new Vector1(0);

        if (options !== undefined) {
            this.fromJSON(options);
        }

        /**
         *
         * @type {Color}
         */
        this.color = new Color(0, 0.3, 0.5);


        /**
         * Defines what is considered as shore as well as how long is the transition between shore and deep water
         * @type {NumericInterval}
         */
        this.shoreDepthTransition = new NumericInterval(0.7, 2);


        /**
         * Color of the water at the shore
         * @type {Color}
         */
        this.shoreColor = new Color(0.584, 0.792, 0.850);

        /**
         *
         * @type {Vector1}
         */
        this.waveSpeed = new Vector1(1.8);

        /**
         *
         * @type {Vector1}
         */
        this.waveAmplitude = new Vector1(0.3);

        /**
         *
         * @type {Vector1}
         */
        this.waveFrequency = new Vector1(1);

        /**
         * Scattering of light, the higher this value is - the more opaque water will become
         * @type {Vector1}
         */
        this.scattering = new Vector1(1.2);

        /**
         *
         * @type {ShaderMaterial}
         */
        this.__shader = null;

        /**
         *
         * @type {Object3D}
         * @private
         */
        this.__threeObject = null;

        // monitor changes
        this.color.onChanged.add(this.writeShaderUniforms, this);
        this.shoreDepthTransition.onChanged.add(this.writeShaderUniforms, this);
        this.shoreColor.onChanged.add(this.writeShaderUniforms, this);
        this.waveSpeed.onChanged.add(this.writeShaderUniforms, this);
        this.waveAmplitude.onChanged.add(this.writeShaderUniforms, this);
        this.waveFrequency.onChanged.add(this.writeShaderUniforms, this);
        this.scattering.onChanged.add(this.writeShaderUniforms, this);
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

        const heightTexture = new DataTexture(terrain.samplerHeight.data, terrain.samplerHeight.width, terrain.samplerHeight.height, RedFormat, FloatType);

        heightTexture.wrapS = ClampToEdgeWrapping;
        heightTexture.wrapT = ClampToEdgeWrapping;

        heightTexture.generateMipmaps = false;

        heightTexture.minFilter = LinearFilter;
        heightTexture.magFilter = LinearFilter;

        heightTexture.flipY = false;

        heightTexture.internalFormat = 'R32F';

        shader.uniforms.tHeightTexture.value = heightTexture;

        shader.uniforms.vHeightUv.value.set(
            -0.25,
            -0.25,
            (waterSize / tW),
            (waterSize / tH)
        );

        shader.uniforms.vHeightTextureResolution.value.set(terrain.samplerHeight.width, terrain.samplerHeight.height);
    }

    writeShaderUniforms() {

        /**
         *
         * @type {ShaderMaterial}
         */
        const shader = this.__shader;

        if (shader === null) {
            //no shader attached
            return;
        }

        const uniforms = shader.uniforms;

        uniforms.waterColor.value.setRGB(this.color.r, this.color.g, this.color.b);
        uniforms.shoreColor.value.setRGB(this.shoreColor.r, this.shoreColor.g, this.shoreColor.b);

        uniforms.fWaveSpeed.value = this.waveSpeed.getValue();

        uniforms.fWaveAmplitude.value = this.waveAmplitude.getValue();

        uniforms.fWaveFrequency.value = this.waveFrequency.getValue();

        uniforms.fScattering.value = this.scattering.getValue();

        uniforms.vShoreDepthTransition.value.set(this.shoreDepthTransition.min, this.shoreDepthTransition.max);


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

