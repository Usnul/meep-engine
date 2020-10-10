import { assert } from "../../../../core/assert.js";

export class LineDescription {
    constructor() {
        /**
         * Unique id
         * @type {string}
         */
        this.id = "";

        /**
         * Comment about the line, useful for development purposes
         * @type {string}
         */
        this.comment = "";

        /**
         * Localization key for the line of text
         * @type {string}
         */
        this.text = "";

        /**
         * Time the line should be displayed on the screen before being removed, normalized value, 1 means standard, 1.5 means 50% longer
         * @type {number}
         */
        this.displayDuration = 1;
    }

    fromJSON({
                 id,
                 text,
                 comment = "",
                 displayDuration = 1
             }) {

        assert.typeOf(text, 'string', 'text');

        this.id = id;
        this.text = text;
        this.comment = comment;

        this.displayDuration = displayDuration;
    }
}
