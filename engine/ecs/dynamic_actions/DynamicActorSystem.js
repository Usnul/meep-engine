import { DynamicActor } from "./DynamicActor.js";
import { AbstractContextSystem } from "../system/AbstractContextSystem.js";
import { SystemEntityContext } from "../system/SystemEntityContext.js";
import { DataScope } from "../../../../model/game/unit/actions/data/DataScope.js";
import { Blackboard } from "../../intelligence/blackboard/Blackboard.js";
import { compareNumbersDescending, returnTrue } from "../../../core/function/Functions.js";
import { randomMultipleFromArray } from "../../../core/collection/ArrayUtils.js";
import { EntityProxyScope } from "../binding/EntityProxyScope.js";
import EntityBuilder, { EntityBuilderFlags } from "../EntityBuilder.js";
import { BehaviorComponent } from "../../intelligence/behavior/ecs/BehaviorComponent.js";
import { SequenceBehavior } from "../../intelligence/behavior/composite/SequenceBehavior.js";
import { DieBehavior } from "../../../../model/game/util/behavior/DieBehavior.js";
import { SerializationMetadata } from "../components/SerializationMetadata.js";
import Tag from "../components/Tag.js";
import { OverrideContextBehavior } from "../../../../model/game/util/behavior/OverrideContextBehavior.js";
import { HashMap } from "../../../core/collection/HashMap.js";
import { computeStringHash } from "../../../core/primitives/strings/StringUtils.js";
import { randomFloatBetween, randomFromArray } from "../../../core/math/MathUtils.js";
import { assert } from "../../../core/assert.js";
import { RuleExecution } from "./RuleExecution.js";

/**
 * In seconds
 * @type {number}
 */
const IDLE_EVENT_TIMEOUT_MIN = 2;

/**
 * In seconds
 * @type {number}
 */
const IDLE_EVENT_TIMEOUT_MAX = 5;

class Context extends SystemEntityContext {

    constructor() {
        super();

        this.execution = new RuleExecution();

        /**
         *
         * @type {number}
         */
        this.next_idle_event_time = 0;
    }

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

        this.next_idle_event_time = this.system.__current_time + randomFloatBetween(Math.random, IDLE_EVENT_TIMEOUT_MIN, IDLE_EVENT_TIMEOUT_MAX);

