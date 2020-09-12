/**
 * @readonly
 * @enum {string}
 */
import { Cache } from "../../Cache.js";
import { FunctionCompiler } from "../../function/FunctionCompiler.js";
import { DataType } from "./DataType.js";
import { EndianType } from "../../binary/BinaryBuffer.js";

/**
 * @readonly
 * @enum {string}
 */
export const DataType2DataViewReaders = {
    "uint8": "getUint8",
    "uint16": "getUint16",
    "uint32": "getUint32",
    "uint64": "getUint64",

    "int8": "getInt8",
    "int16": "getInt16",
    "int32": "getInt32",
    "int64": "getInt64",

    "float32": "getFloat32",
    "float64": "getFloat64"
};

/**
 * @readonly
 * @enum {string}
 */
export const DataType2DataViewWriters = {
    "uint8": "setUint8",
    "uint16": "setUint16",
    "uint32": "setUint32",
    "uint64": "setUint64",

    "int8": "setInt8",
    "int16": "setInt16",
    "int32": "setInt32",
    "int64": "setInt64",

    "float32": "setFloat32",
    "float64": "setFloat64"
};

/**
 * @readonly
 * @enum {number}
 */
export const DataTypeByteSizes = {
    [DataType.Uint8]: 1,
    [DataType.Uint16]: 2,
    [DataType.Uint32]: 4,
    [DataType.Uint64]: 8,

    [DataType.Int8]: 1,
    [DataType.Int16]: 2,
    [DataType.Int32]: 4,
    [DataType.Int64]: 8,

    [DataType.Float32]: 4,
    [DataType.Float64]: 8
};

/**
 *
 * @param {DataType[]} types
 * @param {EndianType} [endianType]
 * @returns {Function}
 */
function genRowReader(types, endianType = EndianType.BigEndian) {
    let offset = 0;

    const lines = [];

    const numTypes = types.length;

    for (let i = 0; i < numTypes; i++) {

        const type = types[i];

        const littleEndianFlag = endianType === EndianType.BigEndian ? 'false' : 'true';

        // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
        lines.push(`result[${i}] = dataView.${DataType2DataViewReaders[type]}(${offset} + byteOffset, ${littleEndianFlag});`);

        offset += DataTypeByteSizes[type];

    }

    const result = FunctionCompiler.INSTANCE.compile({
        args: ['dataView, byteOffset, result'],
        code: lines.join("\n")
    });

    return result;
}

/**
 *
 * @param {DataType[]} types
 * @param {EndianType} [endianType]
 * @returns {Function}
 */
function genRowWriter(types, endianType = EndianType.BigEndian) {
    let offset = 0;

    const lines = [];

    const numTypes = types.length;

    for (let i = 0; i < numTypes; i++) {
        const type = types[i];

        const littleEndianFlag = endianType === EndianType.BigEndian ? 'false' : 'true';

        // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
        lines.push(`dataView.${DataType2DataViewWriters[type]}(${offset} + byteOffset, record[${i}], ${littleEndianFlag});`);

        offset += DataTypeByteSizes[type];
    }

    const result = FunctionCompiler.INSTANCE.compile({
            args: ['dataView, byteOffset, record'],
            code: lines.join("\n")
        }
    );

    return result;
}

/**
 *
 * @param {DataType} type
 * @param {number} offset
 * @param {EndianType} [endianType]
 * @returns {Function}
 */
function genCellWriter(type, offset, endianType = EndianType.BigEndian) {
    const writeMethod = DataType2DataViewWriters[type];

    const littleEndianFlag = endianType === EndianType.BigEndian ? 'false' : 'true';

    return FunctionCompiler.INSTANCE.compile({
        args: ['dataView, byteOffset, value'],
        code: `dataView.${writeMethod}(byteOffset+${offset}, value, ${littleEndianFlag});`
    });
}

/**
 *
 * @param {DataType} type
 * @param {number} offset
 * @param {EndianType} [endianType]
 * @returns {Function}
 */
function genCellReader(type, offset, endianType = EndianType.BigEndian) {
    const readMethod = DataType2DataViewReaders[type];

    const littleEndianFlag = endianType === EndianType.BigEndian ? 'false' : 'true';

    return FunctionCompiler.INSTANCE.compile({
        args: ['dataView, byteOffset'],
        code: `return dataView.${readMethod}(byteOffset+${offset}, ${littleEndianFlag});`
    });
}

/**
 *
 * @param {DataType[]} types
 * @param {EndianType} [endianType]
 * @constructor
 */
export function RowFirstTableSpec(types, endianType = EndianType.BigEndian) {
    const numTypes = types.length;

    /**
     * @readonly
     * @type {DataType[]}
     */
    this.types = types;

    /**
     * @readonly
     * @type {number[]}
     */
    this.columnOffsets = new Array(numTypes);
    let byteOffset = 0;
    types.forEach((type, index) => {
        this.columnOffsets[index] = byteOffset;

        const columnByteSize = DataTypeByteSizes[type];

        byteOffset += columnByteSize;
    });


    /**
     * @readonly
     * @type {number}
     */
    this.bytesPerRecord = byteOffset;

    /**
     * @readonly
     * @type {Function}
     */
    this.readRowMethod = genRowReader(types, endianType);

    /**
     * @readonly
     * @type {Function}
     */
    this.writeRowMethod = genRowWriter(types, endianType);


    //generate cell readers/writers
    this.cellWriters = new Array(numTypes);
    this.cellReaders = new Array(numTypes);

    for (let i = 0; i < numTypes; i++) {
        this.cellReaders[i] = genCellReader(types[i], this.columnOffsets[i], endianType);
        this.cellWriters[i] = genCellWriter(types[i], this.columnOffsets[i], endianType);
    }
}


const cache = new Cache();

/**
 *
 * @param {DataType[]} types
 * @param {EndianType} [endianType]
 * @returns {RowFirstTableSpec}
 */
RowFirstTableSpec.get = function (types, endianType = EndianType.BigEndian) {
    //compute hash
    const hash = types.join('.') + ':' + endianType;

    const cachedValue = cache.get(hash);

    if (cachedValue !== null) {
        return cachedValue;
    }

    const newValue = new RowFirstTableSpec(types);
    cache.put(hash, newValue);

    return newValue;
};
