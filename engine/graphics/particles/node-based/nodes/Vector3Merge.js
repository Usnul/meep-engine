import { AttributeNode } from "./AttributeNode.js";
import { ParticleDataTypes } from "./ParticleDataTypes.js";
import { PortDirection } from "../../../../../core/model/node-graph/node/PortDirection.js";

export class Vector3Merge extends AttributeNode {
    constructor() {
        super();

        this.id = 30005;

        this.name = 'V3 merge';

        this.createPort(ParticleDataTypes.Vector3, 'value', PortDirection.Out);

        this.createPort(ParticleDataTypes.Float, 'x', PortDirection.In);
        this.createPort(ParticleDataTypes.Float, 'y', PortDirection.In);
        this.createPort(ParticleDataTypes.Float, 'z', PortDirection.In);
    }
}
