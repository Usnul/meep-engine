/**
 * Created by Alex on 11/11/2014.
 */


import Vector2 from '../../../../core/geom/Vector2.js';
import Vector3 from '../../../../core/geom/Vector3.js';
import Vector4 from '../../../../core/geom/Vector4.js';
import { clamp, max2, min2, mix } from "../../../../core/math/MathUtils.js";
import { BlendingType } from "./BlendingType.js";
import { assert } from "../../../../core/assert.js";

function v2CrossMag(ax, ay, bx, by) {
    return ax * by - ay * bx;
}


function sampleTriangleM2(f2_x, f2_y, f3_x, f3_y, f1_x, f1_y, p1, p2, p3) {
    const a = 0.5; // main triangle cross product
    const a1 = v2CrossMag(f2_x, f2_y, f3_x, f3_y) / a;
    const a2 = v2CrossMag(f3_x, f3_y, f1_x, f1_y) / a;
    const a3 = v2CrossMag(f1_x, f1_y, f2_x, f2_y) / a;
    return p1 * a1 + p2 * a2 + p3 * a3;
}

function interpolateVectors1(v_0_0, v_1_0, v_0_1, v_1_1, xd, yd, result) {
    return filterFunctionBilinear(v_0_0, v_1_0, v_0_1, v_1_1, xd, yd);
}

//
function interpolateVectors2(v_0_0, v_1_0, v_0_1, v_1_1, xd, yd, result) {
    result.x = filterFunctionBilinear(v_0_0.x, v_1_0.x, v_0_1.x, v_1_1.x, xd, yd);
    result.y = filterFunctionBilinear(v_0_0.y, v_1_0.y, v_0_1.y, v_1_1.y, xd, yd);
    return result;
}

function interpolateVectors3(v_0_0, v_1_0, v_0_1, v_1_1, xd, yd, result) {
    result.x = filterFunctionBilinear(v_0_0.x, v_1_0.x, v_0_1.x, v_1_1.x, xd, yd);
    result.y = filterFunctionBilinear(v_0_0.y, v_1_0.y, v_0_1.y, v_1_1.y, xd, yd);
    result.z = filterFunctionBilinear(v_0_0.z, v_1_0.z, v_0_1.z, v_1_1.z, xd, yd);
    return result;
}

function interpolateVectors4(v_0_0, v_1_0, v_0_1, v_1_1, xd, yd, result) {
    result.x = filterFunctionBilinear(v_0_0.x, v_1_0.x, v_0_1.x, v_1_1.x, xd, yd);
    result.y = filterFunctionBilinear(v_0_0.y, v_1_0.y, v_0_1.y, v_1_1.y, xd, yd);
    result.z = filterFunctionBilinear(v_0_0.z, v_1_0.z, v_0_1.z, v_1_1.z, xd, yd);
    result.w = filterFunctionBilinear(v_0_0.w, v_1_0.w, v_0_1.w, v_1_1.w, xd, yd);
    return result;
}


/**
 * Quad interpolation
 * @param {number} q0
 * @param {number} q1
 * @param {number} p0
 * @param {number} p1
 * @param {number} xd
 * @param {number} yd
 * @returns {number}
 */
function filterFunction_(q0, q1, p0, p1, xd, yd) {
    //
    const s0 = mix(q0, q1, xd);
    const s1 = mix(p0, p1, xd);
    const t0 = mix(q0, p0, yd);
    const t1 = mix(q1, p1, yd);
    //
    const u = mix(s0, s1, yd);
    const v = mix(t0, t1, xd);
    //
    const total = u + v;
    return total / 2;
}

/**
 * Bi-Linear interpolation
 * @param q0
 * @param q1
 * @param p0
 * @param p1
 * @param xd
 * @param yd
 * @returns {*}
 */
function filterFunctionBilinear(q0, q1, p0, p1, xd, yd) {

    const s0 = mix(q0, q1, xd);
    const s1 = mix(p0, p1, xd);

    return mix(s0, s1, yd);
}

function filterFunctionSQRT(q0, q1, p0, p1, xd, yd) {
    function sd(v, x, y) {
        return v * Math.sqrt(x * x + y * y);
    }

    return sd(q0, 1 - xd, 1 - yd) + sd(q1, xd, 1 - yd) + sd(p0, 1 - xd, yd) + sd(p1, xd, yd);
}

function sampleTriangleTopLeft(p1, p2, p3, dx, dy) {

    // calculate vectors from point f to vertices p1, p2 and p3:
    const f1_x = -dx;
    const f1_y = -dy;

    const f2_x = 1 - dx;
    const f2_y = -dy;

    const f3_x = -dx;
    const f3_y = 1 - dy;
    // calculate the areas (parameters order is essential in this case):
    return sampleTriangleM2(f2_x, f2_y, f3_x, f3_y, f1_x, f1_y, p1, p2, p3);
}

function sampleTriangleBottomRight(p1, p2, p3, dx, dy) {

    // calculate vectors from point f to vertices p1, p2 and p3:
    const f1_x = 1 - dx;
    const f1_y = -dy;

    const f2_x = 1 - dx;
    const f2_y = 1 - dy;

    const f3_x = -dx;
    const f3_y = 1 - dy;
    // calculate the areas (parameters order is essential in this case):
    return sampleTriangleM2(f2_x, f2_y, f3_x, f3_y, f1_x, f1_y, p1, p2, p3);
}

