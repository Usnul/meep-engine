import { Behavior } from "../Behavior.js";
import { CompositeBehavior } from "./CompositeBehavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";
import { ObjectBasedClassSerializationAdapter } from "../../../ecs/storage/binary/object/ObjectBasedClassSerializationAdapter.js";

export class SequenceBehavior extends CompositeBehavior {
    constructor() {
        super();

        /**
         *
         * @type {number}
         * @protected
         */
        this.__currentBehaviourIndex = -1;

        /**
         *
         * @type {Behavior}
         * @protected
         */
        this.__currentBehaviour = undefined;
    }

    initialize(context) {

        super.initialize(context);

        this.__currentBehaviourIndex = 0;
        this.__currentBehaviour = this.__children[this.__currentBehaviourIndex];

        //initialize first behaviour
        this.__currentBehaviour.initialize(context);

    }

    /**
     *
     * @param {number} timeDelta
     * @returns {BehaviorStatus}
     */
    tick(timeDelta) {
        const s = this.__currentBehaviour.tick(timeDelta);

        if (s !== BehaviorStatus.Succeeded) {
            return s;
        }

        //current behaviour succeeded, move onto the next one
        this.__currentBehaviour.finalize();

        this.__currentBehaviourIndex++;

        if (this.__currentBehaviourIndex < this.__children.length) {
            this.__currentBehaviour = this.__children[this.__currentBehaviourIndex];

            this.__currentBehaviour.initialize(this.context);

            return BehaviorStatus.Running;
        } else {
            //all behaviours completed
            return BehaviorStatus.Succeeded;
        }
    }

    finalize() {
        if (this.__currentBehaviourIndex !== this.__children.length) {
            //sequence has not been finished

            if (this.__currentBehaviour !== undefined) {
                this.__currentBehaviour.finalize();
            }
        }
    }

    /**
     *
     * @param {Behavior[]} list
     * @return {SequenceBehavior}
     */
    static from(list) {
        const r = new SequenceBehavior();

        list.forEach(b => r.addChild(b));

        return r;
    }
}

SequenceBehavior.typeName = "SequenceBehavior";

export class SequenceBehaviorSerializationAdapter extends ObjectBasedClassSerializationAdapter {
    constructor() {
        super();

        this.klass = SequenceBehavior;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {SequenceBehavior} value
     */
    serialize(buffer, value) {
        const children = value.getChildren();

        const n = children.length;
        buffer.writeUintVar(n);

        for (let i = 0; i < n; i++) {
            const behavior = children[i];

            this.objectAdapter.serialize(buffer, behavior);
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {SequenceBehavior} value
     */
    deserialize(buffer, value) {
        const n = buffer.readUintVar();

        value.clearChildren();

        for (let i = 0; i < n; i++) {
            /**
             *
             * @type {Behavior}
             */
            const behavior = this.objectAdapter.deserialize(buffer);

            value.addChild(behavior);
        }
    }
}
