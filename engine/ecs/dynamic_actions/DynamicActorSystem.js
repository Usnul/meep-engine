import { DynamicActor } from "./DynamicActor.js";
import { AbstractContextSystem } from "../system/AbstractContextSystem.js";
import { SystemEntityContext } from "../system/SystemEntityContext.js";
import { DataScope } from "../../../../model/game/unit/actions/data/DataScope.js";
import { Blackboard } from "../../intelligence/blackboard/Blackboard.js";

class Context extends SystemEntityContext {

    process(entity, scope) {

    }

    /**
     *
     * @param {string} event
     * @param {*} data Event data
     */
    handleEvent(event, data) {
        /**
         *
         * @type {DynamicActorSystem}
         */
        const system = this.system;
        /**
         * @type {DynamicRuleDescription}
         */
        const match = system.match(
            this.entity,
            event,
            data
        );
    }

    link() {
        const ecd = this.getDataset();

        ecd.addEntityAnyEventListener(this.entity, this.handleEvent, this);
    }

    unlink() {
        const ecd = this.getDataset();

        ecd.removeAnyEventListener(this.entity, this.handleEvent, this);
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

    pushBlackboardToScope(entity) {

        // fetch blackboard
        const ecd = this.entityManager.dataset;

        /**
         *
         * @type {Blackboard}
         */
        const blackboard = ecd.getComponent(entity, Blackboard);

        if (blackboard !== undefined) {
            this.scope.push(blackboard.getValueProxy());
        }


    }

    /**
     *
     * @param {number} entity
     * @param {string} event
     * @param {Object} context
     * @returns {DynamicRuleDescription|undefined}
     */
    match(entity, event, context) {
        const top = this.scope.size();

        this.pushBlackboardToScope(entity)

        if (typeof context === 'object') {
            this.scope.push(context);
        }

        this.scope.push({
            event: event
        });

        const scopeProxy = this.scope.proxy;

        /**
         *
         * @type {DynamicRuleDescription}
         */
        const description = this.database.matchBest(scopeProxy);

        if (description !== undefined) {
            description.action.execute(entity, this.entityManager.dataset, scopeProxy);
        }

        this.scope.unwind(top);

        return description;
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
