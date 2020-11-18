import { glslm_curlNoise } from "./codegen/glsl/modules/noise/curl/glslm_curlNoise.js";
import { glslm_snoiseVec3 } from "./codegen/glsl/modules/noise/curl/glslm_snoiseVector3.js";
import { glslm_mod289_v3 } from "./codegen/glsl/modules/noise/simplex/3d/glslm_mod289_v3.js";
import { glslm_mod289_v4 } from "./codegen/glsl/modules/noise/simplex/3d/glslm_mod289_v4.js";
import { glslm_permute } from "./codegen/glsl/modules/noise/simplex/3d/glslm_permute.js";
import { glslm_taylorInvSqrt } from "./codegen/glsl/modules/noise/simplex/3d/glslm_tylorInvSqrt.js";
import { glslm_snoise } from "./codegen/glsl/modules/noise/simplex/3d/glslm_snoise.js";

/**
 *
 * @param {FunctionModuleRegistry} registry
 */
export function populateFunctionModuleRegistry(registry) {

    registry.add(glslm_curlNoise);
    registry.add(glslm_snoiseVec3);
    registry.add(glslm_mod289_v3);
    registry.add(glslm_mod289_v4);
    registry.add(glslm_permute);
    registry.add(glslm_taylorInvSqrt);
    registry.add(glslm_snoise);

}
