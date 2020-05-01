import { Sampler2D } from "../../engine/graphics/texture/sampler/Sampler2D.js";
import AABB2 from "../../core/geom/AABB2.js";
import { computeUnsignedDistanceField } from "../../engine/graphics/texture/sampler/distanceField.js";

export class AreaMask {
    constructor() {
        /**
         *
         * @type {Sampler2D}
         */
        this.mask = Sampler2D.uint8(1, 1, 1);
        /**
         *
         * @type {Sampler2D}
         */
        this.distanceField = Sampler2D.uint8(1, 1, 1);
        /**
         *
         * @type {AABB2}
         */
        this.bounds = new AABB2(0, 0, 0, 0);
    }

    /**
     *
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        this.mask.resize(width, height);
        this.distanceField.resize(width, height);
    }

    updateDistanceField() {
        computeUnsignedDistanceField(this.mask, this.distanceField, 1);
    }

    updateBounds() {
        this.bounds.setNegativelyInfiniteBounds();

        const w = this.mask.width;
        const h = this.mask.height;

        const maskData = this.mask.data;

        for (let y = 0; y < h; y++) {
            const rowIndex = y * w;

            for (let x = 0; x < w; x++) {

                const index = rowIndex + x;
                const maskValue = maskData[index];

                if (maskValue > 0) {
                    this.bounds._expandToFitPoint(x, y);
                }
            }

        }
    }
}
