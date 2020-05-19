import { assert } from "../../../core/assert.js";
import EditorEntity from "../../ecs/EditorEntity.js";
import { SignalBinding } from "../../../core/events/signal/SignalBinding.js";
import { ComponentSymbolicDisplay } from "./ComponentSymbolicDisplay.js";
import { SymbolicDisplayInternalAPI } from "./SymbolicDisplayInternalAPI.js";

/**
 *
 * @param {Engine} engine
 * @param {function(components:[], api:{bind:function(Signal, function, thisArg:*), update: function, bindings:SignalBinding[]})} factory
 * @param {Class[]} components
 * @return {ComponentSymbolicDisplay}
 */
export function make3DSymbolicDisplay({
                                          engine,
                                          factory,
                                          components
                                      }) {

    assert.defined(engine);
    assert.defined(factory);
    assert.defined(components);

    assert.typeOf(factory, 'function', 'factory');

    const entityManager = engine.entityManager;


    /**
     *
     * @type {EntityBuilder[]}
     */
    const entities = [];

    /**
     *
     * @type {SignalBinding[][]}
     */
    const entityBindings = [];

    function added(...args) {
        const entity = args[args.length - 1];

        const entityDataset = entityManager.dataset;
        const editorEntity = entityDataset.getComponent(entity, EditorEntity);

        if (editorEntity !== undefined) {
            //skip editor's own entities
            return;
        }


        const api = new SymbolicDisplayInternalAPI();

        api.__engine = engine;
        api.__requestUpdate.add(() => {
            removed(...args);
            added(...args);
        });

        /**
         *
         * @type {SignalBinding[]}
         */
        const bindings = api.bindings;

        let helper;

        try {
            helper = factory(args, api);
        } catch (e) {
            console.error(`Error while creating a helper:`, e, args);
            return;
        }

        if (helper === null || helper === undefined) {
            //no helper for this entity

            //make sure to cleanup any accidental bindings
            if (bindings.length > 0) {
                console.warn(`Cleaning up ${bindings.length} accidental bindings`);

                bindings.forEach(b => b.unlink());
            }
            return;
        }

        entityBindings[entity] = bindings;

        bindings.forEach(b => b.link());

        helper.build(entityDataset);

        entities[entity] = helper;
    }

    function removed(...args) {
        const entity = args[args.length - 1];

        const builder = entities[entity];

        if (builder === undefined) {
            return;
        }

        const binding = entityBindings[entity];

        binding.forEach(b => b.unlink());

        delete entityBindings[entity];

        delete entities[entity];

        builder.destroy();
    }

    const display = new ComponentSymbolicDisplay(components, added, removed);

    return display;
}
