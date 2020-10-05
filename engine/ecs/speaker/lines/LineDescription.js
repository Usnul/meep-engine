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
         * Time the line should be displayed on the screen before being removed
         * @type {number}
         */
        this.displayDuration = 3.7;
    }

    fromJSON({
                 id,
                 text,
                 comment = "",
                 displayDuration = 3.7
             }) {
        this.id = id;
        this.text = text;
        this.comment = comment;
        this.displayDuration = displayDuration
    }
}
