/**
 *
 * @param {number} entity
 * @param {EntityComponentDataset} ecd
 * @param {string} path
 */
import { capitalize } from "../../../core/primitives/strings/StringUtils.js";

function resolvePath(entity, ecd, path) {
    if (!ecd.entityExists(entity)) {
        // entity doesn't exist
        return undefined;
    }

    const parts = path.split('.');


    const part_count = parts.length;

    if (part_count < 1) {
        return undefined;
    }

    const componentName = parts[0];

    const ComponentClass = ecd.getComponentClassByName(componentName);

    if (ComponentClass === null) {
        // no component of such class registered
        return undefined;
    }

    const component = ecd.getComponent(entity, ComponentClass);

    if (component === undefined) {
        // component not present on entity
        return undefined;
    }

    let thing = component;

    for (let i = 1; i < part_count; i++) {

        const part = parts[i];

        if (thing.hasOwnProperty(part)) {
            thing = thing[part];
        } else {
            const getter_name = `get${capitalize(part)}`;
            const getter = thing[getter_name];

            if (typeof getter === "function") {
                // resolve via getter
                thing = getter.call(thing);
            } else {
                // no getter
                return undefined;
            }
        }

    }

    return thing;
}

export class EntityProxyScope {

    constructor() {

        /**
         *
         * @type {number}
         */
        this.entity = -1;

        /**
         *
         * @type {EntityComponentDataset}
         */
        this.ecd = null;

        this.scope = new Proxy(this, {
            get(target, p, receiver) {

                const ecd = target.ecd;
                const entity = target.entity;

                return resolvePath(entity, ecd, p);
            },
            set(target, p, value, receiver) {

                const v = resolvePath(target.entity, target.ecd, p);

                if (v === undefined) {
                    throw new Error(`Path ${p} could not be resolved`);
                }

                const type = typeof v;
                if (type === "object" && typeof v.set === "function") {
                    v.set(value);
                } else {
                    throw new Error(`Terminal property '${p}' is of wrong type`);
                }
            }
        });
    }

    /**
     *
     * @param {number} entity
     * @param {EntityComponentDataset} ecd
     */
    attach(entity, ecd) {
        this.entity = entity;
        this.ecd = ecd;
    }

}
