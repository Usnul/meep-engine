import { AbstractActionDescription } from "./AbstractActionDescription.js";
import { SequenceBehavior } from "../../../../intelligence/behavior/composite/SequenceBehavior.js";
import { ParallelBehavior } from "../../../../intelligence/behavior/composite/ParallelBehavior.js";
import { WaitForEventBehavior } from "../../../../../../model/game/util/behavior/WaitForEventBehavior.js";
import { VoiceEvents } from "../../../speaker/VoiceEvents.js";
import { SendEventBehavior } from "../../../../../../model/game/util/behavior/SendEventBehavior.js";
import { Voice } from "../../../speaker/Voice.js";
import { VoiceFlags } from "../../../speaker/VoiceFlags.js";
import { ActionBehavior } from "../../../../intelligence/behavior/primitive/ActionBehavior.js";

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
        const lineId = this.line_id;

        return SequenceBehavior.from([
            new ActionBehavior(() => {

                const voice = dataset.getComponent(actor, Voice);

                if (voice !== undefined && voice.getFlag(VoiceFlags.Speaking) && !this.override) {
                    // currently speaking, give up
                    throw new Error(`Another line is being spoken, terminating request to speak line '${lineId}' for actor '${actor}'`)
                }

            }),
            ParallelBehavior.from([
                WaitForEventBehavior.fromJSON({
                    event: VoiceEvents.FinishedSpeakingLine
                }),
                SendEventBehavior.fromJSON({
                    event: VoiceEvents.SpeakLine,
                    data: {
                        id: lineId
                    }
                })
            ])
        ]);
    }

    fromJSON({ line_id }) {
        this.line_id = line_id;
    }
}

SpeakLineActionDescription.prototype.type = "SpeakLine";
