/**
 * Created by Alex on 13/10/2014.
 */
import { System } from '../../ecs/System.js';
import GridPosition from '../components/GridPosition.js';
import GridObstacle from '../components/GridObstacle.js';

class GridObstacleSystem extends System {
    constructor() {
        super();

        this.componentClass = GridObstacle;
        this.dependencies = [GridObstacle, GridPosition];

        this.pathsNeedUpdate = false;
    }

    startup(entityManager, success, failure) {
        this.entityManager = entityManager;

        success();
    }

    recalculatePaths() {
        //todo this should be somewhere else
    }

    /**
     *
     * @param {GridObstacle} obstacle
     * @param {GridPosition} p
     * @param {int} entityId
     */
    link(obstacle, p, entityId) {

        this.pathsNeedUpdate = true;
    }

    /**
     *
     * @param {GridObstacle} obstacle
     * @param {GridPosition} p
     * @param {int} entityId
     */
    unlink(obstacle, p, entityId) {

        this.pathsNeedUpdate = true;
    }

    update(timeDelta) {
        if (this.pathsNeedUpdate) {
            this.recalculatePaths();
            this.pathsNeedUpdate = false;
        }
    }
}


export default GridObstacleSystem;
