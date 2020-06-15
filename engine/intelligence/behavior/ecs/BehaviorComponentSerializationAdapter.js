import { BinaryClassSerializationAdapter } from "../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";
import { BehaviorComponent } from "./BehaviorComponent.js";

export class BehaviorComponentSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = BehaviorComponent;
        this.version = 0;

        /**
         *
         * @type {BinaryObjectSerializationAdapter}
         */
        this.objectAdapter = null;
    }

    /**
     *
     * @param {BehaviorSystem} system
     * @param {BinaryObjectSerializationAdapter} objectAdapter
     */
    initialize(system, objectAdapter) {
        this.objectAdapter = objectAdapter;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {BehaviorComponent} value
     */
    serialize(buffer, value) {
        buffer.writeUint8(value.clock);
        buffer.writeUint8(value.flags);

        const behaviors = value.list;
        const n = behaviors.length;
        buffer.writeUintVar(n);

        for (let i = 0; i < n; i++) {
            const behavior = behaviors[i];

            //write single behavior
            this.objectAdapter.serialize(buffer, behavior);
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {BehaviorComponent} value
     */
    deserialize(buffer, value) {
        const clock = buffer.readUint8();
        const flags = buffer.readUint8();

        const n = buffer.readUintVar();

        const behaviors = [];

        for (let i = 0; i < n; i++) {
            /**
             * Read a single behavior
             * @type {Behavior}
             */
            const behavior = this.objectAdapter.deserialize(buffer);

            behaviors.push(behavior);
        }

        //write object fields
        value.clock = clock;
        value.flags = flags;
        value.list = behaviors;
    }
}
