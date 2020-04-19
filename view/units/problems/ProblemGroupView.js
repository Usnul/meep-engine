import View from "../../View.js";
import { objectKeyByValue } from "../../../core/model/ObjectUtils.js";
import { StrategicProblemType } from "../../../../model/game/ecs/component/unit/poblems/StrategicProblemType.js";
import { camelToKebab } from "../../../core/primitives/strings/StringUtils.js";
import ObservedInteger from "../../../core/model/ObservedInteger.js";
import LabelView from "../../common/LabelView.js";
import EmptyView from "../../elements/EmptyView.js";

export class ProblemGroupView extends View {
    /**
     *
     * @param {Localization} localization
     * @param {} gui
     * @param {DomTooltipManager} tooltips
     * @param {List<StrategicProblem>} problems
     * @param {StrategicProblemType} type
     */
    constructor({ localization, gui, tooltips, problems, type }) {
        super();

        this.el = document.createElement('div');

        this.addClass('ui-problem-group-view');

        this.addChild(new EmptyView({ classList: ['icon'] }));

        const typeName = objectKeyByValue(StrategicProblemType, type);

        this.addClass(`problem-type-${camelToKebab(typeName)}`);

        const count = new ObservedInteger(0);

        this.addChild(new LabelView(count, { classList: ['count'] }));

        const update = () => {
            const unitProblems = problems.filter(p => p.type === type);

            const nProblems = unitProblems.length;
            count.set(nProblems);

            this.setClass('count-zero', nProblems === 0);
            this.setClass('count-one', nProblems === 1);
        };

        this.bindSignal(problems.on.added, update);
        this.bindSignal(problems.on.removed, update);

        tooltips.manage(this, () => {
            const typeKey = objectKeyByValue(StrategicProblemType, type);

            const multiplicity = count.getValue() === 1 ? "one" : "many";

            return localization.getString(`system_army_problem.${typeKey}.${multiplicity}.tip`)
        });

        this.on.linked.add(update);
    }
}
