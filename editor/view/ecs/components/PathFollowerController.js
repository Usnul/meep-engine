import LabelView from "../../../../view/common/LabelView.js";
import Vector1Control from "../../../../view/controller/controls/Vector1Control.js";
import ObservedValue from "../../../../core/model/ObservedValue.js";
import { LineView } from "./common/LineView.js";
import View from "../../../../view/View.js";
import { BooleanVector3Control } from "../../../../view/controller/controls/BooleanVector3Control.js";
import DatGuiController from "./DatGuiController.js";
import { PathFollowerFlags } from "../../../../engine/navigation/ecs/components/PathFollower.js";

export class PathFollowerController extends View {
    constructor() {
        super();

        const self = this;

        this.el = document.createElement('div');
        this.addClass('ui-path-follower-controller');

        this.model = new ObservedValue(null);

        const cRotationSpeed = new Vector1Control();

        this.addChild(new LineView({
            elements: [
                new LabelView('rotation speed'),
                cRotationSpeed
            ]
        }));

        const cSpeed = new Vector1Control();
        this.addChild(new LineView({
            elements: [
                new LabelView('speed'),
                cSpeed
            ]
        }));

        const cRotationAlignment = new BooleanVector3Control();

        this.addChild(new LineView({
            elements: [
                new LabelView('rotation alignment'),
                cRotationAlignment
            ]
        }));

        const cPositionAlignment = new BooleanVector3Control();

        this.addChild(new LineView({
            elements: [
                new LabelView('position writing'),
                cPositionAlignment
            ]
        }));

        let d = new DatGuiController();

        this.addChild(d);


        /**
         *
         * @param {PathFollower} model
         */
        function setModel(model) {

            self.removeChild(d);

            d = new DatGuiController();

            self.addChild(d);

            if (model !== null) {
                cRotationSpeed.model.set(model.rotationSpeed);
                cSpeed.model.set(model.speed);
                cRotationAlignment.model.set(model.rotationAlignment);
                cPositionAlignment.model.set(model.positionWriting);

                d.addBitFlag(model, 'flags', PathFollowerFlags.Active, 'active');
                d.addBitFlag(model, 'flags', PathFollowerFlags.Loop, 'loop');
                d.addBitFlag(model, 'flags', PathFollowerFlags.Locked, 'locked');
            }
        }

        this.model.onChanged.add(setModel);
    }
}
