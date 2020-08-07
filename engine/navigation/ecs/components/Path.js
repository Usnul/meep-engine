/**
 * Created by Alex on 17/10/2016.
 */


import Vector3 from '../../../../core/geom/Vector3.js';

import { CatmullRomCurve3 } from 'three';
import { RingBuffer } from "../../../../core/collection/RingBuffer.js";
import { clamp, lerp, max2, min2 } from "../../../../core/math/MathUtils.js";
import { BinaryClassSerializationAdapter } from "../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";
import { BinaryClassUpgrader } from "../../../ecs/storage/binary/BinaryClassUpgrader.js";
import { assert } from "../../../../core/assert.js";

/**
 *
 * @enum {number}
 */
export const InterpolationOrder = {
    Zero: 0,
    First: 1,
    Second: 2
};

const v3 = new Vector3();

class Path {
    constructor() {
        /**
         * @private
         * @type {Vector3[]}
         */
        this.points = [];

        /**
         *
         * @type {number}
         */
        this.markerOffset = 0;
        /**
         *
         * @type {number}
         */
        this.markerIndex = 0;
        /**
         *
         * @type {number}
         */
        this.markerDistanceToNext = 0;

        /**
         *
         * @type {InterpolationOrder|number}
         */
        this.interpolation = InterpolationOrder.First;
    }

    terminateAtCurrentPosition() {
        const endIndex = this.markerIndex + 1;

        this.getCurrentPosition(v3);
        this.setPosition(endIndex, v3.x, v3.y, v3.z);

        this.setPointCount(endIndex);

        this.markerOffset = 0;
        this.markerDistanceToNext = 0;
    }

    /**
     *
     * @return {boolean}
     */
    isEmpty() {
        return this.points.length === 0;
    }

    reset() {
        this.markerOffset = 0;
        this.markerIndex = 0;
    }

    clear() {
        this.points = [];
    }

    /**
     *
     * @return {number}
     */
    getPointCount() {
        return this.points.length;
    }

    /**
     *
     * @param {number} v
     */
    setPointCount(v) {
        assert.ok(Number.isInteger(v), `value must be an integer, instead was ${v}`);

        const oldLength = this.points.length;
        const deficit = v - oldLength;

        if (deficit < 0) {
            //drop some
            this.points.splice(v, oldLength - v)
        } else if (deficit > 0) {
            //add some

            for (let i = 0; i < deficit; i++) {
                this.points.push(new Vector3());
            }

        }
    }

    /**
     *
     * @param {number} index
     */
    removePoint(index) {
        this.points.splice(index, 1);
    }

    /**
     *
     * @param {number} index
     */
    insertPoint(index) {
        this.points.splice(index, 0, new Vector3());
    }

    /**
     *
     * @param {number} index
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setPosition(index, x, y, z) {
        const p = this.points[index];

        p.set(x, y, z);
    }

    /**
     *
     * @param {number} index
     * @param {Vector3} result
     */
    getPosition(index, result) {
        const p = this.points[index];

        result.copy(p);
    }

    /**
     *
     * @param {number} index
     * @param {Vector3} v
     */
    setPositionFromVector(index, v) {
        assert.ok(index < this.getPointCount(), `point ${index} does not exist. Path length=${this.getPointCount()}`);

        this.setPosition(index, v.x, v.y, v.z);
    }

    /**
     *
     * @param {Vector3[]} array
     */
    setPositionsFromVectorArray(array) {
        const l = array.length;

        this.setPointCount(l);

        for (let i = 0; i < l; i++) {
            const v3 = array[i];

            this.setPositionFromVector(i, v3);
        }
    }


    /**
     *
     * @param {Path} other
     */
    copy(other) {
        this.points = other.points.slice();
        this.markerOffset = other.markerOffset;
        this.markerIndex = other.markerIndex;
        this.markerDistanceToNext = other.markerDistanceToNext;
        this.interpolation = other.interpolation;
    }

    /**
     *
     * @return {Path}
     */
    clone() {
        const r = new Path();

        r.copy(this);

        return r;
    }

