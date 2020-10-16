/**
 * Created by Alex on 09/03/2016.
 */
import Vector2 from "../../core/geom/Vector2.js";
import {
    AmbientLight as ThreeAmbientLight,
    Box3,
    DirectionalLight as ThreeDirectionalLight,
    LinearFilter,
    Matrix4 as ThreeMatrix4,
    PerspectiveCamera as ThreePerspectiveCamera,
    RGBAFormat,
    Scene as ThreeScene,
    Sphere as ThreeSphere,
    Vector3 as ThreeVector3,
    WebGLRenderTarget
} from 'three';

import { WebGLRendererPool } from "./render/RendererPool.js";
import Vector4, { v4_applyMatrix4 } from "../../core/geom/Vector4.js";
import Vector3, { v3_dot } from "../../core/geom/Vector3.js";
import { assert } from "../../core/assert.js";
import { Miniball } from "../../core/geom/packing/miniball/Miniball.js";
import { PointSet } from "../../core/geom/packing/miniball/PointSet.js";
import { AABB3 } from "../../core/bvh2/AABB3.js";
import { rootObject3DFastMatrixUpdate } from "./ecs/mesh/MeshSystem.js";

/**
 *
 * @param {Element} element
 * @returns {Promise}
 */
export function launchElementIntoFullscreen(element) {
    if (element.requestFullscreen) {
        return element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        return element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
        return element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        return element.msRequestFullscreen();
    }
}

/**
 *
 * @param {Matrix4} result
 * @param {Vector3} position
 * @param {Quaternion} rotation
 * @param {Vector3} scale
 */
export function composeMatrix4(result, position, rotation, scale) {
    const te = result.elements;

    const x = rotation.x, y = rotation.y, z = rotation.z, w = rotation.w;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;

    const sx = scale.x, sy = scale.y, sz = scale.z;

    te[0] = (1 - (yy + zz)) * sx;
    te[1] = (xy + wz) * sx;
    te[2] = (xz - wy) * sx;
    te[3] = 0;

    te[4] = (xy - wz) * sy;
    te[5] = (1 - (xx + zz)) * sy;
    te[6] = (yz + wx) * sy;
    te[7] = 0;

    te[8] = (xz + wy) * sz;
    te[9] = (yz - wx) * sz;
    te[10] = (1 - (xx + yy)) * sz;
    te[11] = 0;

    te[12] = position.x;
    te[13] = position.y;
    te[14] = position.z;
    te[15] = 1;
}

/**
 *
 * @param {Matrix4} result
 * @param {Quaternion} rotation
 * @param {Vector3} scale
 */
export function composeMatrix4RotationScale(result, rotation, scale) {
    const te = result.elements;

    const x = rotation.x, y = rotation.y, z = rotation.z, w = rotation.w;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;

    const sx = scale.x, sy = scale.y, sz = scale.z;

    te[0] = (1 - (yy + zz)) * sx;
    te[1] = (xy + wz) * sx;
    te[2] = (xz - wy) * sx;
    te[3] = 0;

    te[4] = (xy - wz) * sy;
    te[5] = (1 - (xx + zz)) * sy;
    te[6] = (yz + wx) * sy;
    te[7] = 0;

    te[8] = (xz + wy) * sz;
    te[9] = (yz - wx) * sz;
    te[10] = (1 - (xx + yy)) * sz;
    te[11] = 0;

    te[12] = 0;
    te[13] = 0;
    te[14] = 0;
    te[15] = 1;
}


/**
 *
 * @param {Float32Array} data
 * @param {AABB3} aabb
 */
export function computeBoundingBoxFromVertexData(data, aabb) {
    aabb.setNegativelyInfiniteBounds();

    let i = 0;
    while (i < data.length) {
        const x = data[i++];
        const y = data[i++];
        const z = data[i++];

        aabb._expandToFitPoint(x, y, z);
    }
}

/**
 *
 * @param {Float32Array} data
 * @param {Vector4} result
 */
export function computeBoundingSphereFromVertexData(data, result) {


    const pointSet = new PointSet(data.length / 3, 3, data);
    const miniball = new Miniball(pointSet);
    const aCenter = miniball.center();
    const radius = miniball.radius();

    result.set(aCenter[0], aCenter[1], aCenter[2], radius);

}

/**
 *
 * @param {SkinnedMesh} mesh
 */
