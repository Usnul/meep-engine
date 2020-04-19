import { IKSolver } from "./IKSolver.js";
import { findSkeletonBoneByType } from "../../graphics/ecs/mesh/SkeletonUtils.js";
import Quaternion from "../../../core/geom/Quaternion.js";
import Vector3, { v3_dot, v3Length_i } from "../../../core/geom/Vector3.js";
import { SurfacePoint3 } from "../../../core/geom/3d/SurfacePoint3.js";
import { v3_computeOffsetVector } from "./IKMath.js";
import { clamp, inverseLerp } from "../../../core/math/MathUtils.js";

const boneWorldPosition = new Vector3();
const boneWorldRotation = new Quaternion();
const boneWorldScale = new Vector3();

const parentWorldPosition = new Vector3();

const contact = new SurfacePoint3();

const targetPosition = new Vector3();

const v3 = new Vector3();

const ONE_OVER_SQRT_3 = 0.57735026919;

const r = new Quaternion();
const up = new Vector3();

const r_i = new Quaternion();

const axis = new Vector3();

const x = new Quaternion();

const target = new Quaternion();

/**
 * Align a single bone onto terrain surface
 */
export class OneBoneSurfaceAlignmentSolver extends IKSolver {
    solve(problem) {
        const { constraint, terrain, skeleton } = problem;

        //obtain the bone
        const bone = findSkeletonBoneByType(skeleton, constraint.effector);

        if (bone === null) {
            throw new Error('Bone not found');
        }

        //get bone parent, this is needed to figure out the "down" direction to ray casting
        const boneParent = bone.parent;

        if (boneParent === undefined || boneParent === null) {
            throw new Error('Bone has no parent');
        }

        //Update matrix root bone, this will update all bones in the chain. Matrix update is necessary to ensure we read actual transform values
        boneParent.updateMatrixWorld(true);

        //obtain bone world position and rotation
        const matrixWorld = bone.matrixWorld;

        matrixWorld.decompose(boneWorldPosition, boneWorldRotation, boneWorldScale);

        //obtain parent bone world position
        const parentBoneWM = boneParent.matrixWorld.elements;

        parentWorldPosition.x = parentBoneWM[12];
        parentWorldPosition.y = parentBoneWM[13];
        parentWorldPosition.z = parentBoneWM[14];

        //compute direction for ray casting
        const directionX = boneWorldPosition.x - parentWorldPosition.x;
        const directionY = boneWorldPosition.y - parentWorldPosition.y;
        const directionZ = boneWorldPosition.z - parentWorldPosition.z;


        let contactExists = terrain.raycastFirstSync(
            contact,
            parentWorldPosition.x,
            parentWorldPosition.y,
            parentWorldPosition.z,
            directionX,
            directionY,
            directionZ
        );

        if (!contactExists) {
            //no contact
            return;
        }

        const contactPosition = contact.position;
        const contactNormal = contact.normal;

        //perform secondary cast from the bone, back along the surface normal
        contactExists = terrain.raycastFirstSync(
            contact,
            boneWorldPosition.x + contactNormal.x,
            boneWorldPosition.y + contactNormal.y,
            boneWorldPosition.z + contactNormal.z,
            -contactNormal.x,
            -contactNormal.y,
            -contactNormal.z
        );

        if (!contactExists) {
            //no contact
            return;
        }


        const bone_scale = boneWorldScale.length() * ONE_OVER_SQRT_3;

        const targetOffsetDistance = constraint.offset * bone_scale;

        v3_computeOffsetVector(
            targetPosition,
            targetOffsetDistance,
            contactPosition.x, contactPosition.y, contactPosition.z,
            contactNormal.x, contactNormal.y, contactNormal.z
        );

        const delta_contact_c_x = targetPosition.x - boneWorldPosition.x;
        const delta_contact_c_y = targetPosition.y - boneWorldPosition.y;
        const delta_contact_c_z = targetPosition.z - boneWorldPosition.z;

        //check if current effector position is above the contact point
        const dot_contact_side = v3_dot(directionX, directionY, directionZ, delta_contact_c_x, delta_contact_c_y, delta_contact_c_z);

        const delta_contact_c_length = v3Length_i(delta_contact_c_x, delta_contact_c_y, delta_contact_c_z);

        let influence;

        if (dot_contact_side < 0) {
            //penetration detected
            influence = 1;

        } else {
            //no penetration, hovering case, use hover distance for influence
            const normalized_effector_distance = inverseLerp(0, bone_scale, delta_contact_c_length);

            influence = 1 - clamp(constraint.distance.normalizeValue(normalized_effector_distance), 0, 1);
        }

        if (influence <= 0) {
            //no influence
            return;
        }

        r.copy(bone.quaternion);

        //we want to make bone align orthogonally to surface contact normal


        //convert bone UP vector to world space
        up.copy(Vector3.forward);
        up.applyQuaternion(boneWorldRotation);
        up.normalize();

        r_i.copyInverse(boneWorldRotation);

        v3.copy(contactNormal);
        v3.applyQuaternion(r_i);


        //
        axis.crossVectors(v3, Vector3.forward);

        const betaSine = axis.length();

        //compute angle between normal and up vector of the bone
        const beta = Math.asin(clamp(betaSine, -1, 1));

        //
        axis.normalize();

        x.fromAxisAngle(axis, beta);

        target.copy(r);
        target.multiply(x);

        //compute angle between quaternions
        const a = target.angleTo(boneParent.quaternion);

        const a_abs = Math.abs(a);
        if (a_abs >= constraint.limit) {
            const b = target.angleTo(r);

            const b_abs = Math.abs(b);
            if (b_abs < constraint.limit) {

                const l = inverseLerp(a_abs, b_abs, constraint.limit);

                influence *= l;
            } else {
                return;
            }
        }

        r.lerp(target, constraint.strength * influence);

        bone.setRotationFromQuaternion(r);

        bone.updateMatrix();
        bone.updateMatrixWorld();
        bone.updateWorldMatrix(false, true);


    }
}
