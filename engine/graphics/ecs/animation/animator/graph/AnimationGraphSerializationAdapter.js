import { BinaryClassSerializationAdapter } from "../../../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";
import { AnimationGraph } from "./AnimationGraph.js";
import { AnimationGraphDefinitionSerializationAdapter } from "./definition/serialization/AnimationGraphDefinitionSerializationAdapter.js";
import { AnimationGraphDefinition } from "./definition/AnimationGraphDefinition.js";

export class AnimationGraphSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = AnimationGraph;
        this.version = 0;

        /**
         *
         * @type {AnimationGraphDefinitionSerializationAdapter}
         * @private
         */
        this.__definitionAdapter = new AnimationGraphDefinitionSerializationAdapter();
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {AnimationGraph} value
     */
    serialize(buffer, value) {
        /**
         *
         * @type {AnimationGraphDefinition}
         */
        const graphDefinition = value.def;


        this.__definitionAdapter.serialize(buffer, graphDefinition);

        const stateIndex = graphDefinition.states.indexOf(value.state.def);

        buffer.writeUintVar(stateIndex);

        buffer.writeFloat32(value.debtTime);
    }


    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {AnimationGraph} value
     */
    deserialize(buffer, value) {
        const graphDefinition = new AnimationGraphDefinition();

        this.__definitionAdapter.deserialize(buffer, graphDefinition);

        value.initialize(graphDefinition);

        const stateIndex = buffer.readUintVar();
        const debtTime = buffer.readFloat32();

        value.state = value.getStateByDefinition(graphDefinition.states[stateIndex]);
        value.debtTime = debtTime;
    }
}
