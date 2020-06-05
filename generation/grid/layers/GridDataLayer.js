import Vector2 from "../../../core/geom/Vector2.js";
import { assert } from "../../../core/assert.js";
import { DataType } from "../../../core/collection/table/DataType.js";
import { DataType2TypedArrayConstructorMapping } from "../../../core/collection/table/DataType2TypedArrayConstructorMapping.js";
import { Sampler2D } from "../../../engine/graphics/texture/sampler/Sampler2D.js";

export class GridDataLayer {
    constructor() {
        /**
         * Unique ID to reference the layer
         * @type {string}
         */
        this.id = "";

        /**
         * Relationship between size and number of cells in the sampler, higher resolution means more cells in the sampler
         * @type {number}
         */
        this.resolution = 1;

        /**
         *
         * @type {Sampler2D}
         */
        this.sampler = new Sampler2D([], 1, 0, 0);

        /**
         *
         * @type {Vector2}
         */
        this.size = new Vector2(1, 1);
    }

    /**
     *
     * @param {string} id
     * @param {DataType} type
     * @param {number} [resolution=1]
     */
    static from(id, type, resolution = 1) {
        assert.typeOf(id, 'string', 'id');
        assert.enum(type, DataType, 'type');
        assert.isNumber(resolution, 'resolution');

        const TypedArrayConstructor = DataType2TypedArrayConstructorMapping[type];

        if (TypedArrayConstructor === undefined) {
            throw Error(`No array constructor found for type '${type}'`);
        }

        const layer = new GridDataLayer();

        layer.sampler.data = new TypedArrayConstructor();

        layer.resolution = resolution;

        layer.id = id;

        return layer;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     */
    resize(x, y) {
        if (this.size.x === x && this.size.y === y) {
            //do nothing, already right size
            return;
        }

        this.size.set(x, y);

        this.sampler.resize(x * this.resolution, y * this.resolution);
    }

}

/**
 * @readonly
 * @type {boolean}
 */
GridDataLayer.prototype.isGridDataLayer = true;
