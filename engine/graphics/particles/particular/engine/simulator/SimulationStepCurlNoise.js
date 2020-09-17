import { AbstractSimulationStep } from "./AbstractSimulationStep.js";
import {
    PARTICLE_ATTRIBUTE_LAYER_POSITION,
    PARTICLE_ATTRIBUTE_POSITION,
    PARTICLE_ATTRIBUTE_VELOCITY
} from "../emitter/PARTICLE_ATTRIBUTES.js";
import { v3Length_i } from "../../../../../../core/geom/Vector3.js";
import SimplexNoise from 'simplex-noise';
import { seededRandom } from "../../../../../../core/math/MathUtils.js";

const velocity = [];
const position = [];
const noise = [];

export class SimulationStepCurlNoise extends AbstractSimulationStep {

    constructor() {
        super();

        this.random = seededRandom(1337);

        this.noise = new SimplexNoise(this.random);
    }

    curlNoise(result, x, y, z) {
        const n = this.noise;

        const e = 0.001;

        const n_x0 = n.noise3D(x - e, y, z);
        const n_x1 = n.noise3D(x + e, y, z);

        const n_y0 = n.noise3D(x, y - e, z);
        const n_y1 = n.noise3D(x, y + e, z);

        const n_z0 = n.noise3D(x, y, z - e);
        const n_z1 = n.noise3D(x, y, z + e);

        const _x = n_x0 - n_x1;
        const _y = n_y0 - n_y1;
        const _z = n_z0 - n_z1;

        // normalize output
        const length = v3Length_i(_x, _y, _z);

        const scale = 1 / length;

        result[0] = _x * scale;
        result[1] = _y * scale;
        result[2] = _z * scale;
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

            //advance position based on velocity
            particles.readAttributeVector3(i, PARTICLE_ATTRIBUTE_VELOCITY, velocity);

            particles.readAttributeVector3(i, PARTICLE_ATTRIBUTE_POSITION, position);

            const layer_index = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_LAYER_POSITION);

            const params = layer_parameters[layer_index];

            const power_x = params.power_x;
            const power_y = params.power_y;
            const power_z = params.power_z;

            const scale_x = params.scale_x;
            const scale_y = params.scale_y;
            const scale_z = params.scale_z;

            this.curlNoise(noise, position[0] * scale_x, position[1] * scale_y, position[2] * scale_z);

            const delta_x = noise[0] * power_x;
            const delta_y = noise[1] * power_y;
            const delta_z = noise[2] * power_z;

            const v_x = velocity[0] + delta_x * timeDelta;
            const v_y = velocity[1] + delta_y * timeDelta;
            const v_z = velocity[2] + delta_z * timeDelta;

            particles.writeAttributeVector3(i, PARTICLE_ATTRIBUTE_VELOCITY, v_x, v_y, v_z);
        }
    }
}
