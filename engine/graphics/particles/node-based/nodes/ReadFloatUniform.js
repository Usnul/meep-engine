import { AttributeNode } from "./AttributeNode.js";
import { ParticleDataTypes } from "./ParticleDataTypes.js";
import { PortDirection } from "../../../../../core/model/node-graph/node/PortDirection.js";
import { NodeParameterDataType } from "../../../../../core/model/node-graph/node/parameter/NodeParameterDataType.js";

export class ReadFloatUniform extends AttributeNode {
    constructor() {
        super();

        this.id = 30010;
        this.name = "Read Float Uniform";

        this.createPort(ParticleDataTypes.Float, 'value', PortDirection.Out);

        this.createParameter('name', NodeParameterDataType.String, '');
    }


    generate_glsl(instance, output, context, port_variables) {
        const attribute_name = instance.getParameterValue(0);

        const out = context.getIdentifier(instance, this.getPortById(0));

        output.add(`${out} = ${attribute_name};`);
    }
}
