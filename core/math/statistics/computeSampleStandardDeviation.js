import { computeStatisticalMean } from "./computeStatisticalMean.js";

/**
 *
 * @param {number[]} sample
 * @returns {number}
 */
export function computeSampleStandardDeviation(sample) {
    //compute sample mean
    const mean = computeStatisticalMean(sample);

    const N = sample.length;

    let SUM = 0;
    for (let i = 0; i < N; i++) {
        const x = sample[i];

        const delta = x - mean;

        const delta2 = delta * delta;

        SUM += delta2;
    }

    const variance = SUM / (N - 1);

    return Math.sqrt(variance);
}
