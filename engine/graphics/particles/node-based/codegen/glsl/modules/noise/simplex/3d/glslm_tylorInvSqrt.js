import { FunctionModule } from "../../../../../modules/FunctionModule.js";
import { FunctionSignature } from "../../../../../modules/FunctionSignature.js";
import { FunctionParameterSpecification } from "../../../../../modules/FunctionParameterSpecification.js";
import { PortDirection } from "../../../../../../../../../../core/model/node-graph/node/PortDirection.js";
import { ParticleDataTypes } from "../../../../../../nodes/ParticleDataTypes.js";
import LineBuilder from "../../../../../../../../../../core/codegen/LineBuilder.js";


/**
 * @link:  https://github.com/hughsk/glsl-noise/blob/master/simplex/3d.glsl
 * @type {string}
 */
const code = `
vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}
`;

export const glslm_taylorInvSqrt = FunctionModule.from({
    id: 'glsl-noise/simplex/3d#taylorInvSqrt',
    signature: FunctionSignature.from(
        [
            FunctionParameterSpecification.from(PortDirection.In, ParticleDataTypes.Vector4)
        ],
        ParticleDataTypes.Vector4
    ),
    dependencies: [],
    code_lines: LineBuilder.fromText(code)
});
