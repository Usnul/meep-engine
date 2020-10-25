import { Behavior } from "../Behavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";
import { ObjectBasedClassSerializationAdapter } from "../../../ecs/storage/binary/object/ObjectBasedClassSerializationAdapter.js";
import { AbstractDecoratorBehavior } from "./AbstractDecoratorBehavior.js";

/**
 * Inverts result of the source behavior, success becomes failure, failure becomes success
 */
export class InverterBehavior extends AbstractDecoratorBehavior {
    /**
     *
     * @param {Behavior} source
     */
    constructor(source) {
        super();

        this.setSource(source);
    }

    /**
     *
     * @param {Behavior} source
     * @return {InverterBehavior}
     */
    static from(source) {
        const b = new InverterBehavior(source);

        return b;
    }

    tick(timeDelta) {
        let r = this.__source.tick(timeDelta);

        if (r === BehaviorStatus.Succeeded) {
            r = BehaviorStatus.Failed;
        } else if (r === BehaviorStatus.Failed) {
            r = BehaviorStatus.Succeeded;
        }

        this.__status = r;

        return r;
    }
}

InverterBehavior.typeName = "InverterBehavior";

export class InverterBehaviorSerializationAdapter extends ObjectBasedClassSerializationAdapter {
    constructor() {
        super();

        this.klass = InverterBehavior;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {InverterBehavior} value
     */
    serialize(buffer, value) {
        this.objectAdapter.serialize(buffer, value.getSource())
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {InverterBehavior} value
     */
    deserialize(buffer, value) {
        const source = this.objectAdapter.deserialize(buffer);

        value.setSource(source);
    }
}
