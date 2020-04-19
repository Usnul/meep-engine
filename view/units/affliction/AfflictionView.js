/**
 * Created by Alex on 26/05/2016.
 */
import View from "../../View.js";
import LabelView from '../../common/LabelView.js';
import ImageView from '../../elements/image/ImageView.js';
import { AfflictionTooltipView } from "./AfflictionTooltipView.js";
import { frameThrottle } from "../../../engine/graphics/FrameThrottle.js";


class AfflictionView extends View {
    /**
     *
     * @param {UnitAffliction} model
     * @param {GUIEngine} [gui]
     * @param {Localization} localization
     * @constructor
     */
    constructor(model, { gui, localization } = {}) {
        super();
        this.model = model;

        this.el = document.createElement('div');

        this.addClass('ui-unit-affliction-view');
        this.addClass(model.getSourceTypeCssClass());

        this.addChild(
            new ImageView(model.description.icon, { classList: ['icon'] })
        );

        this.addChild(
            new LabelView(model.charges, { classList: ['charges'] })
        );

        if (gui !== undefined) {
            gui.viewTooltips.manage(this, () => {
                return new AfflictionTooltipView({ affliction: model, localization, gml: gui.tooltips.gml });
            });
        }

        this.on.linked.add(this.render, this);
        this.bindSignal(model.charges.onChanged, frameThrottle(this.render, this));
    }

    render() {

        /**
         *
         * @type {UnitAffliction}
         */
        const model = this.model;

        this.setClass('single-charge', model.charges.getValue() === 1);

    }
}


export default AfflictionView;
