import { ShaderNode } from "../ShaderNode.js";
import { ParticleDataTypes } from "../ParticleDataTypes.js";
import { PortDirection } from "../../../../../../core/model/node-graph/node/PortDirection.js";
import { NodeParameterDataType } from "../../../../../../core/model/node-graph/node/parameter/NodeParameterDataType.js";

export class ReadVector3Attribute extends ShaderNode {

    constructor() {
        super();

        this.id = 30009;
        this.name = "Read V3 Attribute";

        this.createPort(ParticleDataTypes.Vector3, 'value', PortDirection.Out);

        this.createParameter('name', NodeParameterDataType.String, '');
    }


    generate_code(instance, output, context, port_variables) {
        const attribute_name = instance.getParameterValue(0);

        const out = context.getIdentifier(instance, this.getPortById(0));

        output.add(`${out} = in_${attribute_name};`);
    }
}
