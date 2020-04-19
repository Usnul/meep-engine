import { Behavior } from "../Behavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";
import { ObjectBasedClassSerializationAdapter } from "../../../ecs/storage/binary/object/ObjectBasedClassSerializationAdapter.js";
import { AbstractDecoratorBehavior } from "./AbstractDecoratorBehavior.js";
import { assert } from "../../../../core/assert.js";

/**
 * @extends {Behavior}
 */
export class RepeatBehavior extends AbstractDecoratorBehavior {
    /**
     *
     * @param {Behavior} source
     * @param {number} [count=Infinity]
     */
    constructor(source, count = Infinity) {
        super();

        /**
         *
         * @type {number}
         * @private
         */
        this.__limit = count;

        /**
         *
         * @type {number}
         * @private
         */
        this.__iterator = 0;

        this.setSource(source);
    }

    /**
     *
     * @param {number} v
     */
    setCount(v) {
        this.__limit = v;
    }

    /**
     *
     * @return {number}
     */
    getCount() {
        return this.__limit;
    }

    /**
     *
     * @param {Behavior} source
     * @param {number} [count]
     * @return {RepeatBehavior}
     */
    static from(source, count = Infinity) {
        return new RepeatBehavior(source, count);
    }

    tick(timeDelta) {
        const s = this.__source.tick(timeDelta);

        assert.notEqual(Object.values(BehaviorStatus).indexOf(s), -1, `${s} is not a valid status`);

        if (s !== BehaviorStatus.Succeeded && s !== BehaviorStatus.Failed) {
            this.__status = s;
            return s;
        }


        this.__iterator++;

        if (this.__iterator >= this.__limit) {
            this.__status = BehaviorStatus.Succeeded;

            return BehaviorStatus.Succeeded;
        } else {
            //re-initialize the source behavior
            this.__source.initialize(this.context);

            return BehaviorStatus.Running;
        }
    }
}

RepeatBehavior.typeName = "RepeatBehavior";

export class RepeatBehaviorSerializationAdapter extends ObjectBasedClassSerializationAdapter {
    constructor() {
        super();

        this.klass = RepeatBehavior;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {RepeatBehavior} value
     */
    serialize(buffer, value) {
        buffer.writeUintVar(value.getCount());

        this.objectAdapter.serialize(buffer, value.getSource());
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {RepeatBehavior} value
     */
    deserialize(buffer, value) {
        const count = buffer.readUintVar();
        const source = this.objectAdapter.deserialize(buffer);

        value.setCount(count);
        value.setSource(source);
    }
}
