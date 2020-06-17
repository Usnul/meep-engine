import View from "../View.js";
import dom from "../DOM.js";
import { globalMetrics } from "../../engine/metrics/GlobalMetrics.js";
import { MetricsCategory } from "../../engine/metrics/MetricsCategory.js";
import EntityBuilder from "../../engine/ecs/EntityBuilder.js";
import { SoundEmitter } from "../../engine/sound/ecs/emitter/SoundEmitter.js";
import { Transform } from "../../engine/ecs/transform/Transform.js";
import { SoundEmitterChannels } from "../../engine/sound/ecs/emitter/SoundEmitterSystem.js";
import { SerializationMetadata } from "../../engine/ecs/components/SerializationMetadata.js";
import { BehaviorComponent } from "../../engine/intelligence/behavior/ecs/BehaviorComponent.js";
import { DelayBehavior } from "../../../model/game/util/behavior/DelayBehavior.js";
import { SequenceBehavior } from "../../engine/intelligence/behavior/composite/SequenceBehavior.js";
import { DieBehavior } from "../../../model/game/util/behavior/DieBehavior.js";

class CommandButtonView extends View {
    /**
     *
     * @param {InterfaceCommand} prop
     * @param {GUIEngine} gui
     * @param {EntityComponentDataset} ecd
     * @constructor
     * @extends {View}
     */
    constructor(prop, gui, ecd) {
        super();

        /**
         *
         * @type {InteractionCommand}
         */
        const command = prop.command;

        const dButton = dom('button').css(prop.style).addClass('command-button-view');

        dButton.addClass('command-' + command.id);

        this.el = dButton.el;

        /**
         *
         * @param {SoundTrack} sound
         */
        function playSound(sound) {
            if (sound === null) {
                return;
            }

            const soundEmitter = new SoundEmitter();
            soundEmitter.isPositioned = false;
            soundEmitter.channel = SoundEmitterChannels.Effects;

            const track = sound.clone();

            track.startWhenReady = true;
            track.channel = SoundEmitterChannels.Effects;

            const eb = new EntityBuilder();

            track.on.ended.add(() => eb.destroy());

            soundEmitter.tracks.add(track);

            eb
                .add(soundEmitter)
                .add(BehaviorComponent.fromOne(SequenceBehavior.from([
                    DelayBehavior.fromJSON({ value: 5 }),
                    new DieBehavior()
                ])))
                .add(new Transform())
                .add(SerializationMetadata.Transient)
                .build(ecd);


            track.on.ended.add(console.log);
        }

        dButton.el.onclick = function () {
            if (command.enabled.getValue()) {
                command.action();

                playSound(prop.actionSound);

                globalMetrics.record("command-used", {
                    category: MetricsCategory.Interaction,
                    label: command.id
                });
            }
        };

        dButton.on('mouseenter', () => {

            if (command.enabled.getValue()) {
                //only play the sound if the button is enabled
                playSound(prop.hoverSound);
            }
        });

        dButton.createChild('div').addClass('background');
        dButton.createChild('div').addClass('foreground');

        function updateEnableStatus() {
            const v = command.enabled.getValue();

            dButton.disabled = !v;
            dButton.setClass('disabled', !v);
            dButton.setClass('enabled', v);
        }

        function featureClassName(f) {
            return "feature-" + f;
        }

        function addCommandFeature(f) {
            dButton.addClass(featureClassName(f));
        }

        function removeCommandFeature(f) {
            dButton.removeClass(featureClassName(f));
        }

        if (command.features !== undefined) {
            command.features.forEach(addCommandFeature);
            command.features.on.added.add(addCommandFeature);
            command.features.on.removed.add(removeCommandFeature);
        }

        this.bindSignal(command.enabled.onChanged, updateEnableStatus);
        this.bindSignal(command.features.on.added, addCommandFeature);
        this.bindSignal(command.features.on.removed, removeCommandFeature);

        const tooltip = prop.tooltip;

        function tooltipFactory() {
            return gui.localization.getString(tooltip);
        }

        if (tooltip !== undefined) {
            gui.viewTooltips.manage(this, tooltipFactory);
        }

        this.on.linked.add(() => {
            command.features.forEach(addCommandFeature);
            updateEnableStatus();
        });

        this.on.unlinked.add(() => {
            command.features.forEach(removeCommandFeature);
        });
    }
}


export default CommandButtonView;
