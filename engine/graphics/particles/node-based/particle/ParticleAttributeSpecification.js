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
     * @return {number}
     */
    computeComponentCount() {
        switch (this.type) {
            case ParticleDataTypes.Float:
                return 1;
            case ParticleDataTypes.Vector2:
                return 2;
            case ParticleDataTypes.Vector3:
                return 3;
            case ParticleDataTypes.Vector4:
                return 4;

            default:
                throw new Error(`Unsupported data type '${this.type}'`);
        }
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
