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
     * @param {number} attribute_index
     * @param {number} index
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    writeAttributeVector3(attribute_index, index, x, y, z) {
        const component_offset = this.spec.getAttributeOffset(attribute_index);

        const address = index * this.spec.getTotalAttributeComponentCount() + component_offset;

        const source = this.data.data_f32;
        source[address] = x;
        source[address + 1] = y;
        source[address + 2] = z;
    }

    /**
     *
     * @param {number} attribute_index
     * @param {number} index
     * @param {number} destination
     * @param {number} destination_offset
     */
    readAttributeVector3(attribute_index, index, destination, destination_offset) {
        const component_offset = this.spec.getAttributeOffset(attribute_index);

        const address = index * this.spec.getTotalAttributeComponentCount() + component_offset;

        const source = this.data.data_f32;
        const x = source[address];
        const y = source[address + 1];
        const z = source[address + 2];

        destination[destination_offset] = x;
        destination[destination_offset + 1] = y;
        destination[destination_offset + 2] = z;
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
