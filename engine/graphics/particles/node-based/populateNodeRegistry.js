import { ParticleDataTypes } from "./nodes/ParticleDataTypes.js";
import { Color } from "../../../../core/color/Color.js";
import { AddFloatNode } from "./nodes/AddFloatNode.js";
import { ReadVelocity } from "./nodes/ReadVelocity.js";
import { WriteVelocity } from "./nodes/WriteVelocity.js";
import { Vector3Split } from "./nodes/Vector3Split.js";
import { Vector3Merge } from "./nodes/Vector3Merge.js";
import { FloatConstant } from "./nodes/FloatConstant.js";


/**
 *
 * @param {NodeRegistry} registry
 * @param {NodeGraphVisualData} visual
 */
export function populateNodeRegistry({ registry, visual }) {


    visual.addDataColor(ParticleDataTypes.Float.id, Color.parse('rgb(0,225,255)'));
    visual.addDataColor(ParticleDataTypes.Vector2.id, Color.parse('rgb(106,55,255)'));
    visual.addDataColor(ParticleDataTypes.Vector3.id, Color.parse('rgb(155,55,255)'));
    visual.addDataColor(ParticleDataTypes.Vector4.id, Color.parse('rgb(195,55,255)'));
    visual.addDataColor(ParticleDataTypes.Color.id, Color.parse('rgb(255,212,55)'));


    registry.addNode(new AddFloatNode());
    registry.addNode(new ReadVelocity());
    registry.addNode(new WriteVelocity());
    registry.addNode(new Vector3Split());
    registry.addNode(new Vector3Merge());
    registry.addNode(new FloatConstant());
}
