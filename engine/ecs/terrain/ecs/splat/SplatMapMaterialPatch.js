import { BitSet } from "../../../../../core/binary/BitSet.js";
import AABB2 from "../../../../../core/geom/AABB2.js";
import { max2, min2 } from "../../../../../core/math/MathUtils.js";
import { Sampler2D } from "../../../../graphics/texture/sampler/Sampler2D.js";

export class SplatMapMaterialPatch {
    /**
     *
     * @param {number} width
     * @param {number} height
     */
    constructor(width, height) {

        /**
         *
         * @type {number}
         */
        this.width = width;

        /**
         *
         * @type {number}
         */
        this.height = height;

        /**
         * Material that the patch is using
         * @type {number}
         */
        this.materialIndex = 0;

        /**
         * Which channel should the patch be assigned to
         * @note materials are mapped to one of RGBA channels in the material texture
         * @type {number}
         */
        this.channel = 0;

        /**
         * Mask representing coverage of the patch
         * @type {BitSet}
         */
        this.mask = new BitSet();

        /**
         *
         * @type {AABB2}
         */
        this.aabb = new AABB2();

        /**
         *
         * @type {Uint8Array}
         */
        this.weights = null;

        /**
         *
         * @type {number}
         */
        this.area = 0;

        /**
         *
         * @type {QuadTreeDatum}
         */
        this.quad = null;
    }

    /**
     *
     * @param {Sampler2D} materialSampler
     * @param {BitSet} occupancy
     * @returns {number}
     */
    writeByOccupancy(materialSampler, occupancy) {
        const itemSize = materialSampler.itemSize;


        const materialData = materialSampler.data;


        const o_bb = this.aabb;

        const x0 = o_bb.x0;
        const x1 = o_bb.x1;

        const y0 = o_bb.y0;
        const y1 = o_bb.y1;

        let failed = 0;

        for (let y = y0; y < y1; y++) {
            loop_x: for (let x = x0; x < x1; x++) {

                const masked = this.test(x, y);

                if (!masked) {
                    continue;
                }

                const index = y * this.width + x;
                const address = index * itemSize;


                let targetChannelAddress = 0;

                for (let i = 0; i < itemSize; i++) {
                    targetChannelAddress = address + i;

                    if (!occupancy.get(targetChannelAddress)) {

                        //found a free channel, lets write here

                        materialData[targetChannelAddress] = this.materialIndex;
                        occupancy.set(targetChannelAddress, true);

                        continue loop_x;

                    }

                }

                //couldn't find a free channel
                failed++;

            }
        }

        return failed;
    }

