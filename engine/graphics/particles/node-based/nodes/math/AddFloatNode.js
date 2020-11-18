import { ShaderNode } from "../ShaderNode.js";
import { PortDirection } from "../../../../../../core/model/node-graph/node/PortDirection.js";
import { ParticleDataTypes } from "../ParticleDataTypes.js";


export class AddFloatNode extends ShaderNode {
    constructor() {
        super();

        this.name = 'Float Add';
        this.id = 30001;

        this.createPort(ParticleDataTypes.Float, 'a', PortDirection.In);
        this.createPort(ParticleDataTypes.Float, 'b', PortDirection.In);
        this.createPort(ParticleDataTypes.Float, 'value', PortDirection.Out);
    }

    generate_code(instance, output, context, port_variables) {
        const out = context.getIdentifier(instance, this.getPortById(2));

        const a = port_variables[0];
        const b = port_variables[1];

        output.add(`${out} =  ${a} + ${b};`);
    }
}
