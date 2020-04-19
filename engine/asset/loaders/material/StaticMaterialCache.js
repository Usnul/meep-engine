import { Cache } from "../../../../core/Cache.js";
import { computeHashArray, computeHashFloat, computeHashIntegerArray } from "../../../../core/math/MathUtils.js";
import { computeStringHash } from "../../../../core/primitives/strings/StringUtils.js";
import { TextureAttachment } from "./TextureAttachment.js";
import { TextureAttachmentsByMaterialType } from "./TextureAttachmensByMaterialType.js";
import { computeTextureHash } from "./computeTextureHash.js";
import { computeTextureEquality } from "./computeTextureEquality.js";


/**
 *
 * @param {Plane} plane
 * @returns {number}
 */
function planeHash(plane) {
    //TODO implement
    return 0;
}

/**
 *
 * @param {Plane} a
 * @param {Plane} b
 * @returns {boolean}
 */
function planesEqual(a, b) {
    return a.equals(b);
}


/**
 * @template T
 * @param {T[]} a
 * @param {T[]} b
 * @param {function(T,T):boolean} elementsEqual
 * @returns {boolean}
 */
function arraysEqual(a, b, elementsEqual) {
    if (a === b) {
        return true;
    }

    if (a === null || b === null || a === undefined || b === undefined) {
        return false
    }

    const l = a.length;
    if (l !== b.length) {
        return false;
    }

    for (let i = 0; i < l; i++) {
        const aE = a[i];
        const bE = b[i];

        if (!elementsEqual(aE, bE)) {
            return false;
        }
    }

    return true;
}


/**
 *
 * @param {Material|MeshStandardMaterial} material
 * @returns {number}
 */
export function computeMaterialHash(material) {

    let hash = computeHashIntegerArray(
        computeHashFloat(material.alphaTest),
        material.blendDst,
        material.blendDstAlpha === null ? 0 : computeHashFloat(material.blendDstAlpha),
        material.blendEquation,
        material.blendEquationAlpha === null ? 0 : computeHashFloat(material.blendEquationAlpha),
        material.blending,
        material.blendSrc,
        material.blendSrcAlpha === null ? 0 : computeHashFloat(material.blendSrcAlpha),
        material.clipIntersection ? 0 : 1,
        material.clippingPlanes === null ? 0 : computeHashArray(material.clippingPlanes, planeHash),
        material.clipShadows ? 0 : 1,
        material.colorWrite ? 0 : 1,
        material.depthFunc,
        material.depthTest ? 0 : 1,
        material.depthWrite ? 0 : 1,
        material.fog ? 0 : 1,
        material.lights ? 0 : 1,
        computeHashFloat(material.opacity),
        material.polygonOffset ? 0 : 1,
        computeHashFloat(material.polygonOffsetFactor),
        computeHashFloat(material.polygonOffsetUnits),
        computeStringHash(material.precision),
        material.premultipliedAlpha ? 0 : 1,
        material.dithering ? 0 : 1,
        material.flatShading ? 0 : 1,
        material.side,
        material.transparent ? 0 : 1,
        computeStringHash(material.type),
        material.vertexColors,
        material.vertexTangents ? 0 : 1,
        material.visible ? 0 : 1,
    );

    if (material.isMeshStandardMaterial) {
        //TODO extend hash
        hash = computeHashIntegerArray(
            hash,
            computeTextureHash(material.map),
            computeTextureHash(material.lightMap),
            computeTextureHash(material.aoMap),
            computeTextureHash(material.emissiveMap),
            computeTextureHash(material.bumpMap),
            computeTextureHash(material.normalMap),
            computeTextureHash(material.displacementMap),
            computeTextureHash(material.roughnessMap),
            computeTextureHash(material.metalnessMap),
            computeTextureHash(material.alphaMap),
            computeTextureHash(material.envMap)
        );
    }

    return hash;
}


/**
 *
 * @param {Material|MeshStandardMaterial} a
 * @param {Material|MeshStandardMaterial} b
 * @returns {boolean}
 */
