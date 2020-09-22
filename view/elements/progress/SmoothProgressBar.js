import View from "../../View.js";
import dom from "../../DOM.js";

import BoundedValue from "../../../core/model/BoundedValue.js";
import { frameThrottle } from "../../../engine/graphics/FrameThrottle.js";
import { passThrough } from "../../../core/function/Functions.js";
import { clamp } from "../../../core/math/MathUtils.js";

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
        displayTipMarker = true,
        process = passThrough
    } = {}) {

        super();

        this.model = model;

        const dRoot = dom().addClass('progress-bar');

        this.el = dRoot.el;

        this.addClasses(classList);

        /**
         * @type {HTMLElement}
         */
        this.__el_fill = dRoot.createChild().addClass('fill').el;

        this.__el_fill_container = document.createElement('div');
        this.__el_fill_container.classList.add('fill-container');

        this.__el_fill_container.appendChild(this.__el_fill);

        this.el.appendChild(this.__el_fill_container);

        let dLabel = null;

        if (displayLabel === true) {
            dLabel = dom(this.el).createChild('div').addClass('label').css({ height: "inherit" });
        }

        this.__display_tip_marker = displayTipMarker;

        if (displayTipMarker) {
            this.__el_tip_marker = document.createElement('div');
            this.__el_tip_marker.classList.add('tip-marker');

            this.el.appendChild(this.__el_tip_marker);
        }


        /**
         *
         * @type {function}
         * @private
         */
        this.__process = process;

        /**
         *
         * @type {boolean}
         * @private
         */
        this.__display_label_enabled = displayLabel;
        /**
         *
         * @type {string}
         * @private
         */
        this.__display_label_type = displayLabelType;

        /**
         *
         * @type {null|DOM}
         * @private
         */
        this.__dom_label = dLabel;

        this.__value_current = 0;
        this.__value_max = 0;


        this.__throttled_render = frameThrottle(this.render, this);

        if (model instanceof BoundedValue) {

            this.on.linked.add(this.__updateFromBoundedValue, this);

            this.bindSignal(model.on.changed, this.__updateFromBoundedValue, this);

        } else if (model instanceof Array) {

            this.on.linked.add(this.__updateFromArray, this);

            this.bindSignal(model[0].onChanged, this.__updateFromArray, this);
            this.bindSignal(model[1].onChanged, this.__updateFromArray, this);

        }
    }

    get value() {
        return this.__value_current;
    }

    set value(v) {
        if (v === this.__value_current) {
            return;
        }

        this.__value_current = v;

        this.__throttled_render();
    }

    get max() {
        return this.__value_max;
    }

    set max(v) {
        if (v === this.__value_max) {
            return;
        }

        this.__value_max = v;

        this.__throttled_render();
    }

    render() {
        const value = this.__value_current;
        const max = this.__value_max;

        const style = this.__el_fill.style;
        //sanitize input to be in range 0 to 1

        const fill = clamp(value / max, 0, 1);

        const fill_percent_string = (fill * 100) + "%";

        style.width = fill_percent_string;

        const dLabel = this.__dom_label;

        if (dLabel !== null) {
            //update label text
            if (this.__display_label_type === "absolute") {
                dLabel.text(makeTextAbsolute(value, max, this.__process));
            } else {
                dLabel.text(makeTextPercentage(value, max, this.__process));
            }
        }

        if (this.__display_tip_marker) {
            this.__el_tip_marker.style.left = fill_percent_string;
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
