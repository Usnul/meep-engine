import { DynamicActor } from "./DynamicActor.js";
import { AbstractContextSystem } from "../system/AbstractContextSystem.js";
import { SystemEntityContext } from "../system/SystemEntityContext.js";
import { DataScope } from "../../../../model/game/unit/actions/data/DataScope.js";

class Context extends SystemEntityContext {

    /**
     *
     * @param {string} event
     * @param {*} data Event data
     */
    handle(event, data) {
        this.system.match(event, {});
    }

    link() {
        const ecd = this.getDataset();

        ecd.addEntityAnyEventListener(this.entity, this.handle, this);
    }

    unlink() {
        const ecd = this.getDataset();

        ecd.removeAnyEventListener(this.entity, this.handle, this);
    }
}

/**
 * In seconds
 * @type {number}
 */
const IDLE_EVENT_TIMEOUT = 2;

export class DynamicActorSystem extends AbstractContextSystem {
    /**
     *
     * @param {Engine} engine
     */
    constructor(engine) {
        super(Context);

        this.dependencies = [DynamicActor];


        /**
         *
         * @type {Engine}
         */
        this.engine = engine;

        /**
         *
         * @type {DynamicRuleDescriptionTable}
         */
        this.database = null;

        /**
         * Scope used for dispatching actions
         * @type {DataScope}
         */
        this.scope = new DataScope();

        /**
         * Used to keep track of when to send "idle" event to agents
         * @type {number}
         * @private
         */
        this.__idle_event_timer = 0;
    }

    /**
     *
     * @param {string} event
     * @param {Object} context
     */
    match(event, context) {

        this.scope.push(context);

        this.scope.push({
            event: event
        });

        /**
         *
         * @type {DynamicRuleDescription[]}
         */
        const descriptions = this.database.match(this.scope.proxy);

        this.scope.pop();
        this.scope.pop();


        if (descriptions.length > 0) {
            console.log(descriptions);
        }
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.database = this.engine.staticKnowledge.getTable('dynamic-actions');

        super.startup(entityManager, readyCallback, errorCallback);
    }

    /**
     *
     * @param {DynamicActor} actor
     * @param {number} entity
     */
    dispatchIdleEvent(actor, entity) {

        this.entityManager.dataset.sendEvent(entity, 'idle', {});

    }

    update(timeDelta) {

        this.__idle_event_timer += timeDelta;

        while (this.__idle_event_timer > IDLE_EVENT_TIMEOUT) {
            this.__idle_event_timer -= IDLE_EVENT_TIMEOUT;

            const dataset = this.entityManager.dataset;

            if (dataset !== null) {

                dataset.traverseComponents(DynamicActor, this.dispatchIdleEvent, this);

            }
        }

    }
}
