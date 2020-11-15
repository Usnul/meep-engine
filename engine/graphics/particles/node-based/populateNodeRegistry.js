import { ParticleDataTypes } from "./nodes/ParticleDataTypes.js";
import { Color } from "../../../../core/color/Color.js";
import { AddFloatNode } from "./nodes/AddFloatNode.js";
import { Vector3Split } from "./nodes/Vector3Split.js";
import { Vector3Merge } from "./nodes/Vector3Merge.js";
import { FloatConstant } from "./nodes/FloatConstant.js";
import { WriteVector3Attribute } from "./nodes/WriteVector3Attribute.js";
import { ReadVector3Attribute } from "./nodes/ReadVector3Attribute.js";
import { ReadFloatUniform } from "./nodes/ReadFloatUniform.js";
import { Vector3Multiply } from "./nodes/Vector3Multiply.js";
import { Vector3Add } from "./nodes/Vector3Add.js";
import { Vector3Subtract } from "./nodes/Vector3Subtract.js";
import { Vector3Divide } from "./nodes/Vector3Divide.js";


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


    registry.addNode(new FloatConstant());
    registry.addNode(new AddFloatNode());
    registry.addNode(new Vector3Split());
    registry.addNode(new Vector3Merge());
    registry.addNode(new Vector3Add());
    registry.addNode(new Vector3Subtract());
    registry.addNode(new Vector3Multiply());
    registry.addNode(new Vector3Divide());
    registry.addNode(new WriteVector3Attribute());
    registry.addNode(new ReadVector3Attribute());
    registry.addNode(new ReadFloatUniform());

}
