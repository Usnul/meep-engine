/**
 * Created by Alex on 25/11/2014.
 */
import { System } from '../System.js';
import Tag from '../components/Tag.js';
import Transform from '../components/Transform.js';
import AABB from '../components/AABB.js';
import AABBCollider from '../components/AABBCollider.js';


class AABBColliderSystem extends System {
    constructor() {
        super();
        this.componentClass = AABBCollider;

        this.dependencies = [AABBCollider];
    }

    add(component, entity) {
        this.entityManager.getComponentAsync(entity, Transform, function (transform) {
            const p0 = component.position;
            const p1 = transform.position;
            p0.x = p1.x;
            p0.y = p1.y;
            p0.z = p1.z;
        });
    }

    remove(component) {
    }

    update(timeDelta) {
        const entityManager = this.entityManager;
        const aabbSystem = entityManager.getOwnerSystemByComponentClass(AABB);
        entityManager.traverseEntities([Transform, AABBCollider], function (transform, collider, entity) {

            const p1 = transform.position;
            const p2 = collider.position;


            if (p2.x !== p1.x || p2.y !== p1.y || p2.z !== p1.z) {
                aabbSystem.traverseLineSegment(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, function (otherEntity) {
                    const tag = entityManager.getComponent(otherEntity, Tag);
                    if (collider.tags.indexOf(tag.name) != -1) {
                        entityManager.sendEvent(entity, "collision", otherEntity);
                        return false; //stop traversal
                    }
                });
                //write new position
                p2.x = p1.x;
                p2.y = p1.y;
                p2.z = p1.z;
            }
        });
    }
}

export default AABBColliderSystem;
