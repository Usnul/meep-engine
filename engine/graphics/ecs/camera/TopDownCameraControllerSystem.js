/**
 * Created by Alex on 01/07/2015.
 */


import Vector3 from "../../../../core/geom/Vector3.js";
import ObservedValue from "../../../../core/model/ObservedValue.js";
import { Transform } from '../../../ecs/components/Transform.js';
import { System } from '../../../ecs/System.js';


import { clamp } from '../../../../core/math/MathUtils.js';

import TopDownCameraController from './TopDownCameraController.js';

import { Euler as ThreeEuler } from 'three';
import Quaternion from "../../../../core/geom/Quaternion.js";


const v3 = new Vector3();

class TopDownCameraControllerSystem extends System {
    constructor() {
        super();

        this.enabled = new ObservedValue(true);
        this.componentClass = TopDownCameraController;
        this.dependencies = [TopDownCameraController];

    }

    update(timeDelta) {
        const em = this.entityManager;

        /**
         *
         * @type {EntityComponentDataset}
         */
        const dataset = em.dataset;

        if (this.enabled.get() && dataset !== null) {
            dataset.traverseEntities([TopDownCameraController, Transform], function (control, transform, entity) {

                //clamp the distance
                control.distance = clamp(control.distance, control.distanceMin, control.distanceMax);

                const distance = control.distance;
                const target = control.target;
                const rotationAngle = control.yaw;
                const tiltAngle = control.pitch;

                computeCameraFacingVector(control.yaw, control.pitch, control.roll, v3);

                v3.multiplyScalar(distance);
                v3.add(target);

                transform.position.copy(v3);
                euler.set(tiltAngle, rotationAngle, control.roll);
                transform.rotation.__setFromEuler(euler.x, euler.y, euler.z, euler.order);
            });
        }

    }
}

/// </summary>
/// <param name="sourcePoint">Coordinates of source point</param>
/// <param name="destPoint">Coordinates of destionation point</param>
/// <returns></returns>

const lookAt = (function () {
    // just in case you need that function also
    function CreateFromAxisAngle(axis, angle, result) {
        const halfAngle = angle * .5;
        const halfSin = Math.sin(halfAngle);
        const halfCos = Math.cos(halfAngle);
        result.set(axis.x * halfSin, axis.y * halfSin, axis.z * halfSin, halfCos);
    }

    const forwardVector = new Vector3();
    const __forwardVector = new Vector3(0, 0, 1);
    const __upVector = new Vector3(0, 1, 0);
    const rotAxis = new Vector3();

    function lookAt(sourcePoint, destPoint, result) {
        forwardVector.copy(destPoint).sub(sourcePoint).normalize();
        const dot = __forwardVector.dot(forwardVector);
        if (Math.abs(dot - (-1.0)) < 0.000001) {
            return result.set(__upVector.x, __upVector.y, __upVector.z, 3.1415926535897932);
        }
        if (Math.abs(dot - (1.0)) < 0.000001) {
            return result.set(0, 0, 0, 1);
        }

        const rotAngle = Math.acos(dot);
        rotAxis.copy(__forwardVector);
        rotAxis.cross(forwardVector);
        rotAxis.normalize();
        return CreateFromAxisAngle(rotAxis, rotAngle, result);
    }

    return lookAt;
})();


/**
 *
 * @type {Euler}
 */
const euler = new ThreeEuler(0, 0, 0, "YXZ");
const q = new Quaternion();

/**
 *
 * @param {number} yaw
 * @param {number} pitch
 * @param roll
 * @param {Vector3} result
 */
export function computeCameraFacingVector(yaw, pitch, roll, result) {

    q.fromEulerAngles(pitch, yaw, roll);
    q.normalize();

    result.copy(Vector3.forward);
    result.applyQuaternion(q);
    result.normalize();

}

/**
 *
 * @param {Transform} transform
 * @param {TopDownCameraController} controller
 */
export function setCameraControllerFromTransform(transform, controller) {
    //set camera controller
    const euler = new ThreeEuler();

    transform.rotation.__setThreeEuler(euler);

    controller.yaw = euler.y;

    const pitch = euler.x;

    controller.pitch = pitch;

    controller.roll = 0;

    //compute direction
    const direction = new Vector3();

    direction.applyQuaternion(transform.rotation);

    direction.normalize();

    controller.distance = 20;

    const targetOffset = direction.clone()
        .multiplyScalar(controller.distance);

    const target = transform.position.clone()
        .sub(targetOffset);

    controller.target.copy(target)
}

export default TopDownCameraControllerSystem;
