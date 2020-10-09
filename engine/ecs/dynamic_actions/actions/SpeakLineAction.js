import { AbstractAction } from "./AbstractAction.js";
import { VoiceEvents } from "../../speaker/VoiceEvents.js";
import { Voice } from "../../speaker/Voice.js";
import { VoiceFlags } from "../../speaker/VoiceFlags.js";

export class SpeakLineAction extends AbstractAction {
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

    execute(actor, dataset, context) {
        const voice = dataset.getComponent(actor, Voice);

        if (voice !== undefined && voice.getFlag(VoiceFlags.Speaking) && !this.override) {
            console.warn(`Another line is being spoken, terminating request to speak line '${this.line_id}' for actor '${actor}'`);

            // currently speaking, give up
            return;
        }

        dataset.sendEvent(actor, VoiceEvents.SpeakLine, this.line_id);
    }
}

SpeakLineAction.prototype.type = "SpeakLine";
