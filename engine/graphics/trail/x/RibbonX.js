import {
    BufferAttribute,
    BufferGeometry,
    DynamicDrawUsage,
    InterleavedBuffer,
    InterleavedBufferAttribute
} from "three";
import { RowFirstTable } from "../../../../core/collection/table/RowFirstTable.js";
import {
    RIBBON_ATTRIBUTE_ADDRESS_ALPHA,
    RIBBON_ATTRIBUTE_ADDRESS_COLOR,
    RIBBON_ATTRIBUTE_ADDRESS_OFFSET,
    RIBBON_ATTRIBUTE_ADDRESS_POSITION,
    RIBBON_ATTRIBUTE_ADDRESS_POSITION_NEXT,
    RIBBON_ATTRIBUTE_ADDRESS_POSITION_PREVIOUS,
    RIBBON_ATTRIBUTE_ADDRESS_THICKNESS,
    ribbon_attributes_spec
} from "./ribbon_attributes_spec.js";
import { assert } from "../../../../core/assert.js";


export class RibbonX {
    constructor() {

        /**
         *
         * @type {BufferGeometry}
         * @private
         */
        this.__geometry = new BufferGeometry();

        /**
         *
         * @type {RowFirstTable}
         * @private
         */
        this.__data = new RowFirstTable(ribbon_attributes_spec);


        /**
         * Index into current geometry segment that is at the END of the ribbon
         * @type {number}
         * @private
         */
        this.__tail_index = 0;

        /**
         * Index into current geometry segment that is at the START of the ribbon
         * @type {number}
         * @private
         */
        this.__head_index = 0;

        /**
         *
         * @type {number}
         * @private
         */
        this.__tail_quad_index = 0;

        /**
         * Number of segments
         * @type {number}
         * @private
         */
        this.__count = 0;
    }

    /**
     *
     * @returns {BufferGeometry}
     */
    getGeometry() {
        return this.__geometry;
    }

    /**
     *
     * @returns {number}
     */
    getCount() {
        return this.__count;
    }

    getHeadIndex() {
        return this.__head_index;
    }

    getTailIndex() {
        return this.__tail_index;
    }

    buildGeometry() {
        const a_uint8 = new Uint8Array(this.__data.data);
        const a_float32 = new Float32Array(this.__data.data);

        const bpr = this.__data.spec.bytesPerRecord;

        this.__ib_uint8 = new InterleavedBuffer(a_uint8, bpr);
        this.__ib_float32 = new InterleavedBuffer(a_float32, bpr >> 2);

        this.__iba_position = new InterleavedBufferAttribute(this.__ib_float32, 3, 1, false);

        this.__iba_position_previous = new InterleavedBufferAttribute(this.__ib_float32, 3, 7, false);
        this.__iba_position_next = new InterleavedBufferAttribute(this.__ib_float32, 3, 10, false);

        this.__iba_color = new InterleavedBufferAttribute(this.__ib_uint8, 3, 24, false);
        this.__iba_offset = new InterleavedBufferAttribute(this.__ib_uint8, 3, 27, false);

        this.__iba_uv = new InterleavedBufferAttribute(this.__ib_float32, 1, 4, false);
        this.__iba_age = new InterleavedBufferAttribute(this.__ib_float32, 1, 0, false);
        this.__iba_alpha = new InterleavedBufferAttribute(this.__ib_float32, 1, 5, false);
        this.__iba_thickness = new InterleavedBufferAttribute(this.__ib_float32, 1, 13, false);


        this.__ba_index = new BufferAttribute(new Uint16Array(0), 1, false);

        this.__geometry.setAttribute('position', this.__iba_position);
        this.__geometry.setAttribute('previous', this.__iba_position_previous);
        this.__geometry.setAttribute('next', this.__iba_position_next);

        this.__geometry.setAttribute('off', this.__iba_offset);

        this.__geometry.setAttribute('color', this.__iba_color);
        this.__geometry.setAttribute('uv_offset', this.__iba_uv);
        this.__geometry.setAttribute('age', this.__iba_age);
        this.__geometry.setAttribute('alpha', this.__iba_alpha);

        this.__geometry.setAttribute('thickness', this.__iba_thickness);


        this.__geometry.setIndex(this.__ba_index);

        // set dynamic usage on buffers
        this.__ib_uint8.setUsage(DynamicDrawUsage);
        this.__ib_float32.setUsage(DynamicDrawUsage);
        this.__ba_index.setUsage(DynamicDrawUsage);
    }

