import { LineSetDescription } from "./LineSetDescription.js";

export class LineSequenceDescription extends LineSetDescription {
    constructor() {
        super();

        /**
         *
         * @type {LineSetDescription[]}
         */
        this.contents = [];
    }
}
