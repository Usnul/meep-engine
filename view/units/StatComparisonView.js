import View from "../View.js";
import { LocalizedLabelView } from "../common/LocalizedLabelView.js";
import EmptyView from "../elements/EmptyView.js";
import LabelView from "../common/LabelView.js";
import { isValueBetween, max2, min2 } from "../../core/math/MathUtils.js";

export class StatComparisonView extends View {
    /**
     *
     * @param id
     * @param {Stat} before
     * @param {Stat} after
     * @param {Localization} localization
     */
    constructor({
                    id,
                    before,
                    after,
                    localization
                }) {
        super();

        this.el = document.createElement('div');
        this.addClass('ui-stat-comparison-view');

        const valueBefore = Math.round(before.getValue());
        const valueAfter = Math.round(after.getValue());

        const vName = new LocalizedLabelView({
            id: `system_combat_unit_stat.${id}.name`,
            localization
        });

        const vValue = new EmptyView({ classList: ['value'] });

        vValue.addChild(new LabelView(valueBefore, { classList: ['stat-value', 'before'] }));

        vValue.addChild(new EmptyView({ classList: ['separator'] }));

        vValue.addChild(new LabelView(valueAfter, { classList: ['stat-value', 'after'] }));

        this.addChild(vName);
        this.addChild(vValue);

        if (valueAfter > valueBefore) {
            this.addClass('positive');
        } else if (valueAfter < valueBefore) {
            this.addClass('negative');
        }

        const percentChange = max2(valueAfter, valueBefore) / min2(valueAfter, valueBefore);

        this.setClass('level-0', isValueBetween(percentChange, 1.05, 1.1) || percentChange === 1.1);
        this.setClass('level-1', isValueBetween(percentChange, 1.1, 1.2));
        this.setClass('level-2', percentChange >= 1.2);
    }
}