    initializeAttribute_Offset() {
        const n = this.__count * 2;

        for (let i = 0; i < n;) {

            this.__data.writeCellValue(i++, RIBBON_ATTRIBUTE_ADDRESS_OFFSET, 0);

            this.__data.writeCellValue(i++, RIBBON_ATTRIBUTE_ADDRESS_OFFSET, 1);

        }

    }

    /**
     * Build initial faces
     */
    initializeAttribute_Index() {
        const data = this.__ba_index.array;

        const n = this.__count - 1;

        for (let i = 0; i < n; i++) {
            const i6 = i * 6;

            const i2 = i * 2;

            // build up a quad

            data[i6] = i2;
            data[i6 + 1] = i2 + 1;
            data[i6 + 2] = i2 + 2;


            data[i6 + 3] = i2 + 1;
            data[i6 + 4] = i2 + 3;
            data[i6 + 5] = i2 + 2;
        }
    }

    /**
     *
     * @param {number[]} result
     * @param {number} index
     */
    getPointPosition(result, index) {
        const i2 = index * 2;

        const x = this.__data.readCellValue(i2, RIBBON_ATTRIBUTE_ADDRESS_POSITION);
        const y = this.__data.readCellValue(i2, RIBBON_ATTRIBUTE_ADDRESS_POSITION + 1);
        const z = this.__data.readCellValue(i2, RIBBON_ATTRIBUTE_ADDRESS_POSITION + 2);

        result[0] = x;
        result[1] = y;
        result[2] = z;
    }

    /**
     *
     * @param {number} point_index
     * @param {number} attribute_index
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setPointAttribute_Vector3(point_index, attribute_index, x, y, z) {
        const row_index = point_index * 2;

        const data = this.__data;

        data.writeCellValue(row_index, attribute_index, x);
        data.writeCellValue(row_index, attribute_index + 1, y);
        data.writeCellValue(row_index, attribute_index + 2, z);

        data.writeCellValue(row_index + 1, attribute_index, x);
        data.writeCellValue(row_index + 1, attribute_index + 1, y);
        data.writeCellValue(row_index + 1, attribute_index + 2, z);
    }

    /**
     *
     * @param {number} point_index
     * @param {number} attribute_index
     * @param {number} value
     */
    setPointAttribute_Scalar(point_index, attribute_index, value) {
        const row_index = point_index * 2;

        const data = this.__data;

        data.writeCellValue(row_index, attribute_index, value);
        data.writeCellValue(row_index + 1, attribute_index, value);
    }

    /**
     *
     * @param {number} point_index
     * @param {number} attribute_index
     * @param {number} delta
     * @returns {number} incremented value
     */
    incrementPointAttribute_Scalar(point_index, attribute_index, delta) {

        const row_index = point_index * 2;

        const data = this.__data;

        const original_value = data.readCellValue(row_index, attribute_index);

        const value = original_value + delta;

        data.writeCellValue(row_index, attribute_index, value);
        data.writeCellValue(row_index + 1, attribute_index, value);

        return value;
    }

    /**
     *
     * @param {number} point_index_source
     * @param {number} attribute_index_source
     * @param {number} point_index_destination
     * @param {number} attribute_destination
     */
    copyPointAttribute_Vector3(point_index_source, attribute_index_source, point_index_destination, attribute_destination) {
        const source_2 = point_index_source * 2;

        const data = this.__data;

        const x = data.readCellValue(source_2, attribute_index_source);
        const y = data.readCellValue(source_2, attribute_index_source + 1);
        const z = data.readCellValue(source_2, attribute_index_source + 2);

        this.setPointAttribute_Vector3(point_index_destination, attribute_destination, x, y, z);
    }

