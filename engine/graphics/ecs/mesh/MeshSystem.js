/**
 * Created by Alex Goldring on 25.02.2015.
 */


import { System } from '../../../ecs/System.js';
import Mesh, { MeshFlags } from './Mesh.js';
import { Transform } from '../../../ecs/components/Transform.js';

import Vector3 from '../../../../core/geom/Vector3.js';

import { composeMatrix4, scaleGeometryToBox } from '../../Utils.js';
import { BoxBufferGeometry, Matrix4 as ThreeMatrix4, MeshLambertMaterial, Vector3 as ThreeVector3 } from 'three';

import ThreeFactory from '../../three/ThreeFactory.js';

import checkerTexture from '../../texture/CheckersTexture.js';
import { getSkeletonBoneByType } from "./SkeletonUtils.js";
import { SignalBinding } from "../../../../core/events/signal/SignalBinding.js";
import { max2, min2 } from "../../../../core/math/MathUtils.js";

/**
 * @readonly
 * @type {string}
 */
export const EventMeshSet = "model-mesh-set";

const placeholderGeometry = new BoxBufferGeometry(1, 1, 1);

placeholderGeometry.computeBoundingSphere();

const placeholderTexture = checkerTexture.create();

const placeholderMaterial = new MeshLambertMaterial({ map: placeholderTexture });

/**
 *
 * @param {number} entity
 * @param {EntityComponentDataset} dataset
 * @param {Asset} asset
 * @param {Mesh} component
 */
function setMeshFromAsset(entity, dataset, asset, component) {

    const mesh = asset.create();

    if (asset.boundingBox !== undefined) {
        component.boundingBox.copy(asset.boundingBox);
    } else if (mesh.isMesh) {
        const geometry = mesh.geometry;
        const bb = geometry.boundingBox;
        component.boundingBox.setBounds(
            bb.min.x,
            bb.min.y,
            bb.min.z,
            bb.max.x,
            bb.max.y,
            bb.max.z
        );
    }

    setMesh(dataset, entity, component, mesh, component.center);

    component.isLoaded = true;
}

/**
 *
 * @param {Object3D} object
 */
export function object3DFastMatrixUpdate(object) {
    const matrix = object.matrix;

    matrix.compose(object.position, object.quaternion, object.scale);

    const parent = object.parent;

    object.matrixWorld.multiplyMatrices(parent.matrixWorld, matrix);

    commonObject3DFastMatrixUpdate(object);

}

function commonObject3DFastMatrixUpdate(object) {
    // update children

    const children = object.children;

    for (let i = 0, l = children.length; i < l; i++) {

        const child = children[i];

        object3DFastMatrixUpdate(child);

    }

    if (object.isSkinnedMesh) {
        /*
        Code copy from THREE.SkinnedMesh.updateMatrixWorld
         */

        if (object.bindMode === 'attached') {

            object.bindMatrixInverse.getInverse(object.matrixWorld);

        } else if (object.bindMode === 'detached') {

            object.bindMatrixInverse.getInverse(object.bindMatrix);

        } else {

            console.warn('THREE.SkinnedMesh: Unrecognized bindMode: ' + object.bindMode);

        }
    }
}

/**
 *
 * @param {Object3D} object
 */
export function rootObject3DFastMatrixUpdate(object) {
    const matrix = object.matrix;

    matrix.compose(object.position, object.quaternion, object.scale);
    object.matrixWorld.copy(matrix);

    commonObject3DFastMatrixUpdate(object);
}

/**
 *
 * @param {Mesh} component
 */
function updateMeshTransform(component) {
    /**
     *
     * @type {Object3D}
     */
    const m = component.mesh;
    rootObject3DFastMatrixUpdate(m);
    // threeUpdateTransform(m);
}

