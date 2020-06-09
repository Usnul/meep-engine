import EntityBuilder from "./EntityBuilder.js";

export class EntityBlueprint {
    constructor() {
        /**
         *
         * @type {Map<Class, Object>}
         */
        this.componentnts = new Map();
    }

    /**
     *
     * @param {[]} components
     * @returns {EntityBlueprint}
     */
    static from(components = []) {
        const r = new EntityBlueprint();

        for (let i = 0; i < components.length; i++) {
            const component = components[i];

            r.add(component);
        }

        return r;
    }

    /**
     *
     * @param {Object} component
     */
    add(component) {
        const constructor = component.__proto__.constructor;

        this.componentnts.set(constructor, component.toJSON());
    }


    /**
     *
     * @return {EntityBuilder}
     */
    buildEntityBuilder() {
        const eb = new EntityBuilder();

        this.componentnts.forEach((json, ComponentClass) => {
            const component = new ComponentClass();

            component.fromJSON(json);

            eb.add(component);
        });

        return eb;
    }
}
