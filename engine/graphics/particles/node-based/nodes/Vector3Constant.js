import { ShaderNode } from "./ShaderNode.js";
import { ParticleDataTypes } from "./ParticleDataTypes.js";
import { PortDirection } from "../../../../../core/model/node-graph/node/PortDirection.js";
import { NodeParameterDataType } from "../../../../../core/model/node-graph/node/parameter/NodeParameterDataType.js";

export class Vector3Constant extends ShaderNode {
    constructor() {
        super();

        this.id = 30006;

        this.name = 'V3';

        this.createPort(ParticleDataTypes.Vector3, 'value', PortDirection.Out);

        this.createParameter('x', NodeParameterDataType.Number, 0);
        this.createParameter('y', NodeParameterDataType.Number, 0);
        this.createParameter('z', NodeParameterDataType.Number, 0);
    }

    generate_code(instance, output, context, port_variables) {
        const out = context.getIdentifier(instance, this.getPortById(0));

        const x = instance.getParameterValue(0);
        const y = instance.getParameterValue(1);
        const z = instance.getParameterValue(2);

        output.add(`${out} = vec3(${x}, ${y}, ${z});`);
    }
}
