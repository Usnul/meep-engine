/**
 * Created by Alex on 07/11/2016.
 */


import ObservedValue from '../../../core/model/ObservedValue.js';
import View from '../../View.js';
import dom from '../../DOM.js';
import LabelView from "../../common/LabelView.js";

class GuiControl extends View {
    constructor() {

        super();

        const dRoot = dom();
        dRoot.addClass(GuiControl.CSS_CLASS_NAME);
        this.dRoot = dRoot;
        this.el = dRoot.el;

        this.model = new ObservedValue(null);
    }

    /**
     * @template {T}
     * @param {string} text
     * @param {T} control
     * @returns {T}
     */
    addLabeledControlVertical(text, control) {

        const label = new LabelView(text);

        this.addChild(label);
        this.addChild(control);


        return control;
    }
}

GuiControl.CSS_CLASS_NAME = "gui-control";


export default GuiControl;