export function computeMaterialEquality(a, b) {
    if (a === b) {
        return true;
    }

    if (a.type !== b.type) {
        return false;
    }

    if (
        a.alphaTest !== b.alphaTest
        || a.blendDst !== b.blendDst
        || a.blendDstAlpha !== b.blendDstAlpha
        || a.blendEquation !== b.blendEquation
        || a.blendEquationAlpha !== b.blendEquationAlpha
        || a.blending !== b.blending
        || a.blendSrc !== b.blendSrc
        || a.blendSrcAlpha !== b.blendSrcAlpha
        || a.clipIntersection !== b.clipIntersection
        || !arraysEqual(a.clippingPlanes, b.clippingPlanes, planesEqual)
        || a.clipShadows !== b.clipShadows
        || a.colorWrite !== b.colorWrite
        || a.depthFunc !== b.depthFunc
        || a.depthTest !== b.depthTest
        || a.depthWrite !== b.depthWrite
        || a.fog !== b.fog
        || a.lights !== b.lights
        || a.opacity !== b.opacity
        || a.polygonOffset !== b.polygonOffset
        || a.polygonOffsetFactor !== b.polygonOffsetFactor
        || a.polygonOffsetUnits !== b.polygonOffsetUnits
        || a.precision !== b.precision
        || a.premultipliedAlpha !== b.premultipliedAlpha
        || a.dithering !== b.dithering
        || a.flatShading !== b.flatShading
        || a.side !== b.side
        || a.transparent !== b.transparent
        || a.vertexColors !== b.vertexColors
        || a.vertexTangents !== b.vertexTangents
        || a.visible !== b.visible
    ) {
        return false;
    }

    //check "onBeforeCompile" property
    if (a.onBeforeCompile !== b.onBeforeCompile) {
        return false;
    }

    if (a.isMeshStandardMaterial) {
        if (
            !a.color.equals(b.color)
            || a.roughness !== b.roughness
            || a.metalness !== b.metalness
            || !computeTextureEquality(a.map, b.map)
            || !computeTextureEquality(a.lightMap, b.lightMap)
            || a.lightMapIntensity !== b.lightMapIntensity
            || !computeTextureEquality(a.aoMap, b.aoMap)
            || a.aoMapIntensity !== b.aoMapIntensity
            || !a.emissive.equals(b.emissive)
            || a.emissiveIntensity !== b.emissiveIntensity
            || !computeTextureEquality(a.emissiveMap, b.emissiveMap)
            || !computeTextureEquality(a.bumpMap, b.bumpMap)
            || a.bumpScale !== b.bumpScale
            || !computeTextureEquality(a.normalMap, b.normalMap)
            || a.normalMapType !== b.normalMapType
            || !a.normalScale.equals(b.normalScale)
            || !computeTextureEquality(a.displacementMap, b.displacementMap)
            || a.displacementScale !== b.displacementScale
            || a.displacementBias !== b.displacementBias
            || !computeTextureEquality(a.roughnessMap, b.roughnessMap)
            || !computeTextureEquality(a.metalnessMap, b.metalnessMap)
            || !computeTextureEquality(a.alphaMap, b.alphaMap)
            || !computeTextureEquality(a.envMap, b.envMap)
            || a.envMapIntensity !== b.envMapIntensity
            || a.refractionRatio !== b.refractionRatio
            || a.wireframe !== b.wireframe
            || a.wireframeLinewidth !== b.wireframeLinewidth
            || a.skinning !== b.skinning
            || a.morphTargets !== b.morphTargets
            || a.morphNormals !== b.morphNormals
        ) {
            return false;
        }
    } else if (a.isMeshDepthMaterial) {
        if (
            !computeTextureEquality(a.alphaMap, b.alphaMap)
            || a.depthPacking !== b.depthPacking
            || !computeTextureEquality(a.displacementMap, b.displacementMap)
            || a.displacementScale !== b.displacementScale
            || a.displacementBias !== b.displacementBias
            || !computeTextureEquality(a.map, b.map)
            || a.morphTargets !== b.morphTargets
            || a.skinning !== b.skinning
            || a.wireframe !== b.wireframe
            || a.wireframeLinewidth !== b.wireframeLinewidth
        ) {
            return false;
        }
    } else {
        //TODO implement other material types
        return false;
    }

    return true;
}


export class StaticMaterialCache {
    constructor() {

        /**
         *
         * @type {Cache<Material, Material>}
         */
        this.materialCache = new Cache({
            maxWeight: 1000,
            keyHashFunction: computeMaterialHash,
            keyEqualityFunction: computeMaterialEquality
        });

        /**
         *
         * @type {Cache<Texture, Texture>}
         */
        this.textureCache = new Cache({
            maxWeight: 1000,
            keyHashFunction: computeTextureHash,
            keyEqualityFunction: computeTextureEquality
        });
    }

    /**
     *
     * @param {Material} material
     * @returns {Material}
     */
    acquire(material) {

        const existingMaterial = this.materialCache.get(material);

        if (existingMaterial === null) {

            const textureCache = this.textureCache;

            //patch textures
            const materialType = material.type;

            /**
             *
             * @type {TextureAttachment[]}
             */
            const attachments = TextureAttachmentsByMaterialType[materialType];


            if (attachments !== undefined) {
                attachments.forEach(attachment => {

                    const texture = attachment.read(material);

                    if (texture === null || texture === undefined) {
                        return;
                    }

                    //check cache
                    const existingTexture = textureCache.get(texture);

                    if (existingTexture !== null) {

                        //console.log('Re-using texture', existingTexture);

                        attachment.write(material, existingTexture);

                    } else {

                        //texture was not in cache, cache it
                        textureCache.put(texture, texture);

                    }

                });
            }

            //doesn't exist, add
            this.materialCache.put(material, material);

            // console.log("Unique Material:", material);

            return material;
        } else {
            //console.log("Re-used Material:", existingMaterial);
            return existingMaterial;
        }
    }
}

/**
 * Global singleton
 * @readonly
 * @type {StaticMaterialCache}
 */
StaticMaterialCache.Global = new StaticMaterialCache();
