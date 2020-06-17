import DatGuiController from "../DatGuiController.js";
import { BlendingType } from "../../../../../engine/graphics/texture/sampler/BlendingType.js";
import { ParticleLayer } from "../../../../../engine/graphics/particles/particular/engine/emitter/ParticleLayer.js";
import ParticleLayerController from "./ParticleLayerController.js";
import { ParticleEmitterFlag } from "../../../../../engine/graphics/particles/particular/engine/emitter/ParticleEmitterFlag.js";
import { NativeListController } from "../../../../../view/controller/controls/NativeListController.js";
import EmptyView from "../../../../../view/elements/EmptyView.js";
import ObservedValue from "../../../../../core/model/ObservedValue.js";


/**
 *
 * @param {*} value
 * @param {Object} enumerable
 * @returns {string}
 */
export function enumNameByValue(value, enumerable) {
    return Object.keys(enumerable)[Object.values(enumerable).indexOf(value)];
}

/**
 *
 * @param {ParticleEmitter} emitter
 * @param {ParticleEmitterSystem2} system
 */
function applyEmitterChanges(emitter, system) {
    const particleEngine = system.particleEngine;

    //re-add the emitter
    particleEngine.remove(emitter);

    //update internal state
    emitter.build();
    emitter.initialize();
    emitter.registerLayerParameters();
    emitter.computeBoundingBox();

    particleEngine.add(emitter);
}

export class ParticleEmitterController extends EmptyView {
    /**
     *
     * @param {ParticleEmitterSystem2} particleEmitterSystem
     * @constructor
     */
    constructor(particleEmitterSystem) {
        super();

        this.model = new ObservedValue(null);

        const self = this;


        function applyChanges() {
            const emitter = self.model.getValue();

            if (emitter !== null) {
                applyEmitterChanges(emitter, particleEmitterSystem);
            }
        }


        /**
         *
         * @param {ParticleEmitter} emitter
         * @param oldEmitter
         */
        function modelSet(emitter, oldEmitter) {

            self.removeAllChildren();

            if (emitter !== null) {

                const emitterSurrogate = {
                    preWarm: emitter.getFlag(ParticleEmitterFlag.PreWarm),
                    depthRead: !emitter.getFlag(ParticleEmitterFlag.DepthReadDisabled),
                    depthSoft: !emitter.getFlag(ParticleEmitterFlag.DepthSoftDisabled),
                    velocityAlign: emitter.getFlag(ParticleEmitterFlag.AlignOnVelocity),
                    blendingMode: enumNameByValue(emitter.blendingMode, BlendingType),
                    update: function () {
                        applyChanges();
                    }
                };


                const dat = new DatGuiController();

                self.addChild(dat);


                dat.addControl(emitterSurrogate, 'preWarm').onChange(function (value) {
                    const emitter = self.model.getValue();

                    /**
                     * @type {ParticleEmitter}
                     */
                    emitter.writeFlag(ParticleEmitterFlag.PreWarm, value);

                    applyChanges();
                });

                dat.addControl(emitterSurrogate, 'depthRead').onChange(function (value) {
                    const emitter = self.model.getValue();

                    /**
                     * @type {ParticleEmitter}
                     */
                    emitter.writeFlag(ParticleEmitterFlag.DepthReadDisabled, !value);

                    applyChanges();
                });

                dat.addControl(emitterSurrogate, 'depthSoft').onChange(function (value) {
                    const emitter = self.model.getValue();

                    /**
                     * @type {ParticleEmitter}
                     */
                    emitter.writeFlag(ParticleEmitterFlag.DepthSoftDisabled, !value);

                    applyChanges();
                });

                dat.addControl(emitterSurrogate, 'velocityAlign').onChange(function (value) {
                    const emitter = self.model.getValue();

                    /**
                     * @type {ParticleEmitter}
                     */
                    emitter.writeFlag(ParticleEmitterFlag.AlignOnVelocity, value);

                    applyChanges();
                });

                dat.addControl(emitterSurrogate, 'blendingMode', Object.keys(BlendingType)).onChange(function (blendModeName) {
                    self.model.getValue().blendingMode = BlendingType[blendModeName];
                    applyChanges();
                });

                dat.addControl(emitterSurrogate, 'update').name('Apply Changes');

                self.addChild(new NativeListController({
                    model: emitter.layers,
                    elementViewFactory(layer) {
                        const c = new ParticleLayerController();

                        c.model.set(layer);

                        return c;
                    },
                    elementFactory() {
                        return new ParticleLayer();
                    }
                }))

            }
        }

        this.model.onChanged.add(modelSet);
    }
}
