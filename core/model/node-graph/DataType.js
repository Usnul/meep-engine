export class DataType {
    constructor() {
        /**
         *
         * @type {number}
         */
        this.id = 0;

        /**
         *
         * @type {string}
         */
        this.name = "";
    }

    toString() {
        return `${this.id}:'${this.name}'`;
    }

    /**
     *
     * @param {DataType} other
     * @returns {boolean}
     */
    equals(other) {
        return this.id === other.id && this.name === other.name;
    }
}

/**
 *
 * @param {number} id
 * @param {string} name
 */
DataType.from = function (id, name) {
    const r = new DataType();

    r.id = id;
    r.name = name;

    return r;
};
