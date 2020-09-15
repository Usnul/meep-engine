import { AbstractSimulationStep } from "./AbstractSimulationStep.js";
import {
    PARTICLE_ATTRIBUTE_LAYER_POSITION,
    PARTICLE_ATTRIBUTE_POSITION,
    PARTICLE_ATTRIBUTE_VELOCITY
} from "../emitter/PARTICLE_ATTRIBUTES.js";
import { v3Length_i } from "../../../../../../core/geom/Vector3.js";
import SimplexNoise from 'simplex-noise';

const velocity = [];
const position = [];
const noise = [];

const p_x0 = [];
const p_x1 = [];
const p_y0 = [];
const p_y1 = [];
const p_z0 = [];
const p_z1 = [];

export class SimulationStepCurlNoise extends AbstractSimulationStep {

    constructor() {
        super();

        this.noise = new SimplexNoise();
    }

    /**
     *
     * @param {number[]} result
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    snoiseVec3(result, x, y, z) {
        const n = this.noise;

        const s0 = n.noise3D(x, y, z);
        const s1 = n.noise3D(y + 19.1, z + 33.4, x + 47.2);
        const s2 = n.noise3D(z + 74.2, x + 124.5, y + 99.4);

        result[0] = s0;
        result[1] = s1;
        result[2] = s2;
    }

    curlNoise(result, x, y, z) {
        const e = .1;

        this.snoiseVec3(p_x0, x - e, y, z);
        this.snoiseVec3(p_x1, x + e, y, z);

        this.snoiseVec3(p_y0, x, y - e, z);
        this.snoiseVec3(p_y1, x, y + e, z);

        this.snoiseVec3(p_z0, x, y, z - e);
        this.snoiseVec3(p_z1, x, y, z + e);

        const _x = p_y1[2] - p_y0[2] - p_z1[1] + p_z0[1];
        const _y = p_z1[0] - p_z0[0] - p_x1[2] + p_x0[2];
        const _z = p_x1[1] - p_x0[1] - p_y1[0] + p_y0[0];

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
