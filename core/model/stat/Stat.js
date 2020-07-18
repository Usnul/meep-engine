import List from "../../collection/list/List.js";
import Vector1 from "../../geom/Vector1.js";
import LinearModifier from "./LinearModifier.js";
import { assert } from "../../assert.js";
import { EPSILON, epsilonEquals, max2 } from "../../math/MathUtils.js";
import { chainFunctions } from "../../function/Functions.js";

/**
 * @param {number} value
 * @constructor
 */
function Stat(value) {
    assert.notEqual(value, undefined, "Value must be defined");
    assert.equal(typeof value, "number", "Value must be a number");

    /**
     * Unique identifier of a stat, such a health, armor etc.
     * @type {number}
     */
    this.id = 0;

    this.base = new Vector1(value);

    /**
     * @private
     * @readonly
     * @type {List<LinearModifier>}
     */
    this.modifiers = new List();

    this.value = new Vector1(value);

    this.base.onChanged.add(this.updateValue, this);
    this.modifiers.on.added.add(this.updateValue, this);
    this.modifiers.on.removed.add(this.updateValue, this);
}

Stat.Process = {
    /**
     * @param {number} v
     * @return {number}
     */
    ROUND_DOWN: function (v) {
        return v | 0;
    },
    NONE: function (v) {
        return v;
    },
    /**
     * Clamp lowest value forcing the result to always be >= value
     * @param {number} value
     * @returns {function(number): number}
     */
    clampMin: function (value) {
        return function max(v) {
            return max2(value, v);
        }
    },
    chain: chainFunctions
};

Stat.prototype = Object.create(Number.prototype);

/**
 * Remove all modifiers from the stat
 */
Stat.prototype.resetModifiers = function () {
    this.modifiers.reset();
};

/**
 *
 * @returns {number}
 */
Stat.prototype.valueOf = function () {
    return this.getValue();
};

/**
 *
 * @returns {string}
 */
Stat.prototype.toString = function () {
    return String(this.getValue());
};

/**
 *
 * @type {function(number): number}
 */
Stat.prototype.postprocess = Stat.Process.NONE;

Object.defineProperties(Stat.prototype, {
    onChanged: {
        /**
         *
         * @returns {Signal}
         */
        get() {
            return this.value.onChanged;
        }
    }
});

/**
 * @readonly
 * @type {boolean}
 */
Stat.prototype.isStat = true;

/**
 *
 * @returns {number}
 */
Stat.prototype.getValue = function () {
    return this.value.x;
};

Stat.prototype.updateValue = function () {
    const x = this.base.x;

    const modifiers = this.modifiers;

    const newValue = applyModifiers(x, modifiers);

    const finalValue = this.postprocess(newValue);

    this.value.set(finalValue);
};

/**
 *
 * @param {number} input
 * @param {List<LinearModifier>}modifiers
 * @returns {number}
 */
function applyModifiers(input, modifiers) {
    let a = 1;
    let b = 0;

    let i;
    const l = modifiers.length;

    const modifiersData = modifiers.data;

    // Combine all modifiers
    for (i = 0; i < l; i++) {
        const m = modifiersData[i];

        a += (m.a - 1);
        b += m.b;
    }

    return input * a + b;
}

/**
 * NOTE: do not modify result
 * @return {LinearModifier[]}
 */
Stat.prototype.getModifiers = function () {
    return this.modifiers.data;
};

/**
 *
 * @param {LinearModifier} mod
 */
Stat.prototype.addModifier = function (mod) {
    this.modifiers.add(mod);
};

/**
 *
 * @param {LinearModifier} mod
 * @returns {boolean}
 */
Stat.prototype.removeModifier = function (mod) {
    return this.modifiers.removeOneOf(mod);
};

Stat.applyModifiers = applyModifiers;

/**
 *
 * @param {Stat} other
 * @returns {boolean}
 */
Stat.prototype.equals = function (other) {

    const v0 = this.getValue();
    const b1 = other.getValue();

    // use small tolerance to allow for numeric error resulting from the order in which stat modifiers are combined
    return epsilonEquals(v0, b1, EPSILON);
};

/**
 *
 * @param {Stat} other
 */
Stat.prototype.copy = function (other) {
    this.base.copy(other.base);
    this.modifiers.copy(other.modifiers);
};

/**
 * Copy base value from another stat
 * @param {Stat} other
 */
Stat.prototype.copyBase = function (other) {
    this.base.copy(other.base);
};

/**
 * @param {Stat} other
 */
Stat.prototype.addNonTransientModifiersFromStat = function (other) {
    const modifiers = other.modifiers.data;

    const n = modifiers.length;

    for (let i = 0; i < n; i++) {
        const linearModifier = modifiers[i];

        if (linearModifier.transient) {
            continue;
        }

        //make a copy
        const clone = linearModifier.clone();

        this.addModifier(clone);
    }
};


Stat.prototype.toJSON = function () {
    return {
        base: this.base.toJSON(),
        modifiers: this.modifiers.toJSON()
    };
};

Stat.prototype.fromJSON = function (json) {
    this.base.fromJSON(json.base);
    this.modifiers.fromJSON(json.modifiers, LinearModifier);
};

export default Stat;
