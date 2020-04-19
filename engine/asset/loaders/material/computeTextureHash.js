import { computeHashFloat, computeHashIntegerArray } from "../../../../core/math/MathUtils.js";

/**
 *
 * @param {Vector2} v
 * @return {number}
 */
function vector2Hash(v) {
    const x = computeHashFloat(v.x);
    const y = computeHashFloat(v.y);
    return ((x << 5) - x) + y;
}

/**
 *
 * @param {Texture} texture
 * @return {number}
 */
function computeSpecificHash(texture) {
    let width = 0;
    let height = 0;

    let dataHash = 0;

    if (texture.image !== null && texture.image !== undefined) {

        const image = texture.image;

        if (typeof image.width === "number") {
            width = image.width;
        }

        if (typeof image.height === "number") {
            height = image.height;
        }


    }

    const mipmaps = texture.mipmaps;

    if (Array.isArray(mipmaps)) {
        const nMipmaps = mipmaps.length;

        for (let i = 0; i < nMipmaps; i++) {
            const mipmap = mipmaps[i];

            if (mipmap.width > 16) {
                continue;
            }

            const data = mipmap.data;

            const dataSize = data.length;

            for (let i = 0; i < dataSize; i++) {
                const datum = data[i];

                dataHash = ((dataHash << 5) - dataHash) + datum;
            }

            break;
        }

    }

    return computeHashIntegerArray(width, height, dataHash);
}

/**
 *
 * @param {Texture} t
 * @returns {number}
 */
export function computeTextureHash(t) {
    if (t === null) {
        return 0;
    }

    if (t === undefined) {
        return 0;
    }

    const specificHash = computeSpecificHash(t);

    return computeHashIntegerArray(
        t.mapping,
        t.wrapS,
        t.wrapT,
        t.magFilter,
        t.minFilter,
        t.anisotropy,
        t.format,
        t.type,
        vector2Hash(t.offset),
        vector2Hash(t.repeat),
        vector2Hash(t.center),
        computeHashFloat(t.rotation),
        t.generateMipmaps ? 1 : 0,
        t.premultiplyAlpha ? 1 : 0,
        t.flipY ? 1 : 0,
        t.unpackAlignment,
        t.encoding,
        specificHash
    );
}
