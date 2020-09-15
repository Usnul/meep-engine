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

        for (let i = 0; i < liveParticleCount; i++) {

            //advance position based on velocity
            particles.readAttributeVector3(i, PARTICLE_ATTRIBUTE_VELOCITY, velocity);

            const layer_index = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_LAYER_POSITION);

            const params = layer_parameters[layer_index];

            const force_x = params.x;
            const force_y = params.y;
            const force_z = params.z;

            const v_x = velocity[0] + force_x * timeDelta;
            const v_y = velocity[1] + force_y * timeDelta;
            const v_z = velocity[2] + force_z * timeDelta;

            particles.writeAttributeVector3(i, PARTICLE_ATTRIBUTE_VELOCITY, v_x, v_y, v_z);
        }
    }
}
