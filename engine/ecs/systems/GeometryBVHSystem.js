/**
 * Created by Alex on 02/02/2015.
 */
import { System } from '../System.js';
import GeometryBVH from '../components/GeometryBVH.js';
import BVHFromGeometry from '../../graphics/geometry/bvh/BVHFromGeometry.js';


class GeometryBVHSystem extends System {
    constructor(grid) {
        super();
        this.componentClass = GeometryBVH;

        this.dependencies = [GeometryBVH];
        //
        this.entityManager = null;
        this.grid = grid;
    }

    unlink(component, entity) {
    }

    link(component, entity) {
        //build bvh
        const g = component.geometry;
        //check if bvh exists
        if (component.bvh === null) {
            component.bvh = BVHFromGeometry(g);
        }
    }

    update(timeDelta) {
    }
}


export default GeometryBVHSystem;
