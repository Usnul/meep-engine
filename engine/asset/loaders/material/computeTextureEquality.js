/**
 *
 * @param {Texture} a
 * @param {Texture} b
 * @returns {boolean}
 */
export function computeTextureEquality(a, b) {
    if (a === b) {
        return true;
    }

    if (a === null || b === null || a === undefined || b === undefined) {
        return false
    }

    if (
        !textureImagesEqual(a.image, b.image)
        || a.mapping !== b.mapping
        || a.wrapS !== b.wrapS
        || a.wrapT !== b.wrapT
        || a.magFilter !== b.magFilter
        || a.minFilter !== b.minFilter
        || a.anisotropy !== b.anisotropy
        || a.format !== b.format
        || a.type !== b.type
        || !a.offset.equals(b.offset)
        || !a.repeat.equals(b.repeat)
        || !a.center.equals(b.center)
        || a.rotation !== b.rotation
        || a.generateMipmaps !== b.generateMipmaps
        || a.premultiplyAlpha !== b.premultiplyAlpha
        || a.flipY !== b.flipY
        || a.unpackAlignment !== b.unpackAlignment
        || a.encoding !== b.encoding
    ) {
        return false;
    }


    if (a.isCompressedTexture && b.isCompressedTexture) {
        const aMipmaps = a.mipmaps;
        const bMipmaps = b.mipmaps;

        const n = aMipmaps.length;
        if (n !== bMipmaps.length) {
            return false;
        }

        for (let i = 0; i < n; i++) {
            const aMipmap = aMipmaps[i];
            const bMipmap = bMipmaps[i];

            if (!textureMipmapEqual(aMipmap, bMipmap)) {
                return false;
            }
        }
    }

    //TODO implement support for other texture types
    return true;
}


/**
 *
 * @param {Image|[]} a
 * @param {Image|[]} b
 * @returns {boolean}
 */
function textureImagesEqual(a, b) {
    if (a instanceof Image && b instanceof Image) {
        //both are images
        if (a.src === b.src) {
            //same source
            return true;
        }
    }

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }

        for (let i = 0; i < a.length; i++) {
            const ai = a[i];
            const bi = b[i];

            if (ai.format !== bi.format) {
                return false;
            }

            const aMipmaps = ai.mipmaps;
            const bMipmaps = bi.mipmaps;

            //TODO should we ignore mipmaps if they are absent?
            if (aMipmaps === undefined) {
                if (bMipmaps === undefined) {
                    continue;
                } else {
                    return false;
                }
            } else if (bMipmaps === undefined) {
                return false;
            }

            for (let j = 0; j < aMipmaps.length; j++) {
                const aMipmap = aMipmaps[j];
                const bMipmap = bMipmaps[j];

                /**
                 * @type {Uint8Array}
                 */
                const aData = aMipmap.data;

                /**
                 * @type {Uint8Array}
                 */
                const bData = bMipmap.data;

                const dataLength = aData.length;
                if (dataLength !== bData.length) {
                    return false;
                }


                for (let k = 0; k < dataLength; k++) {
                    if (aData[k] !== bData[k]) {
                        return false;
                    }
                }
            }
        }

        //array images are equivalent
        return true;
    }

    return false;
}


/**
 *
 * @param {{data:Uint8Array, width:number, height:number}} a
 * @param {{data:Uint8Array, width:number, height:number}} b
 * @returns {boolean}
 */
function textureMipmapEqual(a, b) {
    if (a.width !== b.width) {
        return false;
    }

    if (a.height !== b.width) {
        return false;
    }

    const aData = a.data;
    const bData = b.data;

    const n = aData.length;
    if (bData.length !== n) {
        return false;
    }

    for (let i = 0; i < n; i++) {
        if (aData[i] !== bData[i]) {
            return false;
        }
    }

    return true;
}
