import DatGuiController from "./DatGuiController.js";
import { clear } from "../../../../view/controller/dat/DatGuiUtils.js";

export class BlackboardController extends DatGuiController {
    constructor() {
        super();

        this.addClass('ui-component-controller-blackboard');

        const self = this;

        /**
         *
         * @param {Blackboard} model
         */
        function setModel(model) {
            const gui = self.gui;
            clear(gui);

            if (model !== null) {

                const data = model.data;

                const elements = [];

                for (let p in data) {
                    const datum = data[p];

                    elements.push({
                        datum,
                        name: p
                    });

                }

                elements.sort((a, b) => a.name.localeCompare(b.name));

                const n = elements.length;
                for (let i = 0; i < n; i++) {
                    const element = elements[i];


                    self.add(element.datum, 'value').name(element.name);
                }
            }
        }

        this.model.onChanged.add(setModel);
    }
}
