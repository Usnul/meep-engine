import GuiControl from "../../../../view/controller/controls/GuiControl.js";
import Vector2Control from "../../../../view/controller/controls/Vector2Control.js";
import LabelView from "../../../../view/common/LabelView.js";

export class GridPositionController extends GuiControl {
    constructor() {
        super();

        this.cPosition = new Vector2Control();


        const self = this;

        this.handlers = {
            modelChanged: function (newModel, oldModel) {
                if (newModel !== null) {
                    self.cPosition.model.set(newModel);
                }
                if (oldModel !== null) {
                    //do nothing really
                }
            }
        };

        const lPosition = new LabelView('Position');

        this.addChild(lPosition);
        this.addChild(this.cPosition);

        this.bindSignal(this.model.onChanged, this.handlers.modelChanged);
    }

    link() {
        super.link();

        if (this.model.getValue() !== null) {
            this.handlers.modelChanged(this.model.getValue(), null);
        }
    }
}
