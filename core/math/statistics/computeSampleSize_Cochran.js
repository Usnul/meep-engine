/**
 * Estimate ideal sample size given desired confidence level, error and population proportion with attribute in question.
 *
 * Implementation of Cochran's Sample Size formula
 *
 * Z values for confidence levels:
 *  50%   |  0.67449
 *  75%   |  1.15035
 *  90%   |  1.64485
 *  95%   |  1.95996
 *  97%   |  2.17009
 *  99%   |  2.57583
 *  99.9% |  3.29053
 *
 * @param z Standard distribution value. # of standard deviations. See statistical tables
 * @param p Fraction of the population with attribute in question. For example if we want to estimate what time people have breakfast and we know that only 30% of people have have breakfast overall, p would be 0.3
 * @param e Error tolerance, 0.05 represents 5% error tolerance
 * @returns {number} Sample size
 */
export function computeSampleSize_Cochran(z, p, e) {
    const q = (1 - p);

    const e2 = e * e;

    const z2 = z * z;

    return (z2 * p * q) / e2;
}
