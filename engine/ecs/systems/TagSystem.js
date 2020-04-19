/**
 * Created by Alex on 23/04/2014.
 */
import { System } from '../System.js';
import Tag from '../components/Tag.js';


class TagSystem extends System {
    constructor() {
        super();
        this.componentClass = Tag;

        this.dependencies = [Tag];

        this.entityManager = null;
    }
}


export default TagSystem;