/**
 *
 * @param {Array.<Number>|Uint8ClampedArray|Uint8Array|Uint16Array|Int8Array|Float32Array} data
 * @param {int} itemSize
 * @param {int} width
 * @param {int} height
 * @constructor
 */
export function Sampler2D(data, itemSize, width, height) {
    if (!Number.isInteger(itemSize)) {
        throw new Error(`itemSize must be integer, instead was ${itemSize}`);
    }
    if (!Number.isInteger(width)) {
        throw new Error(`width must be integer, instead was ${width}`);
    }
    if (!Number.isInteger(height)) {
        throw new Error(`height must be integer, instead was ${height}`);
    }

    if (data === undefined) {
        throw new Error('data was undefined');
    }

    /**
     *
     * @type {Number}
     */
    this.width = width;
    /**
     *
     * @type {Number}
     */
    this.height = height;
    /**
     *
     * @type {Number}
     */
    this.itemSize = itemSize;
    /**
     *
     * @type {Array<number>|Uint8Array|Uint16Array|Int8Array|Float32Array|Float64Array}
     */
    this.data = data;
}

/**
 *
 * @param {int} itemSize
 * @param {int} width
 * @param {int} height
 * @return {Sampler2D}
 */
Sampler2D.uint8clamped = function (itemSize, width, height) {
    const data = new Uint8ClampedArray(width * height * itemSize);
    const sampler = new Sampler2D(data, itemSize, width, height);
    return sampler;
};

/**
 *
 * @param {int} itemSize
 * @param {int} width
 * @param {int} height
 * @return {Sampler2D}
 */
Sampler2D.uint8 = function (itemSize, width, height) {
    const data = new Uint8Array(width * height * itemSize);
    const sampler = new Sampler2D(data, itemSize, width, height);
    return sampler;
};

/**
 *
 * @param {int} itemSize
 * @param {int} width
 * @param {int} height
 * @return {Sampler2D}
 */
Sampler2D.uint16 = function (itemSize, width, height) {
    const data = new Uint16Array(width * height * itemSize);
    const sampler = new Sampler2D(data, itemSize, width, height);
    return sampler;
};

/**
 *
 * @param {int} itemSize
 * @param {int} width
 * @param {int} height
 * @return {Sampler2D}
 */
Sampler2D.uint32 = function (itemSize, width, height) {
    const data = new Uint32Array(width * height * itemSize);
    const sampler = new Sampler2D(data, itemSize, width, height);
    return sampler;
};

/**
 *
 * @param {int} itemSize
 * @param {int} width
 * @param {int} height
 * @return {Sampler2D}
 */
Sampler2D.int8 = function (itemSize, width, height) {
    const data = new Int8Array(width * height * itemSize);
    const sampler = new Sampler2D(data, itemSize, width, height);
    return sampler;
};

/**
 *
 * @param {int} itemSize
 * @param {int} width
 * @param {int} height
 * @return {Sampler2D}
 */
Sampler2D.int16 = function (itemSize, width, height) {
    const data = new Int16Array(width * height * itemSize);
    const sampler = new Sampler2D(data, itemSize, width, height);
    return sampler;
};

/**
 *
 * @param {int} itemSize
 * @param {int} width
 * @param {int} height
 * @return {Sampler2D}
 */
Sampler2D.float32 = function (itemSize, width, height) {
    const data = new Float32Array(width * height * itemSize);
    const sampler = new Sampler2D(data, itemSize, width, height);
    return sampler;
};

/**
 *
 * @param {Sampler2D} input0
 * @param {Sampler2D} input1
 * @param {Sampler2D} result
 * @param {function( value0 : number[], value1 : number[], result : number[], index : number) : void} operation
 */
Sampler2D.combine = function (input0, input1, result, operation) {
    assert.notEqual(input0, undefined, 'input0 is undefined');
    assert.notEqual(input1, undefined, 'input1 is undefined');
    assert.notEqual(result, undefined, 'result is undefined');

    assert.typeOf(operation, 'function', 'operation');

    assert.equal(input0.width, input1.width, `input0.width(=${input0.width}) is not equal to input1.width(=${input1.width})`);
    assert.equal(input0.height, input1.height, `input0.height(=${input0.height}) is not equal to input1.height(=${input1.height})`);

    assert.equal(input0.width, result.width, `input width(=${input0.width}) is not equal to result.width(=${result.width})`);
    assert.equal(input0.height, result.height, `input height(=${input0.height}) is not equal to result.height(=${result.height})`);

    const width = input0.width;
    const height = input0.height;

    const length = width * height;

    const arg0 = [];
    const arg1 = [];
    const res = [];

    const itemSize0 = input0.itemSize;
    const itemSize1 = input1.itemSize;
    const itemSizeR = result.itemSize;

    const data0 = input0.data;
    const data1 = input1.data;
    const dataR = result.data;


    let i, j;

    for (i = 0; i < length; i++) {

        // read input 0
        for (j = 0; j < itemSize0; j++) {
            arg0[j] = data0[j + i * itemSize0];
        }

        // read input 1
        for (j = 0; j < itemSize0; j++) {
            arg1[j] = data1[j + i * itemSize1];
        }

        //perform operation
        operation(arg0, arg1, res, i);

        //write result
        for (j = 0; j < itemSizeR; j++) {
            dataR[j + i * itemSizeR] = res[j];
        }

    }
};


