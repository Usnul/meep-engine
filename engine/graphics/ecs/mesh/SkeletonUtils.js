import levenshtein from 'fast-levenshtein';
import { Bone } from "three";
import { BoneMapping } from "./skeleton/BoneMapping.js";


/**
 *
 * @param {Mesh} component
 * @param {string} boneName
 * @returns {THREE.Bone | null}
 */
export function getSkeletonBone(component, boneName) {
    const mesh = component.mesh;
    if (mesh === undefined) {
        throw  new Error("No mesh data");
    }
    if (mesh.isSkinnedMesh !== true) {
        throw new Error("Not a skinned mesh, no bones");
    }
    const skeleton = mesh.skeleton;
    if (skeleton === undefined) {
        throw  new Error("No skeleton data");
    }
    const bones = skeleton.bones;
    if (bones === undefined) {
        throw new Error("No bones (undefined)");
    }

    if (bones.length === 0) {
        throw  new Error("No bones (length === 0)");
    }

    //find the right bone
    for (let i = 0, l = bones.length; i < l; i++) {
        const bone = bones[i];
        if (bone.name === boneName) {
            //found the right bone
            return bone;
        }
    }
    //bone not found

    //try to find similar bones
    const similarities = bones.map(function (bone) {
        const distance = levenshtein.get(bone.name, boneName);
        return {
            bone: bone,
            distance: distance
        };
    });

    similarities.sort(function (a, b) {
        return a.distance - b.distance;
    });

    const bestMatch = similarities[0].bone;

    throw  new Error("Bone '" + boneName + "' not found, did you mean '" + bestMatch.name + "'");
}

/**
 *
 * @param {Object3D} object
 * @returns {Skeleton|undefined}
 */
function extractSkeletonFromObject3D(object) {

    if (object.isSkinnedMesh === true) {
        const skeleton = object.skeleton;

        return skeleton;
    }

    const children = object.children;

    const n = children.length;

    for (let i = 0; i < n; i++) {

        const child = children[i];

        const sk = extractSkeletonFromObject3D(child);

        if (sk !== undefined) {
            return sk;
        }

    }

}

/**
 *
 * @param {Mesh} component
 * @returns {Skeleton|undefined}
 */
export function extractSkeletonFromMeshComponent(component) {
    const mesh = component.mesh;

    if (mesh === null) {
        // no mesh data
        return null;
    }

    if (mesh === undefined) {
        // No mesh data
        return null;
    }

    return extractSkeletonFromObject3D(mesh);
}

/**
 *
 * @param {Skeleton} skeleton
 * @param {HumanoidBoneType|String} boneType
 * @return {Bone|null}
 */
export function findSkeletonBoneByType(skeleton, boneType) {

    const bones = skeleton.bones;

    if (bones === undefined) {
        // No bones (undefined)
        return null;
    }

    if (bones.length === 0) {
        // No bones (length === 0)
        return null;
    }

    if (bones[0].boneType === undefined) {
        const boneMapping = new BoneMapping();

        boneMapping.build(bones.map(b => b.name));
        boneMapping.apply(bones);
    }

    //find the right bone
    for (let i = 0, l = bones.length; i < l; i++) {
        const bone = bones[i];
        if (bone.boneType === boneType) {
            //found the right bone
            return bone;
        }
    }

    return null;
}

/**
 *
 * @param {Mesh} component
 * @param {HumanoidBoneType|String} boneType
 * @returns {Bone | null}
 */
export function getSkeletonBoneByType(component, boneType) {
    const skeleton = extractSkeletonFromMeshComponent(component);

    if (skeleton === undefined) {
        return null;
    }

    return findSkeletonBoneByType(skeleton, boneType);
}


/**
 *
 * @param {Mesh} component
 * @param {String} name
 * @returns {Bone | null}
 */
export function getSkeletonBoneByName_old(component, name) {
    const skeleton = extractSkeletonFromMeshComponent(component);

    if (skeleton === undefined) {
        return null;
    }

    const bones = skeleton.bones;

    if (bones === undefined) {
        // No bones (undefined)
        return null;
    }

    if (bones.length === 0) {
        // No bones (length === 0)
        return null;
    }

    //find the right bone
    for (let i = 0, l = bones.length; i < l; i++) {
        const bone = bones[i];
        if (bone.name === name) {
            //found the right bone
            return bone;
        }
    }

    return null
}

const stack = [];

/**
 *
 * @param {Mesh} component
 * @param {String} name
 * @returns {Bone | null}
 */
export function getSkeletonBoneByName(component, name) {
    if (component.mesh === null) {
        return null;
    }

    const m = component.mesh;

    let stack_top = 0;
    stack[stack_top++] = m;

    while (stack_top > 0) {
        stack_top--;
        const top = stack[stack_top];

        if (top.isBone && top.name === name) {
            return top;
        }

        const children = top.children;

        const n = children.length;

        for (let i = 0; i < n; i++) {
            stack[stack_top++] = children[i];
        }
    }

    return null;
}

/**
 *
 * @param {Mesh} mesh
 * @returns {Array}
 */
function initBones(mesh) {
    var geometry = mesh.geometry;
    var bones = [], bone, gbone;
    var i, il;
    if (geometry && geometry.bones !== undefined) {
        // first, create array of 'Bone' objects from geometry data
        for (i = 0, il = geometry.bones.length; i < il; i++) {
            gbone = geometry.bones[i];
            // create new 'Bone' object
            bone = new Bone();
            bones.push(bone);
            // apply values
            bone.name = gbone.name;
            bone.position.fromArray(gbone.pos);
            bone.quaternion.fromArray(gbone.rotq);
            if (gbone.scl !== undefined) bone.scale.fromArray(gbone.scl);
        }
        // second, create bone hierarchy
        for (i = 0, il = geometry.bones.length; i < il; i++) {
            gbone = geometry.bones[i];
            if ((gbone.parent !== -1) && (gbone.parent !== null) && (bones[gbone.parent] !== undefined)) {
                // subsequent bones in the hierarchy
                bones[gbone.parent].add(bones[i]);
            } else {
                // topmost bone, immediate child of the skinned mesh
                mesh.add(bones[i]);
            }
        }
    }
    // now the bones are part of the scene graph and children of the skinned mesh.
    // let's update the corresponding matrices
    mesh.updateMatrixWorld(true);
    return bones;
}
