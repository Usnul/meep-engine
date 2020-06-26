import EntityBuilder from "./EntityBuilder.js";

/**
 *
 * @param {Object} template
 * @param {Object} seed
 */
function populateJsonTemplate(template, seed) {
    if (seed === undefined) {
        return template;
    } else if (template === null) {
        return template;
    } else {

        const templateType = typeof template;

        if (templateType === "string") {
            if (template.startsWith('$')) {
                const varName = template.slice(1);

                return seed[varName];
            } else {
                return template;
            }
        } else if (templateType === "object") {

            if (Array.isArray(template)) {
                //populate array
                const l = template.length;

                const result = [];

                for (let i = 0; i < l; i++) {
                    result[i] = populateJsonTemplate(template[i], seed);
                }

                return result;
            } else {
                const result = {};

                for (const propertyName in template) {
                    const templateValue = template[propertyName];

                    const seededValue = populateJsonTemplate(templateValue, seed);

                    result[propertyName] = seededValue;
                }

                return result;
            }

        } else {
            return template;
        }

    }
}

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

        this.addJSON(constructor, component.toJSON());
    }

    /**
     * @template T
     * @param {Class<T>} klass
     * @param {Object} json
     */
    addJSON(klass, json) {
        this.componentnts.set(klass, json);
    }


    /**
     *
     * @return {EntityBuilder}
     */
    buildEntityBuilder(templateSeed) {
        const eb = new EntityBuilder();

        this.componentnts.forEach((template, ComponentClass) => {
            const component = new ComponentClass();

            const json = populateJsonTemplate(template, templateSeed);

            component.fromJSON(json);

            eb.add(component);
        });

        return eb;
    }
}
