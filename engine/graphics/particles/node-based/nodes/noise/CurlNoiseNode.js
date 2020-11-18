import { ShaderNode } from "../ShaderNode.js";
import { ParticleDataTypes } from "../ParticleDataTypes.js";
import { PortDirection } from "../../../../../../core/model/node-graph/node/PortDirection.js";
import { FunctionModuleReference } from "../../codegen/modules/FunctionModuleReference.js";
import { FunctionSignature } from "../../codegen/modules/FunctionSignature.js";
import { FunctionParameterSpecification } from "../../codegen/modules/FunctionParameterSpecification.js";

export class CurlNoiseNode extends ShaderNode {
    constructor() {
        super();

        this.id = 30015;

        this.name = 'V3 Curl Noise';

        this.createPort(ParticleDataTypes.Vector3, 'p', PortDirection.In);
        this.createPort(ParticleDataTypes.Vector3, 'out', PortDirection.Out);

        this.addModuleDependency(FunctionModuleReference.from(
            'glsl-noise/simplex/3d#curlNoise',
            FunctionSignature.from(
                [
                    FunctionParameterSpecification.from(PortDirection.In, ParticleDataTypes.Vector3)
                ],
                ParticleDataTypes.Vector3
            )
        ))
    }

    generate_code(instance, output, context, port_variables) {

        const out = context.getIdentifier(instance, this.getPortById(1));

        const input = port_variables[0];

        output.add(`${out} =  curlNoise( ${input} );`);
    }

}
