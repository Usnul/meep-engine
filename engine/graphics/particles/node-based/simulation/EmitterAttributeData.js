export class EmitterAttributeData {
    constructor() {
        /**
         *
         * @type {ParticleSpecification}
         */
        this.spec = null;

        /**
         *
         * @type {GLDataBuffer}
         */
        this.data = null;

        /**
         * Number of particles
         * @type {number}
         */
        this.count = 0;
    }

    /**
     *
     * @param {ParticleSpecification} spec
     * @param {GLDataBuffer} data
     * @param {number} count
     */
    static from(spec, data, count) {
        const r = new EmitterAttributeData();

        r.data = data;
        r.spec = spec;
        r.count = count;

        return r;
    }
}
