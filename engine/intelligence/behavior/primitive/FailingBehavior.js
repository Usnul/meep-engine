import { Behavior } from "../Behavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";
import { BinaryClassSerializationAdapter } from "../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";

export class FailingBehavior extends Behavior {
    constructor(delayTicks = 0) {
        super();

        this.delayTicks = delayTicks;
    }

    tick() {
        if (this.delayTicks === 0) {
            this.__status = BehaviorStatus.Failed;

            return BehaviorStatus.Failed;
        } else {
            this.delayTicks--;

            return BehaviorStatus.Running;
        }
    }
}

FailingBehavior.typeName = "FailingBehavior";

export class FailingBehaviorSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = FailingBehavior;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {FailingBehavior} value
     */
    serialize(buffer, value) {
        buffer.writeUintVar(value.delayTicks);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {FailingBehavior} value
     */
    deserialize(buffer, value) {
        value.delayTicks = buffer.readUintVar();
    }
}
