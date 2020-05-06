export class GraphGenerationRule {
    constructor() {

        /**
         * What to match
         * @type {Graph}
         */
        this.pattern = null;

        /**
         * What to replace the match with
         * @type {Graph}
         */
        this.production = null;

    }
}
