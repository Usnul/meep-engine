import { ShaderNode } from "./ShaderNode.js";
import { ParticleDataTypes } from "./ParticleDataTypes.js";
import { PortDirection } from "../../../../../core/model/node-graph/node/PortDirection.js";

export class Vector3Split extends ShaderNode {
    constructor() {
        super();

        this.id = 30004;

        this.name = 'V3 Split';

        this.createPort(ParticleDataTypes.Vector3, 'value', PortDirection.In);

        this.createPort(ParticleDataTypes.Float, 'x', PortDirection.Out);
        this.createPort(ParticleDataTypes.Float, 'y', PortDirection.Out);
        this.createPort(ParticleDataTypes.Float, 'z', PortDirection.Out);
    }

    generate_code(instance, output, context, port_variables) {

        const out_x = context.getIdentifier(instance, this.getPortById(1));
        const out_y = context.getIdentifier(instance, this.getPortById(2));
        const out_z = context.getIdentifier(instance, this.getPortById(3));

        const source = port_variables[0];

        output.add(`${out_x} = ${source}.x;`);
        output.add(`${out_y} = ${source}.y;`);
        output.add(`${out_z} = ${source}.z;`);
    }
}
