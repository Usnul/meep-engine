import { RowFirstTableSpec } from "../../../../core/collection/table/RowFirstTableSpec.js";
import { DataType } from "../../../../core/collection/table/DataType.js";
import { EndianType } from "../../../../core/binary/BinaryBuffer.js";

export const ribbon_attributes_spec = new RowFirstTableSpec([
    // age
    DataType.Float32,

    // position
    DataType.Float32,
    DataType.Float32,
    DataType.Float32,

    // UV (uv is recorded as a single coordinate)
    DataType.Float32,

    // alpha
    DataType.Float32,

    // color
    DataType.Uint8,
    DataType.Uint8,
    DataType.Uint8,

    // Offset attribute
    DataType.Uint8,

    // Previous point
    DataType.Float32,
    DataType.Float32,
    DataType.Float32,

    // Next point
    DataType.Float32,
    DataType.Float32,
    DataType.Float32,

    // thickness
    DataType.Float32,

], EndianType.LittleEndian);


export const RIBBON_ATTRIBUTE_ADDRESS_POSITION = 1;
export const RIBBON_ATTRIBUTE_ADDRESS_POSITION_PREVIOUS = 10;
export const RIBBON_ATTRIBUTE_ADDRESS_POSITION_NEXT = 13;
export const RIBBON_ATTRIBUTE_ADDRESS_ALPHA = 5;
export const RIBBON_ATTRIBUTE_ADDRESS_COLOR = 6;
export const RIBBON_ATTRIBUTE_ADDRESS_OFFSET = 9;
export const RIBBON_ATTRIBUTE_ADDRESS_THICKNESS = 16;
