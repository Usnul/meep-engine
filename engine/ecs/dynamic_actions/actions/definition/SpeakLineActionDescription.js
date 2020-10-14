import { AbstractActionDescription } from "./AbstractActionDescription.js";
import { SequenceBehavior } from "../../../../intelligence/behavior/composite/SequenceBehavior.js";
import { ParallelBehavior } from "../../../../intelligence/behavior/composite/ParallelBehavior.js";
import { WaitForEventBehavior } from "../../../../../../model/game/util/behavior/WaitForEventBehavior.js";
import { VoiceEvents } from "../../../speaker/VoiceEvents.js";
import { SendEventBehavior } from "../../../../../../model/game/util/behavior/SendEventBehavior.js";
import { Voice } from "../../../speaker/Voice.js";
import { VoiceFlags } from "../../../speaker/VoiceFlags.js";
import { ActionBehavior } from "../../../../intelligence/behavior/primitive/ActionBehavior.js";
import { assert } from "../../../../../core/assert.js";

export class SpeakLineActionDescription extends AbstractActionDescription {
    constructor() {
        super();

        /**
         *
         * @type {string}
         */
        this.id = "";

        this.isGroup = false;

        /**
         * If override is on, will request speaking a line even if another line is currently being spoken
         * @type {boolean}
         */
        this.override = false;
    }

    execute(actor, dataset, context, system) {
        const id = this.id;

        const is_group = this.isGroup;

        const event_type = is_group ? VoiceEvents.SpeakSetLine : VoiceEvents.SpeakLine;

        return SequenceBehavior.from([
            new ActionBehavior(() => {

                const voice = dataset.getComponent(actor, Voice);

                if (voice !== undefined && voice.getFlag(VoiceFlags.Speaking) && !this.override) {
                    // currently speaking, give up
                    throw new Error(`Another line is being spoken, terminating request to speak line '${id}' for actor '${actor}'`)
                }

            }),
            ParallelBehavior.from([
                WaitForEventBehavior.fromJSON({
                    event: VoiceEvents.FinishedSpeakingLine
                }),
                SendEventBehavior.fromJSON({
                    event: event_type,
                    data: {
                        id: id
                    }
                })
            ])
        ]);
    }

    /**
     *
     * @param {string} [line_id]
     * @param {string} [set_id]
     */
    fromJSON({ line_id, set_id }) {
        if (set_id !== undefined && line_id !== undefined) {
            throw new Error(`Both line_id and group_id are set, only one is expected`);
        }

        if (line_id !== undefined) {
            assert.typeOf(line_id, 'string', 'line_id');

            this.isGroup = false;
            this.id = line_id;
        } else {
            assert.typeOf(set_id, 'string', 'set_id');

            this.isGroup = true;
            this.id = set_id;
        }
    }
}

SpeakLineActionDescription.prototype.type = "SpeakLine";
