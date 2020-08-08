import { assert } from "../../../../core/assert.js";
import { PointFitnessConstant } from "../PointFitnessConstant.js";
import { PointFitnessMultiply } from "../arithmetic/PointFitnessMultiply.js";
import { PointFitnessAdd } from "../arithmetic/PointFitnessAdd.js";
import { ReadTerrainLayerWeightPointFitness } from "../world/ReadTerrainLayerWeightPointFitness.js";
import { PointFitnessGaussianBlur } from "../complex/PointFitnessGaussianBlur.js";

/**
 *
 * @param {PointFitnessBinary} value
 * @return {{left: *, right: *, type: string}}
 */
function serializeBinary(value) {
    return {
        type: value.type,
        left: serializeToJSON_PointFitnessFunction(value.left),
        right: serializeToJSON_PointFitnessFunction(value.right)
    };
}

const serializers = {
    [PointFitnessConstant.prototype.type]:
        /**
         *
         * @param {PointFitnessConstant} value
         * @return {{type: string, value: number}}
         */
        function (value) {
            return {
                type: PointFitnessConstant.prototype.type,
                value: value.value
            };
        },
    [PointFitnessMultiply.prototype.type]: serializeBinary,
    [PointFitnessAdd.prototype.type]: serializeBinary,

    [ReadTerrainLayerWeightPointFitness.prototype.type]:
        /**
         *
         * @param {ReadTerrainLayerWeightPointFitness} value
         * @return {{type: string, layer: number}}
         */
        function (value) {
            return {
                type: value.type,
                layer: value.layer
            }
        },
    [PointFitnessGaussianBlur.prototype.type]:
        /**
         *
         * @param {PointFitnessGaussianBlur} value
         */
        function (value) {
            return {
                type: value.type,
                source: serializeToJSON_PointFitnessFunction(value.source),
                size_x: value.size_x,
                size_y: value.size_y,
                size_z: value.size_z,
                quality: value.quality,
            }
        }
};

/**
 *
 * @param {PointFitnessFunction} f
 * @returns {*}
 */
export function serializeToJSON_PointFitnessFunction(f) {
    assert.equal(f.isPointFitnessFunction, true, 'f.isPointFitnessFunction !== true');

    const type = f.type;

    const typeofTypeValue = typeof type;

    if (typeofTypeValue !== "string") {
        throw new Error(`function.type is expected to be a string, instead was '${typeofTypeValue}'`);
    }

    const serializer = serializers[type];

    if (serializer === undefined) {
        throw  new Error(`No serializer for type '${type}'`);
    }

    return serializer(f);
}
