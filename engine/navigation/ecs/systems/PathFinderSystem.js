/**
 * Created by Alex on 11/08/2014.
 */
import { System } from '../../../ecs/System.js';
import Transform from '../../../ecs/components/Transform.js';
import PathFinder from '../components/PathFinder.js';
import Navigator from '../../PathFinder.js';
import Vector3 from "../../../../core/geom/Vector3.js";
import Path from "../components/Path.js";

const v3 = new Vector3();

class PathFinderSystem extends System {
    constructor() {
        super();
        this.componentClass = PathFinder;
        this.dependencies = [PathFinder];
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;
        this.navigator = new Navigator();
    }

    add(component, entity) {
    }

    remove(component) {
    }

    update(timeDelta) {
        const entityManager = this.entityManager;
        const nav = this.navigator;

        /**
         *
         * @param {PathFinder} finder
         * @param {Path} path
         * @param {Transform} transform
         * @param {number} entity
         */
        function visitEntity(finder, path, transform, entity) {

            const desination = finder.desination;

            if (finder.finding === false) {
                path.getPosition(path.getPointCount()-1, v3);

                //check if existing path is going to the destination
                if (!v3.equals(desination)) {

                    finder.finding = true;

                    //find path
                    nav.findPath(transform.position, desination, 2, function (path) {
                        finder.finding = false;

                        path.setPositionsFromVectorArray(path);
                    });
                }
            }

        }

        entityManager.traverseEntities([PathFinder, Path, Transform], visitEntity);
    }
}


export default PathFinderSystem;
