import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";
import { computeStringHash } from "../../../core/primitives/strings/StringUtils.js";
import { NumericInterval } from "../../../core/math/interval/NumericInterval.js";
import { computeHashFloat, computeHashIntegerArray } from "../../../core/math/MathUtils.js";

class IKConstraint {
    constructor() {

        /**
         * End bone that is going to be placed
         * @type {String}
         */
        this.effector = "";

        /**
         * How far should effector be from the contact, positive values result in effector not reaching the surface, and negative result in penetration
         * @example For a foot effector this would be distance above the ground
         * @type {number}
         */
        this.offset = 0;

        /**
         * Positive distance from the surface at which IK starts to take effect, low value represents full effect and high value represents where the influence begins
         * @type {NumericInterval}
         */
        this.distance = new NumericInterval(0, 0);

        /**
         *
         * @type {number}
         */
        this.strength = 1;

        /**
         *
         * @type {number}
         */
        this.limit = Math.PI;

        /**
         * Solver to be used for this constraint
         * @type {string}
         */
        this.solver = "2BIK";
    }

    /**
     *
     * @param {IKConstraint} other
     */
    copy(other) {
        this.effector = other.effector;
        this.offset = other.offset;
        this.distance.copy(other.distance);
        this.strength = other.strength;
        this.limit = other.limit;
        this.solver = other.solver;
    }

    clone() {
        const r = new IKConstraint();

        r.copy(this);

        return r;
    }

    /**
     *
     * @param {IKConstraint} other
     * @returns {boolean}
     */
    equals(other) {
        return this.effector === other.effector
            && this.offset === other.offset
            && this.distance.equals(other.distance)
            && this.strength === other.strength
            && this.limit === other.limit
            && this.solver === other.solver;
    }

    /**
     *
     * @return {number}
     */
    hash() {
        return computeHashIntegerArray(
            computeStringHash(this.effector),
            computeHashFloat(this.offset),
            this.distance.hash(),
            computeHashFloat(this.strength),
            computeHashFloat(this.limit),
            computeStringHash(this.solver)
        );
    }
}


export class InverseKinematics {
    constructor() {
        /**
         *
         * @type {IKConstraint[]}
         */
        this.constraints = [];
    }

    /**
     *
     * @param {InverseKinematics} other
     */
    copy(other) {
        this.constraints.splice(0, this.constraints.length);

        const ikConstraints = other.constraints;
        const n = ikConstraints.length;

        for (let i = 0; i < n; i++) {
            const constraint = ikConstraints[i];

            const constraintClone = constraint.clone();

            this.constraints.push(constraintClone);
        }
    }

    clone() {
        const r = new InverseKinematics();

        r.copy(this);

        return r;
    }

    /**
     *
     * @param {String} effector
     * @param {number} offset
     * @param {number} distanceMin
     * @param {number} distanceMax
     * @param {number} strength
     * @param {number} limit
     * @param {String} solver
     */
    add({ effector, offset = 0, distanceMin = 0, distanceMax = 0.1, strength = 1, limit = Math.PI * 0.9, solver = "2BIK" }) {
        const c = new IKConstraint();

        c.effector = effector;
        c.offset = offset;
        c.strength = strength;
        c.distance.set(distanceMin, distanceMax);
        c.solver = solver;
        c.limit = limit;

        this.constraints.push(c);
    }

    /**
     *
     * @param {InverseKinematics} other
     * @returns {boolean}
     */
    equals(other) {
        const cs0 = this.constraints;
        const cs1 = other.constraints;

        const n0 = cs0.length;
        const n1 = cs1.length;

        if (n0 !== n1) {
            return false;
        }

        for (let i = 0; i < n0; i++) {
            const c0 = cs0[i];
            const c1 = cs1[i];
            if (!c0.equals(c1)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @returns {number}
     */
    hash() {

        let hash = 0;
        const constraints = this.constraints;
        const length = constraints.length;

        for (let i = 0; i < length; i++) {
            const constraint = constraints[i];
            const singleValue = constraint.hash();
            hash = ((hash << 5) - hash) + singleValue;
            hash |= 0; // Convert to 32bit integer
        }

        return hash;
    }
}

InverseKinematics.typeName = "InverseKinematics";

export class InverseKinematicsSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = InverseKinematics;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {InverseKinematics} value
     */
    serialize(buffer, value) {
        const constraints = value.constraints;
        const n = constraints.length;
        buffer.writeUintVar(n);

        for (let i = 0; i < n; i++) {
            const constraint = constraints[i];

            buffer.writeUTF8String(constraint.effector);

            buffer.writeFloat32(constraint.offset);
            buffer.writeFloat32(constraint.strength);
            buffer.writeFloat32(constraint.limit);

            buffer.writeFloat32(constraint.distance.min);
            buffer.writeFloat32(constraint.distance.max);

            buffer.writeUTF8String(constraint.solver);
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {InverseKinematics} value
     */
    deserialize(buffer, value) {
        const n = buffer.readUintVar();

        const constraints = [];

        for (let i = 0; i < n; i++) {
            const effector = buffer.readUTF8String();

            const offset = buffer.readFloat32();
            const strength = buffer.readFloat32();
            const limit = buffer.readFloat32();

            const distanceMin = buffer.readFloat32();
            const distanceMax = buffer.readFloat32();

            const solver = buffer.readUTF8String();

            const ikConstraint = new IKConstraint();

            ikConstraint.effector = effector;
            ikConstraint.offset = offset;
            ikConstraint.strength = strength;
            ikConstraint.limit = limit;
            ikConstraint.distance.set(distanceMin, distanceMax);
            ikConstraint.solver = solver;

            constraints.push(ikConstraint);
        }

        value.constraints = constraints;
    }
}
