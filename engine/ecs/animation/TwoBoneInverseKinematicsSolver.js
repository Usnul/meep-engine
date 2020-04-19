import { assert } from "../../../core/assert.js";
import Vector3, { v3_dot, v3Length_i } from "../../../core/geom/Vector3.js";
import { clamp, inverseLerp } from "../../../core/math/MathUtils.js";
import Quaternion from "../../../core/geom/Quaternion.js";
import { findSkeletonBoneByType } from "../../graphics/ecs/mesh/SkeletonUtils.js";
import { SurfacePoint3 } from "../../../core/geom/3d/SurfacePoint3.js";
import { IKSolver } from "./IKSolver.js";
import { v3_computeOffsetVector } from "./IKMath.js";

const boneWorldPositionC = new Vector3();
const boneWorldPositionB = new Vector3();
const boneWorldPositionA = new Vector3();

const contact = new SurfacePoint3();

const targetPosition = new Vector3();

const v3 = new Vector3();

const globalRotationA = new Quaternion();
const globalRotationB = new Quaternion();
const globalRotationC = new Quaternion();

const targetLocalRotationA = new Quaternion();
const targetLocalRotationB = new Quaternion();


/**
 * Compute interior angle between tree points
 * @param {Vector3} a
 * @param {Vector3} b
 * @param {Vector3} c
 * @returns {number} angle in radians
 */
function computeInteriorAngle(a, b, c) {

    //compute AB delta
    const d_ab_x = a.x - b.x;
    const d_ab_y = a.y - b.y;
    const d_ab_z = a.z - b.z;

    //normalize AB delta vector
    const d_ab_length = v3Length_i(d_ab_x, d_ab_y, d_ab_z);

    const nd_ab_x = d_ab_x / d_ab_length;
    const nd_ab_y = d_ab_y / d_ab_length;
    const nd_ab_z = d_ab_z / d_ab_length;

    //compute CB delta
    const d_cb_x = c.x - b.x;
    const d_cb_y = c.y - b.y;
    const d_cb_z = c.z - b.z;

    //normalize CB delta vector
    const d_cb_length = v3Length_i(d_cb_x, d_cb_y, d_cb_z);

    const nd_cb_x = d_cb_x / d_cb_length;
    const nd_cb_y = d_cb_y / d_cb_length;
    const nd_cb_z = d_cb_z / d_cb_length;

    //compute dot product
    const dot = v3_dot(nd_ab_x, nd_ab_y, nd_ab_z, nd_cb_x, nd_cb_y, nd_cb_z);

    //clamp value of dot product for arc cosine function
    const clamped_dot = clamp(dot, -1, 1);

    return Math.acos(clamped_dot);
}


const d = new Vector3();
const delta_ca = new Vector3();
const delta_ta = new Vector3();

const axis0 = new Vector3();
const axis1 = new Vector3();

const inv_a_gr = new Quaternion();
const inv_b_gr = new Quaternion();

const r0 = new Quaternion();
const r1 = new Quaternion();
const r2 = new Quaternion();

const axis0_la = new Vector3();
const axis0_lb = new Vector3();
const axis1_la = new Vector3();

/**
 * Based on http://theorangeduck.com/page/simple-two-joint
 * @param {Vector3} a Root bone position
 * @param {Vector3} b Second bone position
 * @param {Vector3} c Effector position
 * @param {Vector3} t Target position
 * @param {number} eps EPSILON value, small value for rounding error compensation
 * @param {Quaternion} a_gr Global rotation of root bone
 * @param {Quaternion} b_gr Global rotation of second bone
 * @param {Quaternion} a_lr local rotation for root bone, this will be updated as a result
 * @param {Quaternion} b_lr local rotation for second bone, this will be updated as a result
 */
function two_joint_ik(
    a, b, c, t, eps,
    a_gr, b_gr,
    a_lr, b_lr
) {

    //Compute lengths of bones
    const lab = b.distanceTo(a);
    const lcb = b.distanceTo(c);

    const maximum_extension = lab + lcb - eps;

    //clamp length to the target to maximum extension of the joint
    const lat = clamp(t.distanceTo(a), eps, maximum_extension);

    //compute current interior angles
    const ac_ab_0 = computeInteriorAngle(c, a, b);
    const ba_bc_0 = computeInteriorAngle(a, b, c);
    const ac_at_0 = computeInteriorAngle(c, a, t);

    // Using the cosine rule to compute desired interior angles
    const length_at_sqr = lat * lat;
    const length_cb_sqr = lcb * lcb;
    const length_ab_sqr = lab * lab;

    const ac_ab_1 = Math.acos(clamp((length_cb_sqr - length_ab_sqr - length_at_sqr) / (-2 * lab * lat), -1, 1));
    const ba_bc_1 = Math.acos(clamp((length_at_sqr - length_ab_sqr - length_cb_sqr) / (-2 * lab * lcb), -1, 1));

    d.copy(Vector3.back);
    d.applyQuaternion(b_gr);

    delta_ca.subVectors(c, a);
    delta_ta.subVectors(t, a);

    axis0.crossVectors(delta_ca, d);
    axis0.normalize();

    axis1.crossVectors(delta_ca, delta_ta);
    axis1.normalize();

    inv_a_gr.copyInverse(a_gr);
    inv_b_gr.copyInverse(b_gr);

    axis0_la.copy(axis0);
    axis0_la.applyQuaternion(inv_a_gr);

    const angle0 = ac_ab_1 - ac_ab_0;

    r0.fromAxisAngle(axis0_la, angle0);

    const angle1 = ba_bc_1 - ba_bc_0;

    axis0_lb.copy(axis0);
    axis0_lb.applyQuaternion(inv_b_gr);

    r1.fromAxisAngle(axis0_lb, angle1);

    axis1_la.copy(axis1);
    axis1_la.applyQuaternion(inv_a_gr);

    r2.fromAxisAngle(axis1_la, ac_at_0);

    r0.multiply(r2);

    a_lr.multiply(r0);
    b_lr.multiply(r1);
}

