import Signal from "../../core/events/signal/Signal.js";
import { assert } from "../../core/assert.js";
import { EventType } from "./EntityManager.js";

/**
 *
 * @enum
 */
export const EntityBuilderFlags = {
    Built: 1
};

/**
 * Representation of an entity, helps build entities and keep track of them without having to access {@link EntityComponentDataset} directly
 */
class EntityBuilder {
    /**
     *
     * @constructor
     */
    constructor() {
        /**
         * @type {number}
         */
        this.entity = void 0;

        /**
         *
         * @type {Array}
         */
        this.element = [];

        this.deferredListeners = [];

        /**
         *
         * @type {EntityComponentDataset}
         */
        this.dataset = null;

        this.flags = 0;

        /**
         *
         * @type {Object}
         */
        this.properties = {};

        this.on = {
            built: new Signal()
        };

    }

    /**
     * Handles event when entity is removed without invoking {@link #destroy} method
     * @private
     */
    __handleEntityDestroyed() {
        this.clearFlag(EntityBuilderFlags.Built);
    }

    /**
     *
     * @param {number|EntityBuilderFlags} value
     */
    setFlag(value) {
        this.flags |= value;
    }

    /**
     *
     * @param {number|EntityBuilderFlags} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        assert.isNumber(flag, 'flag');

        return (this.flags & flag) !== 0;
    }

    /**
     *
     * @param {number|EntityBuilderFlags} flag
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     * Remove all components from the entity
     */
    removeAllComponents() {
        const elements = this.element;
        const n = elements.length;
        for (let i = n - 1; i >= 0; i--) {
            const component = elements[i];

            this.removeComponent(component.__proto__.constructor);
        }
    }

    /**
     * @template T
     * @param {T} componentInstance
     * @returns {EntityBuilder}
     */
    add(componentInstance) {
        if (componentInstance === undefined) {
            throw new Error("Can not add " + componentInstance + " to EntityBuilder");
        }

        assert.notOk(this.getComponent(componentInstance.__proto__.constructor) !== null, `Component of this type already exists`);

        this.element.push(componentInstance);

        if (this.getFlag(EntityBuilderFlags.Built)) {
            //already built, add component to entity
            this.dataset.addComponentToEntity(this.entity, componentInstance);
        }

        return this;
    }

    /**
     * @template T
     * @param {Class<T>} klass
     * @returns {T|null} component of specified class
     */
    getComponent(klass) {
        for (let i = 0; i < this.element.length; i++) {
            const component = this.element[i];
            if (component instanceof klass) {
                return component;
            }
        }
        return null;
    }

    /**
     *
     * @param {class} klass
     * @returns {*|null}
     */
    removeComponent(klass) {
        const elements = this.element;
        const n = elements.length;

        for (let i = 0; i < n; i++) {
            const component = elements[i];

            if (component instanceof klass) {
                elements.splice(i, 1);

                //see if entity is built
                if (this.getFlag(EntityBuilderFlags.Built)) {

                    this.dataset.removeComponentFromEntity(this.entity, klass);

                }

                return component;
            }

        }
        return null;
    }

    /**
     *
     * @param {string} eventName
     * @param {*} event
     */
    sendEvent(eventName, event) {
        if (this.getFlag(EntityBuilderFlags.Built)) {
            this.dataset.sendEvent(this.entity, eventName, event);
        } else {
            console.warn("Entity doesn't exist. Event " + eventName + ":" + event + " was not sent.")
        }
    }

    /**
     *
     * @param {string} eventName
     * @param {function} listener
     * @returns {EntityBuilder}
     */
    addEventListener(eventName, listener) {
        if (this.getFlag(EntityBuilderFlags.Built)) {
            this.dataset.addEntityEventListener(this.entity, eventName, listener);
        } else {
            this.deferredListeners.push({
                name: eventName,
                listener: listener
            });
        }
        return this;
    }

    /**
     *
     * @param {string} eventName
     * @param {function} listener
     * @returns {EntityBuilder}
     */
    removeEventListener(eventName, listener) {
        if (this.getFlag(EntityBuilderFlags.Built)) {
            this.dataset.removeEntityEventListener(this.entity, eventName, listener);
        } else {
            const listeners = this.deferredListeners;

            for (let i = 0, numListeners = listeners.length; i < numListeners; i++) {
                const deferredDescriptor = listeners[i];

                if (deferredDescriptor.name === eventName && deferredDescriptor.listener === listener) {
                    listeners.splice(i, 1);

                    i--;
                    numListeners--;
                }
            }
        }
        return this;
    }

    /**
     * Removes built entity from the EntityManger
     * @returns {boolean}
     */
    destroy() {
        if (this.getFlag(EntityBuilderFlags.Built)) {

            const dataset = this.dataset;
            const entity = this.entity;

            //check that the entity is the same as what we have built
            assert.ok(checkExistingComponents(entity, this.element, dataset), `Signature of EntityBuilder does not match existing entity(id=${entity})`);

            dataset.removeEntityEventListener(entity, EventType.EntityRemoved, this.__handleEntityDestroyed, this);

            dataset.removeEntity(entity);

            this.entity = void 0;

            this.clearFlag(EntityBuilderFlags.Built);

            return true;
        } else {
            return false;
        }
    }

    /**
     *
     * @returns {Number} entity
     * @param {EntityComponentDataset} dataset
     */
    build(dataset) {
        assert.notEqual(dataset, undefined, 'dataset is undefined');
        assert.notEqual(dataset, null, 'dataset is null');

        if (this.getFlag(EntityBuilderFlags.Built) && checkExistingComponents(this.entity, this.element, dataset)) {
            //already built
            return this.entity;
        }

        const entity = this.entity = dataset.createEntity();
        this.dataset = dataset;

        let i, l;

        const listeners = this.deferredListeners;

        for (i = 0, l = listeners.length; i < l; i++) {
            const subscription = listeners[i];
            dataset.addEntityEventListener(entity, subscription.name, subscription.listener);
        }

        const element = this.element;

        for (i = 0, l = element.length; i < l; i++) {
            const component = element[i];
            dataset.addComponentToEntity(entity, component);
        }

        this.setFlag(EntityBuilderFlags.Built);

        dataset.addEntityEventListener(entity, EventType.EntityRemoved, this.__handleEntityDestroyed, this);

        this.on.built.dispatch(entity, dataset);
        return entity;
    }
}


/**
 *
 * @param {int} entity
 * @param {Array} components
 * @param {EntityComponentDataset} dataset
 */
function checkExistingComponents(entity, components, dataset) {
    if (!dataset.entityExists(entity)) {
        return false;
    }

    const numComponents = components.length;

    for (let i = 0; i < numComponents; i++) {
        const component = components[i];

        const actual = dataset.getComponent(entity, component.constructor);

        if (actual !== component) {
            return false;
        }
    }

    return true;
}

export default EntityBuilder;
