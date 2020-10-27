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
import { assert } from "../../../core/assert.js";
import { weightedRandomFromArray } from "../../../core/collection/array/weightedRandomFromArray.js";

/**
 * Delay before the user notices the text and begins to read
 * @type {number}
 */
const TIMING_NOTICE_DELAY = 0.2;

/**
 * Minimum time to read something
 * @type {number}
 */
const TIMING_MINIMUM_READ_TIME = 1.2;

/**
 *
 * @type {LineDescription[]}
 */
const temp_lines = [];

class LineWeigher {
    constructor() {

        /**
         *
         * @type {number}
         */
        this.entity = -1;
        /**
         *
         * @type {VoiceSystem}
         */
        this.system = null;

        /**
         *
         * @type {number}
         */
        this.time = 0;
    }

    /**
     *
     * @param {LineDescription} line
     * @return {number}
     */
    compute(line) {
        const entity = this.entity;

        const last_spoken = this.system.__global_last_used_times.get(line.id);

        let freshness_score = 0;

        if (last_spoken !== undefined) {
            const time_since_last_spoken = this.time - last_spoken;

            freshness_score += time_since_last_spoken;
        } else {
            // no record of the line being spoken, consider very fresh
            freshness_score = 10000;
        }

        return freshness_score;
    }
}

class Context extends SystemEntityContext {


    handleSpeakLineEvent({ id }) {
        this.system.sayLine(this.entity, id, this.components[0]);
    }

    handleSpeakLineSetEvent({ id }) {
        this.system.sayLineFromSet(this.entity, id, this.components[0]);
    }

    link() {
        const dataset = this.getDataset();

        dataset.addEntityEventListener(this.entity, VoiceEvents.SpeakLine, this.handleSpeakLineEvent, this);

        dataset.addEntityEventListener(this.entity, VoiceEvents.SpeakSetLine, this.handleSpeakLineSetEvent, this);
    }

    unlink() {
        const dataset = this.getDataset();

        dataset.removeEntityEventListener(this.entity, VoiceEvents.SpeakLine, this.handleSpeakLineEvent, this);

        dataset.removeEntityEventListener(this.entity, VoiceEvents.SpeakSetLine, this.handleSpeakLineSetEvent, this);
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
         * @type {LineSetDescriptionTable}
         */
        this.sets = null;

        /**
         *
         * @type {Engine}
         */
        this.engine = engine;

        /**
         * When last a line was spoken
         * @type {Map<string, number>}
         * @private
         */
        this.__global_last_used_times = new Map();

        /**
         *
         * @type {LineWeigher}
         * @private
         */
        this.__weigher = new LineWeigher();
        this.__weigher.system = this;
    }

    /**
     *
     * @return {number}
     */
    getCurrentTime() {
        return this.engine.ticker.clock.getElapsedTime();
    }

    startup(entityManager, readyCallback, errorCallback) {

        const engine = this.engine;

        this.localiation = engine.localization
        this.gml = engine.gui.gml;

        const knowledge = engine.staticKnowledge;

        this.lines = knowledge.getTable('voice-lines');
        this.sets = knowledge.getTable('voice-line-sets');

        assert.defined(this.lines, 'lines');
        assert.defined(this.sets, 'sets');

        super.startup(entityManager, readyCallback, errorCallback);
    }

    /**
     *
     * @param {number} entity
     * @param {string} set_id
     * @param {Voice} voice
     */
    sayLineFromSet(entity, set_id, voice) {
        /**
         *
         * @type {LineSetDescription}
         */
        const set = this.sets.get(set_id);

        if (set === null) {
            console.warn(`Line set '${set_id}' not found in the database`);
            return;
        }

        const collected_count = set.collect(temp_lines, 0);

        this.__weigher.entity = entity;
        this.__weigher.time = this.getCurrentTime();

        const selected_line = weightedRandomFromArray(temp_lines, Math.random, this.__weigher.compute, this.__weigher, collected_count);

        this.sayLine(entity, selected_line.id, voice);
    }

    /**
     *
     * @param {number} entity
     * @param {string} line_id
     * @param {Voice} voice
     */
    sayLine(entity, line_id, voice) {

        /**
         *
         * @type {LineDescription}
         */
        const line = this.lines.get(line_id);

        if (line === null) {
            console.warn(`Line '${line_id}' not found in the database`);
            return;
        }

        // record when the line was spoken
        this.__global_last_used_times.set(line_id, this.getCurrentTime());

        const ecd = this.entityManager.dataset;

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

        const transform = new Transform();

        // copy transform from source entity
        const source_transform = ecd.getComponent(entity, Transform);

        if (source_transform !== undefined) {
            transform.copy(source_transform);
        }

        new EntityBuilder()
            .add(GUIElement.fromView(view))
            .add(ViewportPosition.fromJSON({}))
            .add(HeadsUpDisplay.fromJSON({ anchor: new Vector2(0.5, 1) }))
            .add(transform)
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
