/**
 * Created by Alex on 14/01/2017.
 */

import DatGuiController from "../../../editor/view/ecs/components/DatGuiController.js";

class Vector2Control extends DatGuiController {
    constructor() {
        super();
        this.dRoot.addClass('vector2-control');

        const surrogate = {
            x: 0,
            y: 0,
            z: 0
        };

        const xController = this.addControl(surrogate, 'x').onChange(surrogate2model);
        const yController = this.addControl(surrogate, 'y').onChange(surrogate2model);

        const precision = 5;

        xController.__precision = precision;
        yController.__precision = precision;

        this.controllers = {
            x: xController,
            y: yController
        };

        const self = this;

        let modelWriteLock = false;
        let controllerWriteLock = false;

        function surrogate2model() {
            controllerWriteLock = true;

            const v2 = self.model.getValue();

            if (v2 !== null && !modelWriteLock) {
                const sX = surrogate.x;
                const sY = surrogate.y;

                v2.set(sX, sY);
            }

            controllerWriteLock = false;
        }

        function model2surrogate() {
            modelWriteLock = true;

            const v2 = self.model.getValue();

            if (v2 !== null && !controllerWriteLock) {
                surrogate.x = v2.x;
                surrogate.y = v2.y;

                xController.setValue(v2.x);
                yController.setValue(v2.y);
            }

            modelWriteLock = false;
        }

        function modelChanged(modelNew, modelOld) {
            if (modelNew !== null) {
                model2surrogate();
                self.bindSignal(modelNew.onChanged, model2surrogate);
            }
            if (modelOld !== null && modelOld !== undefined) {
                self.unbindSignal(modelOld.onChanged, model2surrogate);
            }
        }

        this.on.linked.add(function () {
            model2surrogate();
        });

        this.model.process(modelChanged);
    }
}



export default Vector2Control;
