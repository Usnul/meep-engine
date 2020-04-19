import { assert } from "../../../core/assert.js";
import EditorEntity from "../../ecs/EditorEntity.js";
import { seededRandom } from "../../../core/math/MathUtils.js";
import { SignalBinding } from "../../../core/events/signal/SignalBinding.js";
import { ComponentSymbolicDisplay } from "./ComponentSymbolicDisplay.js";

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

    /**
     *
     * @type {FrameRunner[][]}
     */
    const entityFrameRunners = [];

    function added(...args) {
        const entity = args[args.length - 1];

        const entityDataset = entityManager.dataset;
        const editorEntity = entityDataset.getComponent(entity, EditorEntity);

        if (editorEntity !== undefined) {
            //skip editor's own entities
            return;
        }

        /**
         *
         * @type {SignalBinding[]}
         */
        const bindings = [];

        const random = seededRandom(42);

        const frameRunners = [];


        const api = {
            bind(signal, action, context) {
                const binding = new SignalBinding(signal, action, context);
                bindings.push(binding);
                binding.link();
            },

            onFrame(method, thisArg) {
                api.bind(engine.graphics.on.visibilityConstructionEnded, method, thisArg);
            },

            unbind(signal, action, context) {
                for (let i = 0; i < bindings.length; i++) {

                    const b = bindings[i];

                    if (b.signal === signal && b.handler === action && b.context === context) {
                        b.unlink();

                        bindings.splice(i, 1);
                        return true;
                    }
                }
                return false;

            },
            update() {
                removed(...args);
                added(...args);
            },
            random,
            bindings
        };

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
                frameRunners.forEach(r => r.shutdown());
            }
            return;
        }

        entityBindings[entity] = bindings;
        entityFrameRunners[entity] = frameRunners;

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

        const frameRunners = entityFrameRunners[entity];

        frameRunners.forEach(r => r.shutdown());

        delete entityFrameRunners[entity];

        delete entityBindings[entity];

        delete entities[entity];

        builder.destroy();
    }

    const display = new ComponentSymbolicDisplay(components, added, removed);

    return display;
}