        ecd.addEntityAnyEventListener(this.entity, this.handleEvent, this);
    }

    unlink() {
        const ecd = this.getDataset();

        const removed = ecd.removeAnyEventListener(this.entity, this.handleEvent, this);

        if (!removed) {
            console.warn('Listener not removed', this.entity);
        }
    }
}


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
         * When precisely each rule was last used
         * @type {HashMap<DynamicRuleDescription, number>}
         * @private
         */
        this.__global_last_used_times = new HashMap({
            keyEqualityFunction(a, b) {
                return a.id === b.id;
            },
            keyHashFunction(k) {
                return computeStringHash(k.id);
            }
        });

        /**
         * Time when rule will be cooled down
         * @type {Map<string, number>}
         * @private
         */
        this.__global_cooldown_ready = new Map();

        /**
         *
         * @type {MultiPredicateEvaluator}
         */
        this.evaluator = null;

        /**
         *
         * @type {number}
         * @private
         */
        this.__current_time = 0;
    }

    /**
     *
     * @return {number}
     */
    getCurrentTime() {
        return this.engine.ticker.clock.getElapsedTime();
    }

    /**
     *
     * @param {number} entity
     * @param {DynamicRuleDescription} rule
     * @param {*} context
     */
    attemptRuleExecution(entity, rule, context) {

        /**
         *
         * @type {Context}
         */
        const ctx = this.__getEntityContext(entity);

        const execution = ctx.execution;

        if (execution.executor !== null && execution.executor.getFlag(EntityBuilderFlags.Built)) {
            // there is an active rule being executed, see if this one has the right to interrupt

            if (rule.priority <= execution.rule.priority) {
                // currently running rule cannot be interrupted by new one
                return false;
            }
        }

        this.executeRule(entity, rule, context);

    }

    /**
     *
     * @param {number} entity
     */
    terminateActiveExecution(entity) {

        /**
         *
         * @type {Context}
         */
        const ctx = this.__getEntityContext(entity);

        const execution = ctx.execution;

        if (execution.executor !== null && execution.executor.getFlag(EntityBuilderFlags.Built)) {
            execution.executor.destroy();
        }
    }

    /**
     *
     * @param {number} entity
     * @param {DynamicRuleDescription} rule
     * @param {*} context
     */
    executeRule(entity, rule, context) {
        // console.log('Executing rule', rule, entity, objectShallowCopyByOwnKeys(context));

        /**
         *
         * @type {Context}
         */
        const ctx = this.__getEntityContext(entity);

        this.terminateActiveExecution(entity);

        // record rule usage time
        this.__global_last_used_times.set(rule, this.getCurrentTime());

        // set cooldown
        this.__global_cooldown_ready.set(rule, this.getCurrentTime() + rule.cooldown_global.sampleRandom(Math.random));

        const ecd = this.entityManager.dataset;
        const behavior = rule.action.execute(entity, ecd, context, this);

        const entity_builder = new EntityBuilder()
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
            .add(SerializationMetadata.Transient);

        const execution = ctx.execution;

        execution.rule = rule;
        execution.executor = entity_builder;

        entity_builder
            .build(ecd);

    }

    /**
     *
     * @param {number} entity
     * @param {DataScope} scope
     */
    populateEntityScope(entity, scope) {
        assert.typeOf(entity, "number", "entity");

        const ecd = this.entityManager.dataset;

        // pull in dependency scopes
        const actor = ecd.getComponent(entity, DynamicActor);

        const context_count = actor.context.length;
        for (let i = 0; i < context_count; i++) {
            const ctx_entity = actor.context[i];

            if (!ecd.entityExists(ctx_entity)) {
                continue;
            }

            const ctx_bb = ecd.getComponent(ctx_entity, Blackboard);

            if (ctx_bb === undefined) {
                continue;
            }

            scope.push(ctx_bb.getValueProxy());
        }


        // inject current time
        const time = this.getCurrentTime();

        scope.push({
            now: time,
            entity
        });


        // fetch blackboard

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
     *
     * @param {Object} context
     * @return {DynamicRuleDescription|undefined}
     */
    matchRule(context) {
        /**
         *
         * @type {DynamicRuleDescription|undefined}
         */
        let result = undefined;

        const evaluator = this.evaluator;

        evaluator.initialize(context);

        while (true) {
            const predicate = evaluator.next();

            if (predicate === undefined) {
                break;
            }

            const rules = this.database.getRulesByPredicate(predicate);


            if (rules === undefined) {
                // no matches, go on
                continue;
            }

            // exclude rules that are on cooldown

            const candidates = rules.slice();
            let candidate_count = candidates.length;

            for (let i = candidate_count - 1; i >= 0; i--) {
                const rule = candidates[i];

                const cooldown_ready_time = this.__global_cooldown_ready.get(rule);

                if (cooldown_ready_time === undefined) {
                    continue;
                }

                if (cooldown_ready_time > this.getCurrentTime()) {
                    // rule is still on cooldown, exclude
                    candidates.splice(i, 1);
                    candidate_count--;
                }
            }

            if (candidate_count === 0) {
                continue;
            }

            result = randomFromArray(Math.random, candidates);

            break;
        }

        evaluator.finalize();

        return result;
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

                const match = this.matchRule(scope.proxy);


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


        // console.log('DA event ', event, objectShallowCopyByOwnKeys(scopeProxy)); // DEBUG

        /**
         *
         * @type {DynamicRuleDescription}
         */
        const description = this.matchRule(scopeProxy);

        if (description !== undefined) {
            this.attemptRuleExecution(entity, description, scopeProxy);
        }

        this.scope.unwind(top);

        return description;
    }

    async startup(entityManager, readyCallback, errorCallback) {
        const staticKnowledge = this.engine.staticKnowledge;


        await staticKnowledge.promise();

        this.database = staticKnowledge.getTable('dynamic-actions');

        this.evaluator = this.database.buildEvaluator();

        super.startup(entityManager, readyCallback, errorCallback);
    }

    /**
     *
     * @param {DynamicActor} actor
     * @param {number} entity
     * @private
     */
    __update_visitDynamicActor(actor, entity) {

        /**
         *
         * @type {Context}
         */
        const ctx = this.__getEntityContext(entity);

        while (ctx.next_idle_event_time < this.__current_time) {

            const timeout = randomFloatBetween(Math.random, IDLE_EVENT_TIMEOUT_MIN, IDLE_EVENT_TIMEOUT_MAX);

            ctx.next_idle_event_time += timeout;

            this.entityManager.dataset.sendEvent(entity, 'idle', {});

        }
    }

    update(timeDelta) {

        this.__current_time += timeDelta;

        const dataset = this.entityManager.dataset;

        if (dataset !== null) {

            dataset.traverseComponents(DynamicActor, this.__update_visitDynamicActor, this);

        }

    }
}