/**
 *
 * @param {Object3D} object
 * @param {Vector3} position
 * @param {Quaternion} rotation
 * @param {Vector3} scale
 */
function computeGlobalTransform(object, position, rotation, scale) {
    const matrixWorld = object.matrixWorld;

    matrixWorld.decompose(position, rotation, scale);
}

export class TwoBoneInverseKinematicsSolver extends IKSolver {


    solve(problem) {

        const { skeleton, terrain, constraint } = problem;

        const effectorBoneType = constraint.effector;

        const boneC = findSkeletonBoneByType(skeleton, effectorBoneType);

        assert.notNull(boneC, 'boneC');

        const boneB = boneC.parent;

        assert.notNull(boneB, 'boneB');

        const boneA = boneB.parent;
        assert.notNull(boneA, 'boneA');

        //Update matrix root bone, this will update all bones in the chain. Matrix update is necessary to ensure we read actual transform values
        boneA.updateMatrixWorld(true);

        //compute current position of the bones
        computeGlobalTransform(boneA, boneWorldPositionA, globalRotationA, v3);
        computeGlobalTransform(boneB, boneWorldPositionB, globalRotationB, v3);
        computeGlobalTransform(boneC, boneWorldPositionC, globalRotationC, v3);

        //check if the there is a penetration with the terrain between the two bones
        const directionX = boneWorldPositionC.x - boneWorldPositionA.x;
        const directionY = boneWorldPositionC.y - boneWorldPositionA.y;
        const directionZ = boneWorldPositionC.z - boneWorldPositionA.z;

        let contactExists = terrain.raycastFirstSync(
            contact,
            boneWorldPositionA.x,
            boneWorldPositionA.y,
            boneWorldPositionA.z,
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
            boneWorldPositionC.x + contactNormal.x,
            boneWorldPositionC.y + contactNormal.y,
            boneWorldPositionC.z + contactNormal.z,
            -contactNormal.x,
            -contactNormal.y,
            -contactNormal.z
        );

        if (!contactExists) {
            //no contact
            return;
        }

        //compute total length of the limb
        const limbLength = boneWorldPositionA.distanceTo(boneWorldPositionB) + boneWorldPositionB.distanceTo(boneWorldPositionC);

        const targetOffsetDistance = constraint.offset * limbLength;

        v3_computeOffsetVector(
            targetPosition,
            targetOffsetDistance,
            contactPosition.x, contactPosition.y, contactPosition.z,
            contact.normal.x, contact.normal.y, contact.normal.z
        );

        const delta_contact_c_x = targetPosition.x - boneWorldPositionC.x;
        const delta_contact_c_y = targetPosition.y - boneWorldPositionC.y;
        const delta_contact_c_z = targetPosition.z - boneWorldPositionC.z;

        //check if current effector position is above the contact point
        const dot_contact_side = v3_dot(directionX, directionY, directionZ, delta_contact_c_x, delta_contact_c_y, delta_contact_c_z);

        const delta_contact_c_length = v3Length_i(delta_contact_c_x, delta_contact_c_y, delta_contact_c_z);

        let influence;

        if (dot_contact_side < 0) {
            //penetration detected
            influence = 1;

        } else {
            //no penetration, hovering case, use hover distance for influence
            const normalized_effector_distance = inverseLerp(0, limbLength, delta_contact_c_length);

            influence = 1 - clamp(constraint.distance.normalizeValue(normalized_effector_distance), 0, 1);
        }

        if (influence <= 0) {
            //no influence
            return;
        }

        targetLocalRotationA.copy(boneA.quaternion);
        targetLocalRotationB.copy(boneB.quaternion);

        //compute
        two_joint_ik(
            boneWorldPositionA,
            boneWorldPositionB,
            boneWorldPositionC,
            targetPosition,
            0.01,
            globalRotationA,
            globalRotationB,
            targetLocalRotationA,
            targetLocalRotationB
        );

        //lerp bone positions based on influence
        r0.lerpQuaternions(boneA.quaternion, targetLocalRotationA, influence);
        r1.lerpQuaternions(boneB.quaternion, targetLocalRotationB, influence);

        boneA.setRotationFromQuaternion(r0);
        boneB.setRotationFromQuaternion(r1);

        boneA.updateMatrix();
        boneB.updateMatrix();
        boneC.updateMatrix();

        boneA.updateMatrixWorld();
        boneB.updateMatrixWorld();
        boneC.updateMatrixWorld();

        boneC.updateWorldMatrix(true, true);
    }
}
