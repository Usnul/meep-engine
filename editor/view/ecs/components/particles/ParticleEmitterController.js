import DatGuiController from "../DatGuiController.js";
import { BlendingType } from "../../../../../engine/graphics/texture/sampler/BlendingType.js";
import { ParticleLayer } from "../../../../../engine/graphics/particles/particular/engine/emitter/ParticleLayer.js";
import ParticleLayerController from "./ParticleLayerController.js";
import { ParticleEmitterFlag } from "../../../../../engine/graphics/particles/particular/engine/emitter/ParticleEmitterFlag.js";
import { NativeListController } from "../../../../../view/controller/controls/NativeListController.js";
import EmptyView from "../../../../../view/elements/EmptyView.js";
import ObservedValue from "../../../../../core/model/ObservedValue.js";
import { noop } from "../../../../../core/function/Functions.js";


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
 * @param {function} op
 * @param {*} [arg0]
 */
function applyEmitterChanges(emitter, system, op, arg0) {
    const particleEngine = system.particleEngine;

    const isSleeping = emitter.getFlag(ParticleEmitterFlag.Sleeping);

    //re-add the emitter
    particleEngine.remove(emitter);

    if (system.renderLayer.visibleSet.contains(emitter.mesh)) {
        //remove from visible layer if present
        system.renderLayer.visibleSet.forceRemove(emitter.mesh);
    }

    //execute operation
    op(emitter, arg0);

    //clear flags
    emitter.clearFlag(ParticleEmitterFlag.Built | ParticleEmitterFlag.Initialized);

    //update internal state
    emitter.build();
    emitter.initialize();
    emitter.registerLayerParameters();
    emitter.computeBoundingBox();

    particleEngine.add(emitter);

    emitter.writeFlag(ParticleEmitterFlag.Sleeping, isSleeping);

    console.log(isSleeping, emitter.getFlag(ParticleEmitterFlag.Sleeping));
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
                applyEmitterChanges(emitter, particleEmitterSystem, noop);
            }
        }

        /**
         *
         * @param {function(ParticleEmitter)} op
         * @param {v} [v]
         */
        function makeChange(op, v) {
            const emitter = self.model.getValue();

            if (emitter !== null) {
                applyEmitterChanges(emitter, particleEmitterSystem, op, v);
            }
        }

        /**
         *
         * @param {function(ParticleEmitter)} op
         * @returns {function(...[*]=)}
         */
        function mutator(op) {
            return function (arg0) {
                makeChange(op, arg0);
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


                dat.addControl(emitterSurrogate, 'preWarm').onChange(mutator((emitter, value) => {

                    /**
                     * @type {ParticleEmitter}
                     */
                    emitter.writeFlag(ParticleEmitterFlag.PreWarm, value);

                }));

                dat.addControl(emitterSurrogate, 'depthRead').onChange(mutator((emitter, value) => {

                    /**
                     * @type {ParticleEmitter}
                     */
                    emitter.writeFlag(ParticleEmitterFlag.DepthReadDisabled, !value);

                }));

                dat.addControl(emitterSurrogate, 'depthSoft').onChange(mutator((emitter, value) => {
                    /**
                     * @type {ParticleEmitter}
                     */
                    emitter.writeFlag(ParticleEmitterFlag.DepthSoftDisabled, !value);

                }));

                dat.addControl(emitterSurrogate, 'velocityAlign').onChange(mutator((emitter, value) => {

                    /**
                     * @type {ParticleEmitter}
                     */
                    emitter.writeFlag(ParticleEmitterFlag.AlignOnVelocity, value);

                }));

                dat.addControl(emitterSurrogate, 'blendingMode', Object.keys(BlendingType)).onChange(mutator((emitter, blendModeName) => {

                    emitter.blendingMode = BlendingType[blendModeName];

                }));

                dat.addControl(emitterSurrogate, 'update').name('Apply Changes');

                self.addChild(new NativeListController({
                    model: emitter.layers,
                    elementViewFactory(layer) {
                        const c = new ParticleLayerController(makeChange);

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
