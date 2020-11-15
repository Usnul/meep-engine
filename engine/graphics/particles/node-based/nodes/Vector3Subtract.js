import { AttributeNode } from "./AttributeNode.js";
import { ParticleDataTypes } from "./ParticleDataTypes.js";
import { PortDirection } from "../../../../../core/model/node-graph/node/PortDirection.js";

export class Vector3Subtract extends AttributeNode {
    constructor() {
        super();

        this.name = 'V3 Subtract';
        this.id = 300013;

        this.createPort(ParticleDataTypes.Vector3, 'a', PortDirection.In);
        this.createPort(ParticleDataTypes.Vector3, 'b', PortDirection.In);
        this.createPort(ParticleDataTypes.Vector3, 'value', PortDirection.Out);
    }

    generate_glsl(instance, output, context, port_variables) {
        const out = context.getIdentifier(instance, this.getPortById(2));

        const a = port_variables[0];
        const b = port_variables[1];

        output.add(`${out} =  ${a} - ${b};`);
    }
}
