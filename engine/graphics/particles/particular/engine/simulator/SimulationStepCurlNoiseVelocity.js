import { AbstractSimulationStep } from "./AbstractSimulationStep.js";
import {
    PARTICLE_ATTRIBUTE_LAYER_POSITION,
    PARTICLE_ATTRIBUTE_POSITION,
    PARTICLE_ATTRIBUTE_VELOCITY
} from "../emitter/PARTICLE_ATTRIBUTES.js";
import { curl_noise_3d } from "../../../../../../core/math/noise/curl_noise_3d.js";

const position = [];
const noise = [];


export class SimulationStepCurlNoiseVelocity extends AbstractSimulationStep {

    constructor() {
        super();
    }

    execute() {
        const particles = this.particles;
        const timeDelta = this.timeDelta;

        /**
         *
         * @type {Object[]}
         */
        const layer_parameters = this.layer_parameters;

        const liveParticleCount = particles.size();

        for (let i = 0; i < liveParticleCount; i++) {

            particles.readAttributeVector3(i, PARTICLE_ATTRIBUTE_POSITION, position);

            const layer_index = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_LAYER_POSITION);

            const params = layer_parameters[layer_index];

            const power_x = params.power_x;
            const power_y = params.power_y;
            const power_z = params.power_z;

            const scale_x = params.scale_x;
            const scale_y = params.scale_y;
            const scale_z = params.scale_z;

            curl_noise_3d(noise, position[0] * scale_x, position[1] * scale_y, position[2] * scale_z);

            const delta_x = noise[0] * power_x;
            const delta_y = noise[1] * power_y;
            const delta_z = noise[2] * power_z;

            particles.writeAttributeVector3(i, PARTICLE_ATTRIBUTE_VELOCITY, delta_x, delta_y, delta_z);
        }
    }
}
