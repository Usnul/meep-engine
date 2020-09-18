import { BinaryClassUpgrader } from "../../../../../../ecs/storage/binary/BinaryClassUpgrader.js";
import { BinaryBuffer } from "../../../../../../../core/binary/BinaryBuffer.js";
import { ParameterLookupTable } from "../../parameter/ParameterLookupTable.js";
import { ParameterLookupTableSerializationAdapter } from "./ParameterLookupTableSerializationAdapter.js";

export class ParticleEmitterSerializationUpgrader_0_1 extends BinaryClassUpgrader {
    constructor() {
        super();

        this.__startVersion = 0;
        this.__targetVersion = 1;
    }

    upgrade(source, target) {

        // copy parameters
        const parameter_count = source.readUint32()
        target.writeUint32(parameter_count);

        for (let i = 0; i < parameter_count; i++) {
            BinaryBuffer.copyUTF8String(source, target); //parameter name
            const item_size = BinaryBuffer.copyUint8(source, target); //item size


            const lut = new ParameterLookupTable();

            const apd = new ParameterLookupTableSerializationAdapter();

            apd.deserialize(source, lut);
            apd.serialize(target, lut);
        }

        // copy flags
        BinaryBuffer.copyUint32(source, target);

        // copy blending mode
        BinaryBuffer.copyUint8(source, target);

        // copy layers
        const layer_count = source.readUint32();
        target.writeUint32(layer_count);

        for (let i = 0; i < layer_count; i++) {
            BinaryBuffer.copyUTF8String(source, target); //image URL

            BinaryBuffer.copyFloat64(source, target); //particle life
            BinaryBuffer.copyFloat64(source, target); //particle life

            BinaryBuffer.copyFloat64(source, target); //particle size
            BinaryBuffer.copyFloat64(source, target); //particle size

            BinaryBuffer.copyFloat64(source, target); //particle rotation
            BinaryBuffer.copyFloat64(source, target); //particle rotation

            BinaryBuffer.copyFloat64(source, target); //particle rotation speed
            BinaryBuffer.copyFloat64(source, target); //particle rotation speed

            BinaryBuffer.copyUint8(source, target); //emission shape

            BinaryBuffer.copyUint8(source, target); //emission from

            BinaryBuffer.copyFloat64(source, target); // Emission rate

            const emission_immediate = source.readUint32();
            target.writeUintVar(emission_immediate);

            // encode parameters
            const layer_parameter_count = BinaryBuffer.copyUint32(source, target);

            for (let j = 0; j < layer_parameter_count; j++) {
                BinaryBuffer.copyUTF8String(source, target); //name

                // write track data
                const lut = new ParameterLookupTable();

                const apd = new ParameterLookupTableSerializationAdapter();

                apd.deserialize(source, lut);
                apd.serialize(target, lut);
            }

            BinaryBuffer.copyFloat32(source, target); // position x
            BinaryBuffer.copyFloat32(source, target); // position y
            BinaryBuffer.copyFloat32(source, target); // position z

            BinaryBuffer.copyFloat32(source, target); // scale x
            BinaryBuffer.copyFloat32(source, target); // scale y
            BinaryBuffer.copyFloat32(source, target); // scale z

            // write direction ray

            BinaryBuffer.copyFloat64(source, target); // angle
            BinaryBuffer.copyFloat32(source, target); // direction x
            BinaryBuffer.copyFloat32(source, target); // direction y
            BinaryBuffer.copyFloat32(source, target); // direction z

            // write particle speed
            BinaryBuffer.copyFloat64(source, target); // particle speed min
            BinaryBuffer.copyFloat64(source, target); // particle speed max

            // write simulation settings
            target.writeUintVar(1); // number of simulation steps
            target.writeUintVar(0); // step type ID (fixed physics)
            target.writeUintVar(0); // number of step attributes
        }
    }
}
