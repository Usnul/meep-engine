export class LineSetDescription {
    constructor() {
        /**
         *
         * @type {string}
         */
        this.id = "";

        /**
         *
         * @type {LineDescription[]}
         */
        this.lines = [];

        /**
         *
         * @type {LineSetDescription[]}
         */
        this.sets = [];
    }
}
