/**
 * Created by Alex on 19/03/2015.
 */
import { System } from '../System.js';
import AlignToVelocity from '../components/AlignToVelocity.js';
import { Transform } from '../transform/Transform.js';
import Motion from '../components/Motion.js';
import Vector3 from "../../../core/geom/Vector3.js";


class AlignToVelocitySystem extends System {
    constructor() {
        super();
        this.componentClass = AlignToVelocity;

        this.dependencies = [AlignToVelocity];
    }

    add(aabb, entity) {

    }

    remove(component) {
    }

    update(timeDelta) {
        const em = this.entityManager;
        const MotionType = em.getOwnerSystemIdByComponentClass(Motion);
        const PhysicsBodyType = em.getOwnerSystemIdByComponentClass(PhysicsBody);
        const velocity = new Vector3();
        em.traverseEntities([AlignToVelocity, Transform], function (align, transform, entity) {
            //find velocity
            const motion = em.getComponentByType(entity, MotionType);
            if (motion !== null) {
                velocity.copy(motion.velocity);
            } else {
                const body = em.getComponentByType(entity, PhysicsBodyType);
                if (body !== null) {
                    velocity.copy(body.velocity);
                } else {
                    return;
                }
            }
            const delta = velocity.sub(transform.position);
            //set transform rotation based on velocity
            Transform.adjustRotation(transform.rotation, delta, align.angularSpeed * timeDelta);
        });
    }
}


export default AlignToVelocitySystem;
