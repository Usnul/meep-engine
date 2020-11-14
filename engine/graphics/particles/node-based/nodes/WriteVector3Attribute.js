import { AttributeNode } from "./AttributeNode.js";
import { ParticleDataTypes } from "./ParticleDataTypes.js";
import { PortDirection } from "../../../../../core/model/node-graph/node/PortDirection.js";
import { NodeParameterDataType } from "../../../../../core/model/node-graph/node/parameter/NodeParameterDataType.js";

export class WriteVector3Attribute extends AttributeNode {
    constructor() {
        super();

        this.createPort(ParticleDataTypes.Vector3, 'value', PortDirection.In);

        this.createParameter('name', NodeParameterDataType.String, '');
    }

    generate_glsl(instance, output, context, port_variables) {
        const attribute_name = instance.getParameterValue(0);

        const source = port_variables[0];

        output.add(`out_${attribute_name} = ${source};`);
    }
}
