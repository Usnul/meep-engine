/**
 * User: Alex Goldring
 * Date: 12/6/2014
 * Time: 23:08
 */


import { System } from '../System.js';
import { Animation, AnimationClipFlag, AnimationFlags } from '../animation/Animation.js';
import Mesh from '../../graphics/ecs/mesh/Mesh.js';
import Future, { FutureStates } from '../../../core/process/Future.js';

import { CameraSystem } from '../../graphics/ecs/camera/CameraSystem.js';

import {
    AnimationMixer as ThreeAnimationMixer,
    LoopOnce as ThreeLoopOnce,
    LoopRepeat as ThreeLoopRepeat,
    Matrix4 as ThreeMatrix4
} from 'three';
import { projectSphere, threeUpdateTransform } from "../../graphics/Utils.js";
import { max3 } from "../../../core/math/MathUtils.js";
import Vector4 from "../../../core/geom/Vector4.js";
import { assert } from "../../../core/assert.js";
import { EventMeshSet, MeshSystem } from "../../graphics/ecs/mesh/MeshSystem.js";

/**
 *
 * @param {AnimationMixer} mixer
 * @param mesh
 * @param {object<string,Future<AnimationAction>>} actions
 */
function constructActionClips(mixer, mesh, actions) {

    function registerAnimationAction(animation) {
        const clipName = animation.name;
        if (actions.hasOwnProperty(clipName)) {
            //already have such an animation
            //TODO consider different animation sets with same animation names
            return;
        }
        const root = null;
        const action = new Future(function (resolve, reject) {
            const clipAction = mixer.clipAction(animation, root);
            resolve(clipAction);
        });
        actions[clipName] = action;
    }

    const animations = mesh.animations;

    if (animations === undefined) {
        console.warn('Mesh has no animations');
    }

    if (animations !== undefined && animations.length > 0) {
        for (let i = 0; i < animations.length; i++) {
            const animation = animations[i];
            registerAnimationAction(animation);
        }
    }
}

function useClip(component, clip, callback) {
    //find clip
    const actionClips = component.actionClips;
    const clipName = clip.name.getValue();
    const actionClip = actionClips[clipName];
    if (actionClip === undefined) {
        //no clip found
        return;
    }
    actionClip.resolve();
    actionClip.then(callback);
}

/**
 *
 * @param component
 * @param {AnimationClip} clip
 */
function startClip(component, clip) {
    /**
     *
     * @param {AnimationAction} clipAction
     */
    function visitClipAction(clipAction) {
        clipAction.repetitions = clip.repeatCount.getValue();
        if (clipAction.repetitions === Number.POSITIVE_INFINITY) {
            clipAction.loop = ThreeLoopRepeat;
        } else {
            clipAction.loop = ThreeLoopOnce;
        }
        clipAction.timeScale = clip.timeScale.getValue();
        clipAction.setEffectiveWeight(clip.weight.getValue());

        clipAction.clampWhenFinished = clip.getFlag(AnimationClipFlag.ClampWhenFinished);

        if (clipAction.repetitions > 0 && !clipAction.isRunning()) {
            clipAction.play();
        }
    }

    useClip(component, clip, visitClipAction);
}

/**
 *
 * @param {Animation} component
 */
function updateAnimationState(component) {
    const clips = component.clips;

    function initAnimationClip(ac) {
        startClip(component, ac);
    }

    clips.forEach(initAnimationClip);
    clips.on.added.add(initAnimationClip);
    clips.on.removed.add(function (ac) {
        useClip(component, ac, function (clipAction) {
            clipAction.stop();
        });
    });
}

/**
 *
 * @param {Animation} component
 * @param {Mesh} model3d
 */
function registerAnimation(component, model3d) {
    if (!model3d.hasMesh()) {
        return;
    }

    let mesh = model3d.mesh;

    //find animation data
    if (component.mixer === undefined || component.mesh !== mesh) {
        component.mesh = mesh;

        component.mixer = new Future(function (resolve, reject) {
            component.actionClips = {};

            const mixer = new ThreeAnimationMixer(mesh);
            constructActionClips(mixer, mesh, component.actionClips);
            resolve(mixer);
        });
    }

    component.mixer.then(function (mixer) {
        updateAnimationState(component);
    });
}

/**
 *
 * @param {ThreeAnimationMixer} mixer
 * @param {number} timeDelta
 */
export function advanceAnimation(mixer, timeDelta) {
    mixer.update(timeDelta);

    /**
     * get root
     * @type {Object3D}
     */
    const root = mixer.getRoot();

    //update bone matrix hierarchy
    // root.updateWorldMatrix(false, true);

    threeUpdateTransform(root);
}

/**
 * @type {Vector4}
 */
const v4boundingSphere = new Vector4();

