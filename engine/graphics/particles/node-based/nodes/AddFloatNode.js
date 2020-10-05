import { AttributeNode } from "./AttributeNode.js";
import { PortDirection } from "../../../../../core/model/node-graph/node/PortDirection.js";
import { ParticleDataTypes } from "./ParticleDataTypes.js";


export class AddFloatNode extends AttributeNode {
    constructor() {
        super();

        this.name = 'Add';
        this.id = 30001;

        this.createPort(ParticleDataTypes.Float, 'a', PortDirection.In);
        this.createPort(ParticleDataTypes.Float, 'b', PortDirection.In);
        this.createPort(ParticleDataTypes.Float, 'value', PortDirection.Out);
    }
}
