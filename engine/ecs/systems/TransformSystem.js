/**
 * Created by Alex on 02/04/2014.
 */
import { System } from '../System.js';
import { Transform } from '../components/Transform.js';


class TransformSystem extends System {
    constructor() {
        super();

        this.componentClass = Transform;

        this.dependencies = [Transform];
    }
}

export default TransformSystem;
