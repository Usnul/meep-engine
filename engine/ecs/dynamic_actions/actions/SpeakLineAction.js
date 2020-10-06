import { AbstractAction } from "./AbstractAction.js";
import { VoiceEvents } from "../../speaker/VoiceEvents.js";

export class SpeakLineAction extends AbstractAction {
    constructor() {
        super();

        /**
         *
         * @type {string}
         */
        this.line_id = "";
    }

    execute(actor, dataset, context) {
        dataset.sendEvent(actor, VoiceEvents.SpeakLine, this.line_id);
    }
}
