export class DynamicActionDescription {
    constructor() {

        /**
         * Event name
         * @type {string}
         */
        this.event = "";


        /**
         *
         * @type {ReactiveExpression}
         */
        this.condition = null;

        /**
         *
         * @type {AbstractAction}
         */
        this.action = null;
    }
}
