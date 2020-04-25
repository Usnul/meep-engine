import { assert } from "../../../../core/assert.js";
import Vector4 from "../../../../core/geom/Vector4.js";

/**
 *
 * @param {Sampler2D} source
 * @param {Sampler2D} target
 */
export function scaleSampler2D(source, target) {
    assert.equal(source.itemSize, target.itemSize, 'both source and target must have the same number of channels');

    const targetWidth = target.width;
    const targetHeight = target.height;
    if (source.width === targetWidth && source.height === targetHeight) {
        // exact size match
        target.data.set(source.data);
        return;
    }

    const sample = new Vector4();

    if(source.itemSize === 1){

        for (let y = 0; y < targetHeight; y++) {

            const v = y / targetHeight;

            for (let x = 0; x < targetWidth; x++) {

                const u = x / targetWidth;

                const value = source.sample(u, v, sample);

                target.set(x, y, [value]);

            }
        }
    }else {

        for (let y = 0; y < targetHeight; y++) {

            const v = y / targetHeight;

            for (let x = 0; x < targetWidth; x++) {

                const u = x / targetWidth;

                source.sample(u, v, sample);

                target.set(x, y, [sample.x, sample.y, sample.z, sample.w]);

            }
        }
    }
}
