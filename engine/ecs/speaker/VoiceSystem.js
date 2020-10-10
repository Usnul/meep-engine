import { Voice } from "./Voice.js";
import EntityBuilder from "../EntityBuilder.js";
import GUIElement from "../gui/GUIElement.js";
import { SerializationMetadata } from "../components/SerializationMetadata.js";
import HeadsUpDisplay from "../gui/hud/HeadsUpDisplay.js";
import ViewportPosition from "../gui/position/ViewportPosition.js";
import { Transform } from "../transform/Transform.js";
import { Attachment } from "../attachment/Attachment.js";
import { BehaviorComponent } from "../../intelligence/behavior/ecs/BehaviorComponent.js";
import { SequenceBehavior } from "../../intelligence/behavior/composite/SequenceBehavior.js";
import { DelayBehavior } from "../../../../model/game/util/behavior/DelayBehavior.js";
import { DieBehavior } from "../../../../model/game/util/behavior/DieBehavior.js";
import Vector2 from "../../../core/geom/Vector2.js";
import EmptyView from "../../../view/elements/EmptyView.js";
import { max2 } from "../../../core/math/MathUtils.js";
import { VoiceEvents } from "./VoiceEvents.js";
import { AbstractContextSystem } from "../system/AbstractContextSystem.js";
import { SystemEntityContext } from "../system/SystemEntityContext.js";
import { ActionBehavior } from "../../intelligence/behavior/primitive/ActionBehavior.js";
import { Blackboard } from "../../intelligence/blackboard/Blackboard.js";
import { VoiceFlags } from "./VoiceFlags.js";

/**
 * Delay before the user notices the text and begins to read
 * @type {number}
 */
const TIMING_NOTICE_DELAY = 0.2;

/**
 * Minimum time to read something
 * @type {number}
 */
const TIMING_MINIMUM_READ_TIME = 0.5;

class Context extends SystemEntityContext {


    handle({ id }) {
        this.system.sayLine(this.entity, id, this.components[0]);
    }

    link() {
        const dataset = this.getDataset();

        dataset.addEntityEventListener(this.entity, VoiceEvents.SpeakLine, this.handle, this);
    }

    unlink() {
        const dataset = this.getDataset();

        dataset.removeEntityEventListener(this.entity, VoiceEvents.SpeakLine, this.handle, this);
    }
}

export class VoiceSystem extends AbstractContextSystem {
    /**
     *
     * @param {Engine} engine
     */
    constructor(engine) {
        super(Context);

        this.dependencies = [Voice];

        /**
         *
         * @type {Localization}
         */
        this.localiation = null;

        /**
         *
         * @type {GMLEngine}
         */
        this.gml = null;

        /**
         *
         * @type {LineDescriptionTable}
         */
        this.lines = null;

        /**
         *
         * @type {Engine}
         */
        this.engine = engine;
    }

    startup(entityManager, readyCallback, errorCallback) {

        const engine = this.engine;

        this.localiation = engine.localization
        this.gml = engine.gui.gml;
        this.lines = engine.staticKnowledge.getTable('voice-lines');

        super.startup(entityManager, readyCallback, errorCallback);
    }

    /**
     *
     * @param {number} entity
     * @param {string} line_id
     * @param {Voice} voice
     */
    sayLine(entity, line_id, voice) {
        const ecd = this.entityManager.dataset;

        /**
         *
         * @type {LineDescription}
         */
        const line = this.lines.get(line_id);

        if (line === null) {
            console.warn(`Line '${line_id}' not found in the database`);
            return;
        }

        const localiation = this.localiation;

        const localized_line = localiation.getString(line.text);


        const view = new EmptyView({
            classList: ['gui-voice-speech-bubble']
        });

        const gml = this.gml;

        gml.compile(localized_line, view);

        // localized line may contain reference tags, the user will not see/read those, so we also compile line as pure text for estimating reading time
        const line_pure_text = gml.compileAsText(localized_line);

        const display_time_raw = localiation.computeReadingTime(line_pure_text);

        const display_time = max2(TIMING_MINIMUM_READ_TIME, display_time_raw * line.displayDuration) + TIMING_NOTICE_DELAY;

        console.log('Display time:', display_time, line_pure_text);

        voice.setFlag(VoiceFlags.Speaking);

        new EntityBuilder()
            .add(GUIElement.fromView(view))
            .add(ViewportPosition.fromJSON({}))
            .add(HeadsUpDisplay.fromJSON({ anchor: new Vector2(0.5, 1) }))
            .add(new Transform())
            .add(Attachment.fromJSON({
                socket: 'Voice',
                parent: entity,
                immediate: true
            }))
            .add(SerializationMetadata.Transient)
            .add(BehaviorComponent.fromOne(SequenceBehavior.from([
                DelayBehavior.from(display_time),
                new ActionBehavior(() => {
                    // clear speaking flag
                    voice.clearFlag(VoiceFlags.Speaking);

                    // notify that the line has ended
                    ecd.sendEvent(entity, VoiceEvents.FinishedSpeakingLine, line_id);

                    // record the fact that line was spoken
                    const bb = ecd.getComponent(entity, Blackboard);

                    if (bb !== undefined) {
                        bb.acquireNumber(`voice.line_spoken.${line_id}.count`).increment();
                    }
                }),
                DieBehavior.create()
            ])))
            .build(ecd);
    }
}
