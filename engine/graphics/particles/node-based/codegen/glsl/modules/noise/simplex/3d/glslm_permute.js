import { FunctionModule } from "../../../../../modules/FunctionModule.js";
import { FunctionSignature } from "../../../../../modules/FunctionSignature.js";
import { FunctionParameterSpecification } from "../../../../../modules/FunctionParameterSpecification.js";
import { PortDirection } from "../../../../../../../../../../core/model/node-graph/node/PortDirection.js";
import { ParticleDataTypes } from "../../../../../../nodes/ParticleDataTypes.js";
import LineBuilder from "../../../../../../../../../../core/codegen/LineBuilder.js";
import { FunctionModuleReference } from "../../../../../modules/FunctionModuleReference.js";

/**
 * @link:  https://github.com/hughsk/glsl-noise/blob/master/simplex/3d.glsl
 * @type {string}
 */
const code = `
vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}
`;

export const glslm_permute = FunctionModule.from({
    id: 'glsl-noise/simplex/3d#permute',
    signature: FunctionSignature.from(
        [
            FunctionParameterSpecification.from(PortDirection.In, ParticleDataTypes.Vector4)
        ],
        ParticleDataTypes.Vector4
    ),
    dependencies: [
        FunctionModuleReference.from(
            'glsl-noise/simplex/3d#mod289_v4',
            FunctionSignature.from(
                [
                    FunctionParameterSpecification.from(PortDirection.In, ParticleDataTypes.Vector4)
                ],
                ParticleDataTypes.Vector4
            )
        )
    ],
    code_lines: LineBuilder.fromText(code)
});
