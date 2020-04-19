/**
 * User: Alex Goldring
 * Date: 7/4/2014
 * Time: 20:43
 */


import { System } from '../../../ecs/System.js';
import PathFollower, { PathFollowerEventType, PathFollowerFlags } from '../components/PathFollower.js';
import Path from '../components/Path.js';
import Transform from '../../../ecs/components/Transform.js';
import Vector3 from "../../../../core/geom/Vector3.js";

const v3_forward = new Vector3();
const v3_temp1 = new Vector3();
const v3_temp2 = new Vector3();

/**
 *
 * @param {PathFollower} pathFollower
 * @param {Path} path
 * @param {Transform} transform
 * @param {number} timeDelta
 * @returns {number} remaining distance
 */
function performStep(pathFollower, path, transform, timeDelta) {
    const distance = pathFollower.speed.getValue() * timeDelta;


    if (pathFollower.getFlag(PathFollowerFlags.Loop)) {
        let d = distance;

        while (d > 0) {
            const d0 = d;

            d = path.move(d0);

            if (path.isComplete()) {
                path.reset();
            }

            if (d0 === d) {
                //seems path can not advance, avoid infinite loop and exit
                break;
            }
        }

    } else {
        path.move(distance);
    }

    /**
     *
     * @type {Vector3}
     */
    const nextPosition = v3_temp1;

    try {
        path.getCurrentPosition(nextPosition);
    } catch (e) {
        console.error("Failed to read current position", e);
    }

    const positionWriting = pathFollower.positionWriting;
    const position = transform.position;

    if (!positionWriting.x) {
        nextPosition.setX(position.x);
    }
    if (!positionWriting.y) {
        nextPosition.setY(position.y);
    }
    if (!positionWriting.z) {
        nextPosition.setZ(position.z);
    }

    if (!nextPosition.equals(position)) {
        const oldPosition = position;

        const alignment = pathFollower.rotationAlignment;
        if (alignment.x || alignment.y || alignment.z) {

            //compute old facing direction vector
            v3_forward.copy(Vector3.forward);

            v3_forward.applyQuaternion(transform.rotation);

            const positionDelta = v3_temp2;

            positionDelta.subVectors(nextPosition, oldPosition);

            if (!alignment.x) {
                positionDelta.x = v3_forward.x;
            }
            if (!alignment.y) {
                positionDelta.y = v3_forward.y;
            }
            if (!alignment.z) {
                positionDelta.z = v3_forward.z;
            }

            positionDelta.normalize();

            const angularLimit = pathFollower.rotationSpeed.getValue() * timeDelta;

            // console.log("Angular limit:", angularLimit, positionDelta.toJSON());

            Transform.adjustRotation(transform.rotation, positionDelta, angularLimit);
        }

        position.copy(nextPosition);
    }

}

class PathFollowingSystem extends System {
    constructor() {
        super();

        this.componentClass = PathFollower;
        this.dependencies = [PathFollower];
    }

    /**
     *
     * @param {number} timeDelta Time in seconds
     */
    update(timeDelta) {
        const entityManager = this.entityManager;

        const dataset = entityManager.dataset;

        /**
         *
         * @param {PathFollower} pathFollower
         * @param {Transform} transform
         * @param {Path} path
         * @param {number} entity Entity ID
         */
        function visitEntity(pathFollower, transform, path, entity) {
            if (!pathFollower.getFlag(PathFollowerFlags.Active)) {
                //follower is not active, skip
                return;
            }

            if (path.isEmpty()) {
                //path is empty, do nothing
                return;
            }

            performStep(pathFollower, path, transform, timeDelta);

            if (path.isComplete()) {

                //deactivate
                pathFollower.clearFlag(PathFollowerFlags.Active);

                dataset.sendEvent(entity, PathFollowerEventType.EndReached);
            }
        }

        if (dataset !== null) {
            dataset.traverseEntities([PathFollower, Transform, Path], visitEntity);
        }
    }
}


export default PathFollowingSystem;
