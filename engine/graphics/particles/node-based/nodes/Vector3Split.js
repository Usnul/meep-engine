import { AttributeNode } from "./AttributeNode.js";
import { ParticleDataTypes } from "./ParticleDataTypes.js";
import { PortDirection } from "../../../../../core/model/node-graph/node/PortDirection.js";

export class Vector3Split extends AttributeNode {
    constructor() {
        super();

        this.id = 30004;

        this.name = 'V3 split';

        this.createPort(ParticleDataTypes.Vector3, 'value', PortDirection.In);

        this.createPort(ParticleDataTypes.Float, 'x', PortDirection.Out);
        this.createPort(ParticleDataTypes.Float, 'y', PortDirection.Out);
        this.createPort(ParticleDataTypes.Float, 'z', PortDirection.Out);
    }
}
