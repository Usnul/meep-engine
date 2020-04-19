import { LineView } from "./common/LineView.js";
import LabelView from "../../../../view/common/LabelView.js";
import View from "../../../../view/View.js";
import ObservedValue from "../../../../core/model/ObservedValue.js";
import Vector1Control from "../../../../view/controller/controls/Vector1Control.js";

export class FogOfWarRevealerController extends View {
    /**
     *
     * @constructor
     */
    constructor() {
        super();

        this.el = document.createElement('div');
        this.addClass('ui-fow-revealer-controller');

        this.model = new ObservedValue(null);

        const cRadius = new Vector1Control();

        this.addChild(new LineView({
            elements: [
                new LabelView('radius'),
                cRadius
            ]
        }));

        /**
         *
         * @param {FogOfWarRevealer} model
         */
        function setModel(model) {

            if (model !== null) {
                cRadius.model.set(model.radius);
            }
        }

        this.model.onChanged.add(setModel);
    }
}


