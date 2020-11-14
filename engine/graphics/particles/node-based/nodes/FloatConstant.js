import { AttributeNode } from "./AttributeNode.js";
import { ParticleDataTypes } from "./ParticleDataTypes.js";
import { PortDirection } from "../../../../../core/model/node-graph/node/PortDirection.js";
import { NodeParameterDataType } from "../../../../../core/model/node-graph/node/parameter/NodeParameterDataType.js";

export class FloatConstant extends AttributeNode {
    constructor() {
        super();

        this.id = 30007;

        this.name = 'Float';

        this.createPort(ParticleDataTypes.Float, 'out', PortDirection.Out);

        this.createParameter('v', NodeParameterDataType.Number, 0);
    }

    generate_glsl(instance, output, context, port_variables) {
        const out = context.getIdentifier(instance, this.getPortById(0));

        const v = instance.getParameterValue(0);

        let v_str = v;
        if (Number.isInteger(v)) {
            v_str = v.toFixed(1);
        }

        output.add(`${out} = ${v_str};`);
    }
}
