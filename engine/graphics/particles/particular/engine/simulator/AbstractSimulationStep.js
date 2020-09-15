export class AbstractSimulationStep {

    constructor() {
        /**
         * In seconds
         * @type {number}
         */
        this.timeDelta = 0;

        /**
         *
         * @type {ParticlePool}
         */
        this.particles = null;

        /**
         *
         * @type {Object[]}
         */
        this.layer_parameters = [];

    }

    execute() {
        throw new Error('Not implemented, needs to be overridden in the implementing subclass');
    }
}