export class MeshSystem extends System {
    /**
     *
     * @param {GraphicsEngine} graphics
     * @param {AssetManager} assetManager
     * @constructor
     * @extends {System}
     */
    constructor(graphics, assetManager) {
        super();

        this.componentClass = Mesh;
        this.dependencies = [Mesh, Transform];

        /**
         *
         * @type {AssetManager}
         */
        this.assetManager = assetManager;

        this.waitingForMesh = [];

        /**
         *
         * @type {Array.<Array.<SignalBinding>>}
         */
        this.entityData = [];

        this.graphics = graphics;

        /**
         *
         * @type {RenderLayer|null}
         */
        this.renderLayer = null;

        /**
         *
         * @type {BinaryNode}
         */
        this.bvh = null;
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;

        const graphics = this.graphics;
        this.renderLayer = graphics.layers.create('mesh-system');

        this.bvh = this.renderLayer.bvh;

        const visibleSet = this.renderLayer.visibleSet;

        visibleSet.onAdded.add(m => {
            /**
             *
             * @type {Mesh}
             */
            const component = m.__meep_ecs_component;


            component.setFlag(MeshFlags.InView);
        });

        visibleSet.onRemoved.add(m => {
            /**
             *
             * @type {Mesh}
             */
            const component = m.__meep_ecs_component;

            if (m !== component.mesh) {
                //object does not match current component mesh, skip this event
                return;
            }

            component.clearFlag(MeshFlags.InView);
        });


        readyCallback();
    }

    /**
     *
     * @param {function(Mesh, number)} visitor
     * @param {*} [thisArg]
     */
    traverseVisible(visitor, thisArg) {
        const em = this.entityManager;

        const ecd = em.dataset;

        if (ecd === null) {
            return;
        }

        const visibleElements = this.renderLayer.visibleSet.elements;

        const n = visibleElements.length;

        for (let i = 0; i < n; i++) {

            /**
             *
             * @type {Object3D}
             */
            const m = visibleElements[i];

            /**
             *
             * @type {Mesh}
             */
            const component = m.__meep_ecs_component;

            /**
             * @type {number}
             */
            const entity = m.__meep_ecs_entity;

            if (!ecd.entityExists(entity)) {
                //entity was destroyed at some point, visibility set updates asynchronously from ECS dataset updates
                //skip
                return;
            }

            if (component !== undefined) {
                visitor.call(thisArg, component, entity);
            }
        }
    }

    shutdown(entityManager, readyCallback, errorCallback) {
        this.graphics.layers.remove(this.renderLayer);

        readyCallback();
    }

    /**
     *
     * @param {Transform} transform
     * @param {Mesh} model
     * @param entityId
     */
    link(model, transform, entity) {
        //remember entity for fast lookup
        model.bvh.entity = entity;

        this.process(entity, model);

        function copyPositionOfMesh(x, y, z) {
            if (model.hasMesh()) {
                const m = model.mesh;
                const p = m.position;
                if (p.x !== x || p.y !== y || p.z !== z) {
                    p.set(x, y, z);
                }
                updateMeshTransform(model);
            }
            updateNodeByTransformAndBBB(model.bvh, model.boundingBox, transform);
        }

        function copyScaleOfMesh(x, y, z) {
            if (model.hasMesh()) {
                const m = model.mesh;
                const scale = m.scale;
                if (scale.x !== x || scale.y !== y || scale.z !== z) {
                    scale.set(x, y, z);
                }
                updateMeshTransform(model);
            }
            updateNodeByTransformAndBBB(model.bvh, model.boundingBox, transform);
        }

        function handleRotationChange() {
            if (model.hasMesh()) {
                const m = model.mesh;
                transform.rotation.__setThreeEuler(m.rotation);
                updateMeshTransform(model);
            }
        }

        const position = transform.position;
        const scale = transform.scale;

        const bPosition = new SignalBinding(position.onChanged, copyPositionOfMesh);
        const bRotation = new SignalBinding(transform.rotation.onChanged, handleRotationChange);
        const bScale = new SignalBinding(scale.onChanged, copyScaleOfMesh);

        bPosition.link();
        bRotation.link();
        bScale.link();

        this.entityData[entity] = [
            bPosition,
            bRotation,
            bScale
        ];

        copyPositionOfMesh(position.x, position.y, position.z);
        copyScaleOfMesh(scale.x, scale.y, scale.z);

        this.bvh.insertNode(model.bvh);
    }

    /**
     *
     * @param {Transform} transform
     * @param {Mesh} model
     * @param entityId
     */
    unlink(model, transform, entityId) {
        const list = this.entityData[entityId];

        if (list !== undefined) {

            for (let i = 0; i < list.length; i++) {
                const binding = list[i];
                binding.unlink();
            }

            delete this.entityData[entityId];

        }

        //remove from 'waiting for mesh' set
        const waitingForMesh = this.waitingForMesh;

        let n = waitingForMesh.length;

        for (let i = 0; i < n; i++) {
            const element = waitingForMesh[i];

            if (element.entity === entityId) {
                waitingForMesh.splice(i, 1);
                i--;
                n--;
            }
        }

        model.bvh.disconnect();
    }

