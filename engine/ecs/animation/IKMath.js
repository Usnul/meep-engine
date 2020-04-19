/**
 *
 * @param {Vector3} result
 * @param {number} distance
 * @param {number} sourceX
 * @param {number} sourceY
 * @param {number} sourceZ
 * @param {number} directionX
 * @param {number} directionY
 * @param {number} directionZ
 */
export function v3_computeOffsetVector(result, distance, sourceX, sourceY, sourceZ, directionX, directionY, directionZ) {
    if (distance === 0) {
        result.set(sourceX, sourceY, sourceZ);
        return;
    }

    //scale direction to have length equal to distance

    const directionLength = Math.sqrt(directionX * directionX + directionY * directionY + directionZ * directionZ);

    const m = distance / directionLength;

    const x = sourceX + directionX * m;
    const y = sourceY + directionY * m;
    const z = sourceZ + directionZ * m;

    result.set(x, y, z);
}
