import View from "../../../../../view/View.js";
import ObservedValue from "../../../../../core/model/ObservedValue.js";
import DatGuiController from "../DatGuiController.js";
import ListView from "../../../../../view/common/ListView.js";

export class SoundEmitterController extends View {
    constructor() {
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

            d.addControl(soundEmitter, 'isPositioned');
            d.addControl(soundEmitter, 'channel');
            d.addControl(soundEmitter, 'distanceMin');
            d.addControl(soundEmitter, 'distanceMax');
            d.addControl(soundEmitter, 'distanceRolloff');

            this.addChild(d);

            this.addChild(
                new ListView(soundEmitter.tracks, {
                    elementFactory(track) {
                        const v = new DatGuiController({ classList: ['track'] });

                        v.addControl(track, 'url');
                        v.addControl(track, 'loop');
                        v.addControl(track, 'time');
                        // v.addControl(track, 'channel'); //currently ignored
                        v.addControl(track, 'volume');
                        v.addControl(track, 'startWhenReady');
                        v.addControl(track, 'playing');

                        v.addControl({
                            remove() {
                                soundEmitter.tracks.removeOneOf(track)
                            }
                        }, 'remove');

                        return v;
                    },
                    classList: ['tracks']
                })
            );
        };

        this.model.onChanged.add(update);
    }
}