/**
 * @param {number} [channel=0]
 * @returns {{x: number, index: number, y: number, value: number}}
 */
Sampler2D.prototype.computeMax = function (channel = 0) {
    const itemSize = this.itemSize;

    assert.typeOf(channel, 'number', 'channel');
    assert.ok(channel >= 0, `channel must be >= 0, was ${channel}`);
    assert.ok(channel < itemSize, `channel must be less than itemSize(=${itemSize}), was ${channel}`);

    const data = this.data;

    const l = data.length;

    if (l === 0) {
        //no data
        return undefined;
    }

    let bestValue = data[channel];
    let bestIndex = channel;

    for (let i = channel + itemSize; i < l; i += itemSize) {
        const value = data[i];

        if (bestValue < value) {
            bestValue = value;
            bestIndex = i;
        }

    }

    const width = this.width;

    const itemIndex = (bestIndex / this.itemSize) | 0;

    const x = itemIndex % width;
    const y = (itemIndex / width) | 0;

    return {
        index: bestIndex,
        value: bestValue,
        x,
        y
    };
};

/**
 * @param {number[]} result
 * @param {number} [channel=0]
 */
Sampler2D.prototype.computeMinIndices = function (result, channel = 0) {
    const itemSize = this.itemSize;

    assert.typeOf(channel, 'number', 'channel');
    assert.ok(channel >= 0, `channel must be >= 0, was ${channel}`);
    assert.ok(channel < itemSize, `channel must be less than itemSize(=${itemSize}), was ${channel}`);

    assert.ok(Array.isArray(result), 'result is not an array');

    const data = this.data;

    const l = data.length;

    if (l === 0) {
        //no data
        return undefined;
    }

    let bestValue = data[channel];
    let bestIndex = channel;

    let resultCount = 0;

    for (let i = channel + itemSize; i < l; i += itemSize) {
        const value = data[i];

        if (bestValue > value) {
            bestValue = value;
            //drop result
            resultCount = 1;

            result[0] = i;
        } else if (value === bestValue) {
            result[resultCount++] = i;
        }

    }

    //crop results
    if (resultCount < result.length) {
        result.splice(resultCount, result.length - resultCount);
    }

    return;
};

/**
 * @param {number} [channel=0]
 * @returns {{x: number, index: number, y: number, value: number}}
 */
Sampler2D.prototype.computeMin = function (channel = 0) {
    const itemSize = this.itemSize;

    assert.typeOf(channel, 'number', 'channel');
    assert.ok(channel >= 0, `channel must be >= 0, was ${channel}`);
    assert.ok(channel < itemSize, `channel must be less than itemSize(=${itemSize}), was ${channel}`);

    const data = this.data;

    const l = data.length;

    if (l === 0) {
        //no data
        return undefined;
    }

    let bestValue = data[channel];
    let bestIndex = channel;

    for (let i = channel + itemSize; i < l; i += itemSize) {
        const value = data[i];

        if (bestValue > value) {
            bestValue = value;
            bestIndex = i;
        }

    }

    const width = this.width;

    const itemIndex = (bestIndex / this.itemSize) | 0;

    const x = itemIndex % width;
    const y = (itemIndex / width) | 0;

    return {
        index: bestIndex,
        value: bestValue,
        x,
        y
    };
};

Sampler2D.prototype.initialize = function () {
};

/**
 *
 * @deprecated
 * @param {number} x
 * @param {number}y
 * @param {Vector1|Vector2|Vector3|Vector4} result
 * @returns {number}
 */
Sampler2D.prototype.get = function (x, y, result) {
    console.warn('Deprecated method, use sampleBilinear instead');

    const t = [];

    this.sampleBilinear(x, y, t);

    if (result !== undefined) {
        result.readFromArray(t, 0);
        return result;
    } else {
        return t[0];
    }
};

/**
 * Based on code from From reddit https://www.reddit.com/r/javascript/comments/jxa8x/bicubic_interpolation/
 * @param {number} t
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @returns {number}
 */
function bicubic_terp(t, a, b, c, d) {
    return 0.5 * (c - a + (2.0 * a - 5.0 * b + 4.0 * c - d + (3.0 * (b - c) + d - a) * t) * t) * t + b;
}

/**
 *
 * @param {number} u
 * @param {number} v
 * @param {number} channel
 * @returns {number}
 */
Sampler2D.prototype.sampleChannelBicubicUV = function (u, v, channel) {
    const x = u * (this.width - 1);
    const y = v * (this.height - 1);

    return this.sampleChannelBicubic(x, y, channel);
};

/**
 * Bicubic-filtered sampling
 * @param {number} x
 * @param {number} y
 * @param {number} channel
 * @returns {number}
 */