    /**
     *
     * @param {int} entity
     * @param {Mesh} component
     */
    process(entity, component) {
        const em = this.entityManager;
        const am = this.assetManager;

        const dataset = em.dataset;

        const self = this;

        /**
         *
         * @param {Asset<Object3D>} asset
         */
        function assetLoaded(asset) {
            if (!dataset.entityExists(entity)) {
                //entity no longer exists, probably dataset has been switched, abort
                return;
            }

            //check that component is still actual
            const actualComponent = dataset.getComponent(entity, self.componentClass);
            if (actualComponent === component) {
                // scene.remove(component.mesh);
                setMeshFromAsset(entity, dataset, asset, component);
            } else {
                //component is no longer in the manager. do nothing.
                //console.warn("component is no longer in the manager");
            }
        }


        function assetFailure(error) {
            console.error("failed to load model " + component.url, error);
        }

        function isPlaceholderMesh() {
            return component.mesh.geometry === placeholderGeometry;
        }

        if (component.hasMesh()) {
            //do not re-run if mesh is set
            setMesh(dataset, entity, component, component.mesh);
            return;
        }

        if (component.url === null) {
            this.waitingForMesh.push({ component, entity });
            return;
        }

        let mesh;

        const assetType = loaderNameByURL(component.url);

        const asset = am.tryGet(component.url, assetType);

        if (asset !== null) {
            //mesh already exists
            setMeshFromAsset(entity, dataset, asset, component);
        } else {

            //mesh was not found, use temp mesh and submit a request
            mesh = ThreeFactory.createMesh(placeholderGeometry, placeholderMaterial);

            setMesh(dataset, entity, component, mesh);

            if (assetType === null) {
                assetFailure('no asset type deduced');
            } else {
                am.get(component.url, assetType, assetLoaded, assetFailure);
            }
        }
        em.getComponentAsync(entity, Transform, function (t) {
            if (component.mesh !== void 0) {
                setTransfrom(t, component);
            }

            function size2scale() {
                //adjust scale
                scaleGeometryToBox(component.mesh.geometry, component.size, t.scale);

                //remove property
                delete component.size;
            }

            if (component.size !== null && component.size !== undefined) {
                //deprecated code path
                console.warn(`Mesh.size(=${component.size.x},${component.size.y},${component.size.z}) is a deprecated attribute, use Transform.scale instead, url=${component.url}`);


                if (component.mesh !== undefined && !isPlaceholderMesh()) {
                    size2scale();
                } else {

                    function listener() {
                        if (!isPlaceholderMesh()) {
                            size2scale();
                            dataset.removeEntityEventListener(entity, EventMeshSet, listener);
                        }
                    }

                    dataset.addEntityEventListener(entity, EventMeshSet, listener);
                }
            }
        });
    }

    update(timeDelta) {
        let i = 0, l = this.waitingForMesh.length;
        for (; i < l; i++) {
            const element = this.waitingForMesh[i];
            const component = element.component;
            if (component.url !== null) {
                const entity = element.entity;

                this.process(entity, component);

                this.waitingForMesh.splice(i, 1);

                i--;
                l--;
            }
        }
    }

    /**
     *
     * @param {Mesh} component
     * @param {HumanoidBoneType} boneType
     * @param {Vector3} [result=new Vector3()]
     * @returns {Vector3}
     * @throws {Error} if no such bone exists
     */
    static getBonePosition(component, boneType, result = new Vector3()) {
        const skeletonBone = getSkeletonBoneByType(component, boneType);

        if (skeletonBone === null) {
            console.warn("Couldn't find bone '" + boneType + "', using mesh origin instead");

            const mesh = component.mesh;

            if (mesh !== null) {
                result.copy(mesh.position);
            } else {
                //no mesh loaded
                result.set(0, 0, 0);
            }

        } else {
            const matrixWorld = skeletonBone.matrixWorld;

            threeV3.setFromMatrixPosition(matrixWorld);

            return result.copy(threeV3);
        }

        return result;
    }
}


