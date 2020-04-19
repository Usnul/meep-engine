/**
 * Created by Alex on 14/07/2017.
 */

import SampleTraverser from '../../../graphics/texture/sampler/SampleTraverser.js';
import { seededRandom } from '../../../../core/math/MathUtils.js';
import Vector2 from '../../../../core/geom/Vector2.js';


/**
 *
 * @enum
 */
export const TerrainType = {
    Grass: 0,
    Sand: 1,
    Rock: 2,
    Dirt: 3
};

/**
 *
 * @param {TerrainType} type
 * @param {number} value
 * @constructor
 * @property {TerrainType} type
 * @property {number} value
 */
function TerrainFeature(type, value) {
    this.type = type;
    this.value = value;
}

const index2typeMap = [
    TerrainType.Rock,
    TerrainType.Grass,
    TerrainType.Sand,
    TerrainType.Dirt
];


/**
 *
 * @param {Terrain} terrain
 * @param {AABB2} mask grid mask along the terrain
 * @returns {Array.<TerrainFeature>}
 */
function classify(terrain, mask) {

    const maskCenter = new Vector2(mask.x0 + mask.x1, mask.y0 + mask.y1).multiplyScalar(0.5).divide(terrain.size);
    const maskSize = new Vector2(mask.getWidth(), mask.getHeight()).divide(terrain.size).length();

    const maxSamples = 50;

    const hash = maskCenter.hashCode();

    /**
     *
     * @type {SplatMapping}
     */
    const splat = terrain.splat;

    /**
     *
     * @param {number} index
     * @returns {TerrainFeature}
     */
    function splat2feature(index) {
        const type = index2typeMap[index];

        let weight = 0;
        let valueSum = 0;

        const random = seededRandom(hash);

        /**
         *
         * @param {Number} u
         * @param {Number} v
         * @returns {number}
         */
        function sampleVisitor(u, v) {
             const sampleValue = splat.sampleWeight(u, v,index);

            const delta = maskCenter._distanceTo(u, v);

            const influence = (maskSize - delta) / maskSize;

            valueSum += sampleValue * (influence * influence);
            weight += influence;

            return 0;
        }

        SampleTraverser.traverseMask(random, mask, terrain.size, maxSamples, sampleVisitor);

        return new TerrainFeature(type, valueSum / weight);
    }


    if (splat === null) {
        console.error("it appears splats are not loaded. Classification of terrain failed.");
    }

    /**
     *
     * @type {TerrainFeature[]}
     */
    const features = [];

    for (let i = 0; i < 4; i++) {
        const terrainFeature = splat2feature(i);

        features.push(terrainFeature);
    }

    return features;
}

const TerrainClassifier = {
    classify,
    TerrainFeature
};

export default TerrainClassifier;
