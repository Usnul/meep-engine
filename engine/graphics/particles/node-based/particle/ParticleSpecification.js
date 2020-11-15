export class ParticleSpecification {
    constructor() {

        /**
         *
         * @type {ParticleAttributeSpecification[]}
         */
        this.attributes = [];

        /**
         *
         * @type {ParticleAttributeSpecification[]}
         */
        this.uniforms = [];


        /**
         *
         * @type {NodeGraph}
         */
        this.model = null;
    }

    /**
     *
     * @param {ParticleAttributeSpecification[]} attributes
     * @param {NodeGraph} model
     */
    static from(attributes, model) {
        const r = new ParticleSpecification();

        r.attributes = attributes;
        r.model = model;

        return r;
    }
}
