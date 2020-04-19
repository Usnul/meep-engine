import { assert } from "../../assert.js";
import { computeHashFloat } from "../../math/MathUtils.js";
import { CombatUnitBonusSourceType } from "../../../../model/game/logic/combat/CombatUnitBonusSourceType.js";


/**
 * Linear polynomial modifier in form of : a*x + b
 * @example if x is 5, and modifier a=3 and b=7 then we get 3*5 + 7 = 23
 */
class LinearModifier {
    /**
     * @param {number} [a=1] gradient (slope)
     * @param {number} [b=0] constant (intercept)
     * @constructor
     */
    constructor(a = 1, b = 0) {
        assert.typeOf(a, 'number', 'a');
        assert.typeOf(b, 'number', 'b');

        /**
         * gradient (slope)
         * @readonly
         * @type {number}
         */
        this.a = a;

        /**
         * constant (intercept)
         * @readonly
         * @type {number}
         */
        this.b = b;

        /**
         *
         * @type {CombatUnitBonusSourceType|number}
         */
        this.source = CombatUnitBonusSourceType.Unknown;

        /**
         * Whenever this modifier is grated by another persistent effect
         * @type {boolean}
         */
        this.transient = false;
    }

    /**
     *
     * @param {LinearModifier} other
     */
    copy(other) {
        this.a = other.a;
        this.b = other.b;
        this.source = other.source;
        this.transient = other.transient;
    }

    /**
     *
     * @return {LinearModifier}
     */
    clone() {
        const r = new LinearModifier();

        r.copy(this);

        return r;
    }

    /**
     * Combines other modifier onto this one.
     * @param {LinearModifier} other
     */
    add(other) {
        this.a += (other.a - 1);
        this.b += other.b;
    }

    /**
     *
     * @param {LinearModifier} other
     * @returns {boolean}
     */
    equals(other) {
        return this.a === other.a
            && this.b === other.b
            && this.source === other.source
            && this.transient === other.transient;
    }

    /**
     *
     * @return {number}
     */
    hash() {
        return computeHashFloat(this.a)
            ^ computeHashFloat(this.b)
            ^ this.source
            ^ (this.transient ? 0 : 1);
    }

    fromJSON({
                 a = 1,
                 b = 0,
                 source = CombatUnitBonusSourceType.Unknown,
                 transient = false
             }) {
        this.a = a;
        this.b = b;
        this.source = source;
        this.transient = transient;
    }
}

export default LinearModifier;
