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

        /**
         *
         * @type {number}
         */
        this.layer_count = 0;

        /**
         *
         * @type {number}
         */
        this.layer_mask = 0;
    }

    includeLayer(index) {
        this.layer_mask |= 1 << index;
    }

    clear() {
        this.layer_mask = 0;
    }

    /**
     *
     * @return {string[]}
     */
    get parameter_schema() {
        return [];
    }

    execute() {
        throw new Error('Not implemented, needs to be overridden in the implementing subclass');
    }

}
