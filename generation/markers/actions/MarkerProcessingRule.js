export class MarkerProcessingRule {
    constructor() {
        /**
         * Marker type to match
         * @type {String}
         */
        this.type = null;

        /**
         *
         * @type {MarkerNodeAction[]}
         */
        this.actions = [];
    }
}
