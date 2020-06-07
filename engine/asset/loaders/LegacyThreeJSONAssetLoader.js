import { AssetLoader } from "./AssetLoader.js";
import { LegacyJSONLoader } from "../../graphics/loader/threejs/LegacyJSONLoader.js";
import { MultiMaterial as ThreeMultiMaterial } from "three/src/Three.Legacy.js";
import ThreeFactory from "../../graphics/three/ThreeFactory.js";
import { BufferGeometry, Geometry } from "three";
import { Asset } from "../Asset.js";
import checkerTexture from "../../graphics/texture/CheckersTexture.js";
import { MeshLambertMaterial as ThreeMeshLambertMaterial } from "three/src/materials/MeshLambertMaterial.js";

/**
 *
 * @param  {Geometry|BufferGeometry} geometry
 * @returns {boolean}
 */
function isSkinnedGeometry(geometry) {
    return geometry.skinIndices !== void 0 && geometry.skinIndices.length > 0;
}

const placeholderTexture = checkerTexture.create();

const placeholderMaterial = new ThreeMeshLambertMaterial({ map: placeholderTexture });

export class LegacyThreeJSONAssetLoader extends AssetLoader {
    load(path, success, failure, progress) {

        console.warn(`JSON loader is deprecated. Attempting to load model '${path}'`);

        const loader = new LegacyJSONLoader();

        loader.load(path, function (geometry, materials) {
            //is it skinned?
            const isSkinned = isSkinnedGeometry(geometry);
            if (materials === undefined) {
                materials = [
                    placeholderMaterial
                ];
            }
            if (isSkinned) {
                materials.forEach(function (material) {
                    material.skinning = true;
                });
            }
            //check for transparent materials
            materials.forEach(function (material) {
                if (material.opacity <= 0) {
                    console.warn("Fully transparent material " + material + " of model " + path);
                }
                //fix shininess of 0
                if (material.shininess !== undefined && material.shininess <= 0) {
                    //see https://github.com/mrdoob/three.js/pull/8429/files
                    material.shininess = 1e-4;
                    material.needsUpdate = true;
                }
            });
            let faceMaterial = null;

            if (materials.length === 1) {
                faceMaterial = materials[0];
            } else {
                console.log(path, ' uses MultiMaterial', materials);
                faceMaterial = new ThreeMultiMaterial(materials);
            }

            ThreeFactory.prepareMaterial(faceMaterial);

            let bufferGeometry;
            if (geometry instanceof BufferGeometry) {
                bufferGeometry = geometry;
            } else if (geometry instanceof Geometry) {
                //Convert plain old geometry to a BufferGeometry for better performance
                bufferGeometry = new BufferGeometry();
                bufferGeometry.fromGeometry(geometry);
                if (geometry.animations !== undefined) {
                    bufferGeometry.animations = geometry.animations;
                }
                if (geometry.bones !== undefined) {
                    bufferGeometry.bones = geometry.bones;
                }
            } else {
                throw new Error(`Unexpected geometry type`);
            }

            bufferGeometry.computeBoundingSphere();
            bufferGeometry.computeBoundingBox();

            const asset = new Asset(function () {
                let mesh;
                if (isSkinned) {
                    mesh = ThreeFactory.createSkinnedMesh(bufferGeometry, faceMaterial);
                } else {
                    mesh = ThreeFactory.createMesh(bufferGeometry, faceMaterial);
                }
                mesh.castShadow = true;
                mesh.receiveShadow = false;
                //
                return mesh;
            }, 1);

            success(asset);
        }, progress, failure);
    }
}