    setPointPosition(index, x, y, z) {
        assert.isNonNegativeInteger(index, 'index');

        // update current position
        this.setPointAttribute_Vector3(index, RIBBON_ATTRIBUTE_ADDRESS_POSITION, x, y, z);


        if (index !== this.__tail_index) {
            // update "next position" for the previous point

            const previous_index = (index + 1) % this.__count;

            this.setPointAttribute_Vector3(previous_index, RIBBON_ATTRIBUTE_ADDRESS_POSITION_NEXT, x, y, z);

            if (index === this.__head_index) {
                // special case, head

                // set next point to the same position as the current

                // compute direction
                const index_2 = previous_index * 2;

                const prev_x = this.__data.readCellValue(index_2, RIBBON_ATTRIBUTE_ADDRESS_POSITION);
                const prev_y = this.__data.readCellValue(index_2, RIBBON_ATTRIBUTE_ADDRESS_POSITION + 1);
                const prev_z = this.__data.readCellValue(index_2, RIBBON_ATTRIBUTE_ADDRESS_POSITION + 2);

                this.setPointAttribute_Vector3(index, RIBBON_ATTRIBUTE_ADDRESS_POSITION_NEXT, x * 2 - prev_x, y * 2 - prev_y, z * 2 - prev_z);
            }
        }


        // update "previous position" for the next point
        if (index !== this.__head_index) {
            let next_index;

            if (index > 0) {
                next_index = index - 1;
            } else {
                next_index = this.__count - 1;
            }

            this.setPointAttribute_Vector3(next_index, RIBBON_ATTRIBUTE_ADDRESS_POSITION_PREVIOUS, x, y, z);

            if (index === this.__tail_index) {
                // special case, tail

                // set previous point to the same position as the current

                const index_2 = next_index * 2;

                const next_x = this.__data.readCellValue(index_2, RIBBON_ATTRIBUTE_ADDRESS_POSITION);
                const next_y = this.__data.readCellValue(index_2, RIBBON_ATTRIBUTE_ADDRESS_POSITION + 1);
                const next_z = this.__data.readCellValue(index_2, RIBBON_ATTRIBUTE_ADDRESS_POSITION + 2);

                this.setPointAttribute_Vector3(index, RIBBON_ATTRIBUTE_ADDRESS_POSITION_PREVIOUS, x * 2 - next_x, y * 2 - next_y, z * 2 - next_z);
            }
        }

        this.__ib_float32.needsUpdate = true;
    }


    /**
     *
     * @param {number} index
     * @param {number} r
     * @param {number} g
     * @param {number} b
     */
    setPointColor(index, r, g, b) {
        assert.isNonNegativeInteger(index, 'index');

        this.setPointAttribute_Vector3(index, RIBBON_ATTRIBUTE_ADDRESS_COLOR, r, g, b);
    }

    setPointAlpha(index, value) {
        const i2 = index * 2;

        this.__data.writeCellValue(i2, RIBBON_ATTRIBUTE_ADDRESS_ALPHA, value);
        this.__data.writeCellValue(i2 + 1, RIBBON_ATTRIBUTE_ADDRESS_ALPHA, value);

        this.__ib_float32.needsUpdate = true;
    }


    setPointThickness(index, value) {
        const i2 = index * 2;

        this.__data.writeCellValue(i2, RIBBON_ATTRIBUTE_ADDRESS_THICKNESS, value);
        this.__data.writeCellValue(i2 + 1, RIBBON_ATTRIBUTE_ADDRESS_THICKNESS, value);

        this.__ib_float32.needsUpdate = true;
    }

    /**
     *
     * @param {number} count Number of points in the ribbon
     */
    setCount(count) {
        assert.greaterThanOrEqual(count, 2, 'number of points in the ribbon must be at least 2 (to produce at least a single quad)');
        assert.isNonNegativeInteger(count, 'count');

        const point_count = count * 2;

        this.__data.setCapacity(point_count);
        this.__data.length = point_count;

        const a_uint8 = new Uint8Array(this.__data.data);
        const a_float32 = new Float32Array(this.__data.data);

        const quad_count = count - 1;
        const triangle_count = quad_count * 2;

        const index_array_size = triangle_count * 3;
        const index_array = new Uint16Array(index_array_size);

        this.__ba_index.array = index_array;
        this.__ba_index.count = index_array_size;


        // update buffers
        this.__ib_uint8.array = a_uint8;
        this.__ib_float32.array = a_float32;

        this.__ib_uint8.count = point_count;
        this.__ib_float32.count = point_count;

        // reset start and end
        this.__head_index = 0;
        this.__tail_index = count - 1;

        this.__tail_quad_index = quad_count - 1;

        // update count
        this.__count = count;

        this.initializeAttribute_Offset();
        this.initializeAttribute_Index();
    }

