import { DynamicActor } from "./DynamicActor.js";
import { AbstractContextSystem } from "../system/AbstractContextSystem.js";
import { SystemEntityContext } from "../system/SystemEntityContext.js";
import { DataScope } from "../../../../model/game/unit/actions/data/DataScope.js";
import { Blackboard } from "../../intelligence/blackboard/Blackboard.js";
import { compareNumbersDescending, returnTrue } from "../../../core/function/Functions.js";
import { randomMultipleFromArray } from "../../../core/collection/ArrayUtils.js";
import { EntityProxyScope } from "../binding/EntityProxyScope.js";
import EntityBuilder from "../EntityBuilder.js";
import { BehaviorComponent } from "../../intelligence/behavior/ecs/BehaviorComponent.js";
import { SequenceBehavior } from "../../intelligence/behavior/composite/SequenceBehavior.js";
import { DieBehavior } from "../../../../model/game/util/behavior/DieBehavior.js";
import { SerializationMetadata } from "../components/SerializationMetadata.js";
import Tag from "../components/Tag.js";
import { OverrideContextBehavior } from "../../../../model/game/util/behavior/OverrideContextBehavior.js";

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

    /**
     *
     * @param {number} entity
     * @param {DynamicRuleDescription} rule
     * @param {*} context
     */
    executeRule(entity, rule, context) {
        const ecd = this.entityManager.dataset;
        const behavior = rule.action.execute(entity, ecd, context, this);

        new EntityBuilder()
            .add(BehaviorComponent.fromOne(SequenceBehavior.from([
                OverrideContextBehavior.from(
                    {
                        entity
                    },
                    behavior
                ),
                DieBehavior.create()
            ])))
            .add(Tag.fromJSON(['DynamicActor-RuleExecutor']))
            .add(SerializationMetadata.Transient)
            .build(ecd);
    }

    /**
     *
     * @param {number} entity
     * @param {DataScope} scope
     */
    populateEntityScope(entity, scope) {

        // fetch blackboard
        const ecd = this.entityManager.dataset;

        /**
         *
         * @type {Blackboard}
         */
        const blackboard = ecd.getComponent(entity, Blackboard);

        if (blackboard !== undefined) {
            scope.push(blackboard.getValueProxy());
        }

        const entityProxyScope = new EntityProxyScope();

        entityProxyScope.attach(entity, ecd);

        scope.push(entityProxyScope.scope);
    }

    /**
     * Given a context, returns N actors that match that context best, filter is used to restrict search and reject certain actors entirely
     * Useful for picking an actor for a response action
     *
     * @param {Object} context
     * @param {function(entity:number,dataset:EntityComponentDataset):} [filter]
     * @param {*} [filterContext]
     * @param {number} [count]
     * @returns {{entity:number,rule:DynamicRuleDescription, scope: DataScope}[]}
     */
    requestBestActors(context, filter = returnTrue, filterContext = null, count = 1) {
        /**
         *
         * @type {{entity:number, rule:DynamicRuleDescription, scope: DataScope}[]}
         */
        const result = [];

        const ecd = this.entityManager.dataset;


        /**
         *
         * @type {{entity:number, rule:DynamicRuleDescription, scope: DataScope}[][]}
         */
        const by_score = [];
        const scores = [];

        if (ecd !== null) {

            ecd.traverseComponents(DynamicActor, (actor, entity) => {


                const accepted_by_filter = filter.call(filterContext, entity, ecd);

                if (accepted_by_filter === false) {
                    return;
                }

                const scope = new DataScope();

                scope.push(context);

                this.populateEntityScope(entity, scope);

                const match = this.database.matchBest(scope.proxy);


                if (match === undefined) {
                    // no match
                    return;
                }

                const score = match.getPredicateComplexity();

                if (by_score[score] === undefined) {
                    scores.push(score);
                    by_score[score] = [];
                }

                const match_entry = {
                    entity,
                    rule: match,
                    scope
                };

                by_score[score].push(match_entry);

            });

        }

        scores.sort(compareNumbersDescending);

        for (let i = 0; i < scores.length && result.length < count; i++) {
            const score = scores[i];

            const matches = by_score[score];

            const free_slots = count - result.length;

            const picked_count = randomMultipleFromArray(Math.random, matches, result, free_slots);
        }

        return result;
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

        this.populateEntityScope(entity, this.scope);

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
            this.executeRule(entity, description, scopeProxy);
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
