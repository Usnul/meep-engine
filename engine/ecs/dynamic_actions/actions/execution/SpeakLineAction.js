import { AsynchronousAction } from "../../../../../core/process/action/AsynchronousAction.js";
import TaskState from "../../../../../core/process/task/TaskState.js";
import { VoiceEvents } from "../../../speaker/VoiceEvents.js";
import { Voice } from "../../../speaker/Voice.js";
import { VoiceFlags } from "../../../speaker/VoiceFlags.js";

export class SpeakLineAction extends AsynchronousAction {
    /**
     *
     * @param {number} actor
     * @param {EntityComponentDataset} ecd
     * @param {string} line_id
     */
    constructor(
        actor,
        ecd,
        line_id
    ) {
        super();

        /**
         *
         * @type {number}
         */
        this.actor = actor;
        /**
         *
         * @type {EntityComponentDataset}
         */
        this.ecd = ecd;
        /**
         *
         * @type {string}
         */
        this.line_id = line_id;
    }

    cancel() {
        if (this.status === TaskState.RUNNING) {
            this.detach();

            // TODO remove the line as well?
        }

        return Promise.resolve();
    }

    detach() {
        this.ecd.removeEntityEventListener(this.actor, VoiceEvents.FinishedSpeakingLine, this.handleLineFinishedSpeaking, this);
    }

    handleLineFinishedSpeaking() {
        this.detach();

        this.__succeed();

    }

    start() {
        super.start();

        const ecd = this.ecd;
        const actor = this.actor;

        const voice = ecd.getComponent(actor, Voice);

        if (voice !== undefined && voice.getFlag(VoiceFlags.Speaking) && !this.override) {
            // currently speaking, give up
            this.__fail(`Another line is being spoken, terminating request to speak line '${this.line_id}' for actor '${actor}'`)
            return;
        }

        ecd.addEntityEventListener(actor, VoiceEvents.FinishedSpeakingLine, this.handleLineFinishedSpeaking, this);
        ecd.sendEvent(actor, VoiceEvents.SpeakLine, this.line_id);
    }
}