Sampler2D.prototype.sampleChannelBicubic = function (x, y, channel) {

    const itemSize = this.itemSize;

    const width = this.width;
    const height = this.height;

    const data = this.data;

    const rowSize = width * itemSize;

    const x_max = width - 1;
    const y_max = height - 1;

    const x1 = clamp(x, 0, x_max) | 0;
    const y1 = clamp(y, 0, y_max) | 0;

    const x0 = max2(0, x1 - 1);
    const y0 = max2(0, y1 - 1);

    const x2 = min2(x_max, x1 + 1);
    const y2 = min2(y_max, y1 + 1);

    const x3 = min2(x_max, x2 + 1);
    const y3 = min2(y_max, y2 + 1);

    // compute row offsets
    const row0 = y0 * rowSize;
    const row1 = y1 * rowSize;
    const row2 = y2 * rowSize;
    const row3 = y3 * rowSize;

    const row0_address = row0 + channel;
    const row1_address = row1 + channel;
    const row2_address = row2 + channel;
    const row3_address = row3 + channel;

    const col0_offset = x0 * itemSize;
    const col1_offset = x1 * itemSize;
    const col2_offset = x2 * itemSize;
    const col3_offset = x3 * itemSize;

    // compute sample addresses
    const i0 = row0_address + col0_offset;
    const i1 = row0_address + col1_offset;
    const i2 = row0_address + col2_offset;
    const i3 = row0_address + col3_offset;

    const j0 = row1_address + col0_offset;
    const j1 = row1_address + col1_offset;
    const j2 = row1_address + col2_offset;
    const j3 = row1_address + col3_offset;

    const k0 = row2_address + col0_offset;
    const k1 = row2_address + col1_offset;
    const k2 = row2_address + col2_offset;
    const k3 = row2_address + col3_offset;

    const l0 = row3_address + col0_offset;
    const l1 = row3_address + col1_offset;
    const l2 = row3_address + col2_offset;
    const l3 = row3_address + col3_offset;

    // read samples
    const vi0 = data[i0];
    const vi1 = data[i1];
    const vi2 = data[i2];
    const vi3 = data[i3];

    const vj0 = data[j0];
    const vj1 = data[j1];
    const vj2 = data[j2];
    const vj3 = data[j3];

    const vk0 = data[k0];
    const vk1 = data[k1];
    const vk2 = data[k2];
    const vk3 = data[k3];

    const vl0 = data[l0];
    const vl1 = data[l1];
    const vl2 = data[l2];
    const vl3 = data[l3];

    const xd = x - x1;
    const yd = y - y1;

    // perform filtering in X
    const s0 = bicubic_terp(xd, vi0, vi1, vi2, vi3);
    const s1 = bicubic_terp(xd, vj0, vj1, vj2, vj3);
    const s2 = bicubic_terp(xd, vk0, vk1, vk2, vk3);
    const s3 = bicubic_terp(xd, vl0, vl1, vl2, vl3);

    // filter in Y
    const result = bicubic_terp(yd, s0, s1, s2, s3);

    return result;
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number[]} result
 */
Sampler2D.prototype.sampleBilinear = function (x, y, result) {

    const itemSize = this.itemSize;

    for (let i = 0; i < itemSize; i++) {
        //TODO this can be optimized greatly
        result[i] = this.sampleChannelBilinear(x, y, i);

    }
};

/**
 *
 * @param {number} u
 * @param {number} v
 * @param {number} channel
 * @return {number}
 */
Sampler2D.prototype.sampleChannelBilinearUV = function (u, v, channel) {
    const x = u * (this.width - 1);
    const y = v * (this.height - 1);

    return this.sampleChannelBilinear(x, y, channel);
};


/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number} channel
 * @returns {number}
 */
Sampler2D.prototype.sampleChannelBilinear = function (x, y, channel) {

    const itemSize = this.itemSize;

    const width = this.width;
    const height = this.height;

    const rowSize = width * itemSize;

    //sample 4 points
    const x_max = width - 1;
    const y_max = height - 1;

    const clamped_x = clamp(x, 0, x_max);
    const clamped_y = clamp(y, 0, y_max);

    const x0 = clamped_x | 0;
    const y0 = clamped_y | 0;

    //
    const row0 = y0 * rowSize;
    const col0_offset = x0 * itemSize + channel;

    const i0 = row0 + col0_offset;

    //
    let x1, y1;

    if (clamped_x === x0 || x0 >= x_max) {
        x1 = x0;
    } else {
        x1 = x0 + 1;
    }


    if (clamped_y === y0 || y0 >= y_max) {
        y1 = y0;
    } else {
        y1 = y0 + 1;
    }

    const data = this.data;

    const q0 = data[i0];

    if (x0 === x1 && y0 === y1) {
        return q0;
    }

    //
    const xd = clamped_x - x0;
    const yd = clamped_y - y0;

    const col1_offset = x1 * itemSize + channel;

    const i1 = row0 + col1_offset;

    const row1 = y1 * rowSize;

    const j0 = row1 + col0_offset;
    const j1 = row1 + col1_offset;

    const q1 = data[i1];
    const p0 = data[j0];
    const p1 = data[j1];

    return filterFunctionBilinear(q0, q1, p0, p1, xd, yd);
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number} channel
 * @returns {number}
 */
Sampler2D.prototype.readChannel = function (x, y, channel) {
    assert.isNumber(x, 'x');
    assert.isNumber(y, 'y');
    assert.isNumber(channel, 'channel');

    const index = (y * this.width + x) * this.itemSize + channel;

    return this.data[index];
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number[]} result
 */
