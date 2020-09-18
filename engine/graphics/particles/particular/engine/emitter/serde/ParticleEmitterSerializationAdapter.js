import { BinaryClassSerializationAdapter } from "../../../../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";
import { ParticleEmitter } from "../ParticleEmitter.js";
import { ParticleLayer } from "../ParticleLayer.js";
import { ParticleEmitterFlag } from "../ParticleEmitterFlag.js";
import { SimulationStepDefinition } from "../../simulator/SimulationStepDefinition.js";

export class ParticleEmitterSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = ParticleEmitter;
        this.version = 1;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {ParticleEmitter} value
     */
    serialize(buffer, value) {
        value.parameters.toBinaryBuffer(buffer);

        //pack flags
        buffer.writeUint32(value.flags & ParticleEmitter.SERIALIZABLE_FLAGS);

        buffer.writeUint8(value.blendingMode);

        const layers = value.layers;

        const layer_count = layers.length;

        buffer.writeUint32(layer_count);

        for (let i = 0; i < layer_count; i++) {

            /**
             *
             * @type {ParticleLayer}
             */
            const particleLayer = layers.get(i);

            buffer.writeUTF8String(particleLayer.imageURL);
            particleLayer.particleLife.toBinaryBuffer(buffer);
            particleLayer.particleSize.toBinaryBuffer(buffer);
            particleLayer.particleRotation.toBinaryBuffer(buffer);
            particleLayer.particleRotationSpeed.toBinaryBuffer(buffer);
            buffer.writeUint8(particleLayer.emissionShape);
            buffer.writeUint8(particleLayer.emissionFrom);
            buffer.writeFloat64(particleLayer.emissionRate);
            buffer.writeUintVar(particleLayer.emissionImmediate);
            particleLayer.parameterTracks.toBinaryBuffer(buffer);
            particleLayer.position.toBinaryBufferFloat32(buffer);
            particleLayer.scale.toBinaryBufferFloat32(buffer);
            particleLayer.particleVelocityDirection.toBinaryBuffer(buffer);
            particleLayer.particleSpeed.toBinaryBuffer(buffer);

            // write simulation settings
            const steps = particleLayer.steps;

            const num_steps = steps.length;

            buffer.writeUintVar(num_steps);

            for (let j = 0; j < num_steps; j++) {
                const simulationStepDefinition = steps[j];

                buffer.writeUintVar(simulationStepDefinition.type);

                const parameters = simulationStepDefinition.parameters;

                const parameter_count = parameters.length;

                buffer.writeUintVar(parameter_count);

                for (let k = 0; k < parameter_count; k++) {

                    const parameter_value = parameters[k];

                    buffer.writeFloat64(parameter_value);

                }
            }
        }

    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {ParticleEmitter} value
     */
    deserialize(buffer, value) {
        value.parameters.fromBinaryBuffer(buffer);

        //read flags
        const serializedFlags = buffer.readUint32();

        //clear serializable flags
        value.flags &= (~ParticleEmitter.SERIALIZABLE_FLAGS);

        //write serialized flags
        value.flags |= serializedFlags;

        value.blendingMode = buffer.readUint8();

        value.layers.reset();

        const layer_count = buffer.readUint32();

        for (let i = 0; i < layer_count; i++) {
            const layer = new ParticleLayer();

            layer.imageURL = buffer.readUTF8String();
            layer.particleLife.fromBinaryBuffer(buffer);
            layer.particleSize.fromBinaryBuffer(buffer);
            layer.particleRotation.fromBinaryBuffer(buffer);
            layer.particleRotationSpeed.fromBinaryBuffer(buffer);
            layer.emissionShape = buffer.readUint8();
            layer.emissionFrom = buffer.readUint8();
            layer.emissionRate = buffer.readFloat64();
            layer.emissionImmediate = buffer.readUintVar();
            layer.parameterTracks.fromBinaryBuffer(buffer);
            layer.position.fromBinaryBufferFloat32(buffer);
            layer.scale.fromBinaryBufferFloat32(buffer);
            layer.particleVelocityDirection.fromBinaryBuffer(buffer);
            layer.particleSpeed.fromBinaryBuffer(buffer);

            // read simulation parameters
            const simulation_step_count = buffer.readUintVar();


            layer.steps.splice(0, layer.steps.length);

            for (let j = 0; j < simulation_step_count; j++) {
                const simulation_step_id = buffer.readUintVar();

                const definition = new SimulationStepDefinition();
                definition.type = simulation_step_id;

                const attribute_count = buffer.readUintVar();

                for (let k = 0; k < attribute_count; k++) {
                    definition.parameters[k] = buffer.readFloat64();
                }

                layer.steps.push(definition);

            }

            //reset bounds attributes
            layer.scaledSpriteHalfSize = -1;

            value.layers.add(layer);
        }


        value.writeFlag(ParticleEmitterFlag.Built, false);
        value.setFlag(ParticleEmitterFlag.Emitting);

        //register loaded layers
        value.registerLayerParameters();
    }
}
