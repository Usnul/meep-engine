/**
 * Created by Alex on 17/10/2016.
 */


import { System } from '../../../ecs/System.js';
import Path from '../components/Path.js';

class PathSystem extends System {
    constructor() {
        super();
        this.componentClass = Path;
        this.dependencies = [Path];
        //
        this.entityManager = null;
    }
}


export default PathSystem;
