export class MarkerProcessingRule {
    constructor() {
        /**
         * @type {MarkerNodeMatcher}
         */
        this.matcher = null;

        /**
         *
         * @type {MarkerNodeAction[]}
         */
        this.actions = [];

        /**
         * If this rule is applied, no other rules may be applied to the same node
         * @type {boolean}
         */
        this.consume = true;
    }
}
