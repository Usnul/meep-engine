import { AbstractSimulationStep } from "./AbstractSimulationStep.js";
import { PARTICLE_ATTRIBUTE_LAYER_POSITION, PARTICLE_ATTRIBUTE_VELOCITY } from "../emitter/PARTICLE_ATTRIBUTES.js";

const velocity = [];

export class SimulationStepApplyForce extends AbstractSimulationStep {
    execute() {

        const particles = this.particles;
        const timeDelta = this.timeDelta;

        /**
         *
         * @type {Object[]}
         */
        const layer_parameters = this.layer_parameters;

        const liveParticleCount = particles.size();

        const layerMask = this.layer_mask;
        const layerCount = this.layer_count;

        for (let i = 0; i < liveParticleCount; i++) {

            const layer_position = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_LAYER_POSITION);

            const layer_index = layer_position * layerCount;

            if ((layerMask & (1 << layer_index)) === 0) {
                //skip
                continue;
            }

            //advance position based on velocity
            particles.readAttributeVector3(i, PARTICLE_ATTRIBUTE_VELOCITY, velocity);


            const params = layer_parameters[layer_index];

            const force_x = params[0];
            const force_y = params[1];
            const force_z = params[2];

            const v_x = velocity[0] + force_x * timeDelta;
            const v_y = velocity[1] + force_y * timeDelta;
            const v_z = velocity[2] + force_z * timeDelta;

            particles.writeAttributeVector3(i, PARTICLE_ATTRIBUTE_VELOCITY, v_x, v_y, v_z);
        }
    }

    get parameter_schema() {
        return [
            'force_x',
            'force_y',
            'force_z'
        ];
    }
}
