import { ParticleDataTypes } from "../nodes/ParticleDataTypes.js";
import { assert } from "../../../../../core/assert.js";

export class ParticleAttributeSpecification {
    constructor() {

        /**
         * @type {ParticleDataTypes}
         */
        this.type = ParticleDataTypes.Float;


        /**
         * Name must be unique
         * @type {string}
         */
        this.name = "";

    }

    /**
     *
     * @param {string} name
     * @param {ParticleDataTypes} type
     * @returns {ParticleAttributeSpecification}
     */
    static from(name, type) {

        assert.enum(type, ParticleDataTypes, 'type');
        assert.typeOf(name, 'string', 'name');


        const r = new ParticleAttributeSpecification();

        r.name = name;
        r.type = type;

        return r;
    }
}
