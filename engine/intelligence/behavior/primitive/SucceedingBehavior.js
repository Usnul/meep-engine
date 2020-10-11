import { Behavior } from "../Behavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";
import { BinaryClassSerializationAdapter } from "../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";

/**
 * Behavior that always succeeds
 */
export class SucceedingBehavior extends Behavior {
    constructor(delayTicks = 0) {
        super();

        this.delayTicks = delayTicks;
    }

    /**
     *
     * @param {number} delayTicks
     * @return {SucceedingBehavior}
     */
    static from(delayTicks = 0) {
        const r = new SucceedingBehavior();

        r.delayTicks = delayTicks;

        return r;
    }

    tick() {
        if (this.delayTicks === 0) {
            return BehaviorStatus.Succeeded;
        } else {
            this.delayTicks--;
            return BehaviorStatus.Running;
        }
    }
}

SucceedingBehavior.typeName = "SucceedingBehavior";

export class SucceedingBehaviorSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = SucceedingBehavior;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {SucceedingBehavior} value
     */
    serialize(buffer, value) {
        buffer.writeUintVar(value.delayTicks);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {SucceedingBehavior} value
     */
    deserialize(buffer, value) {
        value.delayTicks = buffer.readUintVar();
    }
}