    /**
     *
     * @param {number} channel
     * @param {Sampler2D} materialSampler
     * @param {BitSet} occupancy
     */
    write(channel, materialSampler, occupancy) {
        const itemSize = materialSampler.itemSize;

        if (channel >= itemSize) {
            //channel index is too high, can't write
            return;
        }

        const materialData = materialSampler.data;

        const o_bb = this.aabb;

        const x0 = o_bb.x0;
        const x1 = o_bb.x1;

        const y0 = o_bb.y0;
        const y1 = o_bb.y1;

        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {

                const masked = this.test(x, y);

                if (!masked) {
                    continue;
                }

                const index = y * this.width + x;
                const address = index * itemSize;


                let targetChannelAddress = address + channel;


                materialData[targetChannelAddress] = this.materialIndex;
                occupancy.set(targetChannelAddress, true);

            }
        }

    }

    /**
     * Set weights to 0 when their overall contribution is below a given fraction
     * @param {number} fraction
     * @param {Sampler2D} materialSampler
     * @param {Sampler2D} weightSampler
     */
    clearWeightsBelowContribution(fraction, materialSampler, weightSampler) {
        throw new Error('NIY');
    }

    /**
     * @param {Uint8Array} weightData
     * @param {number} depth
     */
    computeMaxWeightContribution(weightData, depth) {


        const o_bb = this.aabb;

        const x0 = o_bb.x0;
        const x1 = o_bb.x1;

        const y0 = o_bb.y0;
        const y1 = o_bb.y1;

        const width = this.width;
        const height = this.height;

        const layerSize = width * height;

        let bestContribution = 0;

        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {

                const masked = this.test(x, y);

                if (!masked) {
                    continue;
                }

                let weight = 0;

                let totalWeight = 0;

                const texelIndex = y * width + x;

                //get other weights
                for (let i = 0; i < depth; i++) {

                    const address = i * layerSize + texelIndex;

                    const cW = weightData[address];

                    totalWeight += cW;


                    if (i === this.materialIndex) {
                        weight = cW;
                    }
                }

                const contribution = weight / totalWeight;

                bestContribution = max2(contribution, bestContribution);
            }
        }

        return bestContribution;
    }

    /**
     *
     * @param {Uint8Array} weightData
     */
    readWeights(weightData) {


        const o_bb = this.aabb;

        const x0 = o_bb.x0;
        const x1 = o_bb.x1;

        const y0 = o_bb.y0;
        const y1 = o_bb.y1;

        const w = x1 - x0;
        const h = y1 - y0;

        this.weights = new Uint8Array((w) * (h));


        const width = this.width;

        const layerByteSize = width * this.height;

        const layerAddress = layerByteSize * this.materialIndex;

        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {

                const masked = this.test(x, y);

                if (!masked) {
                    continue;
                }


                const index = y * width + x;
                const address = index + layerAddress;


                //read weight

                const weight = weightData[address];

                const _y = y - y0;
                const _x = x - x0;

                const targetAddress = _y * w + _x;

                this.weights[targetAddress] = weight;

            }
        }
    }

    /**
     *
     * @param {number} channel
     * @param {Sampler2D} weightSampler
     * @param {Sampler2D} materialSampler
     * @returns {boolean}
     */
    writeReplace(channel, weightSampler, materialSampler) {
        const itemSize = materialSampler.itemSize;

        if (channel >= itemSize) {
            //channel index is too high, can't write
            return false;
        }

        const materialData = materialSampler.data;
        const weightData = weightSampler.data;

        const o_bb = this.aabb;

        const x0 = o_bb.x0;
        const x1 = o_bb.x1;

        const y0 = o_bb.y0;
        const y1 = o_bb.y1;

        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {

                const masked = this.test(x, y);

                if (!masked) {
                    continue;
                }

                const index = y * this.width + x;
                const address = index * itemSize;

                //find original channel
                for (let c = 0; c < itemSize; c++) {

                    const sourceChannelAddress = address + c;

                    if (materialData[sourceChannelAddress] === this.materialIndex) {
                        //found the original channel

                        if (c === channel) {
                            //already in the right channel
                            break;
                        }

                        const targetChannelAddress = address + channel;

                        //read target values
                        const targetWeight = weightData[targetChannelAddress];
                        const targetMaterial = materialData[targetChannelAddress];

                        //read weight
                        const sourceWeight = weightData[sourceChannelAddress];

                        //perform swap
                        weightData[targetChannelAddress] = sourceWeight;
                        weightData[sourceChannelAddress] = targetWeight;

                        materialData[targetChannelAddress] = this.materialIndex;
                        materialData[sourceChannelAddress] = targetMaterial;

                    }

                }

            }
        }
    }

    /**
     *
     * @param {SplatMapMaterialPatch} other
     */
    add(other) {
        if (this.materialIndex !== other.materialIndex) {
            throw new Error(`Material index does not match, expected '${this.materialIndex}', instead got '${other.materialIndex}'`);
        }

        const o_bb = other.aabb;

        const t_bb = this.aabb;

        const nBB_x0 = min2(t_bb.x0, o_bb.x0);
        const nBB_x1 = max2(t_bb.x1, o_bb.x1);

        const nBB_y0 = min2(t_bb.y0, o_bb.y0);
        const nBB_y1 = max2(t_bb.y1, o_bb.y1);

        //resize weights
        if (this.weights !== null) {
            const nW = nBB_x1 - nBB_x0;
            const nH = nBB_y1 - nBB_y0;

            const newWeights = new Uint8Array(nW * nH);

            const t_Source = new Sampler2D(this.weights, 1, t_bb.getWidth(), t_bb.getHeight());
            const o_Source = new Sampler2D(other.weights, 1, o_bb.getWidth(), o_bb.getHeight());

            const target = new Sampler2D(newWeights, 1, nW, nH);

            //copy both sources to the new weights target
            target.copy_sameItemSize(t_Source, 0, 0, nBB_x0 - t_bb.x0, nBB_y0 - t_bb.y0, t_bb.getHeight(), t_bb.getHeight());
            target.copy_sameItemSize(o_Source, 0, 0, nBB_x0 - o_bb.x0, nBB_y0 - o_bb.y0, o_bb.getHeight(), o_bb.getHeight());

            this.weights = newWeights;
        }

        t_bb.set(nBB_x0, nBB_y0, nBB_x1, nBB_y1);

        const y0 = o_bb.y0;
        const y1 = o_bb.y1;
        const x0 = o_bb.x0;
        const x1 = o_bb.x1;

        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {

                const address = y * this.width + x;

                const f = other.mask.get(address);

                if (f && !this.mask.get(address)) {

                    this.mask.set(address, true);
                    this.area++;

                }

            }
        }

        if (this.quad !== null) {
            this.quad.resize(t_bb.x0, t_bb.y0, t_bb.x1, t_bb.y1);
        }
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    test(x, y) {
        return this.mask.get(this.width * y + x);
    }

}
