import GuiControl from "../../../../../view/controller/controls/GuiControl.js";
import {
    EmissionFromType,
    EmissionShapeType
} from "../../../../../engine/graphics/particles/particular/engine/emitter/ParticleLayer.js";
import DatGuiController from "../DatGuiController.js";
import Vector3Control from "../../../../../view/controller/controls/Vector3Control.js";
import NumericIntervalControl from "../../../../../view/controller/controls/NumericIntervalControl.js";
import { enumNameByValue } from "./ParticleEmitterController.js";
import ListController from "../../../../../view/controller/controls/ListController.js";
import { ParameterTrack } from "../../../../../engine/graphics/particles/particular/engine/parameter/ParameterTrack.js";
import { ParameterTrackController } from "./ParameterTrackController.js";
import { ParticleParameters } from "../../../../../engine/graphics/particles/particular/engine/emitter/ParticleParameters.js";
import { ParameterLookupTable } from "../../../../../engine/graphics/particles/particular/engine/parameter/ParameterLookupTable.js";

class ParticleLayerController extends GuiControl {
    /**
     *
     * @param {function(function)} mutationHook
     */
    constructor(mutationHook) {
        super();

        const self = this;

        const surrogate = {
            imageURL: "",
            emissionShape: EmissionShapeType.Point,
            emissionFrom: EmissionFromType.Volume,
            emissionRate: 0,
            emissionImmediate: 0,
            velocityAngle: 0
        };

        /**
         *
         * @returns {ParticleLayer}
         */
        function getLayer() {
            return self.model.getValue();
        }

        /**
         * @template T
         * @param {function(ParticleLayer,T?)} f
         * @param {T} [arg0]
         */
        function mutate(f, arg0) {
            mutationHook(() => {
                f(getLayer(), arg0);
            });
        }

        /**
         *
         * @param {function(ParticleLayer,*)} f
         * @returns {function(...[*]=)}
         */
        function mutator(f) {
            return function (arg0) {
                mutate(f, arg0);
            }
        }

        /**
         *
         * @param {string} property
         * @param {function(layer:ParticleLayer, value:*)} mutationCallback
         * @param {*} ops
         */
        function addControl(property, mutationCallback, ops) {
            const controller = dat.addControl(surrogate, property, ops);

            controller.onChange(mutator(mutationCallback));

            return controller;
        }

        const dat = new DatGuiController();

        const cImageURL = addControl('imageURL', (layer, value) => {
            layer.imageURL = value;
        });

        const cEmissionShape = addControl(
            'emissionShape',
            function (layer, shapeTypeName) {
                layer.emissionShape = EmissionShapeType[shapeTypeName];
            },
            Object.keys(EmissionShapeType)
        );

        const cEmissionFrom = addControl(
            'emissionFrom',
            function (layer, fromTypeName) {
                layer.emissionFrom = EmissionFromType[fromTypeName];
            },
            Object.keys(EmissionFromType)
        );

        const cEmissionRate = addControl('emissionRate', function (layer, rate) {
            layer.emissionRate = rate;
        });

        const cEmissionImmediate = addControl('emissionImmediate', function (layer, value) {
            layer.emissionImmediate = value;
        });

        const cVelocityAngle = addControl('velocityAngle', function (layer, value) {
            layer.particleVelocityDirection.angle = value;
        });

        this.addChild(dat);

        const cVelocityDirection = this.addLabeledControlVertical('Velocity Direction', new Vector3Control());
        const cLife = this.addLabeledControlVertical('Lifespan', new NumericIntervalControl());
        const cSize = this.addLabeledControlVertical('Size', new NumericIntervalControl());
        const cSpeed = this.addLabeledControlVertical('Speed', new NumericIntervalControl());
        const cRotation = this.addLabeledControlVertical('Rotation', new NumericIntervalControl());

        const cRotationSpeed = this.addLabeledControlVertical('Rotation Speed', new NumericIntervalControl());

        const cPosition = this.addLabeledControlVertical('Position', new Vector3Control());
        const cScale = this.addLabeledControlVertical('Scale', new Vector3Control());

        const cParameters = this.addLabeledControlVertical('Parameters', new ListController(function () {
            /**
             *
             * @type {ParticleLayer}
             */
            const layer = self.model.getValue();

            const availableNames = Object.values(ParticleParameters);

            layer.parameterTracks.forEach(function (track) {
                const trackName = track.name;
                const i = availableNames.indexOf(trackName);
                if (i !== -1) {
                    availableNames.splice(i, 1);
                }
            });

            if (availableNames.length === 0) {
                //all named tracks already exist
                throw new Error('all named tracks are already present');
            }

            const name = availableNames.pop();

            let lutItemSize;

            if (name === ParticleParameters.Color) {
                lutItemSize = 4;
            } else if (name === ParticleParameters.Scale) {
                lutItemSize = 1;
            } else {
                throw new Error(`Unsupported parameter '${name}'`);
            }

            const lut = new ParameterLookupTable(lutItemSize);

            return new ParameterTrack(name, lut);
        }, function () {
            return new ParameterTrackController();
        }));

        /**
         *
         * @param {ParticleLayer} layer
         * @param {ParticleLayer} oldLayer
         */
        function handleModelSet(layer, oldLayer) {
            if (layer !== null) {
                surrogate.imageURL = layer.imageURL;
                surrogate.emissionShape = enumNameByValue(layer.emissionShape, EmissionShapeType);
                surrogate.emissionFrom = enumNameByValue(layer.emissionFrom, EmissionFromType);
                surrogate.emissionRate = layer.emissionRate;
                surrogate.emissionImmediate = layer.emissionImmediate;
                surrogate.velocityAngle = layer.particleVelocityDirection.angle;

                cImageURL.setValue(surrogate.imageURL);
                cEmissionShape.setValue(surrogate.emissionShape);
                cEmissionFrom.setValue(surrogate.emissionFrom);
                cEmissionRate.setValue(surrogate.emissionRate);
                cEmissionImmediate.setValue(surrogate.emissionImmediate);
                cVelocityAngle.setValue(surrogate.velocityAngle);

                cLife.model.set(layer.particleLife);
                cSize.model.set(layer.particleSize);
                cSpeed.model.set(layer.particleSpeed);
                cRotation.model.set(layer.particleRotation);
                cRotationSpeed.model.set(layer.particleRotationSpeed);
                cPosition.model.set(layer.position);
                cScale.model.set(layer.scale);
                cVelocityDirection.model.set(layer.particleVelocityDirection.direction);
                cParameters.model.set(layer.parameterTracks.tracks);
            }
        }

        this.model.onChanged.add(handleModelSet);
    }
}


export default ParticleLayerController;
