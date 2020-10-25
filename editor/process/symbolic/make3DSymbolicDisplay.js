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
     * @type {SymbolicDisplayInternalAPI[]}
     */
    const entities = [];


    function added(...args) {
        const entity = args[args.length - 1];

        const entityDataset = entityManager.dataset;
        const editorEntity = entityDataset.getComponent(entity, EditorEntity);

        if (editorEntity !== undefined) {
            //skip editor's own entities
            return;
        }


        const api = new SymbolicDisplayInternalAPI();

        api.__requestUpdate.add(() => {
            removed(...args);
            added(...args);
        });

        api.initialize({
            ecd: entityDataset,
            engine,
            entity
        });

        try {
            factory(args, api);
        } catch (e) {
            console.error(`Error while creating a helper:`, e, args);

            api.finalize();

            return;
        }

        entities[entity] = api;
    }

    function removed(...args) {
        const entity = args[args.length - 1];

        const api = entities[entity];

        if (api === undefined) {
            return;
        }

        delete entities[entity];

        api.finalize();
    }

    const display = new ComponentSymbolicDisplay(components, added, removed);

    return display;
}