Sampler2D.prototype.read = function (x, y, result) {

    const width = this.width;

    const itemSize = this.itemSize;

    const i0 = (y * width + x) * itemSize;

    for (let i = 0; i < itemSize; i++) {
        const v = this.data[i0 + i];

        result[i] = v;
    }
};


/**
 *
 * @param {number} u
 * @param {number} v
 * @param {Vector4|Vector3|Vector2} [result]
 * @deprecated
 */
Sampler2D.prototype.sample = function (u, v, result) {
    console.warn('Deprecated method, use sampleBilinear instead');

    const temp = [];

    this.sampleBilinear(u * (this.width - 1), v * (this.height - 1), temp);

    result.readFromArray(temp);

    return temp[0];
};

/**
 *
 * @param {number} index
 * @param {number[]} result
 */
Sampler2D.prototype.computeNeighbors = function (index, result) {
    const width = this.width;
    const height = this.height;

    const x = index % width;
    const y = (index / width) | 0;
    if (x > 0) {
        result.push(index - 1);
    }
    if (x < width - 1) {
        result.push(index + 1);
    }
    if (y > 0) {
        result.push(index - width);
    }
    if (y < height - 1) {
        result.push(index + width);
    }
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
Sampler2D.prototype.point2index = function (x, y) {
    return x + y * this.width;
};

/**
 *
 * @param {number} index
 * @param {Vector2} result
 */
Sampler2D.prototype.index2point = function (index, result) {
    const width = this.width;

    const x = index % width;
    const y = (index / width) | 0;

    result.set(x, y);
};

/**
 *
 * @param {number} scale
 * @param {number} offset
 * @return {function(index:int, array:ArrayLike, x:int, y:int)}
 */
Sampler2D.prototype.makeArrayFiller = function (scale, offset) {
    scale = scale || 255;
    offset = offset || 0;

    const sampler = this;
    const v4 = [1 / scale, 1 / scale, 1 / scale, 1 / scale];

    //
    function fillDD1(index, array, x, y) {
        const val = (sampler.sampleChannelBilinear(x, y, 0) + offset) * scale | 0;
        array[index] = val;
        array[index + 1] = val;
        array[index + 2] = val;
        array[index + 3] = 255;
    }

    function fillDD2(index, array, x, y) {
        sampler.sampleBilinear(x, y, v4);
        const val = (v4[0] + offset) * scale | 0;
        array.fill(val, index, index + 3);
        array[index + 3] = (v4[1] + offset) * scale | 0;
    }

    function fillDD3(index, array, x, y) {

        sampler.sampleBilinear(x, y, v4);

        array[index] = (v4[0] + offset) * scale | 0;
        array[index + 1] = (v4[1] + offset) * scale | 0;
        array[index + 2] = (v4[2] + offset) * scale | 0;
        array[index + 3] = 255;
    }

    function fillDD4(index, array, x, y) {
        sampler.sampleBilinear(x, y, v4);
        array[index] = (v4[0] + offset) * scale | 0;
        array[index + 1] = (v4[1] + offset) * scale | 0;
        array[index + 2] = (v4[2] + offset) * scale | 0;
        array[index + 3] = (v4[3] + offset) * scale | 0;
    }

    let fillDD;
    switch (sampler.itemSize) {
        case 1:
            fillDD = fillDD1;
            break;
        case 2:
            fillDD = fillDD2;
            break;
        case 3:
            fillDD = fillDD3;
            break;
        case 4:
            fillDD = fillDD4;
            break;
        default :
            throw new Error("unsupported item size");
            break;
    }
    return fillDD;
};

/**
 * Copy a patch from another sampler with a margin.
 * This is useful for texture rendering where filtering can cause bleeding along the edges of the patch.
 * @param {Sampler2D} source where to copy from
 * @param {Number} sourceX where to start reading from, X coordinate
 * @param {Number} sourceY where to start reading from, X coordinate
 * @param {Number} destinationX where to start writing to, X coordinate
 * @param {Number} destinationY where to start writing to, X coordinate
 * @param {Number} width size of the patch that is to be copied
 * @param {Number} height size of the patch that is to be copied
 * @param {Number} marginLeft
 * @param {Number} marginRight
 * @param {Number} marginTop
 * @param {Number} marginBottom
 */
Sampler2D.prototype.copyWithMargin = function (source, sourceX, sourceY, destinationX, destinationY, width, height, marginLeft, marginRight, marginTop, marginBottom) {
    const dItemSize = this.itemSize;
    const sItemSize = source.itemSize;
    const _itemSize = Math.min(dItemSize, sItemSize);


    const dRowSize = dItemSize * this.width;
    const sRowSize = sItemSize * source.width;

    const sData = source.data;
    const dData = this.data;

    let x, y, i, j;

    let xMax, yMax;

    let dA, sA, dOffset, sOffset;
    //Write top-left corner
    sOffset = sourceY * sRowSize + sourceX * dItemSize;
    for (y = Math.max(0, destinationY - marginTop), yMax = destinationY; y < yMax; y++) {
        dA = y * dRowSize;

        for (x = Math.max(0, destinationX - marginLeft), xMax = destinationX; x < xMax; x++) {

            dOffset = dA + x * dItemSize;

            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }
    //Write top margin
    sA = sourceY * sRowSize;
    for (y = Math.max(0, destinationY - marginTop), yMax = destinationY; y < yMax; y++) {
        dA = y * dRowSize;

        for (x = 0; x < width; x++) {

            dOffset = dA + (x + destinationX) * dItemSize;
            sOffset = sA + (x + sourceX) * dItemSize;
            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }
    //Write top-right corner
    sOffset = sourceY * sRowSize + (sourceX + width - 1) * dItemSize;
    for (y = Math.max(0, destinationY - marginTop), yMax = destinationY; y < yMax; y++) {
        dA = y * dRowSize;

        for (x = destinationX + width, xMax = Math.min(this.width, x + marginRight); x < xMax; x++) {

            dOffset = dA + x * dItemSize;

            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }
    //Write left margin
    for (y = 0; y < height; y++) {
        dA = (y + destinationY) * dRowSize;
        sA = (y + sourceY) * sRowSize;

        sOffset = sA + (sourceX) * dItemSize;

        for (x = Math.max(0, destinationX - marginLeft), xMax = destinationX; x < xMax; x++) {

            dOffset = dA + x * dItemSize;

            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }
    //write actual patch
    this.copy(source, sourceX, sourceY, destinationX, destinationY, width, height);

    //Write right margin
    for (y = 0; y < height; y++) {
        dA = (y + destinationY) * dRowSize;
        sA = (y + sourceY) * sRowSize;

        sOffset = sA + (sourceX + width - 1) * dItemSize;

        for (x = destinationX + width, xMax = Math.min(this.width, x + marginRight); x < xMax; x++) {

            dOffset = dA + x * dItemSize;

            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }

    //Write Bottom-left margin
    sOffset = (sourceY + height - 1) * sRowSize + sourceX * dItemSize;
    for (y = destinationY + width, yMax = Math.min(this.height, y + marginBottom); y < yMax; y++) {
        dA = y * dRowSize;

        for (x = Math.max(0, destinationX - marginLeft), xMax = destinationX; x < xMax; x++) {

            dOffset = dA + x * dItemSize;

            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }
    //Write Bottom margin
    sA = (sourceY + height - 1) * sRowSize;
    for (y = destinationY + width, yMax = Math.min(this.height, y + marginBottom); y < yMax; y++) {
        dA = y * dRowSize;

        for (x = 0; x < width; x++) {

            dOffset = dA + (x + destinationX) * dItemSize;
            sOffset = sA + (x + sourceX) * dItemSize;
            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }
    //Write Bottom-right margin
    sOffset = (sourceY + height - 1) * sRowSize + (sourceX + width - 1) * dItemSize;
    for (y = destinationY + width, yMax = Math.min(this.height, y + marginBottom); y < yMax; y++) {
        dA = y * dRowSize;

        for (x = destinationX + width, xMax = Math.min(this.width, x + marginRight); x < xMax; x++) {

            dOffset = dA + x * dItemSize;

            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }
};

/**
 * Copy a patch from another sampler
 * @param {Sampler2D} source where to copy from
 * @param {Number} sourceX where to start reading from, X coordinate
 * @param {Number} sourceY where to start reading from, X coordinate
 * @param {Number} destinationX where to start writing to, X coordinate
 * @param {Number} destinationY where to start writing to, X coordinate
 * @param {Number} width size of the patch that is to be copied
 * @param {Number} height size of the patch that is to be copied
 */
Sampler2D.prototype.copy = function (source, sourceX, sourceY, destinationX, destinationY, width, height) {

    const _w = Math.min(width, source.width - sourceX, this.width - destinationX);
    const _h = Math.min(height, source.height - sourceY, this.height - destinationY);


    const dItemSize = this.itemSize;
    const sItemSize = source.itemSize;
    const _itemSize = Math.min(dItemSize, sItemSize);


    const dRowSize = dItemSize * this.width;
    const sRowSize = sItemSize * source.width;

    const sData = source.data;
    const dData = this.data;

    let x, y, i;

    for (y = 0; y < _h; y++) {
        const dA = (y + destinationY) * dRowSize;
        const sA = (y + sourceY) * sRowSize;
        for (x = 0; x < _w; x++) {
            const dOffset = dA + (x + destinationX) * dItemSize;
            const sOffset = sA + (x + sourceX) * sItemSize;
            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }
};


/**
 * Copy a patch from another sampler with the same itemSize
 * @param {Sampler2D} source where to copy from
 * @param {Number} sourceX where to start reading from, X coordinate
 * @param {Number} sourceY where to start reading from, X coordinate
 * @param {Number} destinationX where to start writing to, X coordinate
 * @param {Number} destinationY where to start writing to, X coordinate
 * @param {Number} width size of the patch that is to be copied
 * @param {Number} height size of the patch that is to be copied
 */
Sampler2D.prototype.copy_sameItemSize = function (source, sourceX, sourceY, destinationX, destinationY, width, height) {
    const itemSize = this.itemSize;
    const sItemSize = source.itemSize;

    assert.equal(sItemSize, sItemSize, `source.itemSize(=${sItemSize}) != this.itemSize(=${itemSize})`);

    const _w = Math.min(width, source.width - sourceX, this.width - destinationX);
    const _h = Math.min(height, source.height - sourceY, this.height - destinationY);


    const dRowSize = itemSize * this.width;
    const sRowSize = itemSize * source.width;

    const sData = source.data;
    const dData = this.data;

    const patchRowSize = _w * itemSize;

    let y, i;

    for (y = 0; y < _h; y++) {
        const dA = (y + destinationY) * dRowSize;
        const sA = (y + sourceY) * sRowSize;

        const dOffset = dA + destinationX * itemSize;
        const sOffset = sA + sourceX * itemSize;

        for (i = 0; i < patchRowSize; i++) {

            dData[dOffset + i] = sData[sOffset + i];

        }
    }
};


/**
 *
 * @param {number[]} source
 * @param {number[]} destination
 * @param {Array} result
 */
function blendFunctionNormal(source, destination, result) {

    const a1 = source[3] / 255;
    const a0 = destination[3] / 255;

    result[0] = source[0] * a1 + destination[0] * (1 - a1);
    result[1] = source[1] * a1 + destination[1] * (1 - a1);
    result[2] = source[2] * a1 + destination[2] * (1 - a1);
    result[3] = (a1 + a0 * (1 - a1)) * 255;
}

/**
 * Assumes both samplers are uint8 with values 0-255
 * @param {Sampler2D} source
 * @param sourceX
 * @param sourceY
 * @param destinationX
 * @param destinationY
 * @param width
 * @param height
 * @param {BlendingType} blendMode
 */
Sampler2D.prototype.paint = function (source, sourceX, sourceY, destinationX, destinationY, width, height, blendMode) {
    let blendFunction;
    if (blendMode === BlendingType.Normal) {
        blendFunction = blendFunctionNormal;
    } else {
        throw new Error(`Unsupported blendType(=${blendMode})`);
    }

    const _w = Math.min(width, source.width - sourceX, this.width - destinationX);
    const _h = Math.min(height, source.height - sourceY, this.height - destinationY);


    const c0 = [0, 0, 0, 255];
    const c1 = [0, 0, 0, 255];

    const c3 = [];

    let x, y;

    for (y = 0; y < _h; y++) {
        for (x = 0; x < _w; x++) {
            this.read(x + destinationX, y + destinationY, c0);
            source.read(x + sourceY, y + sourceY, c1);

            blendFunction(c1, c0, c3);

            this.set(x, y, c3);

        }
    }


};

/**
 * Fill data values with zeros for a given area
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 */
Sampler2D.prototype.zeroFill = function (x, y, width, height) {

    const x0 = clamp(x, 0, this.width);
    const y0 = clamp(y, 0, this.height);
    const x1 = clamp(x + width, 0, this.width);
    const y1 = clamp(y + height, 0, this.height);

    const data = this.data;
    const itemSize = this.itemSize;

    const rowSize = itemSize * this.width;

    const clearRowOffset0 = x0 * itemSize;
    const clearRowOffset1 = x1 * itemSize;

    let _y;

    for (_y = y0; _y < y1; _y++) {

        const a = _y * rowSize;

        data.fill(0, a + clearRowOffset0, a + clearRowOffset1);

    }
};

/**
 *
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 * @param {Array.<Number>} value
 */
Sampler2D.prototype.fill = function (x, y, width, height, value) {

    const x0 = clamp(x, 0, this.width);
    const y0 = clamp(y, 0, this.height);
    const x1 = clamp(x + width, 0, this.width);
    const y1 = clamp(y + height, 0, this.height);

    const data = this.data;
    const itemSize = this.itemSize;

    const rowSize = itemSize * this.width;

    let _y, _x, i;

    for (_y = y0; _y < y1; _y++) {

        const a = _y * rowSize;

        for (_x = x0; _x < x1; _x++) {

            const offset = a + _x * itemSize;

            for (i = 0; i < itemSize; i++) {

                data[offset + i] = value[i];

            }

        }
    }
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number} channel
 * @param {number} value
 */
Sampler2D.prototype.writeChannel = function (x, y, channel, value) {
    assert.typeOf(x, 'number', 'x');
    assert.typeOf(y, 'number', 'y');

    assert.greaterThanOrEqual(x, 0);
    assert.greaterThanOrEqual(y, 0);
    assert.lessThan(x, this.width);
    assert.lessThan(y, this.height);

    const pointIndex = y * this.width + x;
    const pointAddress = pointIndex * this.itemSize;
    const channelAddress = pointAddress + channel;

    this.data[channelAddress] = value;
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number[]} value
 */
Sampler2D.prototype.set = function (x, y, value) {
    const data = this.data;
    const itemSize = this.itemSize;

    const rowSize = itemSize * this.width;

    const offset = (rowSize * y) + x * itemSize;

    for (let i = 0; i < itemSize; i++) {
        data[offset + i] = value[i];
    }
};

/**
 * Traverses area inside a circle
 * NOTE: Based on palm3d answer on stack overflow: https://stackoverflow.com/questions/1201200/fast-algorithm-for-drawing-filled-circles
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 * @param {function(x:number,y:number, sampler:Sampler2D)} visitor
 */
Sampler2D.prototype.traverseCircle = function (centerX, centerY, radius, visitor) {
    let x, y;

    //convert offsets to integers for safety
    const offsetX = centerX | 0;
    const offsetY = centerY | 0;

    const r2 = radius * radius;

    const radiusCeil = Math.ceil(radius);

    for (y = -radiusCeil; y <= radiusCeil; y++) {
        const y2 = y * y;

        for (x = -radiusCeil; x <= radiusCeil; x++) {

            if (x * x + y2 <= r2) {
                visitor(offsetX + x, offsetY + y, this);
            }

        }
    }
};

export function arrayConstructorByInstance(a) {
    if (a instanceof Int8Array) {
        return Int8Array;
    } else if (a instanceof Int16Array) {
        return Int16Array;
    } else if (a instanceof Int32Array) {
        return Int32Array;
    } else if (a instanceof Uint8Array) {
        return Uint8Array;
    } else if (a instanceof Uint8ClampedArray) {
        return Uint8ClampedArray;
    } else if (a instanceof Uint16Array) {
        return Uint16Array;
    } else if (a instanceof Uint32Array) {
        return Uint32Array;
    } else if (a instanceof Float32Array) {
        return Float32Array;
    } else if (a instanceof Float64Array) {
        return Float64Array;
    } else if (Array.isArray(a)) {
        return Array;
    } else {
        throw new TypeError(`Unsupported array type`);
    }
}

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {boolean} [preserveData=true]
 */
Sampler2D.prototype.resize = function (x, y, preserveData = true) {

    const itemSize = this.itemSize;
    const length = x * y * itemSize;

    const oldData = this.data;

    const Constructor = arrayConstructorByInstance(oldData);

    const newData = new Constructor(length);

    if (preserveData) {
        //copy old data
        if (x === this.width) {
            // number of columns is preserved, we can just copy the old data across
            newData.set(oldData.subarray(0, Math.min(oldData.length, length)));
        } else {
            //we need to copy new data row-by-row
            const rowCount = min2(y, this.height);

            const columnCount = min2(x, this.width);

            for (let i = 0; i < rowCount; i++) {
                for (let j = 0; j < columnCount; j++) {

                    const targetItemAddress = (i * x + j) * itemSize;
                    const sourceItemAddress = (i * this.width + j) * itemSize;

                    for (let k = 0; k < itemSize; k++) {

                        newData[targetItemAddress + k] = oldData[sourceItemAddress + k];

                    }
                }
            }
        }
    }

    this.width = x;
    this.height = y;
    this.data = newData;
};

/**
 * Estimate memory requirement of the object
 * @return {number}
 */
Sampler2D.prototype.computeByteSize = function () {
    let dataSize;

    if (Array.isArray(this.data)) {
        dataSize = 8 * this.data.length;
    } else {
        dataSize = this.data.buffer.byteLength;
    }

    return dataSize + 280;
};


/**
 *
 * @param {BinaryBuffer} buffer
 */
Sampler2D.prototype.toBinaryBuffer = function (buffer) {
    const width = this.width;
    const height = this.height;

    const itemSize = this.itemSize;

    buffer.writeUint16(width);
    buffer.writeUint16(height);

    buffer.writeUint8(itemSize);

    if (this.data instanceof Uint8Array) {
        //data type
        buffer.writeUint8(0);


        const byteSize = width * height * itemSize;

        buffer.writeBytes(this.data, 0, byteSize);

    } else {
        throw new TypeError(`Unsupported data type`);
    }
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
Sampler2D.prototype.fromBinaryBuffer = function (buffer) {
    this.width = buffer.readUint16();
    this.height = buffer.readUint16();

    this.itemSize = buffer.readUint8();

    const dataType = buffer.readUint8();

    if (dataType === 0) {

        const numBytes = this.height * this.width * this.itemSize;
        this.data = new Uint8Array(numBytes);

        buffer.readBytes(this.data, 0, numBytes);

    } else {
        throw new TypeError(`Unsupported data type (${dataType})`);
    }
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {function(x:number, y:number, value:number, index:number):boolean?} visitor
 * @param {*} [thisArg]
 */
Sampler2D.prototype.traverseOrthogonalNeighbours = function (x, y, visitor, thisArg) {
    const width = this.width;
    const height = this.height;

    const index = this.point2index(x, y);

    let i = 0;
    const data = this.data;
    if (x > 0) {
        i = index - 1;
        visitor.call(thisArg, x - 1, y, data[i], i);
    }
    if (x < width - 1) {
        i = index + 1;
        visitor.call(thisArg, x + 1, y, data[i], i);
    }
    if (y > 0) {
        i = index - width;
        visitor.call(thisArg, x, y - 1, data[i], i);
    }
    if (y < height - 1) {
        i = index + width;
        visitor.call(thisArg, x, y + 1, data[i], i);
    }
};

/**
 *
 * @param {Sampler2D} sampler0
 * @param {Sampler2D} sampler1
 * @returns {Sampler2D}
 */
export function differenceSampler(sampler0, sampler1) {
    let v0 = new Vector4();
    let v1 = new Vector4();
    //
    const width = sampler0.width;
    const height = sampler0.height;
    //
    const difference = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            v0 = sampler0.get(x, y, v0);
            v1 = sampler1.get(x, y, v1);
            v0.normalize();
            v1.normalize();
            //check distance
            difference[x + y * width] = 1 - v0.dot(v1);
        }
    }
    //
    const sampleD = new Sampler2D(difference, 1, width, height);
    return sampleD;
}
