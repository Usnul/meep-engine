import EntityBuilder, { EntityBuilderFlags } from "../ecs/EntityBuilder.js";
import { ControlContextState } from "./ControlContextState.js";
import { IllegalStateException } from "../../core/fsm/exceptions/IllegalStateException.js";
import { SerializationMetadata } from "../ecs/components/SerializationMetadata.js";

export class ControlContext {
    constructor() {
        /**
         * @private
         * @type {EntityComponentDataset}
         */
        this.ecd = null;

        /**
         * @private
         * @type {EntityBuilder[]}
         */
        this.entities = [];

        /**
         * @private
         * @type {ControlContextState|number}
         */
        this.state = ControlContextState.Initial;

        /**
         * Should entities be made transient or not, transient entities do not get persisted
         * @private
         * @type {boolean}
         */
        this.transientEntities = true;
    }

    /**
     *
     * @returns {ControlContextState|number}
     */
    getState() {
        return this.state;
    }

    /**
     * Do not invoke "build" manually
     * @returns {EntityBuilder}
     */
    makeEntity() {
        const eb = new EntityBuilder();

        if (this.transientEntities) {
            eb.add(SerializationMetadata.Transient);
        }

        this.entities.push(eb);

        if (this.state === ControlContextState.Running) {
            eb.build(this.ecd);
        }

        return eb;
    }

    /**
     * Initialization method is called once before the context is used for the first time
     * @param {EntityComponentDataset} ecd
     */
    initialize(ecd) {
        if (this.state === ControlContextState.Ready && this.ecd === ecd) {
            //already in the right state
            return;
        }

        if (this.state !== ControlContextState.Initial && this.state !== ControlContextState.Disposed) {
            throw new IllegalStateException(`Expected state to be INITIAL(${ControlContextState.Initial}) or DISPOSED(${ControlContextState.Disposed}), instead got ${this.state}`);
        }

        this.ecd = ecd;

        //this should be extended in subclasses

        this.state = ControlContextState.Ready;
    }

    /**
     * Disposal is done when the context is no longer needed, any used resources should be freed here
     */
    dispose() {
        if (this.state === ControlContextState.Disposed) {
            //already in the right state
            return;
        }

        if (this.state === ControlContextState.Initial) {
            //nothing to do
        } else {
            if (this.state === ControlContextState.Running) {
                this.shutdown();
            }

            if (this.state !== ControlContextState.Ready) {
                throw new IllegalStateException(`Expected READY(${ControlContextState.Ready}) state, instead was ${this.state}`);
            }
        }

        this.ecd = null;

        //override in subclasses

        this.state = ControlContextState.Disposed;
    }

    /**
     * Invoked to make context active
     * @throws IllegalStateException
     */
    startup() {
        if (this.state === ControlContextState.Running) {
            //already in the right state
            return;
        }

        if (this.state !== ControlContextState.Ready) {
            throw new IllegalStateException(`Expected READY(${ControlContextState.Ready}) state, instead was ${this.state}`);
        }

        for (const e of this.entities) {
            if (e.getFlag(EntityBuilderFlags.Built)) {
                throw new IllegalStateException(`Entity ${e.entity} is already built, this violates pre-condition of control context`);
            }

            e.build(this.ecd)
        }

        this.state = ControlContextState.Running;
    }

    /**
     * Invoked to deactivate context
     * @throws IllegalStateException
     */
    shutdown() {
        if (this.state === ControlContextState.Ready) {
            //already in the right state
            return;
        }

        if (this.state !== ControlContextState.Running) {
            throw new IllegalStateException(`Expected RUNNING(${ControlContextState.Running}) state, instead was ${this.state}`);
        }

        for (const e of this.entities) {
            if (!e.getFlag(EntityBuilderFlags.Built)) {
                //entity is not built, skip
                continue;
            }

            e.destroy();
        }

        this.state = ControlContextState.Ready;
    }
}
