import { Group } from "three";

/**
 * Abstract base class for a particle renderer
 */
export class ParticleRenderer {

    constructor() {


        /**
         * Base object where data is added
         * @type {Group}
         */
        this.mesh = new Group();

    }

    /**
     * Render collection of particle layers
     * @param {ParticlePool[]} pools
     */
    render(pools) {

    }
}
