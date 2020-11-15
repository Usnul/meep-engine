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
     * @param {ParticleAttributeSpecification[]} uniforms
     * @param {NodeGraph} model
     */
    static from(attributes, uniforms, model) {
        const r = new ParticleSpecification();

        r.attributes = attributes;
        r.model = model;
        r.uniforms = uniforms;

        return r;
    }
}
