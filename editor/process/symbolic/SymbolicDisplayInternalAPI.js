import { SignalBinding } from "../../../core/events/signal/SignalBinding.js";
import Signal from "../../../core/events/signal/Signal.js";
import { seededRandom } from "../../../core/math/MathUtils.js";
import { assert } from "../../../core/assert.js";
import { ProcessState } from "../../../core/process/ProcessState.js";
import EditorEntity from "../../ecs/EditorEntity.js";
import List from "../../../core/collection/list/List.js";

export class SymbolicDisplayInternalAPI {
    constructor() {
        /**
         *
         * @type {SignalBinding[]}
         */
        this.bindings = [];

        /**
         *
         * @type {Engine}
         * @private
         */
        this.__engine = null;

        this.__requestUpdate = new Signal();

        this.random = seededRandom(42);

        /**
         *
         * @type {List<EntityBuilder>}
         * @private
         */
        this.__managed_entities = new List();

        /**
         *
         * @type {ProcessState}
         * @private
         */
        this.__state = ProcessState.New;

        /**
         *
         * @type {EntityComponentDataset}
         * @private
         */
        this.__dataset = null;

        /**
         *
         * @type {number}
         * @private
         */
        this.__source_entity = -1;
    }

    /**
     *
     * @param {EntityBuilder} entity
     */
    emit(entity) {
        assert.defined(entity, 'entity');
        assert.equal(entity.isEntityBuilder, true, 'entity.isEntityBuilder !== true');

        if (entity.getComponent(EditorEntity) === null) {
            entity.add(new EditorEntity({ referenceEntity: this.__source_entity }));
        }

        this.__managed_entities.add(entity);

        if (this.__state === ProcessState.Running) {
            entity.build(this.__dataset);
        }
    }

    /**
     *
     * @param {number} entity
     * @param {EntityComponentDataset} ecd
     * @param {Engine} engine
     */
    initialize({
                   entity,
                   ecd,
                   engine
               }) {
        this.__engine = engine;
        this.__dataset = ecd;
        this.__source_entity = entity;

        this.__state = ProcessState.Running;
    }

    finalize() {
        // remove all managed entities
        this.__managed_entities.forEach(e => e.destroy());

        // clear all bindings
        this.bindings.forEach(b => b.unlink());

        // clear dataset
        this.__dataset = null;

        this.__state = ProcessState.Finalized;
    }

    /**
     *
     * @param {Transform} source
     * @param {Transform} target
     */
    bindTransform(source, target) {

        // watch source transform
        this.bind(source.position.onChanged, target.position.set, target.position);
        this.bind(source.rotation.onChanged, target.rotation.set, target.rotation);
        this.bind(source.scale.onChanged, target.scale.set, target.scale);

        // copy source transform
        target.position.copy(source.position);
        target.rotation.copy(source.rotation);
        target.scale.copy(source.scale);
    }

    bind(signal, action, context) {
        const binding = new SignalBinding(signal, action, context);
        this.bindings.push(binding);
        binding.link();
    }

    onFrame(method, thisArg) {
        const engine = this.__engine;
        this.bind(engine.graphics.on.visibilityConstructionEnded, method, thisArg);
    }

    unbind(signal, action, context) {
        const bindings = this.bindings;

        for (let i = 0; i < bindings.length; i++) {

            const b = bindings[i];

            if (b.signal === signal && b.handler === action && b.context === context) {
                b.unlink();

                bindings.splice(i, 1);
                return true;
            }
        }
        return false;

    }


    update() {
        this.__requestUpdate.send0();
    }

}
