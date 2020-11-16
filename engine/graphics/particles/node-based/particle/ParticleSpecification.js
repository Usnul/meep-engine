import { assert } from "../../../../../core/assert.js";

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


        /**
         *
         * @type {number[]}
         * @private
         */
        this.__attribute_offsets = [];

        /**
         *
         * @type {number}
         * @private
         */
        this.__total_attribute_component_count = 0;
    }

    initialize() {
        this.buildAttributeOffset();
    }

    /**
     *
     * @return {number}
     */
    getTotalAttributeComponentCount() {
        return this.__total_attribute_component_count;
    }

    /**
     *
     * @param {number} index
     * @return {number}
     */
    getAttributeOffset(index) {
        assert.isNonNegativeInteger(index, 'index');

        return this.__attribute_offsets[index];
    }

    buildAttributeOffset() {
        let offset = 0;
        const attributes = this.attributes;
        const n = attributes.length;
        for (let i = 0; i < n; i++) {
            const attribute = attributes[i];

            this.__attribute_offsets[i] = offset;

            offset += attribute.computeComponentCount();
        }

        this.__total_attribute_component_count = offset;
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
