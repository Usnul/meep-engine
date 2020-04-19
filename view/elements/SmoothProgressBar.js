import View from "../View.js";
import dom from "../DOM.js";

import BoundedValue from "../../core/model/BoundedValue.js";
import { frameThrottle } from "../../engine/graphics/FrameThrottle.js";
import { passThrough } from "../../core/function/Functions.js";

function makeTextPercentage(value, max, process) {
    const r = (value / max) * 100;
    const x = process(r);
    return `${x}%`;
}

function makeTextAbsolute(value, max, process) {
    return process(value) + " / " + process(max);
}

class ProgressBarView extends View {
    constructor(model, {
        classList = [],
        displayLabel = false,
        displayLabelType = 'percent',
        process = passThrough
    } = {}) {

        super();

        this.model = model;

        const dRoot = dom().addClass('progress-bar');

        classList.forEach((className) => dRoot.addClass(className));

        this.el = dRoot.el;

        const fillElement = dRoot.createChild().addClass('fill').el;
        this.el.appendChild(fillElement);

        let dLabel = null;

        if (displayLabel === true) {
            dLabel = dom(this.el).createChild('div').addClass('label').css({ height: "inherit" });
        }

        let value = 0, max = 0;

        function render() {
            const style = fillElement.style;
            //sanitize input to be in range 0 to 1
            const fill = Math.min(1, Math.max(0, value / max));
            style.width = (fill * 100) + "%";

            if (dLabel !== null) {
                //update label text
                if (displayLabelType === "absolute") {
                    dLabel.text(makeTextAbsolute(value, max, process));
                } else {
                    dLabel.text(makeTextPercentage(value, max, process));
                }
            }
        }

        const throttledRender = frameThrottle(render);

        Object.defineProperties(this, {
            value: {
                get: function () {
                    return value;
                },
                set: function (val) {
                    if (value !== val) {
                        value = val;
                        throttledRender();
                    }
                }
            },
            max: {
                get: function () {
                    return max;
                },
                set: function (val) {
                    if (max !== val) {
                        max = val;
                        throttledRender();
                    }
                }
            }
        });

        if (model instanceof BoundedValue) {

            this.on.linked.add(this.__updateFromBoundedValue, this);

            this.bindSignal(model.on.changed, this.__updateFromBoundedValue, this);

        } else if (model instanceof Array) {

            this.on.linked.add(this.__updateFromArray, this);

            this.bindSignal(model[0].onChanged, this.__updateFromArray, this);
            this.bindSignal(model[1].onChanged, this.__updateFromArray, this);

        }
    }

    /**
     * @private
     */
    __updateFromArray() {
        this.value = this.model[0].getValue();
        this.max = this.model[1].getValue();
    }

    /**
     * @private
     */
    __updateFromBoundedValue() {
        this.value = this.model.getValue();
        this.max = this.model.getUpperLimit();
    }
}


export default ProgressBarView;
