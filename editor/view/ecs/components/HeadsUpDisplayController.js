import DatGuiController from "./DatGuiController.js";
import { clear } from "../../../../view/controller/dat/DatGuiUtils.js";
import { HeadsUpDisplayFlag } from "../../../../engine/ecs/gui/hud/HeadsUpDisplayFlag.js";

export class HeadsUpDisplayController extends DatGuiController {
    constructor() {
        super();

        const self = this;


        /**
         *
         * @param {HeadsUpDisplay} model
         */
        function setModel(model) {
            const gui = self.gui;

            clear(gui);

            if (model !== null) {
                self.add(model, 'worldOffset');
                self.addBitFlag(model, 'flags', HeadsUpDisplayFlag.TransformWorldOffset, 'transform offset');
                self.addBitFlag(model, 'flags', HeadsUpDisplayFlag.PerspectiveRotation, 'perspective rotation');
            }
        }

        this.model.onChanged.add(setModel);
    }
}
