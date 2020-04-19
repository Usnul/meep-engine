import { Action } from "../Action.js";
import { Sampler2D } from "../../../engine/graphics/texture/sampler/Sampler2D.js";
import { max2, min2 } from "../../../core/math/MathUtils.js";

export class PatchTerrainTextureAction extends Action {

    /**
     *
     * @param {Terrain} terrain
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    constructor(terrain, x, y, width, height) {
        super();

        /**
         *
         * @type {Terrain}
         */
        this.terrain = terrain;

        const depth = terrain.splat.depth;

        /**
         *
         * @type {Uint8Array}
         */
        this.patchWeight = new Uint8Array(width * height * depth);

        /**
         *
         * @type {Sampler2D}
         */
        this.patchMaterial = Sampler2D.uint8(4, width, height);

        this.x = x;
        this.y = y;

        this.width = width;
        this.height = height;

        this.__oldPatchWeight = new Uint8Array(width * height * depth);
        this.__oldPatchMaterial = Sampler2D.uint8(4, width, height);
    }

    /**
     *
     * @param {number[]|Uint8Array|Float32Array} source
     * @param {number} sourceWidth
     * @param {number} sourceHeight
     */
    readWeights(source, sourceWidth, sourceHeight) {
        const depth = this.terrain.splat.depth;

        const destinationWidth = this.width;
        const destinationHeight = this.height;

        const sourceX = this.x;
        const sourceY = this.y;

        const sourceLayerSize = sourceWidth * sourceHeight;
        const destinationLayerSize = destinationWidth * destinationHeight;

        const _w = max2(0, min2(destinationWidth, sourceWidth - sourceX));
        const _h = max2(0, min2(destinationHeight, sourceHeight - sourceY));

        const destination = this.patchWeight;

        for (let i = 0; i < depth; i++) {

            const dLayerAddress = destinationLayerSize * i;
            const sLayerAddress = sourceLayerSize * i;

            for (let y = 0; y < _h; y++) {
                const dRowAddress = y * destinationWidth + dLayerAddress;

                const sRowAddress = (y + sourceY) * sourceWidth + sLayerAddress;

                for (let x = 0; x < _w; x++) {
                    const dAddress = dRowAddress + x;

                    const sAddress = sRowAddress + x + sourceX;

                    destination[dAddress] = source[sAddress];
                }
            }

        }
    }

    updateTerrain() {

        this.terrain.splat.materialTexture.needsUpdate = true;
        this.terrain.splat.weightTexture.needsUpdate = true;


    }

    apply(context) {
        /**
         *
         * @type {Terrain}
         */
        const terrain = this.terrain;


        const splat = terrain.splat;

        const samplerMaterials = splat.materialSampler;

        //store old data from the patch
        splat.readWeightData(this.__oldPatchWeight, this.x, this.y, this.width, this.height);

        const oldPatchMaterial = this.__oldPatchMaterial;
        oldPatchMaterial.copy_sameItemSize(samplerMaterials, this.x, this.y, 0, 0, oldPatchMaterial.width, oldPatchMaterial.height);

        //apply the patch
        splat.writeWeightData(this.patchWeight, this.x, this.y, this.width, this.height);

        const patchMaterial = this.patchMaterial;
        samplerMaterials.copy_sameItemSize(patchMaterial, 0, 0, this.x, this.y, patchMaterial.width, patchMaterial.height);

        this.updateTerrain();
    }

    revert(context) {
        /**
         *
         * @type {Terrain}
         */
        const terrain = this.terrain;

        const splat = terrain.splat;

        const samplerMaterials = new Sampler2D(splat.materialData, 4, splat.size.x, splat.size.y);


        //apply the patch
        splat.writeWeightData(this.__oldPatchWeight, this.x, this.y, this.width, this.height);

        const patchMaterial = this.__oldPatchMaterial;
        samplerMaterials.copy_sameItemSize(patchMaterial, 0, 0, this.x, this.y, patchMaterial.width, patchMaterial.height);


        this.updateTerrain();
    }

}