    /**
     * NOTE: takes trail thickness into account
     * @param {AABB3} result
     */
    computeBoundingBox(result) {

        const n = this.getCount() * 2;

        result.setNegativelyInfiniteBounds();

        for (let i = 0; i < n; i += 2) {
            const thickness = this.__data.readCellValue(i, RIBBON_ATTRIBUTE_ADDRESS_THICKNESS);
            const half_thickness = thickness / 2;

            const x = this.__data.readCellValue(i, RIBBON_ATTRIBUTE_ADDRESS_POSITION);
            const y = this.__data.readCellValue(i, RIBBON_ATTRIBUTE_ADDRESS_POSITION + 1);
            const z = this.__data.readCellValue(i, RIBBON_ATTRIBUTE_ADDRESS_POSITION + 2);

            result._expandToFit(x - half_thickness, y - half_thickness, z - half_thickness, x + half_thickness, y + half_thickness, z + half_thickness);
        }

    }


    /**
     * Move tail of the ribbon to it's head
     */
    rotate() {
        const old_tail = this.__tail_index;
        const old_head = this.__head_index;

        const max_index = this.__count - 1;

        // remove tail and append it at the head
        if (old_tail <= 0) {
            this.__tail_index = max_index;
        } else {
            this.__tail_index = old_tail - 1;
        }

        if (old_head <= 0) {
            this.__head_index = max_index;
        } else {
            this.__head_index = old_head - 1;
        }

        const head = this.__head_index;

        // move triangles

        /**
         *
         * @type {ArrayLike<number>}
         */
        const index_array = this.__ba_index.array;

        const old_tail_quad_index = this.__tail_quad_index;
        const old_tail_quad_address = old_tail_quad_index * 6;

        if (this.__tail_quad_index > 0) {
            this.__tail_quad_index = old_tail_quad_index - 1;
        } else {
            this.__tail_quad_index = this.__count - 2;
        }

        const old_tail_index2 = old_tail * 2;
        const old_head_index2 = old_head * 2;

        index_array[old_tail_quad_address] = old_head_index2;
        index_array[old_tail_quad_address + 1] = old_head_index2 + 1;
        index_array[old_tail_quad_address + 2] = old_tail_index2;

        index_array[old_tail_quad_address + 3] = old_head_index2 + 1;
        index_array[old_tail_quad_address + 4] = old_tail_index2 + 1;
        index_array[old_tail_quad_address + 5] = old_tail_index2;

        this.__ba_index.needsUpdate = true;


        const data = this.__data;

        const prev_x = data.readCellValue(old_head_index2, RIBBON_ATTRIBUTE_ADDRESS_POSITION);
        const prev_y = data.readCellValue(old_head_index2, RIBBON_ATTRIBUTE_ADDRESS_POSITION + 1);
        const prev_z = data.readCellValue(old_head_index2, RIBBON_ATTRIBUTE_ADDRESS_POSITION + 2);

        const head_index2 = head * 2;

        const head_x = data.readCellValue(head_index2, RIBBON_ATTRIBUTE_ADDRESS_POSITION);
        const head_y = data.readCellValue(head_index2, RIBBON_ATTRIBUTE_ADDRESS_POSITION + 1);
        const head_z = data.readCellValue(head_index2, RIBBON_ATTRIBUTE_ADDRESS_POSITION + 2);

        //patch old head to point to new head
        this.setPointAttribute_Vector3(head, RIBBON_ATTRIBUTE_ADDRESS_POSITION_PREVIOUS, prev_x, prev_y, prev_z);
        this.setPointAttribute_Vector3(head, RIBBON_ATTRIBUTE_ADDRESS_POSITION_NEXT, head_x * 2 - prev_x, head_y * 2 - prev_y, head_z * 2 - prev_z);


        // patch old head to point towards new head
        this.setPointAttribute_Vector3(old_head, RIBBON_ATTRIBUTE_ADDRESS_POSITION_NEXT, head_x, head_y, head_z);

        /*
        NOTE:
            tail is not updated, even though the new tail technically should point straight back instead of pointing to
            the old tail's location, but for visual consistency we don't do this. Otherwise new tail segment would visually "snap" to the new orientation.
         */


        this.__ib_float32.needsUpdate = true;
    }
}
