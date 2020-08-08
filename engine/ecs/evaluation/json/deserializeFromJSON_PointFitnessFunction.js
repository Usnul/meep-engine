import { PointFitnessConstant } from "../PointFitnessConstant.js";
import { PointFitnessMultiply } from "../arithmetic/PointFitnessMultiply.js";
import { PointFitnessAdd } from "../arithmetic/PointFitnessAdd.js";
import { ReadTerrainLayerWeightPointFitness } from "../world/ReadTerrainLayerWeightPointFitness.js";
import { PointFitnessGaussianBlur } from "../complex/PointFitnessGaussianBlur.js";


/**
 *
 * @param {PointFitnessBinary} result
 * @param {{left, right}} json
 */
function deserializeBinary(result, json) {

    const left = deserializeFromJSON_PointFitnessFunction(json.left);
    const right = deserializeFromJSON_PointFitnessFunction(json.right);

    result.left = left;
    result.right = right;
}

const processors = {
    [PointFitnessConstant.prototype.type]: function ({ value }) {
        return PointFitnessConstant.from(value);
    },
    [PointFitnessMultiply.prototype.type]: function (json) {
        const r = new PointFitnessMultiply();

        deserializeBinary(r, json);

        return r;
    },
    [PointFitnessAdd.prototype.type]: function (json) {
        const r = new PointFitnessAdd();

        deserializeBinary(r, json);

        return r;
    },
    [ReadTerrainLayerWeightPointFitness.prototype.type]: function (json) {

        return ReadTerrainLayerWeightPointFitness.from(json.layer);

    },
    [PointFitnessGaussianBlur.prototype.type]: function ({ source, size_x = 0, size_y = 0, size_z = 0, quality }) {
        return PointFitnessGaussianBlur.from(
            deserializeFromJSON_PointFitnessFunction(source),
            size_x,
            size_y,
            size_z,
            quality
        );
    }
};

/**
 *
 * @param {*} json
 * @returns {PointFitnessFunction}
 */
export function deserializeFromJSON_PointFitnessFunction(json) {
    const type = json.type;


    const processor = processors[type];

    return processor(json);
}
