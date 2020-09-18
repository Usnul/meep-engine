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

            const power_x = params[0];
            const power_y = params[1];
            const power_z = params[2];

            const scale_x = params[3];
            const scale_y = params[4];
            const scale_z = params[5];

            curl_noise_3d(noise, position[0] * scale_x, position[1] * scale_y, position[2] * scale_z);

            const delta_x = noise[0] * power_x;
            const delta_y = noise[1] * power_y;
            const delta_z = noise[2] * power_z;

            particles.writeAttributeVector3(i, PARTICLE_ATTRIBUTE_VELOCITY, delta_x, delta_y, delta_z);
        }
    }

    get parameter_schema() {
        return [
            'power_x',
            'power_y',
            'power_z',
            'scale_x',
            'scale_y',
            'scale_z'
        ];
    }
}