export function computeSkinnedMeshBoundingVolumes(mesh) {
    const geometry = mesh.geometry;

    const aPosition = geometry.attributes.position;

    const vertices = new Float32Array(aPosition.count * aPosition.itemSize);

    computeSkinnedMeshVertices(vertices, mesh);

    const aabb3 = new AABB3(0, 0, 0, 0, 0, 0);
    const sphere = new Vector4();

    computeBoundingBoxFromVertexData(vertices, aabb3);
    computeBoundingSphereFromVertexData(vertices, sphere);

    geometry.boundingBox = new Box3(new ThreeVector3(aabb3.x0, aabb3.y0, aabb3.z0), new ThreeVector3(aabb3.x1, aabb3.y1, aabb3.z1));
    geometry.boundingSphere = new ThreeSphere(new Vector3(sphere.x, sphere.y, sphere.z), sphere.w);
}


/**
 * NOTE: the method is completely completely inlined for better performance. 0 function calls within the skinning loop
 * @param {Float32Array} destination Skinned vertex positions
 * @param {SkinnedMesh} mesh
 * @param {number} [destination_offset=0]
 */
export function computeSkinnedMeshVertices(destination, mesh, destination_offset = 0) {
    const geometry = mesh.geometry;
    const skeleton = mesh.skeleton;

    const tempMatrix = new ThreeMatrix4();

    const attributes = geometry.attributes;

    const positions = attributes.position.array;
    const skinIndicesArray = attributes.skinIndex.array;
    const skinWeightsArray = attributes.skinWeight.array;

    const vertexCount = attributes.position.count;

    const boneCount = skeleton.bones.length;

    //pre-build transform matricies for bones
    const boneMatrixData = new Float32Array(boneCount * 12);

    for (let boneIndex = 0; boneIndex < boneCount; boneIndex++) {
        const targetIndex = boneIndex * 12;

        tempMatrix.multiplyMatrices(skeleton.bones[boneIndex].matrixWorld, skeleton.boneInverses[boneIndex]);

        const el = tempMatrix.elements;

        //write matrix data in transposed form, to conform to access order when applied to Vector3 transformation
        boneMatrixData[targetIndex] = el[0];
        boneMatrixData[targetIndex + 1] = el[4];
        boneMatrixData[targetIndex + 2] = el[8];
        boneMatrixData[targetIndex + 3] = el[12];

        boneMatrixData[targetIndex + 4] = el[1];
        boneMatrixData[targetIndex + 5] = el[5];
        boneMatrixData[targetIndex + 6] = el[9];
        boneMatrixData[targetIndex + 7] = el[13];

        boneMatrixData[targetIndex + 8] = el[2];
        boneMatrixData[targetIndex + 9] = el[6];
        boneMatrixData[targetIndex + 10] = el[10];
        boneMatrixData[targetIndex + 11] = el[14];
    }

    const m4_bind = mesh.bindMatrix.elements;

    const m4_bind_0 = m4_bind[0];
    const m4_bind_1 = m4_bind[1];
    const m4_bind_2 = m4_bind[2];
    const m4_bind_4 = m4_bind[4];
    const m4_bing_5 = m4_bind[5];
    const m4_bing_6 = m4_bind[6];
    const m4_bing_8 = m4_bind[8];
    const m4_bing_9 = m4_bind[9];
    const m4_bing_10 = m4_bind[10];
    const m4_bing_12 = m4_bind[12];
    const m4_bing_13 = m4_bind[13];
    const m4_bing_14 = m4_bind[14];

    const m4_bind_inv = mesh.bindMatrixInverse.elements;

    const m4_bind_inv_0 = m4_bind_inv[0];
    const m4_bind_inv_1 = m4_bind_inv[1];
    const m4_bind_inv_2 = m4_bind_inv[2];
    const m4_bind_inv_4 = m4_bind_inv[4];
    const m4_bind_inv_5 = m4_bind_inv[5];
    const m4_bind_inv_6 = m4_bind_inv[6];
    const m4_bind_inv_8 = m4_bind_inv[8];
    const m4_bind_inv_9 = m4_bind_inv[9];
    const m4_bind_inv_10 = m4_bind_inv[10];
    const m4_bind_inv_12 = m4_bind_inv[12];
    const m4_bind_inv_13 = m4_bind_inv[13];
    const m4_bind_inv_14 = m4_bind_inv[14];

    let index, i, x, y, z;

    for (index = 0; index < vertexCount; index++) {

        const index3 = index * 3;
        const index4 = index << 2;

        //read vertex position
        const px = positions[index3];
        const py = positions[index3 + 1];
        const pz = positions[index3 + 2];

        //apply bind matrix transform to vertex
        const bx = m4_bind_0 * px + m4_bind_4 * py + m4_bing_8 * pz + m4_bing_12;
        const by = m4_bind_1 * px + m4_bing_5 * py + m4_bing_9 * pz + m4_bing_13;
        const bz = m4_bind_2 * px + m4_bing_6 * py + m4_bing_10 * pz + m4_bing_14;

        x = 0;
        y = 0;
        z = 0;

        for (i = 0; i < 4; i++) {
            const skinIndex = index4 + i;

            const skinWeight = skinWeightsArray[skinIndex];

            if (skinWeight !== 0) {

                const boneIndex = skinIndicesArray[skinIndex];

                const bdIndex = boneIndex * 12;

                const sx = boneMatrixData[bdIndex] * bx + boneMatrixData[bdIndex + 1] * by + boneMatrixData[bdIndex + 2] * bz + boneMatrixData[bdIndex + 3];
                const sy = boneMatrixData[bdIndex + 4] * bx + boneMatrixData[bdIndex + 5] * by + boneMatrixData[bdIndex + 6] * bz + boneMatrixData[bdIndex + 7];
                const sz = boneMatrixData[bdIndex + 8] * bx + boneMatrixData[bdIndex + 9] * by + boneMatrixData[bdIndex + 10] * bz + boneMatrixData[bdIndex + 11];

                const tx = sx * skinWeight;
                const ty = sy * skinWeight;
                const tz = sz * skinWeight;

                x += tx;
                y += ty;
                z += tz;

            }
        }

        //apply inverse bind matrix
        const wx = m4_bind_inv_0 * x + m4_bind_inv_4 * y + m4_bind_inv_8 * z + m4_bind_inv_12;
        const wy = m4_bind_inv_1 * x + m4_bind_inv_5 * y + m4_bind_inv_9 * z + m4_bind_inv_13;
        const wz = m4_bind_inv_2 * x + m4_bind_inv_6 * y + m4_bind_inv_10 * z + m4_bind_inv_14;

        const destination_address = destination_offset + index3;

        destination[destination_address] = wx;
        destination[destination_address + 1] = wy;
        destination[destination_address + 2] = wz;
    }
}