    /**
     *
     * @returns {Vector3|undefined}
     */
    last() {
        return this.points[this.points.length - 1];
    }

    /**
     *
     * @param {number} distanceDelta
     * @returns {number} unused distance
     */
    move(distanceDelta) {

        if (!this.isComplete()) {

            distanceDelta += this.markerOffset;

            this.markerOffset = 0;

            let marker = this.points[this.markerIndex];

            while (distanceDelta > 0) {
                const next = this.points[this.markerIndex + 1];
                const distance = marker.distanceTo(next);
                this.markerDistanceToNext = distance;

                if (distanceDelta < distance) {
                    this.markerOffset = distanceDelta;
                    return 0;
                } else {
                    this.markerIndex++;
                    distanceDelta -= distance;
                }

                marker = next;

                if (this.markerIndex >= this.points.length - 1) {
                    //reached the end of the path
                    this.markerOffset = 0;
                    this.markerIndex = this.points.length - 1;
                    break;
                }

            }
        }

        return distanceDelta;
    }

    /**
     *
     * @returns {boolean}
     */
    isComplete() {
        const lastIndex = this.points.length - 1;

        return this.markerIndex >= lastIndex;
    }

    /**
     *
     * @param {Vector3} result
     */
    getCurrentPosition(result) {
        switch (this.interpolation) {
            case InterpolationOrder.Zero:
                return this.computePositionOrder0(result);
            case InterpolationOrder.First:
                return this.computePositionOrder1(result);
            case InterpolationOrder.Second:
                return this.computePositionOrder2(result);
            default:
                throw new Error(`Unsupported sampling type ${this.interpolation}`);
        }
    }

    /**
     *
     * @param {Vector3} result
     * @return {boolean}
     */
    computePositionOrder0(result) {
        const p = this.previousPoint();

        if (p !== undefined) {
            result.copy(p);
            return true;
        }

        return false;
    }

    /**
     *
     * @param {Vector3} result
     * @return {boolean}
     */
    computePositionOrder1(result) {

        const p0 = this.previousPoint();
        const p1 = this.nextPoint();

        if (p0 === undefined) {
            return false;
        }

        const d = this.markerOffset;

        if (d === 0) {
            result.copy(p0);
            return true;
        }

        if (p1 === undefined) {
            return false;
        }

        const l = this.markerDistanceToNext;

        if (d === l) {
            result.copy(p1);
            return true;
        }

        const nd = d / l;

        result.lerpVectors(p0, p1, nd);

        return true;
    }

    /**
     *
     * @param {Vector3} result
     * @return {boolean}
     */
    computePositionOrder2(result) {

        const i = this.markerIndex;

        const iMax = this.points.length - 1;

        if (iMax < 0) {
            //no points to sample
            return false;
        }

        //get 2 below and 2 above
        let p0, p1, p2, p3;

        const pi0 = max2(i - 1, 0);
        const pi1 = i;
        const pi2 = min2(i + 1, iMax);
        const pi3 = min2(i + 2, iMax);

        p0 = this.points[pi0];
        p1 = this.points[pi1];
        p2 = this.points[pi2];
        p3 = this.points[pi3];

        //compute delta vectors between points
        const ax = p1.x - p0.x;
        const ay = p1.y - p0.y;
        const az = p1.z - p0.z;

        const cx = p3.x - p2.x;
        const cy = p3.y - p2.y;
        const cz = p3.z - p2.z;

        const d = this.markerOffset;
        const l = this.markerDistanceToNext;

        let nd;

        if (l === 0) {
            nd = 0;
        } else {
            nd = d / l;
        }

        //interpolate slope
        const ind = 1 - nd;

        const x = lerp(p1.x + ax * nd, p2.x - cx * ind, nd);
        const y = lerp(p1.y + ay * nd, p2.y - cy * ind, nd);
        const z = lerp(p1.z + az * nd, p2.z - cz * ind, nd);

        result.set(x, y, z);

        return true;
    }

    /**
     *
     * @returns {Vector3}
     */
    previousPoint() {
        return this.points[this.markerIndex];
    }

