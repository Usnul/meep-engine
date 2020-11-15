import { AttributeNode } from "./AttributeNode.js";
import { ParticleDataTypes } from "./ParticleDataTypes.js";
import { PortDirection } from "../../../../../core/model/node-graph/node/PortDirection.js";

export class Vector3Merge extends AttributeNode {
    constructor() {
        super();

        this.id = 30005;

        this.name = 'V3 Merge';

        this.createPort(ParticleDataTypes.Vector3, 'value', PortDirection.Out);

        this.createPort(ParticleDataTypes.Float, 'x', PortDirection.In);
        this.createPort(ParticleDataTypes.Float, 'y', PortDirection.In);
        this.createPort(ParticleDataTypes.Float, 'z', PortDirection.In);
    }

    generate_glsl(instance, output, context, port_variables) {

        const out = context.getIdentifier(instance, this.getPortById(0));

        const x = port_variables[1];
        const y = port_variables[2];
        const z = port_variables[3];

        output.add(`${out} =  vec3( ${x} , ${y}, ${z} );`);
    }
}