/**
 *
 * @param {BufferGeometry|Geometry} geometry
 * @returns {Box3|ThreeBox3}
 */
function ensureGeometryBoundingBox(geometry) {
    let boundingBox = geometry.boundingBox;

    if (boundingBox === null || boundingBox === undefined) {
        geometry.computeBoundingBox();
        boundingBox = geometry.boundingBox;
    }

    return boundingBox;
}

/**
 *
 * @param {BufferGeometry} geometry
 * @returns {Sphere}
 */
export function ensureGeometryBoundingSphere(geometry) {
    let boundingSphere = geometry.boundingSphere;

    if (boundingSphere === null || boundingSphere === undefined) {
        //build up bounding sphere
        const vector4 = computeGeometryBoundingSphereMiniball(geometry);
        geometry.boundingSphere = new ThreeSphere(new ThreeVector3(vector4.x, vector4.y, vector4.z), vector4.w);
    }

    return boundingSphere;
}

/**
 *
 * @param {BufferGeometry} geometry
 * @returns {Vector4} x,y,z are sphere center and w is radius
 */
export function computeGeometryBoundingSphereMiniball(geometry) {
    const vertexData = geometry.attributes.position.array;


    const result = new Vector4();
    computeBoundingSphereFromVertexData(vertexData, result);

    return result;
}

/**
 *
 * @param {Object3D} object
 * @param {Vector3} size
 * @param {Vector3} result
 */
function scaleObject3ToBox(object, size, result) {
    assert.notEqual(object, undefined, "Object is undefined");
    assert.notEqual(object, null, "Object is null");

    const boundingBox = new Box3();

    boundingBox.expandByObject(object);

    //box size
    const actualBoxSize = boundingBox.max.clone().sub(boundingBox.min);
    const scale = Math.min(size.x / actualBoxSize.x, size.y / actualBoxSize.y, size.z / actualBoxSize.z);

    result.set(scale, scale, scale);

    return actualBoxSize.multiplyScalar(scale);
}

/**
 *
 * @param {THREE.Geometry} geometry
 * @param {Vector3} size
 * @param {Vector3} result
 */
function scaleGeometryToBox(geometry, size, result) {
    assert.notEqual(geometry, undefined, "Geometry is undefined");
    assert.notEqual(geometry, null, "Geometry is null");

    const boundingBox = ensureGeometryBoundingBox(geometry);

    //box size
    const actualBoxSize = boundingBox.max.clone().sub(boundingBox.min);
    const scale = Math.min(size.x / actualBoxSize.x, size.y / actualBoxSize.y, size.z / actualBoxSize.z);

    result.set(scale, scale, scale);

    return actualBoxSize.multiplyScalar(scale);
}

