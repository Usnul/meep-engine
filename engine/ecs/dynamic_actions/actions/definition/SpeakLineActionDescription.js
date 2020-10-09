import { AbstractActionDescription } from "./AbstractActionDescription.js";
import { SpeakLineAction } from "../execution/SpeakLineAction.js";

export class SpeakLineActionDescription extends AbstractActionDescription {
    constructor() {
        super();

        /**
         *
         * @type {string}
         */
        this.line_id = "";

        /**
         * If override is on, will request speaking a line even if another line is currently being spoken
         * @type {boolean}
         */
        this.override = false;
    }

    execute(actor, dataset, context, system) {
        return new SpeakLineAction(actor, dataset, this.line_id);
    }

    fromJSON({ line_id }) {
        this.line_id = line_id;
    }
}

SpeakLineActionDescription.prototype.type = "SpeakLine";
