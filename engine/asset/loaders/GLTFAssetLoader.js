import { Asset } from "../Asset.js";
import ThreeFactory, { prepareMaterial, prepareObject } from "../../graphics/three/ThreeFactory.js";
import {
    computeSkinnedMeshBoundingVolumes,
    ensureGeometryBoundingBox,
    ensureGeometryBoundingSphere
} from "../../graphics/Utils.js";
import { BoneMapping } from "../../graphics/ecs/mesh/skeleton/BoneMapping.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Vector3 from "../../../core/geom/Vector3.js";
import { max2 } from "../../../core/math/MathUtils.js";
import Vector4 from "../../../core/geom/Vector4.js";
import { three_computeObjectBoundingBox } from "../../ecs/systems/RenderSystem.js";
import { AABB3 } from "../../../core/bvh2/AABB3.js";
import { StaticMaterialCache } from "./material/StaticMaterialCache.js";
import { DDSLoader } from "three/examples/jsm/loaders/DDSLoader.js";
import { AnimationOptimizer } from "../../ecs/animation/AnimationOptimizer.js";
import { rootObject3DFastMatrixUpdate } from "../../graphics/ecs/mesh/MeshSystem.js";
import { MeshDepthMaterial, RGBADepthPacking } from "three";
import { TextureAttachmentsByMaterialType } from "./material/TextureAttachmensByMaterialType.js";
import { AssetLoader } from "./AssetLoader.js";

const animationOptimizer = new AnimationOptimizer();
const materialCache = StaticMaterialCache.Global;

/**
 *
 * @param {Object3D} a
 * @param {Object3D} b
 * @param {function(Object3D, Object3D)} callback
 */
function parallelTraverse(a, b, callback) {

    callback(a, b);

    for (var i = 0; i < a.children.length; i++) {

        parallelTraverse(a.children[i], b.children[i], callback);

    }

}

/**
 *
 * @param {Object3D} source
 * @return {Object3D}
 */
export function cloneObject3D(source) {
    var sourceLookup = new Map();
    var cloneLookup = new Map();

    var clone = source.clone();

    parallelTraverse(source, clone, function (sourceNode, clonedNode) {

        sourceLookup.set(clonedNode, sourceNode);
        cloneLookup.set(sourceNode, clonedNode);

    });

    clone.traverse(function (node) {
        if (!node.isMesh) {
            return;
        }

        var clonedMesh = node;
        var sourceMesh = sourceLookup.get(node);

        //copy custom depth material
        if (sourceMesh.customDepthMaterial !== undefined) {
            clonedMesh.customDepthMaterial = sourceMesh.customDepthMaterial;
        }

        if (!node.isSkinnedMesh) {
            return;
        }

        var sourceBones = sourceMesh.skeleton.bones;

        clonedMesh.skeleton = sourceMesh.skeleton.clone();
        clonedMesh.bindMatrix.copy(sourceMesh.bindMatrix);

        clonedMesh.skeleton.bones = sourceBones.map(function (bone) {

            return cloneLookup.get(bone);

        });

        clonedMesh.bind(clonedMesh.skeleton, clonedMesh.bindMatrix);

    });

    return clone;
}


/**
 *
 * @param {Material} material
 */
function enhanceTextures(material) {

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

            //enable anisotropic filtering
            texture.anisotropy = 8;
        });
    }
}


const loader = new GLTFLoader();

loader.setDDSLoader(new DDSLoader());