/**
 *
 * @param {number} focusHeight Height of the focus area in world space
 * @param {number} fov Field of View
 * @param {number} [offset=0]
 * @returns {number}
 */
function computeMeshPreviewCameraDistance(focusHeight, fov, offset = 0) {
    return Math.abs((focusHeight / 2) / Math.sin(fov / 2)) + offset;
}

/**
 *
 * @param {Mesh} mesh trhee.js mesh
 * @param {Vector2} size
 * @param {AABB2} focus
 * @returns {{scene: Scene, camera: PerspectiveCamera}}
 */
function makeMeshPreviewScene(mesh, size, focus) {
    const scene = new ThreeScene();

    //lights
    const l0 = new ThreeDirectionalLight(0xffffff, 1);
    l0.position.set(-1, 1, 1);
    l0.castShadow = true;
    l0.shadow.mapSize.set(1024, 1024);

    function setShadowCamera(camera) {
        const sqrt2 = Math.sqrt(2);
        let sqrt2_2 = sqrt2 / 2;
        camera.left = -sqrt2_2;
        camera.right = sqrt2_2;

        camera.bottom = -sqrt2_2;
        camera.top = sqrt2_2;
    }

    setShadowCamera(l0.shadow.camera);
    scene.add(l0);

    const l1 = new ThreeDirectionalLight(0xffffff, 0.50);
    l1.position.set(0, 0, 1);
    scene.add(l1);

    const l2 = new ThreeAmbientLight(0xFFFFFF, 0.5);
    scene.add(l2);

    scaleObject3ToBox(mesh, new Vector3(1, 1, 1), mesh.scale);
    scene.add(mesh);


    const camera = new ThreePerspectiveCamera(45, size.x / size.y, 0.1, 10);

    const bBox = new Box3();

    bBox.expandByObject(mesh);

    const bBoxCenterScaled = new Vector3();
    bBoxCenterScaled.copy(bBox.min).add(bBox.max).multiplyScalar(0.5);

    //center model at 0,0,0
    mesh.position.set(0, 0, 0).sub(bBoxCenterScaled);
    //update transformation matrix
    rootObject3DFastMatrixUpdate(mesh);
    //move model to align front of BB with z=0

    const focusHeight = (focus.y1 - focus.y0);


    const fov = camera.fov * (Math.PI / 180);
    const distance = computeMeshPreviewCameraDistance(focusHeight, fov, bBox.max.z);

    const cameraPositionX = focus.x0 + (focus.x1 - focus.x0) / 2 - 0.5;
    const cameraPositionY = 0.5 - (focus.y0 + (focus.y1 - focus.y0) / 2);
    camera.position.set(cameraPositionX, cameraPositionY, distance);
    camera.lookAt(new ThreeVector3(cameraPositionX, cameraPositionY, 0));


    //set near and far for camera to capture
    // camera.near = 0.1;
    // camera.far = bBox.size.z * mesh.scale.z+distance;

    return { scene: scene, camera: camera };
}

function makeModelView(asset, size, renderer, focus) {
    const mesh = asset.create();

    if (renderer === undefined) {
        renderer = WebGLRendererPool.global.get();
        renderer.setClearColor(0xffffff, 0);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(size.x, size.y);
    }
    //render
    const renderTargetOptions = {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBAFormat,
        stencilBuffer: false,
        depthBuffer: true,
        generateMipmaps: false
    };
    const renderTarget = new WebGLRenderTarget(size.x, size.y, renderTargetOptions);

    const preview = makeMeshPreviewScene(mesh, size, focus);
    const scene = preview.scene;
    const camera = preview.camera;

    //flip camera upside-down to account for how image is flipped when reading it from render target
    camera.rotation.z = Math.PI;

    const canvas = document.createElement('canvas');

    function render() {
        renderer.setRenderTarget(renderTarget);

        renderer.render(scene, camera);

        /**
         *
         * @type {WebGLRenderingContext | CanvasRenderingContext2D}
         */
        const gl = renderer.getContext();

        const uint8Array = new Uint8Array(size.x * size.y * 4);

        gl.readPixels(0, 0, size.x, size.y, gl.RGBA, gl.UNSIGNED_BYTE, uint8Array);

        renderer.setRenderTarget(null);

        canvas.width = size.x;
        canvas.height = size.y;
        const c = canvas.getContext("2d");
        c.clearRect(0, 0, canvas.width, canvas.height);
        const imageData = c.createImageData(size.x, size.y);
        imageData.data.set(uint8Array);
        c.putImageData(imageData, 0, 0);

    }

    function cleanup() {
        renderTarget.dispose();
    }

    return {
        mesh: mesh,
        camera: camera,
        scene: scene,
        graphics: renderer,
        render: render,
        domElement: canvas
    };
}

