import { ShaderNode } from "./ShaderNode.js";
import { PortDirection } from "../../../../../core/model/node-graph/node/PortDirection.js";
import { ParticleDataTypes } from "./ParticleDataTypes.js";


export class WriteVelocity extends ShaderNode {
    constructor() {
        super();
        this.id = 30003;

        this.name = 'Write Velocity';

        this.createPort(ParticleDataTypes.Vector3, 'value', PortDirection.In);
    }
}
