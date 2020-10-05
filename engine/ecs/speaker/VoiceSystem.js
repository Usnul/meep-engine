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

const EVENT_NAME = 'speak-line';

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

        const localized_line = this.localiation.getString(line.text);

        const view = new EmptyView({
            classList: ['gui-voice-speech-bubble']
        });

        this.gml.compile(localized_line, view);

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
                DelayBehavior.from(line.displayDuration),
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
