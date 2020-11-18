import { FunctionModule } from "../../../../modules/FunctionModule.js";
import { FunctionSignature } from "../../../../modules/FunctionSignature.js";
import { FunctionParameterSpecification } from "../../../../modules/FunctionParameterSpecification.js";
import { PortDirection } from "../../../../../../../../../core/model/node-graph/node/PortDirection.js";
import { ParticleDataTypes } from "../../../../../nodes/ParticleDataTypes.js";
import { FunctionModuleReference } from "../../../../modules/FunctionModuleReference.js";
import LineBuilder from "../../../../../../../../../core/codegen/LineBuilder.js";

/**
 * @link:  https://github.com/cabbibo/glsl-curl-noise/blob/master/curl.glsl
 * @type {string}
 */
const code = `
vec3 snoiseVec3( vec3 x ){

  float s  = snoise(vec3( x ));
  float s1 = snoise(vec3( x.y - 19.1 , x.z + 33.4 , x.x + 47.2 ));
  float s2 = snoise(vec3( x.z + 74.2 , x.x - 124.5 , x.y + 99.4 ));
  vec3 c = vec3( s , s1 , s2 );
  return c;

}
`;

export const glslm_snoiseVec3 = FunctionModule.from({
    id: 'glsl-noise/simplex/3d#snoiseVec3',
    signature: FunctionSignature.from(
        [
            FunctionParameterSpecification.from(PortDirection.In, ParticleDataTypes.Vector3)
        ],
        ParticleDataTypes.Vector3
    ),
    dependencies: [
        FunctionModuleReference.from(
            'glsl-noise/simplex/3d#snoise',
            FunctionSignature.from([
                    FunctionParameterSpecification.from(PortDirection.In, ParticleDataTypes.Vector3)
                ],
                ParticleDataTypes.Float
            )
        )
    ],
    code_lines: LineBuilder.fromText(code)
});
