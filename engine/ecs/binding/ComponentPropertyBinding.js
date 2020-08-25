import { resolvePath } from "../../../core/json/JsonUtils.js";

export class ComponentPropertyBinding {
    constructor() {
        /**
         * @type {ComponentPropertyPath}
         */
        this.path = null;

        /**
         *
         * @type {Vector1|Vector2|Vector3|ObservedBoolean}
         */
        this.value = null;
    }

    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {number} entity
     */
    resolve(ecd, entity) {

        const className = this.path.component;
        const ComponentClass = ecd.getComponentClassByName(className);

        if (ComponentClass === null) {
            throw new Error(`Component class '${className}' not found in the dataset`);
        }

        const component = ecd.getComponent(entity, ComponentClass);

        if (component === undefined) {
            throw new Error(`Component '${className}' is not found on entity '${entity}'`);
        }

        const value = resolvePath(component, this.path.path);

        if (value === undefined) {
            throw new Error(`Property ${this.path.path} is undefined`);
        }

        this.value = value;
    }

}
