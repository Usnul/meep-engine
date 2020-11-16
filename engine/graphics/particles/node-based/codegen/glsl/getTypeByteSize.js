import { ParticleDataTypes } from "../../nodes/ParticleDataTypes.js";

/**
 *
 * @param {ParticleDataTypes} type
 * @returns {number}
 */
export function getTypeByteSize(type) {
    switch (type) {
        case ParticleDataTypes.Float:
            return 4;
        case ParticleDataTypes.Vector2:
            return 8;
        case ParticleDataTypes.Vector3:
            return 12;
        case ParticleDataTypes.Vector4:
            return 16;
        default:
            throw  new Error(`Unsupported data type '${type}'`);
    }
}
