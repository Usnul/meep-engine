import { lerp } from "../../../../../../core/math/MathUtils.js";

export class BlendStateMatrix {
    constructor(size) {
        this.weights = new Float32Array(size);
        this.timeScales = new Float32Array(size);
    }

    /**
     *
     * @param {BlendStateMatrix} other
     */
    copy(other) {

        const tW = this.weights;
        const oW = other.weights;

        const tTS = this.timeScales;
        const oTS = other.timeScales;

        const n = tW.length;

        for (let i = 0; i < n; i++) {
            tW[i] = oW[i];
            tTS[i] = oTS[i];
        }
    }

    /**
     * Set all values to 0
     */
    zero() {
        const tW = this.weights;
        const tTS = this.timeScales;

        const n = tW.length;

        for (let i = 0; i < n; i++) {
            tW[i] = 0;
            tTS[i] = 0;
        }
    }

    /**
     *
     * @param {BlendStateMatrix} other
     */
    add(other) {
        const tW = this.weights;
        const oW = other.weights;

        const tTS = this.timeScales;
        const oTS = other.timeScales;

        const n = tW.length;

        for (let i = 0; i < n; i++) {
            tW[i] += oW[i];
            tTS[i] += oTS[i];
        }
    }

    /**
     *
     * @param {number} v
     */
    divideScalar(v) {
        const tW = this.weights;
        const tTS = this.timeScales;

        const n = tW.length;

        for (let i = 0; i < n; i++) {
            tW[i] /= v;
            tTS[i] /= v;
        }
    }

    /**
     *
     * @param {BlendStateMatrix} result
     * @param {BlendStateMatrix} a
     * @param {BlendStateMatrix} b
     * @param {number} t
     */
    static lerp(result, a, b, t) {
        const rW = result.weights;
        const rTS = result.timeScales;

        const aW = a.weights;
        const aTS = a.timeScales;

        const bW = b.weights;
        const bTS = b.timeScales;

        const n = rW.length;

        for (let i = 0; i < n; i++) {
            rW[i] = lerp(aW[i], bW[i], t);
            rTS[i] = lerp(aTS[i], bTS[i], t);
        }
    }
}