export class GLTFAssetLoader extends AssetLoader{
    load(path, success, failure, progress) {

        /**
         *
         * @param {Object3D|Mesh|SkinnedMesh} o
         * @returns {boolean}
         */
        function isMesh(o) {
            return o.isMesh || o.isSkinnedMesh;
        }

        function processMesh(mesh) {
            const geometry = mesh.geometry;

            if (geometry === undefined) {
                throw new Error(`No geometry found`);
            }

            prepareMaterial(mesh.material);

            enhanceTextures(mesh.material);

            //re-write material with a cached one if possible to reduce draw calls and texture unit usage
            mesh.material = materialCache.acquire(mesh.material);


            //if material uses alpha testing, we need a custom depth material for shadows to look right
            if (mesh.material.alphaTest !== 0) {

                const depthMaterial = new MeshDepthMaterial({
                    depthPacking: RGBADepthPacking,
                    map: mesh.material.map,
                    alphaTest: mesh.material.alphaTest
                });

                if (mesh.skinning) {
                    depthMaterial.skinning = true;
                }

                mesh.customDepthMaterial = materialCache.acquire(depthMaterial);
            }

            const material = mesh.material;

            ThreeFactory.prepareMaterial(material);

            const isSkinned = material.skinning;

            /**
             *
             * @type {BoneMapping}
             */
            let boneMapping = null;

            if (isSkinned) {
                boneMapping = new BoneMapping();

                const boneNames = mesh.skeleton.bones.map(function (bone) {
                    return bone.name;
                });

                // this used to be done inside SkinnedMesh constructor in thee.js prior to r99
                mesh.normalizeSkinWeights();

                boneMapping.build(boneNames);

                //compute bounding box and sphere for the mesh, do it using the skeleton data
                computeSkinnedMeshBoundingVolumes(mesh);


            } else {

                ensureGeometryBoundingBox(geometry);
                ensureGeometryBoundingSphere(geometry);
            }
        }

        /**
         *
         * @param {Object3D} o
         */
        function computeObjectBoundingSphere(o) {
            /*
            TODO: There are better ways of doing this:
            https://github.com/CGAL/cgal/blob/c68cf8fc4c850f8cd84c6900faa781286a7117ed/Bounding_volumes/include/CGAL/Min_sphere_of_spheres_d/Min_sphere_of_spheres_d_impl.h
            */

            /**
             *
             * @type {Sphere[]}
             */
            const balls = [];

            rootObject3DFastMatrixUpdate(o);

            o.traverse(m => {
                if (isMesh(m)) {
                    const geometry = m.geometry;

                    const sphere = geometry.boundingSphere.clone();

                    if (m !== o) {
                        sphere.applyMatrix4(m.matrixWorld);
                    }

                    balls.push(sphere);
                }
            });

            const center = new Vector3();

            const numBalls = balls.length;
            for (let i = 0; i < numBalls; i++) {
                const sphere = balls[i];
                center.add(sphere.center);
            }

            if (numBalls > 0) {
                center.multiplyScalar(1 / numBalls);
            }

            let radius = 0;

            for (let i = 0; i < numBalls; i++) {
                const sphere = balls[i];

                radius = max2(radius, center.distanceTo(sphere.center) + sphere.radius);
            }

            o.boundingSphere = new Vector4(
                center.x,
                center.y,
                center.z,
                radius
            );
        }


        loader.load(path, function (gltf) {
            const scene = gltf.scene;

            scene.updateMatrixWorld();

            /**
             * {Array.<THREE.Object3D>}
             */
            const children = scene.children;

            if (children.length === 0) {
                failure("Scene is empty");
                return;
            }

            //find a child that is a mesh
            let root = scene.children.find(isMesh);

            if (root === undefined) {
                //use the whole scene
                root = scene;
            }


            // clear transform on the root element
            root.position.set(0, 0, 0);
            root.rotation.set(0, 0, 0);
            root.scale.set(1, 1, 1);

            root.traverse(o => {
                o.updateMatrix();

                prepareObject(o);

                if (isMesh(o)) {
                    processMesh(o);
                }
            });


            // compute object bounding sphere
            computeObjectBoundingSphere(root);

            // compute bounding box
            const boundingBox = new AABB3(0, 0, 0, 0, 0, 0);
            three_computeObjectBoundingBox(root, boundingBox);

            function assetFactory() {
                const result = cloneObject3D(root);

                result.castShadow = true;
                result.receiveShadow = false;

                if (asset.animations !== undefined) {
                    //animations are present
                    result.animations = asset.animations;
                }

                // Copy bounding sphere
                result.boundingSphere = root.boundingSphere;

                return result;
            }

            const byteSize = 1;

            const asset = new Asset(assetFactory, byteSize);
            asset.boundingBox = boundingBox;

            if (gltf.animations !== undefined) {
                /**
                 *
                 * @type {AnimationClip[]}
                 */
                const animations = gltf.animations;

                //validate and optimize animations
                animations.forEach(function (animation) {
                    if (animation.validate()) {
                        animationOptimizer.optimize(animation);
                    }
                });

                asset.animations = animations;
            }


            success(asset);
        }, function (xhr) {
            //dispatch progress callback
            progress(xhr.loaded, xhr.total);
        }, failure);
    }
}