const matrix4 = new ThreeMatrix4();
const threeV3 = new ThreeVector3();
/**
 * Used to store AABB3 corners during bounding box calculation
 * @readonly
 * @type {Float64Array}
 */
const corners = new Float64Array(24);

/**
 *
 * @param {LeafNode} bvh
 * @param {AABB3} boundingBox
 * @param {Transform} transform
 */
export function updateNodeByTransformAndBBB(bvh, boundingBox, transform) {
    const position = transform.position;
    const scale = transform.scale;
    const rotation = transform.rotation;

    composeMatrix4(matrix4, position, rotation, scale);

    let x0 = Infinity,
        y0 = Infinity,
        z0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity,
        z1 = -Infinity;

    boundingBox.getCorners(corners);

    for (let j = 0; j < 24; j += 3) {
        const x = corners[j];
        const y = corners[j + 1];
        const z = corners[j + 2];

        threeV3.set(x, y, z);

        threeV3.applyMatrix4(matrix4);

        x0 = min2(x0, threeV3.x);
        y0 = min2(y0, threeV3.y);
        z0 = min2(z0, threeV3.z);

        x1 = max2(x1, threeV3.x);
        y1 = max2(y1, threeV3.y);
        z1 = max2(z1, threeV3.z);
    }

    bvh.resize(x0, y0, z0, x1, y1, z1);
}

/**
 *
 * @param {Transform} t
 * @param {Mesh} component
 */
function setTransfrom(t, component) {
    /**
     *
     * @type {Object3D}
     */
    const m = component.mesh;

    /**
     *
     * @type {Vector3}
     */
    const position = t.position;

    m.position.copy(position);
    t.rotation.__setThreeEuler(m.rotation);
    m.scale.copy(t.scale);

    updateMeshTransform(component);

    //set bvh
    updateNodeByTransformAndBBB(component.bvh, component.boundingBox, t);
}

/**
 *
 * @param {Object3D} mesh
 * @returns {Group}
 */
function wrapMeshInGroupAndCenterOnOrigin(mesh) {
    //center mesh on origin
    const bbox = mesh.geometry.boundingBox;
    const offset = bbox.max.clone().add(bbox.min).multiplyScalar(-0.5).multiply(mesh.scale);
    const group = ThreeFactory.createGroup();
    mesh.position.copy(offset);
    group.add(mesh);
    return group;
}

/**
 *
 * @param {string} url
 * @return {String|null}
 */
function loaderNameByURL(url) {
    //get extension
    const dotPosition = url.lastIndexOf(".");
    if (dotPosition === -1) {
        console.warn(`No model extension could be deduced for URL: '${url}'`);
        //no extension
        return null;
    } else {
        //retrieve extension
        const ext = url.substring(dotPosition + 1);
        switch (ext) {
            case "json":
                return "three.js";
            case "glb":
                return "model/gltf";
            case "gltf":
                return "model/gltf+json";
            default:
                console.warn(`Unknown 3d mesh format extension: '${ext}'`);
                return null;
        }
    }
}

/**
 *
 * @param {EntityComponentDataset} dataset
 * @param entity
 * @param {Mesh} component
 * @param {Object3D} mesh
 * @param {boolean} [wrapFlag=false]
 */
function setMesh(dataset, entity, component, mesh, wrapFlag = false) {

    mesh.traverse(o => {
        o.castShadow = component.castShadow;
        o.receiveShadow = component.receiveShadow;
    });

    let object = mesh;
    if (wrapFlag) {
        console.warn('wrapped mesh', dataset.getAllComponents(entity));

        object = wrapMeshInGroupAndCenterOnOrigin(mesh);
    }

    /*
        disable auto updates. We know when transform changes and thus we can avoid unnecessary matrix computations
        @see https://threejs.org/docs/index.html#api/core/Object3D.matrixWorldNeedsUpdate
     */
    object.matrixWorldNeedsUpdate = false;

    if (component.opacity === 0) {
        object.visible = false;
    }

    object.__meep_ecs_component = component;
    object.__meep_ecs_entity = entity;

    component.mesh = object;
    component.bvh.object = component.mesh;


    const transform = dataset.getComponent(entity, Transform);

    if (transform !== undefined) {
        setTransfrom(transform, component);
    }

    // scene.add(object);
    dataset.sendEvent(entity, EventMeshSet, {
        component,
        entity
    });
}
