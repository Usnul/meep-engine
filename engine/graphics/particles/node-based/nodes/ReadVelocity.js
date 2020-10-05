import { AttributeNode } from "./AttributeNode.js";
import { PortDirection } from "../../../../../core/model/node-graph/node/PortDirection.js";
import { ParticleDataTypes } from "./ParticleDataTypes.js";

export class ReadVelocity extends AttributeNode {
    constructor() {
        super();
        this.id = 30002;

        this.name = 'Read Velocity';

        this.createPort(ParticleDataTypes.Vector3, 'value', PortDirection.Out);
    }
}