/**
 *
 * @param {Texture} t
 * @returns {Promise<Texture>}
 */
function promiseTextureLoaded(t) {
    return new Promise(function (resolve, reject) {
        let image = t.image;
        if (image === undefined) {
            //FIXME this is not a pleasant logic which should be replaced. THREE.js v75 (current) does not offer a better way.
            Object.defineProperty(t, 'image', {
                set: function (i) {
                    image = i;
                    resolve();
                },
                get: function () {
                    return image;
                }
            });
        } else if (image.complete) {
            resolve(t);
        } else if (typeof image.addEventListener === "function") {
            image.addEventListener('load', resolve);
            image.addEventListener('error', reject);
        } else {
            resolve();
        }
    })
}

/**
 *
 * @param {Material} material
 * @returns {<Promise<Texture[]>}
 */
function promiseMaterialLoaded(material) {
    const textureNames = [
        'lightMap',
        'aoMap',
        'emissiveMap',
        'bumpMap',
        'normalMap',
        'displacementMap',
        'roughnessMap',
        'metalnessMap',
        'alphaMap',
        'envMap',
        'map',
        'specularMap',
        'diffuseMap0',
        'diffuseMap1',
        'diffuseMap2',
        'diffuseMap3',
        'splatMap'
    ];
    let textures = [];

    function processPrimitiveMaterial(mat) {
        textures = textures.concat(textureNames.map(function (textureName) {
            if (mat.hasOwnProperty(textureName)) {
                return mat[textureName];
            } else {
                return null;
            }
        }).filter(function (texture) {
            return texture !== null;
        }));
    }

    function processMaterial(mat) {
        if (mat.materials !== undefined) {
            mat.materials.forEach(processMaterial);
        } else {
            processPrimitiveMaterial(mat);
        }
    }

    processMaterial(material);

    const promises = textures.map(promiseTextureLoaded);
    return Promise.all(promises);
}


const v4 = [];

/**
 * Computations of screen-space pixel area covered by a sphere
 * NOTE: Port of GLSL code by Ingo Quilez. Source: http://www.iquilezles.org/www/articles/sphereproj/sphereproj.htm
 * @param {Vector4} sph Sphere in world space
 * @param {Matrix4} cam camera transform matrix (world to camera)(inverse world matrix of camera)
 * @param {number} fl focal length (fov in Radians)
 * @returns {number} area on the screen as a fraction, 1=entire screen, 0=zero area
 */
function projectSphere(sph, cam, fl) {
    assert.notEqual(null, cam, 'camera matrix is null');

    v4[0] = sph.x;
    v4[1] = sph.y;
    v4[2] = sph.z;
    v4[3] = 1;

    //transform to camera space
    v4_applyMatrix4(v4, v4, cam.elements);

    const r2 = sph.w * sph.w;

    const v3_x = v4[0];
    const v4_y = v4[1];
    const v4_z = v4[2];

    const z2 = v4_z * v4_z;

    const l2 = v3_dot(v3_x, v4_y, v4_z, v3_x, v4_y, v4_z);

    const area = -Math.PI * fl * fl * r2 * Math.sqrt(Math.abs((l2 - r2) / (r2 - z2))) / (r2 - z2);

    return area;
}

/**
 *
 * @param {Object3D} object
 */
export function threeUpdateMatrix(object) {
    object.updateMatrix();

    const children = object.children;
    for (let i = 0, childCount = children.length; i < childCount; i++) {
        const child = children[i];

        threeUpdateMatrix(child);
    }
}

/**
 *
 * @param {Object3D} object3
 */
export function threeUpdateTransform(object3) {

    /**
     signal that transformation matrix should be updated
     @see https://threejs.org/docs/index.html#api/core/Object3D.matrixWorldNeedsUpdate
     */
    threeUpdateMatrix(object3);

    object3.updateMatrixWorld(false);
}

export {
    ensureGeometryBoundingBox,
    scaleGeometryToBox,
    makeMeshPreviewScene,
    computeMeshPreviewCameraDistance,
    makeModelView,
    promiseMaterialLoaded,
    promiseTextureLoaded,
    projectSphere
};