class AnimationSystem extends System {
    /**
     *
     * @param {Vector2} viewportSize
     * @constructor
     */
    constructor(viewportSize) {
        super();

        this.componentClass = Animation;
        this.dependencies = [Animation, Mesh];

        this.viewportSize = viewportSize;
    }

    /**
     *
     * @param {Animation} component
     * @param mesh
     * @param {int} entity
     */
    link(component, mesh, entity) {
        const em = this.entityManager;

        registerAnimation(component, mesh);

        component.__listenerMeshSet = function (event) {

            const mesh = event.component;

            registerAnimation(component, mesh);
        };

        em.dataset.addEntityEventListener(entity, EventMeshSet, component.__listenerMeshSet);

    }

    /**
     *
     * @param {Animation} component
     * @param mesh
     * @param {int} entity
     */
    unlink(component, mesh, entity) {
        this.entityManager.dataset.removeEntityEventListener(entity, EventMeshSet, component.__listenerMeshSet);

        const animation = component.mixer;
        if (animation !== void 0 && animation !== null) {
            animation.then(function (mixer) {
                mixer.stopAllAction();
            });
        }
    }

    /**
     *
     * @param {number} timeDelta
     */
    update(timeDelta) {
        const em = this.entityManager;

        const ecd = em.dataset;
        if (ecd === null) {
            //no data, nothing to update
            return;
        }

        const firstActiveCamera = CameraSystem.getFirstActiveCamera(ecd).component;

        if (firstActiveCamera === undefined) {
            //no active camera found
            return;
        }

        /**
         * @type {THREE.PerspectiveCamera}
         */
        const c = firstActiveCamera.object;

        const projectionMatrix = new ThreeMatrix4();

        projectionMatrix.getInverse(c.matrixWorld);

        const focalLength = c.fov / 180; //convert to Radians

        const viewportSize = this.viewportSize;

        /**
         *
         * @param {Mesh} mesh trhee.js Mesh instance
         * @param {Matrix4} cameraMatrix
         */
        function screenSpaceSize(mesh, cameraMatrix) {
            const source = mesh.boundingSphere;

            if (source === undefined) {
                return 0;
            }

            assert.notEqual(cameraMatrix, null, 'camera matrix is null');

            v4boundingSphere.copy(source);

            const position = mesh.position;
            const scale = mesh.scale;
            const scaleMax = max3(scale.x, scale.y, scale.z);


            v4boundingSphere.multiplyScalar(scaleMax);
            v4boundingSphere.add3(position);

            const area = projectSphere(v4boundingSphere, cameraMatrix, focalLength);
            const inPixels = area * viewportSize.x * viewportSize.y;
            return inPixels;
        }

        /**
         *
         * @param entity
         * @param {Animation} animation
         * @param {Mesh} meshComponent
         * @returns {boolean}
         */
        function shouldEntityBeAnimated(entity, animation, meshComponent) {

            if (meshComponent === undefined) {
                //no mesh component
                return false;
            }

            const mesh = meshComponent.mesh;
            if (mesh === null) {
                //no renderable object
                return false;
            }

            if (animation.getFlag(AnimationFlags.MeshSizeCulling)) {

                //check the size of the mesh in screen space, culling animation of tiny objects
                const areaInPixel = screenSpaceSize(mesh, projectionMatrix);
                if (areaInPixel < 32) {
                    //too tiny
                    return false;
                }

            }

            //passed all filters, visible
            return true;
        }

        //advance time for all playing animations
        ecd.traverseComponents(Animation, function (animation, entity) {
            if (animation.isPlaying) {
                animation.debtTime += timeDelta;
            }
        });


        /**
         *
         * @type {MeshSystem}
         */
        const meshSystem = em.getSystem(MeshSystem);

        const animationComponentIndex = ecd.computeComponentTypeIndex(Animation);

        //update animations for visible meshes
        meshSystem.traverseVisible((mesh, entity) => {


            /**
             *
             * @type {Animation}
             */
            const animation = ecd.getComponentByIndex(entity, animationComponentIndex);

            if (animation === undefined) {
                //mesh has no animation, skip
                return true;
            }

            if (animation.mixer !== undefined && animation.isPlaying && shouldEntityBeAnimated(entity, animation, mesh)) {

                const dt = animation.debtTime;

                if (dt > 0) {
                    const mixerFuture = animation.mixer;
                    if (mixerFuture.state === FutureStates.RESOLVED) {
                        const mixer = mixerFuture.resolvedValue;

                        animation.debtTime = 0;

                        advanceAnimation(mixer, dt);
                    } else if (mixerFuture.state === FutureStates.INITIAL) {
                        mixerFuture.resolve();
                    }
                }
            }
        });
    }
}


export default AnimationSystem;
