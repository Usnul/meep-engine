import View from "../../../../../view/View.js";
import ObservedValue from "../../../../../core/model/ObservedValue.js";
import DatGuiController from "../DatGuiController.js";
import EmptyView from "../../../../../view/elements/EmptyView.js";
import ButtonView from "../../../../../view/elements/button/ButtonView.js";
import { NativeListController } from "../../../../../view/controller/controls/NativeListController.js";
import { SoundTrack } from "../../../../../engine/sound/ecs/emitter/SoundEmitter.js";
import { SoundEmitterChannels } from "../../../../../engine/sound/ecs/emitter/SoundEmitterSystem.js";

class SoundTrackController extends EmptyView {
    /**
     *
     * @param {SoundTrack} track
     * @param engine
     */
    constructor(track, engine) {
        super({ classList: ['sound-track-controller'] });

        let audio = new Audio(track.url);

        this.addChild(
            new ButtonView({
                name: 'play',
                action() {

                    //play the sound
                    audio.play();

                }
            })
        );


        this.on.unlinked.add(() => {
            audio.pause();
        });

        const dat = new DatGuiController();

        dat.add(track, 'url').onChange((v) => {
            audio.pause();

            audio = new Audio(v);
        });
        dat.add(track, 'loop');
        dat.add(track, 'time');
        dat.add(track, 'channel');
        dat.add(track, 'volume');
        dat.add(track, 'startWhenReady');

        this.addChild(dat);
    }
}

export class SoundEmitterController extends View {
    /**
     *
     * @param {Engine} engine
     */
    constructor(engine) {
        super();

        this.el = document.createElement('div');

        this.addClass('ui-sound-emitter-controller');

        this.model = new ObservedValue(null);

        /**
         *
         * @param {SoundEmitter} soundEmitter
         */
        const update = soundEmitter => {
            this.removeAllChildren();

            const d = new DatGuiController();

            if (soundEmitter.channel === null) {
                soundEmitter.channel = SoundEmitterChannels.Effects;
            }

            d.addControl(soundEmitter, 'isPositioned');
            d.addControl(soundEmitter, 'channel');
            d.addControl(soundEmitter, 'distanceMin');
            d.addControl(soundEmitter, 'distanceMax');
            d.addControl(soundEmitter, 'distanceRolloff');

            this.addChild(d);

            this.addChild(
                new NativeListController({
                    model: soundEmitter.tracks,
                    classList: ['tracks'],
                    elementFactory() {
                        const track = new SoundTrack();

                        track.url = "";

                        return track;
                    },
                    elementViewFactory(track) {
                        return new SoundTrackController(track, engine);
                    }
                })
            );
        };

        this.model.onChanged.add(update);
    }
}
