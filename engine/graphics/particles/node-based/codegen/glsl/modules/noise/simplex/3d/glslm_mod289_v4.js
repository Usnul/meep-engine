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
vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
`;

export const glslm_mod289_v4 = FunctionModule.from({
    id: 'glsl-noise/simplex/3d#mod289_v4',
    signature: FunctionSignature.from(
        [
            FunctionParameterSpecification.from(PortDirection.In, ParticleDataTypes.Vector4)
        ],
        ParticleDataTypes.Vector4
    ),
    dependencies: [],
    code_lines: LineBuilder.fromText(code)
});