    /**
     *
     * @returns {Vector3}
     */
    nextPoint() {
        return this.points[this.markerIndex + 1];
    }

    toJSON() {
        return {
            points: this.points.map(function (p) {
                return p.toJSON();
            })
        };
    }

    fromJSON({ points = [] }) {
        this.points = points.map(function (p) {
            const vector3 = new Vector3();
            vector3.fromJSON(p);
            return vector3;
        });
    }

    computeLength() {
        let r = 0;

        const n = this.points.length;

        let p0 = this.points[0];

        for (let i = 1; i < n; i++) {
            const p1 = this.points[i];

            const d = p0.distanceTo(p1);

            p0 = p1;

            r += d;
        }

        return r;
    }

    /**
     *
     * @param {Vector3[]} points
     * @param {number} samples
     * @returns {Vector3[]}
     */
    static smoothPath(points, samples) {

        const curve = new CatmullRomCurve3(points);
        const points2 = curve.getPoints(samples);

        //Convert to engine vector format
        const result = points2.map(function (p) {
            return new Vector3(p.x, p.y, p.z);
        });

        return result;
    }
}


Path.typeName = "Path";

export default Path;

/**
 *
 * @param {Vector3[]} points
 * @param {number} samples
 * @param {Vector3[]} result
 */
function smoothPathY(result, points, samples) {
    const buffer = new RingBuffer(samples);


    const l = points.length;

    let j = 0;
    let i = samples >> 1;


    //fill ahead
    for (j = 0; i < samples; i++, j++) {
        const pIndex = clamp(j, 0, l - 1);

        buffer.push(points[pIndex].y);
    }

    function getAverageWindowValue() {
        let result = 0;

        buffer.forEach(v => {
            result += v;
        });

        return result / buffer.count;
    }


    for (i = 0; i < l; i++, j++) {
        //compute smoothed value
        const v = points[i];
        const y = getAverageWindowValue();


        if (j < l) {
            //read sample into the window
            const sample = points[clamp(j, 0, l - 1)];

            const sampleY = sample.y;
            buffer.push(sampleY);

        } else {
            buffer.shift();
        }

        const out = result[i];
        out.set(v.x, y, v.z);

    }

    return result;
}


export class PathSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Path;
        this.version = 1;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Path} value
     */
    serialize(buffer, value) {

        const points = value.points;
        const numPoints = points.length;

        buffer.writeUint8(value.interpolation);

        buffer.writeUintVar(value.markerIndex);
        buffer.writeFloat32(value.markerOffset);

        buffer.writeUintVar(numPoints);

        for (let i = 0; i < numPoints; i++) {
            const point = points[i];
            point.toBinaryBufferFloat32(buffer);
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Path} value
     */
    deserialize(buffer, value) {

        value.interpolation = buffer.readUint8();

        value.markerIndex = buffer.readUintVar();
        value.markerOffset = buffer.readFloat32();


        const numPoints = buffer.readUintVar();

        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const v = new Vector3();

            v.fromBinaryBufferFloat32(buffer);

            points.push(v)
        }

        value.points = points;


        //compute distance to next marker
        if (numPoints >= 0 && value.markerIndex < numPoints - 1) {
            value.markerDistanceToNext = value.previousPoint().distanceTo(value.nextPoint());
        } else {
            value.markerDistanceToNext = 0;
        }
    }
}


export class PathSerializationUpgrader_0_1 extends BinaryClassUpgrader {
    constructor() {
        super();

        this.__startVersion = 0;
        this.__targetVersion = 1;
    }

    upgrade(source, target) {
        //write interpolation type
        target.writeUint8(InterpolationOrder.First);

        target.writeUintVar(0);
        target.writeFloat32(0);

        const numPoints = source.readUint32();

        target.writeUintVar(numPoints);

        for (let i = 0; i < numPoints; i++) {
            for (let j = 0; j < 3; j++) {
                const v = source.readFloat64();

                target.writeFloat32(v);
            }
        }
    }
}
