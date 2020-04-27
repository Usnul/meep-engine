/**
 * User: Alex Goldring
 * Date: 1/6/2014
 * Time: 08:37
 */
import { System } from '../System.js';
import PhysicalBody from '../components/PhysicalBody.js';
import Motion from '../components/Motion.js';
import { Transform } from '../components/Transform.js';
import Steering, { SteeringEvents, SteeringFlags } from '../components/Steering.js';
import { max2, min2, solveQuadratic } from "../../../core/math/MathUtils.js";
import Vector3, { v3_dot } from "../../../core/geom/Vector3.js";
import { alignToVector } from "../terrain/ecs/ClingToTerrainSystem.js";

/**
 *
 * @param {Vector3} result
 * @param {Vector3} source
 * @param {Vector3} target
 * @param {Vector3} targetVelocity
 * @param {number} sourceSpeed
 * @return {boolean}
 */
function computeInterceptPoint(result, source, target, targetVelocity, sourceSpeed) {
    const d_ts_x = target.x - source.x;
    const d_ts_y = target.y - source.y;
    const d_ts_z = target.z - source.z;

    // Get quadratic equation components
    const a = targetVelocity.dot(targetVelocity) - sourceSpeed * sourceSpeed;
    const b = 2 * v3_dot(targetVelocity.x, targetVelocity.y, targetVelocity.z, d_ts_x, d_ts_y, d_ts_z);

    const c = v3_dot(
        d_ts_x, d_ts_y, d_ts_z,
        d_ts_x, d_ts_y, d_ts_z
    );

    // Solve quadratic
    const ts = solveQuadratic(a, b, c); // See quad(), below

    // Find smallest positive solution
    let sol = null;
    if (ts) {
        const t0 = ts[0], t1 = ts[1];
        let t = Math.min(t0, t1);
        if (t < 0) t = Math.max(t0, t1);

        if (t > 0) {
            result.copy(targetVelocity).multiplyScalar(t).add(target);
            return true;
        }

    }
    return false;
}

class SteeringSystem extends System {
    constructor() {
        super();
        this.componentClass = Steering;

        this.dependencies = [Steering];
    }

    update(timeDelta) {
        const entityManager = this.entityManager;

        const ecd = entityManager.dataset;

        if (ecd === null) {
            return;
        }

        /**
         *
         * @param {number} entity
         * @param {Steering} steering
         * @param {Transform} transform
         * @param {Vector3} velocity
         */
        function process(entity, steering, transform, velocity) {
            if (!steering.getFlag(SteeringFlags.Active)) {
                //steering is inactive
                return;
            }

            const destination = steering.destination;

            const delta = destination.clone().sub(transform.position);
            delta.normalize();

            const distanceWithError = computeDistanceWithError(transform.position, destination, steering.targetMargin);

            if (distanceWithError > 0) {
                //not at the target yet
                const d = steering.maxSpeed;

                const angularLimit = steering.rotationSpeed * timeDelta;

                alignToVector(transform.rotation, delta, angularLimit, Vector3.up, Vector3.forward);

                //compute forward vector
                const v = Vector3.forward.clone();
                v.applyQuaternion(transform.rotation);
                v.normalize();


                //check old velocity to avoid flying past target
                if (distanceWithError < d * timeDelta) {
                    const distance = delta.length();
                    const adjustedVelocity = min2(d, distance / timeDelta);
                    v.multiplyScalar(adjustedVelocity);
                } else {
                    v.multiplyScalar(d);
                }

                velocity.copy(v);

            } else {
                //goal is reached, de-activate
                steering.clearFlag(SteeringFlags.Active);

                //drop velocity
                velocity.set(0, 0, 0);

                //dispatch
                ecd.sendEvent(entity, SteeringEvents.DestinationReached, steering);
            }
        }

        //Make sure physical bodies exist
        if (ecd.isComponentTypeRegistered(PhysicalBody)) {

            ecd.traverseEntities([Steering, PhysicalBody, Transform], function (steering, physicalBody, transform, entity) {

                const body = physicalBody.body;

                process(entity, steering, transform, body.linearVelocity);

            });

        }

        ecd.traverseEntities([Steering, Motion, Transform], function (steering, motion, transform, entity) {
            process(entity, steering, transform, motion.velocity);
        });
    }
}

/**
 *
 * @param {Vector3} v0
 * @param {Vector3} v1
 * @param {Vector3} error
 * @return {number}
 */
function computeDistanceWithError(v0, v1, error) {
    const absDelta = v0.clone().sub(v1).abs();

    absDelta.set(
        max2(absDelta.x - error.x, 0),
        max2(absDelta.y - error.y, 0),
        max2(absDelta.z - error.z, 0)
    );

    return absDelta.length();
}

export default SteeringSystem;
