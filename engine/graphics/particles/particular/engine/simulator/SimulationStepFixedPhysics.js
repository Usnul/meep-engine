import { AbstractSimulationStep } from "./AbstractSimulationStep.js";
import {
    PARTICLE_ATTRIBUTE_AGE,
    PARTICLE_ATTRIBUTE_DEATH_AGE,
    PARTICLE_ATTRIBUTE_LAYER_POSITION,
    PARTICLE_ATTRIBUTE_POSITION,
    PARTICLE_ATTRIBUTE_ROTATION,
    PARTICLE_ATTRIBUTE_ROTATION_SPEED,
    PARTICLE_ATTRIBUTE_VELOCITY
} from "../emitter/PARTICLE_ATTRIBUTES.js";

const velocity = [];
const position = [];

export class SimulationStepFixedPhysics extends AbstractSimulationStep {
    execute() {
        const particles = this.particles;
        const timeDelta = this.timeDelta;

        const liveParticleCount = particles.size();

        const layerCount = this.layer_count;

        const layerMask = this.layer_mask;

        for (let i = 0; i < liveParticleCount; i++) {

            const layer_position = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_LAYER_POSITION);

            const layer_index = layer_position * layerCount;

            if ((layerMask & (1 << layer_index)) === 0) {
                //skip
                continue;
            }

            const age = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_AGE);

            const deathAge = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_DEATH_AGE);

            const newAge = age + timeDelta;

            //retire dead particles
            if (newAge >= deathAge) {
                //add to trash
                particles.remove(i);
                //we're done with this particle
                continue;
            }

            //make older
            particles.writeAttributeScalar(i, PARTICLE_ATTRIBUTE_AGE, newAge);

            //update rotation
            const rotationSpeed = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_ROTATION_SPEED);
            const oldRotation = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_ROTATION);

            particles.writeAttributeScalar(i, PARTICLE_ATTRIBUTE_ROTATION, oldRotation + rotationSpeed * timeDelta);

            //advance position based on velocity
            particles.readAttributeVector3(i, PARTICLE_ATTRIBUTE_VELOCITY, velocity);

            particles.readAttributeVector3(i, PARTICLE_ATTRIBUTE_POSITION, position);

            const p_x = position[0] + velocity[0] * timeDelta;
            const p_y = position[1] + velocity[1] * timeDelta;
            const p_z = position[2] + velocity[2] * timeDelta;

            particles.writeAttributeVector3(i, PARTICLE_ATTRIBUTE_POSITION, p_x, p_y, p_z);
        }
    }

    get parameter_schema() {
        return [];
    }
}
