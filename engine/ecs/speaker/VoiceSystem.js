import { System } from "../System.js";
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

const EVENT_NAME = 'speak-line';

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

class Context {
    constructor() {
        /**
         *
         * @type {Voice}
         */
        this.speaker = null;
        /**
         *
         * @type {number}
         */
        this.entity = 0;

        /**
         *
         * @type {EntityComponentDataset}
         */
        this.dataset = null;

        /**
         * Link back to the system
         * @type {VoiceSystem}
         */
        this.system = null;
    }


    handle(line) {
        this.system.sayLine(this.entity, line);
    }

    link() {
        const dataset = this.system.entityManager.dataset;

        dataset.addEntityEventListener(this.entity, EVENT_NAME, this.handle, this);
    }

    unlink() {
        const dataset = this.system.entityManager.dataset;

        dataset.removeComponentFromEntity(this.entity, EVENT_NAME, this.handle, this);
    }
}

export class VoiceSystem extends System {
    /**
     *
     * @param {Engine} engine
     */
    constructor(engine) {
        super();

        this.dependencies = [Voice];

        this.contexts = [];

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
     */
    sayLine(entity, line_id) {
        const ecd = this.entityManager.dataset;

        /**
         *
         * @type {LineDescription}
         */
        const line = this.lines.get(line_id);

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
                DieBehavior.create()
            ])))
            .build(ecd);
    }

    /**
     *
     * @param {Voice} speaker
     * @param {number} entity
     */
    link(speaker, entity) {
        const context = new Context();

        context.speaker = speaker;
        context.entity = entity;
        context.system = this;

        context.link();

        this.contexts[entity] = context;
    }

    /**
     *
     * @param {Voice} component
     * @param {number} entity
     */
    unlink(component, entity) {

        const context = this.contexts[entity];

        if (context === undefined) {
            console.warn(`Context not found for '${entity}'`);
            return;
        }

        context.unlink();
    }
}
