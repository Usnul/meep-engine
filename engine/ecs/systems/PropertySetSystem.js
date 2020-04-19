/**
 * Created by Alex on 13/04/2017.
 */


import { System } from '../System.js';
import PropertySet from '../components/PropertySet.js';

class PropertySetSystem extends System {
    constructor() {
        super();
        this.componentClass = PropertySet;

        this.dependencies = [PropertySet];
    }
}


export default PropertySetSystem;
