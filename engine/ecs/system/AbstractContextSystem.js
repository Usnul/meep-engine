import { System } from "../System.js";
import { ObjectPoolFactory } from "../../../core/ObjectPoolFactory.js";
import { assert } from "../../../core/assert.js";

/**
 * Creates and tracks a separate context for each linked entity, mostly targeted at event-driven system implementations
 */
export class AbstractContextSystem extends System {
    /**
     *
     * @param {Class<SystemEntityContext>} ContextClass
     */
    constructor(ContextClass) {
        super();

        assert.defined(ContextClass, 'ContextClass');
        assert.notNull(ContextClass, 'ContextClass');
        assert.typeOf(ContextClass, 'function', 'ContextClass');

        /**
         *
         * @type {Class<SystemEntityContext>}
         * @private
         */
        this.__ContextClass = ContextClass;

        /**
         *
         * @type {ObjectPoolFactory<SystemEntityContext>}
         * @private
         */
        this.__context_pool = new ObjectPoolFactory(
            () => {
                return new ContextClass();
            },
            (ctx) => {
                // TODO
            },
            (ctx) => {
                ctx.unlink();
            }
        );

        /**
         *
         * @type {SystemEntityContext[]}
         * @private
         */
        this.__live_contexts = [];

        /**
         *
         * @type {boolean}
         * @private
         */
        this.__validation_ignore_link_argument_count = true;
    }

    link() {

        const n = arguments.length;

        const last_index = n - 1;
        const entity = arguments[last_index];

        /**
         *
         * @type {SystemEntityContext}
         */
        const ctx = this.__context_pool.create();

        ctx.system = this;
        ctx.entity = entity;

        // copy components
        for (let i = 0; i < last_index; i++) {
            ctx.components[i] = arguments[i];
        }

        ctx.link();

        this.__live_contexts[entity] = ctx;
    }

    unlink() {

        const n = arguments.length;

        const last_index = n - 1;
        const entity = arguments[last_index];

        const context = this.__live_contexts[entity];

        if (context === undefined) {
            console.warn(`No context found for entity '${entity}'`);

            return;
        }

        delete this.__live_contexts[entity];

        context.unlink();

        this.__context_pool.release(context);
    }
}
