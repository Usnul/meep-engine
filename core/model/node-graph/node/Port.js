import { PortDirection } from "./PortDirection.js";
import { computeStringHash } from "../../../primitives/strings/StringUtils.js";
import { computeHashIntegerArray } from "../../../math/MathUtils.js";

export class Port {
    constructor() {
        /**
         *
         * @type {String}
         */
        this.name = "";

        /**
         * ID uniquely identifies object within some context. Ids are assumed to be immutable
         * @type {number}
         */
        this.id = 0;

        /**
         *
         * @type {PortDirection|number}
         */
        this.direction = PortDirection.Unspecified;

        /**
         *
         * @type {DataType}
         */
        this.dataType = null;
    }

    hash() {
        return computeHashIntegerArray(
            computeStringHash(this.name),
            this.id,
            this.direction,
            this.dataType.id
        );
    }

    /**
     *
     * @param {Port} other
     * @returns {boolean}
     */
    equals(other) {

        return this.name === other.name
            && this.id === other.id
            && this.direction === other.direction
            && this.dataType === other.dataType
            ;

    }
}
