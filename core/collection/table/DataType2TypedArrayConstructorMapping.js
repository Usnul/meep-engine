import { DataType } from "./DataType.js";


/**
 * Mapping from {@DataType} to TypedArray constructors
 * @enum {function}
 */
export const DataType2TypedArrayConstructorMapping = {
    [DataType.Uint8]: Uint8Array,
    [DataType.Uint16]: Uint16Array,
    [DataType.Uint32]: Uint32Array,
    [DataType.Int8]: Int8Array,
    [DataType.Int16]: Int16Array,
    [DataType.Int32]: Int32Array,
    [DataType.Float32]: Float32Array,
    [DataType.Float64]: Float64Array,
}
