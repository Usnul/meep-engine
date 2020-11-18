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
vec3 curlNoise( vec3 p ){
  
  const float e = .1;
  vec3 dx = vec3( e   , 0.0 , 0.0 );
  vec3 dy = vec3( 0.0 , e   , 0.0 );
  vec3 dz = vec3( 0.0 , 0.0 , e   );

  vec3 p_x0 = snoiseVec3( p - dx );
  vec3 p_x1 = snoiseVec3( p + dx );
  vec3 p_y0 = snoiseVec3( p - dy );
  vec3 p_y1 = snoiseVec3( p + dy );
  vec3 p_z0 = snoiseVec3( p - dz );
  vec3 p_z1 = snoiseVec3( p + dz );

  float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
  float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
  float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

  const float divisor = 1.0 / ( 2.0 * e );
  return normalize( vec3( x , y , z ) * divisor );

}
`;

export const glslm_curlNoise = FunctionModule.from({
    id: 'glsl-noise/simplex/3d#curlNoise',
    signature: FunctionSignature.from(
        [
            FunctionParameterSpecification.from(PortDirection.In, ParticleDataTypes.Vector3)
        ],
        ParticleDataTypes.Vector3
    ),
    dependencies: [
        FunctionModuleReference.from(
            'glsl-noise/simplex/3d#snoiseVec3',
            FunctionSignature.from(
                [
                    FunctionParameterSpecification.from(PortDirection.In, ParticleDataTypes.Vector3)
                ],
                ParticleDataTypes.Vector3
            )
        )
    ],
    code_lines: LineBuilder.fromText(code)
});
